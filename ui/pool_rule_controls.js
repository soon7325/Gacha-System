/* Optional activation conditions shared by the four rule editors. */
(function () {
    'use strict';
    const groups = [ ['early', '.early-up-rule-row', '前 N 金胜率', 'Early gold UP'], ['category', '.cat-seq-rule-row', '类型定向', 'Category sequence'], ['spark', '.spark-rule-row', '井', 'Spark'], ['gift', '.gift-rule-row', '赠送抽', 'Bonus pulls'] ];
    const tr = (zh, en) => document.documentElement.lang.startsWith('en') || localStorage.getItem('GM_Lang') === 'en' ? en : zh;
    const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const options = (items, value) => items.map(([id, label]) => `<option value="${esc(id)}" ${id === value ? 'selected' : ''}>${esc(label)}</option>`).join('');
    const number = (cls, value) => `<input class="input-box ${cls}" type="number" min="1" step="1" value="${esc(value)}" style="width:82px">`;
    const language = () => localStorage.getItem('GM_Lang') === 'en' ? 'en' : 'zh';
    function rows() { return groups.flatMap(([kind, selector, zh, en]) => [...document.querySelectorAll(selector)].map((row, i) => {
        const fallback = `${tr(zh,en)} #${i+1}`, names = row.ruleNameDraft || {};
        const custom = (language()==='en' ? names.en || names.name : names.name || names.en)?.trim();
        return {row,kind,label:custom || fallback,fallback,referenceLabel:custom ? `${custom} (${fallback})` : fallback};
    })); }
    function setName(row, lang, value) {
        row.ruleNameDraft[lang === 'en' ? 'en' : 'name'] = value;
        refreshReferences();
    }
    function read(row) {
        const box = row.querySelector('.rule-controls');
        if (!box) return {};
        const triggerMode=row.querySelector('.input-spark-type,.input-gift-type')?.value;
        return { id: row.dataset.ruleId, name: row.ruleNameDraft.name.trim(), en: row.ruleNameDraft.en.trim(),
            ...(row.ruleMetadata || {}),
            ...(triggerMode?{type:triggerMode==='limited'?'loop':triggerMode}:{}),
            activation: { match: box.querySelector('.rule-match').value, counting: box.querySelector('.rule-counting').value,
                catchUp: box.querySelector('.rule-catch-up')?.value || 'all',
                ...(['early','category'].includes(row.dataset.ruleKind) ? {sequenceCatchUp: box.querySelector('.rule-sequence-catch-up').value} : {}),
                conditions: box.querySelector('.rule-delayed').checked ? [...box.querySelectorAll('.rule-condition')].map(el => ({
                    type: el.querySelector('.rule-condition-type').value, ruleId: el.querySelector('.rule-reference').value,
                    count: Number(el.querySelector('.rule-condition-count').value)
                })) : [] },
            expiration: {type:box.querySelector('.rule-expiry-type').value,scope:box.querySelector('.rule-expiry-scope').value,
                ruleId:box.querySelector('.rule-expiry-reference').value,count:Number(box.querySelector('.rule-expiry-count').value)},
            maxTriggers: triggerMode==='limited' ? Number(row.querySelector('.rule-max-triggers').value) : null };
    }
    function refreshReferences() {
        const all = rows();
        for (const {row,label,fallback} of all) {
            const badge = row.querySelector('.rule-display-label');
            if (badge) {
                if (document.activeElement !== badge && badge.value !== label) badge.value = label;
                if (badge.title !== fallback) badge.title = fallback;
                if (badge.placeholder !== fallback) badge.placeholder = fallback;
            }
        }
        for (const {row} of all) for (const select of row.querySelectorAll('.rule-reference,.rule-expiry-reference')) {
            const value = select.value || select.dataset.saved || '';
            const items = [['',tr('请选择规则','Choose a rule')], ...all.filter(x => x.row !== row && x.row.dataset.ruleId).map(x => [x.row.dataset.ruleId, x.referenceLabel])];
            if (value && !items.some(([id]) => id === value)) items.push([value,tr('规则已删除或未启用','Rule deleted or disabled')]);
            const html = options(items, value);
            if (select.innerHTML !== html) select.innerHTML = html;
            delete select.dataset.saved;
        }
    }
    function condition(box, data = {}) {
        const line = document.createElement('div'); line.className = 'rule-condition';
        line.innerHTML = `<select class="input-box rule-condition-type">${options([['pulls',tr('累计完成抽数','Completed pulls')],['rule',tr('指定规则成功触发','Successful rule triggers')]],data.type || 'pulls')}</select><select aria-label="${tr('前置规则','Prerequisite rule')}" class="input-box rule-reference" data-saved="${esc(data.ruleId || '')}"></select>${number('rule-condition-count',data.count ?? 100)}<span class="rule-condition-unit"></span><button class="btn btn-action-gray preview-edit-action rule-remove-condition" type="button" aria-label="${tr('删除条件','Remove condition')}">×</button>`;
        box.querySelector('.rule-conditions').appendChild(line);
    }
    function sync(row) {
        const box = row.querySelector('.rule-controls'), delayed = box.querySelector('.rule-delayed').checked;
        box.querySelector('.rule-activation-body').hidden = !delayed;
        const retained = box.querySelector('.rule-counting').value === 'retain';
        box.querySelector('.rule-catch-up-wrap').hidden = !delayed || !retained;
        const expiryType=box.querySelector('.rule-expiry-type').value;
        box.querySelector('.rule-expiry-options').hidden=expiryType==='none';
        box.querySelector('.rule-expiry-reference').hidden=expiryType!=='rule';
        box.querySelector('.rule-expiry-count-wrap').hidden=!['rule','pulls'].includes(expiryType);
        box.querySelector('.rule-expiry-unit').textContent=expiryType==='pulls'?tr('抽后停止','pulls, then stop'):tr('次后停止','times, then stop');
        const triggerMode=row.querySelector('.input-spark-type,.input-gift-type')?.value;
        if(row.querySelector('.rule-trigger-count'))row.querySelector('.rule-trigger-count').hidden=triggerMode!=='limited';
        for (const line of box.querySelectorAll('.rule-condition')) {
            const ref = line.querySelector('.rule-condition-type').value === 'rule';
            line.querySelector('.rule-reference').hidden = !ref;
            line.querySelector('.rule-condition-unit').textContent = ref ? tr('次后解锁','times to unlock') : tr('抽后解锁','pulls to unlock');
        }
        const badge = box.querySelector('.rule-status');
        badge.textContent = delayed ? tr('有前置条件','Conditional') : tr('立即生效','Active immediately');
        if(expiryType!=='none')badge.textContent+=' · '+tr('可失效','Can expire');

    }
    function attach(row, data = {}, kind) {
        row.dataset.ruleId = data.id || (crypto.randomUUID ? crypto.randomUUID() : `rule_${Date.now()}_${Math.random().toString(36).slice(2)}`);
        row.dataset.ruleKind = kind;
        row.ruleNameDraft = {name:data.name || '',en:data.en || ''};
        row.ruleMetadata = {...(data.ownMinorPity?{ownMinorPity:true}:{}),...(data.rewardKind?{rewardKind:data.rewardKind}:{}),...(data.countRules?{countRules:true}:{}),...(data.nextPeriod?{nextPeriod:true}:{}),...(data.expiresOnRotation?{expiresOnRotation:true}:{})};
        const a = data.activation || {}, repeated = ['spark','gift'].includes(kind);
        if(repeated){
            const mode=row.querySelector('.input-spark-type,.input-gift-type');
            mode.add(new Option(tr('限制触发次数','Limited triggers'),'limited'));
            if(mode.value==='loop'&&data.maxTriggers!=null)mode.value='limited';
            mode.style.width='170px';
            if(kind==='spark')row.querySelector('.input-spark-limit').nextElementSibling.textContent=tr('抽时，','pulls, ');
            const group=document.createElement('span');group.className='rule-trigger-mode';
            mode.before(group);
            group.innerHTML=`<span>${tr('触发模式：','Trigger mode:')}</span><span class="rule-trigger-count" hidden>${number('rule-max-triggers',data.maxTriggers??8)} <span>${tr('次','times')}</span></span>`;
            group.insertBefore(mode,group.querySelector('.rule-trigger-count'));
            if(kind==='spark'){
                const target=row.querySelector('.input-spark-target-type'),title=target.previousElementSibling;
                target.style.width=language()==='en'?'300px':'240px';
                title.style.marginLeft='0';
                const targetGroup=document.createElement('span');targetGroup.className='rule-target-mode';
                title.before(targetGroup);targetGroup.append(title,target);
                const index=row.querySelector('.spark-up-idx-wrap');if(index)targetGroup.appendChild(index);
            }
        }
        const expiry=data.expiration || {type:kind==='spark'&&(data.cancelOnHit||data.cancelOnUp)?'target':'none',scope:'after_unlock'};
        row.querySelector('.input-spark-cancel-on-hit')?.closest('label')?.remove();
        const expiryTypes=[['none',tr('无失效条件','Never expire')],...(['spark','early','category'].includes(kind)?[['target',tr('获得本规则目标后停止','Stop after acquiring the target')]]:[]),['pulls',tr('完成指定抽数后停止','Stop after a pull count')],['rule',tr('指定规则触发后停止','Stop after another rule triggers')]];
        const catchUpSettings = repeated
            ? `<div class="rule-control-line"><span>${tr('已达成部分','Reached milestones')}</span><select class="input-box rule-catch-up">${options([['all',tr('补发全部','Grant all')],['one',tr('只补发一次','Grant once')],['none',tr('不补发','Skip past milestones')]],a.catchUp || 'all')}</select></div><p>${tr('补发也占用触发次数额度；达到上限后停止。','Catch-up uses the trigger allowance and stops at the limit.')}</p>`
            : `<div class="rule-control-line"><span>${tr('解锁时已超过指定金序号','If the gold milestone has passed at unlock')}</span><select class="input-box rule-sequence-catch-up">${options([['skip',tr('跳过，不再生效','Skip the missed privilege')],['next',tr('顺延到解锁后的下一金','Defer to the next gold after unlock')]],a.sequenceCatchUp || 'skip')}</select></div><p>${tr('正常应生效的同类规则优先；多条顺延福利按原金序号从小到大，每次出金兑现一条。同一金可同时使用胜率和类型定向福利。','Scheduled rules of the same kind take priority. Deferred privileges apply in milestone order, one per gold per kind. UP and category privileges may apply together.')}</p>`;
        const box = document.createElement('div'); box.className = 'rule-controls';
        // Early gold rows used to occupy one line; reserve a full line for their optional settings.
        if (kind === 'early') row.style.flexWrap = 'wrap';
        if (kind === 'gift') {row.style.flexDirection='column';row.style.alignItems='stretch';}
        const heading = document.createElement('div');
        heading.className = 'rule-display-heading';
        const label = document.createElement('input'); label.type='text';
        label.className = 'rule-display-label rule-name-input input-box'; label.style.width='280px';
        label.setAttribute('aria-label',tr('规则名称','Rule name'));
        label.addEventListener('input',()=>setName(row,language(),label.value));
        label.addEventListener('blur',refreshReferences);
        heading.appendChild(label);
        row.insertBefore(heading,row.firstChild);
        box.innerHTML = `<div class="rule-control-heading"><strong>${tr('规则生效条件','Rule lifecycle')}</strong><span class="rule-status"></span></div>
            <section class="rule-lifecycle-section"><h4>${tr('① 解锁条件','① Unlock conditions')}</h4><label><input type="checkbox" class="rule-delayed" ${a.conditions?.length ? 'checked' : ''}> ${tr('满足前置条件后解锁','Unlock after prerequisites')}</label>
            <div class="rule-activation-body" hidden><div class="rule-control-line"><span>${tr('条件关系','Match')}</span><select class="input-box rule-match">${options([['all',tr('全部满足','All conditions')],['any',tr('任一满足','Any condition')]],a.match || 'all')}</select></div><div class="rule-conditions"></div><button type="button" class="btn btn-action-gray rule-add-condition preview-edit-action">${tr('＋ 添加条件','＋ Add condition')}</button>
            <div class="rule-control-line"><span>${tr('计数方式','Counting')}</span><select class="input-box rule-counting">${options([['reset',tr('解锁后从零计数','Count from zero after unlock')],['retain',tr('解锁前也累计进度','Accumulate before unlock')]],a.counting || 'reset')}</select></div>
            </div></section>
            <section class="rule-lifecycle-section rule-expiry-section"><h4>${tr('② 失效条件','② Expiration conditions')}</h4><div class="rule-control-line"><select class="input-box rule-expiry-type">${options(expiryTypes,expiry.type||'none')}</select></div>
            <div class="rule-expiry-options" hidden><div class="rule-control-line"><select class="input-box rule-expiry-reference" aria-label="${tr('使本规则失效的规则','Rule causing expiration')}" data-saved="${esc(expiry.ruleId||'')}"></select><span class="rule-expiry-count-wrap">${number('rule-expiry-count',expiry.count??1)} <span class="rule-expiry-unit"></span></span></div>
            <div class="rule-control-line"><span>${tr('检查范围','Check scope')}</span><select class="input-box rule-expiry-scope">${options([['after_unlock',tr('仅统计解锁后','Only after unlock')],['including_before',tr('包含解锁前','Include before unlock')]],expiry.scope||'after_unlock')}</select></div>
            </div>
            </section>
            <section class="rule-lifecycle-section rule-catch-up-wrap" hidden><h4>${tr('③ 错过节点时的处理','③ Missed milestones')}</h4>${catchUpSettings}<p>${tr('补发设置不会恢复已经失效的规则。','Catch-up cannot reactivate an expired rule.')}</p></section>
            `;
        row.appendChild(box);
        for (const c of a.conditions?.length ? a.conditions : [{type:'pulls',count:100}]) condition(box,c);
        box.querySelector('.rule-add-condition').onclick = () => { condition(box); refreshReferences(); sync(row); };
        box.addEventListener('click', e => { if(e.target.closest('.rule-remove-condition')) {e.target.closest('.rule-condition').remove(); if(!box.querySelector('.rule-condition')) condition(box); sync(row);} });
        row.addEventListener('change', () => {sync(row);refreshReferences();});
        row.addEventListener('input', () => sync(row));
        sync(row);
        const remove = row.querySelector('button[onclick^="requestRemove"]');
        if (remove) {
            const footer = document.createElement('div'); footer.className = 'rule-action-footer';
            remove.classList.add('rule-delete-action','btn','btn-action-gray');
            remove.style.cssText = 'color:#ff4757;padding:4px 10px;font-size:12px';
            remove.textContent = tr('✕ 删除规则','✕ Delete rule');
            footer.appendChild(remove); row.appendChild(footer);
        }
        row.querySelector('.btn-cat-toggle')?.remove();
        if (kind === 'early') {
            const main = document.createElement('div'); main.className='rule-primary-fields';
            for (const child of [...row.childNodes]) if (child !== heading && child !== box && !child.classList?.contains('rule-action-footer')) main.appendChild(child);
            row.insertBefore(main,box);
            row.style.flexDirection='column'; row.style.alignItems='stretch';
        }
        const details = document.createElement('div'); details.className='rule-details';
        details.id='rule_details_'+row.dataset.ruleId;
        for (const child of [...row.childNodes]) if (child !== heading) details.appendChild(child);
        row.appendChild(details);
        const toggle=document.createElement('button'); toggle.type='button';
        toggle.className='btn btn-action-gray rule-details-toggle';
        toggle.setAttribute('aria-controls',details.id);
        function updateToggle() {
            toggle.textContent=details.hidden?'▽':'△';
            toggle.setAttribute('aria-expanded',String(!details.hidden));
            toggle.setAttribute('aria-label',details.hidden?tr('展开规则详情','Expand rule details'):tr('收起规则详情','Collapse rule details'));
            toggle.title=toggle.getAttribute('aria-label');
            row.classList.toggle('rule-collapsed',details.hidden);
        }
        toggle.onclick=()=>{details.hidden=!details.hidden;updateToggle();};
        updateToggle();heading.appendChild(toggle);
    }

    function validate() {
        const enabled = rows().filter(({kind}) => document.getElementById({early:'input-enable-early-up',category:'input-enable-cat-seq',spark:'input-enable-spark',gift:'input-enable-gift'}[kind])?.checked);
        const all = new Map(enabled.map(({row}) => [row.dataset.ruleId,read(row)]));
        if (all.size !== enabled.length) return tr('规则 ID 重复，请删除重复规则后重新添加。','Duplicate rule IDs; remove and re-add the duplicate rule.');
        const positive = n => Number.isSafeInteger(n) && n > 0;
        for (const {row,label} of enabled) {
            const r=all.get(row.dataset.ruleId);
            if (r.maxTriggers !== null && !positive(r.maxTriggers)) return `${label}：${tr('触发次数上限须为正整数。','Trigger limit must be a positive integer.')}`;
            const expiry=r.expiration;
            if(['rule','pulls'].includes(expiry.type)&&!positive(expiry.count))return `${label}：${tr('失效条件次数须为正整数。','Expiration count must be a positive integer.')}`;
            if(expiry.type==='rule'){
                const target=all.get(expiry.ruleId),entry=enabled.find(x=>x.row.dataset.ruleId===expiry.ruleId);
                if(!target||target===r)return `${label}：${tr('失效条件须选择有效、已启用的其他规则。','Select another enabled rule for expiration.')}`;
                const once=['early','category'].includes(entry.kind)||entry.row.querySelector('.input-spark-type,.input-gift-type')?.value==='once';
                if(expiry.count>(once?1:target.maxTriggers??Infinity))return `${label}：${tr('失效条件次数超过来源规则上限。','Expiration count exceeds the source rule limit.')}`;
            }
            for (const c of r.activation.conditions) {
                if (!positive(c.count)) return `${label}：${tr('前置条件次数须为正整数。','Prerequisite count must be a positive integer.')}`;
                if (c.type === 'rule') {
                    const target=all.get(c.ruleId);
                    if(!target || target === r) return `${label}：${tr('请选择有效、已启用的其他规则。','Select another enabled rule.')}`;
                    const targetRow=enabled.find(x=>x.row.dataset.ruleId===c.ruleId).row;
                    const once=targetRow.querySelector('.input-spark-type,.input-gift-type')?.value==='once' || ['early','category'].includes(targetRow.dataset.ruleKind);
                    if(c.count>(once ? 1 : target.maxTriggers ?? Infinity)) return `${label}：${tr('前置次数超过目标规则的可触发上限。','Required count exceeds the prerequisite rule limit.')}`;
                }
            }
        }
        const visiting=new Set(),done=new Set();
        function visit(id) { if(visiting.has(id)) return false;if(done.has(id))return true;visiting.add(id);for(const c of all.get(id).activation.conditions)if(c.type==='rule'&&!visit(c.ruleId))return false;visiting.delete(id);done.add(id);return true; }
        for (const id of all.keys()) if(!visit(id)) return tr('前置条件存在循环依赖，请调整规则引用。','Activation conditions contain a circular dependency.');
        return '';
    }
    document.addEventListener('DOMContentLoaded', () => {
        new MutationObserver(records => { if(records.some(r => [...r.addedNodes,...r.removedNodes].some(n => n.nodeType===1 && (n.matches?.(groups.map(g=>g[1]).join(',')) || n.querySelector?.('.rule-controls'))))) refreshReferences(); }).observe(document.body,{childList:true,subtree:true});
        refreshReferences();
    });
    window.PoolRuleControls = {attach,read,validate,refreshReferences,setName};
})();
