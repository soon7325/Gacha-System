/* Delegation also handles the policy content replaced by language switching. */
(function () {
    'use strict';
    const timers = new WeakMap();
    document.addEventListener('click', async event => {
        const button = event.target.closest('[data-copy-email]');
        if (!button || button.disabled) return;
        const row = button.closest('.home-email-row');
        const address = row.querySelector('.home-email-address').textContent.trim();
        const status = row.querySelector('.home-email-status');
        clearTimeout(timers.get(button));
        status.textContent = '';
        button.disabled = true;
        try {
            await navigator.clipboard.writeText(address);
            status.textContent = window.getTrans('home_email_copied');
            timers.set(button, setTimeout(() => { status.textContent = ''; }, 2500));
        } catch (_) {
            status.textContent = window.getTrans('home_email_copy_failed');
        } finally {
            button.disabled = false;
        }
    });
})();
