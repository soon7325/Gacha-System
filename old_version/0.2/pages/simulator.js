/**
 * 模拟器：候选勾选、抽卡按钮、结果与概率展示、自选奖励和换期界面。
 * 由 simulator.html 底部加载，保持原先的依赖和执行顺序。
 * 使用普通 script，全局函数仍可供 HTML 内联 onclick 调用。
 */
// 统一管理提示的显示和关闭，连续提示不会被旧计时器提前隐藏。
        window.showToast = Toast.create().show;

        // 与设置页共用提示/确认逻辑；抽卡清空和换期操作仍由本页处理。
        const simulatorDialog = Dialog.create();
        window.customAlert = simulatorDialog.alert;
        window.customConfirm = simulatorDialog.confirm;

// 记录连续撞墙/触底次数
const simRenderedPulls = new Map();
let goldBoundarySpamCount = 0;
let spamResetTimer = null;

function triggerBoundaryToast(msg) {
    goldBoundarySpamCount++;
    if (spamResetTimer) clearTimeout(spamResetTimer);
    spamResetTimer = setTimeout(() => { goldBoundarySpamCount = 0; }, 3000);

    if (goldBoundarySpamCount >= 10) {
        const bottomSpamMsg = window.getTrans ? window.getTrans('sim_toast_spam_bottom') : "别按啦！真的已经到底了 (つД`)";
        showToast(bottomSpamMsg, "danger");
    } else {
        showToast(msg, "cancel");
    }
}

