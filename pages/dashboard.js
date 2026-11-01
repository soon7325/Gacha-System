/**
 * 仪表盘：记录渲染、统计、录入编辑、撤回、导出和换期界面。
 * 由 dashboard.html 底部加载，保持原先的依赖和执行顺序。
 * 使用普通 script，全局函数仍可供 HTML 内联 onclick 调用。
 */
const urlParams = new URLSearchParams(window.location.search);
        const sysLang = localStorage.getItem('GM_Lang') || 'zh';

        // 名称显示算法共用；图鉴和稀有度通过回调读取，重新加载后仍使用最新数据。
        const { getItemName, getItemShort, getTierName: getTierDisplayName } = ItemFormat.create({
            getCatalog: () => pureCatalog,
            findItem: findInCatalog,
            getTiers: () => globalTiers,
            getLang: () => sysLang
        });

        let currentPool = urlParams.get('pool') || 'char_up';
        let currentGameId = urlParams.get('gameId');

        if (!currentGameId) {
            alert(typeof getTrans === 'function' ? getTrans('invalid_game_channel') : "游戏参数无效，返回首页");
            window.location.href = 'html/index.html';
        }

        let dashboardAccountId=null,dashboardAccountRows=[],dashboardInputSnapshot=null;
        const accountText=(zh,en)=>sysLang==='en'?en:zh;
        const inputSyncEnabled=()=>localStorage.getItem('GM_Dashboard_Sync_Player')==='true';
        window.openDashboardSimulator=()=>{
            const params=new URLSearchParams({gameId:currentGameId,pool:currentPool});if(dashboardAccountId)params.set('data',dashboardAccountId);
            window.location.href='html/simulator.html?'+params;
        };
        function readDashboardRecords(){return DashboardAccounts.read(currentGameId,currentPool,dashboardAccountId).records;}
        function accountError(error){
            const messages={conflict:accountText('账号或记录已在其他页面修改，请重新打开录入窗口。','Account or records changed elsewhere. Reopen the input window.'),
                account_missing:accountText('此账号已被删除，请刷新后选择其他账号。','This account was deleted. Refresh and select another account.'),
                baseline_changed:accountText('修改涉及同步基准之前的历史，无法准确回退玩家进度。请关闭“录入记录同步至玩家数据”后保存此历史修改。','This edits history before the sync baseline. Turn off record sync to save these history edits without changing player data.'),
                owned_conflict:accountText('物品持有已被调整，无法安全撤回同步数量，请关闭录入同步后保存。','Copy counts changed. Turn off record sync to save these edits safely.')};
            showToast(messages[error.message]||accountText('无法读取或保存账号记录，请检查本机存储。','Unable to read or save account records. Check local storage.'),'danger');
        }
        function initDashboardAccount(){
            UserDataAccountsUI.initialize(currentGameId);
            const rows=UserDataProfiles.visibleRows(UserDataProfiles.read(currentGameId).items.filter(row=>UserDataProfiles.purpose(row)==='record'));dashboardAccountRows=rows;
            const preferred=urlParams.get('account')??localStorage.getItem('GM_Dashboard_Account_'+currentGameId);
            dashboardAccountId=(preferred==='legacy'?rows.find(row=>row.legacyAccount)?.id:rows.find(row=>row.id===preferred)?.id)||UserDataProfiles.defaultRow(rows)?.id||null;
            localStorage.setItem('GM_Dashboard_Account_'+currentGameId,dashboardAccountId||'legacy');
            renderAccountControls();
            if(!window.dashboardAccountWatcher)window.dashboardAccountWatcher=UserDataAccountsUI.watch?.(currentGameId,items=>{
                const rows=UserDataProfiles.visibleRows(items.filter(row=>UserDataProfiles.purpose(row)==='record'));
                // 删除当前账号仍由原有冲突保护处理，不能把录入草稿切到另一个账号。
                if(dashboardAccountId&&!rows.some(row=>row.id===dashboardAccountId))return;
                dashboardAccountRows=rows;renderAccountControls();
            });
            const inputButton=document.querySelector('[data-i18n="cd_btn_input"]');
            if(inputButton){inputButton.disabled=!dashboardAccountId;inputButton.title=dashboardAccountId?'':accountText('请先在玩家数据页创建结果记录用账户。','Create a record account in Player data first.');}
        }
        function renderAccountControls(){
            const root=document.getElementById('dashboard-account-bar');if(!root)return;
            root.replaceChildren();root.hidden=!dashboardAccountRows.length;
            if(root.hidden)return;
            const label=document.createElement('label');
            const select=document.createElement('select');select.setAttribute('aria-label',accountText('玩家账号','Player account'));
            UserDataAccountsUI.fillSelect(select,dashboardAccountRows,{selectedId:dashboardAccountId});
            select.onchange=()=>{const chosen=select.value;if(chosen===dashboardAccountId)return;select.value=dashboardAccountId||'legacy';const url=new URL(window.location.href);url.searchParams.set('account',chosen);
                if(document.getElementById('modalOverlay').style.display!=='none')dashboardUnsaved.request(url.href);else window.location.href=url.href;};
            label.append(select);root.append(label);
            window.refreshCustomDropdowns?.(root,true);
        }
        let roster = {};
        let gameInfo = {};
        let pureCatalog = {};
        let rules = {};
        let globalTiers = [];
        let currentTiers = [];
        let selectedGoldIds = [];
        let currentEditingBox = null;

        // ==========================================
// 🌟 删除模式核心状态机与回退历史栈
// ==========================================
window.isDeleteMode = false;
let deleteHistoryStack = [];        // 记录删除每一步快照，供单步撤回
let deleteInitialSnapshot = null;   // 记录进入删除模式时的初始快照，供全部回退

// 记录删除历史快照
function pushDeleteSnapshot() {
    const body = document.getElementById('edit-body');
    if (!body) return;
    deleteHistoryStack.push(body.innerHTML);
    updateUndoCountBadge();
}

function updateUndoCountBadge() {
    const el = document.getElementById('undo-step-count');
    if (el) el.innerText = deleteHistoryStack.length;
}

// 切换删除模式开关
window.toggleDeleteMode = function() {
    if (!window.isDeleteMode) {
        // 进入删除模式：记录进入时的初始状态并清空历史栈
        const body = document.getElementById('edit-body');
        deleteInitialSnapshot = body ? body.innerHTML : null;
        deleteHistoryStack = [];
        updateUndoCountBadge();

        window.isDeleteMode = true;
        document.body.classList.add('is-delete-mode');
        const btn = document.getElementById('btn-toggle-delete-mode');
        if (btn) {
            btn.classList.add('active');
            btn.innerHTML = getTrans('cd_delete_mode_exit');
        }
    } else {
        // 尝试退出删除模式：如果期间删除了东西，弹出确认提示
        if (deleteHistoryStack.length > 0) {
            document.getElementById('deleteExitConfirmModal').style.display = 'flex';
        } else {
            exitDeleteModeFinal(false);
        }
    }
};

// 退出删除模式：全部回退
window.handleDiscardAllDeletes = function() {
    const body = document.getElementById('edit-body');
    if (body && deleteInitialSnapshot !== null) {
        body.innerHTML = deleteInitialSnapshot;
        rebindEditBodyEvents();
        updateEditRowIndexes();
    }
    document.getElementById('deleteExitConfirmModal').style.display = 'none';
    exitDeleteModeFinal(false);
    showToast(getTrans('cd_delete_reverted'), "cancel");
};

// 退出删除模式：保留修改
window.handleConfirmAllDeletes = function() {
    document.getElementById('deleteExitConfirmModal').style.display = 'none';
    exitDeleteModeFinal(true);
    showToast(getTrans('cd_delete_applied'), "success");
};

// 正式退出删除模式
function exitDeleteModeFinal(isSaved) {
    window.isDeleteMode = false;
    deleteHistoryStack = [];
    deleteInitialSnapshot = null;
    document.body.classList.remove('is-delete-mode');
    const btn = document.getElementById('btn-toggle-delete-mode');
    if (btn) {
        btn.classList.remove('active');
        btn.innerHTML = getTrans('cd_delete_mode');
    }
}

// 撤回上一步
window.handleUndoDelete = function() {
    if (deleteHistoryStack.length === 0) return;
    const body = document.getElementById('edit-body');
    if (!body) return;

    // 弹出最近一次操作前的状态并恢复
    const previousHtml = deleteHistoryStack.pop();
    body.innerHTML = previousHtml;
    updateUndoCountBadge();

    // 重新挂载行内事件与抽数核对
    rebindEditBodyEvents();
    updateEditRowIndexes();
};

