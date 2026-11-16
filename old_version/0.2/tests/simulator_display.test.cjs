const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../pages/simulator.js'), 'utf8');
const refresh = source.slice(source.indexOf('window.refreshSimulatorDisplay = function'), source.indexOf("window.addEventListener('storage'", source.indexOf('window.refreshSimulatorDisplay = function')));
const record = { total: 7, name: 'Original item', tierId: 'low', pityUsed: 2 };
const records = new Map([['7', record]]);
const node = { dataset: { total: '7' }, outerHTML: '' };
const attributes = {};
let mode = 'color_only', updates = 0;
const context = {
    window: {}, simRenderedPulls: records,
    localStorage: { getItem: () => mode },
    document: { documentElement: { setAttribute: (key, value) => { attributes[key] = value; } }, querySelectorAll: () => [node] },
    buildSingleItemHtml: pull => { assert.equal(pull, record); return mode + ':' + pull.name; },
    updateHeaderSummary: () => { updates++; }, updateProbDisplay() {}, updateHideLowTip() {}
};
vm.runInNewContext(refresh, context);
context.window.refreshSimulatorDisplay();
assert.equal(node.outerHTML, 'color_only:Original item');
mode = 'show'; context.window.refreshSimulatorDisplay();
assert.equal(node.outerHTML, 'show:Original item');
assert.equal(attributes['data-sim-low-mode'], 'show');
assert.equal(records.size, 1); assert.equal(updates, 2);
const config = source.slice(source.indexOf('function renderTopConfigDrawer'), source.indexOf('function renderSelectCards'));
assert.ok(!config.includes('if (isColorOnly) return isGoldTier'));
assert.ok(config.includes('data-low-tier="${!isGoldTier}"'));
assert.ok(!refresh.includes('renderTopConfigDrawer()'), '切换不能重建候选并清空勾选');
console.log('PASS：即时切换重用原始结果、不重新抽取，低星候选仅隐藏并保留勾选');
