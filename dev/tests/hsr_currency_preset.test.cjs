const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');const vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../../Preset_Data/db_hsr.js'),'utf8');
assert.ok(source.indexOf('const HSR_SETUP_RULES')<source.indexOf('const HSR_CURRENCY_RULES'));
assert.ok(source.indexOf('const HSR_CURRENCY_RULES')<source.indexOf('const HSR_POOL_RULES'));
let language='zh';const root={innerHTML:'',querySelectorAll:()=>[]};
const context=require('./icon_test_context.cjs').createContext({window:{},document:{getElementById:()=>root,addEventListener(){}},localStorage:{getItem:()=>null},
    readEngineEdit:()=>null,sessionStorage:{getItem:()=>null},gameId:'hsr',getLang:()=>language,galleryPreviewLock:{isLocked:()=>true}});
vm.runInContext(source,context);
vm.runInContext(fs.readFileSync(path.join(__dirname,'../../logic/game_data.js'),'utf8'),context);
assert.equal(vm.runInContext('HSR_SETUP_RULES.overflowRules',context),undefined);
const data=context.GameData=context.window.GameData;
const setup=data.getPresetSetup('hsr');
assert.deepEqual(JSON.parse(JSON.stringify(setup.overflowRules)),{char:7,wep:5});
assert.equal(setup.economy.resources.length,6);assert.equal(setup.economy.exchanges.length,4);
assert.equal(setup.economy.payments.length,3);assert.equal(setup.economy.incomes.length,8);
for(const key of ['resources','exchanges','payments','incomes']) {
    assert.ok(setup.economy[key].every(row=>row.name&&row.en),'游戏内容名称必须同时填写中英');
    assert.equal(new Set(setup.economy[key].map(row=>row.id)).size,setup.economy[key].length);
}
assert.ok(setup.economy.incomes.filter(row=>row.categoryIds?.includes('char')).every(row=>['duplicate_no_overflow','overflow'].includes(row.condition)),'角色首次不发星芒，重复与溢出不重叠');
assert.equal(setup.economy.incomes.find(row=>row.id==='char_4_overflow').resourceId,'starlight');
assert.equal(setup.economy.exchanges.find(row=>row.mode==='monthly').limit,5);
context.gameInfo={...setup,globalTiers:data.getPresetTiers('hsr')};
vm.runInContext(fs.readFileSync(path.join(__dirname,'../../pages/gallery_economy.js'),'utf8'),context);
assert.deepEqual(Array.from(context.window.GalleryEconomy.validate()),[],'真实预设通过所有资源、卡池、图鉴和数量校验');
context.window.GalleryEconomy.render();assert.match(root.innerHTML,/未熄的星芒/);
language='en';context.window.GalleryEconomy.render();assert.match(root.innerHTML,/Undying Starlight/);assert.match(root.innerHTML,/Star Rail Special Pass/);
context.gameInfo.economy.resources[0].name='changed';context.gameInfo.overflowRules.char=99;
assert.equal(data.getPresetSetup('hsr').economy.resources[0].name,'星琼');assert.equal(data.getPresetSetup('hsr').overflowRules.char,7);
console.log('PASS：崩铁货币预设位置、满阶迁移、双语、返还范围、完整引用校验与独立副本');
