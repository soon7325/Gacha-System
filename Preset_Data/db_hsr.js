

//供复制：{ name: "", en: "", short: "", eshort: "", tag: "up" },
const HSR_CHAR = [
    { id: "hsr_char_tier_5_067", name: "耀嘉音", en: "Astra Yao", short: "耀", eshort: "Astra",tag: "collab" ,tierId: "tier_5" ,img : "img/ZZZ/char/5/耀嘉音.webp"},
    { id: "hsr_char_tier_5_066", name: "艾莲", en: "Ellen Joe", short: "艾", eshort: "Ellen",tag: "collab" ,tierId: "tier_5" ,img : "img/ZZZ/char/5/艾莲.webp"},
    { id: "hsr_char_tier_5_065", name: "星神★啊哈", en: "Aeon ★ Aha", short: "啊哈", eshort: "Aha",tag: "up" ,tierId: "tier_5" ,img : "img/HSR/char/5/星神★啊哈.webp"},
    { id: "hsr_char_tier_5_068", name: "真珠", en: "Pearl", short: "真珠", eshort: "Pearl",tag: "up" ,tierId: "tier_5" ,img : "img/HSR/char/5/真珠.webp"},
    { id: "hsr_char_tier_5_064", name: "砂金·戏浪", en: "Aventurine • Waveflair", short: "水砂", eshort: "WAven",tag: "up" ,tierId: "tier_5" ,img : "img/HSR/char/5/砂金·戏浪.webp"},
    { id: "hsr_char_tier_5_063", name: "知更鸟·晴歌", en: "Robin • Summeretto", short: "水鸟", eshort: "SRobi",tag: "up" ,tierId: "tier_5" ,img : "img/HSR/char/5/知更鸟·晴歌.webp"},
    { id: "hsr_char_tier_5_062", name: "吉尔伽美什", en: "Gilgamesh", short: "金闪", eshort: "Gilga",tag: "collab" ,tierId: "tier_5" ,img : "img/HSR/char/5/吉尔伽美什.webp"},
    { id: "hsr_char_tier_5_061", name: "远坂凛", en: "Tohsaka Rin", short: "凛", eshort: "Rin",tag: "collab" ,tierId: "tier_5" ,img : "img/HSR/char/5/远坂凛.webp"},
    { id: "hsr_char_tier_5_060", name: "姬子·启行", en: "Himeko·Nova", short: "启姬", eshort: "HiNo",tag: "up" ,tierId: "tier_5" ,img : "img/HSR/char/5/姬子·启行.webp"},
    { id: "hsr_char_tier_5_059", name: "千冶·刃", en: "Mortenax Blade", short: "冶刃", eshort: "MBade",tag: "up" ,tierId: "tier_5" ,img : "img/HSR/char/5/千冶·刃.webp"},
    { id: "hsr_char_tier_5_058", name: "绯英", en: "Evanecia", short: "绯", eshort: "Evanec",tag: "up" ,tierId: "tier_5" ,img : "img/HSR/char/5/绯英.webp"},
    { id: "hsr_char_tier_5_057", name: "银狼lv.999", en: "Silver Wolf LV.999", short: "狼尊", eshort: "9Wolf", tag: "up" ,tierId: "tier_5" ,img : "img/HSR/char/5/银狼lv.999.webp"},
    { id: "hsr_char_tier_5_056", name: "不死途", en: "Ashveil", short: "途", eshort: "Ashve", tag: "up" ,tierId: "tier_5" ,img : "img/HSR/char/5/不死途.webp"},
    { id: "hsr_char_tier_5_054", name: "爻光", en: "Yao Guang", short: "爻", eshort: "Yao", tag: "up" ,tierId: "tier_5" ,img : "img/HSR/char/5/爻光.webp"},
    { id: "hsr_char_tier_5_055", name: "火花", en: "Sparxie", short: "火", eshort: "Sparx", tag: "up" ,tierId: "tier_5" ,img : "img/HSR/char/5/火花.webp"},
    { id: "hsr_char_tier_5_053", name: "大丽花", en: "The Dahlia", short: "花", eshort: "Dahli", tag: "up" ,tierId: "tier_5" ,img : "img/HSR/char/5/大丽花.webp"},
    { id: "hsr_char_tier_5_052", name: "昔涟", en: "Cyrene", short: "昔", eshort: "Cryen", tag: "up" ,tierId: "tier_5" ,img : "img/HSR/char/5/昔涟.webp"},
    { id: "hsr_char_tier_5_051", name: "丹恒·滕荒", en: "Dan Heng · Permansor Terrae", short: "盾丹", eshort: "DPerm", tag: "up" ,tierId: "tier_5" ,img : "img/HSR/char/5/丹恒·滕荒.webp"},
    { id: "hsr_char_tier_5_050", name: "长夜月", en: "Evernight", short: "长夜", eshort: "ENigh", tag: "up" ,tierId: "tier_5" ,img : "img/HSR/char/5/长夜月.webp"},
    { id: "hsr_char_tier_5_049", name: "刻律德菈", en: "Cerydra", short: "刻律", eshort: "Ceryd", tag: "up" ,tierId: "tier_5" ,img : "img/HSR/char/5/刻律德菈.webp"},
    { id: "hsr_char_tier_5_048", name: "海瑟音", en: "Hysilens", short: "海", eshort: "Hysil", tag: "up" ,tierId: "tier_5" ,img : "img/HSR/char/5/海瑟音.webp"},
    { id: "hsr_char_tier_5_045", name: "白厄", en: "Phainon", short: "白", eshort: "Phain", tag: "up" ,tierId: "tier_5" ,img : "img/HSR/char/5/白厄.webp"},
    { id: "hsr_char_tier_5_047", name: "Archer", en: "Archer", short: "红A", eshort: "Arche", tag: "collab" ,tierId: "tier_5" ,img : "img/HSR/char/5/Archer.webp"},
    { id: "hsr_char_tier_5_046", name: "Saber", en: "Saber", short: "呆毛", eshort: "Saber", tag: "collab" ,tierId: "tier_5" ,img : "img/HSR/char/5/Saber.webp"},
    { id: "hsr_char_tier_5_044", name: "赛飞儿", en: "Cipher", short: "猫", eshort: "Ciphe", tag: "up" ,tierId: "tier_5" ,img : "img/HSR/char/5/赛飞儿.webp"},
    { id: "hsr_char_tier_5_043", name: "凤堇", en: "Hyacine", short: "风", eshort: "Hyac", tag: "up" ,tierId: "tier_5" ,img : "img/HSR/char/5/凤堇.webp"},
    { id: "hsr_char_tier_5_042", name: "那刻夏", en: "Anaxa", short: "那", eshort: "Anaxa", tag: "up" ,tierId: "tier_5" ,img : "img/HSR/char/5/那刻夏.webp"},
    { id: "hsr_char_tier_5_041", name: "遐蝶", en: "Castorice", short: "蝶", eshort: "Casto", tag: "up" ,tierId: "tier_5" ,img : "img/HSR/char/5/遐蝶.webp"},
    { id: "hsr_char_tier_5_040", name: "万敌", en: "Mydei", short: "万", eshort: "Mydei", tag: "up" ,tierId: "tier_5" ,img : "img/HSR/char/5/万敌.webp"},
    { id: "hsr_char_tier_5_039", name: "提宝", en: "Tribble", short: "提", eshort: "Trib", tag: "up" ,tierId: "tier_5" ,img : "img/HSR/char/5/提宝.webp"},
    { id: "hsr_char_tier_5_037", name: "大黑塔", en: "The Herta", short: "大黑", eshort: "THert", tag: "up" ,tierId: "tier_5" ,img : "img/HSR/char/5/大黑塔.webp"},
    { id: "hsr_char_tier_5_038", name: "阿格莱雅", en: "Aglaea", short: "雅", eshort: "Aglae", tag: "up" ,tierId: "tier_5" ,img : "img/HSR/char/5/阿格莱雅.webp"},
    { id: "hsr_char_tier_5_036", name: "忘归人", en: "Fugue", short: "忘", eshort: "Fugue", tag: "up" ,tierId: "tier_5" ,img : "img/HSR/char/5/忘归人.webp"},
    { id: "hsr_char_tier_5_035", name: "星期日", en: "Sunday", short: "日", eshort: "Sun", tag: "up" ,tierId: "tier_5" ,img : "img/HSR/char/5/星期日.webp"},
    { id: "hsr_char_tier_5_034", name: "乱破", en: "Rappa", short: "乱", eshort: "Rappa", tag: "up" ,tierId: "tier_5" ,img : "img/HSR/char/5/乱破.webp"},
    { id: "hsr_char_tier_5_033", name: "灵砂", en: "Lingsha", short: "灵", eshort: "Lings", tag: "up" ,tierId: "tier_5" ,img : "img/HSR/char/5/灵砂.webp"},
    { id: "hsr_char_tier_5_032", name: "飞霄", en: "Feixiao", short: "飞", eshort: "Feix", tag: "up" ,tierId: "tier_5" ,img : "img/HSR/char/5/飞霄.webp"},
    { id: "hsr_char_tier_5_031", name: "椒丘", en: "Jiao Qiu", short: "椒", eshort: "JiaoQ", tag: "up" ,tierId: "tier_5" ,img : "img/HSR/char/5/椒丘.webp"},
    { id: "hsr_char_tier_5_030", name: "云璃", en: "Yunli", short: "璃", eshort: "Yunli", tag: ["up","custom_offrate"] ,tierId: "tier_5" ,img : "img/HSR/char/5/云璃.webp"},
    { id: "hsr_char_tier_5_029", name: "翡翠", en: "Jade", short: "翡翠", eshort: "Jade", tag: "up" ,tierId: "tier_5" ,img : "img/HSR/char/5/翡翠.webp"},
    { id: "hsr_char_tier_5_028", name: "流萤", en: "Firefly", short: "萤", eshort: "Firef", tag: "up" ,tierId: "tier_5" ,img : "img/HSR/char/5/流萤.webp"},
    { id: "hsr_char_tier_5_027", name: "波提欧", en: "Boothill", short: "波", eshort: "Booth", tag: "up" ,tierId: "tier_5" ,img : "img/HSR/char/5/波提欧.webp"},
    { id: "hsr_char_tier_5_026", name: "知更鸟", en: "Robin", short: "鸟", eshort: "Robin", tag: "up" ,tierId: "tier_5" ,img : "img/HSR/char/5/知更鸟.webp"},
    { id: "hsr_char_tier_5_025", name: "砂金", en: "Aventurine", short: "砂", eshort: "Avent", tag: "up" ,tierId: "tier_5" ,img : "img/HSR/char/5/砂金.webp"},
    { id: "hsr_char_tier_5_024", name: "黄泉", en: "Acheron", short: "泉", eshort: "Acher", tag: "up" ,tierId: "tier_5" ,img : "img/HSR/char/5/黄泉.webp"},
    { id: "hsr_char_tier_5_023", name: "花火", en: "Sparkle", short: "花", eshort: "Spark", tag: "up" ,tierId: "tier_5" ,img : "img/HSR/char/5/花火.webp"},
    { id: "hsr_char_tier_5_022", name: "黑天鹅", en: "Black Swan", short: "鹅", eshort: "BSwan", tag: "up" ,tierId: "tier_5" ,img : "img/HSR/char/5/黑天鹅.webp"},
    { id: "hsr_char_tier_5_021", name: "真理医生", en: "Dr.Ratio", short: "真", eshort: "Ratio", tag: "up" ,tierId: "tier_5" ,img : "img/HSR/char/5/真理医生.webp"},
    { id: "hsr_char_tier_5_020", name: "阮·梅", en: "Ruan Mei", short: "阮", eshort: "RuanM", tag: "up" ,tierId: "tier_5" ,img : "img/HSR/char/5/阮·梅.webp"},
    { id: "hsr_char_tier_5_019", name: "银枝", en: "Argenti", short: "银", eshort: "Argen", tag:  ["up","custom_offrate"] ,tierId: "tier_5" ,img : "img/HSR/char/5/银枝.webp"},
    { id: "hsr_char_tier_5_018", name: "霍霍", en: "Huohuo", short: "霍", eshort: "Huo", tag: "up" ,tierId: "tier_5" ,img : "img/HSR/char/5/霍霍.webp"},
    { id: "hsr_char_tier_5_017", name: "托帕&账账", en: "Topaz & Numby", short: "托", eshort: "Topaz", tag: "up" ,tierId: "tier_5" ,img : "img/HSR/char/5/托帕&账账.webp"},
    { id: "hsr_char_tier_5_016", name: "镜流", en: "Jingliu", short: "镜", eshort: "Jingl", tag: "up" ,tierId: "tier_5" ,img : "img/HSR/char/5/镜流.webp"},
    { id: "hsr_char_tier_5_014", name: "丹恒·饮月", en: "Dan Heng · Imbibitor Lunae", short: "龙丹", eshort: "Dimbi", tag: "up" ,tierId: "tier_5" ,img : "img/HSR/char/5/丹恒·饮月.webp"},
    { id: "hsr_char_tier_5_015", name: "符玄", en: "Fu Xuan", short: "符", eshort: "FXuan", tag: ["up","custom_offrate"] ,tierId: "tier_5" ,img : "img/HSR/char/5/符玄.webp"},
    { id: "hsr_char_tier_5_013", name: "卡芙卡", en: "Kafka", short: "卡", eshort: "Kafka", tag: "up" ,tierId: "tier_5" ,img : "img/HSR/char/5/卡芙卡.webp"},
    { id: "hsr_char_tier_5_012", name: "刃", en: "Blade", short: "刃", eshort: "Blade", tag: ["up","custom_offrate"] ,tierId: "tier_5" ,img : "img/HSR/char/5/刃.webp"},
    { id: "hsr_char_tier_5_011", name: "罗刹", en: "Luocha", short: "罗", eshort: "Luoch", tag: "up" ,tierId: "tier_5" ,img : "img/HSR/char/5/罗刹.webp"},
    { id: "hsr_char_tier_5_010", name: "银狼", en: "Silver Wolf", short: "银", eshort: "SWolf", tag:  ["up","custom_offrate"] ,tierId: "tier_5" ,img : "img/HSR/char/5/银狼.webp"},
    { id: "hsr_char_tier_5_009", name: "景元", en: "Jing Yuan", short: "景", eshort: "JingY", tag: "up" ,tierId: "tier_5" ,img : "img/HSR/char/5/景元.webp"},
    { id: "hsr_char_tier_5_008", name: "希儿", en: "Seele", short: "希", eshort: "SeeLe", tag: ["up", "custom_offrate"] ,tierId: "tier_5" ,img : "img/HSR/char/5/希儿.webp"},

    //常驻角色
    { id: "hsr_char_tier_5_007", name: "瓦尔特·杨", en: "Welt", short: "杨", eshort: "Welt", tag: "std" ,tierId: "tier_5" ,img : "img/HSR/char/5/瓦尔特·杨.webp"},
    { id: "hsr_char_tier_5_006", name: "布洛妮娅·兰德", en: "Bronya", short: "鸭", eshort: "Brony", tag: "std" ,tierId: "tier_5" ,img : "img/HSR/char/5/布洛妮娅·兰德.webp"},
    { id: "hsr_char_tier_5_005", name: "姬子", en: "Himeko", short: "姬", eshort: "Himek", tag: "std" ,tierId: "tier_5" ,img : "img/HSR/char/5/姬子.webp"},
    { id: "hsr_char_tier_5_004", name: "杰帕德·朗道", en: "Gepard", short: "杰", eshort: "Gepar", tag: "std" ,tierId: "tier_5" ,img : "img/HSR/char/5/杰帕德·朗道.webp"},
    { id: "hsr_char_tier_5_003", name: "克拉拉", en: "Clara", short: "克", eshort: "Clara", tag: "std" ,tierId: "tier_5" ,img : "img/HSR/char/5/克拉拉.webp"},
    { id: "hsr_char_tier_5_002", name: "白露", en: "Bailu", short: "露", eshort: "BaiLu", tag: "std" ,tierId: "tier_5" ,img : "img/HSR/char/5/白露.webp"},
    { id: "hsr_char_tier_5_001", name: "彦青", en: "Yanqing", short: "彦", eshort: "YanQi", tag: "std" ,tierId: "tier_5" ,img : "img/HSR/char/5/彦青.webp"},

    //四星角色
    { id: "hsr_char_tier_4_021", name: "加拉赫", en: "Gallagher", short: "加拉", eshort: "Galla", tag: "normal", tierId: "tier_4", img: "img/HSR/char/4/加拉赫.webp" },
    { id: "hsr_char_tier_4_020", name: "米沙", en: "Misha", short: "米沙", eshort: "Misha", tag: "normal", tierId: "tier_4", img: "img/HSR/char/4/米沙.webp" },
    { id: "hsr_char_tier_4_019", name: "雪衣", en: "Xueyi", short: "雪衣", eshort: "Xueyi", tag: "normal", tierId: "tier_4", img: "img/HSR/char/4/雪衣.webp" },
    { id: "hsr_char_tier_4_018", name: "寒鸦", en: "Hanya", short: "寒鸦", eshort: "Hanya", tag: "normal", tierId: "tier_4", img: "img/HSR/char/4/寒鸦.webp" },
    { id: "hsr_char_tier_4_017", name: "桂乃芬", en: "Guinaifen", short: "小桂", eshort: "Guina", tag: "normal", tierId: "tier_4", img: "img/HSR/char/4/桂乃芬.webp" },
    { id: "hsr_char_tier_4_016", name: "玲可", en: "Lynx", short: "玲可", eshort: "Lynx", tag: "normal", tierId: "tier_4", img: "img/HSR/char/4/玲可.webp" },
    { id: "hsr_char_tier_4_015", name: "卢卡", en: "Luka", short: "卢卡", eshort: "Luka", tag: "normal", tierId: "tier_4", img: "img/HSR/char/4/卢卡.webp" },
    { id: "hsr_char_tier_4_014", name: "驭空", en: "Yukong", short: "驭空", eshort: "Yukon", tag: "normal", tierId: "tier_4", img: "img/HSR/char/4/驭空.webp" },
    { id: "hsr_char_tier_4_013", name: "阿兰", en: "Arlan", short: "阿兰", eshort: "Arlan", tag: "normal", tierId: "tier_4", img: "img/HSR/char/4/阿兰.webp" },
    { id: "hsr_char_tier_4_012", name: "艾丝妲", en: "Asta", short: "艾丝", eshort: "Asta", tag: "normal", tierId: "tier_4", img: "img/HSR/char/4/艾丝妲.webp" },
    { id: "hsr_char_tier_4_011", name: "黑塔", en: "Herta", short: "黑塔", eshort: "Herta", tag: "normal", tierId: "tier_4", img: "img/HSR/char/4/黑塔.webp" },
    { id: "hsr_char_tier_4_010", name: "丹恒", en: "Dan Heng", short: "丹恒", eshort: "DanHe", tag: "normal", tierId: "tier_4", img: "img/HSR/char/4/丹恒.webp" },
    { id: "hsr_char_tier_4_009", name: "三月七", en: "March 7th", short: "三月", eshort: "March", tag: "normal", tierId: "tier_4", img: "img/HSR/char/4/三月七.webp" },
    { id: "hsr_char_tier_4_008", name: "佩拉", en: "Pela", short: "佩拉", eshort: "Pela", tag: "normal", tierId: "tier_4", img: "img/HSR/char/4/佩拉.webp" },
    { id: "hsr_char_tier_4_007", name: "桑博", en: "Sampo", short: "桑博", eshort: "Sampo", tag: "normal", tierId: "tier_4", img: "img/HSR/char/4/桑博.webp" },
    { id: "hsr_char_tier_4_006", name: "虎克", en: "Hook", short: "虎克", eshort: "Hook", tag: "normal", tierId: "tier_4", img: "img/HSR/char/4/虎克.webp" },
    { id: "hsr_char_tier_4_005", name: "娜塔莎", en: "Natasha", short: "娜塔", eshort: "Natas", tag: "normal", tierId: "tier_4", img: "img/HSR/char/4/娜塔莎.webp" },
    { id: "hsr_char_tier_4_004", name: "希露瓦", en: "Serval", short: "希露", eshort: "Serva", tag: "normal", tierId: "tier_4", img: "img/HSR/char/4/希露瓦.webp" },
    { id: "hsr_char_tier_4_003", name: "青雀", en: "Qingque", short: "青雀", eshort: "Qingq", tag: "normal", tierId: "tier_4", img: "img/HSR/char/4/青雀.webp" },
    { id: "hsr_char_tier_4_002", name: "停云", en: "Tingyun", short: "停云", eshort: "Tingy", tag: "normal", tierId: "tier_4", img: "img/HSR/char/4/停云.webp" },
    { id: "hsr_char_tier_4_001", name: "素裳", en: "Sushang", short: "素裳", eshort: "Susha", tag: "normal", tierId: "tier_4", img: "img/HSR/char/4/素裳.webp" },
];

