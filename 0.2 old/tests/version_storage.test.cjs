// 独立模拟同源页面：迁移复制、版本互不覆盖、枚举/清理/会话隔离。
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../logic/version_storage.js'), 'utf8');
function storage(entries = []) {
    const map = new Map(entries);
    return { get length() { return map.size; }, key: i => [...map.keys()][i] ?? null,
        getItem: key => map.get(key) ?? null, setItem: (key, value) => map.set(key, String(value)), removeItem: key => map.delete(key) };
}
const local = storage([['GM_Data_test', 'original'], ['other_app', 'untouched']]);
const session = storage();
function page(pathname, search = '') {
    const window = { localStorage: local, sessionStorage: session, location: { pathname, search } };
    vm.runInNewContext(source, { window, URLSearchParams, console });
    return window;
}
const modern = page('/index.html');
assert.equal(modern.localStorage.getItem('GM_Data_test'), 'original');
modern.localStorage.setItem('GM_Data_test', 'modern');
assert.equal(local.getItem('GM_Data_test'), 'original');
local.setItem('GM_Data_test', 'old changed');
assert.equal(page('/settings.html').localStorage.getItem('GM_Data_test'), 'modern');
const old = page('/0.1%20old/index.html');
assert.equal(old.localStorage.getItem('GM_Data_test'), 'old changed');
old.localStorage.setItem('GM_Data_test', 'isolated old');
assert.equal(modern.localStorage.getItem('GM_Data_test'), 'modern');
modern.sessionStorage.setItem('GM_Pending', 'new');
assert.equal(old.sessionStorage.getItem('GM_Pending'), null);
assert.equal(modern.localStorage.length, 1); assert.equal(modern.localStorage.key(0), 'GM_Data_test');
modern.localStorage.clear(); assert.equal(modern.localStorage.length, 0);
assert.equal(old.localStorage.getItem('GM_Data_test'), 'isolated old');
assert.equal(local.getItem('other_app'), 'untouched');
assert.equal(page('/index.html').localStorage.getItem('GM_Data_test'), null); // 清空不重新迁移。
assert.equal(page('/changelog.html', '?channel=0.1').localStorage.getItem('GM_Data_test'), 'isolated old');
assert.equal(page('/changelog.html', '?channel=0.2').localStorage.getItem('GM_Data_test'), null); // 当前版本使用主通道的 v0.2 命名空间。
// 兼容 0.1 的存储拦截器：包装方法后仍只能修改该版本。
const previousSet = old.localStorage.setItem;
old.localStorage.setItem = function(key, value) { previousSet.apply(this, arguments); };
old.localStorage.setItem('GM_Cloud_Test', 'old only');
assert.equal(modern.localStorage.getItem('GM_Cloud_Test'), null);
assert.equal(local.getItem('GM_Cloud_Test'), null);
for (const file of ['index', 'settings', 'simulator', 'custom_setup', 'custom_pool_setup', 'custom_dashboard']) {
    const html = fs.readFileSync(path.join(__dirname, '../0.1 old', file + '.html'), 'utf8');
    const loader = html.indexOf('src="../logic/version_storage.js"');
    assert.ok(loader >= 0 && loader < html.indexOf('localStorage'), file);
}
for (const file of ['index', 'settings', 'changelog', 'dashboard', 'simulator', 'gallery_setup', 'pool_setup']) {
    const html = fs.readFileSync(path.join(__dirname, '..', file + '.html'), 'utf8');
    assert.ok(html.indexOf('src="logic/version_storage.js"') < html.indexOf('localStorage'));
}
console.log('PASS：复制迁移、版本读写隔离、枚举/清空、会话隔离、旧日志兼容及所有页面加载顺序');

for (const route of ['/changelog', '/changelog/']) {
 assert.equal(page(route, '?channel=0.1').localStorage.getItem('GM_Data_test'), 'isolated old');
 assert.equal(page(route, '?channel=0.2').localStorage.getItem('GM_Data_test'), null);
}
console.log('PASS：无扩展名版本详情页保留通道存储隔离');
