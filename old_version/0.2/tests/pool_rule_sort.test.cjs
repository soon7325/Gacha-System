// 卡池规则拖拽回归：验证节点移动、输入值不变、动态绑定与锁定，不使用真实存储。
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../pages/pool_setup.js'), 'utf8');
function row(selector, value) {
    let handle = null;
    return { selector, value, dataset: {}, classList: { add() {} },
        querySelector: () => handle, insertBefore: node => { handle = node; }, closest: () => null,
        matches(other) { return other === selector; }, get firstChild() { return handle; },
        get nextSibling() { const items = this.parentElement.children; return items[items.indexOf(this) + 1] || null; }
    };
}
const a = row('.early-up-rule-row', '1'), b = row('.early-up-rule-row', '7');
const parent = { children: [a, b], insertBefore(from, target) {
    this.children.splice(this.children.indexOf(from), 1);
    const index = target ? this.children.indexOf(target) : this.children.length;
    this.children.splice(index, 0, from);
} };
a.parentElement = parent; b.parentElement = parent;
const registrations = [];
let refresh, locked = false, dirty = 0;
const context = vm.createContext({
    document: {
        querySelector: () => ({ querySelectorAll: selector => parent.children.filter(item => item.matches(selector)) }),
        createElement: () => ({}), addEventListener() {}
    },
    sysLang: 'zh', poolTierState: {}, poolPreviewLock: { isLocked: () => locked },
    markPageDirty: () => dirty++,
    MutationObserver: class { constructor(fn) { refresh = fn; } observe() {} },
    DragSort: { bind(container, selector, callback, options) { registrations.push({ container, selector, callback, options }); } }
});
vm.runInContext(source.slice(source.indexOf('function initRuleDragSorting()')), context);
vm.runInContext('initRuleDragSorting()', context);
assert.equal(registrations.length, 1);
const first = registrations[0];
assert.equal(first.options.handleOnly, true);
assert.equal(first.options.canDrag(), true); locked = true; assert.equal(first.options.canDrag(), false); locked = false;
first.callback(b.dataset.ruleDragId, a.dataset.ruleDragId, true);
assert.deepEqual(parent.children, [b, a]); assert.equal(a.value, '1'); assert.equal(b.value, '7'); assert.equal(dirty, 1);
refresh(); assert.equal(registrations.length, 2);
refresh(); assert.equal(registrations.length, 2); // 不重复绑定，也不形成 MutationObserver 循环。
const c = row('.early-up-rule-row', '9'); c.parentElement = parent; parent.children.push(c);
refresh(); assert.equal(registrations.length, 3); assert(c.dataset.ruleDragId);
const last = registrations.at(-1);
last.callback(b.dataset.ruleDragId, c.dataset.ruleDragId, false);
assert.deepEqual(parent.children, [a, c, b]); assert.deepEqual(parent.children.map(item => item.value), ['1', '9', '7']);

for (const selector of ['sub-prob-group-row', 'sub-condition-slice', 'unified-pity-row', 'early-up-rule-row',
    'cat-seq-rule-row', 'spec-rule-row', 'spark-rule-row', 'gift-rule-row']) {
    assert(source.slice(source.indexOf('function initRuleDragSorting()')).includes("'." + selector + "'"));
}
assert(!source.includes('earlyUpRulesArr.sort(')); assert(!source.includes('goldCatSeqArr.sort('));
// 加载按保存数组逐项恢复，导出/导入使用 JSON，不会另加展示排序。
assert(source.includes('savedConfig.earlyUpRules.forEach'));
assert(source.includes('savedConfig.goldCategorySequence.forEach'));
console.log('PASS：规则整框移动、数值不变、保存/恢复顺序、动态增删绑定、只读限制与稳定重绑');
