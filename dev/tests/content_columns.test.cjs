const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'../..'),read=file=>fs.readFileSync(path.join(root,file),'utf8');
function setup(initial={}){
    const store=new Map(Object.entries(initial)),events=[];
    const context=vm.createContext({window:{addEventListener(){}},location:{pathname:'/settings.html'},
        document:{addEventListener(){},dispatchEvent:event=>events.push(event)},CustomEvent:class{constructor(type,options){this.type=type;this.detail=options.detail;}},
        localStorage:{getItem:key=>store.get(key)??null,setItem:(key,value)=>store.set(key,String(value))}});
    vm.runInContext(read('ui/content_columns.js'),context);return{api:context.window.ContentColumns,store,events};
}
test('column preferences stay independent; new users get a single column on every page',()=>{
    const {api,store,events}=setup({GM_Pool_Continuous_Columns:'off',GM_Sim_Profiles_hsr:'keep'});
    for(const page of Object.keys(api.definitions))assert.equal(api.read(page).columns,'1');
    assert.equal(api.set('gallery_setup','columns','4'),true);assert.equal(api.read('gallery_setup').columns,'4');
    assert.equal(api.read('currency_setup').columns,'1');assert.equal(api.read('pool_setup').columns,'1');
    assert.equal(events[0].detail.page,'gallery_setup');assert.equal(store.get('GM_Sim_Profiles_hsr'),'keep');
    assert.equal(setup().api.read('pool_setup').columns,'1');
    assert.equal(setup({GM_Content_Columns_pool_setup:JSON.stringify({columns:'auto'})}).api.read('pool_setup').columns,'auto');
});
test('invalid storage and unsupported future modes cannot enable unimplemented behavior',()=>{
    const {api,store}=setup({GM_Content_Columns_gallery_setup:'broken',GM_Content_Columns_currency_setup:JSON.stringify({columns:'99',arrangement:'fixed',scrolling:'other'})});
    assert.equal(api.read('gallery_setup').columns,'1');assert.equal(api.read('currency_setup').columns,'1');
    assert.equal(api.read('currency_setup').arrangement,'continuous');assert.equal(api.read('currency_setup').scrolling,'linked');
    const before=Array.from(store);
    for(const args of [['simulator','columns','3'],['index','columns','3'],['settings','columns','3'],['pool_setup','columns','0'],['pool_setup','arrangement','fixed'],['pool_setup','scrolling','other']])assert.equal(api.set(...args),false);
    assert.deepEqual(Array.from(store),before);
});

test('fixed distribution matches 11-item examples and conserves every item for all column counts',()=>{
    const {api}=setup(),items=Array.from({length:11},(_,i)=>i+1),plain=x=>JSON.parse(JSON.stringify(x));
    assert.deepEqual(plain(api.partition(items,3,'row')),[[1,4,7,10],[2,5,8,11],[3,6,9]]);
    assert.deepEqual(plain(api.partition(items,3,'column')),[[1,2,3,4],[5,6,7,8],[9,10,11]]);
    for(const count of [1,2,3,6,15])for(const mode of ['row','column']){
        const groups=plain(api.partition(items,count,mode));assert.equal(groups.length,count);
        assert.deepEqual(groups.flat().sort((a,b)=>a-b),items);
        assert.ok(Math.max(...groups.map(g=>g.length))-Math.min(...groups.map(g=>g.length))<=1);
    }
});

test('continuous flow locks linked scrolling while remembering independent scrolling for fixed layouts',()=>{
    const {api,store}=setup();assert.equal(api.set('pool_setup','scrolling','independent'),false);
    api.set('pool_setup','arrangement','column');api.set('pool_setup','scrolling','independent');
    assert.equal(api.read('pool_setup').scrolling,'independent');
    api.set('pool_setup','arrangement','continuous');assert.equal(api.read('pool_setup').scrolling,'linked');
    assert.equal(api.read('pool_setup').fixedScrolling,'independent');assert.equal(api.set('pool_setup','scrolling','independent'),false);
    api.set('pool_setup','columns','2');api.set('pool_setup','arrangement','row');
    assert.equal(api.read('pool_setup').scrolling,'independent');
    const reload=setup(Object.fromEntries(store));assert.equal(reload.api.read('pool_setup').scrolling,'independent');
    assert.equal(api.read('gallery_setup').arrangement,'continuous');
});

test('aligned rows enforce synchronized scrolling and preserve the independent preference',()=>{
    const {api}=setup();api.set('pool_setup','arrangement','row');api.set('pool_setup','scrolling','independent');
    api.set('pool_setup','alignment','rows');assert.equal(api.read('pool_setup').scrolling,'linked');
    assert.equal(api.set('pool_setup','scrolling','independent'),false);
    api.set('pool_setup','alignment','natural');assert.equal(api.read('pool_setup').scrolling,'independent');
});

test('whole-panel packing fills adjacent space without starting a panel that cannot fit',()=>{
    const {api}=setup(),items=[1,2,3,4,5,6],heights=[600,150,150,150,200,100];
    const groups=JSON.parse(JSON.stringify(api.packWhole(items,2,600,item=>heights[item-1])));
    assert.deepEqual(groups[0].map(x=>x.item),[1,5,6]);
    assert.deepEqual(groups[1].map(x=>x.item),[2,3,4]);
    assert.equal(groups[0][1].top,620);
    const tall=JSON.parse(JSON.stringify(api.packWhole([1,2],2,500,()=>900)));
    assert.deepEqual(tall.map(g=>g.map(x=>x.item)),[[1],[2]]);
    api.set('pool_setup','arrangement','row');api.set('pool_setup','alignment','packed');
    assert.equal(api.read('pool_setup').alignment,'packed');assert.equal(api.read('pool_setup').scrolling,'linked');
});

