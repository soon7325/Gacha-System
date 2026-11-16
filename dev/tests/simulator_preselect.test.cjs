const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const read=file=>fs.readFileSync(path.join(__dirname,'../..',file),'utf8'),source=read('pages/simulator.js');
function setup(){
    const counts={},alerts=[],c=vm.createContext({window:{},localStorage:{getItem:()=>null},targetGoldIds:[],globalTiers:[],rules:{},
        document:{querySelectorAll:selector=>Array(counts[selector]||0)},getLocalizedTierName:t=>t.name,customAlert:async text=>alerts.push(text)});
    for(const file of ['Preset_Data/db_hsr.js','Preset_Data/db_zzz.js','Preset_Data/db_test.js','translate/translate_zh.js'])vm.runInContext(read(file),c);
    c.window.getTrans=key=>c.window.UI_LIB.zh[key]||key;
    vm.runInContext(source.slice(source.indexOf('function getPreSelectLimits('),source.indexOf('function updateSectionCounters(')),c);
    vm.runInContext(source.slice(source.indexOf('        async function validatePreSelect()'),source.indexOf('        function updateRotationButtonUI()')),c);
    return {c,counts,alerts};
}
test('真实常驻池不填UP限制时可零UP抽卡，明确填写的常驻数量限制继续生效',async()=>{
    const h=setup();
    for(const name of ['HSR','ZZZ','TEST']){
        h.c.rules=vm.runInContext(name+"_POOL_RULES.mixed_std",h.c);
        h.c.globalTiers=vm.runInContext(name+'_GLOBAL_TIERS',h.c);
        h.c.targetGoldIds=[h.c.globalTiers[0].id];
        for(const tier of h.c.globalTiers){
            const limit=h.c.getPreSelectLimits(tier.id);
            assert.equal(limit.upMin,0);assert.equal(limit.upMax,999);
            h.counts[`.sim-up-cb-${tier.id}:checked`]=0;
            h.counts[`.sim-std-cb-${tier.id}:checked`]=limit.stdMin;
        }
        assert.equal(await h.c.validatePreSelect(),true,name);
    }
    assert.equal(h.alerts.length,0);
});
test('未配置限制默认不限制，显式UP单选、常驻下限及0～0禁止仍执行',async()=>{
    const h=setup(),tier={id:'gold',name:'5星'};h.c.globalTiers=[tier];h.c.targetGoldIds=['gold'];
    assert.equal(await h.c.validatePreSelect(),true);
    h.c.rules={preSelect:{enabled:true,tiers:{gold:{upMin:1,upMax:1,stdMin:2,stdMax:3}}}};
    assert.equal(await h.c.validatePreSelect(),false);assert.match(h.alerts.at(-1),/UP/);
    h.counts['.sim-up-cb-gold:checked']=1;assert.equal(await h.c.validatePreSelect(),false);assert.match(h.alerts.at(-1),/底垫|常驻/);
    h.counts['.sim-std-cb-gold:checked']=2;assert.equal(await h.c.validatePreSelect(),true);
    h.c.rules.preSelect.tiers.gold={upMin:0,upMax:0};assert.equal(await h.c.validatePreSelect(),false);
    h.counts['.sim-up-cb-gold:checked']=0;assert.equal(await h.c.validatePreSelect(),true);
    h.c.rules.preSelect.enabled=false;h.counts['.sim-up-cb-gold:checked']=5;assert.equal(await h.c.validatePreSelect(),true);
});
