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
    { id: "ark", gameName: "明日方舟" },
    { id: "test", gameName: "测试专用" }
];
// 提取所有预设游戏的 ID，方便后续逻辑（如侧边栏、配置页）判断当前游戏是否为“只读”的预设游戏
const PRESET_GAME_IDS = PRESET_GAMES_LIST.map(g => g.id); 



// ==========================================
// 2. 初始化游戏列表状态与全局UI参数
// ==========================================
const safeParse = (str) => { try { return str && str !== 'undefined' ? JSON.parse(str) : null; } catch(e) { return null; } };

let gamesList = safeParse(localStorage.getItem('GM_Custom_Games_List'));
// 如果本地毫无记录（第一次打开网页），初始化全局预设列表
if (!gamesList || gamesList.length === 0) {
    gamesList = PRESET_GAMES_LIST.filter(game=>window.TestCatalog?.visible(game.id)??game.id!=='test'); 
    localStorage.setItem('GM_Custom_Games_List', JSON.stringify(gamesList));
    
    // 为每一个游戏初始化占位的 Info 基础结构
    gamesList.forEach(g => {
        if(!localStorage.getItem('GM_Info_' + g.id)) {
            localStorage.setItem('GM_Info_' + g.id, JSON.stringify({ gameName: g.gameName }));
        }
    });
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
let currentHeaderLayout = localStorage.getItem(HEADER_LAYOUT_KEY) || 'follow';

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
        PRESET_GAMES_LIST.filter(game=>window.TestCatalog?.visible(game.id)??game.id!=='test').forEach(preset => {
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
    const allExistingGames=existingGames.slice();
    existingGames=existingGames.filter(game=>window.TestCatalog?.visible(game.id)??game.id!=='test');

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
                <span class="sidebar-item-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="m9 3-1 3-3 1-2 4 2 2v3l4 3 3-1 3 1 4-3v-3l2-2-2-4-3-1-1-3Z"/><circle cx="12" cy="11.5" r="3"/></svg></span>
                <span class="sidebar-item-text">${window.getTrans ? window.getTrans('nav_settings') : (t.nav_settings || '设置中心')}</span>
            </a>
            <a href="gallery_setup.html" class="sidebar-item ${currentFile === 'gallery_setup.html' && !currentGameId ? 'active' : ''}" title="${t.nav_new_engine || '新建游戏引擎'}">
                <span class="sidebar-item-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round"><rect x="3" y="3" width="18" height="18" rx="4"/><path d="M12 7v10M7 12h10"/></svg></span>
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
            PresetStorage.initialize(gameId);
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
            window.ListOrder.sort(poolItems, customOrder);
        } else if (gameId === 'zzz') {
            // 绝区零官方标准默认顺序：独家频段 -> 音擎频段 -> 独家重映 -> 音擎回响 -> 常驻频段 -> 喧嚣频段
            const zzzDefaultSort = ['char_up', 'wep_up', 'char_up_2', 'wep_up_2', 'mixed_std', 'bangboo_up'];
            window.ListOrder.sort(poolItems, zzzDefaultSort);
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
        const titleIcon = IconRender.game(gameId, gameInfo.icon);
        const translatedGameName = getLocalizedName(gameId, null, displayGameName);
        
        header.title = `${translatedGameName} (长按拖拽可调整游戏顺序)`;
        header.innerHTML = `
            <span class="sidebar-item-icon" style="margin: 0; min-width: auto; margin-right: 8px;"></span>
            <span class="sidebar-group-header-text" style="flex:1; overflow:hidden; text-overflow:ellipsis;">${translatedGameName}</span>
            <span class="toggle-icon ${isCollapsed ? 'collapsed' : ''}">▼</span>
        `;
        header.querySelector('.sidebar-item-icon').innerHTML = IconRender.html(titleIcon);

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
                <span class="sidebar-item-icon">${IconRender.html(pool.icon)}</span>
                <span class="sidebar-item-text">${translatedName}</span>
            `;

            // 卡池的拖拽事件在本游戏列表渲染完成后统一绑定。

            poolList.appendChild(itemEl);
        });

        // 卡池拖拽仅限当前游戏；数据重排与持久化仍由布局负责。
        DragSort.bind(poolList, '.sidebar-item[data-pool-id]', (fromId, toId, before) => {
            const fromPoolIdx = Number(fromId), toPoolIdx = Number(toId);
            const targetPool = poolItems[toPoolIdx];
            const movedPool = poolItems.splice(fromPoolIdx, 1)[0];
            poolItems.splice(poolItems.indexOf(targetPool) + (before ? 0 : 1), 0, movedPool);

            // 持久化当前游戏的卡池顺序
            const newIdOrder = poolItems.map(p => p.id);
            localStorage.setItem(`GM_Pool_Order_${gameId}`, JSON.stringify(newIdOrder));

            // 🌟 同步更新自定义游戏中的 GM_RosterPools_，让 gallery_setup.html 刷新时完全保持一致
            if (!isPreset) {
                let rosterPools = safeParse(localStorage.getItem('GM_RosterPools_' + gameId)) || [];
                window.ListOrder.sort(rosterPools, newIdOrder);
                localStorage.setItem('GM_RosterPools_' + gameId, JSON.stringify(rosterPools));
    
                // 如果当前正处于 gallery_setup 页面，实时重绘卡池列表
                if (typeof renderCustomPoolsList === 'function') {
                    renderCustomPoolsList();
                }
            }

            renderSidebar();
            if(typeof CustomEvent==='function')window.dispatchEvent(new CustomEvent('pool-order-change',{detail:{gameId}}));
        }, {
            getId: item => item.dataset.poolIndex,
            draggingClass: '', opacity: '0.4'
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
        const setupRow = document.createElement('div');
        setupRow.className = 'sidebar-setup-row';
        setupRow.appendChild(setupLink);
        const setupStates = safeParse(localStorage.getItem('GM_Setup_Collapse_State')) || {};
        const currencyActive = ['currency_setup.html','user_data.html'].includes(currentFile) && currentGameId === gameId;
        const setupExpanded = setupStates[gameId] === false || (setupStates[gameId] === undefined && currencyActive);
        const setupChildren = document.createElement('div');
        setupChildren.className = 'sidebar-setup-children';
        setupChildren.hidden = !setupExpanded;
        setupChildren.id = 'sidebar-setup-' + gameIdx;
        const currencyLink = document.createElement('a');
        currencyLink.href = `user_data.html?gameId=${encodeURIComponent(gameId)}`;
        currencyLink.className = `sidebar-item ${currencyActive ? 'active' : ''}`;
        const currencyIcon = document.createElement('span');
        currencyIcon.className = 'sidebar-item-icon'; currencyIcon.textContent = '📁';
        const currencyLabel = document.createElement('span');
        currencyLabel.className = 'sidebar-item-text';
        currencyLabel.textContent = t.nav_user_data || '玩家数据';
        currencyLink.append(currencyIcon, currencyLabel);
        setupChildren.appendChild(currencyLink);
        const setupToggle = document.createElement('button');
        setupToggle.type = 'button'; setupToggle.className = 'sidebar-setup-toggle';
        setupToggle.setAttribute('aria-controls', setupChildren.id);
        setupToggle.setAttribute('aria-label', t.nav_setup_toggle || '展开或收起配置页');
        setupToggle.setAttribute('aria-expanded', String(setupExpanded));
        setupToggle.textContent = setupExpanded ? '▼' : '▶';
        setupToggle.onclick = event => {
            event.preventDefault(); event.stopPropagation();
            if (sidebar.classList.contains('collapsed')) setSidebarState(false);
            setupChildren.hidden = !setupChildren.hidden;
            setupToggle.textContent = setupChildren.hidden ? '▶' : '▼';
            setupToggle.setAttribute('aria-expanded', String(!setupChildren.hidden));
            const states = safeParse(localStorage.getItem('GM_Setup_Collapse_State')) || {};
            states[gameId] = setupChildren.hidden;
            localStorage.setItem('GM_Setup_Collapse_State', JSON.stringify(states));
        };
        setupRow.appendChild(setupToggle);
        poolList.appendChild(setupRow);
        poolList.appendChild(setupChildren);

        groupWrapper.appendChild(poolList);
        container.appendChild(groupWrapper);
    });

    // 游戏排序只从标题手柄启动；上下半区提示与实际插入方向一致。
    DragSort.bind(container, '.sidebar-group-wrapper', (fromId, toId, before) => {
        const fromIdx = Number(fromId), toIdx = Number(toId);
        if (!Number.isInteger(fromIdx) || !Number.isInteger(toIdx)) return;
        const targetGame = existingGames[toIdx];
        const movedItem = existingGames.splice(fromIdx, 1)[0];
        existingGames.splice(existingGames.indexOf(targetGame) + (before ? 0 : 1), 0, movedItem);
        const visibleIds=new Set(existingGames.map(game=>game.id));let visibleIndex=0;
        const combinedOrder=allExistingGames.map(game=>visibleIds.has(game.id)?existingGames[visibleIndex++]:game);
        localStorage.setItem('GM_Custom_Games_List', JSON.stringify(combinedOrder));
        renderSidebar();
    }, {
        handleSelector: '.sidebar-group-header', handleOnly: true,
        getId: item => item.dataset.gameIndex,
        canDrag: () => !sidebar.classList.contains('collapsed'),
        draggingClass: '', opacity: '0.5'
    });
}

// Homepage corner shortcut; visiting the current changelog still marks the release as read.
(function installUpdatesShortcut() {
    const seenKey = 'GM_Changelog_Last_Seen';
    const isUpdatesPage = () => /(?:^|\/)changelog(?:\.html)?\/?$/i.test(window.location.pathname);
    // Reuse the maintained version title instead of introducing another version number.
    const release = () => window.UI_LIB?.zh?.idx_version_title?.match(/\d+(?:\.\d+)+/)?.[0] || null;
    function text(key, fallback) {
        const value = window.getTrans?.(key);
        return value && value !== key ? value : fallback;
    }
    function refresh() {
        const version = release();
        if (isUpdatesPage()) {
            document.getElementById('updates-shortcut')?.remove();
            // Reading an archived channel must not clear the current release's badge.
            if (version && window.GACHA_IS_LATEST !== false) {
                try { localStorage.setItem(seenKey, version); } catch (_) { /* Navigation still works without storage. */ }
            }
            return;
        }
        if (!document.getElementById('home-deck')) {
            document.getElementById('updates-shortcut')?.remove();
            return;
        }
        let link = document.getElementById('updates-shortcut');
        if (!link) {
            link = document.createElement('a');
            link.id = 'updates-shortcut'; link.className = 'updates-shortcut';
            link.href = 'changelog.html';
            link.setAttribute('data-i18n-title', 'updates_shortcut');
            link.setAttribute('data-i18n-aria-label', 'updates_shortcut');
            const icon = document.createElement('span');
            icon.className = 'updates-shortcut-icon'; icon.setAttribute('aria-hidden', 'true');
            icon.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M8 5H5v16h14V5h-3"/><rect x="8" y="3" width="8" height="4" rx="1.5"/><path d="M8 12h8M8 16h5"/></svg>';
            const label = document.createElement('span');
            label.className = 'updates-shortcut-label'; label.setAttribute('data-i18n', 'updates_shortcut');
            label.textContent = text('updates_shortcut', '更新日志');
            const dot = document.createElement('span');
            dot.className = 'updates-shortcut-dot'; dot.setAttribute('aria-hidden', 'true');
            const status = document.createElement('span');
            status.id = 'updates-shortcut-status'; status.className = 'updates-shortcut-status';
            status.setAttribute('data-i18n', 'updates_unread');
            status.textContent = text('updates_unread', '有尚未查看的版本更新');
            link.title = text('updates_shortcut', '更新日志');
            link.setAttribute('aria-label', link.title);
            link.append(icon, label, dot, status);
            document.body.appendChild(link);
        }
        let seen = null;
        try { seen = localStorage.getItem(seenKey); } catch (_) { /* Badge remains optional. */ }
        const unread = !!version && seen !== version;
        link.querySelector('.updates-shortcut-dot').hidden = !unread;
        link.querySelector('.updates-shortcut-status').hidden = !unread;
        if (unread) link.setAttribute('aria-describedby', 'updates-shortcut-status');
        else link.removeAttribute('aria-describedby');
    }
    document.addEventListener('DOMContentLoaded', refresh);
    window.addEventListener('pageshow', refresh);
    window.addEventListener('storage', event => {
        const key = window.VersionStorage ? window.VersionStorage.eventKey(event.key) : event.key;
        if (key === seenKey || key === null) refresh();
    });
})();
