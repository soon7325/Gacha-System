const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'../..'),read=file=>fs.readFileSync(path.join(root,file),'utf8');
function setup(route='user_data',initial={}){
    const store=new Map(Object.entries(initial)),attributes={},handlers={},controls=[];
    const element=tag=>({tagName:tag.toUpperCase(),children:[],dataset:{},style:{},append(...nodes){this.children.push(...nodes);if(tag==='label')controls.push(...nodes.filter(node=>node.tagName==='SELECT'));}});
    const c=vm.createContext({window:{getTrans:key=>key,addEventListener:(name,fn)=>handlers[name]=fn},location:{pathname:'/'+route},
        localStorage:{getItem:key=>store.get(key)??null,setItem:(key,value)=>store.set(key,value)},
        document:{documentElement:{setAttribute:(key,value)=>attributes[key]=value},addEventListener:(name,fn)=>handlers['document:'+name]=fn,
            querySelectorAll:selector=>selector==='select[data-layout-page]'?controls:[],createElement:element}});
    vm.runInContext(read('ui/page_layout.js'),c);
    return {api:c.window.PageLayout,c,store,attributes,handlers,controls,element};
}
test('各功能页布局独立保存，输入无效值回退；兼容无扩展名和尾斜杠地址',()=>{
    for(const route of ['user_data','user_data.html','user_data/']){
        const h=setup(route,{GM_Player_Data_Layout:'right',GM_Player_Data_Header_Layout:'full',GM_Gallery_Layout:'left'});
        assert.equal(h.attributes['data-page-content'],'right');assert.equal(h.attributes['data-page-header'],'full');
        assert.equal(h.api.set('user_data','content','left'),true);assert.equal(h.attributes['data-page-content'],'left');
        assert.equal(h.store.get('GM_Gallery_Layout'),'left');assert.equal(h.store.get('GM_Pool_Layout'),undefined);
        const before=Array.from(h.store);for(const args of [['user_data','bad','left'],['none','content','left'],['user_data','header','right']])assert.equal(h.api.set(...args),false);
        assert.deepEqual(Array.from(h.store),before);
    }
    const h=setup('pool_setup.html',{GM_Pool_Layout:'bad',GM_Pool_Header_Layout:'left'});assert.equal(h.attributes['data-page-content'],'center');assert.equal(h.attributes['data-page-header'],'follow');
    assert.equal(setup('simulator').attributes['data-page-content'],'full');
    assert.equal(setup('dashboard',{GM_Dashboard_Layout:'full'}).attributes['data-layout'],'full');
});
test('旧货币位置只迁移一次，此后与图鉴布局分开；页面设置不写玩家数据',()=>{
    const h=setup('currency_setup',{GM_Gallery_Layout:'right',GM_Sim_Profiles_hsr:'keep'});
    assert.equal(h.store.get('GM_Currency_Layout'),'right');h.api.set('gallery_setup','content','left');h.api.apply();assert.equal(h.attributes['data-page-content'],'right');
    h.api.set('currency_setup','content','full');assert.equal(h.attributes['data-page-content'],'full');assert.equal(h.store.get('GM_Gallery_Layout'),'left');assert.equal(h.store.get('GM_Sim_Profiles_hsr'),'keep');
});
test('设置页和快捷弹窗生成相同选项和保存行为，默认回显并随跨页设置更新',()=>{
    const h=setup('user_data');const settings=h.element('div'),popover=h.element('div');
    h.api.mountFields(settings,'user_data');h.api.mountFields(popover,'user_data');
    const [content,header,quickContent,quickHeader]=h.controls;
    assert.equal(content.id,'playerDataLayoutSelect');assert.equal(header.id,'playerDataHeaderLayoutSelect');
    assert.equal(content.children.map(option=>option.value).join(','),'center,left,right,full');assert.equal(header.children.map(option=>option.value).join(','),'full,follow');
    assert.equal(content.value,'center');assert.equal(header.value,'follow');
    quickContent.value='right';quickContent.onchange();assert.equal(content.value,'right');assert.equal(h.attributes['data-page-content'],'right');
    header.value='full';header.onchange();assert.equal(quickHeader.value,'full');assert.equal(h.attributes['data-page-header'],'full');
    h.c.window.VersionStorage={eventKey:key=>key.replace('scoped:','')};h.store.set('GM_Player_Data_Layout','left');h.handlers.storage({key:'scoped:GM_Player_Data_Layout'});assert.equal(content.value,'left');assert.equal(quickContent.value,'left');assert.equal(h.attributes['data-page-content'],'left');
});

test('设置页和快捷入口仅挂载两个按钮，布局字段由展示弹窗生成',()=>{
    const h=setup('pool_setup'),host=h.element('div'),calls=[];
    h.c.window.PanelDefaults={mountControls:(target,page)=>calls.push(['panels',page])};
    h.c.window.ContentColumns={mountControls:(target,page)=>calls.push(['display',page])};
    h.api.mountControls(host,'pool_setup',{settings:true});
    assert.equal(h.controls.length,0);assert.deepEqual(calls,[['display','pool_setup'],['panels','pool_setup']]);
    h.api.mountFields(host,'pool_setup');assert.equal(h.controls.length,2);
});
test('五个新增布局入口都接入快捷弹窗，脚本在首屏与设置回显之前加载',()=>{
    const dictionaries=require('./translation_helpers.cjs').loadDictionaries();
    for(const definition of Object.values(setup().api.definitions))for(const lang of ['zh','en'])assert.ok(dictionaries[lang][definition.title]);
    for(const page of ['gallery_setup','pool_setup','user_data','currency_setup','simulator']){
        const html=read(page+'.html');assert.ok(html.indexOf('src="ui/page_layout.js"')<html.indexOf('</head>'));assert.ok(html.includes('ui/page_layout.css'));
        assert.ok(read('settings.html').includes('data-page-layout-controls="'+page+'"'));
    }
    assert.ok(read('ui/quick_settings.js').includes('PageLayout.mountControls(panel, layoutPage)'));
});
