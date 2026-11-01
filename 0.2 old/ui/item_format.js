/**
 * 公共文字展示层：统一物品全名、简称、稀有度和标签的中英文显示。
 * 不写缓存、不操作 DOM，也不参与概率或历史检测。
 * 页面通过回调提供最新图鉴，编辑或重新加载数据后无需重建格式器。
 */
(function () {
    'use strict';

    // 每次读取当前语言，支持页面切换语言；存储不可访问时默认中文。
    function getLanguage() {
        try { return localStorage.getItem('GM_Lang') || 'zh'; }
        catch (error) { return 'zh'; }
    }

    // 这些通用英文评级只用于需要兜底的页面，不覆盖用户自定义名称。
    const ENGLISH_TIERS = {
        tier_S: 'S-Rank', tier_A: 'A-Rank', tier_B: 'B-Rank',
        tier_6: '6-Star', tier_5: '5-Star', tier_4: '4-Star', tier_3: '3-Star'
    };

    /**
     * 创建页面专属格式器，算法共用、数据由页面提供。
     * getCatalog：最新分类图鉴；findItem：图鉴找不到时的预设查询。
     * getTiers/getFallbackTiers：当前稀有度与官方稀有度定义。
     * missingItem/missingTier：保留不同页面的空值显示习惯。
     */
    function create({ getCatalog = () => ({}), findItem = null,
        getTiers = () => [], getFallbackTiers = () => [],
        getLang = getLanguage, missingItem = '?', missingTier = '?',
        genericTierNames = false, fallbackTierId = true } = {}) {

        // 支持全名、简称和英文名检索，兼容旧记录只保存名字字符串的情况。
        function lookup(name) {
            if (!name) return null;
            const item = window.CatalogUtils.findItem(getCatalog(), name);
            if (item) return item;
            return findItem ? findItem(name) : null;
        }

        // 对象原样读取，名字字符串先查图鉴；未知名字仍可正常显示。
        function resolve(item) {
            return typeof item === 'string' ? lookup(item) || { name: item, short: item } : item;
        }

        // 全名优先使用对象自己的英文，再从图鉴/预设补查，最后回退中文。
        function getItemName(value) {
            const item = resolve(value);
            if (!item) return missingItem;
            if (getLang() === 'en') {
                // 已有英文全名时直接返回，图鉴批量渲染不必逐件重复检索。
                if (item.en || item.nameEn) return item.en || item.nameEn;
                const live = lookup(item.name);
                return live?.en || live?.nameEn || item.name || missingItem;
            }
            return item.name || missingItem;
        }

        // 简称优先级：对象英文简称 → 图鉴英文简称/英文名 → 全名 → 中文简称。
        function getItemShort(value) {
            const item = resolve(value);
            if (!item) return missingItem;
            if (getLang() === 'en') {
                if (item.eshort || item.shortEn) return item.eshort || item.shortEn;
                const live = lookup(item.name);
                return live?.eshort || live?.shortEn || live?.en || live?.nameEn ||
                    item.en || item.nameEn || item.short || item.name || missingItem;
            }
            return item.short || item.name || missingItem;
        }

        // 稀有度保留自定义中英文名称；模拟器可开启通用 S级/星级英文兜底。
        function getTierName(tier) {
            if (!tier) return missingTier;
            const id = tier.id || tier.tierId;
            if (getLang() === 'en') {
                if (tier.en) return tier.en;
                const definitions = [...(getTiers() || []), ...(getFallbackTiers() || [])];
                const translated = definitions.find(item => item.id === id && item.en);
                if (translated) return translated.en;
                if (genericTierNames && ENGLISH_TIERS[id]) return ENGLISH_TIERS[id];
            }
            return tier.name || (fallbackTierId ? id : '') || missingTier;
        }

        // 标签和分类采用同一种名称规则，未知/空对象显示空字符串。
        function getLabelName(label) {
            if (!label) return '';
            return (getLang() === 'en' && label.en) ? label.en : (label.name || '');
        }

        return Object.freeze({ getItemName, getItemShort, getTierName, getLabelName });
    }

    function getRescueName(config = {}, language = getLanguage()) {
        config = config || {};
        const name = config.customEffectName || '明光';
        return language === 'en' ? (config.customEffectNameEn || (name === '明光' ? 'Radiance' : name)) : name;
    }

    window.ItemFormat = Object.freeze({ getLanguage, create, getRescueName });
})();
