const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');const vm=require('node:vm');
const read=file=>fs.readFileSync(path.join(__dirname,'../..',file),'utf8');
const context=require('./icon_test_context.cjs').createContext({window:{}});vm.runInContext(read('logic/simulator_economy.js'),context);
const API=context.window.SimulatorEconomy,plain=value=>JSON.parse(JSON.stringify(value));
const info={overflowRules:{char:3},economy:{resources:[{id:'jade'},{id:'ticket'},{id:'token'}],
    payments:[{id:'jade',resourceId:'jade',cost:160,pulls:1,poolIds:['limited']},{id:'ten',resourceId:'ticket',cost:1,pulls:10,poolIds:['limited']}],
    incomes:[{id:'manual',source:'other',resourceId:'jade',schedule:'unlimited',amount:160},{id:'once',source:'other',resourceId:'ticket',schedule:'once',amount:1},
        {id:'daily',source:'other',resourceId:'jade',schedule:'daily',amount:60},{id:'monthly',source:'other',resourceId:'jade',schedule:'monthly',amount:100},
        {id:'signin',source:'other',resourceId:'ticket',schedule:'signin',days:[{day:1,amount:1},{day:3,amount:2}]},
        {id:'return',source:'byproduct',resourceId:'token',categoryIds:['char'],poolIds:['limited','standard'],tierId:'gold',tagIds:['up'],tagMatch:'all',condition:'cap_split',amount:2,overflowAmount:5}],
    exchanges:[{id:'monthly',from:'token',toIds:['ticket','jade'],mode:'monthly',cost:2,gain:1,limit:2,hasPrerequisite:true},
        {id:'stages',from:'token',mode:'staged',stages:[{cost:2,gain:1,toIds:['ticket']},{cost:4,gain:3,toIds:['jade']}]},
        {id:'once_stages',from:'token',mode:'once_staged',stages:[{cost:2,gain:1,toIds:['ticket']}]},
        {id:'once',from:'token',toIds:['ticket'],mode:'once',cost:1,gain:1}]}};
