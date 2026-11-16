const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const read=file=>fs.readFileSync(path.join(__dirname,'../..',file),'utf8');
function runtime(){
    const store=new Map(),c=require('./icon_test_context.cjs').createContext({window:{},localStorage:{getItem:key=>store.get(key)??null,setItem:(key,value)=>store.set(key,value)}});
    for(const file of ['logic/list_order.js','Preset_Data/db_hsr.js','Preset_Data/db_zzz.js','Preset_Data/db_end.js','Preset_Data/db_ark.js','logic/catalog_utils.js','logic/game_data.js','logic/gacha_engine.js','logic/simulator_start.js','logic/user_data_profiles.js']){vm.runInContext(read(file),c);Object.assign(c,c.window);}
    return {c,store};
}
test('账号模式默认单一，切换多账号保留原账号列表，设置能回显并持久化',()=>{
    const {c,store}=runtime(),api=c.UserDataProfiles,rows=[{id:'a'},{id:'b'}];
    store.set('GM_Sim_Profiles_hsr','original');assert.equal(api.mode(),'single');assert.equal(api.visibleRows(rows).length,1);
    const select={};c.document={getElementById:id=>id==='playerDataModeSelect'?select:null};
    const source=read('pages/settings.js');
    vm.runInContext(read('logic/app_preferences.js'),c);
    vm.runInContext(source.slice(source.indexOf('        function syncPlayerDataPrefs()'),source.indexOf('        function initPrefs()')),c);
    vm.runInContext(source.slice(source.indexOf('        window.updatePref ='),source.indexOf('        window.exportLocalData')),c);
    c.syncPlayerDataPrefs();assert.equal(select.value,'single');
    c.window.updatePref('GM_Player_Data_Mode','multi');assert.equal(select.value,'multi');assert.equal(api.visibleRows(rows).length,2);
    c.window.updatePref('GM_Player_Data_Mode','single');assert.equal(select.value,'single');assert.equal(api.visibleRows(rows)[0].id,'a');assert.equal(rows.length,2);assert.equal(store.get('GM_Sim_Profiles_hsr'),'original');
});
test('单账号直接嵌入表单并全部展开，保存不调用弹窗接口，还原修改仍能留在页面',()=>{
    const {c}=runtime(),context=c.UserDataProfiles.accountContext('hsr');let saved=0,reverted=0;
    const fields=Object.entries(context.poolContexts).flatMap(([id,ctx])=>c.SimulatorStart.fields(ctx).map(f=>({dataset:{startField:f.key,startPool:id},value:String(f.value),type:f.checkbox?'checkbox':'number',checked:!!f.value})));
    const nodes=Object.fromEntries(['h3','.sim-wallet-note','[data-start-account-note]','[data-start-continue]','[type="submit"]','[data-start-fill-low]','[data-start-fill-status]','[data-start-search]','[data-start-error]','form','[data-start-name]'].map(key=>[key,{}]));
    const sections=[{open:false},{open:false}];
    const host={innerHTML:'',classList:{add(){}},querySelector:s=>nodes[s]||null,querySelectorAll:s=>s==='[data-start-field]'?fields:s==='details:not([data-start-tier])'?sections:[]};
    c.document={createElement:()=>assert.fail('内嵌编辑不应新建弹窗'),body:{append:()=>assert.fail('不应追加弹窗')}};c.showToast=()=>{};
    vm.runInContext(read('ui/state_toggle.js'),c);vm.runInContext(read('ui/simulator_start.js'),c);
    const ui=c.window.SimulatorStartUI.mount({...context,host,expandAll:true,profile:true,defaultName:'我的账号',account:()=>({revision:0,owned:{}}),currencyEnabled:()=>true,isBusy:()=>false,onRevert:()=>reverted++,
        apply:(engine,holdings,meta)=>{assert.equal(Object.keys(meta.pools).length,5);saved++;return true;}});
    assert.doesNotThrow(()=>ui.open());assert.match(host.className,/sim-start-editor/);assert.equal(nodes['[data-start-name]'].value,'我的账号');assert.ok(sections.every(section=>section.open));
    assert.ok(host.innerHTML.indexOf('data-start-section="balances"')<host.innerHTML.indexOf('data-start-section="progress"'));
    assert.ok(host.innerHTML.indexOf('data-start-section="progress"')<host.innerHTML.indexOf('data-start-section="owned"'));
    nodes.form.onsubmit({preventDefault(){}});assert.equal(saved,1);assert.equal(nodes['[data-start-error]'].textContent,undefined);
    nodes['[data-start-continue]'].onclick();assert.equal(reverted,1);assert.doesNotThrow(()=>ui.close());
});
test('即时卡池重排保留输入节点、展开状态及未保存数量，相同顺序不会重建内容',()=>{
    const {c}=runtime();vm.runInContext(read('ui/state_toggle.js'),c);vm.runInContext(read('ui/simulator_start.js'),c);
    const section=(id,value,open)=>({dataset:{startPoolSection:id},value,open});
    const a=section('char',21,true),b=section('wep',8,false),extra=section('new',3,true);let moves=0;
    const list={children:[a,b,extra],appendChild(node){this.children.splice(this.children.indexOf(node),1);this.children.push(node);moves++;}};
    const root={querySelectorAll:()=>[list]};
    c.window.SimulatorStartUI.reorderPools(root,['wep','char']);
    assert.deepEqual(list.children,[b,a,extra]);assert.equal(a.value,21);assert.equal(a.open,true);assert.equal(b.value,8);assert.equal(b.open,false);
    const before=moves;c.window.SimulatorStartUI.reorderPools(root,['wep','char']);assert.equal(moves,before);
});
test('顶部提供名称时不再生成重复名称框，提交同时保留中英文，并允许清空单一语言',()=>{
    const {c}=runtime(),context=c.UserDataProfiles.accountContext('hsr');let payload=null,preview=false;
    const names={name:'清天',en:'Sky'},fields=Object.entries(context.poolContexts).flatMap(([id,ctx])=>c.SimulatorStart.fields(ctx).map(f=>({dataset:{startField:f.key,startPool:id},value:String(f.value),type:f.checkbox?'checkbox':'number',checked:!!f.value})));
    const nodes=Object.fromEntries(['h3','.sim-wallet-note','[data-start-account-note]','[data-start-continue]','[type="submit"]','[data-start-fill-low]','[data-start-fill-status]','[data-start-search]','[data-start-error]','form'].map(key=>[key,{}]));
    const host={innerHTML:'',querySelector:s=>nodes[s]||null,querySelectorAll:s=>s==='[data-start-field]'?fields:[]};
    c.document={createElement:()=>assert.fail('不应创建弹窗')};c.showToast=()=>{};
    vm.runInContext(read('ui/state_toggle.js'),c);vm.runInContext(read('ui/simulator_start.js'),c);
    const ui=c.window.SimulatorStartUI.mount({...context,host,profile:true,isReadOnly:()=>preview,getNames:()=>names,account:()=>({owned:{},revision:0}),currencyEnabled:()=>true,isBusy:()=>false,apply:(engine,holdings,meta)=>{payload=meta;return true;}});
    ui.open();assert.ok(!host.innerHTML.includes('data-start-name'));
    nodes.form.onsubmit({preventDefault(){}});assert.equal(payload.name,'清天');assert.equal(payload.en,'Sky');
    names.name='';names.en='New Sky';nodes.form.onsubmit({preventDefault(){}});assert.equal(payload.name,'');assert.equal(payload.en,'New Sky');
    preview=true;payload=null;nodes.form.onsubmit({preventDefault(){}});assert.equal(payload,null,'预览状态不能提交');preview=false;
    names.en='';payload=null;nodes.form.onsubmit({preventDefault(){}});assert.equal(payload,null);assert.match(nodes['[data-start-error]'].textContent,/请填写数据名称/);
});