// 恢复 HTML 后重新绑定方块点击与按钮事件
function rebindEditBodyEvents() {
    const body = document.getElementById('edit-body');
    if (!body) return;

    // 给每个方块重新挂载 onclick
    body.querySelectorAll('.box').forEach(b => {
        b.onclick = (e) => {
            if (window.isDeleteMode) {
                e.stopPropagation();
                handleDeleteSingleBox(b);
                return;
            }
            // 正常模式点击切星级
            let tId = b.dataset.tierId;
            let tierIndex = currentTiers.findIndex(t => t.id === tId);
            if (tierIndex === -1) tierIndex = currentTiers.length - 1;
            tierIndex = (tierIndex - 1 + currentTiers.length) % currentTiers.length;
            let nextTier = currentTiers[tierIndex];

            b.dataset.tierId = nextTier.id;
            b.dataset.tierName = nextTier.name;
            b.style.background = window.ColorStyle?.background(nextTier) || nextTier.color;

            if (selectedGoldIds.includes(nextTier.id)) {
                b.classList.add('s5');
                b.style.boxShadow = `0 0 10px ${nextTier.color}90`;
                b.style.border = '2px solid #fff';
                resetBoxContent(b, nextTier);
                openCharPicker(e, b, nextTier);
            } else {
                b.classList.remove('s5');
                b.style.boxShadow = 'none';
                b.style.border = '2px solid transparent';
                resetBoxContent(b, nextTier);
            }
        };
    });

    // 给加号按钮重新挂载 onclick
    body.querySelectorAll('.box-add-more').forEach(addBtn => {
        addBtn.onclick = (e) => {
            e.stopPropagation();
            const group = addBtn.closest('.boxes-group');
            const row = addBtn.closest('.edit-row-container');
            if (group && row) {
                group.appendChild(createBox());
                syncRowPlusButton(row);
                updateEditRowIndexes();
            }
        };
    });
}

// 改造单格删除方法（删除前压入历史快照）
window.handleDeleteSingleBox = function(boxEl) {
    const row = boxEl.closest('.edit-row-container');
    if (!row) return;

    const group = row.querySelector('.boxes-group');
    if (!group) return;

    // 🌟 删除前压栈，供单步撤回
    pushDeleteSnapshot();

    // 移除目标方块
    boxEl.remove();

    // 检查剩余方块
    const remainingBoxes = group.querySelectorAll('.box');
    if (remainingBoxes.length === 0) {
        row.remove();
    } else {
        syncRowPlusButton(row);
    }

    updateEditRowIndexes();
};

// 🌟 全局整排删除函数（支持历史快照与撤回）
window.handleDeleteWholeRow = function(delBtn) {
    const row = delBtn.closest('.edit-row-container');
    if (!row) return;

    // 1. 删除前压栈记录快照
    if (typeof pushDeleteSnapshot === 'function') {
        pushDeleteSnapshot();
    }

    // 2. 移除整排
    row.remove();

    // 3. 重新核算各排抽数区间与总抽数
    updateEditRowIndexes();
};


        // 页面初始化主入口
        window.addEventListener('DOMContentLoaded', initPage);

        function initPage() {
            if (typeof renderSidebar === 'function') renderSidebar();

            loadBaseConfigs();
            try{initDashboardAccount();}catch(error){accountError(error);document.querySelectorAll('[onclick="openModal()"]').forEach(button=>button.disabled=true);return;}
            renderHeader();
            renderDashboard();
        }

        // 1. 深度加载基础设定与卡池规则配置
        function loadBaseConfigs() {
            // 公共数据层统一读取配置、规则和稀有度；页面只负责展示与编辑。
            const context = GameData.loadContext({ gameId: currentGameId, poolId: currentPool });
            gameInfo = context.gameInfo;
            rules = context.rules;
            globalTiers = context.globalTiers;
            roster = context.roster;
            pureCatalog = context.catalog;
            // 同步规则到 window，供需要访问它的脚本读取。
            window.rules = rules;

            const description = GameData.describePool(rules, globalTiers, { missingColor: '#555', englishFallbackToName: true });
            currentTiers = description.activeTiers;
            selectedGoldIds = description.targetGoldIds;
            if (currentTiers.length === 0) {
                globalTiers.forEach((gt, idx) => {
                    currentTiers.push({ id: gt.id, name: gt.name, en: gt.en || gt.name, color: gt.color, ...(gt.paint ? {paint:gt.paint} : {}), prob: idx === 0 ? 0.6 : (idx === 1 ? 9.4 : 90.0) });
                });
            }

        }

        function getItemsByCategories(cats = []) {
            return CatalogUtils.getItemsByCategories(pureCatalog, cats || []);
        }

        function findInCatalog(name) {
            if (!name) return null;
            // 查找算法共用，图鉴优先、官方预设兜底的顺序保持不变。
            const match = CatalogUtils.findItem(pureCatalog, name);
            if (match) return match;
            // 备用兜底：直接在全局预设数据库中查找
            const rawDb = GameData.getPresetItems(currentGameId) || [];
            return CatalogUtils.findItem(rawDb, name);
        }

