/**
 * 抽卡规则执行层：负责概率、保底、UP 判定、井兑换和赠送抽进度。
 * 不访问 DOM、localStorage 或语言包；页面传入规则、候选物品及自选回调。
 * draw(state, amount) 会推进传入的状态并返回抽卡结果，页面负责渲染。
 * random 默认使用 Math.random，也可注入固定随机函数复现抽卡结果。
 */
(function () {
    'use strict';

    // 创建独立模拟状态，初始化所有计数器、井进度和赠送抽队列。
    function createState(minorPityCount = 0) {
        return {
            // 垫抽、总抽数和累计出金；总抽数沿用原行为，包含赠送抽。
            pity: 0, total: 0, goldCount: 0,
            // 大保底歪数、递进保底歪数，以及救援规则使用的连续歪数。
            guaranteeCount: 0, guaranteeLosses: 0, consecutiveLosses: 0,
            // 非金保底分别计数；赠送抽进入队列后优先于普通抽执行。
            minorPityCounters: Array(minorPityCount).fill(0),
            minorGuaranteeCounters: {}, freeQueue: [],
            // 每条井和赠送规则独立保存进度；额外井奖励交给页面渲染后清空。
            sparkState: {}, giftState: {}, events: { pendingGifts: [] },
            // 已消耗的不歪特权次数与分类定向次数。
            earlyUpUsedCount: 0, catSeqUsedCount: 0
        };
    }

    const ruleLists = { early: 'earlyUpRules', category: 'goldCategorySequence', spark: 'sparkRules', gift: 'giftRules' };
    function getRuleTotal(rules,state) {
        return state.total-(rules.countBonusPullsForRules===false ? state.bonusPullCount || 0 : 0);
    }
    function activateNextPeriodPulls(state) {
        state.freeQueue=state.freeQueue.filter(q=>!q.expiresOnRotation);
        if(state.nextPeriodFreeQueue?.length){state.freeQueue.push(...state.nextPeriodFreeQueue.map(q=>({...q,expiresOnRotation:true})));state.nextPeriodFreeQueue=[];}
    }
    function ruleEntries(rules) {
        return Object.entries(ruleLists).flatMap(([kind, key]) => (rules[key] || []).map((rule, index) => ({kind, rule, index})));
    }
    function ruleProgress(state, entry) {
        if (entry.kind === 'spark' || entry.kind === 'gift') {
            const key = entry.kind + 'State'; state[key] ||= {};
            return state[key][entry.index] ||= {basePull: 0, triggeredCount: 0};
        }
        state.sequenceRuleState ||= {};
        return state.sequenceRuleState[entry.rule.id] ||= {triggeredCount: 0};
    }
    function getExpiration(rule) { return rule.expiration || {type:'none'}; }
    function updateExpiration(rules,state,entry,counts) {
        const config=getExpiration(entry.rule),p=ruleProgress(state,entry);
        if(p.expired || !p.activation?.active || config.type==='none')return;
        const baseline=p.expirationBaseline || {hits:0,pulls:0,source:0};
        if(config.type==='target' && (p.targetHits || 0)>baseline.hits)p.expired=true;
        if(config.type==='pulls' && getRuleTotal(rules,state)-baseline.pulls>=config.count)p.expired=true;
        if(config.type==='rule' && (counts.get(config.ruleId)||0)-baseline.source>=config.count)p.expired=true;
    }
    function targetMatches(rule,kind,result,{lookup=()=>null,selections={},targetGoldIds=[],rules={}}={}) {
        if(result.isSpark || !(result.pullType==='paid'||result.pullType==='free_pity'||result.countRules))return false;
        if(kind==='early')return !!result.isGold && !!result.isUP;
        const item=lookup(result);
        if(kind==='category')return !!result.isGold && matchesCategory(item,rule,result.isUP);
        if(kind!=='spark')return false;
        if(rule.targetType==='custom_filter')return result.tierId===(rule.targetTier||targetGoldIds[0]) && matchesCategory(item,rule,result.isUP);
        if(!result.isGold)return false;
        if(rule.targetType==='any_gold')return true;
        if(rule.targetType==='up_index'){
            const list=selections[rule.targetTier||targetGoldIds[0]]?.up || [],chosen=list[(rule.upIndex||1)-1] || list[0];
            // A single-UP pool is identifiable from history even without a saved selection.
            if(!chosen)return !!result.isUP&&(rule.upIndex||1)===1&&rules.preSelect?.tiers?.[rule.targetTier||targetGoldIds[0]]?.upMax===1;
            return !!result.isUP && [result.itemId,result.name,item?.id,item?.presetId,item?.name].includes(chosen);
        }
        return !!result.isUP;
    }
    // Track committed, eligible draw outcomes even while a rule is locked.
    // This allows including pre-unlock history without inventing history on restore.
    function observeRuleOutcome(rules,state,result,context) {
        for(const entry of ruleEntries(rules)){
            if(!entry.rule.id || entry.rule.enabled===false || getExpiration(entry.rule).type!=='target')continue;
            const p=ruleProgress(state,entry);
            if(targetMatches(entry.rule,entry.kind,result,context))p.targetHits=(p.targetHits||0)+1;
            if(p.activation?.active && (p.targetHits||0)>(p.expirationBaseline?.hits||0))p.expired=true;
        }
    }
    // Preserve the legacy index-shaped state for existing callers, but bind each
    // saved progress record to its stable rule ID before resolving prerequisites.
    function syncRuleProgress(rules,state) {
        for (const kind of ['spark','gift']) {
            const previous=state[kind+'State'] || {}, byId=new Map(Object.values(previous).filter(p=>p?.ruleId).map(p=>[p.ruleId,p]));
            const next={};
            (rules[ruleLists[kind]] || []).forEach((rule,index)=>{
                const legacy=previous[index];
                const progress=rule.id ? byId.get(rule.id) || (!legacy?.ruleId ? legacy : null) : legacy;
                next[index]=progress || {basePull:0,triggeredCount:0};
                if(rule.id) next[index].ruleId=rule.id;
            });
            state[kind+'State']=next;
        }
    }
    // Run against completed pulls, before starting a new pull. Snapshot prerequisite
    // counts first, so DOM order and newly unlocked rules cannot cause a cascade.
    function prepareRules(rules, state) {
        syncRuleProgress(rules,state);
        const entries = ruleEntries(rules), counts = new Map();
        for (const e of entries) if (e.rule.id) counts.set(e.rule.id, ruleProgress(state,e).triggeredCount || 0);
        for (const e of entries) {
            if (!e.rule.id) continue;
            const p = ruleProgress(state,e), a = e.rule.activation, conditions = a?.conditions || [];
            if (p.activation?.active) continue;
            const checks = conditions.map(c => c.type === 'pulls' ? getRuleTotal(rules,state) - (p.periodStart ?? p.basePull ?? 0) >= c.count : (counts.get(c.ruleId) || 0) >= c.count);
            const active = !conditions.length || (a.match === 'any' ? checks.some(Boolean) : checks.every(Boolean));
            if (!active) { p.activation = {active:false}; continue; }
            const reset = conditions.length && a.counting !== 'retain';
            p.activation = {active:true, unlockedAt:state.total, goldProgress:0};
            const expiry=getExpiration(e.rule),includeEarlier=expiry.scope==='including_before';
            p.expirationBaseline={hits:includeEarlier?0:p.targetHits||0,pulls:includeEarlier?(p.periodStart??p.basePull??0):getRuleTotal(rules,state),source:includeEarlier?0:counts.get(expiry.ruleId)||0};
            if (reset && ['spark','gift'].includes(e.kind)) p.basePull = getRuleTotal(rules,state);
            if (['early','category'].includes(e.kind)) {
                // An unconditioned sequence keeps the legacy global ordering.
                p.activation.goldProgress = reset ? 0 : conditions.length ? state.naturalGoldCount || 0 : e.kind === 'early' ? state.earlyUpUsedCount || 0 : getCategoryGoldOrder(state)-1;
            } else if (conditions.length && a.counting === 'retain') {
                const threshold=e.rule.limit || e.rule.trigger;
                const rawReached=threshold>0?Math.floor((getRuleTotal(rules,state)-p.basePull)/threshold):0;
                const reached=e.rule.type==='once'?Math.min(1,rawReached):rawReached;
                const previous=p.settledCount ?? p.triggeredCount;
                if(a.catchUp==='none') p.settledCount=Math.max(previous,reached);
                if(a.catchUp==='one') p.settledCount=Math.max(previous,reached-1);
            }
        }
        for(const entry of entries)if(entry.rule.id)updateExpiration(rules,state,entry,counts);
    }
    function isRuleActive(state, rule, kind, index) {
        if (rule.enabled === false) return false;
        const p = ['spark','gift'].includes(kind) ? state[kind+'State']?.[index] : state.sequenceRuleState?.[rule.id];
        if(p?.expired)return false;
        if (!rule.activation?.conditions?.length) return true;
        return p?.activation?.active === true;
    }
    function sequenceOrder(state, rule, fallback) {
        const progress=state.sequenceRuleState?.[rule.id]?.activation;
        return progress?.active ? progress.goldProgress+1 : fallback;
    }
    // Current milestones take priority. Overdue privileges wait for a spare gold,
    // ordered by their original milestone, and are consumed only on a committed hit.
    function selectSequenceRule(rules, state, kind, fallback) {
        const entries = (rules[ruleLists[kind]] || []).map((rule,index) => ({rule,index}))
            .filter(({rule,index}) => isRuleActive(state,rule,kind,index));
        const current = entries.find(({rule}) => (rule.order || 1) === sequenceOrder(state,rule,fallback));
        if (current) return current.rule;
        return entries.filter(({rule}) => rule.activation?.conditions?.length &&
            rule.activation.counting === 'retain' && rule.activation.sequenceCatchUp === 'next' &&
            !(state.sequenceRuleState?.[rule.id]?.triggeredCount > 0) &&
            (rule.order || 1) < sequenceOrder(state,rule,fallback))
            .sort((a,b) => (a.rule.order || 1)-(b.rule.order || 1) || a.index-b.index)[0]?.rule;
    }
    function commitSequence(rules,state,result) {
        if (!result.isGold || result.isSpark || result.pullType === 'free_nopity') return;
        for (const e of ruleEntries(rules)) {
            if (!e.rule.id || !['early','category'].includes(e.kind)) continue;
            const p=ruleProgress(state,e);
            if (!isRuleActive(state,e.rule,e.kind,e.index)) continue;
            if (p.activation) p.activation.goldProgress++;
            if ((e.kind==='early' && result.usedEarlyRuleId===e.rule.id) || (e.kind==='category' && result.usedCategoryRuleId===e.rule.id)) p.triggeredCount++;
        }
    }
    function resetRuleActivation(rules,state,kind) {
        for (const e of ruleEntries(rules).filter(e=>e.kind===kind&&e.rule.id)) {
            if (['early','category'].includes(kind)) {
                state.sequenceRuleState ||= {}; state.sequenceRuleState[e.rule.id]={triggeredCount:0,periodStart:getRuleTotal(rules,state)};
            }
        }
    }
    // 统一获取金卡保底配置，兼容新版 pities、旧版 pity 和 hardPity。
    function getGoldPityRule(rules, targetGoldIds) {
        return rules.pities?.find(p => targetGoldIds.includes(p.tierId)) || rules.pity || {};
    }

    // 硬保底上限供抽卡、实时概率和历史检测共同使用。
    function getHardPity(rules, targetGoldIds) {
        const rule = getGoldPityRule(rules, targetGoldIds);
        return rule.pulls || rule.hard || rules.hardPity || 90;
    }

    // 计算当前出金的 UP 条件；只返回判定依据，不抽随机数、不推进状态。
    function getGoldPolicy(rules, state, targetGoldIds) {
        const rule = getGoldPityRule(rules, targetGoldIds);
        const hasGuarantee = rule.useGuarantee !== false && rule.enableUp !== false;
        const mode = rule.guaranteeMode || 'classic';
        let upRate = rule.upRate ?? 0.5;
        if (upRate <= 1) upRate *= 100;
        let guaranteed = false;
        if (hasGuarantee) {
            if (mode === 'progressive') {
                upRate = Math.min(rule.guaranteeMax ?? 100, upRate + (state.guaranteeLosses || 0) * (rule.guaranteeStep ?? 25));
                guaranteed = upRate >= 100;
            } else {
                guaranteed = (state.guaranteeCount || 0) >= (rule.guaranteeLimit || 1);
                if (guaranteed) upRate = 100;
            }
        }
        const earlyOrder = (state.earlyUpUsedCount || 0) + 1;
        const earlyRule = selectSequenceRule(rules,state,'early',earlyOrder);
        if (earlyRule) upRate = earlyRule.upRate;
        const naturalOrder = (state.naturalGoldCount || 0) + 1;
        const categoryRule = selectSequenceRule(rules,state,'category',state.customCatSeqStartOrder || getCategoryGoldOrder(state));
        const rescue = rules.secondaryRescue;
        const forcedRescue = !!rescue?.enabled && ((state.consecutiveLosses || 0) >= (rescue.hardGuaranteeLosses ?? 3) || (rescue.triggerRate ?? 6) >= 100);
        return { rule, hasGuarantee, mode, upRate, guaranteed, earlyRule, earlyOrder, categoryRule, naturalOrder, forcedRescue };
    }

    // 判断物品是否符合定向规则；UP 标签按本次来源判断，其他标签按图鉴判断。
    function matchesCategory(item, rule, isUP) {
        if (!rule) return true;
        const cats = rule.targetCats || [], tags = rule.targetTags || [];
        if (!cats.length && !tags.length) return true;
        if (!item) return false;
        const tagMatch = !tags.length || (tags.includes('up') ? isUP : (item.tags || []).some(t => tags.includes(t)));
        return (!cats.length || cats.includes(item.category)) && tagMatch;
    }

    // 命中 UP 后的救援进度计算；set_to 沿用引擎原先“最多保留配置值”的行为。
    function getRescueLossesAfterUP(rules, losses) {
        const config = rules.secondaryRescue;
        if (!config?.enabled) return 0;
        const value = config.strategyValue ?? config.decayStep ?? 1;
        switch (config.onHitUpStrategy || 'reset') {
            case 'reset': return 0;
            case 'decay': return Math.max(0, losses - value);
            case 'set_to': return Math.min(losses, value);
            default: return losses;
        }
    }

    // 井规则的取消、一次性/循环触发条件；返回下一状态，由调用方自行保存。
    function evaluateSpark(rules, rule, progress, total, result, targetGoldIds) {
        const next = { ...progress };
        if (rule.enabled === false || next.expired || (rule.activation?.conditions?.length && !next.activation?.active)) return {triggered:false,count:0,state:next};
        if(getExpiration(rule).type==='target' && result.matchesRuleTarget){next.expired=true;return {triggered:false,count:0,state:next};}
        if ((rule.cancelOnHit || rule.cancelOnUp) && !next.cancelled && result.isGold) {
            if (!rules.pities?.some(p => targetGoldIds.includes(p.tierId) && p.enableUp) || rule.targetType === 'any_gold' || result.isUP) next.cancelled = true;
        }
        const pulls = total - next.basePull;
        const evaluated = evaluateMilestone(rule,next,total,rule.limit);
        if(next.cancelled) return {triggered:false,count:0,state:next};
        return evaluated;
    }

    function evaluateMilestone(rule, progress, total, threshold) {
        const next={...progress}, settled=next.settledCount ?? next.triggeredCount ?? 0;
        if(rule.enabled===false || next.expired || threshold<=0 || (rule.activation?.conditions?.length && !next.activation?.active)) return {triggered:false,count:0,state:next};
        const reached=rule.type==='once'?Math.min(1,Math.floor((total-next.basePull)/threshold)):Math.floor((total-next.basePull)/threshold);
        const cap=rule.type==='once'?1:rule.maxTriggers ?? Infinity;
        const due=Math.max(0,reached-settled), available=Math.max(0,cap-(next.triggeredCount || 0));
        // Preserve legacy one-at-a-time behavior for old rules; explicit catch-up grants all.
        const count=Math.min(due,available,rule.activation?.counting==='retain' ? Infinity : 1);
        next.settledCount=settled+count; next.triggeredCount=(next.triggeredCount || 0)+count;
        return {triggered:count>0,count,state:next};
    }

    // 计算下一抽的稀有度概率：基础概率 → 软保底递增 → 硬保底强制出金。
    // 只读取状态，不消耗随机数、不修改抽数；抽卡和实时概率展示共用此函数。
    function calculateProbabilities(rules, simData, activeTiers, targetGoldIds) {
            let currentProbMap = {};
            activeTiers.forEach(t => { currentProbMap[t.id] = t.prob || 0; });

            let goldProbBoost = 0;
            const isSoftOn = rules.pity?.softEnabled === true || rules.pities?.some(p => targetGoldIds.includes(p.tierId) && p.softEnabled);
            const goldPityRule = getGoldPityRule(rules, targetGoldIds);
            const sRules = goldPityRule.softRules || [];

            if (isSoftOn && sRules.length > 0) {
                let currentPull = Number(simData.pity) + 1;
                sRules.forEach(rule => {
                    let rStart = Number(rule.start); let rEnd = Number(rule.end); let rInc = Number(rule.inc);
                    if (rInc < 1) rInc = rInc * 100;
                    if (currentPull >= rStart && currentPull <= rEnd) goldProbBoost += (currentPull - rStart + 1) * rInc;
                    else if (currentPull > rEnd) goldProbBoost += (rEnd - rStart + 1) * rInc;
                });
            }

            let isHardPity = (simData.pity + 1) >= getHardPity(rules, targetGoldIds) && targetGoldIds.length > 0;
            let validGoldIds = targetGoldIds.filter(id => currentProbMap[id] !== undefined);
            
            if (validGoldIds.length > 0) {
                if (isHardPity) {
                    activeTiers.forEach(t => currentProbMap[t.id] = 0);
                    validGoldIds.forEach(id => currentProbMap[id] = 100 / validGoldIds.length);
                } else if (goldProbBoost > 0) {
                    let currentGoldTotal = validGoldIds.reduce((sum, id) => sum + currentProbMap[id], 0);
                    let actualBoost = Math.min(goldProbBoost, 100 - currentGoldTotal);
                    let boostPerGold = actualBoost / validGoldIds.length;
                    validGoldIds.forEach(id => { currentProbMap[id] += boostPerGold; });

                    let remainingDeduction = actualBoost;
                    let nonGoldTiers = activeTiers.filter(t => !validGoldIds.includes(t.id)).sort((a, b) => currentProbMap[b.id] - currentProbMap[a.id]); 

                    for (let i = 0; i < nonGoldTiers.length; i++) {
                        let tId = nonGoldTiers[i].id;
                        if (currentProbMap[tId] >= remainingDeduction) { currentProbMap[tId] -= remainingDeduction; break; }
                        else { remainingDeduction -= currentProbMap[tId]; currentProbMap[tId] = 0; }
                    }
                }
            }
        return { probabilities: currentProbMap, goldPityRule };
    }

    /**
     * 创建本次抽取使用的执行器。
     * selections 格式：{ 稀有度ID: { up: [名字], std: [名字], spec: [名字] } }。
     * selectSpark(candidates, rule) 由页面显示自选窗口，并返回选中的名字。
     * state 由调用方持有，便于重置、继承卡池进度和展示统计。
     */
    function create({ rules, activeTiers, targetGoldIds, minorPities = [],
        selections = {}, allCatalogItems = [], pureCatalog = {},
        globalTiers = [], random = Math.random, selectSpark = null }) {

        // 名称查询只使用传入的图鉴，不依赖页面变量。
        function findInRoster(name) {
            return allCatalogItems.find(item => item.id === name || item.presetId === name || item.legacyIds?.includes(name)) ||
                allCatalogItems.find(item => item.name === name || item.short === name) ||
                allCatalogItems.find(item => Array.isArray(item.aliases) && item.aliases.includes(name)) || null;
        }
        const expirationContext={lookup:result=>findInRoster(result.itemId||result.name),selections,targetGoldIds,rules};
        function itemResult(reference) {
            const item = findInRoster(reference);
            const itemId = item?.presetId || item?.id;
            return { name: item?.name || reference, ...(itemId ? { itemId } : {}) };
        }

        // 井自选必须交给调用方选择；引擎不会默认替用户选择奖励。
        async function chooseSpark(candidates, rule) {
            if (typeof selectSpark !== 'function') throw new Error('自选井需要提供 selectSpark 回调');
            return selectSpark(candidates, rule);
        }

        // 命中 UP 后，根据救援规则重置、衰减或限制连续歪的计数。
        function handleConsecutiveLossesOnHitUP(rules, simData) {
            simData.consecutiveLosses = getRescueLossesAfterUP(rules, simData.consecutiveLosses || 0);
        }

        function roll(simData) {
            // 从公共概率计算器取得本次权重，确保展示与实际抽取使用同一规则。
            const { probabilities: currentProbMap, goldPityRule } = calculateProbabilities(rules, simData, activeTiers, targetGoldIds);
            const commonTierId = activeTiers[activeTiers.length - 1]?.id || 'unknown';

            // 按累计概率抽取稀有度；未落入配置区间时使用最后一个稀有度兜底。
            let rollVal = random() * 100; 
            let cumulative = 0;
            let rolledTierId = commonTierId;

            for (let t of activeTiers) {
                cumulative += currentProbMap[t.id];
                if (rollVal < cumulative) { rolledTierId = t.id; break; }
            }

            // 检查非金保底；已出金时不被低稀有度保底覆盖。
            let triggeredMinorPities = [];
            for (let i = 0; i < minorPities.length; i++) {
                if (simData.minorPityCounters[i] + 1 >= minorPities[i].pulls) triggeredMinorPities.push(minorPities[i]);
            }
            if (triggeredMinorPities.length > 0 && !targetGoldIds.includes(rolledTierId)) {
                let bestMinorPityTierId = triggeredMinorPities[0].tierId;
                let rolledIdx = activeTiers.findIndex(t => t.id === rolledTierId);
                let minorIdx = activeTiers.findIndex(t => t.id === bestMinorPityTierId);
                if (rolledIdx > minorIdx || rolledIdx === -1) rolledTierId = bestMinorPityTierId; 
            }
            
            let actualPityUsed = simData.pity + 1;
            let isGold = targetGoldIds.includes(rolledTierId);

            for (let i = 0; i < minorPities.length; i++) {
                let rule = minorPities[i];
                let isHigherOrEqual = isGold || (rolledTierId === rule.tierId);
                if (isHigherOrEqual) {
                    if (rule.resetOnHit !== false) simData.minorPityCounters[i] = 0; 
                    else simData.minorPityCounters[i] = (simData.minorPityCounters[i] + 1 >= rule.pulls) ? 0 : simData.minorPityCounters[i] + 1;
                } else {
                    simData.minorPityCounters[i] = (simData.minorPityCounters[i] + 1 >= rule.pulls) ? 0 : simData.minorPityCounters[i] + 1;
                }
            }

            if (isGold) simData.pity = 0; else simData.pity++;

            let isUP = false;
            let name = 'Unknown';
            let isRescued = false;

            // 候选列表由页面传入；抽卡算法无需读取复选框或任何 DOM 节点。
            const currentTierUpList = (selections[rolledTierId]?.up || []);
            const currentTierStdList = (selections[rolledTierId]?.std || []);
            const currentTierSpecList = (selections[rolledTierId]?.spec || []);

            // 常驻物品抽取：支持特限物品倍数加权，或额外命中特限的百分比机会。
            const pickFromStdWithSpecBonus = (stdList, specList) => {
                if (stdList.length === 0) return 'Gold';
                if (!rules.specRate || !rules.specRate.enabled || specList.length === 0) return stdList[Math.floor(random() * stdList.length)];

                const specRule = rules.specRate.rules?.[0] || rules.specRate;
                const specType = specRule.type || 'multiplier';
                const specValue = specRule.value ?? 5;

                if (specType === 'multiplier') {
                    let weightPool = [];
                    stdList.forEach(item => {
                        const weight = specList.includes(item) ? specValue : 1;
                        for (let w = 0; w < weight * 10; w++) weightPool.push(item);
                    });
                    return weightPool[Math.floor(random() * weightPool.length)];
                }
                const percentVal = Math.min(100, Math.max(0, specValue));
                if (random() * 100 < percentVal) {
                    const validBoosted = stdList.filter(item => specList.includes(item));
                    if (validBoosted.length > 0) return validBoosted[Math.floor(random() * validBoosted.length)];
                }
                return stdList[Math.floor(random() * stdList.length)];
            };

            if (isGold) {
                // 公共判定同时服务随机抽卡和 dashboard 历史检测。
                const policy = getGoldPolicy(rules, simData, targetGoldIds);
                const hasGuarRule = policy.hasGuarantee;
                const currentUpRate = policy.upRate;
                const isGuaranteedUP = policy.guaranteed;
                const isUsingEarlyPrivilege = !!policy.earlyRule;
                const currentCatRule = policy.categoryRule;
                const matchCatRule = (name, isFromUpPool = false) =>
                    matchesCategory(findInRoster(name), currentCatRule, isFromUpPool);

                let matchedUp = currentTierUpList.filter(name => matchCatRule(name, true));
                let matchedStd = currentTierStdList.filter(name => matchCatRule(name, false));
                let effectiveUp = matchedUp.length > 0 ? matchedUp : currentTierUpList;
                let effectiveStd = matchedStd;

                // 🌟 类型定向强制执行：如果定向指定要 UP，本次强制 100% 命中 UP
                if (currentCatRule) {
                    const reqTags = currentCatRule.targetTags || [];
                    const wantsUp = reqTags.includes('up') || reqTags.includes('reup');

                    if (wantsUp && effectiveUp.length > 0) {
                        name = effectiveUp[Math.floor(random() * effectiveUp.length)];
                        isUP = true;
                        if (hasGuarRule) { simData.guaranteeCount = 0; simData.guaranteeLosses = 0; }
                        handleConsecutiveLossesOnHitUP(rules, simData);
                        
                        if (isUsingEarlyPrivilege) simData.earlyUpUsedCount++;
                        simData.catSeqUsedCount = (simData.catSeqUsedCount || 0) + 1;
                        delete simData.customCatSeqStartOrder;

                        return { 
                            tierId: rolledTierId, 
                            ...itemResult(name),
                            isGold, 
                            isUP, 
                            isRescued: false, 
                            total: simData.total, 
                            pityUsed: actualPityUsed,
                            usedEarlyPrivilege: isUsingEarlyPrivilege,
                            usedEarlyRuleId: policy.earlyRule?.id,
                            usedCategoryRuleId: policy.categoryRule?.id,
                            usedCatSeq: true 
                        };
                    }
                }

                // 常规抽取命中 UP 与 常驻判定
                if (effectiveUp.length === 0 && effectiveStd.length > 0) {
                    name = pickFromStdWithSpecBonus(effectiveStd, currentTierSpecList);
                } else if (effectiveStd.length === 0 && effectiveUp.length > 0) {
                    name = effectiveUp[Math.floor(random() * effectiveUp.length)];
                    isUP = true;
                    if (hasGuarRule) { simData.guaranteeCount = 0; simData.guaranteeLosses = 0; }
                    handleConsecutiveLossesOnHitUP(rules, simData);
                } else if (effectiveUp.length > 0 && effectiveStd.length > 0) {
                    let hitRoll = isGuaranteedUP || (random() * 100 < currentUpRate);
                    if (hitRoll) {
                        name = effectiveUp[Math.floor(random() * effectiveUp.length)];
                        isUP = true;
                        if (hasGuarRule) { simData.guaranteeCount = 0; simData.guaranteeLosses = 0; }
                        handleConsecutiveLossesOnHitUP(rules, simData);
                    } else {
                        const rescueConfig = rules.secondaryRescue;
                        let didTriggerRescue = false;
                        if (rescueConfig && rescueConfig.enabled) {
                            let forceRescue = policy.forcedRescue;
                            let rateRoll = random() * 100 < (rescueConfig.triggerRate ?? 6);
                            if (forceRescue || rateRoll) didTriggerRescue = true;
                        }

                        if (didTriggerRescue) {
                            name = effectiveUp[Math.floor(random() * effectiveUp.length)];
                            isUP = true;
                            isRescued = true;
                            if (hasGuarRule) { simData.guaranteeCount = 0; simData.guaranteeLosses = 0; }
                            simData.consecutiveLosses = 0;
                        } else {
                            if (hasGuarRule) {
                                simData.guaranteeCount++;
                                simData.guaranteeLosses = (simData.guaranteeLosses || 0) + 1;
                            }
                            simData.consecutiveLosses = (simData.consecutiveLosses || 0) + 1;
                            name = pickFromStdWithSpecBonus(effectiveStd, currentTierSpecList);
                        }
                    }
                } else {
                    let matchedTier = activeTiers.find(t => t.id === rolledTierId);
                    name = matchedTier ? (matchedTier.name + "★") : 'Gold';
                }

                if (isUsingEarlyPrivilege) simData.earlyUpUsedCount++;
                if (currentCatRule) {
                    simData.catSeqUsedCount = (simData.catSeqUsedCount || 0) + 1;
                    delete simData.customCatSeqStartOrder;
                }

                return { 
                    tierId: rolledTierId, 
                    ...itemResult(name),
                    isGold, 
                    isUP, 
                    isRescued, 
                    total: simData.total, 
                    pityUsed: actualPityUsed,
                    usedEarlyPrivilege: isUsingEarlyPrivilege,
                            usedEarlyRuleId: policy.earlyRule?.id,
                            usedCategoryRuleId: policy.categoryRule?.id,
                    usedCatSeq: !!currentCatRule
                };
            }

            // 非金物品按对应层级的 UP 比例抽取，并返回与金卡相同的结果字段。
            let subUpList = (selections[rolledTierId]?.up || []);
            let subStdList = (selections[rolledTierId]?.std || []);

            // 若配置了副产物 UP 则按概率判定，否则平分
            let tierRule = rules.pities?.find(p => p.tierId === rolledTierId);
            let subUpRate = (tierRule && tierRule.upRate !== undefined) ? tierRule.upRate : 0.5;
            if (subUpRate <= 1) subUpRate *= 100;

            if (subUpList.length > 0 && subStdList.length > 0) {
                let hitSubUp = random() * 100 < subUpRate;
                if (hitSubUp) {
                    name = subUpList[Math.floor(random() * subUpList.length)];
                    isUP = true;
                } else {
                    name = subStdList[Math.floor(random() * subStdList.length)];
                }
            } else if (subUpList.length > 0) {
                name = subUpList[Math.floor(random() * subUpList.length)];
                isUP = true;
            } else if (subStdList.length > 0) {
                name = subStdList[Math.floor(random() * subStdList.length)];
            } else {
                let matchedTier = activeTiers.find(t => t.id === rolledTierId);
                name = matchedTier ? (matchedTier.name + "★") : 'Item';
            }

            return { tierId: rolledTierId, ...itemResult(name), isGold: false, isUP, isRescued: false, total: simData.total, pityUsed: actualPityUsed };
        }

        // 根据井规则筛选候选：指定 UP 序号、随机 UP，或按分类与标签筛选。
        function getSparkCandidateItems(rule) {
            const goldTierId = targetGoldIds[0] || globalTiers[0]?.id;
            const upItemsChecked = selections[goldTierId]?.up || [];

            if (rule.targetType === 'up_index') {
                const idx = (rule.upIndex || 1) - 1;
                const targetName = upItemsChecked[idx] || upItemsChecked[0];
                return targetName ? [findInRoster(targetName)].filter(Boolean) : [];
            }
            if (rule.targetType === 'random_up' || !rule.targetType) {
                return upItemsChecked.map(name => findInRoster(name)).filter(Boolean);
            }

            const targetTierId = rule.targetTier || goldTierId;
            const allowedCats = rule.targetCats || ['char'];
            const allowedTags = rule.targetTags || ['std'];

            let matched = [];
            (allowedCats || []).forEach(catId => {
                (pureCatalog?.[catId] || []).forEach(item => {
                    if (item.tierId === targetTierId && (item.tags || []).some(t => allowedTags.includes(t))) {
                        if (!matched.some(m => (m.presetId || m.id || m.name) === (item.presetId || item.id || item.name))) matched.push(item);
                    }
                });
            });
            return matched;
        }

        // 批量推进普通抽和赠送抽；处理井取消、循环井、替换井及额外奖励。
        // 自选井通过回调等待页面选择，其余所有计数和判定都在引擎内完成。
        async function draw(simData, amount) {
            // 批量抽数必须是非负整数，防止错误调用造成无限循环。
            if (!Number.isSafeInteger(amount) || amount < 0) throw new RangeError('抽数必须是非负安全整数');
            let pullHistory = []; 
            let pullsTodo = amount;

            while (pullsTodo > 0) {
                prepareRules(rules, simData);
                if (simData.freeQueue.length > 0 && !simData.freeQueue[0].countRules) {
                    let currentFree = simData.freeQueue[0];
                    simData.total++;
                    if(rules.countBonusPullsForRules===false&&!currentFree.countRules)simData.bonusPullCount=(simData.bonusPullCount||0)+1;
                    // 不计保底的赠送抽不能先按当前垫抽判定、再把计数回滚。
                    // 否则当当前垫抽为 89 时，队列中的每一抽都会被当作第 90 抽而强制出金。
                    const freeProgressState = currentFree.countPity ? null : {
                        pity: simData.pity,
                        guaranteeCount: simData.guaranteeCount,
                        guaranteeLosses: simData.guaranteeLosses,
                        consecutiveLosses: simData.consecutiveLosses,
                        minorPityCounters: [...simData.minorPityCounters],
                        minorGuaranteeCounters: { ...simData.minorGuaranteeCounters },
                        naturalGoldCount: simData.naturalGoldCount,
                        earlyUpUsedCount: simData.earlyUpUsedCount,
                        catSeqUsedCount: simData.catSeqUsedCount,
                        hasCustomCatSeqStartOrder: Object.prototype.hasOwnProperty.call(simData, 'customCatSeqStartOrder'),
                        customCatSeqStartOrder: simData.customCatSeqStartOrder
                    };

                    if (freeProgressState) {
                        // 赠送抽不消耗保底进度，因此以基础概率进行本次层级判定。
                        simData.pity = 0;
                        simData.minorPityCounters = currentFree.ownMinorPity ? [...(currentFree.minorPityCounters || Array(minorPities.length).fill(0))] : Array(minorPities.length).fill(0);
                    }
                    let result = roll(simData);
                    
                    if (result.isGold) {
                        simData.goldCount++;
                        simData.naturalGoldCount = (simData.naturalGoldCount || 0) + 1;
                    }

                    if(currentFree.ownMinorPity&&!currentFree.countPity)currentFree.minorPityCounters=[...simData.minorPityCounters];
                    if (currentFree.countPity) {
                        result.pullType = 'free_pity';
                    } else {
                        // 回滚赠送抽期间可能改变的所有抽卡进度，但保留本次实际获得的物品和总出金数。
                        simData.pity = freeProgressState.pity;
                        simData.guaranteeCount = freeProgressState.guaranteeCount;
                        simData.guaranteeLosses = freeProgressState.guaranteeLosses;
                        simData.consecutiveLosses = freeProgressState.consecutiveLosses;
                        simData.minorPityCounters = freeProgressState.minorPityCounters;
                        simData.minorGuaranteeCounters = freeProgressState.minorGuaranteeCounters;
                        simData.naturalGoldCount = freeProgressState.naturalGoldCount;
                        simData.earlyUpUsedCount = freeProgressState.earlyUpUsedCount;
                        simData.catSeqUsedCount = freeProgressState.catSeqUsedCount;
                        if (freeProgressState.hasCustomCatSeqStartOrder) {
                            simData.customCatSeqStartOrder = freeProgressState.customCatSeqStartOrder;
                        } else {
                            delete simData.customCatSeqStartOrder;
                        }
                        result.pullType = 'free_nopity';
                    }
                    commitSequence(rules, simData, result);
                    observeRuleOutcome(rules,simData,result,expirationContext);
                    pullHistory.push(result);
                    currentFree.remaining--;
                    if (currentFree.remaining <= 0) simData.freeQueue.shift(); 
                    pullsTodo--; 
                } else {
                    const countedFree=simData.freeQueue[0]?.countRules ? simData.freeQueue[0] : null;
                    simData.total++;
                    let result = roll(simData);
                    let triggeredSpark = false;
                    
                    for (let idx = 0; idx < (rules.sparkRules || []).length; idx++) {
                        const rule = rules.sparkRules[idx];
                        if (!simData.sparkState[idx]) simData.sparkState[idx] = { basePull: 0, cancelled: false, triggeredCount: 0 };
                        const state = simData.sparkState[idx];

                        // 与历史检测共用井规则判定，不重复维护阈值和取消条件。
                        const evaluation = evaluateSpark(rules, rule, state, getRuleTotal(rules,simData), {...result,matchesRuleTarget:targetMatches(rule,'spark',{...result,pullType:countedFree?'free_pity':'paid',countRules:!!countedFree},expirationContext)}, targetGoldIds);
                        Object.assign(state, evaluation.state);
                        if (evaluation.triggered) {
                          for (let rewardIndex = 0; rewardIndex < evaluation.count; rewardIndex++) {
                            const candidates = getSparkCandidateItems(rule);
                            let sparkName = "";
                            if (rule.deliverMode === 'selectable' || rule.isSelectable) {
                                sparkName = candidates.length > 0 ? await chooseSpark(candidates, rule) : "自选大奖";
                            } else {
                                sparkName = candidates.length > 0 ? candidates[Math.floor(random() * candidates.length)].name : (result.name || "大奖");
                            }

                            if (rule.noReset || rewardIndex > 0) {
                                // 🌟 独立兑换井：不占抽卡出目，挂在右侧角标，并计入大奖总数
                                simData.events.pendingGifts.push({ ...itemResult(sparkName), atTotal: simData.total, ...(rule.rewardKind==='token'?{isToken:true}:{}) });
                                if(rule.rewardKind!=='token')simData.goldCount++;
                            } else {
                                // 🌟 核心吃保底井：将本次出目直接替换为井产物，不归入常规自然出金！
                                triggeredSpark = true;
                                
                                // 退回刚才 roll 消耗的不歪特权与定向进度
                                if (result.usedEarlyPrivilege) {
                                    simData.earlyUpUsedCount = Math.max(0, (simData.earlyUpUsedCount || 0) - 1);
                                }
                                if (result.usedCatSeq) {
                                    simData.catSeqUsedCount = Math.max(0, (simData.catSeqUsedCount || 0) - 1);
                                }

                                result = {
                                    tierId: rule.targetTier || targetGoldIds[0] || 'tier_S',
                                    ...itemResult(sparkName),
                                    isGold: true,
                                    isUP: true,
                                    isSpark: true,
                                    total: simData.total,
                                    pityUsed: '井'
                                };
                                simData.pity = 0; 
                                simData.guaranteeCount = 0; 
                                simData.consecutiveLosses = 0;
                            }
                        }
                      }
                    }

                    // 🌟 核心修复点：仅单次精准递增，彻底删除原代码第二处的重复 simData.goldCount++！
                    if (result.isGold) {
                        simData.goldCount++;
                        if (!triggeredSpark) {
                            simData.naturalGoldCount = (simData.naturalGoldCount || 0) + 1;
                        }
                    }

                    result.pullType = countedFree ? 'free_pity' : 'paid';
                    if(countedFree){result.countRules=true;countedFree.remaining--;if(countedFree.remaining<=0)simData.freeQueue.shift();} 
                    commitSequence(rules, simData, result);
                    pullHistory.push(result); 
                    pullsTodo--;

                    (rules.giftRules || []).forEach((rule, idx) => {
                        if (!simData.giftState[idx]) simData.giftState[idx] = { basePull: 0, triggeredCount: 0 };
                        const gState = simData.giftState[idx];
                        const evaluation = evaluateMilestone(rule, gState, getRuleTotal(rules,simData), rule.trigger);
                        Object.assign(gState, evaluation.state);
                        if (evaluation.count > 0) {
                            const queue=rule.nextPeriod ? (simData.nextPeriodFreeQueue ||= []) : simData.freeQueue;
                            queue.push({ countPity: !!rule.countPity, remaining: rule.amount * evaluation.count, ...(rule.ownMinorPity?{ownMinorPity:true}:{}), ...(rule.countRules?{countRules:true}:{}),...(rule.expiresOnRotation?{expiresOnRotation:true}:{}) });
                        }
                    });
                    observeRuleOutcome(rules,simData,result,expirationContext);
                }
            }
            return pullHistory;
        }

        // roll 是低层单抽：只推进保底与特权，不增加总抽数、不执行井或赠送规则。
        // 页面正常抽卡应调用 draw，避免漏掉完整的进度处理。
        return Object.freeze({ roll, draw });
    }

    // 类型定向独立的数值进度：重置只改变基准，不清空自然出金统计。
    function getCategoryGoldOrder(state) {
        return Math.max(1, (state.naturalGoldCount || 0) - (state.catSeqGoldOffset || 0) + 1);
    }
    // 单一全局接口，与 GameData 数据读取层分工：读取规则后交由引擎执行。
    window.GachaEngine = Object.freeze({ createState, getRuleTotal, activateNextPeriodPulls, calculateProbabilities, getGoldPityRule, getHardPity, getGoldPolicy, getCategoryGoldOrder, matchesCategory, getRescueLossesAfterUP, evaluateSpark, evaluateMilestone, prepareRules, targetMatches, observeRuleOutcome, syncRuleProgress, commitSequence, resetRuleActivation, isRuleActive, create });
})();
