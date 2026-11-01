// --- 明日方舟：角色数据库 (全称) ---
//供复制：{ name: "", en: "", short: "", eshort: "", type: "up" , star: 6, img: "../img/ARK/.png" },
const ARK_CHAR = [
    //限定寻访·春节
    { name: "望", en: "Wang", short: "望", eshort: "Wang", tag:"up_1" , tierId: "tier_6", img: "../img/ARK/6/望.png" },
    { name: "余", en: "Yu", short: "余", eshort: "Yu", tag:"up_1" , tierId: "tier_6", img: "../img/ARK/6/余.png" },
    { name: "黍", en: "Shu", short: "黍", eshort: "Shu", tag:"up_1" , tierId: "tier_6", img: "../img/ARK/6/黍.png" },
    { name: "重岳", en: "Chongyue", short: "大哥", eshort: "Chong", tag:"up_1" , tierId: "tier_6", img: "../img/ARK/6/重岳.png" },
    { name: "令", en: "Ling", short: "令", eshort: "Ling", tag:"up_1" , tierId: "tier_6", img: "../img/ARK/6/令.png" },
    { name: "夕", en: "Dusk", short: "夕", eshort: "Dusk", tag:"up_1" , tierId: "tier_6", img: "../img/ARK/6/夕.png" },
    { name: "年", en: "Nian", short: "年", eshort: "Nian", tag:"up_1" , tierId: "tier_6", img: "../img/ARK/6/年.png" },

    //限定寻访·庆典
    { name: "凯尔希·思衡托", en: "Kal'tsit Esperanta", short: "异猫", eshort: "KalEs", tag:"up_2" , tierId: "tier_6", img: "../img/ARK/6/凯尔希·思衡托.png" },
    { name: "凛御银灰", en: "SilverAsh the Reignfrost", short: "凛灰", eshort: "Reign", tag:"up_2" , tierId: "tier_6", img: "../img/ARK/6/凛御银灰.png" },
    { name: "新约能天使", en: "Exusiai the New Covenant", short: "新能", eshort: "NewCo", tag:"up_2" , tierId: "tier_6", img: "../img/ARK/6/新约能天使.png" },
    { name: "荒芜拉普兰德", en: "Lappland the Decadenza", short: "荒拉", eshort: "DLapa", tag:"up_2" , tierId: "tier_6", img: "../img/ARK/6/荒芜拉普兰德.png" },
    { name: "维什戴尔", en: "Wiš'adel", short: "维神", eshort: "Wisad", tag:"up_2" , tierId: "tier_6", img: "../img/ARK/6/维什戴尔.png" },
    { name: "塑心", en: "Virtuosa", short: "塑心", eshort: "Virtuosa", tag:"up_2" , tierId: "tier_6", img: "../img/ARK/6/塑心.png" },
    { name: "缪尔赛思", en: "Muelsyse", short: "缪缪", eshort: "Muelsyse", tag:"up_2" , tierId: "tier_6", img: "../img/ARK/6/缪尔赛思.png" },
    { name: "缄默德克萨斯", en: "Texas the Omertosa", short: "缄德", eshort: "Texas", tag:"up_2" , tierId: "tier_6", img: "../img/ARK/6/缄默德克萨斯.png" },
    { name: "耀骑士临光", en: "Nearl the Radiant Knight", short: "耀光", eshort: "Nearl", tag:"up_2" , tierId: "tier_6", img: "../img/ARK/6/耀骑士临光.png" },
    { name: "归溟幽灵鲨", en: "Specter the Unchained", short: "幽鲨", eshort: "Uncha", tag:"up_2" , tierId: "tier_6", img: "../img/ARK/6/归溟幽灵鲨.png" },
    { name: "浊心斯卡蒂", en: "Skadi the Corrupting Heart", short: "浊蒂", eshort: "Skadi", tag:"up_2" , tierId: "tier_6", img: "../img/ARK/6/浊心斯卡蒂.png" },
    { name: "迷迭香", en: "Rosmontis", short: "迷迭香", eshort: "Rosmo", tag:"up_2" , tierId: "tier_6", img: "../img/ARK/6/迷迭香.png" },
    { name: "W", en: "W", short: "W", eshort: "W", tag:"up_2" , tierId: "tier_6", img: "../img/ARK/6/W.png" },

    //限定寻访·夏季
    { name: "予愿安洁莉娜", en: "Angelina the Mellow", short: "予洁", eshort: "Mellow", tag:"up_3" , tierId: "tier_6", img: "../img/ARK/6/予愿安洁莉娜.png" },
    { name: "斩业星熊", en: "Hoshiguma the Breacher", short: "斩熊", eshort: "Hoshi", tag:"up_3" , tierId: "tier_6", img: "../img/ARK/6/斩业星熊.png" },
    { name: "纯烬艾雅法拉", en: "Eyjafjalla the Hvít Aska", short: "奶羊", eshort: "Aska", tag:"up_3" , tierId: "tier_6", img: "../img/ARK/6/纯烬艾雅法拉.png" },
    { name: "佩佩", en: "Pepe", short: "佩佩", eshort: "Pepe", tag:"up_3" , tierId: "tier_6", img: "../img/ARK/6/佩佩.png" },
    { name: "百炼嘉维尔", en: "Gavial the Invincible", short: "百嘉", eshort: "Gavia", tag:"up_3" , tierId: "tier_6", img: "../img/ARK/6/百炼嘉维尔.png" },
    { name: "假日威龙陈", en: "Ch'en the Holungday", short: "陈", eshort: "HChen", tag:"up_3" , tierId: "tier_6", img: "../img/ARK/6/假日威龙陈.png" },

    //联动干员
    { name: "结城理", en: "Makoto Yuki", short: "结城", eshort: "Yuki", tag:"collab" , tierId: "tier_6", img: "../img/ARK/6/结城理.png" },
    { name: "焰狐龙梓兰", en: "Violet Mizutsune Orchid", short: "狐梓", eshort: "Mizut", tag:"collab" , tierId: "tier_6", img: "../img/ARK/6/焰狐龙梓兰.png" },
    { name: "丰川祥子", en: "Togawa Sakiko", short: "祥神", eshort: "Togaw", tag:"collab" , tierId: "tier_6", img: "../img/ARK/6/丰川祥子.png" },
    { name: "马露西尔", en: "Marcille", short: "马路", eshort: "Marci", tag:"collab" , tierId: "tier_6", img: "../img/ARK/6/马露西尔.png" },
    { name: "艾拉", en: "Ela", short: "艾拉", eshort: "Ela", tag:"collab" , tierId: "tier_6", img: "../img/ARK/6/艾拉.png" },
    { name: "麒麟R夜刀", en: "Kirin R Yato", short: "麒夜", eshort: "Kirin", tag:"collab" , tierId: "tier_6", img: "../img/ARK/6/麒麟R夜刀.png" },
    { name: "灰烬", en: "Ash", short: "灰烬", eshort: "Ash", tag:"collab" , tierId: "tier_6", img: "../img/ARK/6/灰烬.png" },

    //常驻
    { name: "珊比", en: "Thumpy", short: "珊比", eshort: "Tumpy", tag:["up_3","std"] , tierId: "tier_6", img: "../img/ARK/6/珊比.png" },
    { name: "谬因", en: "Aphrissa", short: "谬因", eshort: "Aphri", tag:"std" , tierId: "tier_6", img: "../img/ARK/6/谬因.png" },
    { name: "可露希尔", en: "Closure", short: "怒冬", eshort: "Cosur", tag:"std" , tierId: "tier_6", img: "../img/ARK/6/可露希尔.png" },
    { name: "怒潮凛冬", en: "Zima the Raging Tide", short: "怒冬", eshort: "ZRagi", tag:"std" , tierId: "tier_6", img: "../img/ARK/6/怒潮凛冬.png" },
    { name: "贝洛内", en: "Bellone", short: "贝", eshort: "Belon", tag:"std" , tierId: "tier_6", img: "../img/ARK/6/贝洛内.png" },
    { name: "赤刀明霄陈", en: "Ch'en the Dawnstreak", short: "赤陈", eshort: "DChen", tag:["up_1","std"] , tierId: "tier_6", img: "../img/ARK/6/赤刀明霄陈.png" },
    { name: "提提", en: "Titi", short: "提提", eshort: "Titi", tag:"std" , tierId: "tier_6", img: "../img/ARK/6/提提.png" },
    { name: "娜斯提", en: "Nasti", short: "斯提", eshort: "Nasti", tag:"std" , tierId: "tier_6", img: "../img/ARK/6/娜斯提.png" },
    { name: "圣聆初雪", en: "Pramanix the Prerita", short: "圣雪", eshort: "Prama", tag:["up_2","std"] , tierId: "tier_6", img: "../img/ARK/6/圣聆初雪.png" },
    { name: "真言", en: "Mantra", short: "真言", eshort: "Manta", tag:"std" , tierId: "tier_6", img: "../img/ARK/6/真言.png" },
    { name: "遥", en: "Yao", short: "遥", eshort: "Yao", tag:["up_3","std"] , tierId: "tier_6", img: "../img/ARK/6/遥.png" },
    { name: "司霆惊蛰", en: "Leizi the Thunderbringer", short: "司蛰", eshort: "Leizi", tag:"std" , tierId: "tier_6", img: "../img/ARK/6/司霆惊蛰.png" },
    { name: "酒神", en: "Tragodia", short: "酒神", eshort: "Trago", tag:"std" , tierId: "tier_6", img: "../img/ARK/6/酒神.png" },
    { name: "蕾缪安", en: "Lemuen", short: "安姐", eshort: "muen", tag:["up_2","std"] , tierId: "tier_6", img: "../img/ARK/6/蕾缪安.png" },
    { name: "Mons3tr", en: "Mons3tr", short: "M3", eshort: "M3", tag:"std" , tierId: "tier_6", img: "../img/ARK/6/Mons3tr.png" },
    { name: "死芒", en: "Necrass", short: "死芒", eshort: "Ncras", tag:"std" , tierId: "tier_6", img: "../img/ARK/6/死芒.png" },
    { name: "隐德来希", en: "Entelechia", short: "隐德", eshort: "Entel", tag:"std" , tierId: "tier_6", img: "../img/ARK/6/隐德来希.png" },
    { name: "烛煌", en: "Blaze the Igniting Spark", short: "烛煌", eshort: "Blaze", tag:["up_1","std"] , tierId: "tier_6", img: "../img/ARK/6/烛煌.png" },
    { name: "引星棘刺", en: "Thorns the Lodestar", short: "星棘", eshort: "LTorn", tag:"std" , tierId: "tier_6", img: "../img/ARK/6/引星棘刺.png" },
    { name: "忍冬", en: "Vulpisdoglia", short: "忍冬", eshort: "Vulpi", tag:["up_2","std"] , tierId: "tier_6", img: "../img/ARK/6/忍冬.png" },
    { name: "维娜·维多利亚", en: "Vina Victoria", short: "维娜", eshort: "Vina", tag:"std" , tierId: "tier_6", img: "../img/ARK/6/维娜·维多利亚.png" },
    { name: "娜仁图亚", en: "Narantuya", short: "娜仁", eshort: "Naran", tag:["up_3","std"] , tierId: "tier_6", img: "../img/ARK/6/娜仁图亚.png" },
    { name: "妮芙", en: "Nymph", short: "妮芙", eshort: "Nymph", tag:"std" , tierId: "tier_6", img: "../img/ARK/6/妮芙.png" },
    { name: "乌尔比安", en: "Ulpianus", short: "52", eshort: "Ulpia", tag:"std" , tierId: "tier_6", img: "../img/ARK/6/乌尔比安.png" },
    { name: "罗格斯", en: "Logos", short: "罗神", eshort: "Logos", tag:["up_2","std"] , tierId: "tier_6", img: "../img/ARK/6/罗格斯.png" },
    { name: "阿斯卡纶", en: "Ascalon", short: "纶", eshort: "Ascalon", tag:"std" , tierId: "tier_6", img: "../img/ARK/6/阿斯卡纶.png" },
    { name: "左乐", en: "Zuo Le", short: "左乐", eshort: "ZuoLe", tag:["up_1","std"] , tierId: "tier_6", img: "../img/ARK/6/左乐.png" },
    { name: "莱伊", en: "Ray", short: "莱伊", eshort: "Ray", tag:"std" , tierId: "tier_6", img: "../img/ARK/6/莱伊.png" },
    { name: "锏", en: "Degenbrecher", short: "锏", eshort: "Degen", tag:"std" , tierId: "tier_6", img: "../img/ARK/6/锏.png" },
    { name: "薇薇安娜", en: "Viviana", short: "薇", eshort: "Vivi", tag:["up_2","std"] , tierId: "tier_6", img: "../img/ARK/6/薇薇安娜.png" },
    { name: "赫德雷", en: "Hedlerer", short: "赫德雷", eshort: "Hedle", tag:"std" , tierId: "tier_6", img: "../img/ARK/6/赫德雷.png" },
    { name: "涤火杰西卡", en: "Jessica the Liberated", short: "涤杰", eshort: "LibJe", tag:"std" , tierId: "tier_6", img: "../img/ARK/6/涤火杰西卡.png" },
    { name: "琳琅诗怀雅", en: "Swire the Elegant Wit", short: "琳诗", eshort: "Swire", tag:["up_3","std"] , tierId: "tier_6", img: "../img/ARK/6/琳琅诗怀雅.png" },
    { name: "提丰", en: "Typhon", short: "提丰", eshort: "Typhon", tag:"std" , tierId: "tier_6", img: "../img/ARK/6/提丰.png" },
    { name: "圣约送葬人", en: "Executor the Ex Foedere", short: "圣葬", eshort: "ExFoe", tag:"std" , tierId: "tier_6", img: "../img/ARK/6/圣约送葬人.png" },
    { name: "霍尔海雅", en: "Ho'olheyak", short: "海雅", eshort: "Ho'olh", tag:["up_2","std"] , tierId: "tier_6", img: "../img/ARK/6/霍尔海雅.png" },
    { name: "伊内丝", en: "Ines", short: "伊", eshort: "Ines", tag:"std" , tierId: "tier_6", img: "../img/ARK/6/伊内丝.png" },
    { name: "仇白", en: "Qiubai", short: "仇白", eshort: "Qiubai", tag:"std" , tierId: "tier_6", img: "../img/ARK/6/仇白.png" },
    { name: "林", en: "Lin", short: "林", eshort: "Lin", tag:["up_1","std"] , tierId: "tier_6", img: "../img/ARK/6/林.png" },
    { name: "焰影苇草", en: "Reed The Flame Shadow", short: "焰草", eshort: "Reed", tag:"std" , tierId: "tier_6", img: "../img/ARK/6/焰影苇草.png" },
    { name: "斥罪", en: "Penance", short: "斥罪", eshort: "Pene", tag:["up_2","std"] , tierId: "tier_6", img: "../img/ARK/6/斥罪.png" },
    { name: "白铁", en: "Stainless", short: "白铁", eshort: "Stain", tag:"std" , tierId: "tier_6", img: "../img/ARK/6/白铁.png" },
    { name: "玛恩纳", en: "Mlynar", short: "玛", eshort: "Mlyna", tag:"std" , tierId: "tier_6", img: "../img/ARK/6/玛恩纳.png" },
    { name: "鸿雪", en: "", short: "鸿雪", eshort: "", tag:["up_3","std"] , tierId: "tier_6", img: "../img/ARK/6/鸿雪.png" },
    { name: "多萝西", en: "Dorothy", short: "多", eshort: "Doro", tag:"std" , tierId: "tier_6", img: "../img/ARK/6/多萝西.png" },
    { name: "黑键", en: "Ebenholz", short: "黑键", eshort: "Eben", tag:"std" , tierId: "tier_6", img: "../img/ARK/6/黑键.png" },
    { name: "艾丽妮", en: "Irene", short: "妮", eshort: "Irene", tag:["up_2","std"] , tierId: "tier_6", img: "../img/ARK/6/艾丽妮.png" },
    { name: "号角", en: "Horn", short: "号角", eshort: "Horn", tag:"std" , tierId: "tier_6", img: "../img/ARK/6/号角.png" },
    { name: "菲亚梅塔", en: "Fiammetta", short: "肥鸭", eshort: "Fiamm", tag:"std" , tierId: "tier_6", img: "../img/ARK/6/菲亚梅塔.png" },
    { name: "澄闪", en: "Goldenglow", short: "澄闪", eshort: "Golde", tag:"std" , tierId: "tier_6", img: "../img/ARK/6/澄闪.png" },
    { name: "老鲤", en: "Lee", short: "老鲤", eshort: "Lee", tag:["up_1","std"] , tierId: "tier_6", img: "../img/ARK/6/老鲤.png" },

    //甄选
    { name: "灵知", en: "Gnosis", short: "灵知", eshort: "Gnos", tag:"std_2" , tierId: "tier_6", img: "../img/ARK/6/灵知.png" },
    { name: "焰尾", en: "FlameTail", short: "焰尾", eshort: "Flame", tag:["up_2","std_2"] , tierId: "tier_6", img: "../img/ARK/6/焰尾.png" },
    { name: "远牙", en: "FarTooth", short: "远牙", eshort: "FarTo", tag:"std_2" , tierId: "tier_6", img: "../img/ARK/6/远牙.png" },
    { name: "琴柳", en: "Saileach", short: "琴柳", eshort: "Saile", tag:"std_2" , tierId: "tier_6", img: "../img/ARK/6/琴柳.png" },
    { name: "水月", en: "Mizuki", short: "水月", eshort: "Mizuk", tag:["up_3","std_2"] , tierId: "tier_6", img: "../img/ARK/6/水月.png" },
    { name: "帕拉斯", en: "Pallas", short: "帕", eshort: "Palas", tag:"std_2" , tierId: "tier_6", img: "../img/ARK/6/帕拉斯.png" },
    { name: "卡涅利安", en: "Carnelian", short: "卡涅", eshort: "Carnel", tag:"std_2" , tierId: "tier_6", img: "../img/ARK/6/卡涅利安.png" },
    { name: "凯尔希", en: "Kal'tsit", short: "老猫", eshort: "Kal't", tag:["up_2","std_2"] , tierId: "tier_6", img: "../img/ARK/6/凯尔希.png" },
    { name: "异客", en: "Passenger", short: "神", eshort: "Pasge", tag:"std_2" , tierId: "tier_6", img: "../img/ARK/6/异客.png" },
    { name: "嵯峨", en: "Saga", short: "嵯峨", eshort: "Saga", tag:["up_1","std_2"] , tierId: "tier_6", img: "../img/ARK/6/嵯峨.png" },
    { name: "空弦", en: "Archeeto", short: "空弦", eshort: "Arche", tag:"std_2" , tierId: "tier_6", img: "../img/ARK/6/空弦.png" },
    { name: "山", en: "Mountain", short: "山", eshort: "Moun", tag:"std_2" , tierId: "tier_6", img: "../img/ARK/6/山.png" },
    { name: "泥岩", en: "Mudrock", short: "泥岩", eshort: "Mudro", tag:["up_2","std_2"] , tierId: "tier_6", img: "../img/ARK/6/泥岩.png" },
    { name: "瑕光", en: "Blemishine", short: "瑕光", eshort: "Blemi", tag:"std_2" , tierId: "tier_6", img: "../img/ARK/6/瑕光.png" },
    { name: "史尔特尔", en: "Surtr", short: "42", eshort: "Surtr", tag:"std_2" , tierId: "tier_6", img: "../img/ARK/6/史尔特尔.png" },
    { name: "森蚺", en: "Xunectes", short: "森蚺", eshort: "Xunec", tag:"std_2" , tierId: "tier_6", img: "../img/ARK/6/森蚺.png" },
    { name: "棘刺", en: "Thorns", short: "棘刺", eshort: "Thorn", tag:"std_2" , tierId: "tier_6", img: "../img/ARK/6/棘刺.png" },
    { name: "铃兰", en: "Suzuran", short: "铃兰", eshort: "Suzur", tag:"std_2" , tierId: "tier_6", img: "../img/ARK/6/铃兰.png" },
    { name: "早露", en: "Poca", short: "早露", eshort: "Poca", tag:"std_2" , tierId: "tier_6", img: "../img/ARK/6/早露.png" },
    { name: "温蒂", en: "Weedy", short: "温蒂", eshort: "Weedy", tag:["up_2","std_2"] , tierId: "tier_6", img: "../img/ARK/6/温蒂.png" },
    { name: "傀影", en: "Phantom", short: "傀影", eshort: "Phant", tag:"std_2" , tierId: "tier_6", img: "../img/ARK/6/傀影.png" },
    { name: "风笛", en: "Bagpipe", short: "风笛", eshort: "Bagpi", tag:"std_2" , tierId: "tier_6", img: "../img/ARK/6/风笛.png" },
    { name: "刻俄柏", en: "Ceobe", short: "小刻", eshort: "Ceobe", tag:"std_2" , tierId: "tier_6", img: "../img/ARK/6/刻俄柏.png" },
    { name: "阿", en: "Aak", short: "阿", eshort: "Aak", tag:["up_1","std_2"] , tierId: "tier_6", img: "../img/ARK/6/阿.png" },
    { name: "煌", en: "Blaze", short: "煌", eshort: "Blaze", tag:"std_2" , tierId: "tier_6", img: "../img/ARK/6/煌.png" },
    { name: "莫斯提马", en: "Mostima", short: "莫", eshort: "Mosti", tag:"std_2" , tierId: "tier_6", img: "../img/ARK/6/莫斯提马.png" },
    { name: "麦哲伦", en: "Magallan", short: "麦", eshort: "Magal", tag:"std_2" , tierId: "tier_6", img: "../img/ARK/6/麦哲伦.png" },
    { name: "赫拉格", en: "Hellagur", short: "赫", eshort: "Helag", tag:"std_2" , tierId: "tier_6", img: "../img/ARK/6/赫拉格.png" },
    { name: "黑", en: "Schwarz", short: "黑", eshort: "Schwa", tag:"std_2" , tierId: "tier_6", img: "../img/ARK/6/黑.png" },
    { name: "陈", en: "Ch'en", short: "陈", eshort: "Chen", tag:"std_2" , tierId: "tier_6", img: "../img/ARK/6/陈.png" },
    { name: "斯卡蒂", en: "Skadi", short: "蒂", eshort: "Skadi", tag:"std_2" , tierId: "tier_6", img: "../img/ARK/6/斯卡蒂.png" },
    { name: "银灰", en: "SilverAsh", short: "银灰", eshort: "Silv", tag:"std_2" , tierId: "tier_6", img: "../img/ARK/6/银灰.png" },
    { name: "塞雷娅", en: "Saria", short: "塞", eshort: "Saria", tag:"std_2" , tierId: "tier_6", img: "../img/ARK/6/塞雷娅.png" },
    { name: "星熊", en: "Hoshiguma", short: "星熊", eshort: "Hosh", tag:"std_2" , tierId: "tier_6", img: "../img/ARK/6/星熊.png" },
    { name: "夜莺", en: "Nightingale", short: "莺", eshort: "Night", tag:"std_2" , tierId: "tier_6", img: "../img/ARK/6/夜莺.png" },
    { name: "闪灵", en: "Shining", short: "闪", eshort: "Shin", tag:"std_2" , tierId: "tier_6", img: "../img/ARK/6/闪灵.png" },
    { name: "安洁莉娜", en: "Angelina", short: "杰哥", eshort: "Angel", tag:"std_2" , tierId: "tier_6", img: "../img/ARK/6/安洁莉娜.png" },
    { name: "艾雅法拉", en: "Eyjafjalla", short: "羊", eshort: "Eyjaf", tag:"std_2" , tierId: "tier_6", img: "../img/ARK/6/艾雅法拉.png" },
    { name: "伊芙利特", en: "Ifrit", short: "火龙", eshort: "Ifrit", tag:"std_2" , tierId: "tier_6", img: "../img/ARK/6/伊芙利特.png" },
    { name: "推进之王", en: "Siege", short: "推王", eshort: "Siege", tag:"std_2" , tierId: "tier_6", img: "../img/ARK/6/推进之王.png" },
    { name: "能天使", en: "Exusiai", short: "能", eshort: "Exusi", tag:"std_2" , tierId: "tier_6", img: "../img/ARK/6/能天使.png" },

    //赠送
    { name: "机械师", en: "Mechanist", short: "机械", eshort: "Mecha", tag: "gift", tierId: "tier_6", img: "../img/ARK/6/机械师.png" },
    { name: "维伊", en: "Вий", short: "维伊", eshort: "Вий", tag: "gift", tierId: "tier_6", img: "../img/ARK/6/维伊.png" },
    { name: "溯光星源", en: "Astgenne the Lightchaser", short: "溯光星源", eshort: "Astge", tag: "gift", tierId: "tier_6", img: "../img/ARK/6/溯光星源.png" },
    { name: "电弧", en: "Raidian", short: "电弧", eshort: "Raidi", tag: "gift", tierId: "tier_6", img: "../img/ARK/6/电弧.png" },
    { name: "信仰搅拌机", en: "Sankta Miksaparato", short: "菲爷", eshort: "Sankt", tag: "gift", tierId: "tier_6", img: "../img/ARK/6/信仰搅拌机.png" },
    { name: "弑君者", en: "Crownslayer", short: "弑君", eshort: "Crown", tag: "gift", tierId: "tier_6", img: "../img/ARK/6/弑君者.png" },
    { name: "魔王", en: "Civilight Eterna", short: "魔王", eshort: "Civil", tag: "gift", tierId: "tier_6", img: "../img/ARK/6/魔王.png" },
    { name: "止颂", en: "Lessing", short: "止颂", eshort: "Lessi", tag: "gift", tierId: "tier_6", img: "../img/ARK/6/止颂.png" },
    { name: "淬羽赫默", en: "Silence the Paradigmatic", short: "赫默", eshort: "Silen", tag: "gift", tierId: "tier_6", img: "../img/ARK/6/淬羽赫默.png" },
    { name: "伺夜", en: "Vigil", short: "伺夜", eshort: "Vigil", tag: "gift", tierId: "tier_6", img: "../img/ARK/6/伺夜.png" },
    { name: "流明", en: "Lumen", short: "流明", eshort: "Lumen", tag: "gift", tierId: "tier_6", img: "../img/ARK/6/流明.png" },
    { name: "歌蕾蒂娅", en: "Gladiia", short: "歌蕾", eshort: "Gladi", tag: "gift", tierId: "tier_6", img: "../img/ARK/6/歌蕾蒂娅.png" },

    //5星干员
    { name: "埃癸斯", en: "Aegis", short: "埃癸", eshort: "Aegis", tag: "collab", tierId: "tier_5", img: "../img/ARK/5/埃癸斯.png" },
    { name: "岳羽由加莉", en: "Yukari Takeba", short: "由加", eshort: "Yukar", tag: "collab", tierId: "tier_5", img: "../img/ARK/5/岳羽由加莉.png" },
    { name: "嘉辛塔", en: "Jacinta", short: "嘉辛", eshort: "Jacin", tag: "normal", tierId: "tier_5", img: "../img/ARK/5/嘉辛塔.png" },
    { name: "佩德洛", en: "Pedro", short: "佩德", eshort: "Pedro", tag: "normal", tierId: "tier_5", img: "../img/ARK/5/佩德洛.png" },
    { name: "雷狼龙S空爆", en: "Zinogre S Catapult", short: "空爆", eshort: "ZCatp", tag: "collab", tierId: "tier_5", img: "../img/ARK/5/雷狼龙S空爆.png" },
    { name: "裂响", en: "Crackborne", short: "裂响", eshort: "Crack", tag: "normal", tierId: "tier_5", img: "../img/ARK/5/裂响.png" },
    { name: "乌啾", en: "Укусик", short: "乌啾", eshort: "Ukusi", tag: "normal", tierId: "tier_5", img: "../img/ARK/5/乌啾.png" },
    { name: "复奏", en: "Ripresa", short: "复奏", eshort: "Ripre", tag: "normal", tierId: "tier_5", img: "../img/ARK/5/复奏.png" },
    { name: "风絮", en: "Taraxacum", short: "风絮", eshort: "Tarax", tag: "normal", tierId: "tier_5", img: "../img/ARK/5/风絮.png" },
    { name: "撷英调香师", en: "Perfumer the Distilled", short: "调香", eshort: "Perfu", tag: "normal", tierId: "tier_5", img: "../img/ARK/5/撷英调香师.png" },
    { name: "响石", en: "Cairn", short: "响石", eshort: "Cairn", tag: "normal", tierId: "tier_5", img: "../img/ARK/5/响石.png" },
    { name: "雪猎", en: "Snow Hunter", short: "雪猎", eshort: "SnowH", tag: "normal", tierId: "tier_5", img: "../img/ARK/5/雪猎.png" },
    { name: "折桠", en: "Веточки", short: "折桠", eshort: "Vetoc", tag: "normal", tierId: "tier_5", img: "../img/ARK/5/折桠.png" },
    { name: "三角初华", en: "Misumi Uika", short: "初华", eshort: "Misum", tag: "collab", tierId: "tier_5", img: "../img/ARK/5/三角初华.png" },
    { name: "若叶睦", en: "Wakaba Mutsumi", short: "若叶", eshort: "Wakab", tag: "collab", tierId: "tier_5", img: "../img/ARK/5/若叶睦.png" },
    { name: "吉星", en: "Kichisei", short: "吉星", eshort: "Kichi", tag: "normal", tierId: "tier_5", img: "../img/ARK/5/吉星.png" },
    { name: "录武官", en: "Record Keeper", short: "录武", eshort: "Recor", tag: "normal", tierId: "tier_5", img: "../img/ARK/5/录武官.png" },
    { name: "蒂比", en: "Tippi", short: "蒂比", eshort: "Tippi", tag: "normal", tierId: "tier_5", img: "../img/ARK/5/蒂比.png" },
    { name: "聆音", en: "Gracebearer", short: "聆音", eshort: "Grace", tag: "normal", tierId: "tier_5", img: "../img/ARK/5/聆音.png" },
    { name: "阿兰娜", en: "Alanna", short: "阿兰", eshort: "Alann", tag: "normal", tierId: "tier_5", img: "../img/ARK/5/阿兰娜.png" },
    { name: "钼铅", en: "Wulfenite", short: "钼铅", eshort: "Wulfe", tag: "normal", tierId: "tier_5", img: "../img/ARK/5/钼铅.png" },
    { name: "诺威尔", en: "Nowell", short: "诺威", eshort: "Nowel", tag: "normal", tierId: "tier_5", img: "../img/ARK/5/诺威尔.png" },
    { name: "寻澜", en: "Surfer", short: "寻澜", eshort: "Surfe", tag: "normal", tierId: "tier_5", img: "../img/ARK/5/寻澜.png" },
    { name: "特克诺", en: "Tecno", short: "特克", eshort: "Tecno", tag: "normal", tierId: "tier_5", img: "../img/ARK/5/特克诺.png" },
    { name: "裁度", en: "Figurino", short: "裁度", eshort: "Figur", tag: "normal", tierId: "tier_5", img: "../img/ARK/5/裁度.png" },
    { name: "波卜", en: "Bobbing", short: "波卜", eshort: "Bobbi", tag: "normal", tierId: "tier_5", img: "../img/ARK/5/波卜.png" },
    { name: "莱欧斯", en: "Laios", short: "莱欧", eshort: "Laios", tag: "collab", tierId: "tier_5", img: "../img/ARK/5/莱欧斯.png" },
    { name: "齐尔查克", en: "Chilchuck", short: "齐尔", eshort: "Chilc", tag: "collab", tierId: "tier_5", img: "../img/ARK/5/齐尔查克.png" },
    { name: "衡沙", en: "Sand Reckoner", short: "衡沙", eshort: "SandR", tag: "normal", tierId: "tier_5", img: "../img/ARK/5/衡沙.png" },
    { name: "渡桥", en: "Mitm", short: "渡桥", eshort: "Mitmm", tag: "normal", tierId: "tier_5", img: "../img/ARK/5/渡桥.png" },
    { name: "海霓", en: "Lucilla", short: "海霓", eshort: "Lucil", tag: "normal", tierId: "tier_5", img: "../img/ARK/5/海霓.png" },
    { name: "历阵锐枪芬", en: "Fang the Fire-sharpened", short: "锐芬", eshort: "FFang", tag: "normal", tierId: "tier_5", img: "../img/ARK/5/历阵锐枪芬.png" },
    { name: "阿罗玛", en: "Aroma", short: "阿罗", eshort: "Aroma", tag: "normal", tierId: "tier_5", img: "../img/ARK/5/阿罗玛.png" },
    { name: "医生", en: "Doc", short: "医生", eshort: "DocMD", tag: "collab", tierId: "tier_5", img: "../img/ARK/5/医生.png" },
    { name: "双月", en: "Iana", short: "双月", eshort: "Ianaa", tag: "collab", tierId: "tier_5", img: "../img/ARK/5/双月.png" },
    { name: "小满", en: "Grain Buds", short: "小满", eshort: "Grain", tag: "normal", tierId: "tier_5", img: "../img/ARK/5/小满.png" },
    { name: "温米", en: "Warmy", short: "温米", eshort: "Warmy", tag: "normal", tierId: "tier_5", img: "../img/ARK/5/温米.png" },
    { name: "烈夏", en: "Leto", short: "烈夏", eshort: "Letoo", tag: "normal", tierId: "tier_5", img: "../img/ARK/5/烈夏.png" },
    { name: "深律", en: "Bassline", short: "深律", eshort: "Bassl", tag: "normal", tierId: "tier_5", img: "../img/ARK/5/深律.png" },
    { name: "刺玫", en: "Vendela", short: "刺玫", eshort: "Vende", tag: "normal", tierId: "tier_5", img: "../img/ARK/5/刺玫.png" },
    { name: "杏仁", en: "Almond", short: "杏仁", eshort: "Almon", tag: "normal", tierId: "tier_5", img: "../img/ARK/5/杏仁.png" },
    { name: "青枳", en: "Poncirus", short: "青枳", eshort: "Ponci", tag: "normal", tierId: "tier_5", img: "../img/ARK/5/青枳.png" },
    { name: "寒檀", en: "Santalla", short: "寒檀", eshort: "Santa", tag: "normal", tierId: "tier_5", img: "../img/ARK/5/寒檀.png" },
    { name: "空构", en: "Spuria", short: "空构", eshort: "Spuri", tag: "normal", tierId: "tier_5", img: "../img/ARK/5/空构.png" },
    { name: "玫拉", en: "Melanite", short: "玫拉", eshort: "Melan", tag: "normal", tierId: "tier_5", img: "../img/ARK/5/玫拉.png" },
    { name: "洋灰", en: "Cement", short: "洋灰", eshort: "Cemen", tag: "normal", tierId: "tier_5", img: "../img/ARK/5/洋灰.png" },
    { name: "火龙S黑角", en: "Rathalos S Noir Corne", short: "黑角", eshort: "RNoir", tag: "collab", tierId: "tier_5", img: "../img/ARK/5/火龙S黑角.png" },
    { name: "铎铃", en: "Wind Chimes", short: "铎铃", eshort: "WindC", tag: "normal", tierId: "tier_5", img: "../img/ARK/5/铎铃.png" },
    { name: "火哨", en: "Firewhistle", short: "火哨", eshort: "Firew", tag: "normal", tierId: "tier_5", img: "../img/ARK/5/火哨.png" },
    { name: "和弦", en: "Harmonie", short: "和弦", eshort: "Harmo", tag: "normal", tierId: "tier_5", img: "../img/ARK/5/和弦.png" },
    { name: "子月", en: "Lunacub", short: "子月", eshort: "Lunac", tag: "normal", tierId: "tier_5", img: "../img/ARK/5/子月.png" },
    { name: "明椒", en: "Paprika", short: "明椒", eshort: "Papri", tag: "normal", tierId: "tier_5", img: "../img/ARK/5/明椒.png" },
    { name: "但书", en: "Proviso", short: "但书", eshort: "Provi", tag: "normal", tierId: "tier_5", img: "../img/ARK/5/但书.png" },
    { name: "晓歌", en: "Cantabile", short: "晓歌", eshort: "Canta", tag: "normal", tierId: "tier_5", img: "../img/ARK/5/晓歌.png" },

    //开始中坚寻访
    { name: "承曦格雷伊", en: "Greyy the Lightningbearer", short: "格雷", eshort: "Greyy", tag: "normal", tierId: "tier_5", img: "../img/ARK/5/承曦格雷伊.png" },
    { name: "濯尘芙蓉", en: "Hibiscus the Purifier", short: "芙蓉", eshort: "Hibis", tag: "normal", tierId: "tier_5", img: "../img/ARK/5/濯尘芙蓉.png" },
    { name: "掠风", en: "Windflit", short: "掠风", eshort: "Windf", tag: "normal", tierId: "tier_5", img: "../img/ARK/5/掠风.png" },
    { name: "洛洛", en: "Rockrock", short: "洛洛", eshort: "Rockr", tag: "normal", tierId: "tier_5", img: "../img/ARK/5/洛洛.png" },
    { name: "风丸", en: "Kazemaru", short: "风丸", eshort: "Kazem", tag: "normal", tierId: "tier_5", img: "../img/ARK/5/风丸.png" },
    { name: "夏栎", en: "Quercus", short: "夏栎", eshort: "Querc", tag: "normal", tierId: "tier_5", img: "../img/ARK/5/夏栎.png" },
    { name: "夜半", en: "Blacknight", short: "夜半", eshort: "Black", tag: "normal", tierId: "tier_5", img: "../img/ARK/5/夜半.png" },
    { name: "极光", en: "Aurora", short: "极光", eshort: "Auror", tag: "normal", tierId: "tier_5", img: "../img/ARK/5/极光.png" },
    { name: "蚀清", en: "Corroserum", short: "蚀清", eshort: "Corro", tag: "normal", tierId: "tier_5", img: "../img/ARK/5/蚀清.png" },
    { name: "灰毫", en: "Ashlock", short: "灰毫", eshort: "Ashlo", tag: "normal", tierId: "tier_5", img: "../img/ARK/5/灰毫.png" },
    { name: "桑葚", en: "Mulberry", short: "桑葚", eshort: "Mulbe", tag: "normal", tierId: "tier_5", img: "../img/ARK/5/桑葚.png" },
    { name: "羽毛笔", en: "La Pluma", short: "羽毛", eshort: "Pluma", tag: "normal", tierId: "tier_5", img: "../img/ARK/5/羽毛笔.png" },
    { name: "绮良", en: "Kirara", short: "绮良", eshort: "Kirar", tag: "normal", tierId: "tier_5", img: "../img/ARK/5/绮良.png" },
    { name: "赤冬", en: "Akafuyu", short: "赤冬", eshort: "Akafu", tag: "normal", tierId: "tier_5", img: "../img/ARK/5/赤冬.png" },
    { name: "熔泉", en: "Toddifons", short: "熔泉", eshort: "Toddi", tag: "normal", tierId: "tier_5", img: "../img/ARK/5/熔泉.png" },
    { name: "霜华", en: "Frost", short: "霜华", eshort: "Frost", tag: "collab", tierId: "tier_5", img: "../img/ARK/5/霜华.png" },
    { name: "闪击", en: "Blitz", short: "闪击", eshort: "Blitz", tag: "collab", tierId: "tier_5", img: "../img/ARK/5/闪击.png" },
    { name: "乌有", en: "Mr.Nothing", short: "乌有", eshort: "Nothi", tag: "normal", tierId: "tier_5", img: "../img/ARK/5/乌有.png" },
    { name: "爱丽丝", en: "Iris", short: "爱丽", eshort: "Iriss", tag: "normal", tierId: "tier_5", img: "../img/ARK/5/爱丽丝.png" },
    { name: "卡夫卡", en: "Kafka", short: "卡夫", eshort: "Kafka", tag: "normal", tierId: "tier_5", img: "../img/ARK/5/卡夫卡.png" },
    { name: "絮雨", en: "Whisperain", short: "絮雨", eshort: "Whisp", tag: "normal", tierId: "tier_5", img: "../img/ARK/5/絮雨.png" },
    { name: "奥斯塔", en: "Aosta", short: "奥斯", eshort: "Aosta", tag: "normal", tierId: "tier_5", img: "../img/ARK/5/奥斯塔.png" },
    { name: "四月", en: "April", short: "四月", eshort: "April", tag: "normal", tierId: "tier_5", img: "../img/ARK/5/四月.png" },
    { name: "燧石", en: "Flint", short: "燧石", eshort: "Flint", tag: "normal", tierId: "tier_5", img: "../img/ARK/5/燧石.png" },
    { name: "安哲拉", en: "Andreana", short: "安哲", eshort: "Andre", tag: "normal", tierId: "tier_5", img: "../img/ARK/5/安哲拉.png" },
    { name: "贾维", en: "Chiave", short: "贾维", eshort: "Chiav", tag: "normal", tierId: "tier_5", img: "../img/ARK/5/贾维.png" },
    { name: "蜜蜡", en: "Beeswax", short: "蜜蜡", eshort: "Beesw", tag: "normal", tierId: "tier_5", img: "../img/ARK/5/蜜蜡.png" },
    { name: "断崖", en: "Ayerscarpe", short: "断崖", eshort: "Ayers", tag: "normal", tierId: "tier_5", img: "../img/ARK/5/断崖.png" },
    { name: "莱恩哈特", en: "Leonhardt", short: "莱恩", eshort: "Leonh", tag: "normal", tierId: "tier_5", img: "../img/ARK/5/莱恩哈特.png" },
    { name: "月禾", en: "Tsukinogi", short: "月禾", eshort: "Tsuki", tag: "normal", tierId: "tier_5", img: "../img/ARK/5/月禾.png" },
    { name: "石棉", en: "Asbestos", short: "石棉", eshort: "Asbes", tag: "normal", tierId: "tier_5", img: "../img/ARK/5/石棉.png" },
    { name: "极境", en: "Elysium", short: "极境", eshort: "Elysi", tag: "normal", tierId: "tier_5", img: "../img/ARK/5/极境.png" },
    { name: "巫恋", en: "Shamare", short: "巫恋", eshort: "Shama", tag: "normal", tierId: "tier_5", img: "../img/ARK/5/巫恋.png" },
    { name: "慑砂", en: "Sesa", short: "慑砂", eshort: "Sesa", tag: "normal", tierId: "tier_5", img: "../img/ARK/5/慑砂.png" },
    { name: "惊蛰", en: "Leizi", short: "惊蛰", eshort: "Leizi", tag: "normal", tierId: "tier_5", img: "../img/ARK/5/惊蛰.png" },
    { name: "吽", en: "Hung", short: "吽", eshort: "Hung", tag: "normal", tierId: "tier_5", img: "../img/ARK/5/吽.png" },
    { name: "灰喉", en: "GreyThroat", short: "灰喉", eshort: "GreyT", tag: "normal", tierId: "tier_5", img: "../img/ARK/5/灰喉.png" },
    { name: "布洛卡", en: "Broca", short: "布洛", eshort: "Broca", tag: "normal", tierId: "tier_5", img: "../img/ARK/5/布洛卡.png" },
    { name: "苇草", en: "Reed", short: "苇草", eshort: "Reed", tag: "normal", tierId: "tier_5", img: "../img/ARK/5/苇草.png" },
    { name: "槐琥", en: "Waai Fu", short: "槐琥", eshort: "Waai Fu", tag: "normal", tierId: "tier_5", img: "../img/ARK/5/槐琥.png" },
    { name: "送葬人", en: "Executor", short: "送葬", eshort: "Executor", tag: "normal", tierId: "tier_5", img: "../img/ARK/5/送葬人.png" },
    { name: "星极", en: "Astesia", short: "星极", eshort: "Astesia", tag: "normal", tierId: "tier_5", img: "../img/ARK/5/星极.png" },
    { name: "格劳克斯", en: "Glaucus", short: "格劳", eshort: "Glaucus", tag: "normal", tierId: "tier_5", img: "../img/ARK/5/格劳克斯.png" },
    { name: "诗怀雅", en: "Swire", short: "怀雅", eshort: "Swire", tag: "normal", tierId: "tier_5", img: "../img/ARK/5/诗怀雅.png" },
    { name: "夜魔", en: "Nightmare", short: "夜魔", eshort: "Night", tag: "normal", tierId: "tier_5", img: "../img/ARK/5/夜魔.png" },
    { name: "食铁兽", en: "FEater", short: "食铁", eshort: "FEate", tag: "normal", tierId: "tier_5", img: "../img/ARK/5/食铁兽.png" },
    { name: "狮蝎", en: "Manticore", short: "狮蝎", eshort: "Manti", tag: "normal", tierId: "tier_5", img: "../img/ARK/5/狮蝎.png" },
    { name: "空", en: "Sora", short: "空", eshort: "Soras", tag: "normal", tierId: "tier_5", img: "../img/ARK/5/空.png" },
    { name: "真理", en: "Istina", short: "真理", eshort: "Istin", tag: "normal", tierId: "tier_5", img: "../img/ARK/5/真理.png" },
    { name: "初雪", en: "Pramanix", short: "初雪", eshort: "Prama", tag: "normal", tierId: "tier_5", img: "../img/ARK/5/初雪.png" },
    { name: "崖心", en: "Cliffheart", short: "崖心", eshort: "Cliff", tag: "normal", tierId: "tier_5", img: "../img/ARK/5/崖心.png" },
    { name: "守林人", en: "Firewatch", short: "守林", eshort: "Watch", tag: "normal", tierId: "tier_5", img: "../img/ARK/5/守林人.png" },
    { name: "普罗旺斯", en: "Provence", short: "普罗", eshort: "Prove", tag: "normal", tierId: "tier_5", img: "../img/ARK/5/普罗旺斯.png" },
    { name: "可颂", en: "Croissant", short: "可颂", eshort: "Crois", tag: "normal", tierId: "tier_5", img: "../img/ARK/5/可颂.png" },
    { name: "雷蛇", en: "Liskarm", short: "雷蛇", eshort: "Liska", tag: "normal", tierId: "tier_5", img: "../img/ARK/5/雷蛇.png" },
    { name: "红", en: "Projekt Red", short: "红", eshort: "RedPR", tag: "normal", tierId: "tier_5", img: "../img/ARK/5/红.png" },
    { name: "临光", en: "Nearl", short: "临光", eshort: "Nearl", tag: "normal", tierId: "tier_5", img: "../img/ARK/5/临光.png" },
    { name: "华法琳", en: "Warfarin", short: "华法", eshort: "Warfa", tag: "normal", tierId: "tier_5", img: "../img/ARK/5/华法琳.png" },
    { name: "赫默", en: "Silence", short: "赫默", eshort: "Silen", tag: "normal", tierId: "tier_5", img: "../img/ARK/5/赫默.png" },
    { name: "梅尔", en: "Mayer", short: "梅尔", eshort: "Mayer", tag: "normal", tierId: "tier_5", img: "../img/ARK/5/梅尔.png" },
    { name: "天火", en: "Skyfire", short: "天火", eshort: "Skyfi", tag: "normal", tierId: "tier_5", img: "../img/ARK/5/天火.png" },
    { name: "陨星", en: "Meteorite", short: "陨星", eshort: "Meteo", tag: "normal", tierId: "tier_5", img: "../img/ARK/5/陨星.png" },
    { name: "白金", en: "Platinum", short: "白金", eshort: "Plati", tag: "normal", tierId: "tier_5", img: "../img/ARK/5/白金.png" },
    { name: "蓝毒", en: "Blue Poison", short: "蓝毒", eshort: "BlueP", tag: "normal", tierId: "tier_5", img: "../img/ARK/5/蓝毒.png" },
    { name: "幽灵鲨", en: "Specter", short: "幽灵", eshort: "Spect", tag: "normal", tierId: "tier_5", img: "../img/ARK/5/幽灵鲨.png" },
    { name: "拉普兰德", en: "Lappland", short: "拉普", eshort: "Lappl", tag: "normal", tierId: "tier_5", img: "../img/ARK/5/拉普兰德.png" },
    { name: "芙兰卡", en: "Franka", short: "芙兰", eshort: "Frank", tag: "normal", tierId: "tier_5", img: "../img/ARK/5/芙兰卡.png" },
    { name: "德克萨斯", en: "Texas", short: "德克", eshort: "Texas", tag: "normal", tierId: "tier_5", img: "../img/ARK/5/德克萨斯.png" },
    { name: "凛冬", en: "Zima", short: "凛冬", eshort: "Zimas", tag: "normal", tierId: "tier_5", img: "../img/ARK/5/凛冬.png" },
    { name: "白面鸮", en: "Ptilopsis", short: "白面", eshort: "Ptilo", tag: "normal", tierId: "tier_5", img: "../img/ARK/5/白面鸮.png" },

    

    //五星非抽取干员
    { name: "时隙", en: "Timeslot", short: "时隙", eshort: "Times", tag: "gift", tierId: "tier_5", img: "../img/ARK/5/时隙.png" },
    { name: "伯塔尼", en: "Ботани", short: "伯塔", eshort: "Botan", tag: "gift", tierId: "tier_5", img: "../img/ARK/5/伯塔尼.png" },
    { name: "矩", en: "Ju", short: "矩", eshort: "JuJuX", tag: "gift", tierId: "tier_5", img: "../img/ARK/5/矩.png" },
    { name: "摆渡人", en: "Varkáris", short: "摆渡", eshort: "Varka", tag: "gift", tierId: "tier_5", img: "../img/ARK/5/摆渡人.png" },
    { name: "天空盒", en: "Skybox", short: "天空", eshort: "Skybo", tag: "gift", tierId: "tier_5", img: "../img/ARK/5/天空盒.png" },
    { name: "哈蒂娅", en: "Hadiya", short: "哈蒂", eshort: "Hadiy", tag: "gift", tierId: "tier_5", img: "../img/ARK/5/哈蒂娅.png" },
    { name: "八幡海铃", en: "Yahata Umiri", short: "海铃", eshort: "Yahat", tag: "gift", tierId: "tier_5", img: "../img/ARK/5/八幡海铃.png" },
    { name: "祐天寺若麦", en: "Yūtenji Nyamu", short: "若麦", eshort: "Yuten", tag: "gift", tierId: "tier_5", img: "../img/ARK/5/祐天寺若麦.png" },
    { name: "松桐", en: "Matsukiri", short: "松桐", eshort: "Matsu", tag: "gift", tierId: "tier_5", img: "../img/ARK/5/松桐.png" },
    { name: "Miss.Christine", en: "Miss.Christine", short: "猫", eshort: "Chris", tag: "gift", tierId: "tier_5", img: "../img/ARK/5/Miss.Christine.png" },
    { name: "水灯心", en: "Brigid", short: "水灯", eshort: "Brigi", tag: "gift", tierId: "tier_5", img: "../img/ARK/5/水灯心.png" },
    { name: "行箸", en: "Xingzhu", short: "行箸", eshort: "Xingz", tag: "gift", tierId: "tier_5", img: "../img/ARK/5/行箸.png" },
    { name: "瑰盐", en: "Rose Salt", short: "瑰盐", eshort: "RoseS", tag: "gift", tierId: "tier_5", img: "../img/ARK/5/瑰盐.png" },
    { name: "菲莱", en: "Philae", short: "菲莱", eshort: "Phila", tag: "gift", tierId: "tier_5", img: "../img/ARK/5/菲莱.png" },
    { name: "凯瑟琳", en: "Catherine", short: "凯瑟", eshort: "Cathe", tag: "gift", tierId: "tier_5", img: "../img/ARK/5/凯瑟琳.png" },
    { name: "森西", en: "Senshi", short: "森西", eshort: "Sensh", tag: "gift", tierId: "tier_5", img: "../img/ARK/5/森西.png" },
    { name: "莎草", en: "Papyrus", short: "莎草", eshort: "Papyr", tag: "gift", tierId: "tier_5", img: "../img/ARK/5/莎草.png" },
    { name: "锡人", en: "Tin Man", short: "锡人", eshort: "TinMa", tag: "gift", tierId: "tier_5", img: "../img/ARK/5/锡人.png" },
    { name: "深巡", en: "Underflow", short: "深巡", eshort: "Under", tag: "gift", tierId: "tier_5", img: "../img/ARK/5/深巡.png" },
    { name: "奥达", en: "Odda", short: "奥达", eshort: "Oddas", tag: "gift", tierId: "tier_5", img: "../img/ARK/5/奥达.png" },
    { name: "导火索", en: "Fuze", short: "导火", eshort: "Fuzee", tag: "gift", tierId: "tier_5", img: "../img/ARK/5/导火索.png" },
    { name: "红隼", en: "Kestrel", short: "红隼", eshort: "Kestr", tag: "gift", tierId: "tier_5", img: "../img/ARK/5/红隼.png" },
    { name: "万顷", en: "Wanqing", short: "万顷", eshort: "Wanqi", tag: "gift", tierId: "tier_5", img: "../img/ARK/5/万顷.png" },
    { name: "哈洛德", en: "Harold", short: "哈洛", eshort: "Harol", tag: "gift", tierId: "tier_5", img: "../img/ARK/5/哈洛德.png" },
    { name: "折光", en: "Diamante", short: "折光", eshort: "Diama", tag: "gift", tierId: "tier_5", img: "../img/ARK/5/折光.png" },
    { name: "戴菲恩", en: "Delphine", short: "戴菲", eshort: "Delph", tag: "gift", tierId: "tier_5", img: "../img/ARK/5/戴菲恩.png" },
    { name: "冰酿", en: "Coldshot", short: "冰酿", eshort: "Colds", tag: "gift", tierId: "tier_5", img: "../img/ARK/5/冰酿.png" },
    { name: "苍苔", en: "Bryophyta", short: "苍苔", eshort: "Bryop", tag: "gift", tierId: "tier_5", img: "../img/ARK/5/苍苔.png" },
    { name: "凛视", en: "Valarqvin", short: "凛视", eshort: "Valar", tag: "gift", tierId: "tier_5", img: "../img/ARK/5/凛视.png" },
    { name: "隐现", en: "Insider", short: "隐现", eshort: "Insid", tag: "gift", tierId: "tier_5", img: "../img/ARK/5/隐现.png" },
    { name: "摩根", en: "Morgan", short: "摩根", eshort: "Morga", tag: "gift", tierId: "tier_5", img: "../img/ARK/5/摩根.png" },
    { name: "截云", en: "Jieyun", short: "截云", eshort: "Jieyu", tag: "gift", tierId: "tier_5", img: "../img/ARK/5/截云.png" },
    { name: "谜图", en: "Puzzle", short: "谜图", eshort: "Puzzl", tag: "gift", tierId: "tier_5", img: "../img/ARK/5/谜图.png" },
    { name: "雪绒", en: "Qanipalaat", short: "雪绒", eshort: "Qanip", tag: "gift", tierId: "tier_5", img: "../img/ARK/5/雪绒.png" },
    { name: "达格达", en: "Dagda", short: "达格", eshort: "Dagda", tag: "gift", tierId: "tier_5", img: "../img/ARK/5/达格达.png" },
    { name: "海沫", en: "Highmore", short: "海沫", eshort: "Highm", tag: "gift", tierId: "tier_5", img: "../img/ARK/5/海沫.png" },
    { name: "至简", en: "Minimalist", short: "至简", eshort: "Minim", tag: "gift", tierId: "tier_5", img: "../img/ARK/5/至简.png" },
    { name: "星源", en: "Astgenne", short: "星源", eshort: "Astge", tag: "gift", tierId: "tier_5", img: "../img/ARK/5/星源.png" },
    { name: "车尔尼", en: "Czerny", short: "车尔", eshort: "Czern", tag: "gift", tierId: "tier_5", img: "../img/ARK/5/车尔尼.png" },
    { name: "埃拉托", en: "Erato", short: "埃拉", eshort: "Erato", tag: "gift", tierId: "tier_5", img: "../img/ARK/5/埃拉托.png" },
    { name: "海蒂", en: "Heidi", short: "海蒂", eshort: "Heidi", tag: "gift", tierId: "tier_5", img: "../img/ARK/5/海蒂.png" },
    { name: "见行者", en: "Enforcer", short: "见行", eshort: "Enfor", tag: "gift", tierId: "tier_5", img: "../img/ARK/5/见行者.png" },
    { name: "寒芒克洛丝", en: "Kroos the Keen Glint", short: "克洛", eshort: "Kroos", tag: "gift", tierId: "tier_5", img: "../img/ARK/5/寒芒克洛丝.png" },
    { name: "九色鹿", en: "Nine-Colored Deer", short: "九色", eshort: "NineD", tag: "gift", tierId: "tier_5", img: "../img/ARK/5/九色鹿.png" },
    { name: "暮落", en: "Shalem", short: "暮落", eshort: "Shale", tag: "gift", tierId: "tier_5", img: "../img/ARK/5/暮落.png" },
    { name: "耶拉", en: "Kjera", short: "耶拉", eshort: "Kjera", tag: "gift", tierId: "tier_5", img: "../img/ARK/5/耶拉.png" },
    { name: "野鬃", en: "Wild Mane", short: "野鬃", eshort: "WildM", tag: "gift", tierId: "tier_5", img: "../img/ARK/5/野鬃.png" },
    { name: "蜜莓", en: "Honeyberry", short: "蜜莓", eshort: "Honey", tag: "gift", tierId: "tier_5", img: "../img/ARK/5/蜜莓.png" },
    { name: "龙舌兰", en: "Tequila", short: "龙舌", eshort: "Tequi", tag: "gift", tierId: "tier_5", img: "../img/ARK/5/龙舌兰.png" },
    { name: "贝娜", en: "Bena", short: "贝娜", eshort: "Benas", tag: "gift", tierId: "tier_5", img: "../img/ARK/5/贝娜.png" },
    { name: "暴雨", en: "Heavyrain", short: "暴雨", eshort: "Heavy", tag: "gift", tierId: "tier_5", img: "../img/ARK/5/暴雨.png" },
    { name: "战车", en: "Tachanka", short: "战车", eshort: "Tacha", tag: "gift", tierId: "tier_5", img: "../img/ARK/5/战车.png" },
    { name: "炎狱炎熔", en: "Purgatory", short: "炎熔", eshort: "Purga", tag: "gift", tierId: "tier_5", img: "../img/ARK/5/炎狱炎熔.png" },
    { name: "图耶", en: "Tuye", short: "图耶", eshort: "Tuyee", tag: "gift", tierId: "tier_5", img: "../img/ARK/5/图耶.png" },
    { name: "罗宾", en: "Robin", short: "罗宾", eshort: "Robin", tag: "gift", tierId: "tier_5", img: "../img/ARK/5/罗宾.png" },
    { name: "鞭刃", en: "Whislash", short: "鞭刃", eshort: "Whisl", tag: "gift", tierId: "tier_5", img: "../img/ARK/5/鞭刃.png" },
    { name: "薄绿", en: "Mint", short: "薄绿", eshort: "Mints", tag: "gift", tierId: "tier_5", img: "../img/ARK/5/薄绿.png" },
    { name: "特米米", en: "Tomimi", short: "特米", eshort: "Tomim", tag: "gift", tierId: "tier_5", img: "../img/ARK/5/特米米.png" },
    { name: "稀音", en: "Scene", short: "稀音", eshort: "Scene", tag: "gift", tierId: "tier_5", img: "../img/ARK/5/稀音.png" },
    { name: "亚叶", en: "Folinic", short: "亚叶", eshort: "Folin", tag: "gift", tierId: "tier_5", img: "../img/ARK/5/亚叶.png" },
    { name: "苦艾", en: "Absinthe", short: "苦艾", eshort: "Absin", tag: "gift", tierId: "tier_5", img: "../img/ARK/5/苦艾.png" },
    { name: "铸铁", en: "Sideroca", short: "铸铁", eshort: "Sider", tag: "gift", tierId: "tier_5", img: "../img/ARK/5/铸铁.png" },
    { name: "柏喙", en: "Bibeak", short: "柏喙", eshort: "Bibeak", tag: "gift", tierId: "tier_5", img: "../img/ARK/5/柏喙.png" },
    { name: "雪雉", en: "Snowsant", short: "雪雉", eshort: "Snows", tag: "gift", tierId: "tier_5", img: "../img/ARK/5/雪雉.png" },
    { name: "拜松", en: "Bison", short: "拜松", eshort: "Bison", tag: "gift", tierId: "tier_5", img: "../img/ARK/5/拜松.png" },
    { name: "微风", en: "Breeze", short: "微风", eshort: "Breez", tag: "gift", tierId: "tier_5", img: "../img/ARK/5/微风.png" },
    { name: "炎客", en: "Flamebringer", short: "炎客", eshort: "Flame", tag: "gift", tierId: "tier_5", img: "../img/ARK/5/炎客.png" },
    { name: "锡兰", en: "Ceylon", short: "锡兰", eshort: "Ceylo", tag: "gift", tierId: "tier_5", img: "../img/ARK/5/锡兰.png" },
    { name: "格拉尼", en: "Grani", short: "格拉", eshort: "Grani", tag: "gift", tierId: "tier_5", img: "../img/ARK/5/格拉尼.png" },
    { name: "暴行", en: "Savage", short: "暴行", eshort: "Savag", tag: "gift", tierId: "tier_5", img: "../img/ARK/5/暴行.png" },
    { name: "火神", en: "Vulcan", short: "火神", eshort: "Vulca", tag: "gift", tierId: "tier_5", img: "../img/ARK/5/火神.png" },
    { name: "因陀罗", en: "Indra", short: "陀罗", eshort: "Indra", tag: "gift", tierId: "tier_5", img: "../img/ARK/5/因陀罗.png" },
    { name: "阿米娅(医疗)", en: "Amiya(Medic)", short: "奶兔", eshort: "Amiya", tag: "gift", tierId: "tier_5", img: "../img/ARK/5/阿米娅(医疗).png" },
    { name: "阿米娅(近卫)", en: "Amiya(Guard)", short: "剑兔", eshort: "Amiya", tag: "gift", tierId: "tier_5", img: "../img/ARK/5/阿米娅(近卫).png" },
    { name: "阿米娅", en: "Amiya", short: "兔子", eshort: "Amiya", tag: "gift", tierId: "tier_5", img: "../img/ARK/5/阿米娅.png" },


    //4
    { name: "冬时", en: "Снегyрочка", short: "冬时", eshort: "Снегy", tag: "normal", tierId: "tier_4", img: "../img/ARK/4/冬时.png" },
    { name: "骋风", en: "Windscoot", short: "骋风", eshort: "Winds", tag: "normal", tierId: "tier_4", img: "../img/ARK/4/骋风.png" },
    { name: "露托", en: "Lutonada", short: "露托", eshort: "Luton", tag: "normal", tierId: "tier_4", img: "../img/ARK/4/露托.png" },
    { name: "维荻", en: "Verdant", short: "维荻", eshort: "Verda", tag: "normal", tierId: "tier_4", img: "../img/ARK/4/维荻.png" },
    { name: "休谟斯", en: "Humus", short: "休谟", eshort: "Humus", tag: "normal", tierId: "tier_4", img: "../img/ARK/4/休谟斯.png" },
    { name: "铅踝", en: "Totter", short: "铅踝", eshort: "Totte", tag: "normal", tierId: "tier_4", img: "../img/ARK/4/铅踝.png" },
    { name: "褐果", en: "Chestnut", short: "褐果", eshort: "Chest", tag: "normal", tierId: "tier_4", img: "../img/ARK/4/褐果.png" },
    { name: "布丁", en: "Pudding", short: "布丁", eshort: "Pudin", tag: "normal", tierId: "tier_4", img: "../img/ARK/4/布丁.png" },
    { name: "罗比菈塔", en: "Roberta", short: "罗比", eshort: "Roberta", tag: "normal", tierId: "tier_4", img: "../img/ARK/4/罗比菈塔.png" },
    { name: "深靛", en: "Indigo", short: "深靛", eshort: "Indig", tag: "normal", tierId: "tier_4", img: "../img/ARK/4/深靛.png" },
    { name: "豆苗", en: "Beanstalk", short: "豆苗", eshort: "Beans", tag: "normal", tierId: "tier_4", img: "../img/ARK/4/豆苗.png" },
    { name: "松果", en: "Pinecone", short: "松果", eshort: "Pinec", tag: "normal", tierId: "tier_4", img: "../img/ARK/4/松果.png" },
    { name: "杰克", en: "Jackie", short: "杰克", eshort: "Jack", tag: "normal", tierId: "tier_4", img: "../img/ARK/4/杰克.png" },
    { name: "泡泡", en: "Bubble", short: "泡泡", eshort: "Buble", tag: "normal", tierId: "tier_4", img: "../img/ARK/4/泡泡.png" },
    { name: "芳汀", en: "Arene", short: "芳汀", eshort: "Arene", tag: "normal", tierId: "tier_4", img: "../img/ARK/4/芳汀.png" },
    { name: "酸糖", en: "Aciddrop", short: "酸糖", eshort: "Acidd", tag: "normal", tierId: "tier_4", img: "../img/ARK/4/酸糖.png" },
    { name: "孑", en: "Jaye", short: "孑", eshort: "Jaye", tag: "normal", tierId: "tier_4", img: "../img/ARK/4/孑.png" },
    { name: "卡达", en: "Click", short: "卡达", eshort: "Click", tag: "normal", tierId: "tier_4", img: "../img/ARK/4/卡达.png" },
    { name: "波登可", en: "Podenco", short: "波登", eshort: "Poden", tag: "normal", tierId: "tier_4", img: "../img/ARK/4/波登可.png" },
    { name: "刻刀", en: "Cutter", short: "刻刀", eshort: "Cuter", tag: "normal", tierId: "tier_4", img: "../img/ARK/4/刻刀.png" },
    { name: "宴", en: "Utage", short: "宴", eshort: "Utage", tag: "normal", tierId: "tier_4", img: "../img/ARK/4/宴.png" },
    { name: "安比尔", en: "Ambriel", short: "安比", eshort: "Ambri", tag: "normal", tierId: "tier_4", img: "../img/ARK/4/安比尔.png" },
    { name: "梅", en: "May", short: "梅", eshort: "Mayss", tag: "normal", tierId: "tier_4", img: "../img/ARK/4/梅.png" },
    { name: "红云", en: "Vermeil", short: "红云", eshort: "Verme", tag: "normal", tierId: "tier_4", img: "../img/ARK/4/红云.png" },
    { name: "桃金娘", en: "Myrtle", short: "桃金", eshort: "Myrtl", tag: "normal", tierId: "tier_4", img: "../img/ARK/4/桃金娘.png" },
    { name: "苏苏洛", en: "Sussurro", short: "苏洛", eshort: "surro", tag: "normal", tierId: "tier_4", img: "../img/ARK/4/苏苏洛.png" },
    { name: "格雷伊", en: "Greyy", short: "格雷", eshort: "Greyy", tag: "normal", tierId: "tier_4", img: "../img/ARK/4/格雷伊.png" },
    { name: "猎蜂", en: "Beehunter", short: "猎蜂", eshort: "Beehu", tag: "normal", tierId: "tier_4", img: "../img/ARK/4/猎蜂.png" },
    { name: "阿消", en: "Shaw", short: "阿消", eshort: "Shaws", tag: "normal", tierId: "tier_4", img: "../img/ARK/4/阿消.png" },
    { name: "地灵", en: "Earthspirit", short: "地灵", eshort: "Earth", tag: "normal", tierId: "tier_4", img: "../img/ARK/4/地灵.png" },
    { name: "深海色", en: "Deepcolor", short: "深海", eshort: "Deepc", tag: "normal", tierId: "tier_4", img: "../img/ARK/4/深海色.png" },
    { name: "古米", en: "Gummy", short: "古米", eshort: "Gummy", tag: "normal", tierId: "tier_4", img: "../img/ARK/4/古米.png" },
    { name: "蛇屠箱", en: "Cuora", short: "蛇屠", eshort: "Cuora", tag: "normal", tierId: "tier_4", img: "../img/ARK/4/蛇屠箱.png" },
    { name: "角峰", en: "Matterhorn", short: "角峰", eshort: "Matte", tag: "normal", tierId: "tier_4", img: "../img/ARK/4/角峰.png" },
    { name: "调香师", en: "Perfumer", short: "调香", eshort: "Perfu", tag: "normal", tierId: "tier_4", img: "../img/ARK/4/调香师.png" },
    { name: "嘉维尔", en: "Gavial", short: "嘉维", eshort: "Gavia", tag: "normal", tierId: "tier_4", img: "../img/ARK/4/嘉维尔.png" },
    { name: "末药", en: "Myrrh", short: "末药", eshort: "Myrrh", tag: "normal", tierId: "tier_4", img: "../img/ARK/4/末药.png" },
    { name: "暗索", en: "Rope", short: "暗索", eshort: "Ropes", tag: "normal", tierId: "tier_4", img: "../img/ARK/4/暗索.png" },
    { name: "砾", en: "Gravel", short: "砾", eshort: "Grave", tag: "normal", tierId: "tier_4", img: "../img/ARK/4/砾.png" },
    { name: "慕斯", en: "Mousse", short: "慕斯", eshort: "Mouss", tag: "normal", tierId: "tier_4", img: "../img/ARK/4/慕斯.png" },
    { name: "霜叶", en: "Frostleaf", short: "霜叶", eshort: "Frost", tag: "normal", tierId: "tier_4", img: "../img/ARK/4/霜叶.png" },
    { name: "缠丸", en: "Matoimaru", short: "缠丸", eshort: "Matoi", tag: "normal", tierId: "tier_4", img: "../img/ARK/4/缠丸.png" },
    { name: "杜宾", en: "Dobermann", short: "杜宾", eshort: "Dober", tag: "normal", tierId: "tier_4", img: "../img/ARK/4/杜宾.png" },
    { name: "红豆", en: "Vigna", short: "红豆", eshort: "Vigna", tag: "normal", tierId: "tier_4", img: "../img/ARK/4/红豆.png" },
    { name: "清道夫", en: "Scavenger", short: "清道", eshort: "Scave", tag: "normal", tierId: "tier_4", img: "../img/ARK/4/清道夫.png" },
    { name: "白雪", en: "Shirayuki", short: "白雪", eshort: "Shira", tag: "normal", tierId: "tier_4", img: "../img/ARK/4/白雪.png" },
    { name: "流星", en: "Meteor", short: "流星", eshort: "Meteo", tag: "normal", tierId: "tier_4", img: "../img/ARK/4/流星.png" },
    { name: "杰西卡", en: "Jessica", short: "杰西", eshort: "Jessi", tag: "normal", tierId: "tier_4", img: "../img/ARK/4/杰西卡.png" },
    { name: "远山", en: "Gitano", short: "远山", eshort: "Gitan", tag: "normal", tierId: "tier_4", img: "../img/ARK/4/远山.png" },
    { name: "夜烟", en: "Haze", short: "夜烟", eshort: "Hazee", tag: "normal", tierId: "tier_4", img: "../img/ARK/4/夜烟.png" },

    { name: "协律", en: "Akkord", short: "协律", eshort: "Akkor", tag: "gift", tierId: "tier_4", img: "../img/ARK/4/协律.png" },
    { name: "云迹", en: "Contrail", short: "云迹", eshort: "Contr", tag: "gift", tierId: "tier_4", img: "../img/ARK/4/云迹.png" },
    { name: "跃跃", en: "Caper", short: "跃跃", eshort: "Caper", tag: "gift", tierId: "tier_4", img: "../img/ARK/4/跃跃.png" },
    { name: "石英", en: "Quartz", short: "石英", eshort: "Quart", tag: "gift", tierId: "tier_4", img: "../img/ARK/4/石英.png" },
    { name: "罗小黑", en: "Luo Xiaohei", short: "小黑", eshort: "Xiaoh", tag: "gift", tierId: "tier_4", img: "../img/ARK/4/罗小黑.png" },
    { name: "断罪者", en: "Conviction", short: "断罪", eshort: "Convi", tag: "gift", tierId: "tier_4", img: "../img/ARK/4/断罪者.png" },
    { name: "清流", en: "Purestream", short: "清流", eshort: "Pures", tag: "gift", tierId: "tier_4", img: "../img/ARK/4/清流.png" },
    { name: "伊桑", en: "Ethan", short: "伊桑", eshort: "Ethan", tag: "gift", tierId: "tier_4", img: "../img/ARK/4/伊桑.png" },
    { name: "坚雷", en: "Dur-nar", short: "坚雷", eshort: "Dunar", tag: "gift", tierId: "tier_4", img: "../img/ARK/4/坚雷.png" },
    { name: "艾丝黛尔", en: "Estelle", short: "艾丝", eshort: "Estel", tag: "gift", tierId: "tier_4", img: "../img/ARK/4/艾丝黛尔.png" },
    { name: "讯使", en: "Courier", short: "讯使", eshort: "Couri", tag: "gift", tierId: "tier_4", img: "../img/ARK/4/讯使.png" },

    //3星
    { name: "斑点", en: "Spot", short: "斑点", eshort: "Spots", tag: "normal", tierId: "tier_3", img: "../img/ARK/3/斑点.png" },
    { name: "泡普卡", en: "Popukar", short: "泡普", eshort: "Popuk", tag: "normal", tierId: "tier_3", img: "../img/ARK/3/泡普卡.png" },
    { name: "月见夜", en: "Midnight", short: "月见", eshort: "Midni", tag: "normal", tierId: "tier_3", img: "../img/ARK/3/月见夜.png" },
    { name: "空爆", en: "Catapult", short: "空爆", eshort: "Catap", tag: "normal", tierId: "tier_3", img: "../img/ARK/3/空爆.png" },
    { name: "梓兰", en: "Orchid", short: "梓兰", eshort: "Orchi", tag: "normal", tierId: "tier_3", img: "../img/ARK/3/梓兰.png" },
    { name: "史都华德", en: "Steward", short: "史都", eshort: "Stewa", tag: "normal", tierId: "tier_3", img: "../img/ARK/3/史都华德.png" },
    { name: "安赛尔", en: "Ansel", short: "安赛", eshort: "Ansel", tag: "normal", tierId: "tier_3", img: "../img/ARK/3/安赛尔.png" },
    { name: "芙蓉", en: "Hibiscus", short: "芙蓉", eshort: "Hibis", tag: "normal", tierId: "tier_3", img: "../img/ARK/3/芙蓉.png" },
    { name: "炎熔", en: "Lava", short: "炎熔", eshort: "Lavas", tag: "normal", tierId: "tier_3", img: "../img/ARK/3/炎熔.png" },
    { name: "安德切尔", en: "Adnachiel", short: "安德", eshort: "Adnac", tag: "normal", tierId: "tier_3", img: "../img/ARK/3/安德切尔.png" },
    { name: "克洛丝", en: "Kroos", short: "克洛", eshort: "Kroos", tag: "normal", tierId: "tier_3", img: "../img/ARK/3/克洛丝.png" },
    { name: "米格鲁", en: "Beagle", short: "米格", eshort: "Beagl", tag: "normal", tierId: "tier_3", img: "../img/ARK/3/米格鲁.png" },
    { name: "卡缇", en: "Cardigan", short: "卡缇", eshort: "Cardi", tag: "normal", tierId: "tier_3", img: "../img/ARK/3/卡缇.png" },
    { name: "玫兰莎", en: "Melantha", short: "玫兰", eshort: "Melan", tag: "normal", tierId: "tier_3", img: "../img/ARK/3/玫兰莎.png" },
    { name: "翎羽", en: "Plume", short: "翎羽", eshort: "Plume", tag: "normal", tierId: "tier_3", img: "../img/ARK/3/翎羽.png" },
    { name: "香草", en: "Vanilla", short: "香草", eshort: "Vanil", tag: "normal", tierId: "tier_3", img: "../img/ARK/3/香草.png" },
    { name: "芬", en: "Fang", short: "芬", eshort: "Fangs", tag: "normal", tierId: "tier_3", img: "../img/ARK/3/芬.png" },

    { name: "夜刀", en: "Yato", short: "夜刀", eshort: "Yatos", tag: "gift", tierId: "tier_2", img: "../img/ARK/2/夜刀.png" },
    { name: "黑角", en: "Noir Corne", short: "黑角", eshort: "NoirC", tag: "gift", tierId: "tier_2", img: "../img/ARK/2/黑角.png" },
    { name: "巡林者", en: "Rangers", short: "巡林", eshort: "Range", tag: "gift", tierId: "tier_2", img: "../img/ARK/2/巡林者.png" },
    { name: "杜林", en: "Durin", short: "杜林", eshort: "Durin", tag: "gift", tierId: "tier_2", img: "../img/ARK/2/杜林.png" },
    { name: "12F", en: "12F", short: "12", eshort: "12FFF", tag: "gift", tierId: "tier_2", img: "../img/ARK/2/12F.png" },


    { name: "虎狼丸", en: "Koromaru", short: "狼", eshort: "Korom", tag: "gift", tierId: "tier_1", img: "../img/ARK/1/虎狼丸.png" },
    { name: "罗德岛隐秘队", en: "Rhodes Island Recon", short: "鸡", eshort: "猎猫", tag: "gift", tierId: "tier_1", img: "../img/ARK/1/罗德岛隐秘队.png" },
    { name: "GALLUS²", en: "GALLUS²", short: "鸡", eshort: "GALLUS²", tag: "gift", tierId: "tier_1", img: "../img/ARK/1/GALLUS².png" },
    { name: "CONFESS-47", en: "CONFESS-47", short: "CONFE", eshort: "CONFE", tag: "gift", tierId: "tier_1", img: "../img/ARK/1/CONFESS-47.png" },
    { name: "U-Official", en: "U-Official", short: "u酱", eshort: "U-Offi", tag: "gift", tierId: "tier_1", img: "../img/ARK/1/U-Official.png" },
    { name: "泰拉大陆调查团", en: "Terra Research Commission", short: "调查", eshort: "Terra", tag: "gift", tierId: "tier_1", img: "../img/ARK/1/泰拉大陆调查团.png" },
    { name: "Lancet-2", en: "Lancet-2", short: "医疗", eshort: "Lance", tag: "gift", tierId: "tier_1", img: "../img/ARK/1/Lancet-2.png" },
    { name: "Castle-3", en: "Castle-3", short: "近卫", eshort: "Castl", tag: "gift", tierId: "tier_1", img: "../img/ARK/1/Castle-3.png" },
    { name: "THRM-EX", en: "THRM-EX", short: "自爆", eshort: "THRMx", tag: "gift", tierId: "tier_1", img: "../img/ARK/1/THRM-EX.png" },
    { name: "正义骑士号", en: "Justice Knight", short: "正义", eshort: "Justi", tag: "gift", tierId: "tier_1", img: "../img/ARK/1/正义骑士号.png" },
    { name: "Friston-3", en: "Friston-3", short: "菲利", eshort: "Frist", tag: "gift", tierId: "tier_1", img: "../img/ARK/1/Friston-3.png" },
    { name: "PhonoR-0", en: "PhonoR-0", short: "留声", eshort: "Phono", tag: "gift", tierId: "tier_1", img: "../img/ARK/1/PhonoR-0.png" },
]

