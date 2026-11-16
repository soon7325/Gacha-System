// 词典回归检查：仅在开发测试时运行，不会在前端显示。
const assert = require('node:assert/strict');
const h = require('./translation_helpers.cjs');
const dictionaries = h.loadDictionaries();
const sources = h.sourceFiles().map(file => ({ file, code: h.fs.readFileSync(h.path.join(h.root, file), 'utf8') }));
// 两种语言使用同一顺序和同一组 key，防止只改其中一份。
assert.deepEqual(Object.keys(dictionaries.zh), Object.keys(dictionaries.en));
for (const lang of ['zh', 'en']) {
    const code = h.fs.readFileSync(h.path.join(h.root, 'translate', 'translate_' + lang + '.js'), 'utf8');
    const declarations = [...code.matchAll(/^\s*(\w+):/gm)].map(match => match[1]);
    assert.equal(declarations.length, new Set(declarations).size, lang + ' 不应重复声明 key');
    for (const { file, code } of sources) for (const key of h.explicitKeys(code)) {
        assert.ok(Object.hasOwn(dictionaries[lang], key), file + ' 缺少 ' + lang + ':' + key);
    }
    for (const key of Object.keys(dictionaries[lang])) {
        assert.equal(typeof dictionaries[lang][key], 'string');
        assert.ok(h.isReferenced(key, sources.map(source => source.code)), '未使用词条：' + key);
    }
}
// 公共按钮共用翻译；不同序号含义不因为中文相同而合并。
assert.equal(dictionaries.zh.confirm_delete, '确认删除');
assert.equal(dictionaries.en.confirm_delete, 'Confirm Delete');
assert.notEqual(dictionaries.en.cp_sec2_soft_1, dictionaries.en.gold_order_prefix);
assert.notEqual(dictionaries.en.cp_sec7_up_index_prefix, dictionaries.en.gold_order_prefix);
for (const key of ['cancel', 'confirm', 'delete_rule', 'match_tags', 'save_and_leave', 'discard_and_leave']) {
    assert.ok(dictionaries.zh[key] && dictionaries.en[key]);
}
console.log('PASS：中英文顺序、重复声明、静态引用、未使用词条、公共操作和不同序号含义');
