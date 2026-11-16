const path=require('path'),assert=require('node:assert/strict');
const {chromium}=require(path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
const url=name=>require('url').pathToFileURL(path.join(process.cwd(),name+'.html')).href;
(async()=>{const b=await chromium.launch({channel:'chrome',headless:true});try{
 const p=await b.newPage({viewport:{width:1600,height:950}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto(url('changelog'));await p.waitForTimeout(450);await p.evaluate(()=>{document.querySelectorAll('.log-card').forEach((node,i)=>node.dataset.fitTest=i);ContentColumns.set('changelog','browsing','single');});await p.waitForTimeout(250);
 assert.ok(await p.locator('.content-fixed-column .log-card').evaluate(n=>Math.abs(n.querySelector('.card-actions').getBoundingClientRect().bottom-n.getBoundingClientRect().bottom)<=2));
 await p.evaluate(()=>document.querySelectorAll('.log-card').forEach((node,i)=>node.dataset.fitTest=i));
 const total=await p.locator('.content-single-dots button').count();await p.evaluate(()=>ContentColumns.set('changelog','singleFill','fit'));await p.waitForTimeout(300);
 const pages=await p.locator('.content-single-dots button').count();console.log({total,pages});assert.ok(pages<total);
 const seen=[];let multiple=false,multiIndex=0;
 for(let i=0;i<pages;i++){
  await p.locator('.content-single-dots button').nth(i).click();await p.waitForTimeout(100);
  const info=await p.locator('.content-fixed-column').evaluate(n=>({ids:[...n.children].map(x=>Number(x.dataset.fitTest)),scroll:n.scrollHeight,height:n.clientHeight}));seen.push(...info.ids);
  if(info.ids.length>1){multiple=true;multiIndex=i;assert.ok(info.scroll<=info.height+2,JSON.stringify(info));
   const spacing=await p.locator('.content-fixed-column').evaluate(column=>{
    const nodes=[...column.children],actual=nodes.map(n=>n.getBoundingClientRect().height),grid=column.closest('.content-fixed-grid');grid.setAttribute('data-fit-measuring','');const natural=nodes.map(n=>n.getBoundingClientRect().height);grid.removeAttribute('data-fit-measuring');
    return {extras:actual.map((h,i)=>h-natural[i]),bottom:Math.abs(nodes.at(-1).getBoundingClientRect().bottom-column.getBoundingClientRect().bottom),footers:nodes.map(n=>Math.abs(n.querySelector('.card-actions').getBoundingClientRect().bottom-n.getBoundingClientRect().bottom))};
   });assert.ok(Math.max(...spacing.extras)-Math.min(...spacing.extras)<1,JSON.stringify(spacing));assert.ok(spacing.bottom<2);assert.ok(spacing.footers.every(gap=>gap<=2));await p.screenshot({path:path.join(process.cwd(),'dev/output/single-panel-fit.png')});}
 }
 assert.ok(multiple);assert.deepEqual(seen,Array.from({length:total},(_,i)=>i));
 await p.locator('.content-single-dots button').nth(multiIndex).click();await p.waitForTimeout(120);
 const anchor=await p.locator('.content-fixed-column>:first-child').getAttribute('data-version');
 await p.evaluate(()=>{const input=document.createElement('input');input.value='unsaved fit input';document.querySelector('.content-fixed-column>:first-child').append(input);window.fitInput=input;});
 await p.setViewportSize({width:1000,height:700});await p.waitForTimeout(600);if(await p.locator('.content-fixed-grid [data-version]').evaluateAll((nodes,id)=>nodes.some(n=>n.dataset.version===id),anchor))assert.ok(await p.locator('.content-fixed-column').evaluate((n,id)=>[...n.children].some(x=>x.dataset.version===id),anchor));

 const resizeInfo=await p.locator('.content-fixed-column').evaluate(n=>({count:n.children.length,height:n.clientHeight,scroll:n.scrollHeight}));if(resizeInfo.count>1)assert.ok(resizeInfo.scroll<=resizeInfo.height+2);
 await p.setViewportSize({width:1600,height:950});await p.waitForTimeout(600);
 await p.evaluate(()=>ContentColumns.open('changelog'));assert.ok(await p.locator('[data-content-columns-part=singleFill]').isVisible());await p.keyboard.press('Escape');
 await p.evaluate(()=>ContentColumns.set('changelog','singleFill','one'));await p.waitForTimeout(180);assert.equal(await p.locator('.content-single-dots button').count(),total);assert.equal(await p.locator('.content-fixed-column>*').count(),1);
 await p.reload();await p.waitForTimeout(450);assert.equal(await p.evaluate(()=>ContentColumns.read('changelog').singleFill),'one');
 await p.goto(url('settings'));await p.waitForTimeout(300);await p.evaluate(()=>{GlobalDisplay.set('browsing','single');GlobalDisplay.set('singleFill','fit');GlobalDisplay.open('display');});await p.waitForTimeout(100);
 assert.ok(await p.locator('[data-global-display=singleFill]').isVisible());assert.equal(await p.locator('[data-global-display=singleFill]').inputValue(),'fit');assert.equal(await p.locator('[data-global-display=browsing]').inputValue(),'single');
 assert.deepEqual(errors,[]);console.log('PASS fit complete panels, no overflow on multi-panel pages, preserved order, independent option, persistence and global setting');
}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1});
