const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const c=vm.createContext({window:{},localStorage:{getItem:()=>null}});
for(const file of ['Preset_Data/db_hsr.js','Preset_Data/db_zzz.js','Preset_Data/db_ark.js','Preset_Data/db_end.js','Preset_Data/db_test.js','logic/catalog_utils.js','logic/game_data.js','logic/gacha_engine.js','logic/simulator_start.js']){
 vm.runInContext(fs.readFileSync(file,'utf8'),c,{filename:file});Object.assign(c,c.window);
}
const E=c.GachaEngine,D=c.GameData,copy=x=>JSON.parse(JSON.stringify(x)),keys=['earlyUpRules','goldCategorySequence','sparkRules','giftRules'];
for(const game of ['hsr','zzz','ark','end','test'])test(`${game} 预设具备固定ID、双语名称及有效生效条件`,()=>{
 const preset=D.getPreset(game,{includeHidden:true});
 for(const [pool,rules] of Object.entries(preset.rules)){
  const all=keys.flatMap(k=>rules[k]||[]),byId=new Map(all.map(r=>[r.id,r]));assert.equal(byId.size,all.length,`${game}/${pool} duplicate IDs`);
  for(const r of all){
   assert.ok(r.id&&r.name&&r.en,`${game}/${pool}: metadata`);
   assert.equal('cancelOnHit' in r||'cancelOnUp' in r,false);
   assert.ok(['none','target','pulls','rule'].includes(r.expiration.type));
   assert.ok(['after_unlock','including_before'].includes(r.expiration.scope));
   assert.ok(['all','any'].includes(r.activation.match));assert.ok(['reset','retain'].includes(r.activation.counting));
   for(const cond of [...r.activation.conditions,...(r.expiration.type==='rule'?[r.expiration]:[])]){
    assert.ok(Number.isSafeInteger(cond.count)&&cond.count>0);
    if(cond.type==='rule'){assert.ok(byId.has(cond.ruleId));assert.notEqual(cond.ruleId,r.id);}
   }
  }
  for(const r of [...rules.sparkRules||[],...rules.giftRules||[]]){
   assert.ok(['once','loop'].includes(r.type));assert.ok(r.maxTriggers===null||Number.isSafeInteger(r.maxTriggers)&&r.maxTriggers>0);
  }
  const visit=(r,path=new Set())=>{assert.equal(path.has(r.id),false,`${pool}: cyclic prerequisite`);const next=new Set([...path,r.id]);for(const cond of r.activation.conditions)if(cond.type==='rule')visit(byId.get(cond.ruleId),next);};
  all.forEach(r=>visit(r));
 }
});

// Compare the migrated schemas with their legacy equivalents using identical RNG.
for(const game of ['hsr','zzz','ark'])test(`${game} 元数据迁移保留原有抽卡和赠礼结果`,async()=>{
 const preset=D.getPreset(game),catalog=D.loadCatalog(game),all=D.flattenCatalog(catalog),global=D.loadGlobalTiers(game);
 for(const rules of Object.values(preset.rules)){
  if(!keys.some(k=>rules[k]?.length))continue;
  const legacy=copy(rules);
  for(const k of keys)for(const r of legacy[k]||[]){if(r.expiration.type==='target')r.cancelOnHit=true;for(const key of ['id','name','en','activation','expiration','maxTriggers'])delete r[key];}
  async function run(config){
   const active=(config.tiers||[]).map(t=>({...global.find(g=>g.id===t.id),...t})),goldIds=active.filter(t=>t.isGold).map(t=>t.id);if(!goldIds.length)goldIds.push(global[0].id);
   const selections={};for(const t of active){
    const list=all.filter(i=>i.tierId===t.id),a=config.assembly?.tierRules?.[t.id]||{};
    const matches=(i,cats,tags)=>(!cats?.length||cats.includes(i.category))&&(!tags?.length||tags.some(tag=>i.tags.includes(tag)));
    const up=a.mode==='flat'?[]:list.filter(i=>matches(i,a.upCats,a.upTags)),limits=config.preSelect?.tiers?.[t.id]||{};
    const selected=up.slice(0,limits.upMax??1),chosen=new Set(selected.map(i=>i.name));
    selections[t.id]={up:selected.map(i=>i.name),std:list.filter(i=>!chosen.has(i.name)&&matches(i,a.mode==='flat'?a.flatCats:a.offrateCats,a.mode==='flat'?a.tags:a.offrateTags)).map(i=>i.name),spec:list.filter(i=>i.tags.includes('spec')).map(i=>i.name)};
   }
   let seed=235;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
   const minor=config.pities?.filter(p=>!p.isGold&&p.tierId!==goldIds[0])||config.minorPities||[],state=E.createState(minor.length);
   const engine=E.create({rules:config,activeTiers:active,globalTiers:global,targetGoldIds:goldIds,minorPities:minor,selections,pureCatalog:catalog,allCatalogItems:all,random,selectSpark:async list=>list[0]?.name});
   const rows=await engine.draw(state,650),pick=r=>Object.fromEntries(['name','tierId','isGold','isUP','isSpark','pullType','total'].filter(k=>r[k]!==undefined).map(k=>[k,r[k]]));
   return copy({rows:rows.map(pick),gifts:state.events.pendingGifts.map(pick)});
  }
  assert.deepEqual(await run(rules),await run(legacy),rules.info.name);
 }
});

test('迁移后的首次保证可在起点表单标记失效，不虚增成功触发次数',()=>{
 const rules=D.getPresetRules('ark').collab,context={rules,targetGoldIds:['tier_6'],minorPities:[],globalTiers:D.loadGlobalTiers('ark')},state=E.createState();
 const fields=c.SimulatorStart.fields(context,state),values=Object.fromEntries(fields.map(f=>[f.key,f.value]));assert.match(fields.find(f=>f.key==='cancel:0').zh,/已失效/);
 Object.assign(values,{total:150,'spark:0':150,'cancel:0':true});const restored=c.SimulatorStart.build(context,values);
 assert.equal(restored.sparkState[0].expired,true);assert.equal(restored.sparkState[0].triggeredCount,0);assert.equal(c.SimulatorStart.valid(restored),true);
});

test('单UP历史缺少选择列表仍识别目标；多UP池不能把任意UP当成指定序号',()=>{
 const rule={targetType:'up_index',upIndex:1},result={name:'UP',isGold:true,isUP:true,pullType:'paid'};
 assert.equal(E.targetMatches(rule,'spark',result,{targetGoldIds:['G'],rules:{preSelect:{tiers:{G:{upMax:1}}}}}),true);
 assert.equal(E.targetMatches(rule,'spark',result,{targetGoldIds:['G'],rules:{preSelect:{tiers:{G:{upMax:2}}}}}),false);
});
