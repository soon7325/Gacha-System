// --- 界面语言包 (Gacha System 完整版) ---
const UI_LIB = {
    zh: {

        idx_version_title: "当前版本:Beta v0.0.1.7",
        idx_version_content: 
        "修复：<br>修复设定页面登录后不会出现同步页面<br>修复十连保底低金并非使用设定级别而是自动检测目标金外最高金的问题<br>修复寻找金不是看目标金而是旧代码的5星<br>修复常驻池展示效果全显示歪<br>修复英文语言中展示界面的标题仍然是中文<br>修复融合数据弹窗中，部分未被翻译到的文本<br>修复赠送抽的十连保底机制未生效<br><br>"+
        "更新：<Br>允许关闭硬保底阈值<br>下载历史更新内容（也就是这个文件的时候）根据用户当前的语言下载中文版或英文版更新日志<br><br>"+
        "预设图鉴：<br>扩充图鉴：<br>"+
        "明日方舟：焰狐龙梓兰（截图），凯尔希·思衡托，可露希尔 | 官图<br>"+
        "绝区零：维琳娜，诺姆，星辉·比利 | 官图<br>"+
        "崩坏：星穹铁道：姬子·启行，邂逅于下一个花季 | 官图<br>"+
        "明日方舟：终末地：弭弗，卡缪 | 官图",


        
        // === 全局与侧边栏 ===
        brand: "Gacha System",
        nav_home: "首页 / 关于",
        nav_settings: "设置 Settings",
        nav_new_engine: "➕ 新建游戏引擎",
        nav_game_setup: "⚙️ 游戏配置页",
        dev_options: "开发者选项",

        // === 首页 (index.html) 专属 ===
        index_desc: "专注于实时的抽卡数据分析与运气追踪",
        btn_login_reg: "🔑 登录 / 注册账号",
        index_welcome: "欢迎回来，",
        index_scroll: "向下滚动查看详情 ↓",
        
        // 首页 - 介绍区域
        index_hero_title: "不仅仅是记录，更是你的专属「抽卡沙盒」",
        index_hero_desc: "打破传统抽卡工具只能绑定单一游戏的限制。在这里，你可以从零构建任何游戏的抽卡引擎。",
        feat_core: "🌟 核心特性",
        feat_engine_title: "多重游戏的自定义引擎",
        feat_engine_desc: "除了系统预设的四个游戏，你也可以自定义新的游戏引擎。完全解绑图鉴、支持自定义星级颜色、分段式软保底曲线、动态增幅、大保底、赠送机制与多重「井」机制等等。你的规则，你说了算。",
        feat_data_title: "空白",
        feat_data_desc: "空白",
        feat_sim_title: "沉浸式跃迁模拟",
        feat_sim_desc: "完美复刻底层概率逻辑的模拟器。支持拖拽指定「自选 UP 神坛」与「特限概率干预」，抽卡前先来这里测测风水，或者为自己开发的游戏进行提前测试概率。",
        feat_cloud_title: "本地+云端双轨运行",
        feat_cloud_desc: "默认开启本地运算，保障极致丝滑的响应速度；绑定账号后无缝接入 Firebase 云端，多设备自动融合，数据永不丢失。",
        use_cases_title: "🎮 你可以用它做什么？",
        use_case_1: "<b>作为资源规划管家：</b> 同时管理《星穹铁道》、《绝区零》、《明日方舟》等多款游戏的保底进度，并实时拿出来炫耀一番。",
        use_case_2: "<b>作为抽卡整活器：</b> 新建一个“群友池”或“生活池”，把朋友的头像录入图鉴，模拟抽出他们的概率。",
        use_case_3: "<b>作为概率验证机：</b> 输入官方公布的概率曲线，利用百连抽甚至千连抽模拟器验证实际期望值。",
        use_case_4: "<b>作为小型游戏开发者：</b> 输入自己为游戏填充的概率，并在测试后实时修改规则。",
        beta_warning: "注意，请勿盗取、商用该网站，如若您被忽悠购买了所谓的“专业版”或“高级版”，请向其他人举报贩卖者！这个项目完全开源免费，除下方赞助外任何收费都是诈骗！",
        idx_version_detail: "点击查看当前版本更新详情",
        idx_version_log: "📄 前往更新日志（v0.0 通道）",
        idx_support_title: "💬 反馈与赞助",
        idx_support_desc: "如遇到 Bug 或有新功能建议，欢迎通过邮件联系我：",
        idx_sponsor_desc: "如果觉得这个项目对你有帮助，可以豪迈地赞助一波作者。你的支持是我持续更新的最大动力",
        idx_sponsor_btn1: "前往爱发电",
        idx_sponsor_btn2: "前往Ko-fi",
        idx_sponsor_desc_2: "赞助者也有特殊关照哦，比如说自动备份删除的数据等等，所以请写上自己的账户信息如邮箱，以便我能确认并提供相应的支持",
        idx_sponsor_modal_title: "感谢你的支持！🎉",
        idx_sponsor_modal_desc: "你的每一分支持都是我持续更新的动力。",

        // === 登录/注册弹窗 ===
        auth_title: "通行证登录",
        auth_subtitle: "同步你的所有欧气记录",
        auth_tab_login: "登录",
        auth_tab_reg: "注册新账号",
        auth_email: "电子邮箱",
        auth_pwd: "密码",
        auth_pwd_confirm: "确认密码",
        auth_btn_login: "登录",
        auth_or: "OR",
        auth_google: "使用 Google 账号继续",

        // === 融合弹窗 (Sync Modal) ===
        sync_title: "🔄 发现数据差异",
        sync_subtitle: "本地与云端均有数据，请选择融合方案",
        sync_cloud_first: "☁️ 以【云端】为主相互融合",
        sync_cloud_first_desc: "保留云端的所有抽卡。若本地抽数更多，本地多出的抽卡将无缝追加到云端后方。",
        sync_local_first: "💻 以【本地】为主相互融合",
        sync_local_first_desc: "保留本地的所有抽卡。若云端有本地缺失的极早期记录，云端独有的旧抽卡也会自动下载补全到本地。",
        sync_extreme: "极端操作",
        sync_cloud_only: "🗑️ 舍弃本地，完全覆盖",
        sync_cloud_only_desc: "清空当前浏览器的所有数据，完全以云端的备份为准（适用于更换新电脑或清空重置）。",
        sync_in_progress: "🔄 正在拼命融合中...",
        alert_sync_success: "✅ 数据融合与双向同步完成！",
        alert_sync_quota: "☁️ 今日云端同步名额已满！\n(本地数据依然安全)",
        alert_sync_error: "⚠️ 同步过程出现异常: ",
        alert_local_safe: "\n(本地数据安全)",

        // === 设置页选项与弹窗专属 ===
        fmt_percent: "百分比 (如: 75%)",
        fmt_decimal: "小数 (如: 0.75)（未制作）",
        modal_edit_profile: "✏️ 编辑个人资料",
        modal_click_avatar: "点击头像更换图片",
        modal_edit_name: "修改昵称",
        modal_edit_name_ph: "请输入新昵称",
        modal_save_profile: "💾 保存修改",
        modal_change_pwd: "🔑 修改密码",
        modal_old_pwd: "当前密码",
        modal_new_pwd: "新密码",
        modal_confirm_pwd: "确认新密码",
        modal_save_pwd: "💾 确认修改",

        // === 设置页 - 选项与按钮 ===
        opt_home: "🏠 首页 / 关于",
        theme_dark: "🌙 暗色模式 (Dark)",
        theme_light: "☀️ 亮色模式 (Light)",
        lang_zh: "简体中文 (Chinese)",
        lang_en: "English",
        btn_export: "📥 导出本地备份 (.json)",
        btn_import: "📤 导入本地恢复",
        btn_push_cloud: "☁️ 强制推送到云端",
        btn_pull_cloud: "☁️ 从云端拉取覆盖",
        btn_reset_sync: "🔄 重置融合状态",
        btn_clear_local: "🗑️ 清空所有本地缓存并重置应用",
        
        // 顺手补齐设置页的一些标题，以防漏掉
        set_title_page: "设置中心",
        set_acc_manage: "👤 账户管理",
        set_acc_loading: "正在检测登录状态...",
        set_acc_guest: "当前未登录，无法开启跨设备云端同步。",
        set_adv_pref: "⚙️ 进阶偏好",
        set_start_page: "默认启动页",
        set_data_format: "数据展示格式",
        set_ui_display: "🎨 界面显示",
        set_lang: "界面语言 Language",
        set_theme: "界面主题",
        set_data_cloud: "💾 数据与云端管理",
        set_danger_zone: "⚠️ 危险区域",
        danger_hint: "以下操作不可撤销，请谨慎操作。",
        btn_edit_profile: "✏️ 编辑资料",
        btn_change_pwd: "🔑 修改密码",
        btn_logout: "登出",

        // === 弹窗与动态提示 (JS调用) ===
        auth_cancel: "取消",
        auth_cancel_login: "取消登录",
        auth_forgot: "忘记密码？",
        auth_pwd_confirm_ph: "请再次输入密码",
        auth_btn_login: "登录",
        auth_btn_register: "创建账号",
        alert_save_success: "✅ 修改已保存！",
        alert_pwd_success: "✅ 密码修改成功！",
        confirm_logout: "确定要退出登录吗？",
        alert_logout_success: "✅ 已成功登出！",
        confirm_push_cloud: "🚨 确定要【强制推送到云端】吗？\n\n这将使用当前设备的数据覆盖云端备份。如果云端有其他设备的最新记录，它们将被抹除！",
        confirm_pull_cloud: "🚨 确定要【从云端拉取覆盖】吗？\n\n这将使用云端数据覆盖当前设备的所有抽卡记录，本地未同步的记录将会丢失！",
        confirm_reset_sync: "🔄 确定要重置融合状态吗？\n\n这会让浏览器在下次刷新时重新检测云端差异，并再次弹出融合提示窗。",
        confirm_clear_local: "⚠️ 警告：这会清空浏览器内的【所有】设置和抽卡数据！\n如果不事先导出备份，本地数据将彻底消失。\n\n确定要继续吗？",
        alert_clear_success: "🗑️ 本地数据已清空，即将刷新页面。",
        alert_reg_success: "✅ 账号注册成功，已自动登录！",
        alert_login_fail: "⚠️ 验证失败: ",
        alert_quota_full: "☁️ 服务器今日连接名额已满！\n本地功能不受影响，但暂无法同步云端，请明天再试。",
        alert_pwd_mismatch: "❌ 两次输入的密码不一致！",
        alert_third_party_pwd: "⚠️ 您的账号是通过第三方（如谷歌）授权登录的，无法在此处修改密码！",
        alert_invalid_old_pwd: "❌ 您输入的【当前密码】不正确！",
        alert_empty_email_reset: "⚠️ 请先在上方输入您的注册邮箱，然后再点击「忘记密码」！",
        alert_reset_email_sent: "✅ 密码重置邮件已发送！请检查您的收件箱（或垃圾邮件）。",
        alert_op_fail: "❌ 操作失败: ",

        // === 预设游戏名称 ===
        game_hsr: "崩坏：星穹铁道",
        game_zzz: "绝区零",
        game_end: "明日方舟：终末地",
        game_ark: "明日方舟",

        // === 预设卡池名称 (你可以根据你实际设置的池子补充) ===
        pool_hsr_char: "角色限定",
        pool_hsr_weapon: "光锥限定",
        pool_hsr_std: "常驻跃迁",
        
        pool_zzz_char: "独家频段",
        pool_zzz_weapon: "音擎频段",
        pool_zzz_bangboo: "邦布频段",
        pool_zzz_std: "常驻频段",

        pool_end_char: "特态寻访",
        pool_end_weapon: "武器装备",
        pool_end_std: "标准寻访",

        pool_ark_char: "限定寻访",
        pool_ark_std: "标准寻访",

        // === 终极引擎配置页 (custom_setup 新版) ===
        cs_main_title: "🛠️ 游戏全量构建中心",
        cs_main_desc: "图鉴类型完全解绑，像拼积木一样自由构建抽卡池",
        cs_btn_save_all: "💾 保存全部配置并生成系统",
        cs_game_name: "游戏/引擎名称 (必填)",
        cs_game_name_ph: "例如：崩坏：星穹铁道 / 明日方舟",
        cs_tier_title: "🌟 全局稀有度 (Tier) 设定",
        cs_tier_desc: "在此统一定义该游戏的所有稀有度与颜色。下方图鉴录入时可直接在下拉框中选择。此设置将作为所有卡池的底层基准。",
        cs_btn_add_tier: "➕ 添加新稀有度",
        cs_btn_add_up: "➕ 添加【目标图鉴】(作限定/联动用)",
        cs_btn_add_std: "➕ 添加【可歪图鉴】(作常驻/特限用)",
        cs_flow_title: "🔀 卡池流向与混合机制设定",
        cs_btn_del_game: "🗑️ 销毁当前自定义游戏的所有数据",

        // Modal 弹窗
        cs_modal_add: "➕ 添加新图鉴",
        cs_modal_edit: "✏️ 编辑图鉴",
        cs_lbl_name: "中文名",
        cs_lbl_name_ph: "如：银狼",
        cs_lbl_name_en: "英文名 (可选)",
        cs_lbl_name_en_ph: "如：Silver Wolf",
        cs_lbl_short: "中文简称 (看板方块显示用)",
        cs_lbl_short_ph: "如：狼",
        cs_lbl_short_en: "英文简称 (可选)",
        cs_lbl_short_en_ph: "如：SW",
        cs_lbl_tier: "所属稀有度",
        cs_lbl_img: "头像图片 (可选)",
        cs_btn_cancel: "取消",
        cs_btn_save: "💾 保存",
        cs_js_err_pool_full: "⚠️ 中文简称不能超过 2 个字",
        cs_js_err_pool_full_2: "⚠️ 非中文简称不能超过 5 个字符",

        // JS 动态文本
        cs_js_preset_warn: "⚠️ 系统预设游戏：当前界面的图鉴与底层流向规则仅供预览，不可修改。如需自定义，请新建游戏引擎。",
        cs_js_preset_lock: "⚠️ 系统预设游戏的图鉴不可修改！如需自定义，请返回主页新建游戏。",
        cs_js_preset_lock_btn: "⚠️ 系统预设游戏的图鉴不可修改！",
        cs_js_preset_block: "拦截：不可操作！",
        cs_js_prompt_name: "请输入名称：",
        cs_js_prompt_up: "新建限定/联动池",
        cs_js_prompt_std: "新建常驻/可歪池",
        cs_js_del_pool_conf: "确定要删除整个图鉴池及其内含的所有数据吗？",
        cs_js_spec_enabled: "✅ <strong>已启用：</strong>该常驻图鉴内的角色，将作为候选项出现在抽卡模拟器的「特限干预神坛」待选区中。",
        cs_js_opt_standalone: "开放侧边栏独立抽取",
        cs_js_opt_custom_up: "✨ 允许模拟器自选 UP",
        cs_js_opt_spec: "启用特限出货干预",
        cs_js_badge_up: "✨ 目标图鉴 (限定/联动)",
        cs_js_badge_std: "🎫 可歪图鉴 (常驻/特限)",
        cs_js_del_btn: "✕ 删除",
        cs_js_add_roster: "添加图鉴",
        cs_js_err_name_req: "中文名或英文名至少填一个！",
        cs_js_err_pool_null: "找不到对应卡池！",
        cs_js_del_item_conf: "确定要删除这个项目吗？",
        cs_js_empty_roster: "请先在上方添加图鉴积木",
        cs_js_mix_del: "✕ 删除混池",
        cs_js_mix_lbl: "融合图鉴：",
        cs_js_mix_title_1: "1. 多重常驻融合池 (Mixed Std)",
        cs_js_mix_add: "➕ 新增混合池",
        cs_js_mix_empty: "暂无混合池，点击右上方按钮添加。",
        cs_js_mix_title_2: "2. 目标卡池「歪出」流向判定",
        cs_js_mix_offrate: "歪出：",
        cs_js_err_game_name: "❌ 请输入游戏名称！",
        cs_js_save_success: "✅ 全局星级与图鉴保存成功！",
        cs_js_del_err_new: "当前是新建模式，没有可以删除的数据！",
        cs_js_del_game_conf: "⚠️ 警告：这将永久删除该游戏的所有规则、图鉴和抽卡数据！\n确定要销毁吗？",
        cs_js_del_success: "已成功删除！",
        cs_js_base_id: "底层ID: ",

        // === 卡池规则配置页 (custom_pool_setup) ===
        cp_main_title: "⚙️ 卡池规则独立配置",
        cp_main_desc_1: "正在为 ",
        cp_main_desc_2: " 配置专属概率机制",
        cp_btn_back: "← 返回看板",
        
        cp_sec1_title: "🌟 1. 稀有度启用与概率分配",
        cp_sec1_total: "当前总概率: ",
        cp_sec1_desc: "以下星级来源于全局游戏设定。请选择要在当前卡池启用的星级，并设定其出货概率。",
        cp_sec1_goto_1: "修改名称或颜色请前往 ",
        cp_sec1_goto_2: "全量构建中心",
        
        cp_sec2_title: "🎯 2. 目标高稀有度 (出金) 设定",
        cp_sec2_desc: "勾选在数据统计中被视为“出金 / 重置保底”的稀有度层级。",
        
        cp_sec3_title: "🎁 3. 多重副产物保底 (低金/低星保底)",
        cp_sec3_desc: "你可以自由设置多个保底规则 (如: 每10抽保底紫，每5抽保底蓝)。",
        cp_sec3_note: "注：已被设为「目标金」的层级不可选，请在下方单独设置金保底。",
        
        cp_sec4_title: "📈 4. 保底与动态概率 (分段软保底)",
        cp_sec4_hard: "硬保底阈值 (必定出金)",
        cp_sec4_hard_ph: "如: 90",
        cp_sec4_up: "UP 基础概率 (不歪率 %)",
        cp_sec4_up_ph: "如: 50",
        cp_sec4_soft_toggle: "开启分段式软保底 (动态增幅)",
        cp_sec4_soft_desc: "可以设置多个区间。例如：63-73抽每次增加7%，74-80抽每次增加3.5%。",
        
        cp_sec5_title: "🛡️ 5. 大保底(命定值) 与“井”设定",
        cp_sec5_gua_toggle: "开启大保底 / 命定值机制",
        cp_sec5_gua_1: "在未命中 UP (歪了) 累计",
        cp_sec5_gua_2: "次后，下一次金必定出 UP。",
        cp_sec5_gua_note: "(注：填1就是标准的歪一次后必中；填2就是原神武器池的神铸定轨)",
        cp_sec5_spark: "多重“井”规则配置：",
        
        cp_sec6_title: "🎁 6. 赠送抽机制",
        
        cp_sec7_title: "📌 7. 模拟器预选数量限制设定",
        cp_sec7_toggle: "开启模拟器自动预选/限制数量",
        cp_sec7_up_title: "🏆 限定 UP 预选配置",
        cp_sec7_std_title: "🏠 常驻项目预选配置",
        cp_sec7_min: "最少勾选",
        cp_sec7_max: "最多勾选",
        cp_sec7_unlimited: "不限",
        
        cp_sec8_title: "🌟 8. 特限出货干预设定",
        cp_sec8_toggle: "开启特限出货干预 (模拟器内自选角色)",
        cp_sec8_desc: "开启后，在模拟器中将自动弹出【特限神坛】，允许玩家拖拽想提升概率的常驻角色。",
        cp_sec8_type: "提升算法",
        cp_sec8_type_1: "权值倍数 (如: 5倍)",
        cp_sec8_type_2: "固定占有率 (如: 50%)",
        cp_sec8_val: "提升数值",
        
        cp_btn_save: "💾 保存【当前卡池】规则并返回",

        // JS 动态文本
        cp_js_prob: "出货概率:",
        cp_js_no_tier: "请先在上方开启至少一个稀有度",
        cp_js_no_avail_tier: "暂无可用层级",
        cp_js_minor_1: "累计满",
        cp_js_minor_2: "抽，必定给",
        cp_js_none: "无",
        cp_js_minor_reset: "提前抽出时重置",
        cp_js_soft_1: "第",
        cp_js_soft_start: "起始",
        cp_js_soft_end: "结束",
        cp_js_soft_2: "抽，每次增加",
        cp_js_soft_inc: "概率%",
        cp_js_spark_ph: "井抽数",
        cp_js_spark_once: "一次性",
        cp_js_spark_loop: "循环",
        cp_js_spark_cancel: "命中UP后关闭该井",
        cp_js_spark_noreset: "额外赠送(不重置保底)",
        cp_js_gift_1: "累计抽满",
        cp_js_gift_2: "抽，额外赠送",
        cp_js_gift_3: "抽",
        cp_js_gift_count: "赠送抽计入保底 (垫数)",
        cp_js_preset_warn: "⚠️ 系统预设游戏：当前卡池规则与概率仅供预览，不可修改。如需自定义，请新建游戏引擎。",
        cp_js_preset_lock_btn: "🔒 官方预设规则不可修改",
        cp_js_err_tier: "❌ 请至少开启一个稀有度星级！",
        cp_js_err_prob: "❌ 所有启用层级的概率总和必须为 100%！",
        cp_js_err_gold: "❌ 请至少在第2步中勾选一个【目标高稀有度】作为出金标志！",
        cp_js_save_ok: "✅ 卡池专属概率保存成功！",
        cp_js_syncing: "☁️ 正在同步到云端...",

        // === 自定义看板页 (custom_dashboard) ===
        cd_title_loading: "加载中...",
        cd_btn_edit_rules: "⚙️ 修改卡池概率",
        cd_btn_sim: "✨ 模拟抽卡",
        cd_btn_input: "录入数据",
        cd_stat_total: "总抽数",
        cd_stat_winrate: "不歪率",
        cd_stat_avg: "平均出金",
        cd_stat_pity: "当前已垫",
        cd_modal_add10: "+ 十连",
        cd_modal_add1: "+ 单抽",
        cd_modal_title: "数据录入 (点击方块修改)",
        cd_modal_save: "保存并关闭",
        
        // JS 动态文本
        cd_js_err_invalid: "无效的游戏通道！",
        cd_js_custom_game: "自定义游戏",
        cd_js_max_pity: "最高保底: ",
        cd_js_pulls_unit: " 抽",
        cd_js_free_tag: " (免费)",
        cd_js_lost_tag: "歪",
        cd_js_pity_tag: "垫",
        cd_js_cur_tag: " (当前)",
        cd_js_set_free: "设为免费",
        cd_js_cancel_free: "取消免费",
        cd_js_confirm_cancel_free: "取消免费状态？这将会重新计入正常保底抽数。",
        cd_js_confirm_set_free: "当前行的抽数将会不计入保底，确定设为免费吗？",
        cd_js_range_free: "[ 免费 ]",
        cd_js_pull_prefix: "第 ",
        cd_js_pull_suffix: " 抽",
        cd_js_uploading: "☁️ 正在打包上传...",
        cd_js_err_no_char: "⚠️ 找不到属于该稀有度层级的角色/物品，请先到图鉴或数据库里添加对应 tierId！",
        cd_js_select_item: "选择获得产物:",
        cd_js_pool_up: "限定 UP / 联动",
        cd_js_pool_std: "常驻 / 歪池",
        cd_js_empty: "空",

        // === 抽卡模拟器页 (simulator) ===
        sim_title: "✨ 自定义抽卡模拟器",
        sim_btn_back: "返回看板",
        sim_h_up: "1. 选择限定 UP 项目",
        sim_h_std: "2. 选择常驻项目 (默认全选)",
        sim_h_action: "执行跃迁",
        sim_btn_1: "单抽",
        sim_btn_10: "十连",
        sim_btn_100: "百连",
        sim_ph_custom: "自定义数量",
        sim_btn_pull: "抽！",
        sim_btn_clear: "清空记录",
        sim_h_nav: "便捷查询（跳转到金）",
        sim_btn_prev: "↑ 寻上一个金",
        sim_btn_next: "↓ 寻下一个金",
        sim_btn_reset_limits: "⟲ 重置所有一次性限制 (井/赠送)",
        sim_btn_reopen_up: "✨ 重新配置自选 UP 神坛",
        sim_btn_reopen_spec: "🌟 重新配置特限出货干预",
        sim_h_prob_1: "📊 下一抽实时概率 (当前已垫: ",
        sim_h_prob_2: ")",
        sim_stat_total: "总计: ",
        sim_stat_gold: "金: ",
        sim_stat_spark_dist: "距井: ",
        sim_stat_pity: "垫: ",
        sim_stat_guarantee: "大保底: ",
        sim_guarantee_no: "否",
        
        sim_modal_up_title: "✨ 自建卡池：任命当期 UP ✨",
        sim_modal_up_desc: "拖拽想要 UP 的角色卡片至上方神坛。",
        sim_modal_up_altar: "🎯 当期 UP 神坛",
        sim_modal_up_ph: "⬇️ 拖拽图鉴至此处 ⬇️",
        sim_modal_up_roster: "📦 底池图鉴库",
        sim_modal_up_btn: "🚀 确认神坛编队，启动模拟器！",
        
        sim_modal_spec_title: "🌟 特限出货干预配置 🌟",
        sim_modal_spec_desc: "拖拽常驻角色至干预区，出金歪时将大幅提升选中角色的获取概率。<br><span style='color:#2ecc71;'>(提升算法和数值已在配置页设定完毕)</span>",
        sim_modal_spec_altar: "🎯 概率干预神坛",
        sim_modal_spec_ph: "⬇️ 拖拽常驻图鉴至此处 ⬇️",
        sim_modal_spec_roster: "📦 常驻图鉴库",
        sim_modal_spec_btn: "🚀 确认干预名单，返回模拟器！",
        
        // JS 动态文本
        sim_js_err_invalid: "无效的游戏通道！",
        sim_js_title_up_1: "1. 选择限定/联动项目",
        sim_js_title_std_1: "2. 选择常驻项目 (默认全选)",
        sim_js_title_std_2: "选择想要抽取的项目 (默认全选)",
        sim_js_title_up_2: "1. 选择限定 UP 项目",
        sim_js_title_up_3: "📦 本期图鉴库可抽取项目 (请勾选)",
        sim_js_title_up_4: "🎯 限定 UP 抽取项目 (请勾选)",
        sim_js_title_std_3: "2. 选择常驻项目 (默认不勾选)",
        sim_js_unlimited: "不限",
        sim_js_err_pre_up: "❌ 抽卡失败：抽取项目的勾选数量不符合规则！\n要求：最少 {min} 个，最多 {max} 个\n当前：勾选了 {count} 个",
        sim_js_err_pre_std: "❌ 抽卡失败：常驻项目的勾选数量不符合规则！\n要求：最少 {min} 个，最多 {max} 个\n当前：勾选了 {count} 个",
        sim_js_err_up_req: "❌ 请至少拖拽一个角色至上方神坛作为 UP！",
        sim_js_err_no_gold: "⚠️ 图鉴库中没有可用的常驻金项目！",
        sim_js_conf_reset: "确定要重置所有一次性【井】和【赠送抽】的记录吗？\n(重置后，将重新从 0 开始计算触发条件)",
        sim_js_alert_reset: "✅ 一次性限制与计步器已重置！",
        sim_js_inactive: "未激活",
        sim_js_yes: "是",
        sim_js_need_miss: "还需歪 ",
        sim_js_times: " 次",
        sim_js_star: " 星",
        sim_js_unknown: "未知",
        sim_js_std: "常驻",
        sim_js_gold: "出金",
        sim_js_normal: "普通",
        sim_js_spark_item: "井项目",
        sim_js_spark: "井",
        sim_js_err_amount: "❌ 请输入有效的自定义抽数！",
        sim_js_err_no_gold_rec: "⚠️ 当前记录中还没有出金哦！",
        sim_js_last_gold: "这已经是最后一个金了！",
        sim_js_first_gold: "这已经是第一个金了！",
        sim_js_free: "免费",
        sim_js_pull_prefix: "第 ",
        sim_js_pull_range: " - ",
        sim_js_pull_suffix: " 抽",
        sim_js_count_pity: "计保底",
        sim_js_cur_free: "当前<br>免费",
    },
    
    en: {

        idx_version_title: "Current Version :Beta v0.0.1.6",
        idx_version_content: 
        "Fixes:<br>Fixed an issue where the sync page would not appear after logging in on the settings page.<br>"+
        "Fixed an issue where the 10-pull guarantee for lower-tier golds (other-stars) was automatically detecting the highest gold besides the target gold, rather than using the configured level.<br>"+
        "Fixed an issue where the search for gold mechanic relied on the old code's 5-star logic instead of the target gold.<br>"+
        "Fixed an issue where the Standard Banner display effect incorrectly showed everything as off-banner (lost 50/50).<br>"+
        "Fixed an issue where the title in the display interface is still in Chinese in the English language.<br>"+
        "Fix some untranslated text in the fusion data popup,br>"+
        "<br>Updates:<br>"+
        "Added the option to disable the hard pity threshold.<br>"+
        "Downloading historical update notes (this specific file) will now automatically download either the Chinese or English version based on the user's current language setting.<br>"+
        "Preset Gallery:<br>"+
        "Expanded Gallery:<br>"+
        "Arknights: Violet Mizutsune Orchid(sc), Kal'tsit Esperanta, Closure | wiki img<br>"+
        "Zenless Zone Zero: Velina, Norma, Starlight - Billy | wiki img<br>"+
        "Honkai: Star Rail: Himeko-Nova, Until the Flowers Bloom Again | wiki img<br>"+
        "Arknights: Endfield: Mi Fu, Camille | wiki img",
        



        // === Global & Sidebar ===
        brand: "Gacha System",
        nav_home: "Home / About",
        nav_settings: "Settings 设置",
        nav_new_engine: "➕ New Engine",
        nav_game_setup: "⚙️ Engine Setup",
        dev_options: "Developer Options",

        // === Index (index.html) ===
        index_desc: "Focus on real-time gacha data analysis & luck tracking",
        btn_login_reg: "🔑 Login / Register",
        index_welcome: "Welcome back, ",
        index_scroll: "Scroll down for details ↓",
        
        index_hero_title: "Not just a tracker, but your personal Gacha Sandbox",
        index_hero_desc: "Break the limits of traditional trackers bound to a single game. Here, you can build a gacha engine for ANY game from scratch like LEGO blocks.",
        feat_core: "🌟 Core Features",
        feat_engine_title: "Custom Engines for Multiple Games",
        feat_engine_desc: "Beyond the four built-in games, you can build your own custom engines. Fully decoupled collection systems, custom star-rating colors, segmented soft-pity curves, dynamic boosts, hard pity, gift mechanics, and multiple 'Spark' (pity shop) systems. Your rules, your call.",
        feat_data_title: "Blank",
        feat_data_desc: "Coming Soon",
        feat_sim_title: "Immersive Warp Simulation",
        feat_sim_desc: "A simulator that perfectly replicates underlying probability logic. Supports 'Custom Rate-up Altars' and 'Special Probability Interference.' Test your luck here before pulling, or use it to stress-test probabilities for your own game development.",
        feat_cloud_title: "Local + Cloud Dual-Track",
        feat_cloud_desc: "Local processing enabled by default for ultra-fast response. Bind an account for seamless Firebase cloud sync across multiple devices.",
        use_cases_title: "🎮 What can you do with it?",
        use_case_1: "<b>As a Resource Planner:</b>Manage pity progress for multiple games like Honkai: Star Rail, Zenless Zone Zero, and Arknights simultaneously — and show them off in real-time.",
        use_case_2: "<b>As a Meme Generator:</b> Create a 'Friend Pool' by adding your friends' avatars to the roster and simulate pulling them.",
        use_case_3: "<b>As a Probability Verifier:</b> Input official probability curves and run simulations of hundreds or thousands of pulls to verify actual expected values.",
        use_case_4: "<b>As an Indie Game Dev:</b> Input your game's probability mechanics and adjust the rules in real-time based on test results.",
        beta_warning: "ATTENTION: Please do not plagiarize or commercialize this website. If you were misled into purchasing a so-called Pro or Premium version, please report the seller to others! This project is completely open-source and free; any charges—other than the sponsorship mentioned below—are a scam!",
        idx_version_detail: "Click to view current version details",
        idx_version_log: "📄 View Changelog (v0.0 Channel)",
        idx_support_title: "💬 Feedback & Support",
        idx_support_desc: "If you encounter any bugs or have feature suggestions, feel free to email me:",
        idx_sponsor_desc: "If you find this project helpful, consider fueling the dev with a generous donation. Your backing is what keeps this project alive and kicking!",
        idx_sponsor_desc_2: "Supporters enjoy exclusive features, such as automatic data recovery/backups which you deleted by mistake. So please provide your account email for verification and support access.",
        idx_sponsor_btn1: "Sponsor on Afdian",
        idx_sponsor_btn2: "Sponsor on Ko-fi",
        idx_sponsor_modal_title: "Thank you for your support! 🎉",
        idx_sponsor_modal_desc: "Every bit of your support motivates me to keep updating.",

        // === Auth Modal ===
        auth_title: "Account Login",
        auth_subtitle: "Sync all your lucky records",
        auth_tab_login: "Login",
        auth_tab_reg: "Register",
        auth_email: "Email Address",
        auth_pwd: "Password",
        auth_pwd_confirm: "Confirm Password",
        auth_btn_login: "Login",
        auth_or: "OR",
        auth_google: "Continue with Google",

        // === Sync Modal ===
        sync_title: "🔄 Data Conflict Detected",
        sync_subtitle: "Data exists locally and in the cloud. Choose a merge method:",
        sync_cloud_first: "☁️ Cloud-First Merge",
        sync_cloud_first_desc: "Keep all cloud pulls. Any extra local pulls will be appended seamlessly.",
        sync_local_first: "💻 Local-First Merge",
        sync_local_first_desc: "Keep all local pulls. Missing early pulls from the cloud will be downloaded to fill gaps.",
        sync_extreme: "Extreme Options",
        sync_cloud_only: "🗑️ Overwrite Local Completely",
        sync_cloud_only_desc: "Wipe all browser data and sync purely from the cloud (Best for new devices).",
        sync_in_progress: "🔄 Merging data in progress...",
        alert_sync_success: "✅ Data merge and two-way sync complete!",
        alert_sync_quota: "☁️ Cloud sync quota is full for today!\n(Local data remains safe)",
        alert_sync_error: "⚠️ Sync process encountered an error: ",
        alert_local_safe: "\n(Local data is safe)",

        // === Settings Modals & Options ===
        fmt_percent: "Percentage (e.g. 75%)",
        fmt_decimal: "Decimal (e.g. 0.75)(haven't done it yet)",
        modal_edit_profile: "✏️ Edit Profile",
        modal_click_avatar: "Click avatar to change",
        modal_edit_name: "Change Nickname",
        modal_edit_name_ph: "Enter new nickname",
        modal_save_profile: "💾 Save Changes",
        modal_change_pwd: "🔑 Change Password",
        modal_old_pwd: "Current Password",
        modal_new_pwd: "New Password",
        modal_confirm_pwd: "Confirm New Password",
        modal_save_pwd: "💾 Confirm Change",

        // === Settings - Options & Buttons ===
        opt_home: "🏠 Home / About",
        theme_dark: "🌙 Dark Mode",
        theme_light: "☀️ Light Mode",
        lang_zh: "简体中文 (Chinese)",
        lang_en: "English",
        btn_export: "📥 Export Local Backup (.json)",
        btn_import: "📤 Import Local Backup",
        btn_push_cloud: "☁️ Force Push to Cloud",
        btn_pull_cloud: "☁️ Force Pull from Cloud",
        btn_reset_sync: "🔄 Reset Sync State",
        btn_clear_local: "🗑️ Clear All Local Data & Reset",

        set_title_page: "Settings Center",
        set_acc_manage: "👤 Account Management",
        set_acc_loading: "Checking login status...",
        set_acc_guest: "Currently not logged in. Cross-device cloud sync is disabled.",
        set_adv_pref: "⚙️ Advanced Preferences",
        set_start_page: "Default Start Page",
        set_data_format: "Data Display Format",
        set_ui_display: "🎨 UI Display",
        set_lang: "Interface Language 语言",
        set_theme: "Interface Theme",
        set_data_cloud: "💾 Data & Cloud Management",
        set_danger_zone: "⚠️ Danger Zone",
        danger_hint: "The following actions are irreversible. Proceed with caution.",
        btn_edit_profile: "✏️ Edit Profile",
        btn_change_pwd: "🔑 Change Password",
        btn_logout: "Logout",

// === Alerts & Prompts (JS) ===
        auth_cancel: "Cancel",
        auth_cancel_login: "Cancel Login",
        auth_forgot: "Forgot Password?",
        auth_pwd_confirm_ph: "Enter password again",
        auth_btn_login: "Login",
        auth_btn_register: "Create Account",
        alert_save_success: "✅ Changes saved!",
        alert_pwd_success: "✅ Password changed successfully!",
        confirm_logout: "Are you sure you want to logout?",
        alert_logout_success: "✅ Logged out successfully!",
        confirm_push_cloud: "🚨 Force push to cloud?\n\nThis OVERWRITES the cloud backup with your current device's data. Other devices' records will be wiped!",
        confirm_pull_cloud: "🚨 Force pull from cloud?\n\nThis OVERWRITES your current device with the cloud backup. Unsynced local records will be lost!",
        confirm_reset_sync: "🔄 Reset sync state?\n\nBrowser will re-detect cloud differences on next refresh and pop up the sync modal again.",
        confirm_clear_local: "⚠️ WARNING: This clears ALL browser settings and gacha data!\nIf not backed up, local data will be permanently lost.\n\nContinue?",
        alert_clear_success: "🗑️ Local data cleared. Reloading page.",
        alert_reg_success: "✅ Account created and logged in!",
        alert_login_fail: "⚠️ Authentication failed: ",
        alert_quota_full: "☁️ Cloud server quota full today!\nLocal features work normally, but cloud sync is paused. Try again tomorrow.",
        alert_pwd_mismatch: "❌ Passwords do not match!",
        alert_third_party_pwd: "⚠️ Your account is logged in via a third-party (e.g., Google). Password cannot be changed here!",
        alert_invalid_old_pwd: "❌ The [Current Password] you entered is incorrect!",
        alert_empty_email_reset: "⚠️ Please enter your registered email above before clicking 'Forgot Password'!",
        alert_reset_email_sent: "✅ Password reset email sent! Please check your inbox (or spam folder).",
        alert_op_fail: "❌ Operation failed: ",

        // === Preset Game Names ===
        game_hsr: "Honkai: Star Rail",
        game_zzz: "Zenless Zone Zero",
        game_end: "Arknights: Endfield",
        game_ark: "Arknights",

        // === Preset Pool Names ===
        pool_hsr_char: "Character Event Warp",
        pool_hsr_weapon: "Light Cone Event Warp",
        pool_hsr_std: "Standard Warp",
        
        pool_zzz_char: "Exclusive Channel",
        pool_zzz_weapon: "W-Engine Channel",
        pool_zzz_bangboo: "Bangboo Channel",
        pool_zzz_std: "Standard Channel",

        pool_end_char: "Event Headhunting",
        pool_end_weapon: "Weapon Headhunting",
        pool_end_std: "Standard Headhunting",

        pool_ark_char: "Limited Headhunting",
        pool_ark_std: "Standard Headhunting",

        // === Ultimate Engine Setup (custom_setup) ===
        cs_main_title: "🛠️ Full Game Build Center",
        cs_main_desc: "Unbound roster types, build gacha pools freely like LEGO blocks.",
        cs_btn_save_all: "💾 Save All Configs & Generate System",
        cs_game_name: "Game/Engine Name (Required)",
        cs_game_name_ph: "e.g., Honkai: Star Rail / Arknights",
        cs_tier_title: "🌟 Global Rarity (Tier) Settings",
        cs_tier_desc: "Unify and define all rarities and colors for this game here. You can select them directly in the dropdown when adding roster items below. This setting serves as the foundation for all pools.",
        cs_btn_add_tier: "➕ Add New Rarity",
        cs_btn_add_up: "➕ Add [Target Roster] (For Limited/Collab)",
        cs_btn_add_std: "➕ Add [Off-rate Roster] (For Standard/Spec)",
        cs_flow_title: "🔀 Pool Flow & Mix Mechanics Settings",
        cs_btn_del_game: "🗑️ Destroy All Data of Current Custom Game",

        // Modal
        cs_modal_add: "➕ Add New Item",
        cs_modal_edit: "✏️ Edit Item",
        cs_lbl_name: "Name",
        cs_lbl_name_ph: "e.g. Silver Wolf",
        cs_lbl_name_en: "English Name (Optional)",
        cs_lbl_name_en_ph: "e.g. SWolf",
        cs_lbl_short: "Short Name (For Block Display)",
        cs_lbl_short_ph: "e.g. SWolf",
        cs_lbl_short_en: "English Short Name (Optional)",
        cs_lbl_short_en_ph: "e.g. SW",
        cs_lbl_tier: "Belongs to Rarity",
        cs_lbl_img: "Avatar Image (Optional)",
        cs_btn_cancel: "Cancel",
        cs_btn_save: "💾 Save",
        cs_js_err_pool_full: "⚠️ Max 2 characters for Chinese abbreviations.",
        cs_js_err_pool_full_2: "⚠️ Max 5 characters for non-Chinese abbreviations.",

        // JS Dynamic Texts
        cs_js_preset_warn: "⚠️ Preset Game: Rosters and flow rules here are for preview only and cannot be modified. To customize, create a new game engine.",
        cs_js_preset_lock: "⚠️ Preset game rosters cannot be modified! Return to home to create a new game.",
        cs_js_preset_lock_btn: "⚠️ Preset game rosters cannot be modified!",
        cs_js_preset_block: "Blocked: Action not allowed!",
        cs_js_prompt_name: "Please enter a name:",
        cs_js_prompt_up: "New Limited/Collab Pool",
        cs_js_prompt_std: "New Standard/Off-rate Pool",
        cs_js_del_pool_conf: "Are you sure you want to delete this entire roster pool and all its data?",
        cs_js_spec_enabled: "✅ <strong>Enabled:</strong> Characters in this standard roster will appear as candidates in the 'Spec-Rate Intervention Altar' of the simulator.",
        cs_js_opt_standalone: "Open Standalone Sidebar Pull",
        cs_js_opt_custom_up: "✨ Allow Custom UP in Simulator",
        cs_js_opt_spec: "Enable Spec-Rate Intervention",
        cs_js_badge_up: "✨ Target Roster (Limited/Collab)",
        cs_js_badge_std: "🎫 Off-rate Roster (Standard/Spec)",
        cs_js_del_btn: "✕ Delete",
        cs_js_add_roster: "Add Roster",
        cs_js_err_name_req: "Please fill in at least the Name or English Name!",
        cs_js_err_pool_null: "Pool not found!",
        cs_js_del_item_conf: "Are you sure you want to delete this item?",
        cs_js_empty_roster: "Please add roster blocks above first.",
        cs_js_mix_del: "✕ Delete Mix Pool",
        cs_js_mix_lbl: "Merge Roster:",
        cs_js_mix_title_1: "1. Multi-Standard Mixed Pool (Mixed Std)",
        cs_js_mix_add: "➕ Add Mixed Pool",
        cs_js_mix_empty: "No mixed pools yet, click the top right button to add.",
        cs_js_mix_title_2: "2. Target Pool 'Off-rate' Flow Rules",
        cs_js_mix_offrate: "Off-rate into:",
        cs_js_err_game_name: "❌ Please enter a game name!",
        cs_js_save_success: "✅ Global tiers and rosters saved successfully!",
        cs_js_del_err_new: "Currently in create mode, no data to delete!",
        cs_js_del_game_conf: "⚠️ WARNING: This will permanently delete all rules, rosters, and pull data for this game!\nAre you sure you want to destroy it?",
        cs_js_del_success: "Successfully deleted!",
        cs_js_base_id: "Base ID: ",

        // === Pool Rules Setup (custom_pool_setup) ===
        cp_main_title: "⚙️ Independent Pool Rules Setup",
        cp_main_desc_1: "Configuring exclusive probability mechanics for ",
        cp_main_desc_2: " Exclusive Probability Config",
        cp_btn_back: "← Back to Dashboard",
        
        cp_sec1_title: "🌟 1. Rarity Enabling & Probability Allocation",
        cp_sec1_total: "Current Total Probability: ",
        cp_sec1_desc: "Tiers below are sourced from global settings. Select tiers to enable for this pool and set their drop rates.",
        cp_sec1_goto_1: "To edit names or colors, go to ",
        cp_sec1_goto_2: "Full Build Center",
        
        cp_sec2_title: "🎯 2. Target High Rarity (Gold) Settings",
        cp_sec2_desc: "Check the rarity tiers that will be treated as 'Hitting Gold / Resetting Pity' in data stats.",
        
        cp_sec3_title: "🎁 3. Multiple Minor Pities (Low Gold/Star Pity)",
        cp_sec3_desc: "Freely set multiple pity rules (e.g., Purple every 10 pulls, Blue every 5 pulls).",
        cp_sec3_note: "Note: Tiers set as 'Target Gold' cannot be selected. Set gold pity below.",
        
        cp_sec4_title: "📈 4. Pity & Dynamic Probability (Soft Pity Steps)",
        cp_sec4_hard: "Hard Pity Threshold (Guaranteed Gold)",
        cp_sec4_hard_ph: "e.g., 90",
        cp_sec4_up: "UP Base Probability (Win Rate %)",
        cp_sec4_up_ph: "e.g., 50",
        cp_sec4_soft_toggle: "Enable Stepped Soft Pity (Dynamic Boost)",
        cp_sec4_soft_desc: "Set multiple intervals. E.g., pulls 63-73 increase by 7% each, 74-80 increase by 3.5% each.",
        
        cp_sec5_title: "🛡️ 5. Great Pity (Fate Points) & Spark Settings",
        cp_sec5_gua_toggle: "Enable Great Pity / Fate Point Mechanic",
        cp_sec5_gua_1: "After missing the UP character ",
        cp_sec5_gua_2: " time(s), the next Gold is guaranteed UP.",
        cp_sec5_gua_note: "(Note: 1 is standard guaranteed UP after losing 50/50; 2 acts like Genshin's Weapon Banner Fate Points)",
        cp_sec5_spark: "Multiple 'Spark' Rules Config:",
        
        cp_sec6_title: "🎁 6. Bonus/Gift Pull Mechanics",
        
        cp_sec7_title: "📌 7. Simulator Preselect Limits",
        cp_sec7_toggle: "Enable Simulator Auto-Preselect / Quantity Limits",
        cp_sec7_up_title: "🏆 Limited UP Preselect Config",
        cp_sec7_std_title: "🏠 Standard Roster Preselect Config",
        cp_sec7_min: "Min Selections",
        cp_sec7_max: "Max Selections",
        cp_sec7_unlimited: "Unlimited",
        
        cp_sec8_title: "🌟 8. Spec-Rate Intervention Settings",
        cp_sec8_toggle: "Enable Spec-Rate Intervention (Custom UP in Simulator)",
        cp_sec8_desc: "When enabled, the 'Spec-Rate Altar' appears in the simulator, allowing players to drag standard characters to boost their rates.",
        cp_sec8_type: "Boost Algorithm",
        cp_sec8_type_1: "Weight Multiplier (e.g., 5x)",
        cp_sec8_type_2: "Fixed Share (e.g., 50%)",
        cp_sec8_val: "Boost Value",
        
        cp_btn_save: "💾 Save [Current Pool] Rules & Return",

        // JS Dynamic Text
        cp_js_prob: "Drop Rate:",
        cp_js_no_tier: "Please enable at least one rarity tier above",
        cp_js_no_avail_tier: "No available tiers",
        cp_js_minor_1: "Reach ",
        cp_js_minor_2: " pulls, guaranteed ",
        cp_js_none: "None",
        cp_js_minor_reset: "Reset if hit early",
        cp_js_soft_1: "Pull ",
        cp_js_soft_start: "Start",
        cp_js_soft_end: "End",
        cp_js_soft_2: ", rate +",
        cp_js_soft_inc: "Prob %",
        cp_js_spark_ph: "Spark Pulls",
        cp_js_spark_once: "Once",
        cp_js_spark_loop: "Loop",
        cp_js_spark_cancel: "Disable spark after hitting UP",
        cp_js_spark_noreset: "Bonus (No pity reset)",
        cp_js_gift_1: "Reach ",
        cp_js_gift_2: " pulls, give ",
        cp_js_gift_3: " free pull(s)",
        cp_js_gift_count: "Free pulls count towards pity",
        cp_js_preset_warn: "⚠️ Preset Game: Pool rules and probabilities here are for preview only. Create a new engine to customize.",
        cp_js_preset_lock_btn: "🔒 Official Preset Rules Cannot Be Modified",
        cp_js_err_tier: "❌ Please enable at least one rarity tier!",
        cp_js_err_prob: "❌ The total probability of all enabled tiers must be 100%!",
        cp_js_err_gold: "❌ Please check at least one [Target High Rarity] as the Gold indicator in Step 2!",
        cp_js_save_ok: "✅ Pool specific probabilities saved successfully!",
        cp_js_syncing: "☁️ Syncing to Cloud...",

        // === Custom Dashboard (custom_dashboard) ===
        cd_title_loading: "Loading...",
        cd_btn_edit_rules: "⚙️ Edit Pool Rules",
        cd_btn_sim: "✨ Simulator",
        cd_btn_input: "Input Data",
        cd_stat_total: "Total Pulls",
        cd_stat_winrate: "Win Rate",
        cd_stat_avg: "Avg Pity",
        cd_stat_pity: "Current Pity",
        cd_modal_add10: "+ 10 Pulls",
        cd_modal_add1: "+ 1 Pull",
        cd_modal_title: "Data Input (Click box to edit)",
        cd_modal_save: "Save & Close",
        
        // JS Dynamic Text
        cd_js_err_invalid: "Invalid game channel!",
        cd_js_custom_game: "Custom Game",
        cd_js_max_pity: "Max Pity: ",
        cd_js_pulls_unit: " Pull(s)",
        cd_js_free_tag: " (Free)",
        cd_js_lost_tag: "Lost",
        cd_js_pity_tag: "Pity",
        cd_js_cur_tag: " (Current)",
        cd_js_set_free: "Set Free",
        cd_js_cancel_free: "Cancel Free",
        cd_js_confirm_cancel_free: "Cancel free status? This will be counted towards normal pity again.",
        cd_js_confirm_set_free: "Pulls in this row will not be counted towards pity. Set as free?",
        cd_js_range_free: "[ Free ]",
        cd_js_pull_prefix: "Pull ",
        cd_js_pull_suffix: "",
        cd_js_uploading: "☁️ Packing and uploading...",
        cd_js_err_no_char: "⚠️ Cannot find characters/items belonging to this rarity tier. Please add corresponding tierId in roster/database first!",
        cd_js_select_item: "Select item:",
        cd_js_pool_up: "Limited UP / Collab",
        cd_js_pool_std: "Standard / Off-rate",
        cd_js_empty: "Empty",

        // === Simulator (simulator) ===
        sim_title: "✨ Custom Gacha Simulator",
        sim_btn_back: "Back to Dashboard",
        sim_h_up: "1. Select Limited UP Items",
        sim_h_std: "2. Select Standard Items (Select All by Default)",
        sim_h_action: "Execute Warp",
        sim_btn_1: "1 Pull",
        sim_btn_10: "10 Pulls",
        sim_btn_100: "100 Pulls",
        sim_ph_custom: "Custom amount",
        sim_btn_pull: "Warp!",
        sim_btn_clear: "Clear Records",
        sim_h_nav: "Quick Navigation (Jump to Gold)",
        sim_btn_prev: "↑ Find Previous Gold",
        sim_btn_next: "↓ Find Next Gold",
        sim_btn_reset_limits: "⟲ Reset One-time Limits (Spark/Gifts)",
        sim_btn_reopen_up: "✨ Reconfigure UP Altar",
        sim_btn_reopen_spec: "🌟 Reconfigure Spec-Rate Intervention",
        sim_h_prob_1: "📊 Next Pull Live Probability (Current Pity: ",
        sim_h_prob_2: ")",
        sim_stat_total: "Total: ",
        sim_stat_gold: "Gold: ",
        sim_stat_spark_dist: "To Spark: ",
        sim_stat_pity: "Pity: ",
        sim_stat_guarantee: "Great Pity: ",
        sim_guarantee_no: "No",
        
        sim_modal_up_title: "✨ Custom Pool: Appoint Target UP ✨",
        sim_modal_up_desc: "Drag and drop desired UP character cards to the altar above.",
        sim_modal_up_altar: "🎯 Current UP Altar",
        sim_modal_up_ph: "⬇️ Drag rosters here ⬇️",
        sim_modal_up_roster: "📦 Base Roster Library",
        sim_modal_up_btn: "🚀 Confirm UP & Start Simulator!",
        
        sim_modal_spec_title: "🌟 Spec-Rate Intervention Config 🌟",
        sim_modal_spec_desc: "Drag standard characters to the intervention zone. When pulling an off-rate gold, the selected characters will have a significantly boosted drop rate.<br><span style='color:#2ecc71;'>(Boost algorithm and value are configured in settings)</span>",
        sim_modal_spec_altar: "🎯 Probability Intervention Altar",
        sim_modal_spec_ph: "⬇️ Drag standard rosters here ⬇️",
        sim_modal_spec_roster: "📦 Standard Roster Library",
        sim_modal_spec_btn: "🚀 Confirm Targets & Return!",

        // JS Dynamic Text
        sim_js_err_invalid: "Invalid game channel!",
        sim_js_title_up_1: "1. Select Limited/Collab Items",
        sim_js_title_std_1: "2. Select Standard Items (Select All by Default)",
        sim_js_title_std_2: "Select Items to Pull (Select All by Default)",
        sim_js_title_up_2: "1. Select Limited UP Items",
        sim_js_title_up_3: "📦 Pullable Items in Roster Library (Please Check)",
        sim_js_title_up_4: "🎯 Limited UP Items to Pull (Please Check)",
        sim_js_title_std_3: "2. Select Standard Items (Unchecked by Default)",
        sim_js_unlimited: "Unlimited",
        sim_js_err_pre_up: "❌ Pull failed: The number of selected UP items does not meet the rules!\nRequired: Min {min}, Max {max}\nCurrent: Selected {count}",
        sim_js_err_pre_std: "❌ Pull failed: The number of selected Standard items does not meet the rules!\nRequired: Min {min}, Max {max}\nCurrent: Selected {count}",
        sim_js_err_up_req: "❌ Please drag at least one character to the altar above as UP!",
        sim_js_err_no_gold: "⚠️ No available standard gold items in the roster library!",
        sim_js_conf_reset: "Are you sure you want to reset all one-time [Spark] and [Gift Pull] records?\n(Triggers will be recounted from 0)",
        sim_js_alert_reset: "✅ One-time limits and counters reset!",
        sim_js_inactive: "Inactive",
        sim_js_yes: "Yes",
        sim_js_need_miss: "Needs ",
        sim_js_times: " more miss(es)",
        sim_js_star: "-Star",
        sim_js_unknown: "Unknown",
        sim_js_std: "Standard",
        sim_js_gold: "Gold",
        sim_js_normal: "Normal",
        sim_js_spark_item: "Spark Item",
        sim_js_spark: "Spark",
        sim_js_err_amount: "❌ Please enter a valid custom pull amount!",
        sim_js_err_no_gold_rec: "⚠️ No gold pulls recorded yet!",
        sim_js_last_gold: "This is already the last gold!",
        sim_js_first_gold: "This is already the first gold!",
        sim_js_free: "Free",
        sim_js_pull_prefix: "Pull ",
        sim_js_pull_range: " - ",
        sim_js_pull_suffix: "",
        sim_js_count_pity: "Counts\nPity",
        sim_js_cur_free: "Current<br>Free",
    }
};

