const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../../pages/gallery_economy.js'), 'utf8');
(async () => {
let locked = false, dirty = 0;
const poolRows = ['limited_char', 'limited_weapon', 'collab_char', 'collab_weapon'].map(id => ({id, name: id}));
const root = { innerHTML: '', querySelectorAll: () => [] };
const context = require('./icon_test_context.cjs').createContext({
    window: {confirm:()=>true}, document: { getElementById: id => id === 'gallery-economy' ? root : null },
    gameInfo: { categories: [{ id: 'mount', name: '坐骑', en: 'Mount' }], globalTiers: [{ id: 'rare', name: '稀有' }], overflowRules: { mount: 8, other: 5 } },
    gameId: 'test', getLang: () => 'zh', readEngineEdit: () => JSON.stringify(poolRows),
    GameData: { getPresetRules: () => null }, sessionStorage: { getItem: () => null },
    galleryPreviewLock: { isLocked: () => locked }, markPageDirty: () => dirty++, showToast() {}
});
vm.runInContext(source, context);
const economy = context.window.GalleryEconomy;
const click = (action, card = null) => root.onclick({ target: { closest: selector => selector === '[data-eco-action]' ? { dataset: { ecoAction: action } } : selector === '[data-eco-list]' ? card : null } });
const switchTab = () => economy.render();
economy.render();
await click('example');
const info = context.gameInfo, m = info.economy;
m.exchanges[0].resetDay = 7;
m.exchanges[0].resetHour = 4;
assert.equal(m.resources.length, 7);
assert.deepEqual(Array.from(economy.validate()), []);
assert.equal('resetDay' in m.exchanges[0],false);
assert.equal('resetHour' in m.exchanges[0],false);
assert.doesNotMatch(root.innerHTML, /role="tab/);
assert.match(root.innerHTML, /资源账户/);
assert.match(root.innerHTML, /兑换规则/);
assert.doesNotMatch(root.innerHTML, /英文名称（可选）/);
assert.match(root.innerHTML, /class="eco-name"/);
// 旧资源限制迁移到未单独配置范围的支付规则；显式支付范围保留。
m.resources[4].poolIds = poolRows.map(pool => pool.id);
const singlePayment = m.payments.find(payment => payment.resourceId === m.resources[4].id);
singlePayment.poolIds = [];
assert.deepEqual(Array.from(economy.validate()), []);
assert.deepEqual(Array.from(singlePayment.poolIds), poolRows.map(pool => pool.id));
assert.equal('poolIds' in m.resources[4], false);
singlePayment.poolIds = ['limited_char', 'collab_weapon'];
m.resources[4].poolIds = ['removed_pool'];
assert.deepEqual(Array.from(economy.validate()), []);
assert.deepEqual(Array.from(singlePayment.poolIds), ['limited_char', 'collab_weapon']);
singlePayment.poolIds = ['removed_pool'];
assert.ok(economy.validate().some(error => error.includes('卡池')));
singlePayment.poolIds = poolRows.map(pool => pool.id);
// 一次性兑换不要求月度重置参数。
m.exchanges.push({id: 'one_time', name: '一次性礼包', from: m.resources[0].id, to: m.resources[4].id, mode: 'once', cost: 100, gain: 1, limit: 1});
assert.deepEqual(Array.from(economy.validate()), []);
assert.deepEqual(Array.from(m.exchanges.at(-1).toIds),[m.resources[4].id]);
const staged = m.exchanges.find(row => row.mode === 'staged');
assert.equal(staged.stages.reduce((sum, stage) => sum + stage.cost, 0), 258);
assert.equal(staged.stages.reduce((sum, stage) => {const payment=m.payments.find(row=>row.resourceId===(stage.toIds[0]||staged.toIds[0]));return sum+stage.gain*payment.pulls/payment.cost;}, 0), 38);
assert.equal(staged.stages[3].gain, 1, '第四档保留一整张十连券');
switchTab('exchanges');
assert.match(root.innerHTML, /共38抽/);
assert.doesNotMatch(root.innerHTML, /data-eco-field="resetDay"|data-eco-field="resetHour"/);
assert.match(root.innerHTML, /一次性阶梯兑换/);
assert.equal('to' in staged, false, '旧单目标迁移到多目标数组');
assert.equal('resetDay' in staged, false, '删除日期字段而非隐藏');
const fixed = m.exchanges.find(row => row.mode === 'fixed');
const originalTargets = [...fixed.toIds];
const otherTicket = m.resources[5].id;
const checkboxGroup = {querySelectorAll:()=>[],querySelector:()=>({textContent:'',title:''})};
const iconNode = {outerHTML:''}, totalNode = {textContent:''};
const exchangeCard = {dataset:{ecoList:'exchanges',ecoId:fixed.id},querySelector:selector=>selector==='.eco-exchange-icons'?iconNode:totalNode};
const targetCheck = {type:'checkbox',value:otherTicket,checked:true,dataset:{ecoField:'toIds'},closest:selector=>selector==='[data-eco-field]'?targetCheck:selector==='[data-eco-list]'?exchangeCard:selector==='[data-eco-multi]'?checkboxGroup:null};
root.onchange({target:targetCheck});
assert.deepEqual(Array.from(fixed.toIds),[...originalTargets,otherTicket]);
assert.match(iconNode.outerHTML,/🎫/,'多选后立即更新兑换标题图标');
assert.deepEqual(Array.from(economy.validate()),[]);
fixed.toIds.push(fixed.from);
assert.ok(economy.validate().length,'多选不能包含支付资源自身');
fixed.toIds = originalTargets;
const originalMode = staged.mode;
staged.mode='once_staged';
economy.render();
assert.match(root.innerHTML,/每档仅一次/);
assert.deepEqual(Array.from(economy.validate()),[]);
assert.equal(JSON.parse(JSON.stringify(m)).exchanges.find(row=>row.id===staged.id).mode,'once_staged');
staged.stages[0].gain=0;
assert.ok(economy.validate().length,'一次性阶梯也校验每一档');
staged.stages[0].gain=1;
staged.mode=originalMode;
economy.render();
// 输入时即写入阶段并刷新汇总，不依赖浏览器失焦事件。
const summary = { textContent: '' };
const stageElement = { dataset: { ecoStage: '0' } };
const cardElement = { dataset: { ecoList: 'exchanges', ecoId: staged.id }, querySelector: () => summary };
const control = {
    type: 'number', tagName: 'INPUT', value: '11', min: '1', max: '', dataset: { ecoField: 'cost' },
    setCustomValidity() {}, reportValidity() {},
    closest: selector => selector === '[data-eco-field]' ? control : selector === '[data-eco-list]' ? cardElement : selector === '[data-eco-stage]' ? stageElement : null
};
root.oninput({ type: 'input', target: control });
assert.equal(staged.stages[0].cost, 11);
assert.match(summary.textContent, /259/);
control.value = '10';
root.oninput({ type: 'input', target: control });
switchTab('caps');
assert.match(root.innerHTML, /坐骑/);
assert.doesNotMatch(root.innerHTML, /角色|武器|宠物/);
assert.equal(info.overflowRules.mount, 8);
info.categories.push({ id: 'vehicle', name: '载具' });
economy.render();
assert.match(root.innerHTML, /载具/);
assert.equal(info.overflowRules.vehicle, 5);
info.categories[0].name = '飞行坐骑';
switchTab('payments');
assert.match(root.innerHTML, /飞行坐骑/);
assert.match(root.innerHTML, /value="vehicle"/);
// 跨大类返还合法：抽到坐骑，返还用于载具的资源。
m.resources[2].categoryId = 'vehicle';
m.incomes[1].categoryId = 'mount';
assert.deepEqual(Array.from(economy.validate()), []);
// 引用中的资源不能被删除。
const before = m.resources.length;
click('remove', { dataset: { ecoList: 'resources', ecoId: m.resources[0].id } });
assert.equal(m.resources.length, before);
// 预览锁保护新增、删除和示例，不依赖按钮外观。
locked = true;
const snapshot = JSON.stringify(m), changes = dirty;
await click('example'); click('add');
assert.equal(JSON.stringify(m), snapshot);
assert.equal(dirty, changes);
locked = false;
// 资源无固定种类限制，抽数完全由支付规则决定，但必须为正整数。
const voucher = m.payments.find(row => row.pulls === 10);
voucher.pulls = 1;
assert.deepEqual(Array.from(economy.validate()), []);
voucher.pulls = 0;
assert.ok(economy.validate().length);
voucher.pulls = 10;
// 签到节点不允许重复，同一奖励不会重复记入两天。
const signIn = m.incomes.find(row => row.schedule === 'signin');
signIn.days[1].day = 1;
assert.ok(economy.validate().length);
signIn.days[1].day = 2;
// 删除分类后不能把已有范围悄悄扩大成全类别。
info.categories = info.categories.filter(cat => cat.id !== 'mount');
assert.ok(economy.validate().some(error => error.includes('图鉴大类')));
info.categories.push({ id: 'mount', name: '飞行坐骑' });
assert.deepEqual(Array.from(economy.validate()), []);
// 保存/导出使用的 JSON 能完整往返阶梯、签到与任意类别上限。
const restored = JSON.parse(JSON.stringify(info));
assert.equal(restored.overflowRules.mount, 8);
assert.equal(restored.economy.exchanges.find(row => row.mode === 'staged').stages.length, 5);
assert.equal(restored.economy.incomes.find(row => row.schedule === 'signin').days.reduce((sum, day) => sum + day.amount, 0), 5);
// 实际页面保存入口将整个经济配置与任意图鉴大类上限写入同一游戏信息。
const stored = new Map();
context.document.getElementById = id => id === 'gallery-economy' ? root : id === 'input-game-name' ? { value: '货币配置测试' } : null;
context.localStorage = { getItem: key => stored.get(key) ?? null };
context.commitEngineEdits = writes => { for (const [key, value] of writes) stored.set(key, value); };
context.pendingEngineWrites = null;
context.sessionStorage.removeItem = () => {};
context.galleryChangeTracker = { reset() {} };
context.catalog = {};
const setup = fs.readFileSync(path.join(__dirname, '../../pages/gallery_setup.js'), 'utf8');
const saveStart = setup.indexOf('function executeSaveAll(');
vm.runInContext(setup.slice(saveStart, setup.indexOf('        window.saveAllAndGenerate', saveStart)), context);
assert.equal(vm.runInContext('executeSaveAll(false)', context), true);
const savedInfo = JSON.parse(stored.get('GM_Info_test'));
assert.deepEqual(savedInfo.economy, JSON.parse(JSON.stringify(m)));
assert.equal(savedInfo.overflowRules.mount, 8);
// 已打开的图鉴页不能覆盖货币页后来保存的新版本，也不要求货币配置校验通过。
const newer = {...savedInfo,economy:{version:1,resources:[{id:'new_saved',name:'新货币'}]},overflowRules:{mount:12}};
stored.set('GM_Info_test',JSON.stringify(newer));
context.pendingCurrencyImport = false;
context.window.GalleryEconomy = {validateForSave:()=>assert.fail('图鉴保存不应触发货币页校验')};
assert.equal(vm.runInContext('executeSaveAll(false)',context),true);
assert.deepEqual(JSON.parse(stored.get('GM_Info_test')).economy,newer.economy);
assert.equal(JSON.parse(stored.get('GM_Info_test')).overflowRules.mount,12);
context.gameInfo.economy = m;
// 名称沿用已有双语输入组件，不再渲染两排独立语言输入框。
let bilingualOptions;
context.BilingualInput = context.window.BilingualInput = {install: options => {bilingualOptions = options; return {};}};
economy.render();
const heading = {textContent:''};
const nameCard = {dataset:{ecoList:'resources',ecoId:m.resources[0].id},querySelector:()=>heading};
const nameBinding = bilingualOptions.resolve({closest:()=>nameCard});
nameBinding.setValue('en','Daily currency');
nameBinding.setValue('zh','日常货币中文');
assert.equal(nameBinding.getValue('en'),'Daily currency');
assert.equal(nameBinding.getValue('zh'),'日常货币中文');
locked = true;
nameBinding.setValue('en','Blocked');
assert.equal(nameBinding.getValue('en'),'Daily currency');
locked = false;
// 改变其他配置重新绘制时保留已收起的区块。
root.querySelectorAll = selector => selector === 'details[data-eco-key]' ? [{dataset:{ecoKey:'section:resources'},open:false}] : [];
economy.render();
assert.match(root.innerHTML, /data-eco-key="section:resources" data-eco-section="resources" >/);
// 旧单项前置迁入统一列表，说明保留且重复绘制不会重复创建。
const legacy=m.exchanges[0];delete legacy.unlockGroupId;
legacy.hasPrerequisite=true;legacy.prerequisite='完成第一层';legacy.prerequisiteEn='Complete tier one';
economy.render();
const migrated=m.unlockGroups.find(group=>group.id===legacy.unlockGroupId);
assert.equal(migrated.prerequisite,'完成第一层');assert.equal(migrated.prerequisiteEn,'Complete tier one');
assert.equal(migrated.legacyPrerequisiteId,legacy.id);assert.equal(legacy.hasPrerequisite,undefined);
const groupCount=m.unlockGroups.length;economy.render();assert.equal(m.unlockGroups.length,groupCount);
assert.match(root.innerHTML,/所属前置条件/);assert.doesNotMatch(root.innerHTML,/有前置条件|所属共享兑换组|共享兑换组／层级/);
console.log('PASS：阶梯、赠送、直抽配置、动态大类、跨类返还、引用保护、预览锁与配置往返');

})().catch(error => { console.error(error); process.exitCode = 1; });