function renderHeader() {
    const baseName = gameInfo.gameName || gameInfo.name;
    let displayName = sysLang === 'en' ? (gameInfo.enGameName || baseName) : (baseName || gameInfo.enGameName);
    let transKey = 'game_' + currentGameId;
    let translatedName = typeof window.getTrans === 'function' ? window.getTrans(transKey) : transKey;
    if (translatedName !== transKey) displayName = translatedName;

    const titleEl = document.getElementById('display-game-name');
    if (titleEl) titleEl.innerText = displayName || getTrans('cd_dashboard');

    // 看板优先当前规则 info，卡池配置页优先本地名称；数据层显式支持两种读取方式。
    const poolMeta = GameData.loadPoolMeta(currentGameId, currentPool, { info: rules.info });
    let poolName = sysLang === 'en' ? poolMeta.en : poolMeta.name;

    // 检查预设词条备选 (如 pool_zzz_char)
    const poolTransKey = `pool_${currentGameId}_${currentPool}`;
    const transPool = getTrans(poolTransKey);
    if (transPool && transPool !== poolTransKey) {
        poolName = transPool;
    }

    const infoEl = document.getElementById('display-engine-info');
    if (infoEl) infoEl.innerText = poolName;
}

        function renderDashboard() {
            const wrap = document.getElementById('list-wrap');
            if (!wrap) return;
            wrap.innerHTML = '';

            let saved,accountSnapshot;try{accountSnapshot=DashboardAccounts.read(currentGameId,currentPool,dashboardAccountId);saved=accountSnapshot.records;}catch(error){accountError(error);return;}
            let totalPulls = 0, goldCount = 0, winCount = 0, lostCount = 0;
            let freeCount = 0;

            const tierCounts = {};
            currentTiers.forEach(t => {
                tierCounts[t.id] = 0;
            });

            // 历史检测先独立完成；页面只将原因翻译为文字并生成展示条。
            const isStdPool = currentPool.includes('std') || currentPool === 'mixed_std';
            const validationReport = DashboardValidation.validateHistory(saved, {
                rules, activeTiers: currentTiers, targetGoldIds: selectedGoldIds,
                catalog: pureCatalog, findItem: findInCatalog,
                isStdPool, allowRotation: isRotationAllowed(),initialState:accountSnapshot.row?UserDataProfiles.initial(accountSnapshot.row,currentPool,GameData.describePool(rules,globalTiers).minorPities.length):null
            });
            const hardPity = validationReport.hardPity;

            // 原因使用语言包 key + 参数，检测器不依赖页面语言或 DOM。
            function formatValidation(errors) {
                const reason = errors.map(error => {
                    let text = getTrans(error.key);
                    Object.entries(error.params).forEach(([key, value]) => {
                        text = text.replaceAll('{' + key + '}', String(value));
                    });
                    return text;
                }).join(' | ');
                return { isInvalid: errors.length > 0, reason };
            }

            const renderedElements = [];

            // 🌟 构建抽卡展示条的行元素函数
            function buildRowElement(p, count, isFree, validationResult = { isInvalid: false, reason: "" }) {
                let tId = p.tierId;
                if (!tId && p.star !== undefined) {
                    let match = currentTiers.find(t => t.name === p.star.toString());
                    if (match) tId = match.id;
                }

                let isGold = selectedGoldIds.includes(tId);
                let tierObj = currentTiers.find(t => t.id === tId) || { name: p.star || "?", color: '#555' };
                const isPityRow = !isGold;
                let isLost = false;
                let itemName = p.short || p.name || '';
                let info = findInCatalog(p);

                if (!isPityRow) {
                    goldCount++;
                    if (!isStdPool && (p.isLost === true)) {
                        isLost = true;
                        lostCount++;
                    } else {
                        winCount++;
                    }
                }

                let iconContent = "";
                let barColor = "";
                let innerBarText = count + (typeof getTrans === 'function' ? getTrans('cd_js_pulls_unit') : '抽');
                let iconBorderColor = validationResult.isInvalid ? "#ff4757" : ((!isPityRow && !isFree) ? (tierObj.color || 'var(--gold)') : '#555');

                if (isFree && isPityRow) {
                    iconContent = `<span style="font-size:18px; font-weight:900; color:#fff;">X</span>`;
                } else if (isPityRow) {
                    iconContent = (typeof getTrans === 'function' ? getTrans('cd_js_pity_tag') : '垫');
                } else {
                    iconContent = (info && info.img) 
                        ? `<img src="${info.img}" style="width:100%; height:100%; object-fit:cover; border-radius:4px;">` 
                        : (info ? getItemShort(info) : (itemName || '？'));
                }

                // 新代码：屏幕宽度变小时，最大宽度自适应缩小
                const isMobile = window.innerWidth <= 768;
                const maxBarWidth = isMobile ? Math.min(window.innerWidth - 80, 320) : 500;
                let normalBarWidth = Math.min(count * (maxBarWidth / hardPity) + 30, maxBarWidth);
                let extraHtml = "";
                let customClass = "";
                let clickAttr = "";

                if (validationResult.isInvalid) {
                    customClass = "is-invalid-bar";
                    barColor = "#000000";
                    clickAttr = `onclick="toggleInvalidRow(this)" title="点击展开/收起异常原因"`;
                } else if (isFree) {
                    barColor = isPityRow ? "#e67e22" : (isLost ? "#f1c40f" : "#2ecc71");
                    innerBarText += (typeof getTrans === 'function' ? getTrans('cd_js_free_tag') : ' [赠送]');
                    if (!isPityRow && isLost) extraHtml = `<span style="color:#fff; font-weight:bold; margin-left:4px;">[歪]</span>`;
                } else {
                    if (isPityRow) {
                        barColor = "#3498db";
                        innerBarText += (typeof getTrans === 'function' ? getTrans('cd_js_cur_tag') : ' [当前垫抽]');
                    } else {
                        if (isLost) {
                            barColor = "#e74c3c";
                            extraHtml = `<span style="color:#fff; font-weight:bold; margin-left:4px;">[歪]</span>`;
                        } else {
                            const unit = hardPity / 10;
                            if (count <= unit * 3) barColor = "#2ecc71";
                            else if (count <= unit * 8) barColor = "#f1c40f";
                            else barColor = "#e67e22";
                        }
                    }
                }

                const row = document.createElement('div');
                row.className = 'char-row';

                // 如果有异常，绑定点击整行展开/收起
                if (validationResult.isInvalid) {
                    row.onclick = function() {
                        this.classList.toggle('expanded');
                    };
                    row.style.cursor = 'pointer';
                    row.title = "点击展开/收起异常详情";
                }

                let detailBoxHtml = "";
                if (validationResult.isInvalid) {
                    // 分割违规原因（用红色警示点罗列）
                    const reasons = validationResult.reason.split(' | ').map(r => `<div>⚠️ ${r}</div>`).join('');
                    detailBoxHtml = `
                        <div class="invalid-detail-box">
                            ${reasons}
                        </div>
                    `;
                }

                row.innerHTML = `
                    <div class="char-row-main">
                        <div class="char-icon" style="border-color:${iconBorderColor}; position:relative; box-shadow: ${validationResult.isInvalid ? '0 0 12px rgba(255, 71, 87, 0.6)' : (!isPityRow && !isFree ? `0 0 10px ${iconBorderColor}80` : 'none')};${!validationResult.isInvalid && !isPityRow && !isFree ? ColorStyle.frame(tierObj,'#222') : ''}">${iconContent}</div>
                        <div class="char-bar ${validationResult.isInvalid ? 'is-invalid-bar' : ''}" style="width:${normalBarWidth}px; background:${barColor};">
                            <span style="font-weight:bold; font-size:12px;">${innerBarText}</span>
                            ${validationResult.isInvalid ? `
                                <span class="invalid-badge" style="background:#ff4757; color:#fff; font-size:10px; padding:1px 6px; border-radius:3px; margin-left:8px; font-weight:900; display:inline-flex; align-items:center; gap:2px;">
                                    <span>⚠️</span> <span>${getTrans('cd_invalid_badge')}</span>
                                </span>
                            ` : extraHtml}
                        </div>
                    </div>
                    ${detailBoxHtml}
                `;
                window.GoldOrdinal?.decorate(row, isPityRow ? null : goldCount, JSON.stringify([currentGameId,currentPool,dashboardAccountId,goldCount]));
                return row;
            }

            // 展示重放后的记录；保底、连歪、定向和井判定都已由检测器返回。
            validationReport.entries.forEach((entry, index) => {
                const p = entry.record;
                if (p.isRuleNode) {
                    if (!entry.rotation) return;
                    const { resetPityCount, resetErrors } = entry.rotation;
                    if (resetPityCount > 0) {
                        const bottomTierId = currentTiers[currentTiers.length - 1]?.id || 'tier_B';
                        const row = buildRowElement({ tierId: bottomTierId }, resetPityCount, false, formatValidation(resetErrors));
                        // 换期结算的垫抽保留原有标签，也显示已检测到的违规原因。
                        row.querySelector('.char-bar > span').textContent = resetPityCount + ' ' + getTrans('cd_rotation_reset_tag');
                        renderedElements.unshift(row);
                    }
                    const divider = document.createElement('div');
                    divider.className = 'pool-rotation-divider';
                    divider.innerHTML = `<div class="rotation-badge-capsule"><span>🔄</span><span>${getTrans('cd_rotation_new_period')}</span></div>`;
                    renderedElements.unshift(divider);
                    return;
                }

                totalPulls++;
                const matchedTier = currentTiers.find(t => t.id === entry.tierId) ||
                    currentTiers.find(t => t.name === String(p.star)) || currentTiers[currentTiers.length - 1];
                if (matchedTier) tierCounts[matchedTier.id] = (tierCounts[matchedTier.id] || 0) + 1;

                if (entry.isFree) {
                    freeCount++;
                    const nextEntry = validationReport.entries[index + 1];
                    // 换期或切回普通抽前先结算赠送段，避免赠送抽条丢失。
                    if (entry.isGold || !nextEntry || !nextEntry.isFree || nextEntry.record.isRuleNode) {
                        renderedElements.unshift(buildRowElement(p, freeCount, true, formatValidation(entry.errors)));
                        freeCount = 0;
                    }
                } else if (entry.isGold || entry.isSpark) {
                    renderedElements.unshift(buildRowElement(p, entry.count, false, formatValidation(entry.errors)));
                }
            });

            // 末尾垫抽同样使用检测结果，包含恰好达到硬保底仍未出金的情况。
            if (validationReport.tail.count > 0 && currentTiers.length > 0) {
                const bottomTierId = currentTiers[currentTiers.length - 1].id;
                renderedElements.unshift(buildRowElement(
                    { tierId: bottomTierId }, validationReport.tail.count, false,
                    formatValidation(validationReport.tail.errors)
                ));
            }

            const recordedPulls=totalPulls;
            const recordedGold=goldCount;
            const combined=UserDataProfiles.statistics(accountSnapshot.row,currentPool,{total:totalPulls,gold:goldCount,up:winCount,lost:lostCount},currentGameId);
            totalPulls=combined.total;goldCount=combined.gold;winCount=combined.up;lostCount=combined.lost;

            // 挂载至页面 DOM
            renderedElements.forEach(el => {
                if (el.dataset.goldOrdinal) window.GoldOrdinal?.decorate(el, Number(el.dataset.goldOrdinal) + combined.gold - recordedGold);
                wrap.appendChild(el);
            });
            window.GoldOrdinal?.refresh();
            if(accountSnapshot.row){
                const start=UserDataProfiles.initial(accountSnapshot.row,currentPool,GameData.describePool(rules,globalTiers).minorPities.length);
                const historySummary=UserDataProfiles.summary(accountSnapshot.row,currentPool);
                const block=document.createElement('div');block.className='dashboard-initial-progress';
                const fields=SimulatorStart.fields(UserDataProfiles.context(currentGameId,currentPool),start);
                block.textContent=(combined.hasHistory?accountText(`初始历史已计入统计：${combined.initialPulls} 抽 · ${historySummary.gold} 金 · UP ${historySummary.up} · 常驻／歪 ${historySummary.gold-historySummary.up}。规则起点：`,`Initial history included: ${combined.initialPulls} pulls · ${historySummary.gold} gold · UP ${historySummary.up} · Standard/off-rate ${historySummary.gold-historySummary.up}. Rule baseline: `):accountText(`初始 ${combined.initialPulls} 抽已计入总抽数；历史出金未填写，出金相关统计仅依据录入记录。规则起点：`,`Initial ${combined.initialPulls} pulls included in total; historical gold is unknown, so gold statistics cover individual records only. Rule baseline: `))+fields.map(field=>(sysLang==='en'?field.en:field.zh)+' '+field.value).join(' · ');
                const errors=UserDataProfiles.summaryErrors(currentGameId,accountSnapshot.row,currentPool);
                if(errors.length){block.style.color='var(--danger)';block.textContent=accountText('初始历史汇总不符合规则，未计入出金统计。请在玩家数据页修正：','Invalid initial summary excluded from gold statistics. Correct it in Player data: ')+errors.map(error=>error.split(' / ')[sysLang==='en'?1:0]||error).join(' ')+' '+block.textContent;}
                const hasInitialData=combined.initialPulls!==0||fields.some(field=>Number(field.value)!==(field.min||0))||Number(historySummary?.gold||0)!==0||Number(historySummary?.up||0)!==0;
                if(hasInitialData||errors.length)wrap.append(block);
            }


            // ==========================================
            // 🌟 顶部 4 个统计格子指标更新
            // ==========================================
            // 1. 总抽数
            document.getElementById('res-total').innerText = totalPulls;

            // 2. 总出金与出金率
            document.getElementById('res-gold-count').innerText = goldCount;
            const statsPulls=combined.hasHistory?totalPulls:recordedPulls;
            const partialHistory=!combined.hasHistory&&combined.initialPulls>0;
            document.getElementById('res-gold-count').title=partialHistory?accountText('仅已录入记录的出金数；初始历史出金数尚未填写。','Gold from individual records only; initial gold count has not been provided.'):'';
            let goldRatePercent = statsPulls > 0 ? ((goldCount / statsPulls) * 100).toFixed(2) : "0.00";
            document.getElementById('res-gold-rate').innerText = getTrans('cd_gold_rate').replace('{rate}', goldRatePercent)+(partialHistory?accountText('（仅录入）',' (recorded only)'):'');

            // 3. 不歪率与详情
            let winRatePercent = goldCount > 0 ? Math.round((winCount / goldCount) * 100) : 0;
            document.getElementById('res-rate').innerText = `${winRatePercent}%`;
            document.getElementById('res-win-detail').innerText = getTrans('cd_win_detail').replace('{win}', winCount).replace('{lost}', lostCount);

            // 4. 平均出金与欧气评语
            let avgVal = goldCount ? (statsPulls / goldCount).toFixed(1) : '0.0';
            document.getElementById('res-avg').title=partialHistory?accountText('仅依据已录入记录计算；填写历史出金后合并统计。','Based on individual records only; provide historical gold counts to combine statistics.'):'';
            document.getElementById('res-avg').innerText = avgVal;
            let ratingEl = document.getElementById('res-luck-rating');
            if (ratingEl) {
                if (goldCount === 0) {
                    ratingEl.innerText = getTrans('cd_luck_no_gold');
                } else {
                    let avgNum = parseFloat(avgVal);
                    if (avgNum <= 35) ratingEl.innerText = getTrans('cd_luck_excellent');
                    else if (avgNum <= 62) ratingEl.innerText = getTrans('cd_luck_good');
                    else if (avgNum <= 75) ratingEl.innerText = getTrans('cd_luck_normal');
                    else ratingEl.innerText = getTrans('cd_luck_bad');
                }
            }

            // ==========================================
            // 🌟 星级出货分布条动态渲染 (完全根据当前游戏/DB的实际星级匹配)
            // ==========================================
            const labelsContainer = document.getElementById('dist-tier-labels');
            const barsContainer = document.getElementById('dist-tier-bars');

            if (labelsContainer && barsContainer) {
                let labelsHtml = combined.hasHistory?'<span>'+accountText('逐抽录入记录：','Individual records: ')+'</span>':'';
                let barsHtml = '';

                currentTiers.forEach(tier => {
                    const count = tierCounts[tier.id] || 0;
                    const pct = recordedPulls > 0 ? ((count / recordedPulls) * 100).toFixed(1) : "0.0";
                    // 动态读取当前语言下的星级名称 (例如 "5-tier"、"5★"、"S-Rank" 等)
                    const displayName = getTierDisplayName(tier);
                    const color = tier.color || '#888';

                    labelsHtml += `<span style="${ColorStyle.text(tier)}">● ${displayName}: ${count} (${pct}%)</span>`;
                    barsHtml += `<div style="width: ${pct}%; background: ${ColorStyle.background(tier)}; transition: width 0.3s ease;" title="${displayName}: ${pct}%"></div>`;
                });

                labelsContainer.title=combined.hasHistory?accountText('星级分布仅统计逐抽录入记录，不包含初始历史汇总。','Rarity distribution covers individual records only, excluding historical summaries.'):'';
                labelsContainer.innerHTML = labelsHtml;
                barsContainer.innerHTML = barsHtml;
            }
        }

        // ==========================================
        // 🌟 数据导出功能 (左下角按钮唤起)
        // ==========================================
        window.exportGachaData = function() {
            const data = readDashboardRecords();

            if (!data || data.length === 0) {
                alert(getTrans('cd_export_empty'));
                return;
            }

            const exportObj = {
                gameId: currentGameId,
                poolId: currentPool,
                accountId: dashboardAccountId,
                exportTime: new Date().toISOString(),
                totalPulls: data.filter(d => !d.isRuleNode).length,
                records: data
            };

            // 抽卡记录的结构由看板组装，JSON 文件生成与下载统一交给公共模块。
            ImportExport.exportJSON(exportObj, `GachaExport_${currentGameId}_${currentPool}_${new Date().toISOString().slice(0, 10)}.json`);

            if (typeof showToast === 'function') {
                showToast(getTrans('cd_export_success'), "success");
            }
        };

        // ==========================================
        // 录入中心弹窗控制 (十连新行独立 / 单抽行末流式)
        // ==========================================
