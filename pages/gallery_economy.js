/** 图鉴经济配置。只编辑规则；余额、签到进度和实际抽卡结算由运行时管理。 */
(function () {
    'use strict';
    const openStates = new Map();
    let bilingualController;
    let sortBindings = [];
    let actionDialog, confirming = false;
    const sectionIds = ['resources', 'exchanges', 'unlockGroups', 'payments', 'incomes', 'caps'];
    const tr = (zh, en) => getLang() === 'en' ? en : zh;
    const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
    const label = item => (getLang() === 'en' && item.en) || item.name || item.id;
    const uid = () => 'eco_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 9);
    const empty = () => ({ version: 1, resources: [], exchanges: [], payments: [], incomes: [] });
    function model() {
        if (!gameInfo.economy) gameInfo.economy = empty();
        for (const key of ['resources', 'unlockGroups', 'exchanges', 'payments', 'incomes']) {
            if (!Array.isArray(gameInfo.economy[key])) gameInfo.economy[key] = [];
        }
        for (const exchange of gameInfo.economy.exchanges) {
            for (const target of [exchange, ...(exchange.stages || [])]) {
                if (!Array.isArray(target.toIds)) target.toIds = target.to ? [target.to] : [];
                delete target.to;
            }
            if (isStaged(exchange)) {
                // 旧阶梯空目标沿用上层目标；迁入各档后删除上层冗余字段。
                for (const stage of exchange.stages || []) {
                    if (!stage.toIds.length) stage.toIds = [...exchange.toIds];
                }
                delete exchange.toIds;
            }
            delete exchange.resetDay;
            delete exchange.resetHour;
        }
        // 将旧的单项手动前置迁入统一前置列表，保留旧解锁记录的关联。
        for (const exchange of gameInfo.economy.exchanges) {
            if (!exchange.hasPrerequisite || exchange.unlockGroupId) continue;
            if (!exchange.unlockGroupId) {
                let id = 'legacy_prerequisite_' + exchange.id;
                while (gameInfo.economy.unlockGroups.some(group => group.id === id)) id += '_';
                gameInfo.economy.unlockGroups.push({id, name: exchange.name || exchange.id, en: exchange.en || exchange.name || exchange.id,
                    period: 'monthly', requirements: [], costs: [], prerequisite: exchange.prerequisite || '',
                    prerequisiteEn: exchange.prerequisiteEn || '', legacyPrerequisiteId: exchange.id});
                exchange.unlockGroupId = id;
            }
            delete exchange.hasPrerequisite;
            delete exchange.prerequisite;
            delete exchange.prerequisiteEn;
        }
        // 兼容旧资源种类的图标，清理已删除的分类、范围及到期字段。
        for (const resource of gameInfo.economy.resources) {
            resource.icon ||= ({currency:'🪙', ticket:'🎟️', ten:'🎫'}[resource.kind] || '🪙');
            // 旧资源的卡池限制迁移到未指定卡池的支付规则，避免升级后扩大使用范围。
            const legacyPools = scopeIds(resource, 'poolIds');
            if (legacyPools.length) {
                for (const payment of gameInfo.economy.payments) {
                    if (payment.resourceId === resource.id && !scopeIds(payment, 'poolIds').length) payment.poolIds = [...legacyPools];
                }
            }
            delete resource.kind;
            delete resource.poolId;
            delete resource.poolIds;
            delete resource.expiresAt;
        }
        // 使用范围统一在支付规则配置；分类字段仅用于抽卡返还的触发物品。
        for (const row of [...gameInfo.economy.resources, ...gameInfo.economy.payments, ...gameInfo.economy.incomes.filter(row => row.source !== 'byproduct')]) {
            delete row.categoryId;
            delete row.categoryIds;
        }
        for (const row of gameInfo.economy.incomes) {
            if (['daily', 'topup', 'gift', 'room'].includes(row.source)) row.source = 'other';
            delete row.startsOn;
            delete row.endsOn;
            if (row.source === 'byproduct') {
                if (!Array.isArray(row.tagIds)) row.tagIds = [];
                row.tagMatch ||= 'any';
                if (row.condition === 'cap_split') row.overflowAmount ??= row.amount ?? 1;
            }
        }
        // 系统六个分区采用固定顺序，清理旧版的分区拖拽偏好。
        delete gameInfo.economy.sectionOrder;
        delete gameInfo.economy.sectionOrderVersion;
        return gameInfo.economy;
    }
    // 编辑分类只控制展示，不参与领取、支付及解锁计算。
    const groupDefinitions={
        resources:[['pull','🎟️','抽卡资源','Pull resources'],['other','🪙','其他资源','Other resources']],
        exchanges:[['regular','🔄','普通兑换','Regular exchanges'],['daily','☀️','每日兑换','Daily exchanges'],['monthly','📅','每月兑换','Monthly exchanges'],['once','🎁','一次性兑换','One-time exchanges']],
        unlockGroups:[['daily','☀️','每日条件','Daily prerequisites'],['monthly','📅','每月条件','Monthly prerequisites'],['once','🔓','永久条件','Permanent prerequisites']],
        payments:[['single','🎯','单抽支付','Single-pull payments'],['multi','🎟️','多抽支付','Multi-pull payments']],
        incomes:[['returns','✨','抽卡返还','Pull returns'],['daily','☀️','日常与签到','Daily & sign-in'],['monthly','📅','每月获取','Monthly income'],['gifts','🎁','礼包与赠送','Gifts & supplies']]
    };
    function inferredGroup(m,key,row){
        if(key==='resources')return m.payments.some(p=>p.resourceId===row.id)?'pull':'other';
        if(key==='exchanges')return row.mode==='daily'?'daily':['monthly','staged'].includes(row.mode)?'monthly':['once','once_staged'].includes(row.mode)?'once':'regular';
        if(key==='unlockGroups')return row.period;
        if(key==='payments')return row.pulls>1?'multi':'single';
        return row.source==='byproduct'?'returns':['daily','signin'].includes(row.schedule)?'daily':row.schedule==='monthly'?'monthly':'gifts';
    }
    function editorGroups(m,key){
        const saved=m.editorGroups?.[key];
        if(Array.isArray(saved)){const seen=new Set();const groups=saved.filter(group=>group&&typeof group.id==='string'&&!seen.has(group.id)&&(seen.add(group.id),true));return groups.some(group=>group.id==='')?groups:[...groups,{id:'',icon:'📂',name:'未分类',en:'Uncategorized'}];}
        return [...groupDefinitions[key].filter(([id])=>m[key].some(row=>inferredGroup(m,key,row)===id)).map(([id,icon,name,en])=>({id,icon,name,en})),{id:'',icon:'📂',name:'未分类',en:'Uncategorized'}];
    }
    function rowGroup(m,key,row){
        const groups=editorGroups(m,key),id=Object.hasOwn(row,'editorGroupId')?row.editorGroupId:m.editorGroups?.[key]?'':inferredGroup(m,key,row);
        return groups.some(group=>group.id===id)?id:'';
    }
    function ensureEditorGroups(key){
        const m=model();
        if(!Array.isArray(m.editorGroups?.[key])){
            const groups=editorGroups(m,key);m[key].forEach(row=>row.editorGroupId=rowGroup(m,key,row));
            m.editorGroups||={};m.editorGroups[key]=groups;
        }
        m.editorGroups[key]=editorGroups(m,key);return m.editorGroups[key];
    }
    function moveToGroup(key,id,groupId){
        if(galleryPreviewLock.isLocked())return;
        const m=model(),row=m[key]?.find(row=>row.id===id);if(!row)return;
        if(rowGroup(m,key,row)===groupId)return;
        const groups=ensureEditorGroups(key);if(!groups.some(group=>group.id===groupId))return;
        row.editorGroupId=groupId;openStates.set('group:'+key+':'+groupId,true);markPageDirty();render();
    }
    function groupedCards(m,key,renderer){
        const outside=renderer({...m,[key]:m[key].filter(row=>rowGroup(m,key,row)==='')});
        return `<div class="eco-ungrouped" data-eco-group-list="${key}" data-eco-group-id="" data-drop-label="${tr('拖到此处移出分类','Drop here to move outside categories')}">${outside}</div>`+editorGroups(m,key).filter(group=>group.id!=='').map(group=>{
            const rows=m[key].filter(row=>rowGroup(m,key,row)===group.id),foldKey='group:'+key+':'+group.id;
            return `<details class="eco-rule-group" data-eco-key="${esc(foldKey)}" data-eco-group-list="${key}" data-eco-group-id="${esc(group.id)}" ${opened(foldKey,false)}><summary class="eco-rule-group-head">${dragHandle('eco-rule-group-drag')}<button type="button" class="eco-group-icon" data-eco-action="group-icon" aria-label="${tr('修改分类图标','Change category icon')}">${IconRender.html(group.icon||'📂')}</button>${group.id?`<span class="eco-name-wrap"><input class="eco-group-name" data-eco-group-field="name" aria-label="${tr('分类名称','Category name')}" maxlength="80" value="${esc(label(group))}" onclick="event.stopPropagation()" onkeydown="event.stopPropagation()"></span>`:`<strong>${tr('未分类','Uncategorized')}</strong>`}<span class="eco-group-count">${rows.length} ${tr('项','entries')}</span>${collapseLabel()}</summary><div class="eco-rule-group-body">${renderer({...m,[key]:rows})||`<div class="eco-group-empty">${tr('将规则拖到此分类。','Drag entries into this category.')}</div>`}<div class="eco-group-actions">${button(tr('移除分类','Remove category'),'remove-group','eco-remove')}</div></div></details>`;
        }).join('');
    }
    function pools() {
        const preset = GameData.getPresetRules(gameId);
        // 预设游戏以当前可抽卡池为准，旧图鉴积木缓存与草稿删除记录不能覆盖它。
        if (preset) return Object.entries(preset).map(([id, rule]) => ({ ...rule.info, id }));
        const list = JSON.parse(readEngineEdit('GM_RosterPools_' + gameId) || '[]');
        const removed = JSON.parse(sessionStorage.getItem(`GM_Pending_Deleted_Pools_${gameId}`) || '[]');
        return list.filter(pool => !removed.includes(pool.id));
    }
    const button = (text, action, extra = '') => `<button type="button" class="btn btn-action-gray ${extra}" data-eco-action="${action}">${esc(text)}</button>`;
    function input(key, value, type = 'text', min = 0, max) {
        return `<input data-eco-field="${key}" class="${key === 'name' ? 'eco-name' : ''}" type="${type}" value="${esc(value)}" ${type === 'number' ? `min="${min}" step="1" ${max ? `max="${max}"` : ''}` : ''}>`;
    }
    function select(key, value, options) {
        const rows = [...options];
        if (value && !rows.some(([id]) => id === value)) rows.push([value, tr('已移除的引用：', 'Removed reference: ') + value]);
        return `<select data-eco-field="${key}">${rows.map(([id, name]) => `<option value="${esc(id)}" ${id === value ? 'selected' : ''}>${esc(name)}</option>`).join('')}</select>`;
    }
    const field = (name, control) => `<label class="eco-field"><span>${esc(name)}</span>${control}</label>`;
    const categories = () => [['', tr('所有图鉴大类', 'All catalog categories')], ...gameInfo.categories.map(cat => [cat.id, label(cat)])];
    const poolOptions = () => [['', tr('所有适用卡池', 'All eligible pools')], ...pools().map(pool => [pool.id, label(pool)])];
    const resources = () => [['', tr('选择资源', 'Choose a resource')], ...model().resources.map(resource => [resource.id, IconRender.text(resource.icon || '🪙') + ' ' + label(resource)])];
    const tierOptions = () => [['', tr('所有稀有度', 'All rarities')], ...gameInfo.globalTiers.map(tier => [tier.id, label(tier)])];
    const tagOptions = () => Object.entries(gameInfo.tagDefinitions || {}).map(([id, definition]) => [id, label({...definition, id})]);
    function tagMatchField(row) {
        return field(tr('标签匹配方式', 'Tag matching'), select('tagMatch', row.tagMatch || 'any', [['any', tr('满足任一标签', 'Match any tag')], ['all', tr('满足全部标签', 'Match all tags')]]))
            .replace('<label ', `<label data-eco-tag-match ${row.tagIds.length < 2 ? 'hidden ' : ''}`);
    }
    const nameField = row => `<span class="eco-name-wrap" onclick="event.stopPropagation()" onkeydown="event.stopPropagation()">${input('name', label(row)).replace('data-eco-field=', `aria-label="${tr('名称', 'Name')}" data-eco-field=`)}</span>`;
    const scopeFields = row => multiScope('poolIds', row, poolOptions());
    const isStaged = row => ['staged', 'once_staged'].includes(row.mode);
    const targetIds = row => row.toIds || [];
    function targetField(row, stage = false) {
        const selected = row.toIds || [], choices = resources().slice(1);
        for (const id of selected) if (!choices.some(([value]) => value === id)) choices.push([id, tr('已移除：', 'Removed: ') + id]);
        const text = selected.length ? scopeSummary(selected, choices) : tr('请选择获得资源', 'Choose target resources');
        return `<div class="eco-field"><span>${tr('获得资源（多选）', 'Receive resources (multiple)')}</span><details class="eco-multi" data-eco-multi="toIds"><summary title="${esc(text)}">${esc(text)}</summary><div class="eco-multi-menu">${choices.map(([id, name]) => `<label><input type="checkbox" data-eco-field="toIds" value="${esc(id)}" ${selected.includes(id) ? 'checked' : ''}>${esc(name)}</label>`).join('')}</div></details></div>`;
    }
    function scopeIds(row, key) {
        if (Array.isArray(row[key])) return row[key];
        const legacy = row[({poolIds: 'poolId', categoryIds: 'categoryId'})[key]];
        return legacy ? [legacy] : [];
    }
    function scopeSummary(ids, options) {
        return ids.length ? options.filter(([id]) => ids.includes(id)).map(([, name]) => name).join('、') || tr('已移除的引用', 'Removed reference') : tr('不限制', 'Unrestricted');
    }
    function multiScope(key, row, options) {
        const selected = scopeIds(row, key), choices = options.filter(([id]) => id);
        for (const id of selected) if (!choices.some(([value]) => value === id)) choices.push([id, tr('已移除：', 'Removed: ') + id]);
        const text = scopeSummary(selected, choices);
        const title = {poolIds: tr('适用卡池（多选）', 'Eligible pools (multiple)'), categoryIds: tr('抽出物品所属图鉴大类（多选）', 'Pulled item categories (multiple)'), tagIds: tr('抽出物品的标签（多选）', 'Pulled item tags (multiple)')}[key];
        return `<div class="eco-field"><span>${title}</span><details class="eco-multi" data-eco-multi="${key}"><summary title="${esc(text)}">${esc(text)}</summary><div class="eco-multi-menu"><label><input type="checkbox" data-eco-field="${key}" value="" ${selected.length ? '' : 'checked'}>${tr('不限制', 'Unrestricted')}</label>${choices.map(([id, name]) => `<label><input type="checkbox" data-eco-field="${key}" value="${esc(id)}" ${selected.includes(id) ? 'checked' : ''}>${esc(name)}</label>`).join('')}${choices.length ? '' : `<p class="eco-hint">${tr('暂无可选项，请先在图鉴设置中添加。', 'Add options in the catalog settings first.')}</p>`}</div></details></div>`;
    }
    function opened(key, defaultOpen = true) {
        if (openStates.has(key)) return openStates.get(key) ? 'open' : '';
        if (!window.PanelDefaults) return defaultOpen ? 'open' : '';
        let level, index;
        if (key.startsWith('section:')) {
            level = 'sections'; index = sectionIds.indexOf(key.slice(8));
        } else if (key.startsWith('group:')) {
            level = 'groups';
            const collection = key.slice(6).split(':')[0], id = key.slice(7 + collection.length);
            index = editorGroups(model(), collection).filter(group => group.id !== '').findIndex(group => group.id === id);
        } else {
            level = 'rules';
            const collection = key.split(':')[0], id = key.slice(collection.length + 1), m = model();
            const row = m[collection]?.find(row => row.id === id);
            if (!row) return defaultOpen ? 'open' : '';
            const group = rowGroup(m, collection, row);
            index = m[collection].filter(item => rowGroup(m, collection, item) === group).findIndex(item => item.id === id);
        }
        return PanelDefaults.initial('currency_setup', level, index) ? 'open' : '';
    }
    const collapseLabel = () => `<span class="eco-collapse" data-open="${tr('▲ 收起', '▲ Collapse')}" data-closed="${tr('▼ 展开', '▼ Expand')}"></span>`;
    const dragHandle = type => `<span class="eco-drag ${type}" title="${tr('按住拖拽排序', 'Drag to reorder')}" onclick="event.stopPropagation()">⠿</span>`;
    const resourceIcon = id => model().resources.find(resource => resource.id === id)?.icon || '❔';
    const defaultRuleIcon = collection => ({resources: '🪙', unlockGroups: '🔓', payments: '🎯', incomes: '🎁'}[collection]);
    function cardIcon(collection, row) {
        if (collection === 'resources') return `<button type="button" class="eco-resource-icon" data-eco-action="icon" aria-label="${tr('编辑资源图标', 'Edit resource icon')}" title="${tr('点击修改图标', 'Click to change icon')}">${IconRender.html(row.icon || '🪙')}</button>`;
        if (collection === 'exchanges') {
            const targets = [...new Set(isStaged(row) && row.stages?.length ? row.stages.flatMap(stage => targetIds(stage)) : targetIds(row))];
            const names = targets.map(id => model().resources.find(resource => resource.id === id)).map(resource => resource ? label(resource) : '?');
            const source = model().resources.find(resource => resource.id === row.from);
            return `<span class="eco-exchange-icons" title="${esc((source ? label(source) : '?') + ' → ' + names.join(' / '))}"><span class="eco-exchange-arrow">→</span>${targets.map(id => `<span>${IconRender.html(resourceIcon(id))}</span>`).join('<span class="eco-exchange-arrow">/</span>')}</span>`;
        }
        return `<button type="button" class="eco-resource-icon eco-kind-icon" data-eco-action="icon" aria-label="${tr('编辑规则图标', 'Edit rule icon')}" title="${tr('点击修改图标', 'Click to change icon')}">${IconRender.html(row.icon || defaultRuleIcon(collection))}</button>`;
    }
    function card(collection, row, title, body) {
        const key = collection + ':' + row.id;
        return `<details class="eco-card" data-eco-key="${esc(key)}" ${opened(key, model()[collection][0]?.id === row.id)} data-eco-list="${collection}" data-eco-id="${esc(row.id)}"><summary class="eco-card-head">${dragHandle('eco-card-drag')}${collection==='exchanges'?`<span class="eco-exchange-source">${IconRender.html(resourceIcon(row.from))}</span>`:cardIcon(collection, row)}<strong class="eco-sr-only">${esc(title)}</strong>${nameField(row)}${collection==='exchanges'?cardIcon(collection,row):''}${collapseLabel()}</summary><div class="eco-card-body">${body}</div><footer class="eco-item-actions">${button(collection === 'resources' ? tr('🗑️ 移除此资源', '🗑️ Remove resource') : tr('🗑️ 移除此规则', '🗑️ Remove rule'), 'remove', 'eco-remove')}</footer></details>`;
    }
    function resourceCards(m) {
        return m.resources.map(row => `<div class="eco-card eco-card-head eco-resource-row" data-eco-list="resources" data-eco-id="${esc(row.id)}">${dragHandle('eco-card-drag')}${cardIcon('resources', row)}<strong class="eco-sr-only">${esc(label(row))}</strong>${nameField(row)}<button type="button" class="btn eco-resource-delete" data-eco-action="remove" aria-label="${tr('移除此资源', 'Remove resource')}" title="${tr('移除此资源', 'Remove resource')}">✕</button></div>`).join('');
    }
    function exchangeCards(m) {
        return m.exchanges.map(row => {
            const staged = isStaged(row), monthly = ['monthly', 'staged'].includes(row.mode);
            const table = staged ? `<div class="eco-table-wrap"><table class="eco-table"><thead><tr><th>${tr('阶段', 'Stage')}</th><th>${tr('支付数量', 'Cost')}</th><th>${tr('获得数量', 'Receive')}</th><th>${tr('获得资源（每档择一）', 'Receive resource (choose one)')}</th><th></th></tr></thead><tbody>${(row.stages || []).map((stage, i) => `<tr data-eco-stage="${i}"><td>${i + 1}</td><td>${input('cost', stage.cost, 'number', 1)}</td><td>${input('gain', stage.gain, 'number', 1)}</td><td>${targetField(stage, true)}</td><td>${button('×', 'remove-stage', 'eco-remove')}</td></tr>`).join('')}</tbody></table></div>${button(tr('＋ 增加一档', '+ Add stage'), 'add-stage')}` : '';
            return card('exchanges', row, label(row), `<div class="eco-grid">${field(tr('支付资源', 'Pay resource'), select('from', row.from, resources()))}${staged ? '' : targetField(row)}${field(tr('兑换方式', 'Exchange mode'), select('mode', row.mode, [['once', tr('一次性兑换', 'One-time exchange')], ['once_staged', tr('一次性阶梯兑换', 'One-time stages')], ['fixed', tr('固定兑换／永久开放', 'Fixed / unlimited')], ['daily', tr('每日限购', 'Daily limit')], ['monthly', tr('每月限购', 'Monthly limit')], ['staged', tr('每月阶梯兑换', 'Monthly stages')]]))}${staged ? '' : field(tr('每次支付', 'Cost per purchase'), input('cost', row.cost, 'number', 1)) + field(tr('每次获得', 'Receive per purchase'), input('gain', row.gain, 'number', 1))}${['daily','monthly'].includes(row.mode) ? field(row.mode==='daily'?tr('每种资源每日可购买次数','Daily purchases per target'):tr('每种资源每月可购买次数', 'Monthly purchases per target'), input('limit', row.limit, 'number', 1)) : ''}</div>${monthly ? `<span class="eco-reset-badge" title="${tr('月重置时恢复兑换额度，无需设置日期或小时', 'Restore allowances on monthly reset; no date or hour needed')}">↻ ${tr('月重置', 'Monthly reset')}</span>` : ''}${table}${staged ? `<div class="eco-summary">${esc(exchangeSummary(row))}</div>` : ''}${field(tr('所属前置条件','Prerequisite'),select('unlockGroupId',row.unlockGroupId||'',[['',tr('无前置条件','None')],...m.unlockGroups.map(group=>[group.id,label(group)])]))}`);
        }).join('');
    }
    function unlockGroupCards(m){
        return m.unlockGroups.map(group=>card('unlockGroups',group,label(group),`
            <div class="eco-grid">${field(tr('解锁周期','Unlock period'),select('period',group.period,[['daily',tr('每日重置','Daily reset')],['monthly',tr('每月重置','Monthly reset')],['once',tr('单次解锁／永久保留','One-time unlock / permanent')]]))}${field(tr('说明（仅展示）','Description (display only)'),input('prerequisite',prerequisiteText(group)).replace('class=""','class="eco-prerequisite-text"'))}</div>
            <h4>${tr('前置兑换（多选，全部满足）','Prerequisite purchases (all selected required)')}</h4>
            <div class="eco-unlock-requirements">${m.exchanges.map(exchange=>{
                const index=(group.requirements||[]).findIndex(r=>r.exchangeId===exchange.id),r=group.requirements?.[index];
                return `<div class="eco-unlock-requirement"><label><input type="checkbox" data-eco-field="groupRequirement" value="${esc(exchange.id)}" ${r?'checked':''}>${esc(label(exchange))}</label>${r?`<div class="eco-grid" data-eco-requirement="${index}">${isStaged(exchange)?'':field(tr('指定兑换目标','Purchase target'),select('targetId',r.targetId||'', [['',tr('所有目标合计','All targets combined')],...(exchange.toIds||[]).map(id=>[id,resources().find(([key])=>key===id)?.[1]||id])]))}<label><input type="checkbox" data-eco-field="all" ${r.all?'checked':''}>${tr('兑换至上限','Purchase to limit')}</label>${r.all?'':field(tr('需要完成次数','Required purchases'),input('times',r.times||1,'number',1))}</div>`:''}</div>`;
            }).join('')}</div><h4>${tr('一次性解锁消耗','One-time unlock costs')}</h4>
            ${(group.costs||[]).map((cost,index)=>`<div class="eco-grid" data-eco-unlock-cost="${index}">${field(tr('消耗资源','Resource'),select('resourceId',cost.resourceId,resources()))}${field(tr('消耗数量','Amount'),input('amount',cost.amount,'number',1))}${button(tr('🗑️ 移除','🗑️ Remove'),'remove-unlock-cost','eco-remove')}</div>`).join('')}
            ${button(tr('＋ 添加消耗资源','+ Add resource cost'),'add-unlock-cost')}`)).join('');
    }
    const prerequisiteText = row => getLang() === 'en' ? row.prerequisiteEn || row.prerequisite || '' : row.prerequisite || row.prerequisiteEn || '';

    function exchangeSummary(row) {
        const totals = new Map();
        let cost = 0, pulls = 0, allTickets = true;
        for (const stage of row.stages || []) {
            cost += Number(stage.cost) || 0;
            const ids = targetIds(stage), key = [...ids].sort().join('|');
            const group = totals.get(key) || { ids, count: 0 };
            group.count += Number(stage.gain) || 0;
            totals.set(key, group);
        }
        const rewards = [...totals.values()].map(({ids, count}) => {
            const rates = ids.map(id => [...new Set(model().payments.filter(payment => payment.resourceId === id && payment.cost > 0 && payment.pulls > 0).map(payment => payment.pulls / payment.cost))]);
            const rate = rates.length && rates.every(values => values.length === 1 && values[0] === rates[0][0]) ? rates[0][0] : NaN;
            const drawCount = count * rate;
            if (!Number.isSafeInteger(drawCount)) allTickets = false;
            else pulls += drawCount;
            const names = ids.map(id => {const resource=model().resources.find(item=>item.id===id);return resource?label(resource):'?';});
            const rewardName = names.join(tr(' 或 ', ' or ')) || '?';
            return `${names.length > 1 ? '(' + rewardName + ')' : rewardName} × ${count}`;
        }).join(' + ');
        const schedule = row.mode === 'once_staged' ? tr('按顺序解锁，每档仅一次，整档购买；不随月重置。', 'Sequential unlocks; each stage once, purchased as a whole; never resets monthly.') : tr('按顺序解锁，每档每月一次，整档购买。', 'Sequential unlocks; each stage once per month, purchased as a whole.');
        return `${tr('全部档位合计：支付', 'All stages: pay')} ${cost} → ${rewards}${allTickets ? tr(`（共${pulls}抽）`, ` (${pulls} pulls)`) : ''}。${schedule}`;
    }
    function paymentCards(m) {
        return m.payments.map(row => card('payments', row, label(row), `<div class="eco-grid">${field(tr('支付资源', 'Payment resource'), select('resourceId', row.resourceId, resources()))}${field(tr('消耗数量', 'Resource cost'), input('cost', row.cost, 'number', 1))}${field(tr('执行抽数', 'Pulls performed'), input('pulls', row.pulls, 'number', 1))}${scopeFields(row)}</div>`)).join('');
    }
    function incomeCards(m) {
        return m.incomes.map(row => {
            const reward = row.source === 'byproduct', schedule = row.schedule === 'signin';
            const days = row.days || [];
            const total = days.reduce((sum, day) => sum + (Number(day.amount) || 0), 0);
            const line = (kind, content) => `<div class="eco-grid eco-income-row" data-eco-income-row="${kind}">${content}</div>`;
            const identity = line('identity', field(tr('获得资源', 'Receive resource'), select('resourceId', row.resourceId, resources())) + field(tr('来源', 'Source'), select('source', row.source, [['byproduct', tr('抽卡返还／副产物', 'Pull returns / byproducts')], ['other', tr('其他', 'Other')]])));
            const split = reward && row.condition === 'cap_split';
            const amount = !schedule || reward ? field(split ? tr('未溢出获得数量（含首次）', 'Non-overflow amount (including first)') : tr('每次获得数量', 'Amount per award'), input('amount', row.amount, 'number', 1)) + (split ? field(tr('溢出获得数量', 'Overflow amount'), input('overflowAmount', row.overflowAmount, 'number', 1)) : '') : '';
            const conditions = reward
                ? line('filters', multiScope('categoryIds', row, categories()) + scopeFields(row) + multiScope('tagIds', row, tagOptions()) + tagMatchField(row) + field(tr('抽出物品的稀有度', 'Rarity of pulled item'), select('tierId', row.tierId || '', tierOptions())))
                  + line('award', field(tr('发放条件', 'Award condition'), select('condition', row.condition, [['always', tr('每次抽出', 'Every copy')], ['first', tr('首次获得', 'First copy')], ['non_overflow', tr('首次及重复（不含溢出）', 'First and duplicates (excluding overflow)')], ['duplicate', tr('重复获得（含溢出）', 'Duplicate (including overflow)')], ['duplicate_no_overflow', tr('重复获得（不含溢出）', 'Duplicate (excluding overflow)')], ['overflow', tr('仅溢出', 'Overflow only')], ['cap_split', tr('按满阶分段发放', 'Separate non-overflow / overflow amounts')]])) + amount)
                  + (split ? `<p class="eco-hint">${tr('按同一物品的累计获得件数判断：首次到刚好满阶使用未溢出数量，满阶后的下一件起使用溢出数量。分界取下方对应图鉴大类的满阶件数。', 'For each individual item, copies from the first through the cap use the non-overflow amount; subsequent copies use the overflow amount. The threshold follows its catalog category’s copy cap below.')}</p>` : '')
                : line('schedule', field(tr('发放安排', 'Schedule'), select('schedule', row.schedule, [['once', tr('仅限一次', 'One-time only')], ['unlimited', tr('不限次数领取', 'Unlimited claims')], ['daily', tr('每日获得', 'Daily')], ['monthly', tr('每月获得', 'Monthly')], ['signin', tr('累计签到奖励', 'Sign-in milestones')]])) + amount);
            return card('incomes', row, label(row), `${identity}${conditions}${schedule && !reward ? `<div class="eco-table-wrap"><table class="eco-table"><thead><tr><th>${tr('累计签到天数', 'Sign-in day')}</th><th>${tr('获得数量', 'Reward amount')}</th><th></th></tr></thead><tbody>${days.map((day, i) => `<tr data-eco-day="${i}"><td>${input('day', day.day, 'number', 1)}</td><td>${input('amount', day.amount, 'number', 1)}</td><td>${button('×', 'remove-day', 'eco-remove')}</td></tr>`).join('')}</tbody></table></div>${button(tr('＋ 添加签到节点', '+ Add milestone'), 'add-day')}<div class="eco-summary">${tr('全部签到奖励合计：', 'Total sign-in rewards: ')}${total}${tr('。以实际签到天数解锁，不自动视为已领取；本版不配置补签。', '. Unlock by actual sign-in days; not treated as already claimed. Make-up sign-ins are not configured in this version.')}</div>` : ''}`);
        }).join('');
    }
    function capCards() {
        return `<div class="eco-cap-grid">${gameInfo.categories.map(cat => `<div class="eco-card eco-cap-card" data-eco-list="caps" data-eco-id="${esc(cat.id)}"><div class="eco-cap-heading"><span class="eco-cap-icon" aria-hidden="true">${IconRender.html(cat.icon || '🏷️')}</span><strong>${esc(label(cat))}</strong></div>${field(tr('满阶件数','Copies to reach cap'), input('cap', gameInfo.overflowRules?.[cat.id] ?? gameInfo.overflowRules?.other ?? 5, 'number', 1).replace('<input ',`<input aria-label="${esc(label(cat)+' · '+tr('满阶件数','Copies to reach cap'))}" `))}</div>`).join('')}</div>`;
    }
    function refreshExampleVisibility(){
        const example=document.getElementById('gallery-economy')?.querySelector?.('[data-eco-action="example"]');
        if(example)example.hidden=typeof localStorage==='undefined'||localStorage.getItem('GM_Show_Currency_Examples')!=='true';
    }
    function render() {
        const root = document.getElementById('gallery-economy');
        if (!root) return;
        root.classList?.remove('eco-rule-dragging');
        root.querySelectorAll('details[data-eco-key]').forEach(node => openStates.set(node.dataset.ecoKey, node.open));
        const m = model();
        gameInfo.overflowRules ||= {};
        for (const cat of gameInfo.categories) {
            if (gameInfo.overflowRules[cat.id] === undefined) gameInfo.overflowRules[cat.id] = gameInfo.overflowRules.other ?? 5;
        }
        const sectionNames = {resources: tr('资源账户', 'Resources'), exchanges: tr('兑换规则', 'Exchange rules'), unlockGroups: tr('前置条件', 'Prerequisites'), payments: tr('抽卡支付', 'Pull payments'), incomes: tr('获取与赠送', 'Income & gifts'), caps: tr('满阶与溢出', 'Copy caps & overflow')};
        const sections = sectionIds.map(id => [id, sectionNames[id]]);
        const content = { unlockGroups: unlockGroupCards, resources: resourceCards, exchanges: exchangeCards, payments: paymentCards, incomes: incomeCards };
        sortBindings.forEach(binding => binding?.destroy());
        sortBindings = [];
        root.innerHTML = `<div class="eco-toolbar"><span>${m.resources.length} ${tr('种资源', 'resources')} · ${m.exchanges.length} ${tr('条兑换', 'exchanges')} · ${m.incomes.length} ${tr('项来源', 'sources')}</span>${button(tr('＋ 加入通用示例', '+ Add generic example'), 'example').replace('<button ','<button hidden ')}</div>${sections.map(([id, name]) => `<details class="eco-section" data-eco-key="section:${id}" data-eco-section="${id}" ${opened('section:' + id)}><summary><h2>${esc(name)}</h2>${collapseLabel()}</summary><div class="eco-section-body">${id === 'caps' ? capCards() : `<div class="eco-items" data-eco-items="${id}">${groupedCards(m,id,content[id]) || `<div class="eco-empty">${tr('还没有配置。', 'No entries configured yet.')}</div>`}</div><div class="eco-section-actions">${button(id==='resources'?tr('＋ 添加资源','+ Add resource'):tr('＋ 添加','+ Add'),'add')}${button(tr('＋ 添加分类','+ Add category'),'add-group')}</div>`}</div></details>`).join('')}<div id="economy-validation" class="eco-error" role="alert"></div>`;
        refreshExampleVisibility();
        root.onclick = onClick;
        root.onkeydown = event => {
            if (galleryPreviewLock.isLocked() && ['Enter', ' ', 'Spacebar'].includes(event.key) && event.target.closest('.eco-multi > summary')) event.preventDefault();
        };
        root.oninput = onChange;
        root.onchange = onChange;
        bindSorters(root);
        if (typeof syncGalleryReadonlyControls === 'function') syncGalleryReadonlyControls();
        if (window.refreshCustomDropdowns) window.refreshCustomDropdowns(root);
        installBilingual();
    }
    function reorder(collection, from, to, before) {
        if (galleryPreviewLock.isLocked() || from === to) return;
        const rows = model()[collection];
        const getId = row => row.id;
        const source = rows.findIndex(row => getId(row) === from);
        if (source < 0 || !rows.some(row => getId(row) === to)) return;
        const targetRow=rows.find(row=>row.id===to),groupId=rowGroup(model(),collection,targetRow);ensureEditorGroups(collection);rows[source].editorGroupId=groupId;openStates.set('group:'+collection+':'+groupId,true);
        const [moved] = rows.splice(source, 1);
        const target = rows.findIndex(row => getId(row) === to);
        rows.splice(target + (before ? 0 : 1), 0, moved);
        markPageDirty();
        render();
    }
    const dragRoots=new WeakSet();let draggedRule=null;
    function reorderEditorGroups(key,from,to,before){
        if(galleryPreviewLock.isLocked()||from===to)return;
        const groups=ensureEditorGroups(key),source=groups.findIndex(group=>group.id===from);
        if(source<0||!groups.some(group=>group.id===to))return;
        const [moved]=groups.splice(source,1),target=groups.findIndex(group=>group.id===to);groups.splice(target+(before?0:1),0,moved);markPageDirty();render();
    }
    function bindGroupDrops(root){
        if(!root.addEventListener||dragRoots.has(root))return;dragRoots.add(root);
        const clear=()=>root.querySelectorAll('.eco-group-drop-target').forEach(node=>node.classList.remove('eco-group-drop-target'));
        root.addEventListener('dragstart',event=>{
            draggedRule=null;if(galleryPreviewLock.isLocked()||!event.target.closest('.eco-card-drag'))return;
            const card=event.target.closest('[data-eco-list]');if(card)draggedRule={key:card.dataset.ecoList,id:card.dataset.ecoId};
        },true);
        // dragstart 期间不能改变源条目的布局；浏览器确认拖动后才显示额外落点。
        root.addEventListener('dragover',()=>{
            if(draggedRule&&!galleryPreviewLock.isLocked())root.classList?.add('eco-rule-dragging');
        },true);
        root.addEventListener('dragend',()=>{clear();root.classList?.remove('eco-rule-dragging');draggedRule=null;},true);
        root.addEventListener('dragover',event=>{
            if(galleryPreviewLock.isLocked()||!draggedRule||event.target.closest('.eco-card'))return;
            const group=event.target.closest('[data-eco-group-list]');if(!group||group.dataset.ecoGroupList!==draggedRule.key)return;
            event.preventDefault();event.stopPropagation();clear();group.classList.add('eco-group-drop-target');if(event.dataTransfer)event.dataTransfer.dropEffect='move';
        });
        root.addEventListener('dragleave',event=>{const group=event.target.closest('[data-eco-group-list]');if(group&&!group.contains(event.relatedTarget))group.classList.remove('eco-group-drop-target');});
        root.addEventListener('drop',event=>{
            if(galleryPreviewLock.isLocked()||!draggedRule||event.target.closest('.eco-card'))return;
            const group=event.target.closest('[data-eco-group-list]');if(!group||group.dataset.ecoGroupList!==draggedRule.key)return;
            event.preventDefault();event.stopPropagation();const source=draggedRule;draggedRule=null;clear();root.classList?.remove('eco-rule-dragging');moveToGroup(source.key,source.id,group.dataset.ecoGroupId);
        });
    }
    function bindSorters(root) {
        if (!window.DragSort) return;
        const canDrag = () => !galleryPreviewLock.isLocked();
        bindGroupDrops(root);
        for (const key of sectionIds.filter(id => id !== 'caps')) {
            const container = root.querySelector(`[data-eco-items="${key}"]`);
            sortBindings.push(DragSort.bind(container,'.eco-rule-group',(from,to,before)=>reorderEditorGroups(key,from,to,before),{handleSelector:'.eco-rule-group-drag',handleOnly:true,getId:node=>node.dataset.ecoGroupId,canDrag}));
            sortBindings.push(DragSort.bind(container, '.eco-card', (from, to, before) => reorder(key, from, to, before), {
                handleSelector: '.eco-card-drag', handleOnly: true, getId: node => node.dataset.ecoId, canDrag
            }));
        }
    }
    function add(collection,groupId='') {
        const m = model(), first = m.resources[0]?.id || '';
        const common = { id: uid(), name: tr('新配置', 'New entry') };
        const defaults = {
            resources: { icon: '🪙' },
            unlockGroups: {period:'monthly',requirements:[],costs:[]},
            exchanges: { from: first, toIds: m.resources[1] ? [m.resources[1].id] : [], mode: 'fixed', cost: 160, gain: 1, limit: 5, stages: [{ cost: 10, gain: 1, toIds: [] }] },
            payments: { resourceId: first, cost: 1, pulls: 1, poolId: '' },
            incomes: { resourceId: first, source: 'other', schedule: 'once', amount: 1, categoryId: '', poolId: '', tierId: '', condition: 'always', days: [{ day: 1, amount: 1 }] }
        };
        ensureEditorGroups(collection);m[collection].push({ ...common, ...defaults[collection],editorGroupId:groupId });
        openStates.set('group:'+collection+':'+groupId,true);
        openStates.set(collection + ':' + common.id, true);
    }
    function installBilingual() {
        if (bilingualController || !window.BilingualInput) return;
        bilingualController = BilingualInput.install({
            selector: '#gallery-economy .eco-name, #gallery-economy .eco-prerequisite-text, #gallery-economy .eco-group-name',
            resolve(control) {
                if(control.dataset?.ecoGroupField){
                    const groupNode=control.closest('[data-eco-group-list]'),key=groupNode.dataset.ecoGroupList,id=groupNode.dataset.ecoGroupId;
                    return {getLanguage:getLang,isLocked:()=>galleryPreviewLock.isLocked(),getValue:language=>editorGroups(model(),key).find(group=>group.id===id)?.[language==='en'?'en':'name'],setValue:(language,value)=>{if(galleryPreviewLock.isLocked())return;ensureEditorGroups(key).find(group=>group.id===id)[language==='en'?'en':'name']=value;markPageDirty();}};
                }
                const cardEl = control.closest('[data-eco-list]');
                const row = model()[cardEl.dataset.ecoList]?.find(item => item.id === cardEl.dataset.ecoId);
                if (!row) return null;
                const prerequisite = control.dataset?.ecoField === 'prerequisite';
                const textKey = language => prerequisite ? (language === 'en' ? 'prerequisiteEn' : 'prerequisite') : (language === 'en' ? 'en' : 'name');
                return {
                    getLanguage: getLang, isLocked: () => galleryPreviewLock.isLocked(),
                    getValue: language => row[textKey(language)],
                    setValue(language, value) {
                        if (galleryPreviewLock.isLocked()) return;
                        row[textKey(language)] = value;
                        if (!prerequisite) {
                            cardEl.querySelector('strong').textContent = label(row);
                            if (cardEl.dataset.ecoList === 'resources') refreshResourceLabels();
                        }
                        markPageDirty();
                    }
                };
            }
        });
    }
    function refreshResourceLabels() {
        const root = document.getElementById('gallery-economy');
        if (!root) return;
        const m = model(), choices = resources();
        const names = new Map(choices);
        // 只更新文字，保留输入焦点、勾选状态及下拉菜单节点。
        // 共用下拉组件会监听 option 文本变化并同步可见选项。
        for (const option of root.querySelectorAll('select[data-eco-field="from"] option, select[data-eco-field="resourceId"] option')) {
            if (option.value && names.has(option.value) && option.textContent !== names.get(option.value)) option.textContent = names.get(option.value);
        }
        for (const group of root.querySelectorAll('[data-eco-multi="toIds"]')) {
            for (const choice of group.querySelectorAll('label')) {
                const id = choice.querySelector('input')?.value;
                if (id && names.has(id) && choice.lastChild.textContent !== names.get(id)) choice.lastChild.textContent = names.get(id);
            }
            const card = group.closest('[data-eco-list]');
            const row = m.exchanges.find(item => item.id === card.dataset.ecoId);
            const stage = group.closest('[data-eco-stage]');
            const target = stage ? row.stages[Number(stage.dataset.ecoStage)] : row;
            const text = target.toIds.length ? scopeSummary(target.toIds, choices) : tr('请选择获得资源', 'Choose target resources');
            const summary = group.querySelector('summary');
            summary.textContent = text;
            summary.title = text;
        }
        for (const card of root.querySelectorAll('[data-eco-list="exchanges"]')) {
            const row = m.exchanges.find(item => item.id === card.dataset.ecoId);
            const summary = card.querySelector('.eco-summary');
            if (summary) summary.textContent = exchangeSummary(row);
            const icon = card.querySelector('.eco-exchange-icons');
            const targets = [...new Set(isStaged(row) && row.stages?.length ? row.stages.flatMap(stage => targetIds(stage)) : targetIds(row))];
            const resourceName = id => { const resource=m.resources.find(item=>item.id===id); return resource?label(resource):'?'; };
            if (icon) icon.title = resourceName(row.from) + ' → ' + targets.map(resourceName).join(' / ');
        }
    }
    function onChange(event) {
        if (galleryPreviewLock.isLocked()) return;
        if(event.target.dataset?.ecoGroupField){
            const groupNode=event.target.closest('[data-eco-group-list]'),groups=ensureEditorGroups(groupNode.dataset.ecoGroupList),group=groups.find(group=>group.id===groupNode.dataset.ecoGroupId);
            if(group){group[getLang()==='en'?'en':'name']=event.target.value;markPageDirty();}return;
        }
        const control = event.target.closest('[data-eco-field]');
        const cardEl = control?.closest('[data-eco-list]');
        if (!cardEl) return;
        const list = cardEl.dataset.ecoList, id = cardEl.dataset.ecoId, key = control.dataset.ecoField;
        if(list==='unlockGroups'){
            const row=model().unlockGroups.find(row=>row.id===id),requirement=control.closest('[data-eco-requirement]'),cost=control.closest('[data-eco-unlock-cost]');
            if(key==='groupRequirement'){
                row.requirements||=[];
                if(control.checked&&!row.requirements.some(r=>r.exchangeId===control.value))row.requirements.push({exchangeId:control.value,times:1,all:false});
                if(!control.checked)row.requirements=row.requirements.filter(r=>r.exchangeId!==control.value);
                markPageDirty();render();return;
            }
            if(requirement||cost){
                const value=control.type==='checkbox'?control.checked:control.type==='number'?Number(control.value):control.value;
                if(control.type==='number'&&(!Number.isSafeInteger(value)||value<1)){control.setCustomValidity(tr('请输入正整数。','Enter a positive integer.'));return;}
                control.setCustomValidity('');
                const target=requirement?row.requirements[Number(requirement.dataset.ecoRequirement)]:row.costs[Number(cost.dataset.ecoUnlockCost)];
                target[key]=value;markPageDirty();if(control.type==='checkbox'||control.tagName==='SELECT')render();return;
            }
        }
        if (control.type === 'checkbox') {
            const row = model()[list].find(item => item.id === id);
            if (key === 'toIds') {
                const stage = control.closest('[data-eco-stage]');
                const target = stage ? row.stages[Number(stage.dataset.ecoStage)] : row;
                const selected = new Set(target.toIds || []);
                if (!control.value) selected.clear();
                else if (control.checked) selected.add(control.value);
                else selected.delete(control.value);
                target.toIds = [...selected];
                const group = control.closest('[data-eco-multi]');
                for (const box of group.querySelectorAll('input')) box.checked = box.value ? selected.has(box.value) : selected.size === 0;
                const summary = group.querySelector('summary');
                summary.textContent = selected.size ? scopeSummary(target.toIds, resources()) : tr('请选择获得资源', 'Choose target resources');
                summary.title = summary.textContent;
                cardEl.querySelector('.eco-exchange-icons').outerHTML = cardIcon('exchanges', row);
                const total = cardEl.querySelector('.eco-summary');
                if (total) total.textContent = exchangeSummary(row);
                markPageDirty();
                return;
            }
            const selected = new Set(scopeIds(row, key));
            if (!control.value) selected.clear();
            else if (control.checked) selected.add(control.value);
            else selected.delete(control.value);
            row[key] = [...selected];
            if (key === 'poolIds') delete row.poolId;
            if (key === 'categoryIds') delete row.categoryId;
            const group = control.closest('[data-eco-multi]');
            for (const box of group.querySelectorAll('input')) box.checked = box.value ? selected.has(box.value) : selected.size === 0;
            const summary = group.querySelector('summary');
            summary.textContent = scopeSummary(row[key], key === 'poolIds' ? poolOptions() : key === 'tagIds' ? tagOptions() : categories());
            summary.title = summary.textContent;
            if (key === 'tagIds') cardEl.querySelector('[data-eco-tag-match]').hidden = row.tagIds.length < 2;
            markPageDirty();
            return;
        }
        const value = control.type === 'number' ? Number(control.value) : control.value;
        if (control.type === 'number' && (!control.value || !Number.isSafeInteger(value) || value < Number(control.min) || (control.max && value > Number(control.max)))) {
            control.setCustomValidity(tr('请填写范围内的整数。', 'Enter an integer within the allowed range.'));
            if (event.type !== 'input') control.reportValidity();
            return;
        }
        control.setCustomValidity('');
        if (list === 'caps') {
            gameInfo.overflowRules = { ...gameInfo.overflowRules, [id]: value };
        } else {
            const row = model()[list].find(item => item.id === id);
            if (!row) return;
            const stage = control.closest('[data-eco-stage]'), day = control.closest('[data-eco-day]');
            if (stage) row.stages[Number(stage.dataset.ecoStage)][key] = value;
            else if (day) row.days[Number(day.dataset.ecoDay)][key] = value;
            else row[getLang() === 'en' ? ({name:'en', prerequisite:'prerequisiteEn'}[key] || key) : key] = value;
            if (key === 'mode') {
                if(list==='exchanges'&&isStaged(row))for(const group of gameInfo.economy.unlockGroups)for(const requirement of group.requirements||[])if(requirement.exchangeId===id)delete requirement.targetId;
                if (isStaged(row) && !row.stages?.length) {
                    row.stages = [{cost: row.cost || 1, gain: row.gain || 1, toIds: [...(row.toIds || [])]}];
                } else if (!isStaged(row) && !row.toIds?.length) {
                    row.toIds = [...(row.stages?.[0]?.toIds || [])];
                }
                if (value === 'once') row.limit = 1;
            }
        }
        markPageDirty();
        // 文本/数字失焦时不重建按钮，保证紧接着的保存、切页点击仍能生效。
        if (control.tagName === 'SELECT') render();
        else {
            const row = model()[list]?.find(item => item.id === id);
            if (row && ['name', 'en'].includes(key)) cardEl.querySelector('strong').textContent = label(row);
            if (list === 'resources' && ['name', 'en'].includes(key)) refreshResourceLabels();
            const summary = cardEl.querySelector('.eco-summary');
            if (summary && list === 'exchanges') {
                summary.textContent = exchangeSummary(row);
            }
            if (summary && list === 'incomes') summary.textContent = `${tr('全部签到奖励合计：', 'Total sign-in rewards: ')}${row.days.reduce((sum, day) => sum + day.amount, 0)}${tr('。以实际签到天数解锁，不自动视为已领取；本版不配置补签。', '. Unlock by actual sign-in days; not treated as already claimed. Make-up sign-ins are not configured in this version.')}`;
        }
    }
    async function confirmAction(message, example = false) {
        if (confirming || galleryPreviewLock.isLocked()) return false;
        confirming = true;
        try {
            if (!window.Dialog) return !!window.confirm(message);
            actionDialog ||= window.Dialog.create({themes: {danger: '#ff4757', primary: '#007bff'}});
            return await actionDialog.confirm(message, {
                theme: example ? 'primary' : 'danger',
                title: example ? tr('加入通用示例', 'Add generic examples') : tr('删除确认', 'Confirm deletion'),
                okText: example ? tr('确认添加', 'Add examples') : tr('确认删除', 'Delete'),
                cancelText: tr('取消', 'Cancel')
            });
        } finally { confirming = false; }
    }
    // 收集真实引用位置，删除保护与弹窗清单使用同一份结果。
    function deletionReferences(m, list, id) {
        const references = [];
        const add = (section, row, reasons) => { if (reasons.length) references.push({ section, row, reasons }); };
        if (list === 'resources') {
            for (const row of m.exchanges) {
                const reasons = [];
                if (row.from === id) reasons.push(tr('支付资源', 'Payment resource'));
                if (row.toIds?.includes(id)) reasons.push(tr('获得资源', 'Reward resource'));
                (row.stages || []).forEach((stage, index) => {
                    if (stage.toIds?.includes(id)) reasons.push(tr(`第${index + 1}档获得资源`, `Stage ${index + 1} reward`));
                });
                add('exchanges', row, reasons);
            }
            for (const row of m.unlockGroups) {
                const reasons = [];
                if (row.costs?.some(cost => cost.resourceId === id)) reasons.push(tr('解锁消耗', 'Unlock cost'));
                if (row.requirements?.some(requirement => requirement.targetId === id)) reasons.push(tr('前置兑换目标', 'Prerequisite exchange target'));
                add('unlockGroups', row, reasons);
            }
            for (const section of ['payments', 'incomes']) {
                for (const row of m[section]) if (row.resourceId === id) add(section, row, [section === 'payments' ? tr('支付资源', 'Payment resource') : tr('获得资源', 'Reward resource')]);
            }
        } else if (list === 'exchanges') {
            for (const row of m.unlockGroups) if (row.requirements?.some(requirement => requirement.exchangeId === id)) add('unlockGroups', row, [tr('前置兑换', 'Required exchange')]);
        } else if (list === 'unlockGroups') {
            for (const row of m.exchanges) if (row.unlockGroupId === id) add('exchanges', row, [tr('所属前置条件', 'Assigned prerequisite')]);
        }
        return references;
    }
    function revealReferences(references) {
        const root = document.getElementById('gallery-economy');
        if (!root) return;
        let first;
        root.querySelectorAll('.eco-reference-target').forEach(node => node.classList.remove('eco-reference-target'));
        for (const reference of references) {
            const card = [...root.querySelectorAll('[data-eco-list]')].find(node => node.dataset.ecoList === reference.section && node.dataset.ecoId === reference.row.id);
            if (!card) continue;
            for (let node = card; node && node !== root; node = node.parentElement) {
                if (node.tagName === 'DETAILS') {
                    node.open = true;
                    if (node.dataset.ecoKey) openStates.set(node.dataset.ecoKey, true);
                }
            }
            card.classList.add('eco-reference-target');
            first ||= card;
        }
        first?.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
        first?.querySelector('summary')?.focus?.({ preventScroll: true });
    }
    async function warnReferenced(m, list, row) {
        const references = deletionReferences(m, list, row.id);
        if (!references.length) return false;
        if (confirming) return true;
        const sections = { exchanges: tr('兑换规则', 'Exchange rules'), unlockGroups: tr('前置条件', 'Prerequisites'), payments: tr('抽卡支付', 'Pull payments'), incomes: tr('获取与赠送', 'Income & gifts') };
        const entries = references.map(({section, row: source, reasons}) => {
            const group = editorGroups(m, section).find(group => group.id && group.id === rowGroup(m, section, source));
            return `• ${sections[section]}${group ? ' / ' + label(group) : ''} / ${label(source)}\n  ${reasons.join(tr('、', ', '))}`;
        });
        const message = tr(`「${label(row)}」仍被以下规则引用，暂时无法删除：`, `“${label(row)}” is still referenced by these rules and cannot be deleted:`) + '\n\n' + entries.join('\n\n') + '\n\n' + tr('请前往对应规则修改或解除关联，再回来删除。', 'Review these rules and remove or change their references before deleting this entry.');
        confirming = true;
        try {
            let view;
            if (window.Dialog) {
                actionDialog ||= window.Dialog.create({themes: {danger: '#ff4757', primary: '#007bff'}});
                view = await actionDialog.confirm(message, { title: tr('无法删除：仍有规则引用', 'Cannot delete: referenced by rules'), theme: 'danger', okText: tr('查看引用规则', 'View referencing rules'), cancelText: tr('关闭', 'Close') });
            } else view = window.confirm(message);
            if (view && model() === m) revealReferences(references);
        } finally { confirming = false; }
        return true;
    }

    async function onClick(event) {
        if (galleryPreviewLock.isLocked() && event.target.closest('.eco-multi > summary')) {
            event.preventDefault();
            return;
        }
        const action = event.target.closest('[data-eco-action]')?.dataset.ecoAction;
        if (!action || galleryPreviewLock.isLocked()) return;
        if(['add-group','remove-group','group-icon'].includes(action)){
            event.preventDefault?.();event.stopPropagation?.();
            const groupNode=event.target.closest('[data-eco-group-list]'),key=groupNode?.dataset.ecoGroupList||event.target.closest('[data-eco-section]').dataset.ecoSection;
            let groups=editorGroups(model(),key);const id=groupNode?.dataset.ecoGroupId,modelBefore=model();
            if(action==='add-group')groups=ensureEditorGroups(key);
            if(action==='add-group'){const group={id:uid(),icon:'📂',name:tr('新分类','New category'),en:'New category'};groups.splice(groups.findIndex(group=>group.id==='')<0?groups.length:groups.findIndex(group=>group.id===''),0,group);openStates.set('group:'+key+':'+group.id,true);}
            if(action==='remove-group'){
                if(!id||!await confirmAction(tr('移除此分类？其中的规则会移至分类外，不会删除规则。','Remove this category? Its entries move outside categories and are kept.')))return;
                if(galleryPreviewLock.isLocked()||model()!==modelBefore)return;
                groups=ensureEditorGroups(key);
                const index=groups.findIndex(group=>group.id===id);if(index<0)return;
                groups.splice(index,1);model()[key].forEach(row=>{if(row.editorGroupId===id)row.editorGroupId='';});
            }
            if(action==='group-icon'){
                const sourceGroup=groups.find(group=>group.id===id);if(!sourceGroup)return;const icon=await IconPicker.choose(sourceGroup.icon||'📂');
                if(!icon||galleryPreviewLock.isLocked()||model()!==modelBefore)return;const group=ensureEditorGroups(key).find(group=>group.id===id);if(!group)return;group.icon=icon;
            }
            markPageDirty();render();return;
        }
        const m = model(), cardEl = event.target.closest('[data-eco-list]');
        const list = cardEl?.dataset.ecoList, id = cardEl?.dataset.ecoId;
        const row = list && m[list]?.find(item => item.id === id);
        if(['add-unlock-cost','remove-unlock-cost'].includes(action)&&list==='unlockGroups'){
            row.costs||=[];
            if(action==='add-unlock-cost')row.costs.push({resourceId:m.resources[0]?.id||'',amount:1});
            else {
                const index=Number(event.target.closest('[data-eco-unlock-cost]')?.dataset.ecoUnlockCost),entry=row.costs[index];
                if(!entry||!await confirmAction(tr('确定移除这项解锁消耗吗？此操作将在保存后生效。','Remove this unlock cost? The change takes effect when you save.')))return;
                if(galleryPreviewLock.isLocked()||model()!==m||!m.unlockGroups.includes(row)||row.costs[index]!==entry)return;
                row.costs.splice(index,1);
            }
            markPageDirty();render();return;
        }
        if (action === 'icon') { event.preventDefault(); event.stopPropagation?.(); return editRuleIcon(list, id); }
        if (action === 'add') { event.preventDefault?.(); add(event.target.closest('[data-eco-section]').dataset.ecoSection); }
        if (action === 'example') {
            if (!await confirmAction(tr('将向当前配置追加多组资源、兑换规则、抽卡支付及获取来源数据，现有配置会保留。确认添加通用示例吗？', 'This will append multiple resources, exchange rules, pull payments and income sources while keeping your existing configuration. Add the generic examples?'), true)) return;
            if (galleryPreviewLock.isLocked() || model() !== m) return;
            example();
        }
        if (action === 'remove') {
            if (!row) return;
            if (deletionReferences(m, list, row.id).length) { await warnReferenced(m, list, row); return; }
            if (!await confirmAction(tr(`确定删除「${label(row)}」吗？此操作将在保存后生效。`, `Delete “${label(row)}”? The change takes effect when you save.`))) return;
            if (galleryPreviewLock.isLocked() || model() !== m || !m[list].includes(row)) return;
            if (deletionReferences(m, list, row.id).length) { await warnReferenced(m, list, row); return; }
            m[list] = m[list].filter(item => item.id !== id);
        }
        let removedIndex;
        if (action === 'remove-stage' || action === 'remove-day') {
            const stages = action === 'remove-stage', key = stages ? 'stages' : 'days';
            removedIndex = Number(event.target.closest(stages ? '[data-eco-stage]' : '[data-eco-day]').dataset[stages ? 'ecoStage' : 'ecoDay']);
            const entry = row?.[key]?.[removedIndex];
            if (!entry || !await confirmAction(stages ? tr('确定删除这个兑换档位吗？后续档位将按新顺序解锁。', 'Delete this exchange stage? Remaining stages will unlock in their new order.') : tr('确定删除这个签到奖励节点吗？', 'Delete this sign-in reward milestone?'))) return;
            if (galleryPreviewLock.isLocked() || model() !== m || !m[list].includes(row) || row[key][removedIndex] !== entry) return;
        }
        if (action === 'add-stage') (row.stages ||= []).push({ cost: 1, gain: 1, toIds: [] });
        if (action === 'remove-stage') row.stages.splice(removedIndex, 1);
        if (action === 'add-day') (row.days ||= []).push({ day: Math.max(0, ...(row.days || []).map(day => day.day)) + 1, amount: 1 });
        if (action === 'remove-day') row.days.splice(removedIndex, 1);
        markPageDirty(); render();
        if (action === 'example') showToast(tr('通用示例已添加，请按需调整并保存。', 'Generic examples added. Adjust them as needed and save.'), 'success');
    }
    async function editRuleIcon(collection, id) {
        if (galleryPreviewLock.isLocked() || !defaultRuleIcon(collection)) return;
        const m = model(), row = m[collection].find(row => row.id === id);
        if (!row) return;
        const icon = await IconPicker.choose(row.icon || defaultRuleIcon(collection));
        if (galleryPreviewLock.isLocked() || model() !== m || !m[collection].includes(row)) return;
        if (icon && icon.trim() && icon.trim() !== row.icon) {
            row.icon = icon.trim();
            markPageDirty();
            render();
        }
    }
    function example() {
        const m = model();
        const [money, paid, returned, monthly, ticket, gift, ten] = Array.from({ length: 7 }, uid);
        const makeResource = (id, name, icon = '🪙') => ({ id, name, icon });
        m.resources.push(makeResource(money, tr('日常货币（示例）', 'Daily currency (example)')), makeResource(paid, tr('付费货币（示例）', 'Paid currency (example)')), makeResource(returned, tr('返还代币（示例）', 'Return token (example)')), makeResource(monthly, tr('月度代币（示例）', 'Monthly token (example)')), makeResource(ticket, tr('通用单抽票（示例）', 'Single ticket (example)'), '🎟️'), makeResource(gift, tr('活动十连券（示例）', 'Event ten-pull voucher (example)'), '🎫'));
        const exchange = (name, from, to, cost, gain, mode = 'fixed') => ({ id: uid(), name, from, ...(isStaged({mode}) ? {} : {toIds: [to]}), cost, gain, mode, limit: 5, stages: [] });
        m.resources.push(makeResource(ten, tr('通用十连券（示例）', 'Ten-pull voucher (example)'), '🎫'));
        m.exchanges.push(exchange(tr('20代币换1票', '20 tokens for 1 ticket'), returned, ticket, 20, 1), { ...exchange(tr('月度阶梯示例', 'Monthly stage example'), monthly, ticket, 1, 1, 'staged'), stages: [[10, 1, ticket], [18, 2, ticket], [40, 5, ticket], [70, 1, ten], [120, 2, ten]].map(([cost, gain, to]) => ({ cost, gain, toIds: [to] })) }, exchange(tr('付费货币转日常货币', 'Paid to daily currency'), paid, money, 1, 1), exchange(tr('每月限换5票（示例）', '5 purchases per month (example)'), returned, ticket, 10, 1, 'monthly'));
        m.payments.push(...[[money, 160, 1], [paid, 150, 1], [ticket, 1, 1], [gift, 1, 10], [ten, 1, 10]].map(([resourceId, cost, pulls]) => ({ id: uid(), name: tr('示例支付方式', 'Example payment'), resourceId, cost, pulls, poolId: '' })));
        const income = (name, resourceId, source, amount) => ({ id: uid(), name, resourceId, source, amount, schedule: 'once', condition: 'always', categoryId: '', poolId: '', tierId: '', days: [] });
        m.incomes.push({ ...income(tr('日常收入（请调整）', 'Daily income (adjust amount)'), money, 'other', 160), schedule: 'daily' }, income(tr('每抽返还示例', 'Per-pull return example'), returned, 'byproduct', 2), { ...income(tr('三天签到共5票', '5 tickets over 3 sign-ins'), ticket, 'other', 1), schedule: 'signin', days: [{ day: 1, amount: 1 }, { day: 2, amount: 2 }, { day: 3, amount: 2 }] }, income(tr('赠送一张十连券', 'Gift one ten-pull voucher'), gift, 'other', 1));
    }
    function validate() {
        const m = model(), errors = [];
        const has = (rows, id) => rows.some(row => row.id === id);
        const positive = n => Number.isSafeInteger(n) && n > 0;
        for (const key of ['resources', 'unlockGroups', 'exchanges', 'payments', 'incomes']) {
            const ids = new Set();
            for (const row of m[key]) {
                if (!row.id || ids.has(row.id) || !String(row.name || row.en || '').trim()) errors.push(tr('配置需要唯一编号和非空名称。', 'Entries require unique IDs and non-empty names.'));
                ids.add(row.id);
                if (key === 'incomes' && row.source === 'byproduct' && scopeIds(row, 'categoryIds').some(id => !has(gameInfo.categories, id))) errors.push(tr('有规则引用了已删除的图鉴大类。', 'A rule references a removed category.'));
                if (key === 'incomes' && row.source === 'byproduct') {
                    if (row.tagIds.some(id => !tagOptions().some(([tagId]) => tagId === id))) errors.push(tr('有返还规则引用了已删除的标签，请重新选择。', 'A return rule references a removed tag. Select its tags again.'));
                    if (!['any', 'all'].includes(row.tagMatch)) errors.push(tr('请选择有效的标签匹配方式。', 'Select a valid tag matching mode.'));
                }
                if (scopeIds(row, 'poolIds').some(id => !has(pools(), id))) errors.push(tr('有规则引用了已删除的卡池。', 'A rule references a removed pool.'));
                if (row.tierId && !has(gameInfo.globalTiers, row.tierId)) errors.push(tr('有返还规则引用了已删除的稀有度。', 'A return rule references a removed rarity.'));
            }
        }
        for (const row of [...m.payments, ...m.incomes]) if (!has(m.resources, row.resourceId)) errors.push(tr('请选择有效的支付或获得资源。', 'Select a valid payment or income resource.'));
        const groupById=new Map(m.unlockGroups.map(group=>[group.id,group]));
        for(const group of m.unlockGroups){
            if(!['daily','monthly','once'].includes(group.period))errors.push(tr('请选择前置条件的解锁周期。','Select a prerequisite unlock period.'));
            if((group.costs||[]).some(cost=>!has(m.resources,cost.resourceId)||!positive(cost.amount)))errors.push(tr('解锁消耗需选择有效资源并填写正整数。','Unlock costs require valid resources and positive amounts.'));
            const seen=new Set();
            for(const r of group.requirements||[]){
                const exchange=m.exchanges.find(row=>row.id===r.exchangeId);
                if(!exchange||seen.has(r.exchangeId)||exchange.unlockGroupId===group.id||(!r.all&&!positive(r.times))||r.targetId&&!exchange.toIds?.includes(r.targetId)||r.all&&!['daily','monthly','once','staged','once_staged'].includes(exchange?.mode))errors.push(tr('前置兑换无效、重复、自引用，或没有可用上限。','Invalid, duplicate, self-referencing or unlimited prerequisite purchase.'));
                seen.add(r.exchangeId);
                if(exchange){
                    const targetCount=r.targetId?1:(exchange.toIds||[]).length;
                    const max=isStaged(exchange)?exchange.stages?.length:['daily','monthly'].includes(exchange.mode)?exchange.limit*targetCount:exchange.mode==='once'?targetCount:Infinity;
                    if(!r.all&&r.times>max)errors.push(tr('前置完成次数超过该兑换可达到的上限。','Required purchases exceed the available limit.'));
                    if(group.period==='daily'&&['once','once_staged','monthly','staged'].includes(exchange.mode))errors.push(tr('每日前置条件需使用每日限购或可重复的兑换。','Daily prerequisites require daily or repeatable exchanges.'));
                    if(group.period==='monthly'&&['once','once_staged'].includes(exchange.mode))errors.push(tr('每月组不能要求重新完成一次性兑换，请改用永久组或可重复的兑换。','Monthly groups cannot require a one-time purchase each month. Use a permanent group or repeatable exchange.'));
                }
            }
        }
        const visiting=new Set(),done=new Set();
        function visit(id){
            if(visiting.has(id)){errors.push(tr('前置条件存在循环引用。','Prerequisites contain a cycle.'));return;}
            if(done.has(id))return;visiting.add(id);
            for(const r of groupById.get(id)?.requirements||[]){const dependency=m.exchanges.find(row=>row.id===r.exchangeId)?.unlockGroupId;if(groupById.has(dependency))visit(dependency);}
            visiting.delete(id);done.add(id);
        }
        m.unlockGroups.forEach(group=>visit(group.id));
        for (const row of m.exchanges) {
            if(row.unlockGroupId&&!groupById.has(row.unlockGroupId))errors.push(tr('兑换引用了已删除的前置条件。','Exchange references a removed prerequisite.'));
            if (!['fixed', 'once', 'once_staged', 'daily', 'monthly', 'staged'].includes(row.mode)) errors.push(tr('请选择有效的兑换方式。', 'Select a valid exchange mode.'));
            if (!has(m.resources, row.from) || (!isStaged(row) && (!row.toIds?.length || row.toIds.some(id => !has(m.resources, id) || id === row.from)))) errors.push(tr('请选择不同于支付资源的有效目标资源。', 'Select valid target resources different from the payment resource.'));
            const stages = isStaged(row) ? row.stages : [row];
            if (!stages?.length || stages.some(stage => !positive(stage.cost) || !positive(stage.gain))) errors.push(tr('兑换各档的支付与获得数量必须为正整数。', 'Exchange costs and gains must be positive integers.'));
            if (stages?.some(stage => !targetIds(stage).length || targetIds(stage).some(id => !has(m.resources, id) || id === row.from))) errors.push(tr('阶梯目标必须是有效且不同于支付资源的资源。', 'Stage targets must be valid and different from the payment resource.'));
            if (['daily','monthly'].includes(row.mode) && !positive(row.limit)) errors.push(tr('限购次数必须为正整数。', 'Purchase limits must be positive integers.'));
        }
        for (const row of m.payments) {
            if (!positive(row.cost) || !positive(row.pulls)) errors.push(tr('支付数量和抽数必须为正整数。', 'Resource cost and pulls must be positive integers.'));
        }
        for (const row of m.incomes) {
            if (row.source === 'byproduct' && row.condition === 'cap_split' && !positive(row.overflowAmount)) errors.push(tr('溢出获得数量必须为正整数。', 'Overflow amounts must be positive integers.'));
            if (row.source !== 'byproduct' && row.schedule === 'signin') {
                const days = row.days || [];
                if (!days.length || days.some(day => !positive(day.day) || !positive(day.amount)) || new Set(days.map(day => day.day)).size !== days.length) errors.push(tr('签到节点需填写不重复的正整数天数及奖励数量。', 'Sign-in milestones need unique positive days and positive amounts.'));
            } else if (!positive(row.amount)) errors.push(tr('每次获得数量必须为正整数。', 'Income amounts must be positive integers.'));
        }
        for (const cat of gameInfo.categories) if (!positive(gameInfo.overflowRules?.[cat.id] ?? gameInfo.overflowRules?.other ?? 5)) errors.push(tr('满阶上限必须为正整数。', 'Copy caps must be positive integers.'));
        return [...new Set(errors)];
    }
    function validateForSave() {
        // 未触发 change 的非法输入同样阻止保存；保留编辑内容供用户修正。
        const root = document.getElementById('gallery-economy');
        for (const control of root?.querySelectorAll('input') || []) if (!control.checkValidity()) {
            for (let parent = control.parentElement; parent; parent = parent.parentElement) if (parent.tagName === 'DETAILS') parent.open = true;
            control.reportValidity(); return false;
        }
        const errors = validate();
        const box = document.getElementById('economy-validation');
        if (box) box.textContent = errors.join(' ');
        if (errors.length) { showToast(errors[0], 'danger'); box?.scrollIntoView({ block: 'center' }); }
        return errors.length === 0;
    }
    window.GalleryEconomy = Object.freeze({ render, validate, validateForSave, refreshExampleVisibility });
    window.addEventListener?.('focus',refreshExampleVisibility);
    window.addEventListener?.('storage',event=>{const key=window.VersionStorage?window.VersionStorage.eventKey(event.key):event.key;if(key===null||key==='GM_Show_Currency_Examples')refreshExampleVisibility();});
    document.addEventListener?.('click', event => {
        document.querySelectorAll('#gallery-economy .eco-multi[open]').forEach(group => {
            if (!group.contains(event.target)) group.open = false;
        });
    });
    document.addEventListener?.('keydown', event => {
        if (event.key !== 'Escape') return;
        document.querySelectorAll('#gallery-economy .eco-multi[open]').forEach(group => {
            group.open = false;
            group.querySelector('summary').focus();
        });
    });
})();
