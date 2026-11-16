const path=require('path'),assert=require('node:assert/strict');
const {chromium}=require(path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
const url=name=>require('url').pathToFileURL(path.join(process.cwd(),name+'.html')).href;
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});try{
 const p=await browser.newPage({viewport:{width:1600,height:950},reducedMotion:'reduce'}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto(url('changelog'));await p.waitForTimeout(450);await p.evaluate(()=>ContentColumns.set('changelog','browsing','single'));await p.waitForTimeout(250);
 const page=async()=>Number(await p.locator('.content-single-nav').getAttribute('data-index'));
 const geometry=await p.evaluate(()=>{const rect=s=>{const r=document.querySelector(s).getBoundingClientRect();return {top:r.top,bottom:r.bottom,left:r.left,right:r.right}};return {dots:rect('.content-single-dots'),card:rect('.content-fixed-column'),previous:rect('.content-single-arrow.previous'),next:rect('.content-single-arrow.next'),viewport:rect('.content-flow-viewport')}});
 assert.ok(geometry.dots.bottom<=geometry.card.top);assert.ok(geometry.previous.right<=geometry.card.left);assert.ok(geometry.next.left>=geometry.card.right);assert.ok(geometry.viewport.bottom<=950);
 await p.evaluate(()=>document.activeElement.blur());await p.keyboard.press('ArrowRight');await p.waitForTimeout(100);assert.equal(await page(),1);await p.keyboard.press('ArrowLeft');await p.waitForTimeout(100);assert.equal(await page(),0);
 await p.evaluate(()=>ContentColumns.open('changelog'));await p.keyboard.press('ArrowRight');assert.equal(await page(),0);await p.keyboard.press('Escape');
 await p.evaluate(()=>{const n=document.createElement('input');n.id='navigation-typing-test';document.body.append(n);n.focus();});await p.keyboard.press('ArrowRight');assert.equal(await page(),0);await p.evaluate(()=>document.getElementById('navigation-typing-test').remove());
 // A real long scroll reaches the bottom without turning; continuing it still cannot turn.
 await p.evaluate(()=>{document.querySelector('.content-fixed-column>:first-child').style.minHeight='2400px';});await p.waitForTimeout(100);
 await p.mouse.move(800,600);await p.mouse.wheel(0,6000);await p.waitForTimeout(100);assert.equal(await page(),0);
 assert.ok(await p.locator('.content-fixed-column').evaluate(n=>n.scrollTop+n.clientHeight>=n.scrollHeight-2));
 for(let i=0;i<5;i++){await p.mouse.wheel(0,200);await p.waitForTimeout(75);assert.equal(await page(),0);}
 await p.waitForTimeout(520);await p.mouse.wheel(0,120);await p.waitForTimeout(100);assert.equal(await page(),1);
 for(let i=0;i<3;i++){await p.mouse.wheel(0,120);await p.waitForTimeout(60);assert.equal(await page(),1);}
 // Moving away from the bottom cancels the armed next-page action.
 await p.evaluate(()=>{const n=document.querySelector('.content-fixed-column');n.firstElementChild.style.minHeight='2400px';n.scrollTop=n.scrollHeight;});await p.waitForTimeout(100);await p.mouse.wheel(0,100);await p.waitForTimeout(520);await p.mouse.wheel(0,-200);await p.waitForTimeout(80);await p.mouse.wheel(0,100);await p.waitForTimeout(80);assert.equal(await page(),1);
 // Upward scrolling follows the same pause-and-repeat protection.
 await p.mouse.wheel(0,-6000);await p.waitForTimeout(100);assert.equal(await page(),1);
 assert.ok(await p.locator('.content-fixed-column').evaluate(n=>n.scrollTop<=2));
 for(let i=0;i<5;i++){await p.mouse.wheel(0,-200);await p.waitForTimeout(75);assert.equal(await page(),1);}
 await p.waitForTimeout(520);await p.mouse.wheel(0,-120);await p.waitForTimeout(100);assert.equal(await page(),0);
 for(let i=0;i<3;i++){await p.mouse.wheel(0,-120);await p.waitForTimeout(60);assert.equal(await page(),0);}
 await p.waitForTimeout(520);await p.mouse.wheel(0,-120);await p.waitForTimeout(100);assert.equal(await page(),0);
 await p.locator('.content-single-dots button').first().click();await p.waitForTimeout(150);await p.screenshot({path:path.join(process.cwd(),'dev/output/single-panel-top-navigation.png')});
 await p.setViewportSize({width:390,height:844});await p.waitForTimeout(180);const mobile=await p.evaluate(()=>{const col=document.querySelector('.content-fixed-column').getBoundingClientRect(),arrow=document.querySelector('.content-single-arrow.next').getBoundingClientRect();return {right:col.right,arrow:arrow.left}});assert.ok(mobile.arrow>=mobile.right);await p.screenshot({path:path.join(process.cwd(),'dev/output/single-panel-top-navigation-mobile.png')});
 await p.goto(url('index'));await p.waitForTimeout(600);await p.evaluate(()=>document.activeElement.blur());await p.keyboard.press('ArrowRight');await p.waitForTimeout(150);assert.equal(await p.locator('[data-home-target][aria-current=true]').getAttribute('data-home-target'),'features');await p.keyboard.press('ArrowLeft');await p.waitForTimeout(150);assert.equal(await p.locator('[data-home-target][aria-current=true]').getAttribute('data-home-target'),'welcome');
 assert.deepEqual(errors,[]);console.log('PASS top dots, symmetric arrows, document keyboard shortcuts, typing/dialog guards, wheel gesture protection, mobile layout and homepage keys');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});
