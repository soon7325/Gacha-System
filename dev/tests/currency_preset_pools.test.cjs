const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');const vm=require('node:vm');
const read=file=>fs.readFileSync(path.join(__dirname,'../..',file),'utf8');
for(const id of ['ark','hsr','zzz','end']) {
    let language='zh';
    const root={innerHTML:'',querySelectorAll:()=>[]};
    const context=require('./icon_test_context.cjs').createContext({window:{},document:{getElementById:()=>root,addEventListener(){}},gameId:id,
        localStorage:{getItem:()=>null},getLang:()=>language,
        readEngineEdit:()=>JSON.stringify([{id:'char_std',name:'旧图鉴积木'},{id:'obsolete_pool',name:'过时卡池'}]),
        sessionStorage:{getItem:()=>JSON.stringify(['up_1','char_up'])},galleryPreviewLock:{isLocked:()=>true}});
    vm.runInContext(read(`Preset_Data/db_${id}.js`),context);
    vm.runInContext(read('logic/game_data.js'),context);
    const data=context.GameData=context.window.GameData;
    context.gameInfo={...data.getPresetSetup(id),globalTiers:data.getPresetTiers(id)};
    vm.runInContext(read('pages/gallery_economy.js'),context);
    const page=context.window.GalleryEconomy;
    assert.deepEqual(Array.from(page.validate()),[],`${id} 非空旧缓存不遮住预设卡池`);
    page.render();assert.doesNotMatch(root.innerHTML,/已移除/);
    const ruleNames=Object.values(data.getPresetRules(id)).map(row=>row.info.name);
    assert.ok(ruleNames.some(name=>root.innerHTML.includes(name)));
    language='en';page.render();assert.doesNotMatch(root.innerHTML,/Removed:|Removed reference:/);
}
// 自建游戏仍以自己的卡池和待删除记录为准，真实失效引用继续提示。
const root={innerHTML:'',querySelectorAll:()=>[]};
let deleted=[];
const context=require('./icon_test_context.cjs').createContext({window:{},document:{getElementById:()=>root,addEventListener(){}},gameId:'custom',getLang:()=> 'zh',
    GameData:{getPresetRules:()=>null},readEngineEdit:()=>JSON.stringify([{id:'custom_pool',name:'自建卡池'}]),
    sessionStorage:{getItem:()=>JSON.stringify(deleted)},galleryPreviewLock:{isLocked:()=>false},
    gameInfo:{categories:[],globalTiers:[],economy:{resources:[{id:'r',name:'票'}],payments:[{id:'p',name:'支付',resourceId:'r',cost:1,pulls:1,poolIds:['custom_pool']}]}}});
vm.runInContext(read('pages/gallery_economy.js'),context);
const page=context.window.GalleryEconomy;
assert.deepEqual(Array.from(page.validate()),[]);page.render();assert.match(root.innerHTML,/自建卡池/);
deleted=['custom_pool'];assert.ok(page.validate().some(error=>error.includes('卡池')));
page.render();assert.match(root.innerHTML,/已移除：custom_pool/);
console.log('PASS：货币页预设卡池不受旧缓存覆盖，中英名称正确，自建游戏失效引用仍提示');