//无论上面怎么命名分类，最后这边都会被统一成一个大图鉴让代码能读信息
const ARK_DB = [...ARK_CHAR];

//  全局稀有度 (Tier) 定义
const ARK_GLOBAL_TIERS = [
    { id: 'tier_6', name: '6星', en:"6 Stars", color: '#f10f0f' },
    { id: 'tier_5', name: '5星', en:"5 Stars", color: '#f1c40f' },
    { id: 'tier_4', name: '4星', en:"4 Stars", color: '#9b59b6' },
    { id: 'tier_3', name: '3星', en:"3 Stars", color: '#3498db' },
    { id: 'tier_2', name: '2星', en:"2 Stars", color: '#34db7f' },
    { id: 'tier_1', name: '1星', en:"1 Star ", color: '#ffffff' },
];

const ARK_SETUP_RULES = {
    gameName: "明日方舟",enGameName: "Arknights",

    categories: [{ id: 'char', name: '干员',en: 'Character', icon: '👤' },],

    tagDefinitions: {
        up_1: { name: "春节", en: "Festival", enShort: "Festi", color: "#f1c40f", textColor: "#000" },
        up_2: { name: "庆典",en: "Celebration",enShort: "Celeb", color: "#f1c40f", textColor: "#000" },
        up_3: { name: "夏季", en: "Carnival", enShort: "Carni", color: "#f1c40f", textColor: "#000" },
        collab: { name: "联动", en: "Collaboration", enShort: "Collab", color: "#f1c40f", textColor: "#000" },
        std: { name: "常驻", en: "Standard", enShort: "Std", color: "#3498db", textColor: "#fff" },
        std_2: { name: "甄选", en: "Kernel", enShort: "Kerne", color: "#3498db", textColor: "#fff" },
        normal: { name: "副产物", en: "Side Product", enShort: "Side", color: "#95a5a6", textColor: "#000" },
        gift: { name: "赠送", en: "Gift", enShort: "Gift", color: "#2ecc71", textColor: "#000" },
    },

    overflowRules: {char: 5},
};

