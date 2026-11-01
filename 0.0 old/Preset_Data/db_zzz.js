// --- 绝区零：角色数据库 (全称) ---
//供复制：{ name: "", en: "", short: "", eshort: "", type: "up", star: 5, img:""},

const ZZZ_CHAR = [
    { name: "诺姆", en: "Norma", short: "诺姆", eshort: "Norma", type: "char_up", tierId: "tier_5",img: "../img/ZZZ/char/5/诺姆.webp" },
    { name: "维琳娜", en: "Velina", short: "维", eshort: "Velin", type: "char_up", tierId: "tier_5",img: "../img/ZZZ/char/5/维琳娜.webp" },
    { name: "星辉·比利", en: "Starlight - Billy", short: "星比", eshort: "SBily", type: "char_up", tierId: "tier_5",img: "../img/ZZZ/char/5/星辉·比利.webp" },
    { name: "普罗米娅", en: "Promeia", short: "普", eshort: "Prome", type: "char_up", tierId: "tier_5",img: "../img/ZZZ/char/5/普罗米娅.webp" },
    { name: "希希芙", en: "Cissia", short: "啥蛇", eshort: "Cisia", type: "char_up", tierId: "tier_5",img: "../img/ZZZ/char/5/希希芙.webp" },
    { name: "南宫羽", en: "Nangong Yu", short: "南", eshort: "NGong", type: "char_up", tierId: "tier_5", img: "../img/ZZZ/char/5/南宫羽.webp"},
    { name: "爱芮", en: "Aria", short: "爱", eshort: "Aria", type: "char_up", tierId: "tier_5", img: "../img/ZZZ/char/5/爱芮.webp" },
    { name: "千夏", en: "Sunna", short: "千", eshort: "Sunna", type: "char_up", tierId: "tier_5", img: "../img/ZZZ/char/5/千夏.webp" },
    { name: "叶瞬光", en: "Ye Shun Guang", short: "光", eshort: "YSunG", type: "char_up", tierId: "tier_5", img: "../img/ZZZ/char/5/叶瞬光.webp" },
    { name: "照", en: "Zhao", short: "照", eshort: "Zhao", type: "char_up", tierId: "tier_5", img: "../img/ZZZ/char/5/照.webp" },
    { name: "般岳", en: "Banyue", short: "般", eshort: "Bany", type: "char_up", tierId: "tier_5", img: "../img/ZZZ/char/5/般岳.webp" },
    { name: "琉音", en: "Diaiyn", short: "琉", eshort: "Diaiy", type: "char_up", tierId: "tier_5", img: "../img/ZZZ/char/5/琉音.webp" },
    { name: "伊德海莉", en: "Yidhari", short: "海", eshort: "Yidha", type: "char_up", tierId: "tier_5", img: "../img/ZZZ/char/5/伊德海莉.webp" },
    { name: "卢西亚", en: "Lucia", short: "卢", eshort: "Lucia", type: "char_up", tierId: "tier_5", img: "../img/ZZZ/char/5/卢西亚.webp" },
    { name: "奥菲斯&鬼火", en: "Orphie Magnusson & Magus", short: "奥", eshort: "Orphi", type: "char_up", tierId: "tier_5", img: "../img/ZZZ/char/5/奥菲斯&鬼火.webp" },
    { name: "希德", en: "Seed", short: "德", eshort: "Seed", type: "char_up", tierId: "tier_5", img: "../img/ZZZ/char/5/希德.webp" },
    { name: "爱丽丝", en: "Alice Thymefield", short: "爱", eshort: "Alice", type: "char_up", tierId: "tier_5", img: "../img/ZZZ/char/5/爱丽丝.webp" },
    { name: "浮波柚叶", en: "Ukinami Yuzuha", short: "柚", eshort: "Yuzu", type: "char_up", tierId: "tier_5", img:"../img/ZZZ/char/5/浮波柚叶.webp" },
    { name: "仪玄", en: "Yixuan", short: "仪", eshort: "Yxuan", type: "char_up", tierId: "tier_5", img:"../img/ZZZ/char/5/仪玄.webp" },
    { name: "橘福福", en: "Ju fufu", short: "橘", eshort: "Jufu", type: "char_up", tierId: "tier_5", img: "../img/ZZZ/char/5/橘福福.webp" },
    { name: "雨果", en: "Hugo Vlad", short: "雨", eshort: "Hugo", type: "char_up", tierId: "tier_5", img: "../img/ZZZ/char/5/雨果.webp" },
    { name: "薇薇安", en: "Vivian Banshee", short: "薇", eshort: "vian", type: "char_up", tierId: "tier_5", img: "../img/ZZZ/char/5/薇薇安.webp" },
    { name: "板机", en: "Trigger", short: "板", eshort: "Trig", type: "char_up", tierId: "tier_5", img: "../img/ZZZ/char/5/板机.webp" },
    { name: "零号·安比", en: "Soldier 0 - Anby", short: "0安", eshort: "0Anby", type: "char_up", tierId: "tier_5", img: "../img/ZZZ/char/5/零号·安比.webp" },
    { name: "伊芙琳", en: "Evelyn Chevalier", short: "伊", eshort: "Evely", type: "char_up", tierId: "tier_5", img: "../img/ZZZ/char/5/伊芙琳.webp" },
    { name: "耀嘉音", en: "Astra Yao", short: "耀", eshort: "Astra", type: "char_up", tierId: "tier_5", img: "../img/ZZZ/char/5/耀嘉音.webp" },
    { name: "浅羽 悠真", en: "Asaba Harumasa", short: "浅", eshort: "Asaba", type: "char_up", tierId: "tier_5", img: "../img/ZZZ/char/5/浅羽 悠真.webp" },
    { name: "星见 雅", en: "Hoshimi Miyabi", short: "雅", eshort: "Hoshi", type: "char_up", tierId: "tier_5", img: "../img/ZZZ/char/5/星见 雅.webp" },
    { name: "莱特", en: "Lighter", short: "莱", eshort: "Light", type: "char_up", tierId: "tier_5", img: "../img/ZZZ/char/5/莱特.webp" },
    { name: "月城 柳", en: "Tsukishiro Yanagi", short: "柳", eshort: "Yanag", type: "char_up", tierId: "tier_5", img: "../img/ZZZ/char/5/月城 柳.webp" },
    { name: "柏妮思", en: "Burnice White", short: "柏", eshort: "Burni", type: "char_up", tierId: "tier_5", img: "../img/ZZZ/char/5/柏妮思.webp" },
    { name: "凯撒", en: "Caesar King", short: "凯", eshort: "Caesa", type: "char_up", tierId: "tier_5", img: "../img/ZZZ/char/5/凯撒.webp" },
    { name: "简", en: "Jane Doe", short: "简", eshort: "Jane", type: "char_up", tierId: "tier_5", img: "../img/ZZZ/char/5/简.webp" },
    { name: "青衣", en: "Qingyi", short: "青", eshort: "QingY", type: "char_up", tierId: "tier_5", img: "../img/ZZZ/char/5/青衣.webp" },
    { name: "朱鸢", en: "Zhu Yuan", short: "鸢", eshort: "ZhuY", type: "char_up", tierId: "tier_5", img: "../img/ZZZ/char/5/朱鸢.webp" },
    { name: "艾莲", en: "Ellen Joe", short: "艾", eshort: "Ellen", type: "char_up", tierId: "tier_5", img: "../img/ZZZ/char/5/艾莲.webp" },




    
    { name: "丽娜", en: "Alexandrina Sebastiane", short: "丽", eshort: "rina", type: "char_std", tierId: "tier_5", img: "../img/ZZZ/char/5/丽娜.webp" },
    { name: "莱卡恩", en: "Von Lycaon", short: "狼", eshort: "Lyca", type: "char_std", tierId: "tier_5", img: "../img/ZZZ/char/5/莱卡恩.webp" },
    { name: "格莉丝", en: "Grace Howard", short: "格", eshort: "Grace", type: "char_std", tierId: "tier_5", img: "../img/ZZZ/char/5/格莉丝.webp" },
    { name: "珂蕾妲", en: "Koleda Belobog", short: "珂", eshort: "Kleda", type: "char_std", tierId: "tier_5", img: "../img/ZZZ/char/5/珂蕾妲.webp" },
    { name: "11号", en: "Soldier 11", short: "11", eshort: "11th", type: "char_std", tierId: "tier_5", img: "../img/ZZZ/char/5/11号.webp" },
    { name: "猫又", en: "Nekomiya Mana", short: "猫", eshort: "Neko", type: "char_std", tierId: "tier_5", img:"../img/ZZZ/char/5/猫又.webp" },
    ];

