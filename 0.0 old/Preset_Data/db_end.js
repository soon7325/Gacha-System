// --- 终末地：角色数据库 (全称) ---
//供复制：{ name: "", en: "", short: "", eshort: "", type: ["up","spec"], star: 5, img:"" },
const END_CHAR = [
    { name: "卡缪", en: "Camille", short: "卡缪", eshort: "Camil", type: ["char_up","char_std_2"], tierId: "tier_6", img:"../img/END/char/6/卡缪.png" },
    { name: "弭弗", en: "Mi Fu", short: "弭弗", eshort: "Mi Fu", type: ["char_up","char_std_2"], tierId: "tier_6", img:"../img/END/char/6/弭弗.png" },
    { name: "庄方宜", en: "Zhuang Fang Yi", short: "庄", eshort: "Zuang", type: ["char_up","char_std_2"], tierId: "tier_6", img:"../img/END/char/6/庄方宜.png" },
    { name: "洛西", en: "Rossi", short: "洛", eshort: "Rossi", type: ["char_up","char_std_2"], tierId: "tier_6", img:"../img/END/char/6/洛茜.png" },
    { name: "汤汤", en: "Tangtang", short: "汤", eshort: "Tang", type: ["char_up","char_std_2"], tierId: "tier_6", img:"../img/END/char/6/汤汤.png" },
    { name: "伊冯", en: "Yvonne", short: "伊", eshort: "Yvon", type: ["char_up","char_std_2"], tierId: "tier_6", img:"../img/END/char/6/伊冯.png" },
    { name: "杰尔佩塔", en: "Gilberta", short: "杰哥", eshort: "Gilbe", type: ["char_up","char_std_2"], tierId: "tier_6", img:"../img/END/char/6/洁尔佩塔.png" },
    { name: "莱万汀", en: "Laevatain", short: "莱", eshort: "Leava", type: ["char_up","char_std_2"], tierId: "tier_6", img:"../img/END/char/6/莱万汀.png" },




    { name: "骏卫", en: "Pogranichnik", short: "骏", eshort: "Pogra", type: ["char_std"], tierId: "tier_6", img:"../img/END/char/6/骏卫.png" },
    { name: "余烬", en: "Ember", short: "余", eshort: "Ember", type: ["char_std"], tierId: "tier_6", img:"../img/END/char/6/余烬.png" },
    { name: "别礼", en: "Last Rite", short: "礼", eshort: "LRite", type: ["char_std"], tierId: "tier_6", img:"../img/END/char/6/别礼.png" },
    { name: "黎风", en: "Lifeng", short: "黎", eshort: "Lfeng", type: ["char_std"], tierId: "tier_6", img:"../img/END/char/6/黎风.png" },
    { name: "艾尔黛拉", en: "Aldelia", short: "羊", eshort: "Alde", type: ["char_std"], tierId: "tier_6", img:"../img/END/char/6/艾尔黛拉.png" },
];

