const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require(path.join(process.env.USERPROFILE, '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));

async function main() {
    const browser = await chromium.launch({ channel: 'chrome' });
    try {
        const page = await browser.newPage();
        await page.goto(pathToFileURL(path.resolve('html/gallery_setup.html')).href + '?gameId=g_move');
        await page.evaluate(() => {
            localStorage.setItem('GM_Info_g_move', JSON.stringify({ gameName: '测试' }));
            localStorage.setItem('GM_Catalog_g_move', JSON.stringify({ char: [
                { id: 'one', name: '角色甲', en: 'Alpha', tierId: 'tier_5', tags: ['std'], img: '' }
            ], wep: ['a', 'b', 'c'].map(id => ({ id, name: id, tierId: 'tier_4', tags: ['std'] })) }));
        });
        await page.reload();
        const card = page.locator('.char-card[data-id=one]');
        const zone = (category, tier) => page.locator(`.category-box[data-id="${category}"] [data-drop-tier="${tier}"]`);
        async function move(category, tier, selector = '.tier-header', fraction = .5) {
            await card.scrollIntoViewIfNeeded();
            await card.hover();
            const start = await card.boundingBox();
            await page.mouse.down();
            await page.mouse.move(start.x + start.width * .75, start.y + start.height / 2, { steps: 4 });
            const destination = zone(category, tier).locator(selector);
            await destination.scrollIntoViewIfNeeded();
            const end = await destination.boundingBox();
            await page.mouse.move(end.x + end.width * fraction, end.y + end.height / 2, { steps: 8 });
            await page.mouse.up();
        }
        await move('char', 'tier_4');
        assert.equal(await card.getAttribute('data-tier'), 'tier_4');
        const target = zone('wep', 'tier_4');
        if (!await target.isVisible()) await page.locator('.category-box[data-id=wep] .category-header').click();
        if (!await target.locator('.char-card').first().isVisible()) await target.locator('.tier-header').click();
        await move('wep', 'tier_4', '.char-card[data-id=b]', .25);
        const order = () => target.locator('.char-card').evaluateAll(cards => cards.map(card => card.dataset.id));
        assert.deepEqual(await order(), ['a', 'one', 'b', 'c']);
        await move('wep', 'tier_5');
        await move('wep', 'tier_4', '.char-card[data-id=b]', .75);
        assert.deepEqual(await order(), ['a', 'b', 'one', 'c']);
        assert.equal(await card.getAttribute('data-cat'), 'wep');
        assert.equal(await card.count(), 1);
        await page.locator('#btn-save-all').click();
        await page.reload();
        const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('GM_Catalog_g_move')));
        assert.equal(stored.char.length, 0);
        assert.deepEqual(stored.wep.map(item => item.id), ['a', 'b', 'one', 'c']);
        assert.equal(stored.wep[2].tierId, 'tier_4');
        if (!await target.isVisible()) await page.locator('.category-box[data-id=wep] .category-header').click();
        if (!await card.isVisible()) await target.locator('.tier-header').click();
        await card.click();
        assert.equal(await page.locator('#input-item-tier').inputValue(), 'tier_4');
        assert.equal(await page.locator('#input-item-cat-select').inputValue(), 'wep');
        await page.locator('#input-item-tier').selectOption('tier_5', { force: true });
        await page.locator('#input-item-cat-select').selectOption('char', { force: true });
        await page.locator('[onclick="saveItemData()"]').click();
        assert.equal(await card.getAttribute('data-cat'), 'char');
        assert.equal(await card.getAttribute('data-tier'), 'tier_5');
        console.log('PASS: moving between tiers and categories, saving, reopening and editing in the modal');
    } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
