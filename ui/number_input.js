/** Shared number-input UI. Keeps native inputs, validation and existing handlers. */
(function () {
    'use strict';
    const bindings = new WeakMap();
    let held = null;
    function stop() {
        if (!held) return;
        clearTimeout(held.timer);
        held = null;
    }
    function blocked(input) {
        return !input.isConnected || input.disabled || input.readOnly || input.matches(':disabled') ||
            !!input.closest('[inert]') || getComputedStyle(input).pointerEvents === 'none';
    }
    function labels(binding) {
        let english = document.documentElement.lang?.startsWith('en');
        try { english = (localStorage.getItem('GM_Lang') || document.documentElement.lang || 'zh').startsWith('en'); } catch (_) {}
        for (const [index, button] of binding.buttons.entries()) {
            const label = english ? (index ? 'Decrease' : 'Increase') : (index ? '减少' : '增加');
            button.title = label;
            button.setAttribute('aria-label', label);
            button.disabled = blocked(binding.input);
        }
    }
    function step(input, direction) {
        if (blocked(input)) { stop(); return; }
        const before = input.value;
        try {
            if (input.step === 'any') {
                const min = input.min.trim() ? Number(input.min) : -Infinity;
                const max = input.max.trim() ? Number(input.max) : Infinity;
                let value = (Number.isFinite(input.valueAsNumber) ? input.valueAsNumber : 0) + direction;
                if (Number.isFinite(min)) value = Math.max(min, value);
                if (Number.isFinite(max)) value = Math.min(max, value);
                input.valueAsNumber = value;
            } else if (direction > 0) input.stepUp();
            else input.stepDown();
        } catch (_) { return; }
        if (before === input.value) return;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
    }
    function bind(input) {
        if (bindings.has(input) || input.type !== 'number' || input.hasAttribute('data-native-number')) return;
        const wrapper = document.createElement('span');
        wrapper.className = 'number-input';
        // Inline widths include %, so full-width fields keep adapting to the page.
        const computed = getComputedStyle(input);
        wrapper.style.width = input.style.width || computed.width;
        if (parseFloat(computed.width) <= 65) wrapper.style.setProperty('--number-stepper-width', '16px');
        for (const property of ['flex', 'flexGrow', 'flexShrink', 'flexBasis', 'alignSelf', 'gridColumn', 'gridRow', 'order', 'marginTop', 'marginRight', 'marginBottom', 'marginLeft']) {
            if (input.style[property]) wrapper.style[property] = input.style[property];
        }
        if (computed.display === 'none') wrapper.hidden = true;
        wrapper.style.borderRadius = computed.borderRadius;
        input.before(wrapper);
        wrapper.appendChild(input);
        const controls = document.createElement('span');
        controls.className = 'number-input-buttons';
        const buttons = [1, -1].map(direction => {
            const button = document.createElement('button');
            button.type = 'button';
            button.tabIndex = -1; // Keyboard users keep native ArrowUp/ArrowDown on the input.
            button.className = 'number-input-button';
            button.dataset.numberStep = String(direction);
            button.innerHTML = `<svg viewBox="0 0 10 6" aria-hidden="true"><path d="${direction > 0 ? 'M1 5 5 1 9 5' : 'M1 1 5 5 9 1'}" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
            button.addEventListener('pointerdown', event => {
                if (event.defaultPrevented || event.button !== 0 || blocked(input)) return;
                event.preventDefault();
                event.stopPropagation();
                stop();
                input.focus({ preventScroll: true });
                step(input, direction);
                if (!input.isConnected) return;
                const hold = { input, timer: null };
                held = hold;
                const repeat = () => {
                    if (held !== hold || blocked(input)) { stop(); return; }
                    step(input, direction);
                    if (held === hold) hold.timer = setTimeout(repeat, 85);
                };
                hold.timer = setTimeout(repeat, 400);
            });
            button.addEventListener('click', event => {
                const allowed = !event.defaultPrevented;
                event.preventDefault(); // Avoid a containing label reactivating the input.
                event.stopPropagation();
                if (allowed && event.detail === 0) step(input, direction); // AT / keyboard activation.
            });
            controls.appendChild(button);
            return button;
        });
        wrapper.appendChild(controls);
        const binding = { input, wrapper, buttons, controls, width: input.style.width };
        bindings.set(input, binding);
        input.addEventListener('blur', () => { if (held?.input === input) stop(); });
        labels(binding);
    }
    function refresh(root = document) {
        if (root.matches?.('input[type="number"]')) bind(root);
        root.querySelectorAll?.('input[type="number"]').forEach(bind);
    }
    function start() {
        refresh();
        const observer = new MutationObserver(mutations => {
            for (const mutation of mutations) {
                if (mutation.type === 'childList') mutation.addedNodes.forEach(node => { if (node.nodeType === 1) refresh(node); });
                else if (mutation.target instanceof HTMLInputElement) {
                    const input = mutation.target, binding = bindings.get(input);
                    if (!binding) { bind(input); continue; }
                    binding.wrapper.hidden = input.hidden || getComputedStyle(input).display === 'none';
                    binding.controls.hidden = input.type !== 'number';
                    if (input.style.width !== binding.width) {
                        binding.width = input.style.width;
                        binding.wrapper.style.width = input.style.width || getComputedStyle(input).width;
                    }
                    labels(binding);
                } else if (mutation.target === document.body || mutation.target === document.documentElement || mutation.target.tagName === 'FIELDSET') {
                    document.querySelectorAll('.number-input > input').forEach(input => labels(bindings.get(input)));
                }
            }
            if (held && blocked(held.input)) stop();
        });
        observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true,
            attributeFilter: ['disabled', 'readonly', 'hidden', 'type', 'class', 'style', 'lang', 'inert'] });
        document.addEventListener('pointerup', stop, true);
        document.addEventListener('pointercancel', stop, true);
        document.addEventListener('visibilitychange', stop);
        window.addEventListener('blur', stop);
    }
    window.NumberInputUI = Object.freeze({ refresh });
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
    else start();
})();