function openModal() {
    // 每次打开录入弹窗时，默认恢复为非删除模式
    window.isDeleteMode = false;
    document.body.classList.remove('is-delete-mode');
    const btn = document.getElementById('btn-toggle-delete-mode');
    if (btn) {
        btn.classList.remove('active');
        btn.innerHTML = getTrans('cd_delete_mode');
    }

    document.getElementById('modalOverlay').style.display = 'flex';
    const body = document.getElementById('edit-body');
    body.innerHTML = '';

    let saved;
    try{
        dashboardInputSnapshot=DashboardAccounts.read(currentGameId,currentPool,dashboardAccountId);
        saved=dashboardInputSnapshot.records;
    }catch(error){document.getElementById('modalOverlay').style.display='none';accountError(error);return;}
    if (saved.length > 0) {
        restoreEditRows(saved);
    } else {
        // 全新卡池默认添加一组十连
        handleBtnAddTen();
    }

    // 🌟 核心修复：无论是有历史数据还是空白新池，弹窗打开时均统一渲染更新卡池规则按钮
    renderTailRuleUpdateBox();
}

        function restoreEditRows(data) {
    const body = document.getElementById('edit-body');
    if (!body) return;
    body.innerHTML = '';
    let currentRowChunk = [];

    data.forEach((item) => {
        // 🌟 核心拦截：如果是换期规则节点，先结算前面攒着的十连，然后单独还原规则节点框！
        if (item && item.isRuleNode) {
            if (currentRowChunk.length > 0) {
                buildRowFromChunk(currentRowChunk);
                currentRowChunk = [];
            }
            restoreRuleNodeItem(item.config || {});
            return;
        }

        if ((item.isRowStart && currentRowChunk.length > 0) || currentRowChunk.length >= 10) {
            buildRowFromChunk(currentRowChunk);
            currentRowChunk = [];
        }
        currentRowChunk.push(item);
    });

    if (currentRowChunk.length > 0) {
        buildRowFromChunk(currentRowChunk);
    }

    setTimeout(updateEditRowIndexes, 50);
    renderTailRuleUpdateBox();
}

// 专门用于历史恢复换期规则节点的辅助函数
function restoreRuleNodeItem(nodeConfig) {
    const body = document.getElementById('edit-body');
    const insertedNode = document.createElement('div');
    insertedNode.className = 'edit-row-container rule-node-item';
    insertedNode.dataset.isRuleNode = 'true';
    insertedNode.dataset.nodeConfig = JSON.stringify(nodeConfig);
    insertedNode.style = "display:flex; align-items:center; justify-content:space-between; margin-bottom:12px; background:rgba(26,188,156,0.12); padding:10px 14px; border-radius:8px; border:1px solid #1abc9c;";
    
    insertedNode.innerHTML = `
        <div style="display:flex; align-items:center; gap:10px;">
            <span class="rule-update-tag-badge">${getTrans('cd_rotation_node')}</span>
            <span style="font-size:12px; color:#ddd;">${getTrans('cd_rotation_node_desc')}</span>
        </div>
        <div style="display:flex; align-items:center; gap:8px;">
            <button class="btn btn-action-gray rule-node-delete-btn" style="padding:2px 6px; font-size:11px; color:#ff4757;" onclick="pushDeleteSnapshot(); this.closest('.rule-node-item').remove(); updateEditRowIndexes();">✕</button>
        </div>
    `;
    body.appendChild(insertedNode);
}

// 弹窗控制
let activeRuleNodeEl = null;

window.openRuleUpdateModal = function(existingNodeEl = null) {
    activeRuleNodeEl = existingNodeEl;
    const modal = document.getElementById('ruleUpdateModalOverlay');
    if (modal) modal.style.display = 'flex';
};

window.closeRuleUpdateModal = function() {
    const modal = document.getElementById('ruleUpdateModalOverlay');
    if (modal) modal.style.display = 'none';
    activeRuleNodeEl = null;
};

        function buildRowFromChunk(chunk) {
            const isFree = chunk.length > 0 ? (!!chunk[0].isFree||['free_pity','free_nopity'].includes(chunk[0].pullType)) : false;
            const row = createEditRowContainer(isFree);
            const group = row.querySelector('.boxes-group');
            group.innerHTML = '';

            chunk.forEach(item => {
                let tId = item.tierId;
                if (!tId && item.star !== undefined) {
                    let match = currentTiers.find(t => t.name === item.star.toString());
                    if (match) tId = match.id;
                }
                const b = createBox(tId, item.short || item.name);
                if (item.itemId) applyImageToBox(b, item);
                b.dataset.recordMeta=JSON.stringify(item);
                if(item.autoRandom)b.dataset.autoRandom='true';
                if (item.isLost === true||item.isUP===false) b.dataset.isLost = 'true';
                else if (item.isLost === false) b.dataset.isLost = 'false';
                group.appendChild(b);
            });

            // 如果该行未满 10 抽，追加 + 号按钮
            syncRowPlusButton(row);
        }

        // 创建行外壳 (包含序号与抽数区间指示)
        // 创建行外壳 (包含序号与抽数区间指示)
