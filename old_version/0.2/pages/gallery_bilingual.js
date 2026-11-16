/** 图鉴配置页的双语字段接线；主语言和另一语言分别写入原有字段。 */
(function () {
    'use strict';
    let itemDraft = {};
    let controller;
    const selector = '#input-game-name, #input-item-name, #input-item-short, .input-tier-name, #custom-tags-container .tier-row input[type="text"], .cat-name-input, .pool-name-input';
    const field = (language, zh = 'name', en = 'en') => language === 'en' ? en : zh;
    const refresh = input => controller?.refresh(input);
    window.GalleryBilingual = {
        setItemDraft(item = {}) {
            BilingualInput.close();
            itemDraft = { name: item.name || '', en: item.en || '', short: item.short || '', eshort: item.eshort || '' };
            refresh(document.getElementById('input-item-name'));
            refresh(document.getElementById('input-item-short'));
        },
        getItemDraft() { return { ...itemDraft }; }
    };
    function resolve(input) {
        let getValue, setValue;
        if (input.id === 'input-game-name') {
            getValue = language => gameInfo[field(language, 'gameName', 'enGameName')];
            setValue = (language, value) => { gameInfo[field(language, 'gameName', 'enGameName')] = value; markPageDirty(); };
        } else if (input.id === 'input-item-name' || input.id === 'input-item-short') {
            const short = input.id === 'input-item-short';
            getValue = language => itemDraft[field(language, short ? 'short' : 'name', short ? 'eshort' : 'en')];
            setValue = (language, value) => { itemDraft[field(language, short ? 'short' : 'name', short ? 'eshort' : 'en')] = value; };
        } else if (input.classList.contains('pool-name-input')) {
            const id = input.closest('.pool-sort-row').dataset.id;
            getValue = language => (JSON.parse(readEngineEdit('GM_RosterPools_' + gameId)) || []).find(pool => pool.id === id)?.[field(language)];
            setValue = (language, value) => {
                // 与其他配置一样等待页面保存；放弃编辑不会把双语卡池名提前写入正式存储。
                if (!pendingEngineWrites) beginEngineImport();
                updateCustomPoolName(id, value, language);
            };
        } else if (input.classList.contains('cat-name-input')) {
            const id = input.closest('.category-box').dataset.id;
            getValue = language => gameInfo.categories.find(cat => cat.id === id)?.[field(language)];
            setValue = (language, value) => updateCategoryName(id, value, language);
        } else {
            const id = input.closest('.tier-row').dataset.id;
            const tier = input.classList.contains('input-tier-name');
            getValue = language => (tier ? gameInfo.globalTiers.find(item => item.id === id) : gameInfo.tagDefinitions?.[id])?.[field(language)];
            setValue = (language, value) => tier ? updateTier(id, 'name', value, language) : updateCustomTag(id, 'name', value, language);
        }
        return { getValue, setValue, getLanguage: getLang, isLocked: () => galleryPreviewLock.isLocked() };
    }
    document.addEventListener('DOMContentLoaded', () => { controller = BilingualInput.install({ selector, resolve }); });
})();
