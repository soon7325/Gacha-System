const path=require('path'),assert=require('node:assert/strict'),{pathToFileURL}=require('node:url');
let playwright;try{playwright=require('playwright');}catch{playwright=require(path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));}
(async()=>{
 const browser=await playwright.chromium.launch({channel:'chrome',headless:true});
 try{
  const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{localStorage.setItem('GM_Sim_Start_Setup','false');localStorage.setItem('GM_Sim_Keep_Records','false');localStorage.setItem('GM_Sim_Currency_Mode','true');});
  await page.goto(pathToFileURL(path.resolve('simulator.html')).href+'?gameId=hsr&pool=char_up');
  await page.waitForFunction(()=>typeof simRecordReady!=='undefined'&&simRecordReady);
  const balances=await page.evaluate(()=>{
   const saved=UserDataProfiles.read(currentGameId),profile=UserDataProfiles.defaultRow(saved.items);
   profile.balances=Object.fromEntries(gameInfo.economy.resources.map(resource=>[resource.id,10000]));
   UserDataProfiles.save(currentGameId,profile,saved.revision);return profile.balances;
  });
  await page.reload();await page.waitForFunction(()=>typeof simRecordReady!=='undefined'&&simRecordReady);
  assert.equal(await page.locator('#sim-profile-picker').evaluate(node=>node.open),false);
  assert.equal(await page.locator('#btn-edit-start').isVisible(),true);
  assert.deepEqual(await page.evaluate(()=>simulatorWallet.account().balances),balances);
  await page.evaluate(async()=>{await doSimPulls(1);});
  assert.equal(await page.evaluate(()=>simData.total),1);
  assert.notDeepEqual(await page.evaluate(()=>simulatorWallet.account().balances),balances);
  await page.locator('#btn-edit-start').click();assert.equal(await page.locator('#sim-profile-picker').evaluate(node=>node.open),true);
  // Confirm only the explicit apply action; the actual picker button and balance reset run normally.
  await page.evaluate(()=>window.customConfirm=async()=>true);
  await page.locator('#sim-profile-picker button').filter({hasText:'使用所选数据'}).click();
  await page.waitForFunction(()=>!document.querySelector('#sim-profile-picker').open);
  assert.deepEqual(await page.evaluate(()=>simulatorWallet.account().balances),balances);
  assert.equal(await page.evaluate(()=>simData.total),0);
  assert.equal(await page.evaluate(()=>localStorage.getItem('GM_Sim_Start_Setup')),'false');
  assert.deepEqual(errors,[]);
  console.log('PASS: skip entry picker, load default holdings, keep manual start button, restore currency after a paid pull without enabling entry popup.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
