/** 余额与资源管理界面；事务成功写入后才提交抽卡状态。 */
(function () {
    'use strict';
    const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    function mount({gameId, poolId, info, catalog, isCurrencyEnabled}) {
        const service = SimulatorEconomy.create(info), config = service.config, scope=service.resourceScope(poolId);
        const key = 'GM_Sim_Economy_' + gameId;
        const tr = (zh,en) => localStorage.getItem('GM_Lang') === 'en' ? en : zh;
        const name = row => localStorage.getItem('GM_Lang') === 'en' ? row.en || row.name || row.id : row.name || row.en || row.id;
        const resourceName = id => { const r=config.resources.find(r=>r.id===id); return r ? IconRender.text(r.icon || '🪙')+' '+name(r) : '?'; };
        const resourceHTML = id => { const r=config.resources.find(r=>r.id===id); return r ? IconRender.html(r.icon || '🪙')+' '+esc(name(r)) : '?'; };
        const accountName = state => state.profile && (state.profile.name || state.profile.en)
            ? name(state.profile) : tr('临时账户','Temporary account');
        const paymentLabel = row => `${resourceName(row.resourceId)} ${row.cost} / ${row.pulls===1?tr('一抽','1 pull'):row.pulls+' '+tr('抽','pulls')}`;
        const root = document.getElementById('sim-economy');
        const dialog = document.createElement('dialog'); dialog.className='sim-wallet-dialog'; document.body.appendChild(dialog);
        const paymentToast=window.Toast?.create({target:'sim-payment-toast',duration:2500});
        let busy=false, selected='', lastPool='null', temporaryAccount=null,exchangeView=null;
        const enabled = () => isCurrencyEnabled ? isCurrencyEnabled() : localStorage.getItem('GM_Sim_Currency_Mode') === 'true';
        const errors = {
            insufficient:['可用支付方式合计不足，本次未抽卡、未扣款。','Available payment methods cannot cover this batch. No pulls or charges were made.'],
            whole_payment:['抽数须为所选支付方式的整组倍数。','Pull count must be a multiple of the selected payment bundle.'],
            invalid_amount:['请输入有效的正整数数量。','Enter a valid positive whole number.'],
            prerequisite:['请先完成前置兑换并解锁对应兑换组。','Complete the prerequisite purchases and unlock the group first.'],
            invalid_requirement:['前置兑换配置无效，请检查规则。','Invalid prerequisite configuration. Check the rules.'],
            limit:['本次额度已用完或签到已完成。','Allowance used up or sign-in completed.'],
            conflict:['账户已在其他页面更新，请重新操作。','The account changed in another page. Please try again.'],
            unknown_item:['抽出物品无法在图鉴中确认，本次未扣款。','A result could not be matched to the catalog. Nothing was charged.'],
            storage:['无法读取或保存资源账户，请检查本机存储。','Unable to read or save the resource account. Check local storage.'],
            no_payment:['当前卡池没有可用的支付方式，请先配置货币规则。','Configure an eligible payment method for this pool first.'],
            wrong_pool:['支付方式不适用于当前卡池。','This payment method is not eligible for this pool.']
        };
        function report(error) { const pair=errors[error.message] || [error.message,error.message]; showToast(tr(...pair),'danger'); }
        function read() {
            if(temporaryAccount)return service.clone(temporaryAccount);
            const raw=localStorage.getItem(key);
            if (!raw) return SimulatorEconomy.createState();
            let state; try { state=JSON.parse(raw); } catch { throw new Error('storage'); }
            if (state?.version!==1 || !Number.isSafeInteger(state.revision) || !['balances','owned','claims','exchanges','prerequisites','signins','pools'].every(k=>state[k]&&typeof state[k]==='object'&&!Array.isArray(state[k]))) throw new Error('storage');
            if (state.revision<0 || !['balances','owned','claims','exchanges','signins'].every(k=>Object.values(state[k]).every(n=>Number.isSafeInteger(n)&&n>=0))) throw new Error('storage');
            if (!Object.values(state.pools).every(pool=>pool&&Number.isSafeInteger(pool.total)&&Array.isArray(pool.freeQueue)&&Array.isArray(pool.events?.pendingGifts))) throw new Error('storage');
            return state;
        }
        function save(state, revision) {
            if (read().revision!==revision) throw new Error('conflict');
            state.revision=revision+1;
            if(temporaryAccount){temporaryAccount=service.clone(state);return;}
            try { localStorage.setItem(key,JSON.stringify(state)); } catch { throw new Error('storage'); }
        }
        function mutate(action) {
            if(busy || !enabled()) return;
            try { const state=read(),revision=state.revision;action(state);save(state,revision);render();showToast(tr('资源账户已更新。','Resource account updated.'),'success'); }
            catch(error){report(error);}
        }
        function payments() { return (config.payments || []).filter(row=>!row.poolIds?.length||row.poolIds.includes(poolId)); }
        const button = (action,text,disabled=false) => `<button type="button" class="btn" ${disabled?'disabled':''} data-wallet-action="${action}">${esc(text)}</button>`;
        function renderDialog(state) {
            const exchangesOpen=dialog.querySelector('[data-wallet-section="exchanges"]')?.open??window.PanelDefaults?.initial('simulator','wallet',1)??false;
            const incomesOpen=dialog.querySelector('[data-wallet-section="incomes"]')?.open??window.PanelDefaults?.initial('simulator','wallet',0)??true;
            const claims=scope.incomes;
            exchangeView ||= ResourceExchangesUI.create({info,read,mutate,isBusy:()=>busy,poolId,panelPage:'simulator'});
            const exchangeCards=exchangeView.html(state);
            dialog.innerHTML=`<div class="sim-wallet-heading"><h3>${tr('资源管理','Resource manager')}</h3>${button('close',tr('关闭','Close'))}</div><p class="sim-wallet-note">${tr('同一游戏各卡池共享账户。每日与每月额度手动重置，不自动推进日期。','All pools in this game share an account. Reset daily and monthly allowances manually; dates do not advance automatically.')}</p>
                <div class="sim-wallet-balances">${scope.resources.map(r=>`<span>${resourceHTML(r.id)} <b>${state.balances[r.id]||0}</b></span>`).join('')}</div>
                <details data-wallet-section="incomes" ${incomesOpen?'open':''}><summary>${tr('获取货币与票券','Claim currencies & tickets')}</summary>${claims.map(row=>`<div class="sim-wallet-row" data-wallet-row="${esc(row.id)}"><div><strong>${esc(name(row))}</strong><small>${resourceHTML(row.resourceId)} · ${row.schedule==='signin'?tr('累计签到','Sign-in')+' '+(state.signins[row.id]||0):esc(row.amount)+' / '+esc(({once:tr('仅限一次','One-time'),unlimited:tr('不限次数','Unlimited'),daily:tr('每日','Daily'),monthly:tr('每月','Monthly')})[row.schedule]||row.schedule)}${state.claims[row.id]?tr(' · 已领取',' · Claimed'):''}</small></div><input class="input-box" data-wallet-times type="number" min="1" step="1" value="1" aria-label="${tr('领取次数','Number of claims')}" ${row.schedule!=='unlimited'?'disabled':''}>${button('claim',row.schedule==='signin'?tr('签到一天','Sign in one day'):tr('领取','Claim'))}</div>`).join('')||`<p>${tr('尚未配置获取来源。','No income sources configured.')}</p>`}</details>
                <details data-wallet-section="exchanges" ${exchangesOpen?'open':''}><summary>${tr('兑换资源','Exchange resources')}</summary><div data-resource-exchanges>${exchangeCards}</div></details>
                <div class="sim-wallet-footer">${service.resetPeriods(poolId).map(period=>button(period,({daily:tr('每日重置','Daily reset'),monthly:tr('月重置','Monthly reset'),once:tr('重置一次性额度','Reset one-time allowances')})[period])).join('')}</div>`;
            exchangeView.bind(dialog.querySelector('[data-resource-exchanges]'));
        }
        function render() {
            root.hidden=!enabled();
            if(root.hidden){if(dialog.open)dialog.close();return;}
            try {
                const state=read(),options=payments();
                if(!options.some(row=>row.id===selected)) selected=options[0]?.id||'';
                root.innerHTML=`<div class="sim-wallet-strip"><strong class="sim-wallet-account">${esc(accountName(state))}</strong><div class="sim-wallet-balances">${scope.resources.map(r=>`<span>${resourceHTML(r.id)} <b>${state.balances[r.id]||0}</b></span>`).join('')||tr('尚未配置资源','No resources configured')}</div>${button('manage',tr('获取 / 兑换','Claim / exchange'))}</div><div class="sim-wallet-payment"><select class="input-box" data-wallet-payment aria-label="${tr('支付方式','Payment method')}">${options.map(row=>`<option value="${esc(row.id)}" ${selected===row.id?'selected':''}>${esc(paymentLabel(row))}</option>`).join('')}</select></div>`;
                if(dialog.open)renderDialog(state);
            } catch(error){root.textContent=tr('资源账户暂不可用，请检查本机存储。','Resource account unavailable. Check local storage.');}
        }
        root.onchange=event=>{if(event.target.matches('[data-wallet-payment]'))selected=event.target.value;};
        root.onclick=event=>{if(event.target.closest('[data-wallet-action="manage"]')&&!busy){try{renderDialog(read());dialog.showModal();}catch(error){report(error);}}};
        dialog.onclick=async event=>{
            const action=event.target.closest('[data-wallet-action]')?.dataset.walletAction;
            if(!action||busy)return;
            if(action==='close'){dialog.close();return;}
            const row=event.target.closest('[data-wallet-row]');
            // 兑换的内部布局也使用 row 类，编号取最近带 data-wallet-row 的外层。
            if(action==='claim')mutate(state=>{if(!scope.incomes.some(source=>source.id===row.dataset.walletRow))throw new Error('wrong_pool');service.claim(state,row.dataset.walletRow,Number(row.querySelector('[data-wallet-times]').value));});
            if(['daily','monthly','once'].includes(action)) {
                if(!service.resetPeriods(poolId).includes(action))return;
                dialog.close();
                const message=({
                    daily:tr('确认重置每日领取、每日兑换限额与每日前置解锁？余额、持有量、抽卡进度及其他周期额度保持不变。','Reset daily claims, daily exchange limits and daily prerequisite unlocks? Balances, copies, pull progress and other periods are kept.'),
                    monthly:tr('确认重置每月领取、月度兑换档位与月度前置解锁？余额、持有量、抽卡进度及每日、一次性额度保持不变。','Reset monthly claims, exchange stages and prerequisite unlocks? Balances, copies, pull progress, daily and one-time allowances are kept.'),
                    once:tr('确认重置一次性领取、一次性兑换档位与永久前置解锁？已领取或兑换的资源不会扣回，重置后可再次领取或兑换。余额、持有量、抽卡进度和签到进度保持不变。','Reset one-time claims, one-time exchange stages and permanent prerequisite unlocks? Previously received resources are not deducted and can be claimed or exchanged again. Balances, copies, pull progress and sign-in progress are kept.')
                })[action];
                if(await customConfirm(message))mutate(state=>service.reset(state,action));
                if(enabled()){try{renderDialog(read());dialog.showModal();}catch(error){report(error);}}
            }
        };
        async function pull(engineState, amount, drawOne,record=null) {
            if(busy) return null;
            busy=true;
            try {
                const state=read(),revision=state.revision;
                if(JSON.stringify(state.pools[poolId]||null)!==lastPool)throw new Error('conflict');
                if(!selected)throw new Error('no_payment');
                const charged=service.payWithFallback(state,selected,poolId,amount);
                const draft=service.clone(engineState),results=[];
                let paid=0;
                // 付费抽数与引擎赠送抽分开；十连票始终覆盖10次付费抽卡。
                while(paid<amount||draft.freeQueue.length){
                    const batch=await drawOne(draft);
                    if(!batch.length)throw new Error('unknown_item');
                    results.push(...batch);paid+=batch.filter(result=>result.pullType==='paid').length;
                }
                const earned={};
                // 额外井奖励在对应抽之后计入持有，保证同批后续重复/溢出判定正确。
                for (const result of results) {
                    const awarded=service.settle(state,[result],catalog,poolId);
                    for(const [id,n] of Object.entries(awarded))earned[id]=(earned[id]||0)+n;
                    service.settle(state,(draft.events.pendingGifts||[]).filter(gift=>gift.atTotal===result.total).map(gift=>({name:gift.name,...(gift.itemId?{itemId:gift.itemId}:{})})),catalog,poolId,{returns:false});
                }
                const gifts=service.clone(draft.events.pendingGifts||[]);draft.events.pendingGifts=[];
                state.pools[poolId]=service.clone(draft);
                if(record?.keep){
                    state.sessions=state.sessions||{};
                    state.sessions[poolId]=SimulatorSession.create(draft,[...record.entries,...SimulatorSession.additions(results,gifts,amount===1)],record.selections);
                    state.sessions[poolId].paymentId=charged.payment.id;
                }else if(state.sessions)delete state.sessions[poolId];
                save(state,revision);lastPool=JSON.stringify(state.pools[poolId]);selected=charged.payment.id;render();
                const summary=Object.entries(earned).map(([id,n])=>resourceName(id)+' +'+n).join(' · ');
                if(summary)showToast(summary,'success');
                if(charged.switched){
                    const summary=charged.allocations.map(part=>name(part.payment)+' × '+part.pulls+tr('抽',' pulls')).join(' + ');
                    (paymentToast?.show||showToast)(tr('已自动补足支付：','Payment automatically covered: ')+summary,'info');
                }
                return {state:draft,results,gifts};
            } catch(error){report(error);return null;}
            finally{busy=false;}
        }
        window.addEventListener('storage',event=>{if(event.key===key||event.key==='GM_Sim_Currency_Mode')render();});
        render();
        const accountFields=['balances','owned','claims','exchanges','prerequisites','signins'];
        const validAccount=account=>account&&accountFields.every(k=>account[k]&&typeof account[k]==='object'&&!Array.isArray(account[k]))&&
            accountFields.filter(k=>k!=='prerequisites').every(k=>Object.values(account[k]).every(n=>Number.isSafeInteger(n)&&n>=0));
        function startAction(action){
            if(busy||!enabled())return null;
            try{
                const state=read(),revision=state.revision;
                if(JSON.stringify(state.pools[poolId]||null)!==lastPool)throw new Error('conflict');
                const result=action(state);save(state,revision);
                lastPool=JSON.stringify(state.pools[poolId]||null);render();return result;
            }catch(error){report(error);return null;}
        }
        function snapshot(state,engine){return {engine:service.clone(engine),account:Object.fromEntries(accountFields.map(k=>[k,service.clone(state[k])])),...(state.profile?{profile:service.clone(state.profile)}:{})};}
        return Object.freeze({enabled,render,pull,isBusy:()=>busy,account:()=>service.clone(read()),
            beginTemporary:()=>{temporaryAccount=service.clone(read());lastPool=JSON.stringify(temporaryAccount.pools[poolId]||null);},
            endTemporary:()=>{temporaryAccount=null,exchangeView=null;lastPool=JSON.stringify(read().pools[poolId]||null);},
            loadRecord:()=>{const state=read(),record=state.sessions?.[poolId];if(!record)return null;
                if(!SimulatorSession.valid(record)||JSON.stringify(record.engine)!==JSON.stringify(state.pools[poolId]))throw new Error('conflict');
                if(payments().some(row=>row.id===record.paymentId))selected=record.paymentId;
                return service.clone(record);},
            hasConfiguredStart:()=>read().starts?.[poolId]?.configured===true,
            ensureStart:engine=>{
                try{if(read().starts?.[poolId])return true;}catch(error){report(error);return false;}
                return !!startAction(state=>{state.starts=state.starts||{};state.starts[poolId]=snapshot(state,engine);return true;});
            },
            applyStart:(engine,holdings)=>!!startAction(state=>{
                if(state.revision!==holdings.revision)throw new Error('conflict');
                if(!SimulatorStart.valid(engine)||!validAccount({...state,balances:holdings.balances,owned:holdings.owned}))throw new Error('storage');
                if(holdings.profile!==undefined){
                    const profile=holdings.profile;
                    if(!profile||typeof profile.name!=='string'||typeof profile.en!=='string'||(profile.id!==undefined&&typeof profile.id!=='string'))throw new Error('storage');
                    state.profile=service.clone(profile);
                }
                state.balances=service.clone(holdings.balances);state.owned=service.clone(holdings.owned);
                if(holdings.resetProgress)for(const key of ['claims','exchanges','prerequisites','signins'])state[key]={};
                if(holdings.economyProgress!==undefined){if(!SimulatorEconomy.validProgress(holdings.economyProgress))throw new Error('storage');const progress=SimulatorEconomy.progress(holdings.economyProgress);state.exchanges=progress.exchanges;state.prerequisites=progress.prerequisites;}
                state.pools[poolId]=service.clone(engine);state.starts=state.starts||{};
                if(holdings.pools){
                    if(!Object.values(holdings.pools).every(SimulatorStart.valid))throw new Error('storage');
                    for(const [id,progress] of Object.entries(holdings.pools)){
                        state.pools[id]=service.clone(progress);
                        state.starts[id]={...snapshot(state,progress),configured:true};
                    }
                    state.sessions={};
                }
                if(state.sessions)delete state.sessions[poolId];
                state.starts[poolId]={...snapshot(state,engine),configured:true};return true;
            }),
            restoreStart:()=>startAction(state=>{
                const initial=state.starts?.[poolId];
                if(!SimulatorStart.valid(initial?.engine)||!validAccount(initial.account))throw new Error('storage');
                for(const k of accountFields)state[k]=service.clone(initial.account[k]);
                if(initial.profile)state.profile=service.clone(initial.profile);else delete state.profile;
                if(state.sessions)delete state.sessions[poolId];
                state.pools[poolId]=service.clone(initial.engine);return service.clone(initial.engine);
            }),
            savePool:(engineState,record=null)=>{if(busy)return false;try{const state=read(),revision=state.revision;if(JSON.stringify(state.pools[poolId]||null)!==lastPool)throw new Error('conflict');state.pools[poolId]=service.clone(engineState);
                if(record?.keep){state.sessions=state.sessions||{};state.sessions[poolId]=SimulatorSession.create(engineState,record.entries,record.selections);state.sessions[poolId].paymentId=selected;}
                else if(record&&state.sessions)delete state.sessions[poolId];
                save(state,revision);lastPool=JSON.stringify(state.pools[poolId]);return true;}catch(error){report(error);return false;}},
            loadPool:()=>{try{const pool=read().pools[poolId]||null;lastPool=JSON.stringify(pool);return pool;}catch(error){report(error);return null;}}});
    }
    window.SimulatorWallet=Object.freeze({mount});
})();
