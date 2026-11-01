// 公共数据层测试：只读、优先级、预设副本和页面适配。node tests/game_data.test.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const saved = new Map();
const context = vm.createContext({ window: {}, localStorage: {
    getItem: key => saved.get(key) ?? null,
    setItem: () => assert.fail('数据层不应写入存储'),
    removeItem: () => assert.fail('数据层不应删除存储')
} });
for (const file of ['Preset_Data/db_hsr.js', 'Preset_Data/db_zzz.js', 'Preset_Data/db_end.js', 'Preset_Data/db_ark.js',
    'logic/catalog_utils.js', 'logic/game_data.js']) {
    vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context);
}
const data = context.window.GameData;
const copy = value => JSON.parse(JSON.stringify(value));
const set = (key, value) => saved.set(key, JSON.stringify(value));

// 与旧卡池配置读取算法比较全部预设卡池，名称/英文/图标/颜色不变。
let poolCount = 0;
for (const game of ['hsr', 'zzz', 'end', 'ark']) {
    const preset = data.getPreset(game);
    assert.deepEqual(copy(data.getPresetSetup(game)), copy(preset.setup));
    assert.deepEqual(copy(data.getPresetItems(game)), copy(preset.db));
    assert.deepEqual(copy(data.getPresetTiers(game)), copy(preset.tiers));
    assert.deepEqual(copy(data.getPresetRules(game)), copy(preset.rules));
    const rules = data.getPresetRules(game);
    for (const [id, rule] of Object.entries(rules)) {
        poolCount++;
        const info = rule.info;
        if (!info) continue;
        const meta = data.loadPoolMeta(game, id);
        assert.equal(meta.name, info.name || id);
        assert.equal(meta.en, info.en || info.name || id);
        assert.equal(meta.icon, info.icon || '🎯');
        assert.equal(meta.badgeColor, info.badgeColor || 'var(--primary)');
    }
    assert.deepEqual(copy(data.loadPoolIds(game)), Object.keys(rules));
    const setup = data.getPresetSetup(game); setup.changed = true;
    assert.equal(data.getPresetSetup(game).changed, undefined);
    const tiers = data.getPresetTiers(game);
    if (tiers.length) { tiers[0].name = 'changed'; assert.notEqual(data.getPresetTiers(game)[0].name, 'changed'); }
}
assert.equal(data.getPresetSetup('custom'), null);
assert.equal(data.getPresetItems('custom'), null);
assert.equal(data.loadPoolMeta('custom', 'unknown').name, 'unknown');
assert.equal(data.loadPoolMeta('custom', 'unknown').icon, '🎯');

// 本地积木池优先于混合池和官方规则；看板明确传入 info 时保留规则名称优先。
set('GM_RosterPools_zzz', [{ id: 'char_up', name: '自定义池', en: 'Custom', icon: 'X', badgeColor: 'red' }]);
set('GM_Info_zzz', { mixedPools: [{ id: 'char_up', name: '混合池' }, { id: 'mixed_only', name: '混合专属' }] });
let meta = data.loadPoolMeta('zzz', 'char_up');
assert.equal(meta.name, '自定义池'); assert.equal(meta.en, 'Custom'); assert.equal(meta.icon, 'X');
assert.equal(data.loadPoolMeta('zzz', 'mixed_only').name, '混合专属');
const override = { name: '规则名称', en: 'Rule Name', extra: { safe: true } };
meta = data.loadPoolMeta('zzz', 'char_up', { info: override });
assert.equal(meta.name, '规则名称'); meta.extra.safe = false; assert.equal(override.extra.safe, true);
meta = data.loadPoolMeta('zzz', 'char_up'); meta.name = 'mutated';
assert.equal(data.loadPoolMeta('zzz', 'char_up').name, '自定义池');
assert.equal(data.loadPoolIds('zzz').filter(id => id === 'char_up').length, 1);
assert.equal(data.loadPoolIds('zzz').at(-1), 'mixed_only');
// 官方共享候选以当前规则为准，不能被旧积木组或旧混合定义污染。
assert.deepEqual(copy(data.loadPoolIds('zzz', { standaloneOnly: true })), Object.keys(data.getPresetRules('zzz')));
set('GM_RosterPools_share_test', [{ id: 'old_group', isStandalone: false }, { id: 'real_pool', isStandalone: true }]);
set('GM_Info_share_test', { mixedPools: [{ id: 'mixed_pool' }] });
assert.deepEqual(copy(data.loadPoolIds('share_test', { standaloneOnly: true })), ['real_pool', 'mixed_pool']);

