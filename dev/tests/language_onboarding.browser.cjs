const path = require('node:path');
const assert = require('node:assert/strict');
const {pathToFileURL} = require('node:url');
const {chromium} = require(path.join(process.env.USERPROFILE, '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
const root = path.resolve(__dirname, '../..');
const url = name => pathToFileURL(path.join(root, name + '.html')).href;
(async () => {
    const browser = await chromium.launch({channel:'chrome', headless:true});
    try {
        for (const width of [1440, 390]) {
            const context = await browser.newContext({viewport:{width, height:900}});
            const page = await context.newPage(), errors = [];
            page.on('pageerror', e => errors.push(e.message));
            await page.goto(url('index'));
            const guide = page.locator('#home-language-guide');
            await guide.waitFor({state:'visible'});
            await page.waitForTimeout(400); // Let the initial sidebar collapse finish.
            assert.match(await guide.innerText(), /Change language in Settings/);
            const card = await guide.locator('.language-guide-card').boundingBox();
            assert.ok(card.x >= 0 && card.x + card.width <= width);
            await page.screenshot({path:path.join(root, `dev/output/6.22-language-guide-${width}.png`)});
            await page.locator('.sidebar a[href="settings.html"]').click();
            await page.locator('#quick-settings-popover').waitFor({state:'visible'});
            assert.ok(await page.evaluate(() => +getComputedStyle(document.querySelector('#quick-settings-popover')).zIndex > +getComputedStyle(document.querySelector('#home-language-guide')).zIndex));
            await page.screenshot({path:path.join(root, `dev/output/6.22-settings-over-guide-${width}.png`)});
            await page.locator('.sidebar a[href="settings.html"]').click();
            await page.waitForURL('**/settings.html');
            await page.locator('#replay-language-guide').click();
            await page.locator('#customDialogCancel').click();
            assert.ok(page.url().endsWith('settings.html'));
            assert.equal(await page.evaluate(() => sessionStorage.getItem('GM_Language_Guide_Replay')), null);
            await page.evaluate(() => {
                localStorage.setItem('GM_Start_Page', 'changelog.html');
                localStorage.setItem('GM_Lang', 'en');
                localStorage.setItem('GM_Onboarding_Test_Data', 'keep');
                sessionStorage.removeItem('GM_HasRedirected');
            });
            await page.locator('#replay-language-guide').click();
            await page.locator('#customDialogConfirm').click();
            await page.waitForURL('**/index.html');
            await guide.waitFor({state:'visible'});
            assert.equal(await page.evaluate(() => localStorage.getItem('GM_Lang')), 'en');
            assert.equal(await page.evaluate(() => localStorage.getItem('GM_Start_Page')), 'changelog.html');
            assert.equal(await page.evaluate(() => localStorage.getItem('GM_Onboarding_Test_Data')), 'keep');
            await page.locator('.language-guide-close').click();
            assert.equal(await guide.count(), 0);
            await page.reload();
            assert.equal(await guide.count(), 0);
            await page.goto(url('settings'));
            await page.locator('.settings-language-guide').waitFor({state:'visible'});
            await page.locator('#replay-language-guide').click();
            await page.locator('#customDialogConfirm').click();
            await page.waitForURL('**/index.html');
            await guide.waitFor({state:'visible'});
            // A refresh counts as a later visit even without closing the guide.
            await page.reload();
            assert.equal(await guide.count(), 0);
            await page.goto(url('settings'));
            await page.evaluate(() => localStorage.setItem('GM_Settings_Popover', 'false'));
            await page.locator('#replay-language-guide').click();
            await page.locator('#customDialogConfirm').click();
            await page.waitForURL('**/index.html');
            await guide.waitFor({state:'visible'});
            assert.match(await guide.innerText(), /Click Settings to open/);
            await page.locator('.sidebar a[href="settings.html"]').click();
            await page.waitForURL('**/settings.html');
            assert.deepEqual(errors, []);
            await context.close();
            console.log(`PASS ${width}px: first visit, layering, cancel, replay, preservation, close and refresh`);
        }
        for (const lang of ['zh', 'en']) for (const enabled of [false, true]) for (const completed of [false, true]) {
            const context = await browser.newContext();
            const page = await context.newPage();
            await page.goto(url('index'));
            await page.evaluate(({lang, enabled, completed}) => {
                localStorage.setItem('GM_Lang', lang);
                localStorage.setItem('GM_Bilingual_Hints', String(enabled));
                localStorage.setItem('GM_Bilingual_Onboarding_Completed', String(completed));
                localStorage.setItem('GM_Settings_Popover', 'false');
                localStorage.removeItem('GM_Home_Language_Guide_Seen');
            }, {lang, enabled, completed});
            await page.reload();
            const guide = page.locator('#home-language-guide');
            await guide.waitFor({state:'visible'});
            assert.equal(await guide.locator('strong[lang="en"]').isVisible(), enabled || lang === 'en');
            assert.equal(await guide.locator('strong[lang="zh-CN"]').isVisible(), enabled || lang === 'zh');
            assert.equal(await guide.locator('strong').first().getAttribute('lang'), lang === 'en' ? 'en' : 'zh-CN');
            await page.goto(url('settings'));
            assert.equal(await page.locator('#langSelect option[value="en"]').textContent(), enabled
                ? (lang === 'en' ? 'English / 英语' : '英语 / English') : (lang === 'en' ? 'English' : '英语'));
            await page.locator('#replay-language-guide').click();
            await page.locator('#customDialogCancel').click();
            assert.equal(await page.evaluate(() => localStorage.getItem('GM_Bilingual_Hints')), String(enabled));
            await page.locator('#replay-language-guide').click();
            await page.locator('#customDialogConfirm').click();
            await page.waitForURL('**/index.html');
            await guide.waitFor({state:'visible'});
            assert.equal(await page.evaluate(() => localStorage.getItem('GM_Bilingual_Hints')), 'true');
            assert.equal(await guide.locator('strong[lang="en"]').isVisible(), true);
            assert.equal(await guide.locator('strong[lang="zh-CN"]').isVisible(), true);
            await page.goto(url('settings'));
            assert.equal(await page.locator('#bilingual-first-exit-note').count(), 1);
            assert.match(await page.locator('#bilingual-first-exit-note').innerText(), enabled
                ? (lang === 'zh' ? /离开设置页后仍会保持勾选/ : /will remain checked/)
                : (lang === 'zh' ? /自动关闭/ : /turn off/));
            if (completed) {
                // Reload also leaves Settings and ends a temporary enable.
                await page.reload();
                assert.equal(await page.evaluate(() => localStorage.getItem('GM_Bilingual_Hints')), String(enabled));
            }
            await page.goto(url('index'));
            assert.equal(await page.evaluate(() => localStorage.getItem('GM_Bilingual_Hints')), String(enabled));
            await context.close();
        }
        // An ordinary first visit still automatically turns hints off on exit.
        const context = await browser.newContext(), page = await context.newPage();
        await page.goto(url('settings'));
        await page.goto(url('index'));
        assert.equal(await page.evaluate(() => localStorage.getItem('GM_Bilingual_Hints')), 'false');
        await context.close();
        console.log('PASS bilingual replay matrix: zh/en, enabled/disabled, initial/completed; original first exit unchanged');
        for (const lang of ['zh', 'en']) for (const mode of ['first', 'temporary', 'preserve']) {
            const context = await browser.newContext(), page = await context.newPage();
            await page.goto(url('index'));
            await page.evaluate(({lang, mode}) => {
                localStorage.setItem('GM_Lang', lang);
                localStorage.setItem('GM_Bilingual_Hints', 'true');
                localStorage.setItem('GM_Bilingual_Onboarding_Completed', String(mode !== 'first'));
                if (mode !== 'first') sessionStorage.setItem('GM_Language_Guide_Replay_Bilingual', mode);
            }, {lang, mode});
            await page.goto(url('settings'));
            const toggle = page.locator('[data-quick-preference="GM_Bilingual_Hints"]');
            const note = page.locator('#bilingual-first-exit-note');
            await note.waitFor({state:'visible'});
            assert.match(await note.innerText(), mode === 'preserve'
                ? (lang === 'zh' ? /离开设置页后仍会保持勾选/ : /will remain checked/)
                : (lang === 'zh' ? /取消勾选后重新勾选/ : /Uncheck and then check/));
            await toggle.uncheck();
            assert.equal(await note.isVisible(), true);
            assert.match(await note.innerText(), lang === 'zh' ? /当前已关闭双语提示，再次勾选即可保持永久开启/ : /currently off.*Check this option again/);
            await toggle.check();
            assert.equal(await note.isVisible(), true);
            assert.match(await note.innerText(), lang === 'zh' ? /离开设置页后仍会保持勾选/ : /will remain checked/);
            await page.evaluate(() => window.applyTranslations());
            assert.equal(await note.isVisible(), true);
            // Off -> permanently on -> off -> replay without leaving Settings.
            // Repeat within that replay to cover an existing session mode too.
            for (let attempt = 0; attempt < 2; attempt++) {
                await toggle.uncheck();
                await page.locator('#replay-language-guide').click();
                await page.locator('#customDialogConfirm').click();
                await page.waitForURL('**/index.html');
                assert.equal(await page.evaluate(() => sessionStorage.getItem('GM_Language_Guide_Replay_Bilingual')), 'temporary');
                await page.goto(url('settings'));
                assert.equal(await toggle.isChecked(), true);
                assert.match(await note.innerText(), lang === 'zh' ? /自动关闭/ : /turn off/);
                if (attempt === 0) {
                    await toggle.uncheck();
                    await toggle.check();
                }
            }
            await page.goto(url('index'));
            assert.equal(await page.evaluate(() => localStorage.getItem('GM_Bilingual_Hints')), 'false');
            await page.goto(url('settings'));
            await toggle.check();
            await page.goto(url('index'));
            assert.equal(await page.evaluate(() => localStorage.getItem('GM_Bilingual_Hints')), 'true');
            await page.goto(url('settings'));
            assert.equal(await note.count(), 0);
            assert.equal(await toggle.isChecked(), true);
            await toggle.uncheck();
            assert.equal(await note.count(), 0);
            await toggle.check();
            assert.equal(await note.count(), 0);
            await page.locator('#replay-language-guide').click();
            await page.locator('#customDialogConfirm').click();
            await page.waitForURL('**/index.html');
            await page.goto(url('settings'));
            await note.waitFor({state:'visible'});
            await page.goto(url('index'));
            assert.equal(await page.evaluate(() => localStorage.getItem('GM_Bilingual_Hints')), 'true');
            await context.close();
        }
        console.log('PASS uncheck/recheck permanently enables hints on first visit and both replay modes; note lasts until exit and reappears on replay');
    } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
