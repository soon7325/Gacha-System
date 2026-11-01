/** 页面布局偏好：设置页与快捷弹窗共用同一份定义，不修改编辑草稿。 */
(function () {
    'use strict';
    const definitions = {
        dashboard: { title: 'set_result_page', prefix: 'GM_Dashboard', content: 'center', header: 'follow' },
        changelog: { title: 'set_changelog_page', prefix: 'GM_Changelog', content: 'center', header: 'follow' },
        gallery_setup: { title: 'set_gallery_page', prefix: 'GM_Gallery', content: 'center', header: 'follow', control: 'gallery' },
        pool_setup: { title: 'set_pool_page', prefix: 'GM_Pool', content: 'center', header: 'follow', control: 'pool' },
        user_data: { title: 'set_player_data_page', prefix: 'GM_Player_Data', content: 'center', header: 'follow', control: 'playerData' },
        currency_setup: { title: 'set_currency_page', prefix: 'GM_Currency', content: 'center', header: 'follow', control: 'currency' },
        simulator: { title: 'set_simulator_page', prefix: 'GM_Simulator', content: 'full', header: 'full', control: 'simulator' }
    };
    const currentPage = () => (location.pathname.split('/').pop() || 'index').replace(/\.html$/i, '');
    const key = (page, part) => definitions[page].prefix + (part === 'header' ? '_Header_Layout' : '_Layout');
    const choices = (page, part) => part === 'header' ? ['full', 'follow'] : definitions[page].fullContent === false ? ['center', 'left', 'right'] : ['center', 'left', 'right', 'full'];
    function read(page, part) {
        const definition = definitions[page];
        let value = localStorage.getItem(key(page, part));
        return choices(page, part).includes(value) ? value : definition[part];
    }
    function apply() {
        const page = currentPage();
        if (!definitions[page]) return;
        const content = read(page, 'content'), header = read(page, 'header');
        const root = document.documentElement;
        root.setAttribute('data-page-layout', page);
        root.setAttribute('data-page-content', content);
        root.setAttribute('data-page-header', header);
        if (page === 'dashboard' || page === 'changelog') {
            root.setAttribute('data-layout', content); root.setAttribute('data-header-layout', header);
        }
    }
    function set(page, part, value) {
        if (!definitions[page] || !['content', 'header'].includes(part) || !choices(page, part).includes(value)) return false;
        localStorage.setItem(key(page, part), value);
        apply(); refreshSettings(); return true;
    }
    const text = name => window.getTrans ? window.getTrans(name) : name;
    function mountControls(host, page, { settings = false } = {}) {
        if (!definitions[page]) return;
        window.ContentColumns?.mountControls(host, page);
        window.PanelDefaults?.mountControls(host, page, {settings});
    }
    function mountFields(host,page) {
        if (!definitions[page]) return;
        for (const part of ['content', 'header']) {
            const label = document.createElement('label'); label.className = 'panel-default-setting';
            const caption = document.createElement('span');
            caption.dataset.i18n = page === 'dashboard' ? (part === 'header' ? 'set_header_layout' : 'set_dashboard_layout') : page === 'changelog' ? (part === 'header' ? 'set_changelog_header_layout' : 'set_changelog_layout') : part === 'header' ? 'set_page_header_layout' : 'set_setup_alignment';
            caption.textContent = text(caption.dataset.i18n);
            const select = document.createElement('select'); select.className = 'input-box'; select.style.width = '100%';
            select.dataset.layoutPage = page; select.dataset.layoutPart = part;
            select.id = page === 'dashboard' ? (part === 'header' ? 'headerLayoutSelect' : 'layoutSelect') : page === 'changelog' ? (part === 'header' ? 'changelogHeaderLayoutSelect' : 'changelogLayoutSelect') : definitions[page].control + (part === 'header' ? 'HeaderLayoutSelect' : 'LayoutSelect');
            for (const value of choices(page, part)) {
                const option = document.createElement('option'); option.value = value;
                option.dataset.i18n = part === 'header' ? (value === 'full' ? 'header_layout_full' : ['dashboard','changelog'].includes(page) ? 'header_layout_follow' : 'header_layout_follow_content') : (value === 'full' ? 'layout_full_width' : 'layout_' + value);
                option.textContent = text(option.dataset.i18n); select.append(option);
            }
            select.value = read(page, part); select.onchange = () => set(page, part, select.value);
            label.append(caption, select); host.append(label);
        }
    }
    function refreshSettings() {
        document.querySelectorAll('select[data-layout-page]').forEach(select => {
            const value=read(select.dataset.layoutPage, select.dataset.layoutPart);if(select.value!==value)select.value=value;
        });
        for (const [id,page,part] of [['layoutSelect','dashboard','content'],['headerLayoutSelect','dashboard','header'],['changelogLayoutSelect','changelog','content'],['changelogHeaderLayoutSelect','changelog','header']]) {
            const select = document.getElementById?.(id); if (select && select.value!==read(page,part)) select.value=read(page,part);
        }
        window.GlobalDisplay?.refresh();
    }
    window.PageLayout = Object.freeze({ definitions, currentPage, key, choices, read, set, apply, mountControls, mountFields, refreshSettings });
    // 旧货币页与图鉴共用位置；仅迁移一次，此后两个页面独立保存。
    if (localStorage.getItem('GM_Currency_Layout') === null) {
        const previous = localStorage.getItem('GM_Gallery_Layout');
        if (choices('currency_setup', 'content').includes(previous)) localStorage.setItem('GM_Currency_Layout', previous);
    }
    apply();
    document.addEventListener('DOMContentLoaded', () => {
        document.querySelectorAll('[data-page-layout-controls]').forEach(host => mountControls(host, host.dataset.pageLayoutControls, { settings: true }));
    });
    window.addEventListener('pageshow', () => { apply(); refreshSettings(); });
    window.addEventListener('storage', event => {
        const changed = window.VersionStorage ? window.VersionStorage.eventKey(event.key) : event.key;
        if (changed === null || Object.keys(definitions).some(page => ['content', 'header'].some(part => key(page, part) === changed))) { apply(); refreshSettings(); }
    });
})();
