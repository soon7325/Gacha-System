// 拖拽交互测试：仅 Node 执行，不会加载到前端。node tests/drag_sort.test.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// 最小 DOM 替身：模拟事件、嵌套节点、坐标和样式，不依赖浏览器拖动鼠标。
function node(selector, id) {
    const handlers = new Map(), attrs = new Map(), classes = new Set();
    return {
        selector, dataset: { id }, children: [], parent: null, style: { opacity: '', borderTop: '' },
        classList: {
            add: (...names) => names.forEach(name => classes.add(name)),
            remove: (...names) => names.forEach(name => classes.delete(name)),
            contains: name => classes.has(name),
            toggle(name, enabled) { if (enabled) classes.add(name); else classes.delete(name); }
        },
        append(child) { this.children.push(child); child.parent = this; },
        contains(child) { return child === this || this.children.some(item => item.contains(child)); },
        closest(value) { return this.selector === value ? this : this.parent?.closest(value) || null; },
        querySelectorAll(value) { return this.children.flatMap(child => [...(child.selector === value ? [child] : []), ...child.querySelectorAll(value)]); },
        querySelector(value) { return this.querySelectorAll(value)[0] || null; },
        setAttribute(key, value) { attrs.set(key, value); }, getAttribute(key) { return attrs.get(key) ?? null; },
        removeAttribute(key) { attrs.delete(key); },
        getBoundingClientRect: () => ({ left: 0, top: 0, width: 100, height: 100 }),
        addEventListener(type, fn) { if (!handlers.has(type)) handlers.set(type, new Set()); handlers.get(type).add(fn); },
        removeEventListener(type, fn) { handlers.get(type)?.delete(fn); },
        count(type) { return handlers.get(type)?.size || 0; },
        emit(type, extra = {}) {
            const event = { target: this, clientX: 25, clientY: 25, prevented: false, stopped: false,
                preventDefault() { this.prevented = true; }, stopPropagation() { this.stopped = true; },
                dataTransfer: { setData(key, value) { this[key] = value; } }, ...extra };
            for (const fn of [...(handlers.get(type) || [])]) fn(event);
            return event;
        }
    };
}
const document = { getElementById: () => null }, window = {};
vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../ui/drag_sort.js'), 'utf8'), { document, window });
const { DragSort } = window;
const list = node('root'), a = node('.item', 'a'), b = node('.item', 'b');
list.append(a); list.append(b);
const moves = [];
let binding = DragSort.bind(list, '.item', (...args) => moves.push(args));
assert.equal(a.getAttribute('draggable'), 'true');
assert(a.emit('dragstart').stopped); assert(a.classList.contains('is-dragging'));
b.emit('dragover'); assert(b.classList.contains('drag-over-top'));
b.emit('drop'); assert.deepEqual(moves.pop(), ['a', 'b', true]);
assert(!a.classList.contains('is-dragging')); assert(!b.classList.contains('drag-over-top'));
a.emit('dragstart'); b.emit('drop', { clientY: 75 }); assert.deepEqual(moves.pop(), ['a', 'b', false]);
a.emit('dragstart'); a.emit('drop'); assert.equal(moves.length, 0); a.emit('dragend');

// 重复绑定先解绑，防止重渲染后每次拖动重复调用回调；销毁还原属性。
binding = DragSort.bind(list, '.item', (...args) => moves.push(args), { axis: 'x' });
assert.equal(a.count('dragstart'), 1);
a.emit('dragstart'); b.emit('dragover', { clientX: 75 }); assert(b.classList.contains('drag-over-right'));
b.emit('drop', { clientX: 75 }); assert.deepEqual(moves.pop(), ['a', 'b', false]);
a.emit('dragstart'); b.emit('drop', { clientX: 25 }); assert.deepEqual(moves.pop(), ['a', 'b', true]);
binding.destroy(); assert.equal(a.count('dragstart'), 0); assert.equal(a.getAttribute('draggable'), null);

