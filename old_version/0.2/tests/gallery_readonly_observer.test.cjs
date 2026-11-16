// disabled 的重复赋值也产生属性记录：模拟下拉框重建与图鉴只读监听的反馈。
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../pages/gallery_setup.js'), 'utf8');
const start = source.indexOf('        const readonlyControlStates = new WeakMap();');
const end = source.indexOf('        // 原生 select 被隐藏后', start);
assert.ok(start >= 0 && end > start);
let locked = true;
let writes = 0;
const pending = [];
const controls = [];
function control(disabled = false) {
    let state = disabled;
    const node = {
        get disabled() { return state; },
        set disabled(value) {
            state = value;
            writes++;
            // select_ui 观察 disabled 并重建，触发图鉴的 childList 监听。
            pending.push(() => context.syncGalleryReadonlyControls());
        }
    };
    controls.push(node);
    return node;
}
const context = vm.createContext({
    galleryPreviewLock: { isLocked: () => locked },
    document: { querySelectorAll: () => controls }
});
vm.runInContext(source.slice(start, end), context);
function settle() {
    let turns = 0;
    while (pending.length) {
        assert.ok(++turns < 20, '只读与下拉框监听必须停止互相触发');
        pending.shift()();
    }
}
const editable = control();
const originallyDisabled = control(true);
context.syncGalleryReadonlyControls();
settle();
assert.equal(editable.disabled, true);
assert.equal(writes, 1, '不重复禁用已经锁定的控件');
const dynamic = control();
context.syncGalleryReadonlyControls();
settle();
assert.equal(dynamic.disabled, true, '动态插入的控件也会锁定');
locked = false;
context.syncGalleryReadonlyControls();
settle();
assert.equal(editable.disabled, false);
assert.equal(dynamic.disabled, false);
assert.equal(originallyDisabled.disabled, true, '解锁保留原来的禁用状态');
assert.equal(writes, 4);
console.log('PASS：只读更新收敛、动态控件锁定、解锁恢复原状态');
