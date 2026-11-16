const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const read=file=>fs.readFileSync(path.join(__dirname,'../..',file),'utf8'),plain=value=>JSON.parse(JSON.stringify(value));
function setup(){
 const store=new Map(),c=require('./icon_test_context.cjs').createContext({window:{},localStorage:{getItem:key=>store.get(key)??null,setItem:(key,value)=>store.set(key,value)}});
 for(const file of ['logic/gacha_engine.js','logic/simulator_start.js','logic/simulator_economy.js','logic/user_data_profiles.js','logic/user_data_tools.js','ui/resource_exchanges.js']){vm.runInContext(read(file),c);Object.assign(c,c.window);}
 const info={economy:{resources:[{id:'token',name:'代币',en:'Token'},{id:'ticket',name:'票券',en:'Ticket'}],exchanges:[{id:'first',name:'前置',en:'First',from:'token',toIds:['ticket'],mode:'monthly',cost:10,gain:1,limit:2},{id:'next',name:'后续',en:'Next',from:'token',toIds:['ticket'],mode:'fixed',cost:2,gain:1,unlockGroupId:'group'}],unlockGroups:[{id:'group',name:'共享组',en:'Shared group',period:'monthly',requirements:[{exchangeId:'first',targetId:'ticket',all:true}],costs:[{resourceId:'token',amount:5}]}]}};
 return {c,store,info};
}
test('玩家数据兑换先修改草稿，保存持久化次数与解锁，投影到模拟器时保持独立副本',()=>{
 const h=setup(),api=h.c.UserDataProfiles,service=h.c.SimulatorEconomy.create(h.info),state=h.c.SimulatorEconomy.createState();state.balances.token=100;
 const account={id:'a',name:'A',pools:{},balances:{token:100},owned:{}};api.save('game',account,0);
 service.exchange(state,'first','ticket',2);service.unlock(state,'group');service.exchange(state,'next','ticket');
 assert.equal(api.read('game').items[0].balances.token,100);assert.equal(state.balances.token,73);
 const saved={...account,balances:plain(state.balances),economyProgress:h.c.SimulatorEconomy.progress(state)};api.save('game',saved,1);
 const projected=api.project(api.read('game').items[0],'pool',{minorPities:[]});assert.equal(projected.balances.token,73);
 const replay=h.c.SimulatorEconomy.createState();Object.assign(replay,plain(projected.economyProgress));assert.equal(service.groupStatus(replay,'group').unlocked,true);assert.equal(replay.exchanges['first:ticket'],2);
 projected.economyProgress.exchanges['first:ticket']=0;assert.equal(api.read('game').items[0].economyProgress.exchanges['first:ticket'],2);
 const reverted=api.project(api.read('game').items[0],'pool',{minorPities:[]});assert.equal(reverted.balances.token,73);
});
test('旧账号无兑换进度仍可读取，无效负数或非布尔解锁拒绝保存',()=>{
 const h=setup(),row={id:'a',name:'A',pools:{},balances:{},owned:{}};assert.equal(h.c.UserDataProfiles.valid(row),true);
 for(const progress of [{exchanges:{x:-1},prerequisites:{}},{exchanges:{x:1.5},prerequisites:{}},{exchanges:{},prerequisites:{x:1}},{exchanges:[],prerequisites:{}}])assert.equal(h.c.UserDataProfiles.valid({...row,economyProgress:progress}),false);
 assert.equal(h.c.UserDataProfiles.valid({...row,economyProgress:{exchanges:{x:2},prerequisites:{x:true}}}),true);
});
test('共享界面按普通、月限购、阶梯和共享组折叠，事件一次执行，不修改输入状态',()=>{
 const h=setup(),state=h.c.SimulatorEconomy.createState();state.balances.token=100;let mutations=0;
 const view=h.c.ResourceExchangesUI.create({info:h.info,read:()=>state,mutate:action=>{mutations++;action(state);}});
 const before=plain(state),html=view.html(state);assert.match(html,/data-exchange-category="monthly"/);assert.match(html,/data-exchange-category="group:group"/);assert.deepEqual(plain(state),before);
 const row={dataset:{walletRow:'first'},querySelector:selector=>selector==='[data-wallet-target]'?{value:'ticket'}:{value:'2'}};
 const host={querySelectorAll:()=>[]};view.bind(host);let stopped=0;
 host.onclick({target:{closest:selector=>selector==='[data-wallet-action]'?{dataset:{walletAction:'exchange'}}:selector==='[data-wallet-row]'?row:null},stopPropagation:()=>stopped++});
 assert.equal(mutations,1);assert.equal(stopped,1);assert.equal(state.balances.token,80);assert.equal(state.exchanges['first:ticket'],2);
});
test('兑换说明显示实际选中资源，中英文切换与重绘保留选择，不修改账户',()=>{
 const h=setup(),state=h.c.SimulatorEconomy.createState(),before=plain(state);
 h.info.economy.resources.push({id:'other',name:'另一种票',en:'Other ticket'});h.info.economy.exchanges[0].toIds.push('other');
 const view=h.c.ResourceExchangesUI.create({info:h.info,read:()=>state,mutate:()=>assert.fail('切换目标不应修改账户')});
 assert.match(view.html(state),/→ 1 🪙 票券/);assert.doesNotMatch(view.html(state),/目标资源/);
 const description={textContent:''},select={value:'ticket',options:[{value:'ticket'},{value:'other'}]},times={value:'1'};
 const row={dataset:{walletRow:'first'},querySelector:selector=>({'[data-wallet-target]':select,'[data-wallet-times]':times,'[data-wallet-offer]':description}[selector])};
 const host={querySelectorAll:selector=>selector==='[data-wallet-row]'?[row]:[]};view.bind(host);
 select.value='other';host.onchange({target:{matches:selector=>selector==='[data-wallet-target]',closest:()=>row,value:'other'},stopPropagation(){}});
 assert.match(description.textContent,/→ 1 🪙 另一种票/);
 assert.match(view.html(state),/data-wallet-offer>10 🪙 代币 → 1 🪙 另一种票/);
 assert.match(view.html(state),/<option value="other" selected>/);
 h.store.set('GM_Lang','en');view.bind(host);
 assert.match(description.textContent,/→ 1 🪙 Other ticket/);assert.doesNotMatch(view.html(state),/target resource/);
 assert.deepEqual(plain(state),before);
});

