/** Full-screen homepage and data-driven game archive. No storage mutations. */
(function () {
    'use strict';
    const INTERVAL = 60000;
    const pick = values => values[Math.floor(Math.random() * values.length)];
    const t = key => window.getTrans ? window.getTrans(key) : key;
    function language() {
        try { return localStorage.getItem('GM_Lang') === 'en' ? 'en' : 'zh'; }
        catch (_) { return 'zh'; }
    }
    const matchesLanguage = (image, lang) => !image.language || image.language === 'both' || image.language === lang;
    const imagesFor = (game, lang = language()) => game.images.filter(image => matchesLanguage(image, lang));

    function init() {
        const deck = document.getElementById('home-deck');
        if (!deck) return;
        // Resolve SVG fragments against the page, not the resource base URL.
        deck.querySelector('[fill="url(#orbit-halo)"]')?.setAttribute('fill', 'url(' + location.href.split('#')[0] + '#orbit-halo)');
        const screens = [...deck.querySelectorAll('.home-screen')];
        const dots = [...document.querySelectorAll('[data-home-target]')];
        let currentScreen = 0;
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
        function go(index) {
            screens[Math.max(0, Math.min(index, screens.length - 1))].scrollIntoView({ behavior: reduced.matches ? 'instant' : 'smooth', block: 'start' });
        }
        dots.forEach((dot, index) => dot.addEventListener('click', () => go(index)));
        deck.querySelector('[data-home-next]').addEventListener('click', () => go(1));
        deck.querySelector('[data-home-explore]').addEventListener('click', event => { event.preventDefault(); go(2); });
        const gameScreen = document.getElementById('games');
        let gameVisible = false;
        function updateScreen() {
            const top = deck.getBoundingClientRect().top;
            let nearest = Infinity;
            screens.forEach((screen, index) => {
                const rect = screen.getBoundingClientRect();
                const distance = rect.top <= top + 2 && rect.bottom > top + 2 ? 0 : Math.abs(rect.top - top);
                if (distance < nearest) { nearest = distance; currentScreen = index; }
            });
            dots.forEach((dot, index) => dot.setAttribute('aria-current', String(index === currentScreen)));
            const rect = gameScreen.getBoundingClientRect();
            gameVisible = rect.top < top + deck.clientHeight * .5 && rect.bottom > top + deck.clientHeight * .5;
        }
        deck.addEventListener('scroll', updateScreen, { passive: true });
        window.addEventListener('resize', updateScreen);
        updateScreen();
        document.addEventListener('keydown',event=>{
            if(event.defaultPrevented||event.repeat||event.ctrlKey||event.altKey||event.metaKey||(window.Dialog?.isOpen?.()||document.querySelector('dialog[open]'))||event.target.closest('input,select,textarea,[contenteditable],.custom-select-ui,[role=listbox],[role=combobox],[role=slider]'))return;
            const delta=event.key==='ArrowRight'?1:event.key==='ArrowLeft'?-1:0;
            if(delta){event.preventDefault();updateScreen();go(currentScreen+delta);}
        });
        // PageUp/Down use native scroll so tall sections remain readable; Home/End jump sections.
        deck.addEventListener('keydown', event => {
            if (event.target !== deck) return;
            if (event.key === 'Home' || event.key === 'End') {
                event.preventDefault(); go(event.key === 'Home' ? 0 : screens.length - 1);
            }
        });

        // The public showcase remains available even when a game's functional catalog is hidden.
        const games = (window.HOME_GAME_ASSETS || []).filter(game => game.images?.length &&
            (game.id !== 'test' || window.TestCatalog?.visible(game.id)));
        const dashboardLink = document.getElementById('home-game-link');
        const accessToast = window.Toast.create({ target: 'home-toast', duration: 4000 });
        function updateDashboardAccess() {
            const id = dashboardLink.dataset.gameId;
            const allowed = !!id && (window.TestCatalog?.visible(id) ?? true);
            // A disabled game's context-menu link also stays on the homepage.
            dashboardLink.href = allowed ? dashboardLink.dataset.destination : 'html/index.html#games';
            dashboardLink.setAttribute('aria-disabled', String(!allowed));
            return allowed;
        }
        function openDashboard(event) {
            if (event.type === 'auxclick' && event.button !== 1) return;
            if (updateDashboardAccess()) return;
            event.preventDefault();
            if (dashboardLink.dataset.gameId) accessToast.show(t('home_catalog_disabled'), 'warn');
        }
        dashboardLink.addEventListener('click', openDashboard);
        dashboardLink.addEventListener('auxclick', openDashboard);
        window.addEventListener('pageshow', updateDashboardAccess);
        window.addEventListener('pageshow', syncLanguage);
        window.addEventListener('storage', event => {
            const key = window.VersionStorage ? window.VersionStorage.eventKey(event.key) : event.key;
            if (key === null || window.TestCatalog?.isVisibilityKey(key)) updateDashboardAccess();
            if (key === null || key === 'GM_Lang') syncLanguage();
        });
        const icons = document.getElementById('home-game-icons');
        const layers = [...gameScreen.querySelectorAll('.home-backdrop')];
        const prev = document.getElementById('home-game-prev');
        const next = document.getElementById('home-game-next');
        const toggle = document.getElementById('home-rotation-toggle');
        const imageNext = document.getElementById('home-image-next');
        const progress = document.getElementById('home-rotation-progress');
        const failed = new Set();
        let active = -1, shownImage = null, layer = 0, request = 0, elapsed = 0;
        let displayLanguage = language(), pendingIndex = null;
        let paused = reduced.matches, loading = false;
        function name(game) {
            const key = 'game_' + game.id;
            const translated = t(key);
            const preset = typeof PRESET_GAMES_LIST === 'undefined' ? null : PRESET_GAMES_LIST.find(item => item.id === game.id);
            return translated !== key ? translated : preset?.gameName || game.prefix;
        }
        function renderIcons() {
            const focused = icons.contains(document.activeElement) ? document.activeElement.dataset.gameId : null;
            icons.replaceChildren();
            // The active game stays in the centre when the catalog exceeds the three visible slots.
            const indices = games.length <= 3 ? games.map((_, index) => index) :
                [-1, 0, 1].map(offset => (active + offset + games.length) % games.length);
            indices.forEach(index => {
                const game = games[index];
                const button = document.createElement('button');
                button.type = 'button';
                button.className = 'home-game-icon';
                button.dataset.gameId = game.id;
                button.title = name(game);
                button.setAttribute('aria-label', name(game));
                button.setAttribute('aria-pressed', String(index === active));
                if (game.icon) {
                    const img = document.createElement('img');
                    img.src = game.icon; img.alt = '';
                    img.addEventListener('error', () => { button.textContent = game.prefix; });
                    button.append(img);
                } else button.textContent = game.prefix;
                button.addEventListener('click', () => { if (index !== active) select(index, true); });
                icons.append(button);
            });
            if (focused) [...icons.children].find(button => button.dataset.gameId === focused)?.focus({ preventScroll: true });
            document.getElementById('home-game-position').textContent = `${String(active + 1).padStart(2, '0')} / ${String(games.length).padStart(2, '0')}`;
        }
        function labels() {
            toggle.textContent = t(paused ? 'home_resume' : 'home_pause');
            toggle.setAttribute('aria-pressed', String(paused));
            imageNext.disabled = loading || active < 0 || !imagesFor(games[active]).some(image =>
                !failed.has(image.src) && image.src !== shownImage?.src);
            if (active < 0) return;
            const game = games[active];
            document.getElementById('home-game-name').textContent = name(game);
            document.getElementById('home-game-prefix').textContent = game.prefix + ' / GAME ARCHIVE';
            const available = imagesFor(game);
            const index = available.indexOf(shownImage);
            document.getElementById('home-image-kind').textContent = index >= 0 ?
                `${t(shownImage.latest ? 'home_latest' : 'home_permanent')} · ${String(index + 1).padStart(2, '0')} / ${String(available.length).padStart(2, '0')}` : t('home_image_unavailable');
            const pools = window.GameData?.loadPoolIds(game.id, { standaloneOnly: true }) || [];
            const pool = pools.includes('char_up') ? 'char_up' : pools[0];
            dashboardLink.dataset.gameId = game.id;
            dashboardLink.dataset.destination = 'html/dashboard.html?gameId=' + encodeURIComponent(game.id) +
                (pool ? '&pool=' + encodeURIComponent(pool) : '');
            updateDashboardAccess();
            renderIcons();
        }
        function preload(src) {
            return new Promise(resolve => {
                const img = new Image();
                let finished = false;
                const finish = success => { if (!finished) { finished = true; clearTimeout(timeout); resolve(success); } };
                const timeout = setTimeout(() => finish(false), 12000);
                img.onload = () => finish(true);
                img.onerror = () => finish(false);
                img.src = src;
            });
        }
        async function select(index, preferLatest = false, nextImage = false, preferredKey = null) {
            const token = ++request;
            const game = games[index];
            const lang = language();
            const available = imagesFor(game, lang);
            loading = true;
            pendingIndex = index;
            imageNext.disabled = true;
            // Manual next walks the current game's images in filename order and wraps around.
            const currentImage = available.indexOf(shownImage);
            const ordered = nextImage && currentImage >= 0 ?
                [...available.slice(currentImage + 1), ...available.slice(0, currentImage)] : available;
            let candidates = ordered.filter(img => !failed.has(img.src) && img.src !== shownImage?.src);
            if (!candidates.length) candidates = available.filter(img => !failed.has(img.src));
            while (candidates.length) {
                const latest = candidates.filter(img => img.latest);
                const matching = preferredKey ? candidates.filter(img => img.key === preferredKey) : [];
                const image = nextImage ? candidates[0] : pick(matching.length ? matching : preferLatest && latest.length ? latest : candidates);
                const success = await preload(image.src);
                if (token !== request) return;
                // A slower request from the previous language must never replace the new language.
                if (lang !== language()) { syncLanguage(); return; }
                if (success) {
                    const target = layers[1 - layer];
                    target.style.backgroundImage = `url(${JSON.stringify(image.src)})`;
                    target.classList.add('is-visible');
                    layers[layer].classList.remove('is-visible');
                    layer = 1 - layer;
                    active = index; shownImage = image; elapsed = 0; loading = false; pendingIndex = null;
                    progress.style.transform = 'scaleX(0)';
                    labels();
                    return;
                }
                failed.add(image.src);
                candidates = candidates.filter(candidate => candidate !== image);
            }
            if (index === active && shownImage && matchesLanguage(shownImage, lang)) {
                // Keep the working background when every other image for this game failed.
                loading = false; elapsed = 0; pendingIndex = null;
                progress.style.transform = 'scaleX(0)';
                labels();
                return;
            }
            // Never put an unrelated game's image behind a failed game's title.
            active = index; shownImage = null; loading = false; elapsed = 0; pendingIndex = null;
            layers.forEach(item => item.classList.remove('is-visible'));
            labels();
        }
        prev.disabled = next.disabled = games.length < 2;
        prev.addEventListener('click', () => select((active - 1 + games.length) % games.length, true));
        next.addEventListener('click', () => select((active + 1) % games.length, true));
        toggle.addEventListener('click', () => { paused = !paused; labels(); });
        imageNext.addEventListener('click', () => {
            if (!loading && active >= 0) select(active, false, true);
        });
        function syncLanguage() {
            const lang = language();
            if (lang === displayLanguage) { labels(); return; }
            displayLanguage = lang;
            const target = pendingIndex ?? active;
            const key = shownImage?.key;
            if (shownImage && !matchesLanguage(shownImage, lang)) {
                layers.forEach(item => item.classList.remove('is-visible'));
                shownImage = null;
            }
            // Shared pictures can stay in place; otherwise prefer the same picture's translated variant.
            if (target >= 0 && (loading || !shownImage)) select(target, true, false, key);
            labels();
        }
        // Shared translations can run again after changing language in quick settings.
        const languageObserver = new MutationObserver(syncLanguage);
        languageObserver.observe(document.getElementById('games-label'), { childList: true });
        if (!games.length) {
            document.getElementById('home-image-kind').textContent = t('home_image_unavailable');
            toggle.disabled = true;
            return;
        }
        labels();
        const initialGames = games.map((game, index) => index).filter(index => imagesFor(games[index]).length);
        select(initialGames.length ? pick(initialGames) : 0, true);
        let lastTick = performance.now();
        setInterval(() => {
            const now = performance.now();
            const delta = Math.min(now - lastTick, 1000);
            lastTick = now;
            if (document.hidden || !gameVisible || paused || loading || active < 0) return;
            elapsed += delta;
            progress.style.transform = `scaleX(${Math.min(1, elapsed / INTERVAL)})`;
            if (elapsed >= INTERVAL) {
                // Background rotation never changes the selected game or dashboard destination.
                select(active);
            }
        }, 200);
    }
    document.addEventListener('DOMContentLoaded', init);
})();
