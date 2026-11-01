// --- 终末地：角色数据库 (全称) ---
//供复制：{ name: "", en: "", short: "", eshort: "", type: ["up","spec"], star: 5, img:"" },
const END_CHAR = [
    // === 6星角色 (UP/限定/常驻) ===
    { name: "提弗洛斯", en: "Typhoeus", short: "提丰", eshort: "Typho", type: ["char_up", "char_std_2"], star: 6, img: "../img/END/char/6/提弗洛斯.png" },
    { name: "梨诺", en: "Liino", short: "梨诺", eshort: "Liino", type: ["char_up", "char_std_2"], star: 6, img: "../img/END/char/6/梨诺.png" },
    { name: "诀", en: "Arcane", short: "诀", eshort: "Arcan", type: ["char_up", "char_std_2"], star: 6, img: "../img/END/char/6/诀.png" },
    { name: "卡缪", en: "Camille", short: "卡缪", eshort: "Camil", type: ["char_up", "char_std_2"], star: 6, img: "../img/END/char/6/卡缪.png" },
    { name: "弭弗", en: "Mi Fu", short: "弭弗", eshort: "Mi Fu", type: ["char_up", "char_std_2"], star: 6, img: "../img/END/char/6/弭弗.png" },
    { name: "庄方宜", en: "Zhuang Fangyi", short: "庄", eshort: "Zuang", type: ["char_up", "char_std_2"], star: 6, img: "../img/END/char/6/庄方宜.png" },
    { name: "洛茜", en: "Rossi", short: "洛", eshort: "Rossi", type: ["char_up", "char_std_2"], star: 6, img: "../img/END/char/6/洛茜.png" },
    { name: "汤汤", en: "Tangtang", short: "汤", eshort: "Tang", type: ["char_up", "char_std_2"], star: 6, img: "../img/END/char/6/汤汤.png" },
    { name: "伊冯", en: "Yvonne", short: "伊", eshort: "Yvon", type: ["char_up", "char_std_2"], star: 6, img: "../img/END/char/6/伊冯.png" },
    { name: "洁尔佩塔", en: "Gilberta", short: "杰哥", eshort: "Gilbe", type: ["char_up", "char_std_2"], star: 6, img: "../img/END/char/6/洁尔佩塔.png" },
    { name: "莱万汀", en: "Laevatain", short: "莱", eshort: "Leava", type: ["char_up", "char_std_2"], star: 6, img: "../img/END/char/6/莱万汀.png" },

    { name: "骏卫", en: "Pogranichnik", short: "骏", eshort: "Pogra", type: ["char_std"], star: 6, img: "../img/END/char/6/骏卫.png" },
    { name: "余烬", en: "Ember", short: "余", eshort: "Ember", type: ["char_std"], star: 6, img: "../img/END/char/6/余烬.png" },
    { name: "别礼", en: "Last Rite", short: "礼", eshort: "LRite", type: ["char_std"], star: 6, img: "../img/END/char/6/别礼.png" },
    { name: "黎风", en: "Lifeng", short: "黎", eshort: "Lfeng", type: ["char_std"], star: 6, img: "../img/END/char/6/黎风.png" },
    { name: "艾尔黛拉", en: "Ardelia", short: "羊", eshort: "Alde", type: ["char_std"], star: 6, img: "../img/END/char/6/艾尔黛拉.png" },

    // === 5星角色 (tier_5) ===
    { name: "大潘", en: "Da Pan", short: "大潘", eshort: "DaPan", type: ["char_5"], star: 5, img: "../img/END/char/5/大潘.png" },
    { name: "艾维文娜", en: "Avywenna", short: "艾维", eshort: "Avywe", type: ["char_5"], star: 5, img: "../img/END/char/5/艾维文娜.png" },
    { name: "佩丽卡", en: "Perlica", short: "鹈鹕", eshort: "Perli", type: ["char_5"], star: 5, img: "../img/END/char/5/佩丽卡.png" },
    { name: "弧光", en: "Arclight", short: "弧光", eshort: "Arcli", type: ["char_5"], star: 5, img: "../img/END/char/5/弧光.png" },
    { name: "阿列什", en: "Alesh", short: "列", eshort: "Alesh", type: ["char_5"], star: 5, img: "../img/END/char/5/阿列什.png" },
    { name: "陈千语", en: "Chen Qianyu", short: "啥龙", eshort: "Chen", type: ["char_5"], star: 5, img: "../img/END/char/5/陈千语.png" },
    { name: "昼雪", en: "Snowshine", short: "昼雪", eshort: "Snow", type: ["char_5"], star: 5, img: "../img/END/char/5/昼雪.png" },
    { name: "狼卫", en: "Wulfgard", short: "狼哥", eshort: "Wolf", type: ["char_5"], star: 5, img: "../img/END/char/5/狼卫.png" },
    { name: "赛希", en: "Xaihi", short: "赛希", eshort: "Xaihi", type: ["char_5"], star: 5, img: "../img/END/char/5/赛希.png" },
    { name: "噗切娜", en: "Purrchena", short: "大猫", eshort: "Purce", type: ["char_5"], star: 5, img: "../img/END/char/5/噗切娜.png" },

    // === 4星角色 (tier_4) ===
    { name: "卡契尔", en: "Catcher", short: "契尔", eshort: "Cat", type: ["char_4"], star: 4, img: "../img/END/char/4/卡契尔.png" },
    { name: "安塔尔", en: "Antal", short: "太子", eshort: "Antal", type: ["char_4"], star: 4, img: "../img/END/char/4/安塔尔.png" },
    { name: "秋栗", en: "Akekuri", short: "秋栗", eshort: "Kuri", type: ["char_4"], star: 4, img: "../img/END/char/4/秋栗.png" },
    { name: "埃特拉", en: "Estella", short: "埃", eshort: "Tella", type: ["char_4"], star: 4, img: "../img/END/char/4/埃特拉.png" },
    { name: "萤石", en: "Fluorite", short: "萤石", eshort: "Fluo", type: ["char_4"], star: 4, img: "../img/END/char/4/萤石.png" },
];

