// 验证游戏折叠与侧栏外壳独立，未设置状态不会全部展开。
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const code = fs.readFileSync(path.join(root, 'ui/layout.js'), 'utf8');
const expression = code.match(/const isCollapsed = (.*);/)[1];
for (const [state, expected] of [[{}, true], [{ game: true }, true], [{ game: false }, false]]) {
    for (const shellCollapsed of [true, false]) {
        assert.equal(vm.runInNewContext(expression, {
            collapseState: state, gameId: 'game',
            sidebar: { classList: { contains: () => shellCollapsed } }
        }), expected);
    }
}
const setter = code.slice(code.indexOf('function setSidebarState('), code.indexOf('sidebar.innerHTML ='));
assert.ok(!setter.includes("classList.add('collapsed'))"), '外壳收起不能批量修改游戏折叠状态');
assert.match(fs.readFileSync(path.join(root, 'ui/style.css'), 'utf8'), /\.sidebar\.collapsed \.sidebar-pool-list,/);
console.log('PASS：默认收起、显式展开/收起、侧栏外壳独立和收起时隐藏卡池');
