/* Reserve the release body when collapsed; only overflowing content scrolls. */
(function () {
    'use strict';
    const toggle = document.getElementById('home-update-toggle');
    const region = document.getElementById('home-update-content');
    if (!toggle || !region) return;
    const content = region.firstElementChild;
    function refresh() {
        const expanded = toggle.getAttribute('aria-expanded') === 'true';
        const overflowing = expanded && content.getBoundingClientRect().height > region.clientHeight + 1;
        region.classList.toggle('is-scrollable', overflowing);
        region.classList.toggle('is-collapsed', !expanded);
        region.setAttribute('aria-hidden', String(!expanded));
        region.tabIndex = overflowing ? 0 : -1;
        if (!overflowing) region.scrollTop = 0;
    }
    toggle.addEventListener('click', () => {
        toggle.setAttribute('aria-expanded', String(toggle.getAttribute('aria-expanded') !== 'true'));
        refresh();
    });
    const resize = new ResizeObserver(refresh);
    resize.observe(region);
    resize.observe(content);
    // Translation replaces the release notes without reloading the page.
    new MutationObserver(refresh).observe(content, { childList: true, subtree: true, characterData: true });
    refresh();
})();
