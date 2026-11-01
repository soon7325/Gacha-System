// --- 绝区零：角色数据库 (全称) ---
//供复制：{ name: "", en: "", short: "", eshort: "", type: "up", star: 5, img:""},

const ZZZ_CHAR = [
    { name: "克拉蕾", en: "Claret", short: "克拉", eshort: "Clare", type: "char_up", tierId: "tier_S",img: "../img/ZZZ/char5/克拉蕾.webp" },
    { name: "希格利德", en: "Sigrid de", short: "啥马", eshort: "Sigri", type: "char_up", tierId: "tier_S",img: "../img/ZZZ/char5/希格利德.webp" },
    { name: "蕾米埃尔", en: "Remielle Dan", short: "蕾米", eshort: "Remie", type: "char_up", tierId: "tier_S",img: "../img/ZZZ/char5/蕾米埃尔.webp" },
    { name: "诺姆", en: "Norma", short: "诺姆", eshort: "Norma", type: "char_up", tierId: "tier_S",img: "../img/ZZZ/char5/诺姆.webp" },
    { name: "维琳娜", en: "Velina", short: "维", eshort: "Velin", type: "char_up", tierId: "tier_S",img: "../img/ZZZ/char5/维琳娜.webp" },
    { name: "星辉·比利", en: "Starlight - Billy", short: "星比", eshort: "SBily", type: "char_up", tierId: "tier_S",img: "../img/ZZZ/char5/星辉·比利.webp" },
    { name: "普罗米娅", en: "Promeia", short: "普", eshort: "Prome", type: "char_up", tierId: "tier_S",img: "../img/ZZZ/char5/普罗米娅.webp" },
    { name: "希希芙", en: "Cissia", short: "啥蛇", eshort: "Cisia", type: "char_up", tierId: "tier_S",img: "../img/ZZZ/char5/希希芙.webp" },
    { name: "南宫羽", en: "Nangong Yu", short: "南", eshort: "NGong", type: "char_up", tierId: "tier_S", img: "../img/ZZZ/char5/南宫羽.webp"},
    { name: "爱芮", en: "Aria", short: "爱", eshort: "Aria", type: "char_up", tierId: "tier_S", img: "../img/ZZZ/char5/爱芮.webp" },
    { name: "千夏", en: "Sunna", short: "千", eshort: "Sunna", type: "char_up", tierId: "tier_S", img: "../img/ZZZ/char5/千夏.webp" },
    { name: "叶瞬光", en: "Ye Shun Guang", short: "光", eshort: "YSunG", type: "char_up", tierId: "tier_S", img: "../img/ZZZ/char5/叶瞬光.webp" },
    { name: "照", en: "Zhao", short: "照", eshort: "Zhao", type: "char_up", tierId: "tier_S", img: "../img/ZZZ/char5/照.webp" },
    { name: "般岳", en: "Banyue", short: "般", eshort: "Bany", type: "char_up", tierId: "tier_S", img: "../img/ZZZ/char5/般岳.webp" },
    { name: "琉音", en: "Diaiyn", short: "琉", eshort: "Diaiy", type: ["char_up","char_up_2"], tierId: "tier_S", img: "../img/ZZZ/char5/琉音.webp" },
    { name: "伊德海莉", en: "Yidhari", short: "海", eshort: "Yidha", type: "char_up", tierId: "tier_S", img: "../img/ZZZ/char5/伊德海莉.webp" },
    { name: "卢西亚", en: "Lucia", short: "卢", eshort: "Lucia", type: "char_up", tierId: "tier_S", img: "../img/ZZZ/char5/卢西亚.webp" },
    { name: "奥菲斯&鬼火", en: "Orphie Magnusson & Magus", short: "奥", eshort: "Orphi", type: "char_up", tierId: "tier_S", img: "../img/ZZZ/char5/奥菲斯&鬼火.webp" },
    { name: "希德", en: "Seed", short: "德", eshort: "Seed", type: "char_up", tierId: "tier_S", img: "../img/ZZZ/char5/希德.webp" },
    { name: "爱丽丝", en: "Alice Thymefield", short: "爱", eshort: "Alice", type: ["char_up","char_up_2"], tierId: "tier_S", img: "../img/ZZZ/char5/爱丽丝.webp" },
    { name: "浮波柚叶", en: "Ukinami Yuzuha", short: "柚", eshort: "Yuzu", type: ["char_up","char_up_2"], tierId: "tier_S", img: "../img/ZZZ/char5/浮波柚叶.webp" },
    { name: "仪玄", en: "Yixuan", short: "仪", eshort: "Yxuan", type: "char_up", tierId: "tier_S", img: "../img/ZZZ/char5/仪玄.webp" },
    { name: "橘福福", en: "Ju fufu", short: "橘", eshort: "Jufu", type: "char_up", tierId: "tier_S", img: "../img/ZZZ/char5/橘福福.webp" },
    { name: "雨果", en: "Hugo Vlad", short: "雨", eshort: "Hugo", type: "char_up", tierId: "tier_S", img: "../img/ZZZ/char5/雨果.webp" },
    { name: "薇薇安", en: "Vivian Banshee", short: "薇", eshort: "vian", type: "char_up", tierId: "tier_S", img: "../img/ZZZ/char5/薇薇安.webp" },
    { name: "板机", en: "Trigger", short: "板", eshort: "Trig", type: "char_up", tierId: "tier_S", img: "../img/ZZZ/char5/板机.webp" },
    { name: "零号·安比", en: "Soldier 0 - Anby", short: "0安", eshort: "0Anby", type: ["char_up","char_up_2"], tierId: "tier_S", img: "../img/ZZZ/char5/零号·安比.webp" },
    { name: "伊芙琳", en: "Evelyn Chevalier", short: "伊", eshort: "Evely", type: "char_up", tierId: "tier_S", img: "../img/ZZZ/char5/伊芙琳.webp" },
    { name: "耀嘉音", en: "Astra Yao", short: "耀", eshort: "Astra", type: ["char_up","char_up_2"], tierId: "tier_S", img: "../img/ZZZ/char5/耀嘉音.webp" },
    { name: "浅羽 悠真", en: "Asaba Harumasa", short: "浅", eshort: "Asaba", type: ["char_up","char_up_2"], tierId: "tier_S", img: "../img/ZZZ/char5/浅羽 悠真.webp" },
    { name: "星见 雅", en: "Hoshimi Miyabi", short: "雅", eshort: "Hoshi", type: "char_up", tierId: "tier_S", img: "../img/ZZZ/char5/星见 雅.webp" },
    { name: "莱特", en: "Lighter", short: "莱", eshort: "Light", type: "char_up", tierId: "tier_S", img: "../img/ZZZ/char5/莱特.webp" },
    { name: "月城 柳", en: "Tsukishiro Yanagi", short: "柳", eshort: "Yanag", type: ["char_up","char_std_2"], tierId: "tier_S", img: "../img/ZZZ/char5/月城 柳.webp" },
    { name: "柏妮思", en: "Burnice White", short: "柏", eshort: "Burni", type: "char_up", tierId: "tier_S", img: "../img/ZZZ/char5/柏妮思.webp" },
    { name: "凯撒", en: "Caesar King", short: "凯", eshort: "Caesa", type: ["char_up","char_std_2"], tierId: "tier_S", img: "../img/ZZZ/char5/凯撒.webp" },
    { name: "简", en: "Jane Doe", short: "简", eshort: "Jane", type: "char_up", tierId: "tier_S", img: "../img/ZZZ/char5/简.webp" },
    { name: "青衣", en: "Qingyi", short: "青", eshort: "QingY", type: "char_up", tierId: "tier_S", img: "../img/ZZZ/char5/青衣.webp" },
    { name: "朱鸢", en: "Zhu Yuan", short: "鸢", eshort: "ZhuY", type: ["char_up","char_std_2"], tierId: "tier_S", img: "../img/ZZZ/char5/朱鸢.webp" },
    { name: "艾莲", en: "Ellen Joe", short: "艾", eshort: "Ellen", type: "char_up", tierId: "tier_S", img: "../img/ZZZ/char5/艾莲.webp" },

    // --- 5星常驻角色---
    { name: "丽娜", en: "Alexandrina Sebastiane", short: "丽", eshort: "rina", type: "char_std", tierId: "tier_S", img: "../img/ZZZ/char5/丽娜.webp" },
    { name: "莱卡恩", en: "Von Lycaon", short: "狼", eshort: "Lyca", type: "char_std", tierId: "tier_S", img: "../img/ZZZ/char5/莱卡恩.webp" },
    { name: "格莉丝", en: "Grace Howard", short: "格", eshort: "Grace", type: "char_std", tierId: "tier_S", img: "../img/ZZZ/char5/格莉丝.webp" },
    { name: "珂蕾妲", en: "Koleda Belobog", short: "珂", eshort: "Kleda", type: "char_std", tierId: "tier_S", img: "../img/ZZZ/char5/珂蕾妲.webp" },
    { name: "11号", en: "Soldier 11", short: "11", eshort: "11th", type: "char_std", tierId: "tier_S", img: "../img/ZZZ/char5/11号.webp" },
    { name: "猫又", en: "Nekomiya Mana", short: "猫", eshort: "Neko", type: "char_std", tierId: "tier_S", img: "../img/ZZZ/char5/猫又.webp" },

    // --- 赠送5星角色---
    { name: "佩洛伊斯", en: "Pyrois", short: "嘉豪", eshort: "Pyro", type: "char_non", tierId: "tier_S",img: "../img/ZZZ/char5/佩洛伊斯.webp" },

    // --- 4星角色追加---
    { name: "比利", en: "Billy Kid", short: "比利", eshort: "Billy", type: ["char_wep", "char_A"], tierId: "tier_A", img: "../img/ZZZ/char4/比利.webp" },
    { name: "可琳", en: "Corin Wickes", short: "可琳", eshort: "Corin", type: ["char_wep", "char_A"], tierId: "tier_A", img: "../img/ZZZ/char4/可琳.webp" },
    { name: "本", en: "Ben Bigger", short: "本", eshort: "Ben", type: ["char_wep", "char_A"], tierId: "tier_A", img: "../img/ZZZ/char4/本.webp" },
    { name: "安比", en: "Anby Demara", short: "安比", eshort: "Anby", type: ["char_wep", "char_A"], tierId: "tier_A", img: "../img/ZZZ/char4/安比.webp" },
    { name: "安东", en: "Anton Ivanov", short: "安东", eshort: "Anton", type: ["char_wep", "char_A"], tierId: "tier_A", img: "../img/ZZZ/char4/安东.webp" },
    { name: "妮可", en: "Nicole Demara", short: "妮可", eshort: "Nicol", type: ["char_wep", "char_A"], tierId: "tier_A", img: "../img/ZZZ/char4/妮可.webp" },
    { name: "波可娜", en: "Pulchra Fellini", short: "波喵", eshort: "Pulch", type: ["char_wep", "char_A"], tierId: "tier_A", img: "../img/ZZZ/char4/波可娜.webp" },
    { name: "派派", en: "Piper Wheel", short: "派派", eshort: "Piper", type: ["char_wep", "char_A"], tierId: "tier_A", img: "../img/ZZZ/char4/派派.webp" },
    { name: "真斗", en: "Komano Manato", short: "真斗", eshort: "Manat", type: ["char_wep", "char_A"], tierId: "tier_A", img: "../img/ZZZ/char4/真斗.webp" },
    { name: "苍角", en: "Soukaku", short: "苍角", eshort: "Souka", type: ["char_wep", "char_A"], tierId: "tier_A", img: "../img/ZZZ/char4/苍角.webp" },
    { name: "塞斯", en: "Seth Lowell", short: "塞斯", eshort: "Seth", type: ["char_wep", "char_A"], tierId: "tier_A", img: "../img/ZZZ/char4/塞斯.webp" },
    { name: "潘引壶", en: "Pan Yinhu", short: "熊猫", eshort: "Yinhu", type: ["char_wep", "char_A"], tierId: "tier_A", img: "../img/ZZZ/char4/潘引壶.webp" },
    { name: "露西", en: "Luciana de Montefio", short: "露西", eshort: "Lucy", type: ["char_wep", "char_A"], tierId: "tier_A", img: "../img/ZZZ/char4/露西.webp" },
    ];

