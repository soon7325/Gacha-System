const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const root = path.resolve(__dirname, '../..');
const plain = value => JSON.parse(JSON.stringify(value));
function setup() {
    const saved = new Map();
    const context = vm.createContext({ window: {}, localStorage: {
        getItem: key => saved.get(key) ?? null,
        setItem() { assert.fail('Catalog reads must not write storage'); }
    } });
    for (const file of ['Preset_Data/db_zzz.js', 'Preset_Data/db_hsr.js', 'logic/catalog_utils.js', 'logic/game_data.js', 'logic/gacha_engine.js']) {
        vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context);
        Object.assign(context, context.window);
    }
    return { context, saved, data: context.GameData, utils: context.CatalogUtils };
}

test('挽昼是唯一 S 级候选并直接引用 GIF；新增代理人及借用音擎有英文且素材存在', () => {
    const { data } = setup(), preset = data.getPreset('zzz');
    const sunbringer = preset.char.filter(item => item.name === '挽昼');
    assert.equal(sunbringer.length, 1);
    assert.equal(sunbringer[0].en, 'Sunbringer');
    assert.equal(sunbringer[0].tierId, 'tier_S');
    assert.equal(sunbringer[0].img, 'img/ZZZ/char/5/挽昼.gif');
    assert.equal(preset.char.filter(item => item.img === sunbringer[0].img).length, 1);
    const gif = fs.readFileSync(path.join(root, sunbringer[0].img));
    assert.match(gif.subarray(0, 6).toString(), /^GIF8[79]a$/);
    const expected = {
        挽昼: 'Sunbringer', 知更鸟: 'Robin', 卡芙卡: 'Kafka',
        菲欧妮: 'Phoenix Reffaella', 赛维里安: 'Severian Lowell',
        涅槃初翎: 'Plume of Rebirth', 禁罪囚笼: 'Incarcerating Grip',
        夜色流光溢彩: 'Flowing Nightglow', 只需等待: 'Patience Is All You Need',
        '挽昼 音擎': "Sunbringer's W-Engine"
    };
    for (const [name, english] of Object.entries(expected)) {
        const item = preset.db.find(item => item.name === name);
        assert.equal(item.en, english, name);
        assert.ok(fs.existsSync(path.join(root, item.img)), item.img);
    }
    for (const name of ['涅槃初翎', '禁罪囚笼', '挽昼 音擎']) assert.equal(preset.wep.find(item => item.name === name).img, 'img/ZZZ/weapon/5/涅槃初翎.webp');
});

test('旧缓存补齐新增条目与更正信息，保留 ID 和无关物品；旧占位名仍可检索且不重复抽取', async () => {
    const { data, utils, saved, context } = setup();
    const local = { char: [{ id: 'phoenix', name: '菲欧妮', en: 'Phoenix', tags: ['up'], img: 'old.webp' },
        { id: 'unrelated', name: '本地附加物品', en: 'Local item', tags: ['std'], img: 'local.png' }],
        wep: [{ id: 'legacy-engine', name: '菲欧妮 音擎', en: 'Phoe', img: 'img/ZZZ/weapon/5/绯月银棺.webp' },
            { id: 'also-imported', name: '涅槃初翎', en: 'Outdated' }] };
    saved.set('GM_Catalog_zzz', JSON.stringify(local));
    const before = saved.get('GM_Catalog_zzz'), catalog = data.loadCatalog('zzz');
    assert.equal(utils.findItem(catalog, '菲欧妮').id, 'phoenix');
    assert.equal(utils.findItem(catalog, '菲欧妮').en, 'Phoenix Reffaella');
    assert.deepEqual(plain(utils.findItem(catalog, '本地附加物品')), { ...local.char[1], short: '本地附加物品', eshort: 'Local item', tierId: 'tier_S' });
    const engine = utils.findItem(catalog, '菲欧妮 音擎');
    assert.equal(engine.name, '涅槃初翎'); assert.equal(engine.id, 'legacy-engine');
    assert.equal(catalog.wep.filter(item => item.name === '涅槃初翎').length, 1);
    assert.equal(utils.findItem(catalog, '赛维里安 音擎').name, '禁罪囚笼');
    assert.equal(utils.findItem(catalog, '赛维里安 音擎', { fields: ['en'] }), null);
    for (const name of ['挽昼', '知更鸟', '卡芙卡']) assert.ok(utils.findItem(catalog, name));
    assert.equal(saved.get('GM_Catalog_zzz'), before);
    assert.deepEqual(plain(data.refreshPresetCatalog('zzz', catalog)), plain(catalog));
    const rules = data.getPresetRules('zzz').wep_up;
    rules.sparkRules = [{ type: 'once', limit: 1, targetType: 'random_up' }];
    const tiers = data.getPresetTiers('zzz');
    const model = context.GachaEngine.create({ rules, activeTiers: rules.tiers.map(tier => ({ ...tiers.find(row => row.id === tier.id), ...tier })), targetGoldIds: ['tier_S'],
        selections: { tier_S: { up: ['菲欧妮 音擎'] } }, allCatalogItems: data.flattenCatalog(catalog), random: () => 0.5 });
    const results = await model.draw(context.GachaEngine.createState(), 2);
    assert.equal(results.find(item => item.isSpark).name, '涅槃初翎');
    saved.set('GM_Catalog_custom', JSON.stringify(local));
    assert.equal(data.loadCatalog('custom').char.length, local.char.length);
    assert.equal(data.loadCatalog('custom').wep[0].name, '菲欧妮 音擎');
});
