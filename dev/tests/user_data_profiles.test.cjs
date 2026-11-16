const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const read=file=>fs.readFileSync(path.join(__dirname,'../..',file),'utf8'),plain=x=>JSON.parse(JSON.stringify(x));

test('已有玩家数据不阻挡自动初始设置，完整记录优先；无起点或恢复损坏才显示选择框',()=>{
    const source=read('pages/simulator.js'),begin=source.indexOf("        window.addEventListener('DOMContentLoaded', () => {");
    const startup=source.slice(begin,source.indexOf('        function promptSparkSelection(',begin));
    function enter({record=false,initial=true,failed=false,requested=null,startEnabled=true,profiles=[{id:'account'}]}={}){
        const calls=[];let onLoad;
        const c=require('./icon_test_context.cjs').createContext({window:{addEventListener:(type,fn)=>{onLoad=fn;},location:{href:'http://localhost/simulator.html?gameId=hsr&pool=char_up'}},
            UserDataProfiles:{read:()=>({items:profiles}),visibleRows:rows=>rows,defaultRow:rows=>rows.find(row=>row.isDefault)||rows[0]},
            currentGameId:'hsr',simulatorLang:'zh',urlParams:{get:()=>requested},simRecordRestoreFailed:failed,
            restoreSimulatorRecord:()=>{calls.push('record');return record;},restoreRememberedStart:()=>{calls.push('initial');return initial;},
            applySimulationProfile:()=>{calls.push('explicit');return true;},history:{replaceState(){}},URL,
            renderSimulatorHeader(){},renderTopConfigDrawer(){},updateSimStats(){},updateHideLowTip(){},updateResetButtonsVisibility(){},updateRotationButtonUI(){},
            startEnabled:()=>startEnabled,prepareStart:open=>calls.push(['prepare',open]),profilePicker:{open:()=>calls.push('picker')},saveSimulatorRecord(){},showToast(){}});
        vm.runInContext(startup,c);onLoad();return calls;
    }
    assert.deepEqual(enter(),['record','initial',['prepare',false]]);
    assert.deepEqual(enter({record:true}),['record',['prepare',false]]);
    assert.deepEqual(enter({initial:false}),['record','initial',['prepare',false],'picker']);
    assert.deepEqual(enter({failed:true}),['record',['prepare',false],'picker']);
    assert.deepEqual(enter({requested:'account'}),['explicit',['prepare',false]]);
    assert.deepEqual(enter({initial:false,startEnabled:false,profiles:[{id:'default',isDefault:true,pools:{},balances:{},owned:{}}]}),['record','initial','explicit',['prepare',false]]);
    assert.deepEqual(enter({initial:false,startEnabled:false,profiles:[{id:'other'},{id:'default',isDefault:true,balances:{jade:1600}}]}),['record','initial','explicit',['prepare',false]]);
    assert.deepEqual(enter({initial:false,startEnabled:false,failed:true}),['record',['prepare',false],'picker']);
});

