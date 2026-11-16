const assert=require('node:assert/strict'),path=require('node:path'),{pathToFileURL}=require('node:url');
const {chromium}=require(path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
const root=path.resolve(__dirname,'../..'),url=(name,query='')=>pathToFileURL(path.join(root,name+'.html')).href+query;
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});try{
    const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
    for(const game of ['hsr','zzz','end','ark']){
        await page.goto(url('gallery_setup','?gameId='+game));
        const categories=await page.evaluate(()=>gameInfo.categories);
        for(const category of categories){const img=page.locator(`.category-box[data-id="${category.id}"] > .category-header .cat-icon-badge img`);assert.equal(await img.getAttribute('src'),category.icon);await img.scrollIntoViewIfNeeded();await img.evaluate(n=>n.loading='eager');assert.ok(await img.evaluate(async n=>{await n.decode();return n.naturalWidth>0}));}
        if(game==='zzz'){
            await page.locator('.category-box[data-id="pet"] > .category-header').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(root,'dev/output/category-logos.png')});
            await page.evaluate(()=>{const setup=GameData.getPresetSetup('zzz');setup.gameName='Logo demo';localStorage.setItem('GM_Info_g_logo',JSON.stringify(setup));localStorage.setItem('GM_Catalog_g_logo',JSON.stringify(GameData.loadCatalog('zzz')));localStorage.setItem('GM_RosterPools_g_logo',JSON.stringify([{id:'char_up',name:'Logo pool',isStandalone:true}]));localStorage.setItem('GM_Rules_g_logo_char_up',JSON.stringify(GameData.getPresetRules('zzz').char_up));});
        }
    }
    await page.goto(url('gallery_setup','?gameId=g_logo'));await page.evaluate(()=>openAddItemModal('char','tier_S'));
    const trigger=page.locator('#input-item-cat-select + .custom-select-ui button');await trigger.waitFor();assert.equal(await trigger.locator('img').getAttribute('src'),'img/ZZZ/icon/代理人.png');
    await trigger.click();assert.equal(await page.locator('.custom-select-floating img').count(),3);
    await page.locator('.custom-select-floating [data-val="pet"]').click();assert.equal(await page.locator('#input-item-cat-select').inputValue(),'pet');assert.equal(await trigger.locator('img').getAttribute('src'),'img/ZZZ/icon/邦布.png');
    assert.ok(!(await trigger.textContent()).includes('img/'));await page.screenshot({path:path.join(root,'dev/output/category-logo-select.png')});
    // Programmatic updates and icon metadata changes refresh the visual label too.
    await page.evaluate(()=>{const select=document.getElementById('input-item-cat-select');select.value='wep';});assert.equal(await trigger.locator('img').getAttribute('src'),'img/ZZZ/icon/音擎.png');
    await page.evaluate(()=>document.querySelector('#input-item-cat-select option[value="wep"]').dataset.icon='🎯');await page.waitForFunction(()=>document.querySelector('#input-item-cat-select + .custom-select-ui .custom-select-option-icon')?.textContent==='🎯');
    await page.goto(url('pool_setup','?gameId=g_logo&pool=char_up'));
    await page.evaluate(()=>{appendSpecRuleRow();appendSparkRuleRow();appendCatSeqRow();});
    for(const selector of ['.spec-rule-row .cb-spec-cat','.spark-rule-row .cb-spark-cat','.cat-seq-rule-row .cb-cat-seq-cat']){
        const images=page.locator(selector).locator('..').locator('img');assert.ok(await images.count()>0);assert.ok(!(await page.locator(selector).locator('..').first().textContent()).includes('img/'));
    }
    const native=page.locator('select:has(option[data-icon])').first();const wrapper=native.locator('+ .custom-select-ui');assert.ok(await wrapper.locator('img').count()>0);
    await page.goto(url('settings'));await page.locator('#start-page-picker-button').click();assert.equal(await page.locator('.start-page-options input[value="dashboard.html?gameId=zzz&pool=bangboo_up"]').locator('..').locator('img').getAttribute('src'),'img/ZZZ/icon/邦布.png');assert.deepEqual(errors,[]);
    console.log('PASS: all eight category images load; category controls, native/custom dropdowns, changed icons, rule checkboxes and start-page pool icons render images without leaking file paths.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
