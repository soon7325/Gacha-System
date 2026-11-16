const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const read=file=>fs.readFileSync(path.join(__dirname,'../..',file),'utf8'),plain=value=>JSON.parse(JSON.stringify(value));
function setup(on=false){
 const store=new Map(on?[['GM_Show_Test_Catalog','true']]:[]),listeners={},redirects=[];
 const location={href:'http://localhost/index.html',replace:url=>redirects.push(url)};
 const c=require('./icon_test_context.cjs').createContext({URL,window:{location,addEventListener:(event,callback)=>listeners[event]=callback},document:{documentElement:{hidden:false}},localStorage:{getItem:key=>store.get(key)??null,setItem:(key,value)=>store.set(key,value)}});
 for(const file of ['logic/test_catalog.js','Preset_Data/db_zzz.js','Preset_Data/db_test.js','logic/catalog_utils.js','logic/game_data.js','logic/gacha_engine.js','logic/simulator_start.js','logic/user_data_profiles.js','logic/simulator_economy.js','logic/dashboard_validation.js']){vm.runInContext(read(file),c,{filename:file});Object.assign(c,c.window);}
 return {c,store,listeners,redirects,api:c.GameData};
}
test('测试预设默认隐藏，开启后可读取；关闭及跨页变化隐藏直接链接并保留所有账户数据',()=>{
 const h=setup(),gate=h.c.TestCatalog;assert.equal(gate.enabled(),false);assert.equal(h.api.getPreset('test'),null);assert.equal(gate.visible('zzz'),true);
 h.store.set('GM_Show_Test_Catalog','true');assert.equal(h.api.getPresetSetup('test').gameName,'测试专用');assert.equal(gate.visible('test'),true);
 h.store.set('GM_Sim_Profiles_test','keep accounts');h.store.set('GM_Data_test_char_up','keep history');h.store.set('GM_Start_Page','dashboard.html?gameId=test&pool=char_up');
 h.store.set('GM_Show_Test_Catalog','false');h.c.window.location.href='http://localhost/user_data.html?gameId=test';h.listeners.storage({key:'GM_Show_Test_Catalog'});
 assert.deepEqual(h.redirects,['index.html']);assert.equal(h.c.document.documentElement.hidden,true);assert.equal(h.store.get('GM_Start_Page'),'index.html');assert.equal(h.store.get('GM_Sim_Profiles_test'),'keep accounts');assert.equal(h.store.get('GM_Data_test_char_up'),'keep history');
});
test('快速初始化默认使用测试图鉴；关闭显示开关时仍可克隆，且不会开启测试入口或修改原件',async()=>{
 const h=setup(),writes=new Map(),nodes={'select-preset-template':{value:'test'},'input-game-name':{value:''}};
 const html=read('gallery_setup.html'),options=html.match(/<select id="select-preset-template"[\s\S]*?<\/select>/)[0];
 assert.match(options,/<option value="test"[^>]*selected>测试专用<\/option>\s*<option value="hsr"/);
 assert.equal(h.api.getPreset('test'),null);
 const source=h.api.getPreset('test',{includeHidden:true});assert.equal(source.db.length,h.api.getPreset('zzz').db.length);
 let begun=0,dirty=0;
 Object.assign(h.c,{gameId:'custom-template',gameInfo:{categories:[]},catalog:{},galleryPreviewLock:{isLocked:()=>false},
  showConfirmModal:async()=>true,beginEngineImport:()=>begun++,writeEngineEdit:(key,value)=>writes.set(key,value),
  getLang:()=> 'zh',normalizeCatalogTags:tags=>tags,getActiveTagDefinitions:()=>[],
  renderGlobalTiers(){},renderCustomTags(){},renderCustomPoolsList(){},renderCategories(){},updateImportVisibility(){},markPageDirty:()=>dirty++,showToast(){}});
 h.c.window.getTrans=key=>key;h.c.document.getElementById=id=>nodes[id];
 const script=read('pages/gallery_setup.js'),start=script.indexOf('window.importFromExistingPreset ='),end=script.indexOf('// 判定当前图鉴是否为空',start);
 vm.runInContext(script.slice(start,end),h.c);await h.c.window.importFromExistingPreset();
 assert.equal(begun,1);assert.equal(dirty,1);assert.equal(h.c.gameInfo.gameName,'测试专用');assert.equal(h.c.gameInfo.enGameName,'Feature Test Lab');
 assert.equal(Object.values(h.c.catalog).flat().length,source.db.length);assert.ok(writes.has('GM_Rules_custom-template_char_up'));
 assert.equal(h.c.gameInfo.economy.exchanges.length,source.setup.economy.exchanges.length);
 h.c.catalog.char[0].name='Changed';assert.equal(h.api.getPreset('test',{includeHidden:true}).db[0].name,source.db[0].name);
 assert.equal(h.c.TestCatalog.enabled(),false);assert.equal(h.api.getPreset('test'),null);assert.equal(h.store.has('GM_Info_custom-template'),false);
});

