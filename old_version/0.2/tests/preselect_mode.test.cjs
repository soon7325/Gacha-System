// 装配模式切换只隐藏 UP 草稿，不清空输入；保存才省略 UP 字段。
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const code = fs.readFileSync(path.join(__dirname, '../pages/pool_setup.js'), 'utf8');
const grid = { style: {} };
const up = { style: {}, parentElement: grid };
const std = { firstElementChild: { textContent: '' } };
const inputs = {
    '.input-tier-up-min': { value: '2', parentElement: { parentElement: up } },
    '.input-tier-std-min': { value: '7', parentElement: { parentElement: std } }
};
const assembly = { tierRules: { G: { mode: 'flat' } } };
const context = vm.createContext({
    poolAssembly: assembly, getTrans: key => key,
    document: { querySelectorAll: () => [{ getAttribute: () => 'G', querySelector: selector => inputs[selector] }] }
});
const start = code.indexOf('        function refreshPreselectModes()');
vm.runInContext(code.slice(start, code.indexOf('        function injectDbRulesToUI', start)), context);
context.refreshPreselectModes();
assert.equal(up.style.display, 'none'); assert.equal(grid.style.gridTemplateColumns, '1fr');
assert.equal(std.firstElementChild.textContent, 'cp_sec12_flat_limit');
assembly.tierRules.G.mode = 'up_split'; context.refreshPreselectModes();
assert.equal(up.style.display, ''); assert.equal(grid.style.gridTemplateColumns, '1fr 1fr');
assert.equal(inputs['.input-tier-up-min'].value, '2');
assert.equal(inputs['.input-tier-std-min'].value, '7');
assert.match(code, /\? \{ stdMin, stdMax \} : \{ upMin, upMax, stdMin, stdMax \}/);
assert.ok(code.includes("isFlat ? ['std'] : ['up', 'std']"));
// 初始化最终装配模式恢复后也必须同步，而不只靠开关触发。
const init = code.slice(code.indexOf('function initPage()'), code.indexOf('setTimeout(initDirtyTracking'));
assert.ok(init.indexOf('refreshPreselectModes();') > init.indexOf('loadPoolConfig();'));
assert.ok(code.includes('if (savedTierData !== null) preselectDraft'));
assert.ok(code.includes('savedTierData = preselectDraft;'));
console.log('PASS：大池全宽、UP草稿切换恢复、隐藏UP不校验、保存省略UP字段');
