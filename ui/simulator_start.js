/** 可选择继续现有进度，或明确应用新的模拟起点。 */
(function(){
    'use strict';
    const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    function reorderPools(root,ids){
        root.querySelectorAll('[data-start-pool-list]').forEach(list=>{
            const before=Array.from(list.children),after=window.ListOrder.sort(before.slice(),ids,node=>node.dataset.startPoolSection);
            if(after.some((section,index)=>section!==before[index]))after.forEach(section=>list.appendChild(section));
        });
    }
    function mount(context){
        const {info,account,apply,isBusy,currencyEnabled}=context;
        let catalog=context.catalog;
        const tr=(zh,en)=>localStorage.getItem('GM_Lang')==='en'?en:zh;
        const summaryMessage=errors=>errors.map(error=>error.split(' / ')[localStorage.getItem('GM_Lang')==='en'?1:0]||error).join(' ');
        const name=row=>localStorage.getItem('GM_Lang')==='en'?row.en||row.name:row.name||row.en;
        const inline=!!context.host;
        const dialog=context.host||document.createElement('dialog');dialog.className='sim-wallet-dialog sim-start-dialog'+(inline?' sim-start-editor':'')+(context.createFlow?' sim-create-flow':'');
        if(!inline){dialog.id='sim-start-dialog';document.body.append(dialog);}
        const close=()=>{if(!inline)dialog.close();};
        let full=false,revision=null,dirty=false,submitting=false,exchangeView=null;
        const entryPanels = new Map(), panelPage = inline ? 'user_data' : 'simulator';
        const requestBack=async()=>{
            if(submitting)return;
            if(dirty&&!await customConfirm(tr('返回上一步会放弃尚未保存的填写，是否返回？','Go back and discard unsaved changes?')))return;
            close();context.onBack?.();
        };
        if(context.createFlow)dialog.oncancel=event=>{event.preventDefault();requestBack();};
        const warnLeave=event=>{if(context.createFlow&&dialog.open&&dirty){event.preventDefault();event.returnValue='';}};
        if(context.createFlow)window.addEventListener('beforeunload',warnLeave);
        function open({autoFill=true}={}){
            if(isBusy()||(!context.profile&&localStorage.getItem('GM_Sim_Start_Setup')!=='true'))return;
            window.PanelDefaults?.captureDetails(dialog, entryPanels);
            dirty=false;full=currencyEnabled();let ledger;
            try{ledger=full?account():null;revision=ledger?.revision;}catch{showToast(tr('无法读取账户，请检查存储。','Unable to read account storage.'),'danger');return;}
            catalog=context.getCatalog?context.getCatalog():context.catalog;
            const itemInput=({item,index})=>{
                return `<label data-start-item="${esc((name(item)||'')+' '+(item.name||''))}">${esc(name(item))}<input class="input-box" type="number" min="0" max="9007199254740990" step="1" required data-start-owned="${index}" value="0"></label>`;
            };
            const ownedHTML=SimulatorStart.ownedCategoryGroups(catalog,context.globalTiers,info.categories||[]).map(category=>
                `<section data-start-category="${esc(category.id)}"><h4 class="sim-start-category-title">${IconRender.html(category.icon||'🏷️')} ${esc(name(category)||category.id)}</h4>${category.tiers.map(tier=>
                    `<details data-start-tier="${esc(tier.id)}"><summary class="sim-start-tier-title">${esc(name(tier)||tier.id)}</summary>${['up','std'].map(group=>tier[group].length?
                        `<div data-start-group="${group}"><h6>${group==='up'?tr('限定 / UP','Limited / UP'):tr('常驻 / 可歪','Standard / Off-rate')}</h6><div class="sim-start-owned-grid">${tier[group].map(itemInput).join('')}</div></div>`:'').join('')}</details>`).join('')}</section>`).join('');
            const seed=context.getDraft?.();
            let economyProgress=seed?.economyProgress?JSON.parse(JSON.stringify(seed.economyProgress)):{exchanges:{},prerequisites:{}};
            exchangeView?.destroy();exchangeView=null;
            const schema=SimulatorStart.fields(context,seed?.engine);
            const field=(row,pool)=>{
                const title=esc(context.profile&&seed&&UserDataProfiles.locked(seed)&&row.key==='total'?tr('当前累计抽数','Current cumulative pulls'):tr(row.zh,row.en));
                const attributes=`data-start-field="${esc(row.key)}" ${pool?`data-start-pool="${esc(pool)}"`:''}`;
                if(row.checkbox)return window.StateToggle.render({label:tr(row.zh,row.en),checked:row.value,onText:tr('已取消','Cancelled'),offText:tr('未取消','Not cancelled'),data:{startField:row.key,...(pool?{startPool:pool}:{})}});
                return `<label>${title}<input class="input-box" ${attributes} type="number" min="${row.min||0}" max="${row.max}" step="1" value="${row.value}" required></label>`;
            };
            const historyBaseline=id=>{
                if(!seed||!UserDataProfiles.poolLocked(seed,id))return '';
                const start=UserDataProfiles.initial(seed,id),fields=SimulatorStart.fields(context.poolContexts[id],start).filter(field=>['total','pity','guarantee','rescue'].includes(field.key));
                const labels={total:tr('初始累计','Starting total'),pity:tr('初始垫抽','Starting pity'),guarantee:tr('初始大保底歪数','Starting guarantee losses'),rescue:tr('初始救援连歪','Starting rescue losses')};
                return `<p class="sim-wallet-note">${esc(tr('校验起点（录入前）：','Starting point before recorded pulls:'))}<br>${fields.map(field=>esc(labels[field.key]+' '+field.value)).join(' · ')}</p>`;
            };
            const historyHTML=id=>context.profile?`<div class="sim-start-history"><h5>${tr('历史出金汇总（仅抽卡出货）','Historical gold summary (pulls only)')}</h5><p class="sim-wallet-note" data-history-note>${tr('仅填录入前的出金，后续记录自动累计；两项留空则仅统计录入记录。保存后锁定，全零空池及缺失、错误的旧汇总可补正。','Enter gold before recorded pulls; later records are added automatically. Leave both blank to count recorded pulls only. Saved summaries lock; empty zero-state pools and missing or invalid legacy summaries remain editable.')}</p>${historyBaseline(id)}<p class="eco-error" data-history-error="${esc(id)}" role="alert">${esc(seed?summaryMessage(UserDataProfiles.summaryErrors(context.gameId,seed,id)):'')}</p><div class="sim-start-grid"><label>${tr('历史总出金数','Historical gold count')}<input class="input-box" type="number" min="0" step="1" max="10000000" data-start-history="gold" data-history-pool="${esc(id)}" value="${esc((seed?UserDataProfiles.summary(seed,id)?.gold:null)??'')}" placeholder="${tr('未填写','Not provided')}"></label><label>${tr('其中 UP 数','Of which UP')}<input class="input-box" type="number" min="0" step="1" max="10000000" data-start-history="up" data-history-pool="${esc(id)}" value="${esc((seed?UserDataProfiles.summary(seed,id)?.up:null)??'')}" placeholder="${tr('未填写','Not provided')}"></label><label>${tr('常驻／歪数（自动计算）','Standard / off-rate (calculated)')}<output data-history-lost="${esc(id)}">—</output></label></div></div>`:'';
            const progressHTML=context.poolContexts?Object.entries(context.poolContexts).map(([id,c],index)=>`<details data-start-pool-section="${esc(id)}" ${context.expandAll||index===0?'open':''}><summary><span class="sim-start-pool-icon" aria-hidden="true">${IconRender.html(c.label.icon||'🎯')}</span>${esc(name(c.label)||id)}</summary><div class="sim-start-grid">${SimulatorStart.fields(c,seed?.pools?.[id]).map(row=>field(row,id)).join('')}</div><p class="eco-error" data-progress-error="${esc(id)}" role="alert">${esc(seed?summaryMessage(UserDataProfiles.progressErrors(context.gameId,seed,id)):'')}</p>${historyHTML(id)}</details>`).join(''):`<div class="sim-start-grid">${schema.map(row=>field(row)).join('')}</div>`;
            const balanceHTML=full?`<section data-start-section="balances"><h4>${context.profile?tr('货币持有','Currency holdings'):tr('初始货币与票券','Initial currencies and tickets')}</h4><div class="sim-start-grid">${(info.economy?.resources||[]).map((r,i)=>`<label>${IconRender.html(r.icon||'🪙')+' '+esc(name(r))}<input class="input-box" type="number" min="0" step="1" max="9007199254740991" required data-start-balance="${i}" value="0"></label>`).join('')}</div></section>`:'';
            dialog.innerHTML=`<div class="sim-wallet-heading"><h3>${tr('模拟起点设置','Simulation starting point')}</h3></div>
                <p class="sim-wallet-note">${full?tr('从零填写起点，不回填历史模拟数据。应用后保存为恢复起点，并清空已有结果；继续当前进度则不修改账户。','Start from zero without importing past simulation data. Apply saves a reset point and clears displayed results; Continue leaves the account unchanged.'):tr('从零设置抽卡规则进度，不回填历史模拟数据。货币模式关闭时不设置余额与物品持有；应用后保存为恢复起点并清空结果。','Set rule progress from zero without importing past simulation data. Currency mode is off, so holdings are excluded. Apply saves a reset point and clears results.')}</p>
                <form>${context.profile&&!context.getNames?`<label>${tr('玩家数据名称','Player data name')}<input class="input-box" data-start-name maxlength="80" ${context.createFlow?'':'required'} value="${esc(seed?.name||'')}"></label>`:''}${balanceHTML}${full&&context.exchangeEditor?`<details data-start-section="exchanges"><summary>${tr('资源兑换','Resource exchanges')}</summary><p data-start-exchange-error class="eco-error" role="alert"></p><div data-start-exchanges></div><button type="button" class="btn btn-action-gray" data-start-exchange-reset>${tr('重置月度兑换','Reset monthly exchanges')}</button></details>`:''}<section data-start-section="progress"><h4>${context.accountProfile?tr('卡池进度','Pool progress'):tr('抽卡进度','Pull progress')}</h4><div data-start-pool-list>${progressHTML}</div>
                <p class="sim-wallet-note">${tr('初始累计抽数用于抽数编号及规则计数基准，出金不清零，不生成历史记录或补发资源。大保底与救援填写当前歪数，不填历史触发次数。历史井和赠送奖励视为已领取；未执行的赠送抽请单独填写。','Initial cumulative pulls set numbering and rule baselines; gold pulls do not reset it. No history or past resources are generated. Guarantee and rescue use current losses, not lifetime triggers. Past spark and bonus rewards are treated as claimed; enter pending bonus pulls separately.')}</p></section>
                ${full?`
                <details data-start-section="owned"><summary>${context.profile?tr('图鉴持有','Collection holdings'):tr('初始角色／物品持有（用于重复与溢出判定）','Initial item copies (duplicate and overflow returns)')}</summary><div class="sim-start-fill-toolbar"><button type="button" class="btn btn-action-gray" data-start-fill-low>${tr('低星一键设为满阶','Max out low-rarity copies')}</button><span class="sim-wallet-note" data-start-fill-status role="status" aria-live="polite"></span></div><input class="input-box" data-start-search placeholder="${tr('搜索名称','Search names')}"><div class="sim-start-owned">${ownedHTML}</div></details>
                `:''}
                <p data-start-error role="alert" style="color:#ff6b6b"></p><div class="sim-wallet-footer"><button type="button" class="btn" data-start-continue>${tr('继续当前进度','Continue current progress')}</button><button type="submit" class="btn btn-blue">${tr('应用起点设置','Apply starting point')}</button></div></form>`;
            if(context.profile&&context.createFlow){
                const label=document.createElement('label');label.className='sim-create-purpose';label.textContent=tr('账户用途','Account purpose');
                const select=document.createElement('select');select.className='input-box';select.dataset.startPurpose='';
                for(const [value,zh,en] of [['simulation','抽卡模拟用','Simulation account'],['record','结果记录用','Record account']]){const option=document.createElement('option');option.value=value;option.textContent=tr(zh,en);select.append(option);}
                label.append(select);const note=document.createElement('p');note.className='sim-wallet-note';note.textContent=tr('创建后无法更改账户用途。结果记录用账户也可在模拟器中使用；保存后仅锁定各卡池进度与初始角色／物品持有，货币与资源兑换仍可修改。','Account purpose cannot be changed after creation. Record accounts also work in the simulator and lock only pool progress and initial item copies in Player data; currencies and exchanges stay editable.');
                const form=dialog.querySelector('form');form.prepend(label,note);
            }
            dialog.querySelector('[data-start-continue]').onclick=()=>{if(context.isReadOnly?.())return;if(inline){open({autoFill:false});context.onRevert?.();}else close();};
            if(context.profile){
                dialog.querySelector('h3').textContent=tr('编辑玩家数据','Edit player data');
                dialog.querySelector('.sim-wallet-note').textContent=tr('保存为独立的初始数据，在模拟器中选择使用。保存不会更改当前模拟账户。','Save reusable initial data for the simulator. Saving does not change the live simulation account.');
                dialog.querySelector('[data-start-continue]').textContent=inline?tr('还原未保存修改','Revert unsaved changes'):tr('取消','Cancel');
                dialog.querySelector('[type="submit"]').textContent=tr('保存数据','Save data');
            }
            if(context.createFlow){
                dialog.querySelector('h3').textContent=tr('新建模拟数据','New simulation data');
                dialog.querySelector('.sim-wallet-note').textContent=tr('仅本次使用不会保存，离开模拟器页面后失效；保存到玩家数据后可再次选择。两种方式都会清空当前结果并应用填写的起点。','Use for this visit without saving, or save to Player data for reuse. Both clear current results and apply this starting point.');
                dialog.querySelector('[data-start-continue]').textContent=tr('返回上一步','Back');
                dialog.querySelector('[data-start-continue]').onclick=requestBack;
                const saveButton=dialog.querySelector('[type="submit"]');saveButton.value='saved';saveButton.textContent=tr('保存到玩家数据并使用','Save to Player data and use');
                const temporary=document.createElement('button');temporary.type='submit';temporary.value='temporary';temporary.className='btn btn-action-gray';temporary.textContent=tr('仅本次使用','Use for this visit');saveButton.before(temporary);
                const form=dialog.querySelector('form');form.oninput=event=>{if(event.target.matches('[data-start-field],[data-start-name],[data-start-balance],[data-start-owned]'))dirty=true;};
            }
            if(context.poolContexts)for(const [id,c] of Object.entries(context.poolContexts)){
                const inputs=Array.from(dialog.querySelectorAll('[data-start-field]')).filter(input=>input.dataset.startPool===id);
                const error=Array.from(dialog.querySelectorAll('[data-progress-error]')).find(node=>node.dataset.progressError===id);
                if(!error)continue;
                const check=()=>{
                    if(!error)return;
                    const values=Object.fromEntries(inputs.map(input=>[input.dataset.startField,input.type==='checkbox'?input.checked:input.value]));
                    try{SimulatorStart.build(c,values,seed?.pools?.[id]);error.textContent='';}catch(reason){error.textContent=tr('当前进度不符合规则：','Current progress is invalid: ')+summaryMessage([reason.message]);}
                };
                inputs.forEach(input=>input.addEventListener('input',check));
            }
            dialog.querySelectorAll('[data-start-history]').forEach(input=>{
                const refresh=()=>{
                    const id=input.dataset.historyPool,inputs=Array.from(dialog.querySelectorAll('[data-start-history]')).filter(el=>el.dataset.historyPool===id);
                    const gold=inputs.find(el=>el.dataset.startHistory==='gold'),up=inputs.find(el=>el.dataset.startHistory==='up');
                    const output=Array.from(dialog.querySelectorAll('[data-history-lost]')).find(el=>el.dataset.historyLost===id);
                    if(output)output.textContent=gold.value!==''&&up.value!==''&&Number(gold.value)>=Number(up.value)?String(Number(gold.value)-Number(up.value)):'—';
                };
                input.addEventListener('input',refresh);refresh();
            });
            if(!context.getNames&&!seed&&context.defaultName)dialog.querySelector('[data-start-name]').value=context.defaultName;
            if(context.expandAll){dialog.classList.add('sim-start-expanded');dialog.querySelectorAll('details:not([data-start-tier])').forEach(section=>section.open=true);}
            if(seed){
                dialog.querySelectorAll('[data-start-balance]').forEach(input=>input.value=String(seed.balances?.[info.economy.resources[Number(input.dataset.startBalance)].id]||0));
                dialog.querySelectorAll('[data-start-owned]').forEach(input=>{const item=catalog[Number(input.dataset.startOwned)];input.value=String(seed.owned?.[JSON.stringify([item.category,item.ownershipId||item.id||item.name])]||0);});
            }
            if(full&&context.exchangeEditor){
                const host=dialog.querySelector('[data-start-exchanges]');
                const readExchange=()=>{
                    const draft=SimulatorEconomy.createState();draft.balances={...(seed?.balances||{})};
                    dialog.querySelectorAll('[data-start-balance]').forEach(input=>{
                        const value=Number(input.value);if(input.value===''||!Number.isSafeInteger(value)||value<0)throw Error(tr('请先填写有效的资源余额。','Enter valid resource balances first.'));
                        draft.balances[info.economy.resources[Number(input.dataset.startBalance)].id]=value;
                    });
                    draft.exchanges=JSON.parse(JSON.stringify(economyProgress.exchanges));draft.prerequisites=JSON.parse(JSON.stringify(economyProgress.prerequisites));return draft;
                };
                const errorText=error=>({insufficient:tr('资源不足，未扣除资源。','Insufficient resources; nothing was charged.'),prerequisite:tr('请先完成前置兑换并解锁。','Complete prerequisites and unlock first.'),limit:tr('兑换次数已达到上限。','Exchange limit reached.'),invalid_amount:tr('兑换次数须为正整数。','Enter a positive whole number of exchanges.')}[error.message]||error.message);
                const renderExchange=()=>{
                    try{host.innerHTML=exchangeView.html(readExchange());exchangeView.bind(host);}
                    catch(error){host.replaceChildren();const message=document.createElement('p');message.className='eco-error';message.textContent=errorText(error);host.append(message);}
                };
                exchangeView=ResourceExchangesUI.create({info,panelPage,read:readExchange,isBusy:()=>isBusy()||!!context.isReadOnly?.(),mutate:action=>{
                    try{
                        if(isBusy()||context.isReadOnly?.())return;const draft=readExchange();action(draft);
                        economyProgress=SimulatorEconomy.progress(draft);
                        dialog.querySelectorAll('[data-start-balance]').forEach(input=>input.value=String(draft.balances[info.economy.resources[Number(input.dataset.startBalance)].id]||0));
                        dirty=true;context.onDraftChange?.();dialog.querySelector('[data-start-exchange-error]').textContent='';renderExchange();
                    }catch(error){dialog.querySelector('[data-start-exchange-error]').textContent=errorText(error);}
                }});
                renderExchange();
                const reset=dialog.querySelector('[data-start-exchange-reset]');
                reset.hidden=!(info.economy?.exchanges?.some(row=>['monthly','staged'].includes(row.mode))||info.economy?.unlockGroups?.some(row=>row.period==='monthly'));
                reset.onclick=async()=>{
                    if(reset.disabled||isBusy())return;reset.disabled=true;
                    try{const confirm=context.confirmExchangeReset||Dialog.create().confirm;
                        if(await confirm(tr('重置本表单的月度兑换次数和月度解锁？余额、永久解锁和一次性兑换保持不变；保存数据后生效。','Reset monthly exchange counts and unlocks in this form? Balances, permanent unlocks and one-time exchanges are kept. Save data to keep this change.')))exchangeView.resetMonthly();
                    }finally{reset.disabled=false;}
                };
                dialog.querySelectorAll('[data-start-balance]').forEach(input=>input.addEventListener('input',renderExchange));
                const exchangeSection=dialog.querySelector('[data-start-section="exchanges"]');exchangeSection.open=false;
                for(const id of ['balances','progress']){
                    const section=dialog.querySelector(`[data-start-section="${id}"]`),details=document.createElement('details'),summary=document.createElement('summary');
                    summary.textContent=section.querySelector('h4').textContent;section.querySelector('h4').remove();details.dataset.startSection=id;details.open=true;
                    details.append(summary);while(section.firstChild)details.append(section.firstChild);section.replaceWith(details);
                }
            }
            const fillLow=dialog.querySelector('[data-start-fill-low]');
            if(fillLow)fillLow.onclick=()=>{
                if(context.isReadOnly?.()||isBusy()||!currencyEnabled()||(!context.profile&&localStorage.getItem('GM_Sim_Start_Setup')!=='true'))return;
                const targets=SimulatorStart.lowRarityCaps({...context,catalog});let changed=0;
                for(const {index,cap} of targets){
                    const input=dialog.querySelector(`[data-start-owned="${index}"]`);
                    if(input&&(input.value===''||!Number.isSafeInteger(Number(input.value))||Number(input.value)<cap)){input.value=String(cap);changed++;}
                }
                if(changed){dirty=true;context.onAutoFill?.(changed);}
                dialog.querySelector('[data-start-fill-status]').textContent=targets.length?
                    tr(`已填充 ${changed} 项低星持有；较高数量已保留。点击下方保存按钮后生效。`,`Filled ${changed} low-rarity entries; higher counts kept. Use the save button below to apply changes.`):
                    tr('没有可填充的低星物品，请检查稀有度及满阶配置。','No eligible low-rarity items. Check rarity and copy-cap settings.');
            };
            const autoFillLow=full&&localStorage.getItem('GM_Sim_Start_Auto_Low_Overflow')!=='false';
            if(fillLow)fillLow.hidden=autoFillLow;
            if(autoFillLow&&autoFill)fillLow?.onclick();
            const search=dialog.querySelector('[data-start-search]');
            let searchExpansion=null;
            if(search)search.oninput=()=>{
                const searching=!!search.value.trim();
                if(searching&&!searchExpansion)searchExpansion=new Map(Array.from(dialog.querySelectorAll('[data-start-tier]'),tier=>[tier,tier.open]));
                dialog.querySelectorAll('[data-start-item]').forEach(row=>{row.hidden=!row.dataset.startItem.toLowerCase().includes(search.value.trim().toLowerCase());});
                dialog.querySelectorAll('[data-start-group]').forEach(group=>{group.hidden=!Array.from(group.querySelectorAll('[data-start-item]')).some(row=>!row.hidden);});
                dialog.querySelectorAll('[data-start-tier]').forEach(tier=>{tier.hidden=!Array.from(tier.querySelectorAll('[data-start-group]')).some(group=>!group.hidden);tier.open=searching?!tier.hidden:(searchExpansion?.get(tier)??tier.open);});
                dialog.querySelectorAll('[data-start-category]').forEach(category=>{category.hidden=!Array.from(category.querySelectorAll('[data-start-tier]')).some(tier=>!tier.hidden);});
                if(!searching)searchExpansion=null;
            };
            dialog.querySelector('form').onsubmit=event=>{
                event.preventDefault();if(context.isReadOnly?.()||isBusy()||submitting)return;
                const priorError=dialog.querySelector('[data-start-error]');if(priorError.textContent)priorError.textContent='';
                if(full!==currencyEnabled()){close();open();return;}
                try{
                    const values={},pools={...(seed?.pools||{})};
                    const inputs=Array.from(dialog.querySelectorAll('[data-start-field]'));
                    inputs.forEach(input=>values[input.dataset.startField]=input.type==='checkbox'?input.checked:input.value);
                    if(context.poolContexts)for(const [id,c] of Object.entries(context.poolContexts)){
                        const poolValues={};inputs.filter(input=>input.dataset.startPool===id).forEach(input=>poolValues[input.dataset.startField]=input.type==='checkbox'?input.checked:input.value);
                        try{pools[id]=SimulatorStart.build(c,poolValues,seed?.pools?.[id]);}catch(error){const section=Array.from(dialog.querySelectorAll('[data-start-pool-section]')).find(section=>section.dataset.startPoolSection===id);if(section)section.open=true;const notice=Array.from(dialog.querySelectorAll('[data-progress-error]')).find(node=>node.dataset.progressError===id);if(notice)notice.textContent=tr('当前进度不符合规则：','Current progress is invalid: ')+summaryMessage([error.message]);throw Error((name(c.label)||id)+': '+summaryMessage([error.message]));}
                    }
                    const state=context.poolContexts?Object.values(pools)[0]||GachaEngine.createState():SimulatorStart.build(context,values,seed?.engine),balances={},owned={...(seed?.owned||ledger?.owned||{})};
                    const number=input=>{const n=Number(input.value);if(input.value===''||!Number.isSafeInteger(n)||n<0)throw Error(tr('持有数量须为非负整数。','Holdings must be non-negative whole numbers.'));return n;};
                    dialog.querySelectorAll('[data-start-balance]').forEach(input=>balances[info.economy.resources[Number(input.dataset.startBalance)].id]=number(input));
                    dialog.querySelectorAll('[data-start-owned]').forEach(input=>{const item=catalog[Number(input.dataset.startOwned)],n=number(input),key=JSON.stringify([item.category,item.ownershipId||item.id||item.name]);if(n)owned[key]=n;else delete owned[key];});
                    const recordStats={...(seed?.recordStats||{})};
                    if(context.profile&&context.poolContexts)for(const id of Object.keys(context.poolContexts)){
                        const inputs=Array.from(dialog.querySelectorAll('[data-start-history]')).filter(input=>input.dataset.historyPool===id);
                        const gold=inputs.find(input=>input.dataset.startHistory==='gold'),up=inputs.find(input=>input.dataset.startHistory==='up');
                        if(!gold||!up)continue;
                        const start=seed&&UserDataProfiles.poolLocked(seed,id)?UserDataProfiles.initial(seed,id):pools[id];
                        const summary=UserDataProfiles.historyStats(gold.value,up.value,start.total);
                        const errors=SimulatorStart.summaryErrors(context.poolContexts[id],start,summary);
                        const errorNode=Array.from(dialog.querySelectorAll('[data-history-error]')).find(node=>node.dataset.historyError===id);
                        if(errorNode)errorNode.textContent=summaryMessage(errors);
                        if(errors.length){const section=Array.from(dialog.querySelectorAll('[data-start-pool-section]')).find(node=>node.dataset.startPoolSection===id);if(section)section.open=true;gold.focus();throw Error((name(context.poolContexts[id].label)||id)+': '+summaryMessage(errors));}
                        if(summary)recordStats[id]=summary;else delete recordStats[id];
                    }
                    const names=context.getNames?.();
                    const dataName=names?String(names.name||'').trim():dialog.querySelector('[data-start-name]')?.value.trim();
                    const dataEn=String(names?names.en||'':seed?.en||'').trim();
                    const temporary=context.createFlow&&event.submitter?.value==='temporary';
                    if(context.profile&&!temporary&&!dataName&&!dataEn){context.onNameInvalid?.();throw Error(tr('请填写数据名称。','Enter a data name.'));}
                    const commit=()=>{
                        if(apply(state,full?{balances,owned,revision,...(context.exchangeEditor||seed?.economyProgress?{economyProgress}: {})}:null,{name:dataName,en:dataEn,pools,recordStats,temporary,purpose:dialog.querySelector('[data-start-purpose]')?.value||'simulation'})){dirty=false;close();showToast(temporary?tr('已应用本次临时数据，离开页面后失效。','Temporary data applied for this visit.'):context.profile?tr('已保存玩家数据。','Player data saved.'):tr('已设置模拟起点。','Starting point saved.'),'success');}
                        else dialog.querySelector('[data-start-error]').textContent=tr('起点未保存。账户可能已在其他页面更新，请重新打开弹窗后再试。','Starting point was not saved. The account may have changed in another page; reopen this dialog and try again.');
                    };
                    if(context.createFlow){
                        submitting=true;
                        customConfirm(temporary?tr('使用这份临时数据并清空当前模拟结果？数据与本次抽卡进度不会保存，离开此页面后失效。','Use temporary data and clear current results? Data and subsequent progress will not be saved after leaving this page.'):tr('保存到玩家数据并应用？这会清空当前模拟结果，并替换本次模拟起点。','Save to Player data and apply? This clears current results and replaces the simulation starting point.')).then(ok=>{if(ok&&!isBusy())commit();}).catch(error=>{dialog.querySelector('[data-start-error]').textContent=error.message;}).finally(()=>{submitting=false;});
                    }else commit();
                }catch(error){dialog.querySelector('[data-start-error]').textContent=error.message;}
            };
            if (window.PanelDefaults) {
                // Simulator forms also have collapsible sections when exchanges or currency are disabled.
                dialog.querySelectorAll('section[data-start-section]').forEach(section => {
                    const heading=section.querySelector('h4');
                    if(!heading)return;
                    const details=document.createElement('details'),summary=document.createElement('summary');
                    summary.textContent=heading.textContent;heading.remove();details.dataset.startSection=section.dataset.startSection;
                    details.append(summary);while(section.firstChild)details.append(section.firstChild);section.replaceWith(details);
                });
                PanelDefaults.applyDetails(dialog, panelPage, 'sections', 'details[data-start-section]', {states:entryPanels,identify:node=>node.dataset.startSection});
                PanelDefaults.applyDetails(dialog, panelPage, 'pools', 'details[data-start-pool-section]', {states:entryPanels,identify:node=>node.dataset.startPoolSection});
                PanelDefaults.applyDetails(dialog, panelPage, 'tiers', 'details[data-start-tier]', {states:entryPanels,group:'[data-start-category]',identify:node=>(node.closest('[data-start-category]')?.dataset.startCategory||'')+':'+node.dataset.startTier});
            }
            if(context.footerAction)dialog.querySelector('.sim-wallet-footer').prepend(context.footerAction);
            if(!inline&&!dialog.open)dialog.showModal();
        }
        return Object.freeze({open,close,destroy:()=>{exchangeView?.destroy();if(context.createFlow)window.removeEventListener('beforeunload',warnLeave);dialog.remove();}});
    }
    window.SimulatorStartUI=Object.freeze({mount,reorderPools});
})();
