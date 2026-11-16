const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'../..',p),'utf8'),plain=x=>JSON.parse(JSON.stringify(x));
function runtime(extra={}){
    const c=require('./icon_test_context.cjs').createContext({window:{addEventListener(){}},...extra});
    for(const [file,name] of [['logic/gacha_engine.js','GachaEngine'],['logic/simulator_start.js','SimulatorStart'],['logic/simulator_session.js','SimulatorSession'],['logic/simulator_economy.js','SimulatorEconomy']]){
        vm.runInContext(read(file),c);c[name]=c.window[name];
    }return c;
}
const selections={gold:{up:['角色'],std:[],spec:[]}};
test('记录保留批次、免费抽类型和井赠送，复制后不影响原数据',()=>{
    const c=runtime(),api=c.SimulatorSession,results=Array.from({length:12},(_,i)=>({name:'角色',total:i+1,pullType:i<10?'paid':'free_nopity'}));
    const additions=api.additions(results,[{name:'角色',atTotal:10}],false);
    assert.deepEqual(plain(additions).map(e=>[e.kind,e.results?.length||0]),[['batch',10],['batch',2],['gift',0]]);
    const state=c.GachaEngine.createState(),record=api.create(state,additions,selections);
    assert.equal(api.valid(record),true);record.entries[0].results[0].name='改名';assert.equal(results[0].name,'角色');
    record.entries[0].pullType='bad';assert.equal(api.valid(record),false);
});
function walletHarness(isCurrencyEnabled){
    const store=new Map([['GM_Sim_Currency_Mode','true']]);let fail=false;
    const root={innerHTML:'',hidden:false},dialog={open:false,close(){}};
    const c=runtime({document:{getElementById:()=>root,createElement:()=>dialog,body:{appendChild(){}}},
        localStorage:{getItem:k=>store.get(k)??null,setItem:(k,v)=>{if(fail)throw Error('quota');store.set(k,v);}},showToast(){}});
    const economy={resources:[{id:'jade'},{id:'token'}],payments:[{id:'pay',resourceId:'jade',cost:160,pulls:1,poolIds:[]}],exchanges:[],
        incomes:[{id:'return',source:'byproduct',resourceId:'token',condition:'always',amount:20}]};
    vm.runInContext(read('ui/simulator_wallet.js'),c);
    const wallet=c.window.SimulatorWallet.mount({gameId:'game',poolId:'pool',info:{economy,overflowRules:{char:7}},catalog:[{name:'角色',tierId:'gold',category:'char'}],isCurrencyEnabled});
    const engine=c.GachaEngine.createState();wallet.loadPool();
    assert.equal(wallet.applyStart(engine,{balances:{jade:320},owned:{},revision:wallet.account().revision}),true);
    return {c,wallet,store,engine,fail:()=>{fail=true;}};
}

test('临时关闭货币仅影响当前实例，不改偏好和账号持有，再次进入恢复货币模式',()=>{
    let temporary=false;
    const h=walletHarness(()=>!temporary);
    const saved=h.store.get('GM_Sim_Economy_game');
    assert.equal(h.wallet.enabled(),true);temporary=true;
    assert.equal(h.wallet.enabled(),false);
    assert.equal(h.store.get('GM_Sim_Currency_Mode'),'true');
    assert.equal(h.store.get('GM_Sim_Economy_game'),saved);
    const fresh=h.c.window.SimulatorWallet.mount({gameId:'game',poolId:'pool',info:{economy:{resources:[],payments:[],exchanges:[],incomes:[]}},catalog:[]});
    assert.equal(fresh.enabled(),true);
});
test('临时货币账户的起点、抽卡扣款和记录仅存内存，离开后原账号不变',async()=>{
    const {c,wallet,store,engine}=walletHarness(),before=store.get('GM_Sim_Economy_game');
    wallet.beginTemporary();
    const initial=c.GachaEngine.createState();initial.pity=12;initial.total=12;
    assert.equal(wallet.applyStart(initial,{balances:{jade:160},owned:{},revision:wallet.account().revision}),true);
    const result=await wallet.pull(initial,1,async draft=>{draft.total++;draft.pity++;return [{name:'角色',tierId:'gold',total:draft.total,isGold:false,pullType:'paid'}];},{keep:true,entries:[],selections});
    assert.ok(result);assert.equal(wallet.account().balances.jade,0);assert.equal(wallet.loadRecord().engine.total,13);
    assert.equal(wallet.restoreStart().pity,12);
    assert.equal(store.get('GM_Sim_Economy_game'),before);
    wallet.endTemporary();assert.equal(wallet.loadPool().total,engine.total);assert.equal(wallet.account().balances.jade,320);
    assert.equal(store.get('GM_Sim_Economy_game'),before);
});