function setup(){
    const store=new Map();let fail=false;
    const c=require('./icon_test_context.cjs').createContext({window:{},localStorage:{getItem:k=>store.get(k)??null,setItem:(k,v)=>{if(fail)throw Error('quota');store.set(k,v);}}});
    for(const file of ['Preset_Data/db_hsr.js','Preset_Data/db_zzz.js','Preset_Data/db_end.js','Preset_Data/db_ark.js','logic/catalog_utils.js','logic/game_data.js','logic/gacha_engine.js','logic/simulator_start.js','logic/user_data_profiles.js']){
        vm.runInContext(read(file),c);Object.assign(c,c.window);
    }
    return {c,store,api:c.UserDataProfiles,fail:()=>fail=true};
}
test('玩家数据按游戏保存，编辑和删除校验版本，不改写规则或实时账户',()=>{
    const {c,store,api,fail}=setup(),engine=c.GachaEngine.createState();
    store.set('GM_Sim_Economy_hsr','live');store.set('GM_Info_hsr','{}');
    const row={id:'a',name:'我的起点',poolId:'char_up',engine,balances:{jade:1600},owned:{}};
    api.save('hsr',row,0);row.balances.jade=0;assert.equal(api.read('hsr').items[0].balances.jade,1600);
    const second={...plain(row),id:'b',poolId:'wep_up'};api.save('hsr',second,1);
    assert.equal(api.read('hsr').items.length,2);assert.equal(api.read('zzz').items.length,0);
    assert.equal(store.get('GM_Sim_Economy_hsr'),'live');assert.equal(store.get('GM_Info_hsr'),'{}');
    assert.throws(()=>api.save('hsr',row,1),/changed/);assert.throws(()=>api.remove('hsr','a',1),/changed/);
    api.remove('hsr','a',2);assert.deepEqual(plain(api.read('hsr').items).map(r=>r.id),['b']);
    const before=store.get(api.key('hsr'));fail();assert.throws(()=>api.save('hsr',row,3),/quota/);assert.equal(store.get(api.key('hsr')),before);
});
test('旧单池数据无损迁移为账号数据，余额与持有共用，各卡池进度独立',()=>{
    const {c,api,store}=setup(),char=c.GachaEngine.createState(1),wep=c.GachaEngine.createState(1);char.total=100;char.pity=20;wep.total=30;wep.pity=10;
    const legacy={id:'old',name:'旧数据',poolId:'char_up',engine:char,balances:{jade:1600},owned:{'["char","a"]':7}};
    const raw=JSON.stringify({version:1,revision:2,items:[legacy]});store.set(api.key('hsr'),raw);
    const data=api.read('hsr');assert.equal(data.version,2);assert.equal(data.items[0].poolId,undefined);assert.deepEqual(plain(data.items[0].pools.char_up),plain(char));assert.equal(store.get(api.key('hsr')),raw);
    const row=data.items[0];row.pools.wep_up=wep;api.save('hsr',row,2);assert.equal(JSON.parse(store.get(api.key('hsr'))).version,2);
    const a=api.project(row,'char_up',api.context('hsr','char_up')),b=api.project(row,'wep_up',api.context('hsr','wep_up'));
    assert.equal(a.engine.pity,20);assert.equal(b.engine.pity,10);assert.deepEqual(plain(a.balances),plain(b.balances));assert.deepEqual(plain(a.owned),plain(b.owned));
    b.owned['["char","a"]']=99;assert.equal(row.owned['["char","a"]'],7);
    assert.equal(api.project(row,'mixed_std',api.context('hsr','mixed_std')).engine.total,0);
    const context=api.accountContext('hsr');assert.equal(Object.keys(context.poolContexts).length,5);
    assert.ok(context.catalog.some(i=>i.category==='wep'&&i.tierId==='tier_5'));assert.ok(context.catalog.some(i=>i.category==='char'&&i.tierId==='tier_5'));
    assert.equal(new Set(context.catalog.map(i=>JSON.stringify([i.category,i.id||i.name]))).size,context.catalog.length);
});
test('玩家名称中英文分别保存与回退，修改一侧不丢失另一侧，兼容只有中文的旧数据',()=>{
    const {c,api}=setup(),row={id:'names',name:'清天·浅使',en:'Sky',pools:{},balances:{},owned:{}};
    api.save('hsr',row,0);const saved=api.read('hsr').items[0];
    assert.equal(api.label(saved,'zh'),'清天·浅使');assert.equal(api.label(saved,'en'),'Sky');
    saved.en='New Sky';api.save('hsr',saved,1);assert.equal(api.read('hsr').items[0].name,'清天·浅使');
    saved.name='';api.save('hsr',saved,2);assert.equal(api.label(api.read('hsr').items[0],'zh'),'New Sky');
    assert.equal(api.label({name:'旧名称'},'en'),'旧名称');assert.equal(api.valid({...row,en:123}),false);
});
test('各池进度读取最新拖拽顺序，忽略失效卡池并把新增池保留在后面',()=>{
    const {api,store}=setup();
    store.set('GM_Pool_Order_hsr',JSON.stringify(['removed','mixed_std','wep_up','wep_up','char_up']));
    assert.deepEqual(plain(api.orderedPoolIds('hsr')),['mixed_std','wep_up','char_up','char_collab','wep_collab']);
    assert.deepEqual(Object.keys(api.accountContext('hsr').poolContexts),['mixed_std','wep_up','char_up','char_collab','wep_collab']);
    store.set('GM_Pool_Order_hsr',JSON.stringify(['wep_collab','char_up','mixed_std']));
    assert.deepEqual(Object.keys(api.accountContext('hsr').poolContexts),['wep_collab','char_up','mixed_std','wep_up','char_collab']);
    store.set('GM_Pool_Order_hsr','bad json');assert.equal(api.orderedPoolIds('hsr')[0],'char_up');
});
test('默认账户每游戏唯一，切换与取消默认同步保存，单一模式优先默认且失败不提交',()=>{
    const {api,store,fail}=setup(),row=id=>({id,name:id,pools:{},balances:{jade:1600},owned:{}});
    api.save('hsr',{...row('a'),isDefault:true},0);api.save('hsr',{...row('b'),isDefault:true},1);
    let data=api.read('hsr');assert.deepEqual(plain(data.items).map(r=>r.isDefault),[false,true]);
    assert.equal(api.defaultRow(data.items).id,'b');assert.equal(api.visibleRows(data.items)[0].id,'b');
    assert.equal(api.read('zzz').items.length,0);assert.equal(api.valid({...row('bad'),isDefault:'true'}),false);
    assert.throws(()=>api.save('hsr',{...row('a'),isDefault:true},1),/changed/);assert.equal(api.defaultRow(api.read('hsr').items).id,'b');
    api.save('hsr',{...data.items[1],isDefault:false},2);data=api.read('hsr');assert.equal(api.defaultRow(data.items).id,'a');
    api.save('hsr',{...data.items[1],isDefault:true},3);api.remove('hsr','b',4);assert.equal(api.defaultRow(api.read('hsr').items).id,'a');
    assert.equal(api.defaultRow([]),null);
    const before=store.get(api.key('hsr'));fail();assert.throws(()=>api.save('hsr',{...row('b'),isDefault:true},5),/quota/);assert.equal(store.get(api.key('hsr')),before);
});
test('玩家卡池字段只显示已配置和启用的保底、井、救援与赠送规则',()=>{
    const {c}=setup(),base={strictRules:true,targetGoldIds:['gold'],minorPities:[],globalTiers:[],rules:{}};
    assert.deepEqual(plain(c.SimulatorStart.fields(base)).map(f=>f.key),['total']);
    const rules={pities:[{tierId:'gold',pulls:90,enableUp:true,useGuarantee:false}],secondaryRescue:{enabled:false},sparkRules:[{limit:100,type:'loop'},{enabled:false,limit:200}],giftRules:[{enabled:false,trigger:10}]};
    const configured={...base,rules};assert.deepEqual(plain(c.SimulatorStart.fields(configured)).map(f=>f.key),['pity','total','spark:0']);
    rules.pities[0].useGuarantee=true;rules.secondaryRescue.enabled=true;
    const keys=plain(c.SimulatorStart.fields(configured)).map(f=>f.key);assert.ok(keys.includes('guarantee'));assert.ok(keys.includes('rescue'));assert.ok(!keys.includes('gift:0'));
    const fields=c.SimulatorStart.fields(configured),values=Object.fromEntries(fields.map(f=>[f.key,f.value]));
    assert.equal(c.SimulatorStart.valid(c.SimulatorStart.build(configured,values)),true);
});
test('完整玩家表单的提示节点明确定位，整游戏持有及多卡池进度能同时保存',()=>{
    const {c,api}=setup(),context=api.accountContext('hsr'),seed={id:'a',name:'账号',balances:{jade:20},owned:{},pools:{}};
    const fields=Object.entries(context.poolContexts).flatMap(([id,ctx])=>c.SimulatorStart.fields(ctx).map(f=>({dataset:{startField:f.key,startPool:id},value:String(f.value),type:f.checkbox?'checkbox':'number',checked:!!f.value})));
    const nodes=Object.fromEntries(['h3','.sim-wallet-note','[data-start-account-note]','[data-start-continue]','[type="submit"]','[data-start-fill-low]','[data-start-fill-status]','[data-start-search]','[data-start-error]','form'].map(k=>[k,{}]));
    nodes['[data-start-name]']={value:'我的账号'};
    const dialog={open:false,innerHTML:'',showModal(){this.open=true;},close(){this.open=false;},querySelector:s=>nodes[s]||null,querySelectorAll:s=>s==='[data-start-field]'?fields:[]};
    c.document={createElement:()=>dialog,body:{append(){}}};c.showToast=()=>{};let saved=null;
    vm.runInContext(read('ui/state_toggle.js'),c);vm.runInContext(read('ui/simulator_start.js'),c);
    const ui=c.window.SimulatorStartUI.mount({...context,profile:true,getDraft:()=>seed,account:()=>({revision:0,owned:{}}),currencyEnabled:()=>true,isBusy:()=>false,apply:(engine,holdings,meta)=>{saved={holdings,meta};return true;}});
    assert.doesNotThrow(()=>ui.open());assert.equal(dialog.open,true);assert.doesNotMatch(dialog.innerHTML,/data-start-account-note/);assert.match(dialog.innerHTML,/data-start-pool="wep_up"/);

    nodes.form.onsubmit({preventDefault(){}});assert.equal(Object.keys(saved.meta.pools).length,5);assert.equal(saved.meta.name,'我的账号');
});
test('无效数量、损坏存档不会被空列表覆盖；四游戏全部卡池生成对应起点字段及持有候选',()=>{
    const {c,store,api}=setup();
    const row={id:'a',name:'',poolId:'p',engine:c.GachaEngine.createState(),balances:{},owned:{}};
    assert.equal(!!api.valid(row),false);row.name='valid';row.balances.jade=-1;assert.equal(!!api.valid(row),false);
    store.set(api.key('bad'),'{broken');assert.throws(()=>api.read('bad'));assert.equal(store.get(api.key('bad')),'{broken');
    let count=0;
    for(const game of ['hsr','zzz','ark','end'])for(const pool of c.GameData.loadPoolIds(game,{standaloneOnly:true})){
        const context=api.context(game,pool),fields=c.SimulatorStart.fields(context);
        const state=c.SimulatorStart.build(context,Object.fromEntries(fields.map(f=>[f.key,f.value])));
        assert.equal(c.SimulatorStart.valid(state),true);assert.equal(state.total,0);assert.ok(context.catalog.length>0);
        assert.equal(new Set(context.catalog.map(i=>JSON.stringify([i.category,i.id||i.name]))).size,context.catalog.length);count++;
    }
    assert.equal(count,20);
    const chars=api.context('hsr','char_up').catalog;
    assert.equal(chars.some(i=>i.category==='wep'&&i.tierId==='tier_5'),false);
    assert.equal(chars.some(i=>i.category==='wep'&&i.tierId==='tier_3'),true);
});
test('应用数据只复制起点，空白入口清零；货币模式应用失败不清除原结果',()=>{
    const {c,api,store}=setup(),source=read('pages/simulator.js');let full=false,saved=null,clears=0,accept=true;
    Object.assign(c,{temporarySimulation:false,temporaryNormalStart:null,simPullBusy:false,currentPool:'char_up',normalStartKey:'normal',simulatorLang:'zh',simData:c.GachaEngine.createState(),
        simulatorWallet:{enabled:()=>full,account:()=>({revision:7}),applyStart:(engine,holdings)=>{saved={engine:plain(engine),holdings:plain(holdings)};return accept;},render(){}},
        clearSimulatorResults:()=>clears++,showToast(){}});
    const start=source.indexOf('        function applySimulationProfile(');vm.runInContext(source.slice(start,source.indexOf('        const profilePicker=',start)),c);
    const engine=c.GachaEngine.createState();engine.pity=20;engine.total=100;
    const row={poolId:'char_up',engine,balances:{jade:1600},owned:{},id:'account',name:'我的账号',en:'My account'};
    assert.equal(c.applySimulationProfile(row),true);assert.equal(c.simData.total,100);c.simData.total=999;assert.equal(row.engine.total,100);
    assert.equal(JSON.parse(store.get('normal')).engine.pity,20);full=true;accept=false;
    assert.equal(c.applySimulationProfile(row),false);assert.equal(clears,1);assert.equal(c.simData.total,999);
    accept=true;assert.equal(c.applySimulationProfile(row),true);assert.equal(saved.holdings.revision,7);assert.equal(saved.holdings.resetProgress,true);
    assert.deepEqual(saved.holdings.profile,{id:'account',name:'我的账号',en:'My account'});
    assert.equal(c.applySimulationProfile({poolId:'char_up',engine:c.GachaEngine.createState(),balances:{},owned:{}}),true);
    assert.equal(c.simData.total,0);assert.deepEqual(saved.holdings.balances,{});assert.equal(row.balances.jade,1600);
    assert.equal(c.applySimulationProfile({...row,poolId:'wep_up'}),false);
    c.currentGameId='hsr';c.minorPities=[{}];
    const wep=c.GachaEngine.createState(1);wep.pity=10;wep.total=30;
    const player={pools:{char_up:engine,wep_up:wep},balances:{jade:1600},owned:{'["char","a"]':7}};
    c.currentPool='wep_up';assert.equal(c.applySimulationProfile(player),true);
    assert.equal(c.simData.pity,10);assert.equal(saved.holdings.pools.char_up.pity,20);assert.equal(Object.keys(saved.holdings.pools).length,5);
    assert.equal(saved.holdings.owned['["char","a"]'],7);
    full=false;c.temporarySimulation=true;
    const baseline=store.get('normal');
    assert.equal(c.applySimulationProfile(player),true);
    assert.equal(c.temporaryNormalStart.pity,10);assert.equal(store.get('normal'),baseline);
    c.simData.pity=11;assert.equal(c.temporaryNormalStart.pity,10);
});


