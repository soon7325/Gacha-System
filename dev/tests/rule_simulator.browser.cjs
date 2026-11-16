const fs=require('fs'),path=require('path'),assert=require('node:assert/strict'),{pathToFileURL}=require('node:url');
let playwright;try{playwright=require('playwright');}catch{playwright=require(path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));}
(async()=>{
 const browser=await playwright.chromium.launch({channel:'chrome',headless:true});
 try{
  const context=await browser.newContext({viewport:{width:1280,height:1000}});
  await context.addInitScript(()=>{
   localStorage.setItem('GM_Show_Test_Catalog','true');localStorage.setItem('GM_Sim_Currency_Mode','false');localStorage.setItem('GM_Sim_Start_Setup','false');localStorage.setItem('GM_Sim_Keep_Records','false');
   let seed=237;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  });
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&!m.text().includes('Failed to load resource'))errors.push(m.text());});
  const cases=['prereq_chain_up','prereq_combo_up','catchup_all_up','catchup_one_up','catchup_none_up','sequence_skip_up','sequence_next_up','expiry_after_unlock_up','expiry_including_before_up','expiry_rule_up'].map(pool=>({game:'test',pool,amount:80})).concat([{game:'end',pool:'char_up',amount:260},{game:'end',pool:'wep_up',amount:350},{game:'end',pool:'char_std',amount:350}]);
  for(const {game,pool,amount} of cases){
   await page.goto(pathToFileURL(path.resolve('simulator.html')).href+'?gameId='+game+'&pool='+pool);
   await page.waitForFunction(()=>typeof simRecordReady!=='undefined'&&simRecordReady);
   await page.evaluate(()=>{
    for(const tier of activeTiers){const limits=getPreSelectLimits(tier.id);
     for(const kind of ['up','std']){
      const boxes=[...document.querySelectorAll('.sim-'+kind+'-cb-'+tier.id)],n=kind==='up'?Math.min(boxes.length,Math.max(limits.upMin,Math.min(1,limits.upMax))):Math.min(boxes.length,limits.stdMax);
      boxes.forEach((box,i)=>{box.checked=i<n;});
     }
     syncTierCardsLinkage(tier.id);
     const chosenUp=new Set([...document.querySelectorAll('.sim-up-cb-'+tier.id+':checked')].map(box=>box.value));
     const standard=[...document.querySelectorAll('.sim-std-cb-'+tier.id)].filter(box=>!chosenUp.has(box.value));standard.forEach((box,i)=>{box.checked=i<Math.min(standard.length,limits.stdMax);});
     syncTierCardsLinkage(tier.id);
    }
   });
   await page.evaluate(async amount=>{const choose=setInterval(()=>{const modal=document.getElementById('sparkSelectModalOverlay');if(modal&&getComputedStyle(modal).display!=='none')modal.querySelector('.char-select-card')?.click();},20);let watchdog;try{await Promise.race([doSimPulls(amount),new Promise((_,reject)=>{watchdog=setTimeout(()=>reject(new Error('draw stalled: '+document.getElementById('customDialogOverlay')?.innerText+' '+JSON.stringify(activeTiers.map(t=>({tier:t.id,limits:getPreSelectLimits(t.id),up:document.querySelectorAll('.sim-up-cb-'+t.id+':checked').length,std:document.querySelectorAll('.sim-std-cb-'+t.id+':checked').length}))))),4000);})]);}finally{clearTimeout(watchdog);clearInterval(choose);}},amount);
   const snapshot=await page.evaluate(()=>({state:SimulatorStart.copy(simData),records:SimulatorStart.copy(simRecordEntries),items:document.querySelectorAll('#sim-results .sim-item').length,shownGifts:document.querySelectorAll('#sim-results .spark-gift-card[title]').length}));
   assert.equal(snapshot.state.total,amount,pool);assert.equal(snapshot.items,amount,pool);
   if(pool==='prereq_chain_up'){
    assert.equal(snapshot.state.sequenceRuleState.lab_chain_early.triggeredCount,1);assert.equal(snapshot.state.sequenceRuleState.lab_chain_category.triggeredCount,1);assert.equal(snapshot.state.giftState[0].triggeredCount,2);
   }
   if(pool.startsWith('sequence_'))for(const id of Object.keys(snapshot.state.sequenceRuleState))assert.equal(snapshot.state.sequenceRuleState[id].triggeredCount,pool==='sequence_next_up'?1:0,id);
   if(pool==='expiry_including_before_up'){assert.equal(snapshot.state.sparkState[0].expired,true);assert.equal(snapshot.state.sparkState[0].triggeredCount,0);}
   if(pool==='expiry_rule_up'){assert.equal(snapshot.state.sparkState[0].triggeredCount,1);assert.equal(snapshot.state.giftState[0].expired,true);assert.ok(snapshot.state.giftState[0].triggeredCount<8);}
   const gifts=snapshot.records.filter(row=>row.kind==='gift').length;
   assert.equal(snapshot.shownGifts,gifts,pool+' should render every earned spark reward');
   if(game==='end'&&pool==='char_up'){assert.equal(snapshot.state.bonusPullCount,10);assert.equal(snapshot.state.nextPeriodFreeQueue[0].remaining,10);assert.equal(snapshot.records.filter(r=>r.kind==='gift'&&r.gift.isToken).length,1);}
   console.log('PASS browser simulator:',game+'/'+pool,amount,'pulls,',gifts,'spark rewards');
  }
  assert.deepEqual(errors,[]);
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
