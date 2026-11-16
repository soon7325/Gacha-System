/* Native modal keeps focus inside the policy and returns it to the opener. */
(function () {
    'use strict';
    const dialog = document.getElementById('home-privacy-dialog');
    if (!dialog) return;
    document.querySelectorAll('[data-open-privacy]').forEach(button => {
        button.addEventListener('click', () => {
            if (!dialog.open) dialog.showModal();
            dialog.querySelector('.home-privacy-body').scrollTop = 0;
        });
    });
    dialog.querySelector('[data-close-privacy]').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', event => {
        if (event.target !== dialog) return;
        const rect = dialog.getBoundingClientRect();
        if (event.clientX < rect.left || event.clientX > rect.right ||
            event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
    });
})();
