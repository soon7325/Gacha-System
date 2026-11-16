// 临时云端入口测试：只验证提示与事件拦截，不连接 Firebase。
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..'), listeners = {}, alerts = [];
let language = 'zh', appended = 0;
const window = { Dialog: { create(config) { return { alert(message) {
    alerts.push({ message, ...config.defaults() }); return Promise.resolve(true);
} }; } } };
const document = {
    addEventListener(type, handler, capture) { assert.equal(capture, true); listeners[type] = handler; },
    createElement: () => ({ style: {}, append() {} }), body: { append() { appended++; } }
};
const context = vm.createContext({ window, document });
for (const file of ['translate/translate_zh.js', 'translate/translate_en.js', 'ui/cloud_unavailable.js']) {
    vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context);
}
window.getTrans = key => window.UI_LIB[language][key] || key;
function event(type, entry) {
    return { type, target: { closest: () => entry }, preventDefault() { this.prevented = true; },
        stopImmediatePropagation() { this.stopped = true; } };
}
const button = event('click', { tagName: 'BUTTON' }); listeners.click(button);
assert(button.prevented && button.stopped); assert.equal(alerts[0].title, '云端功能暂时关闭');
assert(alerts[0].message.includes('本地功能仍可正常使用'));
language = 'en'; listeners.click(event('click', { tagName: 'DIV' }));
assert.equal(alerts[1].okText, 'Got it'); assert(alerts[1].message.includes('future update'));
assert.equal(appended, 1); // 共用独立提示框，不重复创建。
const local = event('click', null); listeners.click(local); assert(!local.prevented);
const formClick = event('click', { tagName: 'FORM' }); listeners.click(formClick); assert(!formClick.prevented);
const submit = event('submit', { tagName: 'FORM' }); listeners.submit(submit); assert(submit.prevented && submit.stopped);
for (const page of ['index', 'settings']) {
    const html = fs.readFileSync(path.join(root, page + '.html'), 'utf8');
    assert(html.includes('data-cloud-unavailable'));
    assert(html.indexOf('src="ui/dialog.js"') < html.indexOf('src="ui/cloud_unavailable.js"'));
    for (const tag of html.matchAll(/<button\b[^>]*onclick="(?:exportLocalData|clearAllLocalData)\([^>]*>/g)) {
        assert(!tag[0].includes('data-cloud-unavailable'));
    }
}
// 底层移除后，旧按钮保留的函数名仍安全可调用，不再请求 SDK/认证服务。
for (const name of ['openAuthModal', 'realGoogleLogin', 'triggerForceSync', 'resetSyncFlag', 'saveProfile', 'savePassword']) {
    assert.equal(typeof window[name], 'function');
    const count = alerts.length;
    window[name](); assert.equal(alerts.length, count + 1);
}
for (const removed of ['pages/index_auth.js', 'pages/settings_auth.js']) assert(!fs.existsSync(path.join(root, removed)));
// 无认证模块时设置页必须直接显示入口，不能等待不存在的登录状态回调。
const settingsHtml = fs.readFileSync(path.join(root, 'settings.html'), 'utf8');
const loading = settingsHtml.match(/<div\b[^>]*id="acc-loading"[^>]*>/)[0];
const guest = settingsHtml.match(/<div\b[^>]*id="acc-logged-out"[^>]*>/)[0];
assert(loading.includes('display: none'));
assert(guest.includes('display: flex'));
assert(settingsHtml.includes('data-i18n="cloud_unavailable_account_status"'));
assert(window.UI_LIB.zh.cloud_unavailable_account_status);
assert(window.UI_LIB.en.cloud_unavailable_account_status);
for (const file of ['ui/layout.js', 'pages/dashboard.js', 'pages/settings.js', 'index.html', 'settings.html']) {
    const code = fs.readFileSync(path.join(root, file), 'utf8');
    assert(!/firebasejs|firebaseConfig|firebaseUid|syncPullDataToFirebase|backupToFirebase|GM_HasSynced|GM_ForceSync/.test(code));
    assert(!code.includes('src="pages/index_auth.js"')); assert(!code.includes('src="pages/settings_auth.js"'));
}
console.log('PASS：中英文提示、捕获云端点击/提交、本地操作不拦截及提示框复用');