const ZZZ_WEAPON = [
    { name: "诺姆专属音擎", en: "Norma's Weapon", short: "诺专", eshort: "Norma", type: "wep_up", tierId: "tier_5"},
    { name: "维琳娜专属音擎", en: "Velina's Weapon", short: "维专", eshort: "Velin", type: "wep_up", tierId: "tier_5"},
    { name: "辉骑面铠", en: "Starlight Rider Faceplate", short: "比专", eshort: "SBily", type: "wep_up", tierId: "tier_5",img:"../img/ZZZ/weapon/5/辉骑面铠.webp"},
    { name: "朔月裁霜", en: "Frostrafall Sickle", short: "普专", eshort: "Prome", type: "wep_up", tierId: "tier_5",img:"../img/ZZZ/weapon/5/朔月裁霜.webp" },
    { name: "鳞齿寻踪", en: "Serpentine Seeker", short: "蛇专", eshort: "Cisia", type: "wep_up", tierId: "tier_5", img:"../img/ZZZ/weapon/5/鳞齿寻踪.webp" },
    { name: "霓虹妄想", en: "Neon Fantasies", short: "南专", eshort: "NGong", type: "wep_up", tierId: "tier_5", img:"../img/ZZZ/weapon/5/霓虹妄想.webp" },
    { name: "壳中之灵", en: "Angel in the Shell", short: "爱专", eshort: "Aria", type: "wep_up", tierId: "tier_5", img:"../img/ZZZ/weapon/5/壳中之灵.webp" },
    { name: "思络成歌", en: "Thoughtbop", short: "千专", eshort: "Sunna", type: "wep_up", tierId: "tier_5", img:"../img/ZZZ/weapon/5/思络成歌.webp" },
    { name: "云霓弧光", en: "Cloudcleave Radiance", short: "光专", eshort: "YSunG", type: "wep_up", tierId: "tier_5", img:"../img/ZZZ/weapon/5/云霓弧光.webp" },
    { name: "半糖雪兔", en: "Half-Sugar Bunny", short: "照专", eshort: "Zhao", type: "wep_up", tierId: "tier_5", img:"../img/ZZZ/weapon/5/半糖雪兔.webp" },
    { name: "怒目金刚", en: "Wrathful Vajra", short: "般专", eshort: "Bany", type: "wep_up", tierId: "tier_5", img:"../img/ZZZ/weapon/5/怒目金刚.webp" },
    { name: "昨夜来电", en: "Yesterday Calls", short: "琉专", eshort: "Diaiy", type: "wep_up", tierId: "tier_5", img:"../img/ZZZ/weapon/5/昨夜来电.webp" },
    { name: "海妖摇篮", en: "Kraken's Cradle", short: "海专", eshort: "Yisha", type: "wep_up", tierId: "tier_5", img:"../img/ZZZ/weapon/5/海妖摇篮.webp" },
    { name: "铸梦炉歌", en: "Dreamlit Hearth", short: "卢专", eshort: "Lucia", type: "wep_up", tierId: "tier_5", img:"../img/ZZZ/weapon/5/铸梦炉歌.webp" },
    { name: "嚣枪喧焰", en: "Bellicose Blaze", short: "奥专", eshort: "Orphi", type: "wep_up", tierId: "tier_5", img:"../img/ZZZ/weapon/5/嚣枪喧焰.webp" },
    { name: "机巧心种", en: "Cordis Germina", short: "德专", eshort: "Seed", type: "wep_up", tierId: "tier_5", img:"../img/ZZZ/weapon/5/机巧心种.webp" },
    { name: "十方锻星", en: "Pracriced Perfection", short: "爱专", eshort: "Alice", type: "wep_up", tierId: "tier_5", img:"../img/ZZZ/weapon/5/十方锻星.webp" },
    { name: "狸法七变化", en: "Metanukimorphosis", short: "柚专", eshort: "Yuzu", type: "wep_up", tierId: "tier_5", img:"../img/ZZZ/weapon/5/狸法七变化.webp" },
    { name: "福虓炉炉", en: "Roaring Fur-nace", short: "橘专", eshort: "Jufu", type: "wep_up", tierId: "tier_5", img:"../img/ZZZ/weapon/5/福虓炉炉.webp" },
    { name: "青溟笼舍", en: "Qingming Birdcage", short: "仪专", eshort: "Yxuan", type: "wep_up", tierId: "tier_5", img:"../img/ZZZ/weapon/5/青溟笼舍.webp" },
    { name: "千面日陨", en: "Myriad Eclipse", short: "雨专", eshort: "Hugo", type: "wep_up", tierId: "tier_5", img:"../img/ZZZ/weapon/5/千面日陨.webp" },
    { name: "飞鸟星梦", en: "Flight of Fancy", short: "薇专", eshort: "vian", type: "wep_up", tierId: "tier_5", img:"../img/ZZZ/weapon/5/飞鸟星梦.webp" },
    { name: "索魂影眸", en: "Spectral Gaze", short: "板专", eshort: "Trig", type: "wep_up", tierId: "tier_5", img:"../img/ZZZ/weapon/5/索魂影眸.webp" },
    { name: "牺牲洁纯", en: "Severed Innocence", short: "安专", eshort: "Anby", type: "wep_up", tierId: "tier_5", img:"../img/ZZZ/weapon/5/牺牲洁纯.webp" },
    { name: "心弦夜响", en: "Heartstring Nocturne", short: "伊专", eshort: "Evely", type: "wep_up", tierId: "tier_5", img:"../img/ZZZ/weapon/5/心弦夜响.webp" },
    { name: "玲珑妆匣", en: "Elegant Vanity", short: "耀专", eshort: "Astra", type: "wep_up", tierId: "tier_5", img:"../img/ZZZ/weapon/5/玲珑妆匣.webp" },
    { name: "残心青囊", en: "Zanshin Herb Case", short: "浅专", eshort: "Asaba", type: "wep_up", tierId: "tier_5", img:"../img/ZZZ/weapon/5/残心青囊.webp" },
    { name: "霞落星殿", en: "Hailstorm Shrine", short: "雅专", eshort: "Hoshi", type: "wep_up", tierId: "tier_5", img:"../img/ZZZ/weapon/5/霞落星殿.webp" },
    { name: "焰心桂冠", en: "Blazing Laurel", short: "莱专", eshort: "Light", type: "wep_up", tierId: "tier_5", img:"../img/ZZZ/weapon/5/焰心桂冠.webp" },
    { name: "时流贤者", en: "Timeweaver", short: "柳专", eshort: "Yanag", type: "wep_up", tierId: "tier_5", img:"../img/ZZZ/weapon/5/时流贤者.webp" },
    { name: "灼心摇壶", en: "Flamemaker Shaker", short: "柏专", eshort: "Burni", type: "wep_up", tierId: "tier_5", img:"../img/ZZZ/weapon/5/灼心摇壶.webp" },
    { name: "奔袭獠牙", en: "Tusks of Fury", short: "凯专", eshort: "Caesa", type: "wep_up", tierId: "tier_5", img:"../img/ZZZ/weapon/5/奔袭獠牙.webp" },
    { name: "淬锋钳刺", en: "Sharpened Stinger", short: "简专", eshort: "Jane", type: "wep_up", tierId: "tier_5", img:"../img/ZZZ/weapon/5/淬锋钳刺.webp" },
    { name: "玉壶青冰", en: "Ice-Jade Teapot", short: "青专", eshort: "QingY", type: "wep_up", tierId: "tier_5", img:"../img/ZZZ/weapon/5/玉壶青冰.webp" },
    { name: "防爆者VI型", en: "Riot Suppressor Mark VI", short: "鸢", eshort: "ZhuY", type: "wep_up", tierId: "tier_5", img:"../img/ZZZ/weapon/5/防爆者VI型.webp" },
    { name: "深海访客", en: "Deep Sea Visitor", short: "艾专", eshort: "Ellen", type: "wep_up", tierId: "tier_5", img:"../img/ZZZ/weapon/5/深海访客.webp" },



    { name: "啜泣摇篮", en: "Weeping Cradle", short: "丽专", eshort: "Lina", type: "wep_std", tierId: "tier_5", img:"../img/ZZZ/weapon/5/啜泣摇篮.webp" },
    { name: "拘缚者", en: "The Restrained", short: "狼专", eshort: "Lyca", type: "wep_std", tierId: "tier_5", img:"../img/ZZZ/weapon/5/拘缚者.webp" },
    { name: "嵌合编译器", en: "Fusion Compiler", short: "格专", eshort: "Grace", type: "wep_std", tierId: "tier_5", img:"../img/ZZZ/weapon/5/嵌合编译器.webp" },
    { name: "燃狱齿轮", en: "Hellfire Gears", short: "珂专", eshort: "Kleda", type: "wep_std", tierId: "tier_5", img:"../img/ZZZ/weapon/5/燃狱齿轮.webp" },
    { name: "硫磺石", en: "The Brimstone", short: "11专", eshort: "11th", type: "wep_std", tierId: "tier_5", img:"../img/ZZZ/weapon/5/硫磺石.webp" },
    { name: "钢铁肉垫", en: "Steel Cushion", short: "猫专", eshort: "Neko", type: "wep_std", tierId: "tier_5", img:"../img/ZZZ/weapon/5/钢铁肉垫.webp" },
]

