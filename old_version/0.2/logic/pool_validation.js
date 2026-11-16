/** 卡池配置纯数据检测：不读 DOM、不保存、不修改配置；返回错误位置与翻译 key。 */
(function () {
    'use strict';
    function validate(data) {
        const errors = [], warnings = [];
        const add = (key, path, params = {}, warning = false) => (warning ? warnings : errors).push({ key, path, params });
        // 空值先识别，不能把未填写的内容当作 0 或默认第 1 金。
        const number = value => value === null || value === undefined || String(value).trim() === '' ? NaN : Number(value);
        function check(value, path, kind = 'positive', max = Infinity) {
            const n = number(value);
            const valid = Number.isFinite(n) && n <= max && (kind === 'integer' ? Number.isInteger(n) && n > 0 : kind === 'rate' ? n >= 0 : n > 0);
            if (!valid) add('pv_invalid_number', path, { kind: kind === 'integer' ? 'pv_positive_integer' : kind === 'rate' ? 'pv_rate' : 'pv_positive_number' });
            return valid;
        }
        const tiers = data.tiers || [];
        if (!tiers.length) add('pv_no_tiers', 'tiers');
        if (!(data.goldIds || []).length) add('pv_no_gold', 'goldIds');
        let total = 0;
        tiers.forEach((tier, i) => {
            if (check(tier.prob, `tiers.${i}.prob`, 'rate', 100)) total += number(tier.prob);
            if (tier.subProbs?.length) {
                let sum = 0;
                tier.subProbs.forEach((group, j) => {
                    if (check(group.prob, `tiers.${i}.subProbs.${j}.prob`, 'positive', 100)) sum += number(group.prob);
                    if (!group.hasConditions) add('pv_no_conditions', `tiers.${i}.subProbs.${j}.prob`);
                });
                if (Math.abs(sum - number(tier.prob)) > 0.001) add('pv_sub_total', `tiers.${i}.prob`, { total: sum.toFixed(3), expected: tier.prob });
            }
        });
        if (Math.abs(total - 100) > 0.01) add('pv_total', 'tiers', { total: total.toFixed(3) });
        (data.pities || []).forEach((pity, i) => {
            const base = `pities.${i}`;
            check(pity.pulls, base + '.pulls', 'integer');
            if (!pity.tierId) add('pv_no_tiers', base + '.tierId');
            if (!pity.softEnabled) return; // 未启用的区间草稿不拦截。
            const intervals = [];
            (pity.softRules || []).forEach((rule, j) => {
                const path = base + `.softRules.${j}`;
                const startOK = check(rule.start, path + '.start', 'integer');
                const endOK = check(rule.end, path + '.end', 'integer');
                check(rule.inc, path + '.inc');
                if (!startOK || !endOK) return;
                const start = number(rule.start), end = number(rule.end), hard = number(pity.pulls);
                if (start > end) add('pv_reversed', path + '.start');
                if (start > hard || end > hard) add('pv_over_hard', path + '.end', { hard });
                else if (end === hard) add('pv_equal_hard', path + '.end', { hard }, true);
                // 两端包含：74～80 与 80～89 也属于重叠，不自动排序或去重。
                if (start <= end) {
                    if (intervals.some(r => start <= r.end && end >= r.start)) add('pv_overlap', path + '.start');
                    intervals.push({ start, end });
                }
            });
        });
        for (const [section, fields] of Object.entries({ early: { order: 'integer', upRate: 'rate' }, category: { order: 'integer' }, spark: { limit: 'integer' }, gift: { trigger: 'integer', amount: 'integer' }, spec: { value: 'positive' } })) {
            (data[section] || []).forEach((row, i) => {
                for (const [field, kind] of Object.entries(fields)) check(row[field], `${section}.${i}.${field}`, kind, kind === 'rate' ? 100 : Infinity);
            });
        }
        // 预选数量边界允许 0 与相等；空白是不设边界，不转换成固定上限。
        (data.preselect || []).forEach((range, i) => {
            const values = {};
            for (const field of ['min', 'max']) {
                const raw = range[field];
                if (raw === null || raw === undefined || String(raw).trim() === '') continue;
                const n = number(raw);
                if (!Number.isInteger(n) || n < 0) add('pv_nonnegative_integer', `preselect.${i}.${field}`);
                else values[field] = n;
            }
            if (values.min !== undefined && values.max !== undefined && values.min > values.max) {
                add('pv_min_over_max', `preselect.${i}.min`, { min: values.min, max: values.max });
            }
        });
        return { valid: errors.length === 0, errors, warnings };
    }
    window.PoolValidation = Object.freeze({ validate });
})();
