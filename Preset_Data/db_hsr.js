

//供复制：{ name: "", en: "", short: "", eshort: "", type: "up" },
const HSR_CHAR = [
    //如果要放可歪限定，就放这个： ["up","spec"]
    { name: "绯英", en: "Evanecia", short: "绯", eshort: "Evanecia",type: "char_up" ,tierId: "tier_5" ,img : "img/hsr_char/绯英.webp"},
    { name: "银狼lv.999", en: "Silver Wolf LV.999", short: "狼尊", eshort: "9Wolf", type: "char_up" ,tierId: "tier_5" ,img : "img/hsr_char/银狼lv.999.webp"},
    { name: "不死途", en: "Ashveil", short: "途", eshort: "Ashve", type: "char_up" ,tierId: "tier_5" ,img : "img/hsr_char/不死途.webp"},
    { name: "爻光", en: "Yao Guang", short: "爻", eshort: "Yao", type: "char_up" ,tierId: "tier_5" ,img : "img/hsr_char/爻光.webp"},
    { name: "火花", en: "Sparxie", short: "火", eshort: "Sparx", type: "char_up" ,tierId: "tier_5" ,img : "img/hsr_char/火花.webp"},
    { name: "大丽花", en: "The Dahlia", short: "花", eshort: "Dahli", type: "char_up" ,tierId: "tier_5" ,img : "img/hsr_char/大丽花.webp"},
    { name: "昔涟", en: "Cyrene", short: "昔", eshort: "Cryen", type: "char_up" ,tierId: "tier_5" ,img : "img/hsr_char/昔涟.webp"},
    { name: "丹恒·滕荒", en: "Dan Heng · Permansor Terrae", short: "盾丹", eshort: "DPerm", type: "char_up" ,tierId: "tier_5" ,img :"img/hsr_char/丹恒·滕荒.webp"},
    { name: "长夜月", en: "Evernight", short: "长夜", eshort: "ENigh", type: "char_up" ,tierId: "tier_5" ,img : "img/hsr_char/长夜月.webp"},
    { name: "刻律德菈", en: "Cerydra", short: "刻律", eshort: "Ceryd", type: "char_up" ,tierId: "tier_5" ,img : "img/hsr_char/刻律德菈.webp"},
    { name: "海瑟音", en: "Hysilens", short: "海", eshort: "Hysil", type: "char_up" ,tierId: "tier_5" ,img : "img/hsr_char/海瑟音.webp"},
    { name: "白厄", en: "Phainon", short: "白", eshort: "Phain", type: "char_up" ,tierId: "tier_5" ,img : "img/hsr_char/白厄.webp"},
    { name: "Archer", en: "Archer", short: "红A", eshort: "Arche", type: "char_up_2" ,tierId: "tier_5" ,img : "img/hsr_char/Archer.webp"},
    { name: "Saber", en: "Saber", short: "Saber", eshort: "Saber", type: "char_up_2" ,tierId: "tier_5" ,img :"img/hsr_char/Saber.webp"},
    { name: "赛飞儿", en: "Cipher", short: "猫", eshort: "Ciphe", type: "char_up" ,tierId: "tier_5" ,img : "img/hsr_char/赛飞儿.webp"},
    { name: "凤堇", en: "Hyacine", short: "风", eshort: "Hyac", type: "char_up" ,tierId: "tier_5" ,img : "img/hsr_char/凤堇.webp"},
    { name: "那刻夏", en: "Anaxa", short: "那", eshort: "Anaxa", type: "char_up" ,tierId: "tier_5" ,img : "img/hsr_char/那刻夏.webp"},
    { name: "遐蝶", en: "Castorice", short: "蝶", eshort: "Casto", type: "char_up" ,tierId: "tier_5" ,img : "img/hsr_char/遐蝶.webp"},
    { name: "万敌", en: "Mydei", short: "万", eshort: "Mydei", type: "char_up" ,tierId: "tier_5" ,img : "img/hsr_char/万敌.webp"},
    { name: "提宝", en: "Tribble", short: "提", eshort: "Trib", type: "char_up" ,tierId: "tier_5" ,img : "img/hsr_char/提宝.webp"},
    { name: "大黑塔", en: "The Herta", short: "大黑", eshort: "THert", type: "char_up" ,tierId: "tier_5" ,img : "img/hsr_char/大黑塔.webp"},
    { name: "阿格莱雅", en: "Aglaea", short: "雅", eshort: "Aglae", type: "char_up" ,tierId: "tier_5" ,img : "img/hsr_char/阿格莱雅.webp"},
    { name: "忘归人", en: "Fugue", short: "忘", eshort: "Fugue", type: "char_up" ,tierId: "tier_5" ,img : "img/hsr_char/忘归人.webp"},
    { name: "星期日", en: "Sunday", short: "日", eshort: "Sun", type: "char_up" ,tierId: "tier_5" ,img : "img/hsr_char/星期日.webp"},
    { name: "乱破", en: "Rappa", short: "乱", eshort: "Rappa", type: "char_up" ,tierId: "tier_5" ,img : "img/hsr_char/乱破.webp"},
    { name: "灵砂", en: "Lingsha", short: "灵", eshort: "Lings", type: "char_up" ,tierId: "tier_5" ,img : "img/hsr_char/灵砂.webp"},
    { name: "飞霄", en: "Feixiao", short: "飞", eshort: "Feix", type: "char_up" ,tierId: "tier_5" ,img : "img/hsr_char/飞霄.webp"},
    { name: "椒丘", en: "Jiao Qiu", short: "椒", eshort: "JiaoQ", type: "char_up" ,tierId: "tier_5" ,img : "img/hsr_char/椒丘.webp"},
    { name: "云璃", en: "Yunli", short: "璃", eshort: "Yunli", type: "char_up" ,tierId: "tier_5" ,img : "img/hsr_char/云璃.webp"},
    { name: "翡翠", en: "Jade", short: "翡翠", eshort: "Jade", type: "char_up" ,tierId: "tier_5" ,img : "img/hsr_char/翡翠.webp"},
    { name: "流萤", en: "Firefly", short: "萤", eshort: "Firef", type: "char_up" ,tierId: "tier_5" ,img :"img/hsr_char/流萤.webp"},
    { name: "波提欧", en: "Boothill", short: "波", eshort: "Booth", type: "char_up" ,tierId: "tier_5" ,img : "img/hsr_char/波提欧.webp"},
    { name: "知更鸟", en: "Robin", short: "鸟", eshort: "Robin", type: "char_up" ,tierId: "tier_5" ,img : "img/hsr_char/知更鸟.webp"},
    { name: "砂金", en: "Aventurine", short: "砂", eshort: "Avent", type: "char_up" ,tierId: "tier_5" ,img : "img/hsr_char/砂金.webp"},
    { name: "黄泉", en: "Acheron", short: "泉", eshort: "Acher", type: "char_up" ,tierId: "tier_5" ,img : "img/hsr_char/黄泉.webp"},
    { name: "花火", en: "Sparkle", short: "花", eshort: "Spark", type: "char_up" ,tierId: "tier_5" ,img : "img/hsr_char/花火.webp"},
    { name: "黑天鹅", en: "Black Swan", short: "鹅", eshort: "BSwan", type: "char_up" ,tierId: "tier_5" ,img :"img/hsr_char/黑天鹅.webp"},
    { name: "真理医生", en: "Dr.Ratio", short: "真", eshort: "Ratio", type: "char_up" ,tierId: "tier_5" ,img :"img/hsr_char/真理医生.webp"},
    { name: "阮·梅", en: "Ruan Mei", short: "阮", eshort: "RuanM", type: "char_up" ,tierId: "tier_5" ,img : "img/hsr_char/阮·梅.webp"},
    { name: "银枝", en: "Argenti", short: "银", eshort: "Argen", type: "char_up" ,tierId: "tier_5" ,img : "img/hsr_char/银枝.webp"},
    { name: "霍霍", en: "Huohuo", short: "霍", eshort: "Huo", type: "char_up" ,tierId: "tier_5" ,img : "img/hsr_char/霍霍.webp"},
    { name: "托帕&账账", en: "Topaz & Numby", short: "托", eshort: "Topaz", type: "char_up" ,tierId: "tier_5" ,img : "img/hsr_char/托帕&账账.webp"},
    { name: "镜流", en: "Jingliu", short: "镜", eshort: "Jingl", type: "char_up" ,tierId: "tier_5" ,img : "img/hsr_char/镜流.webp"},
    { name: "丹恒·饮月", en: "Dan Heng · Imbibitor Lunae", short: "龙丹", eshort: "Dimbi", type: "char_up" ,tierId: "tier_5" ,img : "img/hsr_char/丹恒·饮月.webp"},
    { name: "符玄", en: "Fu Xuan", short: "符", eshort: "FXuan", type: ["char_up","char_std_2"] ,tierId: "tier_5" ,img : "img/hsr_char/符玄.webp"},
    { name: "卡芙卡", en: "Kafka", short: "卡", eshort: "Kafka", type: "char_up" ,tierId: "tier_5" ,img : "img/hsr_char/卡芙卡.webp"},
    { name: "刃", en: "Blade", short: "刃", eshort: "Blade", type: ["char_up","char_std_2"] ,tierId: "tier_5" ,img : "img/hsr_char/刃.webp"},
    { name: "罗刹", en: "Luocha", short: "罗", eshort: "Luoch", type: "char_up" ,tierId: "tier_5" ,img : "img/hsr_char/罗刹.webp"},
    { name: "银狼", en: "Silver Wolf", short: "银", eshort: "SWolf", type: "char_up" ,tierId: "tier_5" ,img : "img/hsr_char/银狼.webp"},
    { name: "景元", en: "Jing Yuan", short: "景", eshort: "JingY", type: "char_up" ,tierId: "tier_5" ,img : "img/hsr_char/景元.webp"},
    { name: "希儿", en: "Seele", short: "希", eshort: "SeeLe", type: ["char_up", "char_std_2"] ,tierId: "tier_5" ,img : "img/hsr_char/希儿.webp"},

    //常驻角色
    { name: "瓦尔特·杨", en: "Welt", short: "杨", eshort: "Welt", type: "char_std" ,tierId: "tier_5" ,img : "img/hsr_char/瓦尔特·杨.webp"},
    { name: "布洛妮娅·兰德", en: "Bronya", short: "鸭", eshort: "Brony", type: "char_std" ,tierId: "tier_5" ,img : "img/hsr_char/布洛妮娅·兰德.webp"},
    { name: "姬子", en: "Himeko", short: "姬", eshort: "Himek", type: "char_std" ,tierId: "tier_5" ,img : "img/hsr_char/姬子.webp"},
    { name: "杰帕德·朗道", en: "Gepard", short: "杰", eshort: "Gepar", type: "char_std" ,tierId: "tier_5" ,img : "img/hsr_char/杰帕德·朗道.webp"},
    { name: "克拉拉", en: "Clara", short: "克", eshort: "Clara", type: "char_std" ,tierId: "tier_5" ,img : "img/hsr_char/克拉拉.webp"},
    { name: "白露", en: "Bailu", short: "露", eshort: "BaiLu", type: "char_std" ,tierId: "tier_5" ,img : "img/hsr_char/白露.webp"},
    { name: "彦青", en: "Yanqing", short: "彦", eshort: "YanQi", type: "char_std" ,tierId: "tier_5" ,img : "img/hsr_char/彦青.webp"},
];

