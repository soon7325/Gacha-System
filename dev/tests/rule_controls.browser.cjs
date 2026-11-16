const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
let playwright;try{playwright=require('playwright');}catch{playwright=require(path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));}
const root=path.resolve(__dirname,'../..');
(async()=>{
 const browser=await playwright.chromium.launch({channel:'chrome',headless:true});
 try{
  const context=await browser.newContext({viewport:{width:1280,height:1000},deviceScaleFactor:1});
  await context.addInitScript(()=>{
   if(localStorage.getItem('rule_test_seeded'))return;
   const activation={conditions:[{type:'pulls',count:100}],match:'all',counting:'retain',catchUp:'all'};
   localStorage.setItem('GM_Lang','zh');
   localStorage.setItem('GM_Info_rule_preview',JSON.stringify({gameName:'规则设置预览',mixedPools:[{id:'char_up',name:'规则设置预览',en:'Rule preview',icon:'🎯'}]}));
   localStorage.setItem('GM_Catalog_rule_preview',JSON.stringify({char:[{id:'u',name:'限定角色',tierId:'tier_5',tags:['up']},{id:'s',name:'常驻角色',tierId:'tier_5',tags:['std']}],wep:[]}));
   localStorage.setItem('GM_Rules_rule_preview_char_up',JSON.stringify({tiers:[{id:'tier_5',prob:1,isGold:true},{id:'tier_4',prob:9},{id:'tier_3',prob:90}],pities:[{tierId:'tier_5',pulls:90,enableUp:true,upRate:.5}],earlyUpRules:[{id:'early',order:1,upRate:100}],goldCategorySequence:[{id:'category',order:1,targetCats:['char'],targetTags:['std']}],sparkRules:[{id:'spark',limit:30,type:'loop',noReset:true,maxTriggers:8,activation}],giftRules:[{id:'gift',trigger:30,amount:10,type:'loop',maxTriggers:8,countPity:false}]}));
   localStorage.setItem('rule_test_seeded','1');
  });
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.dismiss());
  const url=require("node:url").pathToFileURL(path.join(root,"pool_setup.html")).href+"?gameId=rule_preview&pool=char_up";
  await page.goto(url);await page.waitForSelector('.spark-rule-row .rule-controls');
  const spark=page.locator('.spark-rule-row').first(),gift=page.locator('.gift-rule-row').first();
  assert.equal(await spark.locator('.rule-catch-up').inputValue(),'all');
  assert.equal(await spark.locator('.rule-catch-up-wrap').isVisible(),true);
  // Use the real custom select buttons, rather than changing only the native value.
  const select=async(row,cls,value)=>{await row.locator(cls+' + .custom-select-ui button').click();await page.locator('.custom-select-floating .custom-select-ui-item[data-val="'+value+'"]').click();};
  for(const row of [spark,gift]){
   const cls=await row.evaluate(el=>el.dataset.ruleKind==='spark'?'.input-spark-type':'.input-gift-type');
   assert.equal(await row.locator(cls).inputValue(),'limited');
   assert.equal(await row.locator('.rule-trigger-count').isVisible(),true);
   assert.equal(await row.locator('.rule-limit-enabled').count(),0);
   await row.locator('.rule-max-triggers').fill('5');
   await select(row,cls,'once');assert.equal(await row.locator('.rule-trigger-count').isVisible(),false);
   assert.equal(await row.evaluate(el=>PoolRuleControls.read(el).type),'once');
   assert.equal(await row.evaluate(el=>PoolRuleControls.read(el).maxTriggers),null);
   await select(row,cls,'loop');assert.equal(await row.locator('.rule-trigger-count').isVisible(),false);
   assert.equal(await row.evaluate(el=>PoolRuleControls.read(el).maxTriggers),null);
   await select(row,cls,'limited');assert.equal(await row.locator('.rule-max-triggers').inputValue(),'5');
   assert.equal(await row.evaluate(el=>PoolRuleControls.read(el).type),'loop');
   assert.equal(await row.evaluate(el=>PoolRuleControls.read(el).maxTriggers),5);
   await row.locator('.rule-max-triggers').fill('0');assert.match(await page.evaluate(()=>PoolRuleControls.validate()),/正整数/);
   await row.locator('.rule-max-triggers').fill('8');
  }
  await select(spark,'.rule-counting','reset');assert.equal(await spark.locator('.rule-catch-up-wrap').isVisible(),false);
  await select(spark,'.rule-counting','retain');assert.equal(await spark.locator('.rule-catch-up').inputValue(),'all');
  assert.equal(await gift.locator('.rule-activation-body').isVisible(),false);await gift.locator('.rule-delayed').check();
  await select(gift,'.rule-condition-type','rule');await select(gift,'.rule-reference','spark');
  await gift.locator('.rule-condition-count').fill('2');
  const early=page.locator('.early-up-rule-row').first(),category=page.locator('.cat-seq-rule-row').first();
  for(const row of [early,category]){
   await row.locator('.rule-delayed').check();
   assert.equal(await row.locator('.rule-catch-up-wrap').isVisible(),false);
   await select(row,'.rule-counting','retain');
   assert.equal(await row.locator('.rule-sequence-catch-up').inputValue(),'skip');
   assert.equal(await row.locator('.rule-catch-up-wrap').isVisible(),true);
  }
  await select(early,'.rule-sequence-catch-up','next');
  await select(early,'.rule-counting','reset');assert.equal(await early.locator('.rule-catch-up-wrap').isVisible(),false);
  await select(early,'.rule-counting','retain');assert.equal(await early.locator('.rule-sequence-catch-up').inputValue(),'next');
  assert.equal(await page.evaluate(()=>PoolRuleControls.validate()),'');
  const layoutValues=await page.evaluate(()=>[...document.querySelectorAll('.rule-controls')].map(el=>PoolRuleControls.read(el.closest('[data-rule-id]'))));
  for(const selector of ['.early-up-rule-row','.cat-seq-rule-row','.spark-rule-row','.gift-rule-row']){
   assert.equal(await page.locator(selector+' .rule-action-footer > .rule-delete-action').count(),1);
  }
  assert.equal(await category.locator('> .rule-display-heading > .rule-details-toggle').count(),1);
  for(const row of [early,category,spark,gift]){
   await row.locator('.rule-details-toggle').click();
   assert.equal(await row.locator('.rule-details').isVisible(),false);
   assert.equal(await row.locator('.rule-display-label').isVisible(),true);
   assert.equal(await row.locator('.rule-controls').isVisible(),false);
   assert.equal(await row.locator('.input-early-order,.input-cat-seq-order,.input-spark-limit,.input-gift-trigger').isVisible(),false);
   assert.equal(await row.locator('.rule-action-footer').isVisible(),false);
   await row.locator('.rule-details-toggle').click();
   assert.equal(await row.locator('.rule-details').isVisible(),true);
  }
  await page.evaluate(()=>togglePreviewMode());
  assert.equal(await spark.locator('.rule-details-toggle').isEnabled(),true);
  await spark.locator('.rule-details-toggle').click();
  assert.equal(await spark.locator('.rule-details').isVisible(),false);
  await page.evaluate(()=>togglePreviewMode());await spark.locator('.rule-details-toggle').click();
  assert.deepEqual(await page.evaluate(()=>[...document.querySelectorAll('.rule-controls')].map(el=>PoolRuleControls.read(el.closest('[data-rule-id]')))),layoutValues);
  // Show a finite loop, and verify the per-rule ID survives save and reload.
  const before=await page.evaluate(()=>[...document.querySelectorAll('.rule-controls')].map(el=>PoolRuleControls.read(el.closest('[data-rule-id]'))));
  const saved=await page.evaluate(()=>executeSavePool(false));assert.equal(saved,true);
  await page.reload();await page.waitForSelector('.spark-rule-row .rule-controls');
  const after=await page.evaluate(()=>[...document.querySelectorAll('.rule-controls')].map(el=>PoolRuleControls.read(el.closest('[data-rule-id]'))));
  assert.deepEqual(after,before);assert.equal(await page.locator('.gift-rule-row .rule-reference').inputValue(),'spark');
  assert.equal(await page.locator('.early-up-rule-row .rule-sequence-catch-up').inputValue(),'next');
  assert.equal(await page.locator('.cat-seq-rule-row .rule-sequence-catch-up').inputValue(),'skip');
  for (const [selector,label] of [['.early-up-rule-row','前 N 金胜率 #1'],['.cat-seq-rule-row','类型定向 #1'],['.spark-rule-row','井 #1'],['.gift-rule-row','赠送抽 #1']]) {
   assert.equal(await page.locator(selector+' .rule-display-label').first().inputValue(),label);
  }
  await page.evaluate(()=>appendSparkRuleRow(50,'once',{id:'second_spark'}));
  await page.waitForFunction(()=>document.querySelector('[data-rule-id="second_spark"] .rule-display-label')?.value==='井 #2');
  await page.evaluate(()=>{const parent=document.getElementById('spark-rules-container');parent.prepend(parent.lastElementChild);});
  await page.waitForFunction(()=>document.querySelector('[data-rule-id="spark"] .rule-display-label')?.value==='井 #2' && document.querySelector('.gift-rule-row .rule-reference').selectedOptions[0]?.textContent==='井 #2');
  assert.equal(await page.locator('.gift-rule-row .rule-reference').inputValue(),'spark');
  await page.evaluate(()=>document.querySelector('[data-rule-id="second_spark"]').remove());
  await page.waitForFunction(()=>document.querySelector('[data-rule-id="spark"] .rule-display-label')?.value==='井 #1' && document.querySelector('.gift-rule-row .rule-reference').selectedOptions[0]?.textContent==='井 #1');
  // Names use the same bilingual editor, while references keep their fixed ID.
  await page.evaluate(()=>{localStorage.setItem('GM_Bilingual_Editing','true');window.dispatchEvent(new Event('bilingual-editing-change'));});
  for (const [selector,name] of [['.early-up-rule-row','首金福利'],['.cat-seq-rule-row','新手角色福利'],['.spark-rule-row','阶段奖励'],['.gift-rule-row','阶段奖励']]) {
   const row=page.locator(selector).first();
   await row.locator('.rule-details-toggle').click();
   await row.locator('.rule-name-input').fill(name);await row.locator('.rule-name-input').blur();
   assert.equal(await row.locator('.rule-details').isVisible(),false);
   await row.locator('.rule-details-toggle').click();
  }
  await page.locator('.spark-rule-row .rule-name-input').scrollIntoViewIfNeeded();
  await page.waitForTimeout(200);
  await page.locator('.spark-rule-row .rule-name-input').locator('..').locator('.bilingual-input-toggle').click();
  await page.locator('.bilingual-input-panel input').fill('Stage reward',{timeout:3000});
  await page.locator('.bilingual-input-panel input').press('Enter');
  await page.waitForFunction(()=>document.querySelector('.gift-rule-row .rule-reference').selectedOptions[0]?.textContent==='阶段奖励 (井 #1)');
  assert.equal(await page.locator('.gift-rule-row .rule-reference').inputValue(),'spark');
  assert.equal(await page.evaluate(()=>PoolRuleControls.read(document.querySelector('.spark-rule-row')).en),'Stage reward');
  const renamed=await page.evaluate(()=>[...document.querySelectorAll('[data-rule-id]')].map(row=>PoolRuleControls.read(row)));
  assert.equal(await page.evaluate(()=>executeSavePool(false)),true);
  await page.reload();await page.waitForSelector('.spark-rule-row .rule-name-input');
  assert.deepEqual(await page.evaluate(()=>[...document.querySelectorAll('[data-rule-id]')].map(row=>PoolRuleControls.read(row))),renamed);
  assert.equal(await page.locator('.gift-rule-row .rule-reference').inputValue(),'spark');
  await page.evaluate(()=>togglePreviewMode());
  assert.equal(await page.locator('.spark-rule-row .rule-name-input').isDisabled(),true);
  await page.evaluate(()=>togglePreviewMode());
  await page.evaluate(()=>localStorage.setItem('GM_Lang','en'));await page.reload();
  await page.waitForSelector('.spark-rule-row .rule-name-input');
  assert.equal(await page.locator('.spark-rule-row .rule-name-input').inputValue(),'Stage reward');
  assert.equal(await page.locator('.gift-rule-row .rule-reference').inputValue(),'spark');
  assert.equal(await page.evaluate(()=>executeSavePool(false)),true);
  await page.evaluate(()=>localStorage.setItem('GM_Lang','zh'));await page.reload();
  await page.waitForSelector('.spark-rule-row .rule-name-input');
  assert.equal(await page.locator('.spark-rule-row .rule-name-input').inputValue(),'阶段奖励');
  assert.equal(await page.evaluate(()=>PoolRuleControls.read(document.querySelector('.spark-rule-row')).en),'Stage reward');
  await page.evaluate(()=>{
   const key='GM_Rules_rule_preview_char_up',saved=JSON.parse(localStorage.getItem(key));saved.countBonusPullsForRules=false;localStorage.setItem(key,JSON.stringify(saved));
   document.querySelector('.spark-rule-row').ruleMetadata={rewardKind:'token'};
   document.querySelector('.gift-rule-row').ruleMetadata={ownMinorPity:true,nextPeriod:true,countRules:true};
  });
  assert.equal(await page.evaluate(()=>executeSavePool(false)),true);
  await page.reload();await page.waitForSelector('.spark-rule-row .rule-name-input');
  const metadata=await page.evaluate(()=>({rules:JSON.parse(localStorage.getItem('GM_Rules_rule_preview_char_up')),gift:PoolRuleControls.read(document.querySelector('.gift-rule-row'))}));
  assert.equal(metadata.rules.countBonusPullsForRules,false);assert.equal(metadata.rules.sparkRules[0].rewardKind,'token');
  assert.equal(metadata.gift.nextPeriod,true);assert.equal(metadata.gift.ownMinorPity,true);assert.equal(metadata.gift.countRules,true);
  assert.equal(await page.locator('.input-spark-cancel-on-hit').count(),0);
  const stopRow=page.locator('.spark-rule-row').first();
  await select(stopRow,'.rule-expiry-type','target');
  await select(stopRow,'.rule-expiry-scope','including_before');
  assert.equal(await stopRow.locator('.rule-expiry-options').isVisible(),true);
  assert.equal(await stopRow.locator('.rule-expiry-count-wrap').isVisible(),false);
  assert.equal(await page.evaluate(()=>executeSavePool(false)),true);
  await page.reload();await page.waitForSelector('.spark-rule-row .rule-expiry-type');
  assert.equal(await page.locator('.spark-rule-row .rule-expiry-type').inputValue(),'target');
  assert.equal(await page.locator('.spark-rule-row .rule-expiry-scope').inputValue(),'including_before');
  await page.evaluate(()=>appendSparkRuleRow(80,'once',{id:'legacy_expiry',cancelOnHit:true}));
  assert.equal(await page.locator('[data-rule-id="legacy_expiry"] .rule-expiry-type').inputValue(),'target');
  await page.evaluate(()=>document.querySelector('[data-rule-id="legacy_expiry"]').remove());
  // Capture actual cards in one continuous image, without altering their contents.
  await page.setViewportSize({width:1280,height:2000});
  await page.locator('#card-section-7').evaluate(el=>el.scrollIntoView({block:'start'}));
  const clip=await page.evaluate(()=>{const a=document.getElementById('card-section-7').getBoundingClientRect(),b=document.getElementById('card-section-8').getBoundingClientRect();return{x:a.x,y:Math.max(0,a.y),width:a.width,height:b.bottom-a.top};});
  fs.mkdirSync(path.join(root,'dev/output'),{recursive:true});
  await page.screenshot({path:path.join(root,'dev/output/rule-settings-preview.png'),clip,fullPage:true});
  await page.locator('#card-section-4').evaluate(el=>el.scrollIntoView({block:'start'}));
  const sequenceClip=await page.evaluate(()=>{const a=document.getElementById('card-section-4').getBoundingClientRect(),b=document.getElementById('card-section-5').getBoundingClientRect();return{x:a.x,y:Math.max(0,a.y),width:a.width,height:b.bottom-a.top};});
  await page.screenshot({path:path.join(root,'dev/output/sequence-catch-up-preview.png'),clip:sequenceClip,fullPage:true});
  for (const button of await page.locator('.rule-details-toggle').all()) await button.click();
  await page.locator('#card-section-4').evaluate(el=>el.scrollIntoView({block:'start'}));
  const collapsedClip=await page.evaluate(()=>{const a=document.getElementById('card-section-4').getBoundingClientRect(),b=document.getElementById('card-section-8').getBoundingClientRect();return{x:a.x,y:Math.max(0,a.y),width:a.width,height:b.bottom-a.top};});
  await page.screenshot({path:path.join(root,'dev/output/rules-collapsed-preview.png'),clip:collapsedClip,fullPage:true});
  assert.deepEqual(errors,[]);
  // Circular dependencies and unreachable prerequisites are rejected.
  await page.evaluate(()=>{const row=document.querySelector('.spark-rule-row');row.querySelector('.rule-condition-type').value='rule';row.querySelector('.rule-reference').value='gift';row.dispatchEvent(new Event('change',{bubbles:true}));});
  assert.match(await page.evaluate(()=>PoolRuleControls.validate()),/超过|循环/);
  await page.evaluate(()=>{document.querySelector('.spark-rule-row .rule-condition-count').value='1';});
  assert.match(await page.evaluate(()=>PoolRuleControls.validate()),/循环/);
  await page.evaluate(()=>{const row=document.querySelector('.spark-rule-row');row.querySelector('.rule-reference').value='category';row.querySelector('.rule-condition-count').value='2';});
  assert.match(await page.evaluate(()=>PoolRuleControls.validate()),/超过/);
  await page.evaluate(()=>{document.querySelector('.spark-rule-row .rule-condition-count').value='0';});
  assert.match(await page.evaluate(()=>PoolRuleControls.validate()),/正整数/);
  await page.evaluate(()=>{const row=document.querySelector('.spark-rule-row');row.querySelector('.rule-condition-count').value='1';row.querySelector('.rule-reference').value='gift';document.querySelector('.gift-rule-row').remove();});
  assert.match(await page.evaluate(()=>PoolRuleControls.validate()),/有效/);
  await page.evaluate(()=>appendSparkRuleRow(50,'once',{id:'spark'}));
  assert.match(await page.evaluate(()=>PoolRuleControls.validate()),/ID 重复/);
  await page.goto(require('node:url').pathToFileURL(path.join(root,'dev/output/rule-settings-preview.html')).href);
  const demo=page.frameLocator('#preview');
  await demo.locator('.spark-rule-row .rule-controls').waitFor();
  assert.equal(await demo.locator('.spark-rule-row .rule-catch-up').inputValue(),'all');
  assert.equal(await demo.locator('.gift-rule-row .rule-reference').inputValue(),'demo_spark');
  await page.goto(require('node:url').pathToFileURL(path.join(root,'dev/output/rule-lifecycle-preview.html')).href);
  await page.frameLocator('#preview').locator('[data-rule-id="lifecycle_beginner"]').waitFor();
  await page.goto(require('node:url').pathToFileURL(path.join(root,'pool_setup.html')).href+'?gameId=rule_lifecycle_demo&pool=char_up');
  const beginner=page.locator('[data-rule-id="lifecycle_beginner"]');await beginner.waitFor();
  assert.equal(await beginner.locator('.rule-expiry-type').inputValue(),'target');
  assert.equal(await beginner.locator('.rule-expiry-scope').inputValue(),'including_before');
  assert.equal(await beginner.locator('.rule-catch-up').inputValue(),'none');
  await page.setViewportSize({width:1280,height:1600});
  await beginner.screenshot({path:path.join(root,'dev/output/rule-lifecycle-preview.png')});
  const finite=page.locator('[data-rule-id="lifecycle_loop"]');
  assert.equal(await finite.locator('.input-spark-type').inputValue(),'limited');
  assert.equal(await finite.locator('.rule-max-triggers').inputValue(),'8');
  await finite.screenshot({path:path.join(root,'dev/output/rule-trigger-mode-preview.png')});
  console.log('PASS: live dropdowns, conditional visibility, grant-all default, finite loops, stable references, save/reload, validation and screenshot');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
