// 定向重置回归：显示顺序与“第 N 金”计算进度分离，不写真实数据。
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const window = { getTrans: key => key }, nodes = {};
const state = { naturalGoldCount: 12, catSeqUsedCount: 4, customCatSeqStartOrder: 5, earlyUpUsedCount: 3 };
const rules = { goldCategorySequence: [{ order: 5 }, { order: 2 }] };
const context = vm.createContext({ window, rules, simData: state, gameInfo: {},
    document: { getElementById: id => nodes[id] ||= { style: {} } },
    localStorage: { getItem: () => 'zh' }, updateSimStats() {}, showToast() {} });
vm.runInContext(fs.readFileSync(path.join(root, 'logic/gacha_engine.js'), 'utf8'), context);
context.GachaEngine = window.GachaEngine;
const source = fs.readFileSync(path.join(root, 'pages/simulator.js'), 'utf8');
function load(start) {
    const a = source.indexOf(start), b = source.indexOf('\n        };', a);
    assert(a >= 0 && b > a); vm.runInContext(source.slice(a, b + '\n        };'.length), context);
}
load('window.openCategorySeqResetSelector = function()');
load('window.setCatSeqTargetOrder = function(order)');
window.openCategorySeqResetSelector(); nodes['btn-reset-all-rules'].onclick();
assert.equal(state.customCatSeqStartOrder, undefined);
assert.equal(state.naturalGoldCount, 12); assert.equal(state.earlyUpUsedCount, 3);
assert.equal(window.GachaEngine.getCategoryGoldOrder(state), 1);
assert.deepEqual(rules.goldCategorySequence.map(rule => rule.order), [5, 2]);
state.naturalGoldCount++;
assert.equal(window.GachaEngine.getGoldPolicy(rules, state, []).categoryRule.order, 2);
rules.goldCategorySequence.push({ order: 1 });
window.setCatSeqTargetOrder(5); window.openCategorySeqResetSelector(); nodes['btn-reset-all-rules'].onclick();
assert.equal(window.GachaEngine.getGoldPolicy(rules, state, []).categoryRule.order, 1);
window.setCatSeqTargetOrder(2);
assert.equal(window.GachaEngine.getGoldPolicy(rules, state, []).categoryRule.order, 2);
delete state.customCatSeqStartOrder; state.naturalGoldCount++;
assert.equal(window.GachaEngine.getCategoryGoldOrder(state), 3);
console.log('PASS：乱序定向全部重置、清除旧手选、第1/2金数值匹配、手选后推进及统计隔离');