const ZZZ_WEAPON = [
    { name: "猩红渴望", en: "Crimson Thirst", short: "克专", eshort: "Clare", type: "wep_up", tierId: "tier_S",img: "../img/ZZZ/weapon/5/猩红渴望.webp"},
    { name: "骁骑礼赞", en: "Knight's Extolment", short: "马专", eshort: "Sigri", type: "wep_up", tierId: "tier_S",img: "../img/ZZZ/weapon/5/骁骑礼赞.webp"},
    { name: "空羽复归之诗", en: "Ode Of Resurrected Wings", short: "蕾专", eshort: "Remie", type: "wep_up", tierId: "tier_S",img: "../img/ZZZ/weapon/5/空羽复归之诗.webp"},
    { name: "首席跟班", en: "Chief Sidekick", short: "诺专", eshort: "Norma", type: "wep_up", tierId: "tier_S",img: "../img/ZZZ/weapon/5/首席跟班.webp"},
    { name: "琳琅鎏心", en: "Joyau Dore", short: "维专", eshort: "Velin", type: "wep_up", tierId: "tier_S",img: "../img/ZZZ/weapon/5/琳琅鎏心.webp"},
    { name: "辉骑面铠", en: "Starlight Rider Faceplate", short: "比专", eshort: "SBily", type: "wep_up", tierId: "tier_S",img: "../img/ZZZ/weapon/5/辉骑面铠.webp"},
    { name: "朔月裁霜", en: "Frostrafall Sickle", short: "普专", eshort: "Prome", type: "wep_up", tierId: "tier_S",img: "../img/ZZZ/weapon/5/朔月裁霜.webp" },
    { name: "鳞齿寻踪", en: "Serpentine Seeker", short: "蛇专", eshort: "Cisia", type: "wep_up", tierId: "tier_S", img: "../img/ZZZ/weapon/5/鳞齿寻踪.webp" },
    { name: "霓虹妄想", en: "Neon Fantasies", short: "南专", eshort: "NGong", type: "wep_up", tierId: "tier_S", img: "../img/ZZZ/weapon/5/霓虹妄想.webp" },
    { name: "壳中之灵", en: "Angel in the Shell", short: "爱专", eshort: "Aria", type: "wep_up", tierId: "tier_S", img: "../img/ZZZ/weapon/5/壳中之灵.webp" },
    { name: "思络成歌", en: "Thoughtbop", short: "千专", eshort: "Sunna", type: "wep_up", tierId: "tier_S", img: "../img/ZZZ/weapon/5/思络成歌.webp" },
    { name: "云霓弧光", en: "Cloudcleave Radiance", short: "光专", eshort: "YSunG", type: "wep_up", tierId: "tier_S", img: "../img/ZZZ/weapon/5/云霓弧光.webp" },
    { name: "半糖雪兔", en: "Half-Sugar Bunny", short: "照专", eshort: "Zhao", type: "wep_up", tierId: "tier_S", img: "../img/ZZZ/weapon/5/半糖雪兔.webp" },
    { name: "怒目金刚", en: "Wrathful Vajra", short: "般专", eshort: "Bany", type: "wep_up", tierId: "tier_S", img: "../img/ZZZ/weapon/5/怒目金刚.webp" },
    { name: "昨夜来电", en: "Yesterday Calls", short: "琉专", eshort: "Diaiy", type: ["wep_up","wep_up_2"], tierId: "tier_S", img: "../img/ZZZ/weapon/5/昨夜来电.webp" },
    { name: "海妖摇篮", en: "Kraken's Cradle", short: "海专", eshort: "Yisha", type: "wep_up", tierId: "tier_S", img: "../img/ZZZ/weapon/5/海妖摇篮.webp" },
    { name: "铸梦炉歌", en: "Dreamlit Hearth", short: "卢专", eshort: "Lucia", type: "wep_up", tierId: "tier_S", img: "../img/ZZZ/weapon/5/铸梦炉歌.webp" },
    { name: "嚣枪喧焰", en: "Bellicose Blaze", short: "奥专", eshort: "Orphi", type: "wep_up", tierId: "tier_S", img: "../img/ZZZ/weapon/5/嚣枪喧焰.webp" },
    { name: "机巧心种", en: "Cordis Germina", short: "德专", eshort: "Seed", type: "wep_up", tierId: "tier_S", img: "../img/ZZZ/weapon/5/机巧心种.webp" },
    { name: "十方锻星", en: "Pracriced Perfection", short: "爱专", eshort: "Alice", type: ["wep_up","wep_up_2"], tierId: "tier_S", img: "../img/ZZZ/weapon/5/十方锻星.webp" },
    { name: "狸法七变化", en: "Metanukimorphosis", short: "柚专", eshort: "Yuzu", type: ["wep_up","wep_up_2"], tierId: "tier_S", img: "../img/ZZZ/weapon/5/狸法七变化.webp" },
    { name: "福虓炉炉", en: "Roaring Fur-nace", short: "橘专", eshort: "Jufu", type: "wep_up", tierId: "tier_S", img: "../img/ZZZ/weapon/5/福虓炉炉.webp" },
    { name: "青溟笼舍", en: "Qingming Birdcage", short: "仪专", eshort: "Yxuan", type: "wep_up", tierId: "tier_S", img: "../img/ZZZ/weapon/5/青溟笼舍.webp" },
    { name: "千面日陨", en: "Myriad Eclipse", short: "雨专", eshort: "Hugo", type: "wep_up", tierId: "tier_S", img: "../img/ZZZ/weapon/5/千面日陨.webp" },
    { name: "飞鸟星梦", en: "Flight of Fancy", short: "薇专", eshort: "vian", type: "wep_up", tierId: "tier_S", img: "../img/ZZZ/weapon/5/飞鸟星梦.webp" },
    { name: "索魂影眸", en: "Spectral Gaze", short: "板专", eshort: "Trig", type: "wep_up", tierId: "tier_S", img: "../img/ZZZ/weapon/5/索魂影眸.webp" },
    { name: "牺牲洁纯", en: "Severed Innocence", short: "安专", eshort: "Anby", type: ["wep_up","wep_up_2"], tierId: "tier_S", img: "../img/ZZZ/weapon/5/牺牲洁纯.webp" },
    { name: "心弦夜响", en: "Heartstring Nocturne", short: "伊专", eshort: "Evely", type: "wep_up", tierId: "tier_S", img: "../img/ZZZ/weapon/5/心弦夜响.webp" },
    { name: "玲珑妆匣", en: "Elegant Vanity", short: "耀专", eshort: "Astra", type: ["wep_up","wep_up_2"], tierId: "tier_S", img: "../img/ZZZ/weapon/5/玲珑妆匣.webp" },
    { name: "残心青囊", en: "Zanshin Herb Case", short: "浅专", eshort: "Asaba", type: ["wep_up","wep_up_2"], tierId: "tier_S", img: "../img/ZZZ/weapon/5/残心青囊.webp" },
    { name: "霞落星殿", en: "Hailstorm Shrine", short: "雅专", eshort: "Hoshi", type: "wep_up", tierId: "tier_S", img: "../img/ZZZ/weapon/5/霞落星殿.webp" },
    { name: "焰心桂冠", en: "Blazing Laurel", short: "莱专", eshort: "Light", type: "wep_up", tierId: "tier_S", img: "../img/ZZZ/weapon/5/焰心桂冠.webp" },
    { name: "时流贤者", en: "Timeweaver", short: "柳专", eshort: "Yanag", type: ["wep_up","wep_std_2"], tierId: "tier_S", img: "../img/ZZZ/weapon/5/时流贤者.webp" },
    { name: "灼心摇壶", en: "Flamemaker Shaker", short: "柏专", eshort: "Burni", type: "wep_up", tierId: "tier_S", img: "../img/ZZZ/weapon/5/灼心摇壶.webp" },
    { name: "奔袭獠牙", en: "Tusks of Fury", short: "凯专", eshort: "Caesa", type: ["wep_up","wep_std_2"], tierId: "tier_S", img: "../img/ZZZ/weapon/5/奔袭獠牙.webp" },
    { name: "淬锋钳刺", en: "Sharpened Stinger", short: "简专", eshort: "Jane", type: "wep_up", tierId: "tier_S", img: "../img/ZZZ/weapon/5/淬锋钳刺.webp" },
    { name: "玉壶青冰", en: "Ice-Jade Teapot", short: "青专", eshort: "QingY", type: "wep_up", tierId: "tier_S", img: "../img/ZZZ/weapon/5/玉壶青冰.webp" },
    { name: "防爆者VI型", en: "Riot Suppressor Mark VI", short: "鸢", eshort: "ZhuY", type: ["wep_up","wep_std_2"], tierId: "tier_S", img: "../img/ZZZ/weapon/5/防爆者VI型.webp" },
    { name: "深海访客", en: "Deep Sea Visitor", short: "艾专", eshort: "Ellen", type: "wep_up", tierId: "tier_S", img: "../img/ZZZ/weapon/5/深海访客.webp" },

    { name: "啜泣摇篮", en: "Weeping Cradle", short: "丽专", eshort: "Lina", type: "wep_std", tierId: "tier_S", img: "../img/ZZZ/weapon/5/啜泣摇篮.webp" },
    { name: "拘缚者", en: "The Restrained", short: "狼专", eshort: "Lyca", type: "wep_std", tierId: "tier_S", img: "../img/ZZZ/weapon/5/拘缚者.webp" },
    { name: "嵌合编译器", en: "Fusion Compiler", short: "格专", eshort: "Grace", type: "wep_std", tierId: "tier_S", img: "../img/ZZZ/weapon/5/嵌合编译器.webp" },
    { name: "燃狱齿轮", en: "Hellfire Gears", short: "珂专", eshort: "Kleda", type: "wep_std", tierId: "tier_S", img: "../img/ZZZ/weapon/5/燃狱齿轮.webp" },
    { name: "硫磺石", en: "The Brimstone", short: "11专", eshort: "11th", type: "wep_std", tierId: "tier_S", img: "../img/ZZZ/weapon/5/硫磺石.webp" },
    { name: "钢铁肉垫", en: "Steel Cushion", short: "猫专", eshort: "Neko", type: "wep_std", tierId: "tier_S", img: "../img/ZZZ/weapon/5/钢铁肉垫.webp" },

    // --- A级音擎 (可选UP: wep_A1) ---
    { name: "燔火胧夜", en: "Grill O'Wisp", short: "斗专", eshort: "Manat", type: ["wep_A", "wep_A1"], tierId: "tier_A", img: "../img/ZZZ/weapon/4/燔火胧夜.webp" },
    { name: "震元奇枢", en: "Tremor Trigram Vessel", short: "潘专", eshort: "Yinhu", type: ["wep_A", "wep_A1"], tierId: "tier_A", img: "../img/ZZZ/weapon/4/震元奇枢.webp" },
    { name: "裁纸刀", en: "Box Cutter", short: "喵专", eshort: "Pulch", type: ["wep_A", "wep_A1"], tierId: "tier_A", img: "../img/ZZZ/weapon/4/裁纸刀.webp" },
    { name: "维序者-特化型", en: "Peacekeeper - Specialized", short: "塞专", eshort: "Seth", type: ["wep_A", "wep_A1"], tierId: "tier_A", img: "../img/ZZZ/weapon/4/维序者-特化型.webp" },
    { name: "德玛拉电池Ⅱ型", en: "Demara Battery Mark II", short: "安专", eshort: "Anby", type: ["wep_A", "wep_A1"], tierId: "tier_A", img: "../img/ZZZ/weapon/4/德玛拉电池Ⅱ型.webp" },
    { name: "聚宝箱", en: "The Vault", short: "妮专", eshort: "Nicol", type: ["wep_A", "wep_A1"], tierId: "tier_A", img: "../img/ZZZ/weapon/4/聚宝箱.webp" },
    { name: "家政员", en: "Housekeeper", short: "琳专", eshort: "Corin", type: ["wep_A", "wep_A1"], tierId: "tier_A", img: "../img/ZZZ/weapon/4/家政员.webp" },
    { name: "仿制星徽引擎", en: "Starlight Engine Replica", short: "比专", eshort: "Billy", type: ["wep_A", "wep_A1"], tierId: "tier_A", img: "../img/ZZZ/weapon/4/仿制星徽引擎.webp" },
    { name: "旋钻机-赤轴", en: "Drill Rig - Red Axis", short: "东专", eshort: "Anton", type: ["wep_A", "wep_A1"], tierId: "tier_A", img: "../img/ZZZ/weapon/4/旋钻机-赤轴.webp" },
    { name: "比格气缸", en: "Big Cylinder", short: "本专", eshort: "Ben", type: ["wep_A", "wep_A1"], tierId: "tier_A", img: "../img/ZZZ/weapon/4/比格气缸.webp" },
    { name: "含羞恶面", en: "Bashful Demon", short: "苍专", eshort: "Souka", type: ["wep_A", "wep_A1"], tierId: "tier_A", img: "../img/ZZZ/weapon/4/含羞恶面.webp" },
    { name: "好斗的阿炮", en: "Kaboom the Cannon", short: "露专", eshort: "Lucy", type: ["wep_A", "wep_A1"], tierId: "tier_A", img: "../img/ZZZ/weapon/4/好斗的阿炮.webp" },
    { name: "轰鸣座驾", en: "Roaring Ride", short: "派专", eshort: "Piper", type: ["wep_A", "wep_A1"], tierId: "tier_A", img: "../img/ZZZ/weapon/4/轰鸣座驾.webp" },

    // --- A级音擎 (全可出排除A1: wep_A2) ---
    { name: "雨林饕客", en: "Rainforest Gourmet", short: "雨林", eshort: "Gourm", type: ["wep_A", "wep_A2"], tierId: "tier_A", img: "../img/ZZZ/weapon/4/雨林饕客.webp" },
    { name: "贵重骨核", en: "Precious Fossilized Core", short: "骨核", eshort: "Core", type: ["wep_A", "wep_A2"], tierId: "tier_A", img: "../img/ZZZ/weapon/4/贵重骨核.webp" },
    { name: "兔能环", en: "Bunny Band", short: "兔能", eshort: "Bunny", type: ["wep_A", "wep_A2"], tierId: "tier_A", img: "../img/ZZZ/weapon/4/兔能环.webp" },
    { name: "街头巨星", en: "Street Superstar", short: "街头", eshort: "Star", type: ["wep_A", "wep_A2"], tierId: "tier_A", img: "../img/ZZZ/weapon/4/街头巨星.webp" },
    { name: "星徽引擎", en: "Starlight Engine", short: "星徽", eshort: "Engin", type: ["wep_A", "wep_A2"], tierId: "tier_A", img: "../img/ZZZ/weapon/4/星徽引擎.webp" },
    { name: "正版变身器", en: "Original Transmorpher", short: "变身", eshort: "Trans", type: ["wep_A", "wep_A2"], tierId: "tier_A", img: "../img/ZZZ/weapon/4/正版变身器.webp" },
    { name: "幻变魔方", en: "Puzzle Sphere", short: "魔方", eshort: "Puzzl", type: ["wep_A", "wep_A2"], tierId: "tier_A", img: "../img/ZZZ/weapon/4/幻变魔方.webp" },
    { name: "时光切片", en: "Slice of Time", short: "切片", eshort: "Slice", type: ["wep_A", "wep_A2"], tierId: "tier_A", img: "../img/ZZZ/weapon/4/时光切片.webp" },
    { name: "人为刀俎", en: "Steam Oven", short: "刀俎", eshort: "Oven", type: ["wep_A", "wep_A2"], tierId: "tier_A", img: "../img/ZZZ/weapon/4/人为刀俎.webp" },
    { name: "双生泣星", en: "Weeping Gemini", short: "双生", eshort: "Gemin", type: ["wep_A", "wep_A2"], tierId: "tier_A", img: "../img/ZZZ/weapon/4/双生泣星.webp" },
    // TODO: 待官方Wiki更新后校对「喵运当头」英文名称、简称与照片
    { name: "喵运当头", en: "Lucky Paws", short: "喵运", eshort: "Paws", type: ["wep_A", "wep_A2"], tierId: "tier_A", img: "../img/ZZZ/weapon/4/喵运当头.webp" },

    // --- 赠送音擎 (活动/大月卡音擎: wep_A3) ---
    { name: "日冕遗蜕", en: "Sol Exuvia", short: "佩专", eshort: "Pyro", type: "wep_A3", tierId: "tier_S", img: "../img/ZZZ/weapon/5/日冕遗蜕.webp" },
    { name: "咚哒回声", en: "Boisterous Echoes", short: "咚哒", eshort: "Echo", type: "wep_A3", tierId: "tier_A", img: "../img/ZZZ/weapon/4/咚哒回声.webp" },
    { name: "炎炙沸釜", en: "The Simmering Pot", short: "沸釜", eshort: "Pot", type: "wep_A3", tierId: "tier_A", img: "../img/ZZZ/weapon/4/炎炙沸釜.webp" },
    { name: "青漪灵鼎", en: "Cauldron of Clarity", short: "灵鼎", eshort: "Clari", type: "wep_A3", tierId: "tier_A", img: "../img/ZZZ/weapon/4/青漪灵鼎.webp" },
    { name: "电波漫步", en: "Radiowave Journey", short: "电波", eshort: "Radio", type: "wep_A3", tierId: "tier_A", img: "../img/ZZZ/weapon/4/电波漫步.webp" },
    { name: "光影刻刀", en: "Reel Projector", short: "刻刀", eshort: "Reel", type: "wep_A3", tierId: "tier_A", img: "../img/ZZZ/weapon/4/光影刻刀.webp" },
    { name: "强音热望", en: "Marcato Desire", short: "强音", eshort: "Desir", type: "wep_A3", tierId: "tier_A", img: "../img/ZZZ/weapon/4/强音热望.webp" },
    { name: "鎏金花信", en: "Gilded Blossom", short: "花信", eshort: "Gild", type: "wep_A3", tierId: "tier_A", img: "../img/ZZZ/weapon/4/鎏金花信.webp" },
    { name: "左轮转子", en: "Six Shooter", short: "左轮", eshort: "Shoot", type: "wep_A3", tierId: "tier_A", img: "../img/ZZZ/weapon/4/左轮转子.webp" },
    { name: "逍遥游球", en: "Unfettered Game Ball", short: "游球", eshort: "Ball", type: "wep_A3", tierId: "tier_A", img: "../img/ZZZ/weapon/4/逍遥游球.webp" },
    { name: "加农转子", en: "Cannon Rotor", short: "加农", eshort: "Rotor", type: "wep_A3", tierId: "tier_A", img: "../img/ZZZ/weapon/4/加农转子.webp" },
    { name: "春日融融", en: "Spring Embrace", short: "春日", eshort: "Embra", type: "wep_A3", tierId: "tier_A", img: "../img/ZZZ/weapon/4/春日融融.webp" },
    { name: "触电唇彩", en: "Electro-Lip Gloss", short: "唇彩", eshort: "Gloss", type: "wep_A3", tierId: "tier_A", img: "../img/ZZZ/weapon/4/触电唇彩.webp" },

    // --- 3星音擎追加 ---
    { name: "「残响」-Ⅰ型", en: "[Reverb] Mark I", short: "I型", eshort: "Rev1", type: "wep_B", tierId: "tier_B", img: "../img/ZZZ/weapon/3/I 型.webp" },
    { name: "「残响」-Ⅱ型", en: "[Reverb] Mark II", short: "II型", eshort: "Rev2", type: "wep_B", tierId: "tier_B", img: "../img/ZZZ/weapon/3/II 型.webp" },
    { name: "「残响」-Ⅲ型", en: "[Reverb] Mark III", short: "III型", eshort: "Rev3", type: "wep_B", tierId: "tier_B", img: "../img/ZZZ/weapon/3/III 型.webp" },
    { name: "「恒等式」-本格", en: "[Identity] Base", short: "本格", eshort: "Base", type: "wep_B", tierId: "tier_B", img: "../img/ZZZ/weapon/3/本格.webp" },
    { name: "「湍流」-矢型", en: "[Vortex] Arrow", short: "矢型", eshort: "Arrow", type: "wep_B", tierId: "tier_B", img: "../img/ZZZ/weapon/3/矢型.webp" },
    { name: "「电磁暴」-叁式", en: "[Magnetic Storm] Charlie", short: "叁型", eshort: "MagC", type: "wep_B", tierId: "tier_B", img: "../img/ZZZ/weapon/3/叁型.webp" },
    { name: "「恒等式」-变格", en: "[Identity] Inflection", short: "变格", eshort: "Infle", type: "wep_B", tierId: "tier_B", img: "../img/ZZZ/weapon/3/变格.webp" },
    { name: "「湍流」-斧型", en: "[Vortex] Hatchet", short: "斧型", eshort: "Hatch", type: "wep_B", tierId: "tier_B", img: "../img/ZZZ/weapon/3/斧型.webp" },
    { name: "「电磁暴」-贰式", en: "[Magnetic Storm] Bravo", short: "贰型", eshort: "MagB", type: "wep_B", tierId: "tier_B", img: "../img/ZZZ/weapon/3/贰型.webp" },
    { name: "「月相」-朔", en: "[Lunar] Noviluna", short: "朔", eshort: "Novi", type: "wep_B", tierId: "tier_B", img: "../img/ZZZ/weapon/3/朔.webp" },
    { name: "「灰烬」-钴蓝", en: "[Cinder] Cobalt", short: "钴蓝", eshort: "Coba", type: "wep_B", tierId: "tier_B", img: "../img/ZZZ/weapon/3/钴蓝.webp" },
    { name: "「月相」-晦", en: "[Lunar] Decrescent", short: "晦", eshort: "Decr", type: "wep_B", tierId: "tier_B", img: "../img/ZZZ/weapon/3/晦.webp" },
    { name: "「月相」-望", en: "[Lunar] Pleniluna", short: "望", eshort: "Pleni", type: "wep_B", tierId: "tier_B", img: "../img/ZZZ/weapon/3/望.webp" },
    { name: "「湍流」-铳型", en: "[Vortex] Revolver", short: "铳型", eshort: "Revo", type: "wep_B", tierId: "tier_B", img: "../img/ZZZ/weapon/3/铳型.webp" },
    { name: "「电磁暴」-壹式", en: "[Magnetic Storm] Alpha", short: "壹型", eshort: "MagA", type: "wep_B", tierId: "tier_B", img: "../img/ZZZ/weapon/3/壹型.webp" },
];

