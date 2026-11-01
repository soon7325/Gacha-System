/** 玩家账户存档：共享余额与持有、各卡池进度及录入记录；供看板、玩家数据页和模拟器共用。 */
(function(){
    'use strict';
    const copy=value=>JSON.parse(JSON.stringify(value));
    // 保留既有存储键，文件改名不迁移或重置用户存档。
    const key=game=>'GM_Sim_Profiles_'+game;
    const quantities=value=>value&&typeof value==='object'&&!Array.isArray(value)&&Object.values(value).every(n=>Number.isSafeInteger(n)&&n>=0);
    const validEconomy=value=>value===undefined||!!(value&&typeof value==='object'&&!Array.isArray(value)&&quantities(value.exchanges)&&value.prerequisites&&typeof value.prerequisites==='object'&&!Array.isArray(value.prerequisites)&&Object.values(value.prerequisites).every(v=>typeof v==='boolean'));
    function normalize(row){
        if(row&&typeof row.poolId==='string'&&SimulatorStart.valid(row.engine)&&!row.pools){
            const {poolId,engine,...rest}=row;return {...rest,pools:{[poolId]:copy(engine)}};
        }
        return row;
    }
    const purpose=row=>row?.purpose||'record';
    // 汇总仅描述初始抽卡历史，不从物品持有推断，也不改变保底引擎状态。
    function historyStats(gold,up,total){
        if(gold===''&&up==='')return null;
        const count=Number(gold),wins=Number(up);
        if(gold===''||up===''||!Number.isSafeInteger(count)||!Number.isSafeInteger(wins)||count<0||wins<0||wins>count||count>total)
            throw Error('历史出金须为非负整数，UP 数不能超过出金数，出金数不能超过初始累计抽数。 / Historical gold and UP counts must be non-negative integers; UP cannot exceed gold, and gold cannot exceed initial pulls.');
        return {gold:count,up:wins};
    }
    function summaryErrors(game,row,pool){
        if(!row||typeof GameData==='undefined'||!GameData.loadPoolIds(game,{standaloneOnly:true}).includes(pool))return [];
        return SimulatorStart.summaryErrors(context(game,pool),initial(row,pool),summary(row,pool));
    }
    function progressErrors(game,row,pool){
        if(!row?.pools?.[pool]||typeof GameData==='undefined'||!GameData.loadPoolIds(game,{standaloneOnly:true}).includes(pool))return [];
        return SimulatorStart.progressErrors(context(game,pool),row.pools[pool]);
    }
    const summaryLocked=(game,row,pool)=>poolLocked(row,pool)&&!!summary(row,pool)&&summaryErrors(game,row,pool).length===0;
    function statistics(row,pool,record,game){
        const history=game&&summaryErrors(game,row,pool).length?null:summary(row,pool),base=row?initial(row,pool).total:0;
        return {total:record.total+base,gold:record.gold+(history?.gold||0),up:record.up+(history?.up||0),lost:record.lost+(history?history.gold-history.up:0),initialPulls:base,hasHistory:!!history};
    }
    const validStats=value=>value===undefined||!!(value&&typeof value==='object'&&!Array.isArray(value)&&Object.values(value).every(s=>s&&Number.isSafeInteger(s.gold)&&s.gold>=0&&Number.isSafeInteger(s.up)&&s.up>=0&&s.up<=s.gold));
    function initial(row,pool,minorCount=0){
        const entry=row?.dashboardRecords?.[pool];
        if(row?.recordInitial?.[pool])return copy(row.recordInitial[pool]);
        if(entry?.sync?.baseRecords?.length===0)return copy(entry.sync.baseState);
        if(entry?.records?.length)return GachaEngine.createState(minorCount);
        return copy(row?.pools?.[pool]||GachaEngine.createState(minorCount));
    }
    function summary(row,pool){
        if(row?.recordStats?.[pool])return copy(row.recordStats[pool]);
        if(!row||purpose(row)!=='record')return null;
        const state=initial(row,pool);
        // 累计抽数全部为当前垫抽，且没有任何出金迹象时，旧起点可确定为零金。
        if(state.total===state.pity&&state.goldCount===0&&
            !state.guaranteeCount&&!state.guaranteeLosses&&!state.consecutiveLosses&&!state.earlyUpUsedCount&&!state.catSeqUsedCount)
            return {gold:0,up:0};
        return null;
    }
    const locked=row=>!!row&&purpose(row)==='record'&&(row.purpose==='record'||Object.keys(row.pools||{}).length>0||Object.keys(row.owned||{}).length>0||Object.keys(row.balances||{}).length>0||Object.keys(row.dashboardRecords||{}).length>0);
    function poolLocked(row,pool){
        if(!locked(row))return false;
        const entry=row.dashboardRecords?.[pool];
        if(entry?.records?.length||entry?.sync?.baseRecords?.length)return true;
        // 空池仍可补填起点；共享货币和图鉴持有不参与单个卡池的锁定。
        const empty=(value,key)=>value==null||value===false||value===0||key==='customCatSeqStartOrder'&&value===1||
            typeof value==='object'&&Object.entries(value).every(([key,item])=>empty(item,key));
        return !empty(row.pools?.[pool])||!empty(initial(row,pool))||!empty(row.recordStats?.[pool]);
    }
    function valid(row){row=normalize(row);return !!(row&&typeof row.id==='string'&&row.id&&typeof row.name==='string'&&(row.en===undefined||typeof row.en==='string')&&(row.isDefault===undefined||typeof row.isDefault==='boolean')&&(row.purpose===undefined||['record','simulation'].includes(row.purpose))&&validStats(row.recordStats)&&(row.recordInitial===undefined||!!(row.recordInitial&&typeof row.recordInitial==='object'&&!Array.isArray(row.recordInitial)&&Object.values(row.recordInitial).every(SimulatorStart.valid)))&&(row.name.trim()||row.en?.trim())&&row.pools&&typeof row.pools==='object'&&!Array.isArray(row.pools)&&Object.values(row.pools).every(SimulatorStart.valid)&&quantities(row.balances)&&quantities(row.owned)&&validEconomy(row.economyProgress));}
    function read(game){
        const raw=localStorage.getItem(key(game));if(!raw)return {version:2,revision:0,items:[]};
        const data=JSON.parse(raw);
        if(![1,2].includes(data?.version)||!Number.isSafeInteger(data.revision)||data.revision<0||!Array.isArray(data.items)||!data.items.every(valid)||new Set(data.items.map(x=>x.id)).size!==data.items.length)throw Error('Invalid user data');
        if(data.items.filter(row=>row.isDefault===true).length>1)throw Error('Invalid default account');
        return {...data,version:2,items:data.items.map(normalize)};
    }
    function save(game,row,revision){
        if(!valid(row))throw Error('Invalid user data');
        row=normalize(row);
        const data=read(game);if(data.revision!==revision)throw Error('User data changed in another page');
        const index=data.items.findIndex(x=>x.id===row.id);
        for(const id of Object.keys(row.pools||{}))if(index<0||JSON.stringify(data.items[index].pools?.[id])!==JSON.stringify(row.pools[id])){
            const errors=progressErrors(game,row,id);if(errors.length)throw Error(errors.join(' '));
        }
        if(index>=0&&purpose(data.items[index])!==purpose(row))throw Error('Account purpose cannot be changed');
        if(index>=0&&locked(data.items[index])){
            const previous=data.items[index];
            for(const id of new Set([...Object.keys(previous.pools||{}),...Object.keys(previous.recordStats||{})])){
                const before=summary(previous,id),after=summary(row,id);
                if(summaryLocked(game,previous,id)&&before&&(!after||before.gold!==after.gold||before.up!==after.up))throw Error('Historical summary is locked');
            }
        }
        for(const id of Object.keys(row.recordStats||{})){
            const previous=index>=0?data.items[index]:null;
            if(!previous||JSON.stringify(previous.recordStats?.[id])!==JSON.stringify(row.recordStats[id])||JSON.stringify(initial(previous,id))!==JSON.stringify(initial(row,id))){
                const errors=summaryErrors(game,row,id);if(errors.length)throw Error(errors.join(' '));
            }
        }
        if(index<0)data.items.push(copy(row));else data.items[index]=copy(row);
        if(row.isDefault)for(const other of data.items)if(other.id!==row.id)other.isDefault=false;
        data.revision++;localStorage.setItem(key(game),JSON.stringify(data));return copy(row);
    }
    function remove(game,id,revision){
        const data=read(game);if(data.revision!==revision)throw Error('User data changed in another page');
        data.items=data.items.filter(x=>x.id!==id);
        if(data.lastPlayerMerge?.targetId===id)delete data.lastPlayerMerge;
        data.revision++;localStorage.setItem(key(game),JSON.stringify(data));
    }
    function reorder(game,fromId,toId,before,revision){
        const data=read(game);if(data.revision!==revision)throw Error('User data changed in another page');
        const from=data.items.findIndex(row=>row.id===fromId),to=data.items.findIndex(row=>row.id===toId);
        if(from<0||to<0)throw Error('Account missing');
        if(from===to)return data;
        const previous=data.items.map(row=>row.id).join('|'),[row]=data.items.splice(from,1);
        data.items.splice(data.items.findIndex(item=>item.id===toId)+(before?0:1),0,row);
        if(data.items.map(row=>row.id).join('|')===previous)return data;
        data.revision++;localStorage.setItem(key(game),JSON.stringify(data));return data;
    }
    function context(gameId,poolId){
        const base=GameData.loadContext({gameId,poolId}),{rules,globalTiers}=base;
        const {targetGoldIds,minorPities}=GameData.describePool(rules,globalTiers);
        const candidates={};
        globalTiers.filter(t=>!rules.tiers||rules.tiers.some(r=>r.id===t.id)).forEach(t=>{
            const rule=rules.assembly?.tierRules?.[t.id]||{mode:'up_split',upCats:['char'],offrateCats:['char','wep'],upTags:['up','custom_offrate'],offrateTags:['std','normal']};
            const names=(cats,tags)=>CatalogUtils.getItemsByCategories(base.catalog,cats).filter(i=>i.tierId===t.id&&CatalogUtils.hasAnyTag(i,tags)).map(i=>i.name);
            candidates[t.id]={up:rule.mode==='up_split'?names(rule.upCats||['char'],rule.upTags):[],std:rule.mode==='up_split'?names(rule.offrateCats||['char','wep'],rule.offrateTags):names(rule.flatCats||['char','wep'],rule.tags)};
        });
        return {rules,globalTiers,targetGoldIds,minorPities,info:base.gameInfo,catalog:SimulatorStart.poolCatalog(GameData.flattenCatalog(base.catalog),candidates),strictRules:true};
    }
    function orderedPoolIds(gameId){
        const ids=GameData.loadPoolIds(gameId,{standaloneOnly:true});
        const saved=GameData.readJSON('GM_Pool_Order_'+gameId,[]),order=Array.isArray(saved)?saved:[];
        const rank=new Map();order.forEach((id,index)=>{if(!rank.has(id))rank.set(id,index);});
        return ids.sort((a,b)=>(rank.get(a)??Infinity)-(rank.get(b)??Infinity));
    }
    function accountContext(gameId){
        const ids=orderedPoolIds(gameId);
        const poolContexts=Object.fromEntries(ids.map(id=>[id,{...context(gameId,id),label:GameData.loadPoolMeta(gameId,id)}]));
        const info=GameData.loadGameInfo(gameId),globalTiers=GameData.loadGlobalTiers(gameId,info);
        const catalog=CatalogUtils.uniqueBy(CatalogUtils.getItemsByCategories(GameData.loadCatalog(gameId)),i=>JSON.stringify([i.category,i.ownershipId||i.id||i.name])).map(item=>{
            const standard=Object.values(poolContexts).some(c=>c.catalog.some(i=>i.category===item.category&&(i.ownershipId||i.id||i.name)===(item.ownershipId||item.id||item.name)&&i.startGroup==='std'));
            return {...item,startGroup:standard?'std':CatalogUtils.hasAnyTag(item,['std','normal'])?'std':'up'};
        });
        return {...(poolContexts[ids[0]]||{rules:{},targetGoldIds:[],minorPities:[]}),gameId,info,globalTiers,catalog,poolContexts,accountProfile:true};
    }
    function project(row,poolId,context){
        // 旧调用仅供迁移；新玩家数据在任意卡池都可使用同一份余额与持有。
        if(row.poolId&&row.poolId!==poolId)throw Error('Wrong pool');
        row=normalize(row);
        return {engine:copy(row.pools?.[poolId]||GachaEngine.createState(context.minorPities.length)),balances:copy(row.balances),owned:copy(row.owned),pools:copy(row.pools||{}),...(row.economyProgress?{economyProgress:copy(row.economyProgress)}:{})};
    }
    const mode=()=>localStorage.getItem('GM_Player_Data_Mode')==='multi'?'multi':'single';
    const defaultRow=items=>items.find(row=>row.isDefault===true)||items[0]||null;
    const visibleRows=items=>mode()==='multi'?items:defaultRow(items)?[defaultRow(items)]:[];
    const label=(row,language=localStorage.getItem('GM_Lang'))=>language==='en'?row.en||row.name||'':row.name||row.en||'';
    window.UserDataProfiles=Object.freeze({read,save,remove,reorder,valid,purpose,locked,poolLocked,initial,summary,summaryErrors,progressErrors,summaryLocked,historyStats,statistics,context,accountContext,orderedPoolIds,project,key,mode,visibleRows,defaultRow,label});
})();
