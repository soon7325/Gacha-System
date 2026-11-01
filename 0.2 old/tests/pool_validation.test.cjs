// 纯数据检测测试：不访问浏览器，不修改输入，不使用随机数。
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const context = vm.createContext({ window: {} });
vm.runInContext(fs.readFileSync(path.join(__dirname, '../logic/pool_validation.js'), 'utf8'), context);
const validate = context.window.PoolValidation.validate;
const base = () => ({ tiers: [{ prob: '0.6' }, { prob: '99.4' }], goldIds: ['G'], pities: [{ tierId: 'G', pulls: '90', softEnabled: true, softRules: [{ start: '74', end: '89', inc: '6' }] }] });
const has = (data, key) => validate(data).errors.some(error => error.key === key);
let data = base(); const original = JSON.stringify(data);
assert.equal(validate(data).valid, true); assert.equal(JSON.stringify(data), original);
data.pities[0].softRules[0].end = '100'; assert(has(data, 'pv_over_hard'));
data = base(); data.pities[0].softRules[0].end = '90';
assert.equal(validate(data).valid, true); assert.equal(validate(data).warnings[0].key, 'pv_equal_hard');
data = base(); data.pities[0].softRules.push({ start: 89, end: 89, inc: 6 }); assert(has(data, 'pv_overlap'));
data = base(); data.pities[0].softRules[0].start = '88'; data.pities[0].softRules[0].end = '74'; assert(has(data, 'pv_reversed'));
data.pities[0].softEnabled = false; assert.equal(validate(data).valid, true);
for (const value of ['', ' ', null, '1.5', '0', '-1', 'abc']) {
    data = base(); data.early = [{ order: value, upRate: 100 }]; assert(has(data, 'pv_invalid_number'));
    data = base(); data.category = [{ order: value }]; assert(has(data, 'pv_invalid_number'));
}
data = base(); data.early = [{ order: 2, upRate: 0 }, { order: 1, upRate: 100 }]; assert.equal(validate(data).valid, true);
data = base(); data.tiers[0].prob = ''; assert(has(data, 'pv_invalid_number'));
data = base(); data.tiers[1].prob = 98; assert(has(data, 'pv_total'));
data = base(); data.tiers[1].subProbs = [{ prob: 90, hasConditions: true }]; assert(has(data, 'pv_sub_total'));
for (const section of ['spark', 'gift', 'spec']) {
    data = base(); data[section] = [{}]; assert(has(data, 'pv_invalid_number'));
}
const source = fs.readFileSync(path.join(__dirname, '../pages/pool_setup.js'), 'utf8');
for (const [min, max, valid] of [[7, 6, false], [1, 1, true], [0, 0, true], ['', '', true], [7, '', true], ['', 6, true], [-1, 6, false], [1.5, 6, false]]) {
    data = base(); data.preselect = [{ min, max }];
    assert.equal(validate(data).valid, valid, JSON.stringify({ min, max }));
}
assert.match(source, /function executeSavePool\(showAlert = true\) \{\s*if \(!validatePoolForm\(\)\) return false;/);
console.log('PASS：概率总和、细分概率、空值、前N金、区间越界/重叠/反向、关闭功能、只读数据与保存入口');