const ZZZ_BANGBOO = [
    { name: "艾瑞儿", en: "Ariel", short: "艾瑞", eshort: "Ariel", type: "bangboo_up", tierId: "tier_S", img: "../img/ZZZ/bangboo/S/艾瑞儿.webp"},
    { name: "超级杰克", en: "Ultra Jake", short: "杰克", eshort: "Jake", type: "bangboo_up", tierId: "tier_S", img: "../img/ZZZ/bangboo/S/超级杰克.webp"},
    { name: "阿饭", en: "Biggest Fan", short: "饭", eshort: "Fan", type: "bangboo_up", tierId: "tier_S", img: "../img/ZZZ/bangboo/S/阿饭.webp"},
    { name: "芽芽", en: "", short: "芽", eshort: "", type: "bangboo_up", tierId: "tier_S", img: "../img/ZZZ/bangboo/S/芽芽.webp"},
    { name: "比克布利克", en: "Birkblick", short: "比", eshort: "Brik", type: "bangboo_up", tierId: "tier_S", img: "../img/ZZZ/bangboo/S/比克布利克.webp"},
    { name: "墨丘利", en: "Mercury", short: "墨", eshort: "Mercu", type: "bangboo_up", tierId: "tier_S", img: "../img/ZZZ/bangboo/S/墨丘利.webp"},
    { name: "爱丝弥小姐", en: "Miss Esme", short: "爱", eshort: "Esme", type: "bangboo_up", tierId: "tier_S", img: "../img/ZZZ/bangboo/S/爱丝弥小姐.webp"},
    { name: "狮耶", en: "Belion", short: "狮", eshort: "Blion", type: "bangboo_up", tierId: "tier_S", img: "../img/ZZZ/bangboo/S/狮耶.webp"},
    { name: "罗宾", en: "Robin", short: "罗", eshort: "Robi", type: "bangboo_up", tierId: "tier_S", img: "../img/ZZZ/bangboo/S/罗宾.webp"},
    { name: "咔嚓仔", en: "Snap", short: "咔", eshort: "Snap", type: "bangboo_up", tierId: "tier_S", img: "../img/ZZZ/bangboo/S/咔嚓仔.webp"},
    { name: "格列佛探员", en: "Agent Gulliver", short: "格", eshort: "Agent", type: "bangboo_up", tierId: "tier_S", img: "../img/ZZZ/bangboo/S/格列佛探员.webp"},
    { name: "赤红莫库斯", en: "Red Moccus", short: "赤", eshort: "Red", type: "bangboo_up", tierId: "tier_S", img: "../img/ZZZ/bangboo/S/赤红莫库斯.webp"},
    { name: "阿崔巡查", en: "Officer Cui", short: "崔", eshort: "OfCui", type: "bangboo_up", tierId: "tier_S", img: "../img/ZZZ/bangboo/S/阿崔巡查.webp"},
    { name: "鲨牙布", en: "Sharkboo", short: "鲨", eshort: "Shark", type: "bangboo_up", tierId: "tier_S", img: "../img/ZZZ/bangboo/S/鲨牙布.webp"},
    { name: "飙速布", en: "Rocketboo", short: "飙", eshort: "Rocket", type: "bangboo_up", tierId: "tier_S", img: "../img/ZZZ/bangboo/S/飙速布.webp"},
    { name: "插头布", en: "Plugboo", short: "插", eshort: "Plug", type: "bangboo_up", tierId: "tier_S", img: "../img/ZZZ/bangboo/S/插头布.webp"},
    { name: "共鸣布", en: "Resonaboo", short: "鸣", eshort: "Reson", type: "bangboo_up", tierId: "tier_S", img: "../img/ZZZ/bangboo/S/共鸣布.webp"},
    { name: "左轮布", en: "Bangvolver", short: "左", eshort: "vover", type: "bangboo_up", tierId: "tier_S", img: "../img/ZZZ/bangboo/S/左轮布.webp"},
    { name: "阿全", en: "Safety", short: "全", eshort: "Safe", type: "bangboo_up", tierId: "tier_S", img: "../img/ZZZ/bangboo/S/阿全.webp"},
    { name: "艾米莉安", en: "Amillion", short: "艾", eshort: "Amill", type: "bangboo_up", tierId: "tier_S", img: "../img/ZZZ/bangboo/S/艾米莉安.webp"},
    { name: "巴特勒", en: "Butler", short: "巴", eshort: "Butle", type: "bangboo_up", tierId: "tier_S", img: "../img/ZZZ/bangboo/S/巴特勒.webp"},

    // --- A级邦布 (游戏内可抽：bangboo_A1) ---
    { name: "企鹅布", en: "Penguinboo", short: "企鹅", eshort: "Pengu", type: "bangboo_A", tierId: "tier_A", img: "../img/ZZZ/bangboo/A/企鹅布.webp" },
    { name: "寻宝布", en: "Exploreboo", short: "寻宝", eshort: "Explo", type: "bangboo_A", tierId: "tier_A", img: "../img/ZZZ/bangboo/A/寻宝布.webp" },
    { name: "扑击布", en: "Sumoboo", short: "扑击", eshort: "Sumo", type: "bangboo_A", tierId: "tier_A", img: "../img/ZZZ/bangboo/A/扑击布.webp" },
    { name: "纸壳布", en: "Paperboo", short: "纸壳", eshort: "Paper", type: "bangboo_A", tierId: "tier_A", img: "../img/ZZZ/bangboo/A/纸壳布.webp" },
    { name: "纸袋布", en: "Bagboo", short: "纸袋", eshort: "Bag", type: "bangboo_A", tierId: "tier_A", img: "../img/ZZZ/bangboo/A/纸袋布.webp" },
    { name: "泪眼布", en: "Cryboo", short: "泪眼", eshort: "Cry", type: "bangboo_A", tierId: "tier_A", img: "../img/ZZZ/bangboo/A/泪眼布.webp" },
    { name: "果核布", en: "Avocaboo", short: "果核", eshort: "Avoca", type: "bangboo_A", tierId: "tier_A", img: "../img/ZZZ/bangboo/A/果核布.webp" },
    { name: "飞靶布", en: "Boollseye", short: "飞靶", eshort: "Bleye", type: "bangboo_A", tierId: "tier_A", img: "../img/ZZZ/bangboo/A/飞靶布.webp" },
    { name: "电击布", en: "Electroboo", short: "电击", eshort: "Elect", type: "bangboo_A", tierId: "tier_A", img: "../img/ZZZ/bangboo/A/电击布.webp" },
    { name: "磁力布", en: "Magnetiboo", short: "磁力", eshort: "Magne", type: "bangboo_A", tierId: "tier_A", img: "../img/ZZZ/bangboo/A/磁力布.webp" },
    { name: "不良布", en: "Baddieboo", short: "不良", eshort: "Baddi", type: "bangboo_A", tierId: "tier_A", img: "../img/ZZZ/bangboo/A/不良布.webp" },
    { name: "恶魔布", en: "Devilboo", short: "恶魔", eshort: "Devil", type: "bangboo_A", tierId: "tier_A", img: "../img/ZZZ/bangboo/A/恶魔布.webp" },

    // --- A级邦布 (活动/系统赠送：bangboo_A2) ---
    { name: "气压布", en: "Boooressure", short: "气压", eshort: "Press", type: "bangboo_A1", tierId: "tier_A", img: "../img/ZZZ/bangboo/A/气压布.webp" },
    { name: "乐玩布", en: "Bild N. Boolok", short: "乐玩", eshort: "Bild", type: "bangboo_A1", tierId: "tier_A", img: "../img/ZZZ/bangboo/A/乐玩布.webp" },
    { name: "加班布", en: "Overtimeboo", short: "加班", eshort: "Overt", type: "bangboo_A1", tierId: "tier_A", img: "../img/ZZZ/bangboo/A/加班布.webp" },
    { name: "圣剑布", en: "Excaliboo", short: "圣剑", eshort: "Excal", type: "bangboo_A1", tierId: "tier_A", img: "../img/ZZZ/bangboo/A/圣剑布.webp" },
    { name: "招财布", en: "Luckyboo", short: "招财", eshort: "Lucky", type: "bangboo_A1", tierId: "tier_A", img: "../img/ZZZ/bangboo/A/招财布.webp" },
    { name: "幽浮布", en: "Ufoboo", short: "幽浮", eshort: "Ufo", type: "bangboo_A1", tierId: "tier_A", img: "../img/ZZZ/bangboo/A/幽浮布.webp" },
    { name: "格斗布", en: "Brawlerboo", short: "格斗", eshort: "Brawl", type: "bangboo_A1", tierId: "tier_A", img: "../img/ZZZ/bangboo/A/格斗布.webp" },
    { name: "骑士布", en: "Knightboo", short: "骑士", eshort: "Knigh", type: "bangboo_A1", tierId: "tier_A", img: "../img/ZZZ/bangboo/A/骑士布.webp" },

];

