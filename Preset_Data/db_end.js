


//供复制：{ name: "", en: "", short: "", eshort: "", type: ["up","spec"], tierId: "tier_5", img:"" },
const END_CHAR = [
    // === 6星角色 (UP/限定/常驻) ===
    { id: "end_char_tier_6_016", name: "提弗洛斯", en: "Typhoeus", short: "提丰", eshort: "Typho", tag:"up", tierId: "tier_6", img: "img/END/char/6/提弗洛斯.png" },
    { id: "end_char_tier_6_015", name: "梨诺", en: "Liino", short: "梨诺", eshort: "Liino", tag:"up", tierId: "tier_6", img: "img/END/char/6/梨诺.png" },
    { id: "end_char_tier_6_014", name: "诀", en: "Arcane", short: "诀", eshort: "Arcan", tag:"up", tierId: "tier_6", img: "img/END/char/6/诀.png" },
    { id: "end_char_tier_6_013", name: "卡缪", en: "Camille", short: "卡缪", eshort: "Camil", tag:"up", tierId: "tier_6", img: "img/END/char/6/卡缪.png" },
    { id: "end_char_tier_6_012", name: "弭弗", en: "Mi Fu", short: "弭弗", eshort: "Mi Fu", tag:"up", tierId: "tier_6", img: "img/END/char/6/弭弗.png" },
    { id: "end_char_tier_6_011", name: "庄方宜", en: "Zhuang Fangyi", short: "庄", eshort: "Zuang", tag:"up", tierId: "tier_6", img: "img/END/char/6/庄方宜.png" },
    { id: "end_char_tier_6_010", name: "洛茜", en: "Rossi", short: "洛", eshort: "Rossi", tag:"up", tierId: "tier_6", img: "img/END/char/6/洛茜.png" },
    { id: "end_char_tier_6_009", name: "汤汤", en: "Tangtang", short: "汤", eshort: "Tang", tag:"up", tierId: "tier_6", img: "img/END/char/6/汤汤.png" },
    { id: "end_char_tier_6_008", name: "伊冯", en: "Yvonne", short: "伊", eshort: "Yvon", tag:"up", tierId: "tier_6", img: "img/END/char/6/伊冯.png" },
    { id: "end_char_tier_6_007", name: "洁尔佩塔", en: "Gilberta", short: "杰哥", eshort: "Gilbe", tag:"up", tierId: "tier_6", img: "img/END/char/6/洁尔佩塔.png" },
    { id: "end_char_tier_6_006", name: "莱万汀", en: "Laevatain", short: "莱", eshort: "Leava", tag:"up", tierId: "tier_6", img: "img/END/char/6/莱万汀.png" },

    { id: "end_char_tier_6_005", name: "骏卫", en: "Pogranichnik", short: "骏", eshort: "Pogra", tag:"std", tierId: "tier_6", img: "img/END/char/6/骏卫.png" },
    { id: "end_char_tier_6_004", name: "余烬", en: "Ember", short: "余", eshort: "Ember", tag:"std", tierId: "tier_6", img: "img/END/char/6/余烬.png" },
    { id: "end_char_tier_6_003", name: "别礼", en: "Last Rite", short: "礼", eshort: "LRite", tag:"std", tierId: "tier_6", img: "img/END/char/6/别礼.png" },
    { id: "end_char_tier_6_002", name: "黎风", en: "Lifeng", short: "黎", eshort: "Lfeng", tag:"std", tierId: "tier_6", img: "img/END/char/6/黎风.png" },
    { id: "end_char_tier_6_001", name: "艾尔黛拉", en: "Ardelia", short: "羊", eshort: "Alde", tag:"std", tierId: "tier_6", img: "img/END/char/6/艾尔黛拉.png" },

    // === 5星角色 (tier_5) ===
    { id: "end_char_tier_5_009", name: "大潘", en: "Da Pan", short: "大潘", eshort: "DaPan", tag:"normal", tierId: "tier_5", img: "img/END/char/5/大潘.png" },
    { id: "end_char_tier_5_008", name: "艾维文娜", en: "Avywenna", short: "艾维", eshort: "Avywe", tag:"normal", tierId: "tier_5", img: "img/END/char/5/艾维文娜.png" },
    { id: "end_char_tier_5_007", name: "佩丽卡", en: "Perlica", short: "鹈鹕", eshort: "Perli", tag:"normal", tierId: "tier_5", img: "img/END/char/5/佩丽卡.png" },
    { id: "end_char_tier_5_006", name: "弧光", en: "Arclight", short: "弧光", eshort: "Arcli", tag:"normal", tierId: "tier_5", img: "img/END/char/5/弧光.png" },
    { id: "end_char_tier_5_005", name: "阿列什", en: "Alesh", short: "列", eshort: "Alesh", tag:"normal", tierId: "tier_5", img: "img/END/char/5/阿列什.png" },
    { id: "end_char_tier_5_004", name: "陈千语", en: "Chen Qianyu", short: "啥龙", eshort: "Chen", tag:"normal", tierId: "tier_5", img: "img/END/char/5/陈千语.png" },
    { id: "end_char_tier_5_003", name: "昼雪", en: "Snowshine", short: "昼雪", eshort: "Snow", tag:"normal", tierId: "tier_5", img: "img/END/char/5/昼雪.png" },
    { id: "end_char_tier_5_002", name: "狼卫", en: "Wulfgard", short: "狼哥", eshort: "Wolf", tag:"normal", tierId: "tier_5", img: "img/END/char/5/狼卫.png" },
    { id: "end_char_tier_5_001", name: "赛希", en: "Xaihi", short: "赛希", eshort: "Xaihi", tag:"normal", tierId: "tier_5", img: "img/END/char/5/赛希.png" },
    { id: "end_char_tier_5_010", name: "噗切娜", en: "Purrchena", short: "大猫", eshort: "Purce", tag:"gift", tierId: "tier_5", img: "img/END/char/5/噗切娜.png" },

    // === 4星角色 (tier_4) ===
    { id: "end_char_tier_4_005", name: "卡契尔", en: "Catcher", short: "契尔", eshort: "Cat", tag:"normal", tierId: "tier_4", img: "img/END/char/4/卡契尔.png" },
    { id: "end_char_tier_4_004", name: "安塔尔", en: "Antal", short: "太子", eshort: "Antal", tag:"normal", tierId: "tier_4", img: "img/END/char/4/安塔尔.png" },
    { id: "end_char_tier_4_003", name: "秋栗", en: "Akekuri", short: "秋栗", eshort: "Kuri", tag:"normal", tierId: "tier_4", img: "img/END/char/4/秋栗.png" },
    { id: "end_char_tier_4_002", name: "埃特拉", en: "Estella", short: "埃", eshort: "Tella", tag:"normal", tierId: "tier_4", img: "img/END/char/4/埃特拉.png" },
    { id: "end_char_tier_4_001", name: "萤石", en: "Fluorite", short: "萤石", eshort: "Fluo", tag:"normal", tierId: "tier_4", img: "img/END/char/4/萤石.png" },
];