const ZZZ_BANGBOO = [
    { name: "阿饭", en: "Biggest Fan", short: "饭", eshort: "Fan", type: "bangboo_up", tierId: "tier_5", img:"../img/ZZZ/bangboo/S/阿饭.webp"},
    { name: "芽芽", en: "", short: "芽", eshort: "", type: "bangboo_up", tierId: "tier_5", img:"../img/ZZZ/bangboo/S/芽芽.webp"},
    { name: "比克布利克", en: "Birkblick", short: "比", eshort: "Brik", type: "bangboo_up", tierId: "tier_5", img:"../img/ZZZ/bangboo/S/比克布利克.webp"},
    { name: "墨丘利", en: "Mercury", short: "墨", eshort: "Mercu", type: "bangboo_up", tierId: "tier_5", img:"../img/ZZZ/bangboo/S/墨丘利.webp"},
    { name: "爱丝弥小姐", en: "Miss Esme", short: "爱", eshort: "Esme", type: "bangboo_up", tierId: "tier_5", img:"../img/ZZZ/bangboo/S/爱丝弥小姐.webp"},
    { name: "狮耶", en: "Belion", short: "狮", eshort: "Blion", type: "bangboo_up", tierId: "tier_5", img:"../img/ZZZ/bangboo/S/狮耶.webp"},
    { name: "罗宾", en: "Robin", short: "罗", eshort: "Robi", type: "bangboo_up", tierId: "tier_5", img:"../img/ZZZ/bangboo/S/罗宾.webp"},
    { name: "咔嚓仔", en: "Snap", short: "咔", eshort: "Snap", type: "bangboo_up", tierId: "tier_5", img:"../img/ZZZ/bangboo/S/咔嚓仔.webp"},
    { name: "格列佛探员", en: "Agent Gulliver", short: "格", eshort: "Agent", type: "bangboo_up", tierId: "tier_5", img:"../img/ZZZ/bangboo/S/格列佛探员.webp"},
    { name: "赤红莫库斯", en: "Red Moccus", short: "赤", eshort: "Red", type: "bangboo_up", tierId: "tier_5", img:"../img/ZZZ/bangboo/S/赤红莫库斯.webp"},
    { name: "阿崔巡查", en: "Officer Cui", short: "崔", eshort: "OfCui", type: "bangboo_up", tierId: "tier_5", img:"../img/ZZZ/bangboo/S/阿崔巡查.webp"},
    { name: "鲨牙布", en: "Sharkboo", short: "鲨", eshort: "Shark", type: "bangboo_up", tierId: "tier_5", img:"../img/ZZZ/bangboo/S/鲨牙布.webp"},
    { name: "飙速布", en: "Rocketboo", short: "飙", eshort: "Rocket", type: "bangboo_up", tierId: "tier_5", img:"../img/ZZZ/bangboo/S/飙速布.webp"},
    { name: "插头布", en: "Plugboo", short: "插", eshort: "Plug", type: "bangboo_up", tierId: "tier_5", img:"../img/ZZZ/bangboo/S/插头布.webp"},
    { name: "共鸣布", en: "Resonaboo", short: "鸣", eshort: "Reson", type: "bangboo_up", tierId: "tier_5", img:"../img/ZZZ/bangboo/S/共鸣布.webp"},
    { name: "左轮布", en: "Bangvolver", short: "左", eshort: "vover", type: "bangboo_up", tierId: "tier_5", img:"../img/ZZZ/bangboo/S/左轮布.webp"},
    { name: "阿全", en: "Safety", short: "全", eshort: "Safe", type: "bangboo_up", tierId: "tier_5", img:"../img/ZZZ/bangboo/S/阿全.webp"},
    { name: "艾米莉安", en: "Amillion", short: "艾", eshort: "Amill", type: "bangboo_up", tierId: "tier_5", img:"../img/ZZZ/bangboo/S/艾米莉安.webp"},
    { name: "巴特勒", en: "Butler", short: "巴", eshort: "Butle", type: "bangboo_up", tierId: "tier_5", img:"../img/ZZZ/bangboo/S/巴特勒.webp"},

]

