/**
 * 未保存修改的三选一提示：留下、放弃修改离开、保存成功后离开。
 * 同时管理修改标记、初始快照、比较与重置，不负责写入业务存储。
 * 页面只提供需要比较的数据、保存、放弃清理和最终离开动作。
 */
(function () {
    'use strict';

    /**
     * 修改追踪器：页面提供 getSnapshot，组件记录/比较快照并管理修改标记。
     * 回调可返回已序列化字符串或 JSON 数据；保存的快照不会跟着对象变动。
     * 手动 markDirty 用于拖拽、导入等非输入事件；input/change 自动标记。
     */
    function createTracker({ getSnapshot, onError = error => console.error('修改检测失败：', error) } = {}) {
        let initialSnapshot, initialized = false, dirty = false, eventRoot = null;
        function capture() {
            const value = getSnapshot();
            return typeof value === 'string' ? value : JSON.stringify(value);
        }
        function markDirty() { dirty = true; }
        // Local dialog drafts only become page edits when their Apply callback commits them.
        function markInputDirty(event) {
            if (event?.target?.closest?.('[data-unsaved-draft]')) return;
            markDirty();
        }
        function clearDirty() { dirty = false; }
        // 初始化或保存成功后重新建立基准；失败时不把现有修改误当作已保存。
        function reset() {
            try {
                initialSnapshot = capture();
                initialized = true;
                dirty = false;
                return true;
            } catch (error) { onError(error); return false; }
        }
        function hasChanges() {
            if (dirty) return true;
            if (!initialized) return false;
            try { return capture() !== initialSnapshot; }
            catch (error) { onError(error); return true; } // 比较失败时保守地提醒用户。
        }
        // 重复 start 只更新基准，不重复添加监听；可指定表单节点而非整个文档。
        function start(root = document) {
            if (eventRoot !== root) {
                stop();
                eventRoot = root;
                eventRoot?.addEventListener('input', markInputDirty, true);
                eventRoot?.addEventListener('change', markInputDirty, true);
            }
            return reset();
        }
        function stop() {
            eventRoot?.removeEventListener('input', markInputDirty, true);
            eventRoot?.removeEventListener('change', markInputDirty, true);
            eventRoot = null;
        }
        return Object.freeze({ markDirty, clearDirty, reset, hasChanges, start, stop });
    }

    function create({ elements = {}, tracker = null, shouldConfirm = null,
        save, leave = url => { window.location.href = url; },
        onStay = () => {}, onDiscard = () => {}, afterSave = () => {},
        onError = error => console.error('未保存修改处理失败：', error), saveDelay = 0 } = {}) {
        const ids = { overlay: 'unsavedModalOverlay', stay: 'btn-unsaved-stay',
            discard: 'btn-unsaved-discard', save: 'btn-unsaved-save', ...elements };
        let nodes, pending = null, busy = false, previousFocus = null;
        let leaving = false, unloadBound = false;
        async function navigate(url) {
            leaving = true;
            try { await leave(url); }
            catch (error) { leaving = false; throw error; }
        }
        function bindBeforeUnload() {
            if (unloadBound) return;
            unloadBound = true;
            window.addEventListener('beforeunload', event => {
                const changed = shouldConfirm ? shouldConfirm() : tracker?.hasChanges();
                if (leaving || !changed) return;
                event.preventDefault();
                event.returnValue = '';
            });
        }

        // 延迟绑定：既支持 HTML 底部加载，也支持 DOMContentLoaded 之后创建。
        function init() {
            if (nodes) return;
            const found = Object.fromEntries(Object.entries(ids).map(([key, id]) =>
                [key, typeof id === 'string' ? document.getElementById(id) : id]));
            if (Object.values(found).some(node => !node)) return;
            nodes = found;
            nodes.stay.addEventListener('click', () => { void choose('stay'); });
            nodes.discard.addEventListener('click', () => { void choose('discard'); });
            nodes.save.addEventListener('click', () => { void choose('save'); });
        }

        function hide() {
            nodes.overlay.style.display = 'none';
            document.removeEventListener('keydown', keydown);
        }
        function keydown(event) {
            if (event.key === 'Escape') {
                event.preventDefault();
                void choose('stay');
            }
        }

        // 保存或离开进行中锁住按钮，防止连点造成重复保存或目标被覆盖。
        async function choose(action) {
            if (!pending || busy) return;
            const target = pending;
            busy = true;
            Object.values(nodes).forEach(node => { if ('disabled' in node) node.disabled = true; });
            hide();
            try {
                if (action === 'stay') await onStay();
                else if (action === 'discard') {
                    await onDiscard();
                    tracker?.clearDirty();
                    await navigate(target.url);
                } else {
                    // 必须明确返回 true 才允许离开；校验失败、异常都不会跳转。
                    if (await save() === true) {
                        tracker?.reset();
                        await afterSave();
                        if (saveDelay > 0) await new Promise(resolve => setTimeout(resolve, saveDelay));
                        await navigate(target.url);
                    }
                }
            } catch (error) {
                onError(error);
            } finally {
                pending = null;
                busy = false;
                Object.values(nodes).forEach(node => { if ('disabled' in node) node.disabled = false; });
                previousFocus?.focus?.();
            }
        }

        function request(url) {
            if (pending || busy) return;
            const changed = shouldConfirm ? shouldConfirm() : tracker ? tracker.hasChanges() : true;
            if (!changed) { void navigate(url); return; }
            init();
            // 缺少提示节点时禁止静默放弃用户修改。
            if (!nodes) { onError(new Error('未保存提示弹窗节点缺失')); return; }
            pending = { url };
            previousFocus = document.activeElement;
            nodes.overlay.style.display = 'flex';
            document.addEventListener('keydown', keydown);
            nodes.stay.focus?.();
        }

        // 仅拦截页面指定的链接区（目前为侧栏），其余链接行为保持不变。
        function bindLinks(container) {
            container?.addEventListener('click', event => {
                const link = event.target.closest('a');
                if (!link?.href || link.href.startsWith('javascript:')) return;
                event.preventDefault();
                event.stopPropagation();
                request(link.href);
            }, true);
        }
        return Object.freeze({ request, bindLinks, bindBeforeUnload });
    }
    window.UnsavedChanges = Object.freeze({ createTracker, create });
})();