// ==========================================
// 🚀 全局翻译执行引擎
// ==========================================
window.applyTranslations = function() {
    const lang = localStorage.getItem('GM_Lang') || 'zh';
    const t = UI_LIB[lang] || UI_LIB['zh'];

    // 扫描页面中所有带有 data-i18n 属性的元素
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (t[key]) {
            // 如果是输入框，替换 placeholder
            if (el.tagName === 'INPUT' && el.hasAttribute('placeholder')) {
                el.placeholder = t[key];
            } else {
                // 其他普通元素，替换内部 HTML
                el.innerHTML = t[key];
            }
        }
    });
};

// 页面 DOM 加载完毕后自动执行翻译
document.addEventListener('DOMContentLoaded', window.applyTranslations);

// ==========================================
// 🛠️ JS 弹窗专用翻译获取器
// ==========================================
window.getTrans = function(key) {
    const lang = localStorage.getItem('GM_Lang') || 'zh';
    const t = UI_LIB[lang] || UI_LIB['zh'];
    return t[key] || key; // 如果找不到对应的翻译，就直接显示 key 防错
};

window.updatePageLanguage = function() {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (translations[key] && translations[key][sysLang]) {
                // 🌟 智能分流：如果是输入框，就把字放到 placeholder 里
                if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                    el.placeholder = translations[key][sysLang];
                } else {
                    // 普通文本标签依然正常塞入
                    el.innerHTML = translations[key][sysLang];
                }
            }
        });
}