const END_WEAPON = [
    // === 六星：UP / 限定抽取 (wep_up) ===
    { name: "寒夜幽影", en: "Umbra of Frigid Eventide", short: "提专", eshort: "Typho", type: ["wep_up"], star: 6, img: "../img/END/weapon/6/寒夜幽影.png" },
    { name: "曜夜的首演", en: "Bedazzling Night Debut", short: "梨专", eshort: "Liino", type: ["wep_up"], star: 6, img: "../img/END/weapon/6/曜夜的首演.png" },
    { name: "四二式·肃阵", en: "Type 42: Solemn Phalanx", short: "诀专", eshort: "Arcan", type: ["wep_up"], star: 6, img: "../img/END/weapon/6/四二式·肃阵.png" },
    { name: "镀红祝福", en: "Blessing of Lustrous Carmine", short: "卡专", eshort: "Camil", type: ["wep_up"], star: 6, img: "../img/END/weapon/6/镀红祝福.png" },
    { name: "赤缨", en: "Amaranthine Tassel", short: "弭专", eshort: "Mi Fu", type: ["wep_up"], star: 6, img: "../img/END/weapon/6/赤缨.png" },
    { name: "孤舟", en: "Lone Barge", short: "庄专", eshort: "Zuang", type: ["wep_up"], star: 6, img: "../img/END/weapon/6/孤舟.png" },
    { name: "狼之绯", en: "Lupine Scarlet", short: "洛专", eshort: "Rossi", type: ["wep_up"], star: 6, img: "../img/END/weapon/6/狼之绯.png" },
    { name: "落草", en: "Brigand's Calling", short: "汤专", eshort: "Tang", type: ["wep_up"], star: 6, img: "../img/END/weapon/6/落草.png" },
    { name: "艺术暴君", en: "Artzy Tyrannical", short: "伊专", eshort: "Yvon", type: ["wep_up"], star: 6, img: "../img/END/weapon/6/艺术暴君.png" },
    { name: "使命必达", en: "Delivery Guaranteed", short: "杰专", eshort: "Gilbe", type: ["wep_up"], star: 6, img: "../img/END/weapon/6/使命必达.png" },
    { name: "熔铸火焰", en: "Forgeborn Scathe", short: "莱专", eshort: "Leava", type: ["wep_up"], star: 6, img: "../img/END/weapon/6/熔铸火焰.png" },
    { name: "不知归", en: "Never Rest", short: "骏专", eshort: "Pogra", type: ["wep_up"], star: 6, img: "../img/END/weapon/6/不知归.png" },
    { name: "大雷斑", en: "Thunderberge", short: "余专", eshort: "Ember", type: ["wep_up"], star: 6, img: "../img/END/weapon/6/大雷斑.png" },
    { name: "赫拉芬格", en: "Khravengger", short: "礼专", eshort: "LRite", type: ["wep_up"], star: 6, img: "../img/END/weapon/6/赫拉芬格.png" },
    { name: "负山", en: "Mountain Bearer", short: "黎专", eshort: "Lfeng", type: ["wep_up"], star: 6, img: "../img/END/weapon/6/负山.png" },
    { name: "沧溟星梦", en: "Dreams of the Starry Beach", short: "羊专", eshort: "Alde", type: ["wep_up"], star: 6, img: "../img/END/weapon/6/沧溟星梦.png" },

    // === 六星：不可抽取 (大月卡 / 活动赠礼 wep_non) ===
    { name: "苦难的尽头", en: "Suffering's End", short: "苦难", eshort: "Sufer", type: ["wep_non"], star: 6, img: "../img/END/weapon/6/苦难的尽头.png" },
    { name: "黄金时代", en: "Golden Age", short: "黄金", eshort: "Gold", type: ["wep_non"], star: 6, img: "../img/END/weapon/6/黄金时代.png" },
    { name: "遥望", en: "Farsight", short: "遥望", eshort: "Fars", type: ["wep_non"], star: 6, img: "../img/END/weapon/6/遥望.png" },
    { name: "联结点", en: "Junction Point", short: "联结", eshort: "Junc", type: ["wep_non"], star: 6, img: "../img/END/weapon/6/联结点.png" },
    { name: "灯火使命", en: "Beacon of Duty", short: "灯火", eshort: "Beaco", type: ["wep_non"], star: 6, img: "../img/END/weapon/6/灯火使命.png" },
    { name: "幻想苦痛", en: "Phantom Pain", short: "幻想", eshort: "Phan", type: ["wep_non"], star: 6, img: "../img/END/weapon/6/幻想苦痛.png" },
    { name: "雾中微光", en: "Flickers in the Mist", short: "雾光", eshort: "Flick", type: ["wep_non"], star: 6, img: "../img/END/weapon/6/雾中微光.png" },
    { name: "望乡", en: "Home Longing", short: "望乡", eshort: "Home", type: ["wep_non"], star: 6, img: "../img/END/weapon/6/望乡.png" },
    { name: "光荣记忆", en: "Glorious Memory", short: "光荣", eshort: "Glori", type: ["wep_non"], star: 6, img: "../img/END/weapon/6/光荣记忆.png" },
    { name: "黯色火炬", en: "Umbral Torch", short: "黯色", eshort: "Umbal", type: ["wep_non"], star: 6, img: "../img/END/weapon/6/黯色火炬.png" },
    { name: "领航员", en: "Navigator", short: "领航", eshort: "Navi", type: ["wep_non"], star: 6, img: "../img/END/weapon/6/领航员.png" },
    { name: "作品：蚀迹", en: "Opus: Etch Figure", short: "蚀迹", eshort: "Etch", type: ["wep_non"], star: 6, img: "../img/END/weapon/6/作品：蚀迹.png" },

    // === 六星：常驻抽取 (wep_std) ===
    { name: "骑士精神", en: "Chivalric Virtues", short: "骑士", eshort: "Chiv", type: ["wep_std"], star: 6, img: "../img/END/weapon/6/骑士精神.png" },
    { name: "遗忘", en: "Oblivion", short: "遗忘", eshort: "Obli", type: ["wep_std"], star: 6, img: "../img/END/weapon/6/遗忘.png" },
    { name: "爆破单元", en: "Detonation Unit", short: "爆破", eshort: "Deton", type: ["wep_std"], star: 6, img: "../img/END/weapon/6/爆破单元.png" },
    { name: "同类相食", en: "Clannibal", short: "同类", eshort: "Clann", type: ["wep_std"], star: 6, img: "../img/END/weapon/6/同类相食.png" },
    { name: "楔子", en: "Wedge", short: "契子", eshort: "Wedge", type: ["wep_std"], star: 6, img: "../img/END/weapon/6/楔子.png" },
    { name: "J.E.T", en: "JET", short: "JET", eshort: "JET", type: ["wep_std"], star: 6, img: "../img/END/weapon/6/J.E.T.png" },
    { name: "骁勇", en: "Valiant", short: "骁勇", eshort: "Valia", type: ["wep_std"], star: 6, img: "../img/END/weapon/6/骁勇.png" },
    { name: "破碎君王", en: "Sundered Prince", short: "破碎", eshort: "Sunde", type: ["wep_std"], star: 6, img: "../img/END/weapon/6/破碎君王.png" },
    { name: "昔日精品", en: "Former Finery", short: "昔日", eshort: "Forme", type: ["wep_std"], star: 6, img: "../img/END/weapon/6/昔日精品.png" },
    { name: "典范", en: "Exemplar", short: "典范", eshort: "Exemp", type: ["wep_std"], star: 6, img: "../img/END/weapon/6/典范.png" },
    { name: "白夜新星", en: "White Night Nova", short: "白夜", eshort: "WhitN", type: ["wep_std"], star: 6, img: "../img/END/weapon/6/白夜新星.png" },
    { name: "显赫声名", en: "Eminent Repute", short: "显赫", eshort: "Emin", type: ["wep_std"], star: 6, img: "../img/END/weapon/6/显赫声名.png" },
    { name: "热熔切割器", en: "Thermite Cutter", short: "热熔", eshort: "Therm", type: ["wep_std"], star: 6, img: "../img/END/weapon/6/热熔切割器.png" },
    { name: "扶摇", en: "Rapid Ascent", short: "扶摇", eshort: "Rapid", type: ["wep_std"], star: 6, img: "../img/END/weapon/6/扶摇.png" },
    { name: "宏愿", en: "Grand Vision", short: "宏愿", eshort: "Grand", type: ["wep_std"], star: 6, img: "../img/END/weapon/6/宏愿.png" },

    // === 五星武器：不可抽取 (wep_non) ===
    { name: "点心时刻", en: "Finishing Call", short: "", eshort: "", type: ["wep_non"], star: 5, img: "../img/END/weapon/5/点心时刻.png" },

    // === 五星武器：抽取 (wep_5) ===
    { name: "O.B.J.术识", en: "OBJ Arts Identifier", short: "", eshort: "", type: ["wep_5"], star: 5, img: "../img/END/weapon/5/O.B.J.术识.png" },
    { name: "O.B.J.尖峰", en: "OBJ Razorhorn", short: "", eshort: "", type: ["wep_5"], star: 5, img: "../img/END/weapon/5/O.B.J.尖峰.png" },
    { name: "O.B.J.迅极", en: "OBJ Velocitous", short: "", eshort: "", type: ["wep_5"], star: 5, img: "../img/END/weapon/5/O.B.J.迅极.png" },
    { name: "O.B.J.轻芒", en: "OBJ Edge of Lightness", short: "", eshort: "", type: ["wep_5"], star: 5, img: "../img/END/weapon/5/O.B.J.轻芒.png" },
    { name: "O.B.J.重荷", en: "OBJ Heavy Burden", short: "", eshort: "", type: ["wep_5"], star: 5, img: "../img/END/weapon/5/O.B.J.重荷.png" },
    { name: "十二问", en: "Twelve Questions", short: "", eshort: "", type: ["wep_5"], star: 5, img: "../img/END/weapon/5/十二问.png" },
    { name: "古渠", en: "Ancient Canal", short: "", eshort: "", type: ["wep_5"], star: 5, img: "../img/END/weapon/5/古渠.png" },
    { name: "布道自由", en: "Freedom to Proselytize", short: "", eshort: "", type: ["wep_5"], star: 5, img: "../img/END/weapon/5/布道自由.png" },
    { name: "仰止", en: "Aspirant", short: "", eshort: "", type: ["wep_5"], star: 5, img: "../img/END/weapon/5/仰止.png" },
    { name: "向心之引", en: "Cohesive Traction", short: "", eshort: "", type: ["wep_5"], star: 5, img: "../img/END/weapon/5/向心之引.png" },
    { name: "作品：众生", en: "Opus: The Living", short: "", eshort: "", type: ["wep_5"], star: 5, img: "../img/END/weapon/5/作品：众生.png" },
    { name: "坚城铸造者", en: "Fortmaker", short: "", eshort: "", type: ["wep_5"], star: 5, img: "../img/END/weapon/5/坚城铸造者.png" },
    { name: "终点之声", en: "Sundering Steel", short: "", eshort: "", type: ["wep_5"], star: 5, img: "../img/END/weapon/5/终点之声.png" },
    { name: "钢铁余音", en: "Stanza of Memorials", short: "", eshort: "", type: ["wep_5"], star: 5, img: "../img/END/weapon/5/钢铁余音.png" },
    { name: "迷失荒野", en: "Wild Wanderer", short: "", eshort: "", type: ["wep_5"], star: 5, img: "../img/END/weapon/5/迷失荒野.png" },
    { name: "悼亡诗", en: "Monaihe", short: "", eshort: "", type: ["wep_5"], star: 5, img: "../img/END/weapon/5/悼亡诗.png" },
    { name: "探骊", en: "Seeker of Dark Lung", short: "", eshort: "", type: ["wep_5"], star: 5, img: "../img/END/weapon/5/探骊.png" },
    { name: "理性告别", en: "Rational Farewell", short: "", eshort: "", type: ["wep_5"], star: 5, img: "../img/END/weapon/5/理性告别.png" },
    { name: "莫奈何", en: "Monaihe", short: "", eshort: "", type: ["wep_5"], star: 5, img: "../img/END/weapon/5/莫奈何.png" },
    { name: "逐麟3.0", en: "Finchaser 3.0", short: "", eshort: "", type: ["wep_5"], star: 5, img: "../img/END/weapon/5/逐麟3.0.png" },
    { name: "嵌合正义", en: "Chimeric Justice", short: "", eshort: "", type: ["wep_5"], star: 5, img: "../img/END/weapon/5/嵌合正义.png" },

    // === 4星武器 (wep_4) ===
    { name: "工业零点一", en: "Industry 0.1", short: "", eshort: "", type: ["wep_4"], star: 4, img: "../img/END/weapon/4/工业零点一.png" },
    { name: "天使杀手", en: "Aggeloslayer", short: "", eshort: "", type: ["wep_4"], star: 4, img: "../img/END/weapon/4/天使杀手.png" },
    { name: "长路", en: "Long Road", short: "", eshort: "", type: ["wep_4"], star: 4, img: "../img/END/weapon/4/长路.png" },
    { name: "全自动骇新星", en: "Hypernova Auto", short: "", eshort: "", type: ["wep_4"], star: 4, img: "../img/END/weapon/4/全自动骇新星.png" },
    { name: "寻路者道标", en: "Pathfinder's Beacon", short: "", eshort: "", type: ["wep_4"], star: 4, img: "../img/END/weapon/4/寻路者道标.png" },
    { name: "呼啸守卫", en: "Howling Guard", short: "", eshort: "", type: ["wep_4"], star: 4, img: "../img/END/weapon/4/呼啸守卫.png" },
    { name: "显锋", en: "Prominent Edge", short: "", eshort: "", type: ["wep_4"], star: 4, img: "../img/END/weapon/4/显锋.png" },
    { name: "浪潮", en: "Wave Tide", short: "", eshort: "", type: ["wep_4"], star: 4, img: "../img/END/weapon/4/浪潮.png" },
    { name: "淬火者", en: "Quencher", short: "", eshort: "", type: ["wep_4"], star: 4, img: "../img/END/weapon/4/淬火者.png" },
    { name: "荧光雷羽", en: "Fluorescent Roc", short: "", eshort: "", type: ["wep_4"], star: 4, img: "../img/END/weapon/4/荧光雷羽.png" },

    // === 3星武器 (wep_3) ===
    { name: "吉米尼12", en: "Jiminy 12", short: "", eshort: "", type: ["wep_3"], star: 3, img: "../img/END/weapon/3/吉米尼12.png" },
    { name: "达尔霍夫7", en: "Darhoff 7", short: "", eshort: "", type: ["wep_3"], star: 3, img: "../img/END/weapon/3/达尔霍夫7.png" },
    { name: "佩科5", en: "Peco 5", short: "", eshort: "", type: ["wep_3"], star: 3, img: "../img/END/weapon/3/佩科5.png" },
    { name: "奥佩罗77", en: "Opero 77", short: "", eshort: "", type: ["wep_3"], star: 3, img: "../img/END/weapon/3/奥佩罗77.png" },
    { name: "塔尔11", en: "Tarr 11", short: "", eshort: "", type: ["wep_3"], star: 3, img: "../img/END/weapon/3/塔尔11.png" },
];