//无论上面怎么命名分类，最后这边都会被统一成一个大图鉴让代码能读信息
const ZZZ_DB = [...ZZZ_CHAR, ...ZZZ_WEAPON, ...ZZZ_BANGBOO];

//  全局稀有度 (Tier) 定义
const ZZZ_GLOBAL_TIERS = [
    { id: 'tier_S', name: 'S', color: '#f1c40f' },
    { id: 'tier_A', name: 'A', color: '#9b59b6' },
    { id: 'tier_B', name: 'B', color: '#3498db' }
];

const ZZZ_SETUP_RULES = {
    gameName: "绝区零",enName: "Zenless Zone Zero",
    //  1. 动态积木池定义 (直接接管 custom_setup 的界面)
    rosterPools: [
        { id: 'char_up', name: '独家频段', en: "CHANNEL Exclusive", type: 'up' },
        { id: 'wep_up', name: '音擎频段', en: "CHANNEL W-Engine", type: 'up'},
        { id: 'bangboo_up', name: '邦布频段', en: "CHANNEL Bangboo", type: 'up'},
        { id: 'char_up_2', name: '独家重映', en: "Exclusive Re-release", type: 'up' },
        { id: 'wep_up_2', name: '音频回响', en: "W-Engine Re-release", type: 'up' },
        { 
            id: 'char_std', name: '常驻代理人', en: "Regular Exclusive", type: 'std', 
            isStandalone: false,          // 是否开放侧栏独立抽取
            enableCustomUp: false,        //  是否允许模拟器拖拽自选UP
            enableSpecRate: false,        //  是否开启特限出货干预
            hideInSimPanel: false          //  是否在模拟器侧栏隐藏
        },
        { 
            id: 'char_std_2', name: 'S级代理人定制调频', en: "S tier Exclusive Custom Search", type: 'std', 
            isStandalone: false,
            enableCustomUp: false,
            enableSpecRate: false,
            hideInSimPanel: false
        },
        { 
            id: 'char_A', name: 'A级代理人定制调频', en: "A Tier Exclusive", type: 'std', 
            isStandalone: false,
            enableCustomUp: true,
            enableSpecRate: false,
            hideInSimPanel: true
        },
        { 
            id: 'wep_std', name: '常驻音擎', en: "Regular W-Engine", type: 'std', 
            isStandalone: false, 
            enableCustomUp: false, 
            enableSpecRate: false,
            hideInSimPanel: false
        },
        { 
            id: 'wep_std_2', name: 'S级音擎定制调频', en: "S tier W-Engine Custom Search", type: 'std', 
            isStandalone: false,
            enableCustomUp: false,
            enableSpecRate: false,
            hideInSimPanel: false
        },        
        { 
            id: 'wep_A1', name: 'A级音擎定制调频', en: "A Tier W-Engine Custom Search", type: 'std', 
            isStandalone: false, 
            enableCustomUp: true, 
            enableSpecRate: false,
            hideInSimPanel: true
        },
        { 
            id: 'wep_A2', name: 'A级音擎(非定制调频)', en: "A Tier W-Engine(Non Custom Search)", type: 'std', 
            isStandalone: false, 
            enableCustomUp: false, 
            enableSpecRate: false,
            hideInSimPanel: true
        },
        { 
            id: 'wep_B', name: 'B级音擎', en: "B Tier W-Engine", type: 'std', 
            isStandalone: false, 
            enableCustomUp: false, 
            enableSpecRate: false ,
            hideInSimPanel: true
        },
        { 
            id: 'bangboo_A', name: 'A级邦布', en: "A Tier Bangboo", type: 'std', 
            isStandalone: false, 
            enableCustomUp: false, 
            enableSpecRate: false,
            hideInSimPanel: true
        },
        { 
            id: 'bangboo_A1', name: '赠送邦布', en: "Free Bangboo", type: 'std', 
            isStandalone: false, 
            enableCustomUp: false, 
            enableSpecRate: false,
            hideInSimPanel: true
        },
        { 
            id: 'wep_A3', name: '活动/大月卡音擎', en: "Free W-Engine", type: 'std', 
            isStandalone: false, 
            enableCustomUp: false, 
            enableSpecRate: false,
            hideInSimPanel: true
        },
        { 
            id: 'char_non', name: '赠送代理人', en: "Non Exclusive", type: 'std', 
            isStandalone: false,
            enableCustomUp: false,
            enableSpecRate: false,
            hideInSimPanel: true
        },
        { 
            id: 'wep_A', name: 'A级音擎(给代理人池用)', en: "A Tier W-Engine(give Exclusive use)", type: 'std', 
            isStandalone: false, 
            enableCustomUp: false, 
            enableSpecRate: false,
            hideInSimPanel: true
        },
        { 
            id: 'char_wep', name: 'A级代理人(给音擎池用）', en: "A Tier Exclusive(give W-Engine use)", type: 'std', 
            isStandalone: false,
            enableCustomUp: false,
            enableSpecRate: false,
            hideInSimPanel: true
        },
    ],

     // 🌟 2. 多重混池定义 (取代旧版单一的 mixedStd)
    mixedPools: [
        { 
            id: 'mixed_std', 
            name: '常驻频段', 
            en: "CHANNEL Stable",
            components: ['char_std', 'wep_std', 'wep_A', 'char_wep','wep_B'], // 融合上述哪些图鉴
            enableCustomUp: false                 // 混池也可以开启自选 UP
        }
    ],

    // 🌟 3. 限定池歪出流向判定 (key必须和上方的id对应)
    offRate: {
    'char_up': ['char_std', 'char_A', 'wep_A', 'wep_B','char_std_2'], // 仅挂载角色图鉴
    'wep_up': ['wep_std','char_wep', 'wep_A1', 'wep_A2', 'wep_B','wep_std_2'],          // 仅挂载武器图鉴
    'bangboo_up': ['bangboo_A','wep_B'],
    'char_up_2': ['char_std', 'char_A', 'wep_A', 'wep_B','char_std_2'],
    'wep_up_2': ['wep_std','char_wep', 'wep_A1', 'wep_A2', 'wep_B','wep_std_2'],
    },
}

