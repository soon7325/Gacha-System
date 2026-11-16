const path = require('node:path');
const assert = require('node:assert/strict');
const {pathToFileURL} = require('node:url');
const {chromium} = require(path.join(process.env.USERPROFILE, '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
const url = name => pathToFileURL(path.join(__dirname, '../..', name + '.html')).href;
(async () => {
    const browser = await chromium.launch({channel:'chrome', headless:true});
    try {
        for (const lang of ['zh', 'en']) for (const mode of [null, 'temporary', 'preserve']) {
            const context = await browser.newContext(), page = await context.newPage(), errors = [];
            page.on('pageerror', error => errors.push(error.message));
            await page.goto(url('settings'));
            await page.evaluate(({lang, mode}) => {
                localStorage.setItem('GM_Lang', lang);
                localStorage.setItem('GM_Bilingual_Hints', 'false');
                localStorage.setItem('GM_Bilingual_Onboarding_Completed', 'true');
                if (mode) sessionStorage.setItem('GM_Language_Guide_Replay_Bilingual', mode);
                window.applyTranslations();
            }, {lang, mode});
            const replay = async () => {
                await page.locator('#replay-language-guide').click();
                await page.locator('#customDialogConfirm').click();
                await page.waitForURL('**/index.html');
                assert.equal(await page.evaluate(() => sessionStorage.getItem('GM_Language_Guide_Replay_Bilingual')), 'temporary');
            };
            await page.locator('#replay-language-guide').click();
            await page.locator('#customDialogCancel').click();
            assert.equal(await page.evaluate(() => localStorage.getItem('GM_Bilingual_Hints')), 'false');
            await replay();
            await page.reload();
            await page.goto(url('settings'));
            const note = page.locator('#bilingual-first-exit-note');
            assert.match(await note.innerText(), lang === 'zh' ? /自动关闭/ : /turn off/);
            // Replaying an automatic enable without toggling must stay temporary.
            await replay();
            await page.goto(url('settings'));
            assert.match(await note.innerText(), lang === 'zh' ? /自动关闭/ : /turn off/);
            await page.goto(url('index'));
            assert.equal(await page.evaluate(() => localStorage.getItem('GM_Bilingual_Hints')), 'false');
            await page.goBack();
            await page.waitForURL('**/settings.html');
            assert.equal(await note.count(), 0);
            await page.waitForFunction(() => document.querySelector('[data-quick-preference="GM_Bilingual_Hints"]')?.checked === false);
            assert.equal(await page.locator('[data-quick-preference="GM_Bilingual_Hints"]').isChecked(), false);
            await replay();
            await page.goto(url('settings'));
            assert.match(await note.innerText(), lang === 'zh' ? /自动关闭/ : /turn off/);
            await page.goto(url('index'));
            assert.equal(await page.evaluate(() => localStorage.getItem('GM_Bilingual_Hints')), 'false');
            assert.deepEqual(errors, []);
            await context.close();
            console.log(`PASS ${lang} / ${mode}: cancelled confirmation, stale session, Home refresh, repeated replay and history return`);
        }
    } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
