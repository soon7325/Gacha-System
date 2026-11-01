/**
 * 设置：偏好回显、设置变更、本地备份与提示弹窗。
 * 由 settings.html 底部加载，保持原先的依赖和执行顺序。
 * 使用普通 script，全局函数仍可供 HTML 内联 onclick 调用。
 */
// 设置和账户模块继续使用原来的调用名，弹窗行为交给公共组件。
const settingsDialog = Dialog.create({ cancelDisplay: 'block' });
window.customAlert = settingsDialog.alert;
window.customConfirm = settingsDialog.confirm;

        function syncSimulatorDependentPrefs() {
            const prefs = window.AppPreferences.simulator();
            document.getElementById('simCurrencyModeToggle').checked = prefs.currency;
            document.getElementById('simStartSetupToggle').checked = prefs.start;
            document.getElementById('simKeepRecordsToggle').checked = prefs.records;
            document.getElementById('simRememberStartToggle').checked = prefs.remember;
            document.getElementById('simRememberStartOptions').hidden = !prefs.showRemember;
        }
        function syncPlayerDataPrefs() {
            const prefs = window.AppPreferences.playerData();
            window.PanelDefaults?.refreshSettings();
            const values = {simAutoLowOverflowToggle: prefs.lowOverflow, dashboardSyncPlayerToggle: prefs.sync, dashboardSyncHistoryToggle: prefs.history};
            for (const [id, checked] of Object.entries(values)) {
                const toggle = document.getElementById(id);
                if (toggle) toggle.checked = checked;
            }
            const select = document.getElementById('playerDataModeSelect');
            if (select) select.value = prefs.mode;
            const historyOptions = document.getElementById('dashboardSyncHistoryOptions');
            if (historyOptions) historyOptions.hidden = !prefs.showHistory;
        }
        function initPrefs() {
            const examplesToggle=document.getElementById('currencyExamplesToggle');if(examplesToggle)examplesToggle.checked=localStorage.getItem('GM_Show_Currency_Examples')==='true';
            syncPlayerDataPrefs();
            syncSimulatorDependentPrefs();
            document.getElementById('bilingualEditingToggle').checked = localStorage.getItem('GM_Bilingual_Editing') === 'true';
            document.getElementById('distributionSelect').value = localStorage.getItem('GM_Dashboard_Distribution') || 'show';
            refreshChangelogLineLimit();
            window.PageLayout?.refreshSettings();
            document.getElementById('nonGoldInputModeSelect').value = localStorage.getItem('GM_Non_Gold_Input_Mode') || 'allow_manual_no_up';
            document.getElementById('simHideLowSelect').value = localStorage.getItem('GM_Sim_Hide_Low') || 'show';
            


            const startSelect = document.getElementById('startPageSelect');
            startSelect.innerHTML = ''; 

            const lang = localStorage.getItem('GM_Lang') || 'zh';
            const t = typeof UI_LIB !== 'undefined' ? (UI_LIB[lang] || UI_LIB['zh']) : {};

            // --- 分组 1: 基础页面 ---
            const baseGroup = document.createElement('optgroup');
            baseGroup.label = "📌 " + (lang === 'en' ? "Base & Dev Pages" : "基础与开发者页面");
            baseGroup.innerHTML = `
                <option value="index.html">🏠 ${t.nav_home || '首页'}</option>
                <option value="changelog.html">${t.cl_title || '版本详情'}</option>
                <option value="settings.html">⚙️ ${t.nav_settings || '设置中心'}</option>
                <option value="gallery_setup.html"> ${t.nav_new_engine || '新建引擎'}</option>
            `;
            startSelect.appendChild(baseGroup);

            // --- 分组 2: 遍历所有游戏及其卡池 ---
            const presetGames = [
                { id: 'hsr', name: '崩坏：星穹铁道', en: 'Honkai: Star Rail' },
                { id: 'zzz', name: '绝区零', en: 'Zenless Zone Zero' },
                { id: 'end', name: '明日方舟：终末地', en: 'Arknights: Endfield' },
                { id: 'ark', name: '明日方舟', en: 'Arknights' },
                { id: 'test', name: '测试专用', en: 'Feature Test Lab' }
            ];
            
            const customGames = (typeof safeParse === 'function' ? safeParse(localStorage.getItem('GM_Custom_Games_List')) : null) || [];
            const presetIds = presetGames.map(g => g.id);
            const allGames = [...presetGames, ...customGames.filter(g => !presetIds.includes(g.id))].filter(game=>window.TestCatalog?.visible(game.id)??game.id!=='test');

            allGames.forEach(game => {
                const gId = game.id;
                const parseFn = typeof safeParse === 'function' ? safeParse : JSON.parse;
                let gameInfo = null;
                try { gameInfo = parseFn(localStorage.getItem('GM_Info_' + gId)) || { gameName: game.name || game.gameName, enGameName: game.en }; } catch(e){}
                let rosterPools = null;
                try { rosterPools = parseFn(localStorage.getItem('GM_RosterPools_' + gId)); } catch(e){}

                // Read published pool metadata for every preset, including logos and reruns.
                if (presetIds.includes(gId)) {
                    const published = GameData.getPresetRules(gId);
                    if (published) rosterPools = Object.entries(published).map(([id, row]) => ({ id, ...row.info, isStandalone: true }));
                }
                if(!gameInfo) return;
                const displayGameName = lang === 'en' ? (gameInfo.enGameName || gameInfo.en || gameInfo.gameName || game.en) : (gameInfo.gameName || game.name || game.gameName);

                const optGroup = document.createElement('optgroup');
                optGroup.dataset.gameId = gId;
                optGroup.dataset.icon = IconRender.game(gId, gameInfo.icon);
                optGroup.label = displayGameName;

                if (rosterPools && rosterPools.length > 0) {
                    rosterPools.forEach(pool => {
                        if (pool.isStandalone !== false) {
                            const opt = document.createElement('option');
                            opt.value = `dashboard.html?gameId=${encodeURIComponent(gId)}&pool=${encodeURIComponent(pool.id)}`;
                            const displayPoolName = lang === 'en' ? (pool.en || pool.name) : pool.name;
                            const officialIcon = presetIds.includes(gId) ? GameData.getPresetRules(gId)?.[pool.id]?.info?.icon : null;
                            opt.dataset.icon = officialIcon || pool.icon || (pool.type === 'up' ? '✨' : '🎫');
                            opt.textContent = displayPoolName;
                            optGroup.appendChild(opt);
                        }
                    });

                }

                    let mixedPools = gameInfo.mixedPools || [];
                    mixedPools.forEach(mp => {
                        const opt = document.createElement('option');
                        opt.value = `dashboard.html?gameId=${encodeURIComponent(gId)}&pool=${encodeURIComponent(mp.id)}`;
                        const displayMpName = lang === 'en' ? (mp.en || mp.name) : mp.name;
                        opt.dataset.icon = mp.icon || '🔀';
                        opt.textContent = displayMpName;
                        optGroup.appendChild(opt);
                    });

                const isPreset = presetIds.includes(gId);
                const setupIcon = isPreset ? '🔒' : '⚙️';
                const setupText = t.nav_game_setup ? t.nav_game_setup.replace('⚙️ ', '') : 'Engine Setup';

                const setupOpt = document.createElement('option');
                setupOpt.value = `gallery_setup.html?gameId=${encodeURIComponent(gId)}`;
                setupOpt.dataset.icon = setupIcon;
                setupOpt.textContent = setupText;
                optGroup.appendChild(setupOpt);

                const playerDataOpt = document.createElement('option');
                playerDataOpt.value = `user_data.html?gameId=${encodeURIComponent(gId)}`;
                playerDataOpt.dataset.icon = '📁';
                playerDataOpt.textContent = t.nav_user_data || (lang === 'en' ? 'Player data' : '玩家数据');
                optGroup.appendChild(playerDataOpt);

                if (optGroup.children.length > 0) startSelect.appendChild(optGroup);
            });

            // 回显已存的配置
            const savedPage = localStorage.getItem('GM_Start_Page') || 'index.html';
            startSelect.value = savedPage;
            if (startSelect.value !== savedPage) {
                startSelect.value = 'index.html';
                localStorage.setItem('GM_Start_Page', 'index.html');
            }

            document.getElementById('themeSelect').value = localStorage.getItem('GM_Theme') || 'dark';
            document.getElementById('langSelect').value = localStorage.getItem('GM_Lang') || 'zh';
            

            window.StartPagePicker?.refresh();
            window.PresetVisibilityPicker?.refresh();
            // 程序设置 select.value 不会触发 change，必须同步已生成的显示控件。
            window.refreshCustomDropdowns?.(document, true);
            if (typeof renderSidebar === 'function') renderSidebar(); 
        }

        window.updatePref = (key, val) => {
            localStorage.setItem(key, val);
            if(key==='GM_Show_Test_Catalog'||window.TestCatalog?.isVisibilityKey(key)){window.TestCatalog?.normalizeStart();initPrefs();return;}
            if(['GM_Player_Data_Mode','GM_Dashboard_Sync_Player','GM_Dashboard_Sync_Existing','GM_Sim_Start_Auto_Low_Overflow'].includes(key))syncPlayerDataPrefs();
            if(['GM_Sim_Currency_Mode','GM_Sim_Start_Setup','GM_Sim_Remember_Start','GM_Sim_Keep_Records'].includes(key))syncSimulatorDependentPrefs();
        };

        window.exportLocalData = function() {
            const data = {};
            for(let i=0; i<localStorage.length; i++){
                let k = localStorage.key(i);
                if(k && k.startsWith('GM_')) data[k] = localStorage.getItem(k);
            }
            ImportExport.exportJSON(data, `GachaMaster_Backup_${new Date().toISOString().slice(0,10)}.json`);
        };

        window.importLocalData = async function(input) {
            // 设置页负责备份格式与本地恢复；公共组件负责读文件及串联流程。
            return ImportExport.importInput(input, {
                validate(data) {
                    // 只接受本应用导出的 GM_ 字符串键值，拒绝其他 JSON 或无关存储项。
                    if (!ImportExport.isObject(data) || Object.entries(data).some(([key, value]) =>
                        !key.startsWith('GM_') || typeof value !== 'string')) throw new Error('INVALID_BACKUP');
                },
                confirm: () => window.customConfirm(window.getTrans ? window.getTrans('confirm_import') : "导入将覆盖当前所有本地数据，确定继续吗？"),
                apply: data => { Object.entries(data).forEach(([key, value]) => localStorage.setItem(key, value)); },
                afterImport: async () => {
                    await window.customAlert("✅ 数据恢复成功！页面即将刷新。");
                    location.reload();
                },
                onError: () => window.customAlert("❌ 无效的备份文件！")
            });
        };

        window.clearAllLocalData = async () => {
            const msg = window.getTrans ? window.getTrans('confirm_clear_local') : "确定要清空所有数据吗？此操作无法撤销。";
            if(await window.customConfirm(msg)) {
                for (let i = localStorage.length - 1; i >= 0; i--) {
                    let key = localStorage.key(i);
                    if (key && key.startsWith('GM_')) localStorage.removeItem(key);
                }
                const successMsg = window.getTrans ? window.getTrans('alert_clear_success') : "清理成功！";
                await window.customAlert(successMsg);
                location.reload();
            }
        };


        document.addEventListener('DOMContentLoaded', initPrefs);
        window.addEventListener('storage', event => {
            const key = window.VersionStorage ? window.VersionStorage.eventKey(event.key) : event.key;
            if (key === undefined) return;
            if (key === null || window.TestCatalog?.isVisibilityKey(key)) { initPrefs(); return; }
            if (key === 'GM_Show_Currency_Examples') {
                const toggle = document.getElementById('currencyExamplesToggle');
                if (toggle) toggle.checked = localStorage.getItem(key) === 'true';
            }
            if (['GM_Player_Data_Mode','GM_Dashboard_Sync_Player','GM_Dashboard_Sync_Existing','GM_Sim_Start_Auto_Low_Overflow'].includes(key)) syncPlayerDataPrefs();
            if (['GM_Sim_Currency_Mode','GM_Sim_Start_Setup','GM_Sim_Remember_Start','GM_Sim_Keep_Records'].includes(key)) syncSimulatorDependentPrefs();
        });

        window.changeTheme = function() {
            const theme = document.getElementById('themeSelect').value;
            localStorage.setItem('GM_Theme', theme);
            document.documentElement.setAttribute('data-theme', theme);
        };

        // 新增：处理布局切换逻辑
        window.changeLayout = function() {
            const layout=document.getElementById('layoutSelect')?.value;if(!layout)return;
            localStorage.setItem('GM_Dashboard_Layout', layout);
            window.PageLayout?.set('dashboard','content',layout);
        };