//无论上面怎么命名分类，最后这边都会被统一成一个大图鉴让代码能读信息
const END_DB = [...END_CHAR, ...END_WEAPON];

//  全局稀有度 (Tier) 定义
const END_GLOBAL_TIERS = [
    { id: 'tier_6', name: '6', color: '#f10f0f' },
    { id: 'tier_5', name: '5', color: '#f1c40f' },
    { id: 'tier_4', name: '4', color: '#9b59b6' },
    { id: 'tier_3', name: '3', color: '#3498db' },
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
            id: 'char_5', name: '5星角色', en: "5-Star Characters", type: 'std', 
            isStandalone: false,          // 是否开放侧栏独立抽取
            enableCustomUp: false,        //  是否允许模拟器拖拽自选UP
            enableSpecRate: false,        //  是否开启特限出货干预
        },
        { 
            id: 'char_4', name: '4星角色', en: "4-Star Characters", type: 'std', 
            isStandalone: false,          // 是否开放侧栏独立抽取
            enableCustomUp: false,        //  是否允许模拟器拖拽自选UP
            enableSpecRate: false,        //  是否开启特限出货干预
        },
        { 
            id: 'wep_std', name: '常驻武器', en: "Standard Weapon", type: 'std', 
            isStandalone: false, 
            enableCustomUp: false, 
            enableSpecRate: false 
        },
        { 
            id: 'wep_non', name: '不抽武器', en: "Non-Draw Weapon", type: 'std', 
            isStandalone: false, 
            enableCustomUp: false, 
            enableSpecRate: false 
        },
        { 
            id: 'wep_5', name: '5星武器', en: "5-Star Weapon", type: 'std', 
            isStandalone: false, 
            enableCustomUp: false, 
            enableSpecRate: false 
        },
        { 
            id: 'wep_4', name: '4星武器', en: "4-Star Weapon", type: 'std', 
            isStandalone: false, 
            enableCustomUp: false, 
            enableSpecRate: false 
        },
        { 
            id: 'wep_3', name: '3星武器', en: "3-Star Weapon", type: 'std', 
            isStandalone: false, 
            enableCustomUp: false, 
            enableSpecRate: false 
        },

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
        hardPity: 80,
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
        hardPity: 10000,
        upRate: 0.25,
        // --- 分段式软保底 ---
        softEnabled: false,
        // --- 大保底机制 ---
        useGuarantee: false,  
        // --- 井 ---
        sparkRules: [
            {
                limit: 40,
                type: "once",
                targetType: "any_gold",  // 必定出金！
                cancelOnHit: true,       // 前50抽若提前出金，自动作废
                noReset: false           // 重置垫抽（正常吃保底）
            },
            {
                limit: 80,
                type: "once",
                targetType: "up",  // 必定出金！
                cancelOnHit: true,       // 前50抽若提前出金，自动作废
                noReset: false           // 重置垫抽（正常吃保底）
            },
            {
                limit: 100,
                type: "once",
                targetType: "up",  // 必定出金！
                cancelOnHit: false,       // 前50抽若提前出金，自动作废
                noReset: false           // 重置垫抽（正常吃保底）
            },
            {
                limit: 180,
                type: "once",
                targetType: "up",  // 必定出金！
                cancelOnHit: false,       // 前50抽若提前出金，自动作废
                noReset: false           // 重置垫抽（正常吃保底）
            },
            {
                limit: 260,
                type: "once",
                targetType: "up",  // 必定出金！
                cancelOnHit: false,       // 前50抽若提前出金，自动作废
                noReset: false           // 重置垫抽（正常吃保底）
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
        sparkRules: [
            {
                limit: 300,
                type: "once",
                targetType: "any_gold",  // 必定出金！
                cancelOnHit: false,       // 前50抽若提前出金，自动作废
                noReset: true           // 重置垫抽（正常吃保底）
            }
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
            { 
                pulls: 10,                 
                tierId: 'tier_5',          
                resetOnHit: true,
                //enableUp: true,            
                //upMin: 2,                  // 🌟 最少选 2 个
                //upMax: 2,                  // 🌟 最多选 2 个
                //upCount: 2,                // 兼容旧字段，取上限
                //upRate: 0.5,               
                //useGuarantee: true,        
                //guaranteeLimit: 1          
            }
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