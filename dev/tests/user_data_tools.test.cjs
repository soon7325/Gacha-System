const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const read=file=>fs.readFileSync(path.join(__dirname,'../..',file),'utf8'),plain=value=>JSON.parse(JSON.stringify(value));
function setup(){
    const store=new Map();let fail=false;
    const c=vm.createContext({window:{},localStorage:{get length(){return store.size;},key:i=>Array.from(store.keys())[i]??null,getItem:k=>store.get(k)??null,removeItem:k=>store.delete(k),setItem:(k,v)=>{if(fail)throw Error('quota');store.set(k,v);}}});
    for(const file of ['Preset_Data/db_hsr.js','logic/catalog_utils.js','logic/game_data.js','logic/gacha_engine.js','logic/simulator_start.js','logic/user_data_profiles.js','logic/dashboard_validation.js','logic/dashboard_accounts.js','logic/user_data_tools.js']){vm.runInContext(read(file),c);Object.assign(c,c.window);}
    const initial=c.GachaEngine.createState(1);
    const row=(id,extra={})=>({id,name:id,en:id,balances:{},owned:{},pools:{},...extra});
    return {c,store,api:c.UserDataTools,profiles:c.UserDataProfiles,initial,row,fail:()=>{fail=true;}};
}
test('无旧记录时创建双语空白默认账号，反复进入不重复创建，也不改官方或实时账户',()=>{
    const h=setup();h.store.set('GM_Sim_Economy_hsr','untouched');
    assert.equal(h.api.ensureDefault('hsr').created,true);
    const data=h.profiles.read('hsr');assert.equal(data.items.length,1);assert.equal(data.items[0].isDefault,true);assert.equal(data.items[0].en,'Default account');
    assert.deepEqual(plain(data.items[0].balances),{});assert.deepEqual(plain(data.items[0].owned),{});assert.deepEqual(plain(data.items[0].pools),{});
    const before=h.store.get('GM_Sim_Profiles_hsr');assert.equal(h.api.ensureDefault('hsr').created,false);assert.equal(h.store.get('GM_Sim_Profiles_hsr'),before);assert.equal(h.store.get('GM_Sim_Economy_hsr'),'untouched');
});
test('旧记录转换为独立双语账户，无默认时直接作为默认；删除后不重新生成',()=>{
    const h=setup(),catalog=h.c.GameData.flattenCatalog(h.c.GameData.loadCatalog('hsr')),item=catalog.find(i=>i.category==='char'&&i.tierId==='tier_5');
    const records=[{tierId:'tier_3'},{tierId:'tier_5',short:item.name,isLost:false},{tierId:'tier_3'}];
    const raw=JSON.stringify(records);h.store.set('GM_Data_hsr_char_up',raw);h.store.set('GM_Data_hsr_char_collab',raw);
    const result=h.api.ensureDefault('hsr');assert.equal(result.migrated,2);
    let data=h.profiles.read('hsr'),row=data.items[0];assert.equal(data.items.length,1);assert.equal(row.isDefault,true);assert.equal(row.legacyAccount,true);assert.equal(row.name,'旧数据账户');assert.equal(row.en,'Legacy data account');assert.equal(row.pools.char_up.total,3);assert.equal(row.pools.char_up.pity,1);assert.equal(row.pools.char_up.minorPityCounters[0],1);
    assert.equal(row.owned[JSON.stringify([item.category,item.id||item.name])],2);assert.equal(row.dashboardRecords.char_up.records.length,3);assert.deepEqual(plain(row.balances),{});assert.equal(h.store.has('GM_Data_hsr_char_up'),false);assert.equal(h.store.has('GM_Data_hsr_char_collab'),false);
    const before=h.store.get('GM_Sim_Profiles_hsr');assert.equal(h.api.ensureDefault('hsr').legacyCreated,false);assert.equal(h.store.get('GM_Sim_Profiles_hsr'),before);
    h.profiles.remove('hsr',row.id,data.revision);assert.equal(h.api.ensureDefault('hsr').migrated,0);data=h.profiles.read('hsr');assert.deepEqual(plain(data.items[0].dashboardRecords),{});
});
test('旧记录中的非法出货不能写入玩家进度或持有；记录保留并标红，修正后可同步',()=>{
    const h=setup(),item=h.c.GameData.flattenCatalog(h.c.GameData.loadCatalog('hsr')).find(i=>i.category==='char'&&i.tierId==='tier_5');
    const records=[{tierId:'tier_5',short:item.name,isLost:true},{tierId:'tier_5',short:item.name,isLost:true}];
    h.store.set('GM_Data_hsr_char_up',JSON.stringify(records));
    h.api.ensureDefault('hsr');
    const row=h.profiles.read('hsr').items[0];
    assert.equal(row.dashboardRecords.char_up.records.length,2);
    assert.equal(row.dashboardRecords.char_up.syncBlocked?.reason,'invalid_history');
    assert.equal(row.pools.char_up.total,0);
    assert.deepEqual(plain(row.owned),{});
    const context=h.profiles.context('hsr','char_up');
    const replay={...context,activeTiers:context.globalTiers.filter(t=>!context.rules.tiers||context.rules.tiers.some(r=>r.id===t.id)),catalog:h.c.GameData.loadCatalog('hsr'),isStdPool:false};
    const fixed=[records[0],{...records[1],isLost:false}];
    const snapshot=h.c.DashboardAccounts.read('hsr','char_up',row.id);
    assert.equal(h.c.DashboardAccounts.save('hsr','char_up',row.id,fixed,snapshot,replay,true).synced,true);
    const saved=h.profiles.read('hsr').items[0];
    assert.equal(saved.pools.char_up.total,2);
    assert.equal(saved.dashboardRecords.char_up.syncBlocked,undefined);
    assert.equal(saved.owned[JSON.stringify([item.category,item.id||item.name])],2);
});

