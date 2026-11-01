// --- 绝区零：角色数据库 (全称) ---
//供复制：{ name: "", en: "", short: "", eshort: "", tag: "up", star: 5, img:""},

const ZZZ_CHAR = [
    { name: "赛维里安", en: "Severian", short: "赛哥", eshort: "Sever", tag: "up", tierId: "tier_S", img: "../img/ZZZ/char/5/赛维里安.webp" },
    { name: "菲欧妮", en: "Phoenix", short: "倒霉", eshort: "Phoe", tag: "up", tierId: "tier_S", img: "../img/ZZZ/char/5/菲欧妮.webp" },
    { name: "洛克茜", en: "Roxy", short: "洛克", eshort: "Roxy", tag: "up", tierId: "tier_S", img: "../img/ZZZ/char/5/洛克茜.webp" },
    { name: "克拉蕾", en: "Claret", short: "克拉", eshort: "Clare", tag: "up", tierId: "tier_S",img: "../img/ZZZ/char/5/克拉蕾.webp" },
    { name: "希格利德", en: "Sigrid de", short: "啥马", eshort: "Sigri", tag: "up", tierId: "tier_S",img: "../img/ZZZ/char/5/希格利德.webp" },
    { name: "蕾米埃尔", en: "Remielle Dan", short: "蕾米", eshort: "Remie", tag: "up", tierId: "tier_S",img: "../img/ZZZ/char/5/蕾米埃尔.webp" },
    { name: "诺姆", en: "Norma", short: "诺姆", eshort: "Norma", tag: "up", tierId: "tier_S",img: "../img/ZZZ/char/5/诺姆.webp" },
    { name: "维琳娜", en: "Velina", short: "维", eshort: "Velin", tag: "up", tierId: "tier_S",img: "../img/ZZZ/char/5/维琳娜.webp" },
    { name: "星辉·比利", en: "Starlight - Billy", short: "星比", eshort: "SBily", tag: "up", tierId: "tier_S",img: "../img/ZZZ/char/5/星辉·比利.webp" },
    { name: "普罗米娅", en: "Promeia", short: "普", eshort: "Prome", tag: "up", tierId: "tier_S",img: "../img/ZZZ/char/5/普罗米娅.webp" },
    { name: "希希芙", en: "Cissia", short: "啥蛇", eshort: "Cisia", tag: "up", tierId: "tier_S",img: "../img/ZZZ/char/5/希希芙.webp" },
    { name: "南宫羽", en: "Nangong Yu", short: "南", eshort: "NGong", tag: "up", tierId: "tier_S", img: "../img/ZZZ/char/5/南宫羽.webp"},
    { name: "爱芮", en: "Aria", short: "爱", eshort: "Aria", tag: "up", tierId: "tier_S", img: "../img/ZZZ/char/5/爱芮.webp" },
    { name: "千夏", en: "Sunna", short: "千", eshort: "Sunna", tag: "up", tierId: "tier_S", img: "../img/ZZZ/char/5/千夏.webp" },
    { name: "叶瞬光", en: "Ye Shun Guang", short: "光", eshort: "YSunG", tag: "up", tierId: "tier_S", img: "../img/ZZZ/char/5/叶瞬光.webp" },
    { name: "照", en: "Zhao", short: "照", eshort: "Zhao", tag: "up", tierId: "tier_S", img: "../img/ZZZ/char/5/照.webp" },
    { name: "般岳", en: "Banyue", short: "般", eshort: "Bany", tag: "up", tierId: "tier_S", img: "../img/ZZZ/char/5/般岳.webp" },
    { name: "琉音", en: "Diaiyn", short: "琉", eshort: "Diaiy", tag: ["up","reup"], tierId: "tier_S", img: "../img/ZZZ/char/5/琉音.webp" },
    { name: "伊德海莉", en: "Yidhari", short: "海", eshort: "Yidha", tag: "up", tierId: "tier_S", img: "../img/ZZZ/char/5/伊德海莉.webp" },
    { name: "卢西亚", en: "Lucia", short: "卢", eshort: "Lucia", tag: "up", tierId: "tier_S", img: "../img/ZZZ/char/5/卢西亚.webp" },
    { name: "奥菲斯&鬼火", en: "Orphie Magnusson & Magus", short: "奥", eshort: "Orphi", tag: "up", tierId: "tier_S", img: "../img/ZZZ/char/5/奥菲斯&鬼火.webp" },
    { name: "希德", en: "Seed", short: "德", eshort: "Seed", tag: "up", tierId: "tier_S", img: "../img/ZZZ/char/5/希德.webp" },
    { name: "爱丽丝", en: "Alice Thymefield", short: "爱", eshort: "Alice", tag: ["up","reup"], tierId: "tier_S", img: "../img/ZZZ/char/5/爱丽丝.webp" },
    { name: "浮波柚叶", en: "Ukinami Yuzuha", short: "柚", eshort: "Yuzu", tag: ["up","reup"], tierId: "tier_S", img:"../img/ZZZ/char/5/浮波柚叶.webp" },
    { name: "仪玄", en: "Yixuan", short: "仪", eshort: "Yxuan", tag: "up", tierId: "tier_S", img:"../img/ZZZ/char/5/仪玄.webp" },
    { name: "橘福福", en: "Ju fufu", short: "橘", eshort: "Jufu", tag: "up", tierId: "tier_S", img: "../img/ZZZ/char/5/橘福福.webp" },
    { name: "雨果", en: "Hugo Vlad", short: "雨", eshort: "Hugo", tag: "up", tierId: "tier_S", img: "../img/ZZZ/char/5/雨果.webp" },
    { name: "薇薇安", en: "Vivian Banshee", short: "薇", eshort: "vian", tag: "up", tierId: "tier_S", img: "../img/ZZZ/char/5/薇薇安.webp" },
    { name: "板机", en: "Trigger", short: "板", eshort: "Trig", tag: "up", tierId: "tier_S", img: "../img/ZZZ/char/5/板机.webp" },
    { name: "零号·安比", en: "Soldier 0 - Anby", short: "0安", eshort: "0Anby", tag: ["up","reup"], tierId: "tier_S", img: "../img/ZZZ/char/5/零号·安比.webp" },
    { name: "伊芙琳", en: "Evelyn Chevalier", short: "伊", eshort: "Evely", tag: "up", tierId: "tier_S", img: "../img/ZZZ/char/5/伊芙琳.webp" },
    { name: "耀嘉音", en: "Astra Yao", short: "耀", eshort: "Astra", tag: ["up","reup"], tierId: "tier_S", img: "../img/ZZZ/char/5/耀嘉音.webp" },
    { name: "浅羽 悠真", en: "Asaba Harumasa", short: "浅", eshort: "Asaba", tag: ["up","reup"], tierId: "tier_S", img: "../img/ZZZ/char/5/浅羽 悠真.webp" },
    { name: "星见 雅", en: "Hoshimi Miyabi", short: "雅", eshort: "Hoshi", tag: "up", tierId: "tier_S", img: "../img/ZZZ/char/5/星见 雅.webp" },
    { name: "莱特", en: "Lighter", short: "莱", eshort: "Light", tag: "up", tierId: "tier_S", img: "../img/ZZZ/char/5/莱特.webp" },
    { name: "月城 柳", en: "Tsukishiro Yanagi", short: "柳", eshort: "Yanag", tag: ["up","custom_offrate"], tierId: "tier_S", img: "../img/ZZZ/char/5/月城 柳.webp" },
    { name: "柏妮思", en: "Burnice White", short: "柏", eshort: "Burni", tag: "up", tierId: "tier_S", img: "../img/ZZZ/char/5/柏妮思.webp" },
    { name: "凯撒", en: "Caesar King", short: "凯", eshort: "Caesa", tag: ["up","custom_offrate"], tierId: "tier_S", img: "../img/ZZZ/char/5/凯撒.webp" },
    { name: "简", en: "Jane Doe", short: "简", eshort: "Jane", tag: "up", tierId: "tier_S", img: "../img/ZZZ/char/5/简.webp" },
    { name: "青衣", en: "Qingyi", short: "青", eshort: "QingY", tag: "up", tierId: "tier_S", img: "../img/ZZZ/char/5/青衣.webp" },
    { name: "朱鸢", en: "Zhu Yuan", short: "鸢", eshort: "ZhuY", tag: ["up","custom_offrate"], tierId: "tier_S", img: "../img/ZZZ/char/5/朱鸢.webp" },
    { name: "艾莲", en: "Ellen Joe", short: "艾", eshort: "Ellen", tag: "up", tierId: "tier_S", img: "../img/ZZZ/char/5/艾莲.webp" },

    // --- 5星常驻角色---
    { name: "丽娜", en: "Alexandrina Sebastiane", short: "丽", eshort: "rina", tag: "std", tierId: "tier_S", img: "../img/ZZZ/char/5/丽娜.webp" },
    { name: "莱卡恩", en: "Von Lycaon", short: "狼", eshort: "Lyca", tag: "std", tierId: "tier_S", img: "../img/ZZZ/char/5/莱卡恩.webp" },
    { name: "格莉丝", en: "Grace Howard", short: "格", eshort: "Grace", tag: "std", tierId: "tier_S", img: "../img/ZZZ/char/5/格莉丝.webp" },
    { name: "珂蕾妲", en: "Koleda Belobog", short: "珂", eshort: "Kleda", tag: "std", tierId: "tier_S", img: "../img/ZZZ/char/5/珂蕾妲.webp" },
    { name: "11号", en: "Soldier 11", short: "11", eshort: "11th", tag: "std", tierId: "tier_S", img: "../img/ZZZ/char/5/11号.webp" },
    { name: "猫又", en: "Nekomiya Mana", short: "猫", eshort: "Neko", tag: "std", tierId: "tier_S", img:"../img/ZZZ/char/5/猫又.webp" },

    // --- 赠送5星角色---
    { name: "佩洛伊斯", en: "Pyrois", short: "嘉豪", eshort: "Pyro", tag: "free", tierId: "tier_S",img: "../img/ZZZ/char/5/佩洛伊斯.webp" },

    // --- 4星角色追加---
    { name: "比利", en: "Billy Kid", short: "比利", eshort: "Billy", tag:["normal","custom_offrate"], tierId: "tier_A", img: "../img/ZZZ/char/4/比利.webp" },
    { name: "可琳", en: "Corin Wickes", short: "可琳", eshort: "Corin", tag:["normal","custom_offrate"], tierId: "tier_A", img: "../img/ZZZ/char/4/可琳.webp" },
    { name: "本", en: "Ben Bigger", short: "本", eshort: "Ben", tag:["normal","custom_offrate"], tierId: "tier_A", img: "../img/ZZZ/char/4/本.webp" },
    { name: "安比", en: "Anby Demara", short: "安比", eshort: "Anby", tag:["normal","custom_offrate"], tierId: "tier_A", img: "../img/ZZZ/char/4/安比.webp" },
    { name: "安东", en: "Anton Ivanov", short: "安东", eshort: "Anton", tag:["normal","custom_offrate"], tierId: "tier_A", img: "../img/ZZZ/char/4/安东.webp" },
    { name: "妮可", en: "Nicole Demara", short: "妮可", eshort: "Nicol", tag:["normal","custom_offrate"], tierId: "tier_A", img: "../img/ZZZ/char/4/妮可.webp" },
    { name: "波可娜", en: "Pulchra Fellini", short: "波喵", eshort: "Pulch", tag:["normal","custom_offrate"], tierId: "tier_A", img: "../img/ZZZ/char/4/波可娜.webp" },
    { name: "派派", en: "Piper Wheel", short: "派派", eshort: "Piper", tag:["normal","custom_offrate"], tierId: "tier_A", img: "../img/ZZZ/char/4/派派.webp" },
    { name: "真斗", en: "Komano Manato", short: "真斗", eshort: "Manat", tag:["normal","custom_offrate"], tierId: "tier_A", img: "../img/ZZZ/char/4/真斗.webp" },
    { name: "苍角", en: "Soukaku", short: "苍角", eshort: "Souka", tag:["normal","custom_offrate"], tierId: "tier_A", img: "../img/ZZZ/char/4/苍角.webp" },
    { name: "塞斯", en: "Seth Lowell", short: "塞斯", eshort: "Seth", tag:["normal","custom_offrate"], tierId: "tier_A", img: "../img/ZZZ/char/4/塞斯.webp" },
    { name: "潘引壶", en: "Pan Yinhu", short: "熊猫", eshort: "Yinhu", tag:["normal","custom_offrate"], tierId: "tier_A", img: "../img/ZZZ/char/4/潘引壶.webp" },
    { name: "露西", en: "Luciana de Montefio", short: "露西", eshort: "Lucy", tag:["normal","custom_offrate"], tierId: "tier_A", img: "../img/ZZZ/char/4/露西.webp" },
    ];

