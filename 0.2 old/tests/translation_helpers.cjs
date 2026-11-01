// 翻译整理/回归测试的只读辅助工具，不会加载到网页。
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
function loadDictionaries() {
    const context = vm.createContext({ window: {} });
    for (const lang of ['zh', 'en']) vm.runInContext(fs.readFileSync(path.join(root, 'translate', 'translate_' + lang + '.js'), 'utf8'), context);
    return context.window.UI_LIB;
}
function sourceFiles() {
    const files = fs.readdirSync(root).filter(file => file.endsWith('.html'));
    for (const dir of ['pages', 'ui', 'logic', 'Preset_Data']) {
        for (const file of fs.readdirSync(path.join(root, dir))) if (file.endsWith('.js')) files.push(dir + '/' + file);
    }
    return files;
}
function isReferenced(key, sources) {
    // 字面量、HTML 属性和 t.key 形式都纳入；动态游戏/卡池 key 不依赖字面引用。
    if (/^(game_|pool_)/.test(key)) return true;
    return sources.some(source => source.includes("'" + key + "'") || source.includes('"' + key + '"') ||
        new RegExp('\\.' + key + '\\b').test(source));
}
function explicitKeys(source) {
    return [...source.matchAll(/(?:getTrans|Dialog\.text|\btext)\s*\(\s*['"]([a-zA-Z_][\w]*)['"]|data-i18n(?:-placeholder|-title|-aria-label)?\s*=\s*['"]([a-zA-Z_][\w]*)['"]/g)]
        .map(match => match[1] || match[2]);
}
module.exports = { fs, path, root, loadDictionaries, sourceFiles, isReferenced, explicitKeys };
