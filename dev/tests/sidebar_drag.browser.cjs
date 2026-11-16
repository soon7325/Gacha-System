const assert=require('node:assert/strict'),path=require('node:path'),{pathToFileURL}=require('node:url');
const {chromium}=require(path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
const root=path.resolve(__dirname,'../..');
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});try{
    const page=await browser.newPage({viewport:{width:1200,height:950},reducedMotion:'reduce'}),errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(pathToFileURL(path.join(root,'settings.html')).href);
    async function reset(pools=false){await page.evaluate(expanded=>{
        const games=[{id:'g_a',name:'游戏甲'},{id:'zzz',name:'隐藏预设'},{id:'g_b',name:'游戏乙'},{id:'g_c',name:'游戏丙'},{id:'hsr'},{id:'end'},{id:'ark'}];
        localStorage.setItem('GM_Custom_Games_List',JSON.stringify(games));localStorage.setItem('GM_Show_Preset_zzz','false');localStorage.setItem('GM_Sidebar_Collapsed','false');localStorage.setItem('GM_Collapse_State',JSON.stringify(expanded?{g_a:false,g_b:false}:{}));
        for(const game of games.filter(g=>g.id.startsWith('g_'))){localStorage.setItem('GM_Info_'+game.id,JSON.stringify({gameName:game.name}));localStorage.setItem('GM_RosterPools_'+game.id,JSON.stringify(['a','b','c'].map(id=>({id,name:'卡池'+id,type:'up',isStandalone:true}))));localStorage.removeItem('GM_Pool_Order_'+game.id);}
        renderSidebar();
    },pools);}
    async function event(kind,from,to,before,type){return page.evaluate(({kind,from,to,before,type})=>{
        const group=id=>[...document.querySelectorAll('.sidebar-group-wrapper')].find(g=>[...g.querySelectorAll('a[href]')].some(a=>new URL(a.href).searchParams.get('gameId')===id));
        const source=kind==='game'?group(from):group('g_a').querySelector(`[data-pool-id="${from}"]`);
        const target=kind==='game'?group(to):group('g_a').querySelector(`[data-pool-id="${to}"]`);
        if(type==='start'){(kind==='game'?source.querySelector('.sidebar-group-header'):source).dispatchEvent(new DragEvent('dragstart',{bubbles:true,cancelable:true,dataTransfer:new DataTransfer()}));return;}
        const rect=target.getBoundingClientRect(),y=rect.top+rect.height*(before?.2:.8);
        target.dispatchEvent(new DragEvent(type,{bubbles:true,cancelable:true,clientY:y,dataTransfer:new DataTransfer()}));
        if(type==='dragover'){const after=target.getBoundingClientRect();return {top:target.classList.contains('drag-over-top'),bottom:target.classList.contains('drag-over-bottom'),shadow:getComputedStyle(target).boxShadow,height:rect.height,nextHeight:after.height};}
    },{kind,from,to,before,type});}
    for(const [from,to,before,expected]of [['g_a','g_b',true,['g_a','g_b','g_c']],['g_a','g_b',false,['g_b','g_a','g_c']],['g_c','g_a',true,['g_c','g_a','g_b']],['g_c','g_a',false,['g_a','g_c','g_b']]]){
        await reset();await event('game',from,to,before,'start');
        const highlight=await event('game',from,to,before,'dragover');assert.equal(highlight.top,before);assert.equal(highlight.bottom,!before);assert.equal(highlight.height,highlight.nextHeight);assert.ok(highlight.shadow.includes(before?'5px':'-5px'));
        const flip=await event('game',from,to,!before,'dragover');assert.equal(flip.top,!before);assert.equal(flip.bottom,before);
        await event('game',from,to,before,'dragover');if(from==='g_a'&&!before)await page.screenshot({path:path.join(root,'dev/output/sidebar-drag-below.png')});
        await event('game',from,to,before,'drop');
        const order=await page.evaluate(()=>JSON.parse(localStorage.getItem('GM_Custom_Games_List')).map(g=>g.id));assert.deepEqual(order.filter(id=>id.startsWith('g_')),expected);assert.equal(order[1],'zzz');assert.equal(await page.locator('.sidebar .drag-over-top,.sidebar .drag-over-bottom').count(),0);
    }
    for(const [from,to,before,expected]of [['a','b',true,['a','b','c']],['a','b',false,['b','a','c']],['c','a',true,['c','a','b']],['c','a',false,['a','c','b']]]){
        await reset(true);await event('pool',from,to,before,'start');const h=await event('pool',from,to,before,'dragover');assert.equal(h.top,before);assert.equal(h.bottom,!before);assert.equal(h.height,h.nextHeight);
        if(before)await page.screenshot({path:path.join(root,'dev/output/sidebar-pool-drag-above.png')});
        await event('pool',from,to,before,'drop');assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('GM_Pool_Order_g_a'))),expected);
        assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('GM_RosterPools_g_a')).map(p=>p.id)),expected);
        await page.reload();assert.deepEqual(await page.locator('.sidebar-item[href*="gameId=g_a"][data-pool-id]').evaluateAll(nodes=>nodes.map(n=>n.dataset.poolId)),expected);
    }
    await reset(true);await event('pool','a','b',true,'start');await event('pool','a','b',true,'dragover');
    await page.evaluate(()=>document.querySelector('.sidebar-item[href*="gameId=g_a"][data-pool-id="a"]').dispatchEvent(new DragEvent('dragend',{bubbles:true})));assert.equal(await page.locator('.sidebar .drag-over-top,.sidebar .drag-over-bottom').count(),0);
    await page.evaluate(()=>{localStorage.setItem('GM_Theme','light');document.documentElement.dataset.theme='light';});await event('pool','a','b',false,'start');assert.ok((await event('pool','a','b',false,'dragover')).shadow.includes('-5px'));assert.deepEqual(errors,[]);
    console.log('PASS: sidebar game/pool upper/lower highlight matches actual insertion in both movement directions; stable geometry, hidden games retained, saved order/reload and cancellation cleanup.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
