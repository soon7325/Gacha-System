const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../pages/changelog.js'), 'utf8');
let cards = [];
const scrolled = [];
const frames = [];
const timers = [];
let renders = 0;
const context = {
    window: { addEventListener() {} },
    document: { addEventListener() {}, querySelectorAll: () => cards },
    localStorage: { getItem: () => 'zh' },
    ResizeObserver: class {}, Toast: { create: () => ({ show() {} }) },
    requestAnimationFrame: callback => frames.push(callback),
    setTimeout: callback => timers.push(callback)
};
vm.runInNewContext(source, context);
function card(version) {
    return { dataset: { version }, style: {}, scrollIntoView(options) { scrolled.push({ version, behavior: options.behavior }); } };
}
context.renderCurrentPageDOM = () => {
    renders++;
    cards = vm.runInNewContext('pagedGroups[currentPage - 1]', context).map(item => card(item.version));
};
context.renderPaginationControls = () => {};
vm.runInNewContext("pagedGroups = [[{version: '0.a & 0.b'}, {version: 'v0.2.4.11'}], [{version: 'v0.0.2.6'}], [{version: 'v0.0.2.6'}]]; currentPage = 1;", context);
context.renderCurrentPageDOM();
context.jumpToVersion('0.a & 0.b');
frames.shift()();
assert.equal(renders, 1);
assert.equal(scrolled.at(-1).version, '0.a & 0.b');
context.jumpToVersion('v0.0.2.6');
assert.equal(vm.runInNewContext('currentPage', context), 2);
assert.equal(renders, 2);
frames.shift()();
assert.equal(scrolled.at(-1).version, 'v0.0.2.6');
assert.equal(scrolled.at(-1).behavior, 'smooth');
assert.equal(cards[0].style.borderColor, 'var(--cl-primary)');
timers.at(-1)();
assert.equal(cards[0].style.borderColor, '');
const link = { click: () => context.jumpToVersion('v0.0.2.6') };
context.document.querySelectorAll = () => [{ style: { display: 'none' } }, { style: {}, querySelector: () => link }];
context.onTocSearchKeydown({ key: 'Enter' });
assert.equal(frames.length, 1);
context.document.querySelectorAll = () => cards;
frames.shift()();
assert.equal(scrolled.length, 3);
context.jumpToVersion('missing');
assert.equal(frames.length, 0);
assert.equal(renders, 2);
assert.ok(source.includes('card.dataset.version = item.version;'));
console.log('PASS: same-page and cross-page jumps, first split part, search Enter, highlight and missing versions');
