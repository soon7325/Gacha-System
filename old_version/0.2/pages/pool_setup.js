/**
 * 卡池设置：配置表单、规则编辑、候选预览、保存与离开提醒。
 * 由 pool_setup.html 底部加载，保持原先的依赖和执行顺序。
 * 使用普通 script，全局函数仍可供 HTML 内联 onclick 调用。
 */
const urlParams = new URLSearchParams(window.location.search);
        const currentPool = urlParams.get('pool') || 'char_up';
        const gameId = urlParams.get('gameId'); 
        const STORAGE_KEY = `GM_Rules_${gameId}_${currentPool}`;

        const sysLang = localStorage.getItem('GM_Lang') || 'zh';

        // 显示可以回退到已有语言；草稿只保留用户实际填写的两个字段。
        let rescueLabelDraft = { customEffectName: '明光', customEffectNameEn: '' };
        function loadRescueLabel(config = {}) {
            config = config || {};
            rescueLabelDraft = {
                customEffectName: config.customEffectName || '明光',
                customEffectNameEn: config.customEffectNameEn || ''
            };
            const input = document.getElementById('input-rescue-tag');
            if (input) input.value = ItemFormat.getRescueName(rescueLabelDraft, sysLang);
        }

        function getRescueLabelConfig() {
            return {
                customEffectName: rescueLabelDraft.customEffectName.trim() || rescueLabelDraft.customEffectNameEn.trim() || '明光',
                customEffectNameEn: rescueLabelDraft.customEffectNameEn.trim()
            };
        }

        // 全名、简称和稀有度展示共用；名字字符串也可直接从最新图鉴解析。
        const { getItemName, getItemShort, getTierName: getTierDisplayName } = ItemFormat.create({
            getCatalog: () => pureCatalog,
            getTiers: () => globalTiers,
            getLang: () => sysLang
        });

        let globalTiers = [];
        let poolTierState = {};
        let selectedGoldIds = [];
        let pureCatalog = {};

        let poolAssembly = {
            tierRules: {
                tier_S: {
                    mode: 'up_split',
                    cats: ['char'],
                    upTags: ['up', 'reup'],
                    offrateTags: ['std', 'custom_offrate']
                },
                tier_A: {
                    mode: 'up_split',
                    cats: ['char', 'wep'],
                    upTags: ['custom_offrate'],
                    offrateTags: ['normal', 'std']
                },
                tier_B: {
                    mode: 'flat',
                    cats: ['wep'],
                    tags: ['normal']
                }
            }
        };

        window.addEventListener('DOMContentLoaded', initPage);

        function initPage() {
            if (!currentPool || !gameId) { window.location.href = 'index.html'; return; }

            if (typeof renderSidebar === 'function') renderSidebar();
            loadPureCatalog();

            const currentLang = localStorage.getItem('GM_Lang') || 'zh';
            const meta = getPoolMeta(currentPool);
            const poolName = getPoolDisplayName(currentPool);
            const poolDisplayEl = document.getElementById('display-pool-name');

            const displayName = getPoolDisplayName(currentPool);
            document.getElementById('display-pool-name').innerText = displayName;

            // 统一加载稀有度，继续由设置页将规则转换为编辑控件。
            globalTiers = GameData.loadGlobalTiers(gameId);

            globalTiers.forEach(t => { poolTierState[t.id] = { enabled: false, prob: 0, subProbs: null }; });

            loadRescueLabel();
            loadPoolConfig();

            const presetRules = GameData.getPreset(gameId)?.rules;
            if (presetRules && presetRules[currentPool] && !localStorage.getItem(STORAGE_KEY)) {
                injectDbRulesToUI(currentPool);
            } else {
                renderCardZeroAssembly();
            }

            // 装配规则在 loadPoolConfig 后半段才恢复；此处按最终模式再同步一次。
            refreshPreselectModes();
            if (poolDisplayEl) {
                poolDisplayEl.innerHTML = `${meta.icon || ''} ${poolName}`;
                if (meta.badgeColor) poolDisplayEl.style.color = meta.badgeColor;
            }
            if (typeof window.applyTranslations === 'function') window.applyTranslations();

            applyPresetPoolLock();
            populateParentPoolOptions();
            syncRotationInheritVisibility();
            toggleRotationSettingsPanel();

            setTimeout(initDirtyTracking, 300);
        }

        function navigateToDashboard() { 
            safeNavigate(`dashboard.html?gameId=${gameId}&pool=${currentPool}`); 
        }

        // 预览交互共用；本页提供卡池配置专属文案和原有保存入口保护。
        const poolPreviewLock = PreviewLock.create({
            isPreset: () => typeof PRESET_GAME_IDS !== 'undefined' && PRESET_GAME_IDS.includes(gameId),
            getLabels: () => ({
                lock: getTrans('lock_preview'),
                unlock: getTrans('unlock_preview'),
                readOnly: getTrans('cp_btn_preview_readonly'),
                banner: getTrans('cp_preset_lock_banner')
            }),
            banner: {
                id: 'preset-pool-lock-banner',
                style: 'background: rgba(255, 193, 7, 0.12); border: 1px solid #ffc107; color: #ffc107; padding: 12px 16px; border-radius: 8px; margin-bottom: 20px; text-align: center; font-weight: bold; font-size: 13px; user-select: none;'
            },
            onPreset() {
                window.executeSavePool = () => false;
                window.savePoolConfig = () => false;
            }
        });
        // 预览同时禁用真实表单和编辑按钮，保留折叠、内容查看及快捷设定。
        const poolReadonlyStates = new WeakMap();
        const poolReadonlySelector = '.setup-card input, .setup-card select, .setup-card textarea, ' +
            '.setup-card button:not(.custom-select-ui-trigger):not(.bilingual-input-toggle):not(.btn-sub-prob-toggle):not(.btn-cat-toggle):not([onclick^="toggleSubCondPreview"]), #btn-save-pool';
        function syncPoolReadonlyControls() {
            const locked = poolPreviewLock.isLocked();
            document.querySelectorAll(poolReadonlySelector).forEach(control => {
                if (locked) {
                    if (!poolReadonlyStates.has(control)) poolReadonlyStates.set(control, control.disabled);
                    if (!control.disabled) control.disabled = true;
                } else if (poolReadonlyStates.has(control)) {
                    const previous = poolReadonlyStates.get(control);
                    if (control.disabled !== previous) control.disabled = previous;
                    poolReadonlyStates.delete(control);
                }
            });
        }
        for (const eventName of ['click', 'keydown', 'beforeinput']) document.addEventListener(eventName, event => {
            if (!poolPreviewLock.isLocked()) return;
            const control = event.target.closest('.setup-card .custom-select-ui, .setup-card .item-select-chip');
            if (control) { event.preventDefault(); event.stopImmediatePropagation(); }
        }, true);
        new MutationObserver(syncPoolReadonlyControls).observe(document.body, {
            childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'disabled']
        });
        window.togglePreviewMode = () => {
            const changed = poolPreviewLock.toggle();
            syncPoolReadonlyControls();
            return changed;
        };
        function applyPresetPoolLock() {
            poolPreviewLock.applyPreset();
            syncPoolReadonlyControls();
        }

        function loadPureCatalog() {
            // 与仪表盘、模拟器共用图鉴读取和旧字段兼容逻辑。
            pureCatalog = GameData.loadCatalog(gameId);
        }

        window.updateAssemblyCats = function() {
            poolAssembly.targetUpCats = [];
            if (document.getElementById('cat-up-char')?.checked) poolAssembly.targetUpCats.push('char');
            if (document.getElementById('cat-up-wep')?.checked) poolAssembly.targetUpCats.push('wep');

            poolAssembly.goldOffrateCats = [];
            if (document.getElementById('cat-gold-char')?.checked) poolAssembly.goldOffrateCats.push('char');
            if (document.getElementById('cat-gold-wep')?.checked) poolAssembly.goldOffrateCats.push('wep');

            poolAssembly.minorPoolCats = [];
            if (document.getElementById('cat-minor-char')?.checked) poolAssembly.minorPoolCats.push('char');
            if (document.getElementById('cat-minor-wep')?.checked) poolAssembly.minorPoolCats.push('wep');

            poolAssembly.basePoolCats = [];
            if (document.getElementById('cat-base-char')?.checked) poolAssembly.basePoolCats.push('char');
            if (document.getElementById('cat-base-wep')?.checked) poolAssembly.basePoolCats.push('wep');

            refreshUpGoldGrid();
            refreshGoldOffratePreview();
            refreshMinorUpGrid();
        };

        function refreshUpGoldGrid() {
            const candidateItems = getItemsByCats(poolAssembly.targetUpCats || ['char']);
            let highestTierId = globalTiers[0]?.id;

            let potentialUpGolds = candidateItems.filter(i => i.tierId === highestTierId && (i.tags || []).includes('up'));
            if (potentialUpGolds.length === 0) {
                potentialUpGolds = candidateItems.filter(i => i.tierId === highestTierId);
            }

            const upGoldGrid = document.getElementById('grid-up-gold');
            if (upGoldGrid) {
                upGoldGrid.innerHTML = potentialUpGolds.map(item => {
                    let isSel = poolAssembly.targetUpNames.includes(item.name);
                    let imgHtml = item.img ? `<img src="${item.img}">` : `<div style="font-size:16px;">${item.category === 'char' ? '👤' : '🗡️'}</div>`;
                    return `
                        <div class="item-select-chip ${isSel ? 'active' : ''}" onclick="toggleUpGoldSelect('${item.name}')">
                            ${imgHtml}
                            <div class="chip-name" title="${getItemName(item)}">${getItemName(item)}</div>
                        </div>
                    `;
                }).join('') || `<div style="color:#666; font-size:12px; padding:10px;">未找到匹配的 5★ 候选物品</div>`;
            }
            const countGold = document.getElementById('count-up-gold');
            if (countGold) countGold.innerText = `已指定: ${poolAssembly.targetUpNames.length}`;
        }

        function getItemsByCats(allowedCats = []) {
            return CatalogUtils.getItemsByCategories(pureCatalog, allowedCats || []);
        }

        function getAllCatalogItems() {
            return CatalogUtils.getItemsByCategories(pureCatalog, null, { withCategory: false });
        }

        function refreshGoldOffratePreview() {
            const candidateItems = getItemsByCats(poolAssembly.goldOffrateCats || ['char']);
            let highestTierId = globalTiers[0]?.id;

            let matchedGoldOffrates = candidateItems.filter(i => 
                i.tierId === highestTierId && 
                CatalogUtils.hasAnyTag(i, poolAssembly.goldOffrateTags)
            );

            const countEl = document.getElementById('preview-gold-offrate-count');
            if (countEl) countEl.innerText = `${matchedGoldOffrates.length} 件`;

            const chipsWrap = document.getElementById('preview-gold-offrate-chips');
            if (chipsWrap) {
                chipsWrap.innerHTML = matchedGoldOffrates.map(i => `
                    <span style="font-size:11px; background:#1e2126; border:1px solid #3498db; color:#3498db; padding:2px 6px; border-radius:4px;">
                        ${getItemName(i)}
                    </span>
                `).join('') || `<span style="font-size:11px; color:#666;">暂无吸附出的常驻内容</span>`;
            }
        }

        function refreshMinorUpGrid() {
            const candidateItems = getItemsByCats(poolAssembly.minorPoolCats || ['char', 'wep']);
            let secondTierId = globalTiers[1]?.id;

            let minorPoolItems = candidateItems.filter(i => 
                i.tierId === secondTierId && 
                CatalogUtils.hasAnyTag(i, poolAssembly.minorPoolTags)
            );

            const grid = document.getElementById('grid-up-minor');
            if (grid) {
                grid.innerHTML = minorPoolItems.map(item => {
                    let isSel = poolAssembly.minorUpNames.includes(item.name);
                    let imgHtml = item.img ? `<img src="${item.img}">` : `<div style="font-size:14px;">${item.category === 'char' ? '👤' : '🗡️'}</div>`;
                    return `
                        <div class="item-select-chip ${isSel ? 'active' : ''}" onclick="toggleUpMinorSelect('${item.name}')">
                            ${imgHtml}
                            <div class="chip-name" title="${getItemName(item)}">${getItemName(item)}</div>
                        </div>
                    `;
                }).join('');
            }
            const countEl = document.getElementById('count-up-minor');
            if (countEl) countEl.innerText = `已选: ${poolAssembly.minorUpNames.length}`;
        }

