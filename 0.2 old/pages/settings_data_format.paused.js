/** 数据展示格式的暂停开发存档。未被页面加载，也没有概率渲染逻辑依赖此偏好。
 * 保留原控件与偏好回显，未来恢复时再接入；不修改现有抽卡数据。 */
(function () {
    'use strict';
    const controlHTML = "<div class=\"setting-item\">\n                    <label data-i18n=\"set_data_format\">数据展示格式</label>\n                    <select id=\"probFormatSelect\" class=\"input-box\" style=\"width: 100%;\" onchange=\"updatePref('GM_Prob_Format', this.value)\">\n                        <option value=\"percent\" data-i18n=\"fmt_percent\">百分比 (如: 75%)</option>\n                        <option value=\"decimal\" data-i18n=\"fmt_decimal\">小数 (如: 0.75)</option>\n                    </select>\n                </div>";
    const translations = {
    "zh": {
        "fmt_decimal": "小数 (如: 0.75)（未制作）",
        "fmt_percent": "百分比 (如: 75%)",
        "set_data_format": "数据展示格式"
    },
    "en": {
        "fmt_decimal": "Decimal (e.g. 0.75)(haven't done it yet)",
        "fmt_percent": "Percentage (e.g. 75%)",
        "set_data_format": "Data Display Format"
    }
};
    function restoreControl(container) {
        window.UI_LIB = window.UI_LIB || {};
        for (const lang of ['zh', 'en']) Object.assign(window.UI_LIB[lang] = window.UI_LIB[lang] || {}, translations[lang]);
        container.insertAdjacentHTML('beforeend', controlHTML);
        container.querySelector('#probFormatSelect').value = localStorage.getItem('GM_Prob_Format') || 'percent';
    }
    window.PausedDataFormat = { restoreControl };
})();
