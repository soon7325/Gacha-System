// ==========================================
// 1. 图鉴图库数据 (纯仓库，不与特定卡池硬绑定)
// 供复制填入：
// { name: "测试角色A", en: "Char A", short: "角A", eshort: "CA", tags: ["up"], tierId: "tier_5", img: "" },
// ==========================================

const TEST_CHAR = [];
const TEST_WEAPON = [];
const TEST_OTHER = [];

const TEST_DB = [
    ...TEST_CHAR.map(i => ({ ...i, category: 'char' })),
    ...TEST_WEAPON.map(i => ({ ...i, category: 'wep' })),
    ...TEST_OTHER.map(i => ({ ...i, category: 'pet' }))
];

// ==========================================
// 2. 全局稀有度 (Tier) 基因库
// ==========================================
const TEST_GLOBAL_TIERS = [
    { id: 'tier_5', name: '5', color: '#f1c40f' },
    { id: 'tier_4', name: '4', color: '#9b59b6' },
    { id: 'tier_3', name: '3', color: '#3498db' }
];

// ==========================================
// 3. 游戏全局设定 (大类 / 标签字典 / 满破上限)
// ==========================================
const TEST_SETUP_RULES = {
    gameName: "测试引擎模板",
    enName: "Test Engine Template",

    categories: [
        { id: 'char', name: '角色', icon: '👤' },
        { id: 'wep',  name: '武器', icon: '🗡️' },
        { id: 'pet',  name: '随宠', icon: '🐾' }
    ],

    tagDefinitions: {
        up: { name: "限定", color: "#f1c40f", textColor: "#000" },
        reup: { name: "不歪", color: "#f1c40f", textColor: "#000" },
        custom_offrate: { name: "定制调频", color: "#e67e22", textColor: "#fff" },
        std: { name: "常驻", color: "#3498db", textColor: "#fff" },
        gift: { name: "赠送", color: "#2ecc71", textColor: "#000" },
        normal: { name: "副产物", color: "#95a5a6", textColor: "#000" }
    },

    overflowRules: {
        char: 7,
        wep: 5,
        pet: 5
    }
};

