const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const c=vm.createContext({window:{},localStorage:{getItem:key=>key==='GM_Show_Test_Catalog'?'true':null}});
for(const file of ['Preset_Data/db_zzz.js','Preset_Data/db_test.js','logic/catalog_utils.js','logic/game_data.js','logic/gacha_engine.js','logic/dashboard_validation.js','logic/simulator_start.js','logic/simulator_session.js']){vm.runInContext(fs.readFileSync(file,'utf8'),c,{filename:file});Object.assign(c,c.window);}
const E=c.GachaEngine,copy=x=>JSON.parse(JSON.stringify(x));
const lists={early:'earlyUpRules',category:'goldCategorySequence',spark:'sparkRules',gift:'giftRules'};
const catalog={char:[{id:'u',name:'UP',category:'char',tierId:'G',tags:['up']},{id:'s',name:'Standard',category:'char',tierId:'G',tags:['std']},{id:'l',name:'Low',category:'char',tierId:'L',tags:['std']}]};
const tiers=gold=>[{id:'G',prob:gold,isGold:true},{id:'L',prob:100-gold}];
const base=()=>({tiers:tiers(100),pities:[{tierId:'G',pulls:10000,enableUp:true,useGuarantee:false,upRate:50}]});
const make=(kind,id,activation)=>({id,name:'同名规则',en:'Same name',order:1,upRate:100,targetCats:['char'],targetTags:['up'],limit:2,trigger:2,type:'once',amount:1,countPity:true,noReset:true,...(activation?{activation}:{} )});
function opts(rules,random=()=>.5){return{rules,activeTiers:rules.tiers,targetGoldIds:['G'],minorPities:[],selections:{G:{up:['UP'],std:['Standard']},L:{std:['Low']}},allCatalogItems:catalog.char,pureCatalog:catalog,globalTiers:rules.tiers,random};}
const count=(s,kind,index=0,id='target')=>['spark','gift'].includes(kind)?s[kind+'State'][index]?.triggeredCount||0:s.sequenceRuleState?.[id]?.triggeredCount||0;
function replay(rules,history){const report=c.DashboardValidation.validateHistory(history,{...opts(rules),catalog});assert.deepEqual(copy(report.entries.filter(e=>e.errors.length).map(e=>({index:e.index,errors:e.errors}))),[]);return report.state;}