// 预设 rosterPools 兜底可显式关闭，避免元数据读取错误改变优先级。
saved.delete('GM_RosterPools_zzz');
assert.deepEqual(copy(data.loadRosterPools('zzz')), copy(data.getPresetSetup('zzz').rosterPools || []));
assert.equal(data.loadRosterPools('zzz', { presetFallback: false }).length, 0);
set('GM_RosterPools_custom', [{ id: 'custom_pool', name: '本地' }]);
assert.equal(data.loadRosterPools('custom')[0].name, '本地');

// 分类：本地定义优先，按定义顺序保留现有键，补上缺少定义的非空自定义类别。
set('GM_Info_custom', { categories: [
    { id: 'wep', name: '武器' }, { id: 'char', name: '角色' }, { id: 'unused', name: '空分类' }
] });
const categories = data.loadCategories('custom', { catalog: { char: [], wep: [{ name: 'x' }], special: [{ name: 'y' }], empty: [] } });
assert.deepEqual(copy(categories.map(category => category.id)), ['wep', 'char', 'special']);
assert.equal(categories[2].icon, '🏷️'); categories[0].name = 'changed';
assert.equal(data.loadCategories('custom')[0].name, '武器');
assert.equal(data.loadCategories('custom', { catalog: {} }).length, 3);
assert.equal(data.loadCategories('unknown').length, 3);

// 缺失/损坏/错误类型的缓存不抛异常，不触发自动写回。
saved.set('GM_Info_broken', '{bad'); saved.set('GM_RosterPools_broken', '{bad');
assert.equal(data.loadRosterPools('broken').length, 0);
assert.equal(data.loadPoolMeta('broken', 'p').name, 'p');
assert.equal(data.loadCategories('broken').length, 3);
set('GM_Info_broken', { mixedPools: {}, categories: {} }); set('GM_RosterPools_broken', {});
assert.equal(data.loadPoolIds('broken').length, 0);
assert.equal(data.loadPoolMeta('broken', 'p').name, 'p');

// 页面元数据适配直接调用公共层，语言与 HTML 生成仍属于页面。
const poolSource = fs.readFileSync(path.join(root, 'pages/pool_setup.js'), 'utf8');
const adapterContext = vm.createContext({ GameData: data, gameId: 'custom', pureCatalog: { char: [] } });
vm.runInContext(poolSource.slice(poolSource.indexOf('        function getPoolMeta(poolId)'), poolSource.indexOf('        function getPoolDisplayName')), adapterContext);
vm.runInContext(poolSource.slice(poolSource.indexOf('function getAvailableCategories()'), poolSource.indexOf('// 规则框只移动 DOM')), adapterContext);
assert.equal(vm.runInContext('getPoolMeta("custom_pool").name', adapterContext), '本地');
assert.equal(vm.runInContext('getAvailableCategories()[0].id', adapterContext), 'char');
const galleryHtml = fs.readFileSync(path.join(root, 'gallery_setup.html'), 'utf8').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '');
assert(galleryHtml.indexOf('src="logic/game_data.js"') < galleryHtml.indexOf('src="pages/gallery_setup.js"'));
for (const page of ['dashboard', 'simulator', 'pool_setup', 'gallery_setup']) {
    const source = fs.readFileSync(path.join(root, 'pages/' + page + '.js'), 'utf8');
    assert(!source.includes('new Function('), page + ': 残留动态预设查找');
}
console.log(`PASS：${poolCount} 个预设卡池元数据、读取优先级、分类/候选、损坏缓存、独立副本和只读边界`);
