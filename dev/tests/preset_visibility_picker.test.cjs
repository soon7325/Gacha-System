const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const read=f=>fs.readFileSync(path.join(__dirname,'../..',f),'utf8');
test('默认图鉴多选默认选四个，保留已有选择并显示数量；测试说明在菜单内',()=>{
 const store=new Map(),inputs=['hsr','zzz','ark','end','test'].map(id=>({dataset:{presetVisibility:id},checked:false})),nodes={'preset-visibility-current':{},'preset-visibility-count':{}};
 nodes['preset-visibility-picker']={querySelectorAll:()=>inputs};
 const c=vm.createContext({window:{getTrans:key=>key==='set_preset_none'?'无':key,TestCatalog:{visible:id=>id==='test'?store.get('GM_Show_Test_Catalog')==='true':store.get('GM_Show_Preset_'+id)!=='false'}},document:{getElementById:id=>nodes[id],addEventListener(){}}});
 vm.runInContext(read('ui/preset_visibility.js'),c);const refresh=c.window.PresetVisibilityPicker.refresh;
 refresh();assert.deepEqual(inputs.map(i=>i.checked),[true,true,true,true,false]);assert.equal(nodes['preset-visibility-count'].textContent,'4/5');
 store.set('GM_Show_Test_Catalog','true');store.set('GM_Show_Preset_hsr','false');refresh();assert.deepEqual(inputs.map(i=>i.checked),[false,true,true,true,true]);assert.match(nodes['preset-visibility-current'].textContent,/game_test/);
 for(const id of ['hsr','zzz','ark','end'])store.set('GM_Show_Preset_'+id,'false');store.set('GM_Show_Test_Catalog','false');refresh();assert.equal(nodes['preset-visibility-current'].textContent,'无');assert.equal(nodes['preset-visibility-count'].textContent,'0/5');
 const html=read('settings.html');assert.match(html,/<div class="preset-visibility-menu"[\s\S]*?<small id="preset-test-note" data-i18n="set_test_catalog_note"/);assert.equal((html.match(/data-preset-visibility=/g)||[]).length,5);
});
