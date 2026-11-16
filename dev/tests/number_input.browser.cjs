// Real-browser interaction checks. Run: node dev/tests/number_input.browser.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path');
const root = path.resolve(__dirname, '../..');
let playwright;
try { playwright = require('playwright'); }
catch (_) { playwright = require(path.join(process.env.USERPROFILE, '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')); }
(async () => {
    const browser = await playwright.chromium.launch({channel:'chrome',headless:true});
    try {
        const context = await browser.newContext({viewport:{width:1000,height:700}});
        const page = await context.newPage(), errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.setContent(`<html lang="zh-CN"><head><style>
            :root{--border:#39414d;--text:#eee;--primary:#1689ff}body{background:#101419;color:#ddd;font:14px sans-serif;padding:24px}
            form{display:flex;gap:20px;flex-wrap:wrap}label{display:flex;gap:10px;align-items:center}.input-box{box-sizing:border-box;border:1px solid var(--border);border-radius:6px;background:#171c23;color:#fff;padding:6px}
            .sim-start-grid{display:grid;grid-template-columns:1fr}.sim-start-grid label{display:flex;flex-direction:column;align-items:stretch}
            </style></head><body><form>
            <label>累计满<input class="input-box" id="integer" type="number" min="0" max="90" step="1" value="90" style="width:75px"></label>
            <label>概率<input class="input-box" id="decimal" type="number" min="0" max="1" step="0.1" value="0.2" style="width:85px"></label>
            <label>留空<input class="input-box" id="empty" type="number" min="1" style="width:75px"></label>
            <label>任意小数<input class="input-box" id="any" type="number" step="any" min="0" max="5" value="1.25" style="width:85px"></label>
            <label>只读<input class="input-box" id="readonly" type="number" value="10" readonly style="width:75px"></label>
            <fieldset disabled><input class="input-box" id="disabled" type="number" value="10" style="width:75px"></fieldset>
            <label>窄框<input class="input-box" id="narrow" type="number" value="2" style="width:45px;padding:5px;text-align:center"></label>
            </form><div class="sim-start-grid" style="width:300px"><label>全宽<input class="input-box" id="fluid" type="number" style="width:100%" value="10"></label></div></body></html>`);
        await page.addStyleTag({path:path.join(root,'ui/number_input.css')});
        await page.addScriptTag({path:path.join(root,'ui/number_input.js')});
        const button = (id, direction) => page.locator(`#${id}`).locator('..').locator(`[data-number-step="${direction}"]`);
        await page.evaluate(() => {
            window.changes = []; window.submits = 0;
            document.querySelector('form').onsubmit = event => {event.preventDefault();window.submits++;};
            for (const type of ['input','change']) document.querySelector('#integer').addEventListener(type, event => changes.push(event.type));
        });
        await button('integer',1).click(); assert.equal(await page.locator('#integer').inputValue(),'90');
        assert.deepEqual(await page.evaluate(()=>changes),[]);
        await button('integer',-1).click(); assert.equal(await page.locator('#integer').inputValue(),'89');
        assert.deepEqual(await page.evaluate(()=>changes),['input','change']);
        await button('decimal',1).click(); assert.equal(await page.locator('#decimal').inputValue(),'0.3');
        await button('any',1).click(); assert.equal(await page.locator('#any').inputValue(),'2.25');
        await button('empty',1).click(); assert.equal(await page.locator('#empty').inputValue(),'1');
        await page.locator('#integer').fill('5');await page.locator('#integer').press('ArrowUp');assert.equal(await page.locator('#integer').inputValue(),'6');
        assert.ok(await button('readonly',1).isDisabled()); assert.ok(await button('disabled',1).isDisabled());
        await page.locator('#integer').evaluate(input=>input.readOnly=true);await page.waitForFunction(()=>document.querySelector('#integer').parentElement.querySelector('button').disabled);
        await page.locator('#integer').evaluate(input=>input.readOnly=false);
        await page.waitForFunction(()=>!document.querySelector('#integer').parentElement.querySelector('button').disabled);
        await page.evaluate(()=>{const input=document.createElement('input');input.id='dynamic';input.type='number';input.min='0';input.max='2';input.value='1';input.style.width='75px';document.body.appendChild(input);});
        await page.waitForFunction(()=>document.querySelector('#dynamic').parentElement.classList.contains('number-input'));
        await button('dynamic',1).click();await button('dynamic',1).click();assert.equal(await page.locator('#dynamic').inputValue(),'2');
        await button('dynamic',-1).click();assert.equal(await page.locator('#dynamic').inputValue(),'1');
        await page.locator('#dynamic').evaluate(input=>{input.style.display='none';});
        await page.waitForFunction(()=>document.querySelector('#dynamic').parentElement.hidden);
        await page.locator('#dynamic').evaluate(input=>input.style.display='');
        await page.waitForFunction(()=>!document.querySelector('#dynamic').parentElement.hidden);
        const point = await button('integer',1).boundingBox();
        await page.mouse.move(point.x+point.width/2,point.y+point.height/2);await page.mouse.down();
        await page.waitForTimeout(650);await page.mouse.up();
        const heldValue=Number(await page.locator('#integer').inputValue());assert.ok(heldValue>=9);
        await page.waitForTimeout(170);assert.equal(Number(await page.locator('#integer').inputValue()),heldValue);
        const layout=await page.locator('#integer').evaluate(input=>{const wrap=input.parentElement,buttons=wrap.querySelectorAll('button');return {width:wrap.getBoundingClientRect().width,input:input.getBoundingClientRect().width,up:buttons[0].getBoundingClientRect().height,down:buttons[1].getBoundingClientRect().height,available:input.getBoundingClientRect().height-2};});
        assert.equal(layout.width,75);assert.equal(layout.input,75);assert.ok(Math.abs(layout.up-layout.down)<1);assert.ok(Math.abs(layout.up+layout.down-layout.available)<1);
        await page.locator('.sim-start-grid').evaluate(node=>node.style.width='220px');assert.equal(Math.round((await page.locator('#fluid').boundingBox()).width),220);
        assert.equal(await page.evaluate(()=>submits),0);assert.deepEqual(errors,[]);
        console.log('PASS: split buttons, native bounds/decimal steps, empty/any, keyboard, read-only, fieldsets, dynamic controls, hold/release, events, form safety and responsive width.');
        await context.close();
    } finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exitCode=1;});
