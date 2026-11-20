const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require(path.join(process.env.USERPROFILE, '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));

async function main() {
    const browser = await chromium.launch({ channel: 'chrome', headless: true });
    try {
        const page = await browser.newPage({ viewport: { width: 1280, height: 920 } });
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        const url = pathToFileURL(path.resolve('html/gallery_setup.html')).href + '?gameId=g_import_test';
        await page.goto(url);
        const item = { id: 'old', name: '角色甲', short: '甲', en: '', tierId: 'tier_5', tags: ['std'], img: '' };
        const old = [item, { ...item, id: 'local', name: '仅本地' }];
        await page.evaluate(items => {
            localStorage.setItem('GM_Info_g_import_test', JSON.stringify({ gameName: '示例游戏' }));
            localStorage.setItem('GM_Catalog_g_import_test', JSON.stringify({ char: items }));
        }, old);
        await page.reload();
        await page.locator('.gallery-tools summary').click();
        await page.locator('#btn-import-config').click();
        const select = (name, value) => page.locator(`input[name="${name}"][value="${value}"]`).check();
        const file = { catalog: { char: [{ ...item, id: 'new', en: 'Alpha', short: '新' }, { ...item, id: 'added', name: '角色乙' }] } };
        const read = () => page.evaluate(() => catalog.char);
        async function apply(data) {
            await page.locator('#file-import-config').setInputFiles({ name: 'config.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(data)) });
            await page.locator('#btn-confirm-ok').click();
        }
        assert.equal(await page.locator('fieldset[data-group=match]').isVisible(), false);
        await select('mode', 'add');
        assert.equal(await page.locator('input[value=name]').isChecked(), true);
        await select('blanks', 'skip');
        assert.match(await page.locator('[data-group=blanks] p').textContent(), /保留整条/);
        await apply(file);
        assert.deepEqual((await read())[0], old[0]);
        await select('blanks', 'fill');
        await apply(file);
        assert.deepEqual((await read())[0], { ...item, en: 'Alpha' });
        assert.equal((await read()).length, 3);
        assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('GM_Catalog_g_import_test')).char.length), 2);
        fs.mkdirSync('dev/output', { recursive: true });
        await page.locator('.gallery-tools').screenshot({ path: 'dev/output/gallery_import_add.png' });
        await select('mode', 'overwrite');
        await page.locator('.gallery-tools').screenshot({ path: 'dev/output/gallery_import_overwrite.png' });
        await apply(file);
        assert.deepEqual((await read())[0], { ...file.catalog.char[0], id: 'old' });
        const missingShort = structuredClone(file);
        missingShort.catalog.char[0].short = '';
        await apply(missingShort);
        assert.equal((await read())[0].short, '');
        await select('overwriteBlanks', 'from_old');
        await apply(missingShort);
        assert.equal((await read())[0].short, '甲');
        assert.equal((await read())[0].en, 'Alpha');
        await select('identity', 'replace');
        await apply(file);
        assert.equal((await read())[0].id, 'new');
        await select('match', 'id');
        assert.equal(await page.locator('[data-group=identity]').isVisible(), false);
        await apply(file);
        assert.equal((await read()).length, 4);
        await select('mode', 'latest');
        await apply({ ...file, info: { gameName: '新游戏' } });
        await page.locator('#btn-save-all').click();
        await page.reload();
        assert.deepEqual((await read()).map(row => row.id), ['new', 'added']);
        assert.equal(await page.locator('#input-game-name').inputValue(), '新游戏');
        await page.setViewportSize({ width: 390, height: 844 });
        await page.locator('.gallery-tools summary').click();
        await page.locator('#btn-import-config').click();
        await select('mode', 'add');
        assert.ok(await page.locator('.tools-content').evaluate(el => el.scrollWidth <= el.clientWidth));
        // 本地存有「角色甲 / Alpha」，新文件只改中文名。
        const renamed = { catalog: { char: [{ ...item, id: 'incoming', name: '角色丙', en: 'Alpha' }] } };
        await apply(renamed);
        assert.equal((await read()).length, 3);
        await page.evaluate(() => { localStorage.setItem('GM_Lang', 'en'); applyTranslations(); });
        await apply(renamed);
        assert.equal((await read()).length, 2);
        renamed.catalog.char[0].name = '角色甲';
        renamed.catalog.char[0].en = '';
        await apply(renamed);
        assert.equal((await read()).length, 2);
        // 旧条目没有英文名时，也能用中文匹配。
        renamed.catalog.char[0].name = '角色乙';
        renamed.catalog.char[0].en = 'Beta';
        await apply(renamed);
        assert.equal((await read()).length, 2);
        assert.equal((await read())[1].en, 'Beta');
        // 整包导入必须允许不同中文全名共用英文译名。
        const presets = {};
        for (const id of ['zzz', 'hsr']) {
            await page.goto(url.replace('g_import_test', id));
            presets[id] = await page.evaluate(() => ({ info: gameInfo, catalog, rosterPools: [], poolOrder: [] }));
        }
        const combined = await page.evaluate(({ zzz, hsr }) => GalleryImport.prepare(zzz, hsr,
            { mode: 'overwrite', match: 'name', identity: 'keep' }).catalog, presets);
        for (const name of ['知更鸟', '卡芙卡']) {
            const matches = combined.char.filter(item => item.name === name);
            assert.equal(matches.length, 1);
            assert.equal(matches[0].id, presets.zzz.catalog.char.find(item => item.name === name).id);
            assert.equal(matches[0].img, presets.hsr.catalog.char.find(item => item.name === name).img);
        }
        for (const name of ['花花世界迷人眼', '游戏尘寰', '天才们的休憩', '早餐的仪式感']) {
            assert.ok(combined.wep.some(item => item.name === name));
        }
        assert.deepEqual(errors, []);
        console.log('PASS: import modes, matching, hints, draft, save/reload and mobile layout');
    } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
