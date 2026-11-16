const path=require('path'),assert=require('node:assert/strict');
const {chromium}=require(path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
(async()=>{const b=await chromium.launch({channel:'chrome',headless:true});try{const p=await b.newPage({viewport:{width:1600,height:950}}),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.addInitScript(()=>localStorage.setItem('GM_Changelog_Line_Limit','150'));await p.goto(require('url').pathToFileURL(path.join(process.cwd(),'changelog.html')).href);await p.waitForTimeout(450);
 const expected=await p.evaluate(()=>CHANGELOG_ZH.map(x=>x.version));
 assert.ok(await p.evaluate(()=>document.querySelectorAll('.log-card').length<CHANGELOG_ZH.length));
 assert.ok(await p.locator('#pagination-controls').isVisible());
 await p.evaluate(()=>ContentColumns.set('changelog','columns','3'));await p.waitForTimeout(200);
 assert.ok(await p.evaluate(()=>document.getElementById('pagination-controls').getBoundingClientRect().bottom<=document.querySelector('.content-flow-viewport').getBoundingClientRect().top));
 assert.ok(await p.locator('#pagination-controls-bottom').isVisible());assert.equal(await p.locator('#pagination-tip').count(),0);
 assert.ok(await p.evaluate(()=>document.getElementById('pagination-controls-bottom').getBoundingClientRect().bottom<=innerHeight));
 const batchButtons=p.locator('#pagination-controls-bottom button');await batchButtons.nth(await batchButtons.count()-2).click();await p.waitForTimeout(150);
 assert.equal(await p.locator('#pagination-controls .active').textContent(),await p.locator('#pagination-controls-bottom .active').textContent());
 assert.ok(await p.evaluate(v=>[...document.querySelectorAll('.content-flow-stream .log-card')].some(n=>n.dataset.version===v),expected.at(-1)));

 await p.evaluate(()=>ContentColumns.set('changelog','browsing','single'));await p.waitForTimeout(250);
 assert.equal(await p.locator('.content-single-dots button').count(),expected.length);assert.deepEqual(await p.evaluate(()=>[...document.querySelectorAll('.content-fixed-grid .log-card')].map(n=>n.dataset.version).sort()),[...expected].sort());
 await p.locator('.content-single-dots button').last().click();await p.waitForTimeout(100);assert.equal(await p.locator('.content-fixed-column .log-card').getAttribute('data-version'),expected.at(-1));assert.equal(await p.locator('.ver-part-badge').count(),0);
 await p.evaluate(()=>{ContentColumns.set('changelog','browsing','pages');ContentColumns.set('changelog','pageSize','3');ContentColumns.set('changelog','columns','2');ContentColumns.set('changelog','arrangement','row');});await p.waitForTimeout(200);
 assert.ok(await p.locator('#pagination-controls').isHidden());assert.ok(await p.locator('#pagination-controls-bottom').isHidden());assert.equal(await p.evaluate(()=>localStorage.getItem('GM_Changelog_Line_Limit')),'150');
 const total=Math.ceil(expected.length/3);assert.equal(await p.locator('.content-single-dots button').count(),total);assert.equal(await p.locator('.content-fixed-pager').count(),0);
 await p.locator('.content-single-dots button').last().click();await p.waitForTimeout(100);assert.ok(await p.locator('.content-single-arrow.next').isDisabled());assert.ok(await p.locator('.content-fixed-column .log-card').evaluateAll((nodes,v)=>nodes.some(n=>n.dataset.version===v),expected.at(-1)));
 await p.keyboard.press('ArrowLeft');await p.waitForTimeout(100);assert.equal(await p.locator('.content-single-nav').getAttribute('data-index'),String(total-2));
 await p.evaluate(v=>jumpToVersion(v),expected.at(-1));await p.waitForTimeout(150);assert.equal(await p.locator('.content-single-nav').getAttribute('data-index'),String(total-1));
 await p.locator('.content-single-dots button').first().click();await p.waitForTimeout(120);await p.evaluate(()=>document.querySelectorAll('.content-fixed-column').forEach(n=>n.scrollTop=n.scrollHeight));await p.waitForTimeout(120);
 await p.mouse.move(800,600);await p.mouse.wheel(0,150);await p.waitForTimeout(100);for(let i=0;i<4;i++){await p.mouse.wheel(0,150);await p.waitForTimeout(75);assert.equal(await p.locator('.content-single-nav').getAttribute('data-index'),'0');}
 await p.waitForTimeout(520);await p.mouse.wheel(0,150);await p.waitForTimeout(120);assert.equal(await p.locator('.content-single-nav').getAttribute('data-index'),'1');
 await p.evaluate(()=>document.querySelectorAll('.content-fixed-column').forEach(n=>n.scrollTop=0));await p.waitForTimeout(100);await p.mouse.wheel(0,-150);await p.waitForTimeout(100);assert.equal(await p.locator('.content-single-nav').getAttribute('data-index'),'1');await p.waitForTimeout(520);await p.mouse.wheel(0,-150);await p.waitForTimeout(120);assert.equal(await p.locator('.content-single-nav').getAttribute('data-index'),'0');
 await p.screenshot({path:path.join(process.cwd(),'dev/output/changelog-multi-item-navigation.png')});assert.deepEqual(errors,[]);console.log('PASS all '+expected.length+' versions, ignored legacy line cap, last version access, multi-item arrows/dots/keyboard, jumps and bidirectional wheel protection');
}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1});