const END_WEAPON = [
    // === 六星：UP / 限定抽取 (wep_up) ===
    { id: "end_wep_tier_6_043", name: "寒夜幽影", en: "Umbra of Frigid Eventide", short: "提专", eshort: "Typho", tag:"up", tierId: "tier_6", img: "img/END/weapon/6/寒夜幽影.png" },
    { id: "end_wep_tier_6_041", name: "曜夜的首演", en: "Bedazzling Night Debut", short: "梨专", eshort: "Liino", tag:"up", tierId: "tier_6", img: "img/END/weapon/6/曜夜的首演.png" },
    { id: "end_wep_tier_6_039", name: "四二式·肃阵", en: "Type 42: Solemn Phalanx", short: "诀专", eshort: "Arcan", tag:"up", tierId: "tier_6", img: "img/END/weapon/6/四二式·肃阵.png" },
    { id: "end_wep_tier_6_036", name: "镀红祝福", en: "Blessing of Lustrous Carmine", short: "卡专", eshort: "Camil", tag:"up", tierId: "tier_6", img: "img/END/weapon/6/镀红祝福.png" },
    { id: "end_wep_tier_6_035", name: "赤缨", en: "Amaranthine Tassel", short: "弭专", eshort: "Mi Fu", tag:"up", tierId: "tier_6", img: "img/END/weapon/6/赤缨.png" },
    { id: "end_wep_tier_6_032", name: "孤舟", en: "Lone Barge", short: "庄专", eshort: "Zuang", tag:"up", tierId: "tier_6", img: "img/END/weapon/6/孤舟.png" },
    { id: "end_wep_tier_6_030", name: "狼之绯", en: "Lupine Scarlet", short: "洛专", eshort: "Rossi", tag:"up", tierId: "tier_6", img: "img/END/weapon/6/狼之绯.png" },
    { id: "end_wep_tier_6_029", name: "落草", en: "Brigand's Calling", short: "汤专", eshort: "Tang", tag:"up", tierId: "tier_6", img: "img/END/weapon/6/落草.png" },
    { id: "end_wep_tier_6_026", name: "艺术暴君", en: "Artzy Tyrannical", short: "伊专", eshort: "Yvon", tag:"up", tierId: "tier_6", img: "img/END/weapon/6/艺术暴君.png" },
    { id: "end_wep_tier_6_025", name: "使命必达", en: "Delivery Guaranteed", short: "杰专", eshort: "Gilbe", tag:"up", tierId: "tier_6", img: "img/END/weapon/6/使命必达.png" },
    { id: "end_wep_tier_6_024", name: "熔铸火焰", en: "Forgeborn Scathe", short: "莱专", eshort: "Leava", tag:"up", tierId: "tier_6", img: "img/END/weapon/6/熔铸火焰.png" },
    { id: "end_wep_tier_6_023", name: "不知归", en: "Never Rest", short: "骏专", eshort: "Pogra", tag:"up", tierId: "tier_6", img: "img/END/weapon/6/不知归.png" },
    { id: "end_wep_tier_6_022", name: "大雷斑", en: "Thunderberge", short: "余专", eshort: "Ember", tag:"up", tierId: "tier_6", img: "img/END/weapon/6/大雷斑.png" },
    { id: "end_wep_tier_6_021", name: "赫拉芬格", en: "Khravengger", short: "礼专", eshort: "LRite", tag:"up", tierId: "tier_6", img: "img/END/weapon/6/赫拉芬格.png" },
    { id: "end_wep_tier_6_020", name: "负山", en: "Mountain Bearer", short: "黎专", eshort: "Lfeng", tag:"up", tierId: "tier_6", img: "img/END/weapon/6/负山.png" },
    { id: "end_wep_tier_6_019", name: "沧溟星梦", en: "Dreams of the Starry Beach", short: "羊专", eshort: "Alde", tag:"up", tierId: "tier_6", img: "img/END/weapon/6/沧溟星梦.png" },

    // === 六星：常驻抽取 (wep_std) ===
    { id: "end_wep_tier_6_018", name: "骑士精神", en: "Chivalric Virtues", short: "骑士", eshort: "Chiv", tag:"std", tierId: "tier_6", img: "img/END/weapon/6/骑士精神.png" },
    { id: "end_wep_tier_6_017", name: "遗忘", en: "Oblivion", short: "遗忘", eshort: "Obli", tag:"std", tierId: "tier_6", img: "img/END/weapon/6/遗忘.png" },
    { id: "end_wep_tier_6_016", name: "爆破单元", en: "Detonation Unit", short: "爆破", eshort: "Deton", tag:"std", tierId: "tier_6", img: "img/END/weapon/6/爆破单元.png" },
    { id: "end_wep_tier_6_015", name: "同类相食", en: "Clannibal", short: "同类", eshort: "Clann", tag:"std", tierId: "tier_6", img: "img/END/weapon/6/同类相食.png" },
    { id: "end_wep_tier_6_014", name: "楔子", en: "Wedge", short: "契子", eshort: "Wedge", tag:"std", tierId: "tier_6", img: "img/END/weapon/6/楔子.png" },
    { id: "end_wep_tier_6_013", name: "J.E.T", en: "JET", short: "JET", eshort: "JET", tag:"std", tierId: "tier_6", img: "img/END/weapon/6/J.E.T.png" },
    { id: "end_wep_tier_6_012", name: "骁勇", en: "Valiant", short: "骁勇", eshort: "Valia", tag:"std", tierId: "tier_6", img: "img/END/weapon/6/骁勇.png" },
    { id: "end_wep_tier_6_011", name: "破碎君王", en: "Sundered Prince", short: "破碎", eshort: "Sunde", tag:"std", tierId: "tier_6", img: "img/END/weapon/6/破碎君王.png" },
    { id: "end_wep_tier_6_010", name: "昔日精品", en: "Former Finery", short: "昔日", eshort: "Forme", tag:"std", tierId: "tier_6", img: "img/END/weapon/6/昔日精品.png" },
    { id: "end_wep_tier_6_009", name: "典范", en: "Exemplar", short: "典范", eshort: "Exemp", tag:"std", tierId: "tier_6", img: "img/END/weapon/6/典范.png" },
    { id: "end_wep_tier_6_008", name: "白夜新星", en: "White Night Nova", short: "白夜", eshort: "WhitN", tag:"std", tierId: "tier_6", img: "img/END/weapon/6/白夜新星.png" },
    { id: "end_wep_tier_6_007", name: "显赫声名", en: "Eminent Repute", short: "显赫", eshort: "Emin", tag:"std", tierId: "tier_6", img: "img/END/weapon/6/显赫声名.png" },
    { id: "end_wep_tier_6_006", name: "热熔切割器", en: "Thermite Cutter", short: "热熔", eshort: "Therm", tag:"std", tierId: "tier_6", img: "img/END/weapon/6/热熔切割器.png" },
    { id: "end_wep_tier_6_005", name: "扶摇", en: "Rapid Ascent", short: "扶摇", eshort: "Rapid", tag:"std", tierId: "tier_6", img: "img/END/weapon/6/扶摇.png" },
    { id: "end_wep_tier_6_004", name: "宏愿", en: "Grand Vision", short: "宏愿", eshort: "Grand", tag:"std", tierId: "tier_6", img: "img/END/weapon/6/宏愿.png" },

    // === 六星：不可抽取 (大月卡 / 活动赠礼 wep_non) ===
    { id: "end_wep_tier_6_042", name: "苦难的尽头", en: "Suffering's End", short: "苦难", eshort: "Sufer", tag:"gift", tierId: "tier_6", img: "img/END/weapon/6/苦难的尽头.png" },
    { id: "end_wep_tier_6_038", name: "黄金时代", en: "Golden Age", short: "黄金", eshort: "Gold", tag:"gift", tierId: "tier_6", img: "img/END/weapon/6/黄金时代.png" },
    { id: "end_wep_tier_6_040", name: "遥望", en: "Farsight", short: "遥望", eshort: "Fars", tag:"gift", tierId: "tier_6", img: "img/END/weapon/6/遥望.png" },
    { id: "end_wep_tier_6_037", name: "联结点", en: "Junction Point", short: "联结", eshort: "Junc", tag:"gift", tierId: "tier_6", img: "img/END/weapon/6/联结点.png" },
    { id: "end_wep_tier_6_034", name: "灯火使命", en: "Beacon of Duty", short: "灯火", eshort: "Beaco", tag:"gift", tierId: "tier_6", img: "img/END/weapon/6/灯火使命.png" },
    { id: "end_wep_tier_6_033", name: "幻想苦痛", en: "Phantom Pain", short: "幻想", eshort: "Phan", tag:"gift", tierId: "tier_6", img: "img/END/weapon/6/幻想苦痛.png" },
    { id: "end_wep_tier_6_031", name: "雾中微光", en: "Flickers in the Mist", short: "雾光", eshort: "Flick", tag:"gift", tierId: "tier_6", img: "img/END/weapon/6/雾中微光.png" },
    { id: "end_wep_tier_6_028", name: "望乡", en: "Home Longing", short: "望乡", eshort: "Home", tag:"gift", tierId: "tier_6", img: "img/END/weapon/6/望乡.png" },
    { id: "end_wep_tier_6_027", name: "光荣记忆", en: "Glorious Memory", short: "光荣", eshort: "Glori", tag:"gift", tierId: "tier_6", img: "img/END/weapon/6/光荣记忆.png" },
    { id: "end_wep_tier_6_003", name: "黯色火炬", en: "Umbral Torch", short: "黯色", eshort: "Umbal", tag:"gift", tierId: "tier_6", img: "img/END/weapon/6/黯色火炬.png" },
    { id: "end_wep_tier_6_002", name: "领航员", en: "Navigator", short: "领航", eshort: "Navi", tag:"gift", tierId: "tier_6", img: "img/END/weapon/6/领航员.png" },
    { id: "end_wep_tier_6_001", name: "作品：蚀迹", en: "Opus: Etch Figure", short: "蚀迹", eshort: "Etch", tag:"gift", tierId: "tier_6", img: "img/END/weapon/6/作品：蚀迹.png" },

    // === 五星武器：抽取 (wep_5) ===
    { id: "end_wep_tier_5_021", name: "O.B.J.术识", en: "OBJ Arts Identifier", short: "术识", eshort: "OBJAI", tag:"normal", tierId: "tier_5", img: "img/END/weapon/5/O.B.J.术识.png" },
    { id: "end_wep_tier_5_020", name: "O.B.J.尖峰", en: "OBJ Razorhorn", short: "尖峰", eshort: "OBJRH", tag:"normal", tierId: "tier_5", img: "img/END/weapon/5/O.B.J.尖峰.png" },
    { id: "end_wep_tier_5_019", name: "O.B.J.迅极", en: "OBJ Velocitous", short: "迅极", eshort: "OBJVL", tag:"normal", tierId: "tier_5", img: "img/END/weapon/5/O.B.J.迅极.png" },
    { id: "end_wep_tier_5_018", name: "O.B.J.轻芒", en: "OBJ Edge of Lightness", short: "轻芒", eshort: "OBJEL", tag:"normal", tierId: "tier_5", img: "img/END/weapon/5/O.B.J.轻芒.png" },
    { id: "end_wep_tier_5_017", name: "O.B.J.重荷", en: "OBJ Heavy Burden", short: "重荷", eshort: "OBJHB", tag:"normal", tierId: "tier_5", img: "img/END/weapon/5/O.B.J.重荷.png" },
    { id: "end_wep_tier_5_016", name: "十二问", en: "Twelve Questions", short: "十二", eshort: "TWELV", tag:"normal", tierId: "tier_5", img: "img/END/weapon/5/十二问.png" },
    { id: "end_wep_tier_5_015", name: "古渠", en: "Ancient Canal", short: "古渠", eshort: "CANAL", tag:"normal", tierId: "tier_5", img: "img/END/weapon/5/古渠.png" },
    { id: "end_wep_tier_5_014", name: "布道自由", en: "Freedom to Proselytize", short: "布道", eshort: "FREED", tag:"normal", tierId: "tier_5", img: "img/END/weapon/5/布道自由.png" },
    { id: "end_wep_tier_5_013", name: "仰止", en: "Aspirant", short: "仰止", eshort: "ASPIR", tag:"normal", tierId: "tier_5", img: "img/END/weapon/5/仰止.png" },
    { id: "end_wep_tier_5_012", name: "向心之引", en: "Cohesive Traction", short: "向心", eshort: "COHES", tag:"normal", tierId: "tier_5", img: "img/END/weapon/5/向心之引.png" },
    { id: "end_wep_tier_5_011", name: "作品：众生", en: "Opus: The Living", short: "众生", eshort: "LIVIN", tag:"normal", tierId: "tier_5", img: "img/END/weapon/5/作品：众生.png" },
    { id: "end_wep_tier_5_010", name: "坚城铸造者", en: "Fortmaker", short: "坚城", eshort: "FORTM", tag:"normal", tierId: "tier_5", img: "img/END/weapon/5/坚城铸造者.png" },
    { id: "end_wep_tier_5_009", name: "终点之声", en: "Sundering Steel", short: "终点", eshort: "STEEL", tag:"normal", tierId: "tier_5", img: "img/END/weapon/5/终点之声.png" },
    { id: "end_wep_tier_5_008", name: "钢铁余音", en: "Stanza of Memorials", short: "余音", eshort: "STANZ", tag:"normal", tierId: "tier_5", img: "img/END/weapon/5/钢铁余音.png" },
    { id: "end_wep_tier_5_007", name: "迷失荒野", en: "Wild Wanderer", short: "荒野", eshort: "WILDW", tag:"normal", tierId: "tier_5", img: "img/END/weapon/5/迷失荒野.png" },
    { id: "end_wep_tier_5_006", name: "悼亡诗", en: "Elegy", short: "悼亡", eshort: "ELEGY", tag:"normal", tierId: "tier_5", img: "img/END/weapon/5/悼亡诗.png" },
    { id: "end_wep_tier_5_005", name: "探骊", en: "Seeker of Dark Lung", short: "探骊", eshort: "SEEKL", tag:"normal", tierId: "tier_5", img: "img/END/weapon/5/探骊.png" },
    { id: "end_wep_tier_5_004", name: "理性告别", en: "Rational Farewell", short: "告别", eshort: "RATIO", tag:"normal", tierId: "tier_5", img: "img/END/weapon/5/理性告别.png" },
    { id: "end_wep_tier_5_003", name: "莫奈何", en: "Monaihe", short: "奈何", eshort: "MONAI", tag:"normal", tierId: "tier_5", img: "img/END/weapon/5/莫奈何.png" },
    { id: "end_wep_tier_5_002", name: "逐麟3.0", en: "Finchaser 3.0", short: "逐麟", eshort: "FIN30", tag:"normal", tierId: "tier_5", img: "img/END/weapon/5/逐麟3.0.png" },
    { id: "end_wep_tier_5_001", name: "嵌合正义", en: "Chimeric Justice", short: "嵌合", eshort: "CHIME", tag:"normal", tierId: "tier_5", img: "img/END/weapon/5/嵌合正义.png" },

    // === 五星武器：不可抽取 (wep_non) ===
    { id: "end_wep_tier_5_022", name: "点心时刻", en: "Finishing Call", short: "点心", eshort: "FINCL", tag:"gift", tierId: "tier_5", img: "img/END/weapon/5/点心时刻.png" },

    // === 4星武器 (wep_4) ===
    { id: "end_wep_tier_4_010", name: "工业零点一", en: "Industry 0.1", short: "工业", eshort: "IND01", tag:"normal", tierId: "tier_4", img: "img/END/weapon/4/工业零点一.png" },
    { id: "end_wep_tier_4_009", name: "天使杀手", en: "Aggeloslayer", short: "杀手", eshort: "AGLOS", tag:"normal", tierId: "tier_4", img: "img/END/weapon/4/天使杀手.png" },
    { id: "end_wep_tier_4_008", name: "长路", en: "Long Road", short: "长路", eshort: "LROAD", tag:"normal", tierId: "tier_4", img: "img/END/weapon/4/长路.png" },
    { id: "end_wep_tier_4_007", name: "全自动骇新星", en: "Hypernova Auto", short: "骇星", eshort: "HYPER", tag:"normal", tierId: "tier_4", img: "img/END/weapon/4/全自动骇新星.png" },
    { id: "end_wep_tier_4_006", name: "寻路者道标", en: "Pathfinder's Beacon", short: "寻路", eshort: "PATHS", tag:"normal", tierId: "tier_4", img: "img/END/weapon/4/寻路者道标.png" },
    { id: "end_wep_tier_4_005", name: "呼啸守卫", en: "Howling Guard", short: "呼啸", eshort: "HWGRD", tag:"normal", tierId: "tier_4", img: "img/END/weapon/4/呼啸守卫.png" },
    { id: "end_wep_tier_4_004", name: "显锋", en: "Prominent Edge", short: "显锋", eshort: "PROME", tag:"normal", tierId: "tier_4", img: "img/END/weapon/4/显锋.png" },
    { id: "end_wep_tier_4_003", name: "浪潮", en: "Wave Tide", short: "浪潮", eshort: "TIDES", tag:"normal", tierId: "tier_4", img: "img/END/weapon/4/浪潮.png" },
    { id: "end_wep_tier_4_002", name: "淬火者", en: "Quencher", short: "淬火", eshort: "QUENC", tag:"normal", tierId: "tier_4", img: "img/END/weapon/4/淬火者.png" },
    { id: "end_wep_tier_4_001", name: "荧光雷羽", en: "Fluorescent Roc", short: "雷羽", eshort: "FLROC", tag:"normal", tierId: "tier_4", img: "img/END/weapon/4/荧光雷羽.png" },

    // === 3星武器 (wep_3) ===
    { id: "end_wep_tier_3_005", name: "吉米尼12", en: "Jiminy 12", short: "吉米", eshort: "JIM12", tag:"normal", tierId: "tier_3", img: "img/END/weapon/3/吉米尼12.png" },
    { id: "end_wep_tier_3_004", name: "达尔霍夫7", en: "Darhoff 7", short: "达尔", eshort: "DARH7", tag:"normal", tierId: "tier_3", img: "img/END/weapon/3/达尔霍夫7.png" },
    { id: "end_wep_tier_3_003", name: "佩科5", en: "Peco 5", short: "佩科", eshort: "PECO5", tag:"normal", tierId: "tier_3", img: "img/END/weapon/3/佩科5.png" },
    { id: "end_wep_tier_3_002", name: "奥佩罗77", en: "Opero 77", short: "奥佩", eshort: "OPR77", tag:"normal", tierId: "tier_3", img: "img/END/weapon/3/奥佩罗77.png" },
    { id: "end_wep_tier_3_001", name: "塔尔11", en: "Tarr 11", short: "塔尔", eshort: "TAR11", tag:"normal", tierId: "tier_3", img: "img/END/weapon/3/塔尔11.png" },
];

