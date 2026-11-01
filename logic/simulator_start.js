/** 起点表单的字段与状态转换；不抽卡、不消耗随机数。 */
(function(){
    'use strict';
    const copy=value=>JSON.parse(JSON.stringify(value));
    function poolCatalog(catalog,candidates){
        const seen=new Set();
        return catalog.flatMap(item=>{
            const tier=candidates[item.tierId];
            if(!tier)return [];
            // 同一物品同时可作 UP 和常驻时，只列在常驻组。
            const identity=item.presetId||item.id||item.name;
            const includes=values=>(values||[]).includes(identity)||(values||[]).includes(item.name)||
                (item.legacyIds||[]).some(id=>(values||[]).includes(id));
            const group=includes(tier.std)?'std':includes(tier.up)?'up':null;
            const key=JSON.stringify([item.category,item.ownershipId||item.id||item.name]);
            if(!group||seen.has(key))return [];
            seen.add(key);return [{...item,startGroup:group}];
        });
    }
    function ownedGroups(catalog,tiers){
        return tiers.map(tier=>({...tier,
            up:catalog.flatMap((item,index)=>item.tierId===tier.id&&item.startGroup==='up'?[{item,index}]:[]),
            std:catalog.flatMap((item,index)=>item.tierId===tier.id&&item.startGroup!=='up'?[{item,index}]:[])
        })).filter(tier=>tier.up.length||tier.std.length);
    }
    function ownedCategoryGroups(catalog,tiers,categories=[]){
        const groups=ownedGroups(catalog,tiers),definitions=new Map(categories.map(category=>[category.id,category]));
        for(const item of catalog){const id=item.category||'other';if(!definitions.has(id))definitions.set(id,{id,name:id,en:id,icon:'🏷️'});}
        return Array.from(definitions.values()).map(category=>({...category,tiers:groups.map(tier=>({...tier,
            up:tier.up.filter(entry=>(entry.item.category||'other')===category.id),
            std:tier.std.filter(entry=>(entry.item.category||'other')===category.id)
        })).filter(tier=>tier.up.length||tier.std.length)})).filter(category=>category.tiers.length);
    }
    function lowRarityCaps({info,catalog,globalTiers,targetGoldIds,rules}){
        const gold=new Set([globalTiers[0]?.id,...targetGoldIds,...(rules.tiers||[]).filter(t=>t.isGold).map(t=>t.id)]);
        const low=new Set(globalTiers.slice(1).map(t=>t.id).filter(id=>!gold.has(id)));
        return catalog.flatMap((item,index)=>{
            if(!low.has(item.tierId))return [];
            // 与经济结算共用同一大类阈值；达到该件数后，下一次获得即溢出。
            const cap=Number(info.overflowRules?.[item.category]??info.overflowRules?.other??5);
            return Number.isSafeInteger(cap)&&cap>0&&cap<Number.MAX_SAFE_INTEGER?[{index,cap}]:[];
        });
    }
    function fields({rules,targetGoldIds,minorPities,globalTiers,strictRules=false},state){
        state=state||GachaEngine.createState(minorPities.length);
        GachaEngine.syncRuleProgress(rules,state);
        const result=[],add=(key,zh,en,value,max=10000000)=>result.push({key,zh,en,value:value||0,max});
        const hard=GachaEngine.getHardPity(rules,targetGoldIds);
        const hasGoldPity=rules.pities?.some(p=>targetGoldIds.includes(p.tierId)&&p.enabled!==false)||rules.pity?.enabled!==false&&!!rules.pity||!!rules.hardPity;
        if(!strictRules||hasGoldPity)add('pity','当前垫抽（距上次出金）','Pulls since last gold',state.pity,hard-1);
        minorPities.forEach((rule,i)=>{
            if(rule.enabled===false)return;
            const tier=globalTiers.find(t=>t.id===rule.tierId)||{};
            add('minor:'+i,(tier.name||rule.tierId)+'垫抽',(tier.en||tier.name||rule.tierId)+' pity',state.minorPityCounters[i],(rule.pulls||rule.hard||10)-1);
        });
        add('total','初始累计抽数','Initial cumulative pulls',Math.max(state.total||0,state.pity||0,...state.minorPityCounters));
        const gold=GachaEngine.getGoldPityRule(rules,targetGoldIds);
        if(gold.enabled!==false&&gold.useGuarantee!==false&&gold.enableUp!==false&&(!strictRules||(hasGoldPity&&gold.enableUp===true)))
            add('guarantee','大保底当前歪数','Current losses toward guaranteed UP',gold.guaranteeMode==='progressive'?state.guaranteeLosses:state.guaranteeCount,
                gold.guaranteeMode==='progressive'?100:gold.guaranteeLimit||1);
        if(rules.secondaryRescue?.enabled)add('rescue','救援规则当前连续歪数','Current consecutive losses for rescue',state.consecutiveLosses,rules.secondaryRescue.hardGuaranteeLosses??3);
        if(rules.earlyUpRules?.some(r=>r.enabled!==false))add('early','已使用前 N 金特权次数','Early gold privileges already used',state.earlyUpUsedCount,Math.max(...rules.earlyUpRules.filter(r=>r.enabled!==false).map(r=>r.order||1)));
        if(rules.goldCategorySequence?.some(r=>r.enabled!==false)){add('category','下次自然出金的定向序号','Next natural gold category order',state.customCatSeqStartOrder||GachaEngine.getCategoryGoldOrder(state));result[result.length-1].min=1;}
        for(const [list,kind,zh,en] of [[rules.sparkRules,'spark','井','Spark'],[rules.giftRules,'gift','赠送抽','Bonus pulls']]){
            (list||[]).forEach((rule,i)=>{
                if(rule.enabled===false)return;
                const progress=state[kind+'State'][i]||{basePull:0,triggeredCount:0};
                add(kind+':'+i,zh+' '+(i+1)+' 已累计抽数',en+' '+(i+1)+' accumulated pulls',GachaEngine.getRuleTotal(rules,state)-progress.basePull);
                const expires=rule.expiration?.type&&rule.expiration.type!=='none';
                if(kind==='spark'&&(expires||rule.cancelOnHit||rule.cancelOnUp))result.push({key:'cancel:'+i,zh:'井 '+(i+1)+(expires?' 已失效':' 已取消'),en:'Spark '+(i+1)+(expires?' expired':' cancelled'),value:!!(progress.expired||progress.cancelled),checkbox:true});
            });
        }
        if(rules.giftRules?.some(r=>r.enabled!==false))for(const [kind,zh,en] of [['counted','待执行赠送抽（计保底）','Pending bonus pulls (with pity)'],['uncounted','待执行赠送抽（不计保底）','Pending bonus pulls (without pity)']])
            add('queue:'+kind,zh,en,state.freeQueue.filter(q=>!!q.countPity===(kind==='counted')).reduce((n,q)=>n+q.remaining,0));
        return result;
    }
    function build(context,values,previousState=null){
        const state=GachaEngine.createState(context.minorPities.length);
        const schema=fields(context,state),numbers={};
        for(const field of schema){
            if(field.checkbox){numbers[field.key]=!!values[field.key];continue;}
            const raw=values[field.key],n=Number(raw);
            if(raw===''||raw===undefined||!Number.isSafeInteger(n)||n<(field.min||0)||n>field.max)throw Error(field.zh+' / '+field.en);
            numbers[field.key]=n;
        }
        state.pity=numbers.pity||0;
        context.minorPities.forEach((rule,i)=>{state.minorPityCounters[i]=numbers['minor:'+i]||0;});
        state.total=numbers.total;state.guaranteeCount=state.guaranteeLosses=numbers.guarantee||0;
        state.consecutiveLosses=numbers.rescue||0;state.earlyUpUsedCount=numbers.early||0;
        if(numbers.category!==undefined){state.catSeqGoldOffset=1-numbers.category;state.catSeqUsedCount=numbers.category-1;}
        if(state.total<Math.max(state.pity,...state.minorPityCounters))throw Error('初始累计抽数不能少于垫抽 / Total pulls cannot be below pity');
        for(const [list,kind] of [[context.rules.sparkRules,'spark'],[context.rules.giftRules,'gift']])
            (list||[]).forEach((rule,i)=>{
                if(rule.enabled===false)return;
                const progress=numbers[kind+':'+i],limit=kind==='spark'?rule.limit:rule.trigger;
                if(progress>state.total)throw Error('规则进度不能超过初始累计抽数 / Rule progress cannot exceed total pulls');
                const reached=limit>0?(rule.type==='loop'?Math.floor(progress/limit):Number(progress>=limit)):0;
                state[kind+'State'][i]={basePull:state.total-progress,triggeredCount:Math.min(reached,rule.maxTriggers ?? Infinity),...(rule.id||rule.activation||rule.maxTriggers!=null?{periodStart:0,settledCount:reached}:{}),...(rule.id?{ruleId:rule.id}:{})};
                if(kind==='spark'){
                    const expires=rule.expiration?.type&&rule.expiration.type!=='none';
                    state.sparkState[i].cancelled=expires?false:!!numbers['cancel:'+i];
                    if(expires){
                        state.sparkState[i].expired=!!numbers['cancel:'+i];
                        // A cancelled first guarantee did not award anything or unlock dependants.
                        if(state.sparkState[i].expired&&rule.expiration.type==='target'&&rule.type==='once')state.sparkState[i].triggeredCount=0;
                    }
                }
            });
        for(const kind of ['counted','uncounted'])if(numbers['queue:'+kind])state.freeQueue.push({countPity:kind==='counted',remaining:numbers['queue:'+kind]});
        // Editing a name, balance or pity must not erase hidden prerequisite state.
        // A changed total or explicit rule-progress field starts a new baseline.
        if(previousState&&valid(previousState)){
            const previous=copy(previousState),schema=fields(context,previous);
            if(state.total===previous.total&&previous.bonusPullCount!==undefined){
                state.bonusPullCount=previous.bonusPullCount;
                if(context.rules.countBonusPullsForRules===false)for(const kind of ['spark','gift'])for(const p of Object.values(state[kind+'State']))p.basePull-=state.bonusPullCount;
            }
            const same=schema.filter(f=>['total','early','category'].includes(f.key)||/^(spark:|gift:|cancel:)/.test(f.key))
                .every(f=>f.checkbox?numbers[f.key]===!!f.value:numbers[f.key]===Number(f.value));
            if(same){
                for(const key of ['nextPeriodFreeQueue','bonusPullCount','sequenceRuleState','goldCount','naturalGoldCount','catSeqGoldOffset','customCatSeqStartOrder']){
                    if(previous[key]!==undefined)state[key]=copy(previous[key]);else delete state[key];
                }
                state.sparkState=copy(previous.sparkState);state.giftState=copy(previous.giftState);
                if(schema.filter(f=>f.key.startsWith('queue:')).every(f=>numbers[f.key]===Number(f.value)))state.freeQueue=copy(previous.freeQueue);
            }
        }
        const errors=progressErrors(context,state);if(errors.length)throw Error(errors.join(' '));
        return state;
    }
    function valid(state){
        const number=n=>Number.isSafeInteger(n)&&n>=0;
        const activation=a=>a===undefined||!!a&&typeof a==='object'&&!Array.isArray(a)&&typeof a.active==='boolean'&&
            (!a.active||(number(a.unlockedAt)&&a.unlockedAt<=state.total&&number(a.goldProgress)));
        const metadata=p=>(p.periodStart===undefined||number(p.periodStart)&&p.periodStart<=state.total)&&
            (p.settledCount===undefined||number(p.settledCount))&&(p.ruleId===undefined||typeof p.ruleId==='string'&&p.ruleId.length>0)&&activation(p.activation)&&
            (p.targetHits===undefined||number(p.targetHits))&&(p.expired===undefined||typeof p.expired==='boolean')&&
            (p.expirationBaseline===undefined||!!p.expirationBaseline&&['hits','pulls','source'].every(k=>number(p.expirationBaseline[k]))&&p.expirationBaseline.pulls<=state.total);
        const queue=q=>q&&number(q.remaining)&&q.remaining>0&&typeof q.countPity==='boolean'&&
            (q.countRules===undefined||typeof q.countRules==='boolean')&&(q.ownMinorPity===undefined||typeof q.ownMinorPity==='boolean')&&
            (q.minorPityCounters===undefined||Array.isArray(q.minorPityCounters)&&q.minorPityCounters.every(number));
        return !!state&&['pity','total','goldCount','guaranteeCount','guaranteeLosses','consecutiveLosses','earlyUpUsedCount','catSeqUsedCount'].every(k=>number(state[k]))&&
            (state.bonusPullCount===undefined||number(state.bonusPullCount)&&state.bonusPullCount<=state.total)&&
            Array.isArray(state.minorPityCounters)&&state.minorPityCounters.every(n=>Number.isSafeInteger(n)&&n>=0)&&
            ['minorGuaranteeCounters','sparkState','giftState'].every(k=>state[k]&&typeof state[k]==='object'&&!Array.isArray(state[k]))&&
            Object.values(state.minorGuaranteeCounters).every(number)&&
            ['sparkState','giftState'].every(k=>Object.values(state[k]).every(p=>p&&number(p.basePull)&&p.basePull<=state.total&&number(p.triggeredCount)&&metadata(p)))&&
            (state.sequenceRuleState===undefined||!!state.sequenceRuleState&&typeof state.sequenceRuleState==='object'&&!Array.isArray(state.sequenceRuleState)&&Object.values(state.sequenceRuleState).every(p=>p&&number(p.triggeredCount)&&metadata(p)))&&
            Array.isArray(state.freeQueue)&&state.freeQueue.every(queue)&&
            (state.nextPeriodFreeQueue===undefined||Array.isArray(state.nextPeriodFreeQueue)&&state.nextPeriodFreeQueue.every(queue))&&Array.isArray(state.events?.pendingGifts);
    }
    function progressErrors(context,state){
        const errors=[],add=(zh,en)=>errors.push(zh+' / '+en),{rules,targetGoldIds,minorPities}=context;
        if(state.total<state.pity)add(`累计 ${state.total} 抽不能少于当前垫抽 ${state.pity}。`,`Total ${state.total} cannot be below current pity ${state.pity}.`);
        const gold=GachaEngine.getGoldPityRule(rules,targetGoldIds),hard=GachaEngine.getHardPity(rules,targetGoldIds);
        if(gold.enabled!==false&&(gold.pulls||gold.hard||rules.hardPity)&&state.pity>=hard)
            add(`当前垫抽 ${state.pity} 必须小于硬保底 ${hard} 抽。`,`Current pity ${state.pity} must be below hard pity ${hard}.`);
        minorPities.forEach((rule,index)=>{
            if(rule.enabled===false)return;
            const value=state.minorPityCounters[index]||0,limit=rule.pulls||rule.hard||10;
            if(value>=limit||value>state.total)add(`${rule.tierId} 垫抽 ${value} 必须小于 ${limit}，且不能超过累计 ${state.total} 抽。`,`${rule.tierId} pity ${value} must be below ${limit} and at most ${state.total} total pulls.`);
        });
        const hasUncounted=(rules.giftRules||[]).some(rule=>rule.enabled!==false&&rule.countPity===false),completed=state.total-state.pity;
        if(gold.enableUp===true&&gold.useGuarantee!==false){
            const tail=gold.guaranteeMode==='progressive'?state.guaranteeLosses:state.guaranteeCount;
            if(!hasUncounted&&tail>completed)add(`当前歪数 ${tail} 至少需要 ${tail} 次出金，但扣除垫抽后只有 ${completed} 抽。`,`Current loss streak ${tail} needs at least ${tail} gold, but only ${completed} pulls precede current pity.`);
            if(gold.guaranteeMode!=='progressive'&&tail>(gold.guaranteeLimit||1))add(`当前歪数 ${tail} 超过大保底允许的 ${gold.guaranteeLimit||1} 次。`,`Current loss streak ${tail} exceeds guarantee limit ${gold.guaranteeLimit||1}.`);
        }
        if(rules.secondaryRescue?.enabled){
            const limit=rules.secondaryRescue.hardGuaranteeLosses??3;
            if(state.consecutiveLosses>limit||!hasUncounted&&state.consecutiveLosses>completed)add('救援连续歪数超过规则上限或已有抽数能产生的出金次数。','Rescue loss streak exceeds its limit or the available pulls.');
        }
        if((rules.earlyUpRules||[]).some(rule=>rule.enabled!==false)&&!hasUncounted&&state.earlyUpUsedCount>completed)
            add('已使用早金特权次数不能超过已有抽数能产生的出金次数。','Used early-gold privileges exceed the available gold pulls.');
        for(const kind of ['spark','gift'])for(const [id,p] of Object.entries(state[kind+'State']||{})){
            if(p.basePull<0||p.basePull>state.total)add(`${kind==='spark'?'井':'赠送'} ${Number(id)+1} 的累计进度超过总抽数。`,`${kind} ${Number(id)+1} progress exceeds total pulls.`);
        }
        return errors;
    }
    function summaryErrors(context,state,summary){
        if(!summary)return [];
        const errors=[],{rules,targetGoldIds}=context,gold=GachaEngine.getGoldPityRule(rules,targetGoldIds);
        const completed=state.total-state.pity,count=summary.gold,wins=summary.up,losses=count-wins;
        const add=(zh,en)=>errors.push(zh+' / '+en);
        const hasUncounted=(rules.giftRules||[]).some(rule=>rule.enabled!==false&&rule.countPity===false);
        const hard=GachaEngine.getHardPity(rules,targetGoldIds);
        const hasHard=targetGoldIds.length>0&&gold.enabled!==false&&!!(gold.pulls||gold.hard||rules.hardPity);
        if(count>state.total||wins>count||count<0||wins<0)add('出金数、UP 数与累计抽数不一致。','Gold, UP and total pulls are inconsistent.');
        if(!hasUncounted){
            if(count===0&&completed!==0)add(`累计 ${state.total} 抽、当前垫抽 ${state.pity}，已结束的 ${completed} 抽不能填写 0 金。`,`With ${state.total} total pulls and ${state.pity} pity, ${completed} completed pulls cannot contain zero gold.`);
            if(count>completed)add(`扣除当前垫抽后仅有 ${completed} 抽，不能出 ${count} 金。`,`Only ${completed} pulls precede current pity; ${count} gold is impossible.`);
            if(hasHard&&completed>count*hard)add(`当前硬保底为 ${hard} 抽；累计 ${state.total} 抽、垫抽 ${state.pity}，至少需要 ${Math.ceil(completed/hard)} 金。`,`Hard pity is ${hard}; ${state.total} total pulls with ${state.pity} pity require at least ${Math.ceil(completed/hard)} gold.`);
            if(hasHard&&state.pity>=hard)add(`当前垫抽 ${state.pity} 已达到 ${hard} 抽硬保底却未出金。`,`Current pity ${state.pity} reaches hard pity ${hard} without gold.`);
        }
        if(gold.enableUp===true&&gold.useGuarantee!==false){
            const tail=gold.guaranteeMode==='progressive'?state.guaranteeLosses:state.guaranteeCount;
            if(tail>losses)add(`初始起点歪数为 ${tail}，但填写的初始历史只有 ${losses} 次常驻／歪，二者不一致。`,`The starting loss streak is ${tail}, but initial historical losses are only ${losses}.`);
            if(gold.guaranteeMode!=='progressive'&&!(rules.earlyUpRules||[]).some(r=>r.enabled!==false)){
                const limit=gold.guaranteeLimit||1;
                if(losses-tail>wins*limit||tail>limit||count>0&&tail===0&&wins===0)
                    add(`UP／歪数无法满足每连续歪 ${limit} 次后必出 UP 及初始起点歪数 ${tail} 的规则。`,`UP and loss counts cannot satisfy guaranteed UP after ${limit} losses with starting loss streak ${tail}.`);
            }
        }
        if(rules.secondaryRescue?.enabled&&state.consecutiveLosses>losses)add('救援规则的当前连续歪数超过历史歪数。','Current rescue loss streak exceeds historical losses.');
        return errors;
    }
    window.SimulatorStart=Object.freeze({fields,build,valid,progressErrors,summaryErrors,copy,lowRarityCaps,poolCatalog,ownedGroups,ownedCategoryGroups});
})();
