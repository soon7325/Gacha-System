const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const source = read('pages/pool_setup.js');
let language = 'en', locked = false, dirty = 0, binding;
const input = { value: '' };
const context = vm.createContext({
    window: {}, sysLang: 'en', localStorage: { getItem: key => key === 'GM_Lang' ? language : null },
    document: { getElementById: () => input, addEventListener: (name, callback) => callback() },
    poolPreviewLock: { isLocked: () => locked }, markPageDirty: () => dirty++,
    BilingualInput: { install(options) { binding = options.resolve(); } }
});
vm.runInContext(read('ui/item_format.js'), context);
context.ItemFormat = context.window.ItemFormat;
const { getRescueName } = context.ItemFormat;
assert.equal(getRescueName(null, 'en'), 'Radiance');
assert.equal(getRescueName({}, 'zh'), '明光');
assert.equal(getRescueName({ customEffectName: '旧自定义' }, 'en'), '旧自定义');
assert.equal(getRescueName({ customEffectName: '命运救回', customEffectNameEn: 'Fate Rescue' }, 'en'), 'Fate Rescue');
assert.equal(getRescueName({ customEffectName: '命运救回', customEffectNameEn: 'Fate Rescue' }, 'zh'), '命运救回');
vm.runInContext(source.slice(source.indexOf('        let rescueLabelDraft'), source.indexOf('        // 全名、简称')), context);
vm.runInContext(read('pages/pool_bilingual.js'), context);
vm.runInContext(`loadRescueLabel({enabled:false, customEffectName:'命运救回',customEffectNameEn:'Fate Rescue'})`, context);
assert.equal(input.value, 'Fate Rescue');
binding.setValue('en', 'Second Chance');
assert.equal(binding.getValue('zh'), '命运救回');
binding.setValue('zh', '逆转');
assert.equal(binding.getValue('en'), 'Second Chance');
const saved = JSON.parse(vm.runInContext('JSON.stringify(getRescueLabelConfig())', context));
assert.deepEqual(saved, { customEffectName: '逆转', customEffectNameEn: 'Second Chance' });
locked = true;
binding.setValue('en', 'Blocked');
assert.equal(binding.getValue('en'), 'Second Chance'); assert.equal(dirty, 2);
vm.runInContext(`loadRescueLabel({ customEffectName:'自定义' })`, context);
assert.equal(input.value, '自定义');
assert.equal(vm.runInContext('getRescueLabelConfig().customEffectNameEn', context), '');

// 运行真实结果卡片渲染，确认标签随语言切换，且不会把自定义文本当成 HTML。
const simSource = read('pages/simulator.js');
Object.assign(context, {
    rules: { secondaryRescue: saved }, targetGoldIds: ['gold'], activeTiers: [{ id: 'gold', color: '#ff0' }],
    findInRoster: () => null, getImageUrl: () => '', getItemShort: item => item.name
});
vm.runInContext(simSource.slice(simSource.indexOf('function buildSingleItemHtml('), simSource.indexOf('        function resetSim()')), context);
const pull = { name: 'Item', tierId: 'gold', isGold: true, isRescued: true, pityUsed: 1, total: 1 };
assert.match(context.buildSingleItemHtml(pull), /Second Chance/);
language = 'zh'; assert.match(context.buildSingleItemHtml(pull), /逆转/);
context.rules.secondaryRescue.customEffectName = '<b>"Rescue"</b>';
assert.match(context.buildSingleItemHtml(pull), /&lt;b&gt;&quot;Rescue&quot;&lt;\/b&gt;/);
assert(source.includes('...getRescueLabelConfig()'));
assert(source.includes('subDrawersCount, rescueLabelDraft'));
console.log('PASS: 救回标签双语草稿、旧数据回退、关闭时保留、只读保护、模拟器切换与文本转义');
