/** 货币规则独立保存；与图鉴只共享游戏身份，不共享未保存草稿。 */
const currencyParams = new URLSearchParams(window.location.search);
let gameId = currencyParams.get('gameId');
const getLang = ItemFormat.getLanguage;
const currencyText = (zh, en) => getLang() === 'en' ? en : zh;
let currencyLoadError = false;
let gameInfo;
try {
    if (!gameId) throw new Error(currencyText('请先保存游戏配置，再进入货币规则设置。', 'Save the game configuration before opening currency rules.'));
    const saved = JSON.parse(localStorage.getItem('GM_Info_' + gameId) || 'null');
    const preset = GameData.getPresetSetup(gameId);
    if (!saved && !preset) throw new Error(currencyText('未找到已保存的游戏配置，请先返回图鉴保存。', 'Saved game configuration not found. Return to the catalog and save first.'));
    const official = typeof PRESET_GAME_IDS !== 'undefined' && PRESET_GAME_IDS.includes(gameId);
    gameInfo = Object.assign({ categories: [], globalTiers: GameData.getPresetTiers(gameId) || [] }, ...(official ? [saved || {}, preset || {}] : [preset || {}, saved || {}]));
} catch (error) {
    currencyLoadError = error.message;
    gameInfo = { categories: [], globalTiers: [] };
}
function readEngineEdit(key) { return localStorage.getItem(key); }
const currencyIsPreset = () => typeof PRESET_GAME_IDS !== 'undefined' && PRESET_GAME_IDS.includes(gameId);
const galleryPreviewLock = PreviewLock.create({
    isPreset: currencyIsPreset,
    getLabels: () => ({
        lock: currencyText('👁️ 锁定预览', '👁️ Preview'), unlock: currencyText('🔓 解除预览', '🔓 Edit rules'),
        readOnly: currencyText('🔒 预设只读预览', '🔒 Preset read-only preview'),
        banner: currencyText('系统预设图鉴：货币规则与满阶设置仅供只读预览，无法修改或保存。如需自定义，请新建游戏。', 'System preset: currency rules and copy caps are read-only and cannot be edited or saved. Create a custom game to edit them.')
    }),
    banner: {id: 'currency-preset-banner'}
});
window.showToast = Toast.create().show;
const currencyTracker = UnsavedChanges.createTracker({ getSnapshot: () => ({ economy: gameInfo.economy, caps: gameInfo.overflowRules }) });
window.markPageDirty = () => currencyTracker.markDirty();
function currencyReturnUrl() {
    const params = new URLSearchParams();
    if (gameId) params.set('gameId', gameId);
    return 'html/user_data.html' + (params.size ? '?' + params : '');
}
function syncGalleryReadonlyControls() {
    const locked = !!currencyLoadError || galleryPreviewLock.isLocked();
    document.querySelectorAll('#gallery-economy input, #gallery-economy select, #gallery-economy textarea, #gallery-economy button[data-eco-action]').forEach(control => {
        if (control.disabled !== locked) control.disabled = locked;
    });
    document.getElementById('btn-currency-save').disabled = locked;
    document.getElementById('btn-currency-save').textContent = currencyIsPreset()
        ? currencyText('🔒 预设游戏只读', '🔒 Read-only preset')
        : currencyText('💾 保存货币规则', '💾 Save currency rules');
    document.getElementById('btn-preview-toggle').disabled = currencyIsPreset() || !!currencyLoadError;
    document.querySelectorAll('#gallery-economy [draggable]').forEach(handle => handle.setAttribute('draggable', String(!locked)));
    document.querySelectorAll('#gallery-economy .eco-multi').forEach(group => {
        if (locked) group.open = false;
        const summary = group.querySelector('summary');
        summary.setAttribute('aria-disabled', String(locked));
        summary.tabIndex = locked ? -1 : 0;
        if (locked && document.activeElement === summary) summary.blur();
    });
}
function saveCurrencyRules(showFeedback = false) {
    if (currencyLoadError || galleryPreviewLock.isLocked() || !GalleryEconomy.validateForSave()) return false;
    try {
        const current = JSON.parse(localStorage.getItem('GM_Info_' + gameId) || 'null');
        if (!current) throw new Error(currencyText('游戏配置已不存在，请返回图鉴检查。', 'The game configuration no longer exists. Return to the catalog.'));
        // 每次从最新记录合并，只提交货币页字段，不覆盖图鉴和卡池。
        current.economy = gameInfo.economy;
        current.overflowRules = gameInfo.overflowRules;
        localStorage.setItem('GM_Info_' + gameId, JSON.stringify(current));
        currencyTracker.reset();
        if (showFeedback) showToast(currencyText('货币规则已保存。', 'Currency rules saved.'), 'success');
        return true;
    } catch (error) { showToast(error.message, 'danger'); return false; }
}
const currencyUnsaved = UnsavedChanges.create({
    tracker: currencyTracker,
    shouldConfirm: () => !currencyIsPreset() && currencyTracker.hasChanges(),
    save: saveCurrencyRules,
    onError: error => showToast(error.message, 'danger')
});
window.safeNavigate = url => currencyUnsaved.request(url);
window.togglePreviewMode = () => { galleryPreviewLock.toggle(); syncGalleryReadonlyControls(); };
document.addEventListener('DOMContentLoaded', () => {
    if (typeof renderSidebar === 'function') renderSidebar();
    if (currencyIsPreset()) galleryPreviewLock.applyPreset();
    const title = document.getElementById('currency-game-name');
    title.textContent = (getLang() === 'en' && (gameInfo.enGameName || gameInfo.enName)) || gameInfo.gameName || gameId || currencyText('新游戏', 'New game');
    const saveButton = document.getElementById('btn-currency-save');
    saveButton.textContent = currencyText('💾 保存货币规则', '💾 Save currency rules');
    saveButton.onclick = () => saveCurrencyRules(true);
    document.getElementById('btn-currency-back').onclick = () => currencyUnsaved.request(currencyReturnUrl());
    document.getElementById('btn-currency-back').textContent=currencyText('返回玩家数据','Back to player data');
    if (currencyLoadError) document.getElementById('currency-load-error').textContent = currencyLoadError;
    else GalleryEconomy.render();
    syncGalleryReadonlyControls();
    currencyTracker.start();
    currencyUnsaved.bindLinks(document.querySelector('.sidebar'));
    currencyUnsaved.bindBeforeUnload?.();
});
