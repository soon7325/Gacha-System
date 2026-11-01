/**
 * 公共页面运行时。
 *
 * 职责：初始化官方/自定义游戏的 LocalStorage 数据、渲染可拖拽的侧边栏、
 * 维护主题与语言状态；数据仅保存在本地，不再加载云端 SDK 或拦截存储方法。
 * 页面依赖顺序：各游戏 db_*.js → 翻译脚本 → 本文件。
 */

// ==========================================
// 1. 全局官方预设游戏名单
// 维护官方原生支持的游戏列表（未来加新游戏只需在此处和对应的 db_xxx.js 中添加）
// ==========================================
const PRESET_GAMES_LIST = [
    { id: "hsr", gameName: "崩坏：星穹铁道" },
    { id: "zzz", gameName: "绝区零" },
    { id: "end", gameName: "明日方舟：终末地" },
    { id: "ark", gameName: "明日方舟" }
];
// 提取所有预设游戏的 ID，方便后续逻辑（如侧边栏、配置页）判断当前游戏是否为“只读”的预设游戏
const PRESET_GAME_IDS = PRESET_GAMES_LIST.map(g => g.id); 
// 归档与主站共用图片目录；只调整显示地址，不改写继承的图鉴数据。
function archiveImageUrl(value) {
    return typeof value==='string'?value.replace(/^(?:\.\.\/)*img\//,'../img/'):value;
}

/**
 * 跨文件获取卡池规则的通用方法
 * @param {string} gameId 游戏ID
 * @param {string} poolType 卡池类型 (如 char_up, wep_std)
 * @returns {Object|null} 返回解析后的卡池规则对象
 */
function getPoolRules(gameId, poolType) {
    // 如果是官方预设游戏，直接从全局常量（在 db_xxx.js 中定义）读取内存数据，保证读取速度和数据新鲜度
    if (PRESET_GAME_IDS.includes(gameId)) {
        if (gameId === 'hsr') return HSR_POOL_RULES[poolType];
        if (gameId === 'zzz') return ZZZ_POOL_RULES[poolType];
        if (gameId === 'end') return END_POOL_RULES[poolType];
        if (gameId === 'ark') return ARK_POOL_RULES[poolType];
        return null;
    } else {
        // 如果是用户自建游戏，则从本地缓存 LocalStorage 读取用户自己配置的规则
        let ruleStr = localStorage.getItem(`GM_Rules_${gameId}_${poolType}`);
        return ruleStr ? JSON.parse(ruleStr) : null;
    }
}

// ==========================================
// 🚀 终极通用版：预设游戏数据全自动灌入
// 负责在页面初始化时，将官方配置（数据库、保底规则等）强行注入到本地缓存中
// ==========================================
function initPresetData(gameId) {
    // 初始化临时变量，准备接收从全局环境拉取的数据
    let POOL_RULES = null, CHAR_DB = [], WEAPON_DB = [], PET_DB = [], SETUP_RULES = {};

    // 智能匹配对应的官方数据源
    if (gameId === 'hsr') {
        if (typeof HSR_POOL_RULES !== 'undefined') POOL_RULES = HSR_POOL_RULES;
        if (typeof HSR_CHAR_DB !== 'undefined') CHAR_DB = HSR_CHAR_DB;
        if (typeof HSR_WEAPON_DB !== 'undefined') WEAPON_DB = HSR_WEAPON_DB;
        if (typeof HSR_PET_DB !== 'undefined') PET_DB = HSR_PET_DB;
        if (typeof HSR_SETUP_RULES !== 'undefined') SETUP_RULES = HSR_SETUP_RULES;
    } else if (gameId === 'zzz') {
        if (typeof ZZZ_POOL_RULES !== 'undefined') POOL_RULES = ZZZ_POOL_RULES;
        if (typeof ZZZ_CHAR_DB !== 'undefined') CHAR_DB = ZZZ_CHAR_DB;
        // 兼容不同的变量名写法 (WEP vs WEAPON)
        if (typeof ZZZ_WEP_DB !== 'undefined') WEAPON_DB = ZZZ_WEP_DB;
        if (typeof ZZZ_WEAPON_DB !== 'undefined') WEAPON_DB = ZZZ_WEAPON_DB;
        if (typeof ZZZ_PET_DB !== 'undefined') PET_DB = ZZZ_PET_DB;
        if (typeof ZZZ_SETUP_RULES !== 'undefined') SETUP_RULES = ZZZ_SETUP_RULES;
    } else if (gameId === 'end') {
        if (typeof END_POOL_RULES !== 'undefined') POOL_RULES = END_POOL_RULES;
        if (typeof END_CHAR_DB !== 'undefined') CHAR_DB = END_CHAR_DB;
        if (typeof END_WEAPON_DB !== 'undefined') WEAPON_DB = END_WEAPON_DB;
        if (typeof END_PET_DB !== 'undefined') PET_DB = END_PET_DB;
        if (typeof END_SETUP_RULES !== 'undefined') SETUP_RULES = END_SETUP_RULES;
    } else if (gameId === 'ark') {
        if (typeof ARK_POOL_RULES !== 'undefined') POOL_RULES = ARK_POOL_RULES;
        if (typeof ARK_CHAR_DB !== 'undefined') CHAR_DB = ARK_CHAR_DB;
        if (typeof ARK_WEAPON_DB !== 'undefined') WEAPON_DB = ARK_WEAPON_DB;
        if (typeof ARK_PET_DB !== 'undefined') PET_DB = ARK_PET_DB;
        if (typeof ARK_SETUP_RULES !== 'undefined') SETUP_RULES = ARK_SETUP_RULES;
    }

    // 1. 注入基础设定 (Game Info)
    let currentInfo = JSON.parse(localStorage.getItem('GM_Info_' + gameId)) || {};
    if (Object.keys(SETUP_RULES).length > 0) {
        // 合并配置
        currentInfo = Object.assign(currentInfo, SETUP_RULES);
        
        // 🛡️ 强制覆写幽灵缓存核心修复：
        // Object.assign 不会删除独有的旧属性。如果旧数据里有个混池，新数据去掉了，它依然会残留。
        // 因此这里使用深拷贝重新赋值，强行清洗掉历史遗留脏数据。
        currentInfo.mixedPools = SETUP_RULES.mixedPools ? JSON.parse(JSON.stringify(SETUP_RULES.mixedPools)) : [];
        currentInfo.offRate = SETUP_RULES.offRate ? JSON.parse(JSON.stringify(SETUP_RULES.offRate)) : {};
    } else {
        // 兜底：如果连规则都没有，至少给个游戏名
        const preset = PRESET_GAMES_LIST.find(g => g.id === gameId);
        if (preset) currentInfo.gameName = preset.gameName;
    }
    localStorage.setItem('GM_Info_' + gameId, JSON.stringify(currentInfo));

    // 2. 注入卡池概率规则
    // 🌟 核心修复：自动遍历 db_xxx.js 里的所有规则并保存，解除写死命名的限制！
    if (POOL_RULES) {
        Object.keys(POOL_RULES).forEach(poolKey => {
            localStorage.setItem(`GM_Rules_${gameId}_${poolKey}`, JSON.stringify(POOL_RULES[poolKey]));
            // 针对特定标志位处理 (如混池开关)
            if (poolKey === 'mixed_std') {
                localStorage.setItem(`GM_Rules_${gameId}_mixed_std_enabled`, "true");
            }
        });
        
        // 保留旧版代码对联动池 (collab) 的兜底机制，如果没有配联动池则直接套用 UP 池规则
        if (!POOL_RULES.char_collab && POOL_RULES.char_up) localStorage.setItem(`GM_Rules_${gameId}_char_collab`, JSON.stringify(POOL_RULES.char_up));
        if (!POOL_RULES.wep_collab && POOL_RULES.wep_up) localStorage.setItem(`GM_Rules_${gameId}_wep_collab`, JSON.stringify(POOL_RULES.wep_up));
    }

    // 3. 注入图鉴到本地缓存 (全新无限制动态解析引擎)
    let roster = JSON.parse(localStorage.getItem('GM_Roster_' + gameId)) || {};
    // 只有当本地为空，或者代码里查到了 DB 数据时才执行注入
    if (Object.keys(roster).length === 0 || CHAR_DB.length > 0 || WEAPON_DB.length > 0 || PET_DB.length > 0) {
        
        roster = {}; // 清空旧有死板结构，准备接收全新的动态结构

        // 动态解析函数：根据 prefix (前缀) 自动给数据分门别类
        const processDynamicDB = (dbArray, prefix) => {
            if (!dbArray) return;
            dbArray.forEach(item => {
                let types = Array.isArray(item.type) ? item.type : [item.type];
                types.forEach(t => {
                    // 🌟 终极前缀智能修复：如果数据库里写的是 "up"，自动补全为 "char_up"。如果本来就是 "char_up" 则原样保留。
                    let key = (t.startsWith('char_') || t.startsWith('wep_') || t.startsWith('pet_')) ? t : `${prefix}_${t}`;
                    if (!roster[key]) roster[key] = [];
                    roster[key].push(item); // 推入对应的图鉴分类数组
                });
            });
        };

        processDynamicDB(CHAR_DB, 'char');
        processDynamicDB(WEAPON_DB, 'wep');
        processDynamicDB(PET_DB, 'pet');

        // 🌟 终极混池修复：彻底解决混合池（如原神集录祈愿）读不到图鉴的问题
        if (SETUP_RULES.mixedPools && SETUP_RULES.mixedPools.length > 0) {
            SETUP_RULES.mixedPools.forEach(mp => {
                let combinedItems = [];
                (mp.components || []).forEach(compId => {
                    // 暴力兼容前缀：防止配置文件和数据库之间的命名约定不匹配
                    let targetId = roster[compId] ? compId : (compId.startsWith('char_') || compId.startsWith('wep_') ? compId : 'char_' + compId);
                    if (roster[targetId]) {
                        combinedItems = combinedItems.concat(roster[targetId]);
                    }
                });
                // 深度去重：防止同一个角色存在于多个组内被重复添加（根据 name 唯一性去重）
                roster[mp.id] = combinedItems.filter((item, index, self) => index === self.findIndex(t => t.name === item.name));
            });
        } else {
            // 如果没有特设混合池，兜底生成一个常驻大杂烩池 (包含角色、武器、宠物)
            roster.mixed_std = [...(roster.char_std || []), ...(roster.wep_std || []), ...(roster.pet_std || [])];
        }

        // 兜底防空跑机制：防止系统报错崩溃
        if(!roster.char_up || roster.char_up.length === 0) roster.char_up = [{name: "测试角色", short: "测", type: ["up"]}];

        // 写入硬盘
        localStorage.setItem(`GM_Roster_${gameId}`, JSON.stringify(roster));
    }

    // 4. 🌟 核心对接新版引擎：将打平的 roster 字典转化为 UI 所需的积木池 (RosterPools) 数组格式
    if (SETUP_RULES.rosterPools) {
        let newPools = JSON.parse(JSON.stringify(SETUP_RULES.rosterPools));
        newPools.forEach(p => {
            let items = roster[p.id] || [];
            // 兼容性优化：把以前独立分离出去的 spec (特限角色)，自动融合回 std 常驻图鉴，方便统一展示和配置
            if (p.type === 'std') {
                let specKey = p.id.replace('std', 'spec');
                if (roster[specKey]) items = items.concat(roster[specKey]);
            }
            // 依然需要去重
            p.items = items.filter((item, index, self) => index === self.findIndex(t => t.name === item.name));
        });
        localStorage.setItem(`GM_RosterPools_${gameId}`, JSON.stringify(newPools));
    }
}

// ==========================================
// 2. 初始化游戏列表状态与全局UI参数
// ==========================================
const safeParse = (str) => { try { return str && str !== 'undefined' ? JSON.parse(str) : null; } catch(e) { return null; } };

let gamesList = safeParse(localStorage.getItem('GM_Custom_Games_List'));
if (gamesList) {
    // 🧹 自动清理历史遗留的旧版废弃预设 ID (如果它们已经重命名或不再支持)，把幽灵超度掉
    gamesList = gamesList.filter(g => g.id !== 'end' && g.id !== 'ark');
    localStorage.setItem('GM_Custom_Games_List', JSON.stringify(gamesList));
}

// 如果本地毫无记录（第一次打开网页），初始化全局预设列表
if (!gamesList || gamesList.length === 0) {
    gamesList = [...PRESET_GAMES_LIST]; 
    localStorage.setItem('GM_Custom_Games_List', JSON.stringify(gamesList));
    
    // 为每一个游戏初始化占位的 Info 基础结构
    gamesList.forEach(g => {
        if(!localStorage.getItem('GM_Info_' + g.id)) {
            localStorage.setItem('GM_Info_' + g.id, JSON.stringify({ gameName: g.gameName }));
        }
    });
}

// 辅助函数：根据配置获取图片路径
/** 返回旧版通用角色图路径；新版图鉴优先使用条目自身的 img 字段。 */
function getCharImg(name) {
    return SYS_CONFIG.imgFolder + name + SYS_CONFIG.imgExt;
}

// 初始化主题与排版等多语言环境变量
const LANG_KEY = 'GM_Lang';
const THEME_KEY = 'GM_Theme';
const IS_CHANGELOG_PAGE = /(?:^|\/)changelog(?:\.html)?\/?$/i.test(window.location.pathname);
const LAYOUT_KEY = IS_CHANGELOG_PAGE ? 'GM_Changelog_Layout' : 'GM_Dashboard_Layout'; 
const HEADER_LAYOUT_KEY = IS_CHANGELOG_PAGE ? 'GM_Changelog_Header_Layout' : 'GM_Dashboard_Header_Layout';

let currentLang = localStorage.getItem(LANG_KEY) || 'zh';
let currentTheme = localStorage.getItem(THEME_KEY) || 'dark'; // 获取当前主题，默认为暗色
let currentLayout = localStorage.getItem(LAYOUT_KEY) || 'center'; // 🌟 获取当前布局，默认为居中
if (currentLayout === 'full' && !IS_CHANGELOG_PAGE) currentLayout = 'center';
let currentHeaderLayout = localStorage.getItem(HEADER_LAYOUT_KEY) || 'full';
let currentTargetBox = null;

// 关键操作：在页面加载的第一时间，给 HTML 根节点打上主题和排版的标记
document.documentElement.setAttribute('data-theme', currentTheme);
document.documentElement.setAttribute('data-layout', currentLayout);
document.documentElement.setAttribute('data-header-layout', currentHeaderLayout);

// 🌐 侧边栏专属多语言拦截器
function getLocalizedName(gameId, poolId, originalName) {
    // 判断是不是官方预设的游戏
    const isPreset = PRESET_GAME_IDS.includes(gameId);
    
    // 如果不是预设游戏（用户自定义的），直接原样返回，不参与官方字典翻译
    if (!isPreset) return originalName;

    // 组合字典 Key。如果有 poolId 说明是在翻译具体卡池；否则是在翻译游戏本体名字
    let key = poolId ? `pool_${gameId}_${poolId}` : `game_${gameId}`;
    
    // 尝试去多语言字典里找翻译（需配合 translate.js 提供的 getTrans 方法使用）
    let translated = window.getTrans ? window.getTrans(key) : key;
    
    // 如果字典里没有这个词条（返回了 key 本身），则兜底使用原本写死的名字
    return translated !== key ? translated : originalName;
}

// ==========================================
// 3. 渲染侧边栏 (双层拖拽引擎：支持游戏分类拖拽 & 游戏内部卡池拖拽)
// ==========================================
/**
 * 从 GM_Custom_Games_List、GM_Info_* 与 GM_RosterPools_* 组合导航。
 * 同时修复仅残留配置的“孤儿”自定义游戏，并保存侧栏的展开状态和排序。
 */
function renderSidebar() {
    // 切换语言后重绘时读取最新偏好，不能继续使用首次加载的语言。
    currentLang = localStorage.getItem(LANG_KEY) || 'zh';
    let existingGames = JSON.parse(localStorage.getItem('GM_Custom_Games_List')) || [];
    let modified = false;

    // 1. 恢复孤儿游戏引擎
    for (let i = 0; i < localStorage.length; i++) {
        let key = localStorage.key(i);
        if (key && key.startsWith('GM_Info_g_')) {
            let gId = key.replace('GM_Info_', '');
            if (!existingGames.find(g => g.id === gId)) {
                let info = JSON.parse(localStorage.getItem(key));
                existingGames.push({ id: gId, name: info.gameName || '☁️ 云端恢复的游戏' });
                modified = true;
            }
        }
    }

    // 2. 确保官方预设游戏都在列表中
    if (typeof PRESET_GAMES_LIST !== 'undefined') {
        PRESET_GAMES_LIST.forEach(preset => {
            if (!existingGames.find(g => g.id === preset.id)) {
                existingGames.push({ id: preset.id, name: preset.gameName });
                modified = true;
            }
        });
    }

    existingGames = existingGames.map(g => ({
        id: g.id,
        name: g.name || g.gameName
    }));

    if (modified) localStorage.setItem('GM_Custom_Games_List', JSON.stringify(existingGames));

    // 动态注入遮罩
    let backdrop = document.querySelector('.sidebar-backdrop');
    if (!backdrop) {
        backdrop = document.createElement('div');
        backdrop.className = 'sidebar-backdrop';
        document.body.appendChild(backdrop);
    }

    const storedCollapsed = localStorage.getItem('GM_Sidebar_Collapsed');
    const isSidebarCollapsed = storedCollapsed === null ? true : (storedCollapsed === 'true');

    const sidebar = document.querySelector('.sidebar');
    if (!sidebar) return;
    
    const t = (typeof UI_LIB !== 'undefined' && UI_LIB[currentLang]) ? UI_LIB[currentLang] : {};
    
    const currentFile = (window.location.pathname.replace(/\/+$/, '').split('/').pop() || 'index').replace(/\.html$/i, '') + '.html';
    const urlParams = new URLSearchParams(window.location.search);
    const currentPool = urlParams.get('pool');
    const currentGameId = urlParams.get('gameId');

    if (isSidebarCollapsed) {
        sidebar.classList.add('collapsed');
        backdrop.classList.remove('active');
    } else {
        sidebar.classList.remove('collapsed');
        backdrop.classList.add('active');
    }

    function setSidebarState(collapse) {
        if (collapse) {
            sidebar.classList.add('collapsed');
            backdrop.classList.remove('active');
            localStorage.setItem('GM_Sidebar_Collapsed', 'true');
            if (toggleBtn) toggleBtn.title = currentLang === 'en' ? 'Expand Sidebar' : '展开侧边栏';
            // 只收起侧栏外壳，不改变各游戏的展开状态，避免再次打开或跳页时状态跳变。
        } else {
            sidebar.classList.remove('collapsed');
            backdrop.classList.add('active');
            localStorage.setItem('GM_Sidebar_Collapsed', 'false');
            if (toggleBtn) toggleBtn.title = currentLang === 'en' ? 'Collapse Sidebar' : '收起侧边栏';
        }
    }

    sidebar.innerHTML = `
        <div class="sidebar-header">
            <a href="index.html" class="sidebar-brand" title="${t.nav_home || '首页 / 关于'}">${t.brand || 'Gacha System'}</a>
            <button class="sidebar-toggle-btn" id="sidebar-toggle" title="${isSidebarCollapsed ? '展开侧边栏' : '收起侧边栏'}">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="3" y1="12" x2="21" y2="12"></line>
                    <line x1="3" y1="6" x2="21" y2="6"></line>
                    <line x1="3" y1="18" x2="21" y2="18"></line>
                </svg>
            </button>
        </div>

        <div id="games-container"></div>
        
        <div class="sidebar-bottom-nav">
            <a href="settings.html" class="sidebar-item ${currentFile === 'settings.html' ? 'active' : ''}" title="${window.getTrans ? window.getTrans('nav_settings') : (t.nav_settings || '设置中心')}">
                <span class="sidebar-item-icon">⚙️</span>
                <span class="sidebar-item-text">${window.getTrans ? window.getTrans('nav_settings') : (t.nav_settings || '设置中心')}</span>
            </a>
            <a href="gallery_setup.html" class="sidebar-item ${currentFile === 'gallery_setup.html' && !currentGameId ? 'active' : ''}" title="${t.nav_new_engine || '新建游戏引擎'}">
                <span class="sidebar-item-icon">➕</span>
                <span class="sidebar-item-text">${t.nav_new_engine || '新建游戏引擎'}</span>
            </a>
        </div>
    `;

    const toggleBtn = document.getElementById('sidebar-toggle');
    if (toggleBtn) {
        toggleBtn.onclick = (e) => {
            e.stopPropagation();
            setSidebarState(!sidebar.classList.contains('collapsed'));
        };
    }

    backdrop.onclick = () => setSidebarState(true);
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        mainContent.onclick = () => {
            if (!sidebar.classList.contains('collapsed')) setSidebarState(true);
        };
    }

    const container = document.getElementById('games-container');

    let collapseState = JSON.parse(localStorage.getItem('GM_Collapse_State')) || {};
    // 拖拽来源与高亮由 DragSort 各自维护，游戏与卡池互不干扰.

    // ==========================================
    // 循环渲染每个游戏区块
    // ==========================================
    existingGames.forEach((gameMeta, gameIdx) => {
        const gameId = gameMeta.id;
        const isPreset = typeof PRESET_GAME_IDS !== 'undefined' && PRESET_GAME_IDS.includes(gameId);

        if (isPreset) {
            if (!localStorage.getItem('GM_Info_' + gameId)) {
                localStorage.setItem('GM_Info_' + gameId, JSON.stringify({ gameName: gameMeta.name }));
            }
            if (typeof initPresetData === 'function') initPresetData(gameId);
        }

        const gameInfo = safeParse(localStorage.getItem('GM_Info_' + gameId)) || { gameName: gameMeta.name || '未命名游戏' };

        // 🌟 1. 组装当前游戏应该包含的卡池完整清单（统一名称与图标）
        let poolItems = [];
        const customOrder = safeParse(localStorage.getItem(`GM_Pool_Order_${gameId}`));

            if (isPreset) {
            // 官方预设：优先读取 db_xxx.js 中的 POOL_RULES
            const gamePrefix = gameId.toUpperCase();
            let poolRules = null;
            try { poolRules = new Function(`return typeof ${gamePrefix}_POOL_RULES !== 'undefined' ? ${gamePrefix}_POOL_RULES : undefined`)(); } catch(e){}
            
            if (poolRules) {
                Object.keys(poolRules).forEach(pId => {
                    const p = poolRules[pId];
                    const info = p.info || {};
                    poolItems.push({
                        id: pId,
                        name: info.name || pId,
                        en: info.en || info.name || pId,
                        icon: info.icon || (pId.includes('wep') ? '🗡️' : (pId.includes('bangboo') ? '🐾' : (pId.includes('std') ? '🏠' : '✨')))
                    });
                });
            } else {
                // 🌟 兜底：如果当前页面（如首页/设置页）未载入对应 db_xxx.js，使用预设通用卡池清单
                const presetDefaultMap = {
                    'hsr': [
                        { id: 'char_up', name: '角色活动跃迁', en: 'Character Event Warp', icon: '🌠' },
                        { id: 'wep_up', name: '光锥活动跃迁', en: 'Light Cone Event Warp', icon: '🌌' },
                        { id: 'mixed_std', name: '常驻跃迁', en: 'Standard Warp', icon: '📦' }
                    ],
                    'zzz': [
                        { id: 'char_up', name: '独家频段', en: 'Exclusive Channel', icon: '👤' },
                        { id: 'wep_up', name: '音擎频段', en: 'W-Engine Channel', icon: '🗡️' },
                        { id: 'char_up_2', name: '独家重映', en: 'Exclusive Channel 2', icon: '🔄' },
                        { id: 'wep_up_2', name: '音擎回响', en: 'W-Engine Channel 2', icon: '🔄' },
                        { id: 'mixed_std', name: '常驻频段', en: 'Standard Channel', icon: '🏠' },
                        { id: 'bangboo_up', name: '喧嚣频段', en: 'Bangboo Channel', icon: '🐾' }
                    ],
                    'end': [
                        { id: 'char_up', name: '特态寻访', en: 'Event Headhunting', icon: '🌠' },
                        { id: 'wep_up', name: '武器装备', en: 'Weapon Headhunting', icon: '🌌' },
                        { id: 'mixed_std', name: '标准寻访', en: 'Standard Headhunting', icon: '📦' }
                    ],
                    'ark': [
                        { id: 'char_up', name: '限定寻访', en: 'Limited Headhunting', icon: '🌠' },
                        { id: 'char_std', name: '标准寻访', en: 'Standard Headhunting', icon: '🎫' }
                    ]
                };

                let rosterPools = safeParse(localStorage.getItem('GM_RosterPools_' + gameId)) || [];
                if (rosterPools.length > 0) {
                    rosterPools.forEach(p => {
                        if (p.isStandalone !== false) {
                            poolItems.push({
                                id: p.id,
                                name: p.name,
                                en: p.en || p.name,
                                icon: p.icon || (p.type === 'up' ? '✨' : '🎫')
                            });
                        }
                    });
                } else if (presetDefaultMap[gameId]) {
                    poolItems = [...presetDefaultMap[gameId]];
                }
            }
        } else {
            // 用户自建游戏：读取 rosterPools 与 mixedPools
            let rosterPools = safeParse(localStorage.getItem('GM_RosterPools_' + gameId)) || [];
            rosterPools.forEach(p => {
                if (p.isStandalone !== false) {
                    poolItems.push({
                        id: p.id,
                        name: p.name,
                        en: p.en || p.name,
                        // 自定义卡池优先使用保存的 Emoji，与配置页保持一致。
                        icon: p.icon || (p.type === 'up' ? '✨' : '🎫')
                    });
                }
            });
            let mixedPools = gameInfo.mixedPools || [];
            mixedPools.forEach(mp => {
                poolItems.push({
                    id: mp.id,
                    name: mp.name,
                    en: mp.en || mp.name,
                    icon: '🔀'
                });
            });
        }

        // 🌟 过滤掉临时待删除名单中的卡池
        const pendingDeleted = safeParse(sessionStorage.getItem(`GM_Pending_Deleted_Pools_${gameId}`)) || [];
        if (pendingDeleted.length > 0) {
            poolItems = poolItems.filter(p => !pendingDeleted.includes(p.id));
        }

        // 🌟 2. 排序控制：如果用户曾自定义拖拽过顺序，按用户的来；否则应用推荐默认排序
        if (customOrder && Array.isArray(customOrder)) {
            poolItems.sort((a, b) => {
                let idxA = customOrder.indexOf(a.id);
                let idxB = customOrder.indexOf(b.id);
                if (idxA === -1) idxA = 999;
                if (idxB === -1) idxB = 999;
                return idxA - idxB;
            });
        } else if (gameId === 'zzz') {
            // 绝区零官方标准默认顺序：独家频段 -> 音擎频段 -> 独家重映 -> 音擎回响 -> 常驻频段 -> 喧嚣频段
            const zzzDefaultSort = ['char_up', 'wep_up', 'char_up_2', 'wep_up_2', 'mixed_std', 'bangboo_up'];
            poolItems.sort((a, b) => {
                let idxA = zzzDefaultSort.indexOf(a.id);
                let idxB = zzzDefaultSort.indexOf(b.id);
                if (idxA === -1) idxA = 999;
                if (idxB === -1) idxB = 999;
                return idxA - idxB;
            });
        }

        // ==========================================
        // 游戏分类外壳 (仅允许通过 Header 拖拽移动游戏大分类)
        // ==========================================
        const groupWrapper = document.createElement('div');
        groupWrapper.className = 'sidebar-group-wrapper';
        groupWrapper.dataset.gameIndex = gameIdx;

        // 只有用户明确保存为 false 时才展开；未设置的新游戏默认收起。
        // 游戏状态与侧栏外壳独立，重新渲染不会把 undefined 当成“展开”。
        const isCollapsed = collapseState[gameId] !== false;
        const header = document.createElement('div');
        header.className = 'sidebar-group-header';
        header.draggable = true; // 🌟 仅头部可拖拽整个大分类，避免与内部卡池拖拽冲突
        header.style.cursor = 'grab';

        let displayGameName = currentLang === 'en' ? (gameInfo.enGameName || gameInfo.gameName) : gameInfo.gameName;
        const titleIcon = gameInfo.icon || (isPreset ? '🎮' : '🛠️');
        const translatedGameName = getLocalizedName(gameId, null, displayGameName);
        
        header.title = `${translatedGameName} (长按拖拽可调整游戏顺序)`;
        header.innerHTML = `
            <span class="sidebar-item-icon" style="margin: 0; min-width: auto; margin-right: 8px;"></span>
            <span class="sidebar-group-header-text" style="flex:1; overflow:hidden; text-overflow:ellipsis;">${translatedGameName}</span>
            <span class="toggle-icon ${isCollapsed ? 'collapsed' : ''}">▼</span>
        `;
        header.querySelector('.sidebar-item-icon').textContent = titleIcon;

        // 标题的拖拽事件在所有游戏渲染完成后统一绑定。

        // 折叠切换
        header.addEventListener('click', (e) => {
            if (sidebar.classList.contains('collapsed')) {
                setSidebarState(false);
                poolList.classList.remove('collapsed');
                header.querySelector('.toggle-icon').classList.remove('collapsed');
                collapseState[gameId] = false;
                localStorage.setItem('GM_Collapse_State', JSON.stringify(collapseState));
                return;
            }
            const icon = header.querySelector('.toggle-icon');
            const currentlyCollapsed = poolList.classList.contains('collapsed');
            if (currentlyCollapsed) {
                poolList.classList.remove('collapsed');
                icon.classList.remove('collapsed');
                collapseState[gameId] = false; 
            } else {
                poolList.classList.add('collapsed');
                icon.classList.add('collapsed');
                collapseState[gameId] = true;  
            }
            localStorage.setItem('GM_Collapse_State', JSON.stringify(collapseState));
        });

        groupWrapper.appendChild(header);

        // ==========================================
        // 卡池列表容器 (内部卡池支持独立拖拽调序)
        // ==========================================
        const poolList = document.createElement('div');
        poolList.className = `sidebar-pool-list ${isCollapsed ? 'collapsed' : ''}`;

        poolItems.forEach((pool, poolIdx) => {
            const isPoolPage = currentFile === 'dashboard.html' || currentFile === 'simulator.html';
            const isActive = (isPoolPage && currentPool === pool.id && currentGameId === gameId) ? 'active' : '';
            const translatedName = getLocalizedName(gameId, pool.id, currentLang === 'en' ? pool.en : pool.name);

            const itemEl = document.createElement('a');
            itemEl.href = `dashboard.html?gameId=${gameId}&pool=${pool.id}`;
            itemEl.className = `sidebar-item ${isActive}`;
            itemEl.title = `${translatedName} (可拖拽微调排序)`;
            itemEl.draggable = true;
            itemEl.dataset.poolId = pool.id;
            itemEl.dataset.poolIndex = poolIdx;

            itemEl.innerHTML = `
                <span class="sidebar-item-icon">${pool.icon}</span>
                <span class="sidebar-item-text">${translatedName}</span>
            `;

            // 卡池的拖拽事件在本游戏列表渲染完成后统一绑定。

            poolList.appendChild(itemEl);
        });

        // 卡池拖拽仅限当前游戏；数据重排与持久化仍由布局负责。
        DragSort.bind(poolList, '.sidebar-item[data-pool-id]', (fromId, toId) => {
            const fromPoolIdx = Number(fromId), toPoolIdx = Number(toId);
            const movedPool = poolItems.splice(fromPoolIdx, 1)[0];
            poolItems.splice(toPoolIdx, 0, movedPool);

            // 持久化当前游戏的卡池顺序
            const newIdOrder = poolItems.map(p => p.id);
            localStorage.setItem(`GM_Pool_Order_${gameId}`, JSON.stringify(newIdOrder));

            // 🌟 同步更新自定义游戏中的 GM_RosterPools_，让 gallery_setup.html 刷新时完全保持一致
            if (!isPreset) {
                let rosterPools = safeParse(localStorage.getItem('GM_RosterPools_' + gameId)) || [];
                rosterPools.sort((a, b) => {
                    let idxA = newIdOrder.indexOf(a.id);
                    let idxB = newIdOrder.indexOf(b.id);
                    return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB);
                });
                localStorage.setItem('GM_RosterPools_' + gameId, JSON.stringify(rosterPools));
    
                // 如果当前正处于 gallery_setup 页面，实时重绘卡池列表
                if (typeof renderCustomPoolsList === 'function') {
                    renderCustomPoolsList();
                }
            }

            renderSidebar();
        }, {
            position: 'target', getId: item => item.dataset.poolIndex,
            draggingClass: '', opacity: '0.4', hoverBorder: true
        });

        // 底部游戏配置跳转链接
        const isGameSetupActive = (currentFile === 'gallery_setup.html' && currentGameId === gameId) ? 'active' : '';
        const divider = document.createElement('div');
        divider.style = "margin-top: 5px; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 5px;";
        poolList.appendChild(divider);

        const setupLink = document.createElement('a');
        setupLink.href = `gallery_setup.html?gameId=${gameId}`;
        setupLink.className = `sidebar-item ${isGameSetupActive}`;
        setupLink.style.color = '#aaa';
        setupLink.innerHTML = `
            <span class="sidebar-item-icon">${isPreset ? '🔒' : '⚙️'}</span>
            <span class="sidebar-item-text">${t.nav_game_setup ? t.nav_game_setup.replace('⚙️ ', '') : '游戏配置'}</span>
        `;
        poolList.appendChild(setupLink);

        groupWrapper.appendChild(poolList);
        container.appendChild(groupWrapper);
    });

    // 游戏排序只从标题手柄启动，侧栏收起时不允许拖拽；保留目标索引插入方式。
    DragSort.bind(container, '.sidebar-group-wrapper', (fromId, toId) => {
        const fromIdx = Number(fromId), toIdx = Number(toId);
        if (!Number.isInteger(fromIdx) || !Number.isInteger(toIdx)) return;
        const movedItem = existingGames.splice(fromIdx, 1)[0];
        existingGames.splice(toIdx, 0, movedItem);
        localStorage.setItem('GM_Custom_Games_List', JSON.stringify(existingGames));
        renderSidebar();
    }, {
        position: 'target', handleSelector: '.sidebar-group-header', handleOnly: true,
        getId: item => item.dataset.gameIndex,
        canDrag: () => !sidebar.classList.contains('collapsed'),
        draggingClass: '', opacity: '0.5', hoverClass: 'drag-over'
    });
}

