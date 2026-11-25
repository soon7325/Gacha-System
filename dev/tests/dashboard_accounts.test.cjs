const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'../..',p),'utf8'),plain=x=>JSON.parse(JSON.stringify(x));
function setup(){
    const store=new Map();let fail=false;
    const c=vm.createContext({window:{},localStorage:{getItem:k=>store.get(k)??null,setItem:(k,v)=>{if(fail)throw Error('quota');store.set(k,v);}}});
    for(const [file,name] of [['logic/gacha_engine.js','GachaEngine'],['logic/simulator_start.js','SimulatorStart'],['logic/user_data_profiles.js','UserDataProfiles'],['logic/dashboard_validation.js','DashboardValidation'],['logic/dashboard_accounts.js','DashboardAccounts']]){vm.runInContext(read(file),c);c[name]=c.window[name];}
    const state=c.GachaEngine.createState(1);state.total=20;state.pity=7;state.minorPityCounters[0]=2;
    const row={id:'a',name:'账号 A',en:'Account A',balances:{jade:160},owned:{'["char","hero"]':2},pools:{pool:plain(state),other:plain(state)}};
    c.UserDataProfiles.save('game',row,0);c.UserDataProfiles.save('game',{...plain(row),id:'b',name:'账号 B'},1);
    const context={rules:{pities:[{tierId:'gold',isGold:true,pulls:90,enableUp:true,guaranteeLimit:1,baseRate:0.6}],sparkRules:[{limit:30,type:'once',noReset:true,targetTier:'gold'}]},
        activeTiers:[{id:'gold',name:'5',rate:0.6},{id:'silver',name:'4',rate:5},{id:'bronze',name:'3',rate:94.4}],targetGoldIds:['gold'],minorPities:[{tierId:'silver',pulls:10}],
        catalog:{char:[{id:'hero',name:'角色',short:'角',tierId:'gold'},{id:'low',name:'低星',tierId:'silver'}]},isStdPool:false,allowRotation:true};
    const api=c.DashboardAccounts;
    return {c,api,context,store,row,fail:()=>{fail=true;},save:(records,sync=true,options={})=>api.save('game','pool','a',records,api.read('game','pool','a'),context,sync,options)};
}
const low={tierId:'bronze',star:3},gold={tierId:'gold',star:5,short:'角',isLost:true};

test('旧账户默认为结果记录用，用途创建后不可切换，默认账户仍可保存；模拟账户禁止录入',()=>{
    const h=setup(),profiles=h.c.UserDataProfiles;
    assert.equal(profiles.purpose(h.row),'record');assert.equal(profiles.locked(h.row),true);
    const data=profiles.read('game'),simulation={...plain(h.row),id:'sim',purpose:'simulation'};profiles.save('game',simulation,data.revision);
    assert.equal(profiles.locked(simulation),false);
    const snapshot=h.api.read('game','pool','sim');assert.throws(()=>h.api.save('game','pool','sim',[low],snapshot,h.context,true),/wrong_purpose/);
    assert.throws(()=>profiles.save('game',{...simulation,purpose:'record'},snapshot.revision),/purpose cannot be changed/);
    const updated=profiles.save('game',{...snapshot.row,isDefault:true},snapshot.revision);assert.equal(updated.isDefault,true);assert.equal(updated.purpose,'simulation');
    const latest=profiles.read('game');profiles.save('game',{...latest.items[0],isDefault:true},latest.revision);assert.equal(profiles.read('game').items[0].isDefault,true);
});

test('初始垫抽单独保存，录入从起点继续；重开、重复保存不把当前进度再次当作起点',()=>{
    const h=setup(),profiles=h.c.UserDataProfiles,data=profiles.read('game'),row=data.items[0];
    row.purpose='record';row.pools.pool.total=80;row.pools.pool.pity=30;row.recordInitial={pool:plain(row.pools.pool)};profiles.save('game',row,data.revision);
    const records=Array.from({length:10},()=>low);h.save(records);
    let saved=profiles.read('game').items[0];assert.equal(saved.pools.pool.total,90);assert.equal(saved.pools.pool.pity,40);
    assert.equal(profiles.initial(saved,'pool',1).total,80);assert.equal(profiles.initial(saved,'pool',1).pity,30);
    assert.equal(h.api.read('game','pool','a').records.length,10);
    h.save(records);saved=profiles.read('game').items[0];assert.equal(saved.pools.pool.pity,40);
    h.save([...records,low]);saved=profiles.read('game').items[0];assert.equal(saved.pools.pool.pity,41);assert.equal(profiles.initial(saved,'pool',1).pity,30);
    const legacy={...plain(h.row),dashboardRecords:{pool:{records:[gold]}}};assert.equal(profiles.initial(legacy,'pool',1).total,0);
});