const END_WEAPON = [
    { name: "镀红祝福", en: "Blessing Of Lustrous Carmine", short: "卡专", eshort: "Camil", type: "wep_up", tierId: "tier_6", img:"../img/END/weapon/6/镀红祝福.png" },
    { name: "赤缨", en: "Amaranthine Tassel", short: "弭专", eshort: "Mi Fu", type: "wep_up", tierId: "tier_6", img:"../img/END/weapon/6/赤缨.png" },
    { name: "孤舟", en: "Lone Barge", short: "庄专", eshort: "Zuang", type: "wep_up", tierId: "tier_6", img:"../img/END/weapon/6/孤舟.png" },
    { name: "狼之绯", en: "Lupine Scarlet", short: "洛专", eshort: "Rossi", type: "wep_up", tierId: "tier_6", img:"../img/END/weapon/6/狼之绯.png" },
    { name: "落草", en: "Brigand's Calling", short: "汤专", eshort: "Tang", type: "wep_up", tierId: "tier_6", img:"../img/END/weapon/6/落草.png" },
    { name: "艺术暴君", en: "Aztzy Tyrannical", short: "伊专", eshort: "Yvon", type: "wep_up", tierId: "tier_6", img:"../img/END/weapon/6/艺术暴君.png" },
    { name: "使命必达", en: "Delivery Guaranteed", short: "杰专", eshort: "Gilbe", type: "wep_up", tierId: "tier_6", img:"../img/END/weapon/6/使命必达.png" },
    { name: "熔铸火焰", en: "Forgeborn Scathe", short: "莱专", eshort: "Leava", type: "wep_up", tierId: "tier_6", img:"../img/END/weapon/6/熔铸火焰.png" },
    { name: "不知归", en: "Never Rest", short: "骏专", eshort: "Pogra", type: "wep_up", tierId: "tier_6", img:"../img/END/weapon/6/不知归.png" },
    { name: "大雷斑", en: "Thunderberge", short: "余专", eshort: "Ember", type: "wep_up", tierId: "tier_6", img:"../img/END/weapon/6/大雷斑.png" },
    { name: "赫拉芬格", en: "Khravengger", short: "礼专", eshort: "LRite", type: "wep_up", tierId: "tier_6", img:"../img/END/weapon/6/赫拉芬格.png" },
    { name: "负山", en: "Mountain Bearer", short: "黎专", eshort: "Lfeng", type: "wep_up", tierId: "tier_6", img:"../img/END/weapon/6/负山.png" },
    { name: "沧溟星梦", en: "Dreams of the Starry Beach", short: "羊专", eshort: "Alde", type: "wep_up", tierId: "tier_6", img:"../img/END/weapon/6/沧溟星梦.png" },

    { name: "骑士精神", en: "Chivalric Virtues", short: "骑士", eshort: "Chiv", type: "wep_std", tierId: "tier_6", img:"../img/END/weapon/6/骑士精神.png" },
    { name: "遗忘", en: "Oblivion", short: "遗忘", eshort: "Obli", type: "wep_std", tierId: "tier_6", img:"../img/END/weapon/6/遗忘.png" },
    { name: "爆破单元", en: "Detonation Unit", short: "爆破", eshort: "Deton", type: "wep_std", tierId: "tier_6", img:"../img/END/weapon/6/爆破单元.png" },
    { name: "同类相食", en: "Clannibal", short: "同类", eshort: "Clann", type: "wep_std", tierId: "tier_6", img:"../img/END/weapon/6/同类相食.png" },
    { name: "契子", en: "Wedge", short: "契子", eshort: "Wedge", type: "wep_std", tierId: "tier_6", img:"../img/END/weapon/6/楔子.png" },
    { name: "J.E.T", en: "J.E.T", short: "JET", eshort: "JET", type: "wep_std", tierId: "tier_6", img:"../img/END/weapon/6/J.E.T.png" },
    { name: "骁勇", en: "Valiant", short: "骁勇", eshort: "Valia", type: "wep_std", tierId: "tier_6", img:"../img/END/weapon/6/骁勇.png" },
    { name: "破碎君王", en: "Sundered Prince", short: "破碎", eshort: "Sunde", type: "wep_std", tierId: "tier_6", img:"../img/END/weapon/6/破碎君王.png" },
    { name: "昔日精品", en: "Former Finery", short: "昔日", eshort: "Forme", type: "wep_std", tierId: "tier_6", img:"../img/END/weapon/6/昔日精品.png" },
    { name: "典范", en: "Exemplar", short: "典范", eshort: "Exemp", type: "wep_std", tierId: "tier_6", img:"../img/END/weapon/6/典范.png" },
    { name: "白夜新星", en: "White Night Nova", short: "白夜", eshort: "WhitN", type: "wep_std", tierId: "tier_6", img:"../img/END/weapon/6/白夜新星.png" },
    { name: "显赫声名", en: "Eminent Repute", short: "显赫", eshort: "Emin", type: "wep_std", tierId: "tier_6", img:"../img/END/weapon/6/显赫声名.png" },
    { name: "热熔切割器", en: "Thermite Cutter", short: "热熔", eshort: "Therm", type: "wep_std", tierId: "tier_6", img:"../img/END/weapon/6/热熔切割器.png" },
    { name: "扶摇", en: "Rapid Ascent", short: "扶摇", eshort: "Rapid", type: "wep_std", tierId: "tier_6", img:"../img/END/weapon/6/扶摇.png" },
    { name: "宏愿", en: "Grand Vision", short: "宏愿", eshort: "Grand", type: "wep_std", tierId: "tier_6", img: "../img/END/weapon/6/宏愿.png" },
]

//无论上面怎么命名分类，最后这边都会被统一成一个大图鉴让代码能读信息
const END_DB = [...END_CHAR, ...END_WEAPON];

//  全局稀有度 (Tier) 定义
const END_GLOBAL_TIERS = [
    { id: 'tier_6', name: '6', color: '#f10f0f' },
    { id: 'tier_5', name: '5', color: '#f1c40f' },
    { id: 'tier_4', name: '4', color: '#9b59b6' },
];

