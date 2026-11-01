// 预览锁测试：只验证界面状态，不修改真实数据。node tests/preview_lock.test.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
function node() {
    const classes = new Set();
    return { style: { color: '', background: '', borderColor: '' }, textContent: '', children: [],
        classList: {
            contains: name => classes.has(name), add: name => classes.add(name), remove: name => classes.delete(name),
            toggle(name) { if (classes.has(name)) classes.delete(name); else classes.add(name); }
        },
        insertBefore(child, before) { const index = this.children.indexOf(before); this.children.splice(index < 0 ? this.children.length : index, 0, child); },
        get firstChild() { return this.children[0] || null; }
    };
}
const nodes = { 'btn-preview-toggle': node(), 'btn-save-all': node(), 'btn-add-tag': node() };
const container = node(); container.children.push(node(), node());
const document = {
    addEventListener() {},
    querySelectorAll: () => [],
    body: node(),
    getElementById: id => nodes[id] || container.children.find(child => child.id === id) || null,
    querySelector: selector => selector === '.setup-container' ? container : null,
    createElement: node
};
const window = {};
vm.runInNewContext(fs.readFileSync(path.join(root, 'ui/preview_lock.js'), 'utf8'), { document, window });
const PreviewLock = window.PreviewLock;
let preset = false, language = 'zh', calls = 0;
const labels = () => language === 'zh' ? { lock: '锁定', unlock: '解除', readOnly: '只读', banner: '预设只读' } :
    { lock: 'Lock', unlock: 'Unlock', readOnly: 'Read-only', banner: 'Preset read-only' };
const preview = PreviewLock.create({ isPreset: () => preset, getLabels: labels,
    banner: { id: 'test-banner', style: 'color: orange' }, onPreset: () => calls++ });
assert.equal(preview.isLocked(), false);
assert.equal(preview.applyPreset(), false); assert.equal(calls, 0);
preview.toggle(); assert(preview.isPreview()); assert.equal(nodes['btn-preview-toggle'].textContent, '解除');
assert.equal(nodes['btn-preview-toggle'].style.color, '#2ecc71');
language = 'en'; preview.refresh(); assert.equal(nodes['btn-preview-toggle'].textContent, 'Unlock');
preview.toggle(); assert.equal(preview.isPreview(), false); assert.equal(nodes['btn-preview-toggle'].style.color, '');
assert.equal(nodes['btn-preview-toggle'].textContent, 'Lock');
preset = true; assert(preview.isLocked()); assert.equal(preview.toggle(), false);
preview.applyPreset(); assert(document.body.classList.contains('is-preset-game')); assert(preview.isPreview());
assert.equal(nodes['btn-preview-toggle'].textContent, 'Read-only');
assert.equal(document.getElementById('test-banner').textContent, 'Preset read-only');
const count = container.children.length;
language = 'zh'; preview.applyPreset(); assert.equal(container.children.length, count);
assert.equal(document.getElementById('test-banner').textContent, '预设只读');
assert.equal(preview.toggle(), false); assert(preview.isLocked());

// gallery 的预设锁不添加 preview-mode，但仍不可解除；缺失控件也不抛异常。
document.body.classList.remove('preview-mode'); document.body.classList.remove('is-preset-game');
const gallery = PreviewLock.create({ isPreset: () => true, presetPreview: false, buttonId: 'missing', banner: { id: 'gallery', container: '.missing' } });
gallery.applyPreset(); assert.equal(gallery.isPreview(), false); assert(gallery.isLocked()); assert.equal(gallery.toggle(), false);

// 执行两页真实适配代码，验证文案、CSS 模式和原有保存/删除入口保护。
for (const page of ['pool_setup', 'gallery_setup']) {
    document.body.classList.remove('preview-mode'); document.body.classList.remove('is-preset-game');
    const source = fs.readFileSync(path.join(root, 'pages', page + '.js'), 'utf8');
    const isPool = page === 'pool_setup';
    const start = source.indexOf(isPool ? '        const poolPreviewLock' : '        const galleryPreviewLock');
    const end = isPool ? source.indexOf('        function loadPureCatalog()', start) :
        source.indexOf('        // ==========================================', start);
    const stateWindow = { getTrans: key => key };
    const context = vm.createContext({ document, window: stateWindow, PreviewLock, gameId: 'hsr', PRESET_GAME_IDS: ['hsr'], getTrans: key => key, MutationObserver: class { observe() {} } });
    vm.runInContext(source.slice(start, end), context);
    vm.runInContext(isPool ? 'applyPresetPoolLock()' : 'applySilentPresetLock()', context);
    assert(document.body.classList.contains('is-preset-game'));
    assert.equal(document.body.classList.contains('preview-mode'), true);
    assert.equal(stateWindow.togglePreviewMode(), false);
    if (isPool) {
        assert.equal(stateWindow.savePoolConfig(), false); assert.equal(stateWindow.executeSavePool(), false);
    } else {
        assert.equal(stateWindow.saveAllAndGenerate(), undefined);
        assert.equal(stateWindow.deleteEntireGame(), undefined);
        assert.equal(nodes['btn-add-tag'].style.display, 'none');
    }
    const html = fs.readFileSync(path.join(root, page + '.html'), 'utf8').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '');
    const scripts = [...html.matchAll(/<script\b[^>]*src="([^"]+)"[^>]*>/gi)].map(match => match[1]);
    assert(scripts.indexOf('ui/preview_lock.js') >= 0);
    assert(scripts.indexOf('ui/preview_lock.js') < scripts.indexOf('pages/' + page + '.js'));
}
// 预览隐藏规则明确按用途匹配，不能误隐藏红色的“不保存离开”按钮。
const poolHtml = fs.readFileSync(path.join(root, 'pool_setup.html'), 'utf8');
const poolSource = fs.readFileSync(path.join(root, 'pages/pool_setup.js'), 'utf8');
assert(poolHtml.includes('body.preview-mode .preview-edit-action'));
assert(!/body\.preview-mode\s+button\[style\*/.test(poolHtml));
assert(!/body\.preview-mode\s+button\[onclick\*="(?:remove|Remove|clear)"\]/.test(poolHtml));
const discard = [...poolHtml.matchAll(/<button\b[^>]*>/g)].find(match => match[0].includes('id="btn-unsaved-discard"'))[0];
assert(!discard.includes('preview-edit-action'));
const destructiveButtons = [...poolSource.matchAll(/<button\b[^>]*>/g)]
    .map(match => match[0]).filter(tag => /onclick="[^"]*(?:remove|clear)/i.test(tag));
assert(destructiveButtons.length >= 13);
for (const tag of destructiveButtons) assert(tag.includes('preview-edit-action'), '删除/清除按钮缺少预览标记：' + tag);
console.log('PASS：预览状态、只读保护、删除/清除按钮明确标记及退出选择不被误隐藏');