function initDefaultAssemblyRules() {
    if (!poolAssembly.tierRules) poolAssembly.tierRules = {};
    const allTags = ['up', 'reup', 'custom_offrate', 'std', 'gift', 'normal'];
    // 🌟 动态获取全部大类 ID
    const availableCats = getAvailableCategories().map(c => c.id);
    const defaultCats = availableCats.length > 0 ? availableCats : ['char', 'wep'];

    globalTiers.forEach((tier, idx) => {
        if (!poolAssembly.tierRules[tier.id]) {
            poolAssembly.tierRules[tier.id] = {
                mode: (idx === 0) ? 'up_split' : (idx === globalTiers.length - 1 ? 'flat' : 'up_split'),
                upCats: [...defaultCats],
                offrateCats: [...defaultCats],
                flatCats: [...defaultCats],
                upTags: ['up', 'custom_offrate'],
                offrateTags: ['std', 'normal'],
                tags: [...allTags]
            };
        } else {
            const rule = poolAssembly.tierRules[tier.id];
            if (rule.cats && !rule.upCats) {
                rule.upCats = [...rule.cats];
                rule.offrateCats = [...rule.cats];
                rule.flatCats = [...rule.cats];
            }
        }
    });
}

        function renderCardZeroAssembly() {
            initDefaultAssemblyRules();
            const container = document.getElementById('dynamic-tier-assembly-container');
            if (!container) return;

            let html = '';

            // 🌟 核心：只渲染当前卡池已启用的星级 (tier.enabled === true)
            const activeTiers = globalTiers.filter(tier => {
                const state = poolTierState[tier.id];
                // 如果已初始化 poolTierState，根据 enabled 判断；否则默认开启
                return state ? state.enabled : true;
            });

            activeTiers.forEach(tier => {
                const rule = poolAssembly.tierRules[tier.id];
                if (!rule) return;
                const isSplit = rule.mode === 'up_split';
                const tierColor = tier.color || '#f1c40f';
                const displayTierName = getTierDisplayName(tier);

                html += `
                <div class="assembly-box" style="border-left: 4px solid ${tierColor}; margin-bottom: 18px; background: rgba(0,0,0,0.18);">
                    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; border-bottom: 1px dashed rgba(255,255,255,0.08); padding-bottom: 8px;">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: ${tierColor};"></span>
                            <strong style="color: ${tierColor}; font-size: 15px;">${displayTierName} ${getTrans('cp_sec0_assembly_suffix')}</strong>
                        </div>

                        <div style="display: flex; gap: 15px; font-size: 12px; color: #ddd;">
                            <label style="cursor: pointer; display: flex; align-items: center; gap: 4px;">
                                <input type="radio" name="mode_${tier.id}" value="up_split" ${isSplit ? 'checked' : ''} onchange="changeTierMode('${tier.id}', 'up_split')">
                                <span>${getTrans('cp_sec0_mode_split')}</span>
                            </label>
                            <label style="cursor: pointer; display: flex; align-items: center; gap: 4px;">
                                <input type="radio" name="mode_${tier.id}" value="flat" ${!isSplit ? 'checked' : ''} onchange="changeTierMode('${tier.id}', 'flat')">
                                <span>${getTrans('cp_sec0_mode_flat')}</span>
                            </label>
                        </div>
                    </div>

                    <div id="assembly-content-${tier.id}" style="margin-top: 12px;">
                        ${isSplit ? renderSplitTierHtml(tier, rule) : renderFlatTierHtml(tier, rule)}
                    </div>
                </div>`;
            });

            container.innerHTML = html || `<div style="color: #666; font-size: 12px; padding: 10px;">暂未启用任何稀有度星级</div>`;

            activeTiers.forEach(tier => {
                const rule = poolAssembly.tierRules[tier.id];
                if (!rule) return;
                if (rule.mode === 'up_split') {
                    renderTagCheckboxes(`tags-${tier.id}-up`, rule.upTags || [], (newTags) => {
                        rule.upTags = newTags;
                        refreshTierPreview(tier.id);
                    }, tier.id, rule.upCats);

                    renderTagCheckboxes(`tags-${tier.id}-offrate`, rule.offrateTags || [], (newTags) => {
                        rule.offrateTags = newTags;
                        refreshTierPreview(tier.id);
                    }, tier.id, rule.offrateCats);
                } else {
                    renderTagCheckboxes(`tags-${tier.id}-flat`, rule.tags || [], (newTags) => {
                        rule.tags = newTags;
                        refreshTierPreview(tier.id);
                    }, tier.id, rule.flatCats);
                }

                refreshTierPreview(tier.id);
            });
        }

        function renderSplitTierHtml(tier, rule) {
            const upCats = rule.upCats || ['char'];
            const offCats = rule.offrateCats || ['char', 'wep'];

            return `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <!-- 当期 UP 规则 -->
                <div style="background: rgba(0,0,0,0.15); padding: 12px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.06); display: flex; flex-direction: column; gap: 8px;">
                    <div style="border-bottom: 1px dashed rgba(255,255,255,0.06); padding-bottom: 6px;">
                        <span style="color: ${tier.color}; font-size: 13px; font-weight: bold;">${getTrans('cp_sec0_rule_up')}</span>
                    </div>

                    <div style="display: flex; flex-direction: column; gap: 4px;">
                        <div style="color: #bbb; font-size: 11px;">${getTrans('cp_sec0_cats_label')}</div>
                        <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                            ${renderCategoryCheckboxesHtml(tier.id, 'up', upCats)}
                        </div>
                    </div>

                    <div style="color: #aaa; font-size: 11px; margin-top: 4px;">${getTrans('cp_sec0_up_tags_label')}</div>
                    <div class="tag-select-group" id="tags-${tier.id}-up"></div>
                    
                    <div style="font-size: 11px; color: #888; margin-top: 4px;">
                        ${getTrans('cp_sec0_up_preview')} <span id="preview-${tier.id}-up-count" style="color:${tier.color}; font-weight:bold;">0 件</span>
                    </div>
                    <div id="preview-${tier.id}-up-chips" style="display:flex; gap:4px; flex-wrap:wrap; max-height:60px; overflow-y:auto;"></div>
                </div>

                <!-- 可歪内容规则 -->
                <div style="background: rgba(0,0,0,0.15); padding: 12px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.06); display: flex; flex-direction: column; gap: 8px;">
                    <div style="border-bottom: 1px dashed rgba(255,255,255,0.06); padding-bottom: 6px;">
                        <span style="color: #3498db; font-size: 13px; font-weight: bold;">${getTrans('cp_sec0_rule_offrate')}</span>
                    </div>

                    <div style="display: flex; flex-direction: column; gap: 4px;">
                        <div style="color: #bbb; font-size: 11px;">${getTrans('cp_sec0_cats_label')}</div>
                        <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                            ${renderCategoryCheckboxesHtml(tier.id, 'offrate', offCats)}
                        </div>
                    </div>

                    <div style="color: #aaa; font-size: 11px; margin-top: 4px;">${getTrans('cp_sec0_offrate_tags_label')}</div>
                    <div class="tag-select-group" id="tags-${tier.id}-offrate"></div>

                    <div style="font-size: 11px; color: #888; margin-top: 4px;">
                        ${getTrans('cp_sec0_offrate_preview')} <span id="preview-${tier.id}-offrate-count" style="color:#3498db; font-weight:bold;">0 件</span>
                    </div>
                    <div id="preview-${tier.id}-offrate-chips" style="display:flex; gap:4px; flex-wrap:wrap; max-height:60px; overflow-y:auto;"></div>
                </div>
            </div>`;
        }

        function renderFlatTierHtml(tier, rule) {
            const flatCats = rule.flatCats || ['char', 'wep'];

            return `
            <div style="background: rgba(0,0,0,0.15); padding: 12px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.06); display: flex; flex-direction: column; gap: 8px;">
                <div style="border-bottom: 1px dashed rgba(255,255,255,0.06); padding-bottom: 6px;">
                    <span style="color: #aaa; font-size: 13px; font-weight: bold;">${getTrans('cp_sec0_rule_flat')}</span>
                </div>

                <div style="display: flex; flex-direction: column; gap: 4px;">
                    <div style="color: #bbb; font-size: 11px;">${getTrans('cp_sec0_cats_label')}</div>
                    <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                        ${renderCategoryCheckboxesHtml(tier.id, 'flat', flatCats)}
                    </div>
                </div>

                <div style="color: #aaa; font-size: 11px; margin-top: 4px;">${getTrans('cp_sec0_flat_tags_label')}</div>
                <div class="tag-select-group" id="tags-${tier.id}-flat"></div>

                <div style="font-size: 11px; color: #888; margin-top: 4px;">
                    ${getTrans('cp_sec0_flat_preview')} <span id="preview-${tier.id}-flat-count" style="color:${tier.color}; font-weight:bold;">0 件</span>
                </div>
                <div id="preview-${tier.id}-flat-chips" style="display:flex; gap:4px; flex-wrap:wrap; max-height:60px; overflow-y:auto;"></div>
            </div>`;
        }

        function refreshTierPreview(tierId) {
            const rule = poolAssembly.tierRules[tierId];
            const tier = globalTiers.find(t => t.id === tierId);

            const renderChipList = (elId, countId, items, borderColor) => {
                const countEl = document.getElementById(countId);
                const wrapEl = document.getElementById(elId);
                if (countEl) countEl.innerText = getTrans('cp_sec0_items_count').replace('{count}', items.length);
                if (wrapEl) {
                    wrapEl.innerHTML = items.map(i => {
                        // 🌟 核心：显示对应语言的名称/简称（如 Clare、Lycaon 等）
                        let shortText = getItemShort(i);
                        let fullText = getItemName(i);
                        return `
                            <span style="font-size:10px; background:#1e2126; border:1px solid ${borderColor}; color:#ddd; padding:1px 5px; border-radius:3px;" title="${fullText}">
                                ${shortText}
                            </span>
                        `;
                    }).join('') || `<span style="font-size:10px; color:#666;">${getTrans('cp_sec0_no_matched_items')}</span>`;
                }
            };

            if (rule.mode === 'up_split') {
                const upItems = getItemsByCats(rule.upCats || []).filter(i => 
                    i.tierId === tierId && CatalogUtils.hasAnyTag(i, rule.upTags)
                );
                const offItems = getItemsByCats(rule.offrateCats || []).filter(i => 
                    i.tierId === tierId && CatalogUtils.hasAnyTag(i, rule.offrateTags)
                );
                renderChipList(`preview-${tierId}-up-chips`, `preview-${tierId}-up-count`, upItems, tier.color);
                renderChipList(`preview-${tierId}-offrate-chips`, `preview-${tierId}-offrate-count`, offItems, '#3498db');
            } else {
                const flatItems = getItemsByCats(rule.flatCats || []).filter(i => 
                    i.tierId === tierId && CatalogUtils.hasAnyTag(i, rule.tags)
                );
                renderChipList(`preview-${tierId}-flat-chips`, `preview-${tierId}-flat-count`, flatItems, tier.color);
            }
        }

        window.changeTierMode = function(tierId, mode) {
            poolAssembly.tierRules[tierId].mode = mode;
            renderCardZeroAssembly();
            refreshPreselectModes();
        };

        window.toggleTierCat = function(tierId, cat, isChecked) {
            let cats = poolAssembly.tierRules[tierId].cats;
            if (isChecked && !cats.includes(cat)) cats.push(cat);
            if (!isChecked && cats.includes(cat)) poolAssembly.tierRules[tierId].cats = cats.filter(c => c !== cat);

            const rule = poolAssembly.tierRules[tierId];

            if (rule.mode === 'up_split') {
                renderTagCheckboxes(`tags-${tierId}-up`, rule.upTags || [], (newTags) => {
                    rule.upTags = newTags;
                    refreshTierPreview(tierId);
                }, tierId, rule.cats);

                renderTagCheckboxes(`tags-${tierId}-offrate`, rule.offrateTags || [], (newTags) => {
                    rule.offrateTags = newTags;
                    refreshTierPreview(tierId);
                }, tierId, rule.cats);
            } else {
                renderTagCheckboxes(`tags-${tierId}-flat`, rule.tags || [], (newTags) => {
                    rule.tags = newTags;
                    refreshTierPreview(tierId);
                }, tierId, rule.cats);
            }

            refreshTierPreview(tierId);
        };

        window.toggleBoxCat = function(tierId, boxType, cat, isChecked) {
            const rule = poolAssembly.tierRules[tierId];
            const catProp = boxType === 'up' ? 'upCats' : (boxType === 'offrate' ? 'offrateCats' : 'flatCats');
            
            if (!rule[catProp]) rule[catProp] = [];
            if (isChecked && !rule[catProp].includes(cat)) rule[catProp].push(cat);
            if (!isChecked && rule[catProp].includes(cat)) rule[catProp] = rule[catProp].filter(c => c !== cat);

            if (boxType === 'up') {
                renderTagCheckboxes(`tags-${tierId}-up`, rule.upTags || [], (newTags) => {
                    rule.upTags = newTags;
                    refreshTierPreview(tierId);
                }, tierId, rule.upCats);
            } else if (boxType === 'offrate') {
                renderTagCheckboxes(`tags-${tierId}-offrate`, rule.offrateTags || [], (newTags) => {
                    rule.offrateTags = newTags;
                    refreshTierPreview(tierId);
                }, tierId, rule.offrateCats);
            } else {
                renderTagCheckboxes(`tags-${tierId}-flat`, rule.tags || [], (newTags) => {
                    rule.tags = newTags;
                    refreshTierPreview(tierId);
                }, tierId, rule.flatCats);
            }

            refreshTierPreview(tierId);
        };

        // ==========================================
        // 🌟 通用全卡片展开 / 折叠控制器 (卡片 0 ~ 10)
        // ==========================================
        window.toggleCardSection = function(sectionIndex) {
            const bodyEl = document.getElementById(`card-${sectionIndex}-body`);
            const arrowEl = document.getElementById(`card-${sectionIndex}-arrow`);
            if (!bodyEl) return;

            const isVisible = bodyEl.style.display !== 'none';
            bodyEl.style.display = isVisible ? 'none' : 'block';
     
            if (arrowEl) {
                const key = isVisible ? 'expand' : 'collapse';
                arrowEl.setAttribute('data-i18n', key);
                arrowEl.innerText = getTrans(key);
            }
        };

        window.toggleCardZero = function() {
            toggleCardSection(0);
        };

        // 🌟 1. 辅助生成大类复选框组 HTML（Agent / W-Engine / Bangboo 等）
        function renderCategoryCheckboxesHtml(tierId, boxType, selectedCats = []) {
            const categories = getAvailableCategories();
            return categories.map(c => {
                // 如果英文模式下并且定义了 en 字段，显示英文大类名
                let cName = (sysLang === 'en' && c.en) ? c.en : c.name;
                return `
                <label style="cursor: pointer; display: inline-flex; align-items: center; gap: 4px; font-size: 11.5px; color: #ddd; background: rgba(255,255,255,0.05); padding: 2px 7px; border-radius: 4px; user-select: none;">
                    <input type="checkbox" ${selectedCats.includes(c.id) ? 'checked' : ''} onchange="toggleBoxCat('${tierId}', '${boxType}', '${c.id}', this.checked)">
                    <span>${c.icon || ''} ${cName}</span>
                </label>
                `;
            }).join('');
        }

        // 🌟 2. 渲染吸附标签（读取 tagDefinitions 中的 en / name）
        function renderTagCheckboxes(containerId, activeTags, onChangeCallback, tierId = null, cats = []) {
            const container = document.getElementById(containerId);
            if (!container) return;

            const savedInfo = JSON.parse(localStorage.getItem('GM_Info_' + gameId)) || {};
            const presetSetup = GameData.getPresetSetup(gameId);
            
            // 优先读取当前游戏的 tagDefinitions（如 ZZZ_SETUP_RULES.tagDefinitions）
            const tagDefs = savedInfo.tagDefinitions || presetSetup?.tagDefinitions || {
                up: { name: "限定", en: "Limited", color: "#f1c40f" },
                reup: { name: "不歪", en: "Guaranteed", color: "#f1c40f" },
                custom_offrate: { name: "定制调频", en: "Customized", color: "#e67e22" },
                std: { name: "常驻", en: "Standard", color: "#3498db" },
                gift: { name: "赠送", en: "Gift/Free", color: "#2ecc71" },
                normal: { name: "副产物", en: "Regular", color: "#95a5a6" }
            };

            let candidateItems = [];
            if (tierId) {
                const targetCats = (cats && cats.length > 0) ? cats : ['char', 'wep'];
                candidateItems = getItemsByCats(targetCats).filter(i => i.tierId === tierId);
            }

            let html = '';
            Object.keys(tagDefs).forEach(tagKey => {
                let def = tagDefs[tagKey];

                if (tierId && candidateItems.length > 0) {
                    const hasItems = candidateItems.some(i => (i.tags || []).includes(tagKey));
                    if (!hasItems) return;
                }

                let isChecked = activeTags.includes(tagKey) ? 'checked' : '';
                // 🌟 核心：从 DB 定义中读取对应的 en 或 name
                let tagName = (sysLang === 'en' && def.en) ? def.en : def.name;

                html += `
                    <label style="display:inline-flex; align-items:center; gap:5px; font-size:12px; color:#ddd; cursor:pointer; background:rgba(255,255,255,0.05); padding:4px 8px; border-radius:4px;">
                        <input type="checkbox" value="${tagKey}" ${isChecked} onchange="handleTagGroupChange('${containerId}', this)">
                        <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:${def.color};"></span>
                        <span>${tagName}</span>
                    </label>
                `;
            });

            container.innerHTML = html || `<span style="font-size:11px; color:#666;">${getTrans('cp_sec0_no_matched_tags')}</span>`;
            container._onChange = onChangeCallback;
        }

        window.handleTagGroupChange = function(containerId, cbEl) {
            const container = document.getElementById(containerId);
            const checkedBoxes = Array.from(container.querySelectorAll('input:checked')).map(cb => cb.value);
            if (container._onChange) container._onChange(checkedBoxes);
        };

        function getCatalogItemsByCategories(allowedCats = []) {
            // 此旧接口的 [] 表示全部，且按图鉴顺序取物品，区别于 getItemsByCats。
            const cats = Object.keys(pureCatalog).filter(id => !allowedCats.length || allowedCats.includes(id));
            return CatalogUtils.getItemsByCategories(pureCatalog, cats, { withCategory: false });
        }

        window.toggleUpGoldSelect = function(name) {
            if (document.body.classList.contains('preview-mode')) return;
            if (poolAssembly.targetUpNames.includes(name)) {
                poolAssembly.targetUpNames = poolAssembly.targetUpNames.filter(n => n !== name);
            } else {
                poolAssembly.targetUpNames.push(name);
            }
            renderCardZeroAssembly();
        };

        window.toggleUpMinorSelect = function(name) {
            if (document.body.classList.contains('preview-mode')) return;
            if (poolAssembly.minorUpNames.includes(name)) {
                poolAssembly.minorUpNames = poolAssembly.minorUpNames.filter(n => n !== name);
            } else {
                poolAssembly.minorUpNames.push(name);
            }
            renderCardZeroAssembly();
        };

        function getAvailableRosterPools() {
            return GameData.loadRosterPools(gameId);
        }

        function buildPoolSelectHtml(tierId, selectedPoolId = "") {
            const pools = getAvailableRosterPools();
            const currentLang = localStorage.getItem('GM_Lang') || 'zh';
            let optionsHtml = '';
            
            pools.forEach(p => {
                let displayName = currentLang === 'en' ? (p.en || p.name) : p.name;
                let isSel = (p.id === selectedPoolId) ? 'selected' : '';
                optionsHtml += `<option value="${p.id}" ${isSel}>${p.type === 'up' ? '✨' : '🎫'} ${displayName}</option>`;
            });

            return `
                <div class="sub-pool-select-item" style="display:inline-flex; align-items:center; gap:4px; margin-bottom: 5px;">
                    <select class="input-box select-sub-pool" style="width: auto; max-width: 170px; padding: 6px 8px; font-size: 12px;">
                        <option value="">-- 选择积木池 --</option>
                        ${optionsHtml}
                    </select>
                    <button type="button" class="preview-edit-action btn btn-action-gray" style="padding: 2px 6px; font-size: 11px; color:#ff4757;" onclick="removeSubPoolSelect(this)">✕</button>
                </div>
            `;
        }

        function getActiveTagsFromCardZero(tierId, catId) {
            const rule = poolAssembly.tierRules ? poolAssembly.tierRules[tierId] : null;

            // 1. 获取物品并统一提取 item.tags 或 item.tag
            const candidateItems = getItemsByCats([catId]).filter(i => i.tierId === tierId);
            // 此处沿用旧规则：没有标签的物品属于 normal，不影响其他筛选入口。
            const getItemTags = item => CatalogUtils.getTags(item, { fallback: ['normal'] });

            // 2. 如果卡片0有明确规则，按卡片0已激活的标签筛选
            if (rule) {
                const allActiveCats = rule.cats || [
                    ...(rule.upCats || []),
                    ...(rule.offrateCats || []),
                    ...(rule.flatCats || [])
                ];
                
                if (allActiveCats.includes(catId)) {
                    let poolTags = [];
                    if (rule.mode === 'up_split') {
                        poolTags = [...new Set([...(rule.upTags || []), ...(rule.offrateTags || [])])];
                    } else {
                        poolTags = [...(rule.tags || [])];
                    }

                    const matched = poolTags.filter(t => candidateItems.some(i => getItemTags(i).includes(t)));
                    if (matched.length > 0) return matched;
                }
            }

            // 3. 🌟 核心修复兜底：如果卡片0未筛选出，直接返回该大类与星级下实际存在的全部标签
            const fallbackTags = new Set();
            candidateItems.forEach(i => {
                getItemTags(i).forEach(t => fallbackTags.add(t));
            });
            return Array.from(fallbackTags);
        }

        window.toggleSubCondPreview = function(btnEl, tierId) {
            const sliceEl = btnEl.closest('.sub-condition-slice');
            const drawer = sliceEl.querySelector('.cond-preview-drawer');
            const isHidden = drawer.style.display === 'none';

            drawer.style.display = isHidden ? 'block' : 'none';
            // 🌟 核心 1：展开/收起文本接入国际化
            btnEl.innerHTML = isHidden ? getTrans('cp_btn_toggle_hide') : getTrans('view');
            btnEl.style.color = isHidden ? '#2ecc71' : 'var(--primary)';

            if (isHidden) {
                updateSingleCondPreview(sliceEl, tierId);
            }
        };

        function updateSingleCondPreview(sliceEl, tierId) {
            const catId = sliceEl.querySelector('.select-cond-cat')?.value;
            const checkedTags = Array.from(sliceEl.querySelectorAll('.cb-cond-tag:checked')).map(cb => cb.value);

            const countEl = sliceEl.querySelector('.cond-preview-count');
            const chipsEl = sliceEl.querySelector('.cond-preview-chips');
            if (!countEl || !chipsEl) return;

            if (!catId || checkedTags.length === 0) {
                countEl.innerText = '0';
                chipsEl.innerHTML = `<span style="font-size: 10px; color: #666;">${getTrans('cp_sec1_no_tags_checked')}</span>`;
                return;
            }

            const matchedItems = getItemsByCats([catId]).filter(item => 
                item.tierId === tierId && CatalogUtils.hasAnyTag(item, checkedTags)
            );

            countEl.innerText = matchedItems.length;
            // 🌟 核心 2：气泡框内展示对应语言的简称/全名（英文模式下显示 Billy, Corin, Ben 等）
            chipsEl.innerHTML = matchedItems.map(item => {
                let displayName = getItemShort(item);
                let fullTitle = getItemName(item);
                return `
                    <span style="font-size: 10px; background: #1a1c21; border: 1px solid rgba(255,255,255,0.12); color: #ccc; padding: 1px 5px; border-radius: 3px;" title="${fullTitle}">
                        ${displayName}
                    </span>
                `;
            }).join('') || `<span style="font-size: 10px; color: #666;">${getTrans('cp_sec1_no_items_absorbed')}</span>`;
        }

        window.onSubCondTagChange = function(cbEl, tierId) {
            const sliceEl = cbEl.closest('.sub-condition-slice');
            const drawer = sliceEl.querySelector('.cond-preview-drawer');
            if (drawer && drawer.style.display !== 'none') {
                updateSingleCondPreview(sliceEl, tierId);
            }
        };

        window.requestRemoveSubGroup = function(btnEl) {
            if (document.body.classList.contains('preview-mode')) return;
            openActionConfirm(getTrans('cp_sec1_del_group_confirm'), () => {
                const row = btnEl.closest('.sub-prob-group-row');
                if (row) row.remove();
                markPageDirty();
            });
        };

        window.onSubCondCatChange = function(selectEl, tierId) {
            const sliceEl = selectEl.closest('.sub-condition-slice');
            if (sliceEl.querySelector('.cond-preview-drawer')?.style.display !== 'none') {
                updateSingleCondPreview(sliceEl, tierId);
            }

            const catId = selectEl.value;
            const tagsWrap = sliceEl.querySelector('.cond-tags-wrap');

            const validTags = getActiveTagsFromCardZero(tierId, catId);
            const savedInfo = JSON.parse(localStorage.getItem('GM_Info_' + gameId)) || {};
            const tagDefs = savedInfo.tagDefinitions || {};

            let html = validTags.map(tagKey => {
                const def = tagDefs[tagKey] || { name: tagKey, color: '#888' };
                return `
                    <label style="display:inline-flex; align-items:center; gap:4px; font-size:11px; color:#ddd; cursor:pointer; background:rgba(255,255,255,0.05); padding:2px 6px; border-radius:3px;">
                        <input type="checkbox" class="cb-cond-tag" value="${tagKey}">
                        <span style="display:inline-block; width:6px; height:6px; border-radius:50%; background:${def.color};"></span>
                        <span>${sysLang === 'en' && def.en ? def.en : def.name}</span>
                    </label>
                `;
            }).join('') || `<span style="font-size:11px; color:#666;">（卡片 0 该类型无勾选有效标签）</span>`;

            tagsWrap.innerHTML = html;
        };

        //删除软保底增幅区间
        window.requestRemoveSoftSegment = function(btnEl) {
            if (document.body.classList.contains('preview-mode')) return;
            openActionConfirm(getTrans('cp_sec2_del_segment_confirm'), () => {
                const segRow = btnEl.closest('.soft-segment-row');
                if (segRow) segRow.remove();
            });
        };

        window.togglePityRowUp = function(cbEl) {
            const row = cbEl.closest('.unified-pity-row');
            const rateWrap = row.querySelector('.pity-uprate-wrap');
            if (rateWrap) rateWrap.style.display = cbEl.checked ? 'inline-flex' : 'none';
        };

        window.togglePityRowGuarantee = function(cbEl) {
            const row = cbEl.closest('.unified-pity-row');
            const wrap = row.querySelector('.pity-guarantee-limit-wrap');
            if (wrap) wrap.style.display = cbEl.checked ? 'inline-flex' : 'none';
        };

        window.appendSubConditionSlice = function(btnEl, tierId) {
            const container = btnEl.previousElementSibling;
            container.insertAdjacentHTML('beforeend', buildSubConditionSliceHtml(tierId, null));
        };

        window.removeSubConditionSlice = function(btnEl) {
            if (document.body.classList.contains('preview-mode')) return;
            openActionConfirm(getTrans('cp_sec1_del_slice_confirm'), () => {
                const sliceEl = btnEl.closest('.sub-condition-slice');
                const container = sliceEl.closest('.sub-slices-container');
                const groupRow = btnEl.closest('.sub-prob-group-row');

                sliceEl.remove();

                if (container && container.querySelectorAll('.sub-condition-slice').length === 0) {
                    if (groupRow) groupRow.remove();
                }
                markPageDirty();
            });
        };

        window.refreshSubProbSummary = function() {};

        function renderTiersUI() {
            const container = document.getElementById('tiers-container');
            if (!container) return;

            let html = '';
            let totalProb = 0;

            globalTiers.forEach((t) => {
                let state = poolTierState[t.id];
                if (state.enabled) totalProb += state.prob;

                const isGold = selectedGoldIds.includes(t.id);
                const tierColor = t.color || '#f1c40f';
                // 🌟 1. 动态获取星级名称（S-Rank / A-Rank / B-Rank 等）
                const displayTierName = getTierDisplayName(t);

                const activeBorderStyle = isGold ? `border-color: ${tierColor}; box-shadow: 0 0 8px ${tierColor}33; background: ${tierColor}18;` : 'border-color: rgba(255,255,255,0.12); background: rgba(0,0,0,0.2);';
                const activeTextStyle = isGold ? `color: ${tierColor}; font-weight: bold;` : 'color: #777; font-weight: normal;';
                const hasSubProbs = Array.isArray(state.subProbs) && state.subProbs.length > 0;
                
                let subGroupsHtml = hasSubProbs 
                    ? state.subProbs.map(g => buildSubGroupRowHtml(t.id, g)).join('')
                    : buildSubGroupRowHtml(t.id) + buildSubGroupRowHtml(t.id);

                html += `
                <div class="tier-row ${!state.enabled ? 'disabled' : ''}" style="flex-direction: column; align-items: stretch; gap: 8px;">
                    <div style="display:flex; gap:12px; align-items:center; flex-wrap: wrap;">
                        <label class="switch-container">
                            <input type="checkbox" class="switch-input" ${state.enabled ? 'checked' : ''} onchange="toggleTierEnabled('${t.id}', this.checked)">
                            <div class="switch-slider"></div>
                        </label>

                        <div class="tier-badge" style="background-color: ${t.color}; min-width: 42px;">${displayTierName}</div>

                        <label class="gold-tier-toggle-label" style="display: inline-flex; align-items: center; gap: 6px; font-size: 12px; cursor: pointer; user-select: none; padding: 4px 10px; border-radius: 6px; border: 1.5px solid; transition: all 0.2s ease; ${activeBorderStyle}">
                            <input type="checkbox" 
                                   class="toggle-checkbox input-gold-checkbox" 
                                   value="${t.id}" 
                                   ${isGold ? 'checked' : ''} 
                                   ${!state.enabled ? 'disabled' : ''} 
                                   style="accent-color: ${tierColor}; width: 15px; height: 15px; cursor: pointer;"
                                   onchange="handleGoldChange('${t.id}', this.checked)">
                            <span style="${activeTextStyle}">
                                ${getTrans('cp_sec1_btn_set_gold')}
                            </span>
                        </label>
                        
                        <div style="margin-left: auto; display:flex; align-items:center; gap: 10px;">
                            <button type="button" class="btn btn-action-gray btn-sub-prob-toggle" 
                                    style="padding: 4px 10px; font-size: 12px; border-color: ${hasSubProbs ? 'var(--primary)' : '#555'}; color: ${hasSubProbs ? 'var(--primary)' : '#aaa'};" 
                                    onclick="toggleSubProbDrawer('${t.id}')" ${!state.enabled ? 'disabled' : ''}>
                                🏷️ ${getTrans('cp_js_sub_prob_btn')}
                            </button>

                            <span style="color: #888; font-size: 13px;">${getTrans('cp_js_prob')}</span>
                            <input type="number" class="input-box input-tier-prob" data-tier-id="${t.id}" value="${state.prob}" ${!state.enabled ? 'disabled' : ''} onchange="updateTierProb('${t.id}', this.value)" style="width: 90px; text-align: right; padding: 7px;">
                            <span style="color: #888;">%</span>
                        </div>
                    </div>

                    <div id="sub-prob-drawer-${t.id}" class="sub-prob-drawer" style="display: ${hasSubProbs ? 'flex' : 'none'}; flex-direction: column; background: rgba(0,0,0,0.25); border: 1px dashed rgba(255,255,255,0.15); border-radius: 8px; padding: 12px 16px; margin-top: 4px;">
                        <div style="font-size: 12px; color: #aaa; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center;">
                            <span><strong>${getTrans('cp_js_sub_prob_title')}</strong> <span style="font-size: 11px; color:#888;">${getTrans('cp_js_sub_prob_tip')}</span></span>
                            <button type="button" class="preview-edit-action btn btn-action-gray" style="padding: 2px 8px; font-size: 11px; color: #ff4757;" onclick="clearSubProb('${t.id}')">${getTrans('cp_sec1_clear_sub')}</button>
                        </div>
                        <div id="sub-groups-wrap-${t.id}">
                            ${subGroupsHtml}
                        </div>
                        <div style="margin-top: 10px; display: flex; justify-content: flex-start;">
                            <button type="button" class="btn btn-action-gray" style="font-size: 12px; padding: 4px 12px; border-style: dashed; color: var(--primary); border-color: var(--primary);" onclick="appendSubGroupRow('${t.id}')">
                                ${getTrans('cp_js_sub_add_group')}
                            </button>
                        </div>
                    </div>
                </div>`;
            });

            container.innerHTML = html;
            
            const totalDisplay = document.getElementById('display-total-prob');
            if (totalDisplay) {
                totalDisplay.innerText = totalProb.toFixed(3);
                totalDisplay.style.color = Math.abs(totalProb - 100) < 0.01 ? '#2ecc71' : '#e74c3c';
            }

            syncMinorPityDropdowns();
        }

        function buildSubConditionSliceHtml(tierId, cond = null) {
            // 🌟 2. 获取大类，并动态选择显示英文还是中文
            const categories = getAvailableCategories();
            const currentCat = cond ? cond.cat : (categories[0]?.id || 'char');
            const selectedTags = cond ? (cond.tags || []) : [];

            let catOptions = categories.map(c => {
                let catDisplayName = (sysLang === 'en' && c.en) ? c.en : c.name;
                return `<option value="${c.id}" ${c.id === currentCat ? 'selected' : ''}>${c.icon || ''} ${catDisplayName}</option>`;
            }).join('');

            const validTags = getActiveTagsFromCardZero(tierId, currentCat);
            const savedInfo = JSON.parse(localStorage.getItem('GM_Info_' + gameId)) || {};
            const presetSetup = GameData.getPresetSetup(gameId);
            const tagDefs = savedInfo.tagDefinitions || presetSetup?.tagDefinitions || {};

            // 🌟 3. 标签名称根据当前语言读取 def.en 或 def.name
            let tagsHtml = validTags.map(tagKey => {
                const def = tagDefs[tagKey] || { name: tagKey, color: '#888' };
                const isChecked = selectedTags.includes(tagKey) ? 'checked' : '';
                let displayTagName = (sysLang === 'en' && def.en) ? def.en : def.name;
                return `
                    <label style="display:inline-flex; align-items:center; gap:4px; font-size:11px; color:#ddd; cursor:pointer; background:rgba(255,255,255,0.05); padding:2px 6px; border-radius:3px;">
                        <input type="checkbox" class="cb-cond-tag" value="${tagKey}" ${isChecked} onchange="onSubCondTagChange(this, '${tierId}')">
                        <span style="display:inline-block; width:6px; height:6px; border-radius:50%; background:${def.color};"></span>
                        <span>${displayTagName}</span>
                    </label>
                `;
            }).join('') || `<span style="font-size:11px; color:#666;">${getTrans('cp_sec0_no_matched_tags')}</span>`;

            return `
            <div class="sub-condition-slice" style="margin-bottom: 6px; background: rgba(0,0,0,0.2); padding: 6px 10px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.05);">
                <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                    <select class="input-box select-cond-cat" style="width: 115px; padding: 4px 6px; font-size: 12px;" onchange="onSubCondCatChange(this, '${tierId}')">
                        ${catOptions}
                    </select>
                    <span style="color: #666; font-size: 11px;">${getTrans('match_tags')}</span>
                    <div class="cond-tags-wrap" style="display: inline-flex; gap: 6px; flex-wrap: wrap; align-items: center;">
                        ${tagsHtml}
                    </div>

                    <div style="margin-left: auto; display: inline-flex; align-items: center; gap: 6px;">
                        <button type="button" class="btn btn-action-gray btn-toggle-cond-preview" 
                                style="padding: 2px 7px; font-size: 11px; color: var(--primary); border-color: rgba(255,255,255,0.15);" 
                                onclick="toggleSubCondPreview(this, '${tierId}')">
                            ${getTrans('view')}
                        </button>
                        <button type="button" class="preview-edit-action btn btn-action-gray" 
                                style="padding: 1px 6px; font-size: 11px; color: #ff4757;" 
                                onclick="removeSubConditionSlice(this)">✕</button>
                    </div>
                </div>

                <div class="cond-preview-drawer" style="display: none; margin-top: 8px; padding-top: 8px; border-top: 1px dashed rgba(255,255,255,0.08);">
                    <div style="font-size: 11px; color: #888; margin-bottom: 4px;">
                        ${getTrans('cp_sec1_current_cond_hit').replace('{count}', '<span class="cond-preview-count" style="color: var(--primary); font-weight: bold;">0</span>')}
                    </div>
                    <div class="cond-preview-chips" style="display: flex; gap: 4px; flex-wrap: wrap; max-height: 80px; overflow-y: auto;"></div>
                </div>
            </div>
            `;
        }

        function buildSubGroupRowHtml(tierId, group = null) {
            const probVal = group ? group.prob : '';
            let slicesHtml = '';

            if (group && Array.isArray(group.conditions) && group.conditions.length > 0) {
                slicesHtml = group.conditions.map(c => buildSubConditionSliceHtml(tierId, c)).join('');
            } else {
                slicesHtml = buildSubConditionSliceHtml(tierId, null);
            }

            return `
            <div class="sub-prob-group-row" style="display: flex; justify-content: space-between; align-items: flex-start; gap: 15px; padding: 12px 0; border-bottom: 1px dashed rgba(255,255,255,0.08);">
                <div style="flex: 1; min-width: 0;">
                    <div class="sub-slices-container">
                        ${slicesHtml}
                    </div>
                    <button type="button" class="btn btn-action-gray" style="padding: 3px 8px; font-size: 11px; color: var(--primary); border-style: dashed; margin-top: 4px;" onclick="appendSubConditionSlice(this, '${tierId}')">
                        ${getTrans('cp_sec1_add_more_slices')}
                    </button>
                </div>
                <div style="flex-shrink: 0; display: flex; align-items: center; gap: 8px; margin-left: auto; padding-top: 6px;">
                    <span style="color: #aaa; font-size: 12px;">${getTrans('cp_sec1_abs_prob_label')}</span>
                    <!-- 🌟 去除 placeholder="如: 2.350"，保持输入框干净 -->
                    <input type="number" step="0.001" class="input-box input-sub-group-prob" value="${probVal}" style="width: 85px; text-align: right; padding: 6px;">
                    <span style="color: #888; font-size: 13px;">%</span>
                    <button type="button" class="preview-edit-action btn btn-action-gray" 
                        style="padding: 4px 8px; font-size: 11px; color: #ff4757;" 
                        onclick="requestRemoveSubGroup(this)">
                        ${getTrans('cp_sec1_del_group')}
                    </button>
                </div>
            </div>
            `;
        }

        window.onSubCondCatChange = function(selectEl, tierId) {
            const sliceEl = selectEl.closest('.sub-condition-slice');
            if (sliceEl.querySelector('.cond-preview-drawer')?.style.display !== 'none') {
                updateSingleCondPreview(sliceEl, tierId);
            }

            const catId = selectEl.value;
            const tagsWrap = sliceEl.querySelector('.cond-tags-wrap');

            const validTags = getActiveTagsFromCardZero(tierId, catId);
            const savedInfo = JSON.parse(localStorage.getItem('GM_Info_' + gameId)) || {};
            const presetSetup = GameData.getPresetSetup(gameId);
            const tagDefs = savedInfo.tagDefinitions || presetSetup?.tagDefinitions || {};

            let html = validTags.map(tagKey => {
                const def = tagDefs[tagKey] || { name: tagKey, color: '#888' };
                let displayTagName = (sysLang === 'en' && def.en) ? def.en : def.name;
                return `
                    <label style="display:inline-flex; align-items:center; gap:4px; font-size:11px; color:#ddd; cursor:pointer; background:rgba(255,255,255,0.05); padding:2px 6px; border-radius:3px;">
                        <input type="checkbox" class="cb-cond-tag" value="${tagKey}">
                        <span style="display:inline-block; width:6px; height:6px; border-radius:50%; background:${def.color};"></span>
                        <span>${displayTagName}</span>
                    </label>
                `;
            }).join('') || `<span style="font-size:11px; color:#666;">${getTrans('cp_sec0_no_matched_tags')}</span>`;

            tagsWrap.innerHTML = html;
        };

        window.toggleSubProbDrawer = function(tierId) {
            const isPreview = document.body.classList.contains('preview-mode');
            const state = poolTierState[tierId];
            const hasSubProbs = Array.isArray(state?.subProbs) && state.subProbs.length > 0;

            if (isPreview && !hasSubProbs) return;
            
            const drawer = document.getElementById(`sub-prob-drawer-${tierId}`);
            if (!drawer) return;
            drawer.style.display = drawer.style.display === 'none' ? 'flex' : 'none';
        };

        window.clearSubProb = function(tierId) {
            const tier = globalTiers.find(t => t.id === tierId);
            const tierDisplayName = getTierDisplayName(tier);

            const confirmMsg = getTrans('cp_sec1_clear_sub_confirm').replace('{tier}', tierDisplayName);
            openActionConfirm(confirmMsg, () => {
                poolTierState[tierId].subProbs = null;
                markPageDirty();
                renderTiersUI();
            });
        };

        window.appendSubGroupRow = function(tierId) {
            const wrap = document.getElementById(`sub-groups-wrap-${tierId}`);
            if (!wrap) return;
            wrap.insertAdjacentHTML('beforeend', buildSubGroupRowHtml(tierId));
        };

        window.appendSubPoolSelect = function(btnEl, tierId) {
            btnEl.insertAdjacentHTML('beforebegin', buildPoolSelectHtml(tierId));
        };

        window.removeSubPoolSelect = function(btnEl) {
            const container = btnEl.closest('.sub-pools-container');
            btnEl.parentElement.remove();
            if (container.querySelectorAll('.sub-pool-select-item').length === 0) {
                const addBtn = container.querySelector('button');
                addBtn.insertAdjacentHTML('beforebegin', buildPoolSelectHtml());
            }
        };

        window.updateTierProb = function(id, value) { poolTierState[id].prob = parseFloat(value) || 0; renderTiersUI(); };
        window.toggleTierEnabled = function(tierId, isEnabled) {
            poolTierState[tierId].enabled = isEnabled;
            if (!isEnabled) {
                poolTierState[tierId].prob = 0;
                selectedGoldIds = selectedGoldIds.filter(id => id !== tierId);
            }
            renderTiersUI();
            
            // 🌟 核心联动：卡片 2 开关变动后，立刻同步刷新卡片 0 与卡片 10
            renderCardZeroAssembly();
            if (document.getElementById('input-preselect-enable')?.checked) {
                renderTierPreselectUI();
            }
        };

        window.handleGoldChange = function(id, isChecked) {
            if (isChecked) {
                if (!selectedGoldIds.includes(id)) selectedGoldIds.push(id);
            } else {
                selectedGoldIds = selectedGoldIds.filter(gid => gid !== id);
            }
            renderTiersUI();
        };

        function syncMinorPityDropdowns() {
            document.querySelectorAll('.input-minor-tier').forEach(select => {
                let currentVal = select.value;
                let optionsHtml = '';
                globalTiers.forEach(t => {
                    if (poolTierState[t.id]?.enabled && !selectedGoldIds.includes(t.id)) {
                        let selected = (currentVal === t.id) ? 'selected' : '';
                        optionsHtml += `<option value="${t.id}" ${selected} style="color:${t.color}">${getTierDisplayName(t)}</option>`;
                    }
                });
                select.innerHTML = optionsHtml || `<option value="">无（非金副产物）</option>`;
            });
        }

        function appendMinorPityRow(tierId = "", pulls = 10, resetOnHit = true, enableUp = false, upMin = 0, upMax = 6, upRate = "", useGuarantee = false, guaranteeLimit = 1) {
            const container = document.getElementById('minor-pities-container');
            const row = document.createElement('div');
            row.className = 'minor-pity-row';
            row.style = "display:flex; gap:10px; align-items:center; background: rgba(0,0,0,0.2); padding: 12px; border-radius: 8px; margin-bottom: 10px; border: 1px solid var(--border); flex-wrap:wrap;";

            let optionsHtml = '';
            globalTiers.forEach(t => {
                if (poolTierState[t.id]?.enabled && !selectedGoldIds.includes(t.id)) {
                    let selected = (tierId === t.id) ? 'selected' : '';
                    optionsHtml += `<option value="${t.id}" ${selected} style="color:${t.color}">${getTierDisplayName(t)}</option>`;
                }
            });

            row.innerHTML = `
                <div style="display: flex; align-items: center; gap: 8px; width: 100%;">
                    <span style="color:#aaa; font-size:14px;">累计满</span>
                    <input type="number" class="input-minor-pulls input-box" style="width:70px; padding:6px;" value="${pulls}">
                    <span style="color:#aaa; font-size:14px;">抽必定出</span>
                    <select class="input-minor-tier input-box" style="width:100px;">${optionsHtml || `<option value="">无</option>`}</select>
                    
                    <label style="display:flex; align-items:center; gap:5px; margin-left:10px; color:#aaa; font-size:13px; cursor:pointer;">
                        <input type="checkbox" class="toggle-checkbox input-minor-reset" ${resetOnHit ? 'checked' : ''}> 提前抽出重置
                    </label>

                    <button class="preview-edit-action btn btn-action-gray" style="margin-left:auto; color:#ff4757; padding:4px 8px;" onclick="this.parentElement.parentElement.remove()">✕</button>
                </div>
            `;
            container.appendChild(row);
        }

        function togglePreselectPanel() { 
            const isChecked = document.getElementById('input-preselect-enable').checked;
            const panel = document.getElementById('preselect-settings-panel');
            panel.style.display = isChecked ? 'block' : 'none'; 
            if (isChecked) {
                renderTierPreselectUI();
                syncSpecPreselectVisibility();
            }
        }

        function toggleSoftPityPanel() { document.getElementById('soft-pity-settings').style.display = document.getElementById('input-enable-soft-pity').checked ? 'block' : 'none'; }
        
        function toggleSpecPanel() { 
            const isChecked = document.getElementById('input-spec-enable')?.checked || false;
            const panel = document.getElementById('spec-settings-panel');
            if (panel) panel.style.display = isChecked ? 'block' : 'none'; 

            const container = document.getElementById('spec-rules-container');
            if (isChecked && container && container.children.length === 0) {
                appendSpecRuleRow();
            }

            if (!isChecked) {
                const minInput = document.getElementById('input-pre-spec-min');
                const maxInput = document.getElementById('input-pre-spec-max');
                if (minInput) minInput.value = '0';
                if (maxInput) maxInput.value = '';
            }

            syncSpecPreselectVisibility();
        }

        function syncSpecPreselectVisibility() {
            const isSpecOn = document.getElementById('input-spec-enable')?.checked || false;
            const isPreselectOn = document.getElementById('input-preselect-enable')?.checked || false;
            const specBlock = document.getElementById('spec-preselect-block');

            if (specBlock) {
                const shouldShow = isSpecOn && isPreselectOn;
                specBlock.style.display = shouldShow ? 'block' : 'none';
            }
        }

        function toggleRescuePanel() {
            const isChecked = document.getElementById('input-enable-rescue').checked;
            document.getElementById('rescue-settings-panel').style.display = isChecked ? 'block' : 'none';
            syncRotationInheritVisibility();
        }

        function toggleMinorPanel() { document.getElementById('minor-settings-panel').style.display = document.getElementById('input-enable-minor').checked ? 'block' : 'none'; }
        
        function toggleSparkPanel() { 
            const isChecked = document.getElementById('input-enable-spark').checked;
            document.getElementById('spark-settings-panel').style.display = isChecked ? 'block' : 'none'; 
            const container = document.getElementById('spark-rules-container');
            if (isChecked && container && container.children.length === 0) {
                appendSparkRuleRow();
                syncRotationInheritVisibility();
            }
        }

        function toggleEarlyUpPanel() { 
            const isChecked = document.getElementById('input-enable-early-up').checked;
            document.getElementById('early-up-settings-panel').style.display = isChecked ? 'block' : 'none'; 
            const container = document.getElementById('early-up-rules-container');
            if (isChecked && container && container.children.length === 0) {
                appendEarlyUpRow();
                syncRotationInheritVisibility();
            }
        }

        function toggleCatSeqPanel() { 
            const isChecked = document.getElementById('input-enable-cat-seq').checked;
            document.getElementById('cat-seq-settings-panel').style.display = isChecked ? 'block' : 'none'; 
            const container = document.getElementById('cat-seq-rules-container');
            if (isChecked && container && container.children.length === 0) {
                appendCatSeqRow();
                syncRotationInheritVisibility();
            }
        }

        function toggleGiftPanel() { 
            const isChecked = document.getElementById('input-enable-gift').checked;
            document.getElementById('gift-settings-panel').style.display = isChecked ? 'block' : 'none'; 
            const container = document.getElementById('gift-rules-container');
            if (isChecked && container && container.children.length === 0) {
                appendGiftRuleRow();
                syncRotationInheritVisibility();
            }
        }

        function appendSoftPityRuleRow(start = "", end = "", inc = "") {
            const container = document.getElementById('soft-rules-container');
            const row = document.createElement('div');
            row.className = 'soft-rule-row';
            row.style = "display:flex; gap:10px; align-items:center; background: rgba(0,0,0,0.2); padding: 10px; border-radius: 8px; margin-bottom: 8px; border: 1px solid var(--border);";
            row.innerHTML = `<span style="color:#aaa; font-size:14px;">第</span><input type="number" class="input-soft-start input-box" style="width:70px; padding:6px;" value="${start}" placeholder="起始"><span style="color:#aaa; font-size:14px;">-</span><input type="number" class="input-soft-end input-box" style="width:70px; padding:6px;" value="${end}" placeholder="结束"><span style="color:#aaa; font-size:14px;">抽，每次增加</span><input type="number" class="input-soft-inc input-box" style="width:80px; padding:6px;" value="${inc}" placeholder="概率%"><button class="preview-edit-action btn btn-action-gray" style="margin-left:auto; color:#ff4757;" onclick="this.parentElement.remove()">✕</button>`;
            container.appendChild(row);
        }

        // 🌟 1. 新增：当勾选/取消勾选允许大类时，同时刷新标签和候选预览
        window.onSparkCatChange = function(rowId) {
            const row = document.getElementById(rowId);
            if (!row) return;

            // 获取当前已经被勾选的标签，避免重新渲染时丢失选中状态
            const currentCheckedTags = Array.from(row.querySelectorAll('.cb-spark-tag:checked')).map(cb => cb.value);
            renderSparkRowTags(rowId, currentCheckedTags);
            refreshSparkRowPreview(rowId);
        };

        // 🌟 2. 替换 appendSparkRuleRow：给分类复选框绑定 onSparkCatChange
        function appendSparkRuleRow(limit = "", type = "once", behavior = {}) {
            const container = document.getElementById('spark-rules-container');
            if (!container) return;

            const rowId = 'spark_row_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
            const row = document.createElement('div');
            row.id = rowId;
            row.className = 'spark-rule-row';
            row.style = "display: flex; flex-direction: column; gap: 12px; background: rgba(0,0,0,0.2); border: 1px solid var(--border); border-left: 4px solid #8e44ad; border-radius: 8px; padding: 14px 16px; margin-bottom: 12px;";

            const targetType = behavior.targetType || "random_up";
            const upIndex = behavior.upIndex ?? 1;
            const cancelOnHit = behavior.cancelOnHit ?? behavior.cancelOnUp ?? false;
            const noReset = behavior.noReset ?? false;
            const isSelectable = behavior.isSelectable ?? (behavior.deliverMode === 'selectable');

            const filterTier = behavior.targetTier || (globalTiers[0]?.id || 'tier_S');
            const filterCats = Array.isArray(behavior.targetCats) && behavior.targetCats.length > 0 ? behavior.targetCats : ['char'];
            const filterTags = Array.isArray(behavior.targetTags) ? behavior.targetTags : ['std'];

            let tierOptions = '';
            globalTiers.forEach(t => {
                let displayTierName = getTierDisplayName(t);
                tierOptions += `<option value="${t.id}" ${t.id === filterTier ? 'selected' : ''} style="color:${t.color};">${displayTierName}</option>`;
            });

            const categories = getAvailableCategories();
            let catsHtml = categories.map(c => {
                let cName = (sysLang === 'en' && c.en) ? c.en : c.name;
                return `
                <label style="cursor: pointer; display: inline-flex; align-items: center; gap: 4px; font-size: 12px; color: #ddd;">
                    <!-- 🌟 核心：改成 onchange="onSparkCatChange('${rowId}')" 及时联动标签 -->
                    <input type="checkbox" class="cb-spark-cat" value="${c.id}" ${filterCats.includes(c.id) ? 'checked' : ''} onchange="onSparkCatChange('${rowId}')">
                    <span>${c.icon || ''} ${cName}</span>
                </label>
                `;
            }).join('');

            row.innerHTML = `
                <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
                    <span style="color: #aaa; font-size: 13px;">${getTrans('cp_sec7_reach')}</span>
                    <input type="number" class="input-spark-limit input-box" style="width: 75px; text-align: center; padding: 5px;" value="${limit}">
                    <span style="color: #aaa; font-size: 13px;">${getTrans('cp_sec7_trigger_label')}</span>
                    <select class="input-spark-type input-box" style="width: 95px; padding: 5px;">
                        <option value="once" ${type === 'once' ? 'selected' : ''}>${getTrans('once')}</option>
                        <option value="loop" ${type === 'loop' ? 'selected' : ''}>${getTrans('loop')}</option>
                    </select>

                    <span style="color: #8e44ad; font-size: 13px; font-weight: bold; margin-left: 5px;">${getTrans('cp_sec7_target_prefix')}</span>
                    <select class="input-spark-target-type input-box" style="width: 190px; padding: 5px;" onchange="onSparkTargetTypeChange(this, '${rowId}')">
                        <option value="random_up" ${targetType === 'random_up' ? 'selected' : ''}>${getTrans('cp_sec7_target_random_up')}</option>
                        <option value="up_index" ${targetType === 'up_index' ? 'selected' : ''}>${getTrans('cp_sec7_target_up_index')}</option>
                        <option value="custom_filter" ${targetType === 'custom_filter' ? 'selected' : ''}>${getTrans('cp_sec7_target_custom_filter')}</option>
                    </select>

                    <div class="spark-up-idx-wrap" style="display: ${targetType === 'up_index' ? 'inline-flex' : 'none'}; align-items: center; gap: 4px;">
                        <span style="color: #aaa; font-size: 13px;">${getTrans('cp_sec7_up_index_prefix')}</span>
                        <input type="number" class="input-spark-up-index input-box" style="width: 45px; text-align: center; padding: 5px;" min="1" value="${upIndex}">
                        <span style="color: #aaa; font-size: 13px;">${getTrans('cp_sec7_up_index_suffix')}</span>
                    </div>

                    <button type="button" class="preview-edit-action btn btn-action-gray" style="margin-left: auto; color: #ff4757; padding: 2px 8px; font-size: 12px;" onclick="requestRemoveSparkRow(this)">
                        ${getTrans('delete_rule')}
                    </button>
                </div>

                <div class="spark-filter-drawer" style="display: ${targetType === 'custom_filter' ? 'flex' : 'none'}; flex-direction: column; gap: 8px; background: rgba(0,0,0,0.22); border: 1px dashed rgba(142,68,173,0.4); border-radius: 6px; padding: 10px 14px;">
                    <div style="display: flex; align-items: center; gap: 15px; flex-wrap: wrap;">
                        <div style="display: flex; align-items: center; gap: 6px;">
                            <span style="color: #bbb; font-size: 12px; font-weight: bold;">${getTrans('target_tier')}</span>
                            <select class="input-box select-spark-tier" style="padding: 3px 8px; font-size: 12px;" onchange="onSparkTierChange('${rowId}')">
                                ${tierOptions}
                            </select>
                        </div>

                        <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                            <span style="color: #bbb; font-size: 12px; font-weight: bold;">${getTrans('cp_sec7_lbl_cats')}</span>
                            ${catsHtml}
                        </div>

                        <div style="margin-left: auto; display: flex; align-items: center; gap: 8px;">
                            <span style="color: #f1c40f; font-size: 12px; font-weight: bold;">${getTrans('cp_sec7_lbl_deliver')}</span>
                            <select class="input-box select-spark-deliver-mode" style="padding: 3px 8px; font-size: 12px;">
                                <option value="random" ${!isSelectable ? 'selected' : ''}>${getTrans('cp_sec7_deliver_random')}</option>
                                <option value="selectable" ${isSelectable ? 'selected' : ''}>${getTrans('cp_sec7_deliver_select')}</option>
                            </select>
                        </div>
                    </div>

                    <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-top: 4px;">
                        <span style="color: #8e44ad; font-size: 12px; font-weight: bold;">${getTrans('match_tags')}</span>
                        <div class="spark-tags-container" style="display: inline-flex; gap: 6px; flex-wrap: wrap;"></div>
                    </div>

                    <div style="display: flex; align-items: center; gap: 8px; border-top: 1px dashed rgba(255,255,255,0.06); padding-top: 6px; margin-top: 2px;">
                        <span style="font-size: 11px; color: #888;">${getTrans('cp_sec7_hit_preview').replace('{count}', '<span class="spark-preview-count" style="color:#8e44ad; font-weight:bold;">0</span>')}</span>
                        <div class="spark-preview-chips" style="display: flex; gap: 4px; flex-wrap: wrap; max-height: 55px; overflow-y: auto;"></div>
                    </div>
                </div>

                <div style="display: flex; gap: 20px; font-size: 12px; color: #ccc; padding-top: 6px; border-top: 1px dashed rgba(255,255,255,0.06); flex-wrap: wrap;">
                    <label style="display: flex; align-items: center; gap: 5px; cursor: pointer;">
                        <input type="checkbox" class="input-spark-cancel-on-hit toggle-checkbox" ${cancelOnHit ? 'checked' : ''}>
                        <span>${getTrans('cp_sec7_cancel_on_hit')}</span>
                    </label>
                    <label style="display: flex; align-items: center; gap: 5px; cursor: pointer;">
                        <input type="checkbox" class="input-spark-no-reset toggle-checkbox" ${noReset ? 'checked' : ''}>
                        <span>${getTrans('cp_sec7_no_reset')}</span>
                    </label>
                </div>
            `;

            container.appendChild(row);

            renderSparkRowTags(rowId, filterTags);
            refreshSparkRowPreview(rowId);
        }

        // 🌟 3. 增强 renderSparkRowTags：大类清空时迅速清空标签；大类存在时实时提取
        function renderSparkRowTags(rowId, activeTags = []) {
            const row = document.getElementById(rowId);
            if (!row) return;

            const tierId = row.querySelector('.select-spark-tier')?.value;
            const cats = Array.from(row.querySelectorAll('.cb-spark-cat:checked')).map(cb => cb.value);
            const tagsContainer = row.querySelector('.spark-tags-container');
            if (!tagsContainer) return;

            // 如果没有勾选任何分类，直接显示无匹配标签，不卡死
            if (cats.length === 0) {
                tagsContainer.innerHTML = `<span style="font-size:11px; color:#666;">${getTrans('cp_sec0_no_matched_tags')}</span>`;
                return;
            }

            const savedInfo = JSON.parse(localStorage.getItem('GM_Info_' + gameId)) || {};
            const presetSetup = GameData.getPresetSetup(gameId);
            const tagDefs = savedInfo.tagDefinitions || presetSetup?.tagDefinitions || {};

            let validTagsSet = new Set();
            cats.forEach(c => {
                const tags = getActiveTagsFromCardZero(tierId, c);
                tags.forEach(t => validTagsSet.add(t));
            });

            const validTags = Array.from(validTagsSet);
            let html = validTags.map(tagKey => {
                const def = tagDefs[tagKey] || { name: tagKey, color: '#888' };
                const isChecked = activeTags.includes(tagKey) ? 'checked' : '';
                let displayTagName = (sysLang === 'en' && def.en) ? def.en : def.name;
                return `
                    <label style="display:inline-flex; align-items:center; gap:4px; font-size:11px; color:#ddd; cursor:pointer; background:rgba(255,255,255,0.06); padding:2px 7px; border-radius:3px;">
                        <input type="checkbox" class="cb-spark-tag" value="${tagKey}" ${isChecked} onchange="refreshSparkRowPreview('${rowId}')">
                        <span style="display:inline-block; width:6px; height:6px; border-radius:50%; background:${def.color};"></span>
                        <span>${displayTagName}</span>
                    </label>
                `;
            }).join('') || `<span style="font-size:11px; color:#666;">${getTrans('cp_sec0_no_matched_tags')}</span>`;

            tagsContainer.innerHTML = html;
        }

        window.refreshSparkRowPreview = function(rowId) {
            const row = document.getElementById(rowId);
            if (!row) return;

            const targetType = row.querySelector('.input-spark-target-type')?.value;
            if (targetType !== 'custom_filter') return;

            const tierId = row.querySelector('.select-spark-tier')?.value;
            const cats = Array.from(row.querySelectorAll('.cb-spark-cat:checked')).map(cb => cb.value);
            const checkedTags = Array.from(row.querySelectorAll('.cb-spark-tag:checked')).map(cb => cb.value);

            const countEl = row.querySelector('.spark-preview-count');
            const chipsEl = row.querySelector('.spark-preview-chips');
            if (!countEl || !chipsEl) return;

            if (cats.length === 0 || checkedTags.length === 0) {
                countEl.innerText = '0';
                chipsEl.innerHTML = `<span style="font-size:10px; color:#666;">${getTrans('no_categories_or_tags')}</span>`;
                return;
            }

            const matchedItems = getItemsByCats(cats).filter(item => 
                item.tierId === tierId && CatalogUtils.hasAnyTag(item, checkedTags, { fallback: ['normal'] })
            );

            countEl.innerText = matchedItems.length;
            // 🌟 物品名字走 getItemShort 适配语言
            chipsEl.innerHTML = matchedItems.map(item => {
                let displayName = getItemShort(item);
                let fullTitle = getItemName(item);
                return `
                    <span style="font-size:10px; background:#1a1c21; border:1px solid rgba(142,68,173,0.4); color:#eee; padding:1px 5px; border-radius:3px;" title="${fullTitle}">
                        ${displayName}
                    </span>
                `;
            }).join('') || `<span style="font-size:10px; color:#666;">${getTrans('cp_sec7_no_items')}</span>`;
        };

        window.requestRemoveSparkRow = function(btnEl) {
            if (document.body.classList.contains('preview-mode')) return;
            openActionConfirm(getTrans('cp_sec7_del_confirm'), () => {
                btnEl.closest('.spark-rule-row')?.remove();
            });
        };

        window.onSparkTargetTypeChange = function(selectEl, rowId) {
            const row = document.getElementById(rowId);
            if (!row) return;

            const val = selectEl.value;
            const upIdxWrap = row.querySelector('.spark-up-idx-wrap');
            const filterDrawer = row.querySelector('.spark-filter-drawer');

            if (upIdxWrap) upIdxWrap.style.display = (val === 'up_index') ? 'inline-flex' : 'none';
            if (filterDrawer) {
                filterDrawer.style.display = (val === 'custom_filter') ? 'flex' : 'none';
                if (val === 'custom_filter') refreshSparkRowPreview(rowId);
            }
        };

        window.onSparkTierChange = function(rowId) {
            const row = document.getElementById(rowId);
            if (!row) return;
            const currentChecked = Array.from(row.querySelectorAll('.cb-spark-tag:checked')).map(cb => cb.value);
            renderSparkRowTags(rowId, currentChecked);
            refreshSparkRowPreview(rowId);
        };

        function appendEarlyUpRow(order = "", upRate = 100) {
            const container = document.getElementById('early-up-rules-container');
            const existingCount = container.children.length;
            const finalOrder = order || (existingCount + 1);

            const row = document.createElement('div');
            row.className = 'early-up-rule-row';
            row.style = "display: flex; gap: 10px; align-items: center; background: rgba(0,0,0,0.2); padding: 10px 12px; border-radius: 8px; margin-bottom: 8px; border: 1px solid var(--border);";
            
            // 🌟 核心：将写死的中文换成 getTrans 动态读取
            row.innerHTML = `
                <span style="color: #aaa; font-size: 13px;">${getTrans('gold_order_prefix')}</span>
                <input type="number" class="input-box input-early-order" style="width: 60px; padding: 5px; text-align: center;" value="${finalOrder}" min="1">
                <span style="color: #aaa; font-size: 13px;">${getTrans('cp_sec8_suffix')}</span>
                <input type="number" class="input-box input-early-uprate" style="width: 75px; padding: 5px; text-align: center;" value="${upRate}" min="0" max="100">
                <span style="color: #888; font-size: 13px;">%</span>
                <button type="button" class="preview-edit-action btn btn-action-gray" style="margin-left: auto; color: #ff4757; padding: 2px 8px; font-size: 12px;" onclick="requestRemoveEarlyUpRow(this)">✕</button>
            `;
            container.appendChild(row);
        }

        window.requestRemoveEarlyUpRow = function(btnEl) {
            if (document.body.classList.contains('preview-mode')) return;
            openActionConfirm(getTrans('cp_sec8_del_confirm'), () => {
                btnEl.closest('.early-up-rule-row')?.remove();
            });
        };

        function appendCatSeqRow(order = "", config = {}) {
            const container = document.getElementById('cat-seq-rules-container');
            if (!container) return;

            const existingCount = container.children.length;
            const finalOrder = order || (existingCount + 1);
            const rowId = 'cat_seq_row_' + Date.now() + '_' + Math.floor(Math.random() * 1000);

            let selectedCats = config.targetCats || ['char'];
            let selectedTags = config.targetTags || [];

            if (Array.isArray(config.poolIds) && config.poolIds.length > 0 && selectedTags.length === 0) {
                if (config.poolIds.includes('char_std') || config.poolIds.includes('wep_std')) {
                    selectedTags = ['std'];
                    selectedCats = config.poolIds.includes('wep_std') ? ['wep'] : ['char'];
                } else {
                    selectedTags = ['up'];
                }
            } else if (selectedTags.length === 0) {
                selectedTags = ['std'];
            }

            // 🌟 1. 统一调用全局动态大类列表（支持中英文名称读取）
            const categories = getAvailableCategories();

            let catsHtml = categories.map(c => {
                let cName = (sysLang === 'en' && c.en) ? c.en : c.name;
                return `
                <label style="cursor: pointer; display: inline-flex; align-items: center; gap: 4px; font-size: 12px; color: #ddd; background: rgba(255,255,255,0.05); padding: 3px 8px; border-radius: 4px;">
                    <input type="checkbox" class="cb-cat-seq-cat" value="${c.id}" ${selectedCats.includes(c.id) ? 'checked' : ''} onchange="onCatSeqChange('${rowId}')">
                    <span>${c.icon || ''} ${cName}</span>
                </label>
                `;
            }).join('');

            const row = document.createElement('div');
            row.id = rowId;
            row.className = 'cat-seq-rule-row';
            row.style = "display: flex; flex-direction: column; background: rgba(0,0,0,0.2); padding: 12px 14px; border-radius: 8px; margin-bottom: 8px; border: 1px solid var(--border); border-left: 4px solid #3498db; transition: 0.2s;";
            
            // 🌟 2. 将写死的中文全部换为 getTrans 读取
            row.innerHTML = `
                <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                    <span style="color: #aaa; font-size: 13px;">${getTrans('gold_order_prefix')}</span>
                    <input type="number" class="input-box input-cat-seq-order" style="width: 50px; padding: 4px; text-align: center;" value="${finalOrder}" min="1">
                    <span style="color: #3498db; font-size: 13px; font-weight: bold;">${getTrans('cp_sec9_gold_target')}</span>

                    <span class="cat-seq-summary" style="font-size: 12px; color: #aaa; max-width: 280px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; cursor: pointer;" onclick="toggleCatSeqDrawer('${rowId}')">
                        ${getTrans('cp_sec9_summary_expand')}
                    </span>

                    <button type="button" class="btn btn-action-gray btn-cat-toggle" style="padding: 2px 8px; font-size: 12px; color: #3498db; margin-left: auto;" onclick="toggleCatSeqDrawer('${rowId}')">
                        ▽
                    </button>
                    <button type="button" class="preview-edit-action btn btn-action-gray" style="color: #ff4757; padding: 2px 8px; font-size: 12px;" onclick="requestRemoveCatSeqRow(this)">✕</button>
                </div>

                <div class="cat-seq-cbs-wrap" style="display: flex; flex-direction: column; gap: 8px; padding-top: 10px; margin-top: 8px; border-top: 1px dashed rgba(255,255,255,0.08);">
                    <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                        <span style="color: #bbb; font-size: 12px; font-weight: bold;">${getTrans('cp_sec9_cats_label')}</span>
                        <div style="display: inline-flex; gap: 6px; flex-wrap: wrap;">
                            ${catsHtml}
                        </div>
                    </div>

                    <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                        <span style="color: #3498db; font-size: 12px; font-weight: bold;">${getTrans('match_tags')}</span>
                        <div class="cat-seq-tags-wrap" style="display: inline-flex; gap: 6px; flex-wrap: wrap;"></div>
                    </div>

                    <div style="display: flex; align-items: center; gap: 8px; border-top: 1px dashed rgba(255,255,255,0.06); padding-top: 6px; margin-top: 2px;">
                        <span style="font-size: 11px; color: #888;">${getTrans('cp_sec9_hit_count').replace('{count}', '<span class="cat-seq-preview-count" style="color: #3498db; font-weight: bold;">0</span>')}</span>
                        <div class="cat-seq-preview-chips" style="display: flex; gap: 4px; flex-wrap: wrap; max-height: 55px; overflow-y: auto;"></div>
                    </div>
                </div>
            `;
            container.appendChild(row);

            renderCatSeqRowTags(rowId, selectedTags);
            setTimeout(() => { updateCatSeqPreview(rowId); }, 10);
        }

        function renderCatSeqRowTags(rowId, activeTags = []) {
            const row = document.getElementById(rowId);
            if (!row) return;

            const goldTierId = (selectedGoldIds && selectedGoldIds.length > 0) ? selectedGoldIds[0] : (globalTiers[0]?.id || 'tier_S');
            const checkedCats = Array.from(row.querySelectorAll('.cb-cat-seq-cat:checked')).map(cb => cb.value);
            const tagsWrap = row.querySelector('.cat-seq-tags-wrap');
            if (!tagsWrap) return;

            const savedInfo = JSON.parse(localStorage.getItem('GM_Info_' + gameId)) || {};
            const presetSetup = GameData.getPresetSetup(gameId);
            
            const tagDefs = savedInfo.tagDefinitions || presetSetup?.tagDefinitions || {
                up: { name: "限定", en: "Limited", color: "#f1c40f" },
                reup: { name: "不歪", en: "Guaranteed", color: "#f1c40f" },
                custom_offrate: { name: "定制调频", en: "Customized", color: "#e67e22" },
                std: { name: "常驻", en: "Standard", color: "#3498db" }
            };

            let validTagsSet = new Set();
            checkedCats.forEach(c => {
                const tags = (typeof getActiveTagsFromCardZero === 'function') ? getActiveTagsFromCardZero(goldTierId, c) : [];
                tags.forEach(t => validTagsSet.add(t));
            });

            if (validTagsSet.size === 0) {
                ['std', 'up', 'custom_offrate'].forEach(t => validTagsSet.add(t));
            }

            const validTags = Array.from(validTagsSet);
            let html = validTags.map(tagKey => {
                const def = tagDefs[tagKey] || { name: tagKey, color: '#888' };
                const isChecked = activeTags.includes(tagKey) ? 'checked' : '';
                // 🌟 核心：显示当前语言名称（英文模式下为 Standard / Limited 等）
                let displayTagName = (sysLang === 'en' && def.en) ? def.en : def.name;
                return `
                    <label style="display: inline-flex; align-items: center; gap: 4px; font-size: 11px; color:#ddd; background:rgba(255,255,255,0.06); padding:2px 7px; border-radius:3px; cursor:pointer; user-select:none;">
                        <input type="checkbox" class="cb-cat-seq-tag" value="${tagKey}" ${isChecked} onchange="onCatSeqChange('${rowId}')">
                        <span style="display:inline-block; width:6px; height:6px; border-radius:50%; background:${def.color};"></span>
                        <span>${displayTagName}</span>
                    </label>
                `;
            }).join('');

            tagsWrap.innerHTML = html;
        }

        window.onCatSeqChange = function(rowId) {
            const row = document.getElementById(rowId);
            if (!row) return;
            const currentTags = Array.from(row.querySelectorAll('.cb-cat-seq-tag:checked')).map(cb => cb.value);
            renderCatSeqRowTags(rowId, currentTags);
            updateCatSeqPreview(rowId);
        };

        window.toggleCatSeqDrawer = function(target) {
            let row = null;
            if (typeof target === 'string') {
                row = document.getElementById(target);
            } else if (target && target.nodeType) {
                row = target.closest('.cat-seq-rule-row');
            }
            if (!row) return;

            const drawer = row.querySelector('.cat-seq-cbs-wrap');
            const toggleBtn = row.querySelector('.btn-cat-toggle');
            if (!drawer) return;

            const computedDisplay = window.getComputedStyle(drawer).display;
            const isHidden = (computedDisplay === 'none' || drawer.style.display === 'none');

            drawer.style.display = isHidden ? 'flex' : 'none';
            if (toggleBtn) toggleBtn.innerText = isHidden ? '△' : '▽';
        };

        window.updateCatSeqPreview = function(rowId) {
            const row = document.getElementById(rowId);
            if (!row) return;

            try {
                const goldTierId = (selectedGoldIds && selectedGoldIds.length > 0) ? selectedGoldIds[0] : (globalTiers[0]?.id || 'tier_S');
                const checkedCats = Array.from(row.querySelectorAll('.cb-cat-seq-cat:checked')).map(cb => cb.value);
                const checkedTags = Array.from(row.querySelectorAll('.cb-cat-seq-tag:checked')).map(cb => cb.value);

                const summaryEl = row.querySelector('.cat-seq-summary');
                const countEl = row.querySelector('.cat-seq-preview-count');
                const chipsEl = row.querySelector('.cat-seq-preview-chips');

                if (checkedCats.length === 0 || checkedTags.length === 0) {
                    if (summaryEl) summaryEl.innerText = getTrans('cp_sec9_unconfigured');
                    if (countEl) countEl.innerText = '0';
                    if (chipsEl) chipsEl.innerHTML = `<span style="font-size:10px; color:#666;">${getTrans('cp_sec9_unconfigured')}</span>`;
                    return;
                }

                const matchedItems = (typeof getItemsByCats === 'function' ? getItemsByCats(checkedCats) : []).filter(item => 
                    item.tierId === goldTierId && CatalogUtils.hasAnyTag(item, checkedTags)
                );

                const savedInfo = JSON.parse(localStorage.getItem('GM_Info_' + gameId)) || {};
                const presetSetup = GameData.getPresetSetup(gameId);
                const tagDefs = savedInfo.tagDefinitions || presetSetup?.tagDefinitions || {};

                // 🌟 1. 动态生成标签名称（读取 en 或 name）
                const tagNames = checkedTags.map(t => {
                    const def = tagDefs[t];
                    return (sysLang === 'en' && def?.en) ? def.en : (def?.name || t);
                }).join('+');

                // 🌟 2. 动态生成大类名称（根据数据库定义与多语言判断，不再写死“角色/武器”）
                const allCategories = getAvailableCategories();
                const catNames = checkedCats.map(cId => {
                    const catObj = allCategories.find(c => c.id === cId);
                    if (!catObj) return cId;
                    return (sysLang === 'en' && catObj.en) ? catObj.en : catObj.name;
                }).join('/');

                // 🌟 3. 摘要文案动态拼接
                if (summaryEl) {
                    summaryEl.innerText = getTrans('cp_sec9_summary_format')
                        .replace('{cats}', catNames)
                        .replace('{tags}', tagNames)
                        .replace('{count}', matchedItems.length);
                }
                if (countEl) countEl.innerText = matchedItems.length;

                // 🌟 4. 气泡框内的出金角色/武器名称，调用 getItemShort(item) 转换为英文
                if (chipsEl) {
                    chipsEl.innerHTML = matchedItems.map(item => {
                        let shortText = getItemShort(item);
                        let fullText = getItemName(item);
                        return `
                            <span style="font-size:10px; background:#1a1c21; border:1px solid rgba(52,152,219,0.4); color:#eee; padding:1px 5px; border-radius:3px;" title="${fullText}">
                                ${shortText}
                            </span>
                        `;
                    }).join('') || `<span style="font-size:10px; color:#666;">${getTrans('cp_sec9_no_hits')}</span>`;
                }
            } catch(err) {
                console.error("CatSeq preview error:", err);
                const summaryEl = row.querySelector('.cat-seq-summary');
                if (summaryEl) summaryEl.innerText = getTrans('cp_sec9_summary_expand');
            }
        };

        window.requestRemoveCatSeqRow = function(btnEl) {
            if (document.body.classList.contains('preview-mode')) return;
            openActionConfirm(getTrans('cp_sec9_del_confirm'), () => {
                btnEl.closest('.cat-seq-rule-row')?.remove();
            });
        };

        function appendGiftRuleRow(trigger = 30, amount = 10, type = 'loop', behavior = {}) {
            const container = document.getElementById('gift-rules-container');
            const row = document.createElement('div');
            row.className = 'gift-rule-row'; 
            row.style = `background: rgba(255, 255, 255, 0.03); border: 1px solid var(--border); border-radius: 8px; padding: 15px; position: relative; margin-bottom: 10px; border-left: 4px solid #2ecc71;`;
            
            // 🌟 将写死中文接入 getTrans
            row.innerHTML = `
                <button class="preview-edit-action" type="button" style="position: absolute; top: 10px; right: 10px; background: transparent; border: none; color: #ff4757; cursor: pointer; padding: 0; font-size: 14px;" onclick="requestRemoveGiftRow(this)">✕</button>
                <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 12px; padding-right: 30px;">
                    <span style="color: #aaa; font-size: 14px;">${getTrans('cp_sec10_reach')}</span>
                    <input type="number" class="input-gift-trigger input-box" style="width: 80px;" value="${trigger}">
                    <span style="color: #aaa; font-size: 14px;">${getTrans('cp_sec10_extra')}</span>
                    <input type="number" class="input-gift-amount input-box" style="width: 80px;" value="${amount}">
                    <span style="color: #aaa; font-size: 14px;">${getTrans('cp_sec10_unit')}</span>
                    <select class="input-gift-type input-box" style="width: 105px;">
                        <option value="loop" ${type === 'loop' ? 'selected' : ''}>${getTrans('loop')}</option>
                        <option value="once" ${type === 'once' ? 'selected' : ''}>${getTrans('once')}</option>
                    </select>
                </div>
                <div style="display: flex; gap: 20px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.06);">
                    <label style="display: flex; align-items: center; gap: 10px; cursor: pointer; user-select: none;">
                        <input type="checkbox" class="input-gift-count-pity toggle-checkbox" ${behavior.countPity ? 'checked' : ''}>
                        <span style="color: #aaa; font-size: 13px;">${getTrans('cp_sec10_count_pity')}</span>
                    </label>
                </div>
            `;
            container.appendChild(row);
        }

        window.requestRemoveGiftRow = function(btnEl) {
            if (document.body.classList.contains('preview-mode')) return;
            openActionConfirm(getTrans('cp_sec10_del_confirm'), () => {
                btnEl.closest('.gift-rule-row')?.remove();
            });
        };

        function appendSpecRuleRow(rule = {}) {
            const container = document.getElementById('spec-rules-container');
            if (!container) return;

            const rowId = 'spec_row_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
            const row = document.createElement('div');
            row.id = rowId;
            row.className = 'spec-rule-row';
            row.style = "display: flex; flex-direction: column; gap: 10px; background: rgba(0,0,0,0.2); border: 1px solid var(--border); border-left: 4px solid #e74c3c; border-radius: 8px; padding: 14px 16px; margin-bottom: 12px;";

            const targetTier = rule.tierId || (globalTiers[0]?.id || 'tier_S');
            const specType = rule.type || 'multiplier';
            const specValue = rule.value ?? 5;
            const filterCats = Array.isArray(rule.targetCats) && rule.targetCats.length > 0 ? rule.targetCats : ['char'];
            const filterTags = Array.isArray(rule.targetTags) ? rule.targetTags : ['up'];

            // 🌟 1. 星级名称调用 getTierDisplayName 自动适配多语言
            let tierOptions = '';
            globalTiers.forEach(t => {
                let displayTierName = getTierDisplayName(t);
                tierOptions += `<option value="${t.id}" ${t.id === targetTier ? 'selected' : ''} style="color:${t.color};">${displayTierName}</option>`;
            });

            // 🌟 2. 动态获取大类：支持自定义大类名原样输出，带中英双语的按当前语言输出
            const categories = getAvailableCategories();
            let catsHtml = categories.map(c => {
                let cName = (sysLang === 'en' && c.en) ? c.en : c.name;
                return `
                <label style="cursor: pointer; display: inline-flex; align-items: center; gap: 4px; font-size: 12px; color: #ddd; background: rgba(255,255,255,0.05); padding: 3px 8px; border-radius: 4px;">
                    <input type="checkbox" class="cb-spec-cat" value="${c.id}" ${filterCats.includes(c.id) ? 'checked' : ''} onchange="onSpecChange('${rowId}')">
                    <span>${c.icon || ''} ${cName}</span>
                </label>
                `;
            }).join('');

            // 🌟 3. 结构文案与算法选项全部国际化
            row.innerHTML = `
                <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
                    <div style="display: flex; align-items: center; gap: 6px;">
                        <span style="color: #aaa; font-size: 13px;">${getTrans('target_tier')}</span>
                        <select class="input-box select-spec-tier" style="width: 105px; padding: 4px 6px; font-size: 12px;" onchange="onSpecChange('${rowId}')">
                            ${tierOptions}
                        </select>
                    </div>

                    <div style="display: flex; align-items: center; gap: 6px;">
                        <span style="color: #aaa; font-size: 13px;">${getTrans('cp_sec11_lbl_type')}</span>
                        <select class="input-box select-spec-type" style="width: 155px; padding: 4px 6px; font-size: 12px;">
                            <option value="multiplier" ${specType === 'multiplier' ? 'selected' : ''}>${getTrans('cp_sec11_type_multiplier')}</option>
                            <option value="percent" ${specType === 'percent' ? 'selected' : ''}>${getTrans('cp_sec11_type_percent')}</option>
                        </select>
                    </div>

                    <div style="display: flex; align-items: center; gap: 6px;">
                        <span style="color: #aaa; font-size: 13px;">${getTrans('cp_sec11_lbl_val')}</span>
                        <input type="number" class="input-box input-spec-val" style="width: 70px; text-align: right; padding: 4px;" value="${specValue}" step="0.1">
                    </div>

                    <button type="button" class="preview-edit-action btn btn-action-gray" style="margin-left: auto; color: #ff4757; padding: 2px 8px; font-size: 12px;" onclick="requestRemoveSpecRow(this)">
                        ${getTrans('delete_rule')}
                    </button>
                </div>

                <div style="display: flex; flex-direction: column; gap: 8px; background: rgba(0,0,0,0.18); border-radius: 6px; padding: 10px 12px; border-top: 1px dashed rgba(255,255,255,0.06);">
                    <div style="display: flex; align-items: center; gap: 15px; flex-wrap: wrap;">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span style="color: #bbb; font-size: 12px; font-weight: bold;">${getTrans('cp_sec11_allowed_cats')}</span>
                            <div style="display: inline-flex; gap: 6px; flex-wrap: wrap;">${catsHtml}</div>
                        </div>

                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span style="color: #e74c3c; font-size: 12px; font-weight: bold;">${getTrans('cp_sec11_open_tags')}</span>
                            <div class="spec-tags-wrap" style="display: inline-flex; gap: 6px; flex-wrap: wrap;"></div>
                        </div>
                    </div>

                    <div style="display: flex; align-items: center; gap: 8px; border-top: 1px dashed rgba(255,255,255,0.06); padding-top: 6px; margin-top: 2px;">
                        <span style="font-size: 11px; color: #888;">${getTrans('cp_sec11_preview_count').replace('{count}', '<span class="spec-preview-count" style="color: #e74c3c; font-weight: bold;">0</span>')}</span>
                        <div class="spec-preview-chips" style="display: flex; gap: 4px; flex-wrap: wrap; max-height: 55px; overflow-y: auto;"></div>
                    </div>
                </div>
            `;

            container.appendChild(row);
            renderSpecRowTags(rowId, filterTags);
            updateSpecPreview(rowId);
        }

        function renderSpecRowTags(rowId, activeTags = []) {
            const row = document.getElementById(rowId);
            if (!row) return;

            const tierId = row.querySelector('.select-spec-tier')?.value;
            const checkedCats = Array.from(row.querySelectorAll('.cb-spec-cat:checked')).map(cb => cb.value);
            const tagsWrap = row.querySelector('.spec-tags-wrap');
            if (!tagsWrap) return;

            const savedInfo = JSON.parse(localStorage.getItem('GM_Info_' + gameId)) || {};
            const presetSetup = GameData.getPresetSetup(gameId);

            // 🌟 4. 优先读取当前游戏专属的 tagDefinitions
            const tagDefs = savedInfo.tagDefinitions || presetSetup?.tagDefinitions || {
                up: { name: "限定", en: "Limited", color: "#f1c40f" },
                custom_offrate: { name: "定制调频", en: "Customized", color: "#e67e22" },
                std: { name: "常驻", en: "Standard", color: "#3498db" }
            };

            let validTagsSet = new Set();
            checkedCats.forEach(c => {
                const tags = (typeof getActiveTagsFromCardZero === 'function') ? getActiveTagsFromCardZero(tierId, c) : [];
                tags.forEach(t => validTagsSet.add(t));
            });

            if (validTagsSet.size === 0) {
                Object.keys(tagDefs).forEach(t => validTagsSet.add(t));
            }

            const validTags = Array.from(validTagsSet);
            let html = validTags.map(tagKey => {
                const def = tagDefs[tagKey] || { name: tagKey, color: '#888' };
                const isChecked = activeTags.includes(tagKey) ? 'checked' : '';
                // 🌟 5. 标签名称根据当前语言显示，如果只有单语言则原样展示
                let displayTagName = (sysLang === 'en' && def.en) ? def.en : def.name;
                return `
                    <label style="display: inline-flex; align-items: center; gap: 4px; font-size: 11px; color: #ddd; background: rgba(255,255,255,0.06); padding: 2px 7px; border-radius: 3px; cursor: pointer; user-select: none;">
                        <input type="checkbox" class="cb-spec-tag" value="${tagKey}" ${isChecked} onchange="onSpecChange('${rowId}')">
                        <span style="display:inline-block; width:6px; height:6px; border-radius:50%; background:${def.color};"></span>
                        <span>${displayTagName}</span>
                    </label>
                `;
            }).join('');

            tagsWrap.innerHTML = html;
        }

        function updateSpecPreview(rowId) {
            const row = document.getElementById(rowId);
            if (!row) return;

            const tierId = row.querySelector('.select-spec-tier')?.value;
            const checkedCats = Array.from(row.querySelectorAll('.cb-spec-cat:checked')).map(cb => cb.value);
            const checkedTags = Array.from(row.querySelectorAll('.cb-spec-tag:checked')).map(cb => cb.value);

            const countEl = row.querySelector('.spec-preview-count');
            const chipsEl = row.querySelector('.spec-preview-chips');
            if (!countEl || !chipsEl) return;

            if (checkedCats.length === 0 || checkedTags.length === 0) {
                countEl.innerText = '0';
                chipsEl.innerHTML = `<span style="font-size:10px; color:#666;">${getTrans('no_categories_or_tags')}</span>`;
                return;
            }

            const matchedItems = (typeof getItemsByCats === 'function' ? getItemsByCats(checkedCats) : []).filter(item => 
                    item.tierId === tierId && CatalogUtils.hasAnyTag(item, checkedTags)
            );

            countEl.innerText = matchedItems.length;
            // 🌟 6. 候选库预览气泡内的名称，根据当前语言调用 getItemShort(item)
            chipsEl.innerHTML = matchedItems.map(item => {
                let displayName = getItemShort(item);
                let fullTitle = getItemName(item);
                return `
                    <span style="font-size:10px; background:#1a1c21; border:1px solid rgba(231,76,60,0.4); color:#eee; padding:1px 5px; border-radius:3px;" title="${fullTitle}">
                        ${displayName}
                    </span>
                `;
            }).join('') || `<span style="font-size:10px; color:#666;">${getTrans('cp_sec11_no_matched')}</span>`;
        }

        window.requestRemoveSpecRow = function(btnEl) {
            if (document.body.classList.contains('preview-mode')) return;
            openActionConfirm(getTrans('cp_sec11_del_confirm'), () => {
                btnEl.closest('.spec-rule-row')?.remove();
            });
        };

        window.onSpecChange = function(rowId) {
            const row = document.getElementById(rowId);
            if (!row) return;
            const currentTags = Array.from(row.querySelectorAll('.cb-spec-tag:checked')).map(cb => cb.value);
            renderSpecRowTags(rowId, currentTags);
            updateSpecPreview(rowId);
        };

        function getPoolRelatedRosterPools() {
            let poolsConfig = typeof getAvailableRosterPools === 'function' ? getAvailableRosterPools() : [];
            let savedInfo = JSON.parse(localStorage.getItem('GM_Info_' + gameId)) || {};
            let mixedPool = (savedInfo.mixedPools || []).find(p => p.id === currentPool);
            let allowedPoolIds = new Set();
            
            if (mixedPool && Array.isArray(mixedPool.components)) {
                mixedPool.components.forEach(id => allowedPoolIds.add(id));
            } else {
                allowedPoolIds.add(currentPool);
                let offRateArr = savedInfo.offRate?.[currentPool] || [];
                if (Array.isArray(offRateArr)) {
                    offRateArr.forEach(id => allowedPoolIds.add(id));
                }
            }

            let related = poolsConfig.filter(p => allowedPoolIds.has(p.id));
            return related.length > 0 ? related : poolsConfig;
        }

        function loadPoolConfig() {
            // 此处只恢复已保存的规则；预设缺少缓存时，由 injectDbRulesToUI 初始化控件。
            let savedConfig = GameData.readJSON(STORAGE_KEY);
    
            if (savedConfig) {
                if (savedConfig.tiers && Array.isArray(savedConfig.tiers)) {
                    selectedGoldIds = [];
                    savedConfig.tiers.forEach(t => {
                        if (poolTierState[t.id]) { 
                            poolTierState[t.id].enabled = true; 
                            poolTierState[t.id].prob = t.prob;
                            poolTierState[t.id].subProbs = t.subProbs || null;
                            if (t.isGold) selectedGoldIds.push(t.id);
                        }
                    });
                }

                const pitiesContainer = document.getElementById('unified-pities-container');
                if (pitiesContainer) {
                    pitiesContainer.innerHTML = '';
                    if (savedConfig.pities && Array.isArray(savedConfig.pities)) {
                        savedConfig.pities.forEach(rule => appendPityRuleRow(rule));
                    } else if (savedConfig.minorPities || savedConfig.pity) {
                        const goldTierId = selectedGoldIds[0] || 'tier_S';
                        if (savedConfig.pity && savedConfig.pity.hard) {
                            appendPityRuleRow({
                                tierId: goldTierId,
                                pulls: savedConfig.pity.hard,
                                resetOnHit: true,
                                enableUp: true,
                                upRate: savedConfig.pity.upRate || 50,
                                useGuarantee: savedConfig.pity.useGuarantee !== false,
                                guaranteeLimit: savedConfig.pity.guaranteeLimit || 1,
                                softEnabled: !!savedConfig.pity.softEnabled,
                                softRules: savedConfig.pity.softRules || []
                            });
                        }
                        if (savedConfig.minorPities && Array.isArray(savedConfig.minorPities)) {
                            savedConfig.minorPities.forEach(mp => appendPityRuleRow(mp));
                        }
                    }
                }

                const sparkContainer = document.getElementById('spark-rules-container');
                if (sparkContainer) {
                    sparkContainer.innerHTML = '';
                    let hasSpark = savedConfig.sparkRules && savedConfig.sparkRules.length > 0;
                    if (hasSpark) {
                        savedConfig.sparkRules.forEach(rule => appendSparkRuleRow(rule.limit, rule.type, rule));
                    }
                    document.getElementById('input-enable-spark').checked = hasSpark;
                    document.getElementById('spark-settings-panel').style.display = hasSpark ? 'block' : 'none';
                }

                const giftContainer = document.getElementById('gift-rules-container');
                if (giftContainer) {
                    giftContainer.innerHTML = '';
                    let hasGift = savedConfig.giftRules && savedConfig.giftRules.length > 0;
                    if (hasGift) {
                        savedConfig.giftRules.forEach(rule => appendGiftRuleRow(rule.trigger, rule.amount, rule.type, { countPity: rule.countPity }));
                    }
                    document.getElementById('input-enable-gift').checked = hasGift;
                    document.getElementById('gift-settings-panel').style.display = hasGift ? 'block' : 'none';
                }

                if (savedConfig.preSelect) {
                    const isEnabled = savedConfig.preSelect.enabled !== false;
                    document.getElementById('input-preselect-enable').checked = isEnabled;
                    document.getElementById('preselect-settings-panel').style.display = isEnabled ? 'block' : 'none';

                    if (savedConfig.preSelect.spec) {
                        document.getElementById('input-pre-spec-min').value = savedConfig.preSelect.spec.min ?? 0;
                        document.getElementById('input-pre-spec-max').value = (savedConfig.preSelect.spec.max === 999 || savedConfig.preSelect.spec.max == null) ? '' : savedConfig.preSelect.spec.max;
                    }

                    let tierData = savedConfig.preSelect.tiers || {};
                    if (Object.keys(tierData).length === 0 && (savedConfig.preSelect.upMin !== undefined || savedConfig.preSelect.upMax !== undefined)) {
                        const topId = globalTiers[0]?.id || 'tier_S';
                        tierData[topId] = {
                            upMin: savedConfig.preSelect.upMin,
                            upMax: savedConfig.preSelect.upMax,
                            stdMin: savedConfig.preSelect.stdMin,
                            stdMax: savedConfig.preSelect.stdMax
                        };
                    }
                    renderTierPreselectUI(tierData);
                    syncSpecPreselectVisibility();
                }

                if (savedConfig.specRate) {
                    const isEnabled = !!savedConfig.specRate.enabled;
                    document.getElementById('input-spec-enable').checked = isEnabled;
                    document.getElementById('spec-settings-panel').style.display = isEnabled ? 'block' : 'none';
            
                    const container = document.getElementById('spec-rules-container');
                    if (container) {
                        container.innerHTML = '';
                        if (Array.isArray(savedConfig.specRate.rules) && savedConfig.specRate.rules.length > 0) {
                            savedConfig.specRate.rules.forEach(r => appendSpecRuleRow(r));
                        } else if (savedConfig.specRate.items && savedConfig.specRate.items.length > 0) {
                            appendSpecRuleRow({
                                tierId: selectedGoldIds[0] || 'tier_S',
                                type: savedConfig.specRate.type,
                                value: savedConfig.specRate.value,
                                items: savedConfig.specRate.items
                            });
                        }
                    }
                }

                if (savedConfig.earlyUpRules && savedConfig.earlyUpRules.length > 0) {
                    document.getElementById('input-enable-early-up').checked = true;
                    document.getElementById('early-up-settings-panel').style.display = 'block';
                    savedConfig.earlyUpRules.forEach(r => appendEarlyUpRow(r.order, r.upRate));
                }

                if (savedConfig.goldCategorySequence && savedConfig.goldCategorySequence.length > 0) {
                    document.getElementById('input-enable-cat-seq').checked = true;
                    document.getElementById('cat-seq-settings-panel').style.display = 'block';
                    savedConfig.goldCategorySequence.forEach(r => appendCatSeqRow(r.order, r));
                }

                loadRescueLabel(savedConfig.secondaryRescue);
                if (savedConfig.secondaryRescue && savedConfig.secondaryRescue.enabled) {
                    document.getElementById('input-enable-rescue').checked = true;
                    document.getElementById('rescue-settings-panel').style.display = 'block';
                    document.getElementById('input-rescue-rate').value = savedConfig.secondaryRescue.triggerRate ?? 10;
                    document.getElementById('input-rescue-hard-loss').value = savedConfig.secondaryRescue.hardGuaranteeLosses ?? 1;
                    const strat = savedConfig.secondaryRescue.onHitUpStrategy || 'reset';
                    document.getElementById('input-rescue-up-strategy').value = strat;
                    document.getElementById('input-rescue-strategy-value').value = savedConfig.secondaryRescue.strategyValue ?? 1;
                    toggleRescueStrategyInputs();
                }

                if (savedConfig.assembly) {
                    poolAssembly = Object.assign(poolAssembly, savedConfig.assembly);
                }
            } else {
                globalTiers.forEach((t, i) => {
                    if (i === 0) { poolTierState[t.id] = { enabled: true, prob: 0.6 }; selectedGoldIds = [t.id]; }
                    if (i === 1) { poolTierState[t.id] = { enabled: true, prob: 9.4 }; }
                    if (i === 2) { poolTierState[t.id] = { enabled: true, prob: 90.0 }; }
                });
            }

            if (savedConfig?.lifecycle) {
                const lc = savedConfig.lifecycle;
                const matrix = lc.rotationMatrix || {};

                const allowRotationCb = document.getElementById('input-lifecycle-allow-rotation');
                if (allowRotationCb) allowRotationCb.checked = lc.allowRotation !== false;

                const parentSelect = document.getElementById('input-shared-pity-parent');
                if (parentSelect) parentSelect.value = lc.sharedPityParent || '';

                if (document.getElementById('input-inherit-pity-pulls'))
                    document.getElementById('input-inherit-pity-pulls').checked = matrix.inheritPityPulls !== false;

                if (document.getElementById('input-inherit-guarantee-state'))
                    document.getElementById('input-inherit-guarantee-state').checked = matrix.inheritGuaranteeState !== false;

                if (document.getElementById('input-inherit-rescue-losses'))
                    document.getElementById('input-inherit-rescue-losses').checked = matrix.inheritRescueLosses !== false;

                if (document.getElementById('input-reset-early-up'))
                    document.getElementById('input-reset-early-up').checked = matrix.resetEarlyUp !== false;

                if (document.getElementById('input-reset-cat-seq'))
                    document.getElementById('input-reset-cat-seq').checked = matrix.resetCatSeq !== false;

                if (document.getElementById('input-reset-spark-pity'))
                    document.getElementById('input-reset-spark-pity').checked = matrix.resetSparkPity !== false;

                if (document.getElementById('input-reset-gift-rules'))
                    document.getElementById('input-reset-gift-rules').checked = matrix.resetGiftRules !== false;

                toggleRotationSettingsPanel();
            }

            renderTiersUI();
            syncRotationInheritVisibility();
            populateParentPoolOptions();
            syncSpecPreselectVisibility();
        }

        let preselectDraft = {};
        function renderTierPreselectUI(savedTierData = null) {
            const container = document.getElementById('dynamic-tier-preselect-container');
            if (!container) return;
            // 开关或星级变化重绘时先保留当前输入，避免无参数调用重置成默认值。
            if (savedTierData !== null) preselectDraft = JSON.parse(JSON.stringify(savedTierData));
            else container.querySelectorAll('.tier-preselect-row').forEach(row => {
                const id = row.getAttribute('data-tier-id');
                preselectDraft[id] = Object.fromEntries(['upMin', 'upMax', 'stdMin', 'stdMax'].map(field => {
                    const kind = field.startsWith('up') ? 'up' : 'std';
                    const bound = field.endsWith('Min') ? 'min' : 'max';
                    return [field, row.querySelector(`.input-tier-${kind}-${bound}`)?.value ?? ''];
                }));
            });
            savedTierData = preselectDraft;

            let html = '';
            
            // 🌟 1. 过滤只保留当前卡池启用的星级
            const activeTiers = globalTiers.filter(tier => {
                const state = poolTierState[tier.id];
                return state ? state.enabled : true;
            });

            const unlimitedPlaceholder = getTrans('cp_sec12_unlimited');

            activeTiers.forEach((tier, idx) => {
                const tierColor = tier.color || '#f1c40f';
                const data = savedTierData[tier.id] || {};
                const displayTierName = getTierDisplayName(tier);

                const defaultUpMin = (idx === 0) ? 1 : 0;
                const defaultUpMax = (idx === 0) ? 1 : '';
                const defaultStdMin = 0;
                const defaultStdMax = '';

                const upMin = (data.upMin !== undefined && data.upMin !== null) ? data.upMin : defaultUpMin;
                // 留空或为 999 时，value 设为空字符串，以便露出 placeholder
                const upMax = data.upMax === '' || data.upMax === 999 ? ''
                    : (data.upMax !== undefined && data.upMax !== null ? data.upMax : defaultUpMax);
                const stdMin = (data.stdMin !== undefined && data.stdMin !== null) ? data.stdMin : defaultStdMin;
                const stdMax = (data.stdMax !== undefined && data.stdMax !== null && data.stdMax !== 999 && data.stdMax !== '') ? data.stdMax : defaultStdMax;

                // 🌟 2. 在 Max 输入框加上 placeholder="${unlimitedPlaceholder}"
                html += `
                <div class="tier-preselect-row" data-tier-id="${tier.id}" style="background: rgba(0,0,0,0.18); border: 1px solid var(--border); border-left: 4px solid ${tierColor}; border-radius: 6px; padding: 10px 14px;">
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                        <span style="font-weight: bold; color: ${tierColor}; font-size: 13px;">
                            ${displayTierName} ${getTrans('cp_sec12_preselect_title_suffix')}
                        </span>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                        <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(241,196,15,0.15); border-radius: 4px; padding: 8px 10px;">
                            <div style="font-size: 12px; color: #f1c40f; font-weight: bold; margin-bottom: 6px;">${getTrans('cp_sec12_up_limit')}</div>
                            <div style="display: flex; align-items: center; gap: 6px;">
                                <span style="color: #888; font-size: 11px;">${getTrans('cp_sec12_min')}</span>
                                <input type="number" class="input-box input-tier-up-min" style="width: 55px; padding: 3px; text-align: center;" value="${upMin}" min="0">
                                <span style="color: #888; font-size: 11px;">${getTrans('cp_sec12_max')}</span>
                                <input type="number" class="input-box input-tier-up-max" style="width: 55px; padding: 3px; text-align: center;" value="${upMax}" min="0" placeholder="${unlimitedPlaceholder}">
                            </div>
                        </div>

                        <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(52,152,219,0.15); border-radius: 4px; padding: 8px 10px;">
                            <div style="font-size: 12px; color: #3498db; font-weight: bold; margin-bottom: 6px;">${getTrans('cp_sec12_std_limit')}</div>
                            <div style="display: flex; align-items: center; gap: 6px;">
                                <span style="color: #888; font-size: 11px;">${getTrans('cp_sec12_min')}</span>
                                <input type="number" class="input-box input-tier-std-min" style="width: 55px; padding: 3px; text-align: center;" value="${stdMin}" min="0">
                                <span style="color: #888; font-size: 11px;">${getTrans('cp_sec12_max')}</span>
                                <input type="number" class="input-box input-tier-std-max" style="width: 55px; padding: 3px; text-align: center;" value="${stdMax}" min="0" placeholder="${unlimitedPlaceholder}">
                            </div>
                        </div>
                    </div>
                </div>
                `;
            });

            container.innerHTML = html;
            refreshPreselectModes();
        }

        // 只改显示，不销毁输入节点：误切到大池后切回来，UP 数量仍是原值。
        function refreshPreselectModes() {
            document.querySelectorAll('.tier-preselect-row').forEach(row => {
                const isFlat = poolAssembly.tierRules?.[row.getAttribute('data-tier-id')]?.mode === 'flat';
                const upPanel = row.querySelector('.input-tier-up-min')?.parentElement.parentElement;
                const stdPanel = row.querySelector('.input-tier-std-min')?.parentElement.parentElement;
                if (!upPanel || !stdPanel) return;
                upPanel.style.display = isFlat ? 'none' : '';
                upPanel.parentElement.style.gridTemplateColumns = isFlat ? '1fr' : '1fr 1fr';
                stdPanel.firstElementChild.textContent = getTrans(isFlat ? 'cp_sec12_flat_limit' : 'cp_sec12_std_limit');
            });
        }

        function injectDbRulesToUI(poolType) {
            // 官方规则的游戏匹配统一由公共数据层维护，页面只负责生成编辑控件。
            const rules = GameData.getPreset(gameId)?.rules?.[poolType];
            
            if (!rules) return;

            if (rules.assembly) {
                poolAssembly = Object.assign({}, poolAssembly, rules.assembly);
                renderCardZeroAssembly();
            }

            selectedGoldIds = [];
            globalTiers.forEach(t => { poolTierState[t.id] = { enabled: false, prob: 0, subProbs: null }; });

            if (rules.tiers && Array.isArray(rules.tiers)) {
                rules.tiers.forEach(t => {
                    let matched = poolTierState[t.id];
                    if (!matched) { 
                        let gMatch = globalTiers.find(gt => gt.name === t.name); 
                        if (gMatch) matched = poolTierState[gMatch.id]; 
                    }
                    if (matched) { 
                        matched.enabled = true; 
                        matched.prob = t.prob;
                        matched.subProbs = t.subProbs || null;
                        if (t.isGold) {
                            selectedGoldIds.push(t.id);
                        }
                    }
                });
            }
            renderTiersUI();

            const pitiesContainer = document.getElementById('unified-pities-container');
            if (pitiesContainer) {
                pitiesContainer.innerHTML = '';
                if (rules.pities && Array.isArray(rules.pities)) {
                    rules.pities.forEach(r => appendPityRuleRow(r));
                } else {
                    const goldTierId = selectedGoldIds[0] || 'tier_S';
                    if (rules.hardPity !== undefined) {
                        appendPityRuleRow({
                            tierId: goldTierId,
                            pulls: rules.hardPity,
                            resetOnHit: true,
                            enableUp: true,
                            upRate: rules.upRate !== undefined ? rules.upRate : 0.5,
                            useGuarantee: rules.useGuarantee !== false,
                            guaranteeLimit: rules.guaranteeLimit || 1,
                            softEnabled: !!rules.softEnabled,
                            softRules: rules.softRule || []
                        });
                    }
                    if (rules.minorPities && Array.isArray(rules.minorPities)) {
                        rules.minorPities.forEach(mp => appendPityRuleRow(mp));
                    }
                }
            }

            loadRescueLabel(rules.secondaryRescue);
            if (rules.secondaryRescue && rules.secondaryRescue.enabled) {
                const rescueEnable = document.getElementById('input-enable-rescue');
                if (rescueEnable) rescueEnable.checked = true;
                const rescuePanel = document.getElementById('rescue-settings-panel');
                if (rescuePanel) rescuePanel.style.display = 'block';
                if (document.getElementById('input-rescue-rate')) document.getElementById('input-rescue-rate').value = rules.secondaryRescue.triggerRate ?? 10;
                if (document.getElementById('input-rescue-hard-loss')) document.getElementById('input-rescue-hard-loss').value = rules.secondaryRescue.hardGuaranteeLosses ?? 1;
                if (document.getElementById('input-rescue-up-strategy')) document.getElementById('input-rescue-up-strategy').value = rules.secondaryRescue.onHitUpStrategy || 'reset';
                if (document.getElementById('input-rescue-strategy-value')) document.getElementById('input-rescue-strategy-value').value = rules.secondaryRescue.strategyValue ?? 1;
                if (typeof toggleRescueStrategyInputs === 'function') toggleRescueStrategyInputs();
            }

            if (rules.sparkRules && rules.sparkRules.length > 0) {
                const sparkContainer = document.getElementById('spark-rules-container');
                if (sparkContainer) {
                    sparkContainer.innerHTML = '';
                    rules.sparkRules.forEach(rule => appendSparkRuleRow(rule.limit, rule.type, rule));
                }
                if (document.getElementById('input-enable-spark')) document.getElementById('input-enable-spark').checked = true;
                if (document.getElementById('spark-settings-panel')) document.getElementById('spark-settings-panel').style.display = 'block';
            }

            if (rules.earlyUpRules && rules.earlyUpRules.length > 0) {
                const earlyContainer = document.getElementById('early-up-rules-container');
                if (earlyContainer) {
                    earlyContainer.innerHTML = '';
                    rules.earlyUpRules.forEach(r => appendEarlyUpRow(r.order, r.upRate));
                }
                if (document.getElementById('input-enable-early-up')) document.getElementById('input-enable-early-up').checked = true;
                if (document.getElementById('early-up-settings-panel')) document.getElementById('early-up-settings-panel').style.display = 'block';
            }

            if (rules.goldCategorySequence && rules.goldCategorySequence.length > 0) {
                const catContainer = document.getElementById('cat-seq-rules-container');
                if (catContainer) {
                    catContainer.innerHTML = '';
                    rules.goldCategorySequence.forEach(r => appendCatSeqRow(r.order, r));
                }
                if (document.getElementById('input-enable-cat-seq')) document.getElementById('input-enable-cat-seq').checked = true;
                if (document.getElementById('cat-seq-settings-panel')) document.getElementById('cat-seq-settings-panel').style.display = 'block';
            }

            if (rules.giftRules && rules.giftRules.length > 0) {
                const giftContainer = document.getElementById('gift-rules-container');
                if (giftContainer) {
                    giftContainer.innerHTML = '';
                    rules.giftRules.forEach(rule => appendGiftRuleRow(rule.trigger, rule.amount, rule.type, { countPity: rule.countPity }));
                }
                if (document.getElementById('input-enable-gift')) document.getElementById('input-enable-gift').checked = true;
                if (document.getElementById('gift-settings-panel')) document.getElementById('gift-settings-panel').style.display = 'block';
            }

            const isSpecEnabled = !!(rules.specRate && rules.specRate.enabled);
            const specEnableCb = document.getElementById('input-spec-enable');
            const specPanel = document.getElementById('spec-settings-panel');
            if (specEnableCb) specEnableCb.checked = isSpecEnabled;
            if (specPanel) specPanel.style.display = isSpecEnabled ? 'block' : 'none';

            if (isSpecEnabled) {
                const specContainer = document.getElementById('spec-rules-container');
                if (specContainer) {
                    specContainer.innerHTML = '';
                    if (Array.isArray(rules.specRate.rules) && rules.specRate.rules.length > 0) {
                        rules.specRate.rules.forEach(r => appendSpecRuleRow(r));
                    } else if (rules.specRate.type) {
                        appendSpecRuleRow(rules.specRate);
                    }
                }
            }

            if (rules.preSelect) {
                const isPreEnabled = rules.preSelect.enabled !== false;
                const preCb = document.getElementById('input-preselect-enable');
                const prePanel = document.getElementById('preselect-settings-panel');
                if (preCb) preCb.checked = isPreEnabled;
                if (prePanel) prePanel.style.display = isPreEnabled ? 'block' : 'none';

                renderTierPreselectUI(rules.preSelect.tiers || {});

                let specMinVal = rules.preSelect.spec?.min ?? 0;
                let specMaxVal = rules.preSelect.spec?.max ?? '';

                const specBlock = document.getElementById('spec-preselect-block');
                if (specBlock) {
                    specBlock.style.display = (isSpecEnabled && isPreEnabled) ? 'block' : 'none';
                }

                const minInput = document.getElementById('input-pre-spec-min');
                const maxInput = document.getElementById('input-pre-spec-max');
                if (minInput) minInput.value = specMinVal;
                if (maxInput) maxInput.value = (specMaxVal === 999 || specMaxVal === '') ? '' : specMaxVal;
            }

            if (rules.lifecycle) {
                const lc = rules.lifecycle;
                const matrix = lc.rotationMatrix || {};
                const allowRot = document.getElementById('input-lifecycle-allow-rotation');
                if (allowRot) allowRot.checked = lc.allowRotation !== false;
                const parentSel = document.getElementById('input-shared-pity-parent');
                if (parentSel) parentSel.value = lc.sharedPityParent || '';

                if (document.getElementById('input-inherit-pity-pulls'))
                    document.getElementById('input-inherit-pity-pulls').checked = matrix.inheritPityPulls === true;
                if (document.getElementById('input-inherit-guarantee-state'))
                    document.getElementById('input-inherit-guarantee-state').checked = matrix.inheritGuaranteeState === true;
                if (document.getElementById('input-inherit-rescue-losses'))
                    document.getElementById('input-inherit-rescue-losses').checked = matrix.inheritRescueLosses === true;
                if (document.getElementById('input-reset-early-up'))
                    document.getElementById('input-reset-early-up').checked = matrix.resetEarlyUp !== false;
                if (document.getElementById('input-reset-cat-seq'))
                    document.getElementById('input-reset-cat-seq').checked = matrix.resetCatSeq !== false;
                if (document.getElementById('input-reset-spark-pity'))
                    document.getElementById('input-reset-spark-pity').checked = matrix.resetSparkPity !== false;
                if (document.getElementById('input-reset-gift-rules'))
                    document.getElementById('input-reset-gift-rules').checked = matrix.resetGiftRules !== false;

                toggleRotationSettingsPanel();
            }

            syncSpecPreselectVisibility();
            syncRotationInheritVisibility();
            populateParentPoolOptions();
        }

        // 页面只采集原始输入并负责提示/定位；所有合法性判断交给纯数据检测模块。
        function validatePoolForm() {
            const targets = {};
            const read = (row, selector, path) => {
                const input = row.querySelector(selector);
                targets[path] = input;
                return input?.value ?? '';
            };
            const data = { tiers: [], goldIds: selectedGoldIds, pities: [] };
            globalTiers.forEach(tier => {
                if (!poolTierState[tier.id]?.enabled) return;
                const i = data.tiers.length;
                const input = document.querySelector(`.input-tier-prob[data-tier-id="${tier.id}"]`);
                targets[`tiers.${i}.prob`] = input;
                const drawer = document.getElementById(`sub-prob-drawer-${tier.id}`);
                const groups = drawer && drawer.style.display !== 'none' ? [...drawer.querySelectorAll('.sub-prob-group-row')] : [];
                data.tiers.push({ prob: input?.value ?? poolTierState[tier.id].prob, subProbs: groups.map((row, j) => ({
                    prob: read(row, '.input-sub-group-prob', `tiers.${i}.subProbs.${j}.prob`),
                    hasConditions: [...row.querySelectorAll('.sub-condition-slice')].some(slice => slice.querySelector('.select-cond-cat')?.value && slice.querySelector('.cb-cond-tag:checked'))
                })) });
            });
            document.querySelectorAll('.unified-pity-row').forEach((row, i) => {
                const base = `pities.${i}`;
                data.pities.push({
                    pulls: read(row, '.input-pity-pulls', base + '.pulls'),
                    tierId: read(row, '.select-pity-tier', base + '.tierId'),
                    softEnabled: !!row.querySelector('.input-pity-enable-soft')?.checked,
                    softRules: [...row.querySelectorAll('.soft-segment-row')].map((seg, j) => ({
                        start: read(seg, '.input-soft-start', base + `.softRules.${j}.start`),
                        end: read(seg, '.input-soft-end', base + `.softRules.${j}.end`),
                        inc: read(seg, '.input-soft-inc', base + `.softRules.${j}.inc`)
                    }))
                });
            });
            // 只检查已启用功能，空白序号不能被保存流程的 || 1 掩盖。
            for (const [section, enableId, rowSelector, fields] of [
                ['early', 'input-enable-early-up', '.early-up-rule-row', { order: '.input-early-order', upRate: '.input-early-uprate' }],
                ['category', 'input-enable-cat-seq', '.cat-seq-rule-row', { order: '.input-cat-seq-order' }],
                ['spark', 'input-enable-spark', '.spark-rule-row', { limit: '.input-spark-limit' }],
                ['gift', 'input-enable-gift', '.gift-rule-row', { trigger: '.input-gift-trigger', amount: '.input-gift-amount' }],
                ['spec', 'input-spec-enable', '.spec-rule-row', { value: '.input-spec-val' }]
            ]) {
                data[section] = document.getElementById(enableId)?.checked ? [...document.querySelectorAll(rowSelector)].map((row, i) =>
                    Object.fromEntries(Object.entries(fields).map(([field, selector]) => [field, read(row, selector, `${section}.${i}.${field}`)]))) : [];
            }
            // 数量限制按 UP/常驻各自检查，未启用时保留草稿而不拦截。
            data.preselect = [];
            if (document.getElementById('input-preselect-enable')?.checked) {
                document.querySelectorAll('.tier-preselect-row').forEach(row => {
                    const isFlat = poolAssembly.tierRules?.[row.getAttribute('data-tier-id')]?.mode === 'flat';
                    for (const kind of (isFlat ? ['std'] : ['up', 'std'])) {
                        const i = data.preselect.length;
                        data.preselect.push({
                            min: read(row, `.input-tier-${kind}-min`, `preselect.${i}.min`),
                            max: read(row, `.input-tier-${kind}-max`, `preselect.${i}.max`)
                        });
                    }
                });
                if (document.getElementById('input-pre-spec-min')) {
                    const i = data.preselect.length;
                    data.preselect.push({
                        min: read(document, '#input-pre-spec-min', `preselect.${i}.min`),
                        max: read(document, '#input-pre-spec-max', `preselect.${i}.max`)
                    });
                }
            }
            const result = PoolValidation.validate(data);
            const message = issue => {
                let text = getTrans(issue.key);
                for (const [key, value] of Object.entries(issue.params)) text = text.replaceAll('{' + key + '}', key === 'kind' ? getTrans(value) : String(value));
                const [section, index] = issue.path.split('.');
                // 使用功能名称与行号说明位置；序号不改变实际配置值。
                const sectionKeys = { tiers: 'pv_section_tiers', goldIds: 'pv_section_tiers', pities: 'pv_section_pities', early: 'pv_section_early', category: 'pv_section_category', spark: 'pv_section_spark', gift: 'pv_section_gift', spec: 'pv_section_spec', preselect: 'pv_section_preselect' };
                const label = getTrans(sectionKeys[section]);
                return label + (index !== undefined ? ' #' + (Number(index) + 1) : '') + ': ' + text;
            };
            if (!result.valid) {
                alert(getTrans('pv_save_blocked') + '\n' + result.errors.map(message).join('\n'));
                const first = result.errors[0];
                const target = targets[first.path] || targets['tiers.0.prob'];
                // 打开错误所在的折叠内容，再定位；不修改用户输入。
                if (target) {
                    for (let parent = target.parentElement; parent && parent !== document.body; parent = parent.parentElement) {
                        if (parent.style.display === 'none') parent.style.display = 'block';
                    }
                    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    target.focus();
                }
                return false;
            }
            // 结束抽数等于硬保底仅提醒，不阻止保存、不擅自改成硬保底减一。
            if (result.warnings.length) alert(result.warnings.map(message).join('\n'));
            return true;
        }

        function executeSavePool(showAlert = true) {
            if (!validatePoolForm()) return false;
            let activeTiers = [];
            let totalProb = 0;

            for (let t of globalTiers) {
                let state = poolTierState[t.id];
                if (state.enabled) {
                    totalProb += state.prob;

                    const drawer = document.getElementById(`sub-prob-drawer-${t.id}`);
                    let subProbsArray = null;

                    if (drawer && drawer.style.display !== 'none') {
                        const rows = drawer.querySelectorAll('.sub-prob-group-row');
                        let subSum = 0;
                        let extractedGroups = [];

                        rows.forEach(row => {
                            const pVal = parseFloat(row.querySelector('.input-sub-group-prob')?.value.trim());
                            const condSlices = [];
                            row.querySelectorAll('.sub-condition-slice').forEach(slice => {
                                const cat = slice.querySelector('.select-cond-cat')?.value;
                                const checkedTags = Array.from(slice.querySelectorAll('.cb-cond-tag:checked')).map(cb => cb.value);
                                if (cat && checkedTags.length > 0) condSlices.push({ cat, tags: checkedTags });
                            });
                            if (!isNaN(pVal) && pVal > 0 && condSlices.length > 0) {
                                subSum += pVal;
                                extractedGroups.push({ prob: pVal, conditions: condSlices });
                            }
                        });

                        if (extractedGroups.length > 0) {
                            subProbsArray = extractedGroups;
                        }
                    }

                    activeTiers.push({ 
                        id: t.id, 
                        prob: state.prob,
                        isGold: selectedGoldIds.includes(t.id),
                        subProbs: subProbsArray
                    });
                }
            }


            let unifiedPitiesArr = [];
            document.querySelectorAll('.unified-pity-row').forEach(row => {
                const pulls = parseInt(row.querySelector('.input-pity-pulls')?.value) || 0;
                const tierId = row.querySelector('.select-pity-tier')?.value;
                const resetOnHit = row.querySelector('.input-pity-reset')?.checked !== false;
                const enableUp = row.querySelector('.input-pity-enable-up')?.checked;
                const upRate = enableUp ? (parseFloat(row.querySelector('.input-pity-uprate')?.value) || 0) : 0;
                const useGuarantee = row.querySelector('.input-pity-use-guarantee')?.checked;
                const guaranteeMode = row.querySelector('.select-pity-guarantee-mode')?.value || 'classic';
                const guaranteeLimit = parseInt(row.querySelector('.input-pity-guarantee-limit')?.value) || 1;
                const guaranteeStep = parseFloat(row.querySelector('.input-pity-guarantee-step')?.value) || 25;
                const guaranteeMax = parseFloat(row.querySelector('.input-pity-guarantee-max')?.value) || 100;
                const softEnabled = row.querySelector('.input-pity-enable-soft')?.checked;

                let softRulesArr = [];
                if (softEnabled) {
                    row.querySelectorAll('.soft-segment-row').forEach(seg => {
                        const start = parseInt(seg.querySelector('.input-soft-start')?.value) || 0;
                        const end = parseInt(seg.querySelector('.input-soft-end')?.value) || 0;
                        const inc = parseFloat(seg.querySelector('.input-soft-inc')?.value) || 0;
                        if (start > 0 && end > 0 && inc > 0) softRulesArr.push({ start, end, inc });
                    });
                    softRulesArr.sort((a, b) => a.start - b.start);
                }

                if (pulls > 0 && tierId) {
                    unifiedPitiesArr.push({
                        tierId, pulls, resetOnHit, enableUp, 
                        upRate: upRate / 100, 
                        useGuarantee, 
                        guaranteeMode,
                        guaranteeLimit, 
                        guaranteeStep,
                        guaranteeMax,
                        softEnabled, softRules: softRulesArr
                    });
                }
            });

            let sparkRulesArr = [];
            if (document.getElementById('input-enable-spark')?.checked) {
                document.querySelectorAll('.spark-rule-row').forEach(row => {
                    const limit = parseInt(row.querySelector('.input-spark-limit')?.value);
                    if (limit > 0) {
                        const targetType = row.querySelector('.input-spark-target-type')?.value || 'random_up';
                        const deliverMode = row.querySelector('.select-spark-deliver-mode')?.value || 'random';
                        
                        let targetCats = [];
                        row.querySelectorAll('.cb-spark-cat:checked').forEach(cb => targetCats.push(cb.value));

                        let targetTags = [];
                        row.querySelectorAll('.cb-spark-tag:checked').forEach(cb => targetTags.push(cb.value));

                        sparkRulesArr.push({
                            limit,
                            type: row.querySelector('.input-spark-type')?.value || 'once',
                            targetType: targetType,
                            upIndex: parseInt(row.querySelector('.input-spark-up-index')?.value) || 1,
                            targetTier: row.querySelector('.select-spark-tier')?.value || 'tier_S',
                            targetCats: targetCats,
                            targetTags: targetTags,
                            deliverMode: deliverMode,
                            isSelectable: deliverMode === 'selectable',
                            cancelOnHit: row.querySelector('.input-spark-cancel-on-hit')?.checked || false,
                            noReset: row.querySelector('.input-spark-no-reset')?.checked || false
                        });
                    }
                });
            }

            let earlyUpRulesArr = [];
            if (document.getElementById('input-enable-early-up')?.checked) {
                document.querySelectorAll('.early-up-rule-row').forEach(row => {
                    let order = parseInt(row.querySelector('.input-early-order')?.value) || 1;
                    let upRate = parseFloat(row.querySelector('.input-early-uprate')?.value);
                    if (!isNaN(upRate) && order > 0) earlyUpRulesArr.push({ order, upRate });
                });
                // 保存拖拽后的展示顺序，不改“第 N 金”数值。
            }

            let goldCatSeqArr = [];
            if (document.getElementById('input-enable-cat-seq')?.checked) {
                document.querySelectorAll('.cat-seq-rule-row').forEach(row => {
                    let order = parseInt(row.querySelector('.input-cat-seq-order')?.value) || 1;
                    let targetCats = [];
                    row.querySelectorAll('.cb-cat-seq-cat:checked').forEach(cb => targetCats.push(cb.value));

                    let targetTags = [];
                    row.querySelectorAll('.cb-cat-seq-tag:checked').forEach(cb => targetTags.push(cb.value));

                    if (order > 0) {
                        goldCatSeqArr.push({
                            order,
                            targetCats,
                            targetTags,
                            poolIds: targetCats.map(c => `${c}_${targetTags[0] || 'std'}`)
                        });
                    }
                });
                // 按 DOM 顺序保存；引擎单独按数值处理计算所需的顺序。
            }

            let giftRulesArr = [];
            if (document.getElementById('input-enable-gift')?.checked) {
                document.querySelectorAll('.gift-rule-row').forEach(row => {
                    const trigger = parseInt(row.querySelector('.input-gift-trigger')?.value);
                    const amount = parseInt(row.querySelector('.input-gift-amount')?.value);
                    if (trigger > 0 && amount > 0) {
                        giftRulesArr.push({
                            trigger, amount, type: row.querySelector('.input-gift-type')?.value,
                            countPity: row.querySelector('.input-gift-count-pity')?.checked
                        });
                    }
                });
            }

            let specRulesArr = [];
            const isSpecEnabled = document.getElementById('input-spec-enable')?.checked || false;
            if (isSpecEnabled) {
                document.querySelectorAll('.spec-rule-row').forEach(row => {
                    const tierId = row.querySelector('.select-spec-tier')?.value;
                    const type = row.querySelector('.select-spec-type')?.value || 'multiplier';
                    const value = parseFloat(row.querySelector('.input-spec-val')?.value) || 5;

                    let targetCats = [];
                    row.querySelectorAll('.cb-spec-cat:checked').forEach(cb => targetCats.push(cb.value));

                    let targetTags = [];
                    row.querySelectorAll('.cb-spec-tag:checked').forEach(cb => targetTags.push(cb.value));

                    if (tierId && targetTags.length > 0) {
                        specRulesArr.push({ tierId, type, value, targetCats, targetTags });
                    }
                });
            }

            let preSelectTiers = {};
            document.querySelectorAll('.tier-preselect-row').forEach(row => {
                const tId = row.getAttribute('data-tier-id');
                const upMin = row.querySelector('.input-tier-up-min')?.value === '' ? 0 : parseInt(row.querySelector('.input-tier-up-min')?.value);
                const upMax = row.querySelector('.input-tier-up-max')?.value === '' ? 999 : parseInt(row.querySelector('.input-tier-up-max')?.value);
                const stdMin = row.querySelector('.input-tier-std-min')?.value === '' ? 0 : parseInt(row.querySelector('.input-tier-std-min')?.value);
                const stdMax = row.querySelector('.input-tier-std-max')?.value === '' ? 999 : parseInt(row.querySelector('.input-tier-std-max')?.value);

                // 大池保存只保留大池边界，隐藏的 UP 草稿不写入正式配置。
                if (tId) preSelectTiers[tId] = poolAssembly.tierRules?.[tId]?.mode === 'flat'
                    ? { stdMin, stdMax } : { upMin, upMax, stdMin, stdMax };
            });

            const topTierId = globalTiers[0]?.id || 'tier_S';
            const topTierData = preSelectTiers[topTierId] || {};
            const specMin = document.getElementById('input-pre-spec-min')?.value === '' ? 0 : parseInt(document.getElementById('input-pre-spec-min')?.value);
            const specMax = document.getElementById('input-pre-spec-max')?.value === '' ? 999 : parseInt(document.getElementById('input-pre-spec-max')?.value);

            const config = {
                assembly: poolAssembly,
                tiers: activeTiers,
                pities: unifiedPitiesArr,
                sparkRules: sparkRulesArr,
                giftRules: giftRulesArr,
                earlyUpRules: earlyUpRulesArr,
                goldCategorySequence: goldCatSeqArr,
                secondaryRescue: {
                    enabled: document.getElementById('input-enable-rescue')?.checked || false,
                    triggerRate: parseFloat(document.getElementById('input-rescue-rate')?.value) || 10,
                    hardGuaranteeLosses: parseInt(document.getElementById('input-rescue-hard-loss')?.value) || 1,
                    ...getRescueLabelConfig(),
                    onHitUpStrategy: document.getElementById('input-rescue-up-strategy')?.value || 'reset',
                    strategyValue: parseInt(document.getElementById('input-rescue-strategy-value')?.value) || 1
                },
                specRate: {
                    enabled: isSpecEnabled,
                    rules: specRulesArr,
                    type: specRulesArr[0]?.type || 'multiplier',
                    value: specRulesArr[0]?.value || 5,
                    targetCats: specRulesArr[0]?.targetCats || ['char'],
                    targetTags: specRulesArr[0]?.targetTags || ['up']
                },
                preSelect: {
                    enabled: document.getElementById('input-preselect-enable')?.checked || false,
                    tiers: preSelectTiers,
                    spec: { min: specMin, max: specMax },
                    ...(poolAssembly.tierRules?.[topTierId]?.mode === 'flat' ? {} : {
                        upMin: topTierData.upMin ?? 1,
                        upMax: topTierData.upMax ?? 999
                    }),
                    stdMin: topTierData.stdMin ?? 0,
                    stdMax: topTierData.stdMax ?? 999
                },
                lifecycle: {
                    allowRotation: document.getElementById('input-lifecycle-allow-rotation')?.checked !== false,
                    sharedPityParent: document.getElementById('input-shared-pity-parent')?.value || '',
                    rotationMatrix: {
                        inheritPityPulls: document.getElementById('input-inherit-pity-pulls')?.checked !== false,
                        inheritGuaranteeState: document.getElementById('input-inherit-guarantee-state')?.checked !== false,
                        inheritRescueLosses: document.getElementById('input-inherit-rescue-losses')?.checked !== false,
                        resetEarlyUp: document.getElementById('input-reset-early-up')?.checked !== false,
                        resetCatSeq: document.getElementById('input-reset-cat-seq')?.checked !== false,
                        resetSparkPity: document.getElementById('input-reset-spark-pity')?.checked !== false,
                        resetGiftRules: document.getElementById('input-reset-gift-rules')?.checked !== false
                    }
                }
            };

            localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
            poolChangeTracker.reset(); // 保存成功后更新基准，避免离开时重复提示。
            if (showAlert) {
                showToast("保存完毕！", "success");
            }
            return true;
        }

        window.savePoolConfig = function() {
            if (document.body.classList.contains('preview-mode')) return;
            const success = executeSavePool(true);
            if (success) {
                setTimeout(() => {
                    window.location.href = `dashboard.html?gameId=${gameId}&pool=${currentPool}`;
                }, 600);
            }
        };

        // 保留原先的绿色成功、红色删除与灰色撤回提示。
        window.showToast = Toast.create().show;

        // 卡池页复用原有删除弹窗节点、按钮文字和样式。
        const poolActionDialog = Dialog.create({
            elements: {
                overlay: 'confirmModalOverlay', message: 'confirm-modal-text',
                confirm: 'btn-confirm-ok', cancel: 'btn-confirm-cancel'
            },
            defaults: () => ({
                okText: Dialog.text('confirm_delete', '确认删除'),
                cancelText: Dialog.text('cancel', '取消')
            })
        });

        // 确认后才执行传入的删除回调；公共组件不接触卡池数据。
        async function openActionConfirm(message, onConfirm) {
            const confirmed = await poolActionDialog.confirm(message);
            if (confirmed) {
                onConfirm();
                showToast(getTrans('cp_toast_del_success'), 'danger');
            } else {
                showToast(getTrans('cp_toast_cancel_del'), 'cancel');
            }
            return confirmed;
        }

        function appendPityRuleRow(rule = null) {
            const container = document.getElementById('unified-pities-container');
            if (!container) return;

            const rowId = 'pity_row_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
            const tierId = rule?.tierId || (globalTiers[0]?.id || 'tier_S');
            const pulls = rule?.pulls ?? 90;
            const resetOnHit = rule?.resetOnHit !== false;
            const enableUp = rule?.enableUp !== false;
            const upRate = rule?.upRate !== undefined ? (rule.upRate <= 1 ? parseFloat((rule.upRate * 100).toFixed(2)) : rule.upRate) : 50;
            const useGuarantee = rule?.useGuarantee !== false;
            const guaranteeLimit = rule?.guaranteeLimit ?? 1;
            const softEnabled = !!rule?.softEnabled;
            const softRules = rule?.softRules || rule?.softRule || [];
            const guaranteeMode = rule?.guaranteeMode || 'classic';
            const guaranteeStep = rule?.guaranteeStep ?? 25;
            const guaranteeMax = rule?.guaranteeMax ?? 100;

            // 星级选项仅显示当前语言的名称；目标金状态仍由规则配置管理。
            let tierOptions = '';
            globalTiers.forEach(t => {
                const sel = (t.id === tierId) ? 'selected' : '';
                const displayTierName = getTierDisplayName(t);
                tierOptions += `<option value="${t.id}" ${sel} style="color: ${t.color};">${displayTierName}</option>`;
            });

            const row = document.createElement('div');
            row.id = rowId;
            row.className = 'unified-pity-row';
            row.style = "background: rgba(0,0,0,0.2); border: 1px solid var(--border); border-left: 4px solid #3498db; border-radius: 8px; padding: 14px; margin-bottom: 14px;";

            row.innerHTML = `
                <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                    <span style="color: #aaa; font-size: 13px;">${getTrans('cp_sec2_reach')}</span>
                    <input type="number" class="input-box input-pity-pulls" style="width: 75px; text-align: center; padding: 5px;" value="${pulls}">
                    <span style="color: #aaa; font-size: 13px;">${getTrans('cp_sec2_guaranteed_output')}</span>
                    <select class="input-box select-pity-tier" style="width: 145px; padding: 5px;">
                        ${tierOptions}
                    </select>

                    <label style="display: flex; align-items: center; gap: 5px; cursor: pointer; color: #ddd; font-size: 12px; margin-left: 5px;">
                        <input type="checkbox" class="toggle-checkbox input-pity-reset" ${resetOnHit ? 'checked' : ''}>
                        <span>${getTrans('cp_sec2_reset_early')}</span>
                    </label>

                    <button type="button" class="preview-edit-action btn btn-action-gray" style="margin-left: auto; color: #ff4757; padding: 2px 8px; font-size: 12px;" onclick="requestRemovePityRow(this)">
                        ${getTrans('delete_rule')}
                    </button>
                </div>

                <div style="margin-top: 10px; padding-top: 10px; border-top: 1px dashed rgba(255,255,255,0.08); display: flex; align-items: center; gap: 15px; flex-wrap: wrap;">
                    <label style="display: inline-flex; align-items: center; gap: 8px; cursor: pointer; color: var(--primary); font-size: 13px; font-weight: bold; width: 140px;">
                        <input type="checkbox" class="toggle-checkbox input-pity-enable-up" ${enableUp ? 'checked' : ''} onchange="togglePityRowUp(this)">
                        <span>${getTrans('cp_sec2_enable_up')}</span>
                    </label>

                    <div class="pity-uprate-wrap" style="display: ${enableUp ? 'inline-flex' : 'none'}; align-items: center; gap: 6px;">
                        <span style="color: #888; font-size: 12px;">${getTrans('cp_sec2_up_winrate')}</span>
                        <input type="number" class="input-box input-pity-uprate" style="width: 70px; text-align: right; padding: 4px;" value="${upRate}">
                        <span style="color: #888; font-size: 12px;">%</span>
                    </div>
                </div>

                <div style="margin-top: 8px; display: flex; align-items: center; gap: 15px; flex-wrap: wrap;">
                    <label style="display: inline-flex; align-items: center; gap: 8px; cursor: pointer; color: #9b59b6; font-size: 13px; font-weight: bold; width: 140px;">
                        <input type="checkbox" class="toggle-checkbox input-pity-use-guarantee" ${useGuarantee ? 'checked' : ''} onchange="togglePityRowGuarantee(this)">
                        <span>${getTrans('cp_sec2_enable_guarantee')}</span>
                    </label>

                    <div class="pity-guarantee-limit-wrap" style="display: ${useGuarantee ? 'inline-flex' : 'none'}; align-items: center; gap: 8px; font-size: 12px; color: #aaa; flex-wrap: wrap;">
                        <select class="input-box select-pity-guarantee-mode" style="padding: 3px 6px; font-size: 12px; width: 180px;" onchange="toggleGuaranteeModeUI(this)">
                            <option value="classic" ${guaranteeMode === 'classic' ? 'selected' : ''}>${getTrans('cp_sec2_mode_classic')}</option>
                            <option value="progressive" ${guaranteeMode === 'progressive' ? 'selected' : ''}>${getTrans('cp_sec2_mode_progressive')}</option>
                        </select>

                        <span class="wrap-guarantee-classic" style="display: ${guaranteeMode === 'classic' ? 'inline-flex' : 'none'}; align-items: center; gap: 4px;">
                            <span>${getTrans('cp_sec2_classic_1')}</span>
                            <input type="number" class="input-box input-pity-guarantee-limit" style="width: 50px; text-align: center; padding: 4px;" value="${guaranteeLimit}" min="1">
                            <span>${getTrans('cp_sec2_classic_2')}</span>
                        </span>

                        <span class="wrap-guarantee-progressive" style="display: ${guaranteeMode === 'progressive' ? 'inline-flex' : 'none'}; align-items: center; gap: 4px;">
                            <span>${getTrans('cp_sec2_progressive_step')}</span>
                            <input type="number" class="input-box input-pity-guarantee-step" style="width: 55px; text-align: center; padding: 4px;" value="${guaranteeStep}" min="1" max="100">
                            <span>${getTrans('cp_sec2_progressive_max')}</span>
                            <input type="number" class="input-box input-pity-guarantee-max" style="width: 55px; text-align: center; padding: 4px;" value="${guaranteeMax}" min="1" max="100">
                            <span>%</span>
                        </span>
                    </div>
                </div>

                <div style="margin-top: 8px;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <label style="display: inline-flex; align-items: center; gap: 8px; cursor: pointer; color: #3498db; font-size: 13px; font-weight: bold;">
                            <input type="checkbox" class="toggle-checkbox input-pity-enable-soft" ${softEnabled ? 'checked' : ''} onchange="togglePityRowSoft(this)">
                            <span>${getTrans('cp_sec2_enable_soft')}</span>
                        </label>
                        <button type="button" class="btn btn-action-gray btn-add-soft-segment" 
                                style="display: ${softEnabled ? 'inline-block' : 'none'}; padding: 2px 8px; font-size: 11px; color: #3498db; border-style: dashed;" 
                                onclick="appendSoftSegment(this)">
                            ${getTrans('cp_sec2_btn_add_segment')}
                        </button>
                    </div>

                    <div class="soft-pity-segments-wrap" style="display: ${softEnabled ? 'flex' : 'none'}; flex-direction: column; gap: 6px; margin-top: 8px;"></div>
                </div>
            `;

            container.appendChild(row);

            const segmentsWrap = row.querySelector('.soft-pity-segments-wrap');
            if (softRules.length > 0) {
                softRules.forEach(sr => {
                    const incVal = sr.inc <= 1 ? parseFloat((sr.inc * 100).toFixed(3)) : sr.inc;
                    appendSoftSegmentRow(segmentsWrap, sr.start, sr.end, incVal);
                });
            } else if (softEnabled) {
                appendSoftSegmentRow(segmentsWrap, 74, 89, 6.0);
            }
        }

        // 🌟 2. 去除所有 placeholder（起始、结束、概率%），纯净输入
        function appendSoftSegmentRow(container, start = "", end = "", inc = "") {
            const div = document.createElement('div');
            div.className = 'soft-segment-row';
            div.style = "display: flex; align-items: center; gap: 8px; background: rgba(0,0,0,0.2); padding: 5px 10px; border-radius: 4px; font-size: 12px; color: #aaa;";
            div.innerHTML = `
                <span>${getTrans('cp_sec2_soft_1')}</span>
                <input type="number" class="input-box input-soft-start" style="width: 60px; padding: 4px; text-align: center;" value="${start}">
                <span>-</span>
                <input type="number" class="input-box input-soft-end" style="width: 60px; padding: 4px; text-align: center;" value="${end}">
                <span>${getTrans('cp_sec2_soft_2')}</span>
                <input type="number" class="input-box input-soft-inc" style="width: 70px; padding: 4px; text-align: right;" value="${inc}">
                <span>%</span>
                <button type="button" class="preview-edit-action btn btn-action-gray" style="margin-left: auto; color: #ff4757; padding: 1px 6px; font-size: 11px;" onclick="requestRemoveSoftSegment(this)">✕</button>
            `;
            container.appendChild(div);
        }

        window.appendSoftSegment = function(btnEl) {
            const wrap = btnEl.closest('.unified-pity-row').querySelector('.soft-pity-segments-wrap');
            appendSoftSegmentRow(wrap);
        };

        window.togglePityRowGuarantee = function(cbEl) {
            const wrap = cbEl.closest('.unified-pity-row').querySelector('.pity-guarantee-limit-wrap');
            wrap.style.display = cbEl.checked ? 'inline-flex' : 'none';
        };

        window.togglePityRowSoft = function(cbEl) {
            const row = cbEl.closest('.unified-pity-row');
            const wrap = row.querySelector('.soft-pity-segments-wrap');
            const addBtn = row.querySelector('.btn-add-soft-segment');
            wrap.style.display = cbEl.checked ? 'flex' : 'none';
            addBtn.style.display = cbEl.checked ? 'inline-block' : 'none';
            if (cbEl.checked && wrap.children.length === 0) {
                appendSoftSegmentRow(wrap, 74, 89, 6.0);
            }
        };

        window.requestRemovePityRow = function(btnEl) {
            if (document.body.classList.contains('preview-mode')) return;
            openActionConfirm(getTrans('cp_sec2_del_pity_confirm'), () => {
                btnEl.closest('.unified-pity-row').remove();
            });
        };

        function getPoolMeta(poolId) {
            // 元数据来源和兜底统一读取；本页只处理名称显示和表单渲染。
            return GameData.loadPoolMeta(gameId, poolId);
        }

        function getPoolDisplayName(poolId) {
            const meta = getPoolMeta(poolId);
            const currentLang = localStorage.getItem('GM_Lang') || 'zh';
            return (currentLang === 'en' && meta.en) ? meta.en : meta.name;
        }

        function captureCurrentConfigString() {
            try {
                const activeTiers = [];
                for (let t of globalTiers) {
                    let state = poolTierState[t.id];
                    if (state?.enabled) {
                        activeTiers.push({ 
                            id: t.id, 
                            prob: state.prob, 
                            isGold: selectedGoldIds.includes(t.id),
                            hasSubProbs: Array.isArray(state.subProbs) && state.subProbs.length > 0
                        });
                    }
                }
                const pitiesCount = document.querySelectorAll('.unified-pity-row').length;
                const subDrawersCount = document.querySelectorAll('.sub-condition-slice').length;
                return JSON.stringify({ poolAssembly, activeTiers, pitiesCount, subDrawersCount, rescueLabelDraft });
            } catch(e) {
                return "";
            }
        }

        window.markPageDirty = function() {
            poolChangeTracker.markDirty();
        };

        function initDirtyTracking() {
            poolChangeTracker.start();
        }

        function checkHasUnsavedChanges() {
            return poolChangeTracker.hasChanges();
        }

        // 页面只定义比较内容，标记/快照管理与三选一交互共用同一文件。
        const poolChangeTracker = UnsavedChanges.createTracker({ getSnapshot: captureCurrentConfigString });
        const poolUnsaved = UnsavedChanges.create({
            tracker: poolChangeTracker,
            // 手动锁定预览不等于已保存；只对系统预设只读页免除提醒。
            shouldConfirm: () => checkHasUnsavedChanges() && !document.body.classList.contains('is-preset-game'),
            save: () => executeSavePool(true),
            onError: error => { console.error(error); showToast(error.message, 'danger'); },
            saveDelay: 600
        });
        window.safeNavigate = targetUrl => poolUnsaved.request(targetUrl);

        document.addEventListener('DOMContentLoaded', () => {
            poolUnsaved.bindLinks(document.querySelector('.sidebar'));
        });

        function toggleRescueStrategyInputs() {
            const strategy = document.getElementById('input-rescue-up-strategy').value;
            const wrap = document.getElementById('rescue-value-input-wrap');
            const prefix = document.getElementById('rescue-value-prefix');
            const input = document.getElementById('input-rescue-strategy-value');

            if (strategy === 'decay') {
                wrap.style.display = 'inline-flex';
                prefix.innerText = getTrans('cp_sec3_decay_prefix');
                if (!input.value) input.value = 1;
            } else if (strategy === 'set_to') {
                wrap.style.display = 'inline-flex';
                prefix.innerText = getTrans('cp_sec3_set_to_prefix');
                if (!input.value) input.value = 1;
            } else {
                wrap.style.display = 'none';
            }
        }

        window.toggleGuaranteeModeUI = function(selectEl) {
            const wrap = selectEl.closest('.pity-guarantee-limit-wrap');
            const mode = selectEl.value;
            const classicWrap = wrap.querySelector('.wrap-guarantee-classic');
            const progressiveWrap = wrap.querySelector('.wrap-guarantee-progressive');

            if (classicWrap) classicWrap.style.display = mode === 'classic' ? 'inline-flex' : 'none';
            if (progressiveWrap) progressiveWrap.style.display = mode === 'progressive' ? 'inline-flex' : 'none';
        };

        function toggleRotationSettingsPanel() {
            const allowRotation = document.getElementById('input-lifecycle-allow-rotation')?.checked;
            const detailsContainer = document.getElementById('rotation-details-container');
            if (detailsContainer) {
                detailsContainer.style.display = allowRotation ? 'block' : 'none';
            }
        }