//无论上面怎么命名分类，最后这边都会被统一成一个大图鉴让代码能读信息
const END_DB = [...END_CHAR, ...END_WEAPON];

//  全局稀有度 (Tier) 定义
const END_GLOBAL_TIERS = [
    { id: 'tier_6', name: '6星', en:"6 Stars", color: '#e6533f',
        paint: { type: 'linear', angle: 135, stops: [
            { color: '#e6533f', position: 0 },
            { color: '#be3d34', position: 100 }
        ] }
    },
    { id: 'tier_5', name: '5星', en:"5 Stars", color: '#f1c40f' },
    { id: 'tier_4', name: '4星', en:"4 Stars", color: '#9b59b6' },
    { id: 'tier_3', name: '3星', en:"3 Stars", color: '#3498db' },
];

const END_SETUP_RULES = {
    icon: 'img/END/icon/game_icon.webp',
    gameName: "明日方舟：终末地",enGameName: "Arknight : Endfield",

    categories: [
        { id: 'char', name: '干员', en: 'Character', icon: "img/END/icon/干员.png" },
        { id: 'wep',  name: '武器', en: 'weapon', icon: "img/END/icon/武器.png" },
    ],

    tagDefinitions: {
        up: { name: "限定", en: "Limited", enShort: "Lim", color: "#f1c40f", textColor: "#000" },
        std: { name: "常驻", en: "Standard", enShort: "Std", color: "#3498db", textColor: "#fff" },
        normal: { name: "副产物", en: "Side Product", enShort: "Side", color: "#95a5a6", textColor: "#000" },
        gift: { name: "赠送", en: "Gift", enShort: "Gift", color: "#2ecc71", textColor: "#000" },
    },

};

