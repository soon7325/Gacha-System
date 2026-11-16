/**
 * 共用预览锁定：切换状态、按钮文字/颜色与官方预设只读提示。
 * 手动预览可以解除，官方预设不可解除；锁定不代表数据已经保存。
 * 只操作界面状态，不写业务数据。页面继续保留 CSS 和保存/删除保护。
 */
(function () {
    'use strict';

    function create({ isPreset = () => false, buttonId = 'btn-preview-toggle',
        getLabels = () => ({}), presetPreview = true, banner = null,
        onPreset = () => {} } = {}) {
        const originalStyles = new WeakMap();

        function isPreview() { return document.body.classList.contains('preview-mode'); }
        function isLocked() {
            return isPreset() || isPreview() || document.body.classList.contains('is-preset-game');
        }

        // 每次更新都读取当前语言，且只修改切换按钮，页面专属按钮交给回调。
        function refresh() {
            const button = document.getElementById(buttonId);
            if (!button) return;
            const labels = getLabels();
            if (!originalStyles.has(button)) {
                originalStyles.set(button, {
                    color: button.style.color, borderColor: button.style.borderColor,
                    background: button.style.background
                });
            }
            const original = originalStyles.get(button);
            const preview = isPreview();
            if (isPreset()) {
                if (labels.readOnly) button.textContent = labels.readOnly;
                Object.assign(button.style, original);
                return;
            }
            button.textContent = preview ? labels.unlock || '🔓 解除预览' : labels.lock || '👁️ 锁定预览';
            Object.assign(button.style, preview ? {
                color: '#2ecc71', borderColor: '#2ecc71', background: 'rgba(46, 204, 113, 0.1)'
            } : original);
        }

        function toggle() {
            // 不通过“切换预览”解除官方锁；预设保护仍需页面保存函数一起配合。
            if (isPreset() || document.body.classList.contains('is-preset-game')) return false;
            document.body.classList.toggle('preview-mode');
            refresh();
            return true;
        }

        function applyPreset() {
            if (!isPreset()) return false;
            document.body.classList.add('is-preset-game');
            // pool 用预览 CSS 锁住表单；gallery 用专属预设 CSS，保留原来的区别。
            if (presetPreview) document.body.classList.add('preview-mode');
            refresh();
            if (banner) {
                const container = document.querySelector(banner.container || '.setup-container');
                if (container) {
                    let node = document.getElementById(banner.id);
                    if (!node) {
                        node = document.createElement('div');
                        node.id = banner.id;
                        if (banner.style) node.style.cssText = banner.style;
                        container.insertBefore(node, container.children[1] || container.firstChild);
                    }
                    node.textContent = getLabels().banner || '⚠️ 系统预设游戏只读预览';
                }
            }
            onPreset(); // 页面提供不同的保存按钮、删除入口等业务保护。
            return true;
        }

        return Object.freeze({ toggle, applyPreset, refresh, isPreview, isLocked });
    }
    window.PreviewLock = Object.freeze({ create });
})();
