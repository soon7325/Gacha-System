const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');const vm=require('node:vm');
let language='zh',locked=false,dirty=0,binding;
const root={innerHTML:'',querySelectorAll:()=>[]};
const details={hidden:true},heading={textContent:'保留名称'};
const card={dataset:{ecoList:'exchanges',ecoId:'x'},querySelector:s=>s==='[data-eco-prerequisite-details]'?details:s==='strong'?heading:null};
const bilingual={install:options=>{binding=options;return {};}};
const context=require('./icon_test_context.cjs').createContext({window:{BilingualInput:bilingual},BilingualInput:bilingual,document:{getElementById:()=>root},
    getLang:()=>language,gameId:'prerequisite',readEngineEdit:()=> '[]',GameData:{getPresetRules:()=>null},
    sessionStorage:{getItem:()=>null},galleryPreviewLock:{isLocked:()=>locked},markPageDirty:()=>dirty++,
    gameInfo:{categories:[],globalTiers:[],economy:{resources:[{id:'a',name:'代币'},{id:'b',name:'票'}],exchanges:[{id:'x',name:'兑换',from:'a',toIds:['b'],mode:'fixed',cost:1,gain:1}]}}});
vm.runInContext(fs.readFileSync(path.join(__dirname,'../../pages/gallery_economy.js'),'utf8'),context);
const page=context.window.GalleryEconomy;
const row=context.gameInfo.economy.exchanges[0];
page.render();
assert.doesNotMatch(root.innerHTML,/data-eco-field="hasPrerequisite"/);
assert.deepEqual(Array.from(page.validate()),[]);
row.hasPrerequisite=true;row.prerequisite='第一层消费1490';page.render();
const group=context.gameInfo.economy.unlockGroups.find(group=>group.id===row.unlockGroupId);
assert.ok(group);assert.equal(group.prerequisite,'第一层消费1490');
card.dataset.ecoList='unlockGroups';card.dataset.ecoId=group.id;
const input={type:'text',tagName:'INPUT',value:'第一层消费1490',dataset:{ecoField:'prerequisite'},setCustomValidity(){},closest:s=>s==='[data-eco-field]'?input:s==='[data-eco-list]'?card:null};
root.oninput({type:'input',target:input});
assert.equal(group.prerequisite,'第一层消费1490');assert.equal(heading.textContent,'保留名称');
assert.deepEqual(Array.from(page.validate()),[]);
language='en';input.value='Spend 1,490 in Phase 1';root.oninput({type:'input',target:input});
assert.equal(group.prerequisiteEn,input.value);assert.equal(group.prerequisite,'第一层消费1490');
const editor=binding.resolve(input);
assert.equal(editor.getValue('zh'),'第一层消费1490');
editor.setValue('en','English detail');assert.equal(group.prerequisiteEn,'English detail');
assert.equal(heading.textContent,'保留名称','说明编辑不能改标题');
for(const mode of ['once','fixed','monthly','staged','once_staged']) {
    row.mode=mode;row.limit=2;row.stages=[{cost:10,gain:1,toIds:['b']}];row.toIds=['b'];
    page.render();assert.match(root.innerHTML,/English detail/);assert.match(root.innerHTML,/Prerequisites/);
    assert.deepEqual(Array.from(page.validate()),[]);
}
const saved=JSON.parse(JSON.stringify(context.gameInfo));
assert.equal(saved.economy.exchanges[0].hasPrerequisite,undefined);
assert.equal(saved.economy.unlockGroups[0].prerequisite,'第一层消费1490');
assert.equal(saved.economy.unlockGroups[0].prerequisiteEn,'English detail');
assert.equal('prerequisiteCompleted' in saved.economy.exchanges[0],false,'配置不写入未来运行状态');
locked=true;const before=JSON.stringify(group),marks=dirty;
input.value='Blocked';root.oninput({type:'input',target:input});editor.setValue('en','Blocked');
assert.equal(JSON.stringify(group),before);assert.equal(dirty,marks);
console.log('PASS：全部兑换方式的前置勾选、双语详情、保存字段、隐藏保留与锁定保护');
