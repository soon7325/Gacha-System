// 离开提示组件测试：仅 Node 执行，不会加载到前端。
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function node() {
    const events = new Map();
    return {
        style: {}, disabled: false,
        addEventListener(type, fn) { if (!events.has(type)) events.set(type, new Set()); events.get(type).add(fn); },
        removeEventListener(type, fn) { events.get(type)?.delete(fn); },
        count(type) { return events.get(type)?.size || 0; },
        emit(type, event = {}) { for (const fn of [...(events.get(type) || [])]) fn(event); },
        focus() { document.activeElement = this; }
    };
}
const ids = ['unsavedModalOverlay', 'btn-unsaved-stay', 'btn-unsaved-discard', 'btn-unsaved-save'];
const nodes = Object.fromEntries(ids.map(id => [id, node()]));
const document = node();
document.getElementById = id => nodes[id];
const originalFocus = node();
document.activeElement = originalFocus;
const window = {};
vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../ui/unsaved_changes.js'), 'utf8'), { window, document, console, setTimeout });
const tick = () => new Promise(resolve => setImmediate(resolve));

async function main() {
    // 验证真实 HTML 中组件位于样式块外，且早于页面脚本加载。
    for (const page of ['dashboard', 'gallery_setup', 'pool_setup']) {
        const html = fs.readFileSync(path.join(__dirname, '..', page + '.html'), 'utf8')
            .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '').replace(/<!--[\s\S]*?-->/g, '');
        const scripts = [...html.matchAll(/<script\b[^>]*src="([^"]+)"[^>]*>/gi)].map(m => m[1]);
        assert(scripts.includes('ui/unsaved_changes.js'));
        assert(scripts.indexOf('ui/unsaved_changes.js') < scripts.indexOf('pages/' + page + '.js'));
    }
    let dirty = false, saves = 0, discarded = 0, stayed = 0, saved = 0, errors = 0;
    let result = false, pendingSave;
    const destinations = [];
    const guard = window.UnsavedChanges.create({
        shouldConfirm: () => dirty,
        save: () => { saves++; return pendingSave || result; },
        leave: url => destinations.push(url),
        onStay: () => stayed++, onDiscard: () => discarded++, afterSave: () => saved++,
        onError: () => errors++
    });
    guard.request('clean');
    assert.deepEqual(destinations, ['clean']);
    dirty = true;
    guard.request('stay');
    assert.equal(nodes.unsavedModalOverlay.style.display, 'flex');
    nodes['btn-unsaved-stay'].emit('click'); await tick();
    assert.equal(stayed, 1); assert.equal(destinations.length, 1);
    assert.equal(document.activeElement, originalFocus);

    guard.request('discard');
    nodes['btn-unsaved-discard'].emit('click'); await tick();
    assert.equal(discarded, 1); assert.equal(destinations.at(-1), 'discard');

    // 保存校验返回 false 或抛异常时不能离开。
    guard.request('invalid'); nodes['btn-unsaved-save'].emit('click'); await tick();
    assert.equal(saves, 1); assert.equal(destinations.length, 2);
    pendingSave = Promise.reject(new Error('save failed'));
    guard.request('failed'); nodes['btn-unsaved-save'].emit('click'); await tick();
    assert.equal(errors, 1); assert.equal(destinations.length, 2);

    // 异步保存期间连点和新的离开请求不能改变目标，也不能重复保存。
    let resolveSave;
    pendingSave = new Promise(resolve => { resolveSave = resolve; });
    guard.request('saved'); nodes['btn-unsaved-save'].emit('click');
    nodes['btn-unsaved-save'].emit('click'); guard.request('wrong-target');
    assert.equal(saves, 3); assert.equal(nodes['btn-unsaved-save'].disabled, true);
    resolveSave(true); await tick();
    assert.equal(saved, 1); assert.equal(destinations.at(-1), 'saved');
    assert.equal(nodes['btn-unsaved-save'].disabled, false);

    guard.request('escape');
    document.emit('keydown', { key: 'Escape', preventDefault() {} }); await tick();
    assert.equal(stayed, 2); assert.equal(destinations.length, 3);

    // 多次开关不会重复注册按钮；节点缺失时禁止无提示地放弃修改。
    guard.request('again'); nodes['btn-unsaved-stay'].emit('click'); await tick();
    assert.equal(stayed, 3);
    const missing = window.UnsavedChanges.create({ elements: { overlay: 'missing' }, leave: () => assert.fail(), onError: () => errors++ });
    missing.request('missing'); assert.equal(errors, 2);

    // 追踪器统一处理对象/字符串快照、自动输入标记和手动标记。
    let state = { name: '原名', nested: { value: 1 } }, snapshotFails = false, snapshotErrors = 0;
    const tracker = window.UnsavedChanges.createTracker({
        getSnapshot: () => { if (snapshotFails) throw Error('snapshot failed'); return state; },
        onError: () => snapshotErrors++
    });
    assert.equal(tracker.hasChanges(), false); // 未初始化不把加载过程当作修改。
    tracker.start(); tracker.start();
    assert.equal(document.count('input'), 1); assert.equal(document.count('change'), 1);
    assert.equal(tracker.hasChanges(), false);
    state.nested.value = 2; assert.equal(tracker.hasChanges(), true); // 不是可变对象引用。
    state.nested.value = 1; assert.equal(tracker.hasChanges(), false);
    document.emit('input'); assert.equal(tracker.hasChanges(), true);
    tracker.reset(); assert.equal(tracker.hasChanges(), false);
    document.emit('change'); assert.equal(tracker.hasChanges(), true);
    tracker.clearDirty(); assert.equal(tracker.hasChanges(), false);
    tracker.markDirty(); assert.equal(tracker.hasChanges(), true);
    snapshotFails = true; assert.equal(tracker.reset(), false);
    assert.equal(tracker.hasChanges(), true); // 失败重置不能清掉修改标记。
    snapshotFails = false; tracker.reset(); snapshotFails = true;
    assert.equal(tracker.hasChanges(), true); assert.equal(snapshotErrors, 2);
    snapshotFails = false;
    tracker.stop(); assert.equal(document.count('input'), 0); assert.equal(document.count('change'), 0);
    const form = node(); tracker.start(form);
    assert.equal(form.count('input'), 1); tracker.stop(); assert.equal(form.count('input'), 0);

    // 三选一直接使用 tracker；留下/保存失败不丢标记，成功保存更新快照。
    const trackedDestinations = [];
    let saveWorks = false;
    const trackedGuard = window.UnsavedChanges.create({ tracker,
        save: () => saveWorks, leave: url => trackedDestinations.push(url) });
    tracker.reset(); trackedGuard.request('clean'); assert.deepEqual(trackedDestinations, ['clean']);
    state.name = '新名'; trackedGuard.request('stay');
    nodes['btn-unsaved-stay'].emit('click'); await tick(); assert(tracker.hasChanges());
    trackedGuard.request('failed'); nodes['btn-unsaved-save'].emit('click'); await tick();
    assert(tracker.hasChanges()); assert.equal(trackedDestinations.length, 1);
    saveWorks = true; trackedGuard.request('saved'); nodes['btn-unsaved-save'].emit('click'); await tick();
    assert.equal(tracker.hasChanges(), false); assert.equal(trackedDestinations.at(-1), 'saved');
    trackedGuard.request('again-clean'); assert.equal(trackedDestinations.at(-1), 'again-clean');
    tracker.markDirty(); trackedGuard.request('discard'); nodes['btn-unsaved-discard'].emit('click'); await tick();
    assert.equal(tracker.hasChanges(), false); assert.equal(trackedDestinations.at(-1), 'discard');

    // 页面不再重复维护标记和初始快照，仍提供各自的快照采集函数。
    for (const page of ['dashboard', 'gallery_setup', 'pool_setup']) {
        const source = fs.readFileSync(path.join(__dirname, '..', 'pages', page + '.js'), 'utf8');
        assert(source.includes('UnsavedChanges.createTracker'));
        assert(!source.includes('originalConfigSnapshot'));
        assert(!source.includes('isPageDirty'));
        assert(!source.includes('modalInitialDataSnapshot'));
    }
    console.log('PASS：三选一、保存竞态、修改标记、快照比较/重置、重复初始化、失败保护与页面接入');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