test('玩家数据自动补齐低星不依赖模拟器开关，保留高数量和存档，还原可恢复原值',()=>{
    const {c,store,api}=setup(),context=api.accountContext('ark');
    const targets=c.SimulatorStart.lowRarityCaps(context);assert.ok(targets.length>1);
    const key=index=>JSON.stringify([context.catalog[index].category,context.catalog[index].id||context.catalog[index].name]);
    const seed={name:'Account',owned:{[key(targets[1].index)]:1000},balances:{},pools:{}};
    const before=plain(seed),inputs=context.catalog.map((item,index)=>({dataset:{startOwned:String(index)},value:'0'}));
    const nodes=Object.fromEntries(['h3','.sim-wallet-note','[data-start-account-note]','[data-start-continue]','[type="submit"]','[data-start-fill-low]','[data-start-fill-status]','[data-start-search]','[data-start-error]','form'].map(key=>[key,{}]));
    nodes['[data-start-name]']={value:'Account'};
    const host={className:'',set innerHTML(value){inputs.forEach(input=>input.value='0');},
        querySelector(selector){return selector.startsWith('[data-start-owned="')?inputs[Number(selector.match(/"(\d+)"/)[1])]:nodes[selector]||null;},
        querySelectorAll:selector=>selector==='[data-start-owned]'?inputs:[]};
    c.document={createElement:()=>host,body:{append(){}}};c.showToast=()=>{};
    store.set('GM_Sim_Currency_Mode','false');store.set('GM_Sim_Start_Setup','false');
    vm.runInContext(read('ui/state_toggle.js'),c);vm.runInContext(read('ui/simulator_start.js'),c);let changes=0,reverts=0;
    const editor=c.window.SimulatorStartUI.mount({...context,host,profile:true,getDraft:()=>seed,
        account:()=>({revision:0}),currencyEnabled:()=>true,isBusy:()=>false,apply:()=>true,
        onAutoFill:count=>changes+=count,onRevert:()=>reverts++});
    editor.open();assert.ok(changes>0);assert.equal(inputs[targets[0].index].value,String(targets[0].cap));
    assert.equal(inputs[targets[1].index].value,'1000');assert.deepEqual(plain(seed),before);
    assert.equal(nodes['[data-start-fill-low]'].hidden,true);
    nodes['[data-start-continue]'].onclick();assert.equal(reverts,1);assert.equal(inputs[targets[0].index].value,'0');
    store.set('GM_Sim_Start_Auto_Low_Overflow','false');editor.open();
    assert.equal(inputs[targets[0].index].value,'0');assert.equal(nodes['[data-start-fill-low]'].hidden,false);
    store.delete('GM_Sim_Start_Auto_Low_Overflow');
    const fresh=c.window.SimulatorStartUI.mount({...context,host,profile:true,createFlow:false,getDraft:()=>null,
        account:()=>({revision:0}),currencyEnabled:()=>true,isBusy:()=>false,apply:()=>true});
    fresh.open();assert.equal(inputs[targets[0].index].value,String(targets[0].cap));
});


