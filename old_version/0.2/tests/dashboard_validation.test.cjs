// 使用 Node 内置模块验证历史检测；运行：node tests/dashboard_validation.test.cjs。
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const context = vm.createContext({ window: {}, localStorage: { getItem: () => null } });
for (const file of ['Preset_Data/db_hsr.js', 'Preset_Data/db_zzz.js', 'Preset_Data/db_end.js', 'Preset_Data/db_ark.js', 'logic/catalog_utils.js', 'logic/game_data.js', 'logic/gacha_engine.js', 'logic/dashboard_validation.js']) {
    vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename: file });
}
const { GachaEngine: engine, DashboardValidation: validation, GameData: data } = context.window;
const copy = value => JSON.parse(JSON.stringify(value));
const tiers = [{ id: 'G', name: '金', prob: 1, isGold: true }, { id: 'C', name: '蓝', prob: 99 }];
const catalog = { char: [{ name: 'UP', short: 'U', tierId: 'G', tags: ['up'] }, { name: '标准', tierId: 'G', tags: ['std'] }] };
const rules = { tiers, pities: [{ tierId: 'G', pulls: 3, enableUp: true, upRate: 50, useGuarantee: true }] };
const options = { rules, activeTiers: tiers, targetGoldIds: ['G'], catalog };
const low = () => ({ tierId: 'C' });
const gold = lost => ({ tierId: 'G', name: lost ? '标准' : 'UP', isLost: lost });
const check = (records, overrides = {}) => validation.validateHistory(records, { ...options, ...overrides });
const has = (report, index, key) => report.entries[index].errors.some(error => error.key === key);

