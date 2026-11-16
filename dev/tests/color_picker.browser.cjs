const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs'),{pathToFileURL}=require('node:url');
const {chromium}=require(path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
const root=path.resolve(__dirname,'../..'),url=(page,query='')=>pathToFileURL(path.join(root,page+'.html')).href+query;
(async()=>{
    const browser=await chromium.launch({channel:'chrome',headless:true});
    try{
        const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'}),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
        await page.goto(url('index'));await page.evaluate(()=>{
            const setup=GameData.getPresetSetup('hsr');setup.gameName='配色实验室';setup.enGameName='Color laboratory';setup.globalTiers=GameData.loadGlobalTiers('hsr');
            localStorage.setItem('GM_Info_g_color',JSON.stringify(setup));localStorage.setItem('GM_Catalog_g_color',JSON.stringify(GameData.loadCatalog('hsr')));
            localStorage.setItem('GM_RosterPools_g_color',JSON.stringify([{id:'char_up',name:'配色演示',en:'Color demo',type:'up',isStandalone:true}]));
            const rules=GameData.getPresetRules('hsr').char_up;rules.preSelect.tiers.tier_5.stdMin=0;rules.preSelect.tiers.tier_5.stdMax=999;rules.specRate={enabled:true,color:'#e74c3c',rules:[{tierId:'tier_5',type:'multiplier',value:5,targetCats:['char'],targetTags:['std']}]};
            localStorage.setItem('GM_Rules_g_color_char_up',JSON.stringify(rules));
        });
        await page.goto(url('gallery_setup','?gameId=g_color'));await page.evaluate(()=>{document.getElementById('master-settings-body').style.display='flex';});
        const swatch=()=>page.locator('[data-paint-kind="tier"]').first();
        const initial=await page.evaluate(()=>JSON.stringify(gameInfo.globalTiers[0]));
        await page.evaluate(()=>galleryChangeTracker.reset());
        await swatch().click();await page.locator('[data-paint-preset="1"]').click();assert.equal(await page.locator('.paint-stop').count(),6);
        await page.screenshot({path:path.join(root,'dev/output/colors-preview.png')});
        await page.locator('#paint-angle').fill('90');await page.locator('.paint-cancel').click();assert.equal(await page.evaluate(()=>JSON.stringify(gameInfo.globalTiers[0])),initial);assert.equal(await page.evaluate(()=>galleryChangeTracker.hasChanges()),false);
        await swatch().click();await page.locator('[data-paint-preset="1"]').click();await page.locator('#paint-angle').fill('75');
        await page.locator('.paint-hex').fill('broken');assert.equal(await page.locator('.paint-apply').isDisabled(),true);await page.locator('.paint-hex').fill('#FF526F');
        await page.locator('.paint-add-stop').click();await page.locator('.paint-add-stop').click();assert.equal(await page.locator('.paint-stop').count(),8);assert.ok(await page.locator('.paint-add-stop').isDisabled());
        await page.locator('.paint-stop-remove').last().click();assert.equal(await page.locator('.paint-stop').count(),7);
        await page.locator('.paint-sv').focus();await page.keyboard.press('ArrowLeft');await page.keyboard.press('Shift+ArrowDown');
        await page.screenshot({path:path.join(root,'dev/output/colors-picker-dark.png')});
        await page.locator('.paint-apply').click();const rainbow=await page.evaluate(()=>gameInfo.globalTiers[0].paint);assert.equal(rainbow.type,'linear');assert.equal(rainbow.angle,75);
        assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('GM_Info_g_color')).globalTiers[0].paint),undefined);
        await page.locator('[data-paint-kind="tag"]').first().click();await page.locator('[data-paint-preset="2"]').click();await page.locator('.paint-apply').click();
        await page.evaluate(()=>saveAllAndGenerate());await page.reload();await page.evaluate(()=>document.getElementById('master-settings-body').style.display='flex');
        assert.deepEqual(await page.evaluate(()=>gameInfo.globalTiers[0].paint),rainbow);assert.match(await swatch().getAttribute('style'),/linear-gradient/);
        assert.ok(await page.locator('.item-tag-badge[style*="linear-gradient"]').count()>0);assert.ok(await page.locator('.char-card[style*="linear-gradient"]').count()>0);
        await page.screenshot({path:path.join(root,'dev/output/colors-gallery.png')});
        await page.goto(url('pool_setup','?gameId=g_color&pool=char_up'));await page.locator('#input-spec-color').click();await page.locator('[data-paint-preset="2"]').click();await page.locator('.paint-apply').click();assert.ok(await page.evaluate(()=>checkHasUnsavedChanges()));
        assert.match(await page.locator('.spec-rule-row').first().getAttribute('style'),/linear-gradient/);
        assert.ok(await page.evaluate(()=>executeSavePool(false)));const special=await page.evaluate(()=>JSON.parse(localStorage.getItem('GM_Rules_g_color_char_up')).specRate);assert.equal(special.paint.stops.length,3);
        await page.reload();assert.match(await page.locator('#input-spec-color').getAttribute('style'),/linear-gradient/);
        await page.locator('#card-section-6').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(root,'dev/output/colors-special-rule.png')});
        await page.goto(url('simulator','?gameId=g_color&pool=char_up'));await page.evaluate(()=>document.getElementById('pool-config-top-body').style.display='block');
        assert.ok((await page.locator('#grid-spec-tier_5').getAttribute('style')).includes('var(--spec-color)'));
        const sample=await page.evaluate(()=>buildSingleItemHtml({name:'Sample',tierId:'tier_5',isGold:true,pityUsed:1,total:1}));assert.match(sample,/linear-gradient\(75deg/);
        await page.locator('[data-i18n="sim_btn_10"]').click();
        try { await page.waitForFunction(()=>document.querySelectorAll('.sim-item').length===10,{},{timeout:3000}); }
        catch(error) { await page.screenshot({path:path.join(root,'dev/output/colors-draw-debug.png')});console.log({errors,message:await page.locator('#customDialogMsg').textContent()});throw error; }
        await page.screenshot({path:path.join(root,'dev/output/colors-simulator.png')});
        await page.goto(url('dashboard','?gameId=g_color&pool=char_up'));assert.match(await page.evaluate(()=>createBox('tier_5').getAttribute('style')),/linear-gradient/);
        await page.goto(url('pool_setup','?gameId=ark&pool=char_up'));assert.ok(await page.locator('#input-spec-color').isDisabled());
        await page.evaluate(()=>editSpecAppearance());assert.equal(await page.locator('.paint-picker').count(),0);
        // Apply rechecks a lock introduced after opening; Escape also discards the draft.
        await page.goto(url('gallery_setup','?gameId=g_color'));await page.evaluate(()=>document.getElementById('master-settings-body').style.display='flex');
        await swatch().click();await page.locator('[data-paint-mode="solid"]').click();await page.keyboard.press('Escape');assert.deepEqual(await page.evaluate(()=>gameInfo.globalTiers[0].paint),rainbow);
        await swatch().click();await page.locator('[data-paint-mode="solid"]').click();await page.evaluate(()=>document.body.classList.add('preview-mode'));await page.locator('.paint-apply').click();assert.deepEqual(await page.evaluate(()=>gameInfo.globalTiers[0].paint),rainbow);
        await page.evaluate(()=>togglePreviewMode());await swatch().click();await page.locator('[data-paint-mode="solid"]').click();await page.locator('.paint-apply').click();assert.equal(await page.evaluate(()=>gameInfo.globalTiers[0].paint),undefined);
        await swatch().click();await page.locator('[data-paint-preset="3"]').click();await page.locator('[data-paint-mode="radial"]').click();await page.locator('.paint-apply').click();assert.equal(await page.evaluate(()=>gameInfo.globalTiers[0].paint.type),'radial');
        await page.evaluate(()=>localStorage.setItem('GM_Theme','light'));await page.reload();await page.evaluate(()=>document.getElementById('master-settings-body').style.display='flex');await swatch().click();await page.locator('[data-paint-preset="2"]').click();
        await page.screenshot({path:path.join(root,'dev/output/colors-picker-light.png')});await page.setViewportSize({width:390,height:844});
        assert.ok(await page.locator('.paint-picker').evaluate(n=>n.scrollWidth<=n.clientWidth+1));await page.screenshot({path:path.join(root,'dev/output/colors-picker-mobile.png')});
        await page.keyboard.press('Escape');await page.evaluate(()=>{localStorage.setItem('GM_Lang','en');localStorage.setItem('GM_Theme','dark')});await page.reload();await page.evaluate(()=>document.getElementById('master-settings-body').style.display='flex');await swatch().click();assert.equal(await page.locator('.paint-apply').textContent(),'Apply colors');await page.keyboard.press('Escape');
        assert.deepEqual(errors,[]);console.log('PASS: custom picker cancel/apply, validation, stop editing, keyboard, save/reload, gradient tags/cards, special accent, Simulator/Results propagation, readonly lock, solid reset, radial, light/mobile/English.');
    }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
