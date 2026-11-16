const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), vm = require('node:vm'), path = require('node:path');
const root = path.resolve(__dirname, '../..');
function setup() {
    const saved = new Map();
    const c = vm.createContext({ window: {}, localStorage: {
        getItem: key => saved.get(key) ?? null, setItem: () => assert.fail('读取图鉴不应写存档')
    } });
    for (const file of ['Preset_Data/db_zzz.js','logic/catalog_utils.js','logic/game_data.js',
        'logic/gacha_engine.js','logic/dashboard_validation.js','logic/simulator_economy.js',
        'logic/simulator_start.js','logic/dashboard_accounts.js','ui/item_format.js']) {
        vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), c);
        Object.assign(c, c.window);
    }
    return { c, saved, utils:c.CatalogUtils, data:c.GameData };
}
const plain = value => JSON.parse(JSON.stringify(value));
test('固定 ID 优先于同名项和旧名称；不存在的明确 ID 不会串到其他物品', () => {
    const { utils } = setup();
    const one = {id:'old-local',presetId:'zzz_wep_tier_S_049',name:'新名',aliases:['旧名']};
    const two = {id:'second',name:'旧名'};
    const catalog = {wep:[two,one]};
    assert.equal(utils.findItem(catalog,'zzz_wep_tier_S_049'),one);
    assert.equal(utils.findItem(catalog,{itemId:'zzz_wep_tier_S_049',id:'second',name:'旧名'}),one);
    assert.equal(utils.findItem(catalog,'old-local'),one);
    assert.equal(utils.findItem(catalog,'旧名'),two);
    assert.equal(utils.findItem(catalog,{itemId:'deleted-id',name:'旧名'}),null);
});
test('旧图鉴按名字或别名补固定关联，保留本地 ID、自定义内容和存储原文', () => {
    const { data, saved } = setup();
    const source = data.getPreset('zzz').wep.find(item => item.name === '涅槃初翎');
    const custom = {id:'custom',name:'我的音擎',en:'Mine',img:'custom.webp',tierId:'tier_S'};
    const local = {wep:[{id:'legacy-engine',name:'菲欧妮 音擎',img:'old.webp'},custom]};
    const raw = JSON.stringify(local); saved.set('GM_Catalog_zzz',raw);
    const catalog = data.loadCatalog('zzz');
    const item = catalog.wep.find(item => item.id === 'legacy-engine');
    assert.equal(item.presetId,source.id); assert.equal(item.name,'涅槃初翎');
    assert.ok(item.aliases.includes('菲欧妮 音擎'));
    assert.equal(catalog.wep.find(item => item.id === 'custom').img,'custom.webp');
    assert.equal(saved.get('GM_Catalog_zzz'),raw);
    assert.deepEqual(plain(data.refreshPresetCatalog('zzz',catalog)),plain(catalog));
});
test('预设改名换图后按 ID 更新；旧记录正确显示中英文，自定义覆盖保留', () => {
    const { c, data, utils, saved } = setup();
    const old = data.getPreset('zzz').char.find(item => item.name === '猫又');
    saved.set('GM_Catalog_zzz',JSON.stringify({char:[{...old,id:'legacy-cat',presetId:old.id}]}));
    vm.runInContext(`Object.assign(ZZZ_CHAR.find(item=>item.id===${JSON.stringify(old.id)}),{name:'新版名称',en:'New English',short:'新',eshort:'New',img:'new.webp'})`,c);
    const catalog = data.loadCatalog('zzz'), row = utils.findItem(catalog,old.id);
    assert.equal(row.name,'新版名称'); assert.equal(row.img,'new.webp');
    assert.equal(row.id,'legacy-cat'); assert.ok(row.aliases.includes(old.name));
    assert.equal(utils.findItem(catalog,old.short),row);
    assert.equal(utils.findItem(catalog,old.eshort),row);
    const format = c.ItemFormat.create({getCatalog:()=>catalog,getLang:()=> 'en'});
    assert.equal(format.getItemName({itemId:old.id,name:old.name,en:'Stale English'}),'New English');
    assert.equal(format.getItemShort({itemId:old.id,name:old.name}),'New');
    const custom = data.refreshPresetCatalog('zzz',{char:[{...old,presetId:old.id,en:'My English',presetOverrides:['en']}]});
    assert.equal(custom.char[0].en,'My English');
    assert.equal(custom.char[0].name,'新版名称');
});
test('新抽卡、吃保底井和额外井礼物携带固定 ID；结果结算保留旧持有键', async () => {
    const { c } = setup();
    const item = {id:'legacy-local',presetId:'zzz_char_tier_S_001',name:'新名',short:'新',tierId:'tier_S',category:'char',tags:['up']};
    const rules = {tiers:[{id:'tier_S',prob:100,isGold:true}],pities:[],sparkRules:[]};
    const create = rule => c.GachaEngine.create({rules:{...rules,...rule},activeTiers:rules.tiers,
        targetGoldIds:['tier_S'],selections:{tier_S:{up:[item.presetId],std:[],spec:[]}},allCatalogItems:[item]});
    const result = (await create().draw(c.GachaEngine.createState(),1))[0];
    assert.equal(result.itemId,item.presetId); assert.equal(result.name,item.name);
    const spark = {type:'once',limit:1,targetType:'random_up'};
    const replacement = (await create({sparkRules:[spark]}).draw(c.GachaEngine.createState(),1))[0];
    assert.equal(replacement.isSpark,true); assert.equal(replacement.itemId,item.presetId);
    const state = c.GachaEngine.createState();
    await create({sparkRules:[{...spark,noReset:true}]}).draw(state,1);
    assert.equal(state.events.pendingGifts[0].itemId,item.presetId);
    const economy = c.SimulatorEconomy.create({economy:{resources:[],incomes:[]},overflowRules:{char:5}});
    const balance = c.SimulatorEconomy.createState();
    const key = JSON.stringify(['char',item.id]); balance.owned[key]=2;
    economy.settle(balance,[{...result,name:'旧名'}],[item],'char_up');
    assert.equal(balance.owned[key],3); assert.equal(Object.keys(balance.owned).length,1);
});
test('历史校验通过 ID 找更名条目；未知 ID 保留缺失提示，不猜测同名物品', () => {
    const { c } = setup();
    const catalog={char:[{id:'cat',name:'新名',short:'新',tierId:'tier_S',tags:['up']}]};
    const options={rules:{tiers:[{id:'tier_S',prob:100,isGold:true}],pities:[]},activeTiers:[{id:'tier_S',name:'S'}],targetGoldIds:['tier_S'],catalog};
    const valid = c.DashboardValidation.validateHistory([{itemId:'cat',name:'旧名',tierId:'tier_S'}],options);
    assert.ok(!valid.entries[0].errors.some(error=>error.key==='cd_err_catalog_missing'));
    const missing = c.DashboardValidation.validateHistory([{itemId:'deleted',name:'新名',tierId:'tier_S'}],options);
    assert.ok(missing.entries[0].errors.some(error=>error.key==='cd_err_catalog_missing'));
});
test('邦布 ID 前缀更名兼容旧编号，旧候选和持有计数不会分裂', async () => {
    const {c,data,utils,saved}=setup();
    const source=data.getPreset('zzz').pet[0],oldId=source.id.replace('zzz_bangboo_','zzz_pet_');
    assert.match(source.id,/^zzz_bangboo_tier_/);assert.ok(source.legacyIds.includes(oldId));
    const fresh=data.loadCatalog('zzz');
    assert.equal(utils.findItem(fresh,oldId).id,source.id);
    const rule={tiers:[{id:'tier_S',prob:100,isGold:true}],pities:[]};
    for(const local of [
        {id:oldId,name:'旧名称',presetId:oldId},
        {id:'random-local',name:source.name,presetId:oldId},
        {id:'random-unlinked',name:source.name},
        {id:source.id,name:source.name}
    ]){
        saved.set('GM_Catalog_zzz',JSON.stringify({pet:[{...local,tierId:'tier_S'}]}));
        const pet=data.loadCatalog('zzz').pet[0],key=JSON.stringify(['pet',local.id.startsWith('random-')?local.id:oldId]);
        assert.equal(pet.id,local.id);assert.equal(pet.presetId,source.id);
        assert.equal(utils.findItem([pet],{itemId:oldId}).name,source.name);
        const engine=c.GachaEngine.create({rules:rule,activeTiers:rule.tiers,targetGoldIds:['tier_S'],allCatalogItems:[pet],selections:{tier_S:{up:[oldId],std:[],spec:[]}}});
        const result=(await engine.draw(c.GachaEngine.createState(),1))[0];
        assert.equal(result.itemId,source.id);
        const economy=c.SimulatorEconomy.create({economy:{resources:[],incomes:[]}}),state=c.SimulatorEconomy.createState();
        state.owned[key]=2;economy.settle(state,[result,{...result,itemId:oldId}],[{...pet,category:'pet'}],'bangboo_up');
        assert.deepEqual(plain(state.owned),{[key]:4});
        assert.deepEqual(plain(c.DashboardAccounts.counts([{itemId:oldId},{itemId:source.id}],{pet:[pet]})),{[key]:2});
        for(const id of [oldId,source.id])assert.equal(c.SimulatorStart.poolCatalog([{...pet,category:'pet'}],{tier_S:{up:[id],std:[]}}).length,1);
    }
    saved.delete('GM_Catalog_zzz');
    const item=data.loadCatalog('zzz').pet[0],state=c.SimulatorEconomy.createState(),key=JSON.stringify(['pet',oldId]);
    state.owned[key]=3;c.SimulatorEconomy.create({economy:{resources:[],incomes:[]}}).settle(state,[{itemId:source.id}],[{...item,category:'pet'}],'bangboo_up');
    assert.equal(state.owned[key],4);assert.equal(Object.keys(state.owned).length,1);
});