test('非法录入仅保存记录与红色同步标记，玩家进度和持有整批保持原样；修正后清除并正确同步',()=>{
    const h=setup();Object.assign(h.context.rules.pities[0],{upRate:50,useGuarantee:true});
    const result=h.save([gold,gold]);assert.equal(result.blocked,'invalid_history');assert.equal(result.synced,false);
    let row=h.c.UserDataProfiles.read('game').items[0];
    assert.deepEqual(plain(row.pools),h.row.pools);assert.deepEqual(plain(row.owned),h.row.owned);assert.deepEqual(plain(row.balances),h.row.balances);
    assert.equal(row.dashboardRecords.pool.records.length,2);assert.equal(row.dashboardRecords.pool.syncBlocked.reason,'invalid_history');
    h.save([gold,gold],false);row=h.c.UserDataProfiles.read('game').items[0];assert.ok(row.dashboardRecords.pool.syncBlocked);
    const status=()=>h.api.status(h.api.read('game','pool','a').row,'pool',()=>h.context);
    assert.equal(status().recordNumber,2);
    // 已有存档可能仍有旧标记：读取时按现行规则复核，保留玩家数据。
    h.context.rules.pities[0].useGuarantee=false;
    const stored=h.store.get('GM_Sim_Profiles_game');
    assert.equal(status().reason,'pending');
    assert.equal(h.store.get('GM_Sim_Profiles_game'),stored);
    h.context.rules.pities[0].useGuarantee=true;
    h.save([gold,{...gold,isLost:false}],false);
    assert.equal(status().reason,'pending');
    row=h.api.read('game','pool','a').row;
    assert.equal(row.dashboardRecords.pool.syncBlocked,undefined);
    assert.deepEqual(plain(row.owned),h.row.owned);
    assert.deepEqual(plain(row.pools),h.row.pools);
    assert.equal(h.save(row.dashboardRecords.pool.records).synced,true);
    assert.equal(status(),null);
    row=h.c.UserDataProfiles.read('game').items[0];assert.equal(row.dashboardRecords.pool.syncBlocked,undefined);
    assert.equal(row.pools.pool.total,22);assert.equal(row.owned['["char","hero"]'],4);
    h.save([gold,{...gold,isLost:false}]);assert.equal(h.c.UserDataProfiles.read('game').items[0].owned['["char","hero"]'],4);
});

test('已有同步贡献遇到非法修改不回退、不新增；恢复合法数据时只调整原贡献差额',()=>{
    const h=setup();Object.assign(h.context.rules.pities[0],{upRate:50,useGuarantee:true});h.save([gold]);
    const previous=plain(h.c.UserDataProfiles.read('game').items[0]);h.save([gold,gold]);
    let row=h.c.UserDataProfiles.read('game').items[0];assert.deepEqual(plain(row.pools),previous.pools);assert.deepEqual(plain(row.owned),previous.owned);
    h.save([low]);row=h.c.UserDataProfiles.read('game').items[0];assert.equal(row.pools.pool.total,21);assert.equal(row.pools.pool.pity,8);
    assert.deepEqual(plain(row.owned),h.row.owned);assert.equal(row.dashboardRecords.pool.syncBlocked,undefined);
});

