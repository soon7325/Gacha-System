const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
let locked = false;
const root = {innerHTML:'', querySelectorAll:()=>[]};
const context = require('./icon_test_context.cjs').createContext({window:{}, document:{getElementById:()=>root}, gameId:'stages',
    getLang:()=> 'zh', readEngineEdit:()=> '[]', GameData:{getPresetRules:()=>null},
    sessionStorage:{getItem:()=>null}, galleryPreviewLock:{isLocked:()=>locked}, markPageDirty(){},
    gameInfo:{categories:[], globalTiers:[], economy:{
        resources:[{id:'a',name:'代币'},{id:'b',name:'单抽票'},{id:'c',name:'十连票'}],
        exchanges:[{id:'legacy',name:'旧阶梯',from:'a',to:'b',mode:'staged',cost:10,gain:1,
            stages:[{cost:10,gain:1,toIds:[]},{cost:70,gain:1,to:'c'}]}],
        payments:[{id:'single',name:'单抽',resourceId:'b',cost:1,pulls:1},{id:'ten',name:'十连',resourceId:'c',cost:1,pulls:10}]
    }}});
vm.runInContext(fs.readFileSync(path.join(__dirname,'../../pages/gallery_economy.js'),'utf8'),context);
const page = context.window.GalleryEconomy;
page.render();
const row = context.gameInfo.economy.exchanges[0];
assert.equal('toIds' in row,false);
assert.equal('to' in row,false);
assert.deepEqual(Array.from(row.stages[0].toIds),['b'],'旧空档位迁入上层目标');
assert.deepEqual(Array.from(row.stages[1].toIds),['c'],'明确选择的档位目标保持');
const targetCount = () => (root.innerHTML.match(/data-eco-multi="toIds"/g)||[]).length;
assert.equal(targetCount(),2,'只显示两档目标，没有上方第三个目标选择器');
assert.doesNotMatch(root.innerHTML,/沿用目标资源/);
assert.match(root.innerHTML,/共11抽/);
assert.deepEqual(Array.from(page.validate()),[]);
const snapshot = JSON.stringify(row);
page.render(); page.validate();
assert.equal(JSON.stringify(row),snapshot,'重复渲染与校验不再改变迁移结果');
row.stages[0].toIds=[];
assert.ok(page.validate().some(error=>error.includes('阶梯目标')),'空档位不能保存或隐式继承');
row.stages[0].toIds=['a'];
assert.ok(page.validate().some(error=>error.includes('阶梯目标')),'禁止同资源自换');
row.stages[0].toIds=['removed'];
assert.ok(page.validate().some(error=>error.includes('阶梯目标')),'已删除目标不能保存');
row.stages[0].toIds=['b'];
const card={dataset:{ecoList:'exchanges',ecoId:row.id}};
function mode(value) {
    const control={tagName:'SELECT',type:'select-one',value,dataset:{ecoField:'mode'},setCustomValidity(){},
        closest:s=>s==='[data-eco-field]'?control:s==='[data-eco-list]'?card:null};
    root.onchange({target:control});
}
mode('once_staged');
assert.equal(targetCount(),2); assert.match(root.innerHTML,/每档仅一次/);
assert.equal('toIds' in row,false);
assert.deepEqual(Array.from(page.validate()),[]);
mode('fixed');
assert.equal(targetCount(),1,'切回固定兑换恢复上方选择器');
assert.deepEqual(Array.from(row.toIds),['b']);
assert.deepEqual(Array.from(page.validate()),[]);
mode('staged');
assert.equal(targetCount(),2); assert.equal('toIds' in row,false);
assert.deepEqual(Array.from(row.stages[1].toIds),['c']);
assert.deepEqual(Array.from(page.validate()),[]);
// 从没有档位的固定规则切换阶梯，带入原数量与目标。
mode('fixed'); row.stages=[]; row.cost=20; row.gain=2;
mode('once_staged');
assert.equal(row.stages[0].cost,20); assert.equal(row.stages[0].gain,2);
assert.deepEqual(Array.from(row.stages[0].toIds),['b']);
assert.equal('toIds' in JSON.parse(JSON.stringify(row)),false,'保存结构不再含上层目标');
locked=true; mode('fixed'); assert.equal(row.mode,'once_staged','锁定时不能切换模式');
console.log('PASS：阶梯目标仅分档选择、旧继承迁移、空档校验、模式切换与保存结构');