const HSR_WEAPON = [
    { name: "一场谎言的终幕", en: "The Finale of a Lie", short: "途专", eshort: "Ashve", type: "wep_up" ,tierId: "tier_5" ,img : "img/hsr_weapon/一场谎言的终幕.webp"},
    { name: "当她决定看见", en: "When She Decides to See", short: "爻专", eshort: "Yao", type: "wep_up" ,tierId: "tier_5" ,img : "img/hsr_weapon/当她决定看见.webp"},
    { name: "花花世界迷人眼", en: "Earthly Escapade", short: "火专", eshort: "Sparx", type: "wep_up" ,tierId: "tier_5" ,img : "img/hsr_weapon/花花世界迷人眼.webp"},
    { name: "勿忘她的火焰", en: "Never Forget Her Flame", short: "花专", eshort: "Dahli", type: "wep_up" ,tierId: "tier_5" ,img : "img/hsr_weapon/勿忘她的火焰.webp"},
    { name: "爱如此刻永恒", en: "This Love,Forever", short: "昔专", eshort: "Cryen", type: "wep_up" ,tierId: "tier_5" ,img : "img/hsr_weapon/爱如此刻永恒.webp"},
    { name: "纵然山河万程", en: "Though Worlds Apart", short: "丹专", eshort: "DPerm", type: "wep_up" ,tierId: "tier_5" ,img : "img/hsr_weapon/纵然山河万程.webp"},
    { name: "致长夜的星光", en: "To Evernight's Stars", short: "夜专", eshort: "ENigh", type: "wep_up" ,tierId: "tier_5" ,img : "img/hsr_weapon/致长夜的星光.webp"},
    { name: "金血铭刻的时代", en: "Epoch Etched in Golden Blood", short: "刻专", eshort: "Ceryd", type: "wep_up" ,tierId: "tier_5" ,img : "img/hsr_weapon/金血铭刻的时代.webp"},
    { name: "海洋为何而歌", en: "Why Does the Ocean Sing", short: "海专", eshort: "Hysil", type: "wep_up" ,tierId: "tier_5" ,img : "img/hsr_weapon/海洋为何而歌.webp"},
    { name: "理想燃烧的地狱", en: "The Hell Where Ideals Burn", short: "A专", eshort: "Arche", type: "wep_up_2" ,tierId: "tier_5" ,img : "img/hsr_weapon/理想燃烧的地狱.webp"},
    { name: "没有回报的加冕", en: "A Thankless Coronation", short: "S专", eshort: "Saber", type: "wep_up_2" ,tierId: "tier_5" ,img : "img/hsr_weapon/没有回报的加冕.webp"},
    { name: "黎明恰如此燃烧", en: "Thus Burns the Dawn", short: "白专", eshort: "Phain", type: "wep_up" ,tierId: "tier_5" ,img : "img/hsr_weapon/黎明恰如此燃烧.webp"},
    { name: "愿虹光永驻天空", en: "Long May Rainbows Adorn the Sky", short: "风专", eshort: "Hyac", type: "wep_up" ,tierId: "tier_5" ,img : "img/hsr_weapon/愿虹光永驻天空.webp"},
    { name: "谎言在风中飘扬", en: "Lies Dance on the Breeze", short: "猫专", eshort: "Ciphe", type: "wep_up" ,tierId: "tier_5" ,img :"img/hsr_weapon/谎言在风中飘扬.webp"},
    { name: "让告别，更美一些", en: "Make Farewells More Beautiful", short: "蝶专", eshort: "Casto", type: "wep_up" ,tierId: "tier_5" ,img : "img/hsr_weapon/让告别，更美一些.webp"},
    { name: "生命当付之一炬", en: "Life Should Be Cast to Flames", short: "那专", eshort: "Anaxa", type: "wep_up" ,tierId: "tier_5" ,img : "img/hsr_weapon/生命当付之一炬.webp"},
    { name: "如果时间是一朵花", en: "If Time Were a Flower", short: "提专", eshort: "Trib", type: "wep_up" ,tierId: "tier_5" ,img : "img/hsr_weapon/如果时间是一朵花.webp"},
    { name: "向着不可追问处", en: "Into the Unreachable Vell", short: "黑专", eshort: "THert", type: "wep_up" ,tierId: "tier_5" ,img : "img/hsr_weapon/向着不可追问处.webp"},
    { name: "将光阴织成黄金", en: "Time Woven Into Gold", short: "雅专", eshort: "Aglae", type: "wep_up" ,tierId: "tier_5" ,img : "img/hsr_weapon/将光阴织成黄金.webp"},
    { name: "长路终有归途", en: "Long Road Leads Home", short: "忘专", eshort: "Fugue", type: "wep_up" ,tierId: "tier_5" ,img :"img/hsr_weapon/长路终有归途.webp"},
    { name: "回到大地的飞行", en: "A Grounded Ascent", short: "日专", eshort: "Sun", type: "wep_up" ,tierId: "tier_5" ,img : "img/hsr_weapon/回到大地的飞行.webp"},
    { name: "忍法帖·缭乱破魔", en: "Ninjutsu Inscription: Dazzling Evilbreaker", short: "乱专", eshort: "Ninju", type: "wep_up" ,tierId: "tier_5" ,img : "img/hsr_weapon/忍法帖·缭乱破魔.webp"},
    { name: "我将，巡征追猎", en: "I Venture Forth to Hunt", short: "飞专", eshort: "Feix", type: "wep_up" ,tierId: "tier_5" ,img : "img/hsr_weapon/我将，巡征追猎.webp"},
    { name: "唯有香如故", en: "Scent Alone Stays True", short: "灵专", eshort: "LingS", type: "wep_up" ,tierId: "tier_5" ,img : "img/hsr_weapon/唯有香如故.webp"},
    { name: "落日时起舞", en: "Dance at Sunset", short: "璃专", eshort: "Yunli", type: "wep_up" ,tierId: "tier_5" ,img : "img/hsr_weapon/落日时起舞.webp"},
    { name: "那无数个春天", en: "Those Many Springs", short: "椒专", eshort: "JiaoQ", type: "wep_up" ,tierId: "tier_5" ,img :"img/hsr_weapon/那无数个春天.webp"},
    { name: "偏偏希望无价", en: "Yet Hope Is Priceless", short: "翡专", eshort: "Jade", type: "wep_up" ,tierId: "tier_5" ,img : "img/hsr_weapon/偏偏希望无价.webp"},
    { name: "梦应归于何处", en: "Whereabouts Should Dreams Rest", short: "萤专", eshort: "Firef", type: "wep_up" ,tierId: "tier_5" ,img : "img/hsr_weapon/梦应归于何处.webp"},
    { name: "驶向第二次生命", en: "Sailing Towards a Second Life", short: "波专", eshort: "Booth", type: "wep_up" ,tierId: "tier_5" ,img : "img/hsr_weapon/驶向第二次生命.webp"},
    { name: "夜色流光溢彩", en: "Flowing Nightlow", short: "鸟专", eshort: "Robin", type: "wep_up" ,tierId: "tier_5" ,img : "img/hsr_weapon/夜色流光溢彩.webp"},
    { name: "行于流逝的岸", en: "Along the Passing Shore", short: "泉专", eshort: "Acher", type: "wep_up" ,tierId: "tier_5" ,img : "img/hsr_weapon/行于流逝的岸.webp"},
    { name: "命运从未公平", en: "Inherently Unjust Destiny", short: "砂专", eshort: "Avent", type: "wep_up" ,tierId: "tier_5" ,img :"img/hsr_weapon/命运从未公平.webp"},
    { name: "重塑时光之忆", en: "Reforged Remembrance", short: "鹅专", eshort: "BSwan", type: "wep_up" ,tierId: "tier_5" ,img :"img/hsr_weapon/重塑时光之忆.webp"},
    { name: "游戏尘寰", en: "Earthly Escapade", short: "花专", eshort: "Spark", type: "wep_up" ,tierId: "tier_5" ,img :"img/hsr_weapon/游戏尘寰.webp"},
    { name: "纯粹思维的洗礼", en: "Baptism of Pure Thought", short: "真专", eshort: "Ratio", type: "wep_up" ,tierId: "tier_5" ,img :"img/hsr_weapon/纯粹思维的洗礼.webp"},
    { name: "镜中故我", en: "Past Self in Mirror", short: "阮专", eshort: "RuanM", type: "wep_up" ,tierId: "tier_5" ,img :"img/hsr_weapon/镜中故我.webp"},
    { name: "惊魂夜", en: "Night of Fright", short: "霍专", eshort: "Huo", type: "wep_up" ,tierId: "tier_5" ,img :"img/hsr_weapon/惊魂夜.webp"},
    { name: "片刻，留在眼底", en: "An Instant Before A Gaze", short: "银专", eshort: "Argen", type: "wep_up" ,tierId: "tier_5" ,img :"img/hsr_weapon/片刻，留在眼底.webp"},
    { name: "此身为剑", en: "I Shall Be My Own Sword", short: "镜专", eshort: "JingL", type: "wep_up" ,tierId: "tier_5" ,img :"img/hsr_weapon/此身为剑.webp"},
    { name: "烦恼着，幸福着", en: "Worrisome, Blissful", short: "托专", eshort: "Topaz", type: "wep_up" ,tierId: "tier_5" ,img :"img/hsr_weapon/烦恼着，幸福着.webp"},
    { name: "她已闭上双眼", en: "She Already Shut Her Eyes", short: "符专", eshort: "FXuan", type: "wep_up" ,tierId: "tier_5" ,img :"img/hsr_weapon/她已闭上双眼.webp"},
    { name: "比阳光更明亮的", en: "Brighter Than the Sun", short: "龙专", eshort: "Dimbi", type: "wep_up" ,tierId: "tier_5" ,img :"img/hsr_weapon/比阳光更明亮的.webp"},
    { name: "只需等待", en: "Patience Is All You Need", short: "卡专", eshort: "Kafka", type: "wep_up" ,tierId: "tier_5" ,img :"img/hsr_weapon/只需等待.webp"},
    { name: "到不了的彼岸", en: "The Unreachable Side", short: "刃专", eshort: "Blade", type: "wep_up" ,tierId: "tier_5" ,img :"img/hsr_weapon/到不了的彼岸.webp"},
    { name: "棺的回响", en: "Echoes of the Coffin", short: "罗专", eshort: "Luoch", type: "wep_up" ,tierId: "tier_5" ,img :"img/hsr_weapon/棺的回响.webp"},
    { name: "雨一直下", en: "Incessant Rain", short: "狼专", eshort: "SWolf", type: "wep_up" ,tierId: "tier_5" ,img :"img/hsr_weapon/雨一直下.webp"},
    { name: "拂晓之前", en: "Before Dawn", short: "景专", eshort: "JingY", type: "wep_up" ,tierId: "tier_5" ,img :"img/hsr_weapon/拂晓之前.webp"},
    { name: "于夜色中", en: "In the Night", short: "希专", eshort: "Seele", type: "wep_up" ,tierId: "tier_5" ,img :"img/hsr_weapon/于夜色中.webp"},



    //常驻光锥
    { name: "银河铁道之夜", en: "Night on the Milky Way", short: "姬专", eshort: "Himek", type: "wep_std" ,tierId: "tier_5" ,img : "img/hsr_weapon/银河铁道之夜.webp"},
    { name: "无可取代的东西", en: "Something Irreplaceable", short: "克专", eshort: "Clara", type: "wep_std" ,tierId: "tier_5" ,img : "img/hsr_weapon/无可取代的东西.webp"},
    { name: "但战斗还未结束", en: "But the Battle Isn't Over", short: "鸭专", eshort: "Brony", type: "wep_std" ,tierId: "tier_5" ,img : "img/hsr_weapon/但战斗还未结束.webp"},
    { name: "以世界之名", en: "In the Name of the World", short: "杨专", eshort: "Welt", type: "wep_std" ,tierId: "tier_5" ,img : "img/hsr_weapon/以世界之名.webp"},
    { name: "制胜的瞬间", en: "Moment of Victory", short: "杰专", eshort: "Gepar", type: "wep_std" ,tierId: "tier_5" ,img : "img/hsr_weapon/制胜的瞬间.webp"},
    { name: "如泥酣眠", en: "Sleep Like the Dead", short: "彦专", eshort: "YanQi", type: "wep_std" ,tierId: "tier_5" ,img : "img/hsr_weapon/如泥酣眠.webp"},
    { name: "时节不居", en: "Time Waits for No One", short: "白专", eshort: "BaiLu", type: "wep_std" ,tierId: "tier_5" ,img : "img/hsr_weapon/时节不居.webp"}
];