// ==========================================
// 4. 卡池专属规则集
// ==========================================
const TEST_POOL_RULES = {
    // 角色限定池
    char_up: {
        info: { name: "角色限定池", en: "Character Event Warp", icon: "👤", badgeColor: "#f1c40f" },

        // 0. 卡池图鉴与标签装配
        assembly: {
            tierRules: {
                tier_5: {
                    mode: 'up_split',                        // 限定池
                    upCats: ['char'],                        // UP 仅限代理人角色
                    offrateCats: ['char'],                   // 歪也仅出代理人角色（绝区零限定角色池S级不可歪出音擎）
                    upTags: ['up'],                          // UP 吸附标签：限定
                    offrateTags: ['std', 'custom_offrate']   // 可歪吸附标签：常驻、定制调频
                },
                tier_4: {
                    mode: 'up_split',
                    upCats: ['char'],
                    offrateCats: ['char', 'wep'],
                    upTags: ['custom_offrate'],
                    offrateTags: ['normal', 'std']
                },
                tier_3: {
                    mode: 'flat',                            // 平分池
                    flatCats: ['wep'],
                    tags: ['normal']
                }
            }
        },

        // 1. 稀有度出货概率与细分绝对概率
        tiers: [
            { 
                id: 'tier_5', 
                prob: 0.6, 
                isGold: true 
            },
            { 
                id: 'tier_4', 
                prob: 9.4,
                subProbs: [
                    { prob: 7.05, conditions: [{ cat: 'char', tags: ['custom_offrate'] }] },
                    { prob: 2.35, conditions: [{ cat: 'wep', tags: ['normal'] }] }
                ]
            },
            { 
                id: 'tier_3', 
                prob: 90.0 
            }
        ],

        // 3. 全星级保底与动态概率中心
        pities: [
            {
                tierId: 'tier_S',
                pulls: 90,
                resetOnHit: true,
                enableUp: true,
                upRate: 0.5,            // 基础不歪率 50%
                useGuarantee: true,     // 开启大保底机制
                guaranteeMode: 'progressive', // 📈 概率递进模式：歪后按步长提升胜率  /   'classic', // 🎯 经典模式：固定连歪次数后触发大保底
                guaranteeStep: 25,      // 每次歪金，下次出金 UP 率增加 25%          /    guaranteeLimit: 1,      // 歪 1 次后，下一次出金 100% 必出 UP
                guaranteeMax: 100,      // UP 胜率上限为 100% (封顶必出)            /    无
                softEnabled: true,
                softRules: [{ start: 74, end: 89, inc: 0.06 }]
            },
            {
                tierId: 'tier_4',
                pulls: 10,
                resetOnHit: true,
                enableUp: true,
                upRate: 0.5,
                useGuarantee: true,
                guaranteeLimit: 1,
                softEnabled: false,
                softRules: []
            }
        ],

        // 6. 歪出挽救机制 (捕获明光)
        secondaryRescue: {
            enabled: true,                 // 开启挽救二次判定
            triggerRate: 10,              // 常态歪时有 10% 几率被救回并翻转为 UP (折算综合胜率 55%)
            hardGuaranteeLosses: 3,       // 连续歪 3 次后，下一次如果再歪则 100% 触发强制救回
            customEffectName: "明光",      // 抽卡结果卡片显示的专属标识角标
            onHitUpStrategy: "decay",     //可选值: "reset" (重置为0), "decay" (减少固定层数), "keep" (保留不变)
            strategyValue: 1              // 每次命中 UP 减 1 层 (Math.max(0, 3 - 1) = 2)       /              strategyValue: 1            // 命中 UP 后无论当前攒了几歪，直接变为 1 歪
        },

        // 7. 「井」与里程碑兑换
        sparkRules: [
            {
                limit: 300,
                type: "once",
                targetType: "custom_filter",                 // "random_up" 随机UP / "up_index" 指定序号 / "custom_filter" 标签吸附
                targetTier: "tier_5",
                targetCats: ['char'],
                targetTags: ['std'],
                deliverMode: "selectable",            // "selectable" 玩家自选 / "random" 随机均分
                cancelOnHit: false,                      // 若此前提前抽出目标，是否作废本井 (新手/防非福利模式)
                noReset: true                            // 纯白送兑换井，不重置已垫抽数与大保底状态
            },
            {
                limit: 120,
                type: "once",
                targetType: "up_index",
                upIndex: 1,                // 锁定列表里的第 1 个 UP 目标
                cancelOnHit: true,         // 前 120 抽抽到了就自动失效关闭
                noReset: false             // 正常算作吃保底，重置垫抽进度
            },
            {
                limit: 240,
                type: "loop",
                targetType: "random_up",
                deliverMode: "selectable", // 玩家自选
                cancelOnHit: false,
                noReset: true              // 白送不重置垫抽
            }
        ],

        // 8. 前 N 金胜率特权
        earlyUpRules: [
            { order: 1, upRate: 100 }
        ],

        // 9. 前 N 金类型定向序列
        goldCategorySequence: [
            { order: 1, targetCats: ['char'], targetTags: ['std'] }
        ],

        // 10. 赠送抽机制
        giftRules: [
            {
                trigger: 30,
                amount: 10,
                type: "loop",                            // "loop" 循环赠送 / "once" 仅首发一次
                countPity: false                         // 赠送的抽数是否计入保底垫抽进度
            }
        ],

        // 11. 特限出货干预
        specRate: {
            enabled: true,
            rules: [
                {
                    tierId: 'tier_5',
                    type: 'multiplier',                 // 'multiplier' 权值倍数 (如5倍) / 'percent' 固定出货占有率 (如50%)
                    value: 5,
                    targetCats: ['char'],
                    targetTags: ['up', 'custom_offrate']
                }
            ]
        },

        // 12. 模拟器预选数量限制
        preSelect: {
            enabled: true,
            tiers: {
                tier_5: { upMin: 1, upMax: 1, stdMin: 6, stdMax: 6 },
                tier_4: { upMin: 2, upMax: 2, stdMin: 0, stdMax: 999 },
                tier_3: { stdMin: 0, stdMax: 999 }
            },
        },

        lifecycle: {
            // 1. 是否允许换期轮替 (限定池/复刻池填 true；常驻池/新手池填 false 彻底关闭换期功能)
            allowRotation: true, 

            // 2. 跨池共享保底绑定 (母池绑定)
            // 独立卡池留空 ""；如果是复刻池/联动池要和母池共享垫抽与大保底，填母池的 id (如 "char_up")
            sharedPityParent: "", 

            // 3. 换期轮替继承矩阵 (当用户开新期/换当期 UP 角色时，哪些数据保留，哪些重置)
            rotationMatrix: {
                inheritPityPulls: true,       // 保留已垫抽数 (跨期继承)
                inheritGuaranteeState: true,  // 保留大保底/连歪进度 (跨期继承)
                inheritRescueLosses: true,    // 保留捕获明光层数 (跨期继承)
                resetEarlyUp: true,           // 重置前 N 金胜率特权 (新一期重享)
                resetCatSeq: true,            // 重置前 N 金类型定向序列
                resetSparkPity: true,         // 重置里程碑/井抽数进度
                resetGiftRules: true          // 重置赠送抽累计抽数
            }
        },
    },

    // 常规常驻混池模板
    mixed_std: {
        info: { name: "常驻总集池", en: "Standard Pool", icon: "🏠", badgeColor: "#3498db" },

        assembly: {
            tierRules: {
                tier_5: {
                    mode: 'flat',
                    flatCats: ['char', 'wep'],
                    tags: ['std']
                },
                tier_4: {
                    mode: 'flat',
                    flatCats: ['char', 'wep'],
                    tags: ['normal', 'std']
                },
                tier_3: {
                    mode: 'flat',
                    flatCats: ['wep'],
                    tags: ['normal']
                }
            }
        },

        tiers: [
            {
                id: 'tier_5',
                prob: 0.6,
                isGold: true,
                subProbs: [
                    { prob: 0.3, conditions: [{ cat: 'char', tags: ['std'] }] },
                    { prob: 0.3, conditions: [{ cat: 'wep', tags: ['std'] }] }
                ]
            },
            {
                id: 'tier_4',
                prob: 9.4,
                subProbs: [
                    { prob: 4.7, conditions: [{ cat: 'char', tags: ['normal', 'std'] }] },
                    { prob: 4.7, conditions: [{ cat: 'wep', tags: ['normal', 'std'] }] }
                ]
            },
            {
                id: 'tier_3',
                prob: 90.0
            }
        ],

        pities: [
            {
                tierId: 'tier_5',
                pulls: 90,
                resetOnHit: true,
                enableUp: false,
                useGuarantee: false,
                softEnabled: true,
                softRules: [
                    { start: 74, end: 89, inc: 0.06 }
                ]
            },
            {
                tierId: 'tier_4',
                pulls: 10,
                resetOnHit: true,
                enableUp: false,
                useGuarantee: false,
                softEnabled: false,
                softRules: []
            }
        ],

        preSelect: {
            enabled: true,
            tiers: {
                tier_5: { stdMin: 0, stdMax: 999 },
                tier_4: { stdMin: 0, stdMax: 999 },
                tier_3: { stdMin: 0, stdMax: 999 }
            }
        }
    }
};