test('绝区零全部素材复用但深拷贝隔离，图片全部存在，规则和经济配置具备双语名称',()=>{
 const h=setup(true),preset=h.api.getPreset('test'),source=h.api.getPreset('zzz');assert.equal(preset.db.length,source.db.length);
 assert.deepEqual(preset.db.map(row=>row.img),source.db.map(row=>row.img));assert.ok(preset.db.every(row=>fs.existsSync(path.join(__dirname,'../..',row.img))));
 preset.db[0].name='Changed';preset.rules.char_up.pities[0].pulls=1;assert.notEqual(h.api.getPreset('test').db[0].name,'Changed');assert.equal(h.api.getPreset('zzz').rules.char_up.pities[0].pulls,90);
 assert.ok(Object.keys(preset.rules).length>=10);assert.ok(Object.values(preset.rules).every(row=>row.info.name&&row.info.en));
 for(const list of ['resources','exchanges','unlockGroups','payments','incomes'])assert.ok(preset.setup.economy[list].every(row=>row.name&&row.en));
});
test('测试数据库货币配置通过真实编辑器验证，全部功能分组及卡池引用有效',()=>{
 const h=setup(true),root={innerHTML:'',querySelectorAll:()=>[]};Object.assign(h.c,{gameInfo:h.api.getPresetSetup('test'),gameId:'test',getLang:()=> 'zh',readEngineEdit:()=>null,sessionStorage:{getItem:()=>null},galleryPreviewLock:{isLocked:()=>true}});
 h.c.gameInfo.globalTiers=h.api.getPresetTiers('test');h.c.document.getElementById=()=>root;
 vm.runInContext(read('pages/gallery_economy.js'),h.c);assert.deepEqual(plain(h.c.window.GalleryEconomy.validate()),[]);
 h.c.window.GalleryEconomy.render();assert.match(root.innerHTML,/前置条件/);assert.match(root.innerHTML,/共享第二层/);
});
test('测试常驻池保留加密母带前置和必经阶梯，但不扩散至无关限定券补给及普通兑换',()=>{
 const h=setup(true),info=h.api.getPresetSetup('test'),service=h.c.SimulatorEconomy.create(info),state=h.c.SimulatorEconomy.createState();
 for(const id of ['mixed_std','spec_std']){
  const scope=service.resourceScope(id),first=scope.exchanges.find(row=>row.id==='test_first_tape');
  assert.ok(first);assert.deepEqual(plain(scope.targets(state,first)),['encrypted_tape']);
  const grant=scope.incomes.map(row=>row.id);
  assert.ok(!grant.includes('test_grant_encrypted_tape'));assert.ok(!grant.includes('test_signin'));
  for(const row of scope.exchanges.filter(row=>['fixed','monthly'].includes(row.mode)&&row.id!=='test_first_tape'))assert.ok(!scope.targets(state,row).includes('encrypted_tape'),row.id);
  const mandatory=scope.exchanges.find(row=>row.id==='test_once_stages');assert.ok(mandatory);
  assert.deepEqual(plain(scope.targets(state,mandatory)),['encrypted_tape']);
  const optional=scope.exchanges.find(row=>row.mode==='staged');assert.ok(optional);
  assert.deepEqual(plain(scope.targets(state,optional)),['master_tape']);
 }
 const limited=service.resourceScope('char_up');assert.ok(limited.incomes.some(row=>row.id==='test_grant_encrypted_tape'));
 const all=service.resourceScope();assert.ok(all.incomes.some(row=>row.id==='test_signin'));
 info.economy.unlockGroups.find(row=>row.id==='test_month_group').costs.push({resourceId:'encrypted_tape',amount:1});
 const consumed=h.c.SimulatorEconomy.create(info).resourceScope('mixed_std');
 assert.ok(consumed.incomes.some(row=>row.id==='test_grant_encrypted_tape'),'若解锁费用实际消耗限定券，则仍开放其来源');
});

