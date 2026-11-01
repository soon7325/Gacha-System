/**
 * 全站国际化入口。
 * translate_zh.js / translate_en.js 负责向 UI_LIB 注册词典；本文件按 GM_Lang
 * 把 data-i18n 等属性映射到页面 DOM，并在翻译完成后重建自定义下拉框文字。
 */

// ==========================================
// 全局语言包挂载基底
// ==========================================
window.UI_LIB = window.UI_LIB || {};

// ==========================================
// 🚀 全局翻译执行引擎
// ==========================================
/** 将当前语言词典应用到已渲染的页面元素。 */
window.applyTranslations = function() {
    const lang = localStorage.getItem('GM_Lang') || 'zh';
    const t = (window.UI_LIB && window.UI_LIB[lang]) || (window.UI_LIB && window.UI_LIB['zh']) || {};

    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (!Object.prototype.hasOwnProperty.call(t, key)) return;
        if ((el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') && el.hasAttribute('placeholder')) {
            el.placeholder = window.getTrans(key);
        } else {
            el.innerHTML = window.getTrans(key);
        }
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (Object.prototype.hasOwnProperty.call(t, key)) el.placeholder = window.getTrans(key);
    });

    document.querySelectorAll('[data-i18n-title]').forEach(el => {
        const key = el.getAttribute('data-i18n-title');
        if (Object.prototype.hasOwnProperty.call(t, key)) el.title = t[key];
    });

    document.querySelectorAll('[data-i18n-aria-label]').forEach(el => {
        const key = el.getAttribute('data-i18n-aria-label');
        if (Object.prototype.hasOwnProperty.call(t, key)) el.setAttribute('aria-label', t[key]);
    });

    // 🌟 同步更新自定义下拉框，避免显示旧语言文本
    if (typeof window.refreshCustomDropdowns === 'function') {
        window.refreshCustomDropdowns(document, true);
    }
};

document.addEventListener('DOMContentLoaded', window.applyTranslations);

// ==========================================
// 🛠️ JS 弹窗专用翻译获取器
// ==========================================
/** 供 JavaScript 动态生成弹窗、按钮等文字时按 key 查询当前语言。 */
window.getTrans = function(key) {
    const lang = localStorage.getItem('GM_Lang') || 'zh';
    const t = (window.UI_LIB && window.UI_LIB[lang]) || (window.UI_LIB && window.UI_LIB['zh']) || {};
    if (localStorage.getItem('GM_Bilingual_Hints') !== 'false') {
        const bilingual = {
            nav_settings: '设置 / Settings', set_lang: '界面语言 / Interface Language',
            lang_zh: '简体中文 / Chinese (Simplified)', lang_en: '英语 / English',
            set_language_first_visit: '在这里切换界面语言 / Change your interface language here'
        };
        if (Object.prototype.hasOwnProperty.call(bilingual, key)) return bilingual[key];
    }
    return t[key] || key;
};

window.updatePageLanguage = window.applyTranslations;
