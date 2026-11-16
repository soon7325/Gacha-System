const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const read=file=>fs.readFileSync(path.join(__dirname,'../..',file),'utf8');
function setup(page,initial={}){
    const store=new Map(Object.entries(initial)),listeners={},calls={mode:0,records:0,start:0};let panel;
    const element=tag=>({tagName:tag.toUpperCase(),children:[],dataset:{},style:{},handlers:{},hidden:false,
        append(...nodes){this.children.push(...nodes);if(tag==='body')panel=nodes[0];},setAttribute(){},focus(){},remove(){},
        addEventListener(name,fn){this.handlers[name]=fn;},getBoundingClientRect:()=>({width:340,right:40,bottom:600}),offsetHeight:400});
    const anchor=element('a'),body=element('body');
    const c=vm.createContext({window:{addEventListener(){},refreshCustomDropdowns(){},refreshPlayerDataMode:()=>calls.mode++,
        refreshSimulatorRecords:()=>calls.records++,refreshSimulatorStart:()=>calls.start++,confirmPlayerDataModeChange:()=>true},
        location:{pathname:'/'+page},innerWidth:1200,innerHeight:900,
        localStorage:{getItem:key=>store.get(key)??null,setItem:(key,value)=>store.set(key,value)},
        document:{body,createElement:element,createTextNode:text=>({textContent:text}),documentElement:{setAttribute(){}},
            addEventListener:(name,fn)=>(listeners[name]??=[]).push(fn)}});
    for(const lang of ['zh','en'])vm.runInContext(read('translate/translate_'+lang+'.js'),c);
    c.window.getTrans=key=>c.window.UI_LIB[store.get('GM_Lang')||'zh'][key]||key;
    vm.runInContext(read('logic/app_preferences.js'),c);
    vm.runInContext(read('ui/quick_settings.js'),c);
    const open=()=>listeners.click[0]({target:{closest:()=>anchor},button:0,preventDefault(){},stopPropagation(){}});
    open();
    const all=(node=panel)=>[node,...node.children.flatMap(child=>child.children?all(child):[child])];
    const control=key=>all().find(node=>node.dataset?.quickPreference===key);
    const change=async(key,value)=>{const input=control(key);if(input.tagName==='SELECT')input.value=value;else input.checked=value;await input.handlers.change();};
    return {c,store,calls,all,control,change,panel,open};
}
test('玩家数据快捷设定包含管理方式、三个勾选和两条提示，同步范围随开关显隐',async()=>{
    const h=setup('user_data.html');
    assert.deepEqual(h.all().filter(node=>node.dataset?.quickPreference).map(node=>node.dataset.quickPreference),[
        'GM_Player_Data_Mode','GM_Dashboard_Sync_Player','GM_Dashboard_Sync_Existing','GM_Sim_Start_Auto_Low_Overflow']);
    const history=h.panel.children.find(node=>node.children?.some(child=>child.children?.includes(h.control('GM_Dashboard_Sync_Existing'))));
    assert.equal(history.hidden,true);assert.equal(h.control('GM_Sim_Start_Auto_Low_Overflow').checked,true);
    await h.change('GM_Dashboard_Sync_Player',true);assert.equal(history.hidden,false);
    await h.change('GM_Dashboard_Sync_Existing',true);await h.change('GM_Dashboard_Sync_Player',false);
    assert.equal(history.hidden,true);assert.equal(h.store.get('GM_Dashboard_Sync_Existing'),'true');
    const texts=h.all().map(node=>node.textContent||'').join(' ');
    assert.match(texts,/切换模式不会删除已有账号/);assert.match(texts,/该设置也会影响模拟器创建数据时的填写/);
});
test('取消模式切换保留旧偏好和表单，确认后才保存并刷新；英文标签不显示翻译键',async()=>{
    const h=setup('user_data',{GM_Lang:'en',GM_Player_Data_Mode:'multi'});
    h.c.window.confirmPlayerDataModeChange=async()=>false;
    await h.change('GM_Player_Data_Mode','single');
    assert.equal(h.store.get('GM_Player_Data_Mode'),'multi');assert.equal(h.control('GM_Player_Data_Mode').value,'multi');assert.equal(h.calls.mode,0);
    h.c.window.confirmPlayerDataModeChange=async()=>true;
    await h.change('GM_Player_Data_Mode','single');assert.equal(h.store.get('GM_Player_Data_Mode'),'single');assert.equal(h.calls.mode,1);
    const texts=h.all().map(node=>node.textContent||'').join(' ');assert.match(texts,/Data management/);assert.doesNotMatch(texts,/set_player_data_/);
});
test('模拟器保留记录立即通知保存，记住起点只在启用起点且未保留记录时显示',async()=>{
    const h=setup('simulator.html');
    const remember=h.panel.children.find(node=>node.children?.some(child=>child.children?.includes(h.control('GM_Sim_Remember_Start'))));
    assert.equal(remember.hidden,true);assert.equal(h.control('GM_Sim_Keep_Records').checked,false);assert.equal(h.control('GM_Sim_Remember_Start').checked,true);
    await h.change('GM_Sim_Start_Setup',true);assert.equal(remember.hidden,false);assert.equal(h.calls.start,1);
    await h.change('GM_Sim_Keep_Records',true);assert.equal(remember.hidden,true);assert.equal(h.calls.records,1);
    await h.change('GM_Sim_Keep_Records',false);assert.equal(remember.hidden,false);
    await h.change('GM_Sim_Remember_Start',false);assert.equal(h.store.get('GM_Sim_Remember_Start'),'false');
});
