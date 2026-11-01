// 图鉴工具测试：仅测试数据处理，不生成前端卡片。node tests/catalog_utils.test.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const context = vm.createContext({ window: {}, localStorage: { getItem: () => null } });
for (const file of ['Preset_Data/db_hsr.js', 'Preset_Data/db_zzz.js', 'Preset_Data/db_end.js', 'Preset_Data/db_ark.js',
    'logic/catalog_utils.js', 'logic/game_data.js']) {
    vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context);
}
const utils = context.window.CatalogUtils;
const copy = value => JSON.parse(JSON.stringify(value));
const first = { id: 'a', name: '角色', short: '角', en: 'Character', eshort: 'Char', nameEn: 'Legacy Name', shortEn: 'Legacy Short', tags: ['up'] };
const weapon = { id: 'b', name: '武器', tag: 'std' };
const catalog = { char: [first], wep: [weapon, { ...first, id: 'duplicate' }], broken: null };

// 默认全部、显式空选择、缺失分类、顺序与附加 category 的浅拷贝行为。
assert.equal(utils.getItemsByCategories(catalog).length, 3);
assert.equal(utils.getItemsByCategories(catalog, []).length, 0);
assert.equal(utils.getItemsByCategories(catalog, ['missing', 'broken']).length, 0);
const items = utils.getItemsByCategories(catalog, ['wep', 'char']);
assert.deepEqual(copy(items.map(item => item.category)), ['wep', 'wep', 'char']);
assert.notEqual(items[0], weapon); assert.equal(weapon.category, undefined);
assert.equal(utils.getItemsByCategories(catalog, ['char'], { withCategory: false })[0], first);
assert.equal(utils.getItemsByCategories(null).length, 0);
assert.equal(utils.getItemsByCategories({ char: [null, 1, first] }).length, 1);

for (const name of ['角色', '角', 'Character', 'Char', 'Legacy Name', 'Legacy Short']) {
    assert.equal(utils.findItem(catalog, name), first);
    assert.equal(utils.findItem([first, weapon], name), first);
}
assert.equal(utils.findItem(catalog, 'character'), null); // 不擅自忽略大小写。
assert.equal(utils.findItem(catalog, ''), null);
assert.equal(utils.findItem(catalog, 'Char', { fields: ['name', 'short'] }), null);
assert.deepEqual(copy(utils.getTags(weapon)), ['std']);
assert.deepEqual(copy(utils.getTags({ tag: ['old'] })), ['old']);
assert.deepEqual(copy(utils.getTags({})), []);
assert.deepEqual(copy(utils.getTags({}, { fallback: ['normal'] })), ['normal']);
assert.equal(utils.hasAnyTag(first, []), false);
assert.equal(utils.hasAnyTag(first, ['std', 'up']), true);
assert.deepEqual(copy(utils.filterByTags([first, weapon], ['std'])), [weapon]);
utils.getTags(first).push('changed'); assert.deepEqual(first.tags, ['up']);
assert.deepEqual(copy(utils.uniqueBy([first, weapon, { ...first, id: 'other' }])), [first, weapon]);
assert.equal(utils.uniqueBy([first, { ...first, id: 'other' }], 'id').length, 2);
assert.equal(utils.uniqueBy([first, { ...first }], item => item.id).length, 1);

// 与重构前的分类/标签/去重算法比较全部官方预设，确保候选范围和顺序一致。
const data = context.window.GameData;
let pools = 0;
for (const game of ['hsr', 'zzz', 'end', 'ark']) {
    const source = data.loadCatalog(game);
    const oldCollect = cats => cats.flatMap(cat => (source[cat] || []).map(item => ({ ...item, category: cat })));
    const flat = oldCollect(Object.keys(source));
    const oldUnique = list => list.filter((item, index, all) => all.findIndex(other => other.name === item.name) === index);
    assert.deepEqual(copy(data.flattenCatalog(source)), copy(oldUnique(flat)));
    const cloned = data.flattenCatalog(source);
    if (cloned.length) {
        cloned[0].tags.push('isolated');
        assert(!flat[0].tags.includes('isolated')); // GameData 深拷贝语义仍保留。
    }
    for (const rule of Object.values(data.getPreset(game).rules)) {
        pools++;
        for (const tierRule of Object.values(rule.assembly?.tierRules || {})) {
            for (const [catKey, tagKey] of [['upCats', 'upTags'], ['offrateCats', 'offrateTags'], ['flatCats', 'tags']]) {
                const cats = tierRule[catKey] || ['char', 'wep'];
                const tags = tierRule[tagKey] || [];
                const old = oldUnique(oldCollect(cats).filter(item => (item.tags || []).some(tag => tags.includes(tag))));
                const current = utils.uniqueBy(utils.filterByTags(utils.getItemsByCategories(source, cats), tags));
                assert.deepEqual(copy(current), copy(old));
            }
        }
    }
}

// 依赖必须在真实 HTML 的样式块外，并早于公共数据层、格式器和页面脚本。
for (const page of ['dashboard', 'simulator', 'pool_setup', 'gallery_setup']) {
    const html = fs.readFileSync(path.join(root, page + '.html'), 'utf8')
        .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '').replace(/<!--[\s\S]*?-->/g, '');
    const scripts = [...html.matchAll(/<script\b[^>]*src="([^"]+)"[^>]*>/gi)].map(m => m[1]);
    const index = scripts.indexOf('logic/catalog_utils.js');
    assert(index >= 0);
    for (const dependency of ['logic/game_data.js', 'ui/item_format.js', 'pages/' + page + '.js']) {
        if (scripts.includes(dependency)) assert(index < scripts.indexOf(dependency));
    }
}
console.log(`PASS：分类、名称/简称、中英文、标签兼容、去重、深拷贝和 ${pools} 个预设卡池候选一致性`);