const ZZZ_WEAPON = [
    { name: "赛维里安 音擎", en: "Sever", short: "塞专", eshort: "Sever", tag: "up", tierId: "tier_S",img:"../img/ZZZ/weapon/5/绯月银棺.webp"},
    { name: "菲欧妮 音擎", en: "Phoe", short: "菲专", eshort: "Phoe", tag: "up", tierId: "tier_S",img:"../img/ZZZ/weapon/5/绯月银棺.webp"},
    { name: "绯月银棺", en: "Silver Coffin of Scarlet Moon", short: "洛专", eshort: "Roxy", tag: "up", tierId: "tier_S",img:"../img/ZZZ/weapon/5/绯月银棺.webp"},
    { name: "猩红渴望", en: "Crimson Thirst", short: "克专", eshort: "Clare", tag: "up", tierId: "tier_S",img:"../img/ZZZ/weapon/5/猩红渴望.webp"},
    { name: "骁骑礼赞", en: "Knight's Extolment", short: "马专", eshort: "Sigri", tag: "up", tierId: "tier_S",img:"../img/ZZZ/weapon/5/骁骑礼赞.webp"},
    { name: "空羽复归之诗", en: "Ode Of Resurrected Wings", short: "蕾专", eshort: "Remie", tag: "up", tierId: "tier_S",img:"../img/ZZZ/weapon/5/空羽复归之诗.webp"},
    { name: "首席跟班", en: "Chief Sidekick", short: "诺专", eshort: "Norma", tag: "up", tierId: "tier_S",img:"../img/ZZZ/weapon/5/首席跟班.webp"},
    { name: "琳琅鎏心", en: "Joyau Dore", short: "维专", eshort: "Velin", tag: "up", tierId: "tier_S",img:"../img/ZZZ/weapon/5/琳琅鎏心.webp"},
    { name: "辉骑面铠", en: "Starlight Rider Faceplate", short: "比专", eshort: "SBily", tag: "up", tierId: "tier_S",img:"../img/ZZZ/weapon/5/辉骑面铠.webp"},
    { name: "朔月裁霜", en: "Frostrafall Sickle", short: "普专", eshort: "Prome", tag: "up", tierId: "tier_S",img:"../img/ZZZ/weapon/5/朔月裁霜.webp" },
    { name: "鳞齿寻踪", en: "Serpentine Seeker", short: "蛇专", eshort: "Cisia", tag: "up", tierId: "tier_S", img:"../img/ZZZ/weapon/5/鳞齿寻踪.webp" },
    { name: "霓虹妄想", en: "Neon Fantasies", short: "南专", eshort: "NGong", tag: "up", tierId: "tier_S", img:"../img/ZZZ/weapon/5/霓虹妄想.webp" },
    { name: "壳中之灵", en: "Angel in the Shell", short: "爱专", eshort: "Aria", tag: "up", tierId: "tier_S", img:"../img/ZZZ/weapon/5/壳中之灵.webp" },
    { name: "思络成歌", en: "Thoughtbop", short: "千专", eshort: "Sunna", tag: "up", tierId: "tier_S", img:"../img/ZZZ/weapon/5/思络成歌.webp" },
    { name: "云霓弧光", en: "Cloudcleave Radiance", short: "光专", eshort: "YSunG", tag: "up", tierId: "tier_S", img:"../img/ZZZ/weapon/5/云霓弧光.webp" },
    { name: "半糖雪兔", en: "Half-Sugar Bunny", short: "照专", eshort: "Zhao", tag: "up", tierId: "tier_S", img:"../img/ZZZ/weapon/5/半糖雪兔.webp" },
    { name: "怒目金刚", en: "Wrathful Vajra", short: "般专", eshort: "Bany", tag: "up", tierId: "tier_S", img:"../img/ZZZ/weapon/5/怒目金刚.webp" },
    { name: "昨夜来电", en: "Yesterday Calls", short: "琉专", eshort: "Diaiy", tag: ["up","reup"], tierId: "tier_S", img:"../img/ZZZ/weapon/5/昨夜来电.webp" },
    { name: "海妖摇篮", en: "Kraken's Cradle", short: "海专", eshort: "Yidha", tag: "up", tierId: "tier_S", img:"../img/ZZZ/weapon/5/海妖摇篮.webp" },
    { name: "铸梦炉歌", en: "Dreamlit Hearth", short: "卢专", eshort: "Lucia", tag: "up", tierId: "tier_S", img:"../img/ZZZ/weapon/5/铸梦炉歌.webp" },
    { name: "嚣枪喧焰", en: "Bellicose Blaze", short: "奥专", eshort: "Orphi", tag: "up", tierId: "tier_S", img:"../img/ZZZ/weapon/5/嚣枪喧焰.webp" },
    { name: "机巧心种", en: "Cordis Germina", short: "德专", eshort: "Seed", tag: "up", tierId: "tier_S", img:"../img/ZZZ/weapon/5/机巧心种.webp" },
    { name: "十方锻星", en: "Pracriced Perfection", short: "爱专", eshort: "Alice", tag: ["up","reup"], tierId: "tier_S", img:"../img/ZZZ/weapon/5/十方锻星.webp" },
    { name: "狸法七变化", en: "Metanukimorphosis", short: "柚专", eshort: "Yuzu", tag: ["up","reup"], tierId: "tier_S", img:"../img/ZZZ/weapon/5/狸法七变化.webp" },
    { name: "福虓炉炉", en: "Roaring Fur-nace", short: "橘专", eshort: "Jufu", tag: "up", tierId: "tier_S", img:"../img/ZZZ/weapon/5/福虓炉炉.webp" },
    { name: "青溟笼舍", en: "Qingming Birdcage", short: "仪专", eshort: "Yxuan", tag: "up", tierId: "tier_S", img:"../img/ZZZ/weapon/5/青溟笼舍.webp" },
    { name: "千面日陨", en: "Myriad Eclipse", short: "雨专", eshort: "Hugo", tag: "up", tierId: "tier_S", img:"../img/ZZZ/weapon/5/千面日陨.webp" },
    { name: "飞鸟星梦", en: "Flight of Fancy", short: "薇专", eshort: "vian", tag: "up", tierId: "tier_S", img:"../img/ZZZ/weapon/5/飞鸟星梦.webp" },
    { name: "索魂影眸", en: "Spectral Gaze", short: "板专", eshort: "Trig", tag: "up", tierId: "tier_S", img:"../img/ZZZ/weapon/5/索魂影眸.webp" },
    { name: "牺牲洁纯", en: "Severed Innocence", short: "安专", eshort: "Anby", tag: ["up","reup"], tierId: "tier_S", img:"../img/ZZZ/weapon/5/牺牲洁纯.webp" },
    { name: "心弦夜响", en: "Heartstring Nocturne", short: "伊专", eshort: "Evely", tag: "up", tierId: "tier_S", img:"../img/ZZZ/weapon/5/心弦夜响.webp" },
    { name: "玲珑妆匣", en: "Elegant Vanity", short: "耀专", eshort: "Astra", tag: ["up","reup"], tierId: "tier_S", img:"../img/ZZZ/weapon/5/玲珑妆匣.webp" },
    { name: "残心青囊", en: "Zanshin Herb Case", short: "浅专", eshort: "Asaba", tag: ["up","reup"], tierId: "tier_S", img:"../img/ZZZ/weapon/5/残心青囊.webp" },
    { name: "霞落星殿", en: "Hailstorm Shrine", short: "雅专", eshort: "Hoshi", tag: "up", tierId: "tier_S", img:"../img/ZZZ/weapon/5/霞落星殿.webp" },
    { name: "焰心桂冠", en: "Blazing Laurel", short: "莱专", eshort: "Light", tag: "up", tierId: "tier_S", img:"../img/ZZZ/weapon/5/焰心桂冠.webp" },
    { name: "时流贤者", en: "Timeweaver", short: "柳专", eshort: "Yanag", tag: ["up","custom_offrate"], tierId: "tier_S", img:"../img/ZZZ/weapon/5/时流贤者.webp" },
    { name: "灼心摇壶", en: "Flamemaker Shaker", short: "柏专", eshort: "Burni", tag: "up", tierId: "tier_S", img:"../img/ZZZ/weapon/5/灼心摇壶.webp" },
    { name: "奔袭獠牙", en: "Tusks of Fury", short: "凯专", eshort: "Caesa", tag: ["up","custom_offrate"], tierId: "tier_S", img:"../img/ZZZ/weapon/5/奔袭獠牙.webp" },
    { name: "淬锋钳刺", en: "Sharpened Stinger", short: "简专", eshort: "Jane", tag: "up", tierId: "tier_S", img:"../img/ZZZ/weapon/5/淬锋钳刺.webp" },
    { name: "玉壶青冰", en: "Ice-Jade Teapot", short: "青专", eshort: "QingY", tag: "up", tierId: "tier_S", img:"../img/ZZZ/weapon/5/玉壶青冰.webp" },
    { name: "防爆者VI型", en: "Riot Suppressor Mark VI", short: "鸢专", eshort: "ZhuY", tag: ["up","custom_offrate"], tierId: "tier_S", img:"../img/ZZZ/weapon/5/防爆者VI型.webp" },
    { name: "深海访客", en: "Deep Sea Visitor", short: "艾专", eshort: "Ellen", tag: "up", tierId: "tier_S", img:"../img/ZZZ/weapon/5/深海访客.webp" },

    { name: "啜泣摇篮", en: "Weeping Cradle", short: "丽专", eshort: "Lina", tag: "std", tierId: "tier_S", img:"../img/ZZZ/weapon/5/啜泣摇篮.webp" },
    { name: "拘缚者", en: "The Restrained", short: "狼专", eshort: "Lyca", tag: "std", tierId: "tier_S", img:"../img/ZZZ/weapon/5/拘缚者.webp" },
    { name: "嵌合编译器", en: "Fusion Compiler", short: "格专", eshort: "Grace", tag: "std", tierId: "tier_S", img:"../img/ZZZ/weapon/5/嵌合编译器.webp" },
    { name: "燃狱齿轮", en: "Hellfire Gears", short: "珂专", eshort: "Kleda", tag: "std", tierId: "tier_S", img:"../img/ZZZ/weapon/5/燃狱齿轮.webp" },
    { name: "硫磺石", en: "The Brimstone", short: "11专", eshort: "11th", tag: "std", tierId: "tier_S", img:"../img/ZZZ/weapon/5/硫磺石.webp" },
    { name: "钢铁肉垫", en: "Steel Cushion", short: "猫专", eshort: "Neko", tag: "std", tierId: "tier_S", img:"../img/ZZZ/weapon/5/钢铁肉垫.webp" },

    // --- A级音擎 (可选UP: wep_A1) ---
    { name: "燔火胧夜", en: "Grill O'Wisp", short: "斗专", eshort: "Manat", tag: ["normal", "custom_offrate"], tierId: "tier_A", img: "../img/ZZZ/weapon/4/燔火胧夜.webp" },
    { name: "震元奇枢", en: "Tremor Trigram Vessel", short: "潘专", eshort: "Yinhu", tag: ["normal", "custom_offrate"], tierId: "tier_A", img: "../img/ZZZ/weapon/4/震元奇枢.webp" },
    { name: "裁纸刀", en: "Box Cutter", short: "喵专", eshort: "Pulch", tag: ["normal", "custom_offrate"], tierId: "tier_A", img: "../img/ZZZ/weapon/4/裁纸刀.webp" },
    { name: "维序者-特化型", en: "Peacekeeper - Specialized", short: "塞专", eshort: "Seth", tag: ["normal", "custom_offrate"], tierId: "tier_A", img: "../img/ZZZ/weapon/4/维序者-特化型.webp" },
    { name: "德玛拉电池Ⅱ型", en: "Demara Battery Mark II", short: "安专", eshort: "Anby", tag: ["normal", "custom_offrate"], tierId: "tier_A", img: "../img/ZZZ/weapon/4/德玛拉电池Ⅱ型.webp" },
    { name: "聚宝箱", en: "The Vault", short: "妮专", eshort: "Nicol", tag: ["normal", "custom_offrate"], tierId: "tier_A", img: "../img/ZZZ/weapon/4/聚宝箱.webp" },
    { name: "家政员", en: "Housekeeper", short: "琳专", eshort: "Corin", tag: ["normal", "custom_offrate"], tierId: "tier_A", img: "../img/ZZZ/weapon/4/家政员.webp" },
    { name: "仿制星徽引擎", en: "Starlight Engine Replica", short: "比专", eshort: "Billy", tag: ["normal", "custom_offrate"], tierId: "tier_A", img: "../img/ZZZ/weapon/4/仿制星徽引擎.webp" },
    { name: "旋钻机-赤轴", en: "Drill Rig - Red Axis", short: "东专", eshort: "Anton", tag: ["normal", "custom_offrate"], tierId: "tier_A", img: "../img/ZZZ/weapon/4/旋钻机-赤轴.webp" },
    { name: "比格气缸", en: "Big Cylinder", short: "本专", eshort: "Ben", tag: ["normal", "custom_offrate"], tierId: "tier_A", img: "../img/ZZZ/weapon/4/比格气缸.webp" },
    { name: "含羞恶面", en: "Bashful Demon", short: "苍专", eshort: "Souka", tag: ["normal", "custom_offrate"], tierId: "tier_A", img: "../img/ZZZ/weapon/4/含羞恶面.webp" },
    { name: "好斗的阿炮", en: "Kaboom the Cannon", short: "露专", eshort: "Lucy", tag: ["normal", "custom_offrate"], tierId: "tier_A", img: "../img/ZZZ/weapon/4/好斗的阿炮.webp" },
    { name: "轰鸣座驾", en: "Roaring Ride", short: "派专", eshort: "Piper", tag: ["normal", "custom_offrate"], tierId: "tier_A", img: "../img/ZZZ/weapon/4/轰鸣座驾.webp" },

    // --- A级音擎 (全可出排除A1: wep_A2) ---
    { name: "雨林饕客", en: "Rainforest Gourmet", short: "雨林", eshort: "Gourm", tag:"normal", tierId: "tier_A", img: "../img/ZZZ/weapon/4/雨林饕客.webp" },
    { name: "贵重骨核", en: "Precious Fossilized Core", short: "骨核", eshort: "Core", tag:"normal", tierId: "tier_A", img: "../img/ZZZ/weapon/4/贵重骨核.webp" },
    { name: "兔能环", en: "Bunny Band", short: "兔能", eshort: "Bunny", tag:"normal", tierId: "tier_A", img: "../img/ZZZ/weapon/4/兔能环.webp" },
    { name: "街头巨星", en: "Street Superstar", short: "街头", eshort: "Star", tag:"normal", tierId: "tier_A", img: "../img/ZZZ/weapon/4/街头巨星.webp" },
    { name: "星徽引擎", en: "Starlight Engine", short: "星徽", eshort: "Engin", tag:"normal", tierId: "tier_A", img: "../img/ZZZ/weapon/4/星徽引擎.webp" },
    { name: "正版变身器", en: "Original Transmorpher", short: "变身", eshort: "Trans", tag:"normal", tierId: "tier_A", img: "../img/ZZZ/weapon/4/正版变身器.webp" },
    { name: "幻变魔方", en: "Puzzle Sphere", short: "魔方", eshort: "Puzzl", tag:"normal", tierId: "tier_A", img: "../img/ZZZ/weapon/4/幻变魔方.webp" },
    { name: "时光切片", en: "Slice of Time", short: "切片", eshort: "Slice", tag:"normal", tierId: "tier_A", img: "../img/ZZZ/weapon/4/时光切片.webp" },
    { name: "人为刀俎", en: "Steam Oven", short: "刀俎", eshort: "Oven", tag:"normal", tierId: "tier_A", img: "../img/ZZZ/weapon/4/人为刀俎.webp" },
    { name: "双生泣星", en: "Weeping Gemini", short: "双生", eshort: "Gemin", tag:"normal", tierId: "tier_A", img: "../img/ZZZ/weapon/4/双生泣星.webp" },
    // TODO: 待官方Wiki更新后校对「喵运当头」英文名称、简称与照片
    { name: "喵运当头", en: "Meow Luck Ahead", short: "喵运", eshort: "MeowL", tag:"normal", tierId: "tier_A", img: "../img/ZZZ/weapon/4/喵运当头.webp" },

    // --- 赠送音擎 (活动/大月卡音擎: wep_A3) ---
    { name: "血髓秘匣", en: "Blood Marrow Secret Box", short: "血髓", eshort: "Blood", tag: "gift", tierId: "tier_S", img: "../img/ZZZ/weapon/4/血髓秘匣.webp" },
    { name: "日冕遗蜕", en: "Sol Exuvia", short: "佩专", eshort: "Pyro", tag: "gift", tierId: "tier_S", img: "../img/ZZZ/weapon/5/日冕遗蜕.webp" },
    { name: "咚哒回声", en: "Boisterous Echoes", short: "咚哒", eshort: "Echo", tag: "gift", tierId: "tier_A", img: "../img/ZZZ/weapon/4/咚哒回声.webp" },
    { name: "炎炙沸釜", en: "The Simmering Pot", short: "沸釜", eshort: "Pot", tag: "gift", tierId: "tier_A", img: "../img/ZZZ/weapon/4/炎炙沸釜.webp" },
    { name: "青漪灵鼎", en: "Cauldron of Clarity", short: "灵鼎", eshort: "Clari", tag: "gift", tierId: "tier_A", img: "../img/ZZZ/weapon/4/青漪灵鼎.webp" },
    { name: "电波漫步", en: "Radiowave Journey", short: "电波", eshort: "Radio", tag: "gift", tierId: "tier_A", img: "../img/ZZZ/weapon/4/电波漫步.webp" },
    { name: "光影刻刀", en: "Reel Projector", short: "刻刀", eshort: "Reel", tag: "gift", tierId: "tier_A", img: "../img/ZZZ/weapon/4/光影刻刀.webp" },
    { name: "强音热望", en: "Marcato Desire", short: "强音", eshort: "Desir", tag: "gift", tierId: "tier_A", img: "../img/ZZZ/weapon/4/强音热望.webp" },
    { name: "鎏金花信", en: "Gilded Blossom", short: "花信", eshort: "Gild", tag: "gift", tierId: "tier_A", img: "../img/ZZZ/weapon/4/鎏金花信.webp" },
    { name: "左轮转子", en: "Six Shooter", short: "左轮", eshort: "Shoot", tag: "gift", tierId: "tier_A", img: "../img/ZZZ/weapon/4/左轮转子.webp" },
    { name: "逍遥游球", en: "Unfettered Game Ball", short: "游球", eshort: "Ball", tag: "gift", tierId: "tier_A", img: "../img/ZZZ/weapon/4/逍遥游球.webp" },
    { name: "加农转子", en: "Cannon Rotor", short: "加农", eshort: "Rotor", tag: "gift", tierId: "tier_A", img: "../img/ZZZ/weapon/4/加农转子.webp" },
    { name: "春日融融", en: "Spring Embrace", short: "春日", eshort: "Embra", tag: "gift", tierId: "tier_A", img: "../img/ZZZ/weapon/4/春日融融.webp" },
    { name: "触电唇彩", en: "Electro-Lip Gloss", short: "唇彩", eshort: "Gloss", tag: "gift", tierId: "tier_A", img: "../img/ZZZ/weapon/4/触电唇彩.webp" },

    // --- 3星音擎追加 ---
    { name: "「月相」-弦", en: "[Lunar] Semiluna", short: "弦", eshort: "Semil", tag: "normal", tierId: "tier_B", img: "../img/ZZZ/weapon/3/「月相」-弦.webp" },
    { name: "「残响」-Ⅰ型", en: "[Reverb] Mark I", short: "I型", eshort: "Rev1", tag: "normal", tierId: "tier_B", img: "../img/ZZZ/weapon/3/I 型.webp" },
    { name: "「残响」-Ⅱ型", en: "[Reverb] Mark II", short: "II型", eshort: "Rev2", tag: "normal", tierId: "tier_B", img: "../img/ZZZ/weapon/3/II 型.webp" },
    { name: "「残响」-Ⅲ型", en: "[Reverb] Mark III", short: "III型", eshort: "Rev3", tag: "normal", tierId: "tier_B", img: "../img/ZZZ/weapon/3/III 型.webp" },
    { name: "「恒等式」-本格", en: "[Identity] Base", short: "本格", eshort: "Base", tag: "normal", tierId: "tier_B", img: "../img/ZZZ/weapon/3/本格.webp" },
    { name: "「湍流」-矢型", en: "[Vortex] Arrow", short: "矢型", eshort: "Arrow", tag: "normal", tierId: "tier_B", img: "../img/ZZZ/weapon/3/矢型.webp" },
    { name: "「电磁暴」-叁式", en: "[Magnetic Storm] Charlie", short: "叁型", eshort: "MagC", tag: "normal", tierId: "tier_B", img: "../img/ZZZ/weapon/3/叁型.webp" },
    { name: "「恒等式」-变格", en: "[Identity] Inflection", short: "变格", eshort: "Infle", tag: "normal", tierId: "tier_B", img: "../img/ZZZ/weapon/3/变格.webp" },
    { name: "「湍流」-斧型", en: "[Vortex] Hatchet", short: "斧型", eshort: "Hatch", tag: "normal", tierId: "tier_B", img: "../img/ZZZ/weapon/3/斧型.webp" },
    { name: "「电磁暴」-贰式", en: "[Magnetic Storm] Bravo", short: "贰型", eshort: "MagB", tag: "normal", tierId: "tier_B", img: "../img/ZZZ/weapon/3/贰型.webp" },
    { name: "「月相」-朔", en: "[Lunar] Noviluna", short: "朔", eshort: "Novi", tag: "normal", tierId: "tier_B", img: "../img/ZZZ/weapon/3/朔.webp" },
    { name: "「灰烬」-钴蓝", en: "[Cinder] Cobalt", short: "钴蓝", eshort: "Coba", tag: "normal", tierId: "tier_B", img: "../img/ZZZ/weapon/3/钴蓝.webp" },
    { name: "「月相」-晦", en: "[Lunar] Decrescent", short: "晦", eshort: "Decr", tag: "normal", tierId: "tier_B", img: "../img/ZZZ/weapon/3/晦.webp" },
    { name: "「月相」-望", en: "[Lunar] Pleniluna", short: "望", eshort: "Pleni", tag: "normal", tierId: "tier_B", img: "../img/ZZZ/weapon/3/望.webp" },
    { name: "「湍流」-铳型", en: "[Vortex] Revolver", short: "铳型", eshort: "Revo", tag: "normal", tierId: "tier_B", img: "../img/ZZZ/weapon/3/铳型.webp" },
    { name: "「电磁暴」-壹式", en: "[Magnetic Storm] Alpha", short: "壹型", eshort: "MagA", tag: "normal", tierId: "tier_B", img: "../img/ZZZ/weapon/3/壹型.webp" },
];

