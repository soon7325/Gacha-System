const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../ui/quick_settings.js'), 'utf8');
const definition = source.slice(source.indexOf('    const bilingualKey'), source.indexOf('    let panel, anchor;'));
for (const lang of ['zh', 'en']) for (const enabled of [true, false]) {
    const values = { GM_Lang: lang, GM_Bilingual_Hints: String(enabled) };
    const context = vm.createContext({ localStorage: { getItem: key => values[key] } });
    vm.runInContext(definition, context);
    assert.equal(context.label('again').includes(' / '), enabled);
    for (const key of ['autoRandomNote', 'bilingual', 'popup']) assert.ok(!context.label(key).includes(' / '), key);
}
const loadPrefix = source.split("document.addEventListener('DOMContentLoaded', () => {")[1].split('        function render()')[0];
for (const page of ['dashboard.html', 'dashboard', 'settings.html', 'settings', 'settings/']) for (const completed of [false, true]) {
    const values = { GM_Bilingual_Hints: 'true', GM_Bilingual_Onboarding_Completed: String(completed) };
    const handlers = {};
    const context = {
        window: { addEventListener: (name, callback) => { handlers[name] = callback; } },
        location: { pathname: '/' + page }, bilingualKey: 'GM_Bilingual_Hints',
        localStorage: { getItem: key => values[key], setItem: (key, value) => { values[key] = value; } },
        document: { getElementById: () => null }
    };
    const run = () => vm.runInNewContext('(function () {' + loadPrefix + '})()', context);
    run();
    assert.equal(values.GM_Bilingual_Hints, 'true', '进入时不关闭双语');
    if (page.startsWith('settings')) {
        handlers.pagehide();
        assert.equal(values.GM_Bilingual_Hints, completed ? 'true' : 'false');
        assert.equal(values.GM_Bilingual_Onboarding_Completed, 'true');
        values.GM_Bilingual_Hints = 'true'; // 手动重新开启，再次进入设置页。
        run();
        handlers.pagehide();
        assert.equal(values.GM_Bilingual_Hints, 'true');
    }
}
console.log('PASS：仅导航提示双语；首次离开设置页自动关闭，重新开启后跨访问保留');
