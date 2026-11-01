/** 默认账号、旧记录接入与显式融合。只写本机玩家数据，不修改官方配置或实时模拟账户。 */
(function(){
    'use strict';
    const copy=value=>JSON.parse(JSON.stringify(value));
    const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
    const empty=value=>value===undefined||value===null||value===''||value===false||value===0||typeof value==='object'&&Object.values(value).every(empty);
    function legacy(game){
        const row={id:'legacy',name:'旧记录',en:'Legacy records',balances:{},owned:{},pools:{},dashboardRecords:{}};
        const raw={},errors=[],known=new Set(GameData.loadPoolIds(game,{standaloneOnly:true})),pools=new Set(known),prefix='GM_Data_'+game+'_';
        // 已移除卡池的原始历史也保留；缺少规则时只带记录，不猜测进度。
        for(let i=0;i<(localStorage.length||0);i++){const key=localStorage.key(i);if(key?.startsWith(prefix))pools.add(key.slice(prefix.length));}
        for(const pool of pools){
            const key=DashboardAccounts.legacyKey(game,pool),text=localStorage.getItem(key);raw[key]=text;
            if(!text)continue;
            try{
                const records=JSON.parse(text);if(!Array.isArray(records)||records.some(r=>!r||typeof r!=='object'||Array.isArray(r)))throw Error('Invalid records');
                if(!records.length)continue;
                const catalog=GameData.loadCatalog(game);
                if(known.has(pool)){
                    const context=UserDataProfiles.context(game,pool);
                    const report=DashboardValidation.validateHistory(records,{rules:context.rules,activeTiers:context.globalTiers.filter(t=>!context.rules.tiers||context.rules.tiers.some(r=>r.id===t.id)),
                    targetGoldIds:context.targetGoldIds,minorPities:context.minorPities,catalog,isStdPool:pool.includes('std'),allowRotation:context.rules.lifecycle?.allowRotation===true});
                    const invalid=report.entries.filter(item=>item.errors.length||item.rotation?.resetErrors?.length);
                    if(invalid.length||report.tail.errors.length){
                        const start=GachaEngine.createState(context.minorPities.length);
                        row.pools[pool]=copy(start);
                        row.dashboardRecords[pool]={records:copy(records),syncStarted:true,syncBlocked:{reason:'invalid_history',count:invalid.length||1},sync:{baseRecords:[],baseState:copy(start),appliedState:copy(start),owned:{}}};
                        continue;
                    }
                    const state=report.state;
                    if(!SimulatorStart.valid(state))throw Error('Invalid progress');row.pools[pool]=state;
                }
                row.dashboardRecords[pool]={records:copy(records),syncStarted:true};
                for(const [id,count] of Object.entries(DashboardAccounts.counts(records,catalog)))row.owned[id]=(row.owned[id]||0)+count;
            }catch(error){errors.push(pool);}
        }
        return {row,raw,errors};
    }
    function write(game,data,revision){
        if(UserDataProfiles.read(game).revision!==revision)throw Error('conflict');
        if(!data.items.every(UserDataProfiles.valid)||data.items.filter(row=>row.isDefault).length>1)throw Error('Invalid accounts');
        data.revision=revision+1;localStorage.setItem(UserDataProfiles.key(game),JSON.stringify(data));
    }
    function ensureDefault(game){
        const data=UserDataProfiles.read(game);
        const needsDefault=!data.items.some(row=>row.isDefault),needsLegacy=!data.legacyAccountMigrationDone;
        if(!needsDefault&&!needsLegacy)return {created:false,migrated:0,errors:[],legacyCreated:false};
        const source=legacy(game),handled=data.legacyImportHandled||{};
        let legacyCreated=false,archive=null;
        if(needsLegacy&&Object.keys(source.row.dashboardRecords).length){
            archive={...copy(source.row),id:'legacy-account',name:'旧数据账户',en:'Legacy data account',legacyAccount:true,isDefault:needsDefault};
            let n=1;while(data.items.some(row=>row.id===archive.id))archive.id='legacy-account-'+n++;
            data.items.push(archive);data.legacyAccountMigrationDone=true;legacyCreated=true;
        }
        const row={id:'default',name:'默认账号',en:'Default account',isDefault:true,balances:{},owned:{},pools:{},dashboardRecords:{}};
        let suffix=1;while(data.items.some(item=>item.id===row.id))row.id='default-'+suffix++;
        const imported=[];
        for(const [pool,entry] of Object.entries(source.row.dashboardRecords))if(needsDefault&&!handled[pool]){
            if(archive){imported.push(pool);continue;}
            row.dashboardRecords[pool]=copy(entry);if(source.row.pools[pool])row.pools[pool]=copy(source.row.pools[pool]);imported.push(pool);
            const catalog=GameData.loadCatalog(game);
            for(const [id,count] of Object.entries(DashboardAccounts.counts(entry.records,catalog)))row.owned[id]=(row.owned[id]||0)+count;
        }
        if(needsDefault&&!archive)data.items.push(row);data.legacyImportHandled={...handled,...Object.fromEntries(imported.map(pool=>[pool,true]))};
        if(needsDefault||legacyCreated)write(game,data,data.revision);
        // 先持久保存账号，再移除已成功转换的原始键；删除旧数据账户后不再重新生成。
        if(legacyCreated)for(const pool of Object.keys(source.row.dashboardRecords)){
            const key=DashboardAccounts.legacyKey(game,pool);
            if(localStorage.getItem(key)===source.raw[key])try{localStorage.removeItem(key);}catch{source.errors.push(pool);}
        }
        return {created:needsDefault,migrated:imported.length,errors:source.errors,id:needsDefault?(archive||row).id:undefined,legacyCreated};
    }
    function merge(target,source,{mode='target',scopes=['balances','owned','progress'],legacySource=false}={}){
        if(!['target','source','replace'].includes(mode)||!scopes.length||scopes.some(s=>!['balances','owned','progress'].includes(s)))throw Error('Invalid merge options');
        const result=copy(target),primary=mode==='source'?source:target,secondary=mode==='source'?target:source;
        for(const field of ['balances','owned'])if(scopes.includes(field)&&!(legacySource&&field==='balances')){
            if(mode==='replace')result[field]=copy(source[field]||{});
            else{
                result[field]=copy(primary[field]||{});
                for(const [id,value] of Object.entries(secondary[field]||{}))if(empty(result[field][id]))result[field][id]=value;
            }
        }
        if(scopes.includes('progress')){
            const economy=mode==='replace'?source.economyProgress:empty(primary.economyProgress)?secondary.economyProgress:primary.economyProgress;
            if(economy===undefined)delete result.economyProgress;else result.economyProgress=copy(economy);
            result.pools={};result.dashboardRecords={};delete result.recordInitial;delete result.recordStats;
            const ids=new Set([...Object.keys(target.pools||{}),...Object.keys(target.dashboardRecords||{}),...Object.keys(source.pools||{}),...Object.keys(source.dashboardRecords||{})]);
            const bundle=(row,id)=>({state:row.pools?.[id],entry:row.dashboardRecords?.[id],initial:row.recordInitial?.[id],stats:row.recordStats?.[id]});
            const blank=b=>empty(b.state)&&!(b.entry?.records?.length);
            for(const id of ids){
                let chosen=mode==='replace'?bundle(source,id):bundle(primary,id);
                if(mode!=='replace'&&blank(chosen))chosen=bundle(secondary,id);
                if(chosen.state)result.pools[id]=copy(chosen.state);
                if(chosen.initial)(result.recordInitial??={})[id]=copy(chosen.initial);
                if(chosen.stats)(result.recordStats??={})[id]=copy(chosen.stats);
                if(chosen.entry)result.dashboardRecords[id]={records:copy(chosen.entry.records||[]),syncStarted:true};
            }
        }
        // 持有或进度重组后，旧录入同步贡献不能继续用于扣回数量；下次录入重新建基准。
        if(scopes.includes('owned')||scopes.includes('progress'))for(const entry of Object.values(result.dashboardRecords||{})){if(entry.sync)entry.syncStarted=true;delete entry.sync;}
        if(!UserDataProfiles.valid(result))throw Error('Invalid merged account');
        return result;
    }
    function changes(before,after){
        const result=[];
        for(const field of ['balances','owned'])for(const id of new Set([...Object.keys(before[field]||{}),...Object.keys(after[field]||{})])){
            const a=before[field]?.[id]||0,b=after[field]?.[id]||0;if(a!==b)result.push({field,id,before:a,after:b});
        }
        for(const id of new Set([...Object.keys(before.pools||{}),...Object.keys(after.pools||{}),...Object.keys(before.dashboardRecords||{}),...Object.keys(after.dashboardRecords||{})])){
            const a={state:before.pools?.[id]||null,records:before.dashboardRecords?.[id]?.records||[],initial:before.recordInitial?.[id]||null,stats:before.recordStats?.[id]||null},b={state:after.pools?.[id]||null,records:after.dashboardRecords?.[id]?.records||[],initial:after.recordInitial?.[id]||null,stats:after.recordStats?.[id]||null};
            if(!same(a,b)&&!(empty(a.state)&&empty(b.state)&&!a.records.length&&!b.records.length))result.push({field:'progress',id,before:a,after:b});
        }
        const beforeEconomy=before.economyProgress||{exchanges:{},prerequisites:{}},afterEconomy=after.economyProgress||{exchanges:{},prerequisites:{}};
        if(!same(beforeEconomy,afterEconomy))result.push({field:'economyProgress',id:'exchanges',before:copy(beforeEconomy),after:copy(afterEconomy)});
        return result;
    }
    function preview(game,{sourceId,targetId,mode,scopes}){
        if(sourceId===targetId)throw Error('same_account');
        const data=UserDataProfiles.read(game),target=data.items.find(row=>row.id===targetId);
        const source=data.items.find(row=>row.id===sourceId);
        if(!source||!target)throw Error('account_missing');
        const row=merge(target,source,{mode,scopes,legacySource:!!source.legacyAccount&&!Object.keys(source.balances||{}).length});
        return {game,revision:data.revision,sourceId,targetId,mode,scopes:copy(scopes),row,changes:changes(target,row),before:copy(target),sourceName:UserDataProfiles.label(source),targetName:UserDataProfiles.label(target)};
    }
    function commit(plan){
        const data=UserDataProfiles.read(plan.game);if(data.revision!==plan.revision)throw Error('conflict');
        // 重建预览，避免提交过期或被外部改写的对象。
        const fresh=preview(plan.game,plan);if(!same(fresh.row,plan.row))throw Error('conflict');
        const index=data.items.findIndex(row=>row.id===plan.targetId);data.items[index]=copy(fresh.row);
        data.lastPlayerMerge={targetId:plan.targetId,before:copy(fresh.before),after:copy(fresh.row)};
        write(plan.game,data,plan.revision);return copy(fresh.row);
    }
    function undo(game){
        const data=UserDataProfiles.read(game),last=data.lastPlayerMerge;if(!last)throw Error('no_merge');
        const index=data.items.findIndex(row=>row.id===last.targetId);
        if(index<0||!same(data.items[index],last.after))throw Error('undo_changed');
        if(!UserDataProfiles.valid(last.before))throw Error('Invalid merge backup');
        data.items[index]=copy(last.before);delete data.lastPlayerMerge;write(game,data,data.revision);
    }
    window.UserDataTools=Object.freeze({ensureDefault,merge,changes,preview,commit,undo});
})();
