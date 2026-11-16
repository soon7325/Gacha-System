const assert=require('node:assert/strict'),path=require('path');
let playwright;try{playwright=require('playwright');}catch{playwright=require(path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));}
const root=path.resolve(__dirname,'../..');
(async()=>{const browser=await playwright.chromium.launch({channel:'chrome',headless:true});try{
 const context=await browser.newContext({viewport:{width:2559,height:1310}});
 await context.addInitScript(()=>{if(localStorage.getItem('ordinal_seeded'))return;localStorage.setItem('GM_Lang','zh');localStorage.setItem('GM_Data_hsr_char_up',JSON.stringify([...Array.from({length:80},(_,i)=>({tierId:'tier_5',name:'流萤',isLost:false,...(i===1?{isFree:true,pullType:'free_nopity',countPity:false}:{})})),...Array.from({length:40},()=>({tierId:'tier_3',name:'副产物'}))]));localStorage.setItem('ordinal_seeded','yes');});
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 const url=page=>require('node:url').pathToFileURL(path.join(root,page+'.html')).href+'?gameId=hsr&pool=char_up';
 await page.goto(url('dashboard'));await page.waitForSelector('.char-row[data-gold-ordinal]');
 const row=page.locator('.char-row[data-gold-ordinal="80"]'),icon=row.locator('.char-icon'),label=row.locator('.gold-ordinal');
 assert.equal(await page.evaluate(()=>GoldOrdinal.read()),'hover');assert.equal(await page.locator('.char-row[data-gold-ordinal]').count(),80);
 assert.equal(await label.textContent(),'#80');assert.equal(await page.locator('.char-row[data-gold-ordinal="1"] .gold-ordinal').textContent(),'#1');
 assert.equal(await page.locator('.char-row[data-gold-ordinal="2"] .gold-ordinal').textContent(),'#2');
 const originalRecords=await page.evaluate(()=>JSON.stringify(readDashboardRecords()));const x=(await icon.boundingBox()).x;assert.equal(await label.isVisible(),false);
 await icon.hover();assert.equal(await label.isVisible(),true);assert.equal((await icon.boundingBox()).x,x);
 await page.mouse.move(650,150);assert.equal(await label.isVisible(),false);
 await icon.click();await page.mouse.move(650,150);assert.equal(await label.isVisible(),true);assert.equal(await icon.getAttribute('aria-pressed'),'true');
 await icon.click();await page.mouse.move(650,150);assert.equal(await label.isVisible(),false);
 await page.evaluate(()=>GoldOrdinal.set('hide'));await icon.hover();assert.equal(await label.isVisible(),false);assert.equal(await icon.getAttribute('title'),'');
 await page.evaluate(()=>GoldOrdinal.set('show'));await page.mouse.move(650,150);assert.equal(await label.isVisible(),true);
 await page.evaluate(()=>GoldOrdinal.set('click'));await icon.hover();assert.equal(await label.isVisible(),false);await icon.click();await page.mouse.move(650,150);assert.equal(await label.isVisible(),true);
 await icon.focus();await icon.press('Enter');await page.mouse.move(650,150);assert.equal(await label.isVisible(),false);
 // 编号模式变化只改显示，保留原始抽卡记录。
 const records=await page.evaluate(()=>JSON.stringify(readDashboardRecords()));assert.equal(JSON.parse(records).length,120);assert.equal(records,originalRecords);
 await page.evaluate(()=>{GoldOrdinal.set('show');ContentColumns.set('dashboard','columns','3');});await page.waitForTimeout(250);
 await page.screenshot({path:path.join(root,'dev/output/gold-ordinal-preview.png')});
 // 第二列的头像可以固定序号，且镜像不会增加业务 DOM 中的金数。
 await page.evaluate(()=>GoldOrdinal.set('hover'));await page.waitForTimeout(100);
 const target=await page.evaluate(()=>{const lane=document.querySelectorAll('.content-flow-lane')[1],root=lane.querySelector('.content-flow-mirror').shadowRoot;for(const icon of root.querySelectorAll('.char-row[data-gold-ordinal] .char-icon')){const r=icon.getBoundingClientRect(),v=lane.getBoundingClientRect();if(r.top>v.top+10&&r.bottom<v.bottom-10)return{x:r.x+r.width/2,y:r.y+r.height/2};}});
 assert.ok(target);await page.mouse.click(target.x,target.y);await page.mouse.move(650,150);await page.waitForTimeout(100);assert.equal(await page.evaluate(()=>document.querySelectorAll('.char-row[data-gold-ordinal-pinned="true"]').length),1);assert.equal(await page.evaluate(()=>document.querySelectorAll('.char-row[data-gold-ordinal]').length),80);
 await page.evaluate(()=>renderDashboard());await page.waitForTimeout(100);assert.equal(await page.evaluate(()=>document.querySelectorAll('.char-row[data-gold-ordinal-pinned="true"]').length),1);
 // 存在初始历史10金时，3条后续记录应编号#11到#13。
 await page.evaluate(()=>{
  const state=GachaEngine.createState(1);state.total=100;state.goldCount=10;
  const records=Array.from({length:3},()=>({tierId:'tier_5',name:'流萤',isLost:false}));
  const row={id:'ordinal-base',name:'历史测试',purpose:'record',pools:{char_up:state},balances:{},owned:{},recordInitial:{char_up:state},recordStats:{char_up:{gold:10,up:10}},dashboardRecords:{char_up:{records}}};
  UserDataProfiles.save('hsr',row,UserDataProfiles.read('hsr').revision);localStorage.setItem('GM_Player_Data_Mode','multi');GoldOrdinal.set('show');
 });
 await page.goto(url('dashboard')+'&account=ordinal-base');await page.waitForSelector('.char-row[data-gold-ordinal="13"]');assert.equal(await page.evaluate(()=>document.querySelectorAll('.char-row[data-gold-ordinal]').length),3);assert.ok(await page.evaluate(()=>document.querySelector('.char-row[data-gold-ordinal="11"]')));assert.equal(await page.locator('#res-gold-count').textContent(),'13');
 // 设置页回显、实际下拉操作及刷新保留。
 await page.goto(url('settings'));await page.locator('[data-content-columns-page=dashboard]').click();await page.waitForSelector('#goldOrdinalSelect + .custom-select-ui button');
 assert.equal(await page.locator('#goldOrdinalSelect').inputValue(),'show');await page.locator('#goldOrdinalSelect + .custom-select-ui button').click();await page.locator('.custom-select-floating .custom-select-ui-item[data-val="click"]').click();assert.equal(await page.evaluate(()=>GoldOrdinal.read()),'click');
 await page.reload();await page.locator('[data-content-columns-page=dashboard]').click();assert.equal(await page.locator('#goldOrdinalSelect').inputValue(),'click');assert.deepEqual(errors,[]);
 console.log('PASS: chronological #1–#80, free gold included, hover leave, click pin/unpin, keyboard, no avatar jump, hide/show, multi-column interaction, unchanged records and saved settings.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});