function createEditRowContainer(isFree = false) {
    const body = document.getElementById('edit-body');
    const row = document.createElement('div');
    row.className = 'edit-row-container';
    row.dataset.isFree = isFree ? 'true' : 'false';
    row.style = "display:flex; align-items:center; margin-bottom:12px; gap:10px; background: rgba(0,0,0,0.2); padding: 8px 12px; border-radius: 8px; border: 1px solid var(--border);";

    // 方块集合
    const group = document.createElement('div');
    group.className = 'boxes-group';
    group.style = "display:flex; gap:6px; flex-wrap:wrap; align-items:center;";
    row.appendChild(group);

    // 右侧控制区 (白送勾选 + 区间提示 + 垃圾桶)
    const controlsWrap = document.createElement('div');
    controlsWrap.style = "margin-left: auto; display: flex; align-items: center; gap: 10px;";

    // 免计保底切换
    const freeLabel = document.createElement('label');
    freeLabel.style = "display:flex; align-items:center; gap:5px; font-size:12px; color:#aaa; cursor:pointer;";
    freeLabel.innerHTML = `<input type="checkbox" ${isFree ? 'checked' : ''} onchange="toggleRowFree(this)"> ${getTrans('cd_free_pull')}`;
    controlsWrap.appendChild(freeLabel);

    // 抽数区间标签
    const rangeLabel = document.createElement('div');
    rangeLabel.className = 'row-range-label';
    rangeLabel.style = "font-size:12px; color:#888; font-weight:bold; white-space:nowrap;";
    controlsWrap.appendChild(rangeLabel);

// 删除行 (增加 .row-delete-btn 受删除模式控制显隐，且行内绑定确保撤回不失效)
    const del = document.createElement('div');
    del.className = 'row-delete-btn';
    del.innerHTML = '🗑️';
    del.style = "cursor:pointer; opacity:0.75; transition:0.2s; font-size:14px; user-select:none;";
    del.title = getTrans('cd_delete_row');
    del.setAttribute('onclick', 'handleDeleteWholeRow(this)');
    del.onmouseover = () => del.style.opacity = '1';
    del.onmouseout = () => del.style.opacity = '0.75';
    controlsWrap.appendChild(del);

    // 🌟 必须将控制条挂载到行上，并把行添加到主体 DOM 中，最后务必 return row！
    row.appendChild(controlsWrap);
    body.appendChild(row);
    return row;
}

        function toggleRowFree(cbEl) {
            const row = cbEl.closest('.edit-row-container');
            if (row) {
                row.dataset.isFree = cbEl.checked ? 'true' : 'false';
                updateEditRowIndexes();
            }
        }

        function syncRowPlusButton(row) {
    let addBtn = row.querySelector('.box-add-more');
    const group = row.querySelector('.boxes-group');
    if (!group) return;

    // 🌟 核心修复：只统计真实抽卡方块数量（排除加号按钮自身）
    const boxCount = group.querySelectorAll('.box').length;

    if (boxCount < 10) {
        if (!addBtn) {
            addBtn = document.createElement('div');
            addBtn.className = 'box-add-more';
            addBtn.innerText = '+';
            addBtn.style = "width:38px; height:38px; border:2px dashed #666; color:#888; border-radius:6px; display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:20px; user-select:none; transition:0.2s;";
            addBtn.onmouseover = () => { addBtn.style.borderColor = "var(--primary)"; addBtn.style.color = "#fff"; };
            addBtn.onmouseout = () => { addBtn.style.borderColor = "#666"; addBtn.style.color = "#888"; };
            
            // 点击添加单抽
            addBtn.onclick = (e) => {
                e.stopPropagation();
                // 在加号前面插入新方块
                const newB = createBox();
                group.insertBefore(newB, addBtn);
                
                // 再次同步加号状态（若已达 10 个会自动移除加号）
                syncRowPlusButton(row);
                updateEditRowIndexes();
            };
            group.appendChild(addBtn);
        } else {
            // 确保加号按钮始终挂在最后
            group.appendChild(addBtn);
        }
    } else if (addBtn) {
        // 满 10 个方块时，移除加号按钮
        addBtn.remove();
    }
}

        // 严格十连：无论当前末行是否满 10，直接开新框抽十次
        window.handleBtnAddTen = function() {
    const row = createEditRowContainer(false);
    const group = row.querySelector('.boxes-group');
    for (let i = 0; i < 10; i++) {
        group.appendChild(createBox());
    }
    syncRowPlusButton(row);
    updateEditRowIndexes();

    const body = document.getElementById('edit-body');
    body.scrollTop = body.scrollHeight;

    // 仅在开启轮替时渲染末尾框
    if (isRotationAllowed()) {
        renderTailRuleUpdateBox();
    }
};

        // 严格单抽：沿着未满 10 的当前行末尾追加，满 10 才开新行
        window.handleBtnAddSingle = function() {
            const rows = document.querySelectorAll('#edit-body .edit-row-container');
            let targetRow = rows[rows.length - 1];

            if (!targetRow || targetRow.querySelectorAll('.boxes-group .box').length >= 10) {
                targetRow = createEditRowContainer(false);
            }

            const group = targetRow.querySelector('.boxes-group');
            const addBtn = targetRow.querySelector('.box-add-more');
            const newBox = createBox();

            if (addBtn) group.insertBefore(newBox, addBtn);
            else group.appendChild(newBox);

            syncRowPlusButton(targetRow);
            updateEditRowIndexes();

            const body = document.getElementById('edit-body');
            body.scrollTop = body.scrollHeight;

            renderTailRuleUpdateBox();
        };

        // 更新各排区间序号指示器与总抽数
        function updateEditRowIndexes() {
    const rows = document.querySelectorAll('#edit-body .edit-row-container');
    const initialRow=dashboardAccountRows.find(row=>row.id===dashboardAccountId);
    let currentPullNum = 1+(initialRow?UserDataProfiles.initial(initialRow,currentPool).total:0);
    let totalPullCounter = 0;

    rows.forEach((row) => {
        // 🌟 1. 空节点防御与规则节点跳过
        if (!row || row.dataset.isRuleNode === 'true' || row.classList.contains('rule-node-item')) {
            return;
        }

        const boxesGroup = row.querySelector('.boxes-group');
        if (!boxesGroup) return; // 容错防御

        const boxes = boxesGroup.querySelectorAll('.box');
        const boxCount = boxes.length;
        totalPullCounter += boxCount;

        const rangeLabel = row.querySelector('.row-range-label');
        if (!rangeLabel) return;

        if (boxCount === 0) {
            rangeLabel.innerText = getTrans('cd_empty_row');
            return;
        }

        if (row.dataset.isFree === 'true') {
            rangeLabel.innerText = getTrans('cd_free_row').replace('{count}', boxCount);
            rangeLabel.style.color = "#2ecc71";
        } else {
            let startNum = currentPullNum;
            let endNum = currentPullNum + boxCount - 1;
            rangeLabel.innerText = startNum === endNum 
                ? getTrans('cd_pull_single_range').replace('{start}', startNum)
                : getTrans('cd_pull_range').replace('{start}', startNum).replace('{end}', endNum);
            rangeLabel.style.color = "#888";
            currentPullNum += boxCount;
        }
    });

    const footerCountEl = document.getElementById('modal-footer-pull-count');
    if (footerCountEl) footerCountEl.innerText = getTrans('cd_input_count').replace('{count}', totalPullCounter);
}

        // 快捷抽数定位导航
        window.scrollToPullNumber = function(targetPull) {
            targetPull = parseInt(targetPull);
            if (!targetPull || isNaN(targetPull) || targetPull <= 0) return;

            const rows = document.querySelectorAll('#edit-body .edit-row-container');
            let runningCount = 0;
            let matchedRow = null;

            for (let row of rows) {
                if (row.dataset.isFree === 'true') continue;
                const count = row.querySelectorAll('.boxes-group .box').length;
                if (targetPull >= runningCount + 1 && targetPull <= runningCount + count) {
                    matchedRow = row;
                    break;
                }
                runningCount += count;
            }

            if (matchedRow) {
                if (!window.ContentColumns?.reveal(matchedRow)) matchedRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
                matchedRow.classList.add('highlight-flash');
                setTimeout(() => matchedRow.classList.remove('highlight-flash'), 1600);
            } else {
                alert(getTrans('cd_jump_not_found').replace('{pull}', targetPull));
            }
        };

        // 方块构建器 (已修复：自动随机模式下创建方块时同步自动随机并贴图)
        function createBox(tierId = null, short = "") {
    const bottomTier = currentTiers.length > 0 ? currentTiers[currentTiers.length - 1] : { id: 'tier_B', name: 'B级', en: 'B-Rank', color: '#3498db' };
    if (!tierId) tierId = bottomTier.id;

    const b = document.createElement('div');
    b.className = 'box';
    b.style = "width:38px; height:38px; border-radius:6px; position:relative; overflow:hidden; display:flex; align-items:center; justify-content:center; cursor:pointer; font-weight:bold; font-size:12px; user-select:none; transition:0.15s;";

    let tierIndex = currentTiers.findIndex(t => t.id === tierId);
    if (tierIndex === -1) tierIndex = currentTiers.length - 1;
    let currentTier = currentTiers[tierIndex] || bottomTier;

    function renderStyle(tier) {
        b.dataset.tierId = tier.id;
        // 🌟 存储国际化显示名称
        const displayTierName = getTierDisplayName(tier);
        b.dataset.tierName = displayTierName;
        b.style.background = window.ColorStyle?.background(tier) || tier.color;

        const isGold = selectedGoldIds.includes(tier.id);
        if (isGold) {
            b.classList.add('s5');
            b.style.boxShadow = `0 0 10px ${tier.color}90`;
            b.style.color = '#fff';
            b.style.border = '2px solid #fff';
        } else {
            b.classList.remove('s5');
            b.style.boxShadow = 'none';
            b.style.color = 'rgba(255,255,255,0.9)';
            b.style.border = '2px solid transparent';
        }
    }

    renderStyle(currentTier);

    const nonGoldMode = localStorage.getItem('GM_Non_Gold_Input_Mode') || 'allow_manual_no_up';

    if (short) {
        b.dataset.short = short;
        applyImageToBox(b, short);
    } else if (nonGoldMode === 'auto_random' && !selectedGoldIds.includes(currentTier.id)) {
        const randName = getRandomPoolItem(currentTier.id);
        if (randName) {
            b.dataset.short = randName;
            applyImageToBox(b, randName);
            b.dataset.autoRandom='true';
        } else {
            b.innerText = getTierDisplayName(currentTier);
        }
    } else {
        b.innerText = getTierDisplayName(currentTier);
    }

    b.onclick = (e) => {
        if (window.isDeleteMode) {
            e.stopPropagation();
            handleDeleteSingleBox(b);
            return;
        }

        tierIndex = (tierIndex - 1 + currentTiers.length) % currentTiers.length;
        let nextTier = currentTiers[tierIndex];

        const isGold = selectedGoldIds.includes(nextTier.id);
        renderStyle(nextTier);

        const currentMode = localStorage.getItem('GM_Non_Gold_Input_Mode') || 'allow_manual_no_up';

        if (isGold || currentMode.startsWith('allow_manual')) {
            resetBoxContent(b, nextTier);
            openCharPicker(e, b, nextTier);
        } else if (currentMode === 'auto_random') {
            const randName = getRandomPoolItem(nextTier.id);
            if (randName) {
                b.dataset.short = randName;
                applyImageToBox(b, randName);
                b.dataset.autoRandom='true';
            } else {
                resetBoxContent(b, nextTier);
            }
        } else {
            resetBoxContent(b, nextTier);
        }
    };

    return b;
}

