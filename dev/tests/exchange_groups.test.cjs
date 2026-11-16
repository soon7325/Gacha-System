const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const read=file=>fs.readFileSync(path.join(__dirname,'../..',file),'utf8'),plain=value=>JSON.parse(JSON.stringify(value));
function setup(){
 const c=require('./icon_test_context.cjs').createContext({window:{}});vm.runInContext(read('Preset_Data/db_ark.js'),c);vm.runInContext(read('logic/simulator_economy.js'),c);
 const info=vm.runInContext('ARK_CURRENCY_RULES',c),api=c.window.SimulatorEconomy;
 return {c,info,api,state:api.createState(),service:api.create(info)};
}
function phase1(h){h.service.exchange(h.state,'commendation_orundum','orundum',6);h.service.exchange(h.state,'commendation_permit','permit',2);}
test('方舟先完成两项前置，再付770解锁；不满足、钱不足及重复解锁都不误扣款',()=>{
 const h=setup();h.state.balances.commendation=1489;
 let before=plain(h.state);assert.throws(()=>h.service.unlock(h.state,'commendation_phase2'),/prerequisite/);assert.deepEqual(plain(h.state),before);
 phase1(h);assert.equal(h.state.balances.commendation,769);assert.equal(h.service.groupStatus(h.state,'commendation_phase2').ready,false);
 before=plain(h.state);assert.throws(()=>h.service.unlock(h.state,'commendation_phase2'),/insufficient/);assert.deepEqual(plain(h.state),before);
 h.state.balances.commendation++;h.service.unlock(h.state,'commendation_phase2');assert.equal(h.state.balances.commendation,0);
 assert.equal(h.service.groupStatus(h.state,'commendation_phase2').unlocked,true);assert.equal(h.service.unlock(h.state,'commendation_phase2'),false);assert.equal(h.state.balances.commendation,0);
});
test('同组两个兑换共享一次解锁，各自仍单独支付兑换费用',()=>{
 const h=setup();h.info.economy.exchanges.push({id:'second',from:'commendation',toIds:['orundum'],mode:'monthly',cost:20,gain:10,limit:3,unlockGroupId:'commendation_phase2'});
 h.state.balances.commendation=5000;assert.throws(()=>h.service.exchange(h.state,'second','orundum'),/prerequisite/);
 phase1(h);h.service.unlock(h.state,'commendation_phase2');assert.equal(h.state.balances.commendation,3510);
 h.service.exchange(h.state,'commendation_phase2_permit','permit');h.service.exchange(h.state,'second','orundum');assert.equal(h.state.balances.commendation,3040);
});
test('第三层依赖第二层实际兑换，月重置清除月度解锁及计数，保留余额与永久解锁',()=>{
 const h=setup();h.state.balances.commendation=20000;phase1(h);h.service.unlock(h.state,'commendation_phase2');
 assert.throws(()=>h.service.unlock(h.state,'commendation_phase3'),/prerequisite/);h.service.exchange(h.state,'commendation_phase2_permit','permit',2);h.service.unlock(h.state,'commendation_phase3');
 h.info.economy.unlockGroups.push({id:'permanent',period:'once',costs:[],requirements:[]});h.service.unlock(h.state,'permanent');
 const balance=h.state.balances.commendation;h.service.reset(h.state,'monthly');assert.equal(h.state.balances.commendation,balance);
 assert.equal(h.service.groupStatus(h.state,'permanent').unlocked,true);assert.equal(h.service.groupStatus(h.state,'commendation_phase2').unlocked,false);
 assert.ok(h.service.groupStatus(h.state,'commendation_phase2').requirements.every(r=>r.count===0));
 phase1(h);h.service.unlock(h.state,'commendation_phase2');assert.equal(h.state.balances.commendation,balance-1490);
});
test('多个消耗资源合并校验后一次扣除，指定次数和目标分别计数，永久组按累计次数判断',()=>{
 const h=setup();h.info.economy.unlockGroups.push({id:'multi',period:'once',requirements:[{exchangeId:'commendation_permit',targetId:'permit',times:1}],costs:[{resourceId:'commendation',amount:2},{resourceId:'commendation',amount:3},{resourceId:'orundum',amount:10}]});
 h.state.balances.commendation=300;h.service.exchange(h.state,'commendation_permit','permit');let before=plain(h.state);
 assert.throws(()=>h.service.unlock(h.state,'multi'),/insufficient/);assert.deepEqual(plain(h.state),before);
 h.state.balances.orundum=10;h.service.reset(h.state,'monthly');assert.equal(h.service.groupStatus(h.state,'multi').requirements[0].count,1);
 h.service.unlock(h.state,'multi');assert.equal(h.state.balances.commendation,55);assert.equal(h.state.balances.orundum,0);
});
test('阶梯前置按完成档数判断，固定兑换可按次数解锁但不能指定无上限的兑换至上限',()=>{
 const h=setup();h.info.economy.unlockGroups.push({id:'stages',period:'monthly',requirements:[{exchangeId:'distinction_permits',all:true}],costs:[]});
 h.state.balances.distinction=258;for(let i=0;i<5;i++)h.service.exchange(h.state,'distinction_permits',i<3?'permit':'ten_permit');
 assert.equal(h.service.groupStatus(h.state,'stages').ready,true);h.service.unlock(h.state,'stages');h.service.reset(h.state,'monthly');
 assert.equal(h.service.groupStatus(h.state,'stages').requirements[0].count,0);
 h.info.economy.unlockGroups.push({id:'bad',period:'once',requirements:[{exchangeId:'originite_to_orundum',all:true}],costs:[]});
 assert.throws(()=>h.service.groupStatus(h.state,'bad'),/invalid_requirement/);
});
function editor(){
 let dirty=0,locked=false;const root={innerHTML:'',querySelectorAll:()=>[]};
 const c=require('./icon_test_context.cjs').createContext({window:{confirm:()=>true},document:{getElementById:()=>root},gameInfo:{categories:[],globalTiers:[]},gameId:'custom',getLang:()=> 'zh',GameData:{getPresetRules:()=>null},readEngineEdit:()=>null,sessionStorage:{getItem:()=>null},galleryPreviewLock:{isLocked:()=>locked},markPageDirty:()=>dirty++,showToast(){}});
 vm.runInContext(read('pages/gallery_economy.js'),c);const api=c.window.GalleryEconomy;api.render();
 const m=c.gameInfo.economy;m.resources.push({id:'a',name:'A'},{id:'b',name:'B'});
 m.unlockGroups.push({id:'group',name:'组',period:'monthly',requirements:[],costs:[{resourceId:'a',amount:770}]});
 m.exchanges.push({id:'first',name:'前置',mode:'monthly',from:'a',toIds:['b'],cost:40,gain:1,limit:6},{id:'second',name:'组内',mode:'fixed',from:'a',toIds:['b'],cost:1,gain:1,unlockGroupId:'group'});
 return {c,m,root,api,lock:()=>locked=true,marks:()=>dirty};
}
test('共享组配置渲染、双语字段与条件校验；拒绝循环、自引用、删除引用及无上限全换',async()=>{
 const h=editor();h.api.render();assert.match(h.root.innerHTML,/前置条件/);assert.match(h.root.innerHTML,/一次性解锁消耗/);assert.match(h.root.innerHTML,/770/);assert.deepEqual(plain(h.api.validate()),[]);
 const group=h.m.unlockGroups[0];group.requirements=[{exchangeId:'second',times:1}];assert.ok(h.api.validate().length);
 group.requirements=[{exchangeId:'first',all:true}];assert.deepEqual(plain(h.api.validate()),[]);
 h.m.unlockGroups.push({id:'other',name:'另一个',period:'monthly',requirements:[{exchangeId:'second',times:1}],costs:[]});h.m.exchanges[0].unlockGroupId='other';assert.ok(h.api.validate().some(text=>text.includes('循环')));
 delete h.m.exchanges[0].unlockGroupId;h.m.unlockGroups.pop();group.requirements=[{exchangeId:'absent',times:1}];assert.ok(h.api.validate().length);
 group.requirements=[];h.m.exchanges[0].mode='fixed';group.requirements=[{exchangeId:'first',all:true}];assert.ok(h.api.validate().length);
});
test('多选前置和费用表单可编辑，锁定预览不接受修改',()=>{
 const h=editor(),card={dataset:{ecoList:'unlockGroups',ecoId:'group'}};
 function change(key,value,extra={}){const control={dataset:{ecoField:key},value,type:'checkbox',checked:true,...extra,closest:s=>s==='[data-eco-field]'?control:s==='[data-eco-list]'?card:null};h.root.onchange({type:'change',target:{closest:()=>control}});}
 change('groupRequirement','first');assert.equal(h.m.unlockGroups[0].requirements[0].exchangeId,'first');
 h.lock();const before=plain(h.m);change('groupRequirement','second');assert.deepEqual(plain(h.m),before);
});
test('每日前置及每日限购可配置，拒绝依赖不可每日恢复的兑换',()=>{
 const h=editor(),group=h.m.unlockGroups[0],first=h.m.exchanges[0];group.period='daily';first.mode='daily';group.requirements=[{exchangeId:'first',all:true}];
 h.api.render();assert.match(h.root.innerHTML,/每日重置/);assert.match(h.root.innerHTML,/每日限购/);assert.deepEqual(plain(h.api.validate()),[]);
 first.mode='once';assert.ok(h.api.validate().some(text=>text.includes('每日前置')));
 first.mode='daily';first.limit=0;assert.ok(h.api.validate().some(text=>text.includes('限购次数')));
});
