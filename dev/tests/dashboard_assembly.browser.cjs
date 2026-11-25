const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require(path.join(process.env.USERPROFILE, '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));

async function main() {
    const browser = await chromium.launch({ channel: 'chrome' });
    try {
        const page = await browser.newPage();
        await page.goto(pathToFileURL(path.resolve('html/dashboard.html')).href + '?gameId=fixture&pool=custom');
        await page.evaluate(() => {
            const item = (id, tierId, tag) => ({ id, name: '同名', tierId, tags: [tag] });
            const catalog = {
                char: [item('wrong', 'tier_3', 'std'), item('winner', 'tier_4', 'up'), item('excluded', 'tier_4', 'std')],
                relic: [item('right', 'tier_3', 'std'), item('off', 'tier_4', 'std'), item('excluded2', 'tier_4', 'up')]
            };
            const tierRules = {
                tier_5: { mode: 'up_split', upCats: [], upTags: ['up'], offrateCats: [], offrateTags: [] },
                tier_4: { mode: 'up_split', upCats: ['char'], upTags: ['up'], offrateCats: ['relic'], offrateTags: ['std'] },
                tier_3: { mode: 'flat', cats: ['relic'], tags: ['std'], upTags: ['up'] }
            };
            localStorage.setItem('GM_Rules_fixture_custom', JSON.stringify({
                tiers: Object.keys(tierRules).map((id,i) => ({ id, prob: [1,9,90][i], isGold: i === 0 })),
                assembly: { tierRules }
            }));
            localStorage.setItem('GM_Catalog_fixture', JSON.stringify(catalog));
            localStorage.setItem('GM_Roster_fixture', JSON.stringify({custom: [item('old','tier_5','up')]}));
        });
        await page.reload();
        const result = await page.evaluate(() => {
            localStorage.setItem('GM_Non_Gold_Input_Mode','auto_random');
            const random = createBox('tier_3');
            localStorage.setItem('GM_Non_Gold_Input_Mode','allow_manual_no_up');
            const box = createBox('tier_4');
            const open = tier => openCharPicker(new MouseEvent('click'), box, currentTiers.find(t => t.id === tier));
            open('tier_4');
            const cards = () => [...document.querySelectorAll('#charPicker .picker-item-card')];
            const ids = cards().map(card => { card.click(); return box.dataset.itemId; });
            open('tier_5');
            return { random:random.dataset.itemId, placeholder:random.dataset.autoRandom, ids, empty:cards().length };
        });
        assert.deepEqual(result,{random:'right',placeholder:'true',ids:['winner','off'],empty:0});
    } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