for(const source of Object.keys(lists))for(const target of Object.keys(lists))test(`前置矩阵 ${source} → ${target}，重名不混淆，历史检测一致`,async()=>{
 const rules=base(),a=make(source,'source'),b=make(target,'target',{counting:'reset',match:'all',conditions:[{type:'rule',ruleId:'source',count:1}]});
 rules[lists[source]]=[a];(rules[lists[target]]||=[]).push(b);
 const state=E.createState(),engine=E.create(opts(rules)),history=await engine.draw(state,24),index=source===target?1:0;
 assert.equal(count(state,target,index),1);assert.equal(count(state,source,0,'source'),1);
 const rebuilt=replay(rules,history);assert.equal(count(rebuilt,target,index),1);
});
for(const match of ['all','any'])test(`组合前置 ${match} 的边界抽数`,async()=>{
 const rules={...base(),tiers:tiers(0),sparkRules:[{...make('spark','source'),type:'loop',limit:3,maxTriggers:2},{...make('spark','target'),activation:{match,counting:'reset',conditions:[{type:'pulls',count:4},{type:'rule',ruleId:'source',count:2}]}}]};
 const state=E.createState(),engine=E.create(opts(rules)),at=match==='all'?8:6;
 await engine.draw(state,at-1);assert.equal(count(state,'spark',1),0);await engine.draw(state,1);assert.equal(count(state,'spark',1),1);
});
for(const kind of ['spark','gift'])for(const type of ['once','loop'])for(const catchUp of ['all','one','none'])test(`${kind}/${type}/${catchUp} 补发、成功次数与上限`,async()=>{
 const rule={...make(kind,'target'),type,maxTriggers:2,activation:{counting:'retain',catchUp,conditions:[{type:'pulls',count:10}]}};
 const rules={...base(),tiers:tiers(0),[lists[kind]]:[rule]},state=E.createState(),engine=E.create(opts(rules));
 await engine.draw(state,10);assert.equal(count(state,kind),0);await engine.draw(state,1);
 const expected=catchUp==='none'?0:catchUp==='one'||type==='once'?1:2;assert.equal(count(state,kind),expected);
 await engine.draw(state,30);assert.equal(count(state,kind),type==='once'?expected:2);
});
for(const kind of Object.keys(lists))test(`${kind} 关闭规则不触发，也不能解锁后继`,async()=>{
 const source={...make(kind,'source'),enabled:false},rules={...base(),[lists[kind]]:[source]};
 (rules.sparkRules||=[]).push({...make('spark','target'),activation:{counting:'reset',conditions:[{type:'rule',ruleId:'source',count:1}]}});
 const state=E.createState();await E.create(opts(rules)).draw(state,30);
 assert.equal(count(state,kind,0,'source'),0);assert.equal(count(state,'spark',kind==='spark'?1:0),0);
});
test('关闭井不歪取消项、提前命中取消、已取消规则不能解锁后继',async()=>{
 const rules={...base(),sparkRules:[{...make('spark','source'),limit:4,cancelOnHit:true},{...make('spark','target'),activation:{counting:'reset',conditions:[{type:'rule',ruleId:'source',count:1}]}}]};
 const state=E.createState();await E.create(opts(rules,()=>0)).draw(state,12);
 assert.equal(state.sparkState[0].cancelled,true);assert.equal(count(state,'spark',0,'source'),0);assert.equal(count(state,'spark',1),0);
});
test('排序发生在已有进度之后，井与赠送抽仍按ID归属进度',async()=>{
 for(const kind of ['spark','gift']){
  const rules={...base(),tiers:tiers(0),[lists[kind]]:[{...make(kind,'short'),limit:3,trigger:3,type:'loop',maxTriggers:2},{...make(kind,'long'),limit:20,trigger:20,type:'loop',maxTriggers:2}]};
  const state=E.createState();await E.create(opts(rules)).draw(state,4);assert.equal(count(state,kind,0),1);
  rules[lists[kind]].reverse();E.prepareRules(rules,state);
  assert.equal(count(state,kind,0),0);assert.equal(count(state,kind,1),1);
 }
});
test('稀疏的前N金序列，第3金无需配置第1/2金也能触发',async()=>{
 const rules={...base(),earlyUpRules:[{...make('early','third'),order:3}]},state=E.createState();
 const results=await E.create(opts(rules)).draw(state,5);
 assert.equal(results[2].usedEarlyRuleId,'third');assert.equal(results.filter(r=>r.usedEarlyRuleId==='third').length,1);
});
test('补发过程中保存恢复，与不间断抽卡完全一致',async()=>{
 const rules={...base(),giftRules:[{...make('gift','g'),type:'loop',maxTriggers:8,activation:{counting:'retain',catchUp:'all',conditions:[{type:'pulls',count:10}]}}]};
 const a=E.createState(),b=E.createState(),engine=E.create(opts(rules));
 await engine.draw(a,40);await engine.draw(b,11);const restored=copy(b);assert.equal(c.SimulatorStart.valid(restored),true);await engine.draw(restored,29);
 assert.deepEqual(copy(restored),copy(a));
});
test('非空起点：累计抽数不应被解锁后的进度误当作解锁前的抽数',async()=>{
 const rules={...base(),tiers:tiers(0),sparkRules:[{...make('spark','target'),activation:{counting:'reset',conditions:[{type:'pulls',count:10}]}}]};
 const state=E.createState();state.total=10;state.sparkState[0]={basePull:8,periodStart:0,triggeredCount:0};
 await E.create(opts(rules)).draw(state,2);assert.equal(count(state,'spark'),1);
});
function rotate(rules,state){
 const source=fs.readFileSync('pages/simulator.js','utf8'),start=source.indexOf('    // 1. 根据规则重置状态机'),end=source.indexOf('    // 2. 自动把顶部 UP',start);
 assert.ok(start>0&&end>start);
 const context=vm.createContext({rules,simData:state,matrix:rules.lifecycle.rotationMatrix,GachaEngine:E,simulatorWallet:{enabled:()=>false}});
 vm.runInContext('(function(){'+source.slice(start,end)+'})()',context);
}
for(const reset of [true,false])test(`实际模拟器换期：${reset?'重置':'继承'}前置解锁、次数上限、序列及赠送进度`,async()=>{
 const rules={...base(),lifecycle:{rotationMatrix:{inheritPityPulls:true,inheritGuaranteeState:true,inheritRescueLosses:true,resetEarlyUp:reset,resetCatSeq:reset,resetSparkPity:reset,resetGiftRules:reset}},sparkRules:[{...make('spark','source'),limit:3,type:'loop',maxTriggers:2}],earlyUpRules:[{...make('early','early'),activation:{counting:'reset',conditions:[{type:'rule',ruleId:'source',count:1}]}}],giftRules:[{...make('gift','gift'),type:'loop',trigger:4,maxTriggers:2,countPity:false}]};
 const state=E.createState(),engine=E.create(opts(rules)),before=await engine.draw(state,8);
 assert.equal(count(state,'spark',0,'source'),2);assert.equal(count(state,'early',0,'early'),1);
 rotate(rules,state);const after=await engine.draw(state,12);
 assert.equal(count(state,'spark',0,'source'),2);assert.equal(count(state,'early',0,'early'),1);
 assert.equal(after.filter(r=>r.usedEarlyRuleId==='early').length,reset?1:0);
 const report=c.DashboardValidation.validateHistory([...before,{isRuleNode:true,config:{}},...after],{...opts(rules),catalog,allowRotation:true});
 assert.deepEqual(copy(report.entries.filter(e=>e.errors.length).map(e=>({index:e.index,errors:e.errors}))),[]);
 assert.equal(count(report.state,'early',0,'early'),1);assert.equal(count(report.state,'gift'),count(state,'gift'));
});
test('真正的起点表单恢复：前置累计抽数、已达里程碑次数及上限不重复补发',async()=>{
 const rules={...base(),tiers:tiers(0),sparkRules:[{...make('spark','target'),maxTriggers:2,type:'loop',activation:{counting:'retain',catchUp:'all',conditions:[{type:'pulls',count:10}]}}]};
 const context={...opts(rules),strictRules:true},initial=E.createState(),values={};
 for(const field of c.SimulatorStart.fields(context,initial))values[field.key]=field.checkbox?false:field.value;
 values.total=20;values.pity=0;values['spark:0']=20;
 const state=c.SimulatorStart.build(context,values);assert.equal(count(state,'spark'),2);
 await E.create(opts(rules)).draw(state,10);assert.equal(count(state,'spark'),2);assert.equal(state.events.pendingGifts.length,0);
});
test('删除旧规则并添加新规则，不继承被删除规则的进度',async()=>{
 const rules={...base(),tiers:tiers(0),sparkRules:[{...make('spark','old'),type:'loop'}]},state=E.createState();
 await E.create(opts(rules)).draw(state,3);assert.equal(count(state,'spark'),1);
 rules.sparkRules=[{...make('spark','new'),type:'loop',limit:10}];E.prepareRules(rules,state);
 assert.equal(state.sparkState[0].ruleId,'new');assert.equal(count(state,'spark'),0);
});
test('玩家数据表单不改规则进度而再次保存，不清除前置成功次数与已解锁状态',async()=>{
 const rules={...base(),earlyUpRules:[{...make('early','source')}],giftRules:[{...make('gift','gift'),type:'loop',maxTriggers:2,activation:{counting:'reset',conditions:[{type:'rule',ruleId:'source',count:1}]}}]};
 const state=E.createState(),engine=E.create(opts(rules));await engine.draw(state,12);
 state.freeQueue=[{countPity:false,remaining:1},{countPity:true,remaining:2}];
 const context={...opts(rules),strictRules:true},values={};
 for(const f of c.SimulatorStart.fields(context,state))values[f.key]=f.value;
 const restored=c.SimulatorStart.build(context,values,state);
 assert.deepEqual(copy(restored.sequenceRuleState),copy(state.sequenceRuleState));assert.deepEqual(copy(restored.giftState),copy(state.giftState));assert.equal(restored.naturalGoldCount,state.naturalGoldCount);
 assert.deepEqual(copy(restored.freeQueue),copy(state.freeQueue));
 const continued=copy(state);await engine.draw(continued,10);await engine.draw(restored,10);
 assert.equal(count(restored,'gift'),count(continued,'gift'));assert.equal(restored.freeQueue.length,continued.freeQueue.length);
});
test('损坏的前置进度存档被拒绝；旧版无扩展字段的存档仍可读取',()=>{
 const legacy=E.createState();assert.equal(c.SimulatorStart.valid(legacy),true);
 for(const patch of [
  {sequenceRuleState:{x:{triggeredCount:-1}}},
  {sequenceRuleState:{x:{triggeredCount:0,activation:{active:true,unlockedAt:0,goldProgress:-1}}}},
  {sparkState:{0:{basePull:0,triggeredCount:0,settledCount:-1}}},
  {giftState:{0:{basePull:0,triggeredCount:0,activation:{active:true,unlockedAt:10,goldProgress:0}}}}
 ])assert.equal(c.SimulatorStart.valid({...copy(legacy),...patch}),false);
});
for(let seed=1;seed<=16;seed++)test(`混合规则固定种子 ${seed}：拆批、序列联动、补发上限与历史重放`,async()=>{
 const rules={...base(),tiers:tiers(25),pities:[{tierId:'G',pulls:5,enableUp:true,useGuarantee:false,upRate:.5}],sparkRules:[{...make('spark','source'),limit:3,type:'loop',maxTriggers:2},{...make('spark','replacement'),noReset:false,type:'loop',maxTriggers:2,activation:{counting:'reset',conditions:[{type:'rule',ruleId:'category',count:1}]}}],giftRules:[{...make('gift','gift'),countPity:seed%2===0,type:'loop',maxTriggers:3,activation:{match:'any',counting:'retain',catchUp:['all','one','none'][seed%3],conditions:[{type:'pulls',count:5},{type:'rule',ruleId:'source',count:1}]}}],earlyUpRules:[{...make('early','early'),activation:{counting:'retain',sequenceCatchUp:'next',conditions:[{type:'rule',ruleId:'gift',count:1}]}}],goldCategorySequence:[{...make('category','category'),order:2,activation:{counting:'reset',conditions:[{type:'rule',ruleId:'early',count:1}]}}]};
 function rng(){let n=seed;return()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296;};}
 const state=E.createState(),split=E.createState(),whole=E.create(opts(rules,rng())),chunks=E.create(opts(rules,rng()));
 const results=await whole.draw(state,240),parts=[];
 for(let remaining=240;remaining>0;){const n=Math.min(remaining,7);parts.push(...await chunks.draw(split,n));remaining-=n;}
 assert.deepEqual(copy(parts),copy(results));assert.deepEqual(copy(split),copy(state));
 assert.ok(count(state,'spark',0,'source')<=2);assert.ok(count(state,'spark',1,'replacement')<=2);assert.ok(count(state,'gift')<=3);
 const rebuilt=replay(rules,results);
 assert.equal(count(rebuilt,'gift'),count(state,'gift'));assert.equal(count(rebuilt,'early',0,'early'),count(state,'early',0,'early'));
 assert.equal(count(rebuilt,'category',0,'category'),count(state,'category',0,'category'));
});
test('每个测试数据库卡池：固定种子抽取与历史重放一致',async()=>{
 const data=c.GameData,preset=data.getPreset('test'),all=data.flattenCatalog(data.loadCatalog('test')),global=data.loadGlobalTiers('test');
 for(const [id,rules] of Object.entries(preset.rules)){
  const active=rules.tiers.map(t=>({...global.find(g=>g.id===t.id),...t})),gold=active.filter(t=>t.isGold).map(t=>t.id),selections={};
  for(const tier of active){const items=all.filter(i=>i.tierId===tier.id);selections[tier.id]={up:items.filter(i=>i.tags.some(t=>['up','reup','collab'].includes(t))).map(i=>i.name),std:items.filter(i=>!i.tags.some(t=>['up','reup','collab'].includes(t))).map(i=>i.name),spec:[]};}
  let seed=1729;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const options={rules,activeTiers:active,targetGoldIds:gold,minorPities:(rules.pities||[]).filter(p=>!gold.includes(p.tierId)),selections,allCatalogItems:all,pureCatalog:data.loadCatalog('test'),globalTiers:global,random,selectSpark:async items=>items[0].name};
  const state=E.createState(options.minorPities.length),history=await E.create(options).draw(state,300);
  const report=c.DashboardValidation.validateHistory(history,{...options,catalog:data.loadCatalog('test'),isStdPool:id.includes('std')});
  assert.deepEqual(copy(report.entries.filter(e=>e.errors.length).map(e=>({index:e.index,errors:e.errors}))),[],id);
 }
});
