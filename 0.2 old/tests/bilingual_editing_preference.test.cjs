const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const stored = new Map([['GM_Bilingual_Hints', 'true']]);
const created = [], windowEvents = {};
function element() {
    const classes = new Set(), handlers = {};
    return { style: {}, handlers, hidden: false, disabled: false, children: [],
        classList: { contains: value => classes.has(value), add: value => classes.add(value), toggle(value, on) { if (on) classes.add(value); else classes.delete(value); } },
        addEventListener: (name, callback) => { handlers[name] = callback; },
        setAttribute() {}, removeAttribute() {}, before() {}, appendChild(child) { this.children.push(child); },
        getBoundingClientRect: () => ({ width: 200 })
    };
}
const input = element(); input.style.width = '200px'; input.id = 'test'; input.value = '中文';
const checkbox = { checked: false };
const context = vm.createContext({
    window: { addEventListener: (name, callback) => { windowEvents[name] = callback; }, dispatchEvent(event) { windowEvents[event.type]?.(event); } },
    document: { addEventListener() {}, createElement() { const node = element(); created.push(node); return node; }, getElementById: () => checkbox },
    localStorage: { getItem: key => stored.get(key) ?? null, setItem: (key, value) => stored.set(key, value) },
    Event: class { constructor(type) { this.type = type; } }
});
vm.runInContext(fs.readFileSync(path.join(root, 'ui/bilingual_input.js'), 'utf8'), context);
const api = context.window.BilingualInput;
assert.equal(api.isEnabled(), false, '双语提示开启不应连带开启双语编辑');
const values = { zh: '中文', en: 'English' };
const binding = api.bind(input, { isLocked: () => false, getLanguage: () => 'zh', getValue: language => values[language], setValue: (language, value) => { values[language] = value; } });
const button = created[1]; assert.equal(button.hidden, true); assert.equal(button.disabled, true);
input.value = '修改中文'; input.handlers.input(); assert.equal(values.zh, '修改中文'); assert.equal(values.en, 'English');
const settings = fs.readFileSync(path.join(root, 'pages/settings.js'), 'utf8');
const start = settings.indexOf('window.changeBilingualEditing =');
vm.runInContext(settings.slice(start, settings.indexOf('window.changeLang =', start)), context);
checkbox.checked = true; context.window.changeBilingualEditing(); binding.refresh();
assert.equal(api.isEnabled(), true); assert.equal(button.hidden, false); assert.equal(button.disabled, false);
checkbox.checked = false; context.window.changeBilingualEditing(); binding.refresh();
assert.equal(button.hidden, true); assert.equal(values.en, 'English');
assert.equal(stored.get('GM_Bilingual_Hints'), 'true');
console.log('PASS: 双语编辑默认关闭、与双语提示独立、开关持久化、主语言可编辑及另一语言保留');
