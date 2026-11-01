/** 规则页的救回标签复用双语浮层；与规则一起保存、导出。 */
(function () {
    'use strict';
    document.addEventListener('DOMContentLoaded', () => {
        BilingualInput.install({
            selector: '#input-rescue-tag',
            resolve: () => ({
                getLanguage: () => sysLang,
                isLocked: () => poolPreviewLock.isLocked(),
                getValue: language => rescueLabelDraft[language === 'en' ? 'customEffectNameEn' : 'customEffectName'],
                setValue(language, value) {
                    if (poolPreviewLock.isLocked()) return;
                    rescueLabelDraft[language === 'en' ? 'customEffectNameEn' : 'customEffectName'] = value;
                    markPageDirty();
                }
            })
        });
    });
})();
