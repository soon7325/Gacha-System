// 回归测试：手动预览仍提醒，导入草稿保存/放弃/失败回滚。不访问真实浏览器存储。
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const gallery = fs.readFileSync(path.join(root, 'pages/gallery_setup.js'), 'utf8');
const pool = fs.readFileSync(path.join(root, 'pages/pool_setup.js'), 'utf8');
const stored = new Map(), session = new Map();
let failKey = null, resets = 0, marked = 0, config;
const elements = {
    'input-game-name': { value: 'Imported Game' },
    'input-global-max-char': { value: '7' },
    'input-global-max-wep': { value: '5' },
    'input-global-max-other': { value: '5' }
};
const classes = new Set(['preview-mode']);
const context = vm.createContext({
    window: { getTrans: key => key }, console,
    document: { getElementById: id => elements[id], body: { classList: { contains: name => classes.has(name) } } },
    localStorage: {
        getItem: key => stored.get(key) ?? null,
        setItem(key, value) { if (key === failKey) { failKey = null; throw Error('QuotaExceeded'); } stored.set(key, value); },
        removeItem: key => stored.delete(key)
    },
    sessionStorage: { getItem: key => session.get(key) ?? null, removeItem: key => session.delete(key) },
    gameId: 'test', gameInfo: {}, catalog: {}, getLang: () => 'zh', alert: () => {}, showToast: () => {},
    markPageDirty: () => marked++, renderSidebar: () => {},
    galleryPreviewLock: { isLocked: () => classes.has('preview-mode') || classes.has('is-preset-game') },
    galleryChangeTracker: { reset: () => resets++ }, checkHasUnsavedChanges: () => true,
    UnsavedChanges: { create(options) { config = options; return { request() {} }; } }
});
function load(start, end) {
    const from = gallery.indexOf(start), to = gallery.indexOf(end, from);
    assert(from >= 0 && to > from); vm.runInContext(gallery.slice(from, to), context);
}
load('        let pendingEngineWrites', '        const DEFAULT_COLORS');
load('function executeSaveAll(', '        window.saveAllAndGenerate');
load('function applyImportedEngineConfig', 'window.importFromExistingPreset');
load('        window.updateCustomPoolName', '        window.openAddPoolModal');
load('        const galleryUnsaved', '        window.toggleMasterSettingsAccordion');
const galleryConfig = config;
assert.equal(config.shouldConfirm(), true); // 有修改，即使手动预览也必须提醒。
classes.add('is-preset-game'); assert.equal(config.shouldConfirm(), false); classes.delete('is-preset-game');
const poolGuard = pool.slice(pool.indexOf('        const poolUnsaved'), pool.indexOf('        window.safeNavigate', pool.indexOf('        const poolUnsaved')));
vm.runInContext('const poolChangeTracker = {}; ' + poolGuard, context);
assert.equal(config.shouldConfirm(), true);
classes.add('is-preset-game'); assert.equal(config.shouldConfirm(), false); classes.delete('is-preset-game');
// 重新取回真实 gallery 放弃回调。
config = galleryConfig;

const original = {
    GM_RosterPools_test: JSON.stringify([{ id: 'p', name: 'Original' }]),
    GM_Pool_Order_test: JSON.stringify(['p']),
    GM_Rules_test_p: JSON.stringify({ info: { name: 'Original' } }),
    GM_Info_test: JSON.stringify({ gameName: 'Original Game' }),
    GM_Catalog_test: JSON.stringify({ char: [] }),
    GM_Data_test_p: JSON.stringify([{ name: 'History' }])
};
function seed() { stored.clear(); Object.entries(original).forEach(([key, value]) => stored.set(key, value)); }
function importDraft() {
    vm.runInContext(`applyImportedEngineConfig({
        info: { gameName: 'Imported Game' }, catalog: { char: [{ name: 'Item', tags: ['up'] }] },
        rosterPools: [{ id: 'p', name: 'Imported Pool' }], poolOrder: ['p'],
        poolRules: { p: { info: { name: 'Imported Pool' }, tiers: [] } }
    }, {})`, context);
}
seed(); const before = [...stored]; importDraft();
assert.deepEqual([...stored], before); // 导入不写正式卡池、规则或图鉴。
assert.equal(vm.runInContext('JSON.parse(readEngineEdit("GM_RosterPools_test"))[0].name', context), 'Imported Pool');
vm.runInContext('window.updateCustomPoolName("p", "Draft Rename")', context);
assert.equal(marked, 0); // 预览下直接调用也不能改名。
classes.delete('preview-mode');
vm.runInContext('window.updateCustomPoolName("p", "Draft Rename")', context);
assert.equal(marked, 1); assert.deepEqual([...stored], before); // 导入后的改名也仍是草稿。
config.onDiscard(); assert.deepEqual([...stored], before);
assert.equal(vm.runInContext('pendingEngineWrites', context), null);

importDraft(); elements['input-game-name'].value = '';
assert.equal(vm.runInContext('executeSaveAll()', context), false); assert.deepEqual([...stored], before);
assert(vm.runInContext('pendingEngineWrites !== null', context));
elements['input-game-name'].value = 'Imported Game';
failKey = 'GM_Catalog_test';
assert.throws(() => vm.runInContext('executeSaveAll()', context), /QuotaExceeded/);
assert.deepEqual([...stored].sort(), [...before].sort()); assert.equal(resets, 0);
assert(vm.runInContext('pendingEngineWrites !== null', context));
assert.equal(vm.runInContext('executeSaveAll()', context), true);
assert.equal(JSON.parse(stored.get('GM_RosterPools_test'))[0].name, 'Imported Pool');
assert.equal(JSON.parse(stored.get('GM_Info_test')).gameName, 'Imported Game');
assert.equal(JSON.parse(stored.get('GM_Catalog_test')).char[0].name, 'Item');
assert.equal(JSON.parse(stored.get('GM_Rules_test_p')).info.name, 'Imported Pool');
assert.equal(stored.get('GM_Data_test_p'), original.GM_Data_test_p); // 未删除的抽卡历史不受导入影响。
assert.equal(resets, 1); assert.equal(vm.runInContext('pendingEngineWrites', context), null);

// 导入后待删除的卡池只在成功保存时删除；失败仍保留删除队列和原历史。
seed(); importDraft(); session.set('GM_Pending_Deleted_Pools_test', '["p"]');
failKey = 'GM_Info_test'; assert.throws(() => vm.runInContext('executeSaveAll()', context));
assert.equal(stored.get('GM_Data_test_p'), original.GM_Data_test_p); assert(session.has('GM_Pending_Deleted_Pools_test'));
vm.runInContext('executeSaveAll()', context);
assert.equal(stored.has('GM_Data_test_p'), false); assert.equal(stored.has('GM_Rules_test_p'), false);
assert.equal(JSON.parse(stored.get('GM_RosterPools_test')).length, 0); assert.equal(session.size, 0);
assert.equal((gallery.match(/function executeSaveAll\(/g) || []).length, 1);
assert(gallery.slice(gallery.indexOf('window.importFromExistingPreset')).includes('beginEngineImport()'));
console.log('PASS：预览下未保存提醒、导入/改名不落盘、放弃草稿、保存失败回滚与重试、历史保护');
