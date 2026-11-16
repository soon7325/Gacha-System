const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const registry = JSON.parse(read('Preset_Data/item_id_registry.json'));
const symbols = {
    hsr: { char: 'HSR_CHAR', wep: 'HSR_WEAPON' },
    zzz: { char: 'ZZZ_CHAR', wep: 'ZZZ_WEAPON', pet: 'ZZZ_BANGBOO' },
    end: { char: 'END_CHAR', wep: 'END_WEAPON' }, ark: { char: 'ARK_CHAR' }
};
function load() {
    const c = vm.createContext({ window: {}, localStorage: {
        getItem: () => null, setItem: () => assert.fail('读取预设不应修改用户存储')
    } });
    for (const game of Object.keys(symbols)) vm.runInContext(read(`Preset_Data/db_${game}.js`), c);
    vm.runInContext(read('logic/game_data.js'), c);
    return c;
}
test('四个正式游戏的物品 ID 唯一，并包含正确游戏、分类和阶级', () => {
    const c = load(), seen = new Set();
    for (const [game, categories] of Object.entries(symbols)) {
        for (const [category, symbol] of Object.entries(categories)) {
            for (const item of vm.runInContext(symbol, c)) {
                const idCategory = game === 'zzz' && category === 'pet' ? 'bangboo' : category;
                assert.match(item.id, new RegExp(`^${game}_${idCategory}_${item.tierId}_\\d{3,}$`));
                assert.ok(!seen.has(item.id), `重复 ID: ${item.id}`);
                seen.add(item.id);
            }
        }
    }
    assert.equal(registry.length, 1007, '初次分配记录应保留，后续新增无需重建初次编号');
    assert.equal(new Set(registry.map(row => row.id)).size, registry.length);
    for (const row of registry) assert.ok(seen.has(row.id), `已分配 ID 被删除或更换: ${row.id}`);
});
test('初次编号按有效日期递增；同日按原列表下至上，保留分组内的固定映射', () => {
    const c = load(), groups = new Map();
    for (const row of registry) {
        assert.match(row.date, /^20\d\d-\d\d-\d\d$/);
        assert.ok(row.sources.length && row.sources.every(url => /^https:\/\//.test(url)));
        assert.ok(['released', 'announced'].includes(row.status));
        const group = row.id.replace(/_\d+$/, '');
        if (!groups.has(group)) groups.set(group, []);
        groups.get(group).push(row);
        const [game, category] = row.id.split('_');
        const item = vm.runInContext(symbols[game][category === 'bangboo' ? 'pet' : category], c).find(item => item.id === row.id);
        assert.equal(item.name, row.name, '改名时应同步维护对照表名称，保留原 ID');
    }
    for (const rows of groups.values()) {
        const chronological = [...rows].sort((a, b) => a.date.localeCompare(b.date) || b.initialIndex - a.initialIndex);
        chronological.forEach((row, index) => assert.equal(Number(row.id.match(/_(\d+)$/)[1]), index + 1));
    }
});
test('容易误排的活动、同日档案和占位武器顺序正确，预设读取保留源 ID', () => {
    const c = load();
    const item = (game, cat, name) => vm.runInContext(symbols[game][cat], c).find(row => row.name === name);
    const number = row => Number(row.id.match(/_(\d+)$/)[1]);
    assert.equal(number(item('zzz', 'char', '知更鸟')), number(item('zzz', 'char', '卡芙卡')) + 1);
    assert.equal(number(item('zzz', 'wep', '夜色流光溢彩')), number(item('zzz', 'wep', '只需等待')) + 1);
    assert.ok(number(item('zzz', 'pet', '乐玩布')) > number(item('zzz', 'pet', '加班布')));
    assert.ok(number(item('end', 'wep', '望乡')) > number(item('end', 'wep', '熔铸火焰')));
    assert.ok(number(item('zzz', 'char', '佩洛伊斯')) > number(item('zzz', 'char', '猫又')));
    for (const game of Object.keys(symbols)) {
        const catalog = c.window.GameData.loadCatalog(game);
        for (const [cat, symbol] of Object.entries(symbols[game])) {
            assert.deepEqual(Array.from(catalog[cat], row => row.id), Array.from(vm.runInContext(symbol, c), row => row.id));
        }
    }
});
