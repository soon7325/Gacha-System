const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const read=f=>fs.readFileSync(path.join(__dirname,'../..',f),'utf8');
const c=require('./icon_test_context.cjs').createContext({window:{}});vm.runInContext(read('logic/simulator_economy.js'),c);const API=c.window.SimulatorEconomy;
const rules=()=>({economy:{resources:[{id:'coin'},{id:'ticket'}],payments:[{id:'pay',resourceId:'ticket',cost:1,pulls:1,poolIds:['pool']}],
 incomes:['daily','monthly','once'].map(schedule=>({id:schedule,resourceId:'coin',source:'other',schedule,amount:2})),
 exchanges:[{id:'d',from:'coin',toIds:['ticket'],mode:'daily',limit:2,cost:1,gain:1},{id:'m',from:'coin',toIds:['ticket'],mode:'monthly',limit:2,cost:1,gain:1},{id:'o',from:'coin',toIds:['ticket'],mode:'once',cost:1,gain:1},{id:'s',from:'coin',mode:'once_staged',stages:[{toIds:['ticket'],cost:1,gain:1}]}],
 unlockGroups:[{id:'day',period:'daily',requirements:[{exchangeId:'d',all:true}],costs:[]},{id:'month',period:'monthly',requirements:[],costs:[]},{id:'forever',period:'once',requirements:[],costs:[]}]}});
test('每日限购、每日前置按当天次数检查，日月一次性重置互不误清',()=>{
 const api=API.create(rules()),state=API.createState();state.balances.coin=100;state.pools.pool={total:40};state.owned.a=3;state.signins.login=2;
 for(const p of ['daily','monthly','once'])api.claim(state,p,1);
 api.exchange(state,'d','ticket',2);api.exchange(state,'m','ticket',2);api.exchange(state,'o','ticket',1);api.exchange(state,'s','ticket',1);
 for(const g of ['day','month','forever'])api.unlock(state,g);
 const balance=JSON.stringify(state.balances),total=state.exchanges['total:d:ticket'];
 assert.throws(()=>api.exchange(state,'d','ticket',1),/limit/);
 api.reset(state,'daily');assert.equal(state.claims.daily,undefined);assert.equal(state.claims.monthly,1);assert.equal(state.claims.once,1);
 assert.equal(api.groupStatus(state,'day').ready,false);assert.equal(api.groupStatus(state,'day').unlocked,false);assert.equal(api.groupStatus(state,'month').unlocked,true);assert.equal(api.groupStatus(state,'forever').unlocked,true);
 assert.equal(state.exchanges['total:d:ticket'],total);assert.equal(state.exchanges['m:ticket'],2);api.exchange(state,'d','ticket',1);assert.equal(api.groupStatus(state,'day').ready,false);api.exchange(state,'d','ticket',1);assert.equal(api.groupStatus(state,'day').ready,true);
 const dailyUsed=state.exchanges['d:ticket'];api.reset(state,'monthly');assert.equal(state.exchanges['d:ticket'],dailyUsed);assert.equal(state.exchanges['o:ticket'],1);assert.equal(api.groupStatus(state,'forever').unlocked,true);
 const beforeOnce=JSON.stringify(state.balances);api.reset(state,'once');assert.equal(state.claims.once,undefined);assert.equal(state.exchanges['o:ticket'],undefined);assert.equal(state.exchanges.s,undefined);assert.equal(api.groupStatus(state,'forever').unlocked,false);assert.equal(state.exchanges['d:ticket'],dailyUsed);
 assert.equal(JSON.stringify(state.balances),beforeOnce);assert.deepEqual(JSON.parse(JSON.stringify(state.pools)),{pool:{total:40}});assert.equal(state.owned.a,3);assert.equal(state.signins.login,2);
 api.claim(state,'once',1);api.exchange(state,'o','ticket',1);api.exchange(state,'s','ticket',1);
});
test('按当前卡池相关规则检测按钮周期，包括前置依赖和一次性阶梯',()=>{
 const info=rules();assert.deepEqual(Array.from(API.create(info).resetPeriods('pool')),['daily','monthly','once']);
 info.economy.incomes=[];info.economy.exchanges=info.economy.exchanges.filter(r=>r.mode==='once_staged');info.economy.unlockGroups=[];
 assert.deepEqual(Array.from(API.create(info).resetPeriods('pool')),['once']);
 assert.deepEqual(Array.from(API.create(info).resetPeriods('other')),[]);
 info.economy.exchanges=[];assert.deepEqual(Array.from(API.create(info).resetPeriods('pool')),[]);
});
test('资源管理只渲染相关按钮，取消一次性重置不改存档，确认后保留余额',async()=>{
 const info=rules();info.economy.incomes=info.economy.incomes.filter(r=>r.schedule==='once');info.economy.exchanges=info.economy.exchanges.filter(r=>r.mode==='once');info.economy.unlockGroups=[];
 const state=API.createState();state.balances.coin=100;state.claims.once=1;
 const map=new Map([['GM_Sim_Currency_Mode','true'],['GM_Sim_Economy_test',JSON.stringify(state)]]),root={},dialog={open:false,querySelector:()=>null,showModal(){this.open=true;},close(){this.open=false;}};
 let answer=false,message='';const ctx=require('./icon_test_context.cjs').createContext({window:{addEventListener(){}},SimulatorEconomy:API,ResourceExchangesUI:{create:()=>({html:()=>'',bind(){}})},document:{getElementById:()=>root,createElement:()=>dialog,body:{appendChild(){}}},localStorage:{getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v)},showToast(){},customConfirm:async text=>{message=text;return answer;}});
 vm.runInContext(read('ui/simulator_wallet.js'),ctx);ctx.window.SimulatorWallet.mount({gameId:'test',poolId:'pool',info,catalog:[]});
 root.onclick({target:{closest:()=>({})}});assert.match(dialog.innerHTML,/data-wallet-action="once"/);assert.doesNotMatch(dialog.innerHTML,/data-wallet-action="(?:daily|monthly)"/);
 const before=map.get('GM_Sim_Economy_test'),event={target:{closest:s=>s==='[data-wallet-action]'?{dataset:{walletAction:'once'}}:null}};
 await dialog.onclick(event);assert.equal(map.get('GM_Sim_Economy_test'),before);assert.match(message,/可再次领取/);
 answer=true;await dialog.onclick(event);const after=JSON.parse(map.get('GM_Sim_Economy_test'));assert.equal(after.claims.once,undefined);assert.equal(after.balances.coin,100);
});
