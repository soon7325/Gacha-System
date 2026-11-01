/** 按保存的 ID 顺序排列列表；不读取存储，不修改条目。 */
(function () {
    'use strict';
    // 原地排序以兼容调用方持有的数组；未列出的条目保持相对顺序，排在末尾。
    function sort(rows, ids, getId = row => row.id) {
        if (!Array.isArray(ids)) return rows;
        const ranks = new Map();
        ids.forEach((id, index) => { if (!ranks.has(id)) ranks.set(id, index); });
        const rank = row => ranks.get(getId(row)) ?? Infinity;
        return rows.sort((a, b) => rank(a) - rank(b));
    }
    window.ListOrder = Object.freeze({ sort });
})();
