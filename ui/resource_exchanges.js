/** 资源兑换共用界面：模拟器和玩家数据草稿使用相同的分组、解锁与兑换操作。 */
(function(){
    'use strict';
    const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    function create({info,read,mutate,isBusy=()=>false,poolId,panelPage='user_data'}){
        const service=SimulatorEconomy.create(info),config=service.config,openStates=new Map(),choices=new Map();let host=null,feedback=null;
        const scope=service.resourceScope(poolId);
        const tr=(zh,en)=>localStorage.getItem('GM_Lang')==='en'?en:zh;
        const name=row=>localStorage.getItem('GM_Lang')==='en'?row.en||row.name||row.id:row.name||row.en||row.id;
        const resourceName=id=>{const row=config.resources.find(row=>row.id===id);return row?IconRender.text(row.icon||'🪙')+' '+name(row):'?';};
        const resourceHTML = id => { const r=config.resources.find(r=>r.id===id); return r ? IconRender.html(r.icon || '🪙')+' '+esc(name(r)) : '?'; };
        const button=(action,text,disabled=false)=>`<button type="button" class="btn" ${disabled?'disabled':''} data-wallet-action="${action}">${esc(text)}</button>`;
        let foldIndex=0;
        const fold=(id,title,body)=>{
            const index=foldIndex++,open=openStates.get(id)??window.PanelDefaults?.initial(panelPage,'exchanges',index)??false;
            return `<details class="resource-exchange-category" data-exchange-category="${esc(id)}" ${open?'open':''}><summary>${esc(title)}</summary><div class="resource-exchange-body">${body}</div></details>`;
        };
        function capture(){
            host?.querySelectorAll('[data-exchange-category]').forEach(node=>openStates.set(node.dataset.exchangeCategory,node.open));
            host?.querySelectorAll('[data-wallet-row]').forEach(node=>choices.set(node.dataset.walletRow,{target:node.querySelector('[data-wallet-target]')?.value,times:node.querySelector('[data-wallet-times]')?.value||'1'}));
        }
        function offerText(state,row,target){
            const stage=service.offer(state,row);
            return (stage?`${stage.cost} ${resourceName(row.from)} → ${stage.gain} ${target?resourceName(target):tr('暂无可兑换资源','No eligible resource')}`:tr('所有档位已完成','All stages completed'))+
                (['staged','once_staged'].includes(row.mode)?' · '+tr('档位','Stage')+' '+((state.exchanges[row.id]||0)+1):'');
        }
        function requirementHTML(progress){
            const row=config.exchanges.find(row=>row.id===progress.requirement.exchangeId);
            if(progress.perTarget)return progress.perTarget.map(target=>`<li>${target.met?'✓':'○'} ${esc(name(row))} · ${resourceHTML(target.id)}：${target.count} / ${target.needed}</li>`).join('');
            return `<li>${progress.met?'✓':'○'} ${esc(name(row))}${progress.requirement.targetId?' · '+resourceHTML(progress.requirement.targetId):''}：${progress.count} / ${progress.needed}</li>`;
        }
        function html(state){
            capture();
            foldIndex=0;
            const exchangeCard=row=>{
                    const targets=scope.targets(state,row),saved=choices.get(row.id)?.target;
                    const target=targets.includes(saved)?saved:targets[0];
                    return `<div class="sim-wallet-exchange" data-wallet-row="${esc(row.id)}"><strong>${esc(name(row))}</strong><small data-wallet-offer>${esc(offerText(state,row,target))}</small>
                    ${row.hasPrerequisite&&!row.unlockGroupId?`<label class="sim-wallet-prerequisite"><input type="checkbox" data-wallet-prerequisite ${state.prerequisites[row.id]?'checked':''}>${tr('前置已完成','Prerequisite completed')}<span>${esc(localStorage.getItem('GM_Lang')==='en'?row.prerequisiteEn||row.prerequisite:row.prerequisite||row.prerequisiteEn)}</span></label>`:''}
                    <div class="sim-wallet-row"><select class="input-box" data-wallet-target aria-label="${tr('兑换目标','Exchange target')}">${targets.map(id=>`<option value="${esc(id)}"${id===target?' selected':''}>${esc(resourceName(id))}${['daily','monthly'].includes(row.mode)?' ('+(state.exchanges[row.id+':'+id]||0)+'/'+row.limit+')':''}</option>`).join('')}</select><input class="input-box" data-wallet-times type="number" min="1" step="1" value="1" aria-label="${tr('兑换次数','Number of exchanges')}" ${['once','staged','once_staged'].includes(row.mode)?'disabled':''}>${button('exchange',tr('兑换','Exchange'))}</div></div>`;

            };
            const groupCards=scope.groups.map(group=>{
                const status=service.groupStatus(state,group.id),members=scope.exchanges.filter(row=>row.unlockGroupId===group.id);
                return [group.id,`<section class="sim-wallet-unlock-group" data-wallet-group="${esc(group.id)}"><h4>${esc(name(group))} <span>${status.unlocked?tr('已解锁','Unlocked'):tr('未解锁','Locked')}</span></h4>
                <p class="sim-wallet-note">${esc(localStorage.getItem('GM_Lang')==='en'?group.prerequisiteEn||group.prerequisite||'':group.prerequisite||group.prerequisiteEn||'')} · ${group.period==='daily'?tr('每日重新解锁','Unlock again each day'):group.period==='monthly'?tr('每月重新解锁','Unlock again each month'):tr('解锁永久保留','Permanent unlock')}</p>
                ${!status.unlocked?`<ul class="sim-wallet-unlock-progress">${status.requirements.map(requirementHTML).join('')}${Object.entries(status.costs).map(([id,amount])=>`<li>${(state.balances[id]||0)>=amount?'✓':'○'} ${esc(resourceName(id))}：${state.balances[id]||0} / ${amount} ${tr('（解锁时扣除一次）','(charged once on unlock)')}</li>`).join('')}</ul>${button('unlock',tr('满足条件并解锁','Unlock exchanges'),!status.ready)}`:''}
                ${members.map(exchangeCard).join('')||`<p class="sim-wallet-note">${tr('尚未加入兑换项目。','No exchanges assigned yet.')}</p>`}</section>`];
            });
            const categories=[['fixed',tr('普通兑换','Regular exchanges')],['daily',tr('每日限购','Daily limits')],['monthly',tr('每月限购','Monthly limits')],['staged',tr('每月阶梯','Monthly stages')],['once',tr('一次性兑换','One-time exchanges')],['once_staged',tr('一次性阶梯','One-time stages')]];
            const regular=categories.map(([id,title])=>{const rows=scope.exchanges.filter(row=>!row.unlockGroupId&&row.mode===id);return rows.length?fold(id,title+' · '+rows.length,rows.map(exchangeCard).join('')):'';}).join('');
            return regular+groupCards.map(([id,html])=>fold('group:'+id,name(config.unlockGroups.find(row=>row.id===id)),html)).join('')||`<p class="sim-wallet-note">${tr('尚未配置兑换规则。','No exchanges configured.')}</p>`;

        }
        function exchangeError(error,state,row,target,times){
            if(error.message==='limit'){
                if(['daily','monthly','once'].includes(row.mode)){
                    const limit=row.mode==='once'?1:row.limit,used=state.exchanges[row.id+':'+target]||0,remaining=Math.max(0,limit-used);
                    return remaining===0?tr('该资源已达到兑换上限，无法继续兑换。','This resource has reached its exchange limit.'):
                        tr(`本次兑换 ${times} 次，超过剩余额度 ${remaining} 次，未扣除资源。`,`Requested ${times} exchanges, but only ${remaining} remain. Nothing was charged.`);
                }
                return tr('所有兑换档位已完成，无法继续兑换。','All exchange stages are complete.');
            }
            if(error.message==='insufficient')return tr('资源不足，无法兑换；未扣除资源。','Insufficient resources to exchange; nothing was charged.');
            if(error.message==='invalid_amount')return tr('兑换次数须为有效的正整数。','Enter a valid positive whole number of exchanges.');
            if(error.message==='prerequisite')return tr('请先完成并解锁所属前置条件。','Complete and unlock the prerequisite first.');
            if(error.message==='wrong_pool')return tr('该兑换目标不适用于当前卡池，请重新选择。','This exchange target is not eligible for the current pool. Select again.');
            return error.message;
        }
        function bind(root){
            feedback?.dismiss();host=root;if(!host)return;
            // 原页面的 toast 位于模态 dialog 的底层，必须把反馈放到当前弹窗内部。
            if(window.Toast){
                const toast=document.createElement('div');toast.className='resource-exchange-toast';
                toast.setAttribute('role','alert');toast.setAttribute('aria-live','assertive');host.appendChild(toast);
                feedback=window.Toast.create({target:toast,duration:3500,types:{danger:{icon:'⚠️',color:'#ff4757'}}});
            }
            host.querySelectorAll('[data-wallet-row]').forEach(node=>{
                const saved=choices.get(node.dataset.walletRow),select=node.querySelector('[data-wallet-target]');
                if(saved&&select&&Array.from(select.options).some(option=>option.value===saved.target))select.value=saved.target;
                const times=node.querySelector('[data-wallet-times]');if(saved&&times&&!times.disabled)times.value=saved.times;
                const description=node.querySelector('[data-wallet-offer]'),rule=scope.exchanges.find(row=>row.id===node.dataset.walletRow);
                if(description&&rule)description.textContent=offerText(read(),rule,select?.value);
            });
            host.onclick=event=>{
                const action=event.target.closest('[data-wallet-action]')?.dataset.walletAction;
                if(!action)return;event.stopPropagation();if(isBusy())return;
                const row=event.target.closest('[data-wallet-row]');
                if(action==='unlock')mutate(state=>{const id=event.target.closest('[data-wallet-group]').dataset.walletGroup;if(!scope.groups.some(group=>group.id===id))throw new Error('wrong_pool');service.unlock(state,id);});
                if(action==='exchange')mutate(state=>{
                    const rule=scope.exchanges.find(rule=>rule.id===row.dataset.walletRow),target=row.querySelector('[data-wallet-target]').value,times=Number(row.querySelector('[data-wallet-times]').value);
                    try{
                        if(!rule)throw new Error('wrong_pool');
                        if(!service.offer(state,rule))throw new Error('limit');
                        if(!scope.targets(state,rule).includes(target))throw new Error('wrong_pool');
                        service.exchange(state,rule.id,target,times);
                    }catch(error){feedback?.show(exchangeError(error,state,rule||{},target,times),'danger');throw error;}
                });
            };
            host.onchange=event=>{
                if(event.target.matches('[data-wallet-target]')){
                    event.stopPropagation();capture();
                    const node=event.target.closest('[data-wallet-row]'),rule=scope.exchanges.find(row=>row.id===node.dataset.walletRow);
                    const description=node.querySelector('[data-wallet-offer]');
                    if(description&&rule)description.textContent=offerText(read(),rule,event.target.value);
                    return;
                }
                if(!event.target.matches('[data-wallet-prerequisite]'))return;
                event.stopPropagation();if(isBusy())return;
                const id=event.target.closest('[data-wallet-row]').dataset.walletRow,checked=event.target.checked;
                mutate(state=>{state.prerequisites[id]=checked;});
            };
            window.refreshCustomDropdowns?.(host,true);
        }
        return Object.freeze({html,bind,capture,resetMonthly:()=>{if(!isBusy())mutate(state=>service.reset(state,'monthly'));},render:()=>{if(!host)return;const content=html(read());host.innerHTML=content;bind(host);},destroy:()=>{feedback?.dismiss();if(host){host.onclick=null;host.onchange=null;}host=null;}});
    }
    window.ResourceExchangesUI=Object.freeze({create});
})();