// --- 货币与抽卡资源规则（资料与简化说明见 Preset_Data/CURRENCY_SOURCES.md） ---
const END_CURRENCY_RULES = {
    overflowRules: {char: 6, wep: 6},
    economy: {
        version: 1,
        unlockGroups: [],
        resources: [
            {id: "origeometry", name: "衍质源石", en: "Origeometry", icon: "img/END/icon/衍质源石.png"},
            {id: "oroberyl", name: "嵌晶玉", en: "Oroberyl", icon: "img/END/icon/嵌晶玉.png"},
            {id: "arsenal", name: "武库配额", en: "Arsenal Ticket", icon: "img/END/icon/武库配额.png"},
            {id: "chartered_permit", name: "特许寻访凭证", en: "Chartered Headhunting Permit", icon: "img/END/icon/特许寻访凭证.png"},
            {id: "basic_permit", name: "基础寻访凭证", en: "Basic Headhunting Permit", icon: "img/END/icon/基础寻访凭证.png"},
            {id: "bond_quota", name: "保障配额", en: "Bond Quota", icon: "img/END/icon/保障配额.png"},
            {id: "aic_quota", name: "集成配额", en: "AIC Quota", icon: "img/END/icon/集成配额.png"},
            {id: "endpoint_quota", name: "终点配额", en: "Endpoint Quota", icon: "img/END/icon/终点配额.png"}
        ],
        exchanges: [
            {id: "origeometry_to_oroberyl", name: "衍质源石兑换嵌晶玉", en: "Exchange Origeometry for Oroberyl", from: "origeometry", toIds: ["oroberyl"], mode: "fixed", cost: 1, gain: 75},
            {id: "origeometry_to_arsenal", name: "衍质源石兑换武库配额", en: "Exchange Origeometry for Arsenal Tickets", from: "origeometry", toIds: ["arsenal"], mode: "fixed", cost: 1, gain: 25},
            {id: "bond_to_permit", name: "保障配额兑换特许寻访凭证", en: "Exchange Bond Quota for Chartered permits", from: "bond_quota", toIds: ["chartered_permit"], mode: "fixed", cost: 25, gain: 1}
        ],
        payments: [
            {id: "oroberyl_pull", name: "嵌晶玉干员单抽", en: "Single Operator Headhunt with Oroberyl", resourceId: "oroberyl", cost: 500, pulls: 1, poolIds: ["char_up", "char_std"]},
            {id: "chartered_pull", name: "特许寻访凭证单抽", en: "Single Chartered Headhunt", resourceId: "chartered_permit", cost: 1, pulls: 1, poolIds: ["char_up"]},
            {id: "basic_pull", name: "基础寻访凭证单抽", en: "Single Basic Headhunt", resourceId: "basic_permit", cost: 1, pulls: 1, poolIds: ["char_std"]},
            {id: "arsenal_ten", name: "武库配额十连申领", en: "Ten-pull Arsenal Issue", resourceId: "arsenal", cost: 1980, pulls: 10, poolIds: ["wep_up"]}
        ],
        // 干员每次武库返还与首次/重复配额奖励同时生效；多余信物按立即兑换折算。
        // 当期集成配额折扣与信用商店浮动商品未写成月限购，详见资料说明。
        incomes: [
            {id: "arsenal_tier_6", name: "六星干员武库配额", en: "6-star Operator Arsenal Tickets", source: "byproduct", resourceId: "arsenal", categoryIds: ["char"], tierId: "tier_6", poolIds: ["char_up", "char_std"], tagIds: [], tagMatch: "any", condition: "always", amount: 2000},
            {id: "arsenal_tier_5", name: "五星干员武库配额", en: "5-star Operator Arsenal Tickets", source: "byproduct", resourceId: "arsenal", categoryIds: ["char"], tierId: "tier_5", poolIds: ["char_up", "char_std"], tagIds: [], tagMatch: "any", condition: "always", amount: 200},
            {id: "arsenal_tier_4", name: "四星干员武库配额", en: "4-star Operator Arsenal Tickets", source: "byproduct", resourceId: "arsenal", categoryIds: ["char"], tierId: "tier_4", poolIds: ["char_up", "char_std"], tagIds: [], tagMatch: "any", condition: "always", amount: 20},
            {id: "operator_first", name: "首次干员集成配额", en: "First Operator AIC Quota", source: "byproduct", resourceId: "aic_quota", categoryIds: ["char"], tierId: "", poolIds: ["char_up", "char_std"], tagIds: [], tagMatch: "any", condition: "first", amount: 30},
            {id: "bond_6_duplicate", name: "六星干员重复保障配额", en: "6-star duplicate Bond Quota", source: "byproduct", resourceId: "bond_quota", categoryIds: ["char"], tierId: "tier_6", poolIds: ["char_up", "char_std"], tagIds: [], tagMatch: "any", condition: "duplicate", amount: 50},
            {id: "bond_5_duplicate", name: "五星干员重复保障配额", en: "5-star duplicate Bond Quota", source: "byproduct", resourceId: "bond_quota", categoryIds: ["char"], tierId: "tier_5", poolIds: ["char_up", "char_std"], tagIds: [], tagMatch: "any", condition: "duplicate", amount: 10},
            {id: "token_4", name: "四星满潜信物折算集成配额", en: "Surplus 4-star token converted to AIC Quota", source: "byproduct", resourceId: "aic_quota", categoryIds: ["char"], tierId: "tier_4", poolIds: ["char_up", "char_std"], tagIds: [], tagMatch: "any", condition: "overflow", amount: 5},
            {id: "token_5", name: "五星满潜信物折算集成配额", en: "Surplus 5-star token converted to AIC Quota", source: "byproduct", resourceId: "aic_quota", categoryIds: ["char"], tierId: "tier_5", poolIds: ["char_up", "char_std"], tagIds: [], tagMatch: "any", condition: "overflow", amount: 20},
            {id: "token_6", name: "六星满潜信物折算终点配额", en: "Surplus 6-star token converted to Endpoint Quota", source: "byproduct", resourceId: "endpoint_quota", categoryIds: ["char"], tierId: "tier_6", poolIds: ["char_up", "char_std"], tagIds: [], tagMatch: "any", condition: "overflow", amount: 10},
            {id: "weapon_5", name: "五星武器集成配额", en: "5-star weapon AIC Quota", source: "byproduct", resourceId: "aic_quota", categoryIds: ["wep"], tierId: "tier_5", poolIds: ["wep_up"], tagIds: [], tagMatch: "any", condition: "always", amount: 10},
            {id: "weapon_6", name: "六星武器集成配额", en: "6-star weapon AIC Quota", source: "byproduct", resourceId: "aic_quota", categoryIds: ["wep"], tierId: "tier_6", poolIds: ["wep_up"], tagIds: [], tagMatch: "any", condition: "always", amount: 50},
            // 自定义入口的初始值，非游戏实际每日任务奖励。
            {id: "custom_oroberyl", name: "自定义获取嵌晶玉", en: "Custom Oroberyl income", source: "other", resourceId: "oroberyl", schedule: "unlimited", amount: 1}
        ]
    }
};

