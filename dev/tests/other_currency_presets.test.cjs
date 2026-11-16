const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const read = file => fs.readFileSync(path.join(__dirname, '../..', file), 'utf8');
const plain = value => JSON.parse(JSON.stringify(value));
const setups = {};

for (const [id, prefix, caps, english] of [
    ['zzz', 'ZZZ', {char:7, wep:5, pet:5}, 'Polychrome'],
    ['ark', 'ARK', {char:6}, 'Originite Prime'],
    ['end', 'END', {char:6, wep:6}, 'Origeometry']
]) {
    let language = 'zh';
    const root = {innerHTML:'', querySelectorAll:()=>[]};
    const context = require('./icon_test_context.cjs').createContext({window:{addEventListener(){}}, document:{getElementById:()=>root, addEventListener(){}, documentElement:{setAttribute(){}}},
        localStorage:{getItem:()=>null}, sessionStorage:{getItem:()=>null}, readEngineEdit:()=>null,
        gameId:id, getLang:()=>language, galleryPreviewLock:{isLocked:()=>true}});
    const source = read(`Preset_Data/db_${id}.js`);
    assert.ok(source.indexOf(`const ${prefix}_SETUP_RULES`) < source.indexOf(`const ${prefix}_CURRENCY_RULES`));
    assert.ok(source.indexOf(`const ${prefix}_CURRENCY_RULES`) < source.indexOf(`const ${prefix}_POOL_RULES`));
    vm.runInContext(source, context);
    assert.ok(vm.runInContext(`${prefix}_CURRENCY_RULES.economy.exchanges.filter(row => ['staged','once_staged'].includes(row.mode)).every(row => !('toIds' in row) && row.stages.every(stage => stage.toIds.length))`, context), '预设阶梯只保留各档资源目标');
    vm.runInContext(read('logic/game_data.js'), context);
    assert.equal(vm.runInContext(`${prefix}_SETUP_RULES.overflowRules`, context), undefined);
    const data = context.GameData = context.window.GameData;
    const setup = data.getPresetSetup(id);
    assert.deepEqual(plain(setup.overflowRules), caps);
    for (const key of ['resources', 'exchanges', 'payments', 'incomes']) {
        assert.ok(setup.economy[key].length);
        assert.ok(setup.economy[key].every(row => row.name && row.en), `${id} ${key} 双语填写`);
    }
    context.gameInfo = {...setup, globalTiers:data.getPresetTiers(id)};
    vm.runInContext(read('pages/gallery_economy.js'), context);
    assert.deepEqual(Array.from(context.window.GalleryEconomy.validate()), [], `${id} 完整引用和数量验证`);
    context.window.GalleryEconomy.render();
    assert.ok(root.innerHTML.includes(setup.economy.resources[0].name));
    language = 'en'; context.window.GalleryEconomy.render();
    assert.ok(root.innerHTML.includes(english), `${id} 英文跟随游戏内容语言`);
    setups[id] = plain(setup);
    setup.economy.resources[0].name = 'changed'; setup.overflowRules.char = 99;
    assert.deepEqual(plain(data.getPresetSetup(id).overflowRules), caps);
    assert.notEqual(data.getPresetSetup(id).economy.resources[0].name, 'changed');
    // 侧栏预设初始化同样写入货币规则；没有 DOM 时只执行初始化函数。
    const cache = new Map(); context.localStorage = {getItem:key=>cache.get(key)??null, setItem:(key,value)=>cache.set(key,value)};
    context.window.location = {pathname:'/currency_setup.html', search:`?gameId=${id}`};
    vm.runInContext(read('logic/preset_storage.js'), context);
    context.window.PresetStorage.initialize(id);
    const initialized = JSON.parse(cache.get('GM_Info_'+id));
    assert.deepEqual(initialized.economy, setups[id].economy);
    assert.deepEqual(initialized.overflowRules, caps);
}

const byId = (game, list, id) => setups[game].economy[list].find(row=>row.id===id);
assert.equal(byId('zzz','payments','polychrome_pull').cost,160);
assert.ok(!byId('zzz','payments','polychrome_pull').poolIds.includes('bangboo_up'));
assert.equal(byId('zzz','incomes','bangboo_s').overflowAmount,125);
assert.equal(byId('zzz','incomes','bangboo_a').overflowAmount,25);
assert.deepEqual(byId('zzz','incomes','bangboo_engine_b').poolIds,['bangboo_up']);
assert.ok(!byId('zzz','incomes','engine_b').poolIds.includes('bangboo_up'));
assert.ok(setups.zzz.economy.incomes.filter(row=>row.categoryIds?.includes('char')).every(row=>['duplicate_no_overflow','overflow'].includes(row.condition)));
for (const [id, total, ticket, ten] of [
    ['distinction_permits',258,'permit','ten_permit'],
    ['distinction_kernel',216,'kernel_permit','kernel_ten'],
    ['universal_kernel',2580,'kernel_permit','kernel_ten']
]) {
    const stages = byId('ark','exchanges',id).stages;
    assert.equal(stages.reduce((sum,row)=>sum+row.cost,0),total);
    assert.equal(stages.reduce((sum,row)=>sum+row.gain*(row.toIds[0]===ten?10:1),0),38);
    assert.deepEqual(stages.map(row=>row.toIds[0]),[ticket,ticket,ticket,ten,ten]);
}
assert.ok(!setups.ark.economy.exchanges.some(row=>row.from==='orundum'),'合成玉直接支付，不虚构换票');
assert.equal(byId('ark','incomes','ordinary_6_overflow').amount,25);
assert.equal(byId('ark','exchanges','commendation_phase2_permit').cost,450);
assert.equal(byId('ark','exchanges','commendation_phase2_permit').limit,2);
assert.equal(byId('ark','exchanges','commendation_phase3_orundum').cost,50);
assert.equal(byId('ark','exchanges','commendation_phase3_orundum').gain,30);
for(const id of ['commendation_phase2_permit','commendation_phase3_orundum']) {
    const rule=byId('ark','exchanges',id);
    assert.equal(rule.hasPrerequisite,true);assert.ok(rule.prerequisite&&rule.prerequisiteEn);
}
assert.ok(setups.ark.economy.incomes.filter(row=>row.id.startsWith('ordinary_')).every(row=>!row.poolIds.includes('std_2')));
assert.ok(setups.ark.economy.incomes.filter(row=>row.id.startsWith('kernel_')).every(row=>row.poolIds.length===1&&row.poolIds[0]==='std_2'));
const weaponPay = byId('end','payments','arsenal_ten');
assert.equal(weaponPay.cost,1980); assert.equal(weaponPay.pulls,10);
assert.deepEqual(weaponPay.poolIds,['wep_up']);
assert.deepEqual(['tier_6','tier_5','tier_4'].map(tier=>byId('end','incomes','arsenal_'+tier).amount),[2000,200,20]);
assert.equal(byId('end','incomes','token_5').amount,20);
assert.equal(byId('end','exchanges','bond_to_permit').cost,25);
assert.ok(!setups.end.economy.exchanges.some(row=>row.from==='aic_quota'&&row.mode==='monthly'),'当期折扣不能伪装成月限购');
console.log('PASS：三游戏货币预设位置、双语、引用校验、初始化迁移、兑换阶梯及卡池返还范围');
