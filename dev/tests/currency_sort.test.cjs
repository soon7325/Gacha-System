const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
(async () => {
const bindings = new Map();
let locked = false, dirty = 0;
const root = { innerHTML:'',querySelectorAll:()=>[],querySelector:selector=>({key:selector}) };
const drag = {bind(container, selector, callback, options) { bindings.set(selector === '.eco-section' ? 'sections' : container.key.match(/"(.*?)"/)[1],{callback,options}); }};
const context = require('./icon_test_context.cjs').createContext({window:{DragSort:drag,confirm:()=>true},DragSort:drag,
    document:{getElementById:()=>root,addEventListener(){}},getLang:()=> 'zh',gameId:'sort',
    gameInfo:{categories:[],globalTiers:[]},GameData:{getPresetRules:()=>null},readEngineEdit:()=>null,sessionStorage:{getItem:()=>null},
    galleryPreviewLock:{isLocked:()=>locked},markPageDirty:()=>dirty++,showToast(){}
});
vm.runInContext(fs.readFileSync(path.join(__dirname,'../../pages/gallery_economy.js'),'utf8'),context);
const economy = context.window.GalleryEconomy;
economy.render();
const expectedSections=['resources','exchanges','unlockGroups','payments','incomes','caps'];
const shownSections=()=>[...root.innerHTML.matchAll(/data-eco-section="([^"]+)"/g)].map(match=>match[1]);
assert.deepEqual(shownSections(),expectedSections);
context.gameInfo.economy.sectionOrder=['incomes','resources','caps','payments','exchanges','unlockGroups'];
context.gameInfo.economy.sectionOrderVersion=2;
economy.render();
assert.deepEqual(shownSections(),expectedSections,'旧拖拽偏好不影响固定的系统分区');
assert.equal(context.gameInfo.economy.sectionOrder,undefined);
assert.equal(context.gameInfo.economy.sectionOrderVersion,undefined);
assert.doesNotMatch(root.innerHTML,/eco-section-drag/);
assert.equal(bindings.has('sections'),false,'不绑定系统分区拖拽');
await root.onclick({target:{closest:selector=>selector === '[data-eco-action]' ? {dataset:{ecoAction:'example'}} : null}});
const m = context.gameInfo.economy;
assert.equal(bindings.size,5);
const first = m.resources[0], second = m.resources[1];
const original = JSON.stringify(first);
bindings.get('resources').callback(first.id,second.id,false);
assert.equal(m.resources[0].id,second.id);
assert.equal(m.resources[1].id,first.id);
const {editorGroupId,...businessFields}=m.resources[1];assert.equal(JSON.stringify(businessFields),original,'拖拽保留资源业务字段');assert.equal(editorGroupId,m.resources[0].editorGroupId,'跨分类排序同时更新归属');
const serialized = JSON.parse(JSON.stringify(m));
assert.equal(serialized.resources[0].id,second.id);
assert.equal(serialized.sectionOrder,undefined);
assert.deepEqual(shownSections(),expectedSections);
assert.ok(dirty >= 2);
locked = true;
const snapshot = JSON.stringify(m), marks = dirty;
assert.equal(bindings.get('resources').options.canDrag(),false);
bindings.get('resources').callback(second.id,first.id,false);
assert.equal(JSON.stringify(m),snapshot);
assert.equal(dirty,marks);
console.log('PASS：公共拖拽组件接线、系统分区固定、内部规则排序、字段不变、保存顺序与只读保护');

})().catch(error => { console.error(error); process.exitCode = 1; });