// 分类的输入框不能触发手柄拖拽；标题可以。动态 canDrag 禁止预设/收起状态。
const handle = node('.handle'), input = node('input'); a.append(handle); a.append(input);
let allowed = true;
binding = DragSort.bind(list, '.item', (...args) => moves.push(args), { handleSelector: '.handle', canDrag: () => allowed });
a.emit('mousedown', { target: input }); assert.equal(a.getAttribute('draggable'), 'false');
assert(a.emit('dragstart', { target: input }).prevented);
a.emit('mousedown', { target: handle }); assert.equal(a.getAttribute('draggable'), 'true');
// 原生浏览器从手柄按下，但 dragstart.target 是整行，不是手柄。
assert.equal(a.emit('dragstart', { target: a }).prevented, false);
b.emit('drop'); assert.equal(moves.length, 1); moves.length = 0;
assert.equal(a.getAttribute('draggable'), 'false');
assert.equal(a.emit('dragstart', { target: a }).prevented, true); // 不能复用上次按下。
a.emit('mousedown', { target: handle }); a.emit('mouseup');
assert.equal(a.emit('dragstart', { target: a }).prevented, true); // 松开后撤销授权。
a.emit('mousedown', { target: a });
assert.equal(a.emit('dragstart', { target: a }).prevented, true); // 空白区域也不能启动。
allowed = false; assert(a.emit('dragstart', { target: handle }).prevented);
b.emit('drop'); assert.equal(moves.length, 0); binding.destroy();

// 侧栏按目标索引插入，保留原本的透明度/高亮样式；只让标题本身 draggable。
const otherHandle = node('.handle'); b.append(otherHandle);
a.style.opacity = '0.8'; b.style.borderTop = 'original';
binding = DragSort.bind(list, '.item', (...args) => moves.push(args), {
    handleSelector: '.handle', handleOnly: true, position: 'target',
    draggingClass: '', opacity: '0.5', hoverBorder: true
});
assert.equal(a.getAttribute('draggable'), null); assert.equal(handle.getAttribute('draggable'), 'true');
handle.emit('dragstart'); assert.equal(a.style.opacity, '0.5');
b.emit('dragover'); assert.equal(b.style.borderTop, '2px solid var(--primary, #3498db)');
b.emit('drop', { clientY: 99 }); assert.deepEqual(moves.pop(), ['a', 'b', true]);
assert.equal(a.style.opacity, '0.8'); assert.equal(b.style.borderTop, 'original'); binding.destroy();

// 不同容器没有共享来源，不能跨游戏拖动卡池；dragend/销毁会清掉提示。
const other = node('other'), c = node('.item', 'c'); other.append(c);
const otherBinding = DragSort.bind(other, '.item', () => assert.fail('跨容器排序'));
binding = DragSort.bind(list, '.item', () => {}, { hoverClass: 'drag-over' });
a.emit('dragstart'); c.emit('drop'); b.emit('dragover'); assert(b.classList.contains('drag-over'));
a.emit('dragend'); assert(!b.classList.contains('drag-over')); binding.destroy(); otherBinding.destroy();
DragSort.bind(null, '.item', () => assert.fail()).destroy();

// 拖到一半被锁定也不能提交，避免只在 dragstart 检查权限。
let unlocked = true;
binding = DragSort.bind(list, '.item', () => assert.fail('锁定后仍提交排序'), { canDrag: () => unlocked });
a.emit('dragstart'); unlocked = false; b.emit('drop'); a.emit('dragend'); binding.destroy();

