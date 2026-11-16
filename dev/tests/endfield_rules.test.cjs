const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const c=vm.createContext({window:{},localStorage:{getItem:()=>null}});
for(const file of ['Preset_Data/db_end.js','logic/catalog_utils.js','logic/game_data.js','logic/gacha_engine.js','logic/dashboard_validation.js','logic/simulator_start.js']){vm.runInContext(fs.readFileSync(file,'utf8'),c);Object.assign(c,c.window);}
const E=c.GachaEngine,D=c.GameData,copy=x=>JSON.parse(JSON.stringify(x));
test('正式终末地预设首次读取即覆盖旧规则缓存；个人克隆池仍使用个人配置',()=>{
 const before=c.localStorage.getItem;c.localStorage.getItem=key=>key==='GM_Rules_end_wep_up'||key==='GM_Rules_custom_wep_up'?JSON.stringify({pities:[{tierId:'tier_6',pulls:99}]}):null;
 try{assert.equal(D.loadPoolRules('end','wep_up').pities[0].pulls,40);assert.equal(D.loadPoolRules('custom','wep_up').pities[0].pulls,99);}finally{c.localStorage.getItem=before;}
});
function setup(pool,random=()=>.999999){
 const rules=D.getPresetRules('end')[pool],globalTiers=D.loadGlobalTiers('end'),pureCatalog=D.loadCatalog('end'),allCatalogItems=D.flattenCatalog(pureCatalog),activeTiers=rules.tiers.map(t=>({...globalTiers.find(g=>g.id===t.id),...t})),targetGoldIds=['tier_6'],selections={};
 for(const t of activeTiers){const items=allCatalogItems.filter(i=>i.tierId===t.id&&i.category===(pool==='wep_up'?'wep':'char'));selections[t.id]={up:items.filter(i=>i.tags.includes('up')).slice(0,1).map(i=>i.name),std:items.filter(i=>!i.tags.includes('up')).map(i=>i.name),spec:[]};}
 const options={rules,globalTiers,pureCatalog,allCatalogItems,activeTiers,targetGoldIds,selections,minorPities:rules.pities.filter(p=>p.tierId!=='tier_6'),random,selectSpark:async list=>list[0].name};
 return{...options,state:E.createState(options.minorPities.length),engine:E.create(options)};
}
function checkReplay(h,history,extra={}){const r=c.DashboardValidation.validateHistory(history,{...h,catalog:h.pureCatalog,isStdPool:h.rules.info.name==='基础寻访',...extra});assert.deepEqual(copy(r.entries.filter(e=>e.errors.length).map(e=>({index:e.index,errors:e.errors}))),[]);return r.state;}
test('武库：4%六星、25%UP，40抽循环保底；40不是一次性井',()=>{
 const h=setup('wep_up'),gold=h.rules.pities.find(p=>p.tierId==='tier_6');
 assert.equal(gold.pulls,40);assert.equal(gold.upRate,.25);assert.equal(h.rules.tiers.find(t=>t.id==='tier_6').prob,4);
 assert.equal(h.rules.tiers.find(t=>t.id==='tier_4').prob,81);assert.equal(h.rules.tiers.some(t=>t.id==='tier_3'),false);assert.equal(h.rules.sparkRules.some(r=>r.limit===40),false);
});
test('武库：80抽仅一次UP保证；后续40抽小保底仍持续生效',async()=>{
 const h=setup('wep_up'),history=await h.engine.draw(h.state,160);
 assert.equal(history[39].isGold,true);assert.equal(history[39].isUP,false);
 assert.equal(history[79].isSpark,true);assert.equal(history[79].isUP,true);
 assert.equal(history[119].isGold,true);assert.equal(history[119].isUP,false);
 assert.equal(history[159].isGold,true);assert.equal(history[159].isUP,false);
 assert.equal(h.state.sparkState[0].triggeredCount,1);checkReplay(h,history);
});
for(const earlyUP of [false,true])test(`武库奖励100/180/260/340/420/500，${earlyUP?'提前UP取消80保证':'80抽才保底UP'}均不阻断循环`,async()=>{
 const h=setup('wep_up',()=>earlyUP?0:.999999),history=await h.engine.draw(h.state,500);
 assert.deepEqual(Array.from(h.state.events.pendingGifts,g=>g.atTotal),[100,180,260,340,420,500]);
 const lookup=n=>h.allCatalogItems.find(i=>i.name===n);
 for(const g of h.state.events.pendingGifts){const item=lookup(g.name);assert.ok(item);assert.equal(item.category,'wep');assert.equal(item.tags.includes('up'),[180,340,500].includes(g.atTotal));}
 assert.equal(h.state.sparkState[0].triggeredCount,earlyUP?0:1);checkReplay(h,history);
});
test('角色：30抽免费十连不推进保底或里程碑，但免费十连自身至少五星',async()=>{
 const h=setup('char_up');await h.engine.draw(h.state,30);const pity=h.state.pity,minor=copy(h.state.minorPityCounters);
 const free=await h.engine.draw(h.state,10);assert.ok(free.every(r=>r.pullType==='free_nopity'));
 assert.ok(free.some(r=>['tier_5','tier_6'].includes(r.tierId)));assert.equal(h.state.pity,pity);assert.deepEqual(copy(h.state.minorPityCounters),minor);
 assert.equal(E.getRuleTotal(h.rules,h.state),30);assert.equal(h.state.total,40);
});
test('角色：120保证在实际第120次有效寻访触发，不在含免费抽的第120抽触发',async()=>{
 const h=setup('char_up'),first=await h.engine.draw(h.state,129);assert.equal(h.state.sparkState[0].triggeredCount,0);
 const last=await h.engine.draw(h.state,1);assert.equal(last[0].isSpark,true);assert.equal(last[0].total,130);assert.equal(h.state.sparkState[0].triggeredCount,1);
 assert.equal(h.state.nextPeriodFreeQueue[0].remaining,10);checkReplay(h,[...first,...last]);
});
test('角色：每240有效抽给UP信物，不受120保证取消影响，不计作额外出金',async()=>{
 const h=setup('char_up'),history=await h.engine.draw(h.state,490);
 assert.deepEqual(Array.from(h.state.events.pendingGifts,g=>g.atTotal),[250,490]);assert.ok(h.state.events.pendingGifts.every(g=>g.isToken));
 assert.equal(h.state.goldCount,history.filter(r=>r.isGold).length);checkReplay(h,history);
});
test('角色与常驻：第66抽六星5.8%，第80抽硬保底；常驻300抽自选一次且候选真实有效',async()=>{
 for(const pool of ['char_up','char_std']){
  const h=setup(pool);h.state.pity=65;assert.ok(Math.abs(E.calculateProbabilities(h.rules,h.state,h.activeTiers,h.targetGoldIds).probabilities.tier_6-5.8)<1e-9);
  h.state.pity=79;assert.equal(E.calculateProbabilities(h.rules,h.state,h.activeTiers,h.targetGoldIds).probabilities.tier_6,100);
 }
 const h=setup('char_std'),history=await h.engine.draw(h.state,600);assert.equal(h.state.events.pendingGifts.length,1);assert.equal(h.state.events.pendingGifts[0].atTotal,300);
 const gift=h.allCatalogItems.find(i=>i.name===h.state.events.pendingGifts[0].name);assert.equal(gift.category,'char');assert.ok(gift.tags.includes('std'));
 assert.deepEqual(Array.from(h.rules.assembly.tierRules.tier_5.tags),['normal']);assert.deepEqual(Array.from(h.rules.assembly.tierRules.tier_4.tags),['normal']);
 assert.ok(history.every(r=>h.allCatalogItems.some(i=>i.name===r.name)));checkReplay(h,history);
});
test('角色60抽情报书仅在下一期兑现，计入下期保底及有效寻访次数',async()=>{
 const h=setup('char_up'),before=await h.engine.draw(h.state,70);assert.equal(E.getRuleTotal(h.rules,h.state),60);assert.equal(h.state.nextPeriodFreeQueue[0].remaining,10);assert.equal(h.state.freeQueue.length,0);
 const source=fs.readFileSync('pages/simulator.js','utf8'),a=source.indexOf('    // 1. 根据规则重置状态机'),b=source.indexOf('    // 2. 自动把顶部 UP',a);
 vm.runInNewContext('(function(){'+source.slice(a,b)+'})()',{rules:h.rules,simData:h.state,matrix:h.rules.lifecycle.rotationMatrix,GachaEngine:E,simulatorWallet:{enabled:()=>false}});
 const ruleBase=E.getRuleTotal(h.rules,h.state),pity=h.state.pity,after=await h.engine.draw(h.state,10);
 assert.ok(after.every(r=>r.pullType==='free_pity'&&r.countRules));assert.equal(E.getRuleTotal(h.rules,h.state)-ruleBase,10);
 assert.equal(h.state.pity,pity+10);assert.equal(h.state.nextPeriodFreeQueue.length,0);
 checkReplay(h,[...before,{isRuleNode:true,config:{}},...after],{allowRotation:true});
});
test('加急招募及下期凭证在各自有效期结束后失效，不跨多期累计',async()=>{
 const h=setup('char_up');await h.engine.draw(h.state,30);assert.equal(h.state.freeQueue[0].remaining,10);
 E.activateNextPeriodPulls(h.state);assert.equal(h.state.freeQueue.length,0);
 h.state.nextPeriodFreeQueue=[{remaining:10,countPity:true,countRules:true}];
 E.activateNextPeriodPulls(h.state);assert.equal(h.state.freeQueue[0].remaining,10);
 E.activateNextPeriodPulls(h.state);assert.equal(h.state.freeQueue.length,0);
});
