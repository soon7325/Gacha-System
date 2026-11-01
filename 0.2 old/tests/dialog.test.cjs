// 公共弹窗测试：node tests/dialog.test.cjs。测试不会加载到前端。
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// 最小 DOM 替身，检查事件是否解绑、Promise 是否结算以及焦点是否恢复。
function node() {
    const handlers = new Map();
    return {
        style: {}, textContent: '', innerHTML: '',
        addEventListener(type, listener) {
            if (!handlers.has(type)) handlers.set(type, new Set());
            handlers.get(type).add(listener);
        },
        removeEventListener(type, listener) { handlers.get(type)?.delete(listener); },
        emit(type, event = {}) { for (const listener of [...(handlers.get(type) || [])]) listener(event); },
        listenerCount(type) { return handlers.get(type)?.size || 0; },
        focus() { document.activeElement = this; }
    };
}
const ids = ['customDialogOverlay', 'customDialogBox', 'customDialogTitle', 'customDialogMsg', 'customDialogConfirm', 'customDialogCancel'];
const nodes = Object.fromEntries(ids.map(id => [id, node()]));
const document = node();
document.getElementById = id => nodes[id] || null;
const originFocus = node();
document.activeElement = originFocus;
let language = 'zh', nativeAlerts = 0, nativeConfirms = 0;
const window = {
    getTrans: key => ({ zh: { cd_js_alert: '提示', cd_js_confirm: '确认操作', confirm: '确认', cancel: '取消' }, en: { cd_js_alert: 'Notice', cd_js_confirm: 'Confirm Action', confirm: 'Confirm', cancel: 'Cancel' } })[language][key] || key,
    alert() { nativeAlerts++; }, confirm() { nativeConfirms++; return false; }
};
const context = vm.createContext({ window, document });
vm.runInContext(fs.readFileSync(path.join(__dirname, '../ui/dialog.js'), 'utf8'), context);
const Dialog = window.Dialog;
const overlay = nodes.customDialogOverlay, ok = nodes.customDialogConfirm, cancel = nodes.customDialogCancel, message = nodes.customDialogMsg;