const END_SETUP_RULES = {
    gameName: "明日方舟：终末地",enName: "Arknights: Endfield",
    
    //  1. 动态积木池定义 (直接接管 custom_setup 的界面)
    rosterPools: [
        { id: 'char_up', name: '特许寻访', en: "Chartered Headhunting", type: 'up' },
        { id: 'wep_up', name: '武库交易所', en: "Arsenal Exchange", type: 'up'},
        { 
            id: 'char_std', name: '基础寻访', en: "Basic Headhunting", type: 'std', 
            isStandalone: true,          // 是否开放侧栏独立抽取
            enableCustomUp: false,        //  是否允许模拟器拖拽自选UP
            enableSpecRate: false,        //  是否开启特限出货干预
        },
        { 
            id: 'char_std_2', name: '往期限定角色', en: "Pass-Time Characters", type: 'std', 
            isStandalone: false,          // 是否开放侧栏独立抽取
            enableCustomUp: false,        //  是否允许模拟器拖拽自选UP
            enableSpecRate: false,        //  是否开启特限出货干预
        },
        { 
            id: 'wep_std', name: '常驻武器', en: "Standard Weapon", type: 'std', 
            isStandalone: false, 
            enableCustomUp: false, 
            enableSpecRate: false 
        }
    ],

    mixedPools: [
        { 
            id: 'mixed_std', 
            name: '特殊寻访', 
            en: "Special Headhunting",
            components: ['char_std', 'char_std_2'], // 融合上述哪些图鉴
            enableCustomUp: true                 // 混池也可以开启自选 UP
        }
    ],

    // 🌟 3. 限定池歪出流向判定 (key必须和上方的id对应)
    offRate: {
        'char_up': ['char_std', 'char_std_2'], 
        'wep_up': ['wep_std'],
    }
};

const END_POOL_RULES = {
    // 角色限定池
    char_up: {
        tiers: [
            { id: 'tier_6', prob: 0.8},
            { id: 'tier_5', prob: 8},
            { id: 'tier_4', prob: 91.2}
        ],
        // --- 目标金设定 ---
        targetGoldIds: ['tier_6'],
        // --- 副产物保底配置 ---
        minorPities: [
            { pulls: 10,tierId: 'tier_5',resetOnHit: true },
        ],
        // --- 保底与UP概率 ---
        hardPity: 90,
        upRate: 0.5,
        // --- 分段式软保底 ---
        softEnabled: true,
        softRule: [
            { start: 66, end: 89, inc: 0.05 },
        ],
        // --- 大保底 ---
        useGuarantee: false, 
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
    },
    // 武器限定池
    wep_up: {
        tiers: [
            { id: 'tier_6', prob: 4},
            { id: 'tier_5', prob: 15},
            { id: 'tier_4', prob: 81}
        ],
        // --- 目标金设定 ---
        targetGoldIds: ['tier_6'],
        // --- 副产物保底配置 ---
        minorPities: [
            { pulls: 10,tierId: 'tier_5',resetOnHit: true },
        ],
        // --- 保底与UP概率 ---
        upRate: 0.75,
        // --- 分段式软保底 ---
        softEnabled: false,
        // --- 大保底机制 ---
        useGuarantee: false,  
        // --- 井 ---
        sparkRules: [
            { limit: 80, type: 'once', 
                cancelOnUp: true,      //提前命中后重置该井
                noReset: false         //作为类福袋额外发放
            }, 
        ],
         // --- 模拟器预选数量限制设定 ---
        preSelect: {
            enabled: true,
            upMin: 1,
            upMax: 1,
            stdMin: 6,
            stdMax: 6
        },
    },
     // 常驻池
    char_std: {
        tiers: [
            { id: 'tier_6', prob: 0.8},
            { id: 'tier_5', prob: 8},
            { id: 'tier_4', prob: 91.2}
        ],
        // --- 目标金设定 ---
        targetGoldIds: ['tier_6'],
        // --- 副产物保底配置 ---
        minorPities: [
            { pulls: 10,tierId: 'tier_5',resetOnHit: true },
        ],
        // --- 保底与UP概率 ---
        hardPity: 90,
        // --- 分段式软保底 ---
        softEnabled: true,
        softRule: [
            { start: 66, end: 89, inc: 0.05 },
        ],
        // --- 大保底机制 ---
        useGuarantee: false,  
         // --- 模拟器预选数量限制设定 ---
        preSelect: {
            enabled: true,
            upMin: 0,
            upMax: 0,
            stdMin: 5,
            stdMax: 5
        },
    },
    //特殊寻访
    mixed_std: {
        tiers: [
            { id: 'tier_6', prob: 0.8},
            { id: 'tier_5', prob: 8},
            { id: 'tier_4', prob: 91.2}
        ],
        // --- 目标金设定 ---
        targetGoldIds: ['tier_6'],
        // --- 副产物保底配置 ---
        minorPities: [
            { pulls: 10,tierId: 'tier_5',resetOnHit: true },
        ],
        // --- 保底与UP概率 ---
        hardPity: 90,
        // --- 分段式软保底 ---
        softEnabled: true,
        softRule: [
            { start: 66, end: 89, inc: 0.05 },
        ],
        // --- 大保底机制 ---
        useGuarantee: false,  
         // --- 模拟器预选数量限制设定 ---
        preSelect: {
            enabled: true,
            upMin: 4,
            upMax: 4,
            stdMin: 0,
            stdMax: 0
        },
    },
};