const ZZZ_BANGBOO = [
    { name: "艾瑞儿", en: "Ariel", short: "艾瑞", eshort: "Ariel", tag: "up", tierId: "tier_S", img:"../img/ZZZ/bangboo/S/艾瑞儿.webp"},
    { name: "超级杰克", en: "Ultra Jake", short: "杰克", eshort: "Jake", tag: "up", tierId: "tier_S", img:"../img/ZZZ/bangboo/S/超级杰克.webp"},
    { name: "阿饭", en: "Biggest Fan", short: "饭", eshort: "Fan", tag: "up", tierId: "tier_S", img:"../img/ZZZ/bangboo/S/阿饭.webp"},
    { name: "芽芽", en: "Sproutboo", short: "芽", eshort: "Sprou", tag: "up", tierId: "tier_S", img:"../img/ZZZ/bangboo/S/芽芽.webp" },
    { name: "比克布利克", en: "Birkblick", short: "比", eshort: "Brik", tag: "up", tierId: "tier_S", img:"../img/ZZZ/bangboo/S/比克布利克.webp"},
    { name: "墨丘利", en: "Mercury", short: "墨", eshort: "Mercu", tag: "up", tierId: "tier_S", img:"../img/ZZZ/bangboo/S/墨丘利.webp"},
    { name: "爱丝弥小姐", en: "Miss Esme", short: "爱", eshort: "Esme", tag: "up", tierId: "tier_S", img:"../img/ZZZ/bangboo/S/爱丝弥小姐.webp"},
    { name: "狮耶", en: "Belion", short: "狮", eshort: "Blion", tag: "up", tierId: "tier_S", img:"../img/ZZZ/bangboo/S/狮耶.webp"},
    { name: "罗宾", en: "Robin", short: "罗", eshort: "Robi", tag: "up", tierId: "tier_S", img:"../img/ZZZ/bangboo/S/罗宾.webp"},
    { name: "咔嚓仔", en: "Snap", short: "咔", eshort: "Snap", tag: "up", tierId: "tier_S", img:"../img/ZZZ/bangboo/S/咔嚓仔.webp"},
    { name: "格列佛探员", en: "Agent Gulliver", short: "格", eshort: "Agent", tag: "up", tierId: "tier_S", img:"../img/ZZZ/bangboo/S/格列佛探员.webp"},
    { name: "赤红莫库斯", en: "Red Moccus", short: "赤", eshort: "Red", tag: "up", tierId: "tier_S", img:"../img/ZZZ/bangboo/S/赤红莫库斯.webp"},
    { name: "阿崔巡查", en: "Officer Cui", short: "崔", eshort: "OfCui", tag: "up", tierId: "tier_S", img:"../img/ZZZ/bangboo/S/阿崔巡查.webp"},
    { name: "鲨牙布", en: "Sharkboo", short: "鲨", eshort: "Shark", tag: "up", tierId: "tier_S", img:"../img/ZZZ/bangboo/S/鲨牙布.webp"},
    { name: "飙速布", en: "Rocketboo", short: "飙", eshort: "Rocket", tag: "up", tierId: "tier_S", img:"../img/ZZZ/bangboo/S/飙速布.webp"},
    { name: "插头布", en: "Plugboo", short: "插", eshort: "Plug", tag: "up", tierId: "tier_S", img:"../img/ZZZ/bangboo/S/插头布.webp"},
    { name: "共鸣布", en: "Resonaboo", short: "鸣", eshort: "Reson", tag: "up", tierId: "tier_S", img:"../img/ZZZ/bangboo/S/共鸣布.webp"},
    { name: "左轮布", en: "Bangvolver", short: "左", eshort: "vover", tag: "up", tierId: "tier_S", img:"../img/ZZZ/bangboo/S/左轮布.webp"},
    { name: "阿全", en: "Safety", short: "全", eshort: "Safe", tag: "up", tierId: "tier_S", img:"../img/ZZZ/bangboo/S/阿全.webp"},
    { name: "艾米莉安", en: "Amillion", short: "艾", eshort: "Amill", tag: "up", tierId: "tier_S", img:"../img/ZZZ/bangboo/S/艾米莉安.webp"},
    { name: "巴特勒", en: "Butler", short: "巴", eshort: "Butle", tag: "up", tierId: "tier_S", img:"../img/ZZZ/bangboo/S/巴特勒.webp"},

    // --- A级邦布 ---
    { name: "企鹅布", en: "Penguinboo", short: "企鹅", eshort: "Pengu", tag: "normal", tierId: "tier_A", img: "../img/ZZZ/bangboo/A/企鹅布.webp" },
    { name: "寻宝布", en: "Exploreboo", short: "寻宝", eshort: "Explo", tag: "normal", tierId: "tier_A", img: "../img/ZZZ/bangboo/A/寻宝布.webp" },
    { name: "扑击布", en: "Sumoboo", short: "扑击", eshort: "Sumo", tag: "normal", tierId: "tier_A", img: "../img/ZZZ/bangboo/A/扑击布.webp" },
    { name: "纸壳布", en: "Paperboo", short: "纸壳", eshort: "Paper", tag: "normal", tierId: "tier_A", img: "../img/ZZZ/bangboo/A/纸壳布.webp" },
    { name: "纸袋布", en: "Bagboo", short: "纸袋", eshort: "Bag", tag: "normal", tierId: "tier_A", img: "../img/ZZZ/bangboo/A/纸袋布.webp" },
    { name: "泪眼布", en: "Cryboo", short: "泪眼", eshort: "Cry", tag: "normal", tierId: "tier_A", img: "../img/ZZZ/bangboo/A/泪眼布.webp" },
    { name: "果核布", en: "Avocaboo", short: "果核", eshort: "Avoca", tag: "normal", tierId: "tier_A", img: "../img/ZZZ/bangboo/A/果核布.webp" },
    { name: "飞靶布", en: "Boollseye", short: "飞靶", eshort: "Bleye", tag: "normal", tierId: "tier_A", img: "../img/ZZZ/bangboo/A/飞靶布.webp" },
    { name: "电击布", en: "Electroboo", short: "电击", eshort: "Elect", tag: "normal", tierId: "tier_A", img: "../img/ZZZ/bangboo/A/电击布.webp" },
    { name: "磁力布", en: "Magnetiboo", short: "磁力", eshort: "Magne", tag: "normal", tierId: "tier_A", img: "../img/ZZZ/bangboo/A/磁力布.webp" },
    { name: "不良布", en: "Baddieboo", short: "不良", eshort: "Baddi", tag: "normal", tierId: "tier_A", img: "../img/ZZZ/bangboo/A/不良布.webp" },
    { name: "恶魔布", en: "Devilboo", short: "恶魔", eshort: "Devil", tag: "normal", tierId: "tier_A", img: "../img/ZZZ/bangboo/A/恶魔布.webp" },

    // --- A级邦布 (活动赠送) ---
    { name: "气压布", en: "Boooressure", short: "气压", eshort: "Press", tag: "gift", tierId: "tier_A", img: "../img/ZZZ/bangboo/A/气压布.webp" },
    { name: "乐玩布", en: "Bild N. Boolok", short: "乐玩", eshort: "Bild", tag: "gift", tierId: "tier_A", img: "../img/ZZZ/bangboo/A/乐玩布.webp" },
    { name: "加班布", en: "Overtimeboo", short: "加班", eshort: "Overt", tag: "gift", tierId: "tier_A", img: "../img/ZZZ/bangboo/A/加班布.webp" },
    { name: "圣剑布", en: "Excaliboo", short: "圣剑", eshort: "Excal", tag: "gift", tierId: "tier_A", img: "../img/ZZZ/bangboo/A/圣剑布.webp" },
    { name: "招财布", en: "Luckyboo", short: "招财", eshort: "Lucky", tag: "gift", tierId: "tier_A", img: "../img/ZZZ/bangboo/A/招财布.webp" },
    { name: "幽浮布", en: "Ufoboo", short: "幽浮", eshort: "Ufo", tag: "gift", tierId: "tier_A", img: "../img/ZZZ/bangboo/A/幽浮布.webp" },
    { name: "格斗布", en: "Brawlerboo", short: "格斗", eshort: "Brawl", tag: "gift", tierId: "tier_A", img: "../img/ZZZ/bangboo/A/格斗布.webp" },
    { name: "骑士布", en: "Knightboo", short: "骑士", eshort: "Knigh", tag: "gift", tierId: "tier_A", img: "../img/ZZZ/bangboo/A/骑士布.webp" },

];

