const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const context={window:{}};
for(const file of ['logic/gacha_engine.js','logic/dashboard_validation.js'])vm.runInNewContext(fs.readFileSync(file,'utf8'),context);
const E=context.window.GachaEngine;
const tiers=[{id:'G',prob:0,isGold:true},{id:'L',prob:100}];
const catalog={char:[{name:'UP',category:'char',tierId:'G',tags:['up']},{name:'Low',category:'char',tierId:'L',tags:['std']}]};
const base={tiers,pities:[{tierId:'G',pulls:10000,enableUp:true,useGuarantee:false,upRate:0}]};
const opts=rules=>({rules,activeTiers:tiers,targetGoldIds:['G'],minorPities:[],selections:{G:{up:['UP'],std:['UP']},L:{std:['Low']}},allCatalogItems:catalog.char,pureCatalog:catalog,globalTiers:tiers,random:()=>.5});
const activation=(counting='reset',catchUp='all')=>({conditions:[{type:'pulls',count:100}],counting,catchUp,match:'all'});
test('解锁后从零计数：100抽解锁，130抽首次触发',async()=>{
 const rules={...base,sparkRules:[{id:'s',limit:30,type:'loop',noReset:true,activation:activation()}]},state=E.createState(),engine=E.create(opts(rules));
 await engine.draw(state,129);assert.equal(state.sparkState[0].triggeredCount,0);
 await engine.draw(state,1);assert.equal(state.sparkState[0].triggeredCount,1);assert.equal(state.events.pendingGifts[0].atTotal,130);
});
for(const [mode,expected] of [['all',3],['one',1],['none',0]])test(`保留进度，${mode}补发在首次解锁结算生效`,async()=>{
 const rules={...base,sparkRules:[{id:'s',limit:30,type:'loop',noReset:true,activation:activation('retain',mode)}]},state=E.createState(),engine=E.create(opts(rules));
 await engine.draw(state,100);assert.equal(state.sparkState[0].triggeredCount,0);
 await engine.draw(state,1);assert.equal(state.sparkState[0].triggeredCount,expected);assert.equal(state.events.pendingGifts.length,expected);
 await engine.draw(state,19);assert.equal(state.sparkState[0].triggeredCount,expected+1);
});
test('补发全部受8次上限约束，超过上限永久停止',async()=>{
 const rules={...base,sparkRules:[{id:'s',limit:10,type:'loop',noReset:true,maxTriggers:8,activation:activation('retain')}]},state=E.createState(),engine=E.create(opts(rules));
 await engine.draw(state,101);assert.equal(state.sparkState[0].triggeredCount,8);assert.equal(state.events.pendingGifts.length,8);
 await engine.draw(state,100);assert.equal(state.events.pendingGifts.length,8);
});
test('赠送抽循环上限；已赠送的抽数仍能执行',async()=>{
 const rules={...base,giftRules:[{id:'g',trigger:2,amount:1,type:'loop',maxTriggers:8}]},state=E.createState();
 const results=await E.create(opts(rules)).draw(state,100);
 assert.equal(state.giftState[0].triggeredCount,8);assert.equal(results.filter(r=>r.pullType==='free_nopity').length,8);
});
test('依赖成功触发2次，下一抽解锁；排序不改变规则引用',async()=>{
 for(const reverse of [false,true]){
  const source={id:'source',limit:2,type:'loop',noReset:true},target={id:'target',limit:2,type:'once',noReset:true,activation:{counting:'reset',conditions:[{type:'rule',ruleId:'source',count:2}]}};
  const rules={...base,sparkRules:reverse?[target,source]:[source,target]},state=E.createState(),engine=E.create(opts(rules));
  await engine.draw(state,5);const i=reverse?0:1;assert.equal(state.sparkState[i].triggeredCount,0);
  await engine.draw(state,1);assert.equal(state.sparkState[i].triggeredCount,1);
 }
});
test('前置早金序列以解锁后的自然出金计序，替换井不消耗',async()=>{
 const goldTiers=[{id:'G',prob:100,isGold:true}],rules={...base,tiers:goldTiers,earlyUpRules:[{id:'e',order:1,upRate:100,activation:{counting:'reset',conditions:[{type:'pulls',count:2}]}}]};
 const state=E.createState(),engine=E.create({...opts(rules),activeTiers:goldTiers});
 const results=await engine.draw(state,4);
 assert.equal(results[0].usedEarlyPrivilege,false);assert.equal(results[1].usedEarlyPrivilege,false);assert.equal(results[2].usedEarlyRuleId,'e');assert.equal(results[3].usedEarlyPrivilege,false);
 assert.equal(state.sequenceRuleState.e.triggeredCount,1);
});
test('历史检测与前置井执行保持一致',async()=>{
 const rules={...base,sparkRules:[{id:'s',limit:3,type:'loop',noReset:false,maxTriggers:2,activation:{counting:'reset',conditions:[{type:'pulls',count:2}]}}]},state=E.createState();
 const results=await E.create(opts(rules)).draw(state,14);
 const report=context.window.DashboardValidation.validateHistory(results,{rules,activeTiers:tiers,targetGoldIds:['G'],catalog});
 assert.equal(report.entries.filter(e=>e.errors.length).length,0);assert.equal(report.state.sparkState[0].triggeredCount,2);
});
const sequenceActivation = mode => ({counting:'retain',sequenceCatchUp:mode,conditions:[{type:'pulls',count:4}]});
const goldOptions = rules => ({...opts(rules),activeTiers:[{id:'G',prob:100,isGold:true}]});
for(const kind of ['early','category'])for(const mode of [undefined,'skip','next'])test(`${kind}过期序列${mode||'旧默认'}：第五金补发或跳过，真实序号不变`,async()=>{
 const rule={id:'privilege',order:1,upRate:100,targetCats:['char'],targetTags:['up'],activation:sequenceActivation(mode)};
 const rules={...base,[kind==='early'?'earlyUpRules':'goldCategorySequence']:[rule]},state=E.createState();
 const results=await E.create(goldOptions(rules)).draw(state,6),field=kind==='early'?'usedEarlyRuleId':'usedCategoryRuleId';
 assert.equal(results[4][field],mode==='next'?'privilege':undefined);
 assert.equal(results[5][field],undefined);assert.equal(state.naturalGoldCount,6);assert.equal(state.goldCount,6);
 assert.equal(state.sequenceRuleState.privilege.triggeredCount,mode==='next'?1:0);
 const report=context.window.DashboardValidation.validateHistory(results,{...goldOptions(rules),catalog});
 assert.equal(report.entries.filter(e=>e.errors.length).length,0);
 assert.equal(report.state.sequenceRuleState.privilege.triggeredCount,mode==='next'?1:0);
});
test('同类顺延按原序号逐金执行，存档恢复不重复也不丢失待补福利',async()=>{
 const rules={...base,earlyUpRules:[3,1,2].map(order=>({id:'e'+order,order,upRate:100,activation:sequenceActivation('next')}))};
 let state=E.createState();const engine=E.create(goldOptions(rules));
 let results=await engine.draw(state,5);assert.equal(results[4].usedEarlyRuleId,'e1');
 state=JSON.parse(JSON.stringify(state));results=await engine.draw(state,3);
 assert.deepEqual(Array.from(results,r=>r.usedEarlyRuleId),['e2','e3',undefined]);
 assert.equal(state.naturalGoldCount,8);
});
test('当期同类规则优先，顺延福利等待下一次可用出金',async()=>{
 const rules={...base,goldCategorySequence:[{id:'late',order:1,targetTags:['up'],activation:sequenceActivation('next')},{id:'onTime',order:5,targetTags:['up'],activation:sequenceActivation('skip')}]};
 const results=await E.create(goldOptions(rules)).draw(E.createState(),7);
 assert.equal(results[4].usedCategoryRuleId,'onTime');assert.equal(results[5].usedCategoryRuleId,'late');assert.equal(results[6].usedCategoryRuleId,undefined);
});
test('未过期的第三金仍按原序号生效；从零计数不受顺延设置影响',async()=>{
 for(const counting of ['retain','reset']){
  const rules={...base,earlyUpRules:[{id:'third',order:3,upRate:100,activation:{...sequenceActivation('next'),counting,conditions:[{type:'pulls',count:2}]}}]};
  const results=await E.create(goldOptions(rules)).draw(E.createState(),6);
  assert.equal(results[counting==='retain'?2:4].usedEarlyRuleId,'third');
  assert.equal(results.filter(r=>r.usedEarlyRuleId==='third').length,1);
 }
});
test('替换井和不计保底赠送抽不消耗待补福利，两类福利可在同一自然金使用',async()=>{
 const rules={...base,earlyUpRules:[{id:'early',order:1,upRate:100,activation:sequenceActivation('next')}],goldCategorySequence:[{id:'category',order:1,targetTags:['up'],activation:sequenceActivation('next')}],sparkRules:[{limit:5,type:'once',noReset:false}]};
 const state=E.createState(),engine=E.create(goldOptions(rules));
 await engine.draw(state,5);assert.equal(state.sequenceRuleState.early.triggeredCount,0);assert.equal(state.sequenceRuleState.category.triggeredCount,0);
 state.freeQueue.push({remaining:1,countPity:false});await engine.draw(state,1);
 assert.equal(state.sequenceRuleState.early.triggeredCount,0);
 const [result]=await engine.draw(state,1);assert.equal(result.usedEarlyRuleId,'early');assert.equal(result.usedCategoryRuleId,'category');
 assert.equal(state.sequenceRuleState.early.triggeredCount,1);assert.equal(state.sequenceRuleState.category.triggeredCount,1);
});
