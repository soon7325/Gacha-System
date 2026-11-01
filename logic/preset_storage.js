/** 官方配置缓存初始化；与页面布局、玩家账户和模拟进度分开处理。 */
(function () {
    'use strict';
    function initialize(gameId) {
        const setup = GameData.getPresetSetup(gameId), rules = GameData.getPresetRules(gameId);
        if (!setup && !rules) return false;
        const current = GameData.readJSON('GM_Info_' + gameId, {});
        const info = { ...current, ...setup, mixedPools: setup?.mixedPools || [], offRate: setup?.offRate || {} };
        localStorage.setItem('GM_Info_' + gameId, JSON.stringify(info));
        for (const [poolId, config] of Object.entries(rules || {})) {
            localStorage.setItem(`GM_Rules_${gameId}_${poolId}`, JSON.stringify(config));
        }
        // 新版候选直接来自图鉴与装配规则；保留用户已有的旧 roster，供旧记录读取。
        // 不再创建没有配置的联动池、旧式 *_enabled 键或“测试角色”占位数据。
        return true;
    }
    window.PresetStorage = Object.freeze({ initialize });
})();
