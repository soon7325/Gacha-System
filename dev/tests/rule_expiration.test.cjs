const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const c=vm.createContext({window:{}});
for(const file of ['logic/gacha_engine.js','logic/dashboard_validation.js','logic/simulator_start.js']){vm.runInContext(fs.readFileSync(file,'utf8'),c);Object.assign(c,c.window);}
const E=c.GachaEngine,copy=x=>JSON.parse(JSON.stringify(x));
const catalog={char:[{id:'u',name:'UP',tierId:'G',category:'char',tags:['up']},{id:'s',name:'Standard',tierId:'G',category:'char',tags:['std']}]};
const base=()=>({tiers:[{id:'G',prob:100,isGold:true}],pities:[{tierId:'G',pulls:1000,enableUp:true,useGuarantee:false,upRate:.5}]});
const spark=(id,extra={})=>({id,limit:2,type:'loop',targetType:'random_up',noReset:true,...extra});
function harness(rules){let up=false;const options={rules,activeTiers:rules.tiers,targetGoldIds:['G'],globalTiers:rules.tiers,minorPities:[],selections:{G:{up:['UP'],std:['Standard']}},pureCatalog:catalog,allCatalogItems:copy(catalog.char),random:()=>up?0:.99};return {...options,state:E.createState(),engine:E.create(options),setUp:value=>{up=value;}};}
function replay(h,history){const r=c.DashboardValidation.validateHistory(history,{...h,catalog});assert.deepEqual(copy(r.entries.filter(e=>e.errors.length).map(e=>e.errors)),[]);return r.state;}
test('获得目标后停止：当抽自然UP阻止井触发，默认不失效的循环不受影响',async()=>{
 const h=harness({...base(),sparkRules:[spark('stop',{expiration:{type:'target',scope:'after_unlock'}}),spark('keep')]});
 h.setUp(true);const rows=await h.engine.draw(h.state,8);
 assert.equal(h.state.sparkState[0].expired,true);assert.equal(h.state.sparkState[0].triggeredCount,0);assert.equal(h.state.sparkState[1].triggeredCount,4);
 assert.equal(replay(h,rows).sparkState[0].expired,true);
});
for(const scope of ['after_unlock','including_before'])test(`解锁前已有目标：${scope}，不补发不能代替失效`,async()=>{
 const h=harness({...base(),sparkRules:[spark('s',{expiration:{type:'target',scope},activation:{counting:'reset',catchUp:'none',conditions:[{type:'pulls',count:4}]}})]});
 h.setUp(true);const rows=await h.engine.draw(h.state,1);h.setUp(false);rows.push(...await h.engine.draw(h.state,7));
 assert.equal(h.state.sparkState[0].triggeredCount,scope==='including_before'?0:2);assert.equal(!!h.state.sparkState[0].expired,scope==='including_before');
 const restored=replay(h,rows);assert.equal(restored.sparkState[0].triggeredCount,h.state.sparkState[0].triggeredCount);
});
test('补发全部也不能恢复已失效的井',async()=>{
 const h=harness({...base(),sparkRules:[spark('s',{expiration:{type:'target',scope:'including_before'},activation:{counting:'retain',catchUp:'all',conditions:[{type:'pulls',count:6}]}})]});
 h.setUp(true);await h.engine.draw(h.state,1);h.setUp(false);await h.engine.draw(h.state,10);
 assert.equal(h.state.sparkState[0].triggeredCount,0);assert.equal(h.state.events.pendingGifts.length,0);
});
test('定制目标按真实分类标签匹配，不把任意UP误认为已获得指定常驻',async()=>{
 const h=harness({...base(),sparkRules:[spark('s',{targetType:'custom_filter',targetTier:'G',targetCats:['char'],targetTags:['std'],expiration:{type:'target',scope:'after_unlock'}})]});
 h.setUp(true);await h.engine.draw(h.state,2);assert.equal(h.state.sparkState[0].triggeredCount,1);assert.equal(!!h.state.sparkState[0].expired,false);
 h.setUp(false);await h.engine.draw(h.state,1);assert.equal(h.state.sparkState[0].expired,true);assert.equal(h.state.sparkState[0].triggeredCount,1);
});
test('指定UP序号按具体物品匹配',async()=>{
 const rules={...base(),sparkRules:[spark('s',{targetType:'up_index',upIndex:2,expiration:{type:'target',scope:'after_unlock'}})]};
 const h=harness(rules);h.selections.G.up=['UP','Other UP'];h.allCatalogItems.push({id:'u2',name:'Other UP',tierId:'G',category:'char',tags:['up']});
 assert.equal(E.targetMatches(rules.sparkRules[0],'spark',{tierId:'G',isGold:true,isUP:true,name:'UP',pullType:'paid'},h),false);
 assert.equal(E.targetMatches(rules.sparkRules[0],'spark',{tierId:'G',isGold:true,isUP:true,name:'Other UP',pullType:'paid'},h),true);
});
for(const kind of ['spark','gift','early','category'])test(`${kind} 完成指定抽数后停止；包含该抽，下一抽失效`,async()=>{
 const key={spark:'sparkRules',gift:'giftRules',early:'earlyUpRules',category:'goldCategorySequence'}[kind],rule={...spark('s'),order:3,upRate:100,targetTags:['up'],trigger:1,amount:1,type:'loop',expiration:{type:'pulls',scope:'after_unlock',count:2}};
 const h=harness({...base(),[key]:[rule]});const rows=await h.engine.draw(h.state,10);
 const p=['spark','gift'].includes(kind)?h.state[kind+'State'][0]:h.state.sequenceRuleState.s;
 assert.equal(p.expired,true);if(['early','category'].includes(kind))assert.equal(p.triggeredCount,0);
 const restored=replay(h,rows);const q=['spark','gift'].includes(kind)?restored[kind+'State'][0]:restored.sequenceRuleState.s;assert.equal(q.expired,true);
});
test('来源规则触发后停止：不在同一抽发生顺序依赖，下一抽停止',async()=>{
 const h=harness({...base(),sparkRules:[spark('source',{type:'once'}),spark('s',{limit:1,expiration:{type:'rule',ruleId:'source',scope:'after_unlock',count:1}})]});
 const rows=await h.engine.draw(h.state,8);assert.equal(h.state.sparkState[1].triggeredCount,2);assert.equal(h.state.sparkState[1].expired,true);
 assert.equal(replay(h,rows).sparkState[1].triggeredCount,2);
});
test('不计本池规则的免费出金和井兑换不计入目标失效历史；恢复后不重复补发',async()=>{
 const h=harness({...base(),sparkRules:[spark('s',{expiration:{type:'target',scope:'including_before'}})]});
 h.state.freeQueue=[{remaining:1,countPity:false}];h.setUp(true);await h.engine.draw(h.state,1);assert.equal(h.state.sparkState[0].targetHits||0,0);
 h.setUp(false);await h.engine.draw(h.state,1);const saved=copy(h.state);assert.equal(c.SimulatorStart.valid(saved),true);
 await h.engine.draw(saved,5);assert.equal(saved.sparkState[0].triggeredCount,3);assert.equal(saved.sparkState[0].targetHits||0,0);
});
test('计保底赠送抽获得目标会使新失效条件生效',async()=>{
 const h=harness({...base(),sparkRules:[spark('s',{expiration:{type:'target',scope:'after_unlock'}})]});
 h.state.freeQueue=[{remaining:1,countPity:true}];h.setUp(true);
 const rows=await h.engine.draw(h.state,1);assert.equal(h.state.sparkState[0].expired,true);assert.equal(h.state.sparkState[0].triggeredCount,0);
 const restored=replay(h,rows);assert.equal(restored.sparkState[0].expired,true);
});
