const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function runtime(){
    const store=new Map([['GM_Sim_Profiles_game','player data']]);
    const c=vm.createContext({window:{addEventListener(){}},location:{pathname:'/settings.html'},
        localStorage:{getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,v)},
        document:{addEventListener(){},querySelectorAll:()=>[],documentElement:{setAttribute(){}}}});
    for(const file of ['page_layout','panel_defaults','global_display']){vm.runInContext(fs.readFileSync('ui/'+file+'.js','utf8'),c);Object.assign(c,c.window);}
    return {c,store,api:c.GlobalDisplay};
}
test('global alignment and headers reach all seven pages; later local changes remain local',()=>{
    const {api,c,store}=runtime();assert.equal(api.read('content'),'');
    assert.equal(api.set('content','full'),true);
    for(const page of Object.keys(c.PageLayout.definitions))assert.equal(c.PageLayout.read(page,'content'),'full',page);
    api.set('header','follow');assert.equal(api.read('header'),'follow');
    c.PageLayout.set('pool_setup','content','left');assert.equal(api.read('content'),'');
    assert.equal(c.PageLayout.read('user_data','content'),'full');assert.equal(store.get('GM_Sim_Profiles_game'),'player data');
    const before=JSON.stringify([...store]);assert.equal(api.set('content','none'),false);assert.equal(api.set('bad','all'),false);assert.equal(JSON.stringify([...store]),before);
});
test('global sizes update every mapped functional panel, including hidden multi-account preference',()=>{
    const {api,c}=runtime();api.set('large','none');api.set('medium','all');api.set('small','first');
    for(const [page,levels] of Object.entries(c.PanelDefaults.definitions))for(const level of Object.keys(levels)){
        const size=api.panelSizes[page][level];assert.ok(size,page+':'+level);
        assert.equal(c.PanelDefaults.read(page,level),{large:'none',medium:'all',small:'first'}[size]);
    }
    c.PanelDefaults.set('simulator','configuration','all');assert.equal(api.read('large'),'');
    assert.equal(c.PanelDefaults.read('pool_setup','sections'),'none');
});
test('confirmation defers all writes, cancel preserves mixed settings, confirm applies the requested value',async()=>{
    const {api,c,store}=runtime();
    const before=JSON.stringify([...store]);let answer;
    c.window.customConfirm=()=>new Promise(resolve=>{answer=resolve;});
    const cancelled=api.requestChange('header','full');
    assert.equal(JSON.stringify([...store]),before);
    assert.equal(await api.requestChange('small','none'),false,'another request cannot overtake the active confirmation');
    answer(false);assert.equal(await cancelled,false);assert.equal(JSON.stringify([...store]),before);
    const accepted=api.requestChange('header','full');answer(true);assert.equal(await accepted,true);
    assert.equal(api.read('header'),'full');assert.equal(store.get('GM_Sim_Profiles_game'),'player data');
    c.window.customConfirm=()=>{throw Error('dialog unavailable');};
    await assert.rejects(api.requestChange('small','none'),/dialog unavailable/);
    c.window.customConfirm=async()=>true;assert.equal(await api.requestChange('small','none'),true,'failed confirmation releases the pending lock');
});
test('author recommendation restores the five reference pages by size without changing other sizes',async()=>{
    const {api,c,store}=runtime();
    for(const size of ['large','medium','small'])assert.equal(api.read(size),'recommended');
    api.set('large','none');api.set('medium','none');api.set('small','none');
    api.set('large','recommended');assert.equal(c.PanelDefaults.read('user_data','sections'),'none');
    assert.equal(c.PanelDefaults.read('pool_setup','sections'),'all');assert.equal(c.PanelDefaults.read('gallery_setup','engine'),'none');
    c.window.customConfirm=async()=>false;const before=JSON.stringify([...store]);
    assert.equal(await api.requestChange('medium','recommended'),false);assert.equal(JSON.stringify([...store]),before);
    c.window.customConfirm=async()=>true;await api.requestChange('medium','recommended');await api.requestChange('small','recommended');
    const expected={user_data:{accounts:'first',sections:'all',pools:'first',tiers:'first',exchanges:'first'},currency_setup:{sections:'all',groups:'first',rules:'first'},gallery_setup:{engine:'none',configuration:'all',categories:'all',tiers:'first'},pool_setup:{sections:'all',rules:'first'},simulator:{configuration:'none',probability:'none',sections:'first',pools:'first',tiers:'first',wallet:'all',exchanges:'first'}};
    for(const [page,levels] of Object.entries(expected))for(const [level,value] of Object.entries(levels))assert.equal(c.PanelDefaults.read(page,level),value,page+':'+level);
    for(const size of ['large','medium','small'])assert.equal(api.read(size),'recommended');
    c.PanelDefaults.set('gallery_setup','configuration','none');assert.equal(api.read('small'),'');
    assert.equal(c.PageLayout.read('simulator','content'),'full');assert.equal(store.get('GM_Sim_Profiles_game'),'player data');
});