// 所有新版布局入口都先加载组件；旧日志通道不加载新版拖拽依赖。
const root = path.resolve(__dirname, '..');
// 执行真实分类渲染：最末分类插入 DOM 以后才绑定网格，重渲染也必须重新绑定。
const gallerySource = fs.readFileSync(path.join(root, 'pages/gallery_setup.js'), 'utf8');
for (const [start, end] of [['function renderGlobalTiers()', 'window.addGlobalTier'], ['function renderCustomTags()', 'window.addCustomTag']]) {
    const from = gallerySource.indexOf(start), to = gallerySource.indexOf(end, from);
    assert(gallerySource.slice(from, to).includes("}, '.drag-handle');"), '稀有度/标签必须显式使用手柄');
}
const knownIds = new Set(['categories-container']), gridCalls = [];
const categoryContainer = {
    set innerHTML(value) {
        knownIds.clear(); knownIds.add('categories-container');
        for (const m of value.matchAll(/id="([^"]+)"/g)) knownIds.add(m[1]);
    },
    insertAdjacentHTML(position, html) { for (const m of html.matchAll(/id="([^"]+)"/g)) knownIds.add(m[1]); }
};
const renderContext = vm.createContext({
    window: { getTrans: key => key }, document: { getElementById: id => id === 'categories-container' ? categoryContainer : knownIds.has(id) ? {} : null },
    gameInfo: { categories: [{ id: 'char', name: '角色' }, { id: 'wep', name: '武器' }], globalTiers: [{ id: 'G', name: '金', color: 'gold' }] },
    catalog: { char: [], wep: [] }, PRESET_GAME_IDS: [], gameId: 'custom',
    getActiveTagDefinitions: () => ({}), getLang: () => 'zh',
    getLocalizedCatName: item => item.name, getLocalizedTierName: item => item.name, getLocalizedTagName: item => item.name,
    tierOpenState: {}, tierFilterState: {}, categoryOpenState: {},
    bindGridDragEvents: id => { assert(knownIds.has(id), '绑定发生在网格插入前：' + id); gridCalls.push(id); }, bindDragEvents: () => {}
});
const renderStart = gallerySource.indexOf('        function renderGameIcon()');
vm.runInContext(gallerySource.slice(renderStart, gallerySource.indexOf('        window.addNewCategory', renderStart)), renderContext);
vm.runInContext('renderCategories(); renderCategories();', renderContext);
assert.deepEqual(gridCalls, ['grid_char_G', 'grid_wep_G', 'grid_char_G', 'grid_wep_G']);

// 真实页面适配的权限：预览全部禁拖；官方内容只读，但卡池导航顺序例外保留。
let previewState = false, presetState = false, options;
const adapterContext = vm.createContext({
    DragSort: { bind(container, selector, callback, config) { options = config; } },
    galleryPreviewLock: { isPreview: () => previewState, isLocked: () => previewState || presetState }
});
const adapterStart = gallerySource.indexOf('        function bindDragEvents(');
vm.runInContext(gallerySource.slice(adapterStart, gallerySource.indexOf('        // 图鉴数据重排', adapterStart)), adapterContext);
vm.runInContext('bindDragEvents("c", ".item", () => {});', adapterContext);
assert.equal(options.canDrag(), true); previewState = true; assert.equal(options.canDrag(), false);
previewState = false; presetState = true; assert.equal(options.canDrag(), false);
vm.runInContext('bindDragEvents("c", ".item", () => {}, null, {allowPreset:true});', adapterContext);
assert.equal(options.canDrag(), true); previewState = true; assert.equal(options.canDrag(), false);
vm.runInContext('bindGridDragEvents("c", ".item", () => {});', adapterContext); assert.equal(options.canDrag(), false);
for (const page of ['index', 'settings', 'dashboard', 'simulator', 'pool_setup', 'gallery_setup']) {
    const html = fs.readFileSync(path.join(root, page + '.html'), 'utf8').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '');
    const scripts = [...html.matchAll(/<script\b[^>]*src="([^"]+)"[^>]*>/gi)].map(m => m[1]);
    assert(scripts.indexOf('ui/drag_sort.js') >= 0);
    assert(scripts.indexOf('ui/drag_sort.js') < scripts.indexOf('ui/layout.js'));
}
const log = fs.readFileSync(path.join(root, 'changelog.html'), 'utf8');
assert(log.includes('if (window.GACHA_IS_LATEST) {'));
assert(log.includes('document.write(\'<script src="ui/drag_sort.js">'));
console.log('PASS：上下/左右排序、手柄、目标索引、跨容器隔离、重复绑定、样式清理和加载顺序');