const HSR_WEAPON = [
    { id: "hsr_wep_tier_5_066", name: "玲珑妆匣", en: "Elegant Vanity", short: "耀专", eshort: "Astra", tag: "collab", tierId: "tier_5", img:"img/ZZZ/weapon/5/玲珑妆匣.webp" },
    { id: "hsr_wep_tier_5_065", name: "深海访客", en: "Deep Sea Visitor", short: "艾专", eshort: "Ellen", tag: "collab", tierId: "tier_5", img:"img/ZZZ/weapon/5/深海访客.webp" },
    { id: "hsr_wep_tier_5_064", name: "星神★啊哈 专属光锥", en: "Aeon ★ Aha Weapon", short: "哈专", eshort: "Aha", tag: "up" ,tierId: "tier_5" ,img : "img/HSR/weapon/4/等价交换.webp"},
    { id: "hsr_wep_tier_5_067", name: "献给明日的色彩", en: "Colors for Tomorrow", short: "真专", eshort: "Pearl", tag: "up" ,tierId: "tier_5" ,img : "img/HSR/weapon/5/献给明日的色彩.webp"},
    { id: "hsr_wep_tier_5_063", name: "向浪花掷下盛夏", en: "Summer Rides the Surf", short: "砂专", eshort: "HiNo", tag: "up" ,tierId: "tier_5" ,img : "img/HSR/weapon/5/向浪花掷下盛夏.webp"},
    { id: "hsr_wep_tier_5_062", name: "你将起身歌唱", en: "Rise and Sing", short: "鸟专", eshort: "HiNo", tag: "up" ,tierId: "tier_5" ,img : "img/HSR/weapon/5/你将起身歌唱.webp"},
    { id: "hsr_wep_tier_5_061", name: "所见即我", en: "I Am As You Behold", short: "闪专", eshort: "Gilga", tag: "collab" ,tierId: "tier_5" ,img : "img/HSR/weapon/5/所见即我.webp"},
    { id: "hsr_wep_tier_5_060", name: "星火悄然闪耀", en: "Flickering Stars", short: "凛专", eshort: "Rin", tag: "collab" ,tierId: "tier_5" ,img : "img/HSR/weapon/5/星火悄然闪耀.webp"},
    { id: "hsr_wep_tier_5_059", name: "当一颗星照亮夜空", en: "A Star That Lights the Night", short: "姬专", eshort: "HiNo", tag: "up" ,tierId: "tier_5" ,img : "img/HSR/weapon/5/当一颗星照亮夜空.webp"},
    { id: "hsr_wep_tier_5_058", name: "灼尽炼狱的新骸", en: "Reforged in Helldire", short: "刃专", eshort: "MBade", tag: "up" ,tierId: "tier_5" ,img : "img/HSR/weapon/5/灼尽炼狱的新骸.webp"},
    { id: "hsr_wep_tier_5_057", name: "邂逅于下一个花季", en: "Until the Flowers Bloom Again", short: "绯专", eshort: "Evanc", tag: "up" ,tierId: "tier_5" ,img : "img/HSR/weapon/5/邂逅于下一个花季.webp"},
    { id: "hsr_wep_tier_5_056", name: "欢迎来到银河城", en: "Welcome to the Cosmic City", short: "狼专", eshort: "9Wolf", tag: "up" ,tierId: "tier_5" ,img : "img/HSR/weapon/5/欢迎来到银河城.webp"},
    { id: "hsr_wep_tier_5_055", name: "一场谎言的终幕", en: "The Finale of a Lie", short: "途专", eshort: "Ashve", tag: "up" ,tierId: "tier_5" ,img : "img/HSR/weapon/5/一场谎言的终幕.webp"},
    { id: "hsr_wep_tier_5_053", name: "当她决定看见", en: "When She Decides to See", short: "爻专", eshort: "Yao", tag: "up" ,tierId: "tier_5" ,img : "img/HSR/weapon/5/当她决定看见.webp"},
    { id: "hsr_wep_tier_5_054", name: "花花世界迷人眼", en: "Earthly Escapade", short: "火专", eshort: "Sparx", tag: "up" ,tierId: "tier_5" ,img : "img/HSR/weapon/5/花花世界迷人眼.webp"},
    { id: "hsr_wep_tier_5_052", name: "勿忘她的火焰", en: "Never Forget Her Flame", short: "花专", eshort: "Dahli", tag: "up" ,tierId: "tier_5" ,img : "img/HSR/weapon/5/勿忘她的火焰.webp"},
    { id: "hsr_wep_tier_5_051", name: "爱如此刻永恒", en: "This Love,Forever", short: "昔专", eshort: "Cryen", tag: "up" ,tierId: "tier_5" ,img : "img/HSR/weapon/5/爱如此刻永恒.webp"},
    { id: "hsr_wep_tier_5_050", name: "纵然山河万程", en: "Though Worlds Apart", short: "丹专", eshort: "DPerm", tag: "up" ,tierId: "tier_5" ,img : "img/HSR/weapon/5/纵然山河万程.webp"},
    { id: "hsr_wep_tier_5_049", name: "致长夜的星光", en: "To Evernight's Stars", short: "夜专", eshort: "ENigh", tag: "up" ,tierId: "tier_5" ,img : "img/HSR/weapon/5/致长夜的星光.webp"},
    { id: "hsr_wep_tier_5_048", name: "金血铭刻的时代", en: "Epoch Etched in Golden Blood", short: "刻专", eshort: "Ceryd", tag: "up" ,tierId: "tier_5" ,img : "img/HSR/weapon/5/金血铭刻的时代.webp"},
    { id: "hsr_wep_tier_5_047", name: "海洋为何而歌", en: "Why Does the Ocean Sing", short: "海专", eshort: "Hysil", tag: "up" ,tierId: "tier_5" ,img : "img/HSR/weapon/5/海洋为何而歌.webp"},
    { id: "hsr_wep_tier_5_046", name: "理想燃烧的地狱", en: "The Hell Where Ideals Burn", short: "A专", eshort: "Arche", tag: "collab" ,tierId: "tier_5" ,img : "img/HSR/weapon/5/理想燃烧的地狱.webp"},
    { id: "hsr_wep_tier_5_045", name: "没有回报的加冕", en: "A Thankless Coronation", short: "S专", eshort: "Saber", tag: "collab" ,tierId: "tier_5" ,img : "img/HSR/weapon/5/没有回报的加冕.webp"},
    { id: "hsr_wep_tier_5_044", name: "黎明恰如此燃烧", en: "Thus Burns the Dawn", short: "白专", eshort: "Phain", tag: "up" ,tierId: "tier_5" ,img : "img/HSR/weapon/5/黎明恰如此燃烧.webp"},
    { id: "hsr_wep_tier_5_042", name: "愿虹光永驻天空", en: "Long May Rainbows Adorn the Sky", short: "风专", eshort: "Hyac", tag: "up" ,tierId: "tier_5" ,img : "img/HSR/weapon/5/愿虹光永驻天空.webp"},
    { id: "hsr_wep_tier_5_043", name: "谎言在风中飘扬", en: "Lies Dance on the Breeze", short: "猫专", eshort: "Ciphe", tag: "up" ,tierId: "tier_5" ,img : "img/HSR/weapon/5/谎言在风中飘扬.webp"},
    { id: "hsr_wep_tier_5_040", name: "让告别，更美一些", en: "Make Farewells More Beautiful", short: "蝶专", eshort: "Casto", tag: "up" ,tierId: "tier_5" ,img : "img/HSR/weapon/5/让告别，更美一些.webp"},
    { id: "hsr_wep_tier_5_041", name: "生命当付之一炬", en: "Life Should Be Cast to Flames", short: "那专", eshort: "Anaxa", tag: "up" ,tierId: "tier_5" ,img : "img/HSR/weapon/5/生命当付之一炬.webp"},
    { id: "hsr_wep_tier_5_039", name: "如果时间是一朵花", en: "If Time Were a Flower", short: "提专", eshort: "Trib", tag: "up" ,tierId: "tier_5" ,img : "img/HSR/weapon/5/如果时间是一朵花.webp"},
    { id: "hsr_wep_tier_5_037", name: "向着不可追问处", en: "Into the Unreachable Vell", short: "黑专", eshort: "THert", tag: "up" ,tierId: "tier_5" ,img : "img/HSR/weapon/5/向着不可追问处.webp"},
    { id: "hsr_wep_tier_5_038", name: "将光阴织成黄金", en: "Time Woven Into Gold", short: "雅专", eshort: "Aglae", tag: "up" ,tierId: "tier_5" ,img : "img/HSR/weapon/5/将光阴织成黄金.webp"},
    { id: "hsr_wep_tier_5_036", name: "长路终有归途", en: "Long Road Leads Home", short: "忘专", eshort: "Fugue", tag: "up" ,tierId: "tier_5" ,img : "img/HSR/weapon/5/长路终有归途.webp"},
    { id: "hsr_wep_tier_5_035", name: "回到大地的飞行", en: "A Grounded Ascent", short: "日专", eshort: "Sun", tag: "up" ,tierId: "tier_5" ,img : "img/HSR/weapon/5/回到大地的飞行.webp"},
    { id: "hsr_wep_tier_5_034", name: "忍法帖·缭乱破魔", en: "Ninjutsu Inscription: Dazzling Evilbreaker", short: "乱专", eshort: "Ninju", tag: "up" ,tierId: "tier_5" ,img : "img/HSR/weapon/5/忍法帖·缭乱破魔.webp"},
    { id: "hsr_wep_tier_5_032", name: "我将，巡征追猎", en: "I Venture Forth to Hunt", short: "飞专", eshort: "Feix", tag: "up" ,tierId: "tier_5" ,img : "img/HSR/weapon/5/我将，巡征追猎.webp"},
    { id: "hsr_wep_tier_5_033", name: "唯有香如故", en: "Scent Alone Stays True", short: "灵专", eshort: "LingS", tag: "up" ,tierId: "tier_5" ,img : "img/HSR/weapon/5/唯有香如故.webp"},
    { id: "hsr_wep_tier_5_030", name: "落日时起舞", en: "Dance at Sunset", short: "璃专", eshort: "Yunli", tag: "up" ,tierId: "tier_5" ,img : "img/HSR/weapon/5/落日时起舞.webp"},
    { id: "hsr_wep_tier_5_031", name: "那无数个春天", en: "Those Many Springs", short: "椒专", eshort: "JiaoQ", tag: "up" ,tierId: "tier_5" ,img : "img/HSR/weapon/5/那无数个春天.webp"},
    { id: "hsr_wep_tier_5_029", name: "偏偏希望无价", en: "Yet Hope Is Priceless", short: "翡专", eshort: "Jade", tag: "up" ,tierId: "tier_5" ,img : "img/HSR/weapon/5/偏偏希望无价.webp"},
    { id: "hsr_wep_tier_5_028", name: "梦应归于何处", en: "Whereabouts Should Dreams Rest", short: "萤专", eshort: "Firef", tag: "up" ,tierId: "tier_5" ,img : "img/HSR/weapon/5/梦应归于何处.webp"},
    { id: "hsr_wep_tier_5_027", name: "驶向第二次生命", en: "Sailing Towards a Second Life", short: "波专", eshort: "Booth", tag: "up" ,tierId: "tier_5" ,img : "img/HSR/weapon/5/驶向第二次生命.webp"},
    { id: "hsr_wep_tier_5_026", name: "夜色流光溢彩", en: "Flowing Nightglow", short: "鸟专", eshort: "Robin", tag: "up" ,tierId: "tier_5" ,img : "img/HSR/weapon/5/夜色流光溢彩.webp", refreshCatalog: true },
    { id: "hsr_wep_tier_5_024", name: "行于流逝的岸", en: "Along the Passing Shore", short: "泉专", eshort: "Acher", tag: "up" ,tierId: "tier_5" ,img : "img/HSR/weapon/5/行于流逝的岸.webp"},
    { id: "hsr_wep_tier_5_025", name: "命运从未公平", en: "Inherently Unjust Destiny", short: "砂专", eshort: "Avent", tag: "up" ,tierId: "tier_5" ,img : "img/HSR/weapon/5/命运从未公平.webp"},
    { id: "hsr_wep_tier_5_022", name: "重塑时光之忆", en: "Reforged Remembrance", short: "鹅专", eshort: "BSwan", tag: "up" ,tierId: "tier_5" ,img : "img/HSR/weapon/5/重塑时光之忆.webp"},
    { id: "hsr_wep_tier_5_023", name: "游戏尘寰", en: "Earthly Escapade", short: "花专", eshort: "Spark", tag: "up" ,tierId: "tier_5" ,img : "img/HSR/weapon/5/游戏尘寰.webp"},
    { id: "hsr_wep_tier_5_021", name: "纯粹思维的洗礼", en: "Baptism of Pure Thought", short: "真专", eshort: "Ratio", tag: "up" ,tierId: "tier_5" ,img : "img/HSR/weapon/5/纯粹思维的洗礼.webp"},
    { id: "hsr_wep_tier_5_020", name: "镜中故我", en: "Past Self in Mirror", short: "阮专", eshort: "RuanM", tag: "up" ,tierId: "tier_5" ,img : "img/HSR/weapon/5/镜中故我.webp"},
    { id: "hsr_wep_tier_5_018", name: "惊魂夜", en: "Night of Fright", short: "霍专", eshort: "Huo", tag: "up" ,tierId: "tier_5" ,img : "img/HSR/weapon/5/惊魂夜.webp"},
    { id: "hsr_wep_tier_5_019", name: "片刻，留在眼底", en: "An Instant Before A Gaze", short: "银专", eshort: "Argen", tag: "up" ,tierId: "tier_5" ,img : "img/HSR/weapon/5/片刻，留在眼底.webp"},
    { id: "hsr_wep_tier_5_016", name: "此身为剑", en: "I Shall Be My Own Sword", short: "镜专", eshort: "JingL", tag: "up" ,tierId: "tier_5" ,img : "img/HSR/weapon/5/此身为剑.webp"},
    { id: "hsr_wep_tier_5_017", name: "烦恼着，幸福着", en: "Worrisome, Blissful", short: "托专", eshort: "Topaz", tag: "up" ,tierId: "tier_5" ,img : "img/HSR/weapon/5/烦恼着，幸福着.webp"},
    { id: "hsr_wep_tier_5_015", name: "她已闭上双眼", en: "She Already Shut Her Eyes", short: "符专", eshort: "FXuan", tag: "up" ,tierId: "tier_5" ,img : "img/HSR/weapon/5/她已闭上双眼.webp"},
    { id: "hsr_wep_tier_5_014", name: "比阳光更明亮的", en: "Brighter Than the Sun", short: "龙专", eshort: "Dimbi", tag: "up" ,tierId: "tier_5" ,img : "img/HSR/weapon/5/比阳光更明亮的.webp"},
    { id: "hsr_wep_tier_5_013", name: "只需等待", en: "Patience Is All You Need", short: "卡专", eshort: "Kafka", tag: "up" ,tierId: "tier_5" ,img : "img/HSR/weapon/5/只需等待.webp"},
    { id: "hsr_wep_tier_5_012", name: "到不了的彼岸", en: "The Unreachable Side", short: "刃专", eshort: "Blade", tag: "up" ,tierId: "tier_5" ,img : "img/HSR/weapon/5/到不了的彼岸.webp"},
    { id: "hsr_wep_tier_5_011", name: "棺的回响", en: "Echoes of the Coffin", short: "罗专", eshort: "Luoch", tag: "up" ,tierId: "tier_5" ,img : "img/HSR/weapon/5/棺的回响.webp"},
    { id: "hsr_wep_tier_5_010", name: "雨一直下", en: "Incessant Rain", short: "狼专", eshort: "SWolf", tag: "up" ,tierId: "tier_5" ,img : "img/HSR/weapon/5/雨一直下.webp"},
    { id: "hsr_wep_tier_5_009", name: "拂晓之前", en: "Before Dawn", short: "景专", eshort: "JingY", tag: "up" ,tierId: "tier_5" ,img : "img/HSR/weapon/5/拂晓之前.webp"},
    { id: "hsr_wep_tier_5_008", name: "于夜色中", en: "In the Night", short: "希专", eshort: "Seele", tag: "up" ,tierId: "tier_5" ,img : "img/HSR/weapon/5/于夜色中.webp"},



    //常驻光锥
    { id: "hsr_wep_tier_5_007", name: "银河铁道之夜", en: "Night on the Milky Way", short: "姬专", eshort: "Himek", tag: "std" ,tierId: "tier_5" ,img : "img/HSR/weapon/5/银河铁道之夜.webp"},
    { id: "hsr_wep_tier_5_006", name: "无可取代的东西", en: "Something Irreplaceable", short: "克专", eshort: "Clara", tag: "std" ,tierId: "tier_5" ,img : "img/HSR/weapon/5/无可取代的东西.webp"},
    { id: "hsr_wep_tier_5_005", name: "但战斗还未结束", en: "But the Battle Isn't Over", short: "鸭专", eshort: "Brony", tag: "std" ,tierId: "tier_5" ,img : "img/HSR/weapon/5/但战斗还未结束.webp"},
    { id: "hsr_wep_tier_5_004", name: "以世界之名", en: "In the Name of the World", short: "杨专", eshort: "Welt", tag: "std" ,tierId: "tier_5" ,img : "img/HSR/weapon/5/以世界之名.webp"},
    { id: "hsr_wep_tier_5_003", name: "制胜的瞬间", en: "Moment of Victory", short: "杰专", eshort: "Gepar", tag: "std" ,tierId: "tier_5" ,img : "img/HSR/weapon/5/制胜的瞬间.webp"},
    { id: "hsr_wep_tier_5_002", name: "如泥酣眠", en: "Sleep Like the Dead", short: "彦专", eshort: "YanQi", tag: "std" ,tierId: "tier_5" ,img : "img/HSR/weapon/5/如泥酣眠.webp"},
    { id: "hsr_wep_tier_5_001", name: "时节不居", en: "Time Waits for No One", short: "白专", eshort: "BaiLu", tag: "std" ,tierId: "tier_5" ,img : "img/HSR/weapon/5/时节不居.webp"},

//四星光锥
    { id: "hsr_wep_tier_4_035", name: "一场术后对话", en: "Post-Op Conversation", short: "术后", eshort: "PostO", tag: "normal", tierId: "tier_4", img: "img/HSR/weapon/4/一场术后对话.webp" },
    { id: "hsr_wep_tier_4_034", name: "晚安与睡颜", en: "Good Night and Sleep Well", short: "晚安", eshort: "Sleep", tag: "normal", tierId: "tier_4", img: "img/HSR/weapon/4/晚安与睡颜.webp" },
    { id: "hsr_wep_tier_4_033", name: "余生的第一天", en: "Day One of My New Life", short: "余生", eshort: "DayOn", tag: "normal", tierId: "tier_4", img: "img/HSR/weapon/4/余生的第一天.webp" },
    { id: "hsr_wep_tier_4_032", name: "唯有沉默", en: "Only Silence Remains", short: "沉默", eshort: "Silen", tag: "normal", tierId: "tier_4", img: "img/HSR/weapon/4/唯有沉默.webp" },
    { id: "hsr_wep_tier_4_031", name: "记忆中的模样", en: "Memories of the Past", short: "模样", eshort: "Memor", tag: "normal", tierId: "tier_4", img: "img/HSR/weapon/4/记忆中的模样.webp" },
    { id: "hsr_wep_tier_4_030", name: "鼹鼠党欢迎你", en: "The Moles Welcome You", short: "鼹鼠", eshort: "Moles", tag: "normal", tierId: "tier_4", img: "img/HSR/weapon/4/鼹鼠党欢迎你.webp" },
    { id: "hsr_wep_tier_4_029", name: "「我」的诞生", en: "Birth of the Self", short: "诞生", eshort: "Birth", tag: "normal", tierId: "tier_4", img: "img/HSR/weapon/4/「我」的诞生.webp" },
    { id: "hsr_wep_tier_4_028", name: "同一种心情", en: "Shared Feeling", short: "心情", eshort: "Share", tag: "normal", tierId: "tier_4", img: "img/HSR/weapon/4/同一种心情.webp" },
    { id: "hsr_wep_tier_4_027", name: "猎物的视线", en: "Eyes of the Prey", short: "猎物", eshort: "PreyE", tag: "normal", tierId: "tier_4", img: "img/HSR/weapon/4/猎物的视线.webp" },
    { id: "hsr_wep_tier_4_026", name: "朗道的选择", en: "Landau's Choice", short: "朗道", eshort: "Landa", tag: "normal", tierId: "tier_4", img: "img/HSR/weapon/4/朗道的选择.webp" },
    { id: "hsr_wep_tier_4_025", name: "论剑", en: "Swordplay", short: "论剑", eshort: "Sword", tag: "normal", tierId: "tier_4", img: "img/HSR/weapon/4/论剑.webp" },
    { id: "hsr_wep_tier_4_024", name: "与行星相会", en: "Planetary Rendezvous", short: "行星", eshort: "Plane", tag: "normal", tierId: "tier_4", img: "img/HSR/weapon/4/与行星相会.webp" },
    { id: "hsr_wep_tier_4_023", name: "秘密誓心", en: "A Secret Vow", short: "誓心", eshort: "Secrt", tag: "normal", tierId: "tier_4", img: "img/HSR/weapon/4/秘密誓心.webp" },
    { id: "hsr_wep_tier_4_022", name: "别让世界静下来", en: "Make the World Clamor", short: "喧闹", eshort: "Clamo", tag: "normal", tierId: "tier_4", img: "img/HSR/weapon/4/别让世界静下来.webp" },
    { id: "hsr_wep_tier_4_021", name: "此时恰好", en: "Perfect Timing", short: "恰好", eshort: "Perfe", tag: "normal", tierId: "tier_4", img: "img/HSR/weapon/4/此时恰好.webp" },
    { id: "hsr_wep_tier_4_020", name: "决心如汗珠般闪耀", en: "Resolution Shines As Pearls of Sweat", short: "决心", eshort: "Resol", tag: "normal", tierId: "tier_4", img: "img/HSR/weapon/4/决心如汗珠般闪耀.webp" },
    { id: "hsr_wep_tier_4_019", name: "宇宙市场趋势", en: "Trend of the Universal Market", short: "市场", eshort: "Trend", tag: "normal", tierId: "tier_4", img: "img/HSR/weapon/4/宇宙市场趋势.webp" },
    { id: "hsr_wep_tier_4_018", name: "点个关注吧！", en: "Subscribe for More!", short: "关注", eshort: "Subsc", tag: "normal", tierId: "tier_4", img: "img/HSR/weapon/4/点个关注吧！.webp" },
    { id: "hsr_wep_tier_4_017", name: "舞！舞！舞！", en: "Dance! Dance! Dance!", short: "舞舞", eshort: "Dance", tag: "normal", tierId: "tier_4", img: "img/HSR/weapon/4/舞！舞！舞！.webp" },
    { id: "hsr_wep_tier_4_016", name: "在蓝天下", en: "Under the Blue Sky", short: "蓝天", eshort: "BlueS", tag: "normal", tierId: "tier_4", img: "img/HSR/weapon/4/在蓝天下.webp" },
    { id: "hsr_wep_tier_4_015", name: "天才们的休憩", en: "The Seriousness of Breakfast", short: "休憩", eshort: "GenRe", tag: "normal", tierId: "tier_4", img: "img/HSR/weapon/4/天才们的休憩.webp" },
    { id: "hsr_wep_tier_4_045", name: "铭记于心的约定", en: "Indelible Promise", short: "铭记", eshort: "Promi", tag: "normal", tierId: "tier_4", img: "img/HSR/weapon/4/铭记于心的约定.webp" },
    { id: "hsr_wep_tier_4_046", name: "两个人的演唱会", en: "Concert for Two", short: "双唱", eshort: "Conct", tag: "normal", tierId: "tier_4", img: "img/HSR/weapon/4/两个人的演唱会.webp" },
    { id: "hsr_wep_tier_4_048", name: "无边曼舞", en: "Boundless Choreo", short: "曼舞", eshort: "Bound", tag: "normal", tierId: "tier_4", img: "img/HSR/weapon/4/无边曼舞.webp" },
    { id: "hsr_wep_tier_4_049", name: "谐乐静默之后", en: "After the Charmer Stopped", short: "静默", eshort: "StopC", tag: "normal", tierId: "tier_4", img: "img/HSR/weapon/4/谐乐静默之后.webp" },
    { id: "hsr_wep_tier_4_050", name: "芳华待灼", en: "Poised to Bloom", short: "待灼", eshort: "Bloom", tag: "normal", tierId: "tier_4", img: "img/HSR/weapon/4/芳华待灼.webp" },
    { id: "hsr_wep_tier_4_051", name: "黑夜如影随行", en: "Shadows Follow the Night", short: "随行", eshort: "ShadF", tag: "normal", tierId: "tier_4", img: "img/HSR/weapon/4/黑夜如影随行.webp" },
    { id: "hsr_wep_tier_4_053", name: "梦的蒙太奇", en: "Dream's Montage", short: "蒙太", eshort: "Monta", tag: "normal", tierId: "tier_4", img: "img/HSR/weapon/4/梦的蒙太奇.webp" },
    { id: "hsr_wep_tier_4_056", name: "天才们的问候", en: "Greetings from Geniuses", short: "问候", eshort: "Greet", tag: "normal", tierId: "tier_4", img: "img/HSR/weapon/4/天才们的问候.webp" },
    { id: "hsr_wep_tier_4_066", name: "故事的下一页", en: "Next Page of the Story", short: "下页", eshort: "NextP", tag: "normal", tierId: "tier_4", img: "img/HSR/weapon/4/故事的下一页.webp" },


    { id: "hsr_wep_tier_4_044", name: "何物为真", en: "What Is Real?", short: "何真", eshort: "WhatR", tag: "gift", tierId: "tier_4", img: "img/HSR/weapon/4/何物为真.webp" },
    { id: "hsr_wep_tier_4_043", name: "美梦小镇大冒险", en: "Dreamville Adventure", short: "美梦", eshort: "Dream", tag: "gift", tierId: "tier_4", img: "img/HSR/weapon/4/美梦小镇大冒险.webp" },
    { id: "hsr_wep_tier_4_042", name: "最后的赢家", en: "The Final Victor", short: "赢家", eshort: "Victr", tag: "gift", tierId: "tier_4", img: "img/HSR/weapon/4/最后的赢家.webp" },
    { id: "hsr_wep_tier_4_014", name: "春水初生", en: "River Flows in Spring", short: "春水", eshort: "River", tag: "gift", tierId: "tier_4", img: "img/HSR/weapon/4/春水初生.webp" },
    { id: "hsr_wep_tier_4_041", name: "织造命运之线", en: "Destiny's Threads Forewoven", short: "织线", eshort: "Thred", tag: "gift", tierId: "tier_4", img: "img/HSR/weapon/4/织造命运之线.webp" },
    { id: "hsr_wep_tier_4_040", name: "好戏开演", en: "It's Showtime", short: "好戏", eshort: "ShowT", tag: "gift", tierId: "tier_4", img: "img/HSR/weapon/4/好戏开演.webp" },
    { id: "hsr_wep_tier_4_039", name: "银河沦陷日", en: "The Day The Cosmos Fell", short: "沦陷", eshort: "Cosmo", tag: "gift", tierId: "tier_4", img: "img/HSR/weapon/4/银河沦陷日.webp" },
    { id: "hsr_wep_tier_4_038", name: "在火的远处", en: "Flames Afar", short: "火远", eshort: "Flame", tag: "gift", tierId: "tier_4", img: "img/HSR/weapon/4/在火的远处.webp" },
    { id: "hsr_wep_tier_4_047", name: "为了明日的旅途", en: "For Tomorrow's Journey", short: "旅途", eshort: "Journ", tag: "gift", tierId: "tier_4", img: "img/HSR/weapon/4/为了明日的旅途.webp" },
    { id: "hsr_wep_tier_4_013", name: "无处可逃", en: "Nowhere to Run", short: "无逃", eshort: "Nowhe", tag: "gift", tierId: "tier_4", img: "img/HSR/weapon/4/无处可逃.webp" },
    { id: "hsr_wep_tier_4_012", name: "早餐的仪式感", en: "The Seriousness of Breakfast", short: "早餐", eshort: "Break", tag: "gift", tierId: "tier_4", img: "img/HSR/weapon/4/早餐的仪式感.webp" },
    { id: "hsr_wep_tier_4_011", name: "今日亦是和平的一日", en: "Today Is Another Peaceful Day", short: "和平", eshort: "Peace", tag: "gift", tierId: "tier_4", img: "img/HSR/weapon/4/今日亦是和平的一日.webp" },
    { id: "hsr_wep_tier_4_010", name: "暖夜不会漫长", en: "Warm Nights Won't Last", short: "暖夜", eshort: "WarmN", tag: "gift", tierId: "tier_4", img: "img/HSR/weapon/4/暖夜不会漫长.webp" },
    { id: "hsr_wep_tier_4_009", name: "重返幽冥", en: "Return to Darkness", short: "幽冥", eshort: "Retrn", tag: "gift", tierId: "tier_4", img: "img/HSR/weapon/4/重返幽冥.webp" },
    { id: "hsr_wep_tier_4_008", name: "镂月裁云之意", en: "Carve the Moon, Weave the Clouds", short: "镂月", eshort: "MoonC", tag: "gift", tierId: "tier_4", img: "img/HSR/weapon/4/镂月裁云之意.webp" },
    { id: "hsr_wep_tier_4_007", name: "这就是我啦！", en: "This Is Me!", short: "我啦", eshort: "ThisM", tag: "gift", tierId: "tier_4", img: "img/HSR/weapon/4/这就是我啦！.webp" },
    { id: "hsr_wep_tier_4_006", name: "过往未来", en: "Past and Future", short: "过往", eshort: "PastF", tag: "gift", tierId: "tier_4", img: "img/HSR/weapon/4/过往未来.webp" },
    { id: "hsr_wep_tier_4_005", name: "等价交换", en: "Quid Pro Quo", short: "等价", eshort: "QuidP", tag: "gift", tierId: "tier_4", img: "img/HSR/weapon/4/等价交换.webp" },
    { id: "hsr_wep_tier_4_037", name: "嘿，我在这儿", en: "Hey, Over Here", short: "在这", eshort: "OverH", tag: "gift", tierId: "tier_4", img: "img/HSR/weapon/4/嘿，我在这儿.webp" },
    { id: "hsr_wep_tier_4_036", name: "新手任务开始前", en: "Before the Tutorial Mission Starts", short: "新手", eshort: "Tutor", tag: "gift", tierId: "tier_4", img: "img/HSR/weapon/4/新手任务开始前.webp" },
    { id: "hsr_wep_tier_4_004", name: "延长记号", en: "Fermata", short: "延长", eshort: "Ferma", tag: "gift", tierId: "tier_4", img: "img/HSR/weapon/4/延长记号.webp" },
    { id: "hsr_wep_tier_4_003", name: "后会有期", en: "We Will Meet Again", short: "后会", eshort: "MeetA", tag: "gift", tierId: "tier_4", img: "img/HSR/weapon/4/后会有期.webp" },
    { id: "hsr_wep_tier_4_002", name: "我们是地火", en: "We Are Wildfire", short: "地火", eshort: "Wildf", tag: "gift", tierId: "tier_4", img: "img/HSR/weapon/4/我们是地火.webp" },
    { id: "hsr_wep_tier_4_001", name: "汪！散步时间！", en: "Woof! Walk Time!", short: "散步", eshort: "WoofW", tag: "gift", tierId: "tier_4", img: "img/HSR/weapon/4/汪！散步时间！.webp" },
    { id: "hsr_wep_tier_4_073", name: "放个短假", en: "Take a Short Vacation", short: "短假", eshort: "Vacat", tag: "gift", tierId: "tier_4", img: "img/HSR/weapon/4/放个短假.webp" },
    { id: "hsr_wep_tier_4_072", name: "向着地平线的终点", en: "Toward the Line of the Horizon", short: "平线", eshort: "Horiz", tag: "gift", tierId: "tier_4", img: "img/HSR/weapon/4/向着地平线的终点.webp" },
    { id: "hsr_wep_tier_4_071", name: "未来，有我们一起", en: "Together We Have a Future", short: "未来", eshort: "Toget", tag: "gift", tierId: "tier_4", img: "img/HSR/weapon/4/未来，有我们一起.webp" },
    { id: "hsr_wep_tier_4_070", name: "菇菇嘎嘎历险记", en: "Adventures of Mush and Quack", short: "历险", eshort: "MushQ", tag: "gift", tierId: "tier_4", img: "img/HSR/weapon/4/菇菇嘎嘎历险记.webp" },
    { id: "hsr_wep_tier_4_069", name: "今日好手气", en: "Good Hand Today", short: "手气", eshort: "GoodH", tag: "gift", tierId: "tier_4", img: "img/HSR/weapon/4/今日好手气.webp" },
    { id: "hsr_wep_tier_4_068", name: "飞向粉色的明天", en: "Fly to a Pink Tomorrow", short: "粉明", eshort: "PinkT", tag: "gift", tierId: "tier_4", img: "img/HSR/weapon/4/飞向粉色的明天.webp" },
    { id: "hsr_wep_tier_4_067", name: "永远的迷境饭", en: "Everlasting Dungeon Feast", short: "境饭", eshort: "Feast", tag: "gift", tierId: "tier_4", img: "img/HSR/weapon/4/永远的迷境饭.webp" },
    { id: "hsr_wep_tier_4_065", name: "于那终点再见", en: "Farewell at the Horizon", short: "再见", eshort: "Farew", tag: "gift", tierId: "tier_4", img: "img/HSR/weapon/4/于那终点再见.webp" },
    { id: "hsr_wep_tier_4_064", name: "假日浴场大冒险", en: "Holiday Bathhouse Adventure", short: "浴场", eshort: "BathA", tag: "gift", tierId: "tier_4", img: "img/HSR/weapon/4/假日浴场大冒险.webp" },
    { id: "hsr_wep_tier_4_063", name: "氤氲麦香的梦", en: "Dream of Fragrant Wheat", short: "麦香", eshort: "Wheat", tag: "gift", tierId: "tier_4", img: "img/HSR/weapon/4/氤氲麦香的梦.webp" },
    { id: "hsr_wep_tier_4_062", name: "一行往日的血", en: "A Trail of Past Blood", short: "往血", eshort: "Blood", tag: "gift", tierId: "tier_4", img: "img/HSR/weapon/4/一行往日的血.webp" },
    { id: "hsr_wep_tier_4_061", name: "花儿不会忘记", en: "Flowers Won't Forget", short: "花记", eshort: "Flowe", tag: "gift", tierId: "tier_4", img: "img/HSR/weapon/4/花儿不会忘记.webp" },
    { id: "hsr_wep_tier_4_060", name: "追逐风的时候", en: "When Chasing the Wind", short: "逐风", eshort: "Chase", tag: "gift", tierId: "tier_4", img: "img/HSR/weapon/4/追逐风的时候.webp" },
    { id: "hsr_wep_tier_4_059", name: "直到明天的明天", en: "Until Tomorrow's Tomorrow", short: "直明", eshort: "UntiT", tag: "gift", tierId: "tier_4", img: "img/HSR/weapon/4/直到明天的明天.webp" },
    { id: "hsr_wep_tier_4_058", name: "愿旅途永远坦然", en: "May the Journey Be Peaceful", short: "坦然", eshort: "Peace", tag: "gift", tierId: "tier_4", img: "img/HSR/weapon/4/愿旅途永远坦然.webp" },
    { id: "hsr_wep_tier_4_057", name: "宇宙大生意", en: "Cosmic Big Business", short: "生意", eshort: "CosmB", tag: "gift", tierId: "tier_4", img: "img/HSR/weapon/4/宇宙大生意.webp" },
    { id: "hsr_wep_tier_4_055", name: "胜利只在朝夕间", en: "Victory in a Blink", short: "朝夕", eshort: "VicB", tag: "gift", tierId: "tier_4", img: "img/HSR/weapon/4/胜利只在朝夕间.webp" },
    { id: "hsr_wep_tier_4_054", name: "多流汗，少流泪", en: "More Sweat, Less Tears", short: "汗泪", eshort: "Sweat", tag: "gift", tierId: "tier_4", img: "img/HSR/weapon/4/多流汗，少流泪.webp" },
    { id: "hsr_wep_tier_4_052", name: "忍事录·音律狩猎", en: "Ninja Record: Sound Hunt", short: "忍事", eshort: "Ninja", tag: "gift", tierId: "tier_4", img: "img/HSR/weapon/4/忍事录·音律狩猎.webp" },

    //三星光锥
    { id: "hsr_wep_tier_3_021", name: "锋镝", en: "Arrows", short: "锋镝", eshort: "Arrow", tag: "normal", tierId: "tier_3", img: "img/HSR/weapon/3/锋镝.webp" },
    { id: "hsr_wep_tier_3_020", name: "离弦", en: "Darting Arrow", short: "离弦", eshort: "Darti", tag: "normal", tierId: "tier_3", img: "img/HSR/weapon/3/离弦.webp" },
    { id: "hsr_wep_tier_3_019", name: "相抗", en: "Antagonistic", short: "相抗", eshort: "Antag", tag: "normal", tierId: "tier_3", img: "img/HSR/weapon/3/相抗.webp" },
    { id: "hsr_wep_tier_3_018", name: "齐颂", en: "Chorus", short: "齐颂", eshort: "Choru", tag: "normal", tierId: "tier_3", img: "img/HSR/weapon/3/齐颂.webp" },
    { id: "hsr_wep_tier_3_017", name: "调和", en: "Harmonize", short: "调和", eshort: "Harmo", tag: "normal", tierId: "tier_3", img: "img/HSR/weapon/3/调和.webp" },
    { id: "hsr_wep_tier_3_016", name: "轮契", en: "Meshing Cogs", short: "轮契", eshort: "Meshi", tag: "normal", tierId: "tier_3", img: "img/HSR/weapon/3/轮契.webp" },
    { id: "hsr_wep_tier_3_015", name: "灵钥", en: "Passkey", short: "灵钥", eshort: "Passk", tag: "normal", tierId: "tier_3", img: "img/HSR/weapon/3/灵钥.webp" },
    { id: "hsr_wep_tier_3_014", name: "智库", en: "Data Bank", short: "智库", eshort: "DataB", tag: "normal", tierId: "tier_3", img: "img/HSR/weapon/3/智库.webp" },
    { id: "hsr_wep_tier_3_013", name: "睿见", en: "Sagacity", short: "睿见", eshort: "Sagac", tag: "normal", tierId: "tier_3", img: "img/HSR/weapon/3/睿见.webp" },
    { id: "hsr_wep_tier_3_012", name: "琥珀", en: "Amber", short: "琥珀", eshort: "Amber", tag: "normal", tierId: "tier_3", img: "img/HSR/weapon/3/琥珀.webp" },
    { id: "hsr_wep_tier_3_011", name: "戍御", en: "Defense", short: "戍御", eshort: "Defen", tag: "normal", tierId: "tier_3", img: "img/HSR/weapon/3/戍御.webp" },
    { id: "hsr_wep_tier_3_010", name: "开疆", en: "Pioneering Territory", short: "开疆", eshort: "Terrt", tag: "normal", tierId: "tier_3", img: "img/HSR/weapon/3/开疆.webp" },
    { id: "hsr_wep_tier_3_009", name: "匿影", en: "Hidden Shadow", short: "匿影", eshort: "Hidde", tag: "normal", tierId: "tier_3", img: "img/HSR/weapon/3/匿影.webp" },
    { id: "hsr_wep_tier_3_008", name: "幽邃", en: "Void", short: "幽邃", eshort: "VoidS", tag: "normal", tierId: "tier_3", img: "img/HSR/weapon/3/幽邃.webp" },
    { id: "hsr_wep_tier_3_007", name: "渊环", en: "Loop", short: "渊环", eshort: "LoopS", tag: "normal", tierId: "tier_3", img: "img/HSR/weapon/3/渊环.webp" },
    { id: "hsr_wep_tier_3_006", name: "天倾", en: "Collapsing Sky", short: "天倾", eshort: "Colla", tag: "normal", tierId: "tier_3", img: "img/HSR/weapon/3/天倾.webp" },
    { id: "hsr_wep_tier_3_005", name: "乐圮", en: "Shattered Home", short: "乐圮", eshort: "Shatt", tag: "normal", tierId: "tier_3", img: "img/HSR/weapon/3/乐圮.webp" },
    { id: "hsr_wep_tier_3_004", name: "俱殁", en: "Mutual Demise", short: "俱殁", eshort: "Demis", tag: "normal", tierId: "tier_3", img: "img/HSR/weapon/3/俱殁.webp" },
    { id: "hsr_wep_tier_3_003", name: "蕃息", en: "Multiplication", short: "蕃息", eshort: "Multi", tag: "normal", tierId: "tier_3", img: "img/HSR/weapon/3/蕃息.webp" },
    { id: "hsr_wep_tier_3_002", name: "物穰", en: "Cornucopia", short: "物穰", eshort: "Cornu", tag: "normal", tierId: "tier_3", img: "img/HSR/weapon/3/物穰.webp" },
    { id: "hsr_wep_tier_3_001", name: "嘉果", en: "Fine Fruit", short: "嘉果", eshort: "Fruit", tag: "normal", tierId: "tier_3", img: "img/HSR/weapon/3/嘉果.webp" },
    { id: "hsr_wep_tier_3_025", name: "嗤笑", en: "Sneer", short: "嗤笑", eshort: "Sneer", tag: "normal", tierId: "tier_3", img: "img/HSR/weapon/3/嗤笑.webp" },
    { id: "hsr_wep_tier_3_024", name: "残泪", en: "Tearful Remnant", short: "残泪", eshort: "Remnt", tag: "normal", tierId: "tier_3", img: "img/HSR/weapon/3/残泪.webp" },
    { id: "hsr_wep_tier_3_023", name: "焚影", en: "Brahma Shadow", short: "焚影", eshort: "Brahm", tag: "normal", tierId: "tier_3", img: "img/HSR/weapon/3/焚影.webp" },
    { id: "hsr_wep_tier_3_022", name: "溯忆", en: "Memory Tracing", short: "溯忆", eshort: "Trace", tag: "normal", tierId: "tier_3", img: "img/HSR/weapon/3/溯忆.webp" }
];

