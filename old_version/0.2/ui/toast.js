/**
 * 公共短提示组件：统一图标、边框、显示时长和计时器管理。
 * 页面传入少量配置即可保留原有样式；组件不决定提示文字或语言。
 */
(function () {
    'use strict';

    const DEFAULT_TYPES = {
        success: { icon: '✅', color: '#2ecc71' },
        info: { icon: '✅', color: '#2ecc71' },
        danger: { icon: '🗑️', color: '#ff4757' },
        warn: { icon: '⚠️', color: '#ff4757' },
        cancel: { icon: '↩️', color: '#888' }
    };

    /**
     * target 可为元素 ID 或元素本身。
     * mode='inline' 控制透明度和显示状态；mode='class' 用于更新日志现有 show 样式。
     * types 可覆盖页面原有图标/颜色；duration、fadeDuration、showDelay 的单位为毫秒。
     */
    function create({ target = 'toast-notification', mode = 'inline', className = 'show',
        duration = 1500, fadeDuration = 300, showDelay = 0, types = {} } = {}) {
        const appearances = { ...DEFAULT_TYPES, ...types };
        let showTimer = null, fadeTimer = null, hideTimer = null;
        let activeElement = null;

        // 同时清除淡入、淡出和最终隐藏计时器，旧提示不会提前隐藏新提示。
        function clearTimers() {
            [showTimer, fadeTimer, hideTimer].forEach(timer => {
                if (timer !== null) clearTimeout(timer);
            });
            showTimer = fadeTimer = hideTimer = null;
        }

        // 提示节点可以在调用时才出现，初始化组件时不要求 DOM 已加载。
        function getTarget() {
            return typeof target === 'string' ? document.getElementById(target) : target;
        }

        function show(message, type = 'success') {
            const toast = getTarget();
            if (!toast) return false;
            clearTimers();
            activeElement = toast;

            if (mode === 'class') {
                // 更新日志保持纯文本及原有 CSS 动画，不添加图标或内联颜色。
                toast.textContent = String(message ?? '');
                toast.classList.add(className);
                fadeTimer = setTimeout(() => toast.classList.remove(className), duration);
                return true;
            }

            const appearance = appearances[type] || appearances.success;
            // 用 textContent 填充文字，用户输入的名称不会被当作 HTML 执行。
            const content = document.createElement('span');
            content.style.display = 'inline-flex';
            content.style.alignItems = 'center';
            content.style.gap = '8px';
            const icon = document.createElement('span');
            icon.textContent = appearance.icon;
            const text = document.createElement('span');
            text.textContent = String(message ?? '');
            content.appendChild(icon);
            content.appendChild(text);
            toast.replaceChildren(content);
            toast.style.borderColor = appearance.color;
            toast.style.display = 'block';
            toast.style.opacity = showDelay > 0 ? '0' : '1';
            if (showDelay > 0) showTimer = setTimeout(() => { toast.style.opacity = '1'; }, showDelay);

            fadeTimer = setTimeout(() => {
                toast.style.opacity = '0';
                hideTimer = setTimeout(() => { toast.style.display = 'none'; }, fadeDuration);
            }, duration);
            return true;
        }

        // 主动关闭当前提示，用于组件卸载或页面主动结束反馈。
        function dismiss() {
            clearTimers();
            if (!activeElement) return;
            if (mode === 'class') activeElement.classList.remove(className);
            else { activeElement.style.opacity = '0'; activeElement.style.display = 'none'; }
            activeElement = null;
        }

        return Object.freeze({ show, dismiss });
    }

    window.Toast = Object.freeze({ create });
})();