async function main() {
    // HTML 中的真实引用必须位于样式块之外，并早于使用组件的页面脚本。
    for (const page of ['settings', 'simulator', 'gallery_setup', 'pool_setup']) {
        const html = fs.readFileSync(path.join(__dirname, '..', page + '.html'), 'utf8');
        const executableHtml = html.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '').replace(/<!--[\s\S]*?-->/g, '');
        const scripts = [...executableHtml.matchAll(/<script\b[^>]*src="([^"]+)"[^>]*>/gi)].map(match => match[1]);
        assert(scripts.includes('ui/dialog.js'), page + ': 弹窗脚本未加载');
        assert(scripts.indexOf('ui/dialog.js') < scripts.indexOf('pages/' + page + '.js'), page + ': 加载顺序错误');
    }
    const dialog = Dialog.create();
    const first = dialog.confirm('确定吗？');
    assert.equal(overlay.style.display, 'flex');
    assert.equal(document.activeElement, cancel);
    assert.equal(cancel.style.display, 'inline-block');
    cancel.emit('click');
    assert.equal(await first, false);
    assert.equal(overlay.style.display, 'none');
    assert.equal(document.activeElement, originFocus);
    assert.equal(ok.listenerCount('click'), 0);
    assert.equal(cancel.listenerCount('click'), 0);
    assert.equal(document.listenerCount('keydown'), 0);

    // 提示不显示取消，默认按纯文本显示用户输入。
    const alert = dialog.alert('<img onerror="bad()">');
    assert.equal(cancel.style.display, 'none');
    assert.equal(message.textContent, '<img onerror="bad()">');
    ok.emit('click');
    assert.equal(await alert, true);

    // 并发请求逐个处理，取消第一项不会误执行第二项；语言在显示时读取。
    const queuedFirst = dialog.confirm('第一项');
    const queuedSecond = dialog.confirm('第二项');
    assert.equal(message.textContent, '第一项');
    language = 'en';
    cancel.emit('click');
    assert.equal(await queuedFirst, false);
    assert.equal(message.textContent, '第二项');
    assert.equal(nodes.customDialogTitle.textContent, 'Confirm Action');
    ok.emit('click');
    assert.equal(await queuedSecond, true);

    // Escape 和主动关闭也会结算结果，不会留下永远等待的业务流程。
    const escape = dialog.confirm('Escape');
    document.emit('keydown', { key: 'Escape', preventDefault() {} });
    assert.equal(await escape, false);
    const closed = dialog.confirm('主动关闭');
    dialog.close();
    assert.equal(await closed, false);

    // 图鉴的可信 HTML 模板与主题颜色保留，关闭后恢复节点的原样式。
    nodes.customDialogBox.style.borderColor = 'red';
    const themed = Dialog.create({ html: true, themes: { primary: 'blue' } });
    const primary = themed.confirm('<b>导入</b>', { theme: 'primary', okText: '导入' });
    assert.equal(message.innerHTML, '<b>导入</b>');
    assert.equal(nodes.customDialogBox.style.borderColor, 'blue');
    assert.equal(ok.textContent, '导入');
    cancel.emit('click');
    assert.equal(await primary, false);
    assert.equal(nodes.customDialogBox.style.borderColor, 'red');

    // 缺少关键节点时使用原生兜底，并返回结果，不执行任何删除业务。
    const fallback = Dialog.create({ elements: { overlay: 'missing' } });
    assert.equal(await fallback.alert('提示'), true);
    assert.equal(await fallback.confirm('确认'), false);
    assert.equal(nativeAlerts, 1);
    assert.equal(nativeConfirms, 1);
    assert.equal(Dialog.text('missing_key', '兜底'), '兜底');

    // 卡池页面适配器：取消不能执行删除回调，确认仅执行一次，提示类型保持原样。
    Object.assign(nodes, {
        confirmModalOverlay: overlay, 'confirm-modal-text': message,
        'confirm-modal-box': nodes.customDialogBox, 'confirm-modal-title': nodes.customDialogTitle,
        'confirm-modal-msg': message, 'btn-confirm-ok': ok, 'btn-confirm-cancel': cancel
    });
    const toasts = [];
    context.Dialog = Dialog;
    context.getTrans = window.getTrans;
    context.showToast = (msg, type) => toasts.push(type);
    const poolSource = fs.readFileSync(path.join(__dirname, '../pages/pool_setup.js'), 'utf8');
    vm.runInContext(poolSource.slice(poolSource.indexOf('        const poolActionDialog'), poolSource.indexOf('        function appendPityRuleRow')), context);
    let deletes = 0;
    const cancelledAction = context.openActionConfirm('删除规则？', () => deletes++);
    cancel.emit('click');
    assert.equal(await cancelledAction, false);
    assert.equal(deletes, 0);
    assert.equal(toasts.pop(), 'cancel');
    const confirmedAction = context.openActionConfirm('删除规则？', () => deletes++);
    ok.emit('click');
    assert.equal(await confirmedAction, true);
    assert.equal(deletes, 1);
    assert.equal(toasts.pop(), 'danger');

    // 图鉴页面适配器：保留自定义标题、格式化正文与 blue/primary 主题别名。
    const gallerySource = fs.readFileSync(path.join(__dirname, '../pages/gallery_setup.js'), 'utf8');
    vm.runInContext(gallerySource.slice(gallerySource.indexOf('const galleryDialog'), gallerySource.indexOf('        const galleryChangeTracker')), context);
    const galleryConfirm = context.showConfirmModal({ title: '导入配置', msg: '<b>替换配置</b>', okText: '导入', theme: 'blue' });
    assert.equal(nodes.customDialogTitle.textContent, '导入配置');
    assert.equal(message.innerHTML, '<b>替换配置</b>');
    assert.equal(nodes.customDialogBox.style.borderColor, 'var(--primary, #007bff)');
    cancel.emit('click');
    assert.equal(await galleryConfirm, false);
    assert.equal(nodes.customDialogBox.style.borderColor, 'red');
    console.log('PASS：确认/取消、提示、队列、语言、Escape、事件清理、焦点、主题与缺失节点兜底');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
