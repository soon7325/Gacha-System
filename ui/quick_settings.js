/** 设定入口的无蒙层快捷气泡；偏好仅保存在本机。 */
(function () {
    'use strict';
    const popupKey = 'GM_Settings_Popover';
    const bilingualKey = 'GM_Bilingual_Hints';
    const words = {
        title: ['当前页面设定', 'Page settings'],
        again: ['再点击一次设定进入设定页面', 'Click Settings again to open the settings page'],
        popup: ['显示快捷设定弹窗', 'Show quick settings popover'],
        bilingual: ['设定入口与语言选项使用中英双语', 'Bilingual Settings navigation and language options'],
        bilingualFirstExit: ['引导期间临时开启的双语提示，会在离开设置页后自动关闭。取消勾选后重新勾选，即可保持永久开启。', 'Bilingual hints enabled temporarily for the guide turn off when you leave Settings. Uncheck and then check this option again to keep them on permanently.'],
        bilingualPermanent: ['双语提示当前已设为永久开启，离开设置页后仍会保持勾选。', 'Bilingual hints are currently set to stay on permanently. This option will remain checked when you leave Settings.'],
        bilingualDisabled: ['当前已关闭双语提示，再次勾选即可保持永久开启。', 'Bilingual hints are currently off. Check this option again to keep them on permanently.'],
        close: ['关闭', 'Close'],
        lineLimit: ['滚动浏览每页行数上限','Scrolling: maximum lines per page'],
        align: ['抽卡结果对齐方式', 'Result alignment'],
        contentAlign: ['内容对齐方式', 'Content alignment'],
        distribution: ['星级出货分布分析', 'Rarity distribution analysis'],
        visible: ['显示', 'Show'], hidden: ['隐藏', 'Hide'],
        stretch: ['全覆盖（撑满宽度）', 'Full width'],
        center: ['居中', 'Center'], left: ['靠左', 'Left'], right: ['靠右', 'Right'],
        header: ['顶栏布局', 'Header layout'], full: ['全覆盖', 'Full width'], follow: ['跟随结果', 'Follow results'],
        low: ['模拟器低星展示', 'Simulator low-rarity display'], show: ['完整展示', 'Show all'], color: ['极简纯色', 'Colors only'],
        currency: ['启用货币模式', 'Enable currency mode'],
        start: ['进入模拟器时设置起点', 'Set starting point on entry'],
        manual: ['非金物品输入', 'Non-gold item input'], flat: ['手动平铺', 'Manual flat list'], up: ['手动区分 UP', 'Manual UP groups'], random: ['自动随机', 'Automatic random'], pure: ['纯色背景', 'Solid colors'],
        autoRandomNote: ['自动随机也会补齐之前未指定物品的非金记录，已选物品保持不变。', 'Automatic random also fills previously unspecified non-gold items. Existing item selections are kept.'],
    };
    function label(key) {
        const pair = words[key];
        if (!pair) return window.getTrans?.(key) || key;
        const english = localStorage.getItem('GM_Lang') === 'en';
        return key === 'again' && localStorage.getItem(bilingualKey) !== 'false'
            ? (english ? [pair[1], pair[0]] : pair).join(' / ') : pair[english ? 1 : 0];
    }
    let panel, anchor;
    function close(restore = false) {
        if (!panel) return;
        panel.remove(); panel = null;
        anchor?.setAttribute('aria-expanded', 'false');
        if (restore) anchor?.focus();
    }
    document.addEventListener('panel-defaults-open', () => close());
    function position() {
        if (!panel || !anchor) return;
        const rect = anchor.getBoundingClientRect();
        const width = panel.getBoundingClientRect().width;
        const left = rect.right + 12 + width <= innerWidth - 12 ? rect.right + 12 : Math.max(12, innerWidth - width - 12);
        panel.style.left = left + 'px';
        panel.style.top = Math.max(12, Math.min(rect.bottom - panel.offsetHeight, innerHeight - panel.offsetHeight - 12)) + 'px';
    }
    function toggleRow(container, key, storageKey, changed, defaultOn = true) {
        const row = document.createElement('label'); row.className = 'quick-settings-toggle';
        const input = document.createElement('input'); input.type = 'checkbox'; input.checked = window.AppPreferences.enabled(storageKey, defaultOn);
        input.dataset.quickPreference=storageKey;
        row.append(input, document.createTextNode(label(key))); container.append(row);
        input.addEventListener('change', () => { localStorage.setItem(storageKey, String(input.checked)); changed?.(); if(storageKey==='GM_Sim_Currency_Mode')input.checked=localStorage.getItem(storageKey)==='true'; });
        return input;
    }
    function note(container,key) {
        const text=document.createElement('p');text.className='quick-settings-hint';text.textContent=label(key);container.append(text);
    }
    function select(container, key, storageKey, initial, options, attribute, {beforeChange,changed}={}) {
        const row = document.createElement('label'); row.className = 'quick-settings-field';
        const text = document.createElement('span'); text.textContent = label(key);
        const input = document.createElement('select'); input.className = 'input-box';
        input.dataset.quickPreference=storageKey;
        options.forEach(([value, name]) => { const opt = document.createElement('option'); opt.value = value; opt.textContent = words[name] ? label(name) : name; input.append(opt); });
        input.value = localStorage.getItem(storageKey) || initial;
        row.append(text, input); container.append(row);
        input.addEventListener('change', async () => {
            if(beforeChange){
                const previous=localStorage.getItem(storageKey)||initial;
                input.disabled=true;
                try{if(await beforeChange(input.value)===false){input.value=previous;return;}}
                finally{input.disabled=false;window.refreshCustomDropdowns?.(container,true);}
            }
            localStorage.setItem(storageKey, input.value);
            if (storageKey === 'GM_Player_Data_Mode') window.PanelDefaults?.refreshSettings();
            if (attribute) document.documentElement.setAttribute(attribute, input.value);
            if(storageKey==='GM_Changelog_Line_Limit')window.onLineLimitChanged?.(input.value);
            if (storageKey === 'GM_Sim_Hide_Low') window.refreshSimulatorDisplay?.();
            changed?.();
        });
    }
    function open(entry) {
        close(); anchor = entry; if (!anchor) return;
        const file = (location.pathname.replace(/\/+$/, '').split('/').pop() || 'index').replace(/\.html$/i, '') + '.html';
        const home = file === 'index.html';
        panel = document.createElement('section'); panel.id = 'quick-settings-popover'; panel.className = 'quick-settings-popover';
        panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-labelledby', 'quick-settings-title');
        const header = document.createElement('div'); header.className = 'quick-settings-header';
        const title = document.createElement('strong'); title.id = 'quick-settings-title'; title.textContent = home ? window.getTrans('set_acc_manage') : label('title');
        if (home) panel.classList.add('quick-settings-home');
        const exit = document.createElement('button'); exit.type = 'button'; exit.textContent = '×'; exit.setAttribute('aria-label', label('close')); exit.onclick = () => close(true);
        header.append(title, exit); panel.append(header);
        const layoutPage = file.replace(/\.html$/, '');
        if (window.PageLayout?.definitions[layoutPage]) {
            title.textContent = window.getTrans(PageLayout.definitions[layoutPage].title);
            PageLayout.mountControls(panel, layoutPage);
        }
        if(file==='currency_setup.html')toggleRow(panel,'set_currency_examples','GM_Show_Currency_Examples',()=>window.GalleryEconomy?.refreshExampleVisibility(),false);
        if (file === 'changelog.html') {
            title.textContent = window.getTrans('set_changelog_page');
            if((window.ContentColumns?.read('changelog')?.browsing||'scroll')==='scroll')select(panel,'lineLimit','GM_Changelog_Line_Limit','300',[['150','150'],['300','300'],['500','500'],['1000','1000']]);
            if (!window.PageLayout) {
                select(panel, 'header', 'GM_Changelog_Header_Layout', 'full', [['full','full'],['follow','follow']], 'data-header-layout');
                select(panel, 'contentAlign', 'GM_Changelog_Layout', 'center', [['center','center'],['left','left'],['right','right'],['full','stretch']], 'data-layout');
            }
        }
        if (file === 'dashboard.html') {
            select(panel, 'distribution', 'GM_Dashboard_Distribution', 'show', [['show','visible'],['hide','hidden']], 'data-distribution');
        }
        if (file === 'dashboard.html') select(panel, 'manual', 'GM_Non_Gold_Input_Mode', 'allow_manual_no_up', [['allow_manual_no_up','flat'],['allow_manual_with_up','up'],['auto_random','random'],['pure_color','pure']]);
        if (file === 'simulator.html') select(panel, 'low', 'GM_Sim_Hide_Low', 'show', [['show','show'],['color_only','color']]);
        if (file === 'simulator.html') {
            toggleRow(panel, 'currency', 'GM_Sim_Currency_Mode', () => window.refreshSimulatorEconomy?.(), false);
            const remember=document.createElement('div');
            const dependencies=()=>{
                remember.hidden=!window.AppPreferences.simulator().showRemember;
                position();
            };
            toggleRow(panel, 'set_sim_keep_records', 'GM_Sim_Keep_Records', () => {dependencies();window.refreshSimulatorRecords?.();}, false);
            toggleRow(panel, 'start', 'GM_Sim_Start_Setup', () => {dependencies();window.refreshSimulatorStart?.();}, false);
            toggleRow(remember, 'set_sim_remember_start', 'GM_Sim_Remember_Start');
            panel.append(remember);dependencies();
        }
        if (file === 'user_data.html') {
            select(panel,'set_player_data_mode','GM_Player_Data_Mode','single',[
                ['single',label('set_player_data_single')],['multi',label('set_player_data_multi')]
            ],null,{beforeChange:()=>window.confirmPlayerDataModeChange?.(),changed:()=>window.refreshPlayerDataMode?.()});
            note(panel,'set_player_data_note');
            const history=document.createElement('div');
            const dependencies=()=>{history.hidden=!window.AppPreferences.playerData().showHistory;position();};
            toggleRow(panel,'set_dashboard_sync_player','GM_Dashboard_Sync_Player',dependencies,false);
            toggleRow(history,'set_dashboard_sync_history','GM_Dashboard_Sync_Existing',null,false);
            panel.append(history);dependencies();
            toggleRow(panel,'set_sim_auto_low_overflow','GM_Sim_Start_Auto_Low_Overflow');
            note(panel,'set_sim_auto_low_overflow_note');
        }
        if (file === 'index.html') {
            const notice = document.createElement('div'); notice.className = 'quick-settings-account-notice';
            notice.textContent = window.getTrans('cloud_unavailable_account_status');
            const actions = document.createElement('div'); actions.className = 'quick-settings-account-actions';
            const login = document.createElement('button'); login.type = 'button'; login.className = 'btn btn-primary';
            login.textContent = window.getTrans('btn_login_reg');
            login.onclick = () => { close(); window.showCloudUnavailableNotice?.(); };
            actions.append(login); panel.append(notice, actions);
        }
        if (file === 'dashboard.html') {
            const note = document.createElement('p'); note.className = 'quick-settings-hint';
            note.textContent = label('autoRandomNote'); panel.append(note);
        }
        const hint = document.createElement('p'); hint.className = 'quick-settings-hint'; hint.textContent = label('again'); panel.append(hint);
        document.body.append(panel);
        // 在首次测量前完成美化，避免原生/自定义控件切换导致高度变化。
        window.refreshCustomDropdowns?.(panel, false);
        anchor.setAttribute('aria-controls', panel.id); anchor.setAttribute('aria-expanded', 'true'); position();
        panel.scrollTop = 0;
        exit.focus({ preventScroll: true });
    }
    document.addEventListener('click', event => {
        const entry = event.target.closest?.('.sidebar a[href="settings.html"]');
        if (entry && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey && event.button === 0) {
            if (localStorage.getItem(popupKey) === 'false') return;
            if (panel) { close(); return; }
            // 首次点击只展开气泡，不让编辑页的侧栏导航保护提前跳页。
            // 再次点击放行，继续由未保存保护决定是否进入完整设置页。
            event.preventDefault(); event.stopPropagation(); open(entry); return;
        }
        if (panel && !panel.contains(event.target) && !event.target.closest?.('.custom-select-floating')) close();
    }, true);
    document.addEventListener('keydown', event => { if (event.key === 'Escape' && panel) { event.preventDefault(); close(true); } });
    window.addEventListener('storage', event => {
        if (event.key === 'GM_Dashboard_Distribution') document.documentElement.setAttribute('data-distribution', event.newValue || 'show');
    });
    window.addEventListener('resize', position);
    document.addEventListener('scroll', position, true);
    document.addEventListener('DOMContentLoaded', () => {
        if (!/(?:^|\/)settings(?:\.html)?\/?$/i.test(location.pathname)) return;
        // Keep the note for this visit, even after the user opts into permanent
        // hints. A replay shows it again regardless of the existing preference.
        let showBilingualNote = localStorage.getItem('GM_Bilingual_Onboarding_Completed') !== 'true'
            || !!sessionStorage.getItem('GM_Language_Guide_Replay_Bilingual');
        // 首次访问期间保留双语，实际离开后才结束引导；后续手动开启不受影响。
        window.addEventListener('pagehide', () => {
            showBilingualNote = false;
            document.getElementById('bilingual-first-exit-note')?.remove();
            // Replay starts on Home, after this departure. Do not switch off
            // an existing preference on the way to the replay.
            if (sessionStorage.getItem('GM_Language_Guide_Replay') === 'true') return;
            const replayMode = sessionStorage.getItem('GM_Language_Guide_Replay_Bilingual');
            if (replayMode) {
                sessionStorage.removeItem('GM_Language_Guide_Replay_Bilingual');
                if (replayMode === 'temporary') localStorage.setItem(bilingualKey, 'false');
                localStorage.setItem('GM_Bilingual_Onboarding_Completed', 'true');
                document.getElementById('bilingual-first-exit-note')?.remove();
                return;
            }
            if (localStorage.getItem('GM_Bilingual_Onboarding_Completed') === 'true') return;
            localStorage.setItem(bilingualKey, 'false');
            localStorage.setItem('GM_Bilingual_Onboarding_Completed', 'true');
            document.getElementById('bilingual-first-exit-note')?.remove();
        });
        const popupSlot = document.getElementById('settings-popup-preference');
        const bilingualSlot = document.getElementById('settings-bilingual-preference');
        if (!popupSlot || !bilingualSlot) return;
        function render() {
            popupSlot.replaceChildren(); bilingualSlot.replaceChildren();
            const randomNote = document.getElementById('non-gold-random-note');
            if (randomNote) randomNote.textContent = label('autoRandomNote');
            toggleRow(popupSlot, 'popup', popupKey);
            toggleRow(bilingualSlot, 'bilingual', bilingualKey, () => {
                if (localStorage.getItem(bilingualKey) === 'true') {
                    // A user change back to checked is an explicit permanent
                    // choice, including during a temporary replay.
                    localStorage.setItem('GM_Bilingual_Onboarding_Completed', 'true');
                    if (sessionStorage.getItem('GM_Language_Guide_Replay_Bilingual')) {
                        sessionStorage.setItem('GM_Language_Guide_Replay_Bilingual', 'preserve');
                    }
                }
                window.applyTranslations?.();
                if (typeof renderSidebar === 'function') renderSidebar();
            });
            if (showBilingualNote) {
                const note = document.createElement('p'); note.id = 'bilingual-first-exit-note';
                const replayMode = sessionStorage.getItem('GM_Language_Guide_Replay_Bilingual');
                const enabled = localStorage.getItem(bilingualKey) !== 'false';
                const permanent = enabled
                    && (replayMode === 'preserve' || (replayMode !== 'temporary' && localStorage.getItem('GM_Bilingual_Onboarding_Completed') === 'true'));
                note.className = 'quick-settings-hint'; note.textContent = label(!enabled ? 'bilingualDisabled' : permanent ? 'bilingualPermanent' : 'bilingualFirstExit');
                bilingualSlot.append(note);
            }
        }
        // 独立记录首次语言引导，升级前已结束双语引导的用户也能看到一次。
        const languageSelect = document.getElementById('langSelect');
        const languageRow = languageSelect?.closest('.setting-item');
        if (languageRow && localStorage.getItem('GM_Language_Guide_Seen') !== 'true') {
            languageRow.classList.add('settings-language-highlight');
            const guide = document.createElement('p'); guide.className = 'settings-language-guide';
            guide.setAttribute('data-i18n', 'set_language_first_visit');
            guide.textContent = window.getTrans('set_language_first_visit'); languageRow.append(guide);
            // 切换语言时保留高亮与提示，仅在实际离开页面后结束首次引导。
            window.addEventListener('pagehide', () => {
                localStorage.setItem('GM_Language_Guide_Seen', 'true');
                languageRow.classList.remove('settings-language-highlight');
                guide.remove();
            }, { once:true });
            window.addEventListener('load', () => languageRow.scrollIntoView({ block:'center', behavior:'smooth' }), { once:true });
        }
        window.applyTranslations?.();
        if (typeof renderSidebar === 'function') renderSidebar();
        render();
        const translate = window.applyTranslations;
        window.applyTranslations = function () { translate?.(); render(); };
        window.addEventListener('pageshow', event => {
            if (event.persisted) {
                if (typeof initPrefs === 'function') initPrefs();
                window.applyTranslations();
                if (typeof renderSidebar === 'function') renderSidebar();
            }
            // History navigation can restore old form values after pageshow,
            // even without BFCache. Read saved preferences after that restore.
            requestAnimationFrame(render);
        });
    });
})();
