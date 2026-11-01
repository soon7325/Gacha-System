const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.join(__dirname, '..');
for (const lang of ['zh', 'en']) for (const enabled of [true, false]) {
    const prefs = { GM_Lang: lang, GM_Bilingual_Hints: String(enabled) };
    const context = vm.createContext({ window: {}, localStorage: { getItem: key => prefs[key] }, document: { addEventListener() {} } });
    for (const file of ['translate_zh.js', 'translate_en.js', 'translate.js']) vm.runInContext(fs.readFileSync(path.join(root, 'translate', file), 'utf8'), context);
    for (const key of ['nav_settings', 'set_lang', 'lang_zh', 'lang_en', 'set_language_first_visit']) assert.equal(context.window.getTrans(key).includes(' / '), enabled, key);
    assert.equal(context.window.getTrans('confirm'), context.window.UI_LIB[lang].confirm);
}
console.log('PASS：设置入口和语言标签/选项遵循双语开关，确认按钮保持当前语言');
