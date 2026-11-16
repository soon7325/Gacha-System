const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../pages/pool_setup.js'), 'utf8');
let locked = false, writes = 0, observe;
const handlers = {}, controls = [], pending = [];
function control(initial = false) {
    let disabled = initial;
    const node = { get disabled() { return disabled; }, set disabled(value) { disabled = value; writes++; pending.push(observe); } };
    controls.push(node);
    return node;
}
const context = vm.createContext({
    window: {}, document: { body: {}, querySelectorAll: () => controls, addEventListener: (name, callback) => { handlers[name] = callback; } },
    poolPreviewLock: { isLocked: () => locked, toggle: () => { locked = !locked; return true; }, applyPreset: () => { locked = true; } },
    MutationObserver: class { constructor(callback) { observe = callback; } observe() {} }
});
const start = source.indexOf('        const poolReadonlyStates');
vm.runInContext(source.slice(start, source.indexOf('        function loadPureCatalog()', start)), context);
function settle() { let count = 0; while (pending.length) { assert(++count < 20, '只读观察不能循环触发'); pending.shift()(); } }
const number = control(), select = control(), checkbox = control(), editButton = control(), originallyDisabled = control(true);
context.window.togglePreviewMode(); settle();
assert(controls.every(node => node.disabled)); assert.equal(writes, 4);
const dynamic = control(); observe(); settle(); assert(dynamic.disabled);
let prevented = 0;
for (const name of ['click', 'keydown', 'beforeinput']) handlers[name]({ target: { closest: () => ({}) }, preventDefault: () => prevented++, stopImmediatePropagation() {} });
assert.equal(prevented, 3);
context.window.togglePreviewMode(); settle();
assert.equal(number.disabled, false); assert.equal(select.disabled, false);
assert.equal(checkbox.disabled, false); assert.equal(editButton.disabled, false);
assert.equal(dynamic.disabled, false); assert.equal(originallyDisabled.disabled, true);
vm.runInContext('applyPresetPoolLock()', context); settle(); assert(controls.every(node => node.disabled));

let language = 'en';
const body = { style: { display: 'block' } }, arrow = { setAttribute(key, value) { this[key] = value; } };
context.document.getElementById = id => id.endsWith('body') ? body : arrow;
context.getTrans = key => ({ en: { expand: '▼ Expand', collapse: '▲ Collapse' }, zh: { expand: '▼ 展开', collapse: '▲ 收起' } })[language][key];
const toggleStart = source.indexOf('        window.toggleCardSection =');
vm.runInContext(source.slice(toggleStart, source.indexOf('        window.toggleCardZero', toggleStart)), context);
context.window.toggleCardSection(2);
assert.equal(arrow.innerText, '▼ Expand'); assert.equal(arrow['data-i18n'], 'expand');
context.window.toggleCardSection(2);
assert.equal(arrow.innerText, '▲ Collapse'); assert.equal(arrow['data-i18n'], 'collapse');
language = 'zh'; context.window.toggleCardSection(2); assert.equal(arrow.innerText, '▼ 展开');
console.log('PASS: 规则表单/编辑按钮锁定、动态控件、解锁恢复、预设只读、锁定时仍可折叠及中英文文案');