// --- 明日方舟：预设卡池概率规则 ---
const ARK_POOL_RULES = {
    // 限定寻访·春节
    up_1: {
        info: { name: "限定寻访·春节", en: "Limited Headhunting", icon: "✨", badgeColor: "#f10f0f" },

        assembly: {
            tierRules: {
                tier_6: {
                    mode: 'up_split',
                    upCats: ['char'],
                    offrateCats: ['char'],
                    upTags: ['up_1',],
                    offrateTags: ['up_1','std']
                },
                tier_5: {
                    mode: 'flat',
                    flatCats: ['char'],
                    tags: ['normal']
                },
                tier_4: {
                    mode: 'flat',
                    flatCats: ['char'],
                    tags: ['normal']
                },
                tier_3: {
                    mode: 'flat',
                    flatCats: ['char'],
                    tags: ['normal']
                },
            }
        },

        tiers: [
            { id: 'tier_6', prob: 2.0, isGold: true },
            { id: 'tier_5', prob: 8.0 },
            { id: 'tier_4', prob: 50.0 },
            { id: 'tier_3', prob: 40.0 }
        ],

        pities: [
            {
                tierId: 'tier_6',
                pulls: 99,
                resetOnHit: true,
                enableUp: true,
                upRate: 0.7, // 双UP占70%或单UP占50%
                useGuarantee: false,
                softEnabled: true,
                softRules: [
                    { start: 51, end: 98, inc: 0.02 }
                ]
            },
        ],

        sparkRules: [
            {
                limit: 300,
                type: "once",
                targetType: "up_index",
                upIndex: 1,                // 锁定列表里的第 1 个 UP 目标
                cancelOnHit: false,         // 前 120 抽抽到了就自动失效关闭
                noReset: true             // 正常算作吃保底，重置垫抽进度
            },
        ],

        // 往期限定5倍出率干预
        specRate: {
            enabled: true,
            rules: [
                {
                    tierId: 'tier_6',
                    type: 'multiplier',
                    value: 5,
                    targetCats: ['char'],
                    targetTags: ['up_1']
                }
            ]
        },

        preSelect: {
            enabled: true,
            tiers: {
                tier_6: { upMin: 2, upMax: 2, stdMin: 0, stdMax: 999 },
                tier_5: { stdMin: 0, stdMax: 999 },
                tier_4: { stdMin: 0, stdMax: 999 },
                tier_3: { stdMin: 0, stdMax: 999 }
            },
            spec: { min: 0, max: 3 }
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

    // 限定寻访·庆典
    up_2: {
        info: { name: "限定寻访·庆典", en: "Limited Headhunting", icon: "✨", badgeColor: "#f10f0f" },

        assembly: {
            tierRules: {
                tier_6: {
                    mode: 'up_split',
                    upCats: ['char'],
                    offrateCats: ['char'],
                    upTags: ['up_2',],
                    offrateTags: ['up_2','std']
                },
                tier_5: {
                    mode: 'flat',
                    flatCats: ['char'],
                    tags: ['normal']
                },
                tier_4: {
                    mode: 'flat',
                    flatCats: ['char'],
                    tags: ['normal']
                },
                tier_3: {
                    mode: 'flat',
                    flatCats: ['char'],
                    tags: ['normal']
                }
            }
        },

        tiers: [
            { id: 'tier_6', prob: 2.0, isGold: true },
            { id: 'tier_5', prob: 8.0 },
            { id: 'tier_4', prob: 50.0 },
            { id: 'tier_3', prob: 40.0 }
        ],

        pities: [
            {
                tierId: 'tier_6',
                pulls: 99,
                resetOnHit: true,
                enableUp: true,
                upRate: 0.7, // 双UP占70%或单UP占50%
                useGuarantee: false,
                softEnabled: true,
                softRules: [
                    { start: 51, end: 98, inc: 0.02 }
                ]
            },
        ],

        sparkRules: [
            {
                limit: 300,
                type: "once",
                targetType: "up_index",
                upIndex: 1,                // 锁定列表里的第 1 个 UP 目标
                cancelOnHit: false,         // 前 120 抽抽到了就自动失效关闭
                noReset: true             // 正常算作吃保底，重置垫抽进度
            },
        ],

        // 往期限定5倍出率干预
        specRate: {
            enabled: true,
            rules: [
                {
                    tierId: 'tier_6',
                    type: 'multiplier',
                    value: 5,
                    targetCats: ['char'],
                    targetTags: ['up_2']
                }
            ]
        },

        preSelect: {
            enabled: true,
            tiers: {
                tier_6: { upMin: 2, upMax: 2, stdMin: 0, stdMax: 999 },
                tier_5: { stdMin: 0, stdMax: 999 },
                tier_4: { stdMin: 0, stdMax: 999 },
                tier_3: { stdMin: 0, stdMax: 999 }
            },
            spec: { min: 0, max: 3 }
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

    up_3: {
        info: { name: "限定寻访·夏季", en: "Limited Headhunting", icon: "✨", badgeColor: "#f10f0f" },

        assembly: {
            tierRules: {
                tier_6: {
                    mode: 'up_split',
                    upCats: ['char'],
                    offrateCats: ['char'],
                    upTags: ['up_3',],
                    offrateTags: ['up_3','std']
                },
                tier_5: {
                    mode: 'flat',
                    flatCats: ['char'],
                    tags: ['normal']
                },
                tier_4: {
                    mode: 'flat',
                    flatCats: ['char'],
                    tags: ['normal']
                },
                tier_3: {
                    mode: 'flat',
                    flatCats: ['char'],
                    tags: ['normal']
                }
            }
        },

        tiers: [
            { id: 'tier_6', prob: 2.0, isGold: true },
            { id: 'tier_5', prob: 8.0 },
            { id: 'tier_4', prob: 50.0 },
            { id: 'tier_3', prob: 40.0 }
        ],

        pities: [
            {
                tierId: 'tier_6',
                pulls: 99,
                resetOnHit: true,
                enableUp: true,
                upRate: 0.7, // 双UP占70%或单UP占50%
                useGuarantee: false,
                softEnabled: true,
                softRules: [
                    { start: 51, end: 98, inc: 0.02 }
                ]
            },
        ],

        sparkRules: [
            {
                limit: 300,
                type: "once",
                targetType: "up_index",
                upIndex: 1,                // 锁定列表里的第 1 个 UP 目标
                cancelOnHit: false,         // 前 120 抽抽到了就自动失效关闭
                noReset: true             // 正常算作吃保底，重置垫抽进度
            },
        ],

        // 往期限定5倍出率干预
        specRate: {
            enabled: true,
            rules: [
                {
                    tierId: 'tier_6',
                    type: 'multiplier',
                    value: 5,
                    targetCats: ['char'],
                    targetTags: ['up_3']
                }
            ]
        },

        preSelect: {
            enabled: true,
            tiers: {
                tier_6: { upMin: 2, upMax: 2, stdMin: 0, stdMax: 999 },
                tier_5: { stdMin: 0, stdMax: 999 },
                tier_4: { stdMin: 0, stdMax: 999 },
                tier_3: { stdMin: 0, stdMax: 999 }
            },
            spec: { min: 0, max: 3 }
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

    // 联动寻访 (120抽保底真限定)
    collab: {
        info: { name: "联动寻访", en: "Collaborative Headhunting", icon: "🤝", badgeColor: "#9b59b6" },

        assembly: {
            tierRules: {
                tier_6: {
                    mode: 'up_split',
                    upCats: ['char'],
                    offrateCats: ['char'],
                    upTags: ['collab'],
                    offrateTags: ['std']
                },
                tier_5: { mode: 'flat', flatCats: ['char'], tags: ['normal','collab'] },
                tier_4: { mode: 'flat', flatCats: ['char'], tags: ['normal'] },
                tier_3: { mode: 'flat', flatCats: ['char'], tags: ['normal'] }
            }
        },

        tiers: [
            { id: 'tier_6', prob: 2.0, isGold: true },
            { id: 'tier_5', prob: 8.0 },
            { id: 'tier_4', prob: 50.0 },
            { id: 'tier_3', prob: 40.0 }
        ],

        pities: [
            {
                tierId: 'tier_6',
                pulls: 99,
                resetOnHit: true,
                enableUp: true,
                upRate: 0.5,
                useGuarantee: false,
                softEnabled: true,
                softRules: [
                    { start: 51, end: 98, inc: 0.02 }
                ]
            }
        ],

        sparkRules: [
            {
                limit: 120,
                type: "once",
                targetType: "up_index",
                upIndex: 1,
                deliverMode: "random",
                cancelOnHit: true,
                noReset: false
            }
        ],

        preSelect: {
            enabled: true,
            tiers: {
                tier_6: { upMin: 1, upMax: 1, stdMin: 0, stdMax: 999 }
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

    std: {
        info: { name: "标准寻访", en: "Standard Headhunting", icon: "📋", badgeColor: "#3498db" },

        assembly: {
            tierRules: {
                tier_6: {
                    mode: 'up_split',
                    upCats: ['char'],
                    offrateCats: ['char'],
                    upTags: ['std'],
                    offrateTags: ['std']
                },
                tier_5: { mode: 'flat', flatCats: ['char'], tags: ['normal'] },
                tier_4: { mode: 'flat', flatCats: ['char'], tags: ['normal'] },
                tier_3: { mode: 'flat', flatCats: ['char'], tags: ['normal'] }
            }
        },

        tiers: [
            { id: 'tier_6', prob: 2.0, isGold: true },
            { id: 'tier_5', prob: 8.0 },
            { id: 'tier_4', prob: 50.0 },
            { id: 'tier_3', prob: 40.0 }
        ],

        pities: [
            {
                tierId: 'tier_6',
                pulls: 99,
                resetOnHit: true,
                enableUp: true,
                upRate: 0.5,
                useGuarantee: false,
                softEnabled: true,
                softRules: [
                    { start: 51, end: 98, inc: 0.02 }
                ]
            }
        ],

        // 150抽首次未出当期六星保底
        sparkRules: [
            {
                limit: 150,
                type: 'once',
                targetType: 'random_up',
                cancelOnHit: true,
                noReset: false
            }
        ],

        preSelect: {
            enabled: true,
            tiers: {
                tier_6: { upMin: 1, upMax: 2, stdMin: 0, stdMax: 999 }
            }
        },

        lifecycle: {
            allowRotation: true,
            sharedPityParent: ""
        }
    },

    std_2: {
        info: { name: "甄选", en: "Standard Headhunting", icon: "📋", badgeColor: "#3498db" },

        assembly: {
            tierRules: {
                tier_6: {
                    mode: 'up_split',
                    upCats: ['char'],
                    offrateCats: ['char'],
                    upTags: ['std_2'],
                    offrateTags: ['std_2']
                },
                tier_5: { mode: 'flat', flatCats: ['char'], tags: ['normal'] },
                tier_4: { mode: 'flat', flatCats: ['char'], tags: ['normal'] },
                tier_3: { mode: 'flat', flatCats: ['char'], tags: ['normal'] }
            }
        },

        tiers: [
            { id: 'tier_6', prob: 2.0, isGold: true },
            { id: 'tier_5', prob: 8.0 },
            { id: 'tier_4', prob: 50.0 },
            { id: 'tier_3', prob: 40.0 }
        ],

        pities: [
            {
                tierId: 'tier_6',
                pulls: 99,
                resetOnHit: true,
                enableUp: true,
                upRate: 0.5,
                useGuarantee: false,
                softEnabled: true,
                softRules: [
                    { start: 51, end: 98, inc: 0.02 }
                ]
            }
        ],

        // 150抽首次未出当期六星保底
        sparkRules: [
            {
                limit: 150,
                type: 'once',
                targetType: 'random_up',
                cancelOnHit: true,
                noReset: false
            }
        ],

        preSelect: {
            enabled: true,
            tiers: {
                tier_6: { upMin: 1, upMax: 2, stdMin: 0, stdMax: 999 }
            }
        },

        lifecycle: {
            allowRotation: true,
            sharedPityParent: ""
        }
    }
};