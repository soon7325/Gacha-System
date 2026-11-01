/** Icons remain strings in saved data: Emoji, image URL, or uploaded PNG. */
(function () {
    'use strict';
    const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
    function isImage(value) {
        return typeof value === 'string' && (/^https?:\/\/[^\s<>"']+$/i.test(value) || /^data:image\/(?:png|jpeg|webp|gif);base64,[a-z0-9+/=]+$/i.test(value) || /^(?:\.?\.?\/)?img\/[\w\p{L}\p{M}./% -]+\.(?:png|jpe?g|webp|gif|avif)$/iu.test(value));
    }
    function html(value, fallback = '✨') {
        value = String(value || fallback).trim();
        return isImage(value) ? `<img class="inline-icon-image" src="${escape(value)}" alt="" loading="lazy" draggable="false">` : escape(value);
    }
    const logos = {hsr:'HSR', zzz:'ZZZ', end:'END', ark:'ARK'};
    function game(gameId, value) { return value || (logos[gameId] ? `img/${logos[gameId]}/icon/game_icon.webp` : gameId === 'test' ? 'img/TEST/icon/game_icon.png' : '🛠️'); }
    const text = value => isImage(value) ? '' : String(value || '');
    window.IconRender = Object.freeze({isImage, html, game, text, escape});
})();
