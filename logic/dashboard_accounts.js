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
    function review(current,pool,records,context,includeExisting){
        const row=current.row;
        const hasSynced=current.entry.syncStarted||current.entry.sync||row.legacyAccount;
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
        const initial=!row.legacyAccount&&!checkpoint.manualBaseline?UserDataProfiles.initial(row,pool,context.minorPities.length):null;
        const report=DashboardValidation.validateHistory(initial?records:added,{...context,initialState:initial||checkpoint.baseState});
        const invalid=report.entries.filter(item=>item.errors.length||item.rotation?.resetErrors?.length);
        const first=invalid[0];
        const issue=first||report.tail.errors.length?{
            reason:'invalid_history',count:invalid.length||1,
            recordNumber:(initial?0:checkpoint.baseRecords.length)+(first?first.index+1:report.entries.length),
            errors:first?.errors.length?first.errors:first?.rotation?.resetErrors||report.tail.errors
        }:null;
        return {checkpoint,present,added,report,issue};
    }
    function validationContext(pool,rules,globalTiers,catalog){
        const {activeTiers,targetGoldIds,minorPities}=GameData.describePool(rules,globalTiers,{missingColor:'#555',englishFallbackToName:true});
        const tiers=activeTiers.length?activeTiers:globalTiers.map((tier,i)=>({...tier,prob:[0.6,9.4][i]??90}));
        return {rules,activeTiers:tiers,targetGoldIds,minorPities,catalog,isStdPool:pool.includes('std'),allowRotation:rules.lifecycle?.allowRotation!==false};
    }
    function status(row,pool,getContext){
        const entry=row?.dashboardRecords?.[pool];
        if(!entry)return null;
        const pending=entry.syncBlocked||entry.syncPending||(!entry.syncStarted&&!entry.sync&&entry.records?.length);
        if(pending){
            try{
                const context=getContext();
                const plan=review({row,entry,records:entry.records},pool,entry.records,context,localStorage.getItem('GM_Dashboard_Sync_Existing')==='true');
                if(plan.issue)return plan.issue;
                nextInventory(row.owned,plan.checkpoint.owned,counts(plan.added,context.catalog));
                return {reason:'pending'};
            }catch(error){
                if(error.message==='owned_conflict')return {reason:'owned_conflict'};
                if(error.message==='baseline_changed'){
                    const base=entry.sync.baseRecords,context=getContext();
                    const first=base.findIndex((r,i)=>!entry.records[i]||!same(token(r,context),token(entry.records[i],context)));
                    return {reason:'baseline_changed',recordCount:entry.records.length,baselineCount:base.length,firstDifference:first+1};
                }
                return {reason:'review_failed'};
            }
        }
        return null;
    }
    function nextInventory(current,previous,owned){
        const next={...current};
        for(const key of new Set([...Object.keys(previous||{}),...Object.keys(owned)])){
            const value=(current[key]||0)+(owned[key]||0)-(previous?.[key]||0);
            if(!Number.isSafeInteger(value)||value<0)throw Error('owned_conflict');
            if(value)next[key]=value;else delete next[key];
        }
        return next;
    }
    function syncPending(game,pool,id,getContext){
        if(!id||!AppPreferences.playerData().sync)return;
        const snapshot=read(game,pool,id);
        let context;
        const issue=status(snapshot.row,pool,()=>context??=getContext());
        if(issue?.reason==='pending')return save(game,pool,id,snapshot.records,snapshot,context,true,{includeExisting:AppPreferences.playerData().history});
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
        if(!sync){
            if(current.entry.sync)entry.sync=copy(current.entry.sync);
            if(!same(current.records,records)||current.entry.syncPending||current.entry.syncBlocked)entry.syncPending=true;
            if(current.entry.syncBlocked){
                try{
                    const {issue}=review(current,pool,records,context,includeExisting);
                    if(issue)entry.syncBlocked=issue;
                }catch(error){
                    if(error.message!=='baseline_changed')entry.syncBlocked=current.entry.syncBlocked;
                }
            }
        }
        if(sync){
            const {checkpoint,present,added,report,issue}=review(current,pool,records,context,includeExisting);
            if(issue){
                // 保存可修正的录入记录和同步基准，整批不推进玩家进度或持有。
                entry.syncBlocked=issue;
                entry.sync={...copy(checkpoint),appliedState:copy(present)};
                row.dashboardRecords={...(row.dashboardRecords||{}),[pool]:entry};
                UserDataProfiles.save(game,row,current.revision);
                return {synced:false,blocked:'invalid_history'};
            }
            if(!SimulatorStart.valid(report.state))throw Error('Invalid progress');
            delete entry.syncBlocked;entry.syncStarted=true;
            const owned=counts(added,context.catalog);
            row.owned=nextInventory(row.owned,checkpoint.owned,owned);
            row.pools[pool]=copy(report.state);
            entry.sync={baseRecords:checkpoint.baseRecords,baseState:checkpoint.baseState,appliedState:copy(report.state),owned,...(checkpoint.manualBaseline?{manualBaseline:true}:{})};
        }
        row.dashboardRecords={...(row.dashboardRecords||{}),[pool]:entry};
        UserDataProfiles.save(game,row,current.revision);
        return {synced:!!sync};
    }
    function repairPlan(snapshot,pool,mode,context){
        const {row,entry,records}=snapshot;
        if(UserDataProfiles.purpose(row)!=='record'||!['player','dashboard'].includes(mode))throw Error('wrong_purpose');
        const before=row.pools[pool]||GachaEngine.createState(context.minorPities.length);
        const start=UserDataProfiles.initial(row,pool,context.minorPities.length);
        let after=before,owned={},baseRecords=records,baseState=before;
        const delta={};
        if(mode==='dashboard'){
            const report=DashboardValidation.validateHistory(records,{...context,initialState:start});
            if(report.entries.some(e=>e.errors.length||e.rotation?.resetErrors?.length)||report.tail.errors.length)throw Error('invalid_history');
            after=report.state;
            // 旧基准以前的持有归属不明，只在有完整贡献账目时重算持有。
            if(entry.sync?.baseRecords?.length===0&&same(before,entry.sync.appliedState)){
                owned=counts(records,context.catalog);
                for(const key of new Set([...Object.keys(owned),...Object.keys(entry.sync.owned||{})])){
                    const diff=(owned[key]||0)-(entry.sync.owned?.[key]||0);
                    if((row.owned[key]||0)+diff<0)throw Error('owned_conflict');
                    if(diff)delta[key]=diff;
                }
                baseRecords=[];baseState=start;
            }else baseState=after;
        }
        return {before,after,delta,checkpoint:{baseRecords,baseState,appliedState:after,owned,manualBaseline:true}};
    }
    function repair(game,pool,id,snapshot,mode,context){
        const current=read(game,pool,id);
        if(current.revision!==snapshot.revision)throw Error('conflict');
        const plan=repairPlan(current,pool,mode,context);
        const row=copy(current.row);
        row.recordInitial={...row.recordInitial,[pool]:UserDataProfiles.initial(row,pool,context.minorPities.length)};
        row.pools[pool]=plan.after;
        for(const [key,diff] of Object.entries(plan.delta)){
            row.owned[key]=(row.owned[key]||0)+diff;
            if(!row.owned[key])delete row.owned[key];
        }
        row.dashboardRecords[pool]={...current.entry,syncStarted:true,sync:plan.checkpoint};
        delete row.dashboardRecords[pool].syncBlocked;
        delete row.dashboardRecords[pool].syncPending;
        return UserDataProfiles.save(game,row,current.revision);
    }
    window.DashboardAccounts=Object.freeze({read,save,status,syncPending,validationContext,counts,legacyKey,repairPlan,repair});
})();