test('历史汇总独立于持有，校验数量关系，空白与明确零不同，反复保存不累加',()=>{
    const {c,api}=setup(),state=c.GachaEngine.createState(1);state.total=120;state.pity=60;
    const row={id:'history',name:'历史',purpose:'record',pools:{char_up:plain(state)},recordInitial:{char_up:plain(state)},balances:{},owned:{gift:999},recordStats:{char_up:api.historyStats('5','3',120)}};
    api.save('hsr',row,0);api.save('hsr',row,1);
    const saved=api.read('hsr').items[0],before=plain(saved);
    assert.deepEqual(plain(api.statistics(saved,'char_up',{total:30,gold:1,up:0,lost:1})),{total:150,gold:6,up:3,lost:3,initialPulls:120,hasHistory:true});
    assert.deepEqual(plain(saved),before);assert.equal(saved.pools.char_up.pity,60);assert.equal(saved.owned.gift,999);
    assert.equal(api.historyStats('','',120),null);
    assert.deepEqual(plain(api.historyStats('0','0',120)),{gold:0,up:0});
    for(const values of [['','0'],['5',''],['2','3'],['-1','0'],['1.5','0'],['121','0']])assert.throws(()=>api.historyStats(...values,120));
    assert.equal(api.valid({...row,recordStats:{char_up:{gold:2,up:3}}}),false);
    const old={...row};delete old.recordStats;
    assert.deepEqual(plain(api.statistics(old,'char_up',{total:30,gold:1,up:0,lost:1})),{total:150,gold:1,up:0,lost:1,initialPulls:120,hasHistory:false});
    assert.equal(api.statistics(saved,'wep_up',{total:2,gold:0,up:0,lost:0}).total,2);
});