test('shared display dialog preferences target eligible pages and the same gold option, with cancel preserving all stored values',async()=>{
    const {api,c,store}=runtime(),attributes=new Map(),styles=new Map();
    c.CustomEvent=class{constructor(type,options){this.type=type;this.detail=options?.detail;}};
    c.document.dispatchEvent=()=>{};
    c.document.documentElement={dataset:{},getAttribute:key=>attributes.get(key)??null,setAttribute:(key,value)=>attributes.set(key,value),style:{getPropertyValue:key=>styles.get(key)||'',setProperty:(key,value)=>styles.set(key,value)}};
    for(const file of ['content_columns','gold_ordinal']){vm.runInContext(fs.readFileSync('ui/'+file+'.js','utf8'),c);Object.assign(c,c.window);}
    assert.equal(api.read('columns'),'1');
    api.set('columns','3');assert.equal(api.read('columns'),'3');
    for(const page of Object.keys(c.ContentColumns.definitions))assert.equal(c.ContentColumns.read(page).columns,'3');
    assert.equal(api.set('scrolling','independent'),false);
    assert.equal(api.set('arrangement','column'),true);assert.equal(api.set('scrolling','independent'),true);
    for(const page of Object.keys(c.ContentColumns.definitions))assert.equal(c.ContentColumns.read(page).scrolling,'independent');
    api.set('arrangement','continuous');assert.equal(api.read('scrolling'),'linked');
    api.set('arrangement','row');assert.equal(api.read('scrolling'),'independent');
    api.set('alignment','rows');assert.equal(api.read('scrolling'),'linked');assert.equal(api.set('scrolling','independent'),false);
    api.set('alignment','natural');assert.equal(api.read('scrolling'),'independent');
    const beforeCategory=JSON.stringify([...store]);let categoryMessage='';
    const dictionary=require('./translation_helpers.cjs').loadDictionaries().zh;
    c.window.getTrans=key=>dictionary[key]||key;c.window.customConfirm=async message=>{categoryMessage=message;return false;};
    assert.equal(await api.requestChange('arrangement','category'),false);assert.equal(JSON.stringify([...store]),beforeCategory);
    assert.match(categoryMessage,/图鉴配置页/);assert.match(categoryMessage,/货币规则明细页/);assert.match(categoryMessage,/竖向自动平分/);
    api.set('arrangement','category');assert.equal(api.read('arrangement'),'category');
    assert.equal(c.ContentColumns.read('pool_setup').arrangement,'column');assert.equal(c.ContentColumns.read('gallery_setup').arrangement,'category');
    for(const page of Object.keys(c.ContentColumns.definitions))assert.equal(c.ContentColumns.read(page).arrangement,c.ContentColumns.categoryPages.includes(page)?'category':'column');
    api.set('browsing','pages');api.set('pageSize','9');assert.equal(api.read('browsing'),'pages');assert.equal(api.read('pageSize'),'9');
    assert.equal(api.set('arrangement','continuous'),false);
    for(const page of ['simulator','settings','index'])assert.equal(store.has(c.ContentColumns.key(page)),false);
    c.ContentColumns.set('gallery_setup','columns','4');assert.equal(api.read('columns'),'');assert.equal(c.ContentColumns.read('pool_setup').columns,'3');
    api.set('goldOrdinal','click');assert.equal(c.GoldOrdinal.read(),'click');c.GoldOrdinal.set('hover');assert.equal(api.read('goldOrdinal'),'hover');
    const before=JSON.stringify([...store]);c.window.customConfirm=async()=>false;
    assert.equal(await api.requestChange('columns','2'),false);assert.equal(JSON.stringify([...store]),before);
    c.window.customConfirm=async()=>true;assert.equal(await api.requestChange('columns','2'),true);assert.equal(api.read('columns'),'2');
    assert.equal(c.PageLayout.read('simulator','content'),'full');assert.equal(store.get('GM_Sim_Profiles_game'),'player data');
});