// 🌟 关键：在最后合并导出时，用一行 map 自动给它们赋予 category！
// 这样你既不需要手动删掉 ZZZ_CHAR，也不需要在几百条数据里人肉打 category: 'char'！
const ZZZ_DB = [
    ...ZZZ_CHAR.map(i => ({ ...i, category: 'char' })),
    ...ZZZ_WEAPON.map(i => ({ ...i, category: 'wep' })),
    ...ZZZ_BANGBOO.map(i => ({ ...i, category: 'pet' }))
];

//  全局稀有度 (Tier) 定义
const ZZZ_GLOBAL_TIERS = [
    { id: 'tier_S', name: 'S级', en: 'S-Rank', color: '#f1c40f' },
    { id: 'tier_A', name: 'A级', en: 'A-Rank', color: '#9b59b6' },
    { id: 'tier_B', name: 'B级', en: 'B-Rank', color: '#3498db' }
];

const ZZZ_SETUP_RULES = {
    gameName: "绝区零",enGameName: "Zenless Zone Zero",

    categories: [
        { id: 'char', name: '代理人', en: 'Agent', icon: '👤' },
        { id: 'wep',  name: '音擎',   en: 'W-Engine', icon: '🗡️' },
        { id: 'pet',  name: '邦布',   en: 'Bangboo', icon: '🐾' }
    ],

    tagDefinitions: {
        up:             { name: "限定",     en: "Limited",     enShort: "UP",   color: "#f1c40f", textColor: "#000" },
        reup:           { name: "不歪",     en: "Guaranteed",  enShort: "Win",  color: "#f1c40f", textColor: "#000" },
        custom_offrate: { name: "定制调频", en: "Customized",  enShort: "Cust", color: "#e67e22", textColor: "#fff" },
        std:            { name: "常驻",     en: "Standard",    enShort: "Std",  color: "#3498db", textColor: "#fff" },
        gift:           { name: "赠送",     en: "Gift/Free",   enShort: "Free", color: "#2ecc71", textColor: "#000" },
        normal:         { name: "副产物",   en: "Regular",     enShort: "Norm", color: "#95a5a6", textColor: "#000" },
    },

    overflowRules: {char: 7,wep: 5,pet: 5,},
};