async function main() {
    // 随机 50% 的歪是合法结果；硬保底当天没出金才是确定违规。
    assert.equal(check([gold(true)]).entries[0].errors.length, 0);
    assert.equal(check([low(), low(), gold(false)]).entries[2].errors.length, 0);
    assert(has(check([low(), low(), low()]), 2, 'cd_err_gold_required'));
    assert(has(check([low(), low(), low(), gold(false)]), 3, 'cd_err_gold_pity_overflow'));
    assert(has(check([gold(true), gold(true)]), 1, 'cd_err_guarantee_streak'));

    // 旧版硬保底、软保底升到 100%、基础 UP=100% 也共用引擎判定。
    assert(has(check([low(), low()], { rules: { pity: { hard: 2 } } }), 1, 'cd_err_gold_required'));
    assert(has(check([low()], { rules: { pity: { softEnabled: true, softRules: [{ start: 1, end: 1, inc: 99 }] } } }), 0, 'cd_err_gold_required'));
    assert(has(check([gold(true)], { rules: { pities: [{ tierId: 'G', upRate: 100, useGuarantee: false }] } }), 0, 'cd_err_up_required'));
    assert(has(check([gold(true)], { rules: { ...rules, earlyUpRules: [{ order: 1, upRate: 100 }] } }), 0, 'cd_err_early_gold_miss'));
    const progressive = { ...rules, pities: [{ ...rules.pities[0], guaranteeMode: 'progressive', guaranteeStep: 50 }] };
    assert(has(check([gold(true), gold(true)], { rules: progressive }), 1, 'cd_err_guarantee_progressive'));

    // 赠送抽默认不影响垫抽，明确 countPity=true 的赠送抽会推进保底。
    assert.equal(check([low(), low(), { ...low(), isFree: true }]).tail.count, 2);
    assert(has(check([low(), low(), { ...low(), isFree: true, countPity: true }]), 2, 'cd_err_gold_required'));
    assert(has(check([{ tierId: 'G', name: '?', isFree: true }]), 0, 'cd_err_catalog_missing'));
    assert(has(check([gold(true), { ...gold(false), isFree: true }, gold(true)]), 2, 'cd_err_guarantee_streak'));

    // 替换井要求产物，独立兑换井不强迫普通抽出金；提前 UP 会取消指定井。
    const spark = { ...rules, sparkRules: [{ type: 'once', limit: 2, noReset: false }] };
    assert(has(check([low(), low()], { rules: spark }), 1, 'cd_err_spark_milestone_hit'));
    assert(has(check([low(), gold(true)], { rules: spark }), 1, 'cd_err_spark_offrate'));
    assert.equal(check([low(), gold(false)], { rules: spark }).state.naturalGoldCount || 0, 0);
    const extraSpark = { ...rules, sparkRules: [{ type: 'once', limit: 2, noReset: true }] };
    assert.equal(check([low(), low()], { rules: extraSpark }).entries[1].errors.length, 0);
    const cancelledSpark = { ...rules, sparkRules: [{ type: 'once', limit: 2, noReset: false, cancelOnUp: true }] };
    assert.equal(check([gold(false), low()], { rules: cancelledSpark }).entries[1].isSpark, false);
    assert(has(check([{ ...gold(false), isSpark: true }]), 0, 'cd_err_spark_unexpected'));
    const loop = { ...rules, sparkRules: [{ type: 'loop', limit: 2, noReset: false }] };
    assert(check([low(), gold(false), low(), gold(false)], { rules: loop }).entries[3].isSpark);

    // 救援默认值和命中 UP 后的计数策略，直接使用引擎公共函数。
    const rescue = { ...rules, pities: [{ ...rules.pities[0], useGuarantee: false }], secondaryRescue: { enabled: true, hardGuaranteeLosses: 1 } };
    assert(has(check([gold(true), gold(true)], { rules: rescue }), 1, 'cd_err_rescue_streak'));
    assert.equal(engine.getRescueLossesAfterUP({ secondaryRescue: { enabled: true, onHitUpStrategy: 'set_to', strategyValue: 2 } }, 1), 1);

    // 分类定向仅在有证据时检测；缺失旧勾选记录不能否定引擎允许的 UP 回退。
    const category = { ...rules, goldCategorySequence: [{ order: 1, targetCats: ['wep'], targetTags: ['std'] }] };
    assert(has(check([gold(true)], { rules: category }), 0, 'cd_err_category_mismatch'));
    assert.equal(check([gold(false)], { rules: category }).entries[0].errors.length, 0);

    // 换期的进度继承与重置、重置前违规段，以及旧 star/简称记录兼容。
    const rotation = { isRuleNode: true, config: {} };
    assert.equal(check([low(), low(), rotation, low()], { allowRotation: true }).tail.count, 1);
    const inherit = { ...rules, lifecycle: { rotationMatrix: { inheritPityPulls: true } } };
    assert(has(check([low(), low(), rotation, low()], { rules: inherit, allowRotation: true }), 3, 'cd_err_gold_required'));
    assert.equal(check([low(), low(), low(), rotation], { allowRotation: true }).entries[3].rotation.resetErrors.length, 1);
    assert.equal(check([{ star: '金', short: 'U' }]).entries[0].errors.length, 0);
    const input = [gold(true), low()];
    const before = JSON.stringify(input);
    check(input);
    assert.equal(JSON.stringify(input), before);

    // 所有预设卡池生成合法流水，再交给检测器，确保抽卡与检测不会互相矛盾。
    let pools = 0;
    for (const id of ['hsr', 'zzz', 'end', 'ark']) {
        const preset = data.getPreset(id), source = data.loadCatalog(id), all = data.flattenCatalog(source), global = data.loadGlobalTiers(id);
        for (const [poolId, poolRules] of Object.entries(preset.rules)) {
            const active = (poolRules.tiers || []).map(t => ({ ...global.find(g => g.id === t.id), ...t }));
            const goldIds = active.filter(t => t.isGold).map(t => t.id);
            if (!goldIds.length) goldIds.push(global[0].id);
            const minor = poolRules.pities ? poolRules.pities.filter(p => !p.isGold && p.tierId !== poolRules.tiers?.find(t => t.isGold)?.id) : poolRules.minorPities || [];
            const selections = {};
            for (const tier of active) {
                const list = all.filter(item => item.tierId === tier.id);
                const isUp = item => item.tags.some(tag => ['up', 'reup', 'collab'].includes(tag));
                selections[tier.id] = { up: list.filter(isUp).map(i => i.name), std: list.filter(i => !isUp(i)).map(i => i.name), spec: list.filter(i => i.tags.includes('spec')).map(i => i.name) };
            }
            let seed = 235;
            const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
            const draw = engine.create({ rules: poolRules, activeTiers: active, targetGoldIds: goldIds, minorPities: minor, selections, allCatalogItems: all, pureCatalog: source, globalTiers: global, random, selectSpark: async candidates => candidates[0].name });
            const history = await draw.draw(engine.createState(minor.length), 500);
            const report = validation.validateHistory(history, { rules: poolRules, activeTiers: active, targetGoldIds: goldIds, catalog: source, isStdPool: poolId.includes('std') });
            assert.deepEqual(copy(report.entries.filter(e => e.errors.length).map(e => ({ index: e.index, errors: e.errors }))), [], id + '/' + poolId);
            pools++;
        }
    }
    console.log(`PASS：边界用例与 ${pools} 个预设卡池、${pools * 500} 抽合法流水检测`);
}
main().catch(error => { console.error(error); process.exitCode = 1; });
