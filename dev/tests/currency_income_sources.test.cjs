const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');const vm=require('node:vm');
let language='zh';const root={innerHTML:'',querySelectorAll:()=>[]};
const incomes=['daily','topup','gift','room'].map((source,i)=>({id:source,name:'来源'+i,en:'Source '+i,source,resourceId:'r',schedule:['daily','once','signin','unlimited'][i],amount:10+i,days:[{day:1,amount:5},{day:3,amount:10}]}));
const before=JSON.parse(JSON.stringify(incomes));
incomes.push({id:'return',name:'返还',source:'byproduct',resourceId:'r',condition:'always',amount:2,categoryIds:[],poolIds:[],tagIds:[],tagMatch:'any'});
const context=require('./icon_test_context.cjs').createContext({window:{},document:{getElementById:()=>root},gameId:'sources',getLang:()=>language,
    readEngineEdit:()=> '[]',GameData:{getPresetRules:()=>null},sessionStorage:{getItem:()=>null},galleryPreviewLock:{isLocked:()=>true},
    gameInfo:{categories:[],globalTiers:[],economy:{resources:[{id:'r',name:'资源'}],incomes}}});
vm.runInContext(fs.readFileSync(path.join(__dirname,'../../pages/gallery_economy.js'),'utf8'),context);
const page=context.window.GalleryEconomy;page.render();
for(let i=0;i<4;i++) assert.deepEqual(JSON.parse(JSON.stringify(incomes[i])),{...before[i],source:'other'},'只迁移来源，保留名称、发放安排、数量和签到节点');
assert.equal(incomes[4].source,'byproduct');
const menus=[...root.innerHTML.matchAll(/<select data-eco-field="source">(.*?)<\/select>/g)];
assert.equal(menus.length,5);
for(const [,menu] of menus){assert.equal((menu.match(/<option /g)||[]).length,2);assert.match(menu,/value="other"/);}
assert.deepEqual(Array.from(page.validate()),[]);
const saved=JSON.stringify(context.gameInfo);page.render();assert.equal(JSON.stringify(context.gameInfo),saved,'迁移幂等且可保存');
language='en';page.render();assert.match(root.innerHTML,/>Other<\/option>/);
console.log('PASS：来源简化为两类，四种旧来源无损迁移，双语和保存结构一致');
