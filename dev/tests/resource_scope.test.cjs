const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const c=require('./icon_test_context.cjs').createContext({window:{},localStorage:{getItem:()=>null}});
for(const file of ['Preset_Data/db_hsr.js','Preset_Data/db_ark.js','logic/simulator_economy.js','ui/resource_exchanges.js']){vm.runInContext(fs.readFileSync(file,'utf8'),c);Object.assign(c,c.window);}
const plain=value=>JSON.parse(JSON.stringify(value)),api=c.SimulatorEconomy;
const preset=id=>vm.runInContext(id.toUpperCase()+'_CURRENCY_RULES',c);
test('星铁限定与常驻按支付资源过滤多目标兑换，玩家数据仍保留全部目标',()=>{
 const info=preset('hsr'),service=api.create(info),state=api.createState();
 const limited=service.resourceScope('char_up'),standard=service.resourceScope('mixed_std');
 const row=info.economy.exchanges.find(row=>row.toIds.length===2);
 const special=info.economy.payments.find(row=>row.poolIds?.includes('char_up')&&row.resourceId!==info.economy.payments[0].resourceId).resourceId;
 assert.equal(limited.targets(state,row).length,1);assert.deepEqual(plain(limited.targets(state,row)),[special]);
 assert.equal(standard.targets(state,row).length,1);assert.notEqual(standard.targets(state,row)[0],special);
 assert.equal(service.resourceScope().targets(state,row).length,2);
 const html=c.ResourceExchangesUI.create({info,poolId:'char_up',read:()=>state,mutate:()=>{}}).html(state);
 const other=row.toIds.find(id=>id!==special);assert.ok(!html.includes('value="'+other+'"'));
});
test('方舟限定池隐藏中坚票、对应兑换及领取，保留普通票阶梯和共享前置',()=>{
 const info=preset('ark'),scope=api.create(info).resourceScope('up_1');
 assert.ok(!scope.resources.some(row=>row.id.startsWith('kernel')));
 assert.ok(!scope.exchanges.some(row=>row.id.includes('kernel')));
 assert.ok(scope.exchanges.some(row=>row.id==='distinction_permits'));
 assert.ok(scope.exchanges.some(row=>row.id==='commendation_orundum'));
 assert.equal(scope.groups.length,2);
 const state=api.createState(),html=c.ResourceExchangesUI.create({info,poolId:'up_1',read:()=>state,mutate:()=>{}}).html(state);
 assert.ok(!html.includes('kernel'));assert.match(html,/commendation_phase2/);
});
test('递归保留前置兑换、解锁消耗和必经阶梯，不扩散兄弟目标；空支付不展示全账号规则',()=>{
 const info={economy:{resources:['ticket','other','key','ore','token'].map(id=>({id})),payments:[{resourceId:'ticket',poolIds:['limited']}],
 exchanges:[{id:'buy',from:'token',toIds:['ticket','other'],unlockGroupId:'g'},
 {id:'keys',from:'ore',toIds:['key','other']},
 {id:'stages',from:'token',mode:'staged',stages:[{toIds:['key']},{toIds:['ticket','other']}]},
 {id:'ore',from:'key',toIds:['ore']}],unlockGroups:[{id:'g',costs:[{resourceId:'ore',amount:1}],requirements:[{exchangeId:'keys',targetId:'key',all:true}]}],
 incomes:[{id:'key',resourceId:'key'},{id:'other',resourceId:'other'},{id:'restricted',resourceId:'ticket',poolIds:['elsewhere']}]}};
 const service=api.create(info),scope=service.resourceScope('limited'),state=api.createState();
 assert.deepEqual(plain(scope.targets(state,info.economy.exchanges[0])),['ticket']);
 assert.deepEqual(plain(scope.targets(state,info.economy.exchanges[1])),['key']);
 assert.deepEqual(plain(scope.targets(state,info.economy.exchanges[2])),['key']);
 state.exchanges.stages=1;assert.deepEqual(plain(scope.targets(state,info.economy.exchanges[2])),['ticket']);
 state.exchanges.stages=2;assert.deepEqual(plain(scope.targets(state,info.economy.exchanges[2])),[]);
 assert.deepEqual(plain(scope.incomes.map(row=>row.id)),['key']);
 assert.equal(service.resourceScope('unknown').exchanges.length,0);
 assert.equal(service.resourceScope('unknown').resources.length,0);
 assert.equal(service.resourceScope().exchanges.length,4);
});
test('限定池跨三层解锁必须同时兑换专票和通票，完整保留前置链且逐种核对额度',()=>{
 const info={economy:{resources:[['special','专票'],['standard','通票'],['coin','代币'],['ore','解锁石'],['unrelated','无关资源']].map(([id,name])=>({id,name,en:id})),
 payments:[{id:'pull',resourceId:'special',cost:1,pulls:1,poolIds:['limited']}],
 exchanges:[{id:'first',name:'第一层',from:'coin',toIds:['special','standard'],mode:'monthly',cost:1,gain:1,limit:2},
 {id:'second',name:'第二层',from:'coin',toIds:['special','standard'],mode:'monthly',cost:1,gain:1,limit:2,unlockGroupId:'g2'},
 {id:'third',name:'第三层',from:'coin',toIds:['special'],mode:'fixed',cost:1,gain:1,unlockGroupId:'g3'},
 {id:'ore',name:'解锁材料',from:'coin',toIds:['ore'],mode:'fixed',cost:1,gain:1},
 {id:'unrelated',from:'coin',toIds:['unrelated'],mode:'fixed',cost:1,gain:1}],
 unlockGroups:[{id:'g2',name:'第二层解锁',period:'monthly',costs:[{resourceId:'ore',amount:1}],requirements:[{exchangeId:'first',all:true}]},
 {id:'g3',name:'第三层解锁',period:'monthly',costs:[{resourceId:'ore',amount:1}],requirements:[{exchangeId:'second',all:true}]}],
 incomes:[{id:'grant',resourceId:'coin',source:'other',schedule:'unlimited',amount:100}]}};
 const service=api.create(info),scope=service.resourceScope('limited'),state=api.createState();
 assert.deepEqual(plain(scope.targets(state,info.economy.exchanges[0])),['special','standard']);
 assert.deepEqual(plain(scope.targets(state,info.economy.exchanges[1])),['special','standard']);
 assert.ok(scope.exchanges.some(row=>row.id==='ore'));assert.ok(!scope.exchanges.some(row=>row.id==='unrelated'));
 const view=c.ResourceExchangesUI.create({info,poolId:'limited',read:()=>state,mutate:()=>{}});
 const html=view.html(state);assert.match(html,/第一层 · 🪙 专票：0 \/ 2/);assert.match(html,/第一层 · 🪙 通票：0 \/ 2/);
 assert.match(html,/value="standard"/);assert.doesNotMatch(html,/value="unrelated"/);
 service.claim(state,'grant');service.exchange(state,'ore','ore',2);
 service.exchange(state,'first','special',2);assert.equal(service.groupStatus(state,'g2').ready,false);
 const before=plain(state);assert.throws(()=>service.unlock(state,'g2'),/prerequisite/);assert.deepEqual(plain(state),before);
 service.exchange(state,'first','standard',2);service.unlock(state,'g2');
 service.exchange(state,'second','special',2);assert.equal(service.groupStatus(state,'g3').ready,false);
 service.exchange(state,'second','standard',2);service.unlock(state,'g3');service.exchange(state,'third','special');
 assert.equal(state.balances.special,5);assert.equal(state.balances.standard,4);
 service.reset(state,'monthly');assert.equal(service.groupStatus(state,'g2').ready,false);assert.equal(service.groupStatus(state,'g3').unlocked,false);
 // 导入旧计数或调低额度后，一种票超额也不能抵消另一种票未兑换。
 state.exchanges['month:first:special']=4;state.exchanges['month:first:standard']=0;state.balances.ore=1;
 const status=service.groupStatus(state,'g2');assert.equal(status.requirements[0].count,4);assert.equal(status.requirements[0].needed,4);assert.equal(status.ready,false);
 assert.match(view.html(state),/第一层 · 🪙 通票：0 \/ 2/);
});

test('共享兑换界面对过期或不适用的兑换目标拒绝执行，余额不变化',()=>{
 const info=preset('hsr'),state=api.createState(),row=info.economy.exchanges.find(row=>row.toIds.length===2);
 state.balances[row.from]=10000;const before=plain(state),host={querySelectorAll:()=>[]};
 const scope=api.create(info).resourceScope('char_up'),invalid=row.toIds.find(id=>!scope.targets(state,row).includes(id));
 const view=c.ResourceExchangesUI.create({info,poolId:'char_up',read:()=>state,mutate:action=>action(state)});view.bind(host);
 const node={dataset:{walletRow:row.id},querySelector:selector=>({value:selector==='[data-wallet-target]'?invalid:'1'})};
 assert.throws(()=>host.onclick({target:{closest:selector=>selector==='[data-wallet-action]'?{dataset:{walletAction:'exchange'}}:node},stopPropagation(){}}),/wrong_pool/);
 assert.deepEqual(plain(state),before);
});
