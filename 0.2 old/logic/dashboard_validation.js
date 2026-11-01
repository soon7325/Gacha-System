/**
 * Dashboard 历史记录检测层。
 * 只重放用户已经录入的结果，不抽随机数、不写缓存、不生成 HTML。
 * 概率与规则条件调用 GachaEngine；本文件负责历史格式、进度和违规原因。
 */
(function () {
    'use strict';

    /**
     * 按从旧到新的顺序检查记录。
     * 返回 entries（逐条检测）、tail（末尾垫抽）和 state（重放后的进度）。
     * errors 使用 { key, params }，由 dashboard 调用语言包生成显示文本。
     * 旧记录仅有 isFree 时，沿用“不计保底”的语义；countPity 或 pullType 可明确覆盖。
     */
    function validateHistory(records, { rules, activeTiers, targetGoldIds,
        catalog = {}, findItem = null, selections = null, isStdPool = false, allowRotation = false }) {
        const engine = window.GachaEngine;
        const state = engine.createState();
        const hardPity = engine.getHardPity(rules, targetGoldIds);
        const entries = [];
        let segmentErrors = [];

        // 建立名称/简称索引并补上分类，避免历史检测反复遍历完整图鉴。
        const itemIndex = new Map();
        Object.entries(catalog).forEach(([category, items]) => {
            (items || []).forEach(item => {
                const normalized = { ...item, category, tags: item.tags || (Array.isArray(item.tag) ? item.tag : item.tag ? [item.tag] : []) };
                [item.name, item.short, item.en, item.eshort].filter(Boolean).forEach(name => {
                    if (!itemIndex.has(name)) itemIndex.set(name, normalized);
                });
            });
        });
        const lookup = name => itemIndex.get(name) || (findItem ? findItem(name) : null);

        // 原因去重：连续垫抽违反同一规则时，不重复堆叠相同警告。
        function mergeErrors(list, extra) {
            const result = [...list];
            extra.forEach(error => {
                if (!result.some(existing => existing.key === error.key)) result.push(error);
            });
            return result;
        }

        // 换期属于历史记录格式，继承选项在这里处理，不放入概率引擎。
        function applyRotation(record) {
            const matrix = rules.lifecycle?.rotationMatrix || {}, config = record.config || {};
            const keepPity = matrix.inheritPityPulls === true && config.inheritPity !== false;
            const resetPityCount = keepPity ? 0 : state.pity;
            const resetErrors = keepPity ? [] : segmentErrors;
            if (!keepPity) { state.pity = 0; segmentErrors = []; }
            if (!(matrix.inheritGuaranteeState === true && config.inheritGuarantee !== false)) {
                state.guaranteeCount = 0;
                state.guaranteeLosses = 0;
            }
            if (!(matrix.inheritRescueLosses === true && config.inheritRescue !== false)) state.consecutiveLosses = 0;
            if (matrix.resetEarlyUp !== false || config.resetEarlyUp) state.earlyUpUsedCount = 0;
            if (matrix.resetCatSeq !== false || config.resetCatSeq) {
                state.naturalGoldCount = 0;
                state.catSeqUsedCount = 0;
                delete state.customCatSeqStartOrder;
            }
            if (matrix.resetSparkPity !== false || config.resetSpark) state.sparkState = {};
            // total 保留完整流水；井重置用 basePull 记录新一期的起点。
            if (!Object.keys(state.sparkState).length) {
                (rules.sparkRules || []).forEach((_, index) => {
                    state.sparkState[index] = { basePull: state.total, cancelled: false, triggeredCount: 0 };
                });
            }
            return { resetPityCount, resetErrors };
        }

        (Array.isArray(records) ? records : []).forEach((record, index) => {
            // 兼容旧版 star 字段；不会修改原始记录或悄悄补写缓存。
            const p = record || {};
            const tierId = p.tierId || activeTiers.find(t => t.name === String(p.star))?.id;
            const isGold = targetGoldIds.includes(tierId);
            const isFree = !!p.isFree || p.pullType === 'free_pity' || p.pullType === 'free_nopity';
            const countsPity = !isFree || p.countPity === true || p.pullType === 'free_pity';
            const entry = { index, record: p, tierId, isGold, isFree, countsPity, errors: [], count: state.pity };
            entries.push(entry);

            if (p.isRuleNode) {
                entry.rotation = allowRotation ? applyRotation(p) : null;
                return;
            }

            state.total++;
            const name = p.short || p.name || '';
            const item = lookup(name);
            // 常驻池也可能有标记为 UP 的定向候选，井取消仍需使用真实来源。
            const isUP = typeof p.isUP === 'boolean' ? p.isUP : p.isLost !== true;
            const errors = [];
            const add = (key, params = {}) => errors.push({ key, params });
            if (isGold) state.goldCount++;
            if (isGold && (!name || name === '?' || name === '？' || !item)) add('cd_err_catalog_missing');

            // 无保底赠送抽只检查物品是否存在，不改变已有的保底/特权/救援进度。
            if (!countsPity) {
                entry.errors = errors;
                return;
            }

            const count = state.pity + 1;
            entry.count = count;
            const policy = engine.getGoldPolicy(rules, state, targetGoldIds);
            const { probabilities } = engine.calculateProbabilities(rules, state, activeTiers, targetGoldIds);

            // 井只在普通抽阶段结算。独立兑换井没有历史奖励字段，不能据此判“漏领”。
            // 有明确 isSpark 标记时，井结果不是自然出金，不应用自然 UP 取消条件。
            let replacementRule = null;
            if (!isFree) {
                (rules.sparkRules || []).forEach((rule, ruleIndex) => {
                    const progress = state.sparkState[ruleIndex] || { basePull: 0, cancelled: false, triggeredCount: 0 };
                    const evaluation = engine.evaluateSpark(rules, rule, progress, state.total,
                        { isGold: isGold && !p.isSpark, isUP }, targetGoldIds);
                    state.sparkState[ruleIndex] = evaluation.state;
                    if (evaluation.triggered && !rule.noReset) replacementRule = rule;
                });
            }
            entry.isSpark = !!replacementRule;
            if (p.isSpark === true && !replacementRule) add('cd_err_spark_unexpected');

            if (replacementRule) {
                const targetTier = replacementRule.targetTier || targetGoldIds[0] || 'tier_S';
                if (!isGold || tierId !== targetTier) add('cd_err_spark_milestone_hit', { limit: replacementRule.limit });
                if (isGold && !isStdPool && !isUP) add('cd_err_spark_offrate', { pull: state.total });
            } else {
                // 只检测确定不可能的结果，不以“概率很小”判断非法。
                const goldChance = targetGoldIds.reduce((sum, id) => sum + (probabilities[id] || 0), 0);
                if (!isGold && goldChance >= 100) add('cd_err_gold_required', { cur: count });
                if (isGold && count > hardPity) add('cd_err_gold_pity_overflow', { cur: count, max: hardPity });
                if (isGold && !isStdPool && !isUP) {
                    if (policy.guaranteed) {
                        add(policy.mode === 'progressive' ? 'cd_err_guarantee_progressive' : 'cd_err_guarantee_streak',
                            { count: state.guaranteeCount, max: policy.rule.guaranteeLimit || 1 });
                    } else if (policy.upRate >= 100) {
                        add(policy.earlyRule ? 'cd_err_early_gold_miss' : 'cd_err_up_required', { n: policy.earlyOrder });
                    }
                    if (policy.forcedRescue) add('cd_err_rescue_streak', { count: state.consecutiveLosses });
                }
                if (isGold && policy.categoryRule && item) {
                    // 引擎允许定向 UP 候选为空时退回原 UP 列表。
                    // 历史通常没有保存当时的勾选项，不能把这一合法回退误判为违规。
                    const knownUp = selections?.[tierId]?.up;
                    const hasMatchedUP = Array.isArray(knownUp) && knownUp.some(name =>
                        engine.matchesCategory(lookup(name), policy.categoryRule, true));
                    if ((!isUP || hasMatchedUP) && !engine.matchesCategory(item, policy.categoryRule, isUP)) {
                        add('cd_err_category_mismatch', { n: policy.naturalOrder });
                    }
                }
            }

            // 已经违反的垫抽段保留原因，到本段出金或换期时一并显示。
            segmentErrors = mergeErrors(segmentErrors, errors);
            entry.errors = [...segmentErrors];
            if (entry.isSpark) {
                // 替换井不消耗自然出金特权；进度重置与引擎 draw 保持一致。
                state.pity = 0;
                state.guaranteeCount = 0;
                state.consecutiveLosses = 0;
                segmentErrors = [];
            } else if (isGold) {
                state.pity = 0;
                if (!isStdPool) {
                    if (isUP) {
                        if (policy.hasGuarantee) { state.guaranteeCount = 0; state.guaranteeLosses = 0; }
                        state.consecutiveLosses = (p.isRescue || p.isRescued) ? 0 : engine.getRescueLossesAfterUP(rules, state.consecutiveLosses);
                    } else {
                        if (policy.hasGuarantee) { state.guaranteeCount++; state.guaranteeLosses++; }
                        state.consecutiveLosses++;
                    }
                }
                if (policy.earlyRule) state.earlyUpUsedCount++;
                if (policy.categoryRule) { state.catSeqUsedCount++; delete state.customCatSeqStartOrder; }
                state.naturalGoldCount = (state.naturalGoldCount || 0) + 1;
                segmentErrors = [];
            } else {
                state.pity++;
            }
        });

        return { entries, tail: { count: state.pity, errors: [...segmentErrors] }, state, hardPity };
    }

    window.DashboardValidation = Object.freeze({ validateHistory });
})();