test('货币扣款、返还、引擎状态与完整记录一次保存，初始设置保持不变',async()=>{
    const {c,wallet,engine}=walletHarness(),initial=plain(wallet.account().starts.pool);
    const result=await wallet.pull(engine,1,async draft=>{draft.total++;draft.pity++;
        draft.events.pendingGifts.push({name:'角色',atTotal:1});return [{name:'角色',tierId:'gold',total:1,isGold:false,pullType:'paid'}];
    },{keep:true,entries:[],selections});
    assert.ok(result);assert.equal(result.gifts.length,1);
    const account=wallet.account(),record=wallet.loadRecord();
    assert.equal(account.balances.jade,160);assert.equal(account.balances.token,20);
    assert.equal(c.SimulatorSession.valid(record),true);assert.deepEqual(plain(record.engine),plain(account.pools.pool));
    assert.equal(record.entries.length,2);assert.equal(Object.values(account.owned)[0],2);
    assert.equal(record.paymentId,'pay');
    assert.deepEqual(plain(account.starts.pool),initial);
    wallet.restoreStart();assert.equal(wallet.loadRecord(),null);assert.equal(wallet.account().balances.jade,320);
});
test('记录保存失败不会扣款或保存部分结果，失配的记录不能覆盖账户',async()=>{
    const h=walletHarness(),before=plain(h.wallet.account());h.fail();
    assert.equal(await h.wallet.pull(h.engine,1,async draft=>{draft.total++;return [{name:'角色',tierId:'gold',total:1,pullType:'paid'}];},
        {keep:true,entries:[],selections}),null);
    assert.deepEqual(plain(h.wallet.account()),before);assert.equal(h.engine.total,0);
    const h2=walletHarness(),state=h2.wallet.account();state.sessions={pool:h2.c.SimulatorSession.create(h2.engine,[],selections)};
    state.sessions.pool.engine.total=999;h2.store.set('GM_Sim_Economy_game',JSON.stringify(state));
    assert.throws(()=>h2.wallet.loadRecord(),/conflict/);
});
test('应用完整玩家账号同时恢复共享资源与各池进度，并清除旧记录；无效进度与写入失败不提交',()=>{
    const h=walletHarness(),other=h.c.GachaEngine.createState();other.pity=10;other.total=30;
    const current=h.c.GachaEngine.createState();current.pity=20;current.total=100;
    const input={balances:{jade:1600},owned:{item:7},revision:h.wallet.account().revision,resetProgress:true,pools:{pool:current,other}};
    assert.equal(h.wallet.applyStart(current,input),true);
    const account=plain(h.wallet.account());assert.equal(account.balances.jade,1600);assert.equal(account.owned.item,7);
    assert.equal(account.pools.pool.pity,20);assert.equal(account.pools.other.pity,10);assert.equal(account.starts.other.engine.pity,10);assert.deepEqual(account.sessions,{});
    const invalid=plain(other);invalid.total=-1;
    assert.equal(h.wallet.applyStart(current,{...input,revision:account.revision,pools:{pool:current,other:invalid}}),false);assert.deepEqual(plain(h.wallet.account()),account);
    h.fail();assert.equal(h.wallet.applyStart(current,{...input,revision:account.revision}),false);assert.deepEqual(plain(h.wallet.account()),account);
});
test('普通模式恢复结构化记录和候选，不抽随机数；游戏卡池独立保存',()=>{
    const store=new Map(),rendered=[],nodes={innerHTML:'',prepend(){}},checkboxes=[{value:'角色',checked:false,closest:()=>({classList:{toggle(){}}})}];
    const c=runtime({temporarySimulation:false,currentGameId:'game',currentPool:'pool',currencyModeActive:false,simPullBusy:false,simulatorLang:'zh',activeTiers:[{id:'gold'}],
        simulatorWallet:{enabled:()=>false},document:{getElementById:()=>nodes,querySelectorAll:selector=>selector.includes('-up-')?checkboxes:[]},
        localStorage:{getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)},
        getEngineSelections:()=>selections,findInRoster:name=>({name}),syncTierCardsLinkage(){},renderSimPulls:(r,t,a)=>rendered.push({r:plain(r),t,a}),renderExtraGift(){},showToast(){}});
    c.simData=c.GachaEngine.createState();c.simData.total=1;c.simData.pity=1;store.set('GM_Sim_Keep_Records','true');
    const source=read('pages/simulator.js'),start=source.indexOf('        let simRecordEntries=');
    vm.runInContext(source.slice(start,source.indexOf('        if (currencyModeActive)',start)),c);
    vm.runInContext("simRecordReady=true;simRecordEntries=SimulatorSession.additions([{name:'角色',tierId:'gold',total:1,pullType:'paid'}],[],true)",c);
    assert.equal(c.saveSimulatorRecord(),true);c.simData.total=999;assert.equal(c.restoreSimulatorRecord(),true);
    assert.equal(c.simData.total,1);assert.equal(rendered.length,1);assert.equal(rendered[0].a,true);assert.equal(checkboxes[0].checked,true);
    const savedRecord=store.get('GM_Sim_Record_game_pool_normal');c.temporarySimulation=true;c.simData.total=88;
    assert.equal(c.saveSimulatorRecord(),true);assert.equal(store.get('GM_Sim_Record_game_pool_normal'),savedRecord);
    c.temporarySimulation=false;c.simData.total=1;
    c.currentPool='other';assert.equal(c.restoreSimulatorRecord(),false);
    c.currentPool='pool';
    const broken='{broken',key='GM_Sim_Record_game_pool_normal';store.set(key,broken);
    assert.equal(c.restoreSimulatorRecord(),false);assert.equal(c.simData.total,1);
    assert.equal(c.saveSimulatorRecord(),false);assert.equal(store.get(key),broken);
    c.currentPool='pool';store.set('GM_Sim_Keep_Records','false');assert.equal(c.restoreSimulatorRecord(),false);
});
