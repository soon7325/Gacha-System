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
// 2. 初始化游戏列表状态 (修正历史对话残留代码)
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
function getCharImg(name) {
    return SYS_CONFIG.imgFolder + name + SYS_CONFIG.imgExt;
}

// 初始化主题与多语言环境变量
const LANG_KEY = 'GM_Lang';
const THEME_KEY = 'GM_Theme';
let currentLang = localStorage.getItem(LANG_KEY) || 'zh';
let currentTheme = localStorage.getItem(THEME_KEY) || 'dark'; // 获取当前主题，默认为暗色
let currentTargetBox = null;

// 关键操作：在页面加载的第一时间，给 HTML 根节点打上主题标签 (data-theme)，触发 CSS 中的暗色/亮色样式
document.documentElement.setAttribute('data-theme', currentTheme);

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
// 3. 渲染侧边栏 
// (大一统无边界版：支持左侧所有的游戏进行自由拖拽排序交互)
// ==========================================
function renderSidebar() {
    let existingGames = JSON.parse(localStorage.getItem('GM_Custom_Games_List')) || [];
    let modified = false;

    // 1. 从云端同步机制中恢复“孤儿引擎”：
    // 如果本地有 GM_Info 的数据但列表里没有，说明是云端同步下来或是被误删引用的，在这里把它强行塞回主列表显示。
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

    // 2. 确保官方预设游戏都在列表中 (防止初次加载或代码更新时丢失)
    if (typeof PRESET_GAMES_LIST !== 'undefined') {
        PRESET_GAMES_LIST.forEach(preset => {
            if (!existingGames.find(g => g.id === preset.id)) {
                existingGames.push({ id: preset.id, name: preset.gameName });
                modified = true;
            }
        });
    }

    // 统一字段，防止老数据导致取不到名字
    existingGames = existingGames.map(g => ({
        id: g.id,
        name: g.name || g.gameName
    }));

    // 若列表发生过修补，保存大一统后的列表
    if (modified) localStorage.setItem('GM_Custom_Games_List', JSON.stringify(existingGames));

    const sidebar = document.querySelector('.sidebar');
    if (!sidebar) return; // 页面如果没有侧边栏容器则中断执行 (比如弹窗页)
    
    const t = UI_LIB[currentLang] || {};
    // 分析当前浏览器 URL，以此决定给哪个菜单加上“高亮激活 (active)”状态
    const currentFile = window.location.pathname.split('/').pop() || 'index.html';
    const urlParams = new URLSearchParams(window.location.search);
    const currentPool = urlParams.get('pool');
    const currentGameId = urlParams.get('gameId');

    const docTheme = document.documentElement.getAttribute('data-theme') || 'dark';

    // 渲染固定的顶部导航菜单结构 (首页、设置中心、新建引擎)
    sidebar.innerHTML = `
        <div class="sidebar-brand">${t.brand || 'Gacha System'}</div>
        <a href="index.html" class="sidebar-item ${currentFile === 'index.html' ? 'active' : ''}">🏠 ${t.nav_home || '首页 / 关于'}</a>
        <a href="settings.html" class="sidebar-item ${currentFile === 'settings.html' ? 'active' : ''}">⚙️ ${t.nav_settings || '设置中心'}</a>
        
        <div style="margin-bottom: 15px; border-bottom: 1px dashed var(--border); padding-bottom: 10px;">
            <div style="color: #888; font-size: 12px; padding: 5px 10px; margin-top: 10px; margin-bottom: 5px;">${t.dev_options || '开发者选项'}</div>
            <a href="custom_setup.html" class="sidebar-item ${currentFile === 'custom_setup.html' && !currentGameId ? 'active' : ''}">${t.nav_new_engine || '➕ 新建游戏引擎'}</a>
        </div>

        <!-- 游戏列表容器挂载点 -->
        <div id="games-container"></div>
    `;

    const container = document.getElementById('games-container');

    // 初始化折叠记忆状态 (记住用户折叠了哪些游戏菜单，下次刷新不展开)
    let collapseState = JSON.parse(localStorage.getItem('GM_Collapse_State'));
    if (!collapseState) {
        collapseState = {};
        existingGames.forEach(g => {
            // 默认只展开《崩坏：星穹铁道》作为展示，其余折叠
            collapseState[g.id] = (g.name !== "崩坏：星穹铁道" && g.id !== "hsr"); 
        });
        localStorage.setItem('GM_Collapse_State', JSON.stringify(collapseState));
    }

    let dragSrcEl = null; // 记录当前正在被拖拽的 DOM 元素
    let gameIndexCounter = 0; 

    // 循环遍历大名单，渲染每一个游戏的菜单区块
    existingGames.forEach((gameMeta) => {
        const gameId = gameMeta.id;
        const isPreset = typeof PRESET_GAME_IDS !== 'undefined' && PRESET_GAME_IDS.includes(gameId);

        // 预设游戏触发数据初始化，准备被渲染
        if (isPreset) {
            if(!localStorage.getItem('GM_Info_' + gameId)) {
                localStorage.setItem('GM_Info_' + gameId, JSON.stringify({ gameName: gameMeta.name }));
            }
            if (typeof initPresetData === 'function') initPresetData(gameId);
        }

        const gameInfo = safeParse(localStorage.getItem('GM_Info_' + gameId)) || { gameName: gameMeta.name || '未命名游戏' };
        let roster = safeParse(localStorage.getItem('GM_Roster_' + gameId)) || {};
        let rosterPools = safeParse(localStorage.getItem('GM_RosterPools_' + gameId));

        const groupWrapper = document.createElement('div');
        groupWrapper.className = 'sidebar-group-wrapper';

        // 🌟 核心 HTML5 拖拽逻辑：赋能所有游戏区块，允许它们互相替换位置
        groupWrapper.draggable = true;
        groupWrapper.dataset.gameIndex = gameIndexCounter++; 

        // 拖拽开始时：记录自己并降低透明度以示反馈
        groupWrapper.addEventListener('dragstart', function(e) {
            dragSrcEl = this;
            e.dataTransfer.effectAllowed = 'move';
            this.style.opacity = '0.5'; 
        });
        
        // 拖拽经过其他元素上方时：允许放置
        groupWrapper.addEventListener('dragover', function(e) { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; return false; });
        groupWrapper.addEventListener('dragenter', function() { this.classList.add('drag-over'); });
        groupWrapper.addEventListener('dragleave', function() { this.classList.remove('drag-over'); });
        
        // 松开鼠标落下时：交换数据并重绘
        groupWrapper.addEventListener('drop', function(e) {
            e.stopPropagation();
            this.classList.remove('drag-over');
            if (dragSrcEl !== this && dragSrcEl) {
                const fromIdx = parseInt(dragSrcEl.dataset.gameIndex);
                const toIdx = parseInt(this.dataset.gameIndex);
                if (!isNaN(fromIdx) && !isNaN(toIdx)) {
                    // 🌟 核心修改：在统一的大数组里做切片换位
                    const movedItem = existingGames.splice(fromIdx, 1)[0]; // 抽出拖拽的那一项
                    existingGames.splice(toIdx, 0, movedItem);             // 插入到目标位置
                    localStorage.setItem('GM_Custom_Games_List', JSON.stringify(existingGames));
                    renderSidebar(); // 重新渲染，立刻在视觉上刷新顺序
                }
            }
            return false;
        });
        
        // 拖拽结束时恢复样式
        groupWrapper.addEventListener('dragend', function() {
            this.style.opacity = '1';
            document.querySelectorAll('.sidebar-group-wrapper').forEach(el => el.classList.remove('drag-over'));
        });

        // 生成区块的 Header (包含游戏图标、名字、展开/折叠箭头)
        const isCollapsed = collapseState[gameId];
        const header = document.createElement('div');
        header.className = 'sidebar-group-header';
        let displayGameName = currentLang === 'en' ? (gameInfo.enGameName || gameInfo.gameName) : gameInfo.gameName;
        
        // 预设游戏给个手柄图标标识，自定义引擎给个扳手图标
        const titleIcon = isPreset ? '🎮' : '🛠️';
        header.innerHTML = `
            <span>${titleIcon} ${getLocalizedName(gameId, null, displayGameName)}</span>
            <span class="toggle-icon ${isCollapsed ? 'collapsed' : ''}">▼</span>
        `;

        const poolList = document.createElement('div');
        poolList.className = `sidebar-pool-list ${isCollapsed ? 'collapsed' : ''}`;

        // 绑定折叠切换逻辑
        header.addEventListener('click', (e) => {
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

        // 生成具体卡池的点击跳转链接
        const makeLink = (id, name, icon) => {
            const isActive = (currentFile === 'custom_dashboard.html' && currentPool === id && currentGameId === gameId) ? 'active' : '';
            // 🌟 多语言拦截器：对显示的菜单文字进行替换
            const translatedName = getLocalizedName(gameId, id, name);
            return `<a href="custom_dashboard.html?gameId=${gameId}&pool=${id}" class="sidebar-item ${isActive}">${icon} ${translatedName}</a>`;
        };

        let htmlContent = '';

        // 优先尝试读取新版 UI 生成的 rosterPools 积木配置
        if (rosterPools && rosterPools.length > 0) {
            rosterPools.forEach(pool => {
                if (pool.isStandalone !== false) {
                    let icon = pool.type === 'up' ? '✨' : '🎫';
                    let displayPoolName = currentLang === 'en' ? (pool.en || pool.name) : pool.name;
                    htmlContent += makeLink(pool.id, displayPoolName, icon);
                }
            });
            // 追加混合池链接
            let mixedPools = gameInfo.mixedPools || [];
            mixedPools.forEach(mp => {
                let displayMixedName = currentLang === 'en' ? (mp.en || mp.name) : mp.name;
                htmlContent += makeLink(mp.id, displayMixedName, '🔀');
            });
        } else {
            // ==========================================
            // 旧版数据向下兼容机制 (硬编码读取预设规则生成菜单)
            // ==========================================
            const hasMixedRule = localStorage.getItem(`GM_Rules_${gameId}_mixed_std`) !== null;
            const isMixedGame = (gameId === 'hsr' || gameId === 'zzz' || hasMixedRule);
            const hasData = (pool) => roster[pool] && roster[pool].length > 0;

            if (isMixedGame) {
                let combined = [];
                if (roster['char_std']) combined = combined.concat(roster['char_std']);
                if (roster['wep_std']) combined = combined.concat(roster['wep_std']);
                if (combined.length > 0) {
                    const uniqueCombined = [];
                    const names = new Set();
                    for (let item of combined) {
                        if (!names.has(item.name)) { names.add(item.name); uniqueCombined.push(item); }
                    }
                    roster['mixed_std'] = uniqueCombined;
                    localStorage.setItem('GM_Roster_' + gameId, JSON.stringify(roster));
                }
            }

            if (hasData('char_up')) {
                if (!hasData('char_std') && !isMixedGame) htmlContent += makeLink('char_all', '角色池', '👤');
                else htmlContent += makeLink('char_up', '角色限定池', '🌠');
            }
            if (hasData('wep_up')) {
                if (!hasData('wep_std') && !isMixedGame) htmlContent += makeLink('wep_all', '武器池', '🗡️');
                else htmlContent += makeLink('wep_up', '武器限定池', '🌌');
            }
            if (hasData('char_collab')) htmlContent += makeLink('char_collab', '联动角色池', '🤝');
            if (hasData('wep_collab')) htmlContent += makeLink('wep_collab', '联动武器池', '⚔️');
            
            if (isMixedGame && hasData('mixed_std')) {
                htmlContent += makeLink('mixed_std', '混合常驻池', '📦');
            } else {
                if (hasData('char_std')) htmlContent += makeLink('char_std', '常驻角色', '🎫');
                if (hasData('wep_std')) htmlContent += makeLink('wep_std', '常驻武器', '🛡️');
            }
            if (hasData('pet_up')) htmlContent += makeLink('pet_up', '宠物限定', '🐾');
            if (hasData('pet_std')) htmlContent += makeLink('pet_std', '宠物常驻', '🐕');
        }

        // 如果既没规则，又没数据，给出一个空提示
        if (htmlContent === '') {
            htmlContent = `<div style="padding:10px 12px; color:#555; font-size:12px;">尚未配置卡池图鉴</div>`;
        }

        // 在游戏菜单的最底部追加一个入口跳转到“修改图鉴和颜色设定”页面
        const isGameSetupActive = (currentFile === 'custom_setup.html' && currentGameId === gameId) ? 'active' : '';
        htmlContent += `<div style="margin-top: 5px; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 5px;"></div>`;
        
        const setupIcon = isPreset ? '🔒' : '⚙️';
        const setupText = t.nav_game_setup ? t.nav_game_setup.replace('⚙️ ', '') : '游戏配置';
        htmlContent += `<a href="custom_setup.html?gameId=${gameId}" class="sidebar-item ${isGameSetupActive}" style="color: #aaa;">${setupIcon} ${setupText}</a>`;

        poolList.innerHTML = htmlContent;
        groupWrapper.appendChild(poolList);
        container.appendChild(groupWrapper);
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

// ==========================================
// 6. 🚀 FIREBASE 全局同步引擎拦截器
// 采用“偷天换日”技术，监听 LocalStorage 的每一次改变自动上传备份
// ==========================================

// 1. 【核心机制】在执行任何覆写前，必须把原生的 setItem 引用存下来，否则会陷入死循环或致使本地存储失效！
if (!window.originalSetItem) {
    window.originalSetItem = localStorage.setItem;
}
if (!window.originalRemoveItem) {
    window.originalRemoveItem = localStorage.removeItem;
}

// 2. 使用自执行的异步闭包引入 Firebase (避免阻断页面其余内容的渲染)
(async () => {
    // 避免重复加载
    if (window.firebaseInterceptorLoaded) return;
    window.firebaseInterceptorLoaded = true;

    try {
        const { initializeApp, getApps, getApp } = await import("https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js");
        const { getFirestore, doc, setDoc } = await import("https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js");
        const { getAuth, onAuthStateChanged } = await import("https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js");

        const firebaseConfig = {
            apiKey: "AIzaSyBr9xYxp9dQvdf2gkr1ILeEqkn6Bt1CZmI",
            authDomain: "fyp-gacha-system.firebaseapp.com",
            databaseURL: "https://fyp-gacha-system-default-rtdb.asia-southeast1.firebasedatabase.app",
            projectId: "fyp-gacha-system",
            storageBucket: "fyp-gacha-system.firebasestorage.app",
            messagingSenderId: "892136562526",
            appId: "1:892136562526:web:6d2b218ec3f1bc346b79cf"
        };

        const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
        window.firebaseDb = getFirestore(app);
        window.firebaseAuth = getAuth(app);

        // 监听全局的 Auth 登录状态
        onAuthStateChanged(window.firebaseAuth, (user) => {
            if (user) {
                window.firebaseUid = user.uid;
                // 用无拦截的原生方法静默存下 UID，供其他脚本查阅
                window.originalSetItem.call(localStorage, 'GM_UID', user.uid);
            } else {
                window.firebaseUid = null;
                window.originalRemoveItem.call(localStorage, 'GM_UID');
            }
        });

        // 🌟 核心拦截器启动：重写并劫持浏览器全局对象的 localStorage.setItem
        localStorage.setItem = function(key, value) {
            // 首先：乖乖调用原生方法存入本地内存。这一步至关重要，确保页面立刻得到数据反馈不会卡顿
            window.originalSetItem.apply(this, arguments); 
            
            // 定义白名单与黑名单策略：
            
            // 1. 精准匹配黑名单：这些只是用户个人的网页皮肤、折叠设置，无需也没必要同步到云端数据库浪费空间
            const excludedExactKeys = ['GM_Lang', 'GM_Theme', 'GM_Start_Page', 'GM_Prob_Format', 'GM_Custom_Games_List', 'GM_Collapse_State', 'GM_UID'];
            
            // 2. 前缀匹配黑名单：以下重要数据虽然我们要上传，但它们有自己独立专属、支持超大容量分片的同步代码处理（如 custom_rosters 等），所以不让此处的全局拦截器插手，以防止多线程覆盖冲突！
            const excludedPrefixes = [
                'GM_Data_',        // 抽卡记录
                'GM_Info_',        // 引擎配置
                'GM_Roster_',      // 图鉴数据
                'GM_RosterPools_', // 积木池数据
                'GM_Rules_'        // 卡池规则
            ];

            // 检查本次触发是否属于拦截忽略清单
            const isExcludedPrefix = excludedPrefixes.some(prefix => key.startsWith(prefix));

            // 如果：它是符合 GM_ 规范的插件数据 + 不在黑名单内 + 用户处于登录且数据库已连接状态
            // （这意味着未来开发者添加的其他细碎小配置项会被自动备份，无需额外写云端逻辑代码）
            if (key.startsWith('GM_') && !isExcludedPrefix && !excludedExactKeys.includes(key) && window.firebaseUid && window.firebaseDb) {
                const docRef = doc(window.firebaseDb, "users", window.firebaseUid, "user_data", key);
                // 异步抛出上云请求，用 .catch 捕获网络异常而不抛出给主界面
                setDoc(docRef, { data: value }, { merge: true }).catch(e => console.warn("云端同步延迟:", e));
            }
        };

    } catch (error) {
        // 专门拦截 Firebase 的 读写配额额度超限等错误，不影响前端继续运行
        if (error.code === 'resource-exhausted' || error.message.includes('Quota')) {
            console.warn("☁️ 今日云端服务器同步名额已满，转为纯本地无感运行模式。");
        } else {
            console.error("Firebase 初始化失败:", error);
        }
    }
})();