/**
 * 图鉴公共工具：按分类取物品、名字检索、标签筛选和去重。
 * 纯数据处理，不读写存储、不生成 HTML、不处理点击，也不计算抽卡概率。
 * 每次传入当前图鉴，页面重新导入或编辑后不会使用过期缓存。
 */
(function () {
    'use strict';
    const NAME_FIELDS = ['name', 'short', 'en', 'eshort', 'nameEn', 'shortEn'];
    const isItem = item => item !== null && typeof item === 'object' && !Array.isArray(item);

    /**
     * categories=null 表示全部分类；[] 表示没有分类，返回空数组。
     * 保留分类的传入顺序和物品原顺序，不自动去重。
     * 默认给物品浅副本附加 category；withCategory=false 返回原对象引用。
     * 后者用于只读查找，前者编辑嵌套字段前仍需额外深拷贝。
     */
    function getItemsByCategories(catalog, categories = null, { withCategory = true } = {}) {
        const result = [];
        for (const category of categories ?? Object.keys(catalog || {})) {
            const items = catalog?.[category];
            if (!Array.isArray(items)) continue;
            for (const item of items) {
                if (isItem(item)) result.push(withCategory ? { ...item, category } : item);
            }
        }
        return result;
    }

    // 接受分类图鉴或已打平列表，先按物品 ID 查找，再兼容旧名称/别名。
    // fields 只限制名称兜底字段；明确的记录 itemId 找不到时不猜测同名项。
    function getIdentity(item) { return item?.presetId || item?.id || ''; }
    function findItem(source, reference, { fields = NAME_FIELDS } = {}) {
        if (!reference) return null;
        const items = Array.isArray(source) ? source : getItemsByCategories(source, null, { withCategory: false });
        const object = isItem(reference);
        const ids = object ? (reference.itemId ? [reference.itemId] : [reference.presetId, reference.id].filter(Boolean)) : [reference];
        let byId = null;
        for (const id of ids) {
            byId = items.find(item => isItem(item) && (item.id === id || item.presetId === id || item.legacyIds?.includes(id)));
            if (byId) break;
        }
        if (byId) return byId;
        // An explicit record ID must not silently bind to an unrelated same-name item.
        if (object && reference.itemId) return null;
        const names = object ? [reference.name, reference.short, reference.en, reference.eshort].filter(Boolean) : [reference];
        // Prefer a current name over another item's legacy alias.
        return items.find(item => isItem(item) && fields.some(field => names.includes(item[field]))) ||
            (fields.includes('name') ? items.find(item => isItem(item) && Array.isArray(item.aliases) && item.aliases.some(name => names.includes(name))) : null) || null;
    }

    // 优先数组标签，再兼容旧字符串字段；无标签默认空列表，可显式指定兜底。
    function getTags(item, { fallback = [] } = {}) {
        if (Array.isArray(item?.tags)) return [...item.tags];
        if (Array.isArray(item?.tag)) return [...item.tag];
        if (typeof item?.tag === 'string') return [item.tag];
        if (typeof item?.tags === 'string') return [item.tags];
        return [...fallback];
    }
    function hasAnyTag(item, allowedTags = [], options = {}) {
        return getTags(item, options).some(tag => (allowedTags || []).includes(tag));
    }
    function filterByTags(items, allowedTags = []) {
        return (items || []).filter(item => hasAnyTag(item, allowedTags));
    }

    // 默认按 name 去重，首个物品优先；可传字段名或函数按 id/组合键去重。
    // 只返回新数组，不修改物品或排序。无名字的项也沿用同键合并的行为。
    function uniqueBy(items, key = 'name') {
        const seen = new Set();
        return (items || []).filter(item => {
            const value = typeof key === 'function' ? key(item) : item?.[key];
            if (seen.has(value)) return false;
            seen.add(value);
            return true;
        });
    }

    window.CatalogUtils = Object.freeze({ getItemsByCategories, findItem, getIdentity,
        getTags, hasAnyTag, filterByTags, uniqueBy });
})();