// ==========================================
// 4. 弹出添加菜单与其他弹窗控件
// ==========================================
function showAddMenu(e) {
    e.stopPropagation();
    let menu = document.getElementById('addMenu');
    
    // 每次点击都重新生成 HTML 菜单，防止产生隐性的旧事件监听残留
    if (menu) {
        menu.remove();
    }
    
    menu = document.createElement('div');
    menu.id = 'addMenu';
    menu.className = 'add-menu';
    document.body.appendChild(menu);
    
    const t = UI_LIB[currentLang];

    // 选项 1：添加十连块
    const btnTen = document.createElement('div');
    btnTen.className = 'menu-item';
    btnTen.innerText = t.modal_add_ten || '添加十连';
    btnTen.onclick = function(event) {
        event.stopPropagation();
        if (typeof window.createEditRow === 'function') {
            window.createEditRow(10);
        } else {
            console.error("找不到 createEditRow 函数");
        }
        menu.style.display = 'none';
    };

    // 选项 2：添加单抽块
    const btnOne = document.createElement('div');
    btnOne.className = 'menu-item';
    btnOne.innerText = t.modal_add_one || '添加单抽';
    btnOne.onclick = function(event) {
        event.stopPropagation();
        if (typeof window.createEditRow === 'function') {
            window.createEditRow(1);
        }
        menu.style.display = 'none';
    };

    menu.appendChild(btnTen);
    menu.appendChild(btnOne);

    // 根据鼠标点击位置放置悬浮菜单
    menu.style.display = 'block';
    menu.style.left = e.clientX + 'px';
    menu.style.top = e.clientY + 'px';

    // 监听：点击页面其他任何空白区域关闭菜单
    const closeMenu = () => {
        menu.style.display = 'none';
        window.removeEventListener('click', closeMenu);
    };
    setTimeout(() => window.addEventListener('click', closeMenu), 10);
}

