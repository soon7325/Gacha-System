// ==========================================
// 1. 全局官方预设游戏名单（未来加新游戏只改这里）
// ==========================================
const PRESET_GAMES_LIST = [
    { id: "hsr", gameName: "崩坏：星穹铁道" },
    { id: "zzz", gameName: "绝区零" },
    { id: "end", gameName: "明日方舟：终末地" },
    { id: "ark", gameName: "明日方舟" }
];
const PRESET_GAME_IDS = PRESET_GAMES_LIST.map(g => g.id); // 提取ID方便后续做只读判断

//确保外部调用时能正确获取规则 (原封不动)
function getPoolRules(gameId, poolType) {
    if (PRESET_GAME_IDS.includes(gameId)) {
        if (gameId === 'hsr') return HSR_POOL_RULES[poolType];
        if (gameId === 'zzz') return ZZZ_POOL_RULES[poolType];
        if (gameId === 'end') return END_POOL_RULES[poolType];
        if (gameId === 'ark') return ARK_POOL_RULES[poolType];
        return null;
    } else {
        let ruleStr = localStorage.getItem(`GM_Rules_${gameId}_${poolType}`);
        return ruleStr ? JSON.parse(ruleStr) : null;
    }
}

// ==========================================
// 🚀 终极通用版：预设游戏数据全自动灌入
// ==========================================
function initPresetData(gameId) {
    let POOL_RULES = null, CHAR_DB = [], WEAPON_DB = [], PET_DB = [], SETUP_RULES = {};

    if (gameId === 'hsr') {
        if (typeof HSR_POOL_RULES !== 'undefined') POOL_RULES = HSR_POOL_RULES;
        if (typeof HSR_CHAR_DB !== 'undefined') CHAR_DB = HSR_CHAR_DB;
        if (typeof HSR_WEAPON_DB !== 'undefined') WEAPON_DB = HSR_WEAPON_DB;
        if (typeof HSR_PET_DB !== 'undefined') PET_DB = HSR_PET_DB;
        if (typeof HSR_SETUP_RULES !== 'undefined') SETUP_RULES = HSR_SETUP_RULES;
    } else if (gameId === 'zzz') {
        if (typeof ZZZ_POOL_RULES !== 'undefined') POOL_RULES = ZZZ_POOL_RULES;
        if (typeof ZZZ_CHAR_DB !== 'undefined') CHAR_DB = ZZZ_CHAR_DB;
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

    let currentInfo = JSON.parse(localStorage.getItem('GM_Info_' + gameId)) || {};
    if (Object.keys(SETUP_RULES).length > 0) {
        currentInfo = Object.assign(currentInfo, SETUP_RULES);
        // 🛡️ 强制覆写幽灵缓存：Object.assign 不会删除独有的旧属性，必须手动清洗！
        currentInfo.mixedPools = SETUP_RULES.mixedPools ? JSON.parse(JSON.stringify(SETUP_RULES.mixedPools)) : [];
        currentInfo.offRate = SETUP_RULES.offRate ? JSON.parse(JSON.stringify(SETUP_RULES.offRate)) : {};
    } else {
        const preset = PRESET_GAMES_LIST.find(g => g.id === gameId);
        if (preset) currentInfo.gameName = preset.gameName;
    }
    localStorage.setItem('GM_Info_' + gameId, JSON.stringify(currentInfo));

    // 🌟 核心修复：自动遍历 db_hsr.js 里的所有规则并保存，彻底解除命名限制！
    if (POOL_RULES) {
        Object.keys(POOL_RULES).forEach(poolKey => {
            localStorage.setItem(`GM_Rules_${gameId}_${poolKey}`, JSON.stringify(POOL_RULES[poolKey]));
            if (poolKey === 'mixed_std') {
                localStorage.setItem(`GM_Rules_${gameId}_mixed_std_enabled`, "true");
            }
        });
        
        // 保留旧版联动的兜底机制
        if (!POOL_RULES.char_collab && POOL_RULES.char_up) localStorage.setItem(`GM_Rules_${gameId}_char_collab`, JSON.stringify(POOL_RULES.char_up));
        if (!POOL_RULES.wep_collab && POOL_RULES.wep_up) localStorage.setItem(`GM_Rules_${gameId}_wep_collab`, JSON.stringify(POOL_RULES.wep_up));
    }

    // 3. 注入图鉴到本地缓存 (全新无限制动态解析引擎)
    let roster = JSON.parse(localStorage.getItem('GM_Roster_' + gameId)) || {};
    if (Object.keys(roster).length === 0 || CHAR_DB.length > 0 || WEAPON_DB.length > 0 || PET_DB.length > 0) {
        
        roster = {}; // 清空旧有死板结构

        const processDynamicDB = (dbArray, prefix) => {
            if (!dbArray) return;
            dbArray.forEach(item => {
                let types = Array.isArray(item.type) ? item.type : [item.type];
                types.forEach(t => {
                    // 🌟 终极前缀智能修复：只要没有 char/wep/pet 前缀，就自动补全！
                    let key = (t.startsWith('char_') || t.startsWith('wep_') || t.startsWith('pet_')) ? t : `${prefix}_${t}`;
                    if (!roster[key]) roster[key] = [];
                    roster[key].push(item);
                });
            });
        };

        processDynamicDB(CHAR_DB, 'char');
        processDynamicDB(WEAPON_DB, 'wep');
        processDynamicDB(PET_DB, 'pet');

        // 🌟 终极混池修复：彻底解决读不到图鉴的问题
        if (SETUP_RULES.mixedPools && SETUP_RULES.mixedPools.length > 0) {
            SETUP_RULES.mixedPools.forEach(mp => {
                let combinedItems = [];
                (mp.components || []).forEach(compId => {
                    // 暴力兼容：防止前缀不匹配导致读不到图鉴
                    let targetId = roster[compId] ? compId : (compId.startsWith('char_') || compId.startsWith('wep_') ? compId : 'char_' + compId);
                    if (roster[targetId]) {
                        combinedItems = combinedItems.concat(roster[targetId]);
                    }
                });
                // 深度去重
                roster[mp.id] = combinedItems.filter((item, index, self) => index === self.findIndex(t => t.name === item.name));
            });
        } else {
            roster.mixed_std = [...(roster.char_std || []), ...(roster.wep_std || []), ...(roster.pet_std || [])];
        }

        // 兜底防空跑
        if(!roster.char_up || roster.char_up.length === 0) roster.char_up = [{name: "测试角色", short: "测", type: ["up"]}];

        localStorage.setItem(`GM_Roster_${gameId}`, JSON.stringify(roster));
    }

    // 🌟 核心对接新版引擎：将字典转化为 UI 所需的积木池 RosterPools 数组
    if (SETUP_RULES.rosterPools) {
        let newPools = JSON.parse(JSON.stringify(SETUP_RULES.rosterPools));
        newPools.forEach(p => {
            let items = roster[p.id] || [];
            // 兼容性优化：把以前标记为 spec (特限) 的角色，自动融合回 std 常驻图鉴显示
            if (p.type === 'std') {
                let specKey = p.id.replace('std', 'spec');
                if (roster[specKey]) items = items.concat(roster[specKey]);
            }
            // 去重处理
            p.items = items.filter((item, index, self) => index === self.findIndex(t => t.name === item.name));
        });
        localStorage.setItem(`GM_RosterPools_${gameId}`, JSON.stringify(newPools));
    }
}

// ==========================================
// 2. 初始化游戏列表 (修正历史对话残留代码)
// ==========================================
const safeParse = (str) => { try { return str && str !== 'undefined' ? JSON.parse(str) : null; } catch(e) { return null; } };
let gamesList = safeParse(localStorage.getItem('GM_Custom_Games_List'));
if (gamesList) {
    // 🧹 自动清理历史遗留的旧版废弃 ID，把幽灵超度掉
    gamesList = gamesList.filter(g => g.id !== 'end' && g.id !== 'ark');
    localStorage.setItem('GM_Custom_Games_List', JSON.stringify(gamesList));
}
if (!gamesList || gamesList.length === 0) {
    // 直接使用上面的全局名单，避免重复硬编码
    gamesList = [...PRESET_GAMES_LIST]; 
    localStorage.setItem('GM_Custom_Games_List', JSON.stringify(gamesList));
    
    gamesList.forEach(g => {
        if(!localStorage.getItem('GM_Info_' + g.id)) {
            localStorage.setItem('GM_Info_' + g.id, JSON.stringify({ gameName: g.gameName }));
        }
    });
}

// 专门用来生成图片路径的聪明函数
function getCharImg(name) {
    return SYS_CONFIG.imgFolder + name + SYS_CONFIG.imgExt;
}

const LANG_KEY = 'GM_Lang';
const THEME_KEY = 'GM_Theme'; // 新增主题配置 Key
let currentLang = localStorage.getItem(LANG_KEY) || 'zh';
let currentTheme = localStorage.getItem(THEME_KEY) || 'dark'; // 获取当前主题，默认为暗色
let currentTargetBox = null;

// 关键：在页面加载的第一时间，给 HTML 根节点打上主题标签
document.documentElement.setAttribute('data-theme', currentTheme);

// 🌐 侧边栏专属多语言拦截器
function getLocalizedName(gameId, poolId, originalName) {
    // 判断是不是官方预设的游戏 (PRESET_GAME_IDS 在你 layout.js 顶部定义了)
    const isPreset = PRESET_GAME_IDS.includes(gameId);
    
    // 如果不是预设游戏，或者是用户自己新增的自定义卡池，直接原样返回
    if (!isPreset) return originalName;

    // 组合字典 Key (如果是翻译游戏名，poolId 传 null)
    let key = poolId ? `pool_${gameId}_${poolId}` : `game_${gameId}`;
    
    // 去字典里找翻译
    let translated = window.getTrans ? window.getTrans(key) : key;
    
    // 如果字典里没有这个词条（返回了 key 本身），兜底使用原名
    return translated !== key ? translated : originalName;
}

// ==========================================
// 3. 渲染侧边栏 (大一统无边界版：支持全游戏自由拖拽排序)
// ==========================================
function renderSidebar() {
    let existingGames = JSON.parse(localStorage.getItem('GM_Custom_Games_List')) || [];
    let modified = false;

    // 1. 恢复从云端拉下来的孤儿引擎
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

    // 统一名称字段，防止旧数据报错
    existingGames = existingGames.map(g => ({
        id: g.id,
        name: g.name || g.gameName
    }));

    // 保存大一统后的列表顺序
    if (modified) localStorage.setItem('GM_Custom_Games_List', JSON.stringify(existingGames));

    const sidebar = document.querySelector('.sidebar');
    if (!sidebar) return;
    const t = UI_LIB[currentLang] || {};
    const currentFile = window.location.pathname.split('/').pop() || 'index.html';
    const urlParams = new URLSearchParams(window.location.search);
    const currentPool = urlParams.get('pool');
    const currentGameId = urlParams.get('gameId');

    // 判断当前是什么主题，决定显示的文案和图标
    const docTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    const themeIcon = docTheme === 'dark' ? '☀️' : '🌙';
    const themeText = docTheme === 'dark' ? '亮色模式' : '暗色模式';

    // 固化顶部导航顺序
    // 固化顶部导航顺序
    sidebar.innerHTML = `
        <div class="sidebar-brand">${t.brand || 'Gacha System'}</div>
        <a href="index.html" class="sidebar-item ${currentFile === 'index.html' ? 'active' : ''}">🏠 ${t.nav_home || '首页 / 关于'}</a>
        <a href="settings.html" class="sidebar-item ${currentFile === 'settings.html' ? 'active' : ''}">⚙️ ${t.nav_settings || '设置中心'}</a>
        
        <div style="margin-bottom: 15px; border-bottom: 1px dashed var(--border); padding-bottom: 10px;">
            <div style="color: #888; font-size: 12px; padding: 5px 10px; margin-top: 10px; margin-bottom: 5px;">${t.dev_options || '开发者选项'}</div>
            <a href="custom_setup.html" class="sidebar-item ${currentFile === 'custom_setup.html' && !currentGameId ? 'active' : ''}">${t.nav_new_engine || '➕ 新建游戏引擎'}</a>
        </div>

        <div id="games-container"></div>
    `;

    const container = document.getElementById('games-container');

    // 初始化折叠记忆状态
    let collapseState = JSON.parse(localStorage.getItem('GM_Collapse_State'));
    if (!collapseState) {
        collapseState = {};
        existingGames.forEach(g => {
            collapseState[g.id] = (g.name !== "崩坏：星穹铁道" && g.id !== "hsr"); 
        });
        localStorage.setItem('GM_Collapse_State', JSON.stringify(collapseState));
    }

    let dragSrcEl = null;
    let gameIndexCounter = 0; 

    // 循环渲染每一个游戏区块（现在只有一个统一的 existingGames 数组）
    existingGames.forEach((gameMeta) => {
        const gameId = gameMeta.id;
        const isPreset = typeof PRESET_GAME_IDS !== 'undefined' && PRESET_GAME_IDS.includes(gameId);

        // 如果是预设游戏，在此处触发底层数据更新，但不影响 UI 排序
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

        // 🌟 核心修改：所有游戏一视同仁，统统允许拖拽排序！
        groupWrapper.draggable = true;
        groupWrapper.dataset.gameIndex = gameIndexCounter++; 

        groupWrapper.addEventListener('dragstart', function(e) {
            dragSrcEl = this;
            e.dataTransfer.effectAllowed = 'move';
            this.style.opacity = '0.5'; 
        });
        groupWrapper.addEventListener('dragover', function(e) { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; return false; });
        groupWrapper.addEventListener('dragenter', function() { this.classList.add('drag-over'); });
        groupWrapper.addEventListener('dragleave', function() { this.classList.remove('drag-over'); });
        groupWrapper.addEventListener('drop', function(e) {
            e.stopPropagation();
            this.classList.remove('drag-over');
            if (dragSrcEl !== this && dragSrcEl) {
                const fromIdx = parseInt(dragSrcEl.dataset.gameIndex);
                const toIdx = parseInt(this.dataset.gameIndex);
                if (!isNaN(fromIdx) && !isNaN(toIdx)) {
                    // 🌟 核心修改：在统一的大数组里做切片换位
                    const movedItem = existingGames.splice(fromIdx, 1)[0];
                    existingGames.splice(toIdx, 0, movedItem);
                    localStorage.setItem('GM_Custom_Games_List', JSON.stringify(existingGames));
                    renderSidebar(); // 重新渲染刷新顺序
                }
            }
            return false;
        });
        groupWrapper.addEventListener('dragend', function() {
            this.style.opacity = '1';
            document.querySelectorAll('.sidebar-group-wrapper').forEach(el => el.classList.remove('drag-over'));
        });

        const isCollapsed = collapseState[gameId];
        const header = document.createElement('div');
        header.className = 'sidebar-group-header';
        let displayGameName = currentLang === 'en' ? (gameInfo.enGameName || gameInfo.gameName) : gameInfo.gameName;
        
        // 预设游戏给个特殊的图标标识，如果是自定义引擎就给个扳手图标
        const titleIcon = isPreset ? '🎮' : '🛠️';
        header.innerHTML = `
            <span>${titleIcon} ${getLocalizedName(gameId, null, displayGameName)}</span>
            <span class="toggle-icon ${isCollapsed ? 'collapsed' : ''}">▼</span>
        `;

        const poolList = document.createElement('div');
        poolList.className = `sidebar-pool-list ${isCollapsed ? 'collapsed' : ''}`;

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

        const makeLink = (id, name, icon) => {
            const isActive = (currentFile === 'custom_dashboard.html' && currentPool === id && currentGameId === gameId) ? 'active' : '';
            // 🌟 在这里包一层拦截器，统一把传入的 name 翻译掉！
            const translatedName = getLocalizedName(gameId, id, name);
            return `<a href="custom_dashboard.html?gameId=${gameId}&pool=${id}" class="sidebar-item ${isActive}">${icon} ${translatedName}</a>`;
        };

        let htmlContent = '';

        if (rosterPools && rosterPools.length > 0) {
            rosterPools.forEach(pool => {
                if (pool.isStandalone !== false) {
                    let icon = pool.type === 'up' ? '✨' : '🎫';
                    let displayPoolName = currentLang === 'en' ? (pool.en || pool.name) : pool.name;
                    htmlContent += makeLink(pool.id, displayPoolName, icon);
                }
            });
            let mixedPools = gameInfo.mixedPools || [];
            mixedPools.forEach(mp => {
                let displayMixedName = currentLang === 'en' ? (mp.en || mp.name) : mp.name;
                htmlContent += makeLink(mp.id, displayMixedName, '🔀');
            });
        } else {
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

        if (htmlContent === '') {
            htmlContent = `<div style="padding:10px 12px; color:#555; font-size:12px;">尚未配置卡池图鉴</div>`;
        }

        const isGameSetupActive = (currentFile === 'custom_setup.html' && currentGameId === gameId) ? 'active' : '';
        htmlContent += `<div style="margin-top: 5px; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 5px;"></div>`;
        
        // 预设游戏的配置按钮给个上锁图标提示一下
        const setupIcon = isPreset ? '🔒' : '⚙️';
        // 读取字典里的 nav_game_setup，并移除自带的齿轮 emoji 防止重复
        const setupText = t.nav_game_setup ? t.nav_game_setup.replace('⚙️ ', '') : '游戏配置';
        htmlContent += `<a href="custom_setup.html?gameId=${gameId}" class="sidebar-item ${isGameSetupActive}" style="color: #aaa;">${setupIcon} ${setupText}</a>`;

        poolList.innerHTML = htmlContent;
        groupWrapper.appendChild(poolList);
        container.appendChild(groupWrapper);
    });
}

// 弹出添加菜单 (彻底告别无响应版)
function showAddMenu(e) {
    e.stopPropagation();
    let menu = document.getElementById('addMenu');
    
    // 每次点击都重新生成菜单，确保没有任何旧事件残留
    if (menu) {
        menu.remove();
    }
    
    menu = document.createElement('div');
    menu.id = 'addMenu';
    menu.className = 'add-menu';
    document.body.appendChild(menu);
    
    const t = UI_LIB[currentLang];

    // 创建【添加十连】按钮
    const btnTen = document.createElement('div');
    btnTen.className = 'menu-item';
    btnTen.innerText = t.modal_add_ten || '添加十连';
    btnTen.onclick = function(event) {
        event.stopPropagation();
        if (typeof window.createEditRow === 'function') {
            window.createEditRow(10);
        } else {
            console.error("找不到 createEditRow 函数，请检查 hsr_char.html");
        }
        menu.style.display = 'none';
    };

    // 创建【添加单抽】按钮
    const btnOne = document.createElement('div');
    btnOne.className = 'menu-item';
    btnOne.innerText = t.modal_add_one || '添加单抽';
    btnOne.onclick = function(event) {
        event.stopPropagation();
        if (typeof window.createEditRow === 'function') {
            window.createEditRow(1);
        } else {
            console.error("找不到 createEditRow 函数，请检查 hsr_char.html");
        }
        menu.style.display = 'none';
    };

    // 把按钮塞进菜单
    menu.appendChild(btnTen);
    menu.appendChild(btnOne);

    // 设置位置和样式
    menu.style.display = 'block';
    menu.style.left = e.clientX + 'px';
    menu.style.top = e.clientY + 'px';

    // 点击页面其他地方关闭菜单
    const closeMenu = () => {
        menu.style.display = 'none';
        window.removeEventListener('click', closeMenu);
    };
    setTimeout(() => window.addEventListener('click', closeMenu), 10);
}

// 弹窗控制
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
// 预设游戏只读锁 (自动禁用配置页)
// ==========================================
function applyPresetReadOnlyLock() {
    const urlParams = new URLSearchParams(window.location.search);
    const gameId = urlParams.get('gameId');

    // 如果当前没有 gameId (新建模式) 或者不是预设游戏，直接放行
    if (!gameId || !PRESET_GAME_IDS.includes(gameId)) return;

    // 1. 注入顶部警告横幅
    const container = document.querySelector('.setup-container');
    if (container) {
        const warningDiv = document.createElement('div');
        warningDiv.style = "background: rgba(255, 193, 7, 0.15); border: 1px solid #ffc107; color: #ffc107; padding: 15px; border-radius: 8px; margin-bottom: 20px; text-align: center; font-weight: bold; display: flex; align-items: center; justify-content: center; gap: 10px;";
        warningDiv.innerHTML = "<span>⚠️</span> 系统预设游戏：当前界面配置与概率机制仅供预览，不可修改。如需自定义，请新建游戏引擎。";
        // 插入到标题下方
        container.insertBefore(warningDiv, container.children[1] || container.firstChild);
    }

    // 2. 禁用所有输入框和下拉菜单
    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach(el => {
        el.disabled = true;
        el.style.opacity = '0.5';
        el.style.cursor = 'not-allowed';
    });

    // 3. 隐藏所有 保存、删除、添加 的操作按钮
    const actionBtns = document.querySelectorAll('.btn-primary, .btn-danger, .btn-action-gray');
    actionBtns.forEach(btn => btn.style.display = 'none');

    // 4. 针对图鉴页 (custom_setup.html) 的特殊处理：隐藏添加卡片
    const addCards = document.querySelectorAll('.add-btn-card');
    addCards.forEach(card => card.style.display = 'none');

    // 5. 针对图鉴页：拦截已有角色的点击编辑事件，并隐藏删除按钮
    const observer = new MutationObserver(() => {
        // 拦截点击
        const charCards = document.querySelectorAll('.char-card');
        charCards.forEach(card => {
            card.removeAttribute('onclick'); 
            card.onclick = (e) => {
                e.stopPropagation();
                e.preventDefault();
                alert("⚠️ 系统预设游戏的图鉴不可修改！");
            };
        });

        // 统一类名为 .del-badge (与 custom_setup.html 保持严格一致)
        const deleteBtns = document.querySelectorAll('.del-badge');
        deleteBtns.forEach(btn => btn.style.display = 'none');
    });
    observer.observe(document.body, { childList: true, subtree: true });

    // 6. 暴力覆盖页面的保存函数，彻底堵死按回车或控制台调用的漏洞
    window.saveSettings = function() { alert("拦截：预设不可保存"); };
    window.savePoolConfig = function() { alert("拦截：预设不可保存"); };
    window.deleteEntireGame = function() { alert("拦截：预设不可删除"); };
}

// ==========================================
// 🚀 FIREBASE 全局同步引擎 (拦截 LocalStorage 自动上云)
// ==========================================

// 1. 【核心修复】必须先备份原生的本地存储方法，否则会引发 JS 崩溃导致侧栏消失！
if (!window.originalSetItem) {
    window.originalSetItem = localStorage.setItem;
}
if (!window.originalRemoveItem) {
    window.originalRemoveItem = localStorage.removeItem;
}

// 2. 整合版 Firebase 初始化与拦截器
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

        // 监听全局登录状态
        onAuthStateChanged(window.firebaseAuth, (user) => {
            if (user) {
                window.firebaseUid = user.uid;
                window.originalSetItem.call(localStorage, 'GM_UID', user.uid);
            } else {
                window.firebaseUid = null;
                window.originalRemoveItem.call(localStorage, 'GM_UID');
            }
        });

        // 🌟 核心拦截器：任何页面执行 localStorage.setItem 都会触发这里
        localStorage.setItem = function(key, value) {
            // 先乖乖存入本地 (保证你的页面逻辑丝滑运行不卡顿)
            window.originalSetItem.apply(this, arguments); 
            
            // 1. 精准匹配的黑名单 (界面设置与侧边栏排序，纯本地运行不上传)
            const excludedExactKeys = ['GM_Lang', 'GM_Theme', 'GM_Start_Page', 'GM_Prob_Format', 'GM_Custom_Games_List', 'GM_Collapse_State', 'GM_UID'];
            
            // 2. 前缀匹配的黑名单 (已经有专属文件夹处理的核心数据，拦截器不再插手)
            const excludedPrefixes = [
                'GM_Data_',        // 抽卡记录 -> 专属 gacha_records 文件夹
                'GM_Info_',        // 引擎配置 -> 专属 custom_engines 文件夹
                'GM_Roster_',      // 图鉴数据 -> 专属 custom_rosters 文件夹
                'GM_RosterPools_', // 积木池数据 -> 专属 custom_rosters 文件夹
                'GM_Rules_'        // 卡池规则 -> 专属 custom_rules 文件夹
            ];

            // 检查当前存入的键是否以黑名单前缀开头
            const isExcludedPrefix = excludedPrefixes.some(prefix => key.startsWith(prefix));

            // 只有漏网之鱼（未来可能的其他小配置）才会走这里上传到 user_data
            if (key.startsWith('GM_') && !isExcludedPrefix && !excludedExactKeys.includes(key) && window.firebaseUid && window.firebaseDb) {
                const docRef = doc(window.firebaseDb, "users", window.firebaseUid, "user_data", key);
                setDoc(docRef, { data: value }, { merge: true }).catch(e => console.warn("云端同步延迟:", e));
            }
        };

    } catch (error) {
        // 专门拦截 Firebase 的额度超限等错误
        if (error.code === 'resource-exhausted' || error.message.includes('Quota')) {
            console.warn("☁️ 今日云端服务器同步名额已满，转为本地运行模式。");
        } else {
            console.error("Firebase 初始化失败:", error);
        }
    }
})();