// --- 预设卡池概率规则 ---
const ZZZ_POOL_RULES = {
    // 角色限定池 (独家频段)
    char_up: {
        tiers: [
            { id: 'tier_S', prob: 0.6 },
            { 
                id: 'tier_A', 
                prob: 9.4,
                // 🌟 细分积木池绝对概率数组
                subProbs: [
                    {
                        prob: 7.05,
                        poolIds: ['char_A'] // A级代理人积木占 7.05%
                    },
                    {
                        prob: 2.35,
                        poolIds: ['wep_A'] // A级音擎积木合并共享 2.35%
                    }
                ]
            },
            { id: 'tier_B', prob: 90 }
        ],
        targetGoldIds: ['tier_S'],
        minorPities: [
            { 
                pulls: 10,                 
                tierId: 'tier_A',          
                resetOnHit: true,
                enableUp: true,            
                upMin: 2,                  // 🌟 最少选 2 个
                upMax: 2,                  // 🌟 最多选 2 个
                upCount: 2,                // 兼容旧字段，取上限
                upRate: 0.5,               
                useGuarantee: true,        
                guaranteeLimit: 1          
            }
        ],
        hardPity: 90,
        upRate: 0.5,
        softEnabled: true,
        softRule: [
            { start: 74, end: 89, inc: 0.06 },
        ],
        useGuarantee: true, 
        guaranteeLimit: 1, 
        // 🌟 新增：前 N 金不歪特权序列
        //earlyUpRules: [
            //{ order: 0, upRate: 100 } // 第 1 金 100% 不歪（独家重映）
            // 若需要首两金不歪，可追加: { order: 2, upRate: 100 }
        //],
        //goldCategorySequence: [
            // 第 1 金：限制仅从【常驻代理人 (char_std)】积木池中出货
            //{ order: 1, poolIds: ['char_std'] }

            // 如果后续还想配置第 2 金必出音擎，可取消下面注释：
            // ,{ order: 2, poolIds: ['wep_std'] }
        //],
        // 🌟 新增：歪出挽救机制 (原神“捕获明光”二次判定)
        //secondaryRescue: {
            //enabled: true,              // 开启挽救机制
            //triggerRate: 10,            // 常态下歪了有 10% 概率触发挽救（折算综合胜率 55%）
            //hardGuaranteeLosses: 1,     // 连续歪满 1 次后，下一次歪常驻时 100% 触发挽救
            //customEffectName: "明光"    // 抽卡结果卡片上右上角显示的标识标签
        //},
        preSelect: {
            enabled: true,
            upMin: 1,
            upMax: 1,
            stdMin: 6,
            stdMax: 6
        },
    },
    // 音擎限定池 (音擎频段)
    wep_up: {
        tiers: [
            { id: 'tier_S', prob: 1 },
            { 
                id: 'tier_A', 
                prob: 15,
                subProbs: [
                    {
                        prob: 11.25,
                        poolIds: ['wep_A1', 'wep_A2'] // 音擎占 11.25%
                    },
                    {
                        prob: 3.75,
                        poolIds: ['char_A']           // 代理人占 3.75%
                    }
                ]
            },
            { id: 'tier_B', prob: 84 }
        ],
        targetGoldIds: ['tier_S'],
       minorPities: [
            { 
                pulls: 10,                 
                tierId: 'tier_A',          
                resetOnHit: true,
                enableUp: true,            
                upMin: 2,                  // 🌟 最少选 2 个
                upMax: 2,                  // 🌟 最多选 2 个
                upCount: 2,                // 兼容旧字段，取上限
                upRate: 0.5,               
                useGuarantee: true,        
                guaranteeLimit: 1          
            }
        ],
        hardPity: 80,
        upRate: 0.75,
        softEnabled: true,
        softRule: [
            { start: 63, end: 73, inc: 0.07 },
            { start: 74, end: 79, inc: 0.035 },
        ],
        useGuarantee: true, 
        guaranteeLimit: 1, 
        preSelect: {
            enabled: true,
            upMin: 1,
            upMax: 1,
            stdMin: 6,
            stdMax: 6
        },
    },
    //独家重映
    char_up_2: {
        tiers: [
            { id: 'tier_S', prob: 0.6 },
            { 
                id: 'tier_A', 
                prob: 9.4,
                // 🌟 细分积木池绝对概率数组
                subProbs: [
                    {
                        prob: 7.05,
                        poolIds: ['char_A'] // A级代理人积木占 7.05%
                    },
                    {
                        prob: 2.35,
                        poolIds: ['wep_A'] // A级音擎积木合并共享 2.35%
                    }
                ]
            },
            { id: 'tier_B', prob: 90 }
        ],
        targetGoldIds: ['tier_S'],
        minorPities: [
            { 
                pulls: 10,                 
                tierId: 'tier_A',          
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
        hardPity: 90,
        upRate: 0.5,
        softEnabled: true,
        softRule: [
            { start: 74, end: 89, inc: 0.06 },
        ],
        useGuarantee: true, 
        guaranteeLimit: 1, 
        // 🌟 新增：前 N 金不歪特权序列
        earlyUpRules: [
            { order: 1, upRate: 100 }, //第一金，100%出up
            // 若需要首两金不歪，可追加: { order: 2, upRate: 100 }
        ],
        //goldCategorySequence: [
            // 第 1 金：限制仅从【常驻代理人 (char_std)】积木池中出货
            //{ order: 1, poolIds: ['char_std'] }

            // 如果后续还想配置第 2 金必出音擎，可取消下面注释：
            // ,{ order: 2, poolIds: ['wep_std'] }
        //],
        // 🌟 新增：歪出挽救机制 (原神“捕获明光”二次判定)
        //secondaryRescue: {
            //enabled: true,              // 开启挽救机制
            //triggerRate: 10,            // 常态下歪了有 10% 概率触发挽救（折算综合胜率 55%）
            //hardGuaranteeLosses: 1,     // 连续歪满 1 次后，下一次歪常驻时 100% 触发挽救
            //customEffectName: "明光"    // 抽卡结果卡片上右上角显示的标识标签
        //},
        preSelect: {
            enabled: true,
            upMin: 1,
            upMax: 1,
            stdMin: 6,
            stdMax: 6
        },
    },
    wep_up_2: {
        tiers: [
            { id: 'tier_S', prob: 0.6 },
            { 
                id: 'tier_A', 
                prob: 9.4,
                // 🌟 细分积木池绝对概率数组
                subProbs: [
                    {
                        prob: 7.05,
                        poolIds: ['wep_A'] 
                    },
                    {
                        prob: 2.35,
                        poolIds: ['char_A'] 
                    }
                ]
            },
            { id: 'tier_B', prob: 90 }
        ],
        targetGoldIds: ['tier_S'],
        minorPities: [
            { 
                pulls: 10,                 
                tierId: 'tier_A',          
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
        hardPity: 90,
        upRate: 0.5,
        softEnabled: true,
        softRule: [
            { start: 74, end: 89, inc: 0.06 },
        ],
        useGuarantee: true, 
        guaranteeLimit: 1, 
        // 🌟 新增：前 N 金不歪特权序列
        earlyUpRules: [
            { order: 1, upRate: 100 }, //第一金，100%出up
            // 若需要首两金不歪，可追加: { order: 2, upRate: 100 }
        ],
        //goldCategorySequence: [
            // 第 1 金：限制仅从【常驻代理人 (char_std)】积木池中出货
            //{ order: 1, poolIds: ['char_std'] }

            // 如果后续还想配置第 2 金必出音擎，可取消下面注释：
            // ,{ order: 2, poolIds: ['wep_std'] }
        //],
        // 🌟 新增：歪出挽救机制 (原神“捕获明光”二次判定)
        //secondaryRescue: {
            //enabled: true,              // 开启挽救机制
            //triggerRate: 10,            // 常态下歪了有 10% 概率触发挽救（折算综合胜率 55%）
            //hardGuaranteeLosses: 1,     // 连续歪满 1 次后，下一次歪常驻时 100% 触发挽救
            //customEffectName: "明光"    // 抽卡结果卡片上右上角显示的标识标签
        //},
        preSelect: {
            enabled: true,
            upMin: 1,
            upMax: 1,
            stdMin: 6,
            stdMax: 6
        },
    },

    // 邦布池 (纯UP池，不设置歪率)
    bangboo_up: {
       tiers: [
            { id: 'tier_S', prob: 1 },
            { id: 'tier_A', prob: 15 },
            { id: 'tier_B', prob: 84 }
        ],
        targetGoldIds: ['tier_S'],
        minorPities: [
            { 
                pulls: 10, 
                tierId: 'tier_A', 
                resetOnHit: true
            },
        ],
        hardPity: 80,
        softEnabled: true,
        softRule: [
            { start: 63, end: 73, inc: 0.07 },
            { start: 74, end: 79, inc: 0.035 },
        ],
        useGuarantee: false, 
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
            { 
                id: 'tier_S', 
                prob: 0.6,
                subProbs: [
                    {
                        prob: 0.3,
                        poolIds: ['char_std'] // A级代理人积木占 7.05%
                    },
                    {
                        prob: 0.3,
                        poolIds: ['wep_std'] // 两个A级音擎积木合并共享 2.35%
                    }
                ]
            },
            { 
                id: 'tier_A', 
                prob: 9.4,
                subProbs: [
                    {
                        prob: 4.7,
                        poolIds: ['char_A'] // A级代理人积木占 7.05%
                    },
                    {
                        prob: 4.7,
                        poolIds: ['wep_A'] // 两个A级音擎积木合并共享 2.35%
                    }
                ]
            },
            { id: 'tier_B', prob: 90 }
        ],
        targetGoldIds: ['tier_S'],
        minorPities: [
            { 
                pulls: 10, 
                tierId: 'tier_A', 
                resetOnHit: true
            },
        ],
        hardPity: 90,
        softEnabled: true,
        softRule: [
            { start: 74, end: 89, inc: 0.06 },
        ],
        useGuarantee: false, 
        sparkRules: [
            {
                limit: 50,
                type: "once",
                targetType: "any_gold",  // 必定出金！
                cancelOnHit: true,       // 前50抽若提前出金，自动作废
                noReset: false           // 重置垫抽（正常吃保底）
            }
        ],
        goldCategorySequence: [
            // 配合已有的类型定向：第 1 金锁定为常驻代理人角色！
            { order: 1, poolIds: ['char_std'] }
        ],
        preSelect: {
            enabled: true,
            upMin: 0,
            upMax: 0,
            stdMin: 12,
            stdMax: 12
        },
    },
};