test('非法记录保存失败时也不部分写入红色标记或同步基准；其他账号和卡池不受影响',()=>{
    const h=setup();Object.assign(h.context.rules.pities[0],{upRate:50,useGuarantee:true});
    const before=h.store.get('GM_Sim_Profiles_game');h.fail();assert.throws(()=>h.save([gold,gold]),/quota/);assert.equal(h.store.get('GM_Sim_Profiles_game'),before);
    const other=setup();Object.assign(other.context.rules.pities[0],{upRate:50,useGuarantee:true});other.save([gold,gold]);
    const rows=other.c.UserDataProfiles.read('game').items;assert.equal(rows[1].dashboardRecords,undefined);assert.equal(rows[0].dashboardRecords.other,undefined);
});
test('账号记录独立，关闭同步只存记录，原有未分配历史及共享余额持有不变',()=>{
    const h=setup();h.store.set('GM_Data_game_pool',JSON.stringify([low]));
    h.save([gold],false);
    assert.deepEqual(plain(h.api.read('game','pool','a').records),[gold]);
    assert.equal(h.api.read('game','pool','b').records.length,0);assert.equal(h.api.read('game','other','a').records.length,0);
    assert.deepEqual(plain(h.api.read('game','pool',null).records),[low]);
    const row=h.c.UserDataProfiles.read('game').items[0];assert.deepEqual(plain(row.pools),h.row.pools);assert.deepEqual(plain(row.owned),h.row.owned);assert.equal(row.balances.jade,160);
});
test('同步重放已有初始进度，重复保存不重复计数；修改删除只回退贡献',()=>{
    const h=setup();h.save([low,gold]);
    let row=h.c.UserDataProfiles.read('game').items[0];assert.equal(row.pools.pool.total,22);assert.equal(row.pools.pool.pity,0);assert.equal(row.pools.pool.guaranteeCount,1);assert.equal(row.pools.pool.minorPityCounters[0],0);
    assert.equal(row.owned['["char","hero"]'],3);assert.equal(row.balances.jade,160);assert.deepEqual(plain(row.pools.other),h.row.pools.other);
    h.save([low,gold]);row=h.c.UserDataProfiles.read('game').items[0];assert.equal(row.owned['["char","hero"]'],3);assert.equal(row.pools.pool.total,22);
    h.save([low]);row=h.c.UserDataProfiles.read('game').items[0];assert.equal(row.owned['["char","hero"]'],2);assert.equal(row.pools.pool.pity,8);assert.equal(row.pools.pool.minorPityCounters[0],3);
    h.save([]);row=h.c.UserDataProfiles.read('game').items[0];assert.deepEqual(plain(row.pools.pool),h.row.pools.pool);
});
test('首次同步完整重算明确起点的进度，旧物品仍按设置排除，保护物品同步基准',()=>{
    const h=setup();h.save([gold],false);h.save([gold,low]);
    let row=h.c.UserDataProfiles.read('game').items[0];assert.equal(row.pools.pool.total,22);assert.equal(row.owned['["char","hero"]'],2);
    const before=h.store.get('GM_Sim_Profiles_game');assert.throws(()=>h.save([low]),/baseline_changed/);assert.equal(h.store.get('GM_Sim_Profiles_game'),before);
    h.save([low],false);row=h.c.UserDataProfiles.read('game').items[0];assert.equal(row.pools.pool.total,22);
});
test('明确物品按中英文或简称识别，随机填充、未命名及歧义不增加持有',()=>{
    const h=setup();h.context.catalog.char[0].en='Hero';
    const result=h.api.counts([gold,{...gold,autoRandom:true},low,{short:'Hero'},{short:'不存在'}],h.context.catalog);
    assert.deepEqual(plain(result),{'["char","hero"]':2});
    h.context.catalog.wep=[{id:'weapon',name:'角'}];assert.deepEqual(plain(h.api.counts([gold],h.context.catalog)),{});
});
test('跨页修改、已删除账号或存储失败不保存部分记录与玩家数据',()=>{
    const h=setup(),snapshot=h.api.read('game','pool','a');h.save([low],false);
    let before=h.store.get('GM_Sim_Profiles_game');assert.throws(()=>h.api.save('game','pool','a',[gold],snapshot,h.context,true),/conflict/);assert.equal(h.store.get('GM_Sim_Profiles_game'),before);
    h.fail();assert.throws(()=>h.save([low,gold]),/quota/);assert.equal(h.store.get('GM_Sim_Profiles_game'),before);
    const other=setup(),data=other.c.UserDataProfiles.read('game');other.c.UserDataProfiles.remove('game','a',data.revision);assert.throws(()=>other.api.read('game','pool','a'),/account_missing/);
});
test('玩家数据手动修改后从新进度继续，保留已录入记录和其他字段',()=>{
    const h=setup();h.save([low]);const data=h.c.UserDataProfiles.read('game'),row=data.items[0];row.pools.pool.pity=40;row.pools.pool.total=80;h.c.UserDataProfiles.save('game',row,data.revision);
    h.save([low,low]);const result=h.c.UserDataProfiles.read('game').items[0];assert.equal(result.pools.pool.pity,41);assert.equal(result.pools.pool.total,81);assert.equal(result.dashboardRecords.pool.records.length,2);
});
test('补齐旧格式及随机占位图不改变同步基准，也不增加真实持有',()=>{
    const h=setup();h.save([{star:3}],false);
    h.save([{tierId:'bronze',star:3,short:'随机贴图',autoRandom:true},low]);
    const row=h.c.UserDataProfiles.read('game').items[0];assert.equal(row.pools.pool.total,22);assert.deepEqual(plain(row.owned),h.row.owned);
});
test('规则进度推进包含井、赠送计数及小保底，已有待赠送抽只按明确录入消耗',()=>{
    const h=setup(),data=h.c.UserDataProfiles.read('game'),row=data.items[0];
    row.pools.pool.freeQueue=[{countPity:false,remaining:2}];h.c.UserDataProfiles.save('game',row,data.revision);
    h.context.rules.giftRules=[{type:'loop',trigger:10,amount:1}];
    const original=plain(row.pools.pool);
    h.save([...Array(10).fill(low),{tierId:'bronze',isFree:true}]);
    const state=h.c.UserDataProfiles.read('game').items[0].pools.pool;
    assert.equal(state.total,31);assert.equal(state.pity,17);assert.equal(state.minorPityCounters[0],2);
    assert.equal(state.sparkState[0].triggeredCount,1);assert.equal(state.giftState[0].triggeredCount,3);assert.equal(state.freeQueue[0].remaining,1);
    h.save([]);assert.deepEqual(plain(h.c.UserDataProfiles.read('game').items[0].pools.pool),original);
});


