const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const read=file=>fs.readFileSync(path.join(__dirname,'../..',file),'utf8');
const ctx=require('./icon_test_context.cjs').createContext({window:{}});vm.runInContext(read('logic/gacha_engine.js'),ctx);
ctx.GachaEngine=ctx.window.GachaEngine;vm.runInContext(read('logic/simulator_start.js'),ctx);
const api=ctx.window.SimulatorStart,engine=ctx.GachaEngine,plain=x=>JSON.parse(JSON.stringify(x));
const context={rules:{pities:[{tierId:'gold',pulls:90,isGold:true,enableUp:true,guaranteeLimit:1}],
    secondaryRescue:{enabled:true,hardGuaranteeLosses:3},earlyUpRules:[{order:1},{order:2}],goldCategorySequence:[{order:1}],
    sparkRules:[{limit:120,type:'once',cancelOnHit:true},{limit:240,type:'loop'}],giftRules:[{trigger:30,type:'once'}]},
    targetGoldIds:['gold'],minorPities:[{tierId:'silver',pulls:10}],globalTiers:[{id:'silver',name:'四星',en:'4-star'}]};
const values=full=>Object.fromEntries(api.fields(context,engine.createState(1),full).map(f=>[f.key,f.value]));

test('单一数据展开外层面板时，图鉴星级仍默认收起',()=>{
    const source=read('ui/simulator_start.js');
    const expand=source.match(/if\(context\.expandAll\)\{dialog\.classList\.add\('sim-start-expanded'\);[^\n]+/)[0];
    const outer={open:false},tier={open:false};
    vm.runInNewContext(expand,{context:{expandAll:true},dialog:{classList:{add(){}},querySelectorAll(selector){
        assert.equal(selector,'details:not([data-start-tier])');return [outer];
    }}});
    assert.equal(outer.open,true);assert.equal(tier.open,false);
    assert.match(source,/<details data-start-tier="\$\{esc\(tier\.id\)\}"><summary/);
});
test('持有列表限定于当前池候选范围，保留低星武器但排除五星武器',()=>{
    const catalog=[{name:'限定角色',tierId:'gold',category:'char'},{name:'其他UP',tierId:'gold',category:'char'},
        {name:'五星武器',tierId:'gold',category:'wep'},{name:'常驻角色',tierId:'gold',category:'char'},
        {name:'低星武器',tierId:'silver',category:'wep'},{name:'未勾选低星',tierId:'silver',category:'char'},
        {name:'限定角色',tierId:'silver',category:'char'}];
    const selection={gold:{up:['限定角色'],std:['常驻角色'],spec:['五星武器']},silver:{up:[],std:['低星武器']}};
    assert.deepEqual(plain(api.poolCatalog(catalog,selection)).map(i=>i.name),['限定角色','常驻角色','低星武器']);
    selection.gold.up=['其他UP'];selection.silver.std=[];
    assert.deepEqual(plain(api.poolCatalog(catalog,selection)).map(i=>i.name),['其他UP','常驻角色']);
    assert.deepEqual(plain(api.poolCatalog(catalog,{})),[]);
    const filtered=api.poolCatalog(catalog,{gold:{std:['常驻角色']},silver:{std:['低星武器']}});
    assert.deepEqual(plain(api.lowRarityCaps({catalog:filtered,globalTiers:[{id:'gold'},{id:'silver'}],targetGoldIds:['gold'],rules:{},info:{overflowRules:{wep:5}}})),[{index:1,cap:5}]);
});
test('持有先按大类再按星级分组，同星角色与武器分开且保留原持有索引',()=>{
    const catalog=[{name:'角色金',category:'char',tierId:'gold',startGroup:'up'},
        {name:'武器金',category:'wep',tierId:'gold',startGroup:'up'},
        {name:'角色银',category:'char',tierId:'silver',startGroup:'std'},
        {name:'武器银',category:'wep',tierId:'silver',startGroup:'std'},
        {name:'自建物品',category:'custom',tierId:'gold',startGroup:'std'}];
    const before=plain(catalog),groups=plain(api.ownedCategoryGroups(catalog,[{id:'gold'},{id:'silver'}],[{id:'wep',name:'光锥',en:'Light Cones',icon:'🗡️'},{id:'char',name:'角色',en:'Characters',icon:'👤'},{id:'empty',name:'空类别'}]));
    assert.deepEqual(groups.map(g=>g.id),['wep','char','custom']);assert.equal(groups[0].en,'Light Cones');
    assert.deepEqual(groups[0].tiers.map(t=>t.id),['gold','silver']);
    assert.deepEqual(groups[0].tiers.flatMap(t=>[...t.up,...t.std]).map(entry=>entry.index),[1,3]);
    assert.deepEqual(groups[1].tiers.flatMap(t=>[...t.up,...t.std]).map(entry=>entry.index),[0,2]);
    assert.equal(groups[2].tiers[0].std[0].index,4);assert.deepEqual(plain(catalog),before);
});
test('读取完整候选不受临时勾选影响，分星级并把重复物品只归入常驻',()=>{
    const source=read('pages/simulator.js'),start=source.indexOf('        function getEngineCandidates()');
    const inputs={'.sim-up-cb-gold':[{value:'限定',checked:true},{value:'临时未选',checked:false},{value:'双标签',checked:true}],
        '.sim-std-cb-gold':[{value:'双标签',checked:false},{value:'常驻',checked:false}],
        '.sim-up-cb-silver':[],'.sim-std-cb-silver':[{value:'低星',checked:false}]};
    const c=require('./icon_test_context.cjs').createContext({activeTiers:[{id:'gold'},{id:'silver'}],document:{querySelectorAll:selector=>{assert.ok(!selector.includes(':checked'));return inputs[selector];}}});
    vm.runInContext(source.slice(start,source.indexOf('        function getEngineSelections()',start)),c);
    const candidates=plain(c.getEngineCandidates());
    for(const list of Object.values(inputs))for(const input of list)input.checked=!input.checked;
    assert.deepEqual(plain(c.getEngineCandidates()),candidates);
    const catalog=['限定','临时未选','双标签','常驻'].map(name=>({name,category:'char',tierId:'gold'}));
    catalog.push({...catalog[2]},{name:'低星',category:'wep',tierId:'silver'},{name:'池外',category:'wep',tierId:'gold'});
    const scoped=api.poolCatalog(catalog,candidates),groups=plain(api.ownedGroups(scoped,[{id:'gold',name:'5星'},{id:'silver',name:'4星'},{id:'unused'}]));
    assert.equal(scoped.length,5);assert.deepEqual(groups.map(g=>g.id),['gold','silver']);
    assert.deepEqual(groups[0].up.map(entry=>entry.item.name),['限定','临时未选']);
    assert.deepEqual(groups[0].std.map(entry=>entry.item.name),['双标签','常驻']);
    assert.deepEqual(groups[1].std.map(entry=>entry.item.name),['低星']);
    assert.equal(scoped.filter(item=>item.name==='双标签').length,1);
});
test('低星按大类检测满阶阈值，排除金阶、未知稀有度及无效阈值',()=>{
    const setup={info:{overflowRules:{char:7,wep:5,bad:0,other:6}},
        globalTiers:[{id:'top'},{id:'second'},{id:'third'},{id:'bottom'}],targetGoldIds:['second'],rules:{tiers:[]},
        catalog:[{category:'char',tierId:'top'},{category:'wep',tierId:'second'},
            {category:'char',tierId:'third'},{category:'wep',tierId:'bottom'},
            {category:'custom',tierId:'bottom'},{category:'bad',tierId:'third'},{category:'char',tierId:'unknown'}]};
    assert.deepEqual(plain(api.lowRarityCaps(setup)),[{index:2,cap:7},{index:3,cap:5},{index:4,cap:6}]);
    setup.info.overflowRules={};assert.deepEqual(plain(api.lowRarityCaps(setup)),[{index:2,cap:5},{index:3,cap:5},{index:4,cap:5},{index:5,cap:5}]);
});
test('一键填充只改持有草稿、保留更高数值，搜索隐藏项也会填充并随应用保存',()=>{
    const catalog=[{id:'g',name:'金',tierId:'gold',category:'char'},
        {id:'a',name:'低星甲',tierId:'silver',category:'char'},
        {id:'b',name:'低星乙',tierId:'silver',category:'char'},
        {id:'c',name:'低星武器',tierId:'bronze',category:'wep'}];
    const setup={...context,info:{overflowRules:{char:7,wep:5},economy:{resources:[{id:'jade',name:'玉'}]}},catalog,
        globalTiers:[{id:'gold'},{id:'silver'},{id:'bronze'}]};
    const owned=[1,0,99,2].map((n,i)=>({value:String(n),dataset:{startOwned:String(i)}}));
    const fieldInputs=api.fields(setup,engine.createState(1),true).map(f=>({dataset:{startField:f.key},value:String(f.value),type:f.checkbox?'checkbox':'number',checked:!!f.value}));
    const button={},status={},search={value:''},form={},close={},error={};let saved=null;
    const rows=catalog.map(item=>({dataset:{startItem:item.name},hidden:false}));
    const dialog={open:false,innerHTML:'',showModal(){this.open=true;},close(){this.open=false;},
        querySelector(selector){
            const index=selector.match(/^\[data-start-owned="(\d+)"\]$/);if(index)return owned[Number(index[1])];
            return {'[data-start-fill-low]':button,'[data-start-fill-status]':status,'[data-start-search]':search,
                '[data-start-continue]':close,'form':form,'[data-start-error]':error}[selector];
        },querySelectorAll(selector){return {'[data-start-field]':fieldInputs,'[data-start-owned]':owned,'[data-start-balance]':[],'[data-start-item]':rows}[selector]||[];}};
    const ledger={revision:3,balances:{jade:176550},owned:{'["wep","off_pool"]':12,'["char","g"]':363,'["char","a"]':382}},beforeLedger=plain(ledger);
    let autoFill=false,currency=true;
    const c=require('./icon_test_context.cjs').createContext({window:{},SimulatorStart:api,localStorage:{getItem:k=>k==='GM_Lang'?'zh':k==='GM_Sim_Start_Auto_Low_Overflow'?(autoFill===null?null:String(autoFill)):'true'},
        document:{createElement:()=>dialog,body:{append(){}}},showToast(){}});
    vm.runInContext(read('ui/state_toggle.js'),c);vm.runInContext(read('ui/simulator_start.js'),c);
    const ui=c.window.SimulatorStartUI.mount({...setup,getState:()=>assert.fail('起点表单不应读取当前抽卡状态'),account:()=>ledger,
        currencyEnabled:()=>currency,isBusy:()=>false,apply:(state,holdings)=>{saved=plain(holdings);return true;}});
    ui.open();assert.deepEqual(owned.map(input=>input.value),['1','0','99','2']);assert.equal(button.hidden,false);
    assert.match(dialog.innerHTML,/data-start-balance="0" value="0"/);
    assert.match(dialog.innerHTML,/data-start-owned="0" value="0"/);
    assert.match(dialog.innerHTML,/data-start-owned="1" value="0"/);
    assert.match(dialog.innerHTML,/data-start-field="total"[^>]*value="0"/);
    assert.match(dialog.innerHTML,/data-start-field="guarantee"[^>]*value="0"/);
    search.value='低星甲';search.oninput();assert.equal(rows[3].hidden,true);
    button.onclick();assert.deepEqual(owned.map(input=>input.value),['1','7','99','5']);
    assert.equal(saved,null);assert.deepEqual(plain(ledger),beforeLedger);assert.match(status.textContent,/已填充 2 项/);
    form.onsubmit({preventDefault(){}});assert.equal(saved.owned[JSON.stringify(['char','a'])],7);
    assert.equal(saved.owned[JSON.stringify(['char','g'])],1);assert.equal(saved.owned[JSON.stringify(['char','b'])],99);
    assert.equal(saved.owned[JSON.stringify(['wep','c'])],5);assert.equal(dialog.open,false);
    assert.equal(saved.owned[JSON.stringify(['wep','off_pool'])],12);
    const resetInputs=()=>[1,0,99,2].forEach((n,i)=>{owned[i].value=String(n);});
    saved=null;resetInputs();autoFill=true;ui.open();
    assert.deepEqual(owned.map(input=>input.value),['1','7','99','5']);assert.equal(saved,null);assert.equal(button.hidden,true);
    ui.close();resetInputs();autoFill=false;ui.open();assert.deepEqual(owned.map(input=>input.value),['1','0','99','2']);assert.equal(button.hidden,false);
    ui.close();resetInputs();autoFill=true;currency=false;ui.open();assert.deepEqual(owned.map(input=>input.value),['1','0','99','2']);
    ui.close();resetInputs();autoFill=null;currency=true;ui.open();assert.deepEqual(owned.map(input=>input.value),['1','7','99','5']);assert.equal(button.hidden,true);
    saved=null;close.onclick();assert.equal(saved,null);assert.deepEqual(plain(ledger),beforeLedger);
});
test('玩家数据自动溢出设置不依赖模拟器父开关，默认开启并保留手动关闭选择',()=>{
    const source=read('pages/settings.js'),map=new Map(),nodes=Object.fromEntries(
        ['simCurrencyModeToggle','simStartSetupToggle','simAutoLowOverflowToggle','simAutoLowOverflowOptions','simRememberStartToggle','simRememberStartOptions','simKeepRecordsToggle'].map(id=>[id,{}]));
    const c=require('./icon_test_context.cjs').createContext({window:{},document:{getElementById:id=>nodes[id]},
        localStorage:{getItem:key=>map.get(key)??null,setItem:(key,value)=>map.set(key,value)}});
    vm.runInContext(read('logic/app_preferences.js'),c);
    vm.runInContext(source.slice(source.indexOf('        function syncSimulatorDependentPrefs()'),source.indexOf('        function initPrefs()')),c);
    vm.runInContext(source.slice(source.indexOf('        window.updatePref ='),source.indexOf('        window.exportLocalData')),c);
    for(const currency of [false,true])for(const start of [false,true]){
        c.window.updatePref('GM_Sim_Currency_Mode',String(currency));c.window.updatePref('GM_Sim_Start_Setup',String(start));
        c.syncPlayerDataPrefs();assert.equal(nodes.simAutoLowOverflowOptions.hidden,undefined);
        assert.equal(nodes.simAutoLowOverflowToggle.checked,true);
        assert.equal(nodes.simRememberStartOptions.hidden,!start);
        assert.equal(nodes.simRememberStartToggle.checked,true);
    }
    c.window.updatePref('GM_Sim_Start_Auto_Low_Overflow','false');
    c.window.updatePref('GM_Sim_Currency_Mode','false');assert.equal(nodes.simAutoLowOverflowOptions.hidden,undefined);
    c.window.updatePref('GM_Sim_Currency_Mode','true');assert.equal(nodes.simAutoLowOverflowOptions.hidden,undefined);
    assert.equal(nodes.simAutoLowOverflowToggle.checked,false);
    c.syncSimulatorDependentPrefs();assert.equal(nodes.simAutoLowOverflowToggle.checked,false);
    c.window.updatePref('GM_Sim_Remember_Start','true');assert.equal(nodes.simRememberStartToggle.checked,true);
    c.window.updatePref('GM_Sim_Keep_Records','true');assert.equal(nodes.simRememberStartOptions.hidden,true);
    c.window.updatePref('GM_Sim_Keep_Records','false');assert.equal(nodes.simRememberStartOptions.hidden,false);
});
test('关闭货币模式仍可设置全部已启用规则进度，两种模式生成相同抽卡状态',()=>{
    assert.deepEqual(plain(api.fields(context,engine.createState(1),false)),plain(api.fields(context,engine.createState(1),true)));
    const n=values(false);Object.assign(n,{pity:50,'minor:0':3,total:300,guarantee:1,rescue:2,'spark:0':100,'spark:1':250,'gift:0':40});
    const state=api.build(context,n,false);assert.equal(state.pity,50);assert.equal(state.total,300);assert.equal(state.guaranteeCount,1);
    assert.equal(state.consecutiveLosses,2);assert.equal(state.sparkState[1].triggeredCount,1);assert.equal(state.giftState[0].triggeredCount,1);
    assert.equal(engine.getGoldPolicy(context.rules,state,['gold']).guaranteed,true);
    assert.deepEqual(plain(state),plain(api.build(context,n,true)));
    const legacy=engine.createState(1);legacy.pity=20;
    assert.equal(api.fields(context,legacy,false).find(f=>f.key==='total').value,20);
    const minimal={...context,rules:{pities:[{tierId:'gold',pulls:90,enableUp:false}]}};
    assert.deepEqual(plain(api.fields(minimal,engine.createState(1),true)).map(f=>f.key),['pity','minor:0','total']);
});
test('大保底和救援进度影响下一金，历史井和赠送不会在下一抽补发',()=>{
    const n=values(true);Object.assign(n,{pity:50,total:300,guarantee:1,rescue:2,early:1,category:3,'spark:0':150,'spark:1':260,'gift:0':40,'queue:counted':2});
    const state=api.build(context,n,true);
    assert.equal(engine.getGoldPolicy(context.rules,state,['gold']).guaranteed,true);assert.equal(state.consecutiveLosses,2);
    assert.equal(engine.getCategoryGoldOrder(state),3);assert.equal(state.earlyUpUsedCount,1);
    state.naturalGoldCount=1;assert.equal(engine.getCategoryGoldOrder(state),4);
    assert.deepEqual(plain(state.sparkState),{'0':{basePull:150,triggeredCount:1,cancelled:false},'1':{basePull:40,triggeredCount:1,cancelled:false}});
    for(let i=0;i<2;i++)assert.equal(engine.evaluateSpark(context.rules,context.rules.sparkRules[i],state.sparkState[i],301,{isGold:false},['gold']).triggered,false);
    assert.equal(state.giftState[0].triggeredCount,1);assert.deepEqual(plain(state.freeQueue),[{countPity:true,remaining:2}]);
    assert.equal(api.valid(state),true);
});
test('空值、负数、超出硬保底、总抽数矛盾不会生成起点',()=>{
    const n=values(true);n.total=100;
    for(const pity of ['',-1,1.5,90,Infinity])assert.throws(()=>api.build(context,{...n,pity},true));
    assert.throws(()=>api.build(context,{...n,pity:50,total:40},true));
    assert.throws(()=>api.build(context,{...n,'spark:0':101},true));
    assert.throws(()=>api.build(context,{...n,category:0},true));
    assert.equal(api.valid(null),false);assert.equal(api.valid({...engine.createState(),pity:-1}),false);
});
test('起点编辑和恢复采用账户版本校验，失败不覆盖余额和基准',()=>{
    const store=new Map([['GM_Sim_Currency_Mode','true']]);let fail=false;
    const root={innerHTML:''},dialog={open:false,close(){},showModal(){}};
    const c=require('./icon_test_context.cjs').createContext({window:{addEventListener(){}},GachaEngine:engine,SimulatorStart:api,
        document:{getElementById:()=>root,createElement:()=>dialog,body:{appendChild(){}}},
        localStorage:{getItem:k=>store.get(k)??null,setItem:(k,v)=>{if(fail)throw Error('disk');store.set(k,v);}},showToast(){}});
    vm.runInContext(read('logic/simulator_economy.js'),c);c.SimulatorEconomy=c.window.SimulatorEconomy;
    vm.runInContext(read('ui/simulator_wallet.js'),c);
    const wallet=c.window.SimulatorWallet.mount({gameId:'test',poolId:'limited',info:{economy:{resources:[{id:'jade'}],payments:[],exchanges:[],incomes:[]}},catalog:[]});
    const start=engine.createState();start.pity=40;start.total=100;
    assert.equal(wallet.ensureStart(start),true);
    assert.equal(wallet.hasConfiguredStart(),false);
    let account=wallet.account();
    assert.equal(wallet.applyStart(start,{balances:{jade:1600},owned:{hero:7},revision:account.revision,profile:{id:'a',name:'账户 A',en:'Account A'}}),true);
    assert.equal(wallet.hasConfiguredStart(),true);
    account=wallet.account();const baseline=plain(account.starts.limited);
    // 其他池保底保留，但同一游戏的余额和持有属于共享恢复范围。
    account.balances.jade=1;account.owned.hero=8;account.claims.once=1;account.exchanges.monthly=2;account.profile={id:'b',name:'账户 B',en:'Account B'};
    account.pools.standard=plain(engine.createState());account.pools.standard.pity=20;account.revision++;
    store.set('GM_Sim_Economy_test',JSON.stringify(account));
    assert.equal(wallet.applyStart(start,{balances:{jade:99},owned:{},revision:account.revision-1}),false);
    assert.equal(wallet.account().balances.jade,1);
    fail=true;assert.equal(wallet.restoreStart(),null);assert.equal(wallet.account().balances.jade,1);
    fail=false;const restored=wallet.restoreStart();assert.equal(restored.pity,40);
    account=wallet.account();assert.equal(account.balances.jade,1600);assert.equal(account.owned.hero,7);
    assert.equal(account.profile.id,'a');assert.equal(account.profile.name,'账户 A');
    assert.deepEqual(plain(account.claims),{});assert.deepEqual(plain(account.exchanges),{});
    assert.equal(account.pools.standard.pity,20);assert.deepEqual(plain(account.starts.limited),baseline);
});
test('重置恢复保存进度，关闭开关则清零；换期与清空按钮独立显示',()=>{
    const source=read('pages/simulator.js');let enabled=true;
    const nodes=Object.fromEntries(['btn-rotation-or-clear','btn-reset-initial','btn-edit-start','sim-results'].map(k=>[k,{style:{},innerHTML:'results'}]));
    const baseline=engine.createState(1);baseline.pity=50;baseline.total=100;baseline.naturalGoldCount=3;
    const c=require('./icon_test_context.cjs').createContext({startEnabled:()=>enabled,simulatorLang:'zh',currentPool:'limited',rules:{lifecycle:{allowRotation:true}},
        window:{getTrans:key=>key},document:{getElementById:id=>nodes[id]},GachaEngine:engine,simPullBusy:false,
        minorPities:[{}],simulatorWallet:{enabled:()=>false},readNormalStart:()=>plain(baseline),
        simData:engine.createState(1),simRenderedPulls:new Map([[1,{}]]),currentGoldFocusIndex:1,
        simRecordEntries:[],saveSimulatorRecord(){},updateSimStats(){},updateResetButtonsVisibility(){}});
    vm.runInContext(source.slice(source.indexOf('        function updateRotationButtonUI()'),source.indexOf('        function findInRoster(')),c);
    c.updateRotationButtonUI();assert.equal(nodes['btn-rotation-or-clear'].style.display,'');assert.equal(nodes['btn-reset-initial'].innerText,'清空至初始状态');
    c.currentPool='mixed_std';c.updateRotationButtonUI();assert.equal(nodes['btn-rotation-or-clear'].style.display,'none');
    vm.runInContext(source.slice(source.indexOf('        function resetSim()'),source.indexOf('        // 🌟 细分规则左侧状态')),c);
    assert.equal(c.resetSim(),true);assert.equal(c.simData.pity,50);assert.equal(c.simData.naturalGoldCount,3);
    assert.equal(nodes['sim-results'].innerHTML,'');assert.equal(c.simRenderedPulls.size,0);
    enabled=false;c.updateRotationButtonUI();assert.equal(nodes['btn-reset-initial'].innerText,'clear_history');
    assert.equal(nodes['btn-edit-start'].style.display,'');c.resetSim();assert.equal(c.simData.pity,0);assert.equal(c.simData.total,0);
    const html=read('simulator.html');assert.ok(html.indexOf('id="sim-session-actions"')>html.indexOf('id="box-stat-guarantee"'));
    assert.ok(html.indexOf('id="sim-session-actions"')<html.indexOf('id="tip-hide-low-box"'));
});
test('记住起点仅自动应用明确保存的起点，按游戏卡池模式隔离，异常时留给弹窗填写',()=>{
    const source=read('pages/simulator.js'),map=new Map(),messages=[];let enabled=true,currency=false,configured=false,restores=0;
    const normal=engine.createState(1);normal.pity=20;normal.total=100;normal.guaranteeCount=1;
    const paid=engine.createState(1);paid.pity=40;paid.total=200;
    const c=require('./icon_test_context.cjs').createContext({startEnabled:()=>enabled,keepSimulatorRecords:()=>false,simulatorLang:'zh',SimulatorStart:api,simData:engine.createState(1),
        temporarySimulation:false,temporaryNormalStart:null,normalStartKey:'GM_Sim_Start_game_pool_normal',localStorage:{getItem:key=>map.get(key)??null},
        simulatorWallet:{enabled:()=>currency,hasConfiguredStart:()=>configured,restoreStart:()=>{restores++;return plain(paid);}},
        showToast:(message,type)=>messages.push({message,type})});
    vm.runInContext(source.slice(source.indexOf('        function readNormalStart('),source.indexOf('        const startUI=')),c);
    vm.runInContext(source.slice(source.indexOf('        function restoreRememberedStart()'),source.indexOf('        window.refreshSimulatorEconomy =')),c);
    assert.equal(c.restoreRememberedStart(),false);
    map.set('GM_Sim_Remember_Start','true');assert.equal(c.restoreRememberedStart(),false);
    // 兼容旧的手动重置基准，但自动记忆不采用未经确认的旧快照。
    map.set(c.normalStartKey,JSON.stringify(normal));assert.equal(c.readNormalStart().pity,20);assert.equal(c.restoreRememberedStart(),false);
    map.set(c.normalStartKey,JSON.stringify({version:1,configured:true,engine:normal}));
    map.delete('GM_Sim_Remember_Start'); // 未设置时默认开启。
    assert.equal(c.restoreRememberedStart(),true);assert.equal(c.simData.pity,20);assert.equal(c.simData.guaranteeCount,1);
    map.set('GM_Sim_Remember_Start','false');assert.equal(c.restoreRememberedStart(),false);
    c.keepSimulatorRecords=()=>true;assert.equal(c.restoreRememberedStart(),true);
    c.keepSimulatorRecords=()=>false;map.delete('GM_Sim_Remember_Start');
    c.simData.total=999;assert.equal(c.restoreRememberedStart(),true);assert.equal(c.simData.total,100);
    c.normalStartKey='GM_Sim_Start_game_other_pool_normal';assert.equal(c.restoreRememberedStart(),false);
    currency=true;assert.equal(c.restoreRememberedStart(),false);assert.equal(restores,0);
    configured=true;assert.equal(c.restoreRememberedStart(),true);assert.equal(c.simData.pity,40);assert.equal(restores,1);
    enabled=false;assert.equal(c.restoreRememberedStart(),false);assert.equal(restores,1);
    enabled=true;currency=false;c.normalStartKey='GM_Sim_Start_game_pool_normal';map.set(c.normalStartKey,'bad json');
    const before=plain(c.simData);assert.equal(c.restoreRememberedStart(),false);assert.deepEqual(plain(c.simData),before);
    assert.equal(messages.at(-1).type,'danger');
    c.temporarySimulation=true;c.temporaryNormalStart=plain(normal);
    assert.equal(c.readNormalStart(true).pity,20);
    const temporaryCopy=c.readNormalStart();temporaryCopy.pity=9;
    assert.equal(c.readNormalStart().pity,20);assert.equal(map.get(c.normalStartKey),'bad json');
});


test('历史同步选项默认关闭，随同步开关显示隐藏并保留用户选择',()=>{
    const source=read('pages/settings.js'),store=new Map();
    const nodes=Object.fromEntries(['dashboardSyncPlayerToggle','dashboardSyncHistoryToggle','dashboardSyncHistoryOptions'].map(id=>[id,{}]));
    const c=require('./icon_test_context.cjs').createContext({window:{},document:{getElementById:id=>nodes[id]||null},localStorage:{getItem:key=>store.get(key)??null,setItem:(key,value)=>store.set(key,value)}});
    vm.runInContext(read('logic/app_preferences.js'),c);
    vm.runInContext(source.slice(source.indexOf('        function syncPlayerDataPrefs()'),source.indexOf('        function initPrefs()')),c);
    vm.runInContext(source.slice(source.indexOf('        window.updatePref ='),source.indexOf('        window.exportLocalData')),c);
    c.syncPlayerDataPrefs();assert.equal(nodes.dashboardSyncHistoryToggle.checked,false);assert.equal(nodes.dashboardSyncHistoryOptions.hidden,false);
    c.window.updatePref('GM_Dashboard_Sync_Player','true');assert.equal(nodes.dashboardSyncHistoryOptions.hidden,false);
    c.window.updatePref('GM_Dashboard_Sync_Existing','true');assert.equal(nodes.dashboardSyncHistoryToggle.checked,true);
    c.window.updatePref('GM_Dashboard_Sync_Player','false');assert.equal(nodes.dashboardSyncHistoryOptions.hidden,true);assert.equal(nodes.dashboardSyncHistoryToggle.checked,true);
});


test('应用玩家数据时保留兑换次数和共享解锁，恢复起点仍保留；无效进度与保存失败不部分提交',()=>{
    const store=new Map([['GM_Sim_Currency_Mode','true']]);let fail=false;
    const root={innerHTML:''},dialog={open:false,close(){},showModal(){}};
    const c=require('./icon_test_context.cjs').createContext({window:{addEventListener(){}},GachaEngine:engine,SimulatorStart:api,
        document:{getElementById:()=>root,createElement:()=>dialog,body:{appendChild(){}}},
        localStorage:{getItem:key=>store.get(key)??null,setItem:(key,value)=>{if(fail)throw Error('quota');store.set(key,value);}},showToast(){}});
    vm.runInContext(read('logic/simulator_economy.js'),c);c.SimulatorEconomy=c.window.SimulatorEconomy;
    vm.runInContext(read('ui/simulator_wallet.js'),c);
    const wallet=c.window.SimulatorWallet.mount({gameId:'test',poolId:'pool',info:{economy:{resources:[{id:'jade'}],payments:[],exchanges:[],incomes:[]}},catalog:[]});
    const progress={exchanges:{'first:ticket':2,'month:first:ticket':2},prerequisites:{'["unlock","group"]':true}},initial=engine.createState();
    assert.equal(wallet.applyStart(initial,{balances:{jade:100},owned:{},revision:0,resetProgress:true,economyProgress:progress}),true);
    assert.deepEqual(plain(wallet.account().exchanges),progress.exchanges);assert.deepEqual(plain(wallet.account().prerequisites),progress.prerequisites);
    assert.equal(wallet.restoreStart().total,0);assert.deepEqual(plain(wallet.account().exchanges),progress.exchanges);
    const before=store.get('GM_Sim_Economy_test');
    assert.equal(wallet.applyStart(initial,{balances:{jade:999},owned:{},revision:wallet.account().revision,resetProgress:true,economyProgress:{exchanges:{x:-1},prerequisites:{}}}),false);
    assert.equal(store.get('GM_Sim_Economy_test'),before);
    fail=true;assert.equal(wallet.applyStart(initial,{balances:{jade:999},owned:{},revision:wallet.account().revision,economyProgress:progress}),false);assert.equal(store.get('GM_Sim_Economy_test'),before);
});


test('进度字段按各卡池规则通用校验，不依赖填写历史汇总或固定示例数字',()=>{
    for(const hard of [10,40,80,90,200]){
        const context={rules:{pities:[{tierId:'gold',pulls:hard,enableUp:true,useGuarantee:true,guaranteeLimit:2}]},targetGoldIds:['gold'],minorPities:[{tierId:'silver',pulls:5}],globalTiers:[{id:'gold'},{id:'silver'}]};
        const state=engine.createState(1);
        const values=Object.fromEntries(api.fields(context,state).map(f=>[f.key,f.value]));
        assert.throws(()=>api.build(context,{...values,total:hard,pity:hard}));
        assert.throws(()=>api.build(context,{...values,total:4,pity:4,guarantee:1}),/当前歪数/);
        assert.throws(()=>api.build(context,{...values,total:3,'minor:0':4}));
        assert.throws(()=>api.build(context,{...values,total:hard,guarantee:3}));
        assert.doesNotThrow(()=>api.build(context,{...values,total:hard+3,pity:2,guarantee:2,'minor:0':1}));
        const invalid={...plain(state),total:hard+2,pity:2,guaranteeCount:3};
        assert.ok(api.progressErrors(context,invalid).length);
    }
    const special={rules:{sparkRules:[{limit:20,type:'once'}],giftRules:[{trigger:5,type:'loop'}],secondaryRescue:{enabled:true,hardGuaranteeLosses:2}},targetGoldIds:['gold'],minorPities:[],globalTiers:[{id:'gold'}]};
    const state=engine.createState(),values=Object.fromEntries(api.fields(special,state).map(f=>[f.key,f.value]));
    assert.throws(()=>api.build(special,{...values,total:5,'spark:0':6}));
    assert.throws(()=>api.build(special,{...values,total:5,'gift:0':6}));
    assert.throws(()=>api.build(special,{...values,total:0,rescue:1}),/救援/);
});
