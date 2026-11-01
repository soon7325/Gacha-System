/**
 * 公共拖拽排序交互：拖拽来源、手柄、落点方向和高亮清理。
 * 不修改业务数组、不写存储；放下后通过 onReorder 通知页面处理排序。
 * 同容器/选择器重复绑定会先解绑旧事件，避免重渲染后一次拖拽执行多次。
 */
(function () {
    'use strict';
    const bindings = new WeakMap();

    function bind(container, itemSelector, onReorder, {
        axis = 'y', position = 'half', handleSelector = null, handleOnly = false,
        getId = item => item.dataset.id, canDrag = () => true,
        draggingClass = 'is-dragging', opacity = null,
        hoverClass = null, hoverBorder = false
    } = {}) {
        if (typeof container === 'string') container = document.getElementById(container);
        if (!container) return Object.freeze({ destroy() {} });
        const registered = bindings.get(container) || new Map();
        registered.get(itemSelector)?.destroy();
        bindings.set(container, registered);

        const items = [...container.querySelectorAll(itemSelector)];
        const listeners = [], attributes = [];
        const resetHandles = [];
        const beforeClass = axis === 'x' ? 'drag-over-left' : 'drag-over-top';
        const afterClass = axis === 'x' ? 'drag-over-right' : 'drag-over-bottom';
        let source = null, originalOpacity = '', originalBorder = new Map();
        let highlighted = null, highlightedBefore = null;

        function listen(node, type, callback) {
            node.addEventListener(type, callback);
            listeners.push([node, type, callback]);
        }
        function setDraggable(node) {
            attributes.push([node, node.getAttribute('draggable')]);
            node.setAttribute('draggable', 'true');
        }
        function clearHighlight(item) {
            if (hoverClass) item.classList.remove(hoverClass);
            else if (!hoverBorder) item.classList.remove(beforeClass, afterClass);
            if (originalBorder.has(item)) {
                item.style.borderTop = originalBorder.get(item);
                originalBorder.delete(item);
            }
        }
        // 在 drop 回调之前清理，页面即使立即重渲染也不会遗留半透明或高亮。
        function clear(resetHandleState = true) {
            if (source) {
                if (draggingClass) source.classList.remove(draggingClass);
                if (opacity !== null) source.style.opacity = originalOpacity;
            }
            items.forEach(clearHighlight);
            highlighted = null;
            highlightedBefore = null;
            source = null;
            if (resetHandleState) resetHandles.forEach(reset => reset());
        }
        function isBefore(event, target) {
            if (position === 'target') return true; // 侧栏沿用目标索引排序，不按上下半区判断。
            const rect = target.getBoundingClientRect();
            return axis === 'x' ? event.clientX - rect.left < rect.width / 2 : event.clientY - rect.top < rect.height / 2;
        }
        function validTarget(event, item) {
            return source && canDrag(source) && canDrag(item) && source !== item && event.target.closest(itemSelector) === item;
        }

        items.forEach(item => {
            const handle = handleOnly ? item.querySelector(handleSelector) : item;
            if (!handle) return;
            setDraggable(handle);
            let startedFromHandle = false;
            // 普通列表只允许从手柄开始拖动，输入框、删除按钮仍可正常操作。
            if (handleSelector && !handleOnly) {
                // 浏览器的 dragstart.target 是可拖拽的整行，不一定是按下的手柄。
                // 因此在按下时记录来源，dragstart 只检查记录，不能重新按目标猜测。
                const resetHandle = () => {
                    startedFromHandle = false;
                    item.setAttribute('draggable', 'false');
                };
                resetHandles.push(resetHandle);
                resetHandle();
                listen(item, 'mousedown', event => {
                    const found = event.target.closest(handleSelector);
                    startedFromHandle = !!found && item.contains(found) &&
                        event.target.closest(itemSelector) === item && canDrag(item);
                    item.setAttribute('draggable', startedFromHandle ? 'true' : 'false');
                });
                listen(item, 'mouseup', resetHandle);
            }
            listen(handle, 'dragstart', event => {
                const validHandle = !handleSelector || (handleOnly
                    ? !!event.target.closest(handleSelector) : startedFromHandle);
                if (!canDrag(item) || !validHandle) {
                    event.preventDefault();
                    return;
                }
                event.stopPropagation(); // 内层卡片/卡池拖拽不能同时启动外层分类拖拽。
                clear(false);
                startedFromHandle = false; // 一次按下只授权一次拖拽，结束后不能复用。
                source = item;
                originalOpacity = item.style.opacity;
                if (draggingClass) item.classList.add(draggingClass);
                if (opacity !== null) item.style.opacity = opacity;
                if (event.dataTransfer) {
                    event.dataTransfer.effectAllowed = 'move';
                    event.dataTransfer.setData('text/plain', String(getId(item) ?? ''));
                }
            });
            listen(item, 'dragover', event => {
                if (!validTarget(event, item)) return;
                event.preventDefault();
                event.stopPropagation();
                if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
                const before = isBefore(event, item);
                // 落点不变时不反复清空/重画高亮；只更新前后两项，减少闪烁和大列表开销。
                if (highlighted === item && highlightedBefore === before) return;
                if (highlighted) clearHighlight(highlighted);
                highlighted = item;
                highlightedBefore = before;
                if (hoverClass) item.classList.add(hoverClass);
                else if (hoverBorder) {
                    originalBorder.set(item, item.style.borderTop);
                    item.style.borderTop = '2px solid var(--primary, #3498db)';
                } else {
                    item.classList.toggle(beforeClass, before);
                    item.classList.toggle(afterClass, !before);
                }
            });
            listen(item, 'dragleave', event => {
                // 在同一项的子元素之间移动，不应闪烁或提前清掉落点提示。
                if (!event.relatedTarget || !item.contains(event.relatedTarget)) {
                    clearHighlight(item);
                    if (highlighted === item) { highlighted = null; highlightedBefore = null; }
                }
            });
            listen(item, 'drop', event => {
                if (!validTarget(event, item)) return;
                event.preventDefault();
                event.stopPropagation();
                const fromId = getId(source), toId = getId(item), before = isBefore(event, item);
                clear();
                onReorder(fromId, toId, before);
            });
            listen(handle, 'dragend', event => { event.stopPropagation(); clear(); });
        });

        // 松开鼠标即使发生在行外，也撤销尚未开始的手柄授权。
        if (document.addEventListener) {
            listen(document, 'mouseup', () => resetHandles.forEach(reset => reset()));
        }

        function destroy() {
            clear();
            listeners.forEach(([node, type, callback]) => node.removeEventListener(type, callback));
            attributes.forEach(([node, value]) => {
                if (value === null) node.removeAttribute('draggable');
                else node.setAttribute('draggable', value);
            });
            if (registered.get(itemSelector)?.destroy === destroy) registered.delete(itemSelector);
        }
        const binding = Object.freeze({ destroy });
        registered.set(itemSelector, binding);
        return binding;
    }
    window.DragSort = Object.freeze({ bind });
})();