function populateParentPoolOptions() {
    const selectEl = document.getElementById('input-shared-pity-parent');
    if (!selectEl) return;

    // 仅列出可抽卡池，不再把旧版“往期限定”图鉴组误当成共享对象。
    const pendingDeleted = JSON.parse(sessionStorage.getItem(`GM_Pending_Deleted_Pools_${gameId}`) || '[]');
    const poolMap = new Map(GameData.loadPoolIds(gameId, { standaloneOnly: true })
        .filter(id => !pendingDeleted.includes(id)).map(id => [id, getPoolDisplayName(id)]));

    // 2. 国际化构建下拉选项，排除当前正在编辑的池子自身
    let html = `<option value="">${getTrans('cp_sec13_shared_none')}</option>`;

    poolMap.forEach((poolName, pId) => {
        if (pId !== currentPool) {
            const text = getTrans('cp_sec13_shared_with').replace('{name}', poolName);
            html += `<option value="${pId}">${text}</option>`;
        }
    });

    // 保留原本选中的父卡池绑定值
    const currentSelected = selectEl.value;
    selectEl.innerHTML = html;
    if (currentSelected && poolMap.has(currentSelected)) {
        selectEl.value = currentSelected;
    }

    // 🌟 核心修复：移除旧的自定义下拉框外壳与标记，重新渲染
    selectEl.classList.remove('custom-select-original');
    if (selectEl.nextElementSibling?.classList.contains('custom-select-ui')) {
        selectEl.nextElementSibling.remove();
    }
    if (typeof window.refreshCustomDropdowns === 'function') {
        window.refreshCustomDropdowns();
    }
}

        function syncRotationInheritVisibility() {
            const hasRescue = document.getElementById('input-enable-rescue')?.checked;
            const hasSpark  = document.getElementById('input-enable-spark')?.checked;
            const hasEarly  = document.getElementById('input-enable-early-up')?.checked;
            const hasCatSeq = document.getElementById('input-enable-cat-seq')?.checked;
            const hasGift   = document.getElementById('input-enable-gift')?.checked;

            const setVisible = (id, visible) => {
                const el = document.getElementById(id);
                if (el) el.style.display = visible ? 'flex' : 'none';
            };

            setVisible('wrap-inherit-rescue-losses', hasRescue);
            setVisible('wrap-reset-spark-pity', hasSpark);
            setVisible('wrap-reset-early-up', hasEarly);
            setVisible('wrap-reset-cat-seq', hasCatSeq);
            setVisible('wrap-reset-gift-rules', hasGift);
        }

        // 获取当前仓库中已存在的大类列表（包含预设与自定义）
