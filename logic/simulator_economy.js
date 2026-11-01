/** 模拟器经济结算：仅处理传入的草稿，不访问页面或存储。 */
(function () {
    'use strict';
    const clone = value => JSON.parse(JSON.stringify(value));
    const fail = code => { throw new Error(code); };
    const positive = value => { if (!Number.isSafeInteger(value) || value < 1) fail('invalid_amount'); return value; };
    function validProgress(value){
        const object=v=>v&&typeof v==='object'&&!Array.isArray(v);
        return object(value)&&object(value.exchanges)&&object(value.prerequisites)&&Object.values(value.exchanges).every(n=>Number.isSafeInteger(n)&&n>=0)&&Object.values(value.prerequisites).every(v=>typeof v==='boolean');
    }
    const progress=state=>clone({exchanges:state.exchanges||{},prerequisites:state.prerequisites||{}});
    function createState() {
        return {version:1, revision:0, balances:{}, owned:{}, claims:{}, exchanges:{}, prerequisites:{}, signins:{}, pools:{}};
    }
    function create(info) {
        const config = info.economy || {resources:[], payments:[], exchanges:[], incomes:[]};
        const resource = id => config.resources.find(row => row.id === id) || fail('missing_resource');
        const get = (list, id) => (config[list] || []).find(row => row.id === id) || fail('missing_rule');
        function credit(state, id, amount) {
            resource(id); positive(amount);
            const balance = (state.balances[id] || 0) + amount;
            if (!Number.isSafeInteger(balance)) fail('invalid_amount');
            state.balances[id] = balance;
        }
        function debit(state, id, amount) {
            resource(id); positive(amount);
            if ((state.balances[id] || 0) < amount) fail('insufficient');
            state.balances[id] -= amount;
        }
        function payment(state, id, poolId, pulls) {
            const row = get('payments', id);
            if (row.poolIds?.length && !row.poolIds.includes(poolId)) fail('wrong_pool');
            positive(pulls); positive(row.pulls); positive(row.cost);
            if (pulls % row.pulls) fail('whole_payment');
            debit(state, row.resourceId, row.cost * (pulls / row.pulls));
        }
        function payWithFallback(state, id, poolId, pulls) {
            positive(pulls);
            const preferred=get('payments',id);
            if(preferred.poolIds?.length&&!preferred.poolIds.includes(poolId))fail('wrong_pool');
            resource(preferred.resourceId);positive(preferred.cost);positive(preferred.pulls);
            const rows=[preferred,...(config.payments||[]).filter(row=>row.id!==id)]
                .filter(row=>(!row.poolIds?.length||row.poolIds.includes(poolId))&&
                    Number.isSafeInteger(row.cost)&&row.cost>0&&Number.isSafeInteger(row.pulls)&&row.pulls>0&&
                    config.resources.some(r=>r.id===row.resourceId));
            const draft=clone(state),misses=new Set();
            // 先规划完整付款组合，再一次性提交余额；不调用抽卡引擎。
            // 按当前选择、其他配置顺序优先使用，十连票等支付单位不可拆分。
            function plan(index,remaining) {
                if(!remaining)return [];
                if(index===rows.length)return null;
                const capacity=rows.slice(index).reduce((sum,row)=>sum+Math.min(remaining,
                    Math.floor((draft.balances[row.resourceId]||0)/row.cost)*row.pulls),0);
                if(capacity<remaining)return null;
                const key=JSON.stringify([index,remaining,draft.balances]);
                if(misses.has(key))return null;
                const row=rows[index],balance=draft.balances[row.resourceId]||0;
                const max=Math.min(Math.floor(remaining/row.pulls),Math.floor(balance/row.cost));
                for(let count=max;count>=0;count--) {
                    draft.balances[row.resourceId]=balance-count*row.cost;
                    const rest=plan(index+1,remaining-count*row.pulls);
                    if(rest)return count?[{payment:row,pulls:count*row.pulls,cost:count*row.cost},...rest]:rest;
                }
                if(Object.hasOwn(state.balances,row.resourceId))draft.balances[row.resourceId]=balance;
                else delete draft.balances[row.resourceId];
                misses.add(key);return null;
            }
            const allocations=plan(0,pulls);
            if(!allocations)fail('insufficient');
            state.balances=draft.balances;
            const last=allocations[allocations.length-1].payment;
            return {payment:last,switched:allocations.some(part=>part.payment.id!==id),allocations};
        }
        function resourceScope(poolId) {
            const all=poolId===undefined,rows=config.exchanges||[],groups=config.unlockGroups||[];
            const ids=new Set(all?config.resources.map(row=>row.id):(config.payments||[])
                .filter(row=>!row.poolIds?.length||row.poolIds.includes(poolId)).map(row=>row.resourceId));
            // 前置兑换的产物需展示，但不能因此开放它的所有其他来源；只有支付或消耗资源才追溯来源。
            const needed=new Set(ids),allowed=new Map(),requiredGroups=new Set();
            const stages=row=>['staged','once_staged'].includes(row.mode)?row.stages||[]:[row];
            const targets=(row,stage)=>stage.toIds?.length?stage.toIds:row.toIds||(row.to?[row.to]:[]);
            let changed=true;
            const addResource=id=>{if(id&&!ids.has(id)){ids.add(id);changed=true;}};
            const needResource=id=>{addResource(id);if(id&&!needed.has(id)){needed.add(id);changed=true;}};
            function include(row,index,selected){
                if(!allowed.has(row)){allowed.set(row,new Map());changed=true;}
                const byStage=allowed.get(row);
                if(!byStage.has(index))byStage.set(index,new Set());
                for(const id of selected)if(!byStage.get(index).has(id)){byStage.get(index).add(id);changed=true;}
                needResource(row.from);
                if(row.unlockGroupId&&!requiredGroups.has(row.unlockGroupId)){requiredGroups.add(row.unlockGroupId);changed=true;}
            }
            while(changed){
                changed=false;
                for(const row of rows){
                    const list=stages(row);
                    list.forEach((stage,index)=>{
                        const selected=targets(row,stage).filter(id=>all||needed.has(id));
                        if(selected.length)include(row,index,selected);
                    });
                    // 到达后面的阶梯必须先完成前面的档位，不能因筛选而跳档。
                    const last=allowed.has(row)?Math.max(...allowed.get(row).keys()):-1;
                    for(let index=0;index<last;index++){
                        const options=targets(row,list[index]);
                        if(!allowed.get(row).get(index)?.size){
                            include(row,index,options);options.forEach(addResource);
                        }
                    }
                }
                for(const group of groups){
                    if(!requiredGroups.has(group.id))continue;
                    for(const cost of group.costs||[])needResource(cost.resourceId);
                    for(const requirement of group.requirements||[]){
                        const row=rows.find(row=>row.id===requirement.exchangeId);if(!row)continue;
                        stages(row).forEach((stage,index)=>{
                            const options=targets(row,stage).filter(id=>!requirement.targetId||id===requirement.targetId);
                            if(options.length){include(row,index,options);options.forEach(addResource);}
                        });
                    }
                }
            }
            return Object.freeze({resources:config.resources.filter(row=>ids.has(row.id)),
                exchanges:rows.filter(row=>allowed.has(row)),groups:groups.filter(row=>all||requiredGroups.has(row.id)),
                incomes:(config.incomes||[]).filter(row=>row.source!=='byproduct'&&needed.has(row.resourceId)&&
                    (all||!row.poolIds?.length||row.poolIds.includes(poolId))),
                targets:(state,row)=>{
                    const index=['staged','once_staged'].includes(row.mode)?state.exchanges[row.id]||0:0;
                    return [...(allowed.get(row)?.get(index)||[])];
                }});
        }
        const relatedResources=poolId=>resourceScope(poolId).resources;
        function claim(state, id, times = 1) {
            const row = get('incomes', id); positive(times);
            if (row.source === 'byproduct') fail('not_claimable');
            if (row.schedule === 'signin') {
                if (times !== 1) fail('invalid_amount');
                const max = Math.max(0, ...(row.days || []).map(day => day.day));
                const next = (state.signins[id] || 0) + 1;
                if (next > max) fail('limit');
                for (const day of row.days || []) {
                    const key = id + ':' + day.day;
                    if (day.day <= next && !state.claims[key]) {
                        credit(state, row.resourceId, day.amount); state.claims[key] = 1;
                    }
                }
                state.signins[id] = next;
                return;
            }
            if (!['once','daily','monthly','unlimited'].includes(row.schedule)) fail('invalid_schedule');
            if (row.schedule !== 'unlimited' && ((state.claims[id] || 0) + times > 1)) fail('limit');
            positive(row.amount); credit(state, row.resourceId, row.amount * times);
            if (row.schedule !== 'unlimited') state.claims[id] = 1;
        }
        const staged = row => ['staged','once_staged'].includes(row.mode);
        function offer(state, row) {
            return staged(row) ? row.stages?.[state.exchanges[row.id] || 0] || null : row;
        }
        const groupKey=id=>JSON.stringify(['unlock',id]);
        function requirementProgress(state, requirement, period){
            const row=get('exchanges',requirement.exchangeId),stageMode=staged(row);
            const targets=requirement.targetId?[requirement.targetId]:(row.toIds||[]);
            const prefix=period==='daily'?'day:':period==='monthly'?'month:':'total:';
            const targetCount=id=>state.exchanges[prefix+row.id+':'+id]??(period==='daily'?0:period==='monthly'&&row.mode!=='monthly'?0:state.exchanges[row.id+':'+id])??0;
            const count=stageMode?(state.exchanges[prefix+row.id]??(period==='daily'?0:state.exchanges[row.id]??0)):targets.reduce((sum,id)=>sum+targetCount(id),0);
            const needed=requirement.all?(stageMode?row.stages?.length:['daily','monthly'].includes(row.mode)?row.limit*targets.length:row.mode==='once'?targets.length:null):requirement.times;
            if(!Number.isSafeInteger(needed)||needed<1)fail('invalid_requirement');
            const perTarget=requirement.all&&!stageMode?targets.map(id=>({id,count:targetCount(id),needed:['daily','monthly'].includes(row.mode)?row.limit:1,met:targetCount(id)>=(['daily','monthly'].includes(row.mode)?row.limit:1)})):null;
            return {count,needed,met:perTarget?perTarget.every(target=>target.met):count>=needed,...(perTarget?{perTarget}:{})};
        }
        function groupStatus(state,id){
            const group=get('unlockGroups',id);
            const requirements=(group.requirements||[]).map(row=>({...requirementProgress(state,row,group.period),requirement:row}));
            const costs={};
            for(const row of group.costs||[]){resource(row.resourceId);positive(row.amount);costs[row.resourceId]=(costs[row.resourceId]||0)+row.amount;if(!Number.isSafeInteger(costs[row.resourceId]))fail('invalid_amount');}
            const missing=Object.entries(costs).filter(([id,amount])=>(state.balances[id]||0)<amount);
            return {group,requirements,costs,unlocked:state.prerequisites[groupKey(id)]===true||(!!group.legacyPrerequisiteId&&state.prerequisites[group.legacyPrerequisiteId]===true),ready:requirements.every(row=>row.met)&&!missing.length,missing};
        }
        function unlock(state,id){
            const status=groupStatus(state,id);if(status.unlocked)return false;
            if(status.requirements.some(row=>!row.met))fail('prerequisite');
            if(status.missing.length)fail('insufficient');
            const draft=clone(state);for(const [resourceId,amount] of Object.entries(status.costs))debit(draft,resourceId,amount);
            draft.prerequisites[groupKey(id)]=true;state.balances=draft.balances;state.prerequisites=draft.prerequisites;return true;
        }
        function exchange(state, id, targetId, times = 1) {
            const row = get('exchanges', id); positive(times);
            if(row.unlockGroupId&&!groupStatus(state,row.unlockGroupId).unlocked)fail('prerequisite');
            if (row.hasPrerequisite && !row.unlockGroupId && !state.prerequisites[id]) fail('prerequisite');
            const stage = offer(state, row);
            if (!stage) fail('limit');
            const targets = stage.toIds?.length ? stage.toIds : row.toIds || (row.to ? [row.to] : []);
            if (!targets.includes(targetId) || row.from === targetId) fail('invalid_target');
            positive(stage.cost); positive(stage.gain);
            const key = staged(row) ? id : id + ':' + targetId;
            const used = state.exchanges[key] || 0;
            if ((staged(row) && times !== 1) || (row.mode === 'once' && used + times > 1) || (['daily','monthly'].includes(row.mode) && used + times > row.limit)) fail('limit');
            if (!['fixed','once','daily','monthly','staged','once_staged'].includes(row.mode)) fail('invalid_mode');
            debit(state, row.from, stage.cost * times);
            credit(state, targetId, stage.gain * times);
            if (row.mode !== 'fixed') state.exchanges[key] = used + times;
            for(const prefix of ['day:','month:','total:']){
                const counter=prefix+key,value=(state.exchanges[counter]??used)+times;
                if(!Number.isSafeInteger(value))fail('invalid_amount');state.exchanges[counter]=value;
            }
        }
        function reset(state, period) {
            if (!['daily','monthly','once'].includes(period)) fail('invalid_schedule');
            for (const row of config.incomes || []) if (row.source !== 'byproduct' && row.schedule === period) delete state.claims[row.id];
            const modes=period==='monthly'?['monthly','staged']:period==='daily'?['daily']:['once','once_staged'];
            for (const row of config.exchanges || []) {
                if (!modes.includes(row.mode)) continue;
                for (const key of Object.keys(state.exchanges)) {
                    if (key === row.id || key.startsWith(row.id + ':') || period==='once'&&['day:','month:','total:'].some(prefix=>key===prefix+row.id||key.startsWith(prefix+row.id+':'))) delete state.exchanges[key];
                }
                delete state.prerequisites[row.id];
            }
            const prefix=period==='daily'?'day:':period==='monthly'?'month:':null;
            if(prefix)for(const key of Object.keys(state.exchanges))if(key.startsWith(prefix))delete state.exchanges[key];
            for(const group of config.unlockGroups||[])if(group.period===period){
                delete state.prerequisites[groupKey(group.id)];
                if(group.legacyPrerequisiteId)delete state.prerequisites[group.legacyPrerequisiteId];
            }
            if(period==='monthly')for(const row of config.exchanges||[])if(row.hasPrerequisite&&!row.unlockGroupId)delete state.prerequisites[row.id];
        }
        function resetPeriods(poolId) {
            const scope=resourceScope(poolId),periods=new Set();
            for(const row of scope.incomes)if(['daily','monthly','once'].includes(row.schedule))periods.add(row.schedule);
            for(const row of scope.exchanges){
                if(['daily','monthly','once'].includes(row.mode))periods.add(row.mode);
                if(row.mode==='staged')periods.add('monthly');
                if(row.mode==='once_staged')periods.add('once');
                if(row.hasPrerequisite&&!row.unlockGroupId)periods.add('monthly');
            }
            for(const group of scope.groups)periods.add(group.period);
            return ['daily','monthly','once'].filter(period=>periods.has(period));
        }
        function settle(state, results, catalog, poolId, {returns = true} = {}) {
            const earned = {};
            for (const result of results) {
                const item = window.CatalogUtils ? window.CatalogUtils.findItem(catalog, result) :
                    catalog.find(item => result.itemId ? (item.id === result.itemId || item.presetId === result.itemId || item.legacyIds?.includes(result.itemId)) : item.name === result.name);
                if (!item) fail('unknown_item');
                const category = item.category;
                const key = JSON.stringify([category, item.ownershipId || item.id || item.name]);
                const count = (state.owned[key] || 0) + 1;
                const cap = positive(Number(info.overflowRules?.[category] ?? info.overflowRules?.other ?? 5));
                if (!Number.isSafeInteger(count)) fail('invalid_amount');
                state.owned[key] = count;
                if (!returns) continue;
                const tags = Array.isArray(item.tags) ? item.tags : Array.isArray(item.type) ? item.type : [item.tags || item.type].filter(Boolean);
                for (const rule of config.incomes || []) {
                    if (rule.source !== 'byproduct') continue;
                    if (rule.categoryIds?.length && !rule.categoryIds.includes(category)) continue;
                    if (rule.poolIds?.length && !rule.poolIds.includes(poolId)) continue;
                    if (rule.tierId && rule.tierId !== (result.tierId || item.tierId)) continue;
                    if (rule.tagIds?.length && !(rule.tagMatch === 'all' ? rule.tagIds.every(tag => tags.includes(tag)) : rule.tagIds.some(tag => tags.includes(tag)))) continue;
                    const matches = {always:true, first:count===1, non_overflow:count<=cap, duplicate:count>1,
                        duplicate_no_overflow:count>1&&count<=cap, overflow:count>cap, cap_split:true};
                    if (!matches[rule.condition]) continue;
                    const amount = rule.condition === 'cap_split' && count > cap ? rule.overflowAmount : rule.amount;
                    credit(state, rule.resourceId, amount);
                    earned[rule.resourceId] = (earned[rule.resourceId] || 0) + amount;
                }
            }
            return earned;
        }
        return Object.freeze({config, groupStatus, unlock, payment, payWithFallback, resourceScope, relatedResources, claim, offer, exchange, reset, resetPeriods, settle, clone});
    }
    window.SimulatorEconomy = Object.freeze({createState, create, validProgress, progress});
})();
