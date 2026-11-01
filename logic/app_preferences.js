/** 多页面共用的偏好读取与联动规则。只读取，不保存、不操作控件。 */
(function () {
    'use strict';
    function enabled(key, defaultOn = false) {
        const value = localStorage.getItem(key);
        return defaultOn ? value !== 'false' : value === 'true';
    }
    function simulator() {
        const currency = enabled('GM_Sim_Currency_Mode');
        const start = enabled('GM_Sim_Start_Setup');
        const records = enabled('GM_Sim_Keep_Records');
        const remember = enabled('GM_Sim_Remember_Start', true);
        return { currency, start, records, remember, showRemember: start && !records };
    }
    function playerData() {
        const sync = enabled('GM_Dashboard_Sync_Player');
        return {
            mode: localStorage.getItem('GM_Player_Data_Mode') === 'multi' ? 'multi' : 'single',
            lowOverflow: enabled('GM_Sim_Start_Auto_Low_Overflow', true),
            sync, history: enabled('GM_Dashboard_Sync_Existing'), showHistory: sync
        };
    }
    window.AppPreferences = Object.freeze({ enabled, simulator, playerData });
})();