function getAvailableCategories() {
    return GameData.loadCategories(gameId, { catalog: pureCatalog });
}

// 规则框只移动 DOM 节点：不重建表单、不重编号，不改变任何输入值或勾选状态。
function initRuleDragSorting() {
    const root = document.querySelector('.setup-container');
    if (!root) return;
    const selectors = ['.sub-prob-group-row', '.sub-condition-slice', '.unified-pity-row',
        '.early-up-rule-row', '.cat-seq-rule-row', '.spec-rule-row', '.spark-rule-row', '.gift-rule-row'];
    const signatures = new WeakMap();
    let serial = 0;
    function syncSubGroups(row) {
        const drawer = row.closest('.sub-prob-drawer');
        if (!drawer) return;
        const tierId = drawer.id.replace('sub-prob-drawer-', '');
        if (!poolTierState[tierId]) return;
        // 同步编辑态，后续刷新稀有度面板时仍能恢复新顺序；保存仍由原函数校验数值。
        poolTierState[tierId].subProbs = [...drawer.querySelectorAll('.sub-prob-group-row')].map(group => ({
            prob: group.querySelector('.input-sub-group-prob')?.value || '',
            conditions: [...group.querySelectorAll('.sub-condition-slice')].map(slice => ({
                cat: slice.querySelector('.select-cond-cat')?.value || '',
                tags: [...slice.querySelectorAll('.cb-cond-tag:checked')].map(cb => cb.value)
            }))
        }));
    }
    function refreshBindings() {
        for (const selector of selectors) {
            const parents = new Set();
            root.querySelectorAll(selector).forEach(row => {
                if (!row.dataset.ruleDragId) row.dataset.ruleDragId = 'rule_drag_' + ++serial;
                row.classList.add('pool-rule-sortable');
                if (!row.querySelector(':scope > .pool-rule-drag-handle')) {
                    const handle = document.createElement('span');
                    handle.className = 'pool-rule-drag-handle';
                    handle.textContent = '⠿';
                    handle.title = sysLang === 'en' ? 'Drag to reorder (values unchanged)' : '拖拽调整顺序（不修改数值）';
                    row.insertBefore(handle, row.firstChild);
                }
                parents.add(row.parentElement);
            });
            parents.forEach(parent => {
                const rows = [...parent.children].filter(row => row.matches(selector));
                const signature = rows.map(row => row.dataset.ruleDragId).join('|');
                const previous = signatures.get(parent) || new Map();
                if (previous.get(selector) === signature) return;
                previous.set(selector, signature);
                signatures.set(parent, previous);
                DragSort.bind(parent, selector, (fromId, toId, before) => {
                    const from = rows.find(row => row.dataset.ruleDragId === fromId);
                    const to = rows.find(row => row.dataset.ruleDragId === toId);
                    if (!from || !to || from.parentElement !== to.parentElement) return;
                    parent.insertBefore(from, before ? to : to.nextSibling);
                    syncSubGroups(from);
                    markPageDirty();
                }, {
                    handleSelector: '.pool-rule-drag-handle', handleOnly: true,
                    getId: row => row.dataset.ruleDragId,
                    canDrag: () => !poolPreviewLock.isLocked()
                });
            });
        }
    }
    refreshBindings();
    // 新增、删除、展开重渲染后自动补绑定；签名相同时不重绑，避免手柄插入引发循环。
    new MutationObserver(refreshBindings).observe(root, { childList: true, subtree: true });
}
document.addEventListener('DOMContentLoaded', initRuleDragSorting);