//无论上面怎么命名分类，最后这边都会被统一成一个大图鉴让代码能读信息
const ZZZ_DB = [...ZZZ_CHAR, ...ZZZ_WEAPON, ...ZZZ_BANGBOO];

//  全局稀有度 (Tier) 定义
const ZZZ_GLOBAL_TIERS = [
    { id: 'tier_5', name: '5', color: '#f1c40f' },
    { id: 'tier_4', name: '4', color: '#9b59b6' },
    { id: 'tier_3', name: '3', color: '#3498db' }
];

const ZZZ_SETUP_RULES = {
    gameName: "绝区零",enName: "Zenless Zone Zero",
    //  1. 动态积木池定义 (直接接管 custom_setup 的界面)
    rosterPools: [
        { id: 'char_up', name: '独家频段', en: "CHANNEL Exclusive", type: 'up' },
        { id: 'wep_up', name: '音擎频段', en: "CHANNEL W-Engine", type: 'up'},
        { id: 'bangboo_up', name: '邦布频段', en: "CHANNEL Bangboo", type: 'up'},
        { 
            id: 'char_std', name: '常驻代理人', en: "Regular Exclusive", type: 'std', 
            isStandalone: false,          // 是否开放侧栏独立抽取
            enableCustomUp: false,        //  是否允许模拟器拖拽自选UP
            enableSpecRate: false,        //  是否开启特限出货干预
        },
        { 
            id: 'wep_std', name: '常驻音擎', en: "Regular W-Engine", type: 'std', 
            isStandalone: false, 
            enableCustomUp: false, 
            enableSpecRate: false 
        }
    ],

     // 🌟 2. 多重混池定义 (取代旧版单一的 mixedStd)
    mixedPools: [
        { 
            id: 'mixed_std', 
            name: '常驻频段', 
            en: "CHANNEL Stable",
            components: ['char_std', 'wep_std'], // 融合上述哪些图鉴
            enableCustomUp: false                 // 混池也可以开启自选 UP
        }
    ],

    // 🌟 3. 限定池歪出流向判定 (key必须和上方的id对应)
    offRate: {
        'char_up': ['char_std', ], 
        'wep_up': ['wep_std'],
    }
}