test('首次同步可选包含已有记录，追加当前玩家基准；重复保存及修改删除按贡献差额处理',()=>{
    const h=setup();h.save([gold],false);
    h.save([gold,low],true,{includeExisting:true});
    let row=h.c.UserDataProfiles.read('game').items[0];
    assert.equal(row.pools.pool.total,22);assert.equal(row.owned['["char","hero"]'],3);
    assert.equal(row.balances.jade,160);assert.equal(row.dashboardRecords.pool.syncStarted,true);
    h.save([gold,low],true,{includeExisting:true});
    row=h.c.UserDataProfiles.read('game').items[0];assert.equal(row.pools.pool.total,22);assert.equal(row.owned['["char","hero"]'],3);
    h.save([low],true,{includeExisting:true});row=h.c.UserDataProfiles.read('game').items[0];
    assert.equal(row.pools.pool.total,21);assert.equal(row.owned['["char","hero"]'],2);
    h.save([],true,{includeExisting:true});row=h.c.UserDataProfiles.read('game').items[0];
    assert.deepEqual(plain(row.pools.pool),h.row.pools.pool);assert.deepEqual(plain(row.owned),h.row.owned);
});

test('包含历史仅首次同步生效，关闭再开启、手动修改或旧迁移账户不重复导入',()=>{
    const h=setup();h.save([gold],false);h.save([gold,low]);
    h.save([gold,low,low],false);
    h.save([gold,low,low,low],true,{includeExisting:true});
    let row=h.c.UserDataProfiles.read('game').items[0];assert.equal(row.pools.pool.total,24);assert.equal(row.owned['["char","hero"]'],2);
    const data=h.c.UserDataProfiles.read('game');row.pools.pool.total=80;row.pools.pool.pity=40;
    h.c.UserDataProfiles.save('game',row,data.revision);h.save([gold,low,low,low,low],true,{includeExisting:true});
    row=h.c.UserDataProfiles.read('game').items[0];assert.equal(row.pools.pool.total,81);assert.equal(row.pools.pool.pity,41);
    const legacy=setup();legacy.save([gold],false);const state=legacy.c.UserDataProfiles.read('game');state.items[0].legacyAccount=true;
    legacy.c.UserDataProfiles.save('game',state.items[0],state.revision);
    legacy.save([gold,low],true,{includeExisting:true});row=legacy.c.UserDataProfiles.read('game').items[0];
    assert.equal(row.pools.pool.total,21);assert.equal(row.owned['["char","hero"]'],2);
});

test('包含历史仍遵守账号隔离、冲突和原子保存，失败不会消耗首次同步机会',()=>{
    const h=setup();h.save([gold],false);const snapshot=h.api.read('game','pool','a'),before=h.store.get('GM_Sim_Profiles_game');
    h.fail();assert.throws(()=>h.api.save('game','pool','a',[gold,low],snapshot,h.context,true,{includeExisting:true}),/quota/);
    assert.equal(h.store.get('GM_Sim_Profiles_game'),before);
    const other=setup();other.save([gold],false);other.save([gold,low],true,{includeExisting:true});
    const row=other.c.UserDataProfiles.read('game').items[1];assert.deepEqual(plain(row.pools),other.row.pools);assert.deepEqual(plain(row.owned),other.row.owned);
});