test('pagination validates size and clamps pages while preserving all items exactly once',()=>{
    const {api}=setup(),plain=x=>JSON.parse(JSON.stringify(x));
    assert.deepEqual(plain(api.pageRange(11,6,0)),{index:0,pages:2,start:0,end:6});
    assert.deepEqual(plain(api.pageRange(11,6,99)),{index:1,pages:2,start:6,end:11});
    assert.deepEqual(plain(api.pageRange(0,6,99)),{index:0,pages:1,start:0,end:0});
    const items=Array.from({length:11},(_,i)=>i),seen=[];
    for(let page=0;page<2;page++){const range=api.pageRange(items.length,6,page);seen.push(...items.slice(range.start,range.end));}
    assert.deepEqual(seen,items);
    api.set('pool_setup','browsing','pages');assert.equal(api.read('pool_setup').arrangement,'row');
    assert.equal(api.set('pool_setup','arrangement','continuous'),false);assert.equal(api.set('pool_setup','pageSize','0'),false);
    api.set('pool_setup','pageSize','3');assert.equal(api.read('pool_setup').pageSize,'3');
    api.set('pool_setup','browsing','scroll');assert.equal(api.set('pool_setup','arrangement','continuous'),true);
});

test('category columns keep each category intact and are only offered on supported pages',()=>{
    const {api}=setup(),items=[{id:1,category:'a'},{id:2,category:'b'},{id:3,category:'a'},{id:4,category:'c'}];
    const grouped=api.categoryPartition(items,2,row=>row.category);
    assert.deepEqual(JSON.parse(JSON.stringify(grouped.groups.map(rows=>rows.map(row=>row.id)))),[[1,3,4],[2]]);
    assert.deepEqual(JSON.parse(JSON.stringify(grouped.labels)),[['a','c'],['b']]);
    const later=api.categoryPartition(items.slice(2),3,row=>row.category,['a','b','c']);
    assert.deepEqual(JSON.parse(JSON.stringify(later.groups.map(rows=>rows.map(row=>row.id)))),[[3],[],[4]],'category slots remain stable on later pages');
    assert.equal(api.set('pool_setup','arrangement','category'),false);
    for(const page of api.categoryPages)assert.equal(api.set(page,'arrangement','category'),true);
});
test('six eligible pages share the UI module; excluded pages keep their layout and Settings only hosts controls',()=>{
    const {api}=setup();assert.equal(Object.keys(api.definitions).length,6);
    for(const page of Object.keys(api.definitions)){
        const html=read(page+'.html');assert.ok(html.includes('ui/content_columns.js'));assert.ok(html.includes('ui/content_columns.css'));assert.ok(!html.includes('ui/pool_columns'));
    }
    assert.ok(!read('index.html').includes('ui/content_columns'));
    assert.ok(read('simulator.html').includes('ui/content_columns'));
    assert.equal(api.read('settings'),null);assert.equal(api.read('simulator'),null);
    assert.ok(read('ui/page_layout.js').includes('ContentColumns?.mountControls'));
});
test('new settings have matching Chinese and English labels',()=>{
    const dictionaries=require('./translation_helpers.cjs').loadDictionaries();
    const keys=[...read('ui/content_columns.js').matchAll(/['"](content_columns_[a-z_]+)['"]/g)].map(match=>match[1]);
    for(const lang of ['zh','en'])for(const key of keys)assert.ok(dictionaries[lang][key],lang+':'+key);
});

test('single-panel mode persists without replacing the saved multi-column layout',()=>{
    const {api,store}=setup();api.set('pool_setup','columns','3');api.set('pool_setup','arrangement','column');api.set('pool_setup','scrolling','independent');api.set('pool_setup','pageSize','9');
    assert.equal(api.set('pool_setup','browsing','single'),true);assert.equal(api.read('pool_setup').scrolling,'linked');
    const reload=setup(Object.fromEntries(store));assert.equal(reload.api.read('pool_setup').browsing,'single');
    api.set('pool_setup','browsing','scroll');const prefs=api.read('pool_setup');
    assert.equal(prefs.columns,'3');assert.equal(prefs.arrangement,'column');assert.equal(prefs.pageSize,'9');assert.equal(prefs.scrolling,'independent');
});

test('adaptive slide grouping respects real heights, exact fits, oversized panels and item order',()=>{
 const {api,store}=setup(),plain=x=>JSON.parse(JSON.stringify(x));
 assert.deepEqual(plain(api.fitPages([100,150,400,90],280,x=>x)),[[100,150],[400],[90]]);
 assert.deepEqual(plain(api.fitPages([100,160,1],280,x=>x)),[[100,160],[1]]);
 assert.deepEqual(plain(api.fitPages([],280,x=>x)),[]);
 assert.equal(api.read('pool_setup').singleFill,'one');assert.ok(api.set('pool_setup','singleFill','fit'));
 assert.equal(setup(Object.fromEntries(store)).api.read('pool_setup').singleFill,'fit');
 assert.equal(api.set('pool_setup','singleFill','other'),false);
});
