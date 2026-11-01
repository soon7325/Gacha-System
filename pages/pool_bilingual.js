/** 规则页的救回标签复用双语浮层；与规则一起保存、导出。 */
(function () {
    'use strict';
    document.addEventListener('DOMContentLoaded', () => {
        BilingualInput.install({
            selector: '.rule-name-input',
            resolve: input => {
                const row = input.closest('[data-rule-id]');
                if (!row) return null;
                return {
                    getLanguage: () => sysLang,
                    isLocked: () => poolPreviewLock.isLocked(),
                    getValue: language => row.ruleNameDraft[language === 'en' ? 'en' : 'name'],
                    setValue(language,value) {
                        if (poolPreviewLock.isLocked()) return;
                        PoolRuleControls.setName(row,language,value);
                        markPageDirty();
                    }
                };
            }
        });
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