// --- 预设卡池概率规则 ---
const ZZZ_POOL_RULES = {
    // 角色限定池 (独家频段)
        char_up: {
        info: { name: "独家频段", en: "Exclusive Channel", icon: "👤", badgeColor: "#f1c40f" },

        // 0. 卡池图鉴与标签装配
        assembly: {
            tierRules: {
                // S 级：限定角色 UP，歪出常驻角色
                tier_S: {
                    mode: 'up_split',
                    upCats: ['char'],
                    offrateCats: ['char'],
                    upTags: ['up'],
                    offrateTags: ['std','custom_offrate']
                },
                // A 级：陪跑 2 位 A 级角色 UP，可歪常规角色与音擎
                tier_A: {
                    mode: 'up_split',
                    upCats: ['char'],
                    offrateCats: ['char', 'wep'],
                    upTags: ['custom_offrate'],
                    offrateTags: ['normal']
                },
                // B 级：常规 3 星音擎垫刀
                tier_B: {
                    mode: 'flat',
                    flatCats: ['wep'],
                    tags: ['normal']
                }
            }
        },

        // 1. 稀有度出货概率与细分概率
        tiers: [
            { id: 'tier_S', prob: 0.6, isGold: true },
            { 
                id: 'tier_A', 
                prob: 9.4,
                subProbs: [
                    { prob: 7.05, conditions: [{ cat: 'char', tags: ['normal'] }] },
                    { prob: 2.35, conditions: [{ cat: 'wep', tags: ['normal'] }] }
                ]
            },
            { id: 'tier_B', prob: 90.0 }
        ],

        // 3. 全星级保底与动态概率中心
        pities: [
            // S 级保底：90 抽必出，50% UP率，歪 1 次后大保底必出，74~89 抽动态软保底递增 6%
            {
                tierId: 'tier_S',
                pulls: 90,
                resetOnHit: true,
                enableUp: true,
                upRate: 0.5,
                useGuarantee: true,
                guaranteeMode: 'classic',
                guaranteeLimit: 1,
                softEnabled: true,
                softRules: [
                    { start: 74, end: 89, inc: 0.06 }
                ]
            },
            // A 级保底：10 抽必出，50% 获得当期陪跑 UP 角色，歪 1 次后下次必出 UP
            {
                tierId: 'tier_A',
                pulls: 10,
                resetOnHit: true,
                enableUp: true,
                upRate: 0.5,
                useGuarantee: true,
                guaranteeMode: 'classic',
                guaranteeLimit: 1,
                softEnabled: false
            }
        ],

        // 12. 模拟器预选限制
        preSelect: {
            enabled: true,
            tiers: {
                tier_S: { upMin: 1, upMax: 1, stdMin: 6, stdMax: 6 },
                tier_A: { upMin: 2, upMax: 2, stdMin: 0, stdMax: 999 },
                tier_B: { stdMin: 0, stdMax: 999 }
            }
        },

        lifecycle: {allowRotation: false,}
    },
    // =========================================================================
    // 2. 音擎限定池 (音擎频段)
    // =========================================================================
    wep_up: {
        info: { name: "音擎频段", en: "W-Engine Channel", icon: "🗡️", badgeColor: "#3498db" },

        // 0. 卡池图鉴与标签装配
        assembly: {
            tierRules: {
                // S 级：限定音擎 UP，可歪常驻音擎与定制调频音擎
                tier_S: {
                    mode: 'up_split',
                    upCats: ['wep'],                        // UP 仅限音擎
                    offrateCats: ['wep'],                   // 歪也仅出音擎 (音擎池不出角色)
                    upTags: ['up'],
                    offrateTags: ['std', 'custom_offrate']
                },
                // A 级：UP 2 件定制调频音擎，可歪副产物音擎与角色
                tier_A: {
                    mode: 'up_split',
                    upCats: ['wep'],                        // UP 仅限音擎
                    offrateCats: ['char', 'wep'],            // 副产物包含角色与常规音擎
                    upTags: ['custom_offrate'],
                    offrateTags: ['normal']
                },
                // B 级：全量平分 3 星音擎
                tier_B: {
                    mode: 'flat',
                    flatCats: ['wep'],
                    tags: ['normal']
                }
            }
        },

        // 1. 稀有度概率分配与细分绝对概率
        tiers: [
            { id: 'tier_S', prob: 1.0, isGold: true },
            { 
                id: 'tier_A', 
                prob: 15.0,
                // A 级 15%：其中音擎占 75% (11.25%)，代理人占 25% (3.75%)
                subProbs: [
                    { prob: 11.25, conditions: [{ cat: 'wep', tags: ['normal'] }] },
                    { prob: 3.75, conditions: [{ cat: 'char', tags: ['normal'] }] }
                ]
            },
            { id: 'tier_B', prob: 84.0 }
        ],

        // 3. 全星级保底：S级80抽必出(75%不歪)，63~79抽软保底；A级10抽必出(75%不歪)
        pities: [
            {
                tierId: 'tier_S',
                pulls: 80,
                resetOnHit: true,
                enableUp: true,
                upRate: 0.75,
                useGuarantee: true,
                guaranteeMode: 'classic',
                guaranteeLimit: 1,
                softEnabled: true,
                softRules: [
                    { start: 63, end: 73, inc: 0.07 },
                    { start: 74, end: 79, inc: 0.035 }
                ]
            },
            {
                tierId: 'tier_A',
                pulls: 10,
                resetOnHit: true,
                enableUp: true,
                upRate: 0.75,
                useGuarantee: true,
                guaranteeMode: 'classic',
                guaranteeLimit: 1,
                softEnabled: false
            }
        ],

        // 12. 模拟器预选限制
        preSelect: {
            enabled: true,
            tiers: {
                tier_S: { upMin: 1, upMax: 1, stdMin: 6, stdMax: 6 }, // 选定 1 件 UP 音擎，常驻勾选 6 件
                tier_A: { upMin: 2, upMax: 2, stdMin: 0, stdMax: 999 },// 陪跑 2 件 A 级音擎
                tier_B: { stdMin: 0, stdMax: 999 }
            },
        },

        lifecycle: {allowRotation: false,},
    },

    char_up_2: {
        info: { name: "独家重映", en: "Exclusive Rerun", icon: "🔄", badgeColor: "#f1c40f" },

        // 0. 卡池图鉴与标签装配
        assembly: {
            tierRules: {
                tier_S: {
                    mode: 'up_split',
                    upCats: ['char'],
                    offrateCats: ['char'],
                    upTags: ['reup'],
                    offrateTags: ['std', 'custom_offrate']
                },
                // A 级不开放自选 UP，按常规池平分概率掉落
                tier_A: {
                    mode: 'flat',
                    flatCats: ['char', 'wep'],
                    tags: ['normal']
                },
                tier_B: {
                    mode: 'flat',
                    flatCats: ['wep'],
                    tags: ['normal']
                }
            }
        },

        // 1. 稀有度概率分配与细分绝对概率
        tiers: [
            { id: 'tier_S', prob: 0.6, isGold: true },
            { 
                id: 'tier_A', 
                prob: 9.4,
                subProbs: [
                    { prob: 7.05, conditions: [{ cat: 'char', tags: ['normal'] }] },
                    { prob: 2.35, conditions: [{ cat: 'wep', tags: ['normal'] }] }
                ]
            },
            { id: 'tier_B', prob: 90.0 }
        ],

        // 3. 全星级保底设定
        pities: [
            {
                tierId: 'tier_S',
                pulls: 90,
                resetOnHit: true,
                enableUp: true,
                upRate: 0.5,
                useGuarantee: true,
                guaranteeMode: 'classic',
                guaranteeLimit: 1,
                softEnabled: true,
                softRules: [
                    { start: 74, end: 89, inc: 0.06 }
                ]
            },
            {
                tierId: 'tier_A',
                pulls: 10,
                resetOnHit: true,
                enableUp: true,
                upRate: 0.5,
                useGuarantee: true,
                guaranteeMode: 'classic',
                guaranteeLimit: 1,
                softEnabled: false
            }
        ],
        // 8. 独家重映专属：首金 100% 不歪特权
        earlyUpRules: [
            { order: 1, upRate: 100 }
        ],

        // 模拟器预选限制 (A 级不可选 UP)
        preSelect: {
            enabled: true,
            tiers: {
                tier_S: { upMin: 1, upMax: 1, stdMin: 6, stdMax: 6 },
                tier_A: { stdMin: 0, stdMax: 999 }, // 🌟 禁用 A 级 UP 勾选
                tier_B: { stdMin: 0, stdMax: 999 }
            },
            upMin: 1, upMax: 1, stdMin: 6, stdMax: 6
        },

        lifecycle: {
            allowRotation: true,
            sharedPityParent: "",
            rotationMatrix: {
                inheritPityPulls: true,
                inheritGuaranteeState: true,
                resetEarlyUp: true,
            }
        }
    },

    wep_up_2: {
        info: { name: "音擎回响", en: "W-Engine Echo", icon: "🔄", badgeColor: "#3498db" },

        // 0. 卡池图鉴与标签装配
        assembly: {
            tierRules: {
                tier_S: {
                    mode: 'up_split',
                    upCats: ['wep'],
                    offrateCats: ['wep'],
                    upTags: ['reup'],
                    offrateTags: ['std', 'custom_offrate']
                },
                // A 级不开放自选 UP，按常规池平分概率掉落
                tier_A: {
                    mode: 'flat',
                    flatCats: ['char', 'wep'],
                    tags: ['normal']
                },
                tier_B: {
                    mode: 'flat',
                    flatCats: ['wep'],
                    tags: ['normal']
                }
            }
        },

        // 1. 稀有度概率分配与细分绝对概率
        tiers: [
            { id: 'tier_S', prob: 1.0, isGold: true },
            { 
                id: 'tier_A', 
                prob: 15.0,
                subProbs: [
                    { prob: 11.25, conditions: [{ cat: 'wep', tags: ['normal'] }] },
                    { prob: 3.75, conditions: [{ cat: 'char', tags: ['normal'] }] }
                ]
            },
            { id: 'tier_B', prob: 84.0 }
        ],

        // 3. 全星级保底设定
        pities: [
            {
                tierId: 'tier_S',
                pulls: 80,
                resetOnHit: true,
                enableUp: true,
                upRate: 0.75,
                useGuarantee: true,
                guaranteeMode: 'classic',
                guaranteeLimit: 1,
                softEnabled: true,
                softRules: [
                    { start: 63, end: 73, inc: 0.07 },
                    { start: 74, end: 79, inc: 0.035 }
                ]
            },
            {
                tierId: 'tier_A',
                pulls: 10,
                resetOnHit: true,
                enableUp: true,
                upRate: 0.75,
                useGuarantee: true,
                guaranteeMode: 'classic',
                guaranteeLimit: 1,
                softEnabled: false
            }
        ],

        // 首金 100% 获得当期选定音擎
        earlyUpRules: [
            { order: 1, upRate: 100 }
        ],

        // 12. 模拟器预选限制 (A 级不可选 UP)
        preSelect: {
            enabled: true,
            tiers: {
                tier_S: { upMin: 1, upMax: 1, stdMin: 6, stdMax: 6 },
                tier_A: { stdMin: 0, stdMax: 999 }, // 🌟 禁用 A 级 UP 勾选
                tier_B: { stdMin: 0, stdMax: 999 }
            },
            upMin: 1, upMax: 1, stdMin: 6, stdMax: 6
        },
        lifecycle: {
            allowRotation: true,
            sharedPityParent: "",
            rotationMatrix: {
                inheritPityPulls: true,
                inheritGuaranteeState: true,
                resetEarlyUp: true,
            }
        }
    },

    // =========================================================================
    // 5. 常驻频段 (常驻池，新手前50抽保底S级，首金定向出角色，300抽自选井)
    // =========================================================================
    mixed_std: {
        info: { name: "常驻频段", en: "Standard Channel", icon: "🏠", badgeColor: "#95a5a6" },

        // 0. 卡池图鉴与标签装配：全部星级均为平分池
        assembly: {
            tierRules: {
                tier_S: {
                    mode: 'flat',
                    flatCats: ['char', 'wep'],              // S 级常驻角色与常驻音擎混池
                    tags: ['std']
                },
                tier_A: {
                    mode: 'flat',
                    flatCats: ['char', 'wep'],              // A 级常规角色与常规音擎混池
                    tags: ['normal']
                },
                tier_B: {
                    mode: 'flat',
                    flatCats: ['wep'],
                    tags: ['normal']
                }
            }
        },

        // 1. 稀有度概率分配与细分绝对概率
        tiers: [
            { 
                id: 'tier_S', 
                prob: 0.6, 
                isGold: true,
                subProbs: [
                    { prob: 0.3, conditions: [{ cat: 'char', tags: ['std'] }] }, // S 角色占 0.3%
                    { prob: 0.3, conditions: [{ cat: 'wep', tags: ['std'] }] }    // S 音擎占 0.3%
                ]
            },
            { 
                id: 'tier_A', 
                prob: 9.4,
                subProbs: [
                    { prob: 4.7, conditions: [{ cat: 'char', tags: ['normal'] }] },
                    { prob: 4.7, conditions: [{ cat: 'wep', tags: ['normal'] }] }
                ]
            },
            { id: 'tier_B', prob: 90.0 }
        ],

        // 3. 全星级保底设定 (无大保底，平分出货)
        pities: [
            {
                tierId: 'tier_S',
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
                tierId: 'tier_A',
                pulls: 10,
                resetOnHit: true,
                enableUp: false,
                useGuarantee: false,
                softEnabled: false
            }
        ],

        // ① 新手前 50 抽内必得 S 级（若提前出金则自动作废）
        // ② 累计满 300 抽常驻自选 1 位常驻 S 级代理人
        sparkRules: [
            {
                limit: 50,
                type: "once",
                targetType: "custom_filter",
                targetTier: "tier_S",
                targetCats: ['char'],
                targetTags: ['std'],
                deliverMode: "random",
                cancelOnHit: true,                          // 提前出金则新手福利作废
                noReset: false                              // 重置保底垫刀计数
            },
            {
                limit: 300,
                type: "once",
                targetType: "custom_filter",
                targetTier: "tier_S",
                targetCats: ['char'],                       // 仅限常驻角色
                targetTags: ['std'],
                deliverMode: "selectable",                  // 🌟 玩家手动自选 (300抽常驻自选井)
                cancelOnHit: false,
                noReset: true                               // 白送兑换，不重置垫抽进度
            }
        ],

        // 9. 前 N 金类型定向：第 1 金锁定出代理人角色 (新手福利)
        goldCategorySequence: [
            { order: 1, targetCats: ['char'], targetTags: ['std'] }
        ],

        // 12. 模拟器预选限制 (常驻平铺无UP，常驻预选全部 12 件)
        preSelect: {
            enabled: true,
            tiers: {
                tier_S: { stdMin: 12, stdMax: 12 },
                tier_A: { stdMin: 0, stdMax: 999 },
                tier_B: { stdMin: 0, stdMax: 999 }
            },
        }
    },

    bangboo_up: {
        info: { name: "喧嚣频段", en: "Bangboo Channel", icon: "🐾", badgeColor: "#2ecc71" },

        // 0. 卡池图鉴与标签装配
        assembly: {
            tierRules: {
                tier_S: {
                    mode: 'up_split',
                    upCats: ['pet'],                        // 仅限邦布
                    offrateCats: [],                        // 纯 UP 无歪池
                    upTags: ['up'],
                    offrateTags: []
                },
                tier_A: {
                    mode: 'flat',
                    flatCats: ['pet'],
                    tags: ['normal']
                },
                tier_B: {
                    mode: 'flat',
                    flatCats: ['wep'],
                    tags: ['normal']
                }
            }
        },

        // 1. 稀有度概率分配与细分绝对概率
        tiers: [
            { id: 'tier_S', prob: 1.0, isGold: true },
            { id: 'tier_A', prob: 15.0 },
            { id: 'tier_B', prob: 84.0 }
        ],

        // 3. 全星级保底：S级80抽必出(100%命中自选UP邦布)，A级10抽必出
        pities: [
            {
                tierId: 'tier_S',
                pulls: 80,
                resetOnHit: true,
                enableUp: true,
                upRate: 1.0,                                // 100% 必定命中指定邦布
                useGuarantee: false,
                softEnabled: true,
                softRules: [
                    { start: 63, end: 73, inc: 0.07 },
                    { start: 74, end: 79, inc: 0.035 }
                ]
            },
            {
                tierId: 'tier_A',
                pulls: 10,
                resetOnHit: true,
                enableUp: false,
                useGuarantee: false,
                softEnabled: false
            }
        ],

        // 12. 模拟器预选限制 (S级定轨1只，无常驻副选)
        preSelect: {
            enabled: true,
            tiers: {
                tier_S: { upMin: 1, upMax: 1, stdMin: 0, stdMax: 0 },
                tier_A: { stdMin: 0, stdMax: 999 },
                tier_B: { stdMin: 0, stdMax: 999 }
            },
        },

        lifecycle: {allowRotation: false,}
    }
};