function resetBoxContent(box, tier) {
    delete box.dataset.autoRandom;
    delete box.dataset.short;
    delete box.dataset.itemId;
    delete box.dataset.isLost;
    box.innerHTML = getTierDisplayName(tier);
}

function applyImageToBox(box, name) {
    delete box.dataset.autoRandom;
    let info = findInCatalog(name);
    delete box.dataset.itemId;
    if (info) box.dataset.itemId = CatalogUtils.getIdentity(info);
    else if (typeof name === 'object' && name.itemId) box.dataset.itemId = name.itemId;
    // 🌟 获取该星级的当前语言名称
    let tierObj = currentTiers.find(t => t.id === box.dataset.tierId);
    let currentTierName = getTierDisplayName(tierObj);
    let imgUrl = info ? info.img : "";
    // 🌟 获取当前语言的简称
    let displayName = info ? getItemShort(info) : (typeof name === 'object' ? name.short || name.name || '' : name);

    let imgHtml = imgUrl ? `<img src="${imgUrl}" style="position:absolute; top:0; left:0; width:100%; height:100%; object-fit:cover; opacity:0.85; z-index:0;">` : '';

    box.innerHTML = `
        ${imgHtml}
        <div style="position:absolute; bottom:0; left:0; width:100%; height:50%; background:linear-gradient(to top, rgba(0,0,0,0.85), transparent); z-index:1;"></div>
        <div style="position:relative; z-index:2; text-shadow:1px 1px 2px #000; color:#fff; font-weight:bold; line-height:1;">${currentTierName}</div>
        <div style="position:relative; z-index:2; text-shadow:1px 1px 2px #000; color:#fff; font-size:10px; margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:90%;">${displayName}</div>
    `;
}

        function getRandomPoolItem(tierId) {
            const list = getItemsByCategories(['char', 'wep']).filter(i => i.tierId === tierId);
            if (list.length > 0) return list[Math.floor(Math.random() * list.length)].name;
            return "";
        }

        // ==========================================
        // 🌟 选角浮层构建：低星默认全量平铺，省去点击
        // ==========================================