test('玩家页跨页更新在无草稿时刷新进度并保留展开状态，有草稿时只刷新警示',()=>{
    const source=read('pages/user_data.js'),begin=source.indexOf('    function refreshSyncWarnings(){'),end=source.indexOf("    window.addEventListener('focus'",begin);
    const element=()=>({open:false,details:[{open:false},{open:true}],querySelectorAll(){return this.details;}});
    for(const dirty of [false,true]){
        let renders=0,warnings=0;
        const old=element();old.open=true;old.details[0].open=true;old.details[1].open=false;
        const c=require('./icon_test_context.cjs').createContext({context:{},game:'hsr',revision:1,cards:[{row:{id:'a'},element:old,updateSyncWarning:()=>warnings++}],
            UserDataProfiles:{read:()=>({revision:2,items:[{id:'a'}]}),mode:()=> 'multi'},hasDrafts:()=>dirty,report:error=>assert.fail(error.message)});
        c.render=()=>{renders++;c.revision=2;c.cards=[{row:{id:'a'},element:element(),updateSyncWarning:()=>warnings++}];};
        vm.runInContext(source.slice(begin,end),c);c.refreshSyncWarnings();
        assert.equal(renders,dirty?0:1);assert.equal(warnings,dirty?1:0);
        if(!dirty){assert.equal(c.cards[0].element.open,true);assert.deepEqual(c.cards[0].element.details.map(d=>d.open),[true,false]);}
    }
});


