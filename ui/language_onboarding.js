/** First Home visit and the explicit Settings replay. Preferences stay intact. */
(function () {
    'use strict';
    const seenKey = 'GM_Home_Language_Guide_Seen';
    const replayKey = 'GM_Language_Guide_Replay';
    document.addEventListener('DOMContentLoaded', () => {
        const replay = document.getElementById('replay-language-guide');
        if (replay) {
            replay.addEventListener('click', async () => {
                if (!await window.customConfirm(window.getTrans('set_first_visit_confirm'))) return;
                // An already enabled preference belongs to the user. A replay
                // only lends bilingual hints to users who currently have them off.
                const modeKey = 'GM_Language_Guide_Replay_Bilingual';
                // The last explicit off choice overrides any earlier permanent
                // replay state. An automatic temporary enable stays temporary.
                const temporary = localStorage.getItem('GM_Bilingual_Hints') === 'false'
                    || sessionStorage.getItem(modeKey) === 'temporary';
                sessionStorage.setItem(modeKey, temporary ? 'temporary' : 'preserve');
                // Reset on Home, after Settings' pagehide handlers have finished.
                sessionStorage.setItem(replayKey, 'true');
                window.location.assign('html/index.html');
            });
            return;
        }
        if (sessionStorage.getItem(replayKey) === 'true') {
            sessionStorage.removeItem(replayKey);
            localStorage.removeItem(seenKey);
            localStorage.removeItem('GM_Language_Guide_Seen');
            localStorage.setItem('GM_Bilingual_Hints', 'true');
            window.applyTranslations?.();
            window.renderSidebar?.();
        }
        if (localStorage.getItem(seenKey) === 'true') return;
        const sidebar = document.querySelector('.sidebar');
        if (!sidebar) return;
        const layer = document.createElement('aside');
        layer.id = 'home-language-guide';
        layer.setAttribute('aria-label', '语言切换引导 / Language guide');
        layer.innerHTML = `<svg class="language-guide-arrow" aria-hidden="true"><defs><marker id="language-guide-tip" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M1 1 L6 4 L1 7"/></marker></defs><path class="language-guide-line" marker-end="url(#language-guide-tip)"/></svg>
            <div class="language-guide-card" role="status">
                <button type="button" class="language-guide-close" aria-label="关闭引导 / Close guide">×</button>
                <strong lang="zh-CN">在设置中切换语言</strong>
                <p lang="zh-CN">点击设置，再次点击进入设置页面，即可切换语言。</p>
                <strong lang="en">Change language in Settings</strong>
                <p lang="en">Click Settings, then click it again to open the settings page and change language.</p>
            </div>`;
        if (localStorage.getItem('GM_Settings_Popover') === 'false') {
            layer.querySelector('p[lang="zh-CN"]').textContent = '点击设置，进入设置页面切换语言。';
            layer.querySelector('p[lang="en"]').textContent = 'Click Settings to open the settings page and change language.';
        }
        function syncLanguage() {
            const bilingual = localStorage.getItem('GM_Bilingual_Hints') !== 'false';
            const english = localStorage.getItem('GM_Lang') === 'en';
            layer.querySelectorAll('[lang]').forEach(node => {
                node.hidden = !bilingual && (node.lang === 'en') !== english;
            });
            const text = [...layer.querySelectorAll('[lang]')];
            if ((text[0].lang === 'en') !== english) {
                const container = layer.querySelector('.language-guide-card');
                container.append(...text.filter(node => (node.lang === 'en') === english),
                    ...text.filter(node => (node.lang === 'en') !== english));
            }
            layer.setAttribute('aria-label', bilingual ? (english ? 'Language guide / 语言切换引导' : '语言切换引导 / Language guide') : english ? 'Language guide' : '语言切换引导');
            layer.querySelector('button').setAttribute('aria-label', bilingual ? (english ? 'Close guide / 关闭引导' : '关闭引导 / Close guide') : english ? 'Close guide' : '关闭引导');
        }
        syncLanguage();
        // A visit counts immediately, including refreshes before dismissal.
        localStorage.setItem(seenKey, 'true');
        document.body.append(layer);
        const card = layer.querySelector('.language-guide-card');
        const line = layer.querySelector('.language-guide-line');
        line.setAttribute('marker-end', 'url(' + location.href.split('#')[0] + '#language-guide-tip)');
        function position() {
            syncLanguage();
            const entry = sidebar.querySelector('a[href$="settings.html"]');
            if (!entry) { layer.hidden = true; return; }
            const r = entry.getBoundingClientRect();
            layer.hidden = !r.width || !r.height || r.bottom <= 0 || r.top >= innerHeight;
            const width = Math.min(310, innerWidth - 32);
            card.style.width = width + 'px';
            const edge = sidebar.getBoundingClientRect().right;
            const beside = edge + width + 38 <= innerWidth;
            const left = beside ? edge + 32 : Math.max(16, innerWidth - width - 16);
            const top = Math.max(16, Math.min(beside ? r.bottom - card.offsetHeight : r.top - card.offsetHeight - 40, innerHeight - card.offsetHeight - 16));
            card.style.left = left + 'px';
            card.style.top = top + 'px';
            const icon = entry.querySelector('svg')?.getBoundingClientRect() || r;
            const x = Math.min(innerWidth - 8, icon.right + 6), y = icon.top + icon.height / 2;
            const sx = beside ? left : left + width / 2, sy = beside ? top + card.offsetHeight / 2 : top + card.offsetHeight;
            line.setAttribute('d', `M ${sx} ${sy} Q ${sx} ${y} ${x} ${y}`);
        }
        const observer = new MutationObserver(position);
        observer.observe(sidebar, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
        // Sidebar width animates when collapsing, including its initial render.
        const sizes = new ResizeObserver(position);
        sizes.observe(sidebar);
        sizes.observe(card);
        window.addEventListener('resize', position);
        document.addEventListener('scroll', position, true);
        window.addEventListener('storage', position);
        function dismiss() {
            observer.disconnect();
            sizes.disconnect();
            window.removeEventListener('resize', position);
            document.removeEventListener('scroll', position, true);
            window.removeEventListener('storage', position);
            layer.remove();
        }
        layer.querySelector('button').addEventListener('click', dismiss);
        window.addEventListener('pagehide', dismiss, { once: true });
        position();
    });
})();