//无论上面怎么命名分类，最后这边都会被统一成一个大图鉴让代码能读信息
const HSR_DB = [...HSR_CHAR, ...HSR_WEAPON];

//  全局稀有度 (Tier) 定义
const HSR_GLOBAL_TIERS = [
    { id: 'tier_5', name: '5', color: '#f1c40f' },
    { id: 'tier_4', name: '4', color: '#9b59b6' },
    { id: 'tier_3', name: '3', color: '#3498db' }
];

const HSR_SETUP_RULES = {
    gameName: "崩坏：星穹铁道",enGameName: "Honkai: Star Rail",
    
    //  1. 动态积木池定义 (直接接管 custom_setup 的界面)
    rosterPools: [
        { id: 'char_up', name: '角色活动跃迁', en: "Character Event Warp", type: 'up' },
        { id: 'char_up_2', name: '角色联动跃迁', en: "Character Collaboration Warp", type: 'up' },
        { id: 'wep_up', name: '光锥活动跃迁', en: "Light Cone Event Warp", type: 'up'},
        { id: 'wep_up_2', name: '光锥联动跃迁', en: "Light Cone Collaboration Warp", type: 'up' },
        { 
            id: 'char_std', name: '常驻角色', en: "Regular Character", type: 'std', 
            isStandalone: false,          // 是否开放侧栏独立抽取
            enableCustomUp: false,        //  是否允许模拟器拖拽自选UP
            enableSpecRate: false,        //  是否开启特限出货干预
        },
        { 
            id: 'char_std_2', name: '星缘相邀角色', en: "Celestial Invitation Characters", type: 'std', 
            isStandalone: false,          // 是否开放侧栏独立抽取
            enableCustomUp: false,        //  是否允许模拟器拖拽自选UP
            enableSpecRate: false,        //  是否开启特限出货干预
        },
        { 
            id: 'wep_std', name: '常驻光锥', en: "Regular Light Cone", type: 'std', 
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
            en: "Standard Warp",
            components: ['char_std', 'wep_std'], // 融合上述哪些图鉴
            enableCustomUp: false                 // 混池也可以开启自选 UP
        }
    ],

    // 🌟 3. 限定池歪出流向判定 (key必须和上方的id对应)
    offRate: {
        'char_up': ['char_std', 'char_std_2'], 
        'char_up_2': ['char_std', 'char_std_2'], 
        'wep_up': ['wep_std'],
        'wep_up_2': ['wep_std']
    }
};