// --- 预设卡池概率规则 ---
const ZZZ_POOL_RULES = {
    // 角色限定池
    char_up: {
        tiers: [
            { id: 'tier_5', prob: 0.6},
            { id: 'tier_4', prob: 9.4},
            { id: 'tier_3', prob: 90}
        ],
        // --- 目标金设定 ---
        targetGoldIds: ['tier_5'],
        // --- 副产物保底配置 ---
        minorPities: [
            { pulls: 10,tierId: 'tier_4',resetOnHit: true },
        ],
        // --- 保底与UP概率 ---
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
         // --- 模拟器预选数量限制设定 ---
        preSelect: {
            enabled: true,
            upMin: 1,
            upMax: 1,
            stdMin: 6,
            stdMax: 6
        },
    },
    // 音擎限定池
    wep_up: {
        tiers: [
            { id: 'tier_5', prob: 1},
            { id: 'tier_4', prob: 15},
            { id: 'tier_3', prob: 84}
        ],
        // --- 目标金设定 ---
        targetGoldIds: ['tier_5'],
        // --- 副产物保底配置 ---
        minorPities: [
            { pulls: 10,tierId: 'tier_4',resetOnHit: true },
        ],
        // --- 保底与UP概率 ---
        hardPity: 80,
        upRate: 0.75,
        // --- 分段式软保底 ---
        softEnabled: true,
        softRule: [
            {start: 63, end: 73, inc: 0.07 },
            { start: 74, end: 79, inc: 0.035 },
        ],
        // --- 大保底机制 ---
        useGuarantee: true, 
        guaranteeLimit: 1, 
         // --- 模拟器预选数量限制设定 ---
        preSelect: {
            enabled: true,
            upMin: 1,
            upMax: 1,
            stdMin: 6,
            stdMax: 6
        },
    },
    // 邦布池
    bangboo_up: {
       tiers: [
            { id: 'tier_5', prob: 1},
            { id: 'tier_4', prob: 15},
            { id: 'tier_3', prob: 84}
        ],
        // --- 目标金设定 ---
        targetGoldIds: ['tier_5'],
        // --- 副产物保底配置 ---
        minorPities: [
            { pulls: 10,tierId: 'tier_4',resetOnHit: true },
        ],
        // --- 保底与UP概率 ---
        hardPity: 80,
        // --- 分段式软保底 ---
        softEnabled: true,
        softRule: [
            {start: 63, end: 73, inc: 0.07 },
            { start: 74, end: 79, inc: 0.035 },
        ],
        // --- 大保底机制 ---
        useGuarantee: false, 
         // --- 模拟器预选数量限制设定 ---
        preSelect: {
            enabled: true,
            upMin: 1,
            upMax: 1,
            stdMin: 0,
            stdMax: 0
        },
    },
     // 常驻池
    mixed_std: {
        tiers: [
            { id: 'tier_5', prob: 0.6},
            { id: 'tier_4', prob: 9.4},
            { id: 'tier_3', prob: 90}
        ],
        // --- 目标金设定 ---
        targetGoldIds: ['tier_5'],
        // --- 副产物保底配置 ---
        minorPities: [
            { pulls: 10,tierId: 'tier_4',resetOnHit: true },
        ],
        // --- 保底与UP概率 ---
        hardPity: 90,
        // --- 分段式软保底 ---
        softEnabled: true,
        softRule: [
            { start: 74, end: 89, inc: 0.06 },
        ],
        // --- 大保底机制 ---
        useGuarantee: false,  
         // --- 模拟器预选数量限制设定 ---
        preSelect: {
            enabled: true,
            upMin: 0,
            upMax: 0,
            stdMin: 12,
            stdMax: 12
        },
    },
};