/**
 * 游戏公共数据读取层。
 * 在 Preset_Data/db_*.js 之后加载，通过 window.GameData 供各页面调用。
 * 本文件只读取数据，不写入缓存、不操作页面；每次返回独立副本，避免编辑预设原件。
 * 应该就是图鉴数据如大保底什么的拉。
 */
(function () {
    'use strict';

    // 深拷贝项目使用的 JSON 数据，隔离页面编辑与预设数据库。
    function clone(value) {
        return JSON.parse(JSON.stringify(value));
    }

    // 判断配置是否为普通对象，排除数组、null 等无效缓存结构。
    function isObject(value) {
        return value !== null && typeof value === 'object' && !Array.isArray(value);
    }

    // 安全读取 JSON 缓存；损坏、缺失或存储不可访问时使用调用方的默认值。
    function readJSON(key, fallback = null) {
        try {
            const raw = localStorage.getItem(key);
            return raw && raw !== 'undefined' ? JSON.parse(raw) ?? clone(fallback) : clone(fallback);
        } catch (error) {
            return clone(fallback);
        }
    }

    // 显式访问预设常量：顶层 const 不属于 window，不能用 window[变量名] 读取。
    // 新增官方游戏时，在此注册对应数据，其余页面无需重复维护匹配分支。
    function getPreset(gameId, { section = null } = {}) {
        let preset = null;
        switch (gameId) {
            case 'hsr':
                if (typeof HSR_DB !== 'undefined') preset = { db: HSR_DB, char: HSR_CHAR, wep: HSR_WEAPON, pet: [], setup: HSR_SETUP_RULES, tiers: HSR_GLOBAL_TIERS, rules: HSR_POOL_RULES };
                break;
            case 'zzz':
                if (typeof ZZZ_DB !== 'undefined') preset = { db: ZZZ_DB, char: ZZZ_CHAR, wep: ZZZ_WEAPON, pet: ZZZ_BANGBOO, setup: ZZZ_SETUP_RULES, tiers: ZZZ_GLOBAL_TIERS, rules: ZZZ_POOL_RULES };
                break;
            case 'end':
                if (typeof END_DB !== 'undefined') preset = { db: END_DB, char: END_CHAR, wep: END_WEAPON, pet: [], setup: END_SETUP_RULES, tiers: END_GLOBAL_TIERS, rules: END_POOL_RULES };
                break;
            case 'ark':
                if (typeof ARK_DB !== 'undefined') preset = { db: ARK_DB, char: ARK_CHAR, wep: [], pet: [], setup: ARK_SETUP_RULES, tiers: ARK_GLOBAL_TIERS, rules: ARK_POOL_RULES };
                break;
        }
        // 单独读取某一部分时只拷贝该部分，避免查询标签也重复拷贝整个图鉴。
        return preset ? clone(section ? preset[section] ?? null : preset) : null;
    }

    // 页面无需再拼接全局变量名称或使用 new Function 查询预设。
    function getPresetSetup(gameId) { return getPreset(gameId, { section: 'setup' }); }
    function getPresetRules(gameId) { return getPreset(gameId, { section: 'rules' }); }
    function getPresetTiers(gameId) { return getPreset(gameId, { section: 'tiers' }); }
    function getPresetItems(gameId) { return getPreset(gameId, { section: 'db' }); }

    // 卡池积木列表：本地非空列表优先；仅显式允许时使用预设 rosterPools 兜底。
    function loadRosterPools(gameId, { presetFallback = true } = {}) {
        const saved = readJSON('GM_RosterPools_' + gameId, []);
        if (Array.isArray(saved) && (saved.length || !presetFallback)) return saved;
        const pools = presetFallback ? getPresetSetup(gameId)?.rosterPools : [];
        return Array.isArray(pools) ? pools : [];
    }

    /**
     * 卡池名称、英文、图标、徽标颜色的统一读取。
     * 默认优先级：本地积木池 → 本地混合池 → 官方规则 info → 官方 pools → ID 兜底。
     * 看板可传 info，优先使用当前已加载规则的名称，保留与配置页不同的优先级。
     * 不读取翻译词条；语言选择及最终文字展示仍由页面/格式器负责。
     */
    function loadPoolMeta(gameId, poolId, { info = null } = {}) {
        function normalize(value, icon) {
            return { ...value, name: value.name || poolId, en: value.en || value.name || poolId,
                icon: value.icon || icon, badgeColor: value.badgeColor || 'var(--primary)' };
        }
        if (isObject(info)) return normalize(clone(info), '🎯');
        const saved = readJSON('GM_Info_' + gameId, {});
        const mixed = Array.isArray(saved?.mixedPools) ? saved.mixedPools : [];
        const local = loadRosterPools(gameId, { presetFallback: false }).find(pool => pool?.id === poolId) ||
            mixed.find(pool => pool?.id === poolId);
        if (isObject(local)) return normalize(local, '✨');
        const official = getPresetRules(gameId)?.[poolId]?.info;
        if (isObject(official)) return normalize(official, '🎯');
        const legacy = getPresetSetup(gameId)?.pools?.[poolId];
        if (isObject(legacy)) return normalize(legacy, '🎯');
        return normalize({}, '🎯');
    }

    // 父卡池候选 ID：官方规则先列出，再补本地积木/混合池；去重且保留原顺序。
    function loadPoolIds(gameId, { standaloneOnly = false } = {}) {
        const presetRules = getPresetRules(gameId);
        const ids = new Set(Object.keys(presetRules || {}));
        // 官方游戏的可抽卡池以当前规则为准，旧版图鉴积木不能扩充共享候选。
        // 只过滤读取结果，不删除本地物品、旧记录或标签。
        if (standaloneOnly && presetRules) return [...ids];
        const saved = readJSON('GM_Info_' + gameId, {});
        const mixed = Array.isArray(saved?.mixedPools) ? saved.mixedPools : [];
        [...loadRosterPools(gameId, { presetFallback: false }), ...mixed].forEach(pool => {
            if (pool?.id && (!standaloneOnly || pool.isStandalone !== false)) ids.add(pool.id);
        });
        return [...ids];
    }

    // 分类定义沿用配置页优先级：本地定义 → 官方定义 → 通用定义。
    // 提供 catalog 时筛出已存在的分类，并补上“有物品但缺少名称定义”的自定义分类。
    function loadCategories(gameId, { catalog = null } = {}) {
        const saved = readJSON('GM_Info_' + gameId, {});
        const defaults = [
            { id: 'char', name: '角色/代理人', en: 'Agent/Character', icon: '👤' },
            { id: 'wep', name: '武器/音擎', en: 'Weapon/W-Engine', icon: '🗡️' },
            { id: 'pet', name: '宠物/邦布', en: 'Pet/Bangboo', icon: '🐾' }
        ];
        const source = Array.isArray(saved?.categories) ? saved.categories : getPresetSetup(gameId)?.categories;
        const defined = Array.isArray(source) ? source.filter(isObject) : defaults;
        if (catalog === null) return defined;
        const keys = Object.keys(catalog || {});
        const result = defined.filter(category => keys.includes(category.id));
        keys.forEach(id => {
            if (!result.some(category => category.id === id) && Array.isArray(catalog[id]) && catalog[id].length) {
                result.push({ id, name: id, icon: '🏷️' });
            }
        });
        return result.length ? result : defined;
    }

    // 游戏基础配置沿用原有优先级：官方最新配置覆盖旧缓存，自建游戏使用缓存。
    function loadGameInfo(gameId) {
        const saved = readJSON('GM_Info_' + gameId, {});
        return Object.assign({}, isObject(saved) ? saved : {}, getPresetSetup(gameId) || {});
    }

    // 获取稀有度定义：游戏配置 → 官方预设 → 通用三星级兜底。
    function loadGlobalTiers(gameId, gameInfo = loadGameInfo(gameId)) {
        if (Array.isArray(gameInfo.globalTiers) && gameInfo.globalTiers.length) return clone(gameInfo.globalTiers);
        const tiers = getPresetTiers(gameId);
        return tiers?.length ? tiers : [
            { id: 'tier_5', name: '5', color: '#f1c40f' },
            { id: 'tier_4', name: '4', color: '#9b59b6' },
            { id: 'tier_3', name: '3', color: '#3498db' }
        ];
    }

    // 获取卡池规则：保留已有缓存优先的行为，缺失时读取预设或默认规则。
    // 调用方可传 fallback: null，以区分“完全没有规则”和默认规则。
    function loadPoolRules(gameId, poolId, { fallback = { pity: { hard: 90 }, tiers: [] } } = {}) {
        const saved = readJSON(`GM_Rules_${gameId}_${poolId}`);
        if (isObject(saved)) return saved;
        return getPresetRules(gameId)?.[poolId] || clone(fallback);
    }

    // 统一图鉴字段，保留自定义属性，并兼容新旧英文名称和标签字段。
    function normalizeItem(item, live = null) {
        const tags = item.tag ?? item.tags;
        return {
            ...item,
            name: item.name,
            en: item.en || item.nameEn || live?.en || live?.nameEn || item.name,
            short: item.short || item.name,
            eshort: item.eshort || item.shortEn || live?.eshort || live?.shortEn || item.en || item.nameEn || live?.en || item.short || item.name,
            tierId: item.tierId || 'tier_S',
            tags: Array.isArray(tags) ? [...tags] : (tags ? [tags] : ['normal']),
            img: typeof item.img === 'string' ? item.img.replace(/^(?:\.\.\/)*img\//, '../img/') : ''
        };
    }

    // 优先读取完整本地图鉴；缺失时从预设构建，并补齐旧缓存缺少的英文名称。
    // 不向本地缓存写回，避免浏览页面触发额外保存或云同步。
    function loadCatalog(gameId) {
        const preset = getPreset(gameId);
        const saved = readJSON('GM_Catalog_' + gameId);
        const source = isObject(saved) && Object.keys(saved).length ? saved : {
            char: preset?.char || [], wep: preset?.wep || [], pet: preset?.pet || []
        };
        const liveByName = new Map((preset?.db || []).map(item => [item.name, item]));
        const catalog = {};
        Object.entries(source).forEach(([category, items]) => {
            catalog[category] = Array.isArray(items)
                ? items.filter(isObject).map(item => normalizeItem(item, liveByName.get(item.name))) : [];
        });
        return catalog;
    }

    // 读取旧版花名册，保留页面对旧数据结构的兼容。
    function loadRoster(gameId) {
        const roster = readJSON('GM_Roster_' + gameId, {});
        return isObject(roster) ? roster : {};
    }

    // 模拟器需要打平图鉴：附加分类，并按名称去重，沿用首个分类优先的行为。
    function flattenCatalog(catalog) {
        // 公共工具负责分类与首项去重；数据层仍保证返回独立的深拷贝。
        return clone(window.CatalogUtils.uniqueBy(window.CatalogUtils.getItemsByCategories(catalog)));
    }

    // 页面初始化的统一入口；页面继续自行处理 UI、抽卡状态和规则编辑。
    function loadContext({ gameId, poolId = 'char_up' }) {
        const gameInfo = loadGameInfo(gameId);
        return {
            gameInfo,
            rules: loadPoolRules(gameId, poolId),
            globalTiers: loadGlobalTiers(gameId, gameInfo),
            catalog: loadCatalog(gameId),
            roster: loadRoster(gameId)
        };
    }

    // 使用单一命名空间，避免与现有页面函数或全局变量重名。
    window.GameData = Object.freeze({ readJSON, getPreset,
        getPresetSetup, getPresetRules, getPresetTiers, getPresetItems,
        loadRosterPools, loadPoolMeta, loadPoolIds, loadCategories,
        loadGameInfo, loadGlobalTiers, loadPoolRules, loadCatalog, loadRoster, flattenCatalog, loadContext });
})();
