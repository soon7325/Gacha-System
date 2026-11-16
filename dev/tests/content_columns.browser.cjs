const path=require('path'),assert=require('node:assert/strict');
let playwright;try{playwright=require('playwright');}catch{playwright=require(path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));}
const root=path.resolve(__dirname,'../..');
(async()=>{const browser=await playwright.chromium.launch({channel:'chrome',headless:true});try{
 const page=await browser.newPage({viewport:{width:2559,height:1310}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 const url=game=>require('node:url').pathToFileURL(path.join(root,'pool_setup.html')).href+'?gameId='+game+'&pool=char_up';
 await page.goto(url('hsr'));await page.waitForTimeout(600);
 const snapshot=()=>page.evaluate(()=>{
  const stream=document.querySelector('.content-flow-stream'),rect=stream.getBoundingClientRect();
  return {mode:document.documentElement.dataset.contentFlow,sourceHeight:rect.height,inputs:document.querySelectorAll('input').length,live:Number(document.querySelector('.content-flow-lane[data-live=true]').dataset.index||[...document.querySelectorAll('.content-flow-lane')].indexOf(stream.parentElement)),
   lanes:[...document.querySelectorAll('.content-flow-lane')].filter(n=>!n.hidden).map(n=>{const r=n.getBoundingClientRect(),copy=n.querySelector('.content-flow-mirror').shadowRoot.querySelector('.content-flow-stream');return{top:r.top,bottom:r.bottom,height:r.height,width:r.width,x:r.x,mirrorHeight:copy?.getBoundingClientRect().height,offset:parseFloat(n.querySelector('.content-flow-mirror').shadowRoot.querySelector('div[style]').style.top)||0};}),sourceTop:parseFloat(stream.style.top)||0};
 });
 let state=await snapshot();assert.equal(state.lanes.length,3);assert.ok(state.lanes[0].width>780);
 for(let index=0;index<3;index++){const lane=state.lanes[index];assert.ok(Math.abs(lane.height-state.lanes[0].height)<.1);assert.equal(lane.bottom,1298);if(index)assert.ok(Math.abs(lane.mirrorHeight-state.sourceHeight)<.1,'mirror must match the complete original layout');assert.ok(Math.abs(lane.offset+index*lane.height)<.02,'adjacent windows must have no missing or repeated pixels');}
 const initialInputs=state.inputs;
 await page.mouse.move(110,500);await page.mouse.wheel(0,280);await page.waitForTimeout(100);assert.equal((await snapshot()).sourceTop,-280);
 await page.screenshot({path:path.join(root,'dev/output/continuous-columns-pixel-fill-scrolled.png')});
 // 整体滚动条与滚轮双向同步，并可用鼠标实际拖动滑块微调。
 const progress=page.locator('.content-flow-progress');
 let rail=await progress.evaluate(n=>({top:parseFloat(n.firstElementChild.style.top),max:n.clientHeight-n.firstElementChild.getBoundingClientRect().height,height:n.clientHeight,thumb:n.firstElementChild.getBoundingClientRect().height,value:Number(n.getAttribute('aria-valuenow'))}));
 assert.ok(rail.top>0);assert.equal(rail.value,280);
 await progress.focus();await progress.press('Home');await page.waitForTimeout(100);assert.equal((await snapshot()).sourceTop,0);
 const box=await progress.boundingBox(),thumb=rail.thumb;
 await page.mouse.move(box.x+box.width/2,box.y+thumb/2);await page.mouse.down();
 await page.mouse.move(box.x+box.width/2,box.y+thumb/2+(rail.height-thumb)*.45,{steps:12});await page.mouse.up();await page.waitForTimeout(150);
 rail=await progress.evaluate(n=>({top:parseFloat(n.firstElementChild.style.top),max:n.clientHeight-n.firstElementChild.getBoundingClientRect().height,value:Number(n.getAttribute('aria-valuenow'))}));
 assert.ok(rail.top/rail.max>.35&&rail.top/rail.max<.55,'thumb drag adjusts overall progress');
 assert.ok(Math.abs(-(await snapshot()).sourceTop-rail.value)<1);
 await progress.press('End');await page.waitForTimeout(100);assert.equal(await progress.getAttribute('aria-valuetext'),'100%');
 await progress.press('Home');await page.waitForTimeout(100);assert.equal((await snapshot()).sourceTop,0);
 // 鼠标进入第二、三列后，操作的是原表单；镜像不增加业务查询到的输入数量。
 for(const [index,x] of [[1,1100],[2,1900],[0,110]]){await page.mouse.move(x,500);await page.waitForTimeout(50);state=await snapshot();assert.equal(state.live,index);assert.equal(state.inputs,initialInputs);assert.ok(Math.abs(state.sourceHeight-state.lanes[(index+1)%3].mirrorHeight)<.1);}
 await page.mouse.wheel(0,-100000);await page.waitForTimeout(100);assert.equal((await snapshot()).sourceTop,0);
 // 实际点击镜像里第二项的标题，会先定位原表单，再运行原折叠函数。
 const header=await page.evaluate(()=>{const lane=document.querySelectorAll('.content-flow-lane')[1],node=lane.querySelector('.content-flow-mirror').shadowRoot.getElementById('card-section-1').firstElementChild,r=node.getBoundingClientRect();return{x:r.x+50,y:r.y+10};});
 assert.ok(header.y>state.lanes[1].top&&header.y<state.lanes[1].bottom);await page.mouse.click(header.x,header.y);await page.waitForTimeout(100);assert.equal(await page.evaluate(()=>getComputedStyle(document.getElementById('card-1-body')).display),'none');
 await page.mouse.click(header.x,header.y);await page.waitForTimeout(100);assert.notEqual(await page.evaluate(()=>getComputedStyle(document.getElementById('card-1-body')).display),'none');
 // 自定义规则中的真实输入可修改，切换窗口与单列都保留未保存值。
 await page.evaluate(()=>{localStorage.setItem('GM_Info_pixel_preview',JSON.stringify({gameName:'分栏测试',mixedPools:[{id:'char_up',name:'测试',icon:'🎯'}]}));localStorage.setItem('GM_Catalog_pixel_preview',JSON.stringify({char:[],wep:[]}));});
 await page.goto(url('pixel_preview'));await page.waitForTimeout(500);
 await page.evaluate(()=>{const input=document.getElementById('input-rescue-tag');document.getElementById('card-3-body').style.display='block';document.getElementById('rescue-settings-panel').style.display='block';input.focus();});
 await page.waitForTimeout(100);await page.locator('.content-flow-lane[data-live=true] > .content-flow-stream #input-rescue-tag').fill('保留草稿');await page.mouse.move(1800,600);await page.mouse.move(1100,600);assert.equal(await page.evaluate(()=>document.getElementById('input-rescue-tag').value),'保留草稿');
 await page.evaluate(()=>ContentColumns.set('pool_setup','columns','1'));await page.waitForTimeout(100);assert.equal((await snapshot()).mode,'single');assert.equal(await page.evaluate(()=>document.getElementById('input-rescue-tag').value),'保留草稿');
 await page.evaluate(()=>ContentColumns.set('pool_setup','columns','auto'));await page.waitForTimeout(100);await page.setViewportSize({width:1700,height:1000});await page.waitForTimeout(100);assert.equal((await snapshot()).lanes.length,2);
 await page.setViewportSize({width:1000,height:800});await page.waitForTimeout(100);assert.equal((await snapshot()).mode,'single');assert.deepEqual(errors,[]);
 console.log('PASS: pixel-contiguous windows, equal mirror geometry, real wheel scrolling, original folding handlers in other columns, unique form, unsaved values, and responsive layouts.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});



