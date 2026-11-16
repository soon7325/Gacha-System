const assert=require('node:assert/strict'),path=require('node:path'),{pathToFileURL}=require('node:url');
const {chromium}=require(path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
const root=path.resolve(__dirname,'../..'),settings=pathToFileURL(path.join(root,'settings.html')).href;
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});try{
    const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(settings);await page.evaluate(()=>{
        const games=JSON.parse(localStorage.getItem('GM_Custom_Games_List')||'[]');games.push({id:'g_icons',name:'图标演示'});localStorage.setItem('GM_Custom_Games_List',JSON.stringify(games));
        localStorage.setItem('GM_Info_g_icons',JSON.stringify({gameName:'图标演示',enGameName:'Icon demo',icon:'img/ARK/icon/game_icon.webp',mixedPools:[{id:'mixed',name:'混合池',en:'Mixed pool',icon:'🔀'}]}));
        localStorage.setItem('GM_RosterPools_g_icons',JSON.stringify([{id:'image',name:'图片卡池',en:'Image pool',icon:'img/HSR/icon/game_icon.webp',isStandalone:true},{id:'emoji',name:'✨ 自定义图标池',en:'✨ Custom icon pool',icon:'🎯',isStandalone:true}]));
        localStorage.setItem('GM_Start_Page','dashboard.html?gameId=g_icons&pool=image');initPrefs();
    });
    const summary=page.locator('#start-page-picker-button');assert.equal(await summary.locator('img').count(),2);
    await summary.click();
    const custom=()=>page.locator('.start-page-options fieldset').filter({has:page.locator('legend',{hasText:'图标演示'})});
    assert.equal(await custom().locator('legend img').getAttribute('src'),'img/ARK/icon/game_icon.webp');
    assert.equal(await custom().locator('label').filter({hasText:'玩家数据'}).count(),1);
    assert.equal(await custom().locator('label').filter({hasText:'图片卡池'}).locator('img').getAttribute('src'),'img/HSR/icon/game_icon.webp');
    assert.equal(await custom().locator('label').filter({hasText:'自定义图标池'}).locator('.start-page-icon').textContent(),'🎯');
    assert.equal(await custom().locator('label').filter({hasText:'自定义图标池'}).locator('.start-page-text').textContent(),'✨ 自定义图标池');
    // Official labels use the same current image/Emoji as the sidebar, rather than pool-type defaults.
    assert.equal(await page.locator('.start-page-options legend img[src="img/HSR/icon/game_icon.webp"]').count(),1);
    const official=page.locator('.start-page-options label').filter({has:page.locator('input[value="dashboard.html?gameId=hsr&pool=wep_up"]')});
    assert.equal(await official.locator('.start-page-icon').textContent(),await page.locator('.sidebar a[href*="gameId=hsr"][href*="pool=wep_up"] .sidebar-item-icon').textContent());
    await custom().locator('label').filter({hasText:'自定义图标池'}).click();await page.locator('.start-page-actions .btn-action-gray').click();
    assert.ok((await page.evaluate(()=>localStorage.getItem('GM_Start_Page'))).endsWith('pool=image'));
    await summary.click();await custom().locator('label').filter({hasText:'自定义图标池'}).click();await page.locator('.start-page-actions .btn-primary').click();
    assert.equal(await summary.locator('.start-page-icon').last().textContent(),'🎯');
    assert.equal(await summary.locator('img').count(),1);
    // Reopen reads newly selected Emoji and uploaded image strings without reloading Settings.
    const uploaded='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j6ioAAAAASUVORK5CYII=';
    await page.evaluate(data=>{const info=JSON.parse(localStorage.getItem('GM_Info_g_icons'));info.icon='🛰️';localStorage.setItem('GM_Info_g_icons',JSON.stringify(info));const pools=JSON.parse(localStorage.getItem('GM_RosterPools_g_icons'));pools[1].icon=data;localStorage.setItem('GM_RosterPools_g_icons',JSON.stringify(pools));},uploaded);
    await summary.click();assert.equal(await custom().locator('legend .start-page-icon').textContent(),'🛰️');
    assert.equal(await custom().locator('label').filter({hasText:'自定义图标池'}).locator('img').getAttribute('src'),uploaded);
    assert.equal(await summary.locator('img').getAttribute('src'),uploaded);
    await custom().scrollIntoViewIfNeeded();await page.screenshot({path:path.join(root,'dev/output/start-page-icons.png')});await page.keyboard.press('Escape');
    await page.reload();assert.equal(await summary.locator('img').getAttribute('src'),uploaded);
    await page.evaluate(()=>{localStorage.setItem('GM_Lang','en');initPrefs()});await summary.click();
    const en=page.locator('.start-page-options fieldset').filter({has:page.locator('legend',{hasText:'Icon demo'})});assert.equal(await en.locator('label').filter({hasText:'Custom icon pool'}).locator('img').getAttribute('src'),uploaded);
    await page.setViewportSize({width:390,height:844});assert.ok(await page.locator('.start-page-dialog').evaluate(n=>n.scrollWidth<=n.clientWidth+1));
    assert.equal(await page.locator('.start-page-options input[value^="user_data.html?gameId="]').count(),await page.locator('#startPageSelect optgroup[data-game-id]').count());
    for(const section of await page.locator('.start-page-options fieldset').all()) {
        if(await section.locator('input[value^="user_data.html"]').count())assert.equal(await section.locator('label .start-page-text').last().textContent(),'Player data');
    }
    await en.locator('label').filter({hasText:'Player data'}).click();await page.locator('.start-page-actions .btn-action-gray').click();
    assert.ok((await page.evaluate(()=>localStorage.getItem('GM_Start_Page'))).endsWith('pool=emoji'));
    await summary.click();await page.locator('.start-page-options label').filter({has:page.locator('input[value="user_data.html?gameId=hsr"]')}).click();await page.locator('.start-page-actions .btn-primary').click();
    assert.ok((await summary.textContent()).includes(await page.locator('#startPageSelect optgroup[data-game-id="hsr"]').getAttribute('label')));assert.match(await summary.textContent(),/Player data/);
    await page.reload();assert.equal(await page.locator('#startPageSelect').inputValue(),'user_data.html?gameId=hsr');
    await page.evaluate(()=>sessionStorage.removeItem('GM_HasRedirected'));await page.goto(pathToFileURL(path.join(root,'index.html')).href);
    await page.waitForURL('**/user_data.html?gameId=hsr');await page.locator('#data-title').waitFor();assert.deepEqual(errors,[]);
    console.log('PASS: current game logo and pool icons, official/sidebar consistency, local/uploaded images and Emoji, selected summary, cancel/confirm, reopen refresh, reload, English and narrow layout.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