window.changeBilingualEditing = function() {
    localStorage.setItem('GM_Bilingual_Editing', String(document.getElementById('bilingualEditingToggle').checked));
    window.dispatchEvent(new Event('bilingual-editing-change'));
};

window.changeLang = function() {
    const lang = document.getElementById('langSelect').value;
    localStorage.setItem('GM_Lang', lang);
    currentLang = lang;

    // 1. 执行全页多语言替换
    if (typeof window.applyTranslations === 'function') {
        window.applyTranslations();
    }

    // 2. 重新初始化偏好设置文本（包括动态生成的启动页等列表文本）
    if (typeof initPrefs === 'function') {
        initPrefs();
    }

    // 3. 强制重构自定义下拉框 UI，刷新内部 span 与选项文字
    if (typeof window.refreshCustomDropdowns === 'function') {
        window.refreshCustomDropdowns(document, true);
    }
};

        // 顶栏布局切换
        window.changeHeaderLayout = function() {
            const layout=document.getElementById('headerLayoutSelect')?.value;if(!layout)return;
            localStorage.setItem('GM_Dashboard_Header_Layout', layout);
            window.PageLayout?.set('dashboard','header',layout);
        };


// 版本详情布局独立存储；设置页不应用这些值，避免影响抽卡结果页面。
window.changeChangelogLayout = function (part) {
    const header = part === 'header';
    const control=document.getElementById(header ? 'changelogHeaderLayoutSelect' : 'changelogLayoutSelect');
    if(control)window.PageLayout?.set('changelog',part,control.value);
};

function refreshChangelogLineLimit(){
 const select=document.getElementById('changelogLineLimitSelect');if(!select)return;
 select.value=localStorage.getItem('GM_Changelog_Line_Limit')||'300';
 select.closest('.setting-item').hidden=window.ContentColumns?.read('changelog')?.browsing!=='scroll';
}
document.addEventListener('content-columns-change',event=>{if(event.detail.page==='changelog')refreshChangelogLineLimit();});
window.addEventListener('storage',refreshChangelogLineLimit);