test('20、30、40 抽完整同步不丢首个十抽，反复保存与旧缺十抽基准可修复',()=>{
    for(const amount of [20,30,40]){
        const h=setup(),profiles=h.c.UserDataProfiles,data=profiles.read('game'),row=data.items[0];
        const initial=h.c.GachaEngine.createState(1);
        row.purpose='record';row.pools.pool=plain(initial);row.recordInitial={pool:plain(initial)};
        profiles.save('game',row,data.revision);
        h.save(Array(10).fill(low),false);
        h.save(Array(amount).fill(low),true);
        let saved=profiles.read('game').items[0];
        assert.equal(saved.pools.pool.total,amount);assert.equal(saved.pools.pool.pity,amount);
        h.save(Array(amount).fill(low),true);saved=profiles.read('game').items[0];assert.equal(saved.pools.pool.total,amount);
        // 模拟旧版已把首十抽排除，保存一次即可重建完整进度。
        const latest=profiles.read('game');saved.pools.pool.total=amount-10;saved.pools.pool.pity=amount-10;
        saved.dashboardRecords.pool.sync.appliedState=plain(saved.pools.pool);
        profiles.save('game',saved,latest.revision);h.save(Array(amount).fill(low),true);
        assert.equal(profiles.read('game').items[0].pools.pool.total,amount);
    }
});


test('空白卡池补填起点后再录入，重复保存和继续追加不漏算或重复累计',()=>{
    for(const emptyCheckpoint of [false,true]){
        const h=setup(),profiles=h.c.UserDataProfiles,data=profiles.read('game'),row=data.items[0];
        const zero=plain(h.c.GachaEngine.createState(1));
        row.purpose='record';row.pools.pool=plain(zero);row.recordInitial={pool:plain(zero)};row.recordStats={pool:{gold:0,up:0}};
        profiles.save('game',row,data.revision);
        if(emptyCheckpoint)h.save([]);
        let current=profiles.read('game'),draft=current.items[0];
        assert.equal(profiles.poolLocked(draft,'pool'),false);
        draft.pools.pool.total=draft.pools.pool.pity=30;draft.recordInitial.pool=plain(draft.pools.pool);
        profiles.save('game',draft,current.revision);
        for(const amount of [20,20,30,30]){
            h.save(Array(amount).fill(low));
            current=profiles.read('game');
            assert.equal(current.items[0].pools.pool.total,30+amount);
            assert.equal(profiles.initial(current.items[0],'pool',1).total,30);
            assert.equal(profiles.poolLocked(current.items[0],'pool'),true);
        }
    }
});

test('初始歪数0录入UP后不会变为1；初始快照和当前状态分别保留',()=>{
    for(const losses of [0,1]){
        const h=setup(),profiles=h.c.UserDataProfiles,data=profiles.read('game'),row=data.items[0];
        Object.assign(h.context.rules.pities[0],{enableUp:true,useGuarantee:true,upRate:50});
        const initial=h.c.GachaEngine.createState(1);initial.total=120;initial.pity=60;initial.guaranteeCount=initial.guaranteeLosses=losses;
        row.purpose='record';row.pools.pool=plain(initial);row.recordInitial={pool:plain(initial)};
        row.recordStats={pool:{gold:1,up:1-losses}};profiles.save('game',row,data.revision);
        const records=[...Array(29).fill(low),{...gold,isLost:false}];h.save(records);
        const saved=profiles.read('game').items[0],start=profiles.initial(saved,'pool',1);
        assert.equal(saved.pools.pool.total,150);assert.equal(saved.pools.pool.pity,0);assert.equal(saved.pools.pool.guaranteeCount,0);
        assert.equal(start.guaranteeCount,losses);assert.equal(start.guaranteeLosses,losses);
        assert.equal(h.c.SimulatorStart.summaryErrors(h.context,start,profiles.summary(saved,'pool')).length,0);
        h.save(records);assert.equal(profiles.initial(profiles.read('game').items[0],'pool',1).guaranteeCount,losses);
    }
});

test('自动同步只处理合法待同步记录，关闭、异常和重复进入均不写入',()=>{
    const h=setup();
    vm.runInContext(read('logic/app_preferences.js'),h.c);
    h.c.AppPreferences=h.c.window.AppPreferences;
    const run=()=>h.api.syncPending('game','pool','a',()=>h.context);
    const stored=()=>h.store.get('GM_Sim_Profiles_game');
    h.save([low],false);
    h.store.set('GM_Dashboard_Sync_Player','false');
    const pending=stored();
    run();assert.equal(stored(),pending);
    h.store.delete('GM_Dashboard_Sync_Player');
    assert.equal(run().synced,true);
    assert.equal(h.api.read('game','pool','a').row.pools.pool.total,21);
    const synced=stored();run();assert.equal(stored(),synced);
    h.save([low,{...gold,short:'?'}],false);
    const invalid=stored();run();assert.equal(stored(),invalid);
    h.save([gold],false);
    const conflict=stored();run();assert.equal(stored(),conflict);
    assert.equal(h.api.status(h.api.read('game','pool','a').row,'pool',()=>h.context).reason,'baseline_changed');
});