//无论上面怎么命名分类，最后这边都会被统一成一个大图鉴让代码能读信息
const HSR_DB = [...HSR_CHAR, ...HSR_WEAPON];

//  全局稀有度 (Tier) 定义
const HSR_GLOBAL_TIERS = [
    { id: 'tier_5', name: '5星', en:"5 Stars", color: '#f1c40f' },
    { id: 'tier_4', name: '4星', en:"4 Stars", color: '#9b59b6' },
    { id: 'tier_3', name: '3星', en:"3 Stars", color: '#3498db' }
];
const HSR_SETUP_RULES = {
    icon: 'img/HSR/icon/game_icon.webp',
    gameName: "崩坏：星穹铁道",enName: "Honkai : Star Rail",

    categories: [
        { id: 'char', name: '角色', en: 'Character', icon: "img/HSR/icon/角色.png" },
        { id: 'wep',  name: '光锥', en: 'Light Cone', icon: "img/HSR/icon/光锥.png" },
    ],

    tagDefinitions: {
        up: { name: "限定", en: "Limited", enShort: "Lim", color: "#f1c40f", textColor: "#000" },
        collab: { name: "联动", en: "Collaboration", enShort: "Coll", color: "#f1c40f", textColor: "#000" },
        custom_offrate: { name: "星缘相邀", en: "Starry Encounter", enShort: "Stary", color: "#e67e22", textColor: "#fff" },
        std: { name: "常驻", en: "Standard", enShort: "Std", color: "#3498db", textColor: "#fff" },
        normal: { name: "副产物", en: "Side Product", enShort: "Side", color: "#95a5a6", textColor: "#000" },
        gift: { name: "赠送", en: "Gift", enShort: "Gift", color: "#2ecc71", textColor: "#000" },
    },

};

