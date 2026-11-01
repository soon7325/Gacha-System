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
        bilingualFirstExit: ['首次离开设置页后会自动关闭双语提示。', 'Bilingual hints will turn off automatically when you first leave Settings.'],
        close: ['关闭', 'Close'],
        align: ['抽卡结果对齐方式', 'Result alignment'],
        contentAlign: ['内容对齐方式', 'Content alignment'],
        lineLimit: ['每页上限行数', 'Maximum lines per page'],
        distribution: ['星级出货分布分析', 'Rarity distribution analysis'],
        visible: ['显示', 'Show'], hidden: ['隐藏', 'Hide'],
        stretch: ['全覆盖（撑满宽度）', 'Full width'],
        center: ['居中', 'Center'], left: ['靠左', 'Left'], right: ['靠右', 'Right'],
        header: ['顶栏布局', 'Header layout'], full: ['全覆盖', 'Full width'], follow: ['跟随结果', 'Follow results'],
        low: ['模拟器低星展示', 'Simulator low-rarity display'], show: ['完整展示', 'Show all'], color: ['极简纯色', 'Colors only'],
        manual: ['非金物品输入', 'Non-gold item input'], flat: ['手动平铺', 'Manual flat list'], up: ['手动区分 UP', 'Manual UP groups'], random: ['自动随机', 'Automatic random'], pure: ['纯色背景', 'Solid colors'],
        autoRandomNote: ['自动随机也会补齐之前未指定物品的非金记录，已选物品保持不变。', 'Automatic random also fills previously unspecified non-gold items. Existing item selections are kept.'],
    };
    function label(key) {
        const pair = words[key];
        return key === 'again' && localStorage.getItem(bilingualKey) !== 'false' ? pair.join(' / ') : pair[localStorage.getItem('GM_Lang') === 'en' ? 1 : 0];
    }
    let panel, anchor;
    function close(restore = false) {
        if (!panel) return;
        panel.remove(); panel = null;
        anchor?.setAttribute('aria-expanded', 'false');
        if (restore) anchor?.focus();
    }
    function position() {
        if (!panel || !anchor) return;
        const rect = anchor.getBoundingClientRect();
        const width = panel.getBoundingClientRect().width;
        const left = rect.right + 12 + width <= innerWidth - 12 ? rect.right + 12 : Math.max(12, innerWidth - width - 12);
        panel.style.left = left + 'px';
        panel.style.top = Math.max(12, Math.min(rect.bottom - panel.offsetHeight, innerHeight - panel.offsetHeight - 12)) + 'px';
    }
    function toggleRow(container, key, storageKey, changed) {
        const row = document.createElement('label'); row.className = 'quick-settings-toggle';
        const input = document.createElement('input'); input.type = 'checkbox'; input.checked = localStorage.getItem(storageKey) !== 'false';
        row.append(input, document.createTextNode(label(key))); container.append(row);
        input.addEventListener('change', () => { localStorage.setItem(storageKey, String(input.checked)); changed?.(); });
    }
    function select(container, key, storageKey, initial, options, attribute) {
        const row = document.createElement('label'); row.className = 'quick-settings-field';
        const text = document.createElement('span'); text.textContent = label(key);
        const input = document.createElement('select'); input.className = 'input-box';
        options.forEach(([value, name]) => { const opt = document.createElement('option'); opt.value = value; opt.textContent = words[name] ? label(name) : name; input.append(opt); });
        input.value = localStorage.getItem(storageKey) || initial;
        row.append(text, input); container.append(row);
        input.addEventListener('change', () => {
            localStorage.setItem(storageKey, input.value);
            if (attribute) document.documentElement.setAttribute(attribute, input.value);
            if (storageKey === 'GM_Sim_Hide_Low') window.refreshSimulatorDisplay?.();
            if (storageKey === 'GM_Changelog_Line_Limit') window.onLineLimitChanged?.(input.value);
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
        if (file === 'gallery_setup.html' || file === 'pool_setup.html') {
            const gallery = file === 'gallery_setup.html';
            title.textContent = window.getTrans(gallery ? 'set_gallery_page' : 'set_pool_page');
            select(panel, 'contentAlign', gallery ? 'GM_Gallery_Layout' : 'GM_Pool_Layout', 'center', [['center','center'],['left','left'],['right','right'],['full','stretch']], 'data-setup-layout');
        }
        if (file === 'changelog.html') {
            title.textContent = window.getTrans('set_changelog_page');
            select(panel, 'lineLimit', 'GM_Changelog_Line_Limit', '300', [['150','150'],['300','300'],['500','500'],['1000','1000']]);
            select(panel, 'header', 'GM_Changelog_Header_Layout', 'full', [['full','full'],['follow','follow']], 'data-header-layout');
            select(panel, 'contentAlign', 'GM_Changelog_Layout', 'center', [['center','center'],['left','left'],['right','right'],['full','stretch']], 'data-layout');
        }
        if (file === 'dashboard.html') {
            select(panel, 'distribution', 'GM_Dashboard_Distribution', 'show', [['show','visible'],['hide','hidden']], 'data-distribution');
            select(panel, 'align', 'GM_Dashboard_Layout', 'center', [['center','center'],['left','left'],['right','right']], 'data-layout');
            select(panel, 'header', 'GM_Dashboard_Header_Layout', 'full', [['full','full'],['follow','follow']], 'data-header-layout');
        }
        if (file === 'dashboard.html') select(panel, 'manual', 'GM_Non_Gold_Input_Mode', 'allow_manual_no_up', [['allow_manual_no_up','flat'],['allow_manual_with_up','up'],['auto_random','random'],['pure_color','pure']]);
        if (file === 'simulator.html') select(panel, 'low', 'GM_Sim_Hide_Low', 'show', [['show','show'],['color_only','color']]);
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
        // 首次访问期间保留双语，实际离开后才结束引导；后续手动开启不受影响。
        window.addEventListener('pagehide', () => {
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
                window.applyTranslations?.();
                if (typeof renderSidebar === 'function') renderSidebar();
            });
            if (localStorage.getItem('GM_Bilingual_Onboarding_Completed') !== 'true') {
                const note = document.createElement('p'); note.id = 'bilingual-first-exit-note';
                note.className = 'quick-settings-hint'; note.textContent = label('bilingualFirstExit');
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
            if (!event.persisted) return;
            if (typeof initPrefs === 'function') initPrefs();
            window.applyTranslations();
            if (typeof renderSidebar === 'function') renderSidebar();
        });
    });
})();
