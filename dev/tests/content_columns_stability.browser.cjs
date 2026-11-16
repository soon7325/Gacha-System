const path=require('path'),assert=require('node:assert/strict');
let playwright;try{playwright=require('playwright');}catch{playwright=require(path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));}
const root=path.resolve(__dirname,'../..');
(async()=>{const browser=await playwright.chromium.launch({channel:'chrome',headless:true});try{
 const page=await browser.newPage({viewport:{width:2559,height:1310}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{if(localStorage.getItem('stability_seeded'))return;localStorage.setItem('GM_Data_hsr_char_up',JSON.stringify(Array.from({length:80},()=>({tierId:'tier_5',name:'流萤'}))));localStorage.setItem('stability_seeded','1');});
 const url=name=>require('node:url').pathToFileURL(path.join(root,name+'.html')).href+'?gameId=hsr&pool=char_up';
 const settle=()=>page.waitForTimeout(100);
 async function watch(){await page.evaluate(()=>{
  window.imageWatch=[...document.querySelectorAll('.content-flow-mirror')].map(host=>({host,root:host.shadowRoot.querySelector('html'),images:[...host.shadowRoot.querySelectorAll('img')]}));
 });}
 async function stable(action){await settle();const result=await page.evaluate(()=>imageWatch.map(w=>({sameRoot:w.root===w.host.shadowRoot.querySelector('html'),lost:w.images.filter(img=>!img.isConnected||!w.root.contains(img)).length,total:w.images.length})));for(const lane of result){assert.equal(lane.sameRoot,true,action+': keep mirror root');assert.equal(lane.lost,0,action+': keep existing images');assert.ok(lane.total>0);}return result;}
 await page.goto(url('dashboard'));await page.waitForSelector('.char-row[data-gold-ordinal]');await page.evaluate(()=>ContentColumns.set('dashboard','columns','3'));await settle();await watch();
 const icon=page.locator('.content-flow-lane[data-live=true] > .content-flow-stream .char-row[data-gold-ordinal] .char-icon').first();
 await icon.click();await stable('pin ordinal');await icon.click();await stable('unpin ordinal');
 await icon.hover();await page.mouse.move(650,140);await stable('hover leave');
 for(const x of [1100,1850,110]){await page.mouse.move(x,500);await stable('switch active column');}
 await page.mouse.wheel(0,180);await stable('mouse wheel');
 const rail=page.locator('.content-flow-progress'),box=await rail.boundingBox();await page.mouse.click(box.x+box.width/2,box.y+box.height*.8);await stable('seek global progress');
 await page.evaluate(()=>GoldOrdinal.set('show'));await stable('ordinal mode');
 await page.evaluate(()=>GoldOrdinal.refresh());await stable('unchanged preference refresh');
 await page.evaluate(()=>{document.documentElement.dataset.theme='light';});await stable('theme switch');
 await page.evaluate(()=>{document.documentElement.dataset.theme='dark';});await stable('theme restore');
 await page.evaluate(()=>renderDashboard());await stable('rerender same records');
 // 真正新增/删除内容只增减对应节点，已有头像应保留。
 await page.evaluate(()=>{const source=document.querySelector('.content-flow-stream #list-wrap'),row=source.querySelector('.char-row').cloneNode(true);row.id='stability-extra-row';row.dataset.goldOrdinalIdentity='extra';source.append(row);});await stable('append row');
 await page.evaluate(()=>document.getElementById('stability-extra-row').remove());await stable('remove row');
 await page.setViewportSize({width:2500,height:1280});await stable('resize without changing column count');
 await page.goto(url('gallery_setup'));await page.waitForSelector('.char-card');await page.evaluate(()=>ContentColumns.set('gallery_setup','columns','3'));await settle();await watch();
 await page.evaluate(()=>toggleMasterSettingsAccordion());await stable('expand gallery settings');await page.evaluate(()=>toggleMasterSettingsAccordion());await stable('collapse gallery settings');
 // 属性与表单当前值都能局部同步，且不重建图鉴图片。
 await page.evaluate(()=>{const input=document.getElementById('input-game-name');input.value='同步测试';input.dispatchEvent(new Event('input',{bubbles:true}));});await stable('input value');
 assert.equal(await page.evaluate(()=>[...document.querySelectorAll('.content-flow-mirror')].every(host=>host.shadowRoot.getElementById('input-game-name').value==='同步测试')),true);
 const nested=await page.evaluate(()=>{const div=document.createElement('div');div.id='stability-inner-scroll';div.style.cssText='height:60px;overflow:auto';div.innerHTML='<div style="height:500px">测试</div>';document.querySelector('.content-flow-stream').append(div);return true;});
 await stable('add nested list');await page.evaluate(()=>{const div=document.getElementById('stability-inner-scroll');div.scrollTop=120;div.dispatchEvent(new Event('scroll'));});await stable('nested scrolling');
 assert.ok(await page.evaluate(()=>[...document.querySelectorAll('.content-flow-lane:not([data-live="true"]) .content-flow-mirror')].every(host=>host.shadowRoot.getElementById('stability-inner-scroll').scrollTop===120)));
 await page.mouse.move(1100,500);await stable('handoff after nested scroll');assert.ok(await page.evaluate(()=>[...document.querySelectorAll('.content-flow-lane:not([data-live="true"]) .content-flow-mirror')].every(host=>host.shadowRoot.getElementById('stability-inner-scroll').scrollTop===120)));// 图鉴真实筛选会移除不匹配条目，保留下来的物品图片仍应复用。
 await page.evaluate(()=>{window.cardImages=[...document.querySelectorAll('.content-flow-mirror')].map(host=>new Map([...host.shadowRoot.querySelectorAll('.char-card[data-content-key]')].map(card=>[card.dataset.contentKey,card.querySelector('img')])));setTierFilter('char_tier_5','up');});await settle();
 assert.ok(await page.evaluate(()=>[...document.querySelectorAll('.content-flow-mirror')].every((host,index)=>[...host.shadowRoot.querySelectorAll('.char-card[data-content-key]')].every(card=>!card.querySelector('img')||cardImages[index].get(card.dataset.contentKey)===card.querySelector('img')))),'retained gallery items keep their images after filtering');
 assert.deepEqual(errors,[]);console.log('PASS: pin/unpin, hover, column handoff, wheel, progress seek, mode/theme, same-data render, structural changes, resize, folding, input and nested scrolling retain existing mirror roots and image nodes.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