test('已有非默认账号不改写，创建独立默认账号；已有默认账号不自动覆盖',()=>{
    const h=setup(),a=h.row('a',{balances:{jade:1600}});h.profiles.save('hsr',a,0);h.api.ensureDefault('hsr');
    let data=h.profiles.read('hsr');assert.deepEqual(plain(data.items.find(r=>r.id==='a')),a);assert.equal(data.items.filter(r=>r.isDefault).length,1);
    const before=plain(data.items);h.store.set('GM_Data_hsr_char_up',JSON.stringify([{tierId:'tier_3'}]));
    assert.equal(h.api.ensureDefault('hsr').legacyCreated,true);data=h.profiles.read('hsr');assert.deepEqual(plain(data.items.slice(0,2)),before);assert.equal(data.items.length,3);assert.equal(data.items[2].legacyAccount,true);assert.equal(data.items[2].isDefault,false);assert.equal(data.items[2].dashboardRecords.char_up.records.length,1);assert.equal(h.store.has('GM_Data_hsr_char_up'),false);
    h.profiles.remove('hsr',data.items[2].id,data.revision);assert.equal(h.api.ensureDefault('hsr').legacyCreated,false);assert.equal(h.profiles.read('hsr').items.length,2);
});
test('融合仅填空白不累加数量，0 视为空白；卡池进度和历史不拆散，保留目标身份',()=>{
    const h=setup(),a=h.row('a',{isDefault:true,balances:{jade:0,coin:5},owned:{hero:2},pools:{char_up:{...plain(h.initial),pity:30,total:30}},dashboardRecords:{char_up:{records:[]}}});
    const b=h.row('b',{balances:{jade:100,coin:9},owned:{hero:4,weapon:1},pools:{char_up:{...plain(h.initial),pity:2,total:2},wep_up:plain(h.initial)},dashboardRecords:{char_up:{records:[{tierId:'tier_3'}]}}});
    const result=h.api.merge(a,b,{mode:'target'});assert.equal(result.id,'a');assert.equal(result.name,'a');assert.equal(result.isDefault,true);assert.equal(result.balances.jade,100);assert.equal(result.balances.coin,5);assert.equal(result.owned.hero,2);assert.equal(result.owned.weapon,1);
    assert.equal(result.pools.char_up.pity,30);assert.equal(result.dashboardRecords.char_up.records.length,0);
    const preferred=h.api.merge(a,b,{mode:'source'});assert.equal(preferred.pools.char_up.pity,2);assert.equal(preferred.dashboardRecords.char_up.records.length,1);assert.equal(preferred.owned.hero,4);assert.equal(preferred.id,'a');assert.equal(preferred.isDefault,true);
    assert.equal(a.balances.jade,0);assert.equal(b.id,'b');
});
test('纯覆盖范围可选，旧记录不清空余额；重组后旧同步贡献失效',()=>{
    const h=setup(),a=h.row('a',{balances:{jade:99},owned:{hero:2},pools:{char_up:plain(h.initial)},dashboardRecords:{char_up:{records:[{tierId:'tier_3'}],sync:{old:true}}}}),b=h.row('b',{owned:{weapon:1}});
    const result=h.api.merge(a,b,{mode:'replace',scopes:['owned']});assert.deepEqual(plain(result.owned),{weapon:1});assert.equal(result.balances.jade,99);assert.equal(result.dashboardRecords.char_up.records.length,1);assert.equal(result.dashboardRecords.char_up.sync,undefined);
    const old=h.api.merge(a,b,{mode:'replace',scopes:['balances','progress'],legacySource:true});assert.equal(old.balances.jade,99);assert.deepEqual(plain(old.pools),{});assert.deepEqual(plain(old.owned),{hero:2});
});
test('预览不落盘，提交一次修改且保留来源，可撤销；目标后来修改时禁止撤销',()=>{
    const h=setup();h.profiles.save('hsr',h.row('a',{isDefault:true}),0);h.profiles.save('hsr',h.row('b',{balances:{jade:800}}),1);
    const before=h.store.get('GM_Sim_Profiles_hsr'),plan=h.api.preview('hsr',{sourceId:'b',targetId:'a',mode:'source',scopes:['balances']});assert.equal(h.store.get('GM_Sim_Profiles_hsr'),before);assert.equal(plan.changes.length,1);
    h.api.commit(plan);let data=h.profiles.read('hsr');assert.equal(data.items[0].balances.jade,800);assert.equal(data.items[1].balances.jade,800);
    h.api.undo('hsr');data=h.profiles.read('hsr');assert.deepEqual(plain(data.items[0].balances),{});assert.equal(data.items[1].balances.jade,800);
    h.api.commit(h.api.preview('hsr',{sourceId:'b',targetId:'a',mode:'source',scopes:['balances']}));data=h.profiles.read('hsr');const a=data.items[0];a.balances.jade=900;h.profiles.save('hsr',a,data.revision);assert.throws(()=>h.api.undo('hsr'),/undo_changed/);
});
test('预览后来源或目标账号改变均拒绝提交；quota 不产生部分融合，默认创建失败也保留旧记录',()=>{
    const h=setup();h.api.ensureDefault('hsr');h.store.set('GM_Data_hsr_char_up','[{"tierId":"tier_3"}]');
    h.api.ensureDefault('hsr');const source=h.profiles.read('hsr').items.find(row=>row.legacyAccount);
    const options={sourceId:source.id,targetId:'default',mode:'replace',scopes:['progress']};let plan=h.api.preview('hsr',options);
    source.owned.test=1;h.profiles.save('hsr',source,h.profiles.read('hsr').revision);assert.throws(()=>h.api.commit(plan),/conflict/);
    plan=h.api.preview('hsr',options);const data=h.profiles.read('hsr');h.profiles.save('hsr',h.row('b'),data.revision);assert.throws(()=>h.api.commit(plan),/conflict/);
    plan=h.api.preview('hsr',options);const before=h.store.get('GM_Sim_Profiles_hsr');h.fail();assert.throws(()=>h.api.commit(plan),/quota/);assert.equal(h.store.get('GM_Sim_Profiles_hsr'),before);
    const other=setup();other.store.set('GM_Data_hsr_char_up','[{"tierId":"tier_3"}]');other.fail();assert.throws(()=>other.api.ensureDefault('hsr'),/quota/);assert.equal(other.store.get('GM_Sim_Profiles_hsr'),undefined);assert.equal(other.store.get('GM_Data_hsr_char_up'),'[{"tierId":"tier_3"}]');
});
test('损坏的旧记录保留并报告，不阻止建立空白默认账号，但禁止静默融合',()=>{
    const h=setup();h.store.set('GM_Data_hsr_char_up','bad json');const result=h.api.ensureDefault('hsr');assert.deepEqual(plain(result.errors),['char_up']);assert.equal(h.store.get('GM_Data_hsr_char_up'),'bad json');
    assert.equal(h.profiles.read('hsr').items.some(row=>row.legacyAccount),false);
    assert.throws(()=>h.api.preview('hsr',{sourceId:'legacy',targetId:'default',mode:'source',scopes:['progress']}),/account_missing/);
});
test('名为 legacy 的正式账户正常融合，删除目标时移除已失效的撤销副本',()=>{
    const h=setup();h.profiles.save('hsr',h.row('target',{isDefault:true}),0);h.profiles.save('hsr',h.row('legacy',{balances:{jade:100}}),1);
    h.api.commit(h.api.preview('hsr',{sourceId:'legacy',targetId:'target',mode:'source',scopes:['balances']}));
    let data=h.profiles.read('hsr');assert.equal(data.items[0].balances.jade,100);assert.ok(data.lastPlayerMerge);
    h.profiles.remove('hsr','target',data.revision);data=h.profiles.read('hsr');assert.equal(data.lastPlayerMerge,undefined);assert.equal(data.items[0].id,'legacy');
});
test('已移除卡池仍带入原始记录，不猜进度；全零进度不充当有意义的变化',()=>{
    const h=setup();h.store.set('GM_Data_hsr_removed_pool','[{"tierId":"tier_3"}]');h.api.ensureDefault('hsr');
    const row=h.profiles.read('hsr').items[0];assert.equal(row.dashboardRecords.removed_pool.records.length,1);assert.equal(row.pools.removed_pool,undefined);
    const a=h.row('a'),b=h.row('b',{pools:{char_up:plain(h.initial)}});assert.equal(h.api.changes(a,h.api.merge(a,b)).length,0);
});
test('转换账户可正常预览融合，未知余额不覆盖；补填余额后可参与融合，标识碰撞不覆盖已有账户',()=>{
    const h=setup();h.profiles.save('hsr',h.row('legacy-account',{isDefault:true,balances:{jade:99}}),0);
    h.store.set('GM_Data_hsr_char_up','[{"tierId":"tier_3"}]');h.api.ensureDefault('hsr');
    let data=h.profiles.read('hsr');const archive=data.items.find(row=>row.legacyAccount);
    assert.equal(archive.id,'legacy-account-1');assert.equal(data.items[0].balances.jade,99);
    let plan=h.api.preview('hsr',{sourceId:archive.id,targetId:'legacy-account',mode:'replace',scopes:['balances','progress']});
    assert.equal(plan.row.balances.jade,99);assert.equal(plan.row.dashboardRecords.char_up.records.length,1);h.api.commit(plan);
    data=h.profiles.read('hsr');assert.equal(data.items.length,2);assert.equal(data.items.find(row=>row.id===archive.id).dashboardRecords.char_up.records.length,1);
    archive.balances={jade:500};h.profiles.save('hsr',archive,data.revision);
    plan=h.api.preview('hsr',{sourceId:archive.id,targetId:'legacy-account',mode:'replace',scopes:['balances']});assert.equal(plan.row.balances.jade,500);
});


test('融合卡池进度时历史汇总和初始快照整体迁移，不与另一账号混用',()=>{
    const h=setup(),state={...plain(h.initial),total:120,pity:60};
    const source=h.row('s',{pools:{char_up:state},recordInitial:{char_up:state},recordStats:{char_up:{gold:5,up:3}}});
    const target=h.row('t',{pools:{char_up:{...state,total:80}},recordStats:{char_up:{gold:1,up:1}}});
    const replaced=h.api.merge(target,source,{mode:'replace',scopes:['progress']});
    assert.equal(replaced.recordStats.char_up.gold,5);assert.equal(replaced.recordInitial.char_up.total,120);
    assert.equal(h.api.merge(target,source,{mode:'target',scopes:['progress']}).recordStats.char_up.gold,1);
    const cleared=h.api.merge(target,h.row('empty'),{mode:'replace',scopes:['progress']});
    assert.equal(cleared.recordStats,undefined);assert.equal(cleared.recordInitial,undefined);
    assert.equal(h.api.merge(target,source,{mode:'replace',scopes:['balances']}).recordStats.char_up.gold,1);
});
