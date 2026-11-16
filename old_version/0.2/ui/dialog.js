/**
 * 公共提示/确认弹窗：管理显示、按钮、关闭和 Promise 返回值。
 * 复用页面已有的 HTML/CSS；删除、保存等业务操作仍由页面执行。
 * 同一组件的请求按顺序显示，后来的弹窗不会覆盖前一个等待中的结果。
 */
(function () {
    'use strict';

    // 标准提示框使用现有的多语言 key；缺少词条时显示兜底文字。
    function text(key, fallback) {
        const translated = window.getTrans ? window.getTrans(key) : '';
        return translated && translated !== key ? translated : fallback;
    }

    const STANDARD_ELEMENTS = {
        overlay: 'customDialogOverlay', box: 'customDialogBox',
        title: 'customDialogTitle', message: 'customDialogMsg',
        confirm: 'customDialogConfirm', cancel: 'customDialogCancel'
    };

    /**
     * elements 可指定页面的节点 ID，也可直接传元素。
     * defaults(mode, options) 在每次打开时执行，便于读取最新语言和主题。
     * themes 指定危险/普通主题颜色；不配置时保留现有样式。
     * html 默认为 false；只有页面提供可信的格式化模板时才开启。
     */
    function create({ elements = {}, defaults = () => ({}), themes = {},
        cancelDisplay = 'inline-block', html = false } = {}) {
        const targets = { ...STANDARD_ELEMENTS, ...elements };
        const queue = [];
        let active = null;

        // 延迟查找节点，组件可在页面初始化前创建；节点缺失时使用原生弹窗兜底。
        function getNodes() {
            return Object.fromEntries(Object.entries(targets).map(([name, target]) =>
                [name, typeof target === 'string' ? document.getElementById(target) : target]));
        }

        function drain() {
            if (active || !queue.length) return;
            const request = queue.shift();
            const nodes = getNodes();
            const isConfirm = request.mode === 'confirm';
            const config = {
                title: text(isConfirm ? 'cd_js_confirm' : 'cd_js_alert', isConfirm ? '确认操作' : '提示'),
                okText: text('confirm', '确认'),
                cancelText: text('cancel', '取消'),
                html, ...defaults(request.mode, request.options), ...request.options
            };

            // 确认弹窗缺少取消按钮时不能留下无法结束的 Promise。
            if (!nodes.overlay || !nodes.message || !nodes.confirm || (isConfirm && !nodes.cancel)) {
                let result = false;
                try {
                    if (isConfirm) result = window.confirm(String(request.message ?? ''));
                    else { window.alert(String(request.message ?? '')); result = true; }
                    request.resolve(result);
                } catch (error) { request.reject(error); }
                drain();
                return;
            }

            const previousFocus = document.activeElement;
            const styles = [];
            // 记录被覆盖的颜色，关闭后恢复，蓝色导入提示不会影响下一次红色删除提示。
            function setStyle(node, property, value) {
                if (!node) return;
                styles.push([node, property, node.style[property]]);
                node.style[property] = value;
            }
            const color = themes[config.theme];
            if (color) {
                setStyle(nodes.box, 'borderColor', color);
                setStyle(nodes.title, 'color', color);
                setStyle(nodes.confirm, 'background', color);
                setStyle(nodes.confirm, 'borderColor', color);
            }
            if (nodes.title) nodes.title.textContent = config.title;
            nodes.confirm.textContent = config.okText;
            if (config.html) nodes.message.innerHTML = String(request.message ?? '');
            else nodes.message.textContent = String(request.message ?? '');
            if (nodes.cancel) {
                nodes.cancel.textContent = config.cancelText;
                nodes.cancel.style.display = isConfirm ? cancelDisplay : 'none';
            }

            // 每次结束都解绑事件、隐藏弹窗，并且只结算一次结果。
            function finish(result) {
                if (active?.request !== request) return;
                nodes.confirm.removeEventListener('click', confirmClick);
                nodes.cancel?.removeEventListener('click', cancelClick);
                document.removeEventListener('keydown', keydown);
                nodes.overlay.style.display = 'none';
                styles.forEach(([node, property, original]) => { node.style[property] = original; });
                active = null;
                previousFocus?.focus?.();
                request.resolve(result);
                drain();
            }
            const confirmClick = () => finish(true);
            const cancelClick = () => finish(false);
            // Escape 等价于取消；提示框没有取消操作，Escape 只关闭提示。
            const keydown = event => {
                if (event.key !== 'Escape') return;
                event.preventDefault();
                finish(!isConfirm);
            };
            active = { request, finish, isConfirm };
            nodes.confirm.addEventListener('click', confirmClick);
            if (isConfirm) nodes.cancel.addEventListener('click', cancelClick);
            document.addEventListener('keydown', keydown);
            nodes.overlay.style.display = 'flex';
            // 危险确认默认聚焦取消，提示框聚焦确认，便于键盘操作。
            (isConfirm ? nodes.cancel : nodes.confirm).focus?.();
        }

        function enqueue(mode, message, options) {
            return new Promise((resolve, reject) => {
                queue.push({ mode, message, options, resolve, reject });
                drain();
            });
        }

        // 返回 true 表示确认，false 表示取消；业务代码自行决定后续动作。
        function confirm(message, options = {}) { return enqueue('confirm', message, options); }
        function alert(message, options = {}) { return enqueue('alert', message, options); }
        // 页面需要主动关闭时也结算 Promise，不会遗留一个永远等待的请求。
        function close() { if (active) active.finish(!active.isConfirm); }

        return Object.freeze({ alert, confirm, close });
    }

    window.Dialog = Object.freeze({ create, text });
})();