test('各测试卡池可执行抽卡并返回图鉴内物品，井、赠送和规则流水与检测器一致',async()=>{
 const h=setup(true),source=h.api.loadCatalog('test'),all=h.api.flattenCatalog(source),global=h.api.getPresetTiers('test'),rules=h.api.getPresetRules('test');let total=0;
 for(const [id,rule] of Object.entries(rules)){
  const context=h.c.UserDataProfiles.context('test',id),active=rule.tiers.map(tier=>({...global.find(row=>row.id===tier.id),...tier})),selections={};
  for(const tier of active){const items=context.catalog.filter(row=>row.tierId===tier.id),up=items.filter(row=>row.startGroup==='up');selections[tier.id]={up:up.slice(0,rule.preSelect.tiers[tier.id]?.upMax??1).map(row=>row.name),std:items.filter(row=>row.startGroup==='std').map(row=>row.name),spec:items.filter(row=>row.startGroup==='std').slice(0,1).map(row=>row.name)};}
  let seed=42;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const engine=h.c.GachaEngine.create({rules:rule,activeTiers:active,targetGoldIds:context.targetGoldIds,minorPities:context.minorPities,selections,allCatalogItems:all,pureCatalog:source,globalTiers:global,random,selectSpark:async rows=>rows[0].name});
  const state=h.c.GachaEngine.createState(context.minorPities.length),history=await engine.draw(state,100);total+=history.length;
  assert.ok(history.length>=100,id);assert.ok(history.every(row=>all.some(item=>item.name===row.name)),id+' contains placeholder result');
  const report=h.c.DashboardValidation.validateHistory(history,{rules:rule,activeTiers:active,targetGoldIds:context.targetGoldIds,minorPities:context.minorPities,catalog:source,isStdPool:id.includes('std')});
  assert.deepEqual(plain(report.entries.filter(row=>row.errors.length).map(row=>({index:row.index,errors:row.errors}))),[],id);
 }
 assert.ok(total>=1000);
});
test('测试货币补给、共用770解锁、双资源永久解锁、阶梯和周期重置可完整执行',()=>{
 const h=setup(true),service=h.c.SimulatorEconomy.create(h.api.getPresetSetup('test')),state=h.c.SimulatorEconomy.createState();
 assert.deepEqual(plain(state.balances),{});service.claim(state,'test_grant_test_token');service.claim(state,'test_grant_polychrome');
 service.exchange(state,'test_first_tape','encrypted_tape',2);service.exchange(state,'test_first_film','polychrome',6);assert.equal(state.balances.test_token,19280);
 service.unlock(state,'test_month_group');assert.equal(state.balances.test_token,18510);service.exchange(state,'test_second_tape','master_tape');service.exchange(state,'test_second_film','polychrome');assert.equal(state.balances.test_token,18480);
 service.exchange(state,'test_once_stages','encrypted_tape');service.exchange(state,'test_once_stages','test_ten');service.unlock(state,'test_permanent_group');service.exchange(state,'test_once_exchange','test_ten');
 service.reset(state,'monthly');assert.equal(service.groupStatus(state,'test_month_group').unlocked,false);assert.equal(service.groupStatus(state,'test_permanent_group').unlocked,true);
});

test('四个默认游戏独立显示开关默认开启，隐藏保留数据并过滤启动链接',()=>{
 const h=setup(),gate=h.c.TestCatalog;
 for(const id of ['hsr','zzz','ark','end']){
  assert.equal(gate.visible(id),true);const key=gate.presetKeys[id];assert.equal(gate.isVisibilityKey(key),true);
  h.store.set('GM_Info_'+id,'saved rules');h.store.set(key,'false');assert.equal(gate.visible(id),false);assert.equal(gate.hiddenUrl('simulator.html?gameId='+id+'&pool=std'),true);assert.equal(h.store.get('GM_Info_'+id),'saved rules');
  h.store.set(key,'true');assert.equal(gate.visible(id),true);
 }
 assert.equal(gate.visible('custom'),true);assert.equal(gate.visible('test'),false);
});
test('侧栏排序保留隐藏预设的位置和元数据',()=>{
 const source=read('ui/layout.js'),start=source.indexOf('        const targetGame = existingGames[toIdx]'),end=source.indexOf('        renderSidebar();',start);
 let saved;const c=require('./icon_test_context.cjs').createContext({fromIdx:0,toIdx:1,before:false,existingGames:[{id:'hsr'},{id:'custom'}],allExistingGames:[{id:'hsr'},{id:'zzz',name:'hidden'},{id:'custom'}],localStorage:{setItem:(key,value)=>saved=JSON.parse(value)}});
 vm.runInContext(source.slice(start,end),c);assert.deepEqual(saved,[{id:'custom'},{id:'zzz',name:'hidden'},{id:'hsr'}]);
});
