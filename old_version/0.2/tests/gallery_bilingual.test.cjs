const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'pages/gallery_setup.js'), 'utf8');
const stored = new Map();
const elements = {
    'input-game-name': { value: 'English Game' },
    'input-item-name': { value: 'Silver Wolf' },
    'input-item-short': { value: 'SW' },
    'input-item-tier': { value: 'five' },
    'input-item-cat-select': { value: 'char' },
    itemModalOverlay: { style: {} }
};
let locked = false, dirty = 0;
const context = vm.createContext({
    window: { getTrans: key => key },
    document: { getElementById: id => elements[id], querySelectorAll: () => [{ value: 'up' }], addEventListener() {} },
    gameId: 'test', gameInfo: {
        gameName: '中文游戏', enGameName: 'English Game',
        globalTiers: [{ id: 'five', name: '五星', en: 'Five Star' }],
        categories: [{ id: 'char', name: '角色', en: 'Character' }],
        tagDefinitions: { up: { name: '限定', en: 'Limited' } }
    },
    getLang: () => 'en', galleryPreviewLock: { isLocked: () => locked },
    markPageDirty: () => dirty++, renderCategories() {}, renderSidebar() {}, updateImportVisibility() {},
    readEngineEdit: key => stored.get(key), writeEngineEdit: (key, value) => stored.set(key, value),
    localStorage: { getItem: key => stored.get(key) ?? null, setItem: (key, value) => stored.set(key, value) },
    sessionStorage: { getItem: () => null, removeItem() {} },
    pendingEngineWrites: null, galleryChangeTracker: { reset() {} },
    catalog: { char: [] }, editingItemRef: null, tempBase64Img: '',
    BilingualInput: { close() {} }, alert: () => assert.fail('Unexpected validation error')
});
function load(start, end) {
    const from = source.indexOf(start), to = source.indexOf(end, from);
    assert(from >= 0 && to > from);
    vm.runInContext(source.slice(from, to), context);
}
load('        window.updateTier =', '        // ==========================================');
load('window.updateCustomTag =', '        window.removeCustomTag');
load('        window.updateCategoryName =', '        window.changeCategoryIcon');
load('        window.updateCustomPoolName =', '        window.openAddPoolModal');
vm.runInContext(`window.updateTier('five', 'name', 'Five Stars');
window.updateCustomTag('up', 'name', 'Limited UP');
window.updateCategoryName('char', 'Agent');`, context);
assert.equal(context.gameInfo.globalTiers[0].name, '五星');
assert.equal(context.gameInfo.globalTiers[0].en, 'Five Stars');
assert.equal(context.gameInfo.tagDefinitions.up.name, '限定');
assert.equal(context.gameInfo.categories[0].name, '角色');
vm.runInContext(`window.updateTier('five', 'name', '五颗星', 'zh');
window.updateCustomTag('up', 'name', '限定角色', 'zh');
window.updateCategoryName('char', '代理人', 'zh');`, context);
assert.equal(context.gameInfo.globalTiers[0].en, 'Five Stars');
assert.equal(context.gameInfo.tagDefinitions.up.en, 'Limited UP');
assert.equal(context.gameInfo.categories[0].en, 'Agent');
stored.set('GM_RosterPools_test', JSON.stringify([{ id: 'p', name: '角色池', en: 'Character Banner' }]));
stored.set('GM_Rules_test_p', JSON.stringify({ info: { name: '角色池', en: 'Character Banner' } }));
vm.runInContext(`window.updateCustomPoolName('p', 'Event Banner');`, context);
assert.equal(JSON.parse(stored.get('GM_RosterPools_test'))[0].name, '角色池');
assert.equal(JSON.parse(stored.get('GM_Rules_test_p')).info.en, 'Event Banner');
vm.runInContext(`window.updateCustomPoolName('p', '活动池', 'zh');`, context);
assert.equal(JSON.parse(stored.get('GM_Rules_test_p')).info.en, 'Event Banner');

vm.runInContext(fs.readFileSync(path.join(root, 'pages/gallery_bilingual.js'), 'utf8'), context);
context.window.GalleryBilingual.setItemDraft({ name: '银狼', en: 'Silver Wolf', short: '狼', eshort: 'SW' });
load('        window.saveItemData =', '        window.deleteItem');
vm.runInContext('window.saveItemData()', context);
const item = context.catalog.char[0];
assert.equal(item.name, '银狼'); assert.equal(item.en, 'Silver Wolf');
assert.equal(item.short, '狼'); assert.equal(item.eshort, 'SW');
context.window.GalleryBilingual.setItemDraft();
assert.deepEqual(JSON.parse(JSON.stringify(context.window.GalleryBilingual.getItemDraft())), { name: '', en: '', short: '', eshort: '' });

context.commitEngineEdits = writes => { for (const [key, value] of writes) stored.set(key, value); };
load('function executeSaveAll(', '        window.saveAllAndGenerate');
assert.equal(vm.runInContext('executeSaveAll(false)', context), true);
assert.equal(JSON.parse(stored.get('GM_Info_test')).gameName, '中文游戏');
assert.equal(JSON.parse(stored.get('GM_Info_test')).enGameName, 'English Game');
locked = true;
const before = dirty;
vm.runInContext(`window.updateCategoryName('char', 'Blocked', 'en'); window.updateTier('five', 'name', 'Blocked', 'zh');`, context);
assert.equal(dirty, before);
assert.equal(context.gameInfo.categories[0].en, 'Agent');
console.log('PASS: 独立双语字段、英文保存不覆盖中文、双语物品与简称、弹窗草稿重置、只读保护');
