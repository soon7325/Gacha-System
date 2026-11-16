const path=require('path'),assert=require('node:assert/strict');
const {chromium}=require(path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});try{
 for(const name of ['pool_setup','changelog','currency_setup','gallery_setup','user_data','dashboard']){
  const p=await browser.newPage({viewport:{width:1600,height:950}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.goto(require('url').pathToFileURL(path.join(process.cwd(),name+'.html')).href+'?gameId=hsr&pool=char_up');await p.waitForTimeout(650);
  await p.evaluate(name=>{ContentColumns.set(name,'columns','3');ContentColumns.set(name,'browsing','single');},name);await p.waitForTimeout(400);
  assert.equal(await p.locator('.content-fixed-grid').getAttribute('data-browsing'),'single',name);
  const dots=p.locator('.content-single-dots button'),total=await dots.count();
  if(total){assert.equal(await p.locator('.content-fixed-column>*').count(),1,name+' one panel');assert.equal(await p.locator('.content-single-status').textContent(),'1 / '+total);
   if(total>1){await p.locator('.content-single-arrow.next').click();await p.waitForTimeout(150);assert.equal(await p.locator('.content-single-status').textContent(),'2 / '+total);await dots.last().click();await p.waitForTimeout(150);assert.equal(await p.locator('.content-single-status').textContent(),total+' / '+total);assert.ok(await p.locator('.content-single-arrow.next').isDisabled());await dots.first().click();await p.waitForTimeout(150);}
  }
  if(name==='pool_setup'){
   await p.evaluate(()=>{const input=document.querySelector('.content-fixed-column input[type=number]');window.retainedInput=input;if(input)input.value='37';});
   await p.locator('.content-single-arrow.next').click();await p.waitForTimeout(120);await p.locator('.content-single-arrow.previous').click();await p.waitForTimeout(120);
   assert.ok(await p.evaluate(()=>!window.retainedInput||window.retainedInput.isConnected&&window.retainedInput.value==='37'));
   await p.evaluate(()=>PanelDefaults.open('pool_setup'));assert.ok(await p.locator('[data-panel-level=sections]').evaluate(n=>n.closest('label').hidden));assert.ok(await p.locator('[data-panel-level=rules]').isVisible());await p.keyboard.press('Escape');
  }
  await p.screenshot({path:path.join(process.cwd(),'dev/output/single-panel-'+name+'.png')});
  await p.evaluate(name=>ContentColumns.open(name),name);await p.waitForTimeout(80);
  for(const part of ['columns','arrangement','alignment','scrolling','pageSize'])assert.ok(await p.locator('[data-content-columns-part='+part+']').evaluate(n=>n.closest('label').hidden),part);
  await p.keyboard.press('Escape');
  await p.evaluate(name=>ContentColumns.set(name,'browsing','scroll'),name);await p.waitForTimeout(250);
  assert.equal(await p.locator('.content-single-nav').count(),0);assert.equal(await p.evaluate(name=>ContentColumns.read(name).columns,name),'3');assert.deepEqual(errors,[],name);if(name==='changelog'){await p.setViewportSize({width:390,height:844});await p.evaluate(name=>ContentColumns.set(name,'browsing','single'),name);await p.waitForTimeout(200);assert.ok(await p.locator('.content-single-arrow.next').isVisible());assert.ok(await p.evaluate(()=>document.querySelector('.content-flow-viewport').getBoundingClientRect().right<=innerWidth));await p.screenshot({path:path.join(process.cwd(),'dev/output/single-panel-mobile.png')});}console.log('PASS',name,total);await p.close();
 }
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