test('旧起点全部为垫抽时补齐零金零UP，不根据持有猜测，不静默改写存档',()=>{
    const {c,api,store}=setup(),state=c.GachaEngine.createState(1);state.total=state.pity=30;
    const row={id:'old-zero',name:'旧账号',pools:{char_up:plain(state)},balances:{},owned:{gift:999}};
    api.save('hsr',row,0);const raw=store.get(api.key('hsr')),saved=api.read('hsr').items[0];
    assert.deepEqual(plain(api.summary(saved,'char_up')),{gold:0,up:0});
    assert.deepEqual(plain(api.statistics(saved,'char_up',{total:10,gold:0,up:0,lost:0})),{total:40,gold:0,up:0,lost:0,initialPulls:30,hasHistory:true});
    assert.equal(store.get(api.key('hsr')),raw);
    assert.throws(()=>api.save('hsr',{...saved,recordStats:{char_up:{gold:1,up:0}}},1),/summary is locked/);
    const uncertain={...row,pools:{char_up:{...plain(state),total:120,pity:70,guaranteeCount:1}}};
    assert.equal(api.summary(uncertain,'char_up'),null);
    assert.equal(api.summary({...row,pools:{char_up:{...plain(state),goldCount:1}}},'char_up'),null);
});

test('旧未知汇总允许补填一次，保存后禁止修改或清空，货币默认及模拟账号仍可编辑',()=>{
    const {c,api}=setup(),state=c.GachaEngine.createState(1);state.total=120;state.pity=70;state.guaranteeCount=1;
    let row={id:'old-unknown',name:'旧账号',pools:{char_up:plain(state)},balances:{},owned:{}};
    api.save('hsr',row,0);assert.equal(api.summary(row,'char_up'),null);
    row=api.save('hsr',{...row,recordStats:{char_up:{gold:1,up:0}}},1);
    assert.throws(()=>api.save('hsr',{...row,recordStats:{char_up:{gold:2,up:0}}},2),/summary is locked/);
    assert.throws(()=>api.save('hsr',{...row,recordStats:{}},2),/summary is locked/);
    api.save('hsr',{...row,isDefault:true,balances:{jade:160}},2);
    const sim={...row,id:'sim-summary',purpose:'simulation'};api.save('hsr',sim,3);
    api.save('hsr',{...sim,recordStats:{char_up:{gold:2,up:1}}},4);
    assert.equal(api.read('hsr').items.find(r=>r.id==='sim-summary').recordStats.char_up.gold,2);
});