// 统一的激活与高亮锚点方法
function focusGoldRow(targetRow, shouldScroll = false) {
    const goldRows = getGoldRowsList();
    const foundIdx = goldRows.indexOf(targetRow);
    if (foundIdx === -1) return;

    currentGoldFocusIndex = foundIdx;

    if (shouldScroll) {
        targetRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    document.querySelectorAll('.sim-pull-row.highlight-gold-target').forEach(r => {
        r.classList.remove('highlight-gold-target');
    });

    void targetRow.offsetWidth;
    targetRow.classList.add('highlight-gold-target');

    setTimeout(() => {
        targetRow.classList.remove('highlight-gold-target');
    }, 2500);
}

// 获取页面上当前所有包含金的行
function getGoldRowsList() {
    return Array.from(document.querySelectorAll('#sim-results .sim-pull-row')).filter(row => 
        Array.from(row.querySelectorAll('.sim-item')).some(item => {
            const pullNumSpan = item.querySelector('.pull-num');
            return pullNumSpan && window.getComputedStyle(pullNumSpan).display === 'block';
        })
    );
}

        const urlParams = new URLSearchParams(window.location.search);
        let currentPool = urlParams.get('pool') || 'char_up';
        let currentGameId = urlParams.get('gameId'); 

        if (!currentGameId) { 
            (async () => {
                await customAlert(window.getTrans ? window.getTrans('invalid_game_channel') : 'Invalid Game ID');
                window.location.href = 'index.html'; 
            })();
        }
        document.getElementById('btn-return-dashboard').onclick = () => { window.location.href = `dashboard.html?gameId=${currentGameId}&pool=${currentPool}`; };

        // 一次读取模拟器需要的公共数据，抽卡状态和页面渲染仍由本页管理。
        const gameContext = GameData.loadContext({ gameId: currentGameId, poolId: currentPool });
        let roster = gameContext.roster;
        let pureCatalog = gameContext.catalog;
        const simulatorLang = localStorage.getItem('GM_Lang') || 'zh';

        // 官方数据只读取一次，供旧缓存缺少英文名称或评级时补查。
        const presetFormatData = GameData.getPreset(currentGameId);
        const {
            getItemName, getItemShort,
            getTierName: getLocalizedTierName,
            getLabelName: getLocalizedTagName
        } = ItemFormat.create({
            getCatalog: () => pureCatalog,
            findItem: name => CatalogUtils.findItem(presetFormatData?.db || [], name),
            getTiers: () => globalTiers,
            getFallbackTiers: () => presetFormatData?.tiers || [],
            missingTier: '',
            fallbackTierId: false,
            genericTierNames: true
        });
        
        // 图鉴字段补齐、分类打平与去重由公共数据层统一处理。
        let gameInfo = gameContext.gameInfo;
        let allCatalogItems = GameData.flattenCatalog(pureCatalog);
        let rules = gameContext.rules;
        let globalTiers = gameContext.globalTiers;

        let activeTiers = [];
        let targetGoldIds = [];
        let minorPities = rules.pities ? rules.pities.filter(p => !p.isGold && p.tierId !== (rules.tiers?.find(t => t.isGold)?.id)) : (rules.minorPities || []);

        if (rules.tiers && Array.isArray(rules.tiers)) {
            activeTiers = rules.tiers.map(t => {
                let gt = globalTiers.find(g => g.id === t.id) || { name: '?', color: '#fff' };
                return { 
                    id: t.id, 
                    prob: t.prob, 
                    name: gt.name, 
                    en: gt.en || '',
                    color: gt.color,
                    isGold: !!t.isGold,
                    subProbs: t.subProbs || null
                };
            });
            targetGoldIds = activeTiers.filter(t => t.isGold === true).map(t => t.id);
        }

        if (targetGoldIds.length === 0 && globalTiers.length > 0) {
            targetGoldIds = [globalTiers[0].id];
        }

        // 初始状态与重置共用同一工厂，避免遗漏新增计数器。
        let simData = GachaEngine.createState(minorPities.length);

        function getItemsByCats(cats = []) {
            // 保留页面原接口；分类收集统一处理，空选择仍返回空列表。
            return CatalogUtils.getItemsByCategories(pureCatalog, cats || []);
        }

        function togglePoolConfigTopDrawer() {
           const body = document.getElementById('pool-config-top-body');
            const arrow = document.getElementById('top-drawer-arrow');
            const isHidden = body.style.display === 'none';
            body.style.display = isHidden ? 'flex' : 'none';
    
            // 使用多语言字典获取文本
            const expandText = window.getTrans ? window.getTrans('expand') : '▼ 展开';
            const collapseText = window.getTrans ? window.getTrans('collapse') : '▲ 收起';
            arrow.innerText = isHidden ? collapseText : expandText;
        }

        function renderTopConfigDrawer() {
            const container = document.getElementById('dynamic-tier-config-container');
            if (!container) return;

            const uniqueFilter = CatalogUtils.uniqueBy; // 同名候选只显示第一个，顺序不变。
            const assemblyRules = rules.assembly?.tierRules || {};
            const preSelectTiers = rules.preSelect?.tiers || {};
            let html = '';

            const configTiers = globalTiers.filter((tier, idx) => {
                const isTierEnabledInPool = rules.tiers && Array.isArray(rules.tiers)
                    ? rules.tiers.some(t => t.id === tier.id)
                    : true;
                if (!isTierEnabledInPool) return false;

                // 始终创建候选控件，纯色模式仅隐藏低星，保留选择供实时切换。
                return true;
            });

            configTiers.forEach((tier, idx) => {
                const tierId = tier.id;
                const tierDisplayName = getLocalizedTierName(tier);
                const isGoldTier = targetGoldIds.includes(tierId) || idx === 0;
                const tierColor = tier.color || (isGoldTier ? '#f1c40f' : '#9b59b6');
                const tRule = assemblyRules[tierId] || {
                    mode: isGoldTier ? 'up_split' : 'up_split',
                    upCats: ['char'],
                    offrateCats: ['char', 'wep'],
                    flatCats: ['char', 'wep'],
                    upTags: ['up', 'custom_offrate'],
                    offrateTags: ['std', 'normal'],
                    tags: ['normal']
                };

                const pre = preSelectTiers[tierId] || {};
                const upMin = pre.upMin ?? (isGoldTier ? 1 : 2);
                const upMax = pre.upMax ?? (isGoldTier ? 1 : 2);
                const isSingleUp = (upMin === 1 && upMax === 1);
                const rangeStr = (upMin === upMax) ? `${upMin}` : `${upMin}~${upMax}`;

                // 🌟 使用字典翻译标题
                let tierTitle = '';
                if (isGoldTier) {
                    tierTitle = (window.getTrans('sim_tier_gold_title') || '')
                        .replace('{tier}', tierDisplayName)
                        .replace('{range}', rangeStr);
                } else if (tRule.mode === 'up_split') {
                    tierTitle = (window.getTrans('sim_tier_sub_title') || '')
                        .replace('{tier}', tierDisplayName)
                        .replace('{range}', rangeStr);
                } else {
                    tierTitle = (window.getTrans('sim_tier_flat_title') || '')
                        .replace('{tier}', tierDisplayName);
                }

                let candidateUpItems = [];
                let candidateOffrateItems = [];
                let candidateSpecItems = [];

                if (tRule.mode === 'up_split') {
                    candidateUpItems = getItemsByCats(tRule.upCats || ['char']).filter(item => 
                        item.tierId === tierId && CatalogUtils.hasAnyTag(item, tRule.upTags)
                    );
                    candidateOffrateItems = getItemsByCats(tRule.offrateCats || ['char', 'wep']).filter(item => 
                        item.tierId === tierId && CatalogUtils.hasAnyTag(item, tRule.offrateTags)
                    );
                } else {
                    candidateOffrateItems = getItemsByCats(tRule.flatCats || ['char', 'wep']).filter(item => 
                        item.tierId === tierId && CatalogUtils.hasAnyTag(item, tRule.tags)
                    );
                }

                const isSpecEnabled = rules.specRate && rules.specRate.enabled;
                if (isGoldTier && isSpecEnabled) {
                    const specTargetCats = rules.specRate.targetCats || rules.specRate.rules?.[0]?.targetCats || ['char'];
                    const specTargetTags = rules.specRate.targetTags || rules.specRate.rules?.[0]?.targetTags || ['custom_offrate', 'up'];
                    candidateSpecItems = getItemsByCats(specTargetCats).filter(item => 
                        item.tierId === tierId && CatalogUtils.hasAnyTag(item, specTargetTags)
                    );
                }

                candidateUpItems = uniqueFilter(candidateUpItems);
                candidateOffrateItems = uniqueFilter(candidateOffrateItems);
                candidateSpecItems = uniqueFilter(candidateSpecItems);

                const modeStr = isSingleUp ? window.getTrans('sim_mode_single') : window.getTrans('sim_mode_multi');
                const subUpHeader = (window.getTrans('sim_sub_up_title') || '').replace('{mode}', modeStr);
                const subStdHeader = (window.getTrans('sim_sub_std_title') || '').replace('{tier}', tierDisplayName);
                const subSpecHeader = window.getTrans('sim_sub_spec_title');

                html += `
                <div class="config-tier-block" data-low-tier="${!isGoldTier}" style="border-left: 4px solid ${tierColor};">
                    <div style="font-size: 13px; font-weight: bold; color: ${tierColor}; margin-bottom: 8px;">${tierTitle}</div>
    
                    <!-- 1. UP 目标 -->
                    ${candidateUpItems.length > 0 ? `
                        <div class="config-sub-section">
                            <div class="config-sub-title">
                                <span>${subUpHeader}</span>
                                <span id="count-up-${tierId}" style="color:${tierColor}; font-weight:normal;"></span>
                            </div>
                            <div id="grid-up-${tierId}" class="custom-scroll-wrap"></div>
                        </div>` : ''}
        
                    <!-- 2. 可歪 / 平分列表 -->
                    ${candidateOffrateItems.length > 0 ? `
                        <div class="config-sub-section">
                            <div class="config-sub-title">
                                <span>${subStdHeader}</span>
                                <span id="count-std-${tierId}" style="color:#3498db; font-weight:normal;"></span>
                            </div>
                            <div id="grid-std-${tierId}" class="custom-scroll-wrap"></div>
                        </div>` : ''}

                    <!-- 3. 特限出货干预 -->
                    ${(isGoldTier && isSpecEnabled && candidateSpecItems.length > 0) ? `
                        <div class="config-sub-section" style="background: rgba(231, 76, 60, 0.05); padding: 8px; border-radius: 6px; border: 1px dashed rgba(231, 76, 60, 0.3); margin-top: 10px;">
                            <div class="config-sub-title">
                                <span style="color:#e74c3c;">${subSpecHeader}</span>
                                <span id="count-spec-${tierId}" style="color:#e74c3c; font-weight:normal;"></span>
                            </div>
                            <div id="grid-spec-${tierId}" class="custom-scroll-wrap" style="border-color: rgba(231, 76, 60, 0.25);"></div>
                        </div>` : ''}
                </div>`;
            });

            container.innerHTML = html;

            configTiers.forEach((tier, idx) => {
                const tierId = tier.id;
                const isGoldTier = targetGoldIds.includes(tierId) || idx === 0;
                const tRule = assemblyRules[tierId] || {};
                const pre = preSelectTiers[tierId] || {};
                
                const upMin = pre.upMin ?? (isGoldTier ? 1 : 2);
                const upMax = pre.upMax ?? (isGoldTier ? 1 : 2);
                const stdMin = pre.stdMin ?? 0;
                const stdMax = pre.stdMax ?? 999;
                const specMin = pre.specMin ?? rules.preSelect?.spec?.min ?? 0;
                const specMax = pre.specMax ?? rules.preSelect?.spec?.max ?? 2;

                const upWrap = document.getElementById(`grid-up-${tierId}`);
                const specWrap = document.getElementById(`grid-spec-${tierId}`);
                const stdWrap = document.getElementById(`grid-std-${tierId}`);

                if (upWrap) {
                    let items = getItemsByCats(tRule.upCats || ['char']).filter(item => item.tierId === tierId && CatalogUtils.hasAnyTag(item, tRule.upTags));
                    renderSelectCards(upWrap, uniqueFilter(items), `sim-up-cb-${tierId}`, true, upMin, upMax, tier.color);
                }
                if (specWrap) {
                    const specTargetCats = rules.specRate?.targetCats || rules.specRate?.rules?.[0]?.targetCats || ['char'];
                    const specTargetTags = rules.specRate?.targetTags || rules.specRate?.rules?.[0]?.targetTags || ['custom_offrate', 'up'];
                    let items = getItemsByCats(specTargetCats).filter(item => item.tierId === tierId && CatalogUtils.hasAnyTag(item, specTargetTags));
                    renderSelectCards(specWrap, uniqueFilter(items), `sim-spec-cb-${tierId}`, false, specMin, specMax, '#e74c3c', true);
                }
                if (stdWrap) {
                    let items = getItemsByCats(tRule.offrateCats || tRule.flatCats || ['char', 'wep']).filter(item => item.tierId === tierId && CatalogUtils.hasAnyTag(item, tRule.offrateTags || tRule.tags));
                    renderSelectCards(stdWrap, uniqueFilter(items), `sim-std-cb-${tierId}`, false, stdMin, stdMax, tier.color);
                }
            });

            configTiers.forEach(tier => {
                syncTierCardsLinkage(tier.id);
            });

            updateHeaderSummary();
            document.documentElement.setAttribute('data-sim-low-mode', localStorage.getItem('GM_Sim_Hide_Low') || 'show');
        }

        function renderSelectCards(wrap, items, inputClass, isUp, minLimit, maxLimit, tierColor, isSpec = false) {
            let html = `<div class="sim-grid-new">`;
            items.forEach((item, idx) => {
                let isChecked = isSpec ? (maxLimit > 0 && idx < Math.min(maxLimit, 2)) : (maxLimit !== undefined && maxLimit !== null && maxLimit < 999 ? idx < maxLimit : true);
                let displayName = getItemName(item);
                let displayShort = getItemShort(item);
                let imgUrl = item.img || "";

                let imgContent = imgUrl 
                    ? `<img src="${imgUrl}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"> <div class="char-select-fallback" style="display:none;">${displayShort}</div>`
                    : `<div class="char-select-fallback">${displayShort}</div>`;

                html += `
                    <div class="char-select-card ${isChecked ? 'selected' : ''}" style="--tier-color: ${tierColor};" onclick="toggleTopConfigCard(this, '${inputClass}', ${isUp}, ${maxLimit})">
                        <input type="checkbox" value="${item.name}" class="${inputClass}" ${isChecked ? 'checked' : ''} style="display:none;">
                        <div class="check-mark"><div class="check-icon">✓</div></div>
                        <div class="char-select-img-wrap">${imgContent}</div>
                        <div class="char-select-name" title="${displayName}">${displayName}</div>
                    </div>`;
            });
            html += `</div>`;
            wrap.innerHTML = html;
        }

        window.toggleTopConfigCard = function(cardDiv, inputClass, isUp, maxLimit) {
    const cb = cardDiv.querySelector('input[type="checkbox"]');
    
    if (maxLimit === 1 && !cb.checked) {
        const siblingCards = cardDiv.closest('.custom-scroll-wrap').querySelectorAll('.char-select-card');
        siblingCards.forEach(c => {
            c.classList.remove('selected');
            const otherCb = c.querySelector('input[type="checkbox"]');
            if (otherCb) otherCb.checked = false;
        });
    } else if (maxLimit > 1 && !cb.checked) {
        const checkedCount = cardDiv.closest('.custom-scroll-wrap').querySelectorAll('input[type="checkbox"]:checked').length;
        if (checkedCount >= maxLimit) {
            customAlert(`最多只能选择 ${maxLimit} 个目标！`);
            return;
        }
    }

    cb.checked = !cb.checked;
    if (cb.checked) cardDiv.classList.add('selected'); else cardDiv.classList.remove('selected');

    // 🌟 核心修复：无论是 UP、特限还是常驻变动，统一调用包含 5★ 互斥与特限绑定的联动函数
    const tierMatch = inputClass.match(/sim-(up|std|spec)-cb-(.+)/);
    if (tierMatch) {
        const tierId = tierMatch[2];
        syncTierCardsLinkage(tierId);
    } else {
        updateHeaderSummary();
    }
};

        function updateHeaderSummary() {
            const goldTierId = targetGoldIds[0] || globalTiers[0]?.id;
            const minorTierId = globalTiers[1]?.id;
            const goldTierObj = globalTiers.find(t => t.id === goldTierId) || { name: '6', en: '6-Star' };
            const minorTierObj = globalTiers.find(t => t.id === minorTierId) || { name: '5', en: '5-Star' };

            const selectedGoldUps = Array.from(document.querySelectorAll(`.sim-up-cb-${goldTierId}:checked`)).map(cb => {
                let it = findInRoster(cb.value);
                return getItemName(it);
            });
            const selectedMinorUps = minorTierId ? Array.from(document.querySelectorAll(`.sim-up-cb-${minorTierId}:checked`)).map(cb => {
                let it = findInRoster(cb.value);
                return getItemName(it);
            }) : [];

            let goldPrefix = getLocalizedTierName(goldTierObj);
            let minorPrefix = getLocalizedTierName(minorTierObj);

            let goldStr = selectedGoldUps.length > 0 
                ? `${goldPrefix} [${selectedGoldUps.join(' / ')}]` 
                : (window.getTrans('sim_gold_not_selected') || '').replace('{tier}', goldPrefix);
            let minorStr = selectedMinorUps.length > 0 
                ? `${minorPrefix} [${selectedMinorUps.join(' / ')}]` 
                : (window.getTrans('sim_gold_not_selected') || '').replace('{tier}', minorPrefix);

            const summaryEl = document.getElementById('top-selected-summary');
            if (summaryEl) {
                const summaryKey = localStorage.getItem('GM_Sim_Hide_Low') === 'color_only' ? 'sim_top_summary_gold_only' : 'sim_top_summary_prefix';
                summaryEl.innerText = (window.getTrans(summaryKey) || '')
                    .replace('{gold}', goldStr)
                    .replace('{minor}', minorStr);
            }
        }

        async function validatePreSelect() {
            const isColorOnly = localStorage.getItem('GM_Sim_Hide_Low') === 'color_only';
            const preSelectTiers = rules.preSelect?.tiers || {};

            for (let t of globalTiers) {
                const isTierEnabledInPool = rules.tiers && Array.isArray(rules.tiers)
                    ? rules.tiers.some(rt => rt.id === t.id)
                    : true;
                if (!isTierEnabledInPool) continue;

                const isGoldTier = targetGoldIds.includes(t.id);
                if (isColorOnly && !isGoldTier) continue;

                const pre = preSelectTiers[t.id] || {};
                const upMin = pre.upMin ?? (isGoldTier ? 1 : 0);
                const upMax = pre.upMax ?? 999;
                const stdMin = pre.stdMin ?? 0;
                const stdMax = pre.stdMax ?? 999;
                const rangeStr = (upMin === upMax) ? `${upMin}` : `${upMin}~${upMax}`;
                const tierDisplayName = getLocalizedTierName(t);

                const upChecked = document.querySelectorAll(`.sim-up-cb-${t.id}:checked`).length;
                if (upChecked < upMin || upChecked > upMax) {
                    await customAlert((window.getTrans('sim_alert_up_req') || '')
                        .replace('{tier}', tierDisplayName).replace('{range}', rangeStr).replace('{cur}', upChecked));
                    return false;
                }
                const stdChecked = document.querySelectorAll(`.sim-std-cb-${t.id}:checked`).length;
                if (stdChecked < stdMin || stdChecked > stdMax) {
                    const stdRangeStr = (stdMin === stdMax) ? `${stdMin}` : `${stdMin}~${stdMax}`;
                    await customAlert((window.getTrans('sim_alert_std_req') || '')
                        .replace('{tier}', tierDisplayName).replace('{range}', stdRangeStr).replace('{cur}', stdChecked));
                    return false;
                }
            }
            return true;
        }

        function updateRotationButtonUI() {
            const btn = document.getElementById('btn-rotation-or-clear');
            if (!btn) return;
            const allowRotation = rules.lifecycle?.allowRotation !== false && !currentPool.includes('std');

            if (allowRotation) {
                btn.innerText = window.getTrans('sim_btn_start_new_rotation');
                btn.className = "btn btn-blue btn-rule-action";
                btn.style.borderColor = "#1abc9c";
                btn.style.color = "#1abc9c";
            } else {
                btn.innerText = window.getTrans('clear_history');
                btn.className = "btn btn-action-gray";
                btn.style.borderColor = "";
                btn.style.color = "";
            }
        }

        function findInRoster(name) {
            return CatalogUtils.findItem(allCatalogItems, name, { fields: ['name', 'short'] });
        }

        function getImageUrl(shortName) {
            let charObj = typeof HSR_CHAR_DB !== 'undefined' ? CatalogUtils.findItem(HSR_CHAR_DB, shortName, { fields: ['name', 'short'] }) : null;
            if (charObj && typeof SYS_CONFIG !== 'undefined') return SYS_CONFIG.imgFolder + "hsr_char/" + charObj.eshort + SYS_CONFIG.imgExt; 
            let wepObj = typeof HSR_WEAPON_DB !== 'undefined' ? CatalogUtils.findItem(HSR_WEAPON_DB, shortName, { fields: ['name', 'short'] }) : null;
            if (wepObj && typeof SYS_CONFIG !== 'undefined') return SYS_CONFIG.imgFolder + "hsr_weapon/" + wepObj.eshort + SYS_CONFIG.imgExt;
            if (typeof SYS_CONFIG !== 'undefined') return SYS_CONFIG.imgFolder + shortName + SYS_CONFIG.imgExt;
            return "";
        }

        // 将当前勾选的候选物品转为纯数据，供抽卡引擎使用。
        function getEngineSelections() {
            const selections = {};
            activeTiers.forEach(tier => {
                const selected = kind => Array.from(document.querySelectorAll(
                    `.sim-${kind}-cb-${tier.id}:checked`
                )).map(cb => cb.value);
                selections[tier.id] = { up: selected('up'), std: selected('std'), spec: selected('spec') };
            });
            return selections;
        }

        async function doSimPulls(amount) {
            if (!(await validatePreSelect())) return;
            // 页面负责读取选项与显示自选窗口，引擎负责推进抽卡、保底和井进度。
            const engine = GachaEngine.create({
                rules, activeTiers, targetGoldIds, minorPities,
                selections: getEngineSelections(),
                allCatalogItems, pureCatalog, globalTiers,
                selectSpark: (candidates, rule) => promptSparkSelection(candidates, rule.limit)
            });
            const pullHistory = await engine.draw(simData, amount);
            
            let currentChunk = []; let chunks = [];
            for (let i = 0; i < pullHistory.length; i++) {
                if (currentChunk.length > 0 && currentChunk[0].pullType !== pullHistory[i].pullType) { chunks.push(currentChunk); currentChunk = []; }
                currentChunk.push(pullHistory[i]);
                if (currentChunk.length === 10) { chunks.push(currentChunk); currentChunk = []; }
            }
            if (currentChunk.length > 0) chunks.push(currentChunk);
            // 只有点击单抽才允许追加旧框；十连/百连/自定义多抽的每段都另开框。
            // 同一次多抽遇到赠送时仍按 paid/free 类型拆分，不吞并之前的单抽结果。
            chunks.forEach(chunk => { renderSimPulls(chunk, chunk[0].pullType, amount === 1); });
            simData.events.pendingGifts.forEach(gift => renderExtraGift(gift)); 
            simData.events.pendingGifts = [];
            updateSimStats();
        }

        function renderExtraGift(gift) {
            const targetItem = document.querySelector(`.sim-item[data-total="${gift.atTotal}"]`);
            if (!targetItem) return;
            const targetRow = targetItem.closest('.sim-pull-row');
            if (!targetRow) return;

            const slot = targetRow.querySelector('.sim-row-right-area .spark-slot-holder');
            if (!slot) return;

            const info = findInRoster(gift.name);
            let imgHtml = (info && info.img) 
                ? `<img src="${info.img}" style="width:100%; height:100%; object-fit:cover; position:absolute; top:0; left:0; border-radius:4px; opacity:0.9; z-index:1;">` 
                : '';

            slot.innerHTML = `
                <div class="spark-gift-card" title="井兑换产物: ${info ? getItemName(info) : gift.name}">
                    <div style="position:absolute; top:0; left:0; width:100%; background:#f1c40f; color:#000; font-size:10px; font-weight:bold; text-align:center; z-index:5; line-height:1.2; border-radius:4px 4px 0 0;">${window.getTrans('sim_spark_badge')}</div>
                    ${imgHtml}
                    <div style="position:absolute; bottom:0; left:0; width:100%; height:60%; background:linear-gradient(to top, rgba(0,0,0,0.9), transparent); z-index:2; border-radius:0 0 4px 4px;"></div>
                    <div style="position:relative; z-index:3; color:#fff; text-align:center; font-size:10px; font-weight:bold; padding-bottom:3px; text-shadow:1px 1px 2px #000; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; width:100%;">${info ? getItemShort(info) : gift.name}</div>
                </div>
            `;
        }

        // 连续单抽合并到同一行后，按卡片实际抽数更新范围标签。
        // 不改引擎状态；避免追加分支报错中断后续统计/软保底概率刷新。
        function updateRowRangeLabel(row) {
            const items = row.querySelectorAll('.sim-items-wrap .sim-item');
            const label = row.querySelector('.range-label');
            if (!items.length || !label) return;
            label.textContent = row.dataset.pullType === 'free_nopity'
                ? window.getTrans('sim_pull_free_label')
                : (window.getTrans('sim_pull_range_label') || '')
                    .replace('{start}', items[0].dataset.total)
                    .replace('{end}', items[items.length - 1].dataset.total);
        }

        function renderSimPulls(batch, pullType, allowAppend = true) {
            batch.forEach(pull => simRenderedPulls.set(String(pull.total), { ...pull }));
            const resultsWrap = document.getElementById('sim-results');
            // 单抽的付费、计入保底免费、不计保底免费分别合并，同类型最多十个。
            // 不能仅允许 paid 单抽，否则免费期间每次单抽都会新开一框。
            if (allowAppend && batch.length > 0) {
                let lastRow = resultsWrap.firstElementChild;
                let itemsWrap = lastRow ? lastRow.querySelector('.sim-items-wrap') : null;
                if (lastRow && lastRow.dataset.pullType === pullType && itemsWrap && itemsWrap.querySelectorAll('.sim-item').length < 10) {
                    const remaining = 10 - itemsWrap.querySelectorAll('.sim-item').length;
                    const appended = batch.slice(0, remaining);
                    itemsWrap.insertAdjacentHTML('beforeend', appended.map(p => buildSingleItemHtml(p)).join(''));
                    updateRowRangeLabel(lastRow); 
                    // 一次十连跨过旧框容量时，余下结果新开框，但不混合不同抽取类型。
                    if (batch.length > appended.length) renderSimPulls(batch.slice(appended.length), pullType, false);
                    return;
                }
            }

            const row = document.createElement('div');
            row.className = 'sim-pull-row';
            if (batch.length < 10) row.classList.add('single-row');
            row.dataset.pullType = pullType; 

            row.addEventListener('click', (e) => {
                const hasGold = Array.from(row.querySelectorAll('.sim-item')).some(item => {
                    const pullNumSpan = item.querySelector('.pull-num');
                    return pullNumSpan && window.getComputedStyle(pullNumSpan).display === 'block';
                });
                if (hasGold) {
                    focusGoldRow(row);
                }
            }); 
    
            let itemsHtml = `<div class="sim-items-wrap">${batch.map(p => buildSingleItemHtml(p)).join('')}</div>`;
            let slotHtml = `<div class="spark-slot-holder">`;
            if (pullType === 'free_pity') {
                slotHtml += `
                    <div class="spark-gift-card" style="border-color: #2ecc71;">
                        <div style="position:absolute; top:0; left:0; width:100%; background:#2ecc71; color:#000; font-size:10px; font-weight:bold; text-align:center; z-index:5; line-height:1.2;">${window.getTrans('sim_free_count_badge')}</div>
                        <div style="position:absolute; bottom:2px; left:0; width:100%; text-align:center; color:#fff; font-size:10px;">${window.getTrans('sim_free_pull_badge')}</div>
                    </div>`;
            }
            slotHtml += `</div>`;

            let startNum = batch[0].total; 
            let endNum = batch[batch.length - 1].total;
            let labelText = (pullType === 'free_nopity')
                ? window.getTrans('sim_pull_free_label')
                : (window.getTrans('sim_pull_range_label') || '').replace('{start}', startNum).replace('{end}', endNum);

            let labelHtml = (pullType === 'free_nopity')
                ? `<div class="range-label" style="color: #2ecc71; font-weight: bold;">${labelText}</div>`
                : `<div class="range-label">${labelText}</div>`;

            row.innerHTML = itemsHtml + `<div class="sim-row-right-area">${slotHtml}${labelHtml}</div>`;
            resultsWrap.prepend(row);
        }

        function getSubProbConditionLabel(tierObj, subGroup, index) {
            const isEn = (localStorage.getItem('GM_Lang') || 'zh') === 'en';
            // 🌟 1. 星级前缀强制使用多语言方法获取（显示 A-Rank 而非 A级）
            const tierDisplayName = getLocalizedTierName(tierObj);
            
            if (!subGroup.conditions || subGroup.conditions.length === 0) {
                const subItemWord = isEn ? `Sub-item #${index + 1}` : `细分项 #${index + 1}`;
                return `└ ${tierDisplayName} ${subItemWord}`;
            }

            // 🌟 2. 优先从官方预设变量 (如 ZZZ_SETUP_RULES) 读取最新的 categories 和 tagDefinitions
            const freshSetup = GameData.getPresetSetup(currentGameId) || {};
            const savedInfo = JSON.parse(localStorage.getItem('GM_Info_' + currentGameId)) || {};

            const categories = freshSetup.categories || savedInfo.categories || (gameInfo && gameInfo.categories) || [
                { id: 'char', name: '代理人', en: 'Agent' },
                { id: 'wep',  name: '音擎',   en: 'W-Engine' },
                { id: 'pet',  name: '邦布',   en: 'Bangboo' }
            ];

            const tagDefs = Object.assign(
                {},
                {
                    up:             { name: "限定",     en: "Limited" },
                    reup:           { name: "不歪",     en: "Guaranteed" },
                    custom_offrate: { name: "定制调频", en: "Customized" },
                    std:            { name: "常驻",     en: "Standard" },
                    gift:           { name: "赠送",     en: "Gift/Free" },
                    normal:         { name: "副产物",   en: "Regular" }
                },
                savedInfo.tagDefinitions || {},
                freshSetup.tagDefinitions || {}
            );

            // 🌟 3. 通用内置英文名称回退字典（双重保险，彻底杜绝漏网中文）
            const fallbackCatEn = {
                char: 'Agent',
                wep: 'W-Engine',
                weapon: 'Weapon',
                pet: 'Bangboo',
                bangboo: 'Bangboo'
            };
            const fallbackTagEn = {
                normal: 'Regular',
                std: 'Standard',
                up: 'Limited',
                custom_offrate: 'Customized',
                gift: 'Gift',
                reup: 'Guaranteed'
            };

            let labels = subGroup.conditions.map(cond => {
                let catObj = categories.find(c => c.id === cond.cat);
                let catName = cond.cat;
                if (isEn) {
                    catName = (catObj && catObj.en) ? catObj.en : (fallbackCatEn[cond.cat] || (catObj ? catObj.name : cond.cat));
                } else {
                    catName = catObj ? catObj.name : cond.cat;
                }
                
                let tagNames = (cond.tags || []).map(t => {
                    let td = tagDefs[t];
                    if (isEn) {
                        return (td && td.en) ? td.en : (fallbackTagEn[t] || (td ? td.name : t));
                    }
                    return td ? td.name : t;
                }).join('/');

                return `${tierDisplayName} ${catName}${tagNames ? ` · ${tagNames}` : ''}`;
            });

            return `└ ${labels.join(' + ')}`;
        }

        function updateProbDisplay() {
            const displayBox = document.getElementById('prob-display-content');
            if (!displayBox) return;

            const isEn = (localStorage.getItem('GM_Lang') || 'zh') === 'en';

            // 🌟 1. 动态设置顶栏标题
            const probTitleSpan = document.getElementById('sim-prob-title-text');
            if (probTitleSpan) {
                const titleTemplate = window.getTrans ? window.getTrans('sim_h_prob_live') : "📊 下一抽实时概率 (当前已垫: {pity})";
                probTitleSpan.innerHTML = titleTemplate.replace('{pity}', `<span id="sim-stat-pity" style="color: #f1c40f; font-weight: bold;">${simData.pity}</span>`);
            }

            // 🌟 2. 动态设置右侧展开/收起文本
            const arrowEl = document.getElementById('prob-collapse-arrow');
            const isCollapsed = document.getElementById('prob-display-box')?.classList.contains('collapsed');
            if (arrowEl) {
                arrowEl.innerText = isCollapsed ? (window.getTrans('sim_prob_arrow_view') || "▼ 查看明细") : (window.getTrans('sim_prob_arrow_hide') || "▲ 收起明细");
            }

            // 实时概率与实际抽卡共用算法，包含软保底和旧版 hard 字段兼容。
            const { probabilities: currentProbMap } = GachaEngine.calculateProbabilities(
                rules, simData, activeTiers, targetGoldIds
            );

            const previouslyLockedIds = Array.from(document.querySelectorAll('.prob-card-wrap.locked')).map(el => el.dataset.tierId);
            const isColorOnly = localStorage.getItem('GM_Sim_Hide_Low') === 'color_only';

            let html = '';
            [...activeTiers].reverse().forEach(t => {
                let probVal = currentProbMap[t.id] || 0;
                let color = t.color || '#fff';
                let isGoldTier = targetGoldIds.includes(t.id) || !!t.isGold;
                
                // 🌟 使用封装好的多语言星级名
                let tierDisplayName = getLocalizedTierName(t);
                
                let subProbs = t.subProbs;
                let hasSub = Array.isArray(subProbs) && subProbs.length > 0 && (!isColorOnly || isGoldTier);
                let isLocked = hasSub && previouslyLockedIds.includes(t.id);

                let subRowsHtml = '';
                if (hasSub) {
                    let totalSubBase = subProbs.reduce((sum, sp) => sum + (sp.prob || 0), 0);
                    subProbs.forEach((sp, idx) => {
                        let currentSubProb = totalSubBase > 0 ? (probVal * (sp.prob / totalSubBase)) : 0;
                        subRowsHtml += `
                            <div style="display: flex; justify-content: space-between; align-items: center; color: #aaa; padding: 2px 0;">
                                <span style="font-size: 11px;">${getSubProbConditionLabel(t, sp, idx)}</span>
                                <span style="font-family: monospace; color: #fff; font-size: 11px;">${currentSubProb.toFixed(3)} %</span>
                            </div>`;
                    });
                }

                html += `
                    <div class="prob-card-wrap ${isLocked ? 'locked' : ''}" data-tier-id="${t.id}" style="--tier-color: ${color}; margin-bottom: 6px; cursor: ${hasSub ? 'pointer' : 'default'};" ${hasSub ? 'onclick="toggleSubProbLock(this, event)"' : ''}>
                        <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.3); padding: 7px 10px; border-radius: ${hasSub && isLocked ? '4px 4px 0 0' : '4px'}; border-left: 4px solid ${color};">
                            <span style="color: ${color}; font-weight: bold; display: flex; align-items: center; gap: 6px; font-size: 13px;">
                                ${tierDisplayName} ${hasSub ? '<span class="prob-arrow-icon" style="font-size: 10px; transition: transform 0.2s; display: inline-block; color: #888;">▶</span>' : ''}
                            </span>
                            <span style="font-family: monospace; color: #fff; font-weight: bold; font-size: 13px;">${probVal.toFixed(3)} %</span>
                        </div>
                        ${hasSub ? `<div class="sub-prob-drawer" style="display: ${isLocked ? 'flex' : 'none'};">${subRowsHtml}</div>` : ''}
                    </div>`;
            });
            displayBox.innerHTML = html;
        }

        window.toggleProbDisplayCollapse = function(e) {
            // 如果点击的是内部已展开卡片或细分区域，不触发外层大面板折叠
            if (e && e.target.closest('.prob-card-wrap')) return;

            const box = document.getElementById('prob-display-box');
            const arrow = document.getElementById('prob-collapse-arrow');
            if (!box) return;

            box.classList.toggle('collapsed');
            const isCollapsed = box.classList.contains('collapsed');
            if (arrow) {
                arrow.innerText = isCollapsed ? (window.getTrans('sim_prob_arrow_view') || '▼ View Details') : (window.getTrans('sim_prob_arrow_hide') || '▲ Collapse Details');
            }
        };

function buildSingleItemHtml(p) {
    let isGold = p.isGold && targetGoldIds.includes(p.tierId);
    let isColorOnly = localStorage.getItem('GM_Sim_Hide_Low') === 'color_only';
    let tierObj = activeTiers.find(t => t.id === p.tierId) || { name: '?', color: '#555' };
    
    let info = findInRoster(p.name);
    let imgPath = getImageUrl(info ? info.short : p.name) || (info && info.img ? info.img : "");

    let hideImg = isColorOnly ? !isGold : false;
    let dName = hideImg ? tierObj.name : (info ? getItemShort(info) : p.name);
    let boxShadow = isGold ? `0 0 14px ${tierObj.color}cc` : 'none';

    // 🌟 1. 提升抽数/井角标层级至 z-index: 7（高于明光标签），确保抽数永远处于最上层
    let numStyle = isGold 
        ? 'display:block !important; background:#fff; color:#000; font-weight:900; z-index:7; border-radius: 2px; padding: 0 3px; line-height: 1.1;' 
        : 'display:none;';

    let bgColor = hideImg ? tierObj.color : '#222';
    let borderColor = hideImg ? 'rgba(255,255,255,0.15)' : tierObj.color;

    let imgHtml = (!hideImg && imgPath) ? `<img src="${imgPath}" style="width:100%;height:100%;object-fit:cover;position:absolute;top:0;left:0;border-radius:4px;z-index:1;" onerror="this.style.display='none';">` : '';
    let gradientHtml = (!hideImg && imgPath) ? `<div style="position:absolute; bottom:0; left:0; width:100%; height:50%; background:linear-gradient(to top, rgba(0,0,0,0.9), transparent); z-index:2; border-radius:0 0 4px 4px;"></div>` : '';

    // 🌟 2. 明光/挽救标签：层级设为 z-index: 5，并增加 max-width 与文本截断，防止过长盖住左上角
    let rescueTagHtml = '';
    if (p.isRescued && isGold) {
        let tagName = ItemFormat.getRescueName(rules.secondaryRescue);
        tagName = String(tagName).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        rescueTagHtml = `<span style="position:absolute; top:2px; right:2px; max-width:32px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; background:linear-gradient(45deg, #e056fd, #f0932b); color:#fff; font-size:8px; font-weight:900; padding:1px 3px; border-radius:3px; z-index:5; box-shadow:0 0 6px #e056fd; line-height:1.1;" title="${tagName}">${tagName}</span>`;
        boxShadow = '0 0 16px #e056fd, 0 0 6px #f1c40f';
    }

    let textStyle = hideImg 
        ? `position:relative; z-index:3; font-size:14px; font-weight:900; text-align:center; width:100%; margin:auto 0; text-shadow:0 1px 2px rgba(0,0,0,0.6); user-select:none;`
        : `position:relative; z-index:3; text-shadow:1px 1px 2px #000; font-size:11px; font-weight:bold; line-height: 1.2; text-align:center; width:100%; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; padding:0 2px; box-sizing:border-box;`;

    // 🌟 3. 抽数/井角标文本多语言接入（如果是井，动态调用翻译）
    let displayPityText = p.pityUsed;
    if (p.pityUsed === '井' || p.isSpark) {
        displayPityText = window.getTrans ? window.getTrans('sim_spark_badge') : '井';
    }

    return `
        <div class="sim-item" data-total="${p.total}" style="background:${bgColor}; border-color:${borderColor}; box-shadow:${boxShadow}; color:#fff;">
            <span class="pull-num" style="${numStyle}">${displayPityText}</span>
            ${imgHtml}${gradientHtml}${rescueTagHtml}
            <div style="${textStyle}">${dName}</div>
        </div>`;
}

        function resetSim() {
            // 重建所有抽卡进度，页面继续清理结果列表和刷新统计。
            simData = GachaEngine.createState(minorPities.length);
            document.getElementById('sim-results').innerHTML = '';
            simRenderedPulls.clear();
            updateSimStats();
            updateResetButtonsVisibility();
            currentGoldFocusIndex = -1;
            simData.naturalGoldCount = 0;
        }

        // 🌟 细分规则左侧状态与对应按钮可见性更新
        function updateResetButtonsVisibility() {
            const groupContainer = document.getElementById('sim-reset-actions-group');
            const hasSpark = Array.isArray(rules.sparkRules) && rules.sparkRules.length > 0;
            const hasGift = Array.isArray(rules.giftRules) && rules.giftRules.length > 0;
            const hasEarlyUp = Array.isArray(rules.earlyUpRules) && rules.earlyUpRules.length > 0;
            const hasCatSeq = Array.isArray(rules.goldCategorySequence) && rules.goldCategorySequence.length > 0;

            document.getElementById('row-rule-spark').style.display = hasSpark ? 'flex' : 'none';
            document.getElementById('row-rule-gift').style.display = hasGift ? 'flex' : 'none';
            document.getElementById('row-rule-early-up').style.display = hasEarlyUp ? 'flex' : 'none';
            document.getElementById('row-rule-cat-seq').style.display = hasCatSeq ? 'flex' : 'none';

            // 🌟 动态更新按钮文案
            document.getElementById('btn-reset-spark').innerText = window.getTrans('sim_btn_reset_spark_btn');
            document.getElementById('btn-reset-gift').innerText = window.getTrans('sim_btn_reset_gift_btn');
            document.getElementById('btn-reset-early-up').innerText = window.getTrans('sim_btn_reset_early_btn');
            document.getElementById('btn-reset-category-seq').innerText = window.getTrans('sim_btn_reset_cat_btn');

            groupContainer.style.display = (hasSpark || hasGift || hasEarlyUp || hasCatSeq) ? 'flex' : 'none';
        }

        window.openSparkResetSelector = function() {
            const sparkRules = rules.sparkRules || [];
            if (sparkRules.length === 0) return;
            const modal = document.getElementById('ruleSelectModalOverlay');
            document.getElementById('ruleSelectModalTitle').innerText = window.getTrans('sim_reset_spark_title');
            document.getElementById('ruleSelectModalDesc').innerText = window.getTrans('sim_reset_spark_desc');

            document.getElementById('ruleSelectOptionsList').innerHTML = sparkRules.map((rule, idx) => {
                if (!simData.sparkState[idx]) simData.sparkState[idx] = { basePull: 0, cancelled: false, triggeredCount: 0 };
                const st = simData.sparkState[idx];
                const modeText = rule.type === 'once' ? window.getTrans('once') : window.getTrans('loop');
                const statusText = st.cancelled 
                    ? `（${window.getTrans('sim_status_cancelled')}）` 
                    : (st.triggeredCount > 0 
                        ? `（${(window.getTrans('sim_status_triggered') || '').replace('{n}', st.triggeredCount)}）` 
                        : `（${window.getTrans('sim_status_active')}）`);

                return `
                    <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.05); padding:10px 14px; border-radius:6px; border:1px solid #444;">
                        <div>
                            <span style="color:#9b59b6; font-weight:bold;">${window.getTrans('sim_spark_badge')} #${idx + 1}: ${rule.limit} Pulls</span>
                            <span style="color:#888; font-size:12px; margin-left:8px;">[${modeText}]</span>
                            <div style="font-size:11px; color:#aaa; margin-top:2px;">${window.getTrans('sim_reset_status_label')}${statusText}</div>
                        </div>
                        <button class="btn btn-action-gray" style="padding:4px 10px; font-size:12px; color:#9b59b6; border-color:#9b59b6;" onclick="resetSingleSparkRule(${idx})">${window.getTrans('sim_reset_btn_single')}</button>
                    </div>`;
            }).join('');

            document.getElementById('btn-reset-all-rules').innerText = window.getTrans('sim_reset_btn_all');

            // 🌟 1. 确保右上角固定保持为 ✕
            const closeX = document.getElementById('btn-rule-select-close-x');
            if (closeX) closeX.innerText = '✕';

            // 🌟 2. 准确翻译底部的“关闭 / Close”按钮
            const closeFooter = document.getElementById('btn-rule-select-close-footer');
            if (closeFooter) closeFooter.innerText = window.getTrans('sim_reset_btn_close');

            document.getElementById('btn-reset-all-rules').onclick = () => {
                sparkRules.forEach((_, idx) => { simData.sparkState[idx] = { basePull: simData.total, cancelled: false, triggeredCount: 0 }; });
                modal.style.display = 'none'; updateSimStats(); showToast(window.getTrans('sim_toast_spark_all_reset'), "success");
            };
            modal.style.display = 'flex';
        };

        window.openGiftResetSelector = function() {
            const giftRules = rules.giftRules || [];
            if (giftRules.length === 0) return;
            const modal = document.getElementById('ruleSelectModalOverlay');
            document.getElementById('ruleSelectModalTitle').innerText = window.getTrans('sim_reset_gift_title');
            document.getElementById('ruleSelectModalDesc').innerText = window.getTrans('sim_reset_gift_desc');

            document.getElementById('ruleSelectOptionsList').innerHTML = giftRules.map((rule, idx) => {
                if (!simData.giftState[idx]) simData.giftState[idx] = { basePull: 0, triggeredCount: 0 };
                const st = simData.giftState[idx];
                const modeText = rule.type === 'once' ? window.getTrans('once') : window.getTrans('loop');
                const statusText = st.triggeredCount > 0 
                    ? `（${(window.getTrans('sim_status_triggered') || '').replace('{n}', st.triggeredCount)}）` 
                    : `（${window.getTrans('waiting_to_trigger')}）`;

                return `
                    <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.05); padding:10px 14px; border-radius:6px; border:1px solid #444;">
                        <div>
                            <span style="color:#2ecc71; font-weight:bold;">${window.getTrans('sim_rule_gift_label')} #${idx + 1}: ${rule.trigger} -> +${rule.amount}</span>
                            <span style="color:#888; font-size:12px; margin-left:8px;">[${modeText}]</span>
                            <div style="font-size:11px; color:#aaa; margin-top:2px;">${window.getTrans('sim_reset_status_label')}${statusText}</div>
                        </div>
                        <button class="btn btn-action-gray" style="padding:4px 10px; font-size:12px; color:#2ecc71; border-color:#2ecc71;" onclick="resetSingleGiftRule(${idx})">${window.getTrans('sim_reset_btn_single')}</button>
                    </div>`;
            }).join('');

            document.getElementById('btn-reset-all-rules').innerText = window.getTrans('sim_reset_btn_all');

            // 🌟 1. 确保右上角固定保持为 ✕
            const closeX = document.getElementById('btn-rule-select-close-x');
            if (closeX) closeX.innerText = '✕';

            // 🌟 2. 准确翻译底部的“关闭 / Close”按钮
            const closeFooter = document.getElementById('btn-rule-select-close-footer');
            if (closeFooter) closeFooter.innerText = window.getTrans('sim_reset_btn_close');

            document.getElementById('btn-reset-all-rules').onclick = () => {
                giftRules.forEach((_, idx) => { simData.giftState[idx] = { basePull: simData.total, triggeredCount: 0 }; });
                modal.style.display = 'none'; updateSimStats(); showToast(window.getTrans('sim_toast_gift_all_reset'), "success");
            };
            modal.style.display = 'flex';
        };

        window.openEarlyUpResetSelector = function() {
            const earlyRules = rules.earlyUpRules || [];
            if (earlyRules.length === 0) return;
            const modal = document.getElementById('ruleSelectModalOverlay');
            document.getElementById('ruleSelectModalTitle').innerText = window.getTrans('sim_reset_early_title');
            const currentUsed = simData.earlyUpUsedCount || 0;
            document.getElementById('ruleSelectModalDesc').innerText = (window.getTrans('sim_reset_early_desc') || '').replace('{used}', currentUsed);

            document.getElementById('ruleSelectOptionsList').innerHTML = earlyRules.map((rule, idx) => {
                const targetOrder = rule.order || (idx + 1);
                const isPast = currentUsed >= targetOrder;
                const statusText = isPast ? `（${window.getTrans('sim_status_exhausted')}）` : `（${window.getTrans('sim_status_not_triggered')}）`;

                return `
                    <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.05); padding:10px 14px; border-radius:6px; border:1px solid #444;">
                        <div>
                            <span style="color:#f1c40f; font-weight:bold;">Gold #${targetOrder}: UP Rate ${rule.upRate}%</span>
                            <div style="font-size:11px; color:#aaa; margin-top:2px;">${window.getTrans('sim_reset_status_label')}${statusText}</div>
                        </div>
                        <button class="btn btn-action-gray" style="padding:4px 10px; font-size:12px; color:#f1c40f; border-color:#f1c40f;" onclick="setEarlyUpTargetOrder(${targetOrder})">${window.getTrans('sim_reset_btn_from_order')}</button>
                    </div>`;
            }).join('');

            document.getElementById('btn-reset-all-rules').innerText = window.getTrans('sim_reset_btn_all');

            // 🌟 1. 确保右上角固定保持为 ✕
            const closeX = document.getElementById('btn-rule-select-close-x');
            if (closeX) closeX.innerText = '✕';

            // 🌟 2. 准确翻译底部的“关闭 / Close”按钮
            const closeFooter = document.getElementById('btn-rule-select-close-footer');
            if (closeFooter) closeFooter.innerText = window.getTrans('sim_reset_btn_close');

            document.getElementById('btn-reset-all-rules').onclick = () => {
                simData.earlyUpUsedCount = 0; modal.style.display = 'none'; updateSimStats(); showToast(window.getTrans('sim_toast_early_all_reset'), "success");
            };
            modal.style.display = 'flex';
        };

        window.openCategorySeqResetSelector = function() {
            const catSeqRules = rules.goldCategorySequence || [];
            if (catSeqRules.length === 0) return;
            const modal = document.getElementById('ruleSelectModalOverlay');
            document.getElementById('ruleSelectModalTitle').innerText = window.getTrans('sim_reset_cat_title');
            const currentUsed = simData.catSeqUsedCount || 0;
            document.getElementById('ruleSelectModalDesc').innerText = (window.getTrans('sim_reset_cat_desc') || '').replace('{used}', currentUsed);

            const isEn = (localStorage.getItem('GM_Lang') || 'zh') === 'en';
            const categories = gameInfo.categories || [ { id: 'char', name: '代理人', en: 'Agent' }, { id: 'wep', name: '音擎', en: 'W-Engine' }, { id: 'pet', name: '邦布', en: 'Bangboo' } ];
            const tagDefs = gameInfo.tagDefinitions || { up: { name: "限定", en: "Limited" }, std: { name: "常驻", en: "Standard" } };

            document.getElementById('ruleSelectOptionsList').innerHTML = catSeqRules.map((rule, idx) => {
                const targetOrder = rule.order || (idx + 1);
                const isPast = currentUsed >= targetOrder;
                
                // 🌟 将分类与标签转化为当前语言
                const cats = (rule.targetCats || []).map(c => {
                    const cObj = categories.find(x => x.id === c);
                    return cObj ? (isEn && cObj.en ? cObj.en : cObj.name) : c;
                }).join('/');

                const tags = (rule.targetTags || []).map(t => {
                    const tObj = tagDefs[t];
                    return tObj ? (isEn && tObj.en ? tObj.en : tObj.name) : t;
                }).join('/');

                const statusText = isPast ? `（${window.getTrans('sim_status_exhausted')}）` : `（${window.getTrans('waiting_to_trigger')}）`;

                return `
                    <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.05); padding:10px 14px; border-radius:6px; border:1px solid #444;">
                        <div>
                            <span style="color:#3498db; font-weight:bold;">Gold #${targetOrder}: [${cats} · ${tags}]</span>
                            <div style="font-size:11px; color:#aaa; margin-top:2px;">${window.getTrans('sim_reset_status_label')}${statusText}</div>
                        </div>
                        <button class="btn btn-action-gray" style="padding:4px 10px; font-size:12px; color:#3498db; border-color:#3498db;" onclick="setCatSeqTargetOrder(${targetOrder})">${window.getTrans('sim_reset_btn_from_order')}</button>
                    </div>`;
            }).join('');

            document.getElementById('btn-reset-all-rules').innerText = window.getTrans('sim_reset_btn_all');

            // 🌟 1. 确保右上角固定保持为 ✕
            const closeX = document.getElementById('btn-rule-select-close-x');
            if (closeX) closeX.innerText = '✕';

            // 🌟 2. 准确翻译底部的“关闭 / Close”按钮
            const closeFooter = document.getElementById('btn-rule-select-close-footer');
            if (closeFooter) closeFooter.innerText = window.getTrans('sim_reset_btn_close');

            document.getElementById('btn-reset-all-rules').onclick = () => {
                // 全部重置是回到第 1 金，不是列表第一项；同时取消此前的单条手选。
                simData.catSeqUsedCount = 0;
                simData.catSeqGoldOffset = simData.naturalGoldCount || 0;
                delete simData.customCatSeqStartOrder;
                modal.style.display = 'none'; updateSimStats(); showToast(window.getTrans('sim_toast_cat_all_reset'), "success");
            };
            modal.style.display = 'flex';
        };

        window.resetSingleSparkRule = function(index) {
            simData.sparkState[index] = { basePull: simData.total, cancelled: false, triggeredCount: 0 };
            document.getElementById('ruleSelectModalOverlay').style.display = 'none';
            updateSimStats(); 
            const msg = (window.getTrans('sim_toast_spark_single_reset') || '').replace('{n}', index + 1);
            showToast(msg, "success");
        };

        window.resetSingleGiftRule = function(index) {
            simData.giftState[index] = { basePull: simData.total, triggeredCount: 0 };
            document.getElementById('ruleSelectModalOverlay').style.display = 'none';
            updateSimStats(); 
            const msg = (window.getTrans('sim_toast_gift_single_reset') || '').replace('{n}', index + 1);
            showToast(msg, "success");
        };

        window.setEarlyUpTargetOrder = function(order) {
            simData.earlyUpUsedCount = Math.max(0, order - 1);
            document.getElementById('ruleSelectModalOverlay').style.display = 'none';
            updateSimStats(); 
            const msg = (window.getTrans('sim_toast_early_ready') || '').replace('{n}', order);
            showToast(msg, "success");
        };

        window.setCatSeqTargetOrder = function(order) {
            // 从指定数值继续推进：下一金按 order 生效，再下一金按 order+1 计算。
            simData.catSeqGoldOffset = (simData.naturalGoldCount || 0) - (order - 1);
            simData.customCatSeqStartOrder = order;
            simData.catSeqUsedCount = Math.max(0, order - 1);
            document.getElementById('ruleSelectModalOverlay').style.display = 'none';
            updateSimStats(); 
            const msg = (window.getTrans('sim_toast_cat_ready') || '').replace('{n}', order);
            showToast(msg, "success");
        };

        // 🌟 统一核心数据驱动与独占/平分渲染
        function updateSimStats() {
            const goldEl = document.getElementById('sim-stat-gold');
            if (goldEl) goldEl.innerText = simData.goldCount;
    
            const pityEl = document.getElementById('sim-stat-pity');
            if (pityEl) pityEl.innerText = simData.pity;

            // 1. 井
            const sparkRules = rules.sparkRules || [];
            if (sparkRules.length > 0) {
                let minDist = Infinity;
                sparkRules.forEach((rule, idx) => {
                    if (!simData.sparkState[idx]) simData.sparkState[idx] = { basePull: 0, cancelled: false, triggeredCount: 0 };
                    const st = simData.sparkState[idx];
                    if (st.cancelled) return;
                    let eff = simData.total - st.basePull;
                    let dist = -1;
                    if (rule.type === 'once' && st.triggeredCount === 0 && eff < rule.limit) dist = rule.limit - eff;
                    else if (rule.type === 'loop') dist = rule.limit - (eff % rule.limit);
                    if (dist !== -1 && dist < minDist) minDist = dist;
                });
                document.getElementById('badge-spark-info').innerText = minDist === Infinity ? '-' : `${minDist}`;
            }

            // 2. 赠送抽
            const giftRules = rules.giftRules || [];
            if (giftRules.length > 0) {
                let nextTrigger = Infinity;
                giftRules.forEach((r, idx) => {
                    const st = simData.giftState[idx] || { basePull: 0, triggeredCount: 0 };
                    let eff = simData.total - st.basePull;
                    let dist = r.type === 'once' ? (st.triggeredCount === 0 ? r.trigger - eff : -1) : (r.trigger - (eff % r.trigger));
                    if (dist > 0 && dist < nextTrigger) nextTrigger = dist;
                });
                document.getElementById('badge-gift-info').innerText = nextTrigger === Infinity 
                    ? window.getTrans('waiting_to_trigger') 
                    : (window.getTrans('sim_rule_gift_remain') || '').replace('{count}', nextTrigger);
            }

            // 3. 特权
            const earlyRules = rules.earlyUpRules || [];
            if (earlyRules.length > 0) {
                const cur = (simData.earlyUpUsedCount || 0) + 1;
                const nextRule = earlyRules.find(r => r.order === cur);
                document.getElementById('badge-early-up-info').innerText = nextRule 
                    ? (window.getTrans('sim_rule_early_display') || '').replace('{n}', cur).replace('{rate}', nextRule.upRate)
                    : window.getTrans('sim_rule_early_exhausted');
            }

            // 4. 定向
            const catSeqRules = (rules.goldCategorySequence || []).slice().sort((a, b) => (a.order || 0) - (b.order || 0));
            if (catSeqRules.length > 0) {
                const currentGoldOrder = GachaEngine.getCategoryGoldOrder(simData);
                const nextRule = simData.customCatSeqStartOrder 
                    ? catSeqRules.find(r => r.order === simData.customCatSeqStartOrder)
                    : catSeqRules.find(r => (r.order || 1) >= currentGoldOrder);
                
                const maxOrder = Math.max(...catSeqRules.map(r => r.order || 0));
                const allFinished = currentGoldOrder > maxOrder && !simData.customCatSeqStartOrder;

                const badgeEl = document.getElementById('badge-cat-seq-info');
                if (badgeEl) {
                    if (allFinished) {
                        badgeEl.innerText = window.getTrans('sim_rule_cat_all_done');
                        badgeEl.style.color = '#888';
                    } else if (nextRule) {
                        const targetCats = (nextRule.targetCats || []).join('/');
                        if (nextRule.order === currentGoldOrder || simData.customCatSeqStartOrder === nextRule.order) {
                            badgeEl.innerText = (window.getTrans('sim_rule_cat_next') || '')
                                .replace('{n}', nextRule.order).replace('{cats}', targetCats);
                            badgeEl.style.color = '#2ecc71';
                        } else {
                            const diff = nextRule.order - currentGoldOrder;
                            badgeEl.innerText = (window.getTrans('sim_rule_cat_waiting_order') || '')
                                .replace('{n}', nextRule.order).replace('{cats}', targetCats).replace('{diff}', diff);
                            badgeEl.style.color = '#3498db';
                        }
                    }
                }
            }

            // 5. 大保底 / 明光
            const goldPityRule = rules.pities?.find(p => targetGoldIds.includes(p.tierId)) || rules.pity || {};
            const isGuarEnabled = (goldPityRule.useGuarantee !== false) && (goldPityRule.enableUp !== false);
            const isRescueEnabled = !!(rules.secondaryRescue && rules.secondaryRescue.enabled);

            const wrapper = document.getElementById('guarantee-rescue-wrapper');
            const guarBox = document.getElementById('box-stat-guarantee');
            const rescueBox = document.getElementById('box-stat-rescue');

            if (!isGuarEnabled && !isRescueEnabled) {
                wrapper.style.display = 'none';
            } else {
                wrapper.style.display = 'flex';
                guarBox.style.display = isGuarEnabled ? 'flex' : 'none';
                rescueBox.style.display = isRescueEnabled ? 'flex' : 'none';

                if (isGuarEnabled) {
                    const guarMode = goldPityRule.guaranteeMode || 'classic';
                    const guaText = document.getElementById('sim-stat-guarantee');
                    if (guarMode === 'progressive') {
                        let baseRate = (goldPityRule.upRate ?? 0.5) * (goldPityRule.upRate <= 1 ? 100 : 1);
                        const step = goldPityRule.guaranteeStep ?? 25;
                        const currentRate = Math.min(goldPityRule.guaranteeMax ?? 100, baseRate + (simData.guaranteeLosses || 0) * step);
                        guaText.innerText = currentRate >= 100 
                            ? window.getTrans('sim_stat_guar_prog_hit')
                            : (window.getTrans('sim_stat_guar_prog_next') || '').replace('{rate}', currentRate).replace('{lost}', simData.guaranteeLosses || 0);
                        guaText.style.color = currentRate >= 100 ? '#2ecc71' : ((simData.guaranteeLosses || 0) > 0 ? '#f1c40f' : '#aaa');
                    } else {
                        const limit = goldPityRule.guaranteeLimit || 1;
                        if (simData.guaranteeCount >= limit) {
                            guaText.innerText = window.getTrans('sim_stat_guar_yes');
                            guaText.style.color = '#e74c3c';
                        } else {
                            guaText.innerText = (window.getTrans('sim_stat_guar_need') || '').replace('{n}', limit - simData.guaranteeCount);
                            guaText.style.color = '#aaa';
                        }
                    }
                }

                if (isRescueEnabled) {
                    const hardLoss = rules.secondaryRescue.hardGuaranteeLosses ?? 3;
                    document.getElementById('sim-stat-rescue-losses').innerText = `${simData.consecutiveLosses || 0}/${hardLoss}`;
                }

                const guarLabelEl = document.getElementById('sim-stat-guar-label');
                if (guarLabelEl) {
                    guarLabelEl.innerText = window.getTrans('sim_stat_guar_label') || "大保底:";
                }
            }

            updateProbDisplay();
        }

        window.toggleSubProbLock = function(cardWrapEl, event) {
            const ev = event || window.event;
            if (ev && typeof ev.stopPropagation === 'function') {
                ev.stopPropagation();
            }
            cardWrapEl.classList.toggle('locked');
        };

        function updateHideLowTip() {
            const tipEl = document.getElementById('tip-hide-low-text');
            if (!tipEl) return;
            const isColorOnly = localStorage.getItem('GM_Sim_Hide_Low') === 'color_only';
            tipEl.innerHTML = isColorOnly 
                ? window.getTrans('sim_tip_color_mode') 
                : window.getTrans('sim_tip_full_mode');
        }

        async function scrollToGold(direction) {
            const goldRows = getGoldRowsList();
            if (goldRows.length === 0) {
                showToast(window.getTrans('sim_toast_no_gold'), 'cancel');
                return;
            }

            const currentHighlighted = document.querySelector('.sim-pull-row.highlight-gold-target');
            if (currentHighlighted) {
                const foundIdx = goldRows.indexOf(currentHighlighted);
                if (foundIdx !== -1) currentGoldFocusIndex = foundIdx;
            }

            let nextIndex = currentGoldFocusIndex;

            if (direction === 'next') {
                if (currentGoldFocusIndex === -1) {
                    nextIndex = 0;
                } else if (currentGoldFocusIndex < goldRows.length - 1) {
                    nextIndex = currentGoldFocusIndex + 1;
                    goldBoundarySpamCount = 0;
                } else {
                    triggerBoundaryToast(window.getTrans('sim_toast_last_gold'));
                    return;
                }
            } else {
                if (currentGoldFocusIndex === -1) {
                    nextIndex = goldRows.length - 1;
                } else if (currentGoldFocusIndex > 0) {
                    nextIndex = currentGoldFocusIndex - 1;
                    goldBoundarySpamCount = 0;
                } else {
                    triggerBoundaryToast(window.getTrans('sim_toast_no_prev_gold'));
                    return;
                }
            }

            focusGoldRow(goldRows[nextIndex], true);
        }

        async function doSimCustomPulls() {
            let val = parseInt(document.getElementById('input-custom-amount').value);
            if (!val || val <= 0) return await customAlert('请输入有效的跃迁数量');
            await doSimPulls(val); 
        }

        window.addEventListener('DOMContentLoaded', () => {
            if (typeof renderSidebar === 'function') renderSidebar();
            if (window.applyTranslations) window.applyTranslations(); // 🌟 激活页面静态翻译
            renderTopConfigDrawer();
            updateSimStats();
            updateHideLowTip();
            updateResetButtonsVisibility();
            updateRotationButtonUI();
        });



        function promptSparkSelection(candidates, ruleLimit) {
            return new Promise(resolve => {
                const overlay = document.getElementById('sparkSelectModalOverlay');
                const grid = document.getElementById('sparkSelectGrid');
                document.getElementById('sparkModalTitle').innerText = `🎁 达成 ${ruleLimit} 抽里程碑：请自选奖励`;

                grid.innerHTML = candidates.map(item => {
                    const displayShort = getItemShort(item);
                    const displayName = getItemName(item);
                    const imgPath = item.img || getImageUrl(item.short || item.name);
                    const imgHtml = imgPath 
                        ? `<img src="${imgPath}" style="width:100%; height:100%; object-fit:cover;">` 
                        : `<div style="color:#fff; font-weight:bold; font-size:14px;">${displayShort}</div>`;

                    return `
                        <div class="char-select-card" style="height:90px; opacity:1; filter:none; border-color:#f1c40f;" onclick="onPickSparkReward('${item.name}')">
                            <div class="char-select-img-wrap" style="height:65px;">${imgHtml}</div>
                            <div class="char-select-name" title="${displayName}">${displayName}</div>
                        </div>`;
                }).join('');

                window.onPickSparkReward = function(chosenName) {
                    overlay.style.display = 'none';
                    resolve(chosenName);
                };
                overlay.style.display = 'flex';
            });
        }

function updateSectionCounters(tierId) {
    const isGoldTier = targetGoldIds.includes(tierId);
    const pre = rules.preSelect?.tiers?.[tierId] || {};

    // 格式化函数：按 min/max 规则返回 (已选) 或 (已选/上限)
    const formatCount = (checkedCount, minLimit, maxLimit) => {
        const isUnlimited = maxLimit === undefined || maxLimit === null || maxLimit >= 999;
        // 如果是单选 (min===1 且 max===1) 或者 没有上限限制，只显示已选数量
        if ((minLimit === 1 && maxLimit === 1) || isUnlimited) {
            return `(${checkedCount})`;
        }
        // 其余有上限限制的（如 0~2、6~6 等），显示 (已选/上限)
        return `(${checkedCount}/${maxLimit})`;
    };

    // 1. UP 目标计数
    const upEl = document.getElementById(`count-up-${tierId}`);
    if (upEl) {
        const upCount = document.querySelectorAll(`.sim-up-cb-${tierId}:checked`).length;
        const upMin = pre.upMin ?? (isGoldTier ? 1 : 2);
        const upMax = pre.upMax ?? (isGoldTier ? 1 : 2);
        upEl.innerText = formatCount(upCount, upMin, upMax);
    }

    // 2. 特限干预计数
    const specEl = document.getElementById(`count-spec-${tierId}`);
    if (specEl) {
        const specCount = document.querySelectorAll(`.sim-spec-cb-${tierId}:checked`).length;
        const specMin = pre.specMin ?? rules.preSelect?.spec?.min ?? 0;
        const specMax = pre.specMax ?? rules.preSelect?.spec?.max ?? 2;
        specEl.innerText = formatCount(specCount, specMin, specMax);
    }

    // 3. 常驻 / 底垫 / 可歪列表计数（如 3★、4★ 常驻等）
    const stdEl = document.getElementById(`count-std-${tierId}`);
    if (stdEl) {
        const stdCount = document.querySelectorAll(`.sim-std-cb-${tierId}:checked`).length;
        const stdMin = pre.stdMin ?? 0;
        const stdMax = pre.stdMax ?? 999;
        stdEl.innerText = formatCount(stdCount, stdMin, stdMax);
    }
}

// 🌟 统一星级卡片上下联动处理（包含 UP 互斥、特限互斥与常驻绑定）
function syncTierCardsLinkage(tierId) {
    const isGoldTier = targetGoldIds.includes(tierId);
    const upCheckedNames = Array.from(document.querySelectorAll(`.sim-up-cb-${tierId}:checked`)).map(cb => cb.value);
    
    // 1. 特限池与 UP 互斥联动：
    // 如果某个角色已经被选为 UP，但同时在特限池被勾选了，立刻取消特限并锁定
    const specCards = document.querySelectorAll(`#grid-spec-${tierId} .char-select-card`);
    specCards.forEach(card => {
        const cb = card.querySelector('input[type="checkbox"]');
        if (!cb) return;

        const isUP = upCheckedNames.includes(cb.value);
        if (isUP) {
            // 被选为 UP：强制取消特限勾选并禁用/置灰
            cb.checked = false;
            card.classList.remove('selected');
            card.classList.add('locked-by-up');
        } else {
            // 没有被选为 UP：解除锁定
            card.classList.remove('locked-by-up');
        }
    });

    // 重新获取最新的特限勾选列表（排除了被 UP 剔除的角色）
    const specCheckedNames = Array.from(document.querySelectorAll(`.sim-spec-cb-${tierId}:checked`)).map(cb => cb.value);

    // 2. 常驻/可歪池联动：
    const stdCards = document.querySelectorAll(`#grid-std-${tierId} .char-select-card`);
    stdCards.forEach(card => {
        const cb = card.querySelector('input[type="checkbox"]');
        if (!cb) return;

        const name = cb.value;
        const isUP = upCheckedNames.includes(name);
        const isSpec = isGoldTier && specCheckedNames.includes(name);

        // 清理角标
        const oldBadge = card.querySelector('.spec-corner-badge');
        if (oldBadge) oldBadge.remove();

        if (isUP) {
            // 选为 UP：从可歪池剔除
            cb.checked = false;
            card.classList.remove('selected', 'boosted-by-spec');
            card.classList.add('locked-by-up');
        } else if (isSpec) {
            // 选为特限：强制常驻池勾选并加上火焰角标
            card.classList.remove('locked-by-up');
            cb.checked = true;
            card.classList.add('selected', 'boosted-by-spec');
            card.insertAdjacentHTML('beforeend', `<div class="spec-corner-badge">🔥5x</div>`);
        } else {
            // 普通角色：解除锁定
            if (card.classList.contains('locked-by-up')) {
                card.classList.remove('locked-by-up');
                cb.checked = true;
                card.classList.add('selected');
            }
            card.classList.remove('boosted-by-spec');
        }
    });

    // 3. 更新所有小节计数显示
    if (typeof updateSectionCounters === 'function') {
        updateSectionCounters(tierId);
    }

    updateHeaderSummary();
}

// 2. 点击按钮分支处理
window.handleRotationOrClearClick = async function() {
    const allowRotation = rules.lifecycle?.allowRotation !== false && !currentPool.includes('std');
    if (!allowRotation) {
        // 常驻池等直接走确认清空（接入多语言）
        const confirmMsg = window.getTrans ? window.getTrans('sim_conf_clear_history') : "确定要清空当前的抽卡历史记录吗？";
        if (await customConfirm(confirmMsg)) {
            resetSim();
            simData.naturalGoldCount = 0;
            const toastMsg = window.getTrans ? window.getTrans('sim_toast_cleared') : "记录已清空";
            showToast(toastMsg, "danger");
        }
        return;
    }

    // 允许换期：打开换期配置弹窗
    openRotationModal();
};

let selectedNewUpName = "";

function openRotationModal() {
    const modal = document.getElementById('versionRotationModalOverlay');
    const summaryBox = document.getElementById('rotation-summary-box');
    const grid = document.getElementById('rotation-up-candidates-grid');

    // 🌟 更新弹窗标题
    const modalTitleEl = modal.querySelector('h3');
    if (modalTitleEl) modalTitleEl.innerHTML = window.getTrans('sim_rot_modal_title_full');

    // 🌟 确保右上角始终为 ✕，不被覆写为 Cancel
    const closeXBtn = document.getElementById('btn-close-rot-modal');
    if (closeXBtn) closeXBtn.innerText = '✕';

    // 🌟 候选提示文字翻译
    const hintEl = document.getElementById('rotation-select-hint');
    if (hintEl) {
        hintEl.innerText = window.getTrans('sim_rot_candidate_select_hint');
    }

    // 🌟 精准翻译底部的“取消”按钮
    const cancelBtn = document.getElementById('btn-cancel-rot-modal');
    if (cancelBtn) cancelBtn.innerText = window.getTrans('cancel');

    // 🌟 底部确认按钮翻译
    const confirmBtn = document.getElementById('btn-confirm-start-rotation');
    if (confirmBtn) confirmBtn.innerText = window.getTrans('sim_rot_btn_confirm_start');

    const matrix = rules.lifecycle?.rotationMatrix || {
        inheritPityPulls: true,
        inheritGuaranteeState: true,
        inheritRescueLosses: true,
        resetEarlyUp: true,
        resetSparkPity: true
    };

    // 动态翻译摘要说明每一行
    const pityStr = matrix.inheritPityPulls 
        ? (window.getTrans('sim_rot_summary_pity_keep') || '').replace('{pity}', simData.pity)
        : window.getTrans('sim_rot_summary_pity_reset');

    let guarStr = window.getTrans('sim_rot_summary_guar_reset');
    if (matrix.inheritGuaranteeState) {
        guarStr = simData.guaranteeCount > 0 
            ? window.getTrans('sim_rot_summary_guar_hard') 
            : window.getTrans('sim_rot_summary_guar_soft');
    }

    const rescueLine = rules.secondaryRescue?.enabled ? `
        <div>${matrix.inheritRescueLosses 
            ? (window.getTrans('sim_rot_summary_rescue_keep') || '').replace('{count}', simData.consecutiveLosses || 0)
            : window.getTrans('sim_rot_summary_rescue_reset')}</div>
    ` : '';

    const earlyText = matrix.resetEarlyUp ? window.getTrans('sim_rot_priv_early_reset') : window.getTrans('sim_rot_priv_early_keep');
    const catText = matrix.resetCatSeq ? window.getTrans('sim_rot_priv_cat_reset') : window.getTrans('sim_rot_priv_cat_keep');
    const sparkText = matrix.resetSparkPity ? window.getTrans('sim_rot_priv_spark_reset') : window.getTrans('sim_rot_priv_spark_keep');

    const privStr = (window.getTrans('sim_rot_summary_privilege') || '')
        .replace('{early}', earlyText)
        .replace('{cat}', catText)
        .replace('{spark}', sparkText);

    summaryBox.innerHTML = `
        <div>${pityStr}</div>
        <div>${guarStr}</div>
        ${rescueLine}
        <div>${privStr}</div>
    `;

    // 提取所有候选 UP (加入强力兜底逻辑)
    const goldTierId = targetGoldIds[0] || globalTiers[0]?.id;
    const tRule = rules.assembly?.tierRules?.[goldTierId] || {};
    const upTags = tRule.upTags || ['up', 'reup', 'custom_offrate'];

    let candidateItems = getItemsByCats(tRule.upCats || ['char']).filter(item => 
        item.tierId === goldTierId && CatalogUtils.hasAnyTag(item, upTags)
    );

    // 🌟 如果按标签没筛出任何角色，自动兜底为当前金阶的所有图鉴角色
    if (candidateItems.length === 0) {
        candidateItems = allCatalogItems.filter(item => item.tierId === goldTierId);
    }

    // 默认优先选中当前顶部已选中的 UP 角色，若没有则选第 1 个
    const currentCheckedUp = document.querySelector(`.sim-up-cb-${goldTierId}:checked`);
    selectedNewUpName = currentCheckedUp ? currentCheckedUp.value : (candidateItems[0]?.name || "");

    grid.innerHTML = candidateItems.map(item => {
        const isSel = item.name === selectedNewUpName;
        const itemDisplayName = getItemShort(item);
        return `
            <div class="char-select-card ${isSel ? 'selected' : ''}" style="height:78px; opacity:1; filter:none; cursor:pointer;" onclick="selectRotationTarget(this, '${item.name}')">
                <div class="char-select-img-wrap" style="height:55px;">
                    <img src="${item.img || getImageUrl(item.short || item.name)}" style="width:100%;height:100%;object-fit:cover;">
                </div>
                <div class="char-select-name">${itemDisplayName}</div>
            </div>`;
    }).join('');

    // 展示弹窗
    modal.style.display = 'flex';
}

window.selectRotationTarget = function(cardEl, name) {
    selectedNewUpName = name;
    cardEl.parentElement.querySelectorAll('.char-select-card').forEach(c => c.classList.remove('selected'));
    cardEl.classList.add('selected');
};

// 3. 执行换期逻辑
window.executeStartNewRotation = async function() {
    if (!selectedNewUpName) {
        showToast(window.getTrans('sim_rot_candidate_select_hint') || "请指定新一期的 UP 角色", "cancel");
        return;
    }

    const modal = document.getElementById('versionRotationModalOverlay');
    modal.style.display = 'none';

    // 查找选中的目标对象以获取准确的国际化显示名字
    const targetItemObj = findInRoster(selectedNewUpName);
    const targetLocalizedName = getItemName(targetItemObj);

    // 已在换期配置窗口点击“确认开启新一期”，直接执行；完成后由下方 Toast 提示。

    const matrix = rules.lifecycle?.rotationMatrix || {};

    // 1. 根据规则重置状态机
    if (!matrix.inheritPityPulls) simData.pity = 0;
    if (!matrix.inheritGuaranteeState) { simData.guaranteeCount = 0; simData.guaranteeLosses = 0; }
    if (!matrix.inheritRescueLosses) simData.consecutiveLosses = 0;
    if (matrix.resetEarlyUp) simData.earlyUpUsedCount = 0;
    if (matrix.resetCatSeq !== false) {
        simData.catSeqUsedCount = 0;
        simData.catSeqGoldOffset = 0; // 下方新一期自然出金计数也会重置为 0。
        delete simData.customCatSeqStartOrder;
    } else {
        // 自然出金数重置为零时，仍保留选择“不重置定向”的独立数值进度。
        simData.catSeqGoldOffset = 1 - GachaEngine.getCategoryGoldOrder(simData);
    }
    simData.goldCount = 0;
    simData.naturalGoldCount = 0;
    if (matrix.resetSparkPity) {
        Object.keys(simData.sparkState).forEach(k => {
            simData.sparkState[k] = { basePull: simData.total, cancelled: false, triggeredCount: 0 };
        });
    }
    if (matrix.resetGiftRules) {
        Object.keys(simData.giftState).forEach(k => {
            simData.giftState[k] = { basePull: simData.total, triggeredCount: 0 };
        });
    }

    // 2. 自动把顶部 UP 勾选更新为所选的新角色
    const goldTierId = targetGoldIds[0] || globalTiers[0]?.id;
    document.querySelectorAll(`.sim-up-cb-${goldTierId}`).forEach(cb => {
        const isMatch = cb.value === selectedNewUpName;
        cb.checked = isMatch;
        const card = cb.closest('.char-select-card');
        if (card) card.classList.toggle('selected', isMatch);
    });
    syncTierCardsLinkage(goldTierId);

    // 🌟 3. 在模拟器流水线插入版本分界线（接入多语言）
    const resultsWrap = document.getElementById('sim-results');
    const dividerRow = document.createElement('div');
    dividerRow.className = "sim-pull-row";
    dividerRow.style = "background: linear-gradient(90deg, rgba(26,188,156,0.1), rgba(26,188,156,0.25), rgba(26,188,156,0.1)); border: 1px dashed #1abc9c; padding: 6px 12px; justify-content: center; color: #1abc9c; font-size: 12px; font-weight: bold; border-radius: 6px;";
    
    const dividerText = (window.getTrans('sim_rot_divider_line') || '')
        .replace('{name}', targetLocalizedName)
        .replace('{pity}', simData.pity);
    dividerRow.innerHTML = dividerText;
    resultsWrap.prepend(dividerRow);

    if (matrix.resetCatSeq !== false) {
        simData.catSeqUsedCount = 0;
    }

    updateSimStats();

    // 🌟 4. 弹出小 Toast 提示（接入多语言）
    const successToastText = (window.getTrans('sim_rot_toast_success') || '').replace('{name}', targetLocalizedName);
    showToast(successToastText, "success");
};


// 只改变显示，不重新抽取物品，不推进保底、井或赠送状态。
window.refreshSimulatorDisplay = function () {
    document.documentElement.setAttribute('data-sim-low-mode', localStorage.getItem('GM_Sim_Hide_Low') || 'show');
    document.querySelectorAll('#sim-results .sim-item').forEach(node => {
        const pull = simRenderedPulls.get(node.dataset.total);
        if (pull) node.outerHTML = buildSingleItemHtml(pull);
    });
    updateHeaderSummary();
    updateProbDisplay();
    updateHideLowTip();
};
window.addEventListener('storage', event => {
    if (event.key === 'GM_Sim_Hide_Low') window.refreshSimulatorDisplay();
});
