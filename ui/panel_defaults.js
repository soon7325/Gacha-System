/** Entry-time accordion preferences. Runtime edits keep their own expansion state. */
(function () {
    'use strict';
    const definitions = {
        pool_setup: {
            sections: ['panel_pool_sections', 'all'], rules: ['panel_pool_rules', 'first']
        },
        gallery_setup: {
            engine: ['panel_gallery_engine', 'none'], configuration: ['panel_gallery_configuration', 'all'],
            categories: ['panel_gallery_categories', 'all'], tiers: ['panel_gallery_tiers', 'first']
        },
        currency_setup: {
            sections: ['panel_currency_sections', 'all'], groups: ['panel_currency_groups', 'first'], rules: ['panel_currency_rules', 'first']
        },
        user_data: {
            accounts: ['panel_player_accounts', 'first'], sections: ['panel_player_sections', 'all'],
            pools: ['panel_player_pools', 'first'], tiers: ['panel_player_tiers', 'first'], exchanges: ['panel_exchange_groups', 'first']
        },
        simulator: {
            configuration: ['panel_sim_configuration', 'none'], probability: ['panel_sim_probability', 'none'], sections: ['panel_sim_sections', 'first'],
            pools: ['panel_player_pools', 'first'], tiers: ['panel_player_tiers', 'first'],
            wallet: ['panel_sim_wallet', 'all'], exchanges: ['panel_sim_exchange_groups', 'first']
        }
    };
    const modes = ['all', 'first', 'none'];
    const modeLabels = {all:'panel_default_all', first:'panel_default_first', none:'panel_default_none'};
    const key = (page, level) => `GM_Panel_Default_${page}_${level}`;
    function read(page, level) {
        const definition = definitions[page]?.[level];
        if (!definition) return null;
        const value = localStorage.getItem(key(page, level));
        return modes.includes(value) ? value : definition[1];
    }
    function initial(page, level, index = 0) {
        const mode = read(page, level);
        return mode === 'all' || mode === 'first' && index === 0;
    }
    function refreshSettings() {
        document.querySelectorAll('select[data-panel-page]').forEach(select => {
            select.value = read(select.dataset.panelPage, select.dataset.panelLevel);
            const row = select.closest('.panel-default-setting');
            if (row) row.hidden = !visible(select.dataset.panelPage, select.dataset.panelLevel);
        });
        window.GlobalDisplay?.refresh();
    }
    function visible(page, level) {
        const large={pool_setup:['sections'],gallery_setup:['engine','categories'],currency_setup:['sections'],user_data:['accounts']};
        if(window.ContentColumns?.read(page)?.browsing==='single'&&large[page]?.includes(level))return false;
        return page !== 'user_data' || level !== 'accounts' || localStorage.getItem('GM_Player_Data_Mode') === 'multi';
    }
    function set(page, level, value) {
        if (!definitions[page]?.[level] || !modes.includes(value)) return false;
        localStorage.setItem(key(page, level), value);
        refreshSettings();
        return true;
    }
    const text = name => window.getTrans?.(name) || name;
    let active = null;
    function open(page, trigger) {
        if (!definitions[page]) return null;
        if (active) active(false);
        const previousFocus = trigger || document.activeElement;
        const fallbackFocus = document.querySelector('.sidebar a[href$="settings.html"]');
        // The quick popover gives way to the modal; closing it must not remove this dialog.
        document.dispatchEvent(new CustomEvent('panel-defaults-open'));
        const dialog = document.createElement('dialog');
        dialog.id = 'panel-defaults-dialog'; dialog.className = 'panel-defaults-dialog';
        dialog.setAttribute('aria-labelledby', 'panel-defaults-dialog-title');
        dialog.setAttribute('aria-describedby', 'panel-defaults-dialog-page');
        const heading = document.createElement('h2'); heading.id = 'panel-defaults-dialog-title';
        heading.dataset.i18n = 'panel_defaults_title'; heading.textContent = text(heading.dataset.i18n);
        const caption = document.createElement('p'); caption.id = 'panel-defaults-dialog-page'; caption.className = 'panel-defaults-page';
        const pageTitle = window.PageLayout?.definitions[page]?.title;
        caption.dataset.i18n = pageTitle || 'panel_defaults_title'; caption.textContent = text(caption.dataset.i18n);
        dialog.append(heading, caption);
        const fields = document.createElement('div'); fields.className = 'panel-defaults-fields'; dialog.append(fields);
        mountFields(fields, page);
        const footer = document.createElement('div'); footer.className = 'panel-defaults-footer';
        const close = document.createElement('button'); close.type = 'button'; close.className = 'btn btn-primary';
        close.dataset.i18n = 'panel_defaults_close'; close.textContent = text(close.dataset.i18n);
        footer.append(close); dialog.append(footer);
        let finished = false;
        function finish(restoreFocus = true) {
            if (finished) return;
            finished = true;
            if (active === finish) active = null;
            // Let floating dropdowns return to their owner before removing the modal.
            dialog.dispatchEvent(new Event('close'));
            if (dialog.open) dialog.close();
            dialog.remove();
            if (restoreFocus) (previousFocus?.isConnected ? previousFocus : fallbackFocus)?.focus();
        }
        active = finish;
        close.onclick = () => finish();
        dialog.oncancel = event => { event.preventDefault(); finish(); };
        dialog.onclose = () => finish();
        document.body.append(dialog); dialog.showModal();
        window.refreshCustomDropdowns?.(dialog, false);
        close.focus({preventScroll:true});
        return dialog;
    }
    function mountControls(host, page) {
        if (!definitions[page]) return;
        const button = document.createElement('button'); button.type = 'button';
        button.className = 'btn btn-action-gray panel-defaults-button'; button.dataset.panelDefaultsPage = page;
        button.dataset.i18n = 'panel_defaults_title'; button.textContent = text(button.dataset.i18n);
        button.setAttribute('aria-haspopup', 'dialog'); button.setAttribute('aria-controls', 'panel-defaults-dialog');
        button.onclick = () => open(page, button); host.append(button);
    }
    function mountFields(host, page) {
        for (const [level, [caption]] of Object.entries(definitions[page])) {
            const row = document.createElement('label'); row.className = 'panel-default-setting';
            row.hidden = !visible(page, level);
            const label = document.createElement('span'); label.dataset.i18n = caption; label.textContent = text(caption);
            const select = document.createElement('select'); select.className = 'input-box';
            select.dataset.panelPage = page; select.dataset.panelLevel = level;
            for (const value of modes) {
                const option = document.createElement('option'); option.value = value;
                option.dataset.i18n = modeLabels[value]; option.textContent = text(option.dataset.i18n); select.append(option);
            }
            select.value = read(page, level); select.onchange = () => set(page, level, select.value);
            row.append(label, select); host.append(row);
        }
    }
    // A local map belongs to one editor/account. Stable IDs survive content rerenders;
    // sibling indices restart for each parent, including parents that are collapsed.
    function applyDetails(root, page, level, selector, {states = new Map(), group = null, identify = node => node.id} = {}) {
        const counts = new Map();
        root.querySelectorAll(selector).forEach(node => {
            const parent = group ? node.closest(group) : root;
            const index = counts.get(parent) || 0; counts.set(parent, index + 1);
            const id = level + ':' + (identify(node) || index);
            node.open = states.has(id) ? states.get(id) : initial(page, level, index);
            node.dataset.panelStateKey = id;
            states.set(id, node.open);
            node.addEventListener('toggle', () => { if (node.isConnected) states.set(id, node.open); });
        });
    }
    function captureDetails(root, states) {
        root.querySelectorAll('details[data-panel-state-key]').forEach(node => states.set(node.dataset.panelStateKey, node.open));
    }
    window.PanelDefaults = Object.freeze({definitions, modes, key, read, initial, set, mountControls, open, refreshSettings, applyDetails, captureDetails});
    window.addEventListener('storage', event => {
        const changed = window.VersionStorage ? window.VersionStorage.eventKey(event.key) : event.key;
        if (changed === null || changed === 'GM_Player_Data_Mode' || changed?.startsWith('GM_Panel_Default_')) refreshSettings();
    });
    window.addEventListener('pageshow', refreshSettings);
})();
