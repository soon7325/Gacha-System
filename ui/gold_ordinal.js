/** 看板出金序号：仅保存显示偏好，不修改抽卡记录。 */
(function () {
    'use strict';
    const key = 'GM_Dashboard_Gold_Ordinal';
    const modes = ['show','hide','hover','click'];
    const pinned = new Set();
    const read = () => { const value = localStorage.getItem(key); return modes.includes(value) ? value : 'hover'; };
    const text = name => window.getTrans?.(name) || name;
    const attribute = (node,name,value) => { if (node.getAttribute(name) !== String(value)) node.setAttribute(name,String(value)); };
    function decorate(row, ordinal, identity) {
        const icon = row.querySelector('.char-icon');
        if (!icon) return;
        let wrap = icon.closest('.gold-avatar-wrap');
        if (!wrap) {
            wrap = document.createElement('div'); wrap.className = 'gold-avatar-wrap';
            const label = document.createElement('span'); label.className = 'gold-ordinal'; label.setAttribute('aria-hidden','true');
            icon.before(wrap); wrap.append(label,icon);
        }
        if (Number.isSafeInteger(ordinal) && ordinal > 0) row.dataset.goldOrdinal = String(ordinal);
        if (identity !== undefined) row.dataset.goldOrdinalIdentity = identity;
        updateRow(row);
    }
    function updateRow(row) {
        const icon = row.querySelector('.char-icon'), label = row.querySelector('.gold-ordinal');
        if (!icon || !label) return;
        const ordinal = row.dataset.goldOrdinal;
        const number = ordinal ? '#' + ordinal : '';
        if (label.textContent !== number) label.textContent = number;
        const interactive = !!ordinal && ['hover','click'].includes(read());
        if (ordinal) {
            const caption = text('gold_ordinal_description').replace('{n}',ordinal);
            attribute(label,'title',caption);
            if (interactive) {
                attribute(icon,'role','button'); attribute(icon,'tabindex','0');
                attribute(icon,'title',caption + ' · ' + text('gold_ordinal_toggle_hint'));
                attribute(icon,'aria-label',icon.title);
                const isPinned = pinned.has(row.dataset.goldOrdinalIdentity || ordinal);
                attribute(row,'data-gold-ordinal-pinned',isPinned); attribute(icon,'aria-pressed',isPinned);
            } else {
                icon.removeAttribute('role'); icon.removeAttribute('tabindex'); icon.removeAttribute('aria-pressed');
                icon.removeAttribute('aria-label'); attribute(icon,'title',read() === 'hide' ? '' : caption); delete row.dataset.goldOrdinalPinned;
            }
        }
    }
    function refresh() {
        const mode = read(); attribute(document.documentElement,'data-gold-ordinal-mode',mode);
        const largest = [...document.querySelectorAll('.char-row[data-gold-ordinal]')].reduce((value,row)=>Math.max(value,Number(row.dataset.goldOrdinal)),0);
        const width = Math.max(3,String(largest).length + 1) + 'ch';
        if (document.documentElement.style.getPropertyValue('--gold-ordinal-width') !== width) document.documentElement.style.setProperty('--gold-ordinal-width',width);
        document.querySelectorAll('.gold-avatar-wrap').forEach(wrap => updateRow(wrap.closest('.char-row')));
        document.querySelectorAll('[data-gold-ordinal-setting],select[data-quick-preference="GM_Dashboard_Gold_Ordinal"]').forEach(select => { if (select.value !== mode) select.value = mode; });
        window.GlobalDisplay?.refresh();
    }
    function set(value) {
        if (!modes.includes(value)) return false;
        localStorage.setItem(key,value);
        if (value === 'hide' || value === 'show') pinned.clear();
        refresh(); return true;
    }
    function toggle(icon, event) {
        const row = icon?.closest('.char-row[data-gold-ordinal]');
        if (!row || !['hover','click'].includes(read())) return;
        event.preventDefault(); event.stopPropagation();
        const id = row.dataset.goldOrdinalIdentity || row.dataset.goldOrdinal;
        if (pinned.has(id)) pinned.delete(id); else pinned.add(id);
        updateRow(row);
    }
    document.addEventListener('click', event => toggle(event.target.closest('.gold-avatar-wrap .char-icon'),event),true);
    document.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') toggle(event.target.closest('.gold-avatar-wrap .char-icon'),event);
    },true);
    window.GoldOrdinal = Object.freeze({key,modes,read,set,refresh,decorate});
    document.documentElement.dataset.goldOrdinalMode = read();
    document.addEventListener('DOMContentLoaded',refresh);
    window.addEventListener('pageshow',refresh);
    window.addEventListener('storage', event => {
        const changed = window.VersionStorage ? window.VersionStorage.eventKey(event.key) : event.key;
        if (changed === null || changed === key) { if (read() === 'show' || read() === 'hide') pinned.clear(); refresh(); }
    });
})();
