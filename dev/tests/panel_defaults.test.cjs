const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const read=file=>fs.readFileSync(path.join(__dirname,'../..',file),'utf8');
function runtime(initial={}) {
    const store=new Map(Object.entries(initial)),controls=[],events={};
    const setConnected=(node,value)=>{node.isConnected=value;node.children.forEach(child=>setConnected(child,value));};
    function element(tag) {return {tag,children:[],dataset:{},style:{},attributes:{},isConnected:false,
        append(...nodes){this.children.push(...nodes);nodes.forEach(node=>{node.parent=this;setConnected(node,this.isConnected);});controls.push(...nodes.filter(node=>node.tag==='select'));},
        setAttribute(key,value){this.attributes[key]=value;},showModal(){this.open=true;},close(){this.open=false;this.onclose?.();},
        closest(selector){for(let node=this;node;node=node.parent)if(selector==='.panel-default-setting'&&node.className==='panel-default-setting')return node;return null;},
        dispatchEvent(event){this['on'+event.type]?.(event);},focus(){this.focused=true;},
        remove(){if(this.parent)this.parent.children=this.parent.children.filter(node=>node!==this);setConnected(this,false);}};}
    const body=element('body');body.isConnected=true;
    const c=vm.createContext({window:{addEventListener:(name,fn)=>(events[name]||=[]).push(fn),getTrans:key=>key},location:{pathname:'/settings.html'},
        Event,CustomEvent,
        localStorage:{getItem:key=>store.get(key)??null,setItem:(key,value)=>store.set(key,String(value))},
        document:{body,createElement:element,addEventListener(){},dispatchEvent:event=>(events[event.type]||[]).forEach(fn=>fn(event)),querySelector:()=>null,
            querySelectorAll:selector=>selector==='select[data-panel-page]'?controls.filter(node=>node.dataset.panelPage&&node.isConnected):[]}});
    vm.runInContext(read('ui/color_style.js'),c);c.ColorStyle=c.window.ColorStyle;
    vm.runInContext(read('ui/panel_defaults.js'),c);Object.assign(c,c.window);
    return {c,api:c.PanelDefaults,store,controls,element,events};
}
test('fresh-use defaults match the five reference pages and never replace an existing preference',()=>{
    const expected={
        user_data:{accounts:'first',sections:'all',pools:'first',tiers:'first',exchanges:'first'},
        currency_setup:{sections:'all',groups:'first',rules:'first'},
        gallery_setup:{engine:'none',configuration:'all',categories:'all',tiers:'first'},
        pool_setup:{sections:'all',rules:'first'},
        simulator:{configuration:'none',probability:'none',sections:'first',pools:'first',tiers:'first',wallet:'all',exchanges:'first'}
    };
    const h=runtime();
    for(const [page,levels] of Object.entries(expected))for(const [level,mode] of Object.entries(levels))assert.equal(h.api.read(page,level),mode,page+':'+level);
    assert.equal(h.store.size,0,'Reading defaults does not overwrite stored settings');
    const saved=runtime({GM_Panel_Default_simulator_configuration:'all',GM_Panel_Default_user_data_sections:'none'});
    assert.equal(saved.api.read('simulator','configuration'),'all');assert.equal(saved.api.read('user_data','sections'),'none');
});
test('all, first and none are independent per page and level; invalid settings fall back without touching game data',()=>{
    const h=runtime({GM_Sim_Profiles_test:'saved player data'}),api=h.api;
    for(const [page,levels] of Object.entries(api.definitions))for(const level of Object.keys(levels)) {
        for(const mode of ['all','first','none']) {
            assert.equal(api.set(page,level,mode),true);
            assert.deepEqual([0,1,2].map(index=>api.initial(page,level,index)),mode==='all'?[true,true,true]:mode==='first'?[true,false,false]:[false,false,false]);
        }
        h.store.set(api.key(page,level),'invalid');assert.equal(api.read(page,level),levels[level][1]);
    }
    api.set('currency_setup','sections','none');api.set('currency_setup','rules','all');api.set('user_data','sections','first');
    assert.equal(api.initial('currency_setup','sections',0),false);assert.equal(api.initial('currency_setup','rules',5),true);
    assert.equal(api.initial('user_data','sections',0),true);assert.equal(api.initial('user_data','sections',1),false);
    assert.equal(api.set('wrong','sections','all'),false);assert.equal(api.set('pool_setup','wrong','all'),false);
    assert.equal(api.set('pool_setup','sections','wrong'),false);assert.equal(h.store.get('GM_Sim_Profiles_test'),'saved player data');
});
test('Settings and quick settings each show one button, whose dialog contains only that page and persists changes',()=>{
    const h=runtime();vm.runInContext(read('ui/page_layout.js'),h.c);
    const settings=h.element('div'),quick=h.element('div');
    h.c.window.PageLayout.mountControls(settings,'currency_setup',{settings:true});h.c.window.PageLayout.mountControls(quick,'currency_setup');
    h.c.document.body.append(settings,quick);
    assert.equal(h.controls.filter(node=>node.dataset.panelPage).length,0,'Options do not occupy the settings card or popover');
    const settingsButton=settings.children[0],quickButton=quick.children[0];
    assert.equal(settingsButton.tag,'button');assert.equal(quickButton.tag,'button');
    assert.equal(settingsButton.dataset.panelDefaultsPage,'currency_setup');assert.equal(settingsButton.attributes['aria-haspopup'],'dialog');
    settingsButton.onclick();
    const list=h.controls.filter(node=>node.dataset.panelPage&&node.isConnected),dialog=h.c.document.body.children.at(-1);
    assert.equal(list.length,3);assert.equal(dialog.open,true);
    for(const node of list)assert.equal(node.children.map(option=>option.value).join(','),'all,first,none');
    list[1].value='first';list[1].onchange();assert.equal(h.api.read('currency_setup','groups'),'first');
    h.store.set(h.api.key('currency_setup','rules'),'all');h.c.window.VersionStorage={eventKey:key=>key.replace('scoped:','')};
    h.events.storage.forEach(fn=>fn({key:'scoped:'+h.api.key('currency_setup','rules')}));assert.equal(list[2].value,'all');
    dialog.children.at(-1).children[0].onclick();assert.equal(dialog.isConnected,false);assert.equal(settingsButton.focused,true);
    quickButton.onclick();
    const reopened=h.controls.filter(node=>node.dataset.panelPage&&node.isConnected);
    assert.equal(reopened.length,3);assert.equal(reopened[1].value,'first');assert.equal(reopened[2].value,'all');
    const quickDialog=h.c.document.body.children.at(-1);quickDialog.oncancel({preventDefault(){}});
    assert.equal(quickDialog.isConnected,false);assert.equal(quickButton.focused,true);
    const dictionaries=require('./translation_helpers.cjs').loadDictionaries();
    for(const levels of Object.values(h.api.definitions))for(const [label] of Object.values(levels))for(const lang of ['zh','en'])assert.ok(dictionaries[lang][label]);
});
test('opening from a quick popover closes the popover, shows the matching page and leaves just one modal',()=>{
    const h=runtime();let closed=0;
    h.events['panel-defaults-open']=[()=>closed++];
    const first=h.api.open('user_data');assert.equal(first.open,true);assert.equal(closed,1);
    assert.equal(h.controls.filter(node=>node.dataset.panelPage&&node.isConnected).length,5);
    const second=h.api.open('pool_setup');assert.equal(first.isConnected,false);assert.equal(second.open,true);
    assert.equal(h.c.document.body.children.length,1);assert.equal(closed,2);
    const options=h.controls.filter(node=>node.dataset.panelPage&&node.isConnected);
    assert.equal(options.length,2);assert.ok(options.every(node=>node.dataset.panelPage==='pool_setup'));
    second.close();assert.equal(second.isConnected,false);
});
test('account expansion is shown only in multiple-account mode and preserves its preference while hidden',()=>{
    const h=runtime();h.api.set('user_data','accounts','first');
    const dialog=h.api.open('user_data');
    const select=h.controls.find(node=>node.dataset.panelPage==='user_data'&&node.dataset.panelLevel==='accounts');
    const row=select.closest('.panel-default-setting');
    assert.equal(row.hidden,true,'The default single-account mode has no account shell setting');
    assert.equal(select.value,'first');
    h.store.set('GM_Player_Data_Mode','multi');h.api.refreshSettings();assert.equal(row.hidden,false);
    h.store.set('GM_Player_Data_Mode','single');
    h.events.storage.forEach(fn=>fn({key:'GM_Player_Data_Mode'}));assert.equal(row.hidden,true);
    assert.equal(h.api.read('user_data','accounts'),'first');
    h.store.set('GM_Player_Data_Mode','multi');
    h.events.storage.forEach(fn=>fn({key:'GM_Player_Data_Mode'}));assert.equal(row.hidden,false);assert.equal(select.value,'first');
    dialog.close();
    h.store.set('GM_Player_Data_Mode','single');h.api.open('user_data');
    const reopened=h.controls.find(node=>node.isConnected&&node.dataset.panelLevel==='accounts');
    assert.equal(reopened.closest('.panel-default-setting').hidden,true);
});
test('every panel option has a hierarchy label, with separate exchange levels in Player Data and Simulator',()=>{
    const h=runtime(),dictionaries=require('./translation_helpers.cjs').loadDictionaries();
    for(const levels of Object.values(h.api.definitions))for(const [caption] of Object.values(levels)) {
        assert.match(dictionaries.zh[caption],/（[大中小](?:，[^）]*)?）/,caption);
        assert.match(dictionaries.en[caption],/\((?:outer|middle|inner)(?:, [^)]*)?\)/,caption);
    }
    assert.equal(dictionaries.zh.panel_player_accounts,'账户信息（大）【仅多账户】');
    assert.equal(h.api.definitions.user_data.exchanges[0],'panel_exchange_groups');
    assert.equal(h.api.definitions.simulator.exchanges[0],'panel_sim_exchange_groups');
});
test('first restarts within each parent; manual state survives rerender and resets on a fresh visit',()=>{
    const h=runtime();h.api.set('user_data','tiers','first');
    const a={},b={},states=new Map();
    const node=(id,parent)=>({id,dataset:{},isConnected:true,open:false,closest:()=>parent,addEventListener(name,fn){this[name]=fn;}});
    let nodes=[node('a:gold',a),node('a:silver',a),node('b:gold',b),node('b:silver',b)];
    const root={querySelectorAll:()=>nodes},apply=()=>h.api.applyDetails(root,'user_data','tiers','details',{states,group:'.category'});
    apply();assert.deepEqual(nodes.map(node=>node.open),[true,false,true,false]);
    nodes[0].open=false;nodes[1].open=true;h.api.captureDetails(root,states);
    h.api.set('user_data','tiers','all');nodes=nodes.map(old=>node(old.id,old.closest()));apply();
    assert.deepEqual(nodes.map(node=>node.open),[false,true,true,false]);
    h.api.applyDetails(root,'user_data','tiers','details',{group:'.category'});assert.ok(nodes.every(node=>node.open));
});
test('Currency Rules applies three independent levels, including first rule in each category and uncategorized entries',()=>{
    const h=runtime();let html='',details=[];
    const root={querySelectorAll:selector=>selector==='details[data-eco-key]'?details:[],querySelector:()=>null,
        get innerHTML(){return html;},set innerHTML(value){html=value;details=[...value.matchAll(/<details\b([^>]*)>/g)].flatMap(match=>{
            const key=match[1].match(/data-eco-key="([^"]+)"/);return key?[{dataset:{ecoKey:key[1]},open:/\sopen(?:\s|$)/.test(match[1])}]:[];
        });}};
    h.c.document.getElementById=()=>root;
    const exchanges=[
        {id:'a',name:'A',editorGroupId:'g1'},{id:'b',name:'B',editorGroupId:'g1'},
        {id:'c',name:'C',editorGroupId:'g2'},{id:'d',name:'D',editorGroupId:'g2'},
        {id:'e',name:'E',editorGroupId:''},{id:'f',name:'F',editorGroupId:''}].map(row=>({...row,from:'r',to:'ticket',mode:'fixed',cost:1,gain:1}));
    Object.assign(h.c,{gameId:'custom',getLang:()=> 'zh',gameInfo:{categories:[],economy:{resources:[{id:'r',name:'R'},{id:'ticket',name:'Ticket'}],
        editorGroups:{exchanges:[{id:'g1',name:'G1'},{id:'g2',name:'G2'},{id:'',name:'Outside'}]},
        exchanges,unlockGroups:[],payments:[],incomes:[]}},GameData:{getPresetRules:()=>null},readEngineEdit:()=> '[]',sessionStorage:{getItem:()=>null},galleryPreviewLock:{isLocked:()=>true}});
    vm.runInContext(read('ui/icon_render.js'),h.c);h.c.IconRender=h.c.window.IconRender;
    vm.runInContext(read('pages/gallery_economy.js'),h.c);
    h.api.set('currency_setup','sections','first');h.api.set('currency_setup','groups','first');h.api.set('currency_setup','rules','first');
    h.c.window.GalleryEconomy.render();let opened=Object.fromEntries(details.map(node=>[node.dataset.ecoKey,node.open]));
    assert.equal(opened['section:resources'],true);assert.equal(opened['section:exchanges'],false);
    assert.equal(opened['group:exchanges:g1'],true);assert.equal(opened['group:exchanges:g2'],false);
    for(const id of ['a','c','e'])assert.equal(opened['exchanges:'+id],true,id);
    for(const id of ['b','d','f'])assert.equal(opened['exchanges:'+id],false,id);
    details.find(node=>node.dataset.ecoKey==='exchanges:b').open=true;details.find(node=>node.dataset.ecoKey==='group:exchanges:g1').open=false;
    h.c.window.GalleryEconomy.render();opened=Object.fromEntries(details.map(node=>[node.dataset.ecoKey,node.open]));
    assert.equal(opened['exchanges:b'],true);assert.equal(opened['group:exchanges:g1'],false);
});
test('Pool Rules sets outer sections and inner rules separately, with a first rule per parent',()=>{
    const h=runtime();h.api.set('pool_setup','sections','none');h.api.set('pool_setup','rules','first');
    const bodies=Array.from({length:3},()=>({style:{display:'block'}})),arrows=bodies.map(()=>({setAttribute(){}})),groups=[{},{}];
    const details=[0,0,1,1].map(parent=>{const node={hidden:false};node.parentElement={parentElement:groups[parent],querySelector:()=>({click(){node.hidden=!node.hidden;}})};return node;});
    h.c.document.getElementById=id=>/^card-\d-body$/.test(id)?bodies[Number(id.split('-')[1])]:arrows[Number(id.split('-')[1])];
    h.c.document.querySelectorAll=selector=>selector.startsWith('.setup-card')?bodies.map((_,i)=>({id:'card-section-'+i})):details;h.c.getTrans=key=>key;
    const source=read('pages/pool_setup.js'),start=source.indexOf('        window.toggleCardSection ='),end=source.indexOf('        window.toggleCardZero =',start);
    vm.runInContext(source.slice(start,end),h.c);h.c.toggleCardSection=h.c.window.toggleCardSection;
    vm.runInContext('initializePanelDefaults()',h.c);
    assert.ok(bodies.every(node=>node.style.display==='none'));assert.deepEqual(details.map(node=>node.hidden),[false,true,false,true]);
});
test('Player Data defaults only the saved account shells, while single account and explicit new account stay visible',()=>{
    const h=runtime();h.api.set('user_data','accounts','first');let multi=true,created=[];
    const nodes={'data-error':{},'data-list':{replaceChildren(){},append(){}},'data-new':{},'data-merge':{}};
    Object.assign(h.c,{node:id=>nodes[id],cards:[],UserDataProfiles:{read:()=>({revision:0,items:[{id:'a'},{id:'b'}]}),mode:()=>multi?'multi':'single',defaultRow:items=>items[0]},game:'test',addEditor:(row,open)=>created.push([row.id,open]),showEmpty(){},tr:a=>a});
    const source=read('pages/user_data.js'),start=source.indexOf('    function render(){'),end=source.indexOf("    document.addEventListener('DOMContentLoaded'",start);
    vm.runInContext(source.slice(start,end),h.c);vm.runInContext('render()',h.c);assert.deepEqual(created,[['a',true],['b',false]]);
    multi=false;created=[];h.api.set('user_data','accounts','none');vm.runInContext('render()',h.c);assert.deepEqual(created,[['a',true]]);
    assert.match(source,/addEditor\(null,true\)/);
});
test('Gallery categories, each category rarity, global configuration and its subpanels are independent',()=>{
    const h=runtime();let html='';const bodies={};
    for(const id of ['custom-pools-body','master-settings-body','global-tiers-body','custom-tags-body'])bodies[id]={style:{}};
    for(const id of ['pools-arrow-indicator','master-settings-arrow','tier-arrow-indicator','tag-arrow-indicator'])bodies[id]={dataset:{}};
    bodies['categories-container']={set innerHTML(value){html=value;}};
    h.c.document.getElementById=id=>bodies[id]||null;
    Object.assign(h.c,{gameInfo:{categories:[{id:'char',name:'Characters'},{id:'wep',name:'Weapons'}],globalTiers:[{id:'gold',name:'Gold',color:'gold'},{id:'silver',name:'Silver',color:'silver'}]},
        catalog:{char:[],wep:[]},PRESET_GAME_IDS:['test'],gameId:'test',getActiveTagDefinitions:()=>({}),getLang:()=> 'zh',
        getLocalizedCatName:row=>row.name,getLocalizedTierName:row=>row.name,getLocalizedTagName:row=>row.name,
        tierOpenState:{},tierFilterState:{},categoryOpenState:{},bindGridDragEvents(){},bindDragEvents(){},escapeEditorAttribute:value=>value});
    vm.runInContext(read('ui/icon_render.js'),h.c);h.c.IconRender=h.c.window.IconRender;
    h.api.set('gallery_setup','engine','first');h.api.set('gallery_setup','configuration','none');
    h.api.set('gallery_setup','categories','first');h.api.set('gallery_setup','tiers','first');
    const source=read('pages/gallery_setup.js'),start=source.indexOf('        function renderGameIcon()'),end=source.indexOf('        window.addNewCategory',start);
    vm.runInContext(source.slice(start,end),h.c);
    const initialize=source.indexOf('        function initializeGalleryPanelDefaults()');
    vm.runInContext(source.slice(initialize,source.indexOf('        window.toggleSectionAccordion',initialize)),h.c);
    vm.runInContext('renderCategories();initializeGalleryPanelDefaults();',h.c);
    assert.equal(bodies['custom-pools-body'].style.display,'flex');assert.equal(bodies['master-settings-body'].style.display,'none');
    assert.equal(bodies['global-tiers-body'].style.display,'none');assert.equal(bodies['custom-tags-body'].style.display,'none');
    assert.deepEqual(JSON.parse(JSON.stringify(h.c.categoryOpenState)),{char:true,wep:false});
    assert.deepEqual(JSON.parse(JSON.stringify(h.c.tierOpenState)),{char_gold:true,char_silver:false,wep_gold:true,wep_silver:false});
    assert.equal([...html.matchAll(/class="tier-body" style="display: flex/g)].length,2);
    h.c.categoryOpenState.wep=true;h.c.tierOpenState.char_gold=false;h.c.tierOpenState.char_silver=true;
    vm.runInContext('renderCategories()',h.c);assert.equal(h.c.categoryOpenState.wep,true);assert.equal(h.c.tierOpenState.char_gold,false);assert.equal(h.c.tierOpenState.char_silver,true);
});
test('holdings search temporarily opens matches and restores manual expansion when cleared',()=>{
    const h=runtime(),search={value:'Match'},row={dataset:{startItem:'Match'}},group={querySelectorAll:()=>[row]},tier={open:false,querySelectorAll:()=>[group]},category={querySelectorAll:()=>[tier]};
    const lists={'[data-start-item]':[row],'[data-start-group]':[group],'[data-start-tier]':[tier],'[data-start-category]':[category]};
    h.c.dialog={querySelector:()=>search,querySelectorAll:selector=>lists[selector]||[]};
    const source=read('ui/simulator_start.js'),start=source.indexOf("            const search=dialog.querySelector('[data-start-search]');"),end=source.indexOf("            dialog.querySelector('form').onsubmit",start);
    vm.runInContext(source.slice(start,end),h.c);search.oninput();assert.equal(tier.open,true);
    search.value='';search.oninput();assert.equal(tier.open,false);
    tier.open=true;search.value='Missing';search.oninput();assert.equal(tier.open,false);assert.equal(tier.hidden,true);
    search.value='';search.oninput();assert.equal(tier.open,true);assert.equal(tier.hidden,false);
});
test('all affected pages load defaults before their editors; Settings and quick settings share the controls',()=>{
    for(const page of ['pool_setup','gallery_setup','currency_setup','user_data','simulator','settings']){
        const html=read(page+'.html');assert.ok(html.indexOf('ui/panel_defaults.js')<html.indexOf('</head>'),page);assert.ok(html.includes('ui/panel_defaults.js'),page);
    }
    assert.match(read('ui/quick_settings.js'),/PageLayout\.mountControls\(panel, layoutPage\)/);
    assert.match(read('ui/page_layout.js'),/PanelDefaults\?\.mountControls\(host, page, \{settings\}\)/);
});