function openCharPicker(e, box, tierObj) {
    e.stopPropagation();
    currentEditingBox = box;
    const picker = document.getElementById('charPicker');
    const targetTierId = tierObj.id;
    const isTargetGold = selectedGoldIds.includes(targetTierId);

    const nonGoldMode = localStorage.getItem('GM_Non_Gold_Input_Mode') || 'allow_manual_no_up';
    const assembly = rules.assembly?.tierRules?.[targetTierId] || {};

    let currentLossMode = isTargetGold 
        ? 'win' 
        : (nonGoldMode === 'allow_manual_with_up' ? 'lost' : 'all_flat');

    function renderPickerContent() {
        let candidateList = [];

        if (currentLossMode === 'win') {
            const upCats = assembly.upCats || (targetTierId === 'tier_S' ? ['char'] : ['char', 'wep']);
            const upTags = assembly.upTags || ['up', 'custom_offrate'];

            candidateList = getItemsByCategories(upCats).filter(i => 
                i.tierId === targetTierId && CatalogUtils.hasAnyTag(i, upTags)
            );

            if (candidateList.length === 0 && roster[currentPool]) {
                candidateList = roster[currentPool].filter(i => (i.tierId === targetTierId || ('tier_' + i.star) === targetTierId));
            }
        } else if (currentLossMode === 'lost') {
            const offCats = assembly.offrateCats || ['char', 'wep'];
            const offTags = assembly.offrateTags || ['std', 'custom_offrate', 'normal'];

            candidateList = getItemsByCategories(offCats).filter(i => 
                i.tierId === targetTierId && CatalogUtils.hasAnyTag(i, offTags)
            );
        } else {
            const allCats = assembly.cats || [...new Set([...(assembly.upCats || []), ...(assembly.offrateCats || []), ...(assembly.flatCats || ['char', 'wep'])])];
            const allTags = [...new Set([...(assembly.upTags || []), ...(assembly.offrateTags || []), ...(assembly.tags || ['normal', 'std', 'custom_offrate'])])];

            candidateList = getItemsByCategories(allCats).filter(i => 
                i.tierId === targetTierId && CatalogUtils.hasAnyTag(i, allTags)
            );
        }

        candidateList = CatalogUtils.uniqueBy(candidateList, item => CatalogUtils.getIdentity(item) || item.name);

        // 🌟 核心：生成卡片时展示对应语言的名字和简称，并严格锁定单项宽度，超长截断省略号
        const itemsHtml = candidateList.map(item => {
            let shortName = getItemShort(item);
            let fullName = getItemName(item);
            let imgHtml = item.img 
                ? `<img src="${item.img}" style="width:34px; height:34px; border-radius:4px; object-fit:cover; margin-bottom:4px; border:1px solid #555;">` 
                : `<div style="width:34px; height:34px; border-radius:4px; background:#333; color:#fff; font-size:11px; display:flex; align-items:center; justify-content:center; margin-bottom:4px; border:1px solid #555;">${shortName}</div>`;

            return `
                <div class="picker-item-card" onclick="selectItem('${CatalogUtils.getIdentity(item) || item.name}', ${currentLossMode === 'lost'})" 
                     style="display:flex; flex-direction:column; align-items:center; justify-content:center; padding:6px 2px; background:#2a2e38; border-radius:6px; cursor:pointer; transition:0.2s; min-width:0; width:100%; box-sizing:border-box; overflow:hidden;" 
                     onmouseover="this.style.background='#373d4b'" onmouseout="this.style.background='#2a2e38'">
                    ${imgHtml}
                    <div style="font-size:11px; color:#eee; text-align:center; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; width:100%; display:block; padding:0 2px; box-sizing:border-box;" title="${fullName}">${fullName}</div>
                </div>
            `;
        }).join('') || `<div style="grid-column: 1 / -1; text-align:center; color:#777; font-size:12px; padding:20px 0;">${getTrans('cd_picker_empty')}</div>`;

        let toggleBarHtml = '';
        if (isTargetGold || nonGoldMode === 'allow_manual_with_up') {
            toggleBarHtml = `
            <div style="display:flex; align-items:center; gap:15px; margin-bottom:12px; background:rgba(0,0,0,0.3); padding:8px 12px; border-radius:6px; font-size:12px;">
                <label style="cursor:pointer; display:flex; align-items:center; gap:4px; color:${currentLossMode==='win' ? '#2ecc71' : '#aaa'}; font-weight:${currentLossMode==='win' ? 'bold' : 'normal'};">
                    <input type="radio" name="picker_loss" value="win" ${currentLossMode==='win' ? 'checked' : ''} onchange="onLossModeChanged('win')">
                    <span>${getTrans('cd_picker_hit_up')}</span>
                </label>
                <label style="cursor:pointer; display:flex; align-items:center; gap:4px; color:${currentLossMode==='lost' ? '#ff4757' : '#aaa'}; font-weight:${currentLossMode==='lost' ? 'bold' : 'normal'};">
                    <input type="radio" name="picker_loss" value="lost" ${currentLossMode==='lost' ? 'checked' : ''} onchange="onLossModeChanged('lost')">
                    <span>${getTrans('cd_picker_off_rate')}</span>
                </label>
            </div>`;
        }

        // 🌟 核心：弹窗标题动态替换当前语言的星级名称（如 Select a S-Rank item）
        const tierTitleText = getTierDisplayName(tierObj);

        picker.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; border-bottom:1px dashed #444; padding-bottom:6px;">
                <span style="font-size:13px; font-weight:bold; color:var(--gold);">${getTrans('cd_picker_title').replace('{tier}', tierTitleText)}</span>
                <button onclick="document.getElementById('charPicker').style.display='none'" style="background:none; border:none; color:#ff4757; cursor:pointer; font-size:14px;">✕</button>
            </div>

            ${toggleBarHtml}

            <!-- 候选展示区 -->
            <div style="display:grid; grid-template-columns:repeat(4, minmax(0, 1fr)); gap:6px; max-height:260px; overflow-y:auto; overflow-x:hidden; padding-right:4px; width:100%; box-sizing:border-box;">
               ${itemsHtml}
            </div>
        `;
    }

    window.onLossModeChanged = function(mode) {
        currentLossMode = mode;
        renderPickerContent();
    };

    window.selectItem = function(name, isLost) {
        if (currentEditingBox) {
            currentEditingBox.dataset.short = findInCatalog(name)?.name || name;
            currentEditingBox.dataset.isLost = isLost ? 'true' : 'false';
            applyImageToBox(currentEditingBox, name);
        }
        picker.style.display = 'none';
    };

    renderPickerContent();
    picker.style.display = 'block';

    let x = e.clientX, y = e.clientY + 15;
    setTimeout(() => {
        let pHeight = picker.offsetHeight || 300;
        let pWidth = picker.offsetWidth || 380;
        if (y + pHeight > window.innerHeight) y = e.clientY - pHeight - 15;
        if (y < 10) y = 10;
        if (x + pWidth > window.innerWidth) x = window.innerWidth - pWidth - 15;
        if (x < 10) x = 10;
        picker.style.left = x + 'px';
        picker.style.top = y + 'px';
    }, 0);
}

        // 保存录入并触发同步
        window.closeModal = async function() {
            const rows = document.querySelectorAll('#edit-body .edit-row-container');
            const dataToSave = [];

            rows.forEach(row => {
                if (row.dataset.isRuleNode === 'true') {
                    dataToSave.push({
                        isRuleNode: true,
                        config: JSON.parse(row.dataset.nodeConfig || '{}')
                    });
                    return;
                }
                const isFree = row.dataset.isFree === 'true';
                const boxes = row.querySelectorAll('.boxes-group .box');
                boxes.forEach((box, index) => {
                    const original=JSON.parse(box.dataset.recordMeta||'{}');
                    const wasFree=!!original.isFree||['free_pity','free_nopity'].includes(original.pullType);
                    if(wasFree!==isFree){delete original.pullType;delete original.countPity;}
                    dataToSave.push({
                        ...original,
                        itemId: box.dataset.itemId || undefined,
                        tierId: box.dataset.tierId,
                        tierName: box.dataset.tierName,
                        star: parseInt(box.dataset.tierName) || 0,
                        short: box.dataset.short || "",
                        name: box.dataset.short || "",
                        isRowStart: index === 0,
                        isFree: isFree,
                        isLost: box.dataset.isLost === 'true',
                        autoRandom:box.dataset.autoRandom==='true',
                        ...(typeof original.isUP==='boolean'?{isUP:box.dataset.isLost!=='true'}:{})
                    });
                });
            });

            try{
                if(!dashboardInputSnapshot)throw Error('conflict');
                const context=UserDataProfiles.context(currentGameId,currentPool);
                const result=DashboardAccounts.save(currentGameId,currentPool,dashboardAccountId,dataToSave,dashboardInputSnapshot,{
                    rules,activeTiers:currentTiers,targetGoldIds:selectedGoldIds,catalog:pureCatalog,minorPities:context.minorPities,
                    isStdPool:currentPool.includes('std')||currentPool==='mixed_std',allowRotation:isRotationAllowed()
                },inputSyncEnabled(),{includeExisting:localStorage.getItem('GM_Dashboard_Sync_Existing')==='true'});
                if(result.blocked)showToast(accountText('抽卡记录已保存，但含非法数据；本次未同步，玩家数据保持原样。请修正红色异常记录后重新保存。','Pull records saved, but invalid data blocked synchronization. Player data is unchanged. Correct the red errors and save again.'),'danger');
                else showToast(result.synced?accountText('记录已保存，已同步玩家进度与明确物品持有。','Records saved and player progress and named copies updated.'):accountText('账号抽卡记录已保存，玩家数据未修改。','Account history saved. Player data unchanged.'),'success');
            }catch(error){accountError(error);return false;}


            document.getElementById('modalOverlay').style.display = 'none';
            renderDashboard();
            dashboardChangeTracker.reset();
            return true;
        };

        // ==========================================
// 🌟 3. 弹窗动态渲染：只展示卡池当前开启了的规则项（与图二/图三对齐）
// ==========================================
window.openRuleUpdateModal = function() {
    const container = document.getElementById('rule-update-dynamic-items');
    if (!container) return;

    // 读取卡池规则中卡片 13 的配置（及各机制原本是否开启）
    const matrix = window.rules?.lifecycle?.rotationMatrix || {};
    
    // 检查各机制在 pool 中是否开启（与图二机制显隐逻辑一致）
    const hasGuarantee = window.rules?.pities?.some(p => p.useGuarantee) || (window.rules?.pity?.useGuarantee !== false);
    const hasRescue    = !!(window.rules?.secondaryRescue?.enabled);
    const hasEarly     = !!(window.rules?.earlyUpRules?.length);
    const hasCatSeq    = !!(window.rules?.goldCategorySequence?.length);
    const hasSpark     = !!(window.rules?.sparkRules?.length);
    const hasGift      = !!(window.rules?.giftRules?.length);

    let html = '';

    // 1. 保留常规垫抽（通用基础）
    const inheritPity = matrix.inheritPityPulls !== false;
    html += `
        <div style="display:flex; align-items:center; justify-content:space-between; padding:4px 0; border-bottom:1px solid rgba(255,255,255,0.05);">
                <span>${getTrans('cd_rotation_pity')}</span>
            <span style="font-weight:bold; color:${inheritPity ? '#2ecc71' : '#ff4757'};">
                ${inheritPity ? getTrans('cd_rotation_inherit') : getTrans('cd_rotation_reset')}
            </span>
        </div>
    `;

    // 2. 大保底 / 连歪状态（如果有大保底机制）
    if (hasGuarantee) {
        const inheritGuarantee = matrix.inheritGuaranteeState !== false;
        html += `
            <div style="display:flex; align-items:center; justify-content:space-between; padding:4px 0; border-bottom:1px solid rgba(255,255,255,0.05);">
                <span>${getTrans('cd_rotation_guarantee')}</span>
                <span style="font-weight:bold; color:${inheritGuarantee ? '#2ecc71' : '#ff4757'};">
                ${inheritGuarantee ? getTrans('cd_rotation_inherit') : getTrans('cd_rotation_clear')}
                </span>
            </div>
        `;
    }

    // 3. 捕获明光层数（卡片 6 开启才显示）
    if (hasRescue) {
        const inheritRescue = matrix.inheritRescueLosses !== false;
        html += `
            <div style="display:flex; align-items:center; justify-content:space-between; padding:4px 0; border-bottom:1px solid rgba(255,255,255,0.05);">
                <span style="color:#e056fd;">${getTrans('cd_rotation_rescue')}</span>
                <span style="font-weight:bold; color:${inheritRescue ? '#2ecc71' : '#ff4757'};">
                ${inheritRescue ? getTrans('cd_rotation_inherit') : getTrans('cd_rotation_reset')}
                </span>
            </div>
        `;
    }

    // 4. 前 N 金胜率特权（卡片 8 开启才显示）
    if (hasEarly) {
        const resetEarly = matrix.resetEarlyUp !== false;
        html += `
            <div style="display:flex; align-items:center; justify-content:space-between; padding:4px 0; border-bottom:1px solid rgba(255,255,255,0.05);">
                <span style="color:#f1c40f;">${getTrans('cd_rotation_early')}</span>
                <span style="font-weight:bold; color:${resetEarly ? '#f1c40f' : '#2ecc71'};">
                ${resetEarly ? getTrans('cd_rotation_refresh') : getTrans('cd_rotation_continue')}
                </span>
            </div>
        `;
    }

    // 5. 前 N 金类型定向序列（卡片 9 开启才显示）
    if (hasCatSeq) {
        const resetCatSeq = matrix.resetCatSeq !== false;
        html += `
            <div style="display:flex; align-items:center; justify-content:space-between; padding:4px 0; border-bottom:1px solid rgba(255,255,255,0.05);">
                <span style="color:#3498db;">${getTrans('cd_rotation_category')}</span>
                <span style="font-weight:bold; color:${resetCatSeq ? '#3498db' : '#2ecc71'};">
                ${resetCatSeq ? getTrans('cd_rotation_refresh_short') : getTrans('cd_rotation_continue')}
                </span>
            </div>
        `;
    }

    // 6. 里程碑 / 井抽数进度（卡片 7 开启才显示）
    if (hasSpark) {
        const resetSpark = matrix.resetSparkPity !== false;
        html += `
            <div style="display:flex; align-items:center; justify-content:space-between; padding:4px 0; border-bottom:1px solid rgba(255,255,255,0.05);">
                <span style="color:#8e44ad;">${getTrans('cd_rotation_spark')}</span>
                <span style="font-weight:bold; color:${resetSpark ? '#8e44ad' : '#2ecc71'};">
                ${resetSpark ? getTrans('cd_rotation_reset_short') : getTrans('cd_rotation_accumulate')}
                </span>
            </div>
        `;
    }

    // 7. 赠送抽累计抽数（卡片 10 开启才显示）
    if (hasGift) {
        const resetGift = matrix.resetGiftRules !== false;
        html += `
            <div style="display:flex; align-items:center; justify-content:space-between; padding:4px 0;">
                <span style="color:#2ecc71;">${getTrans('cd_rotation_gift')}</span>
                <span style="font-weight:bold; color:${resetGift ? '#e67e22' : '#2ecc71'};">
                ${resetGift ? getTrans('cd_rotation_reset_short') : getTrans('cd_rotation_accumulate')}
                </span>
            </div>
        `;
    }

    container.innerHTML = html;
    document.getElementById('ruleUpdateModalOverlay').style.display = 'flex';
};

window.closeRuleUpdateModal = function() {
    const modal = document.getElementById('ruleUpdateModalOverlay');
    if (modal) modal.style.display = 'none';
};

// ==========================================
// 🌟 4. 确认插入换期节点并自动增加新十连
// ==========================================
window.confirmInsertRuleNode = function() {
    const matrix = window.rules?.lifecycle?.rotationMatrix || {};
    const body = document.getElementById('edit-body');
    const tailBox = document.getElementById('tail-rule-update-box');

    // 🌟 严格读取布尔值，即使是 false 也正确传入
    const nodeConfig = {
        isRuleUpdate: true,
        inheritPity: matrix.inheritPityPulls === true,
        inheritGuarantee: matrix.inheritGuaranteeState === true,
        inheritRescue: matrix.inheritRescueLosses === true,
        resetEarlyUp: matrix.resetEarlyUp !== false,
        resetCatSeq: matrix.resetCatSeq !== false,
        resetSpark: matrix.resetSparkPity !== false,
        resetGift: matrix.resetGiftRules !== false
    };

    const insertedNode = document.createElement('div');
    insertedNode.className = 'edit-row-container rule-node-item';
    insertedNode.dataset.isRuleNode = 'true';
    insertedNode.dataset.nodeConfig = JSON.stringify(nodeConfig);
    insertedNode.style = "display:flex; align-items:center; justify-content:space-between; margin-bottom:12px; background:rgba(26,188,156,0.12); padding:10px 14px; border-radius:8px; border:1px solid #1abc9c;";
    
    insertedNode.innerHTML = `
        <div style="display:flex; align-items:center; gap:10px;">
            <span class="rule-update-tag-badge">${getTrans('cd_rotation_node')}</span>
            <span style="font-size:12px; color:#ddd;">${getTrans('cd_rotation_node_desc')}</span>
        </div>
        <div style="display:flex; align-items:center; gap:8px;">
            <button class="btn btn-action-gray rule-node-delete-btn" style="padding:2px 6px; font-size:11px; color:#ff4757;" onclick="pushDeleteSnapshot(); this.closest('.rule-node-item').remove(); updateEditRowIndexes();">✕</button>
        </div>
    `;

    if (tailBox) {
        body.insertBefore(insertedNode, tailBox);
    } else {
        body.appendChild(insertedNode);
    }

    closeRuleUpdateModal();
    handleBtnAddTen();
    showToast(getTrans('cd_rotation_inserted'), "success");
    updateEditRowIndexes();
};

// 看板只比较录入弹窗的快照，不监听全页输入；重新打开时建立新的基准。
const dashboardChangeTracker = UnsavedChanges.createTracker({ getSnapshot: captureModalCurrentSnapshot });
const dashboardUnsaved = UnsavedChanges.create({
    tracker: dashboardChangeTracker,
    elements: { overlay: 'cancelConfirmModal', stay: 'btn-cancel-stay',
        discard: 'btn-cancel-discard', save: 'btn-cancel-save' },
    save: async () => await closeModal()===true,
    leave: url => {if(url){window.location.href=url;return;}document.getElementById('modalOverlay').style.display = 'none';},
    onStay: () => showToast(getTrans('cd_stay_editing'), 'info'),
    onDiscard: () => showToast(getTrans('cd_discarded'), 'warn'),
    afterSave: () => showToast(getTrans('cd_input_saved'), 'success'),
    onError: error => { console.error(error); showToast(error.message, 'danger'); }
});

// 点击左上角「✕」取消按钮时的处理
window.handleModalCancelClick = function() {
    // 若在删除模式中，优先受删除模式的安全流程管理
    if (window.isDeleteMode) return;

    dashboardUnsaved.request();
};


// Dashboard 保留原先的警告/撤回配色与淡入时长，计时器统一交给公共组件。
window.showToast = Toast.create({
    duration: 1600,
    showDelay: 10,
    types: {
        danger: { icon: '⚠️', color: '#ff4757' },
        warn: { icon: '⚠️', color: '#ff4757' },
        cancel: { icon: '↩️', color: '#f1c40f' },
        info: { icon: '↩️', color: '#f1c40f' }
    }
}).show;

        // 点击空白处关闭选角器
        document.addEventListener('click', (e) => {
            const picker = document.getElementById('charPicker');
            if (picker && picker.style.display !== 'none' && !picker.contains(e.target)) {
                picker.style.display = 'none';
            }
        });
        // 录入弹窗属于普通脚本；这两个函数也必须在同一作用域。
        // 它们此前被放进 type="module"，恢复已有记录时会抛 ReferenceError，
        // 从而中断末尾“更新卡池规则”按钮的渲染。
        function isRotationAllowed() {
            return rules?.lifecycle?.allowRotation !== false;
        }

        function renderTailRuleUpdateBox() {
            const body = document.getElementById('edit-body');
            if (!body) return;

            document.getElementById('tail-rule-update-box')?.remove();
            if (!isRotationAllowed()) return;

            const dividerRow = document.createElement('div');
            dividerRow.id = 'tail-rule-update-box';
            dividerRow.className = 'rule-update-divider-row';
            dividerRow.innerHTML = `
                <button type="button" class="btn-update-pool-rules" onclick="openRuleUpdateModal()">
                    <span>🔄</span>
                    <span>${getTrans('cd_rotation_update')}</span>
                </button>
            `;
            body.appendChild(dividerRow);
        }

// ==========================================
// 🌟 录入面板取消三选一逻辑
// ==========================================

// 采集录入框当前的数据序列签名（用于对比是否改动）
function captureModalCurrentSnapshot() {
    const rows = document.querySelectorAll('#edit-body .edit-row-container');
    const simpleList = [];
    rows.forEach(r => {
        if (r.dataset.isRuleNode === 'true') {
            simpleList.push({ isRuleNode: true, cfg: r.dataset.nodeConfig });
        } else {
            const boxes = r.querySelectorAll('.boxes-group .box');
            boxes.forEach(b => {
                simpleList.push({
                    tId: b.dataset.tierId,
                    itemId: b.dataset.itemId || '',
                    short: b.dataset.short || "",
                    isLost: b.dataset.isLost || "",
                    isFree: r.dataset.isFree,
                    autoRandom:b.dataset.autoRandom||''
                });
            });
        }
    });
    return JSON.stringify(simpleList);
}

// 打开录入面板时，记录最初的数据快照
const originalOpenModalLogic = window.openModal;
window.openModal = function() {
    originalOpenModalLogic();
    // 延迟记录初始特征，保证已渲染完成
    setTimeout(() => {
        dashboardChangeTracker.reset();
    }, 120);
};



