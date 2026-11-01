/**
 * 图鉴设置：物品、标签、分类、图片、拖拽、导入导出和保存。
 * 由 gallery_setup.html 底部加载，保持原先的依赖和执行顺序。
 * 使用普通 script，全局函数仍可供 HTML 内联 onclick 调用。
 */
const urlParams = new URLSearchParams(window.location.search);
        let gameId = urlParams.get('gameId');
        let returnedEconomyChanges = false;
        let pendingCurrencyImport = false;
        // 读取实时语言，编辑器切换语言时无需重建格式器。
        const getLang = ItemFormat.getLanguage;

        // 默认标签字典
        const DEFAULT_TAG_DEFINITIONS = {
            up: { name: "限定 UP", en: "Limited UP", color: "#f1c40f", textColor: "#000" },
            custom_offrate: { name: "定制可歪", en: "Customized", color: "#e67e22", textColor: "#fff" },
            std: { name: "常驻", en: "Standard", color: "#3498db", textColor: "#fff" },
            gift: { name: "赠送", en: "Gift/Free", color: "#2ecc71", textColor: "#000" },
            normal: { name: "常规副产物", en: "Regular", color: "#95a5a6", textColor: "#000" }
        };

        let gameInfo = {
            gameName: '',
            enGameName: '',
            globalTiers: [],
            tagDefinitions: null,
            categories: [
                { id: 'char', name: '角色 / 代理人', en: 'Agent / Character', icon: '👤' },
                { id: 'wep',  name: '光锥 / 音擎 / 武器', en: 'Weapon / W-Engine', icon: '🗡️️' },
                { id: 'pet',  name: '邦布 / 随宠', en: 'Bangboo / Pet', icon: '🐾' }
            ]
        };

        let catalog = {};
        let tierOpenState = {};
        let tierFilterState = {};
        let categoryOpenState = {};
        let editingItemRef = null;
        let tempBase64Img = "";
        let itemImageUploader = null; // 弹窗重新打开时取消上一张尚未完成的图片处理。

        // 导入期间的卡池列表、顺序与规则只存在内存，保存前不影响正式存储/侧栏。
        let pendingEngineWrites = null;
        function readEngineEdit(key) {
            return pendingEngineWrites?.has(key) ? pendingEngineWrites.get(key) : localStorage.getItem(key);
        }
        function writeEngineEdit(key, value) {
            if (pendingEngineWrites) pendingEngineWrites.set(key, value);
            else localStorage.setItem(key, value); // 非导入时保留原来的编辑行为。
        }
        function beginEngineImport() { pendingEngineWrites = new Map(); }

        // 保存采用可回滚批量提交；任一步失败不清草稿，也不显示保存成功。
        function commitEngineEdits(writes, removedKeys = []) {
            const previous = new Map([...writes.keys(), ...removedKeys].map(key => [key, localStorage.getItem(key)]));
            try {
                for (const [key, value] of writes) localStorage.setItem(key, value);
                for (const key of removedKeys) localStorage.removeItem(key);
            } catch (error) {
                // 先释放本次新增/增大的内容，再恢复旧值，降低配额不足时的回滚风险。
                try {
                    for (const key of previous.keys()) localStorage.removeItem(key);
                    for (const [key, value] of previous) if (value !== null) localStorage.setItem(key, value);
                } catch (rollbackError) { console.error('保存回滚失败：', rollbackError); }
                throw error;
            }
        }
        const DEFAULT_COLORS = ["#f1c40f", "#9b59b6", "#3498db", "#2ecc71", "#95a5a6", "#ff4757"];

        function getActiveTagDefinitions() {
            return gameInfo.tagDefinitions || DEFAULT_TAG_DEFINITIONS;
        }

        // 图鉴编辑页保留空名称为空字符串的行为，统一处理中英文展示。
        const {
            getItemName: getLocalizedItemName,
            getTierName: getLocalizedTierName,
            getLabelName: getLocalizedTagName
        } = ItemFormat.create({
            getCatalog: () => catalog,
            getTiers: () => gameInfo.globalTiers,
            missingItem: '',
            missingTier: '',
            fallbackTierId: false
        });
        const getLocalizedCatName = getLocalizedTagName;

        function normalizeCatalogTags(rawTags, tierId, tagDefs) {
            const sourceTags = Array.isArray(rawTags) ? rawTags : (rawTags ? [rawTags] : []);
            const normalized = [];

            sourceTags.forEach(tag => {
                if (typeof tag !== 'string') return;
                if (tagDefs[tag]) {
                    normalized.push(tag);
                    return;
                }
                if (tag.includes('collab')) normalized.push('collab');
                if (tag.includes('reup')) normalized.push('reup');
                if (tag.includes('custom_offrate') || tag.includes('std_2')) normalized.push('custom_offrate');
                if (tag.includes('gift') || tag.includes('free') || tag.includes('non')) normalized.push('gift');
                if (tag.includes('std') && !tag.includes('std_2')) normalized.push('std');
                if (tag.includes('normal')) normalized.push('normal');
                if (tag.includes('up')) normalized.push('up');
            });

            if (normalized.length === 0) {
                normalized.push(tierId.includes('5') || tierId.includes('6') || tierId.includes('S') ? 'up' : 'normal');
            }
            return [...new Set(normalized)];
        }

        window.addEventListener('DOMContentLoaded', () => {
            sessionStorage.removeItem(`GM_Pending_Deleted_Pools_${gameId}`);
            if (typeof renderSidebar === 'function') renderSidebar();
            initOrMigrateCatalog();
            restoreEconomyDraft();
    
            const isEn = getLang() === 'en';
            document.getElementById('input-game-name').value = (isEn && gameInfo.enGameName) ? gameInfo.enGameName : (gameInfo.gameName || '');
            
            renderGlobalTiers();
            renderCustomTags();
            renderCustomPoolsList();
            renderCategories();
            setupImageUploader();
            updateImportVisibility();
            initializeGalleryPanelDefaults();
    
            if (typeof PRESET_GAME_IDS !== 'undefined' && PRESET_GAME_IDS.includes(gameId)) {
                applySilentPresetLock();
            }

            if (window.applyTranslations) window.applyTranslations();

            setTimeout(initDirtyTracking, 300);

            galleryUnsaved.bindLinks(document.querySelector('.sidebar'));
            galleryUnsaved.bindBeforeUnload?.();
        });

        function initOrMigrateCatalog() {
            let savedInfo = JSON.parse(localStorage.getItem('GM_Info_' + gameId)) || {};
            gameInfo = Object.assign(gameInfo, savedInfo);

            // 按需读取独立预设副本，图鉴迁移和写回仍由本页明确执行。
            const setupRules = GameData.getPresetSetup(gameId);
            if (setupRules && setupRules.tagDefinitions) {
                gameInfo.tagDefinitions = JSON.parse(JSON.stringify(setupRules.tagDefinitions));
            } else if (!gameInfo.tagDefinitions) {
                gameInfo.tagDefinitions = Object.assign({}, DEFAULT_TAG_DEFINITIONS);
            }

            if (setupRules && Array.isArray(setupRules.categories) && setupRules.categories.length > 0) {
                gameInfo.categories = JSON.parse(JSON.stringify(setupRules.categories));
            }

            if (!gameInfo.globalTiers || gameInfo.globalTiers.length === 0) {
                const presetTiers = GameData.getPresetTiers(gameId);
                gameInfo.globalTiers = presetTiers ? JSON.parse(JSON.stringify(presetTiers)) : [
                    { id: 'tier_5', name: '5', en: '5-Star', color: '#f1c40f' },
                    { id: 'tier_4', name: '4', en: '4-Star', color: '#9b59b6' },
                    { id: 'tier_3', name: '3', en: '3-Star', color: '#3498db' }
                ];
            }

            let savedCatalog = JSON.parse(localStorage.getItem('GM_Catalog_' + gameId));
            const originalCatalogJSON = JSON.stringify(savedCatalog);
            // Apply the same published corrections as dashboard/simulator without clearing local data.
            if (savedCatalog) savedCatalog = GameData.refreshPresetCatalog(gameId, savedCatalog);
            const liveDB = gameId ? GameData.getPresetItems(gameId) : (typeof DB !== 'undefined' ? DB : null);
            const presetTagsByName = new Map((Array.isArray(liveDB) ? liveDB : []).map(item => [
                item.name,
                item.tags || item.tag || item.type || []
            ]));

            // 1. 如果已有本地缓存，补全字段并更新
            if (savedCatalog) {
                catalog = savedCatalog;
                let catalogWasMigrated = JSON.stringify(savedCatalog) !== originalCatalogJSON;
                for (let catId in catalog) {
                    catalog[catId].forEach(item => {
                        const sourceTags = presetTagsByName.get(item.name) || item.tags || item.tag || item.type || [];
                        const normalizedTags = normalizeCatalogTags(sourceTags, item.tierId || '', getActiveTagDefinitions());
                        if (JSON.stringify(item.tags || []) !== JSON.stringify(normalizedTags) || item.tag !== undefined) {
                            catalogWasMigrated = true;
                        }
                        item.tags = normalizedTags;
                        delete item.tag;

                        // 在循环内部安全补齐 en / eshort
                        if (liveDB && Array.isArray(liveDB)) {
                            const dbItem = CatalogUtils.findItem(liveDB, item);
                            if (dbItem) {
                                if (!item.en && dbItem.en) { item.en = dbItem.en; catalogWasMigrated = true; }
                                if (!item.eshort && dbItem.eshort) { item.eshort = dbItem.eshort; catalogWasMigrated = true; }
                            }
                        }
                    });
                }
                if (catalogWasMigrated) {
                    localStorage.setItem('GM_Catalog_' + gameId, JSON.stringify(catalog));
                }
            } 
            // 2. 如果没有本地缓存（首次访问预设游戏或纯新建），从预设库生成初始图鉴
            else {
                catalog = {};
                gameInfo.categories.forEach(c => catalog[c.id] = []);

                if (liveDB && Array.isArray(liveDB)) {
                    liveDB.forEach(item => {
                        let tId = item.tierId || ('tier_' + (item.star || 5));
                        let catId = item.category;
                        if (!catId) {
                            let tStr = Array.isArray(item.type) ? item.type[0] : (item.type || '');
                            if (tStr.startsWith('wep') || item.img?.includes('weapon')) {
                                catId = 'wep';
                            } else if (tStr.startsWith('pet') || tStr.startsWith('bangboo') || item.img?.includes('bangboo')) {
                                catId = 'pet';
                            } else {
                                catId = 'char';
                            }
                        }

                        let rawTags = item.tags || item.tag || item.type || [];
                        if (!Array.isArray(rawTags)) rawTags = [rawTags];
                        const assignedTags = normalizeCatalogTags(rawTags, tId, getActiveTagDefinitions());

                        if (!catalog[catId]) catalog[catId] = [];
                        if (!catalog[catId].some(x => x.name === item.name)) {
                            catalog[catId].push({
                                id: item.id || ('item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4)),
                                name: item.name,
                                en: item.en || item.name,
                                short: item.short || item.name,
                                eshort: item.eshort || item.en || item.name,
                                tierId: tId,
                                tags: [...new Set(assignedTags)],
                                img: item.img || '',
                                ...(Array.isArray(item.legacyIds) ? { legacyIds: [...item.legacyIds] } : {}),
                                ...(item.ownershipId ? { ownershipId: item.ownershipId } : {}),
                                ...(Array.isArray(item.aliases) ? { aliases: [...item.aliases] } : {})
                            });
                        }
                    });
                }
            }

            let highestTierId = gameInfo.globalTiers[0]?.id;
            gameInfo.categories.forEach(c => {
                gameInfo.globalTiers.forEach(t => {
                    let stateKey = `${c.id}_${t.id}`;
                    if (tierOpenState[stateKey] === undefined) {
                        tierOpenState[stateKey] = window.PanelDefaults?.initial('gallery_setup', 'tiers', gameInfo.globalTiers.indexOf(t)) ?? (t.id === highestTierId);
                    }
                    if (!tierFilterState[stateKey]) {
                        tierFilterState[stateKey] = 'all';
                    }
                });
            });

            if (setupRules && setupRules.overflowRules) {
                gameInfo.overflowRules = Object.assign({ char: 7, wep: 5, pet: 5, other: 5 }, setupRules.overflowRules);
            } else if (!gameInfo.overflowRules) {
                gameInfo.overflowRules = { char: 7, wep: 5, pet: 5, other: 5 };
            }
        }

        // 图鉴保留预设专属 CSS 和部分控件例外，公共组件只统一锁定交互。
        const galleryPreviewLock = PreviewLock.create({
            isPreset: () => typeof PRESET_GAME_IDS !== 'undefined' && PRESET_GAME_IDS.includes(gameId),
            presetPreview: true,
            getLabels: () => ({
                lock: window.getTrans ? window.getTrans('lock_preview') : '👁️ 锁定预览',
                unlock: window.getTrans ? window.getTrans('unlock_preview') : '🔓 解除预览',
                banner: window.getTrans ? window.getTrans('cs_preset_banner') : '⚠️ 系统预设游戏：当前界面的图鉴与底层设定完全只读。如需自定义，请返回新建游戏。'
            }),
            banner: {
                id: 'preset-lock-banner',
                style: 'background: rgba(255, 193, 7, 0.15); border: 1px solid #ffc107; color: #ffc107; padding: 14px; border-radius: 8px; margin-bottom: 20px; text-align: center; font-weight: bold; user-select: none;'
            },
            onPreset() {
                const saveBtn = document.getElementById('btn-save-all');
                if (saveBtn) {
                    saveBtn.innerText = window.getTrans ? window.getTrans('cs_preset_btn_readonly') : "🔒 预设游戏只读预览";
                    saveBtn.className = "btn btn-action-gray";
                }

                const noop = () => {};
                window.saveAllAndGenerate = noop;
                window.deleteEntireGame = noop;
                window.openAddItemModal = noop;
                window.openEditItemModal = noop;
                window.deleteItem = (c, i, e) => { if(e) e.stopPropagation(); };
                window.addNewCategory = noop;
                window.renameCategory = noop;
                window.deleteCategory = noop;
                window.addGlobalTier = noop;
                window.removeTier = noop;

                const addTagBtn = document.getElementById('btn-add-tag');
                if (addTagBtn) addTagBtn.style.display = 'none';
            }
        });
        // 不仅靠 CSS：禁用配置原生控件，避免键盘、文件选择及美化控件漏锁。
        const readonlyControlStates = new WeakMap();
        function syncGalleryReadonlyControls() {
            const locked = galleryPreviewLock.isLocked();
            document.querySelectorAll('.setup-container input, .setup-container select, .setup-container textarea, .setup-container .paint-swatch, #itemModalOverlay input, #itemModalOverlay select').forEach(control => {
                if (locked) {
                    if (!readonlyControlStates.has(control)) readonlyControlStates.set(control, control.disabled);
                    // 重复写入 disabled 也会触发属性监听；下拉框重建后会再次调用这里。
                    // 仅在状态改变时写入，避免与 select_ui 的监听器形成无限更新。
                    if (!control.disabled) control.disabled = true;
                } else if (readonlyControlStates.has(control)) {
                    const previousDisabled = readonlyControlStates.get(control);
                    if (control.disabled !== previousDisabled) control.disabled = previousDisabled;
                    readonlyControlStates.delete(control);
                }
            });
        }
        // 原生 select 被隐藏后，美化按钮仍可点；捕获阶段阻止它打开/更改选项。
        for (const eventName of ['click', 'keydown']) document.addEventListener(eventName, event => {
            if (!galleryPreviewLock.isLocked()) return;
            const control = event.target.closest('.setup-container .custom-select-ui, #itemModalOverlay .custom-select-ui');
            if (control) { event.preventDefault(); event.stopImmediatePropagation(); }
        }, true);
        // 动态重绘的控件也要锁住，不依赖页面是否再次切换预览。
        new MutationObserver(syncGalleryReadonlyControls).observe(document.body, { childList: true, subtree: true });
        window.togglePreviewMode = () => {
            const changed = galleryPreviewLock.toggle();
            syncGalleryReadonlyControls();
            return changed;
        };
        function applySilentPresetLock() {
            galleryPreviewLock.applyPreset();
            syncGalleryReadonlyControls();
        }

        // ==========================================
        // 渲染：全局稀有度设定
        // ==========================================
        function renderGlobalTiers() {
            const wrap = document.getElementById('global-tiers-container');
            let html = '';
            const isPreset = typeof PRESET_GAME_IDS !== 'undefined' && PRESET_GAME_IDS.includes(gameId);

            gameInfo.globalTiers.forEach(t => {
                const displayName = getLocalizedTierName(t);
                html += `
                <div class="tier-row" data-id="${t.id}" style="border-left: 5px solid ${t.color}; ${ColorStyle.frame(t)} display: flex; align-items: center; gap: 8px;">
                    <span class="drag-handle" title="按住拖拽排序">⠿</span>
                    <button type="button" class="color-picker paint-swatch" data-paint-kind="tier" data-paint-id="${escapeEditorAttribute(t.id)}" style="background:${ColorStyle.background(t)}" aria-label="${getTrans('color_edit')} · ${escapeEditorAttribute(displayName)}" ${isPreset ? 'disabled' : ''}></button>
                    <div style="flex: 1; display: flex; align-items: center; gap: 10px;">
                        <input type="text" class="input-box input-tier-name" value="${escapeEditorAttribute(displayName)}" style="width: 140px; font-weight: bold; color: ${t.color};" onchange="updateTier('${t.id}', 'name', this.value)" placeholder="${window.getTrans('cs_tier_name_ph')}" ${isPreset ? 'readonly' : ''}>
                        <span style="font-size: 11px; color: #888;">${window.getTrans('cs_tier_base_id')}${t.id}</span>
                    </div>
                    ${isPreset ? '' : `<button class="btn btn-action-gray btn-tier-del" style="color: #ff4757; border: none; background: transparent; cursor: pointer;" onclick="removeTier('${t.id}')">✕</button>`}
                </div>`;
            });
            wrap.innerHTML = html;

            bindDragEvents('global-tiers-container', '.tier-row', (fromId, toId, isBefore) => {
                const fromIdx = gameInfo.globalTiers.findIndex(x => x.id === fromId);
                const toIdx = gameInfo.globalTiers.findIndex(x => x.id === toId);
                if (fromIdx < 0 || toIdx < 0) return;

                const [movedItem] = gameInfo.globalTiers.splice(fromIdx, 1);
                const insertIdx = gameInfo.globalTiers.findIndex(x => x.id === toId);
                gameInfo.globalTiers.splice(isBefore ? insertIdx : insertIdx + 1, 0, movedItem);

                renderGlobalTiers();
                renderCategories();
            }, '.drag-handle');
        }

        window.addGlobalTier = function() {
    // 预览与官方预设都只读，不能通过残留按钮或直接调用修改数据。
    if (galleryPreviewLock.isLocked()) return;
            const newId = 'tier_' + Date.now();
            const color = DEFAULT_COLORS[gameInfo.globalTiers.length % DEFAULT_COLORS.length];
            const defName = window.getTrans ? window.getTrans('cs_tier_default_name') : '新稀有度';
            gameInfo.globalTiers.push({ id: newId, name: defName, en: defName, color: color });
            renderGlobalTiers();
            renderCategories();
        };

        window.removeTier = async function(id) {
    // 预览与官方预设都只读，不能通过残留按钮或直接调用修改数据。
    if (galleryPreviewLock.isLocked()) return;
            if (gameInfo.globalTiers.length <= 1) {
                return alert(window.getTrans ? window.getTrans('cs_tier_min_warn') : "至少保留一个稀有度星级！");
            }
            const t = gameInfo.globalTiers.find(x => x.id === id);
            let totalItems = 0;
            Object.values(catalog).forEach(items => {
                totalItems += (items || []).filter(i => i.tierId === id).length;
            });

            let extraWarning = totalItems > 0 
                ? (window.getTrans('cs_tier_item_warn') || '').replace('{count}', totalItems)
                : "";

            const tierDisplayName = getLocalizedTierName(t) || id;
            const confirmed = await showConfirmModal({
                title: window.getTrans('cs_tier_del_title').replace('{name}', tierDisplayName),
                msg: `${window.getTrans('cs_tier_del_confirm')}${extraWarning}`
            });

            if (confirmed && !galleryPreviewLock.isLocked()) {
                gameInfo.globalTiers = gameInfo.globalTiers.filter(x => x.id !== id);
                renderGlobalTiers();
                renderCategories();
                markPageDirty();

                // ★ 补上删除成功的红框 Toast 提示
                showToast(window.getTrans('cs_tier_del_toast').replace('{name}', tierDisplayName), "danger");
            }
        };

        window.updateTier = function(id, key, val, language) {
    // 预览与官方预设都只读，不能通过残留按钮或直接调用修改数据。
    if (galleryPreviewLock.isLocked()) return;
    language = language || getLang();
            const t = gameInfo.globalTiers.find(x => x.id === id);
            if (t) { 
                t[key === 'name' && language === 'en' ? 'en' : key] = val;
                if (key === 'color') delete t.paint;
                markPageDirty();
                renderCategories(); 
            }
        };

        // ==========================================
        // 渲染：标签管理列表
        // ==========================================
        function renderCustomTags() {
            const wrap = document.getElementById('custom-tags-container');
            if (!wrap) return;
            const tagDefs = getActiveTagDefinitions();
            const isPreset = typeof PRESET_GAME_IDS !== 'undefined' && PRESET_GAME_IDS.includes(gameId);
            let html = '';

            Object.entries(tagDefs).forEach(([tagKey, def]) => {
                const displayName = getLocalizedTagName(def);
                const inputProps = isPreset ? 'readonly' : `onchange="updateCustomTag('${tagKey}', 'name', this.value)"`;
                const colorProps = isPreset ? 'disabled' : `onchange="updateCustomTag('${tagKey}', 'color', this.value)"`;
                const delBtnHtml = isPreset ? '' : `
                    <button class="btn btn-action-gray btn-tag-del" 
                            style="color: #ff4757; border: none; background: transparent; cursor: pointer;" 
                            onclick="removeCustomTag('${tagKey}')">✕</button>
                `;

                html += `
                <div class="tier-row" data-id="${tagKey}" style="border-left: 5px solid ${def.color}; ${ColorStyle.frame(def)} display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                    <span class="drag-handle" title="按住拖拽排序">⠿</span>
                    <button type="button" class="color-picker paint-swatch" data-paint-kind="tag" data-paint-id="${escapeEditorAttribute(tagKey)}" style="background:${ColorStyle.background(def)}" aria-label="${getTrans('color_edit')} · ${escapeEditorAttribute(displayName)}" ${isPreset ? 'disabled' : ''}></button>
                    <div style="flex: 1; display: flex; align-items: center; gap: 10px;">
                        <input type="text" class="input-box" value="${escapeEditorAttribute(displayName)}" 
                               style="width: 140px; font-weight: bold; color: ${def.color};" 
                               placeholder="${window.getTrans('cs_tag_name_ph')}" ${inputProps}>
                        <span style="font-size: 11px; color: #888;">${window.getTrans('cs_tag_base_key')}${tagKey}</span>
                    </div>
                    ${delBtnHtml}
                </div>`;
            });

            wrap.innerHTML = html;

            bindDragEvents('custom-tags-container', '.tier-row', (fromKey, toKey, isBefore) => {
                const entries = Object.entries(gameInfo.tagDefinitions);
                const fromIdx = entries.findIndex(([k]) => k === fromKey);
                const toIdx = entries.findIndex(([k]) => k === toKey);
                if (fromIdx < 0 || toIdx < 0) return;

                const [movedEntry] = entries.splice(fromIdx, 1);
                const insertIdx = entries.findIndex(([k]) => k === toKey);
                entries.splice(isBefore ? insertIdx : insertIdx + 1, 0, movedEntry);

                gameInfo.tagDefinitions = Object.fromEntries(entries);
                renderCustomTags();
                renderCategories();
            }, '.drag-handle');
        }

window.addCustomTag = function() {
    // 预览与官方预设都只读，不能通过残留按钮或直接调用修改数据。
    if (galleryPreviewLock.isLocked()) return;
    const tagKey = 'tag_' + Date.now().toString(36);
    if (!gameInfo.tagDefinitions) {
        gameInfo.tagDefinitions = Object.assign({}, DEFAULT_TAG_DEFINITIONS);
    }
    
    // 取当前语言环境下的默认名称（如“新标签”或“New Tag”）
    const defName = window.getTrans ? window.getTrans('cs_tag_default_name') : '新标签';
    const color = DEFAULT_COLORS[Object.keys(gameInfo.tagDefinitions).length % DEFAULT_COLORS.length];

    gameInfo.tagDefinitions[tagKey] = {
        name: defName,
        en: defName,
        color: color,
        textColor: "#fff"
    };

    markPageDirty();
    renderCustomTags();
    renderCategories();
};

window.updateCustomTag = function(tagKey, prop, value, language) {
    // 预览与官方预设都只读，不能通过残留按钮或直接调用修改数据。
    if (galleryPreviewLock.isLocked()) return;
    language = language || getLang();
    if (gameInfo.tagDefinitions && gameInfo.tagDefinitions[tagKey]) {
        gameInfo.tagDefinitions[tagKey][prop === 'name' && language === 'en' ? 'en' : prop] = value;
        if (prop === 'color') delete gameInfo.tagDefinitions[tagKey].paint;
        markPageDirty();
        renderCategories();
    }
};

        window.removeCustomTag = async function(tagKey) {
    // 预览与官方预设都只读，不能通过残留按钮或直接调用修改数据。
    if (galleryPreviewLock.isLocked()) return;
            const def = gameInfo.tagDefinitions?.[tagKey];
            let refCount = 0;
            Object.values(catalog).forEach(items => {
                refCount += (items || []).filter(i => (i.tags || []).includes(tagKey)).length;
            });
        
            let extraWarning = refCount > 0 
                ? (window.getTrans('cs_tag_ref_warn') || '').replace('{count}', refCount)
                : "";

            const tagDisplayName = getLocalizedTagName(def) || tagKey;
            const confirmed = await showConfirmModal({
                title: window.getTrans('cs_tag_del_title').replace('{name}', tagDisplayName),
                msg: `${window.getTrans('cs_tag_del_confirm')}${extraWarning}`
            });

            if (confirmed && !galleryPreviewLock.isLocked()) {
                delete gameInfo.tagDefinitions[tagKey];
                Object.values(catalog).forEach(items => {
                    items.forEach(item => {
                        if (Array.isArray(item.tags)) {
                            item.tags = item.tags.filter(t => t !== tagKey);
                        }
                    });
                });
                renderCustomTags();
                renderCategories();
                markPageDirty();

                // ★ 补上删除成功的红框 Toast 提示
                showToast(window.getTrans('cs_tag_del_toast').replace('{name}', tagDisplayName), "danger");
            }
        };

        // ==========================================
        // 渲染：多图鉴库与分级手风琴结构
        // ==========================================
        function renderGameIcon() {
            const button = document.getElementById('btn-game-icon');
            if (!button) return;
            const isPreset = typeof PRESET_GAME_IDS !== 'undefined' && PRESET_GAME_IDS.includes(gameId);
            button.innerHTML = IconRender.html(IconRender.game(gameId, gameInfo.icon));
            button.setAttribute('aria-label', window.getTrans('cs_cat_prompt_icon_change'));
        }

        window.changeGameIcon = async function() {
            if (galleryPreviewLock.isLocked()) return;
            const newIcon = await IconPicker.choose(IconRender.game(gameId, gameInfo.icon));
            if (galleryPreviewLock.isLocked()) return;
            if (newIcon && newIcon.trim()) {
                gameInfo.icon = newIcon.trim();
                markPageDirty();
                renderGameIcon();
                showToast(window.getTrans('icon_picker_success'), 'success');
            }
        };

        function escapeEditorAttribute(value) {
            return String(value || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        }

        function renderCategories() {
            window.ContentColumns?.beforeRender(document.getElementById('categories-container'));
            renderGameIcon();
            const container = document.getElementById('categories-container');
            const categoryBlocks = [];
            const tagDefs = getActiveTagDefinitions();
            const isPreset = typeof PRESET_GAME_IDS !== 'undefined' && PRESET_GAME_IDS.includes(gameId);
            const isEn = getLang() === 'en';

            gameInfo.categories.forEach(cat => {
                if (!catalog[cat.id]) catalog[cat.id] = [];
                const catItems = catalog[cat.id];
                const catDisplayName = getLocalizedCatName(cat);

                let tiersAccordionsHtml = '';

                gameInfo.globalTiers.forEach((tier) => {
                    const tierDisplayName = getLocalizedTierName(tier);
                    const stateKey = `${cat.id}_${tier.id}`;
                    if (tierOpenState[stateKey] === undefined) tierOpenState[stateKey] = window.PanelDefaults?.initial('gallery_setup', 'tiers', gameInfo.globalTiers.indexOf(tier)) ?? (tier === gameInfo.globalTiers[0]);
                    const isOpen = tierOpenState[stateKey] === true;
                    const curFilter = tierFilterState[stateKey] || 'all';

                    let itemsInTier = catItems.filter(item => item.tierId === tier.id);

                    let tagCounts = {};
                    Object.keys(tagDefs).forEach(tagKey => {
                        tagCounts[tagKey] = itemsInTier.filter(i => (i.tags || []).includes(tagKey)).length;
                    });

                    let displayedItems = itemsInTier.filter(item => {
                        if (curFilter === 'all') return true;
                        return (item.tags || []).includes(curFilter);
                    });

                    let cardsHtml = displayedItems.map(item => {
                        let tagsHtml = (item.tags || []).map(tKey => {
                            let def = tagDefs[tKey] || { name: tKey, en: tKey, color: '#555', textColor: '#fff' };
                            return `<span class="item-tag-badge" style="background: ${ColorStyle.background(def)}; color: ${def.textColor || ColorStyle.contrast(def)};">${getLocalizedTagName(def)}</span>`;
                        }).join('');

                        const itemDisplayName = getLocalizedItemName(item);
                        let imgHtml = item.img 
                            ? `<img src="${item.img}" class="char-img" loading="lazy" decoding="async">` 
                            : `<div style="color:#777; font-weight:bold; font-size:18px;">${(isEn && item.eshort) ? item.eshort : (item.short || itemDisplayName)}</div>`;

                        let clickAttr = isPreset ? '' : `onclick="openEditItemModal('${cat.id}', '${item.id}')"`;
                        let dragAttr = isPreset ? '' : `draggable="true" data-id="${item.id}" data-cat="${cat.id}" data-tier="${tier.id}"`;

                        return `
                        <div class="char-card" style="${ColorStyle.frame(tier)}" data-content-key="${encodeURIComponent(cat.id + ':' + item.id)}" ${clickAttr} ${dragAttr}>
                            ${imgHtml}
                            <span class="char-star" style="${ColorStyle.text(tier)}">${tierDisplayName}</span>
                            <div class="item-tags-wrap">${tagsHtml}</div>
                            <div class="del-badge" onclick="deleteItem('${cat.id}', '${item.id}', event)">✕</div>
                            <div class="char-info">${itemDisplayName}</div>
                        </div>`;
                    }).join('');

                    if (!isPreset) {
                        cardsHtml += `
                            <div class="add-btn-card" onclick="openAddItemModal('${cat.id}', '${tier.id}')">
                                <span style="font-size: 26px;">+</span>
                                <span style="font-size: 11px; margin-top: 2px;">${(window.getTrans('cs_cat_add_item_btn') || '').replace('{name}', tierDisplayName)}</span>
                            </div>
                        `;
                    }


                    let filterButtonsHtml = `<button class="filter-tab-btn ${curFilter === 'all' ? 'active' : ''}" onclick="setTierFilter('${stateKey}', 'all')">${window.getTrans('cs_cat_filter_all')} (${itemsInTier.length})</button>`;
                    Object.keys(tagDefs).forEach(tagKey => {
                        let def = tagDefs[tagKey];
                        let count = tagCounts[tagKey] || 0;
                        if (count > 0) {
                            filterButtonsHtml += `
                                <button class="filter-tab-btn ${curFilter === tagKey ? 'active' : ''}" onclick="setTierFilter('${stateKey}', '${tagKey}')">
                                    <span style="display:inline-block; width:6px; height:6px; border-radius:50%; background:${ColorStyle.background(def)}; margin-right:4px;"></span>${getLocalizedTagName(def)} (${count})
                                </button>`;
                        }
                    });

                    tiersAccordionsHtml += `
                    <div class="tier-accordion">
                        <div class="tier-header" onclick="toggleTierAccordion('${stateKey}')">
                            <div class="tier-badge-label">
                                <span style="display:inline-block; width:10px; height:10px; border-radius:50%; background:${ColorStyle.background(tier)};"></span>
                                <span style="${ColorStyle.text(tier)} font-size: 15px;">${tierDisplayName} ${window.getTrans('cs_cat_badge_section')}</span>
                                <span style="font-size: 12px; color: #888; font-weight: normal;">${(window.getTrans('cs_cat_items_count') || '').replace('{count}', itemsInTier.length)}</span>
                            </div>
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <span style="color: #888; font-size: 12px;">${isOpen ? window.getTrans('collapse') : window.getTrans('expand')}</span>
                            </div>
                        </div>

                        <div class="tier-body" style="display: ${isOpen ? 'flex' : 'none'};">
                            <div class="filter-tabs">
                                <span style="font-size: 11px; color: #777;">${window.getTrans('cs_cat_filter_label')}</span>
                                ${filterButtonsHtml}
                            </div>
                            <div class="char-grid" id="grid_${cat.id}_${tier.id}">${cardsHtml}</div>
                        </div>
                    </div>`;
                });

                if (categoryOpenState[cat.id] === undefined) {
                    categoryOpenState[cat.id] = window.PanelDefaults?.initial('gallery_setup', 'categories', gameInfo.categories.indexOf(cat)) ?? true;
                }
                const isCatOpen = categoryOpenState[cat.id];

                const nameInputProps = isPreset ? 'readonly' : `onchange="updateCategoryName('${cat.id}', this.value)"`;
                const iconClickAttr = isPreset ? '' : `onclick="event.stopPropagation(); changeCategoryIcon('${cat.id}')" title="点击更换图标"`;

                const delFooterBtnHtml = isPreset ? '' : `
                    <div style="margin-top: 14px; padding-top: 12px; border-top: 1px dashed rgba(255,255,255,0.08); display: flex; justify-content: flex-end; padding-right: 16px;">
                        <button class="btn btn-action-gray cat-action-btn" 
                                style="font-size: 12px; padding: 6px 14px; color: #ff4757; border: 1px solid rgba(255, 71, 87, 0.4); background: rgba(255, 71, 87, 0.06); cursor: pointer; border-radius: 6px; display: inline-flex; align-items: center; gap: 6px;" 
                                onclick="event.stopPropagation(); deleteCategory('${cat.id}')">
                            <span>🗑️</span>
                            <span>${window.getTrans('cs_cat_btn_del')}</span>
                        </button>
                    </div>
                `;

                const catBlockHtml = `
                <div class="category-box" data-id="${cat.id}">
                    <div class="category-header" onclick="toggleCategoryBox('${cat.id}')">
                        <div class="category-title" style="display: flex; align-items: center; gap: 6px;">
                            <span class="drag-handle" title="按住拖拽排序" onclick="event.stopPropagation()">⠿</span>
                            <span class="cat-icon-badge" ${iconClickAttr}>${IconRender.html(cat.icon)}</span>
                            <input type="text" class="cat-name-input" value="${escapeEditorAttribute(catDisplayName)}" onclick="event.stopPropagation()" ${nameInputProps} placeholder="${window.getTrans('cs_cat_name_ph')}">
                            <span style="font-size: 11px; color: #666; font-weight: normal; margin-left: 4px;">[${cat.id}]</span>
                        </div>
        
                        <div style="display: flex; align-items: center;">
                            <span style="color: #888; font-size: 12px; min-width: 45px; text-align: right; user-select: none;">
                                ${isCatOpen ? window.getTrans('collapse') : window.getTrans('expand')}
                            </span>
                        </div>
                    </div>
    
                    <div class="category-body" style="padding: 10px 0; display: ${isCatOpen ? 'block' : 'none'};">
                        ${tiersAccordionsHtml}
                        ${delFooterBtnHtml}
                    </div>
                </div>`;

                categoryBlocks.push(catBlockHtml);
            });

            // 一次写入完整分类，减少 DOM 变更记录和反复解析。
            const catalogHeading = document.getElementById('gallery-catalog-heading');
            // Keep the original heading/button alive when replacing category contents.
            if (catalogHeading && container.contains(catalogHeading)) container.before(catalogHeading);
            container.innerHTML = categoryBlocks.join('');
            if (catalogHeading) {
                const firstCategory = container.querySelector('.category-box');
                const unit = document.createElement('div');
                unit.className = 'gallery-category-unit';
                unit.dataset.id = firstCategory?.dataset.id || 'empty-catalog';
                if (firstCategory) firstCategory.before(unit); else container.append(unit);
                unit.append(catalogHeading);
                if (firstCategory) unit.append(firstCategory);
            }
            bindDragEvents('categories-container', '.category-box', (fromId, toId, isBefore) => {
                const fromIdx = gameInfo.categories.findIndex(x => x.id === fromId);
                let toIdx = gameInfo.categories.findIndex(x => x.id === toId);
                if (fromIdx < 0 || toIdx < 0 || fromIdx === toIdx) return;

                const [movedCat] = gameInfo.categories.splice(fromIdx, 1);
                let targetIdx = gameInfo.categories.findIndex(x => x.id === toId);
                if (!isBefore) targetIdx += 1;
                gameInfo.categories.splice(targetIdx, 0, movedCat);

                renderCategories();
            }, '.drag-handle');

            // 所有 HTML 完成后才绑定，包含最后一个分类；重渲染也走同一入口。
            if (!isPreset) {
                gameInfo.categories.forEach(cat => {
                    gameInfo.globalTiers.forEach(tier => {
                        bindGridDragEvents(`grid_${cat.id}_${tier.id}`, '.char-card', (fromId, toId, isLeft) => {
                            reorderCatalogItem(cat.id, fromId, toId, isLeft);
                        });
                    });
                });
            }
        }

        // ==========================================
        // 自由图鉴库操作 (增删改)
        // ==========================================
        window.addNewCategory = function() {
    // 预览与官方预设都只读，不能通过残留按钮或直接调用修改数据。
    if (galleryPreviewLock.isLocked()) return;
            const catName = prompt(window.getTrans ? window.getTrans('cs_cat_prompt_name') : "请输入新图鉴库名称：");
            if (!catName || !catName.trim()) return;
            const icon = prompt(window.getTrans ? window.getTrans('cs_cat_prompt_icon') : "挑选 Emoji 图标：", "💍") || "📦";
            const newId = 'cat_' + Date.now();

            gameInfo.categories.push({ id: newId, name: catName.trim(), en: catName.trim(), icon: icon.trim() });
            catalog[newId] = [];
            categoryOpenState[newId] = true;
            
            let highestTierId = gameInfo.globalTiers[0]?.id;
            gameInfo.globalTiers.forEach(t => {
                tierOpenState[`${newId}_${t.id}`] = (t.id === highestTierId);
                tierFilterState[`${newId}_${t.id}`] = 'all';
            });

            renderCategories();
        };

        window.deleteCategory = async function(catId) {
    // 预览与官方预设都只读，不能通过残留按钮或直接调用修改数据。
    if (galleryPreviewLock.isLocked()) return;
            const cat = gameInfo.categories.find(c => c.id === catId);
            if (!cat) return;
            const count = (catalog[catId] || []).length;

            const confirmed = await showConfirmModal({
                title: (window.getTrans('cs_cat_del_title') || '').replace('{name}', getLocalizedCatName(cat)),
                msg: (window.getTrans('cs_cat_del_msg') || '').replace('{count}', count)
            });

            if (confirmed && !galleryPreviewLock.isLocked()) {
                gameInfo.categories = gameInfo.categories.filter(c => c.id !== catId);
                delete catalog[catId];
                renderCategories();
            }
        };

        window.toggleTierAccordion = function(stateKey) {
            tierOpenState[stateKey] = !tierOpenState[stateKey];
            renderCategories();
        };

        window.setTierFilter = function(stateKey, filterVal) {
            tierFilterState[stateKey] = filterVal;
            renderCategories();
        };

        // ==========================================
        // 弹窗逻辑
        // ==========================================
function populateModalDropdowns(selectedTags = []) {
    const tierSelect = document.getElementById('input-item-tier');
    tierSelect.innerHTML = gameInfo.globalTiers.map(t => 
        `<option value="${t.id}" style="color:${t.color}; font-weight:bold;">${getLocalizedTierName(t)}</option>`
    ).join('');

    const catSelect = document.getElementById('input-item-cat-select');
    catSelect.innerHTML = gameInfo.categories.map(c => 
        `<option value="${c.id}" data-icon="${escapeEditorAttribute(c.icon || '')}">${getLocalizedCatName(c)}</option>`
    ).join('');

    const tagsBox = document.getElementById('modal-tags-container');
    const tagDefs = getActiveTagDefinitions();
    let cbsHtml = '';
    Object.keys(tagDefs).forEach(tagKey => {
        let def = tagDefs[tagKey];
        let isChecked = selectedTags.includes(tagKey) ? 'checked' : '';
        cbsHtml += `
            <label class="tag-cb-label">
                <input type="checkbox" class="input-modal-tag-cb" value="${tagKey}" ${isChecked}>
                <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:${ColorStyle.background(def)};"></span>
                <span>${getLocalizedTagName(def)}</span>
            </label>
        `;
    });
    tagsBox.innerHTML = cbsHtml;

    // 🌟 核心修复：清理弹窗内原有的 custom-select 包装与标记，重新挂载下拉组件
    [tierSelect, catSelect].forEach(selectEl => {
        if (!selectEl) return;
        selectEl.classList.remove('custom-select-original');
        // 移除之前紧随其后的 .custom-select-ui 节点（避免重复堆叠）
        if (selectEl.nextElementSibling?.classList.contains('custom-select-ui')) {
            selectEl.nextElementSibling.remove();
        }
    });

    if (typeof window.refreshCustomDropdowns === 'function') {
        window.refreshCustomDropdowns();
    }
}

        window.openAddItemModal = function(catId, tierId) {
    // 预览与官方预设都只读，不能通过残留按钮或直接调用修改数据。
    if (galleryPreviewLock.isLocked()) return;
            itemImageUploader?.cancelPending();
            editingItemRef = null;
            populateModalDropdowns(['up']);

            document.getElementById('modal-title').innerText = window.getTrans ? window.getTrans('cs_modal_add_item') : "➕ 添加新图鉴物品";
            document.getElementById('modal-cat-id').value = catId;
            document.getElementById('input-item-cat-select').value = catId;
            document.getElementById('input-item-tier').value = tierId;
            document.getElementById('input-item-name').value = '';
            document.getElementById('input-item-short').value = '';
            window.GalleryBilingual?.setItemDraft();
            document.getElementById('input-item-file').value = '';
            document.getElementById('modal-img-preview').style.backgroundImage = 'none';
            tempBase64Img = "";

            document.getElementById('itemModalOverlay').style.display = 'flex';
        };

        window.openEditItemModal = function(catId, itemId) {
    // 预览与官方预设都只读，不能通过残留按钮或直接调用修改数据。
    if (galleryPreviewLock.isLocked()) return;
            itemImageUploader?.cancelPending();
            const item = (catalog[catId] || []).find(i => i.id === itemId);
            if (!item) return;

            editingItemRef = { catId, itemId };
            populateModalDropdowns(item.tags || ['std']);

            const isEn = getLang() === 'en';

            document.getElementById('modal-title').innerText = window.getTrans ? window.getTrans('cs_modal_edit_item') : "✏️ 编辑图鉴物品";
            document.getElementById('modal-cat-id').value = catId;
            document.getElementById('input-item-cat-select').value = catId;
            document.getElementById('input-item-tier').value = item.tierId;
            document.getElementById('input-item-name').value = getLocalizedItemName(item);
            
            // ★ 根据语言载入对应的简称：英文显示 eshort，中文显示 short
            document.getElementById('input-item-short').value = (isEn && item.eshort) ? item.eshort : (item.short || '');
            window.GalleryBilingual?.setItemDraft(item);

            document.getElementById('input-item-file').value = '';
            tempBase64Img = item.img || '';
            document.getElementById('modal-img-preview').style.backgroundImage = tempBase64Img ? `url(${tempBase64Img})` : 'none';

            document.getElementById('itemModalOverlay').style.display = 'flex';
        };

        window.saveItemData = function() {
    // 预览与官方预设都只读，不能通过残留按钮或直接调用修改数据。
    if (galleryPreviewLock.isLocked()) return;
            const name = document.getElementById('input-item-name').value.trim();
            const short = document.getElementById('input-item-short').value.trim();
            const tierId = document.getElementById('input-item-tier').value;
            const targetCatId = document.getElementById('input-item-cat-select').value;
            const isEn = getLang() === 'en';

            const checkedTags = Array.from(document.querySelectorAll('.input-modal-tag-cb:checked')).map(cb => cb.value);
            if (checkedTags.length === 0) checkedTags.push('normal');

            if (!name) return alert(window.getTrans ? window.getTrans('cs_modal_err_name') : "请输入物品全名！");

            const bilingualDraft = window.GalleryBilingual?.getItemDraft();
            const names = bilingualDraft ? {
                name: bilingualDraft.name.trim() || bilingualDraft.en.trim(),
                en: bilingualDraft.en.trim(),
                short: bilingualDraft.short.trim(),
                eshort: bilingualDraft.eshort.trim()
            } : null;

            if (editingItemRef) {
                let oldList = catalog[editingItemRef.catId] || [];
                let item = oldList.find(i => i.id === editingItemRef.itemId);
                if (item) {
                    const previous = { ...item };
                    if (names) {
                        Object.assign(item, names);
                    } else if (isEn) {
                        item.en = name;
                        item.eshort = short || name;
                        if (!item.name) item.name = name;
                        if (!item.short) item.short = short || name;
                    } else {
                        item.name = name;
                        item.short = short || name;
                        if (!item.en) item.en = name;
                        if (!item.eshort) item.eshort = short || name;
                    }
                    item.tierId = tierId;
                    item.tags = checkedTags;
                    item.img = tempBase64Img;
                    // Explicit local edits remain local overrides of preset presentation.
                    if (item.presetId || /^(hsr|zzz|end|ark)_(char|wep|pet|bangboo)_tier_/.test(item.id || '')) {
                        item.presetId = item.presetId || item.id;
                        item.presetOverrides = [...new Set([...(item.presetOverrides || []),
                            ...['name','en','short','eshort','img'].filter(field => item[field] !== previous[field])])];
                        const oldNames = ['name','short','en','eshort'].filter(field => previous[field] && previous[field] !== item[field]).map(field => previous[field]);
                        if (oldNames.length) item.aliases = [...new Set([...(item.aliases || []), ...oldNames])];
                    }

                    if (editingItemRef.catId !== targetCatId) {
                        catalog[editingItemRef.catId] = oldList.filter(i => i.id !== editingItemRef.itemId);
                        if (!catalog[targetCatId]) catalog[targetCatId] = [];
                        catalog[targetCatId].push(item);
                    }
                }
            } else {
                if (!catalog[targetCatId]) catalog[targetCatId] = [];
                catalog[targetCatId].push({
                    id: 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
                    ...(names || { name, en: name, short: isEn ? name : (short || name), eshort: isEn ? (short || name) : name }),
                    tierId: tierId,
                    tags: checkedTags,
                    img: tempBase64Img
                });
            }

            document.getElementById('itemModalOverlay').style.display = 'none';
            markPageDirty();
            renderCategories();
            updateImportVisibility();
        };

        window.deleteItem = async function(catId, itemId, event) {
    // 预览与官方预设都只读，不能通过残留按钮或直接调用修改数据。
    if (galleryPreviewLock.isLocked()) return;
            if (event) event.stopPropagation();
            const item = (catalog[catId] || []).find(i => i.id === itemId);

            const confirmed = await showConfirmModal({
                title: (window.getTrans('cs_modal_del_item_title') || '').replace('{name}', getLocalizedItemName(item) || '未知'),
                msg: window.getTrans('cs_modal_del_item_msg') || '确定从当前图鉴库中移除此物品吗？'
            });

            if (confirmed && !galleryPreviewLock.isLocked()) {
                if (catalog[catId]) {
                    catalog[catId] = catalog[catId].filter(i => i.id !== itemId);
                    renderCategories();
                    updateImportVisibility();
                }
            }
        };

        function setupImageUploader() {
            // 物品保留完整构图，等比例缩到最长边 150px；预览和待保存数据由本页更新。
            itemImageUploader = ImageUpload.bind('input-item-file', {
                options: { mode: 'fit', maxSize: 150, quality: 0.8 },
                onReady({ dataURL }) {
                    tempBase64Img = dataURL;
                    document.getElementById('modal-img-preview').style.backgroundImage = `url(${dataURL})`;
                },
                onError(error) {
                    console.error(error);
                    showToast(getLang() === 'en' ? 'Unable to read this image. Please choose another image.' : '图片读取失败，请选择其他图片。', 'danger');
                }
            });
        }

        // ==========================================
        // 保存与导出
        // ==========================================
        // 保存、删除和导出提示共用组件，原有文字仍由本页语言包提供。
        window.showToast = Toast.create().show;

function executeSaveAll(showFeedback = true) {
    const gameName = document.getElementById('input-game-name').value.trim();
    if (!gameName) {
        alert(window.getTrans ? window.getTrans('cs_err_no_game_name') : '必须填写游戏名称！');
        return false;
    }
    if (getLang() === 'en') {
        if (!window.GalleryBilingual || gameInfo.enGameName) gameInfo.enGameName = gameName;
    }
    else gameInfo.gameName = gameName;
    if (!gameInfo.gameName) gameInfo.gameName = gameName;


    const gamesList = JSON.parse(localStorage.getItem('GM_Custom_Games_List')) || [];
    if (!gameId) gameId = 'g_' + Date.now();
    const entry = gamesList.find(game => game.id === gameId);
    if (entry) entry.name = gameName;
    else gamesList.push({ id: gameId, name: gameName });

    // 所有内容先序列化为待提交集合，不边解析边写入，避免半套导入数据落地。
    const writes = new Map(pendingEngineWrites || []);
    const pendingDeleted = JSON.parse(sessionStorage.getItem(`GM_Pending_Deleted_Pools_${gameId}`)) || [];
    const removedKeys = [];
    if (pendingDeleted.length) {
        const pools = JSON.parse(readEngineEdit('GM_RosterPools_' + gameId)) || [];
        const order = JSON.parse(readEngineEdit(`GM_Pool_Order_${gameId}`)) || [];
        writes.set('GM_RosterPools_' + gameId, JSON.stringify(pools.filter(pool => !pendingDeleted.includes(pool.id))));
        writes.set(`GM_Pool_Order_${gameId}`, JSON.stringify(order.filter(id => !pendingDeleted.includes(id))));
        pendingDeleted.forEach(id => {
            const ruleKey = `GM_Rules_${gameId}_${id}`;
            writes.delete(ruleKey);
            removedKeys.push(ruleKey, `GM_Data_${gameId}_${id}`);
        });
    }
    writes.set('GM_Custom_Games_List', JSON.stringify(gamesList));
    // 两个页面分别保存：普通图鉴保存保留磁盘上最新的货币规则，避免旧页面覆盖它。
    const latestInfo = JSON.parse(localStorage.getItem('GM_Info_' + gameId) || 'null');
    const infoToSave = { ...gameInfo };
    if (latestInfo && !pendingCurrencyImport) {
        for (const key of ['economy', 'overflowRules']) {
            if (Object.prototype.hasOwnProperty.call(latestInfo, key)) infoToSave[key] = latestInfo[key];
            else delete infoToSave[key];
        }
    }
    writes.set('GM_Info_' + gameId, JSON.stringify(infoToSave));
    writes.set('GM_Catalog_' + gameId, JSON.stringify(catalog));
    const flatRoster = {};
    for (const catId in catalog) {
        (catalog[catId] || []).forEach(item => {
            const firstTag = (item.tags && item.tags[0]) ? item.tags[0] : 'std';
            const poolKey = `${catId}_${firstTag}`;
            if (!flatRoster[poolKey]) flatRoster[poolKey] = [];
            flatRoster[poolKey].push(item);
        });
    }
    writes.set('GM_Roster_' + gameId, JSON.stringify(flatRoster));
    commitEngineEdits(writes, removedKeys);
    gameInfo.economy = infoToSave.economy;
    gameInfo.overflowRules = infoToSave.overflowRules;
    pendingCurrencyImport = false;

    // 仅完整提交成功后清空导入/删除草稿和修改标记；失败保留草稿以便重试。
    pendingEngineWrites = null;
    sessionStorage.removeItem(`GM_Pending_Deleted_Pools_${gameId}`);
    galleryChangeTracker.reset();
    if (showFeedback) {
        showToast(window.getTrans ? window.getTrans('cs_save_success_toast') : '图鉴总库与配置保存成功！', 'success');
    }
    return true;
}

        window.saveAllAndGenerate = function() {
            if (document.body.classList.contains('preview-mode') || document.body.classList.contains('is-preset-game')) return;
            
            if (executeSaveAll(true)) {
                const current = new URL(window.location.href);
                current.searchParams.set('gameId', gameId);
                window.history.replaceState({}, '', current);
                if (typeof renderSidebar === 'function') renderSidebar();
            }
        };

window.exportCurrentEngineConfig = async function() {
    if (typeof JSZip === 'undefined') {
        alert(getLang() === 'en' ? "JSZip library not loaded!" : "未加载 JSZip 库，无法导出压缩包！");
        return;
    }

    const isPreset = typeof PRESET_GAME_IDS !== 'undefined' && PRESET_GAME_IDS.includes(gameId);
    let exportedPools = [];
    let poolRulesMap = {};
    let poolOrder = JSON.parse(readEngineEdit(`GM_Pool_Order_${gameId}`)) || [];

    // 1. 获取卡池与对应的规则
    if (isPreset) {
        const poolRules = GameData.getPresetRules(gameId);
        
        if (poolRules) {
            Object.keys(poolRules).forEach(pId => {
                const p = poolRules[pId];
                const info = p.info || {};
                exportedPools.push({
                    id: pId,
                    name: info.name || pId,
                    en: info.en || info.name || pId,
                    icon: info.icon || '✨',
                    type: p.type || 'up',
                    isStandalone: true
                });
                poolRulesMap[pId] = p;
            });
        }
    } else {
        exportedPools = JSON.parse(readEngineEdit('GM_RosterPools_' + gameId)) || [];
        exportedPools.forEach(p => {
            const rule = readEngineEdit(`GM_Rules_${gameId}_${p.id}`);
            if (rule) {
                try { poolRulesMap[p.id] = JSON.parse(rule); } catch(e) {}
            }
        });
    }

    // 2. 确保最新名称
    const currentName = document.getElementById('input-game-name')?.value?.trim();
    if (currentName) {
        if (getLang() === 'en') {
            if (!window.GalleryBilingual || gameInfo.enGameName) gameInfo.enGameName = currentName;
        }
        else gameInfo.gameName = currentName;
        if (!gameInfo.gameName) gameInfo.gameName = currentName;
    }

    // 页面负责组装业务配置，公共模块深拷贝并抽取自定义图片到 ZIP。
    const exportPkg = {
        version: "GachaSystem_Engine_v0.2.5_ZIP",
        exportTime: new Date().toISOString(),
        gameId: gameId,
        info: gameInfo,
        catalog: catalog,
        rosterPools: exportedPools,
        poolOrder: poolOrder,
        poolRules: poolRulesMap
    };

    // 生成并下载 ZIP 文件，保留原有文件名与配置版本。
    showToast(getLang() === 'en' ? "Packaging ZIP archive..." : "正在打包生成 ZIP 文件...", "info");
    const content = await ImportExport.createEngineArchive(exportPkg);
    ImportExport.downloadBlob(content, `Package_${gameInfo.gameName || 'Game'}.zip`);
};

window.deleteEntireGame = async function() {
    // 预览与官方预设都只读，不能通过残留按钮或直接调用修改数据。
    if (galleryPreviewLock.isLocked()) return;
    if (!gameId) return;

    const currentGameName = (getLang() === 'en' && gameInfo.enGameName) ? gameInfo.enGameName : (gameInfo.gameName || 'Custom Game');

    const confirmed = await showConfirmModal({
        title: window.getTrans('cs_modal_del_game_title').replace('{name}', currentGameName),
        msg: window.getTrans('cs_modal_del_game_msg'),
        okText: window.getTrans('confirm_delete'),
        theme: "danger"
    });

    if (!confirmed || galleryPreviewLock.isLocked()) return;

    // 清理本地数据
    localStorage.removeItem('GM_Info_' + gameId);
    localStorage.removeItem('GM_Catalog_' + gameId);
    localStorage.removeItem('GM_Roster_' + gameId);
    localStorage.removeItem('GM_RosterPools_' + gameId);
    localStorage.removeItem(`GM_Pool_Order_${gameId}`);

    for (let i = localStorage.length - 1; i >= 0; i--) {
        let key = localStorage.key(i);
        if (key && (key.startsWith(`GM_Rules_${gameId}_`) || key.startsWith(`GM_Data_${gameId}_`))) {
            localStorage.removeItem(key);
        }
    }
    let gamesList = JSON.parse(localStorage.getItem('GM_Custom_Games_List')) || [];
    gamesList = gamesList.filter(g => g.id !== gameId);
    localStorage.setItem('GM_Custom_Games_List', JSON.stringify(gamesList));

    // 使用红框的 Danger Toast 提示，随后跳转
    showToast(window.getTrans('cs_toast_del_game_success'), "danger");

    setTimeout(() => {
        galleryChangeTracker.reset();
        window.location.href = 'html/index.html';
    }, 800); 
};

        function initializeGalleryPanelDefaults() {
            if (!window.PanelDefaults) return;
            [['custom-pools-body','pools-arrow-indicator','flex'], ['master-settings-body','master-settings-arrow','flex']].forEach(([id, indicator, display], index) => {
                const body = document.getElementById(id), arrow = document.getElementById(indicator);
                const open = PanelDefaults.initial('gallery_setup', 'engine', index);
                if (body) body.style.display = open ? display : 'none';
                if (arrow) { arrow.dataset.i18n = open ? 'cs_collapse_cfg_btn' : 'cs_expand_cfg_btn'; arrow.textContent = window.getTrans(arrow.dataset.i18n); }
            });
            [['global-tiers-body','tier-arrow-indicator'], ['custom-tags-body','tag-arrow-indicator']].forEach(([id, indicator], index) => {
                const body = document.getElementById(id), arrow = document.getElementById(indicator);
                const open = PanelDefaults.initial('gallery_setup', 'configuration', index);
                if (body) body.style.display = open ? 'block' : 'none';
                if (arrow) { arrow.dataset.i18n = open ? 'collapse' : 'expand'; arrow.textContent = window.getTrans(arrow.dataset.i18n); }
            });
        }

        window.toggleSectionAccordion = function(bodyId, indicatorId) {
            const bodyEl = document.getElementById(bodyId);
            const indicatorEl = document.getElementById(indicatorId);
            if (!bodyEl || !indicatorEl) return;

            const isHidden = bodyEl.style.display === 'none';
            indicatorEl.setAttribute('data-i18n', isHidden ? 'collapse' : 'expand');
            if (isHidden) {
                bodyEl.style.display = 'block';
                indicatorEl.innerText = window.getTrans ? window.getTrans('collapse') : '▲ 收起'
            } else {
                bodyEl.style.display = 'none';
                indicatorEl.innerText = window.getTrans ? window.getTrans('expand') : '▼ 展开';
            }
        };

        // 页面只提供排序回调；拖拽手柄、方向判断及高亮由公共组件处理。
        function bindDragEvents(containerId, itemSelector, onReorder, handleSelector = null, { allowPreset = false } = {}) {
            return DragSort.bind(containerId, itemSelector, onReorder, {
                handleSelector,
                canDrag: () => !galleryPreviewLock.isPreview() && (allowPreset || !galleryPreviewLock.isLocked())
            });
        }

        // 卡片网格按左右半区判断插入位置，与列表的上下排序共用交互组件。
        function bindGridDragEvents(containerId, itemSelector, onReorder) {
            return DragSort.bind(containerId, itemSelector, onReorder, {
                axis: 'x', canDrag: () => !galleryPreviewLock.isLocked()
            });
        }

        // 图鉴数据重排并同步持久化
        window.reorderCatalogItem = function(catId, fromId, toId, isLeft) {
            if (galleryPreviewLock.isLocked()) return;
            const items = catalog[catId];
            if (!items) return;

            const fromIdx = items.findIndex(x => x.id === fromId);
            const toIdx = items.findIndex(x => x.id === toId);
            if (fromIdx < 0 || toIdx < 0 || fromIdx === toIdx) return;

            const [moved] = items.splice(fromIdx, 1);
            let targetIdx = items.findIndex(x => x.id === toId);
            if (!isLeft) targetIdx += 1;
            items.splice(targetIdx, 0, moved);

            markPageDirty();
            renderCategories();
        };

        window.toggleCategoryBox = function(catId) {
            categoryOpenState[catId] = !categoryOpenState[catId];
            renderCategories();
        };

        window.updateCategoryName = function(catId, newName, language) {
    // 预览与官方预设都只读，不能通过残留按钮或直接调用修改数据。
    if (galleryPreviewLock.isLocked()) return;
    language = language || getLang();
            const cat = gameInfo.categories.find(c => c.id === catId);
            if (cat) {
                cat[language === 'en' ? 'en' : 'name'] = newName.trim();
                markPageDirty();
            }
        };

        window.changeCategoryIcon = async function(catId) {
            if (galleryPreviewLock.isLocked()) return;
            const cat = gameInfo.categories.find(c => c.id === catId);
            if (!cat) return;
            const newIcon = await IconPicker.choose(cat.icon);
            if (galleryPreviewLock.isLocked()) return;
            if (newIcon && newIcon.trim()) {
                cat.icon = newIcon.trim();
                markPageDirty();
                renderCategories();
                // 切换只更新草稿；提示用户仍需保存页面配置。
                showToast(window.getTrans('icon_picker_success'), 'success');
            }
        };

// 图鉴页保留红色删除和蓝色导入主题，以及语言包中的格式化提示模板。
const galleryDialog = Dialog.create({
    elements: {
        overlay: 'confirmModalOverlay', box: 'confirm-modal-box',
        title: 'confirm-modal-title', message: 'confirm-modal-msg',
        confirm: 'btn-confirm-ok', cancel: 'btn-confirm-cancel'
    },
    themes: { danger: '#ff4757', primary: 'var(--primary, #007bff)' },
    html: true
});

// 保留现有页面调用接口，只负责提供文字；删除/导入操作在调用方确认后执行。
function showConfirmModal({ title = '', msg = '', okText = '', theme = 'danger' }) {
    const isPrimary = theme === 'primary' || theme === 'blue';
    return galleryDialog.confirm(msg || Dialog.text('cs_confirm_msg_default', '确定继续执行此操作吗？'), {
        theme: isPrimary ? 'primary' : 'danger',
        title: title || Dialog.text(isPrimary ? 'cs_confirm_title_notice' : 'cs_confirm_title_danger', isPrimary ? '操作确认' : '危险操作警告'),
        okText: okText || Dialog.text(isPrimary ? 'confirm' : 'confirm_delete', isPrimary ? '确认' : '确认删除'),
        cancelText: Dialog.text('cancel', '取消')
    });
}

        // 只提供图鉴页面的快照内容，追踪算法和监听由公共组件管理。
        const galleryChangeTracker = UnsavedChanges.createTracker({ getSnapshot: captureCurrentConfigString });
        window.markPageDirty = () => galleryChangeTracker.markDirty();

        function captureCurrentConfigString() {
            try {
                return JSON.stringify({
                    name: document.getElementById('input-game-name')?.value || '',
                    icon: gameInfo.icon,
                    tiers: gameInfo.globalTiers,
                    tags: gameInfo.tagDefinitions,
                    categories: gameInfo.categories,
                    economy: gameInfo.economy,
                    overflowRules: gameInfo.overflowRules,
                    catalogCount: Object.values(catalog).reduce((acc, cur) => acc + cur.length, 0)
                });
            } catch(e) {
                return "";
            }
        }

        function initDirtyTracking() {
            galleryChangeTracker.start();
            if (returnedEconomyChanges) markPageDirty();
        }

        function restoreEconomyDraft() {
            const token = urlParams.get('economyDraft');
            if (!token) return;
            try {
                const draft = JSON.parse(sessionStorage.getItem('GM_EconomyDraft_' + token) || 'null');
                if (!draft || draft.gameId !== gameId) return;
                gameInfo = draft.info;
                catalog = draft.catalog;
                pendingEngineWrites = draft.engineWrites ? new Map(draft.engineWrites) : null;
                sessionStorage.setItem(`GM_Pending_Deleted_Pools_${gameId}`, JSON.stringify(draft.deletedPools || []));
                returnedEconomyChanges = !!draft.changed;
                if (draft.locked) document.body.classList.add('preview-mode');
                sessionStorage.removeItem('GM_EconomyDraft_' + token);
                const clean = new URL(window.location.href);
                clean.searchParams.delete('economyDraft');
                window.history.replaceState({}, '', clean);
            } catch (error) { console.error(error); showToast(error.message, 'danger'); }
        }

        function checkHasUnsavedChanges() {
            return galleryChangeTracker.hasChanges();
        }

        // 比较字段、预设只读例外及临时删除清理仍属于页面业务。
        const galleryUnsaved = UnsavedChanges.create({
            tracker: galleryChangeTracker,
            shouldConfirm: () => checkHasUnsavedChanges() &&
                !document.body.classList.contains('is-preset-game'),
            save: () => executeSaveAll(true),
            onDiscard: () => {
                pendingEngineWrites = null; // 放弃导入及其后续卡池编辑，不触碰原有存储。
                sessionStorage.removeItem(`GM_Pending_Deleted_Pools_${gameId}`);
            },
            onError: error => { console.error(error); showToast(error.message, 'danger'); },
            saveDelay: 600 // 保留原来的成功提示展示时间，再执行跳转。
        });
        window.safeNavigate = targetUrl => galleryUnsaved.request(targetUrl);

        window.toggleMasterSettingsAccordion = function() {
            const bodyEl = document.getElementById('master-settings-body');
            const arrowEl = document.getElementById('master-settings-arrow');
            if (!bodyEl) return;

            const isHidden = (bodyEl.style.display === 'none');
            bodyEl.style.display = isHidden ? 'flex' : 'none';
            if (arrowEl) {
                arrowEl.setAttribute('data-i18n', isHidden ? 'cs_collapse_cfg_btn' : 'cs_expand_cfg_btn');
                arrowEl.innerText = isHidden ? window.getTrans('cs_collapse_cfg_btn') : window.getTrans('cs_expand_cfg_btn');
            }
        };

        window.togglePoolsAccordion = function() {
            const bodyEl = document.getElementById('custom-pools-body');
            const arrowEl = document.getElementById('pools-arrow-indicator');
            if (!bodyEl) return;

            const isHidden = (bodyEl.style.display === 'none');
            bodyEl.style.display = isHidden ? 'flex' : 'none';
            if (arrowEl) {
                arrowEl.setAttribute('data-i18n', isHidden ? 'cs_collapse_cfg_btn' : 'cs_expand_cfg_btn');
                arrowEl.innerText = isHidden ? window.getTrans('cs_collapse_cfg_btn') : window.getTrans('cs_expand_cfg_btn');
            }
        };

        // ==========================================
        // 渲染卡池列表：支持拖拽调序、直接改名、支持官方预设
        // ==========================================
        function renderCustomPoolsList() {
    const listEl = document.getElementById('custom-pools-list');
    const badgeEl = document.getElementById('custom-pools-count-badge');
    if (!listEl) return;
    
    const isPreset = typeof PRESET_GAME_IDS !== 'undefined' && PRESET_GAME_IDS.includes(gameId);
    const isEn = getLang() === 'en';

    let poolItems = [];
    const customOrder = JSON.parse(readEngineEdit(`GM_Pool_Order_${gameId}`));

    if (isPreset) {
        const poolRules = GameData.getPresetRules(gameId);
        
        if (poolRules) {
            Object.keys(poolRules).forEach(pId => {
                const p = poolRules[pId];
                const info = p.info || {};
                poolItems.push({
                    id: pId,
                    name: info.name || pId,
                    en: info.en || info.name || pId,
                    icon: info.icon || '✨'
                });
            });
        }
    } else {
        let rosterPools = JSON.parse(readEngineEdit('GM_RosterPools_' + gameId)) || [];
        poolItems = rosterPools.filter(p => p.isStandalone !== false);
    }

    // ★ 过滤掉待删除的卡池
    const pendingDeleted = JSON.parse(sessionStorage.getItem(`GM_Pending_Deleted_Pools_${gameId}`)) || [];
    if (pendingDeleted.length > 0) {
        poolItems = poolItems.filter(p => !pendingDeleted.includes(p.id));
    }

    // 按 GM_Pool_Order_ 进行排序
    if (customOrder && Array.isArray(customOrder)) {
        window.ListOrder.sort(poolItems, customOrder);
    }

            if (badgeEl) {
                badgeEl.innerText = (window.getTrans('cs_pools_badge_count') || '').replace('{count}', poolItems.length);
            }

            if (poolItems.length === 0) {
                listEl.innerHTML = `<div style="color: #666; font-size: 12px; padding: 12px 4px; text-align: center; background: rgba(0,0,0,0.15); border-radius: 6px; border: 1px dashed rgba(255,255,255,0.06);">${window.getTrans('cs_pools_empty_hint')}</div>`;
                return;
            }

            listEl.innerHTML = poolItems.map((p) => {
                const displayName = (isEn && p.en) ? p.en : p.name;
                const delBtnHtml = isPreset ? '' : `
                    <div>
                        <button type="button" class="btn btn-pool-del" 
                                style="background: rgba(255, 71, 87, 0.15); border: 1px solid #ff4757; color: #ff4757; font-size: 12px; padding: 5px 12px; border-radius: 6px; font-weight: bold; cursor: pointer; display: inline-flex; align-items: center; gap: 5px; transition: 0.2s;"
                                onmouseover="this.style.background='#ff4757'; this.style.color='#fff';"
                                onmouseout="this.style.background='rgba(255, 71, 87, 0.15)'; this.style.color='#ff4757';"
                                onclick="deleteCustomPool('${p.id}')">
                            <span>🗑️</span>
                            <span>${window.getTrans('cs_pools_btn_del')}</span>
                        </button>
                    </div>
                `;

                return `
                <div class="pool-sort-row" data-id="${p.id}" style="display: flex; align-items: center; justify-content: space-between; background: rgba(0,0,0,0.25); border: 1px solid var(--border); padding: 8px 14px; border-radius: 8px;">
                    <div style="display: flex; align-items: center; gap: 10px; flex: 1;">
                        <span class="drag-handle" title="按住拖拽排序">⠿</span>
                        <span class="cat-icon-badge" style="font-size: 18px;" ${isPreset ? '' : `onclick="event.stopPropagation(); changeCustomPoolIcon('${p.id}')" title="${window.getTrans('cs_cat_prompt_icon_change')}"`}>${IconRender.html(p.icon || '✨')}</span>
                        <div style="display: flex; align-items: center; gap: 8px; flex: 1;">
                            <input type="text" class="input-box pool-name-input" value="${escapeEditorAttribute(displayName)}" 
                                   style="width: 220px; font-weight: bold; padding: 4px 8px; font-size: 13px;"
                                   ${isPreset ? 'readonly' : ''} 
                                   placeholder="${window.getTrans('cs_pools_name_ph')}"
                                   onchange="updateCustomPoolName('${p.id}', this.value)">
                            <span style="font-size: 11px; color: #888;">(ID: ${p.id})</span>
                        </div>
                    </div>
                    ${delBtnHtml}
                </div>`;
            }).join('');


            // 绑定拖拽逻辑 (无论是自定义还是官方预设，都允许拖拽修改顺序)
            bindDragEvents('custom-pools-list', '.pool-sort-row', (fromId, toId, isBefore) => {
                const fromIdx = poolItems.findIndex(p => p.id === fromId);
                const toIdx = poolItems.findIndex(p => p.id === toId);
                if (fromIdx < 0 || toIdx < 0) return;

                const [movedPool] = poolItems.splice(fromIdx, 1);
                const insertIdx = poolItems.findIndex(p => p.id === toId);
                poolItems.splice(isBefore ? insertIdx : insertIdx + 1, 0, movedPool);

                const newOrder = poolItems.map(p => p.id);
                writeEngineEdit(`GM_Pool_Order_${gameId}`, JSON.stringify(newOrder));

                if (!isPreset) {
                    let rosterPools = JSON.parse(readEngineEdit('GM_RosterPools_' + gameId)) || [];
                    window.ListOrder.sort(rosterPools, newOrder);
                    writeEngineEdit('GM_RosterPools_' + gameId, JSON.stringify(rosterPools));
                }

                renderCustomPoolsList();
                if (typeof renderSidebar === 'function') renderSidebar();
            }, '.drag-handle', { allowPreset: true }); // 预设卡池导航顺序仍允许自定义。
        }

        // 卡池图标与图鉴相同：点击后输入 Emoji；同时更新草稿元数据与规则信息。
        // 仍需保存配置才落盘，放弃修改不会改变原来的图标。
        window.changeCustomPoolIcon = async function(pId) {
            if (galleryPreviewLock.isLocked()) return;
            const rosterPools = JSON.parse(readEngineEdit('GM_RosterPools_' + gameId)) || [];
            const pool = rosterPools.find(p => p.id === pId);
            if (!pool) return;
            const newIcon = await IconPicker.choose(pool.icon || '✨');
            if (galleryPreviewLock.isLocked()) return;
            if (!newIcon || !newIcon.trim()) return;
            pool.icon = newIcon.trim();
            writeEngineEdit('GM_RosterPools_' + gameId, JSON.stringify(rosterPools));
            const ruleKey = `GM_Rules_${gameId}_${pId}`;
            const rule = JSON.parse(readEngineEdit(ruleKey)) || {};
            rule.info = { ...rule.info, icon: pool.icon };
            writeEngineEdit(ruleKey, JSON.stringify(rule));
            markPageDirty();
            renderCustomPoolsList();
            showToast(window.getTrans('icon_picker_success'), 'success');
        };

        window.updateCustomPoolName = function(pId, newName, language) {
    // 预览与官方预设都只读，不能通过残留按钮或直接调用修改数据。
    if (galleryPreviewLock.isLocked()) return;
    language = language || getLang();
            newName = (newName || '').trim();

            let rosterPools = JSON.parse(readEngineEdit('GM_RosterPools_' + gameId)) || [];
            const pool = rosterPools.find(p => p.id === pId);
            if (pool) {
                pool[language === 'en' ? 'en' : 'name'] = newName;
                writeEngineEdit('GM_RosterPools_' + gameId, JSON.stringify(rosterPools));

                const ruleKey = `GM_Rules_${gameId}_${pId}`;
                let rule = JSON.parse(readEngineEdit(ruleKey)) || {};
                if (!rule.info) rule.info = {};
                rule.info[language === 'en' ? 'en' : 'name'] = newName;
                writeEngineEdit(ruleKey, JSON.stringify(rule));

                markPageDirty();
                if (typeof renderSidebar === 'function') renderSidebar();
            }
        };

        window.openAddPoolModal = function() {
    // 预览与官方预设都只读，不能通过残留按钮或直接调用修改数据。
    if (galleryPreviewLock.isLocked()) return;
            if (!gameId) {
                alert(window.getTrans ? window.getTrans('cs_err_no_game_name') : "请先填写并保存游戏名称生成引擎！");
                return;
            }
            if (typeof PRESET_GAME_IDS !== 'undefined' && PRESET_GAME_IDS.includes(gameId)) {
                return;
            }

            const bodyEl = document.getElementById('custom-pools-body');
            const arrowEl = document.getElementById('pools-arrow-indicator');
            if (bodyEl && bodyEl.style.display === 'none') {
                bodyEl.style.display = 'flex';
                if (arrowEl) arrowEl.innerText = window.getTrans('cs_collapse_cfg_btn');
            }

            let rosterPools = JSON.parse(readEngineEdit('GM_RosterPools_' + gameId)) || [];
            const isEn = getLang() === 'en';
            const baseName = isEn ? 'New Pool' : '新建卡池';
            const existingNames = new Set(rosterPools.map(p => (isEn && p.en) ? p.en : p.name));
            let finalPoolName = baseName;

            if (existingNames.has(finalPoolName)) {
                let counter = 1;
                while (existingNames.has(`${baseName} ${counter}`) || existingNames.has(`${baseName}${counter}`)) {
                    counter++;
                }
                finalPoolName = `${baseName} ${counter}`;
            }

            const poolId = 'pool_' + Date.now();
            rosterPools.push({
                id: poolId,
                name: finalPoolName,
                en: finalPoolName,
                type: 'up',
                icon: '✨',
                isStandalone: true
            });
            writeEngineEdit('GM_RosterPools_' + gameId, JSON.stringify(rosterPools));

            let customOrder = JSON.parse(readEngineEdit(`GM_Pool_Order_${gameId}`)) || [];
            customOrder.push(poolId);
            writeEngineEdit(`GM_Pool_Order_${gameId}`, JSON.stringify(customOrder));

            const defaultRule = {
                info: { name: finalPoolName, en: finalPoolName },
                hardPity: 90,
                tiers: (gameInfo.globalTiers || []).map((t, idx) => ({
                    id: t.id,
                    prob: idx === 0 ? 0.6 : (idx === 1 ? 9.4 : 90.0),
                    isGold: idx === 0
                })),
                pities: [{
                    tierId: gameInfo.globalTiers[0]?.id || 'tier_5',
                    pulls: 90,
                    upRate: 0.5,
                    useGuarantee: true,
                    guaranteeLimit: 1
                }],
                lifecycle: {
                    allowRotation: true,
                    sharedPityParent: '',
                    rotationMatrix: {
                        inheritPityPulls: true,
                        inheritGuaranteeState: true,
                        inheritRescueLosses: true,
                        resetEarlyUp: true,
                        resetCatSeq: true,
                        resetSparkPity: true,
                        resetGiftRules: true
                    }
                }
            };
            writeEngineEdit(`GM_Rules_${gameId}_${poolId}`, JSON.stringify(defaultRule));

            renderCustomPoolsList();
            if (typeof renderSidebar === 'function') renderSidebar();
        };

window.deleteCustomPool = async function(pId) {
    // 预览与官方预设都只读，不能通过残留按钮或直接调用修改数据。
    if (galleryPreviewLock.isLocked()) return;
    let rosterPools = JSON.parse(readEngineEdit('GM_RosterPools_' + gameId)) || [];
    const poolItem = rosterPools.find(p => p.id === pId);
    const poolName = poolItem ? (getLang() === 'en' && poolItem.en ? poolItem.en : poolItem.name) : pId;

    const confirmed = await showConfirmModal({
        title: (window.getTrans('cs_pools_del_title') || '').replace('{name}', poolName),
        msg: (window.getTrans('cs_pools_del_msg') || '').replace('{name}', poolName),
        okText: window.getTrans ? window.getTrans('confirm_delete') : "确认删除",
        theme: "danger"
    });

    if (!confirmed || galleryPreviewLock.isLocked()) return;

    // ★ 关键修改：不直接抹除 localStorage 中的卡池与抽卡规则数据！
    // 仅将它存入会话级别的待删除队列中
    let pendingDeleted = JSON.parse(sessionStorage.getItem(`GM_Pending_Deleted_Pools_${gameId}`)) || [];
    if (!pendingDeleted.includes(pId)) {
        pendingDeleted.push(pId);
        sessionStorage.setItem(`GM_Pending_Deleted_Pools_${gameId}`, JSON.stringify(pendingDeleted));
    }

    // 标记当前页面为脏数据（有未保存修改）
    markPageDirty();

    // 刷新页面当前卡池列表和侧边栏（即时生效，但未持久化到真实数据）
    renderCustomPoolsList();
    if (typeof renderSidebar === 'function') renderSidebar();

    showToast((window.getTrans('cs_pools_del_toast') || '').replace('{name}', poolName), "danger");
};

window.handleEngineConfigImport = async function(event) {
    // 预览与官方预设都只读，不能通过残留按钮或直接调用修改数据。
    if (galleryPreviewLock.isLocked()) return;
    // 读取/校验/确认后直接应用到表单，完成后刷新界面，不增加额外操作步骤。
    return ImportExport.importInput(event.target, {
        read: ImportExport.readEnginePackage,
        validate({ data }) {
            if (!ImportExport.isObject(data) || (!data.catalog && !data.info) ||
                (data.info && !ImportExport.isObject(data.info)) ||
                (data.catalog && (!ImportExport.isObject(data.catalog) ||
                    Object.values(data.catalog).some(items => !Array.isArray(items) ||
                        items.some(item => !ImportExport.isObject(item)))))) {
                throw new Error('INVALID_ENGINE');
            }
        },
        confirm: () => showConfirmModal({
            title: window.getTrans('cs_modal_import_cfg_title'),
            msg: window.getTrans('cs_modal_import_cfg_msg'),
            okText: window.getTrans('cs_btn_confirm_import'),
            theme: "primary"
        }),
        apply: ({ data, imagesMap }) => {
            // 文件读取/确认是异步的，应用时再次确认没有进入预览。
            if (galleryPreviewLock.isLocked()) throw new Error('PREVIEW_LOCKED');
            applyImportedEngineConfig(data, imagesMap);
        },
        afterImport: () => {
            // 只重渲染而不重载网页，避免尚未保存的图鉴被丢弃。
            renderGlobalTiers();
            renderCustomTags();
            renderCustomPoolsList();
            renderCategories();
            updateImportVisibility();
            if (typeof renderSidebar === 'function') renderSidebar();
            markPageDirty();
            showToast(window.getTrans('cs_toast_import_cfg_success'), 'success');
        },
        onError: err => {
            if (err.message === 'JSZIP_UNAVAILABLE') alert(getLang() === 'en' ? 'JSZip library not loaded!' : '未加载 JSZip 库，无法解压！');
            else if (err.message === 'ZIP_CONFIG_MISSING') alert(getLang() === 'en' ? 'Missing config.json in ZIP!' : 'ZIP 压缩包内缺少 config.json 配置文件！');
            else if (err.message === 'INVALID_ENGINE') alert(window.getTrans('cs_alert_invalid_json'));
            else alert(window.getTrans('cs_alert_parse_json_fail') + err.message);
        }
    });
};

// 导入结果如何写入游戏设定、表单和卡池存储属于本页业务，不放入文件工具。
function applyImportedEngineConfig(data, imagesMap) {
        beginEngineImport(); // 导入只创建编辑草稿，不立即覆盖正式数据。
        const isEn = getLang() === 'en';
        // 1. 分配或保留 gameId
        if (!gameId) {
            gameId = 'g_' + Date.now();
            const currentUrl = new URL(window.location.href);
            currentUrl.searchParams.set('gameId', gameId);
            window.history.replaceState({}, '', currentUrl.toString());
        }

        // 2. 还原游戏基础设定与名称
        if (data.info) {
            gameInfo = Object.assign(gameInfo, data.info);
            // 老版包没有经济配置时清空上一份草稿，避免串入其他游戏规则。
            gameInfo.economy = data.info.economy || null;
            pendingCurrencyImport = true;
            const finalGameName = (isEn && gameInfo.enGameName) ? gameInfo.enGameName : (gameInfo.gameName || gameInfo.enName || '');
            const nameInput = document.getElementById('input-game-name');
            if (nameInput) nameInput.value = finalGameName;

        }

        // 3. 还原图鉴数据（映射回 Base64）
        if (data.catalog) {
            catalog = data.catalog;
            // 遍历如果发现 img 指向 images/xxx，且在 zip 里提取到了 Base64，则还原回去
            for (let catId in catalog) {
                (catalog[catId] || []).forEach(item => {
                    if (item.img && imagesMap[item.img]) {
                        item.img = imagesMap[item.img];
                    }
                    // 若 item.img 是 "img/ZZZ/..."，imagesMap 里没有，自动保留该路径，指向网站服务器自带图片
                });
            }
        }

        // 4. 还原卡池列表与排序
        const importedPools = data.rosterPools || (data.info && data.info.rosterPools) || [];
        if (Array.isArray(importedPools) && importedPools.length > 0) {
            const formattedPools = importedPools.map(p => ({
                id: p.id,
                name: p.name || p.id,
                en: p.en || p.name || p.id,
                icon: p.icon || '✨',
                type: p.type || 'up',
                isStandalone: p.isStandalone !== false
            }));
            writeEngineEdit('GM_RosterPools_' + gameId, JSON.stringify(formattedPools));
            const poolOrder = data.poolOrder || formattedPools.map(p => p.id);
            writeEngineEdit(`GM_Pool_Order_${gameId}`, JSON.stringify(poolOrder));
        }

        // 5. 还原卡池规则
        if (data.poolRules && typeof data.poolRules === 'object') {
            Object.entries(data.poolRules).forEach(([pId, rule]) => {
                writeEngineEdit(`GM_Rules_${gameId}_${pId}`, JSON.stringify(rule));
            });
        }

}

// 2. 从已有官方预设一键导入/克隆到当前新建库（包含名称、规则、卡池及物品图鉴）
window.importFromExistingPreset = async function() {
    // 预览与官方预设都只读，不能通过残留按钮或直接调用修改数据。
    if (galleryPreviewLock.isLocked()) return;
    const targetPreset = document.getElementById('select-preset-template').value;
    if (!targetPreset) return;

    const presetName = targetPreset.toUpperCase();

    const confirmed = await showConfirmModal({
        title: window.getTrans('cs_modal_load_preset_title').replace('{name}', presetName),
        msg: window.getTrans('cs_modal_load_preset_msg').replace('{name}', presetName),
        okText: window.getTrans('cs_btn_confirm_load'),
        theme: "primary"
    });

    if (!confirmed || galleryPreviewLock.isLocked()) return;

    // 克隆预设时各部分均为独立副本，修改新建库不会影响官方预设。
    beginEngineImport(); // 预设克隆也与文件导入使用相同的暂存/保存流程。
    const preset = GameData.getPreset(targetPreset, { includeHidden: true });
    const setupRules = preset?.setup;
    const liveDB = preset?.db;
    const presetTiers = preset?.tiers;
    const poolRules = preset?.rules;

    // 预设游戏标准名称字典
    const PRESET_GAME_NAMES = {
        test: { zh: "测试专用", en: "Feature Test Lab" },
        hsr: { zh: "崩坏：星穹铁道", en: "Honkai: Star Rail" },
        zzz: { zh: "绝区零", en: "Zenless Zone Zero" },
        ark: { zh: "明日方舟", en: "Arknights" },
        end: { zh: "明日方舟：终末地", en: "Arknights: Endfield" }
    };

    // 1. 如果当前是纯新建状态（URL 没有 gameId），先自动生成并更新当前全局 gameId
    if (!gameId) {
        gameId = 'g_' + Date.now();
        const currentUrl = new URL(window.location.href);
        currentUrl.searchParams.set('gameId', gameId);
        window.history.replaceState({}, '', currentUrl.toString());
    }

    // 2. 导入游戏名称并同步到输入框
    const names = PRESET_GAME_NAMES[targetPreset] || { zh: targetPreset.toUpperCase(), en: targetPreset.toUpperCase(), eshort: targetPreset.toUpperCase() };
    gameInfo.gameName = names.zh;
    gameInfo.enGameName = names.en;
    const nameInput = document.getElementById('input-game-name');
    if (nameInput) {
        nameInput.value = (getLang() === 'en') ? names.en : names.zh;
    }

    // 3. 复制基因库配置 (星级、标签、分类、满破上限)
    if (presetTiers) gameInfo.globalTiers = JSON.parse(JSON.stringify(presetTiers));
    if (setupRules && setupRules.tagDefinitions) gameInfo.tagDefinitions = JSON.parse(JSON.stringify(setupRules.tagDefinitions));
    if (setupRules && setupRules.categories) gameInfo.categories = JSON.parse(JSON.stringify(setupRules.categories));
    if (setupRules && setupRules.overflowRules) gameInfo.overflowRules = JSON.parse(JSON.stringify(setupRules.overflowRules));
    gameInfo.economy = setupRules?.economy ? JSON.parse(JSON.stringify(setupRules.economy)) : null;
    pendingCurrencyImport = true;

    // 4. 复制全套卡池及对应的抽卡规则
    let rosterPools = [];
    let poolOrder = [];

    if (poolRules && typeof poolRules === 'object') {
        Object.keys(poolRules).forEach(pId => {
            const p = poolRules[pId];
            const info = p.info || {};
            const poolItem = {
                id: pId,
                name: info.name || pId,
                en: info.en || info.name || pId,
                icon: info.icon || '✨',
                type: p.type || 'up',
                isStandalone: true
            };
            rosterPools.push(poolItem);
            poolOrder.push(pId);

            // 将卡池抽卡保底/概率规则独立保存到当前游戏的本地存储中
            writeEngineEdit(`GM_Rules_${gameId}_${pId}`, JSON.stringify(p));
        });
    }

    writeEngineEdit('GM_RosterPools_' + gameId, JSON.stringify(rosterPools));
    writeEngineEdit(`GM_Pool_Order_${gameId}`, JSON.stringify(poolOrder));

    // 5. 重新从 liveDB 生成图鉴列表
    catalog = {};
    gameInfo.categories.forEach(c => catalog[c.id] = []);

    if (liveDB && Array.isArray(liveDB)) {
        liveDB.forEach(item => {
            let tId = item.tierId || ('tier_' + (item.star || 5));
            let catId = item.category;
            if (!catId) {
                let tStr = Array.isArray(item.type) ? item.type[0] : (item.type || '');
                if (tStr.startsWith('wep') || item.img?.includes('weapon')) catId = 'wep';
                else if (tStr.startsWith('pet') || tStr.startsWith('bangboo') || item.img?.includes('bangboo')) catId = 'pet';
                else catId = 'char';
            }

            let rawTags = item.tags || item.tag || item.type || [];
            if (!Array.isArray(rawTags)) rawTags = [rawTags];
            const assignedTags = normalizeCatalogTags(rawTags, tId, getActiveTagDefinitions());

            if (!catalog[catId]) catalog[catId] = [];
            catalog[catId].push({
                id: item.id || ('item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4)),
                name: item.name,
                en: item.en || item.name,
                short: item.short || item.name,
                eshort: item.eshort || item.en || item.name,
                tierId: tId,
                tags: [...new Set(assignedTags)],
                img: item.img || '',
                ...(Array.isArray(item.legacyIds) ? { legacyIds: [...item.legacyIds] } : {}),
                ...(item.ownershipId ? { ownershipId: item.ownershipId } : {}),
                ...(Array.isArray(item.aliases) ? { aliases: [...item.aliases] } : {})
            });
        });
    }

    // 6. 立即更新页面各组件渲染与按钮显隐
    renderGlobalTiers();
    renderCustomTags();
    renderCustomPoolsList();   // 刷新卡池列表
    renderCategories();        // 刷新图鉴网格
    updateImportVisibility();  // 自动隐藏初始化栏与导入配置按钮，显示导出配置按钮

    if (typeof renderSidebar === 'function') renderSidebar();

    markPageDirty();
    const showName = (getLang() === 'en') ? names.en : names.zh;
    showToast(window.getTrans('cs_toast_load_preset_success').replace('{name}', showName), "success");
};

// 判定当前图鉴是否为空（物品总数是否为 0）
function isCatalogEmpty() {
    if (!catalog) return true;
    let totalItems = 0;
    for (let catId in catalog) {
        if (Array.isArray(catalog[catId])) {
            totalItems += catalog[catId].length;
        }
    }
    return totalItems === 0;
}

// 统一控制【导入配置】、【导出配置】和【快速初始化栏】的显示/隐藏
function updateImportVisibility() {
    const isPreset = typeof PRESET_GAME_IDS !== 'undefined' && PRESET_GAME_IDS.includes(gameId);
    const hasItems = !isCatalogEmpty();

    const importBtn = document.getElementById('btn-import-config');
    const exportBtn = document.getElementById('btn-export-config');
    const presetBar = document.getElementById('preset-import-bar');

    // 1. 只有纯空白、未录入数据的自定义新建游戏，才允许导入
    const canImport = !isPreset && !hasItems;

    // 2. 只要是有数据的游戏（预设游戏 或 已录入/保存数据的自定义游戏），才允许导出配置
    const canExport = isPreset || hasItems;

    if (importBtn) {
        importBtn.style.display = canImport ? 'inline-flex' : 'none';
    }
    if (presetBar) {
        presetBar.style.display = canImport ? 'flex' : 'none';
    }
    if (exportBtn) {
        exportBtn.style.display = canExport ? 'inline-flex' : 'none';
    }
}


// A local draft is committed only after Apply and a fresh readonly check.
document.addEventListener('click', event => {
    const button=event.target.closest('[data-paint-kind]');
    if(!button || button.disabled || galleryPreviewLock.isLocked())return;
    const kind=button.dataset.paintKind,id=button.dataset.paintId;
    const definition=kind==='tier'?gameInfo.globalTiers.find(t=>t.id===id):getActiveTagDefinitions()[id];
    if(!definition)return;
    ColorPicker.open({value:definition,title:getTrans('color_edit')+' · '+(kind==='tier'?getLocalizedTierName(definition):getLocalizedTagName(definition)),isLocked:()=>galleryPreviewLock.isLocked(),onApply:result=>{
        if(galleryPreviewLock.isLocked())return;
        if(kind==='tag'&&!gameInfo.tagDefinitions)gameInfo.tagDefinitions=JSON.parse(JSON.stringify(getActiveTagDefinitions()));
        const target=kind==='tier'?gameInfo.globalTiers.find(t=>t.id===id):gameInfo.tagDefinitions[id];
        if(!target)return;Object.assign(target,result);if(!result.paint)delete target.paint;
        if(kind==='tag')target.textColor=ColorStyle.contrast(result);
        markPageDirty();renderGlobalTiers();renderCustomTags();renderCategories();
    }});
});
