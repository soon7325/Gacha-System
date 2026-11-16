const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const {test} = require('node:test');
const source = fs.readFileSync(require('node:path').join(__dirname, '../../ui/language_onboarding.js'), 'utf8');
const modeKey = 'GM_Language_Guide_Replay_Bilingual';
const pendingKey = 'GM_Language_Guide_Replay';
function storage(values) {
    const entries = new Map(Object.entries(values));
    return {getItem: key => entries.get(key) ?? null, setItem: (key, value) => entries.set(key, String(value))};
}
async function replay({enabled = false, mode, completed = true, lang = 'zh', pending, confirm = true, duringConfirm} = {}) {
    let init, click;
    const local = storage({GM_Bilingual_Hints: String(enabled), GM_Bilingual_Onboarding_Completed: String(completed), GM_Lang: lang});
    const session = storage({...mode && {[modeKey]: mode}, ...pending && {[pendingKey]: pending}}), navigation = [];
    const context = {
        localStorage: local, sessionStorage: session,
        window: {getTrans: key => key, customConfirm: async () => { duringConfirm?.(local); return confirm; }, location: {assign: value => navigation.push(value)}},
        document: {addEventListener: (_, handler) => {init = handler;}, getElementById: () => ({addEventListener: (_, handler) => {click = handler;}})}
    };
    vm.runInNewContext(source, context);
    init();
    await click();
    return {local, session, navigation};
}
test('关闭时重新体验始终临时开启，不受首次完成标记、语言或旧会话状态影响', async () => {
    for (const mode of [undefined, 'temporary', 'preserve', 'invalid']) for (const completed of [false, true]) for (const lang of ['zh', 'en']) for (const pending of [undefined, 'true']) {
        const state = await replay({mode, completed, lang, pending});
        assert.equal(state.session.getItem(modeKey), 'temporary');
        assert.equal(state.local.getItem('GM_Bilingual_Hints'), 'false', 'only Home temporarily enables hints');
        assert.deepEqual(state.navigation, ['index.html']);
    }
});
test('取消确认不改变关闭状态和旧会话记录', async () => {
    for (const mode of [undefined, 'temporary', 'preserve']) {
        const state = await replay({mode, confirm: false});
        assert.equal(state.local.getItem('GM_Bilingual_Hints'), 'false');
        assert.equal(state.session.getItem(modeKey), mode ?? null);
        assert.equal(state.session.getItem(pendingKey), null);
        assert.deepEqual(state.navigation, []);
    }
});
test('确认弹窗期间关闭双语也以确认时的关闭状态为准', async () => {
    const state = await replay({enabled: true, mode: 'preserve', duringConfirm: local => local.setItem('GM_Bilingual_Hints', 'false')});
    assert.equal(state.session.getItem(modeKey), 'temporary');
});
test('连续重放不会把临时开启升级为永久；已永久开启仍保留', async () => {
    for (const mode of [undefined, 'temporary', 'preserve']) {
        const state = await replay({enabled: true, mode});
        assert.equal(state.session.getItem(modeKey), mode === 'temporary' ? 'temporary' : 'preserve');
    }
});
