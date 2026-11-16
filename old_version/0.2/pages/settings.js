/**
 * 设置：偏好回显、设置变更、本地备份与提示弹窗。
 * 由 settings.html 底部加载，保持原先的依赖和执行顺序。
 * 使用普通 script，全局函数仍可供 HTML 内联 onclick 调用。
 */
// 设置和账户模块继续使用原来的调用名，弹窗行为交给公共组件。
const settingsDialog = Dialog.create({ cancelDisplay: 'block' });
window.customAlert = settingsDialog.alert;
window.customConfirm = settingsDialog.confirm;

        function initPrefs() {
            document.getElementById('bilingualEditingToggle').checked = localStorage.getItem('GM_Bilingual_Editing') === 'true';
            document.getElementById('distributionSelect').value = localStorage.getItem('GM_Dashboard_Distribution') || 'show';
            document.getElementById('changelogLineLimitSelect').value = localStorage.getItem('GM_Changelog_Line_Limit') || '300';
            document.getElementById('galleryLayoutSelect').value = localStorage.getItem('GM_Gallery_Layout') || 'center';
            document.getElementById('poolLayoutSelect').value = localStorage.getItem('GM_Pool_Layout') || 'center';
            document.getElementById('changelogHeaderLayoutSelect').value = localStorage.getItem('GM_Changelog_Header_Layout') || 'full';
            document.getElementById('changelogLayoutSelect').value = localStorage.getItem('GM_Changelog_Layout') || 'center';
            // 顶栏布局回显 (默认全覆盖 full)
            document.getElementById('headerLayoutSelect').value = localStorage.getItem('GM_Dashboard_Header_Layout') || 'full';
            document.getElementById('nonGoldInputModeSelect').value = localStorage.getItem('GM_Non_Gold_Input_Mode') || 'allow_manual_no_up';
            document.getElementById('simHideLowSelect').value = localStorage.getItem('GM_Sim_Hide_Low') || 'show';
            
            // 下方列表布局回显 (默认 center，如果历史数据有 full 自动回退至 center)
            let savedLayout = localStorage.getItem('GM_Dashboard_Layout') || 'center';
            if (savedLayout === 'full') savedLayout = 'center';
            document.getElementById('layoutSelect').value = savedLayout;

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
                { id: 'ark', name: '明日方舟', en: 'Arknights' }
            ];
            
            const customGames = (typeof safeParse === 'function' ? safeParse(localStorage.getItem('GM_Custom_Games_List')) : null) || [];
            const presetIds = presetGames.map(g => g.id);
            const allGames = [...presetGames, ...customGames.filter(g => !presetIds.includes(g.id))];

            const presetPoolMap = {
                'hsr': [
                    { val: 'char_up', labelZh: '角色活动跃迁', labelEn: 'Character Event Warp', icon: '🌠' },
                    { val: 'wep_up', labelZh: '光锥活动跃迁', labelEn: 'Light Cone Event Warp', icon: '🌌' },
                    { val: 'mixed_std', labelZh: '常驻跃迁', labelEn: 'Standard Warp', icon: '📦' }
                ],
                'zzz': [
                    { val: 'char_up', labelZh: '独家频段', labelEn: 'Exclusive Channel', icon: '🌠' },
                    { val: 'wep_up', labelZh: '音擎频段', labelEn: 'W-Engine Channel', icon: '🌌' },
                    { val: 'pet_up', labelZh: '邦布频段', labelEn: 'Bangboo Channel', icon: '🐾' },
                    { val: 'mixed_std', labelZh: '常驻频段', labelEn: 'Standard Channel', icon: '📦' }
                ],
                'end': [
                    { val: 'char_up', labelZh: '特态寻访', labelEn: 'Event Headhunting', icon: '🌠' },
                    { val: 'wep_up', labelZh: '武器装备', labelEn: 'Weapon Headhunting', icon: '🌌' },
                    { val: 'mixed_std', labelZh: '标准寻访', labelEn: 'Standard Headhunting', icon: '📦' }
                ],
                'ark': [
                    { val: 'char_up', labelZh: '限定寻访', labelEn: 'Limited Headhunting', icon: '🌠' },
                    { val: 'char_std', labelZh: '标准寻访', labelEn: 'Standard Headhunting', icon: '🎫' }
                ]
            };
            
            allGames.forEach(game => {
                const gId = game.id;
                const parseFn = typeof safeParse === 'function' ? safeParse : JSON.parse;
                let gameInfo = null;
                try { gameInfo = parseFn(localStorage.getItem('GM_Info_' + gId)) || { gameName: game.name || game.gameName, enGameName: game.en }; } catch(e){}
                let rosterPools = null;
                try { rosterPools = parseFn(localStorage.getItem('GM_RosterPools_' + gId)); } catch(e){}

                if(!gameInfo) return;
                const displayGameName = lang === 'en' ? (gameInfo.enGameName || gameInfo.en || gameInfo.gameName || game.en) : (gameInfo.gameName || game.name || game.gameName);

                const optGroup = document.createElement('optgroup');
                optGroup.dataset.gameId = gId;
                optGroup.label = `${presetIds.includes(gId) ? '🎮' : '🛠️'} ${displayGameName}`;

                if (rosterPools && rosterPools.length > 0) {
                    rosterPools.forEach(pool => {
                        if (pool.isStandalone !== false) {
                            const opt = document.createElement('option');
                            opt.value = `dashboard.html?gameId=${encodeURIComponent(gId)}&pool=${encodeURIComponent(pool.id)}`;
                            const displayPoolName = lang === 'en' ? (pool.en || pool.name) : pool.name;
                            opt.innerText = `${pool.type === 'up' ? '✨' : '🎫'} ${displayPoolName}`;
                            optGroup.appendChild(opt);
                        }
                    });

                } else if (presetPoolMap[gId]) {
                    presetPoolMap[gId].forEach(p => {
                        const opt = document.createElement('option');
                        opt.value = `dashboard.html?gameId=${gId}&pool=${p.val}`;
                        opt.innerText = `${p.icon} ${lang === 'en' ? p.labelEn : p.labelZh}`;
                        optGroup.appendChild(opt);
                    });
                }

                    let mixedPools = gameInfo.mixedPools || [];
                    mixedPools.forEach(mp => {
                        const opt = document.createElement('option');
                        opt.value = `dashboard.html?gameId=${encodeURIComponent(gId)}&pool=${encodeURIComponent(mp.id)}`;
                        const displayMpName = lang === 'en' ? (mp.en || mp.name) : mp.name;
                        opt.innerText = `🔀 ${displayMpName}`;
                        optGroup.appendChild(opt);
                    });

                const isPreset = presetIds.includes(gId);
                const setupIcon = isPreset ? '🔒' : '⚙️';
                const setupText = t.nav_game_setup ? t.nav_game_setup.replace('⚙️ ', '') : 'Engine Setup';

                const setupOpt = document.createElement('option');
                setupOpt.value = `gallery_setup.html?gameId=${encodeURIComponent(gId)}`;
                setupOpt.innerText = `${setupIcon} ${setupText}`;
                optGroup.appendChild(setupOpt);

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
            
            // 🌟 注入刚加入的布局设置回显
            document.getElementById('layoutSelect').value = localStorage.getItem('GM_Dashboard_Layout') || 'center';

            window.StartPagePicker?.refresh();
            // 程序设置 select.value 不会触发 change，必须同步已生成的显示控件。
            window.refreshCustomDropdowns?.(document, true);
            if (typeof renderSidebar === 'function') renderSidebar(); 
        }

        window.updatePref = (key, val) => {
            localStorage.setItem(key, val);
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

        window.changeTheme = function() {
            const theme = document.getElementById('themeSelect').value;
            localStorage.setItem('GM_Theme', theme);
            document.documentElement.setAttribute('data-theme', theme);
        };

        // 新增：处理布局切换逻辑
        window.changeLayout = function() {
            const layout = document.getElementById('layoutSelect').value;
            localStorage.setItem('GM_Dashboard_Layout', layout);
            document.documentElement.setAttribute('data-layout', layout); // 全局切换状态
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
            const layout = document.getElementById('headerLayoutSelect').value;
            localStorage.setItem('GM_Dashboard_Header_Layout', layout);
            document.documentElement.setAttribute('data-header-layout', layout);
        };


// 版本详情布局独立存储；设置页不应用这些值，避免影响抽卡结果页面。
window.changeChangelogLayout = function (part) {
    const header = part === 'header';
    localStorage.setItem(header ? 'GM_Changelog_Header_Layout' : 'GM_Changelog_Layout',
        document.getElementById(header ? 'changelogHeaderLayoutSelect' : 'changelogLayoutSelect').value);
};
