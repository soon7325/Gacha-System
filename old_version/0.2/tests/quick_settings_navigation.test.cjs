// 编辑页侧栏在捕获阶段保护导航，快捷设定需先处理首次点击。
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../ui/quick_settings.js'), 'utf8');
const listener = source.match(/document\.addEventListener\('click', event => \{([\s\S]*?)\n    \}, true\);/);
assert.ok(listener, '快捷设定必须在 document 捕获阶段处理');
for (const page of ['gallery_setup.html', 'pool_setup.html']) {
    let panel = null, opened = 0, closed = 0;
    const entry = {};
    const context = { localStorage: { getItem: () => null }, popupKey: 'GM_Settings_Popover',
        open: () => { opened++; panel = {}; }, close: () => { closed++; panel = null; } };
    Object.defineProperty(context, 'panel', { get: () => panel });
    const handler = vm.runInNewContext('(event => {' + listener[1] + '\n})', context);
    function click() {
        const event = { target: { closest: () => entry }, button: 0, prevented: false, stopped: false,
            preventDefault() { this.prevented = true; }, stopPropagation() { this.stopped = true; } };
        handler(event); return event;
    }
    const first = click();
    assert.equal(opened, 1, page); assert.ok(first.prevented && first.stopped, '首次点击不得进入侧栏导航保护');
    const second = click();
    assert.equal(closed, 1); assert.ok(!second.prevented && !second.stopped, '第二次点击保留未保存保护');
    context.localStorage.getItem = () => 'false';
    const disabled = click();
    assert.equal(opened, 1); assert.ok(!disabled.prevented && !disabled.stopped, '关闭快捷弹窗后直接交给导航保护');
}
console.log('PASS：编辑页首次点击展开、第二次点击保留未保存保护、关闭弹窗偏好直接导航');