// --- 终末地：预设卡池概率规则 ---
const END_POOL_RULES = {
    // 特许寻访 (角色限定池)
    char_up: {
        countBonusPullsForRules: false,
        info: { name: "特许寻访", en: "Chartered Headhunting", icon: "img/END/icon/干员.png", badgeColor: "#f1c40f" },

        assembly: {
            tierRules: {
                tier_6: {
                    mode: 'up_split',
                    upCats: ['char'],
                    offrateCats: ['char'],
                    upTags: ['up'],
                    offrateTags: ['std', 'up']
                },
                tier_5: { mode: 'flat', flatCats: ['char'], tags: ['normal'] },
                tier_4: { mode: 'flat', flatCats: ['char'], tags: ['normal'] },
                tier_3: { mode: 'flat', flatCats: [], tags: [] }
            }
        },

        tiers: [
            { id: 'tier_6', prob: 0.8, isGold: true },
            { id: 'tier_5', prob: 8.0 },
            { id: 'tier_4', prob: 91.2 }
        ],

        pities: [
            {
                tierId: 'tier_6',
                pulls: 80,
                resetOnHit: true,
                enableUp: true,
                upRate: 0.5,
                useGuarantee: false,
                softEnabled: true,
                softRules: [
                    { start: 66, end: 79, inc: 0.05 }
                ]
            },
            {
                tierId: 'tier_5',
                pulls: 10,
                resetOnHit: true,
                enableUp: false,
                softEnabled: false
            }
        ],

        sparkRules: [
            {
                activation: { match: "all", counting: "reset", catchUp: "all", conditions: [] },
                expiration: { type: "target", scope: "after_unlock" },
                maxTriggers: null, 
                id: 'end_char_first_up', name: '前120抽首次UP保证', en: 'First UP within 120 pulls',
                limit: 120, 
                type: 'once', 
                targetType: 'random_up',
                noReset: false 
            },
            {
                activation: { match: "all", counting: "reset", catchUp: "all", conditions: [] },
                expiration: { type: "none", scope: "after_unlock" },
                maxTriggers: null, 
                id: 'end_char_token', name: '每240抽UP信物', en: 'UP token every 240 pulls', rewardKind: 'token',
                limit: 240, 
                type: 'loop', 
                targetType: 'random_up',
                deliverMode: 'selectable',
                noReset: true 
            }
        ],

        giftRules: [
            {
                activation: { match: "all", counting: "reset", catchUp: "all", conditions: [] },
                expiration: { type: "none", scope: "after_unlock" },
                maxTriggers: null, id: 'end_char_urgent', name: '30抽加急招募', en: 'Urgent recruitment at 30 pulls', trigger: 30, amount: 10, type: 'once', countPity: false, ownMinorPity: true, expiresOnRotation:true },
            {
                activation: { match: "all", counting: "reset", catchUp: "all", conditions: [] },
                expiration: { type: "none", scope: "after_unlock" },
                maxTriggers: null, id: 'end_char_dossier', name: '60抽情报书（下一期10抽）', en: 'Dossier at 60 pulls (10 pulls next period)', trigger: 60, amount: 10, type: 'once', countPity: true, countRules: true, nextPeriod: true }
        ],

        preSelect: {
            enabled: true,
            tiers: {
                tier_6: { upMin: 1, upMax: 1, stdMin: 7, stdMax: 7 },
                tier_5: { stdMin: 0, stdMax: 999 },
                tier_4: { stdMin: 0, stdMax: 999 }
            }
        },

        lifecycle: {
            allowRotation: true,
            sharedPityParent: "",
            rotationMatrix: {
                inheritPityPulls: true,       // 保留已垫抽数 (跨期继承)
                inheritGuaranteeState: false,  // 保留大保底/连歪进度 (跨期继承)
                resetSparkPity: true,         // 重置里程碑/井抽数进度
                resetGiftRules: true          // 重置赠送抽累计抽数
            }
        }
    },

    // 武库交易所 (武器限定池)
    wep_up: {
        info: { name: "武库交易所", en: "Arsenal Exchange", icon: "img/END/icon/武器.png", badgeColor: "#3498db" },

        assembly: {
            tierRules: {
                tier_6: {
                    mode: 'up_split',
                    upCats: ['wep'],
                    offrateCats: ['wep'],
                    upTags: ['up'],
                    offrateTags: ['std']
                },
                tier_5: { mode: 'flat', flatCats: ['wep'], tags: ['normal'] },
                tier_4: { mode: 'flat', flatCats: ['wep'], tags: ['normal'] },
                tier_3: { mode: 'flat', flatCats: ['wep'], tags: ['normal'] }
            }
        },

        tiers: [
            { id: 'tier_6', prob: 4.0, isGold: true },
            { id: 'tier_5', prob: 15.0 },
            { id: 'tier_4', prob: 81.0 },
        ],

        pities: [
            {
                tierId: 'tier_6',
                pulls: 40,
                resetOnHit: true,
                enableUp: true,
                upRate: 0.25,
                useGuarantee: false,
                softEnabled: false
            },
            {
                tierId: 'tier_5',
                pulls: 10,
                resetOnHit: true,
                enableUp: false,
                softEnabled: false
            }
        ],

        // Forty-pull pity is continuous. The first UP guarantee and cumulative
        // issue rewards are independent; early UP must not disable the latter.
        sparkRules: [
            {
                activation: { match: "all", counting: "reset", catchUp: "all", conditions: [] },
                expiration: { type: "target", scope: "after_unlock" },
                maxTriggers: null,id:'end_weapon_first_up',name:'前80抽首次UP保证',en:'First UP within 80 pulls',limit:80,type:'once',targetType:'random_up',noReset:false},
            {
                activation: { match: "all", counting: "reset", catchUp: "all", conditions: [] },
                expiration: { type: "none", scope: "after_unlock" },
                maxTriggers: null,id:'end_weapon_box_first',name:'100抽补充武库箱',en:'Arsenal crate at 100 pulls',limit:100,type:'once',targetType:'custom_filter',targetTier:'tier_6',targetCats:['wep'],targetTags:['std'],deliverMode:'selectable',noReset:true},
            {
                activation: { match: "all", counting: "reset", catchUp: "all", conditions: [] },
                expiration: { type: "none", scope: "after_unlock" },
                maxTriggers: null,id:'end_weapon_up_first',name:'180抽UP武器赠礼',en:'UP weapon at 180 pulls',limit:180,type:'once',targetType:'random_up',noReset:true},
            {
                expiration: { type: "none", scope: "after_unlock" },
                maxTriggers: null,id:'end_weapon_box_loop',name:'后续补充武库箱（每160抽）',en:'Later arsenal crates (160-pull cycle)',limit:160,type:'loop',targetType:'custom_filter',targetTier:'tier_6',targetCats:['wep'],targetTags:['std'],deliverMode:'selectable',noReset:true,activation:{match:'all',counting:'reset',conditions:[{type:'rule',ruleId:'end_weapon_box_first',count:1}]}},
            {
                expiration: { type: "none", scope: "after_unlock" },
                maxTriggers: null,id:'end_weapon_up_loop',name:'后续UP武器（每160抽）',en:'Later UP weapons (160-pull cycle)',limit:160,type:'loop',targetType:'random_up',noReset:true,activation:{match:'all',counting:'reset',conditions:[{type:'rule',ruleId:'end_weapon_up_first',count:1}]}}
        ],

        preSelect: {
            enabled: true,
            tiers: {
                tier_6: { upMin: 1, upMax: 1, stdMin: 6, stdMax: 6 }
            }
        },

        lifecycle: {
            allowRotation: true,
            sharedPityParent: "",
            rotationMatrix: {
                inheritPityPulls: false,       // 保留已垫抽数 (跨期继承)
                inheritGuaranteeState: false,  // 保留大保底/连歪进度 (跨期继承)
                resetSparkPity: true,         // 重置里程碑/井抽数进度
            }
        }
    },

    // 基础寻访 (常驻池)
    char_std: {
        info: { name: "基础寻访", en: "Basic Headhunting", icon: "img/END/icon/基础寻访凭证.png", badgeColor: "#95a5a6" },

        assembly: {
            tierRules: {
                tier_6: { mode: 'flat', flatCats: ['char'], tags: ['std'] },
                tier_5: { mode: 'flat', flatCats: ['char'], tags: ['normal'] },
                tier_4: { mode: 'flat', flatCats: ['char'], tags: ['normal'] }
            }
        },

        tiers: [
            { id: 'tier_6', prob: 0.8, isGold: true },
            { id: 'tier_5', prob: 8.0 },
            { id: 'tier_4', prob: 91.2 }
        ],

        pities: [
            {
                tierId: 'tier_6',
                pulls: 80,
                resetOnHit: true,
                enableUp: false,
                useGuarantee: false,
                softEnabled: true,
                softRules: [
                    { start: 66, end: 79, inc: 0.05 }
                ]
            },
            {
                tierId: 'tier_5',
                pulls: 10,
                resetOnHit: true,
                enableUp: false,
                softEnabled: false
            }
        ],

        sparkRules: [
            {
                activation: { match: "all", counting: "reset", catchUp: "all", conditions: [] },
                expiration: { type: "none", scope: "after_unlock" },
                maxTriggers: null,
                id: 'end_standard_selector', name: '300抽常驻六星自选', en: 'Standard 6-star selector at 300 pulls',
                limit: 300,
                type: "once",
                targetType: "custom_filter",
                targetTier: "tier_6",
                targetCats: ['char'],
                targetTags: ['std'],
                deliverMode: "selectable",
                noReset: true
            }
        ],

        preSelect: {
            enabled: true,
            tiers: {
                tier_6: { stdMin: 5, stdMax: 5 }
            }
        },

        lifecycle: {
            allowRotation: false
        }
    }
};
