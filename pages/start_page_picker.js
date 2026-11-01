/** 默认启动页：从设置页实时生成的分组中选择，确认后才保存。 */
(function () {
    'use strict';
    let dialog;
    function text(key) { return window.getTrans(key); }
    function source() { return document.getElementById('startPageSelect'); }
    function sidebarOrder(select) {
        const groups = [...select.children];
        const base = groups.shift();
        const gameRanks = new Map();
        const pageRanks = new Map();
        function identity(href) {
            const url = new URL(href, document.baseURI);
            const page = url.pathname.replace(/\/+$/, '').split('/').pop().replace(/\.html$/i, '');
            return [page, url.searchParams.get('gameId') || '', url.searchParams.get('pool') || ''].join('|');
        }
        document.querySelectorAll('.sidebar-group-wrapper').forEach((sidebarGroup, index) => {
            sidebarGroup.querySelectorAll('a[href]').forEach((link, pageIndex) => {
                const url = new URL(link.href, window.location.href);
                const gameId = url.searchParams.get('gameId');
                if (gameId) gameRanks.set(gameId, index);
                pageRanks.set(identity(link.href), pageIndex);
            });
        });
        const rank = (map, key) => map.has(key) ? map.get(key) : Number.MAX_SAFE_INTEGER;
        groups.sort((a, b) => rank(gameRanks, a.dataset.gameId) - rank(gameRanks, b.dataset.gameId));
        for (const group of groups) {
            const options = [...group.children];
            options.sort((a, b) => {
                // 卡池后依次放游戏配置、玩家数据，与侧栏入口顺序一致。
                const tailRank = value => {
                    const path = new URL(value, document.baseURI).pathname;
                    if (/(?:^|\/)user_data(?:\.html)?\/?$/i.test(path)) return 2;
                    return /(?:^|\/)gallery_setup(?:\.html)?\/?$/i.test(path) ? 1 : 0;
                };
                const tailDifference = tailRank(a.value) - tailRank(b.value);
                if (tailDifference) return tailDifference;
                return rank(pageRanks, identity(a.value)) - rank(pageRanks, identity(b.value));
            });
            options.forEach(option => group.appendChild(option));
        }
        // 基础页面始终第一，未出现在侧栏的条目保持原相对顺序放在末尾。
        return base ? [base, ...groups] : groups;
    }
    function appendLabel(target, entry, label) {
        target.classList.add('start-page-label');
        if (entry.dataset.icon) {
            const icon = document.createElement('span');
            icon.className = 'start-page-icon'; icon.setAttribute('aria-hidden', 'true');
            icon.innerHTML = IconRender.html(entry.dataset.icon);
            target.append(icon);
        }
        const name = document.createElement('span'); name.className = 'start-page-text';
        name.textContent = label; target.append(name);
    }
    function refresh() {
        const select = source();
        const button = document.getElementById('start-page-picker-button');
        if (!select || !button) return;
        const option = select.selectedOptions[0];
        button.replaceChildren();
        if (!option) return;
        const group = option.parentElement;
        if (group.tagName === 'OPTGROUP' && group !== select.firstElementChild) {
            const game = document.createElement('strong'); appendLabel(game, group, group.label + '：');
            button.append(game);
        }
        const name = document.createElement('span'); appendLabel(name, option, option.textContent);
        button.append(name);
    }
    function open() {
        if (dialog) return;
        // 初始化同时更新新建、删除或重命名后的自定义游戏与卡池。
        if (typeof initPrefs === 'function') initPrefs();
        const select = source();
        const previousFocus = document.activeElement;
        const overlay = document.createElement('div'); overlay.className = 'start-page-overlay';
        const box = document.createElement('section'); box.className = 'start-page-dialog'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-labelledby', 'start-page-picker-title');
        const header = document.createElement('div'); header.className = 'quick-settings-header';
        const title = document.createElement('h2'); title.id = 'start-page-picker-title'; title.textContent = text('set_start_page');
        const exit = document.createElement('button'); exit.type = 'button'; exit.textContent = '×'; exit.setAttribute('aria-label', text('cancel'));
        header.append(title, exit);
        const body = document.createElement('div'); body.className = 'start-page-options';
        let draft = select.value;
        for (const group of sidebarOrder(select)) {
            if (group.tagName !== 'OPTGROUP') continue;
            const section = document.createElement('fieldset');
            const legend = document.createElement('legend'); appendLabel(legend, group, group.label); section.append(legend);
            for (const option of group.children) {
                const row = document.createElement('label'); row.className = 'start-page-option';
                const radio = document.createElement('input'); radio.type = 'radio'; radio.name = 'start-page-choice'; radio.value = option.value; radio.checked = option.value === draft;
                radio.addEventListener('change', () => { draft = radio.value; });
                const name = document.createElement('span'); appendLabel(name, option, option.textContent);
                row.append(radio, name); section.append(row);
            }
            body.append(section);
        }
        const actions = document.createElement('div'); actions.className = 'start-page-actions';
        const cancel = document.createElement('button'); cancel.type = 'button'; cancel.className = 'btn btn-action-gray'; cancel.textContent = text('cancel');
        const confirm = document.createElement('button'); confirm.type = 'button'; confirm.className = 'btn btn-primary'; confirm.textContent = text('confirm');
        function close() { overlay.remove(); dialog = null; document.removeEventListener('keydown', keydown); previousFocus?.focus(); }
        function keydown(event) {
            if (event.key === 'Escape') { event.preventDefault(); close(); }
            if (event.key === 'Tab') {
                const targets = [...box.querySelectorAll('button, input')];
                const first = targets[0], last = targets[targets.length - 1];
                if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
                else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
            }
        }
        exit.onclick = cancel.onclick = close;
        overlay.addEventListener('click', event => { if (event.target === overlay) close(); });
        confirm.onclick = () => { select.value = draft; localStorage.setItem('GM_Start_Page', draft); refresh(); close(); };
        actions.append(cancel, confirm); box.append(header, body, actions); overlay.append(box); document.body.append(overlay); dialog = overlay;
        document.addEventListener('keydown', keydown); (body.querySelector('input:checked') || exit).focus();
    }
    window.StartPagePicker = { open, refresh };
})();
