const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const read=f=>fs.readFileSync(path.join(__dirname,'../..',f),'utf8'),plain=x=>JSON.parse(JSON.stringify(x));
function setup(saved){
 let locked=false,answer=true,dirty=0,activeSorts=0;const bindings=new Map(),listeners=new Map(),captures=new Map(),classes=new Set();
 const root={innerHTML:'',querySelectorAll:()=>[],querySelector:key=>({key}),classList:{add:key=>classes.add(key),remove:key=>classes.delete(key)},addEventListener(type,fn,capture){listeners.set(type,fn);if(capture)captures.set(type,fn);}};
 const drag={bind(container,selector,callback){activeSorts++;bindings.set((container===root?'root':container.key)+selector,callback);let destroyed=false;return {destroy(){assert.equal(destroyed,false);destroyed=true;activeSorts--;}};}};
 const info=saved||{categories:[],globalTiers:[],economy:{resources:[{id:'coin',name:'币',icon:'🪙'},{id:'ticket',name:'票',icon:'🎟️'}],payments:[{id:'pay',name:'单抽',resourceId:'ticket',cost:1,pulls:1}],exchanges:[{id:'buy',name:'买票',from:'coin',toIds:['ticket'],mode:'fixed',cost:2,gain:1}],incomes:[{id:'return',name:'返还',source:'byproduct',resourceId:'coin',condition:'always',amount:1},{id:'daily',name:'每日',source:'other',schedule:'daily',resourceId:'coin',amount:2},{id:'gift',name:'赠送',source:'other',schedule:'once',resourceId:'ticket',amount:1}],unlockGroups:[]}};
 const c=require('./icon_test_context.cjs').createContext({window:{DragSort:drag,confirm:()=>answer},DragSort:drag,document:{getElementById:()=>root},gameInfo:info,getLang:()=> 'zh',gameId:'test',GameData:{getPresetRules:()=>null},readEngineEdit:()=> '[]',sessionStorage:{getItem:()=>null},galleryPreviewLock:{isLocked:()=>locked},markPageDirty:()=>dirty++,showToast(){},IconPicker:{choose:async()=> '🌟'}});
 vm.runInContext(read('pages/gallery_economy.js'),c);const api=c.window.GalleryEconomy;api.render();
 const section=key=>({dataset:{ecoSection:key}}),group=(key,id)=>({dataset:{ecoGroupList:key,ecoGroupId:id}});
 const click=(action,key,id)=>root.onclick({preventDefault(){},stopPropagation(){},target:{closest:s=>s==='[data-eco-action]'?{dataset:{ecoAction:action}}:s==='[data-eco-group-list]'?(id===undefined?null:group(key,id)):s==='[data-eco-section]'?section(key):null}});
 const move=(key,id,to)=>{
  const card={dataset:{ecoList:key,ecoId:id}},target={dataset:{ecoGroupList:key,ecoGroupId:to}};
  listeners.get('dragstart')({target:{closest:s=>s==='.eco-card-drag'?{}:s==='[data-eco-list]'?card:null}});
  listeners.get('drop')({preventDefault(){},stopPropagation(){},target:{closest:s=>s==='[data-eco-group-list]'?target:null}});
 };
 return {activeSorts:()=>activeSorts,api,root,c,info,bindings,listeners,captures,classes,click,move,lock:()=>locked=true,answer:v=>answer=v,marks:()=>dirty};
}
test('五个部分都有默认收起的中层分类，浏览不写分类数据，满阶保持原样',()=>{
 const h=setup();assert.match(h.root.innerHTML,/抽卡返还/);assert.match(h.root.innerHTML,/日常与签到/);assert.match(h.root.innerHTML,/礼包与赠送/);
 for(const key of ['resources','exchanges','unlockGroups','payments','incomes'])assert.match(h.root.innerHTML,new RegExp('data-eco-group-list="'+key+'"'));
 assert.doesNotMatch(h.root.innerHTML,/data-eco-group-list="caps"/);assert.doesNotMatch(h.root.innerHTML,/data-eco-field="editorGroupId"|所属分类/);assert.doesNotMatch(h.root.innerHTML,/data-eco-action="add-in-group"|<details[^>]*data-eco-group-id=""/);
 assert.equal((h.root.innerHTML.match(/data-eco-action="add"/g)||[]).length,5);assert.equal(h.info.economy.editorGroups,undefined);
 assert.match(h.root.innerHTML,/data-eco-group-id="returns" ><summary/);
});
test('分类新建、改名、改图标、归类、默认添加在分类外及保存重载保留原规则ID',async()=>{
 const h=setup(),m=h.info.economy,original=plain(m.incomes[0]);await h.click('add-group','incomes');
 const created=m.editorGroups.incomes.find(g=>g.name==='新分类');assert.ok(created);
 const input={value:'活动补给',dataset:{ecoGroupField:'name'},closest:()=>({dataset:{ecoGroupList:'incomes',ecoGroupId:created.id}})};h.root.oninput({target:input});assert.equal(created.name,'活动补给');
 await h.click('group-icon','incomes',created.id);assert.equal(created.icon,'🌟');
 h.move('incomes','return',created.id);assert.equal(m.incomes[0].editorGroupId,created.id);const {editorGroupId,...business}=plain(m.incomes[0]);assert.deepEqual(business,original);
 await h.click('add','incomes');assert.equal(m.incomes.at(-1).editorGroupId,'');assert.match(h.root.innerHTML,/class="eco-ungrouped"[^>]*data-eco-group-list="incomes"[^>]*><details class="eco-card"/);
 const reloaded=setup(plain(h.info));assert.match(reloaded.root.innerHTML,/活动补给/);assert.equal(reloaded.info.economy.incomes[0].editorGroupId,created.id);
});
test('删除分类取消不写元数据；确认后只移动至未分类，预览锁禁止修改',async()=>{
 const h=setup();h.answer(false);await h.click('remove-group','incomes','returns');assert.equal(h.info.economy.editorGroups,undefined);
 h.answer(true);await h.click('remove-group','incomes','returns');assert.equal(h.info.economy.incomes.length,3);assert.equal(h.info.economy.incomes[0].editorGroupId,'');assert.ok(!h.info.economy.editorGroups.incomes.some(g=>g.id==='returns'));
 h.lock();const before=JSON.stringify(h.info),marks=h.marks();await h.click('add-group','incomes');h.move('incomes','return','daily');assert.equal(JSON.stringify(h.info),before);assert.equal(h.marks(),marks);
});
test('共用拖拽支持分类排序、规则跨分类排序与投放收起标题，同部分限制有效',()=>{
 const h=setup(),m=h.info.economy;h.bindings.get('[data-eco-items="incomes"].eco-rule-group')('returns','gifts',false);assert.ok(m.editorGroups.incomes.findIndex(g=>g.id==='returns')>m.editorGroups.incomes.findIndex(g=>g.id==='gifts'));
 h.bindings.get('[data-eco-items="incomes"].eco-card')('return','daily',true);assert.equal(m.incomes.find(r=>r.id==='return').editorGroupId,'daily');
 const card={dataset:{ecoList:'incomes',ecoId:'return'}},target={dataset:{ecoGroupList:'incomes',ecoGroupId:'gifts'},classList:{add(){},remove(){}}};
 h.listeners.get('dragstart')({target:{closest:s=>s==='.eco-card-drag'?{}:s==='[data-eco-list]'?card:null}});
 h.listeners.get('drop')({preventDefault(){},stopPropagation(){},target:{closest:s=>s==='[data-eco-group-list]'?target:null}});assert.equal(m.incomes.find(r=>r.id==='return').editorGroupId,'gifts');
 target.dataset.ecoGroupId='';h.listeners.get('dragstart')({target:{closest:s=>s==='.eco-card-drag'?{}:s==='[data-eco-list]'?card:null}});h.listeners.get('drop')({preventDefault(){},stopPropagation(){},target:{closest:s=>s==='[data-eco-group-list]'?target:null}});assert.equal(m.incomes.find(r=>r.id==='return').editorGroupId,'');
});

