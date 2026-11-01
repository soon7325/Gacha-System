/**
 * 测试专用：复用 db_zzz.js 的代理人、音擎、邦布及本地图片。
 * 必须在 db_zzz.js 后加载。本文件只定义数据，不写入任何玩家账户。
 * 概率基于本项目绝区零预设，门槛特意缩短；全部是功能测试规则，不代表游戏规则。
 * 开关：GM_Show_Test_Catalog === 'true'。完整场景说明见 TEST_CATALOG.md。
 */
const TEST_PRESET = (()=>{
    const copy=value=>JSON.parse(JSON.stringify(value));
    const setup={...copy(ZZZ_SETUP_RULES),icon:'img/TEST/icon/game_icon.png',gameName:'测试专用',enGameName:'Feature Test Lab'};
    const pools=copy(ZZZ_POOL_RULES);
    const names={
        char_up:['经典保底／小保底','Classic and minor pity'],
        wep_up:['前两金特权／多次歪保底','Early gold privileges / two-loss guarantee'],
        char_up_2:['递进保底','Progressive guarantee'],
        wep_up_2:['救援／命中重置','Rescue / reset on UP'],
        mixed_std:['分类定向／新手井／自选井','Category targeting / beginner and selectable spark'],
        bangboo_up:['邦布必定UP','Guaranteed-UP Bangboo']
    };
    for(const [id,row] of Object.entries(pools)){
        row.info={...row.info,name:names[id][0],en:names[id][1]};
        for(const rule of row.pities||[]){
            rule.pulls=rule.tierId==='tier_S'?12:4;
            if(rule.softEnabled)rule.softRules=[{start:8,end:11,inc:0.15}];
        }
        // 全图鉴仍可选择；只限制本期UP数量，不强迫选满常驻图鉴。
        for(const limits of Object.values(row.preSelect?.tiers||{})){
            if(limits.stdMin!==undefined)limits.stdMin=0;
            if(limits.stdMax!==undefined)limits.stdMax=999;
        }
        row.lifecycle={allowRotation:!id.includes('std'),rotationMatrix:{inheritPityPulls:true,inheritGuaranteeState:true,inheritRescueLosses:true,resetEarlyUp:true,resetCatSeq:true,resetSparkPity:true,resetGiftRules:true}};
    }
    const gold=id=>pools[id].pities.find(row=>row.tierId==='tier_S');
    gold('wep_up').guaranteeLimit=2;
    pools.wep_up.earlyUpRules=[{order:1,upRate:100},{order:2,upRate:75}];
    Object.assign(gold('char_up_2'),{guaranteeMode:'progressive',guaranteeStep:25,guaranteeMax:100});
    Object.assign(gold('wep_up_2'),{useGuarantee:false});
    pools.wep_up_2.secondaryRescue={enabled:true,triggerRate:25,hardGuaranteeLosses:2,onHitUpStrategy:'reset',strategyValue:1,customEffectName:'测试救援',customEffectNameEn:'Test rescue'};
    for(const [suffix,strategy] of [['decay','decay'],['retain','set_to'],['keep','keep']]){
        pools['rescue_'+suffix]=copy(pools.wep_up_2);
        pools['rescue_'+suffix].info={...pools.wep_up_2.info,name:{decay:'救援／命中递减',retain:'救援／保留上限',keep:'救援／保持歪数'}[suffix],en:'Rescue / '+strategy};
        pools['rescue_'+suffix].secondaryRescue.onHitUpStrategy=strategy;
    }
    pools.mixed_std.goldCategorySequence=[{order:1,targetCats:['char'],targetTags:['std']},{order:2,targetCats:['wep'],targetTags:['std']}];
    pools.mixed_std.sparkRules=[
        {limit:6,type:'once',targetType:'custom_filter',targetTier:'tier_S',targetCats:['char'],targetTags:['std'],deliverMode:'random',expiration:{type:'target',scope:'after_unlock'},noReset:false},
        {limit:15,type:'once',targetType:'custom_filter',targetTier:'tier_S',targetCats:['char'],targetTags:['std'],deliverMode:'selectable',noReset:true},
        {limit:20,type:'loop',targetType:'custom_filter',targetTier:'tier_S',targetCats:['wep'],targetTags:['std'],deliverMode:'random',noReset:true}
    ];
    pools.mixed_std.specRate={enabled:true,rules:[{tierId:'tier_S',type:'multiplier',value:3,targetCats:['char'],targetTags:['std']}]};
    pools.spec_std=copy(pools.mixed_std);
    pools.spec_std.info={name:'分类权重／绝对概率',en:'Category weight / absolute rate',icon:'⚖️',badgeColor:'#3498db'};
    pools.spec_std.sparkRules=[];pools.spec_std.goldCategorySequence=[];
    pools.spec_std.specRate.rules[0].type='absolute';pools.spec_std.specRate.rules[0].value=65;
    pools.gift_up=copy(pools.char_up);
    pools.gift_up.info={name:'赠送抽／循环替换井',en:'Bonus pulls / repeating replacement spark',icon:'🎁',badgeColor:'#2ecc71'};
    pools.gift_up.giftRules=[{trigger:5,type:'once',amount:2,countPity:true},{trigger:10,type:'loop',amount:1,countPity:false}];
    pools.gift_up.sparkRules=[{limit:15,type:'loop',targetType:'random_up',targetTier:'tier_S',deliverMode:'random',noReset:false}];
    // Stable IDs and short thresholds make prerequisite behavior observable by hand.
    const labPool=(id,name,en)=>{
        const row=pools[id]=copy(pools.char_up);
        row.info={name,en,icon:'🧪',badgeColor:'#9b59b6'};
        row.earlyUpRules=[];row.goldCategorySequence=[];row.sparkRules=[];row.giftRules=[];
        return row;
    };
    const gate=(conditions,counting='reset',extra={})=>({match:'all',counting,catchUp:'all',sequenceCatchUp:'skip',conditions,...extra});
    const pulls=count=>({type:'pulls',count}),after=(ruleId,count=1)=>({type:'rule',ruleId,count});
    const spark=(id,limit=3)=>({id,limit,type:'once',targetType:'random_up',targetTier:'tier_S',noReset:true});
    const chain=labPool('prereq_chain_up','前置联动／井→首金→赠送','Prerequisite chain / spark → gold → bonus');
    chain.sparkRules=[spark('lab_chain_source')];
    chain.earlyUpRules=[{id:'lab_chain_early',order:1,upRate:100,activation:gate([after('lab_chain_source')])}];
    chain.goldCategorySequence=[{id:'lab_chain_category',order:1,targetCats:['char'],targetTags:['up'],activation:gate([after('lab_chain_early')])}];
    chain.giftRules=[{id:'lab_chain_gift',trigger:2,amount:1,type:'loop',maxTriggers:2,countPity:true,activation:gate([after('lab_chain_category')])}];
    const combo=labPool('prereq_combo_up','前置组合／全部与任一','Prerequisite combinations / all and any');
    combo.sparkRules=[{...spark('lab_combo_source'),type:'loop',maxTriggers:2},{...spark('lab_combo_all',2),activation:gate([pulls(4),after('lab_combo_source',2)])}];
    combo.giftRules=[{id:'lab_combo_any',trigger:2,amount:1,type:'once',countPity:false,activation:gate([pulls(4),after('lab_combo_source',2)],'reset',{match:'any'})}];
    for(const mode of ['all','one','none']){
        const row=labPool('catchup_'+mode+'_up','里程碑补发／'+{all:'全部',one:'一次',none:'不补发'}[mode],'Milestone catch-up / '+mode);
        row.sparkRules=[{...spark('lab_spark_'+mode),type:'loop',maxTriggers:2,activation:gate([pulls(10)],'retain',{catchUp:mode})}];
        row.giftRules=[{id:'lab_gift_'+mode,trigger:3,amount:1,type:'loop',maxTriggers:2,countPity:false,activation:gate([pulls(10)],'retain',{catchUp:mode})}];
    }
    for(const mode of ['skip','next']){
        const row=labPool('sequence_'+mode+'_up','序列过期／'+(mode==='skip'?'跳过':'顺延'),'Missed gold milestone / '+mode);
        Object.assign(row.pities.find(p=>p.tierId==='tier_S'),{pulls:2,softEnabled:false});
        row.earlyUpRules=[{id:'lab_early_'+mode,order:1,upRate:100,activation:gate([pulls(10)],'retain',{sequenceCatchUp:mode})}];
        row.goldCategorySequence=[{id:'lab_category_'+mode,order:1,targetCats:['char'],targetTags:['up'],activation:gate([pulls(10)],'retain',{sequenceCatchUp:mode})}];
    }
    for(const scope of ['after_unlock','including_before']){
        const row=labPool('expiry_'+scope+'_up','失效范围／'+(scope==='after_unlock'?'仅解锁后':'包含解锁前'),'Expiration / '+scope);
        Object.assign(row.pities.find(p=>p.tierId==='tier_S'),{pulls:3,softEnabled:false});
        row.earlyUpRules=[{id:'lab_expiry_first_'+scope,order:1,upRate:100}];
        row.sparkRules=[{...spark('lab_expiry_target_'+scope,2),type:'loop',maxTriggers:2,activation:gate([pulls(6)]),expiration:{type:'target',scope}}];
    }
    const stop=labPool('expiry_rule_up','失效联动／井触发后停止赠送','Expiration / stop bonus after spark');
    stop.sparkRules=[spark('lab_expiry_source',3)];
    stop.giftRules=[{id:'lab_expiry_gift',trigger:2,amount:1,type:'loop',maxTriggers:8,countPity:false,expiration:{type:'rule',ruleId:'lab_expiry_source',count:1,scope:'after_unlock'}}];
    for(const [poolId,pool] of Object.entries(pools))for(const [kind,key,zh,en] of [
        ['early','earlyUpRules','前金胜率','Early UP'],['category','goldCategorySequence','类型定向','Category'],['spark','sparkRules','井','Spark'],['gift','giftRules','赠送抽','Bonus pulls']
    ])(pool[key]||[]).forEach((rule,index)=>{
        rule.id ||= 'test_'+poolId+'_'+kind+'_'+(index+1);
        rule.name ||= zh+' #'+(index+1);rule.en ||= en+' #'+(index+1);
        rule.activation ||= {match:'all',counting:'reset',catchUp:'all',conditions:[]};
        rule.expiration ||= {type:rule.cancelOnHit||rule.cancelOnUp?'target':'none',scope:'after_unlock'};
        if(kind==='spark'||kind==='gift')rule.maxTriggers ??= null;
        delete rule.cancelOnHit;delete rule.cancelOnUp;
    });
    const currency=copy(ZZZ_CURRENCY_RULES),economy=currency.economy;
    const ids=Object.keys(pools),nonPet=ids.filter(id=>id!=='bangboo_up');
    for(const payment of economy.payments){
        if(payment.resourceId==='polychrome')payment.poolIds=nonPet;
        if(payment.resourceId==='encrypted_tape')payment.poolIds=nonPet.filter(id=>!id.includes('std'));
        if(payment.resourceId==='master_tape')payment.poolIds=ids.filter(id=>id.includes('std'));
    }
    for(const income of economy.incomes)if(income.poolIds?.length&&!income.poolIds.includes('bangboo_up'))income.poolIds=nonPet;
    economy.resources.push({id:'test_ten',name:'测试十连券',en:'Test ten-pull voucher',icon:'🎫'},{id:'test_token',name:'测试代币',en:'Test token',icon:'🧪'});
    economy.payments.unshift({id:'test_ten_pull',name:'测试整组十连',en:'Test ten-pull bundle',resourceId:'test_ten',cost:1,pulls:10,poolIds:nonPet});
    // 初始账户保持零；资源由模拟器的获取按钮显式领取，便于测试空余额与补足支付。
    for(const resource of economy.resources)economy.incomes.push({id:'test_grant_'+resource.id,name:'测试补给：'+resource.name,en:'Test supply: '+resource.en,source:'other',resourceId:resource.id,schedule:'unlimited',amount:['test_ten','encrypted_tape','master_tape','boopon'].includes(resource.id)?10:20000});
    economy.incomes.push(
        {id:'test_once',name:'一次性礼包',en:'One-time pack',source:'other',resourceId:'test_token',schedule:'once',amount:100},
        {id:'test_month',name:'每月礼包',en:'Monthly pack',source:'other',resourceId:'test_token',schedule:'monthly',amount:50},
        {id:'test_signin',name:'三日签到',en:'Three-day sign-in',source:'other',resourceId:'encrypted_tape',schedule:'signin',days:[{day:1,amount:1},{day:2,amount:2},{day:3,amount:3}]}
    );
    for(const [condition,zh,en] of [
        ['always','每次抽出','Every copy'],
        ['first','首次获得','First copy'],
        ['non_overflow','首次及重复（不含溢出）','First and duplicates (excluding overflow)'],
        ['duplicate','重复获得（含溢出）','Duplicates (including overflow)'],
        ['duplicate_no_overflow','重复获得（不含溢出）','Duplicates (excluding overflow)'],
        ['overflow','仅溢出','Overflow only'],
        ['cap_split','按满阶分段返还','Separate non-overflow / overflow returns']
    ])economy.incomes.push({id:'test_return_'+condition,name:'返还测试：'+zh,en:'Return test: '+en,source:'byproduct',resourceId:'test_token',condition,amount:1,overflowAmount:3,categoryIds:['char','wep','pet'],tagIds:[],tagMatch:'any',poolIds:[]});
    economy.incomes.push({id:'test_tag_all',name:'标签全部匹配返还',en:'All-tags return',source:'byproduct',resourceId:'test_token',condition:'always',amount:2,categoryIds:['char'],tagIds:['up','reup'],tagMatch:'all',poolIds:[]});
    economy.exchanges.push(
        {id:'test_first_tape',name:'第一层：母带',en:'Tier 1: tape',from:'test_token',toIds:['encrypted_tape'],mode:'monthly',cost:240,gain:1,limit:2},
        {id:'test_first_film',name:'第一层：菲林',en:'Tier 1: Polychrome',from:'test_token',toIds:['polychrome'],mode:'monthly',cost:40,gain:100,limit:6},
        {id:'test_second_tape',name:'第二层：母带（共享解锁）',en:'Tier 2: tape (shared unlock)',from:'test_token',toIds:['encrypted_tape','master_tape'],mode:'monthly',cost:20,gain:1,limit:2,unlockGroupId:'test_month_group'},
        {id:'test_second_film',name:'第二层：菲林（共享解锁）',en:'Tier 2: Polychrome (shared unlock)',from:'test_token',toIds:['polychrome'],mode:'fixed',cost:10,gain:100,unlockGroupId:'test_month_group'},
        {id:'test_once_exchange',name:'永久组：一次性十连券',en:'Permanent group: one-time voucher',from:'test_token',toIds:['test_ten'],mode:'once',cost:10,gain:1,unlockGroupId:'test_permanent_group'},
        {id:'test_stages',name:'每月阶梯（逐档择一）',en:'Monthly stages (choose per stage)',from:'test_token',mode:'staged',stages:[{cost:10,gain:1,toIds:['encrypted_tape','master_tape']},{cost:20,gain:2,toIds:['boopon']},{cost:30,gain:1,toIds:['test_ten']}]},
        {id:'test_once_stages',name:'一次性阶梯',en:'One-time stages',from:'test_token',mode:'once_staged',stages:[{cost:5,gain:1,toIds:['encrypted_tape']},{cost:10,gain:1,toIds:['test_ten']}]},
        {id:'test_text',name:'纯文本前置确认',en:'Text-only prerequisite',from:'test_token',toIds:['polychrome'],mode:'fixed',cost:1,gain:1,hasPrerequisite:true,prerequisite:'手动确认文字条件，不会收取解锁费用。',prerequisiteEn:'Confirm this text manually. No unlock cost.'}
    );
    economy.unlockGroups=[
        {id:'test_month_group',name:'共享第二层（两项目）',en:'Shared tier 2 (two exchanges)',period:'monthly',prerequisite:'第一层720＋解锁770＝1490；解锁后两个项目同时开放。',prerequisiteEn:'Tier 1 costs 720; unlock costs 770, totaling 1,490. Both members unlock together.',requirements:[{exchangeId:'test_first_tape',targetId:'encrypted_tape',all:true},{exchangeId:'test_first_film',targetId:'polychrome',all:true}],costs:[{resourceId:'test_token',amount:770}]},
        {id:'test_permanent_group',name:'永久解锁（双资源消耗）',en:'Permanent unlock (two resources)',period:'once',prerequisite:'先完成一次性阶梯，再扣两种资源；月重置不重新扣解锁费用。',prerequisiteEn:'Complete the one-time stages and spend two resources. Monthly reset keeps this unlock.',requirements:[{exchangeId:'test_once_stages',all:true}],costs:[{resourceId:'test_token',amount:5},{resourceId:'polychrome',amount:10}]}
    ];
    currency.overflowRules={char:3,wep:2,pet:2};
    // 每个测试场景使用独立徽记，避免与素材来源游戏的卡池混淆。
    for(const [id,pool] of Object.entries(pools))pool.info.icon=`img/TEST/icon/${id}.png`;
    return {char:copy(ZZZ_CHAR),wep:copy(ZZZ_WEAPON),pet:copy(ZZZ_BANGBOO),db:copy(ZZZ_DB),tiers:copy(ZZZ_GLOBAL_TIERS),setup,currency,pools};
})();
const TEST_CHAR=TEST_PRESET.char,TEST_WEAPON=TEST_PRESET.wep,TEST_BANGBOO=TEST_PRESET.pet,TEST_DB=TEST_PRESET.db;
const TEST_GLOBAL_TIERS=TEST_PRESET.tiers,TEST_SETUP_RULES=TEST_PRESET.setup,TEST_CURRENCY_RULES=TEST_PRESET.currency,TEST_POOL_RULES=TEST_PRESET.pools;
