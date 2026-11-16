const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../../pages/currency_setup.js'), 'utf8');
function page(search, saved = {}, drafts = {}, preset = null) {
    const local = new Map(Object.entries(saved));
    const session = new Map(Object.entries(drafts));
    let locked = false, valid = true;
    const storage = map => ({ getItem: key => map.get(key) ?? null, setItem: (key, value) => map.set(key, value) });
    const context = vm.createContext({
        window: { location: {search} }, document: { addEventListener() {} }, URLSearchParams,
        localStorage: storage(local), sessionStorage: storage(session),
        ItemFormat: {getLanguage: () => 'zh'}, GameData: {getPresetSetup: () => preset, getPresetTiers: () => []},
        PreviewLock: {create: options => ({isLocked: () => locked || options.isPreset()})},
        PRESET_GAME_IDS: ['official'], Toast: {create: () => ({show() {}})},
        UnsavedChanges: {createTracker: () => ({hasChanges: () => true, reset() {}}), create: () => ({})},
        GalleryEconomy: {validateForSave: () => valid}, showToast() {}
    });
    vm.runInContext(source, context);
    return {context, local, session, lock: value => {locked = value;}, validity: value => {valid = value;}};
}
const initial = {gameName: 'Test', categories: [{id:'mount',name:'坐骑'}], globalTiers: [], tagDefinitions:{up:{name:'UP'}}, economy:{version:1,resources:[]}, overflowRules:{mount:8}};
const officialNew={...initial,economy:{version:1,resources:[{id:'latest',name:'新预设'}]}};
const officialCached=page('?gameId=official',{GM_Info_official:JSON.stringify(initial)},{},officialNew);
assert.equal(vm.runInContext('gameInfo.economy.resources[0].id',officialCached.context),'latest','官方货币规则优先于旧缓存');
// 直接打开已保存游戏时，仅更新货币和满阶字段。
const direct = page('?gameId=test', {GM_Info_test: JSON.stringify(initial)});
vm.runInContext('gameInfo.economy.resources.push({id:"ticket",name:"限定票",poolIds:["limited","collab"]})', direct.context);
assert.equal(vm.runInContext('saveCurrencyRules()', direct.context), true);
const result = JSON.parse(direct.local.get('GM_Info_test'));
assert.deepEqual(result.categories, initial.categories);
assert.deepEqual(result.tagDefinitions, initial.tagDefinitions);
assert.deepEqual(result.economy.resources[0].poolIds, ['limited', 'collab']);
// 无效配置和锁定状态均不能写入。
const previous = direct.local.get('GM_Info_test');
direct.validity(false);
assert.equal(vm.runInContext('saveCurrencyRules()', direct.context), false);
direct.validity(true); direct.lock(true);
assert.equal(vm.runInContext('saveCurrencyRules()', direct.context), false);
assert.equal(direct.local.get('GM_Info_test'), previous);
// 旧的 draft 链接兼容打开，但保存直接进入正式货币字段，不恢复旧图鉴草稿。
const child = page('?gameId=test&draft=old', {GM_Info_test: JSON.stringify(initial)});
vm.runInContext('gameInfo.economy.resources.push({id:"gift",name:"赠送票"})', child.context);
const concurrent = {...initial, gameName:'另一个页面的新名称', categories:[{id:'vehicle',name:'载具'}]};
child.local.set('GM_Info_test',JSON.stringify(concurrent));
assert.equal(vm.runInContext('saveCurrencyRules()',child.context),true);
assert.equal(JSON.parse(child.local.get('GM_Info_test')).gameName,concurrent.gameName);
assert.deepEqual(JSON.parse(child.local.get('GM_Info_test')).categories,concurrent.categories);
assert.equal(vm.runInContext('currencyReturnUrl()',child.context),'user_data.html?gameId=test');
assert.equal(child.session.size,0);
const missing = page('?gameId=missing');
assert.equal(vm.runInContext('saveCurrencyRules()',missing.context),false);
const fresh = page('');
assert.equal(vm.runInContext('saveCurrencyRules()',fresh.context),false);
// 游戏被其他页面删除后禁止重新创建半套游戏记录。
const removed = page('?gameId=test',{GM_Info_test:JSON.stringify(initial)});
removed.local.delete('GM_Info_test');
assert.equal(vm.runInContext('saveCurrencyRules()',removed.context),false);
assert.equal(removed.local.size,0);
// 多选框入口同步关闭、退出 Tab 顺序；解除预览后恢复入口。
const preview = page('?gameId=test',{GM_Info_test:JSON.stringify(initial)});
const attrs={}, summary={tabIndex:0,setAttribute:(key,value)=>{attrs[key]=value;},blur(){this.blurred=true;}};
const group={open:true,querySelector:()=>summary},editor={disabled:false},save={},toggle={};
preview.context.document.activeElement=summary;
preview.context.document.getElementById=id=>id==='btn-currency-save'?save:toggle;
preview.context.document.querySelectorAll=selector=>selector==='#gallery-economy .eco-multi'?[group]:selector.includes('[draggable]')?[]:[editor];
preview.lock(true);vm.runInContext('syncGalleryReadonlyControls()',preview.context);
assert.equal(group.open,false);assert.equal(attrs['aria-disabled'],'true');assert.equal(summary.tabIndex,-1);assert.equal(summary.blurred,true);
assert.equal(editor.disabled,true);
preview.lock(false);vm.runInContext('syncGalleryReadonlyControls()',preview.context);
assert.equal(attrs['aria-disabled'],'false');assert.equal(summary.tabIndex,0);assert.equal(editor.disabled,false);
console.log('PASS：独立保存、保留并发图鉴更新、旧链接兼容、未保存游戏/删除游戏保护、校验和只读保护');