test('未添加条目的首次加载，内层拖动启动不改变布局；拖动后浮层落点出现',()=>{
 const h=setup();assert.equal(h.info.economy.editorGroups,undefined);
 const card={dataset:{ecoList:'incomes',ecoId:'return'}};
 h.listeners.get('dragstart')({target:{closest:s=>s==='.eco-card-drag'?{}:s==='[data-eco-list]'?card:null}});
 assert.equal(h.classes.has('eco-rule-dragging'),false,'dragstart 不改变样式或源位置');
 h.captures.get('dragover')({});assert.equal(h.classes.has('eco-rule-dragging'),true);
 h.listeners.get('dragend')({});assert.equal(h.classes.has('eco-rule-dragging'),false);
 const css=read('ui/gallery_economy.css');assert.match(css,/eco-ungrouped:empty\{position:absolute;/);
 assert.ok(h.bindings.has('[data-eco-items="resources"].eco-card'));assert.ok(h.bindings.has('[data-eco-items="exchanges"].eco-card'));
});
test('通用示例按钮默认隐藏，偏好切换只更新按钮，不重建规则或改动草稿',()=>{
 const h=setup(),button={hidden:false},store=new Map();h.root.querySelector=s=>s==='[data-eco-action="example"]'?button:{key:s};
 h.c.localStorage={getItem:key=>store.get(key)??null};const before=JSON.stringify(h.info),html=h.root.innerHTML,marks=h.marks();
 h.api.refreshExampleVisibility();assert.equal(button.hidden,true);
 store.set('GM_Show_Currency_Examples','true');h.api.refreshExampleVisibility();assert.equal(button.hidden,false);
 store.set('GM_Show_Currency_Examples','false');h.api.refreshExampleVisibility();assert.equal(button.hidden,true);
 assert.equal(JSON.stringify(h.info),before);assert.equal(h.root.innerHTML,html);assert.equal(h.marks(),marks);
 const settings=read('settings.html');assert.match(settings,/id="currencyExamplesToggle"/);assert.match(settings,/GM_Show_Currency_Examples/);
 assert.match(read('ui/quick_settings.js'),/set_currency_examples','GM_Show_Currency_Examples'.*false/);
});

test('编辑器反复重绘释放旧拖拽绑定，不随编辑次数累积',()=>{
 const h=setup(),initial=h.activeSorts();assert.equal(initial,10);
 for(let i=0;i<8;i++){h.api.render();assert.equal(h.activeSorts(),initial);}
});
