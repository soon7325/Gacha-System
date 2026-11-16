const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const read=file=>fs.readFileSync(path.join(__dirname,'../..',file),'utf8');
test('四个预设共用数据源初始化；不生成虚构卡池与占位角色，不改玩家和旧图鉴数据',()=>{
    const store=new Map([['GM_Sim_Profiles_hsr','player'],['GM_Roster_hsr','legacy roster'],['GM_Rules_custom_pool','custom rules']]);
    const c=vm.createContext({window:{},localStorage:{getItem:key=>store.get(key)??null,setItem:(key,value)=>store.set(key,value)}});
    for(const file of ['Preset_Data/db_hsr.js','Preset_Data/db_zzz.js','Preset_Data/db_end.js','Preset_Data/db_ark.js','logic/game_data.js','logic/preset_storage.js']){vm.runInContext(read(file),c);Object.assign(c,c.window);}
    for(const id of ['hsr','zzz','end','ark']){
        assert.equal(c.PresetStorage.initialize(id),true);
        const info=JSON.parse(store.get('GM_Info_'+id));assert.ok(info.economy.resources.length);
        const rules=c.GameData.getPresetRules(id);
        for(const [pool,config] of Object.entries(rules))assert.equal(store.get(`GM_Rules_${id}_${pool}`),JSON.stringify(config));
        assert.equal(store.has(`GM_Rules_${id}_mixed_std_enabled`),false);
        if(!rules.char_collab)assert.equal(store.has(`GM_Rules_${id}_char_collab`),false);
        if(id!=='hsr')assert.equal(store.has('GM_Roster_'+id),false);
    }
    assert.equal(store.get('GM_Sim_Profiles_hsr'),'player');assert.equal(store.get('GM_Roster_hsr'),'legacy roster');
    const before=Array.from(store);assert.equal(c.PresetStorage.initialize('custom'),false);assert.deepEqual(Array.from(store),before);
});
test('侧栏初始化保留四个有效预设的用户排序',()=>{
    const saved=JSON.stringify([{id:'end',name:'终末地'},{id:'ark',name:'方舟'},{id:'hsr',name:'崩铁'},{id:'zzz',name:'绝区零'}]);
    const store=new Map([['GM_Custom_Games_List',saved]]),source=read('ui/layout.js');
    vm.runInNewContext(source.slice(0,source.indexOf('// 初始化主题与排版等多语言环境变量')),{localStorage:{getItem:key=>store.get(key)??null,setItem:(key,value)=>store.set(key,value)}});
    assert.equal(store.get('GM_Custom_Games_List'),saved);
});