const service=API.create(info);
test('获取、支付与整数约束；十连票必须整组使用',()=>{
    const state=API.createState();service.claim(state,'manual',2);assert.equal(state.balances.jade,320);
    service.payment(state,'jade','limited',2);assert.equal(state.balances.jade,0);
    assert.throws(()=>service.payment(state,'jade','limited',1),/insufficient/);
    assert.throws(()=>service.payment(state,'jade','standard',1),/wrong_pool/);
    service.claim(state,'once');assert.throws(()=>service.claim(state,'once'),/limit/);
    assert.throws(()=>service.payment(state,'ten','limited',1),/whole_payment/);
    service.payment(state,'ten','limited',10);assert.equal(state.balances.ticket,0);
    for(const n of [0,-1,1.5,NaN,Infinity,Number.MAX_SAFE_INTEGER+1]) assert.throws(()=>service.claim(state,'manual',n),/invalid_amount/);
});
test('签到节点不会重复，每日/月度/一次性进度分别重置',()=>{
    const state=API.createState();service.claim(state,'once');service.claim(state,'daily');service.claim(state,'monthly');
    service.claim(state,'signin');service.claim(state,'signin');service.claim(state,'signin');
    assert.equal(state.balances.ticket,4);assert.throws(()=>service.claim(state,'signin'),/limit/);
    service.reset(state,'daily');service.claim(state,'daily');assert.throws(()=>service.claim(state,'monthly'),/limit/);
    service.reset(state,'monthly');service.claim(state,'monthly');assert.throws(()=>service.claim(state,'once'),/limit/);
    assert.equal(state.balances.ticket,4);assert.equal(state.signins.signin,3);
});
test('前置确认、各目标独立限购与阶梯逐档兑换',()=>{
    const state=API.createState();state.balances.token=100;
    assert.throws(()=>service.exchange(state,'monthly','ticket'),/prerequisite/);
    state.prerequisites.monthly=true;service.exchange(state,'monthly','ticket',2);
    assert.throws(()=>service.exchange(state,'monthly','ticket'),/limit/);
    service.exchange(state,'monthly','jade',2);
    assert.throws(()=>service.exchange(state,'stages','jade'),/invalid_target/);
    service.exchange(state,'stages','ticket');service.exchange(state,'stages','jade');assert.equal(service.offer(state,info.economy.exchanges[1]),null);
    service.exchange(state,'once_stages','ticket');service.exchange(state,'once','ticket');
    const balance=state.balances.token;service.reset(state,'monthly');assert.equal(state.balances.token,balance);
    assert.equal(state.prerequisites.monthly,undefined);assert.equal(state.exchanges.stages,undefined);
    assert.equal(state.exchanges.once_stages,1);assert.equal(state.exchanges['once:ticket'],1);
});
test('逐件溢出、跨池持有共享、标签/稀有度/卡池同时筛选',()=>{
    const state=API.createState(),catalog=[{id:'hero',name:'角色',category:'char',tierId:'gold',tags:['up']}];
    const pull={name:'角色',tierId:'gold'};
    service.settle(state,[pull,pull],catalog,'limited');service.settle(state,[pull,pull],catalog,'standard');
    assert.equal(state.balances.token,11);assert.equal(Object.values(state.owned)[0],4);
    service.settle(state,[pull],catalog,'other_pool');assert.equal(state.balances.token,11);
    service.settle(state,[pull],catalog,'limited',{returns:false});assert.equal(state.balances.token,11);
    assert.throws(()=>service.settle(state,[{name:'未知'}],catalog,'limited'),/unknown_item/);
});
function walletHarness(balance=160,rules=info) {
    const map=new Map([['GM_Sim_Currency_Mode','true']]);let storageFails=false;
    const root={innerHTML:'',hidden:true},dialog={open:false,innerHTML:'',close(){this.open=false;},showModal(){this.open=true;}};
    const messages=[],switches=[];
    const c=require('./icon_test_context.cjs').createContext({window:{addEventListener(){},Toast:{create:()=>({show:message=>switches.push(message)})}},SimulatorEconomy:API,
        document:{getElementById:()=>root,createElement:()=>dialog,body:{appendChild(){}}},
        localStorage:{getItem:key=>map.get(key)??null,setItem:(key,value)=>{if(storageFails)throw Error('disk');map.set(key,value);}},
        showToast:message=>messages.push(message),customConfirm:async()=>true});
    const state=API.createState();state.balances.jade=balance;map.set('GM_Sim_Economy_game',JSON.stringify(state));
    vm.runInContext(read('ui/simulator_wallet.js'),c);
    const wallet=c.window.SimulatorWallet.mount({gameId:'game',poolId:'limited',info:rules,catalog:[{name:'角色',category:'char',tierId:'gold',tags:['up']}]});
    return {wallet,map,messages,switches,root,failStorage:()=>{storageFails=true;},read:()=>JSON.parse(map.get('GM_Sim_Economy_game'))};
}
const engineState=()=>({total:0,freeQueue:[],events:{pendingGifts:[]}});
test('支付栏只展示账户名及资源图标名称数量，整组票券不误标成单抽费用',()=>{
    const rules=plain(info);rules.economy.resources[0]={id:'jade',name:'星琼',en:'Stellar Jade',icon:'💎'};
    const h=walletHarness(160,rules),state=h.read();state.profile={id:'a',name:'<我的账户>',en:'My account'};
    h.map.set('GM_Sim_Economy_game',JSON.stringify(state));h.wallet.render();
    assert.match(h.root.innerHTML,/<strong class="sim-wallet-account">&lt;我的账户&gt;<\/strong>/);
    assert.match(h.root.innerHTML,/💎 星琼 160 \/ 一抽/);assert.match(h.root.innerHTML,/🪙 ticket 1 \/ 10 抽/);
    assert.match(h.root.innerHTML,/class="sim-wallet-payment"><select/);
    assert.doesNotMatch(h.root.innerHTML,/货币模式|优先使用所选支付方式/);
    h.map.set('GM_Lang','en');h.wallet.render();assert.match(h.root.innerHTML,/>My account<\/strong>/);assert.match(h.root.innerHTML,/💎 Stellar Jade 160 \/ 1 pull/);
});
test('货币批次把免费抽与付费抽分开，并同时保存扣款、返还和保底状态',async()=>{
    const h=walletHarness(),state=engineState();state.freeQueue=[{remaining:1}];
    const result=await h.wallet.pull(state,1,async draft=>{
        const free=!!draft.freeQueue.length;if(free)draft.freeQueue=[];draft.total++;
        return [{name:'角色',tierId:'gold',total:draft.total,pullType:free?'free_pity':'paid'}];
    });
    assert.equal(result.results.length,2);assert.equal(result.state.total,2);assert.equal(state.total,0);
    assert.equal(h.read().balances.jade,0);assert.equal(h.read().balances.token,4);assert.equal(h.read().pools.limited.total,2);
});
test('余额不足、抽卡异常、存储失败均不扣款、不推进原始状态',async()=>{
    const h=walletHarness(0);let calls=0;
    assert.equal(await h.wallet.pull(engineState(),1,async()=>{calls++;}),null);assert.equal(calls,0);
    for(const failStorage of [false,true]) {
        const h=walletHarness(),state=engineState();if(failStorage)h.failStorage();
        const result=await h.wallet.pull(state,1,async draft=>{draft.total++;if(!failStorage)throw Error('draw_failed');return [{name:'角色',tierId:'gold',total:1,pullType:'paid'}];});
        assert.equal(result,null);assert.equal(state.total,0);assert.equal(h.read().balances.jade,160);assert.deepEqual(h.read().pools,{});
    }
});
test('等待抽卡时阻止重复提交；跨页面更新冲突时保留最新账户',async()=>{
    const h=walletHarness(),state=engineState();let release;
    const first=h.wallet.pull(state,1,()=>new Promise(resolve=>{release=resolve;}));
    assert.equal(await h.wallet.pull(state,1,async()=>assert.fail('重复执行')),null);
    const external=h.read();external.revision++;external.balances.jade=999;h.map.set('GM_Sim_Economy_game',JSON.stringify(external));
    release([{name:'角色',tierId:'gold',total:1,pullType:'paid'}]);assert.equal(await first,null);
    assert.equal(h.read().balances.jade,999);assert.equal(state.total,0);
});
test('不足时只组合当前池可用支付方式，原方式够用则保持',()=>{
    const economy=plain(info.economy);
    economy.payments.push(
        {id:'wrong',resourceId:'token',cost:1,pulls:1,poolIds:['standard']},
        {id:'poor',resourceId:'token',cost:100,pulls:1,poolIds:[]},
        {id:'single',resourceId:'token',cost:2,pulls:1,poolIds:[]});
    const svc=API.create({economy}),state=API.createState();state.balances={jade:0,ticket:3,token:10};
    const result=svc.payWithFallback(state,'jade','limited',1);
    assert.equal(result.payment.id,'single');assert.equal(result.switched,true);
    assert.deepEqual(plain(state.balances),{jade:0,ticket:3,token:8});
    state.balances.jade=160;
    assert.equal(svc.payWithFallback(state,'jade','limited',1).switched,false);
    assert.equal(state.balances.token,8);
    const before=plain(state);
    assert.throws(()=>svc.payWithFallback(state,'jade','limited',100),/insufficient/);
    assert.deepEqual(plain(state),before);
    assert.equal(svc.payWithFallback(state,'ten','limited',1).payment.id,'single');
});
test('优先用完3张单抽票，再用星琼补7抽；合计8抽则完全不扣款',()=>{
    const economy=plain(info.economy);
    economy.payments=economy.payments.filter(row=>row.id!=='ten');
    economy.payments.unshift({id:'single_ticket',resourceId:'ticket',cost:1,pulls:1,poolIds:['limited']});
    const svc=API.create({economy});
    for(const jade of [1120,800]) {
        const state=API.createState();state.balances={ticket:3,jade};
        if(jade===1120){
            const paid=svc.payWithFallback(state,'single_ticket','limited',10);
            assert.deepEqual(plain(paid.allocations).map(p=>[p.payment.id,p.pulls,p.cost]),[['single_ticket',3,3],['jade',7,1120]]);
            assert.deepEqual(plain(state.balances),{ticket:0,jade:0});
        } else {
            const before=plain(state);assert.throws(()=>svc.payWithFallback(state,'single_ticket','limited',10),/insufficient/);
            assert.deepEqual(plain(state),before);
        }
    }
});
test('整组支付不能拆分，共享余额不重复计算，组合规划可回退以凑整',()=>{
    const economy={resources:[{id:'a'},{id:'b'}],payments:[
        {id:'first',resourceId:'a',cost:1,pulls:1},
        {id:'same',resourceId:'a',cost:1,pulls:1},
        {id:'ten',resourceId:'b',cost:1,pulls:10}]};
    const svc=API.create({economy}),state=API.createState();state.balances={a:3,b:1};
    const paid=svc.payWithFallback(state,'first','limited',10);
    assert.deepEqual(plain(paid.allocations).map(p=>[p.payment.id,p.pulls]),[['ten',10]]);
    assert.deepEqual(plain(state.balances),{a:3,b:0});
    const before=plain(state);assert.throws(()=>svc.payWithFallback(state,'first','limited',5),/insufficient/);
    assert.deepEqual(plain(state),before);
});
test('合计余额不足在调用抽卡引擎前中止，混合支付失败不保存任何扣款',async()=>{
    const rules=plain(info);
    rules.economy.payments=rules.economy.payments.filter(row=>row.id!=='ten');
    rules.economy.payments.unshift({id:'single_ticket',resourceId:'ticket',cost:1,pulls:1,poolIds:['limited']});
    for(const failure of ['insufficient','draw','save','none']) {
        const h=walletHarness(failure==='insufficient'?800:1120,rules),stored=h.read();
        stored.balances.ticket=3;h.map.set('GM_Sim_Economy_game',JSON.stringify(stored));
        h.root.onchange({target:{matches:()=>true,value:'single_ticket'}});
        if(failure==='save')h.failStorage();
        let calls=0;
        const original=engineState(),result=await h.wallet.pull(original,10,async draft=>{
            calls++;if(failure==='draw')throw Error('draw_failed');
            draft.total++;return [{name:'角色',tierId:'gold',total:draft.total,pullType:'paid'}];
        });
        assert.equal(original.total,0);
        if(failure==='none') {
            assert.equal(calls,10);assert.equal(result.results.length,10);assert.equal(result.state.total,10);
            assert.equal(h.read().balances.ticket,0);assert.equal(h.read().balances.jade,0);
            assert.equal(h.switches.length,1);assert.match(h.switches[0],/single_ticket × 3抽.*jade × 7抽/);
        } else {
            assert.equal(result,null);assert.equal(calls,failure==='insufficient'?0:failure==='draw'?1:10);
            assert.deepEqual(h.read(),stored);assert.equal(h.switches.length,0);
        }
    }
});
test('余额栏递归显示支付资源的兑换上游，排除兄弟目标并处理阶梯和循环',()=>{
    const economy={resources:['jade','special','standard','shard','token','unused','staged','legacy','cycle'].map(id=>({id})),
        payments:[{resourceId:'jade',poolIds:[]},{resourceId:'special',poolIds:['limited']},{resourceId:'standard',poolIds:['standard']}],
        exchanges:[{from:'shard',toIds:['jade']},{from:'jade',toIds:['special','standard']},
            {from:'token',toIds:['special','standard']},{from:'unused',toIds:['standard']},
            {from:'staged',mode:'staged',stages:[{toIds:['unused']},{toIds:['token']}]},
            {from:'legacy',mode:'once_staged',toIds:['shard'],stages:[{}]},
            {from:'cycle',toIds:['legacy']},{from:'legacy',toIds:['cycle']}]};
    assert.deepEqual(plain(API.create({economy}).relatedResources('limited')).map(r=>r.id),
        ['jade','special','shard','token','unused','staged','legacy','cycle']);
    assert.ok(API.create({economy}).relatedResources('standard').some(r=>r.id==='standard'));
});
test('自动切换与返还各自提示；抽卡或保存失败不会提交切换',async()=>{
    for(const failure of ['none','draw','save']) {
        const h=walletHarness(0),stored=h.read();stored.balances.ticket=1;
        h.map.set('GM_Sim_Economy_game',JSON.stringify(stored));
        if(failure==='save')h.failStorage();
        const result=await h.wallet.pull(engineState(),10,async draft=>{
            if(failure==='draw')throw Error('draw_failed');
            draft.total++;return [{name:'角色',tierId:'gold',total:draft.total,pullType:'paid'}];
        });
        if(failure==='none') {
            assert.ok(result);assert.equal(h.read().balances.ticket,0);
            assert.equal(h.switches.length,1);assert.match(h.switches[0],/ten/);
            assert.ok(h.messages.some(message=>message.includes('token')));
            assert.match(h.root.innerHTML,/value="ten" selected/);
        } else {
            assert.equal(result,null);assert.equal(h.read().balances.ticket,1);
            assert.equal(h.switches.length,0);assert.match(h.root.innerHTML,/value="jade" selected/);
        }
    }
});

 test('统一前置兼容旧手动完成状态，月重置清除旧状态',()=>{
    const config={economy:{resources:[{id:'coin'},{id:'ticket'}],unlockGroups:[{id:'condition',period:'monthly',requirements:[],costs:[],legacyPrerequisiteId:'old'}],exchanges:[{id:'old',from:'coin',toIds:['ticket'],mode:'fixed',cost:1,gain:1,unlockGroupId:'condition'}]}};
    const api=API.create(config),state=API.createState();state.balances.coin=5;state.prerequisites.old=true;
    assert.equal(api.groupStatus(state,'condition').unlocked,true);
    api.exchange(state,'old','ticket',1);assert.equal(state.balances.ticket,1);
    api.reset(state,'monthly');assert.equal(api.groupStatus(state,'condition').unlocked,false);
    assert.throws(()=>api.exchange(state,'old','ticket',1),/prerequisite/);
 });