// 控制全屏模态框（如：数据录入界面）
function openModal() {
    const modal = document.getElementById('modalOverlay');
    if (modal) modal.style.display = 'flex';
}

function closeModal() {
    const modal = document.getElementById('modalOverlay');
    if (modal) modal.style.display = 'none';
    if (typeof saveAndRender === 'function') saveAndRender();
}

// ==========================================
// 5. 预设游戏只读锁 (自动禁用配置页)
// 保护系统核心数据免遭小白瞎改导致崩溃
// ==========================================
function applyPresetReadOnlyLock() {
    const urlParams = new URLSearchParams(window.location.search);
    const gameId = urlParams.get('gameId');

    // 只有在修改官方游戏引擎时，才上锁
    if (!gameId || !PRESET_GAME_IDS.includes(gameId)) return;

    // 1. 注入顶部显眼的黄色警告横幅
    const container = document.querySelector('.setup-container');
    if (container) {
        const warningDiv = document.createElement('div');
        warningDiv.style = "background: rgba(255, 193, 7, 0.15); border: 1px solid #ffc107; color: #ffc107; padding: 15px; border-radius: 8px; margin-bottom: 20px; text-align: center; font-weight: bold; display: flex; align-items: center; justify-content: center; gap: 10px;";
        warningDiv.innerHTML = "<span>⚠️</span> 系统预设游戏：当前界面配置与概率机制仅供预览，不可修改。如需自定义，请新建游戏引擎。";
        container.insertBefore(warningDiv, container.children[1] || container.firstChild);
    }

    // 2. 将页面上所有的 input 输入框和下拉选项变灰禁用
    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach(el => {
        el.disabled = true;
        el.style.opacity = '0.5';
        el.style.cursor = 'not-allowed';
    });

    // 3. 抹除所有保存、删除、添加按钮
    const actionBtns = document.querySelectorAll('.btn-primary, .btn-danger, .btn-action-gray');
    actionBtns.forEach(btn => btn.style.display = 'none');

    // 4. 抹除图鉴增加卡片
    const addCards = document.querySelectorAll('.add-btn-card');
    addCards.forEach(card => card.style.display = 'none');

    // 5. 使用 MutationObserver 监听后来由 JS 动态渲染生成出来的组件
    const observer = new MutationObserver(() => {
        // 剥夺图鉴卡片的点击事件
        const charCards = document.querySelectorAll('.char-card');
        charCards.forEach(card => {
            card.removeAttribute('onclick'); 
            card.onclick = (e) => {
                e.stopPropagation();
                e.preventDefault();
                alert("⚠️ 系统预设游戏的图鉴不可修改！");
            };
        });

        // 隐藏卡片上的红色小叉叉删除按钮
        const deleteBtns = document.querySelectorAll('.del-badge');
        deleteBtns.forEach(btn => btn.style.display = 'none');
    });
    observer.observe(document.body, { childList: true, subtree: true });

    // 6. 暴力替换掉全局核心业务逻辑，彻底堵死按回车或通过浏览器控制台发起调用的漏洞
    window.saveSettings = function() { alert("拦截：预设不可保存"); };
    window.savePoolConfig = function() { alert("拦截：预设不可保存"); };
    window.deleteEntireGame = function() { alert("拦截：预设不可删除"); };
}

// 云端实现已移除：保持浏览器原生 localStorage 方法，不做后台上传。