test('历史汇总受硬保底、垫抽与大保底约束，错误旧汇总可修正后重新锁定',()=>{
    const {c,api,store}=setup(),context=api.context('hsr','char_up'),state=c.GachaEngine.createState(1);
    state.total=120;state.pity=60;state.guaranteeCount=state.guaranteeLosses=1;
    const check=summary=>c.SimulatorStart.summaryErrors(context,state,summary);
    assert.ok(check({gold:0,up:0}).length);assert.equal(check({gold:1,up:0}).length,0);
    assert.ok(check({gold:1,up:1}).length);assert.ok(check({gold:3,up:0}).length);
    assert.ok(c.SimulatorStart.summaryErrors(context,{...plain(state),pity:0},{gold:1,up:0}).some(text=>text.includes('至少需要 2 金')));
    assert.ok(c.SimulatorStart.summaryErrors(context,{...plain(state),total:30,pity:30,guaranteeCount:0,guaranteeLosses:0},{gold:1,up:1}).length);
    const old={id:'bad',name:'旧错误汇总',purpose:'record',pools:{char_up:plain(state)},recordInitial:{char_up:plain(state)},recordStats:{char_up:{gold:0,up:0}},balances:{},owned:{}};
    // 代表旧版本已接受的错误存档，读取和默认勾选不能因此崩溃。
    store.set(api.key('hsr'),JSON.stringify({version:2,revision:0,items:[old]}));
    assert.equal(api.summaryLocked('hsr',old,'char_up'),false);
    assert.equal(api.statistics(old,'char_up',{total:30,gold:1,up:1,lost:0},'hsr').hasHistory,false);
    const before=store.get(api.key('hsr'));
    assert.throws(()=>api.save('hsr',{...old,recordStats:{char_up:{gold:3,up:0}}},0));assert.equal(store.get(api.key('hsr')),before);
    const fixed=api.save('hsr',{...old,recordStats:{char_up:{gold:1,up:0}}},0);
    assert.equal(api.summaryLocked('hsr',fixed,'char_up'),true);
    assert.throws(()=>api.save('hsr',{...fixed,recordStats:{char_up:{gold:2,up:1}}},1),/summary is locked/);
    assert.equal(api.statistics(fixed,'char_up',{total:30,gold:1,up:1,lost:0},'hsr').gold,2);
});