// --- 星穹铁道：货币与抽卡资源规则 ---
// 名称：name 为中文，en 为英文；ID 只用于引用，改名无需修改 ID。
// overflowRules：各图鉴大类满阶的总件数（含首次），角色第 8 件起为溢出。
const HSR_CURRENCY_RULES = {
    overflowRules: { char: 7, wep: 5 },
    economy: {
        version: 1,
        unlockGroups: [],
        resources: [
            { id: 'stellar_jade', name: '星琼', en: 'Stellar Jade', icon: "img/HSR/icon/星琼.webp" },
            { id: 'oneiric_shard', name: '古老梦华', en: 'Oneiric Shard', icon: "img/HSR/icon/古老梦华.webp" },
            { id: 'starlight', name: '未熄的星芒', en: 'Undying Starlight', icon: "img/HSR/icon/未熄的星芒.webp" },
            { id: 'embers', name: '未熄的余烬', en: 'Undying Embers', icon: "img/HSR/icon/未熄的余烬.webp" },
            { id: 'special_pass', name: '星轨专票', en: 'Star Rail Special Pass', icon: "img/HSR/icon/星轨专票.webp" },
            { id: 'standard_pass', name: '星轨通票', en: 'Star Rail Pass', icon: "img/HSR/icon/星轨通票.webp" }
        ],
        // from 为支付资源 ID，toIds 为备选目标；每次择一兑换，非同时获得全部。
        // monthly 的 limit 是每种目标资源各自的月度可购买次数。
        exchanges: [
            { id: 'jade_to_pass', name: '星琼兑换车票', en: 'Exchange Jade for passes', from: 'stellar_jade', toIds: ['special_pass', 'standard_pass'], mode: 'fixed', cost: 160, gain: 1 },
            { id: 'shard_to_jade', name: '古老梦华兑换星琼', en: 'Exchange Shards for Jade', from: 'oneiric_shard', toIds: ['stellar_jade'], mode: 'fixed', cost: 1, gain: 1 },
            { id: 'starlight_to_pass', name: '星芒兑换车票', en: 'Exchange Starlight for passes', from: 'starlight', toIds: ['special_pass', 'standard_pass'], mode: 'fixed', cost: 20, gain: 1 },
            { id: 'embers_to_pass', name: '余烬每月兑换车票', en: 'Monthly Embers exchange', from: 'embers', toIds: ['special_pass', 'standard_pass'], mode: 'monthly', cost: 90, gain: 1, limit: 5 }
        ],
        // 卡池 ID 对应下方 HSR_POOL_RULES；空数组表示不限制卡池。
        payments: [
            { id: 'jade_pull', name: '星琼单抽', en: 'Single Warp with Jade', resourceId: 'stellar_jade', cost: 160, pulls: 1, poolIds: [] },
            { id: 'special_pass_pull', name: '专票单抽', en: 'Single Warp with a Special Pass', resourceId: 'special_pass', cost: 1, pulls: 1, poolIds: ['char_up', 'wep_up', 'char_collab', 'wep_collab'] },
            { id: 'standard_pass_pull', name: '通票单抽', en: 'Single Warp with a Pass', resourceId: 'standard_pass', cost: 1, pulls: 1, poolIds: ['mixed_std'] }
        ],
        // categoryIds/tierId 筛选抽出物品；poolIds/tagIds 为空数组表示不限制。
        // duplicate_no_overflow：第 2 件至满阶；overflow：满阶后的下一件起。
        // always：每次抽出。角色首次不发星芒，因此未使用 first/含首次的分段规则。
        incomes: [
            { id: 'char_5_duplicate', name: '五星角色重复返还', en: '5-star character duplicate return', source: 'byproduct', resourceId: 'starlight', categoryIds: ['char'], tierId: 'tier_5', poolIds: [], tagIds: [], tagMatch: 'any', condition: 'duplicate_no_overflow', amount: 40 },
            { id: 'char_5_overflow', name: '五星角色溢出返还', en: '5-star character overflow return', source: 'byproduct', resourceId: 'starlight', categoryIds: ['char'], tierId: 'tier_5', poolIds: [], tagIds: [], tagMatch: 'any', condition: 'overflow', amount: 100 },
            { id: 'char_4_duplicate', name: '四星角色重复返还', en: '4-star character duplicate return', source: 'byproduct', resourceId: 'starlight', categoryIds: ['char'], tierId: 'tier_4', poolIds: [], tagIds: [], tagMatch: 'any', condition: 'duplicate_no_overflow', amount: 8 },
            { id: 'char_4_overflow', name: '四星角色溢出返还', en: '4-star character overflow return', source: 'byproduct', resourceId: 'starlight', categoryIds: ['char'], tierId: 'tier_4', poolIds: [], tagIds: [], tagMatch: 'any', condition: 'overflow', amount: 20 },
            { id: 'wep_5_return', name: '五星光锥返还', en: '5-star Light Cone return', source: 'byproduct', resourceId: 'starlight', categoryIds: ['wep'], tierId: 'tier_5', poolIds: [], tagIds: [], tagMatch: 'any', condition: 'always', amount: 40 },
            { id: 'wep_4_return', name: '四星光锥返还', en: '4-star Light Cone return', source: 'byproduct', resourceId: 'starlight', categoryIds: ['wep'], tierId: 'tier_4', poolIds: [], tagIds: [], tagMatch: 'any', condition: 'always', amount: 8 },
            { id: 'wep_3_return', name: '三星光锥返还', en: '3-star Light Cone return', source: 'byproduct', resourceId: 'embers', categoryIds: ['wep'], tierId: 'tier_3', poolIds: [], tagIds: [], tagMatch: 'any', condition: 'always', amount: 20 },
            // 自定义入口的初始值，非游戏实际每日任务奖励。
            { id: 'custom_stellar_jade', name: '自定义获取星琼', en: 'Custom Stellar Jade income', source: 'other', resourceId: 'stellar_jade', schedule: 'unlimited', amount: 1 }
        ]
    }
};

