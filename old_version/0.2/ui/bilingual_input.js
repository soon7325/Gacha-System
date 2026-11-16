/** 文本框的另一语言编辑浮层。只处理交互，字段与保存由页面提供。 */
(function () {
    'use strict';
    let active = null;
    let sequence = 0;
    const bindings = new WeakMap();
    function isEnabled() {
        try { return localStorage.getItem('GM_Bilingual_Editing') === 'true'; }
        catch (error) { return false; }
    }

    function close(restoreFocus = false) {
        if (!active) return;
        const { panel, button } = active;
        active = null;
        if (panel.matches(':popover-open')) panel.hidePopover();
        panel.remove();
        button.setAttribute('aria-expanded', 'false');
        if (restoreFocus && button.isConnected) button.focus();
    }

    function bind(input, options) {
        if (bindings.has(input)) return bindings.get(input);
        const wrapper = document.createElement('span');
        wrapper.className = 'bilingual-input';
        wrapper.style.width = input.style.width || `${input.getBoundingClientRect().width}px`;
        wrapper.style.marginTop = input.style.marginTop;
        if (input.id === 'input-game-name') wrapper.classList.add('bilingual-input-game');
        input.before(wrapper);
        wrapper.appendChild(input);
        input.style.width = '100%';
        input.style.marginTop = '0';
        input.removeAttribute('onchange');
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'bilingual-input-toggle';
        button.textContent = '▾';
        button.setAttribute('aria-expanded', 'false');
        button.setAttribute('aria-haspopup', 'dialog');
        wrapper.appendChild(button);

        const blocked = () => options.isLocked() || input.disabled || input.readOnly;
        const otherLanguage = () => options.getLanguage() === 'en' ? 'zh' : 'en';
        const label = () => otherLanguage() === 'en' ? '编辑英文 / Edit English' : 'Edit Chinese / 编辑中文';
        function refresh(resetValue = false) {
            const enabled = isEnabled();
            const disabled = blocked() || !enabled;
            if (button.hidden !== !enabled) button.hidden = !enabled;
            if (wrapper.classList.contains('bilingual-editing-off') !== !enabled) wrapper.classList.toggle('bilingual-editing-off', !enabled);
            if (button.disabled !== disabled) button.disabled = disabled;
            if (button.title !== label()) {
                button.title = label();
                button.setAttribute('aria-label', label());
            }
            if (resetValue) {
                const language = options.getLanguage();
                input.value = options.getValue(language) || options.getValue(otherLanguage()) || '';
            }
            if (active?.input === input && (disabled || !input.isConnected || !input.getClientRects().length)) close();
        }
        input.addEventListener('input', () => {
            if (!blocked()) options.setValue(options.getLanguage(), input.value);
        });
        // 点击箭头不让主输入框先失焦，避免原页面的折叠标题收到点击。
        button.addEventListener('pointerdown', event => event.preventDefault());
        button.addEventListener('click', event => {
            event.stopPropagation();
            if (!isEnabled() || blocked()) return;
            if (active?.input === input) { close(true); return; }
            close();
            const language = otherLanguage();
            const panel = document.createElement('div');
            panel.id = `bilingual-editor-${++sequence}`;
            panel.className = 'bilingual-input-panel';
            panel.setAttribute('popover', 'manual');
            panel.setAttribute('role', 'dialog');
            panel.setAttribute('aria-label', label());
            const badge = document.createElement('label');
            badge.textContent = language === 'en' ? 'EN' : '中文';
            const editor = document.createElement('input');
            editor.id = panel.id + '-text';
            badge.htmlFor = editor.id;
            editor.type = 'text';
            editor.className = 'input-box';
            editor.lang = language === 'en' ? 'en' : 'zh-CN';
            editor.value = options.getValue(language) || '';
            editor.placeholder = language === 'en' ? 'English' : '中文名称';
            editor.setAttribute('aria-label', label());
            editor.addEventListener('input', () => {
                if (!isEnabled() || blocked()) { close(); return; }
                options.setValue(language, editor.value);
            });
            panel.addEventListener('keydown', event => {
                if (event.key === 'Escape' || event.key === 'Enter') {
                    event.preventDefault(); event.stopPropagation(); close(true);
                }
            });
            panel.append(badge, editor);
            document.body.appendChild(panel);
            button.setAttribute('aria-controls', panel.id);
            button.setAttribute('aria-expanded', 'true');
            active = { input, button, panel };
            panel.showPopover();
            const rect = wrapper.getBoundingClientRect();
            const width = Math.min(rect.width, window.innerWidth - 16);
            panel.style.width = `${width}px`;
            panel.style.left = `${Math.max(8, Math.min(rect.left, window.innerWidth - width - 8))}px`;
            const height = panel.getBoundingClientRect().height;
            panel.style.top = `${rect.bottom + height + 4 <= window.innerHeight ? rect.bottom + 3 : Math.max(8, rect.top - height - 3)}px`;
            editor.focus();
        });
        const binding = { refresh };
        bindings.set(input, binding);
        refresh();
        return binding;
    }

    function install({ selector, resolve }) {
        function scan() {
            if (active && !active.input.isConnected) close();
            document.querySelectorAll(selector).forEach(input => {
                const options = resolve(input);
                if (options) bind(input, options).refresh();
            });
        }
        const observer = new MutationObserver(scan);
        observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'disabled', 'readonly', 'style'] });
        scan();
        window.addEventListener('storage', event => { if (event.key === 'GM_Bilingual_Editing' || event.key === null) scan(); });
        window.addEventListener('bilingual-editing-change', scan);
        window.addEventListener('pageshow', scan);
        window.addEventListener('focus', scan);
        document.addEventListener('visibilitychange', scan);
        return { refresh(input) { bindings.get(input)?.refresh(true); } };
    }
    document.addEventListener('pointerdown', event => {
        if (active && !active.panel.contains(event.target) && !active.button.contains(event.target)) close();
    }, true);
    document.addEventListener('focusin', event => {
        if (active && !active.panel.contains(event.target) && event.target !== active.button) close();
    });
    document.addEventListener('keydown', event => { if (event.key === 'Escape' && active) { event.stopPropagation(); close(true); } }, true);
    window.addEventListener('resize', () => close());
    window.addEventListener('scroll', event => { if (active && !active.panel.contains(event.target)) close(); }, true);
    window.BilingualInput = { bind, install, close, isEnabled };
})();