test('未填历史汇总也阻止矛盾的当前进度，非法保存不落盘',()=>{
    const {c,api,store}=setup(),state=c.GachaEngine.createState(1);state.total=state.pity=5;state.guaranteeCount=1;
    const row={id:'invalid-progress',name:'矛盾进度',purpose:'record',pools:{char_up:plain(state)},balances:{},owned:{}};
    assert.throws(()=>api.save('hsr',row,0),/当前歪数/);assert.equal(store.get(api.key('hsr')),undefined);
    state.guaranteeCount=0;row.pools.char_up=plain(state);api.save('hsr',row,0);
    const before=store.get(api.key('hsr'));state.total=2;row.pools.char_up=plain(state);
    assert.throws(()=>api.save('hsr',row,1));assert.equal(store.get(api.key('hsr')),before);
});


test('零进度且无录入记录的卡池可补填，保存非零起点后锁定，其他卡池独立判断',()=>{
    const {c,api}=setup(),zero=plain(c.GachaEngine.createState(1));
    const row={id:'empty-pool',name:'空池',purpose:'record',pools:{char_up:plain(zero),wep_up:plain(zero)},recordInitial:{char_up:plain(zero)},recordStats:{char_up:{gold:0,up:0}},balances:{jade:100},owned:{item:3}};
    api.save('hsr',row,0);
    assert.equal(api.locked(row),true);
    assert.equal(api.poolLocked(row,'char_up'),false);
    assert.equal(api.summaryLocked('hsr',row,'char_up'),false);
    for(const change of [
        r=>r.pools.char_up.minorPityCounters[0]=1,
        r=>r.recordInitial.char_up.total=1,
        r=>r.recordStats.char_up.gold=1,
        r=>r.pools.char_up.freeQueue.push({remaining:1,countPity:false}),
        r=>r.dashboardRecords={char_up:{records:[{}]}},
        r=>r.dashboardRecords={char_up:{records:[],sync:{baseRecords:[{}]}}}
    ]){const changed=plain(row);change(changed);assert.equal(api.poolLocked(changed,'char_up'),true);}
    const filled=plain(row);filled.pools.char_up.total=filled.pools.char_up.pity=30;
    filled.recordInitial.char_up=plain(filled.pools.char_up);
    api.save('hsr',filled,1);
    const saved=api.read('hsr').items[0];
    assert.equal(api.initial(saved,'char_up').total,30);
    assert.equal(api.poolLocked(saved,'char_up'),true);
    assert.equal(api.summaryLocked('hsr',saved,'char_up'),true);
    assert.equal(api.poolLocked(saved,'wep_up'),false);
    assert.deepEqual(plain(saved.owned),row.owned);
    assert.equal(api.poolLocked({...saved,purpose:'simulation'},'char_up'),false);
});

test('账户拖拽排序持久化，仅改顺序，默认、用途与记录保留，冲突和写入失败不部分保存',()=>{
    const {c,api,store,fail}=setup(),state=plain(c.GachaEngine.createState(1));
    for(const [index,id] of ['a','b','c'].entries())api.save('hsr',{id,name:id,purpose:index===1?'simulation':'record',isDefault:index===0,pools:{char_up:plain(state)},balances:{jade:index},owned:{},dashboardRecords:{char_up:{records:[]}}},index);
    const original=plain(api.read('hsr').items);
    let sorted=api.reorder('hsr','c','a',true,3);
    assert.deepEqual(plain(sorted.items.map(row=>row.id)),['c','a','b']);assert.equal(sorted.revision,4);
    sorted=api.reorder('hsr','c','b',false,4);
    assert.deepEqual(plain(sorted.items.map(row=>row.id)),['a','b','c']);assert.equal(sorted.revision,5);
    for(const row of sorted.items)assert.deepEqual(plain(row),original.find(old=>old.id===row.id));
    const before=store.get(api.key('hsr'));
    assert.throws(()=>api.reorder('hsr','b','a',true,4),/changed/);assert.equal(store.get(api.key('hsr')),before);
    assert.throws(()=>api.reorder('hsr','missing','a',true,5),/missing/);
    assert.equal(api.reorder('hsr','a','b',true,5).revision,5);assert.equal(store.get(api.key('hsr')),before);
    fail();assert.throws(()=>api.reorder('hsr','c','a',true,5),/quota/);assert.equal(store.get(api.key('hsr')),before);
});
