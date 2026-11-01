/**
 * 临时云端入口提示：接管明确标记的按钮/表单，阻止原操作并显示多语言提示。
 * 云端实现已移除；不拦截本地导入、导出、保存和清空功能。
 * 恢复功能时移除 data-cloud-unavailable 标记与本脚本引用即可。
 * 未来方便删除替换回云端存储的代码
 */
(function () {
    'use strict';
    let dialog;
    function text(key, fallback) {
        const value = window.getTrans?.(key);
        return value && value !== key ? value : fallback;
    }
    function show() {
        if (!dialog) {
            // 独立提示框，不覆盖设置页已有的删除/确认弹窗节点。
            const overlay = document.createElement('div');
            overlay.style.cssText = 'display:none;position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:100010;align-items:center;justify-content:center;';
            const box = document.createElement('div');
            box.style.cssText = 'background:var(--card-bg,#252525);color:var(--text,#eee);border:1px solid var(--border,#444);border-radius:12px;padding:24px;width:min(380px,85vw);text-align:center;';
            const title = document.createElement('h3');
            const message = document.createElement('p');
            message.style.cssText = 'line-height:1.7;margin:18px 0;';
            const confirm = document.createElement('button');
            confirm.type = 'button'; confirm.className = 'btn btn-primary';
            box.append(title, message, confirm); overlay.append(box); document.body.append(overlay);
            dialog = window.Dialog.create({ elements: { overlay, box, title, message, confirm },
                defaults: () => ({ title: text('cloud_unavailable_title', '云端功能暂时关闭'),
                    okText: text('cloud_unavailable_ok', '知道了') }) });
        }
        return dialog.alert(text('cloud_unavailable_message', '云端存储功能已暂时移除并关闭，请等待未来更新。本地功能仍可正常使用。'));
    }
    // 捕获阶段阻止原 inline onclick 与认证监听，避免异步模块覆盖占位函数。
    function intercept(event) {
        const entry = event.target.closest?.('[data-cloud-unavailable]');
        if (!entry) return;
        // 表单只拦截提交；不要因为点击输入框就反复弹提示。
        if (event.type === 'click' && entry.tagName === 'FORM') return;
        event.preventDefault(); event.stopImmediatePropagation();
        void show();
    }
    document.addEventListener('click', intercept, true);
    document.addEventListener('submit', intercept, true);
    window.showCloudUnavailableNotice = show;
    // 原按钮的 onclick 保留不变；即使直接调用旧入口，也只显示关闭提示。
    for (const name of ['openAuthModal', 'switchAuthTab', 'handleAuthSubmit', 'realGoogleLogin',
        'executeDataSync', 'openProfileModal', 'openPasswordModal', 'logoutAccount',
        'triggerForceSync', 'resetSyncFlag', 'handleForgotPassword', 'saveProfile',
        'savePassword', 'handleAvatarSelect']) {
        window[name] = (...args) => {
            args[0]?.preventDefault?.();
            return show();
        };
    }
})();
