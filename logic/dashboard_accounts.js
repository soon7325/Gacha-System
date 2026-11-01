/** 录入按账号隔离；记录和同步后的玩家数据在同一次写入中提交。 */
(function(){
    'use strict';
    const copy=value=>JSON.parse(JSON.stringify(value));
    const legacyKey=(game,pool)=>`GM_Data_${game}_${pool}`;
    const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
    const token=(row,context)=>row.isRuleNode?{config:row.config||{}}:{tierId:row.tierId||context.activeTiers.find(t=>t.name===String(row.star))?.id||row.star,
        name:row.autoRandom?'':row.short||row.name||'',isFree:!!row.isFree||['free_pity','free_nopity'].includes(row.pullType),isLost:typeof row.isUP==='boolean'?!row.isUP:!!row.isLost,pullType:row.pullType,countPity:row.countPity,isSpark:row.isSpark};
    const prefix=(records,base,context)=>records.length>=base.length&&base.every((row,i)=>same(token(row,context),token(records[i],context)));
    function read(game,pool,accountId){
        if(!accountId){const raw=localStorage.getItem(legacyKey(game,pool));const records=raw?JSON.parse(raw):[];if(!Array.isArray(records))throw Error('Invalid records');return {records,raw};}
        const data=UserDataProfiles.read(game),row=data.items.find(row=>row.id===accountId);
        if(!row)throw Error('account_missing');
        const entry=row.dashboardRecords?.[pool]||{records:[]};if(!Array.isArray(entry.records))throw Error('Invalid records');
        return {records:copy(entry.records),revision:data.revision,row,entry:copy(entry)};
    }
    function counts(records,catalog){
        const index=new Map();
        const ids=new Map();
        for(const [category,items] of Object.entries(catalog))for(const item of items||[]){
            const key=JSON.stringify([category,item.ownershipId||item.id||item.name]);
            for(const id of [item.id,item.presetId,...(item.legacyIds||[])].filter(Boolean))ids.set(id,key);
            for(const name of [item.name,item.short,item.en,item.eshort,...(item.aliases||[])].filter(Boolean)){
                if(!index.has(name))index.set(name,new Set());index.get(name).add(key);
            }
        }
        const result={};
        for(const row of records){
            if(row.isRuleNode||row.autoRandom)continue;
            const matches=row.itemId?(ids.has(row.itemId)?new Set([ids.get(row.itemId)]):null):index.get(row.short||row.name);if(matches?.size!==1)continue;
            const key=Array.from(matches)[0];result[key]=(result[key]||0)+1;
        }
        return result;
    }
    function save(game,pool,accountId,records,snapshot,context,sync,{includeExisting=false}={}){
        if(!Array.isArray(records))throw Error('Invalid records');
        const current=read(game,pool,accountId);
        if(!accountId){
            if(current.raw!==snapshot.raw)throw Error('conflict');
            localStorage.setItem(legacyKey(game,pool),JSON.stringify(records));return {synced:false};
        }
        if(current.revision!==snapshot.revision)throw Error('conflict');
        if(UserDataProfiles.purpose(current.row)!=='record')throw Error('wrong_purpose');
        const row=copy(current.row),entry={records:copy(records)};
        row.recordInitial={...(row.recordInitial||{}),[pool]:UserDataProfiles.initial(current.row,pool,context.minorPities.length)};
        const hasSynced=current.entry.syncStarted===true||!!current.entry.sync||row.legacyAccount===true;
        if(hasSynced)entry.syncStarted=true;
        if(current.entry.syncBlocked){entry.syncBlocked=copy(current.entry.syncBlocked);if(current.entry.sync)entry.sync=copy(current.entry.sync);}
        if(sync){
            let checkpoint=current.entry.sync;
            const present=row.pools[pool]||GachaEngine.createState(context.minorPities.length);
            // 手动修改玩家进度后，以新的玩家进度及现有记录作为基准，避免重算历史。
            if(!checkpoint||!same(present,checkpoint.appliedState)){
                const manualBaseline=!!checkpoint&&!same(present,checkpoint.appliedState);
                checkpoint={baseRecords:includeExisting&&!hasSynced?[]:copy(current.records),baseState:copy(present),owned:{},...(manualBaseline?{manualBaseline:true}:{})};
            }
            if(!SimulatorStart.valid(checkpoint.baseState)||!Array.isArray(checkpoint.baseRecords))throw Error('Invalid sync baseline');
            if(!prefix(records,checkpoint.baseRecords,context))throw Error('baseline_changed');
            const added=records.slice(checkpoint.baseRecords.length);
            // 新建结果账户的起点明确且不可手动改写：进度始终从起点重放完整记录。
            // 首次同步是否补录旧物品只影响 owned，不再把已有十抽从进度中扣掉。
            const initial=!row.legacyAccount&&!checkpoint.manualBaseline?current.row.recordInitial?.[pool]:null;
            const report=DashboardValidation.validateHistory(initial?records:added,{...context,initialState:initial||checkpoint.baseState});
            const invalid=report.entries.filter(item=>item.errors.length||item.rotation?.resetErrors?.length);
            if(invalid.length||report.tail.errors.length){
                // 保存可修正的录入记录和同步基准，整批不推进玩家进度或持有。
                entry.syncBlocked={reason:'invalid_history',count:invalid.length||1};
                entry.sync={...copy(checkpoint),appliedState:copy(present)};
                row.dashboardRecords={...(row.dashboardRecords||{}),[pool]:entry};
                UserDataProfiles.save(game,row,current.revision);
                return {synced:false,blocked:'invalid_history'};
            }
            if(!SimulatorStart.valid(report.state))throw Error('Invalid progress');
            delete entry.syncBlocked;entry.syncStarted=true;
            const owned=counts(added,context.catalog);
            for(const key of new Set([...Object.keys(checkpoint.owned||{}),...Object.keys(owned)])){
                const value=(row.owned[key]||0)+(owned[key]||0)-(checkpoint.owned?.[key]||0);
                if(!Number.isSafeInteger(value)||value<0)throw Error('owned_conflict');
                if(value)row.owned[key]=value;else delete row.owned[key];
            }
            row.pools[pool]=copy(report.state);
            entry.sync={baseRecords:checkpoint.baseRecords,baseState:checkpoint.baseState,appliedState:copy(report.state),owned,...(checkpoint.manualBaseline?{manualBaseline:true}:{})};
        }
        row.dashboardRecords={...(row.dashboardRecords||{}),[pool]:entry};
        UserDataProfiles.save(game,row,current.revision);
        return {synced:!!sync};
    }
    window.DashboardAccounts=Object.freeze({read,save,counts,legacyKey});
})();