// --- 星穹铁道：预设卡池概率规则 ---
const HSR_POOL_RULES = {
    // 角色限定跃迁
    char_up: {
        info: { name: "角色活动跃迁", en: "Character Event Warp", icon: "img/HSR/icon/角色.png", badgeColor: "#f1c40f" },

        assembly: {
            tierRules: {
                tier_5: {
                    mode: 'up_split',
                    upCats: ['char'],
                    offrateCats: ['char'],
                    upTags: ['up'],
                    offrateTags: ['std',"custom_offrate"]
                },
                tier_4: {
                    mode: 'up_split',
                    upCats: ['char'],
                    offrateCats: ['char', 'wep'],
                    upTags: ['normal'],
                    offrateTags: ['normal']
                },
                tier_3: {
                    mode: 'flat',
                    flatCats: ['wep'],
                    tags: ['normal']
                }
            }
        },

        tiers: [
            { id: 'tier_5', prob: 0.6, isGold: true },
            { 
                id: 'tier_4', 
                prob: 5.1,
                subProbs: [
                    { prob: 2.55, conditions: [{ cat: 'char', tags: ['normal'] }] },
                    { prob: 2.55, conditions: [{ cat: 'wep', tags: ['normal'] }] }
                ]
            },
            { id: 'tier_3', prob: 94.3 }
        ],

        pities: [
            {
                tierId: 'tier_5',
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
                tierId: 'tier_4',
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

        preSelect: {
            enabled: true,
            tiers: {
                tier_5: { upMin: 1, upMax: 1, stdMin: 7, stdMax: 7 },
                tier_4: { upMin: 3, upMax: 3, stdMin: 0, stdMax: 999 },
                tier_3: { stdMin: 0, stdMax: 999 }
            }
        },

        lifecycle: {allowRotation: false,}
    },

    wep_up: {
        info: { name: "光锥活动跃迁", en: "Light Cone Event Warp", icon: "img/HSR/icon/光锥.png", badgeColor: "#3498db" },

        assembly: {
            tierRules: {
                tier_5: {
                    mode: 'up_split',
                    upCats: ['wep'],
                    offrateCats: ['wep'],
                    upTags: ['up'],
                    offrateTags: ['std']
                },
                tier_4: {
                    mode: 'up_split',
                    upCats: ['wep'],
                    offrateCats: ['char', 'wep'],
                    upTags: ['normal'],
                    offrateTags: ['normal']
                },
                tier_3: {
                    mode: 'flat',
                    flatCats: ['wep'],
                    tags: ['normal']
                }
            }
        },

        tiers: [
            { id: 'tier_5', prob: 0.8, isGold: true },
            { 
                id: 'tier_4', 
                prob: 6.6,
                subProbs: [
                    { prob: 3.3, conditions: [{ cat: 'char', tags: ['normal'] }] },
                    { prob: 3.3, conditions: [{ cat: 'wep', tags: ['normal'] }] }
                ]
            },
            { id: 'tier_3', prob: 92.6 }
        ],

        pities: [
            {
                tierId: 'tier_5',
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
                tierId: 'tier_4',
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

        preSelect: {
            enabled: true,
            tiers: {
                tier_5: { upMin: 1, upMax: 1, stdMin: 7, stdMax: 7 },
                tier_4: { upMin: 3, upMax: 3, stdMin: 0, stdMax: 999 },
                tier_3: { stdMin: 0, stdMax: 999 }
            }
        },

        lifecycle: {allowRotation: false,}
    },

    char_collab: {
        info: { name: "角色联动跃迁", en: "Character Collaboration Warp", icon: "img/HSR/icon/FSN联动.png", badgeColor: "#e67e22" },

        assembly: {
            tierRules: {
                tier_5: {
                    mode: 'up_split',
                    upCats: ['char'],
                    offrateCats: ['char'],
                    upTags: ['collab'],
                    offrateTags: ['std','custom_offrate']
                },
                tier_4: {
                    mode: 'flat',
                    flatCats: ['char','wep'],
                    tags: ['normal']
                },
                tier_3: {
                    mode: 'flat',
                    flatCats: ['wep'],
                    tags: ['normal']
                }
            }
        },

        tiers: [
            { id: 'tier_5', prob: 0.6, isGold: true },
            { 
                id: 'tier_4', 
                prob: 5.1,
                subProbs: [
                    { prob: 2.55, conditions: [{ cat: 'char', tags: ['normal'] }] },
                    { prob: 2.55, conditions: [{ cat: 'wep', tags: ['normal'] }] }
                ]
            },
            { id: 'tier_3', prob: 94.3 }
        ],

        pities: [
            {
                tierId: 'tier_5',
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
                tierId: 'tier_4',
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

        preSelect: {
            enabled: true,
            tiers: {
                tier_5: { upMin: 1, upMax: 1, stdMin: 7, stdMax: 7 },
                tier_4: { stdMin: 0, stdMax: 999 },
                tier_3: { stdMin: 0, stdMax: 999 }
            }
        },

        lifecycle: {allowRotation: false,}
    },

    // 光锥限定跃迁
    wep_collab: {
        info: { name: "光锥联动跃迁", en: "Light Cone Collaboration Warp", icon: "img/HSR/icon/FSN联动.png", badgeColor: "#e67e22" },

        assembly: {
            tierRules: {
                tier_5: {
                    mode: 'up_split',
                    upCats: ['wep'],
                    offrateCats: ['wep'],
                    upTags: ['collab'],
                    offrateTags: ['std']
                },
                tier_4: {
                    mode: 'flat',
                    flatCats: ['wep','char'],
                    tags: ['normal']
                },
                tier_3: {
                    mode: 'flat',
                    flatCats: ['wep'],
                    tags: ['normal']
                }
            }
        },

        tiers: [
            { id: 'tier_5', prob: 0.8, isGold: true },
            { 
                id: 'tier_4', 
                prob: 6.6,
                subProbs: [
                    { prob: 3.3, conditions: [{ cat: 'char', tags: ['normal'] }] },
                    { prob: 3.3, conditions: [{ cat: 'wep', tags: ['normal'] }] }
                ]
            },
            { id: 'tier_3', prob: 92.6 }
        ],

        pities: [
            {
                tierId: 'tier_5',
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
                tierId: 'tier_4',
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

        preSelect: {
            enabled: true,
            tiers: {
                tier_5: { upMin: 1, upMax: 1, stdMin: 7, stdMax: 7 },
                tier_4: { stdMin: 0, stdMax: 999 },
                tier_3: { stdMin: 0, stdMax: 999 }
            }
        },

        lifecycle: {allowRotation: false,}
    },

    // 常驻跃迁 (角色/光锥混池)
    mixed_std: {
        info: { name: "常驻跃迁", en: "Standard Warp", icon: "img/HSR/icon/星轨通票.webp", badgeColor: "#95a5a6" },

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
                prob: 5.1,
                subProbs: [
                    { prob: 2.55, conditions: [{ cat: 'char', tags: ['normal', 'std'] }] },
                    { prob: 2.55, conditions: [{ cat: 'wep', tags: ['normal', 'std'] }] }
                ]
            },
            { id: 'tier_3', prob: 94.3 }
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
                softEnabled: false
            }
        ],

        sparkRules: [
            {
                id: "hsr_mixed_std_spark_1",
                name: "300抽自选赠礼",
                en: "Selector at 300 pulls",
                activation: { match: "all", counting: "reset", catchUp: "all", conditions: [] },
                expiration: { type: "none", scope: "after_unlock" },
                maxTriggers: null,
                limit: 300,
                type: "once",
                targetType: "custom_filter",
                targetTier: "tier_5",
                targetCats: ['char'],
                targetTags: ['std'],
                deliverMode: "selectable",
                noReset: true
            }
        ],

        preSelect: {
            enabled: true,
            tiers: {
                tier_5: { stdMin: 14, stdMax: 14 },
                tier_4: { stdMin: 0, stdMax: 999 },
                tier_3: { stdMin: 0, stdMax: 999 }
            }
        },

        lifecycle: {
            allowRotation: false
        }
    }
};
