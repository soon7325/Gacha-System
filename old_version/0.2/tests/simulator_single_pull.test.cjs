// 连续单抽复用卡片行时不能中断统计刷新；验证范围标签逐抽推进。
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../pages/simulator.js'), 'utf8');
const start = source.indexOf('        function updateRowRangeLabel(');
const end = source.indexOf('        function getSubProbConditionLabel', start);
const items = [], label = { textContent: '' };
const itemsWrap = {
    querySelectorAll: () => items,
    insertAdjacentHTML: (_, html) => html.split(',').filter(Boolean).forEach(total => items.push({ dataset: { total } }))
};
const row = {
    dataset: { pullType: 'paid' },
    classList: { contains: name => name === 'single-row' },
    querySelector: selector => selector === '.range-label' ? label : itemsWrap,
    querySelectorAll: () => items
};
const context = vm.createContext({
    simRenderedPulls: new Map(),
    document: { getElementById: () => ({ firstElementChild: row }) },
    window: { getTrans: () => '{start}-{end}' },
    buildSingleItemHtml: pull => pull.total + ','
});
vm.runInContext(source.slice(start, end), context);
items.push({ dataset: { total: '71' } });
// 第二至第十次单抽全部走旧行追加分支，必须正常返回供统计刷新。
for (let total = 72; total <= 80; total++) {
    context.renderSimPulls([{ total }], 'paid');
    assert.equal(label.textContent, '71-' + total);
    assert.equal(items.length, total - 70);
}
const draw = source.slice(source.indexOf('async function doSimPulls('), source.indexOf('function renderExtraGift('));
// 两类免费抽同样逐抽合并；不计保底免费保持免费标签，不伪造抽数。
for (const type of ['free_pity', 'free_nopity']) {
    row.dataset.pullType = type;
    items.length = 0;
    items.push({ dataset: { total: '61' } });
    for (let total = 62; total <= 70; total++) {
        context.renderSimPulls([{ total }], type);
        assert.equal(items.length, total - 60);
        assert.equal(label.textContent, type === 'free_pity' ? '61-' + total : '{start}-{end}');
    }
}
// 单抽未满十个，随后一次十连跨赠送边界：旧框保留，新框按 5+2免费+3 拆分。
row.dataset.pullType = 'paid';
items.length = 0;
for (let total = 21; total <= 25; total++) items.push({ dataset: { total: String(total) } });
const newRows = [];
context.document.getElementById = () => ({ firstElementChild: row, prepend: value => newRows.push(value) });
context.document.createElement = () => ({ dataset: {}, classList: { add() {} }, addEventListener() {} });
const makeBatch = (start, count) => Array.from({ length: count }, (_, i) => ({ total: start + i }));
context.renderSimPulls(makeBatch(26, 5), 'paid', false);
context.renderSimPulls(makeBatch(31, 2), 'free_pity', false);
context.renderSimPulls(makeBatch(33, 3), 'paid', false);
assert.equal(items.length, 5); // 原单抽框没有被十连补满。
assert.equal(newRows.length, 3);
assert.deepEqual(newRows.map(row => row.dataset.pullType), ['paid', 'free_pity', 'paid']);
assert.ok(newRows[0].innerHTML.includes('26,27,28,29,30,'));
assert.ok(newRows[1].innerHTML.includes('31,32,'));
assert.ok(newRows[2].innerHTML.includes('33,34,35,'));
assert.ok(draw.includes('renderSimPulls(chunk, chunk[0].pullType, amount === 1)'));
assert.ok(draw.indexOf('updateSimStats();') > draw.indexOf('chunks.forEach'));
console.log('PASS：连续单抽追加不报错、抽数范围逐抽更新、绘制后继续刷新统计');
