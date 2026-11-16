const test = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs'), vm = require('node:vm');
const source = fs.readFileSync(require('node:path').join(__dirname, '../../pages/settings.js'), 'utf8');

test('设置同步正确识别当前版本事件，忽略其他版本，清空后刷新', () => {
    let listener, simulator = 0, player = 0, initialized = 0;
    const toggle = {checked:false};
    const start = source.indexOf("        window.addEventListener('storage',");
    const end = source.indexOf('\n        });', start) + '\n        });'.length;
    const context = {
        window: {
            addEventListener(type, fn) { listener = fn; },
            VersionStorage: {eventKey(key) { return key === null ? null : key.startsWith('current:') ? key.slice(8) : undefined; }},
            TestCatalog: {isVisibilityKey:key=>key==='GM_Show_Preset_hsr'}
        },
        document: {getElementById:()=>toggle}, localStorage: {getItem:()=> 'true'},
        initPrefs:()=>initialized++, syncSimulatorDependentPrefs:()=>simulator++, syncPlayerDataPrefs:()=>player++
    };
    vm.runInNewContext(source.slice(start,end),context);
    listener({key:'current:GM_Sim_Currency_Mode'}); assert.equal(simulator,1);
    listener({key:'other:GM_Sim_Currency_Mode'}); assert.equal(simulator,1);
    listener({key:'current:GM_Player_Data_Mode'}); assert.equal(player,1);
    listener({key:'current:GM_Show_Currency_Examples'}); assert.equal(toggle.checked,true);
    listener({key:'current:GM_Show_Preset_hsr'}); assert.equal(initialized,1);
    listener({key:null}); assert.equal(initialized,2);
});
