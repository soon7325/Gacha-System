/* 图鉴文件导入：以已保存的配置为基准，先完整构造草稿，再交给页面。 */
(function () {
    'use strict';

    const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);
    const blank = value => value == null || (typeof value === 'string' && !value.trim()) ||
        (Array.isArray(value) && !value.length);

    function fillBlanks(old, incoming) {
        if (blank(old)) return blank(incoming) ? old : incoming;
        if (!record(old) || !record(incoming)) return old;
        return { ...old, ...Object.fromEntries(Object.entries(incoming).map(([key, value]) =>
            [key, fillBlanks(Object.hasOwn(old, key) ? old[key] : undefined, value)])) };
    }

    function combineRows(old = [], incoming = [], overwrite) {
        const rows = new Map(old.map(row => [row.id, row]));
        for (const row of incoming) {
            if (overwrite || !rows.has(row.id)) rows.set(row.id, row);
        }
        return [...rows.values()];
    }

    function combineEntries(old, incoming, options) {
        // 仅一方缺少界面语言的全名时，才比较另一语言的全名。
        const byId = options.match === 'id';
        const [mainField, otherField] = options.language === 'en' ? ['en', 'name'] : ['name', 'en'];
        const primaryKey = item => byId ? item.id : item[mainField]?.trim();
        const result = old.slice();
        const seen = new Set();
        const matched = new Set();
        const primary = new Map(), otherNames = new Map();
        function indexKey(map, key, index) {
            if (!key) return;
            map.set(key, map.has(key) ? -1 : index);
        }
        const missingPrimary = new Map();
        old.forEach((item, index) => {
            const key = primaryKey(item);
            indexKey(primary, key, index);
            if (byId) return;
            const other = item[otherField]?.trim();
            indexKey(otherNames, other, index);
            if (!key) indexKey(missingPrimary, other, index);
        });
        for (const item of incoming) {
            const main = primaryKey(item);
            const other = byId ? undefined : item[otherField]?.trim();
            const key = main || other;
            let index = primary.get(main);
            if (!byId && index === undefined) {
                const fallback = main ? missingPrimary : otherNames;
                index = fallback.get(other);
            }
            if (!key || seen.has(key) || index === -1 || matched.has(index)) throw Error('CATALOG_CONFLICT');
            seen.add(key);
            if (index === undefined) {
                result.push(item);
                continue;
            }
            matched.add(index);
            const previous = old[index];
            if (options.mode === 'overwrite') {
                const id = options.identity === 'replace' && options.match === 'name' ? item.id : previous.id;
                const content = options.overwriteBlanks === 'from_old' ? fillBlanks(item, previous) : item;
                result[index] = { ...content, id: id || item.id };
            } else if (options.blanks === 'fill') {
                result[index] = fillBlanks(previous, item);
            }
        }
        return result;
    }

    function prepare(saved, file, options) {
        if (options.mode === 'latest') return file;
        const overwrite = options.mode === 'overwrite';
        const prefer = (old, incoming) => overwrite ? { ...old, ...incoming } : { ...incoming, ...old };
        const oldInfo = saved.info || {}, info = file.info || {};
        const mergedInfo = prefer(oldInfo, info);
        for (const key of ['categories', 'globalTiers']) {
            if (oldInfo[key] || info[key]) mergedInfo[key] = combineRows(oldInfo[key], info[key], overwrite);
        }
        for (const key of ['tagDefinitions', 'overflowRules']) {
            if (oldInfo[key] || info[key]) mergedInfo[key] = prefer(oldInfo[key], info[key]);
        }
        const catalog = Object.fromEntries([...new Set([...Object.keys(saved.catalog), ...Object.keys(file.catalog || {})])]
            .map(category => [category, combineEntries(Object.hasOwn(saved.catalog, category) ? saved.catalog[category] : [],
                Object.hasOwn(file.catalog || {}, category) ? file.catalog[category] : [], options)]));
        const ids = new Set();
        for (const item of Object.values(catalog).flat()) {
            if (item.id && ids.has(item.id)) throw Error('CATALOG_CONFLICT');
            if (item.id) ids.add(item.id);
        }
        const rosterPools = combineRows(saved.rosterPools, file.rosterPools || info.rosterPools, overwrite);
        const incomingOrder = file.poolOrder || [];
        const order = overwrite ? [...incomingOrder, ...saved.poolOrder] : [...saved.poolOrder, ...incomingOrder];
        return { info: mergedInfo, catalog, rosterPools, poolRules: prefer(saved.poolRules, file.poolRules),
            poolOrder: [...new Set([...order, ...rosterPools.map(pool => pool.id)])] };
    }
    window.GalleryImport = Object.freeze({ prepare });
})();