test('账号融合整组选取兑换状态，预览列出变化；撤回不依赖重新执行兑换',()=>{
 const h=setup(),base={pools:{},owned:{},balances:{}},a={...base,id:'a',name:'A'},b={...base,id:'b',name:'B',economyProgress:{exchanges:{x:2},prerequisites:{g:true}}};
 const merged=h.c.UserDataTools.merge(a,b,{mode:'source',scopes:['progress']});assert.deepEqual(plain(merged.economyProgress),b.economyProgress);
 assert.equal(h.c.UserDataTools.changes(a,merged)[0].field,'economyProgress');
 const excluded=h.c.UserDataTools.merge(a,b,{mode:'source',scopes:['owned']});assert.equal(excluded.economyProgress,undefined);
});

test('超额、已用完额度、资源不足和阶梯完成都在兑换弹窗内部显示红色 toast，不修改余额',()=>{
 const h=setup(),messages=[],host={querySelectorAll:()=>[],appendChild(node){this.toast=node;}};
 h.c.document={createElement:()=>({setAttribute(){}})};
 h.c.window.Toast={create:options=>{assert.equal(options.target,host.toast);return {dismiss(){},show:(message,type)=>messages.push({message,type})};}};
 const state=h.c.SimulatorEconomy.createState();state.balances.token=100;
 h.info.economy.exchanges.push({id:'stage',from:'token',mode:'staged',stages:[{toIds:['ticket'],cost:1,gain:1}]});
 const view=h.c.ResourceExchangesUI.create({info:h.info,read:()=>state,mutate:action=>action(state)});
 view.bind(host);
 function click(id,times,target='ticket'){
  const row={dataset:{walletRow:id},querySelector:selector=>({value:selector==='[data-wallet-target]'?target:String(times)})};
  return ()=>host.onclick({target:{closest:selector=>selector==='[data-wallet-action]'?{dataset:{walletAction:'exchange'}}:row},stopPropagation(){}});
 }
 assert.throws(click('first',3),/limit/);assert.match(messages.at(-1).message,/3.*剩余额度 2/);
 state.exchanges['first:ticket']=2;
 const html=view.html(state);assert.match(html,/data-wallet-action="exchange"/);assert.ok(!html.includes('disabled data-wallet-action="exchange"'));
 assert.throws(click('first',1),/limit/);assert.match(messages.at(-1).message,/已达到兑换上限/);
 state.exchanges['first:ticket']=0;state.balances.token=0;
 assert.throws(click('first',1),/insufficient/);assert.match(messages.at(-1).message,/资源不足/);
 state.exchanges.stage=1;
 assert.throws(click('stage',1,''),/limit/);assert.match(messages.at(-1).message,/所有兑换档位已完成/);
 assert.throws(click('first',0),/invalid_amount/);assert.match(messages.at(-1).message,/正整数/);
 assert.equal(state.balances.token,0);assert.equal(state.balances.ticket,undefined);
 assert.ok(messages.every(row=>row.type==='danger'));
 h.store.set('GM_Lang','en');assert.throws(click('first',3),/limit/);assert.match(messages.at(-1).message,/only 2 remain/);
});