// --- 星穹铁道：预设卡池概率规则 ---
const HSR_POOL_RULES = {
    // 角色限定池
    char_up: {
        tiers: [
            { id: 'tier_5', prob: 0.6},
            { id: 'tier_4', prob: 5.1},
            { id: 'tier_3', prob: 94.3}
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
            stdMin: 7,
            stdMax: 7
        },
    },
    // 角色联动池
    char_up_2: {
        tiers: [
            { id: 'tier_5', prob: 0.6},
            { id: 'tier_4', prob: 5.1},
            { id: 'tier_3', prob: 94.3}
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
            stdMin: 7,
            stdMax: 7
        },
    },
    // 光锥限定池
    wep_up: {
        tiers: [
            { id: 'tier_5', prob: 0.8},
            { id: 'tier_4', prob: 6.6},
            { id: 'tier_3', prob: 92.6}
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
            stdMin: 7,
            stdMax: 7
        },
    },
    // 光锥联动池
    wep_up_2: {
       tiers: [
            { id: 'tier_5', prob: 0.8},
            { id: 'tier_4', prob: 6.6},
            { id: 'tier_3', prob: 92.6}
        ],
        // --- 目标金设定 ---
        targetGoldIds: ['tier_5'],
        // --- 副产物保底配置 ---
        minorPities: [
            { pulls: 10,tierId: 'tier_4',resetOnHit: true },
        ],
        // --- 保底与UP概率 ---
        hardPity: 80,
        upRate: 0.5,
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
            stdMin: 7,
            stdMax: 7
        },
    },
     // 常驻池
    mixed_std: {
        tiers: [
            { id: 'tier_5', prob: 0.6},
            { id: 'tier_4', prob: 5.1},
            { id: 'tier_3', prob: 94.3}
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
            stdMin: 14,
            stdMax: 14
        },
    },
};