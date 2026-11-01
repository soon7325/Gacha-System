// 公共文字格式与提示组件测试；运行：node tests/ui_shared.test.cjs。
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');

// 可控计时器专门验证“旧提示隐藏了新提示”的竞态，不依赖真实等待。
let now = 0, timerId = 0;
const timers = new Map();
function advance(milliseconds) {
    const until = now + milliseconds;
    while (true) {
        const next = [...timers].filter(([, task]) => task.at <= until).sort((a, b) => a[1].at - b[1].at)[0];
        if (!next) break;
        now = next[1].at;
        timers.delete(next[0]);
        next[1].callback();
    }
    now = until;
}
function element() {
    const classes = new Set();
    return {
        style: {}, textContent: '', children: [],
        classList: { add: name => classes.add(name), remove: name => classes.delete(name), contains: name => classes.has(name) },
        appendChild(child) { this.children.push(child); },
        replaceChildren(...children) { this.children = children; }
    };
}
const toastNode = element(), logNode = element();
let language = 'zh';
const context = vm.createContext({
    window: {}, localStorage: { getItem: () => language },
    document: { getElementById: id => ({ 'toast-notification': toastNode, 'cl-toast': logNode })[id] || null, createElement: element },
    setTimeout: (callback, delay) => { timers.set(++timerId, { callback, at: now + delay }); return timerId; },
    clearTimeout: id => timers.delete(id)
});
for (const file of ['logic/catalog_utils.js', 'ui/item_format.js', 'ui/toast.js']) vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename: file });
const { ItemFormat, Toast } = context.window;

// 新旧英文字段、名字字符串、自定义稀有度及实时语言切换。
let catalog = { char: [{ name: '角色', en: 'Character', short: '角', eshort: 'Char' }] };
const formatter = ItemFormat.create({ getCatalog: () => catalog, getTiers: () => [{ id: 'custom', en: 'Custom Rank' }] });
assert.equal(formatter.getItemName('角色'), '角色');
assert.equal(formatter.getItemShort('角色'), '角');
language = 'en';
assert.equal(formatter.getItemName({ name: '角色' }), 'Character');
assert.equal(formatter.getItemShort({ name: '角色' }), 'Char');
assert.equal(formatter.getItemName({ name: '旧', nameEn: 'Legacy' }), 'Legacy');
assert.equal(formatter.getItemShort({ name: '旧', shortEn: 'Old' }), 'Old');
assert.equal(formatter.getTierName({ id: 'custom', name: '自定义' }), 'Custom Rank');
assert.equal(formatter.getTierName(null), '?');
assert.equal(formatter.getItemName(null), '?');
assert.equal(formatter.getItemName('未知角色'), '未知角色');
assert.equal(formatter.getLabelName({ name: '限定', en: 'Limited' }), 'Limited');
catalog = { char: [{ name: '角色', en: 'Updated', eshort: 'New' }] };
assert.equal(formatter.getItemName('角色'), 'Updated');
const simulator = ItemFormat.create({ genericTierNames: true, missingTier: '', fallbackTierId: false });
assert.equal(simulator.getTierName({ id: 'tier_S', name: 'S级' }), 'S-Rank');
assert.equal(simulator.getTierName({ id: 'tier_6' }), '6-Star');
const editor = ItemFormat.create({ missingItem: '', missingTier: '', fallbackTierId: false });
assert.equal(editor.getItemName(null), '');
assert.equal(editor.getTierName({ id: 'unnamed' }), '');
language = 'zh';
assert.equal(formatter.getLabelName({ name: '限定', en: 'Limited' }), '限定');

// 同一提示在淡出中被替换，新提示仍完整显示自己的时长。
const toast = Toast.create();
assert.equal(toast.show('第一次', 'danger'), true);
assert.equal(toastNode.style.borderColor, '#ff4757');
advance(1600);
assert.equal(toastNode.style.opacity, '0');
toast.show('第二次', 'cancel');
advance(200);
assert.equal(toastNode.style.display, 'block');
assert.equal(toastNode.style.opacity, '1');
assert.equal(toastNode.style.borderColor, '#888');
advance(1300);
assert.equal(toastNode.style.opacity, '0');
advance(300);
assert.equal(toastNode.style.display, 'none');

// 文字按纯文本插入；主动关闭清除全部计时器，缺失节点不会报错。
toast.show('<img onerror="bad()">');
assert.equal(toastNode.children[0].children[1].textContent, '<img onerror="bad()">');
toast.dismiss();
assert.equal(timers.size, 0);
assert.equal(Toast.create({ target: 'missing' }).show('忽略'), false);

// Dashboard 保留延迟淡入、警告图标与配色；更新日志保留 class 模式。
const dashboard = Toast.create({ duration: 1600, showDelay: 10, types: { info: { icon: '↩️', color: '#f1c40f' } } });
dashboard.show('撤回', 'info');
assert.equal(toastNode.style.opacity, '0');
advance(10);
assert.equal(toastNode.style.opacity, '1');
assert.equal(toastNode.style.borderColor, '#f1c40f');
dashboard.dismiss();
const changelog = Toast.create({ target: 'cl-toast', mode: 'class', duration: 1800 });
changelog.show('已复制');
advance(1700);
changelog.show('新提示');
advance(100);
assert(logNode.classList.contains('show'));
assert.equal(logNode.textContent, '新提示');
advance(1700);
assert(!logNode.classList.contains('show'));
console.log('PASS：名称回退、语言切换、图鉴更新、提示竞态与页面样式配置');
