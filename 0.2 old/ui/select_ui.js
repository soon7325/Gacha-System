/**
 * 全局通用：原生 <select> 自动转暗色自定义下拉框。
 * 原生 select 仍保留在 DOM 中以维持表单兼容性；此模块仅在其后创建可视化 UI，
 * 并在选择变化时派发原生 change 事件，所以页面原有监听器无需调整。
 */
(function() {
    let activeDropdown = null;
    const selectBindings = new WeakMap();
    // 仅包装被美化控件本身，保留原生值语义，不触发 change 或业务保存。
    function bindProgrammaticUpdates(select, sync) {
        const previous = selectBindings.get(select);
        if (previous) { previous.sync = sync; return; }
        const binding = { sync };
        selectBindings.set(select, binding);
        if (typeof HTMLSelectElement === 'undefined') return;
        for (const key of ['value', 'selectedIndex']) {
            const descriptor = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, key);
            if (!descriptor?.get || !descriptor?.set || Object.hasOwn(select, key)) continue;
            Object.defineProperty(select, key, {
                configurable: true,
                get() { return descriptor.get.call(this); },
                set(value) { descriptor.set.call(this, value); binding.sync(); }
            });
        }
        select.addEventListener('change', () => binding.sync());
        select.addEventListener('input', () => binding.sync());
    }
    function closeDropdown() {
        if (!activeDropdown) return;
        const { wrapper, menu } = activeDropdown;
        menu.classList.remove('custom-select-floating');
        wrapper.appendChild(menu);
        activeDropdown.wrapper.classList.remove('open');
        activeDropdown.trigger.setAttribute('aria-expanded', 'false');
        activeDropdown = null;
    }
    function positionDropdown() {
        if (!activeDropdown) return;
        const { wrapper, trigger, menu } = activeDropdown;
        if (!wrapper.isConnected) { closeDropdown(); return; }
        const rect = trigger.getBoundingClientRect();
        const gap = 5, edge = 10;
        const below = Math.max(0, window.innerHeight - rect.bottom - gap - edge);
        const above = Math.max(0, rect.top - gap - edge);
        // 先固定实际宽度，再测量换行后的高度，保证展开方向判断准确。
        menu.style.position = 'fixed';
        menu.style.minWidth = '0';
        menu.style.width = Math.min(rect.width, window.innerWidth - edge * 2) + 'px';
        menu.style.maxHeight = 'none';
        const wanted = Math.min(240, menu.scrollHeight + 2);
        const upward = below < wanted && above > below;
        const height = Math.min(wanted, upward ? above : below);
        menu.style.left = Math.max(edge, Math.min(rect.left, window.innerWidth - rect.width - edge)) + 'px';
        menu.style.maxHeight = height + 'px';
        menu.style.top = (upward ? rect.top - gap - height : rect.bottom + gap) + 'px';
        menu.style.bottom = 'auto';
        wrapper.classList.toggle('opens-up', upward);
    }
    window.addEventListener('resize', positionDropdown);
    document.addEventListener('scroll', event => {
        if (activeDropdown && !activeDropdown.menu.contains(event.target)) positionDropdown();
    }, true);
    /**
     * 把 root 内尚未处理的 select 转为自定义控件。
     * forceRefresh 用于语言切换或动态改写 option 后销毁并重建对应 UI。
     */
    function initCustomDropdowns(root = document, forceRefresh = false) {
        root.querySelectorAll('select:not([data-no-custom])').forEach(nativeSelect => {
            if (nativeSelect.classList.contains('custom-select-original')) {
                if (!forceRefresh) return;
                if (activeDropdown?.wrapper === nativeSelect.nextElementSibling) closeDropdown();
                // 如果是强制刷新，先移除旧的 UI 节点
                if (nativeSelect.nextElementSibling?.classList.contains('custom-select-ui')) {
                    nativeSelect.nextElementSibling.remove();
                }
            }
            // 在隐藏前读取原控件实际宽度；刷新时先恢复原生布局，避免测到隐藏后的 0px。
            // 显式百分比/像素宽度原样继承，CSS 设定与原生默认宽度则按实际布局读取。
            nativeSelect.classList.remove('custom-select-original');
            const nativeWidth = nativeSelect.getBoundingClientRect().width;
            const configuredWidth = nativeSelect.style.width;
            nativeSelect.classList.add('custom-select-original');

            const wrapper = document.createElement('div');
            wrapper.className = 'custom-select-ui';
            wrapper.style.width = configuredWidth && configuredWidth !== 'auto'
                ? configuredWidth : (nativeWidth > 0 ? nativeWidth + 'px' : '90px');

            const currentOpt = nativeSelect.options[nativeSelect.selectedIndex] || nativeSelect.options[0];
            const labelText = currentOpt ? currentOpt.text : '';

            wrapper.innerHTML = `
                <button type="button" class="custom-select-ui-trigger">
                    <span class="custom-select-ui-label">${labelText}</span>
                    <span class="custom-select-ui-arrow">▾</span>
                </button>
                <div class="custom-select-ui-menu"></div>
            `;

            const menu = wrapper.querySelector('.custom-select-ui-menu');
            const labelSpan = wrapper.querySelector('.custom-select-ui-label');

            Array.from(nativeSelect.options).forEach((opt, idx) => {
                const item = document.createElement('div');
                item.className = 'custom-select-ui-item' + (idx === nativeSelect.selectedIndex ? ' selected' : '');
                item.textContent = opt.text;
                item.setAttribute('data-val', opt.value);

                item.onclick = (e) => {
                    e.stopPropagation();
                    if (nativeSelect.disabled || opt.disabled) { closeDropdown(); return; }
                    nativeSelect.selectedIndex = idx;
                    nativeSelect.value = opt.value;

                    menu.querySelectorAll('.custom-select-ui-item').forEach(el => el.classList.remove('selected'));
                    item.classList.add('selected');
                    labelSpan.textContent = opt.text;
                    closeDropdown();

                    nativeSelect.dispatchEvent(new Event('change', { bubbles: true }));
                };

                menu.appendChild(item);
            });

            wrapper.querySelector('.custom-select-ui-trigger').onclick = (e) => {
                e.stopPropagation();
                const isOpen = wrapper.classList.contains('open');
                closeDropdown();
                if (!isOpen && !nativeSelect.disabled) {
                    const trigger = wrapper.querySelector('.custom-select-ui-trigger');
                    wrapper.classList.add('open');
                    trigger.setAttribute('aria-expanded', 'true');
                    activeDropdown = { wrapper, trigger, menu, nativeSelect };
                    // 脱离弹窗的 overflow，使用视口坐标定位。
                    menu.classList.add('custom-select-floating');
                    document.body.appendChild(menu);
                    positionDropdown();
                }
            };

            nativeSelect.parentNode.insertBefore(wrapper, nativeSelect.nextSibling);

            const sync = () => {
                const selectedOpt = nativeSelect.options[nativeSelect.selectedIndex];
                const text = selectedOpt ? selectedOpt.text : '';
                if (labelSpan.textContent !== text) labelSpan.textContent = text;
                menu.querySelectorAll('.custom-select-ui-item').forEach((item, index) => {
                    item.classList.toggle('selected', index === nativeSelect.selectedIndex);
                });
                const trigger = wrapper.querySelector('.custom-select-ui-trigger');
                if (trigger.disabled !== nativeSelect.disabled) trigger.disabled = nativeSelect.disabled;
                if (nativeSelect.disabled && activeDropdown?.nativeSelect === nativeSelect) closeDropdown();
            };
            bindProgrammaticUpdates(nativeSelect, sync);
            sync();
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => initCustomDropdowns());
    } else {
        initCustomDropdowns();
    }

    // 监听页面动态插入的 select（例如弹窗和配置项），让新增控件也自动获得相同外观。
    const observer = new MutationObserver((mutations) => {
        if (activeDropdown && !activeDropdown.wrapper.isConnected) closeDropdown();
        // option 文本、选中项、禁用状态变化不会自然派发 change。
        const changedSelects = new Set();
        for (const mutation of mutations) {
            const node = mutation.target?.nodeType === 3 ? mutation.target.parentElement : mutation.target;
            const select = node?.closest?.('select:not([data-no-custom])');
            if (select) {
                // 只读锁改变禁用状态时，同步按钮即可，无需重建整份选项和测量宽度。
                const binding = selectBindings.get(select);
                if (mutation.type === 'attributes' && mutation.attributeName === 'disabled' && binding) {
                    binding.sync();
                } else changedSelects.add(select);
            }
        }
        for (const select of changedSelects) {
            initCustomDropdowns({ querySelectorAll: () => [select] }, true);
        }
        let hasNewSelect = false;
        for (const mutation of mutations) {
            for (const node of mutation.addedNodes || []) {
                if (node.nodeType === 1) {
                    if (node.tagName === 'SELECT' || node.querySelector?.('select:not(.custom-select-original)')) {
                        hasNewSelect = true;
                        break;
                    }
                }
            }
            if (hasNewSelect) break;
        }
        if (hasNewSelect) {
            initCustomDropdowns();
        }
    });

    observer.observe(document.body, { childList: true, subtree: true, characterData: true,
        attributes: true, attributeFilter: ['selected', 'disabled', 'label', 'value'] });
    window.addEventListener('pageshow', () => initCustomDropdowns(document, true));
    document.addEventListener('reset', () => {
        setTimeout(() => initCustomDropdowns(document, true), 0);
    });

    // 暴露全局调用：支持直接调用 refreshCustomDropdowns(document, true) 强制刷新
    window.refreshCustomDropdowns = (root = document, force = true) => initCustomDropdowns(root, force);

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.custom-select-ui, .custom-select-floating')) {
            closeDropdown();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeDropdown();
        }
    });
})();
