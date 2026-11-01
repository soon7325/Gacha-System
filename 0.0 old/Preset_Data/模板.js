const HSR_CHAR = [
{ name: "", en: "", short: "", eshort: "", type: ["char_up","char_up_2"] ,tierId: "tier_5" ,img : ""},
]

//无论上面怎么命名分类，最后这边都会被统一成一个大图鉴让代码能读信息
const HSR_DB = [...HSR_CHAR, ...HSR_WEAPON];

//  全局稀有度 (Tier) 定义
const HSR_GLOBAL_TIERS = [
    { id: 'tier_5', name: '5', color: '#f1c40f' },
    { id: 'tier_4', name: '4', color: '#9b59b6' },
    { id: 'tier_3', name: '3', color: '#3498db' }
];

const HSR_SETUP_RULES = {
    gameName: "崩坏：星穹铁道",
    
    //  1. 动态积木池定义 (直接接管 custom_setup 的界面)
    rosterPools: [
        { 
            id: 'char_up', 
            name: '限定角色', 
            type: 'up' 
        },
         { 
            id: 'char_up_2', 
            name: '联动角色', 
            type: 'up' 
        },
        { 
            id: 'wep_up', 
            name: '限定光锥池', 
            type: 'up' 
        },
        { 
            id: 'wep_up_2', 
            name: '联动光锥', 
            type: 'up' 
        },
        { 
            id: 'char_std', 
            name: '常驻角色', 
            type: 'std', 
            isStandalone: false,          // 是否开放侧栏独立抽取
            enableCustomUp: false,        //  是否允许模拟器拖拽自选UP
            enableSpecRate: false,        //  是否开启特限出货干预
        },
        { 
            id: 'char_std_2', 
            name: '特限角色', 
            type: 'std', 
            isStandalone: false,
            enableCustomUp: false,
            enableSpecRate: false,
        },
        { 
            id: 'wep_std', 
            name: '常驻光锥', 
            type: 'std', 
            isStandalone: false, 
            enableCustomUp: false, 
            enableSpecRate: false 
        }
    ],

    // 🌟 2. 多重混池定义 (取代旧版单一的 mixedStd)
    mixedPools: [
        { 
            id: 'mixed_std', 
            name: '常驻跃迁', 
            components: ['char_std', 'wep_std'], // 融合上述哪些图鉴
            enableCustomUp: false                 // 混池也可以开启自选 UP
        },
        { 
            id: 'mixed_std_2', 
            name: '常驻角色跃迁', 
            components: ['char_std', 'char_std_2'], // 融合上述哪些图鉴
            enableCustomUp: false                 // 混池也可以开启自选 UP
        },
    ],

    // 🌟 3. 限定池歪出流向判定 (key必须和上方的id对应)
    offRate: {
        'char_up': ['char_std', 'char_std_2'], 
        'char_up_2': ['char_std', 'char_std_2'], 
        'wep_up': ['wep_std'],
        'wep_up_2': ['wep_std']
    }
};

const HSR_POOL_RULES = {
    // 角色限定池
    char_up: {
        //调整星级
        tiers: [
            { id: 'tier_5', prob: 0.6},
            { id: 'tier_4', prob: 5.1},
            { id: 'tier_3', prob: 94.3}
        ],
        // --- 目标金设定 (核心！你想定谁是金，谁就是金) ---
        targetGoldIds: ['tier_5'],
        // 副产物保底配置 
        minorPities: [
            {pulls: 10,tierId: 'tier_4',resetOnHit: true },
        ],
        // --- 保底与UP概率  ---
        hardEnabled: true,
        hardPity: 90,
        upRate: 0.5,
        // --- 分段式软保底 ---
        softEnabled: true,
        softRule: [
            { start: 74, end: 89, inc: 0.06 },
        ],
        // --- 大保底机制 ---
        useGuarantee: true, 
        guaranteeLimit: 1, 
        // --- 井 ---
        sparkRules: [
            { limit: 120, type: 'once', 
                cancelOnUp: true,      //提前命中后重置该井
                noReset: false         //作为类福袋额外发放
            }, 
            { limit: 240, type: 'loop', 
                cancelOnUp: false, 
                noReset: true 
            }  
        ],
        // --- 赠送抽 ---
        giftRules: [
            { trigger: 30, amount: 10, type: 'once', countPity: false /*不计入保底垫数*/} 
        ],
         // --- 模拟器预选数量限制设定 ---
        preSelect: {
            enabled: true,
            upMin: 1,
            upMax: 1,
            stdMin: 7,
            stdMax: 7
        },
        // 🌟 特限出货干预配置 🌟
        specRate: {
            enabled: true,
            type: 'multiplier',       // 【算法】填写 'multiplier' (权值倍数提升) 或 'percent' (固定占有率)
            value: 5,                 // 【数值】如果是 multiplier 填 5 就是 5倍；如果是 percent 填 50 就是 50%
            items: []                 // 【干预名单】直接留空数组 [] 即可！系统会接收玩家在模拟器中拖拽的角色
        },
    },
}