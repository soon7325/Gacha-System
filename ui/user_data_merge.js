/** 手动融合入口：先预览、再确认；不自动合并普通账号。 */
(function(){
    'use strict';
    function mount({gameId,hasDrafts,afterSave}){
        const tr=(zh,en)=>localStorage.getItem('GM_Lang')==='en'?en:zh;
        const dialog=document.createElement('dialog');dialog.className='sim-wallet-dialog player-merge-dialog';document.body.append(dialog);
        const confirm=Dialog.create().confirm;
        let plan=null,busy=false,refreshAccounts=null;
        UserDataAccountsUI.watch?.(gameId,rows=>refreshAccounts?.(rows),{active:()=>dialog.open&&!busy&&!!refreshAccounts});
        const element=(tag,text,className)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=text;if(className)node.className=className;return node;};
        const errorMessage=error=>({conflict:tr('数据已在其他页面修改，请重新预览。','Data changed elsewhere. Preview again.'),same_account:tr('来源和目标不能是同一账号。','Source and target must be different.'),
            account_missing:tr('账号已不存在，请重新打开融合窗口。','An account no longer exists. Reopen this window.'),
            undo_changed:tr('目标账号已在融合后修改，无法直接撤销，以免覆盖新数据。','The target changed after merging. Undo is blocked to protect newer edits.'),no_merge:tr('没有可撤销的融合。','No merge to undo.')}[error.message]||tr('操作未完成，请检查本机存储并重新预览。','The operation failed. Check local storage and preview again.'));
        function open(){
            if(hasDrafts()){showToast(tr('请先保存或还原页面上的未保存修改，再融合数据。','Save or revert your edits before merging.'),'info');return;}
            try{
                const data=UserDataProfiles.read(gameId);plan=null;dialog.replaceChildren();
                dialog.append(element('h3',tr('手动融合数据','Merge data manually')),
                    element('p',tr('只修改目标账号，来源账号保留。旧数据已转换为可管理、可删除的账号；账号间不会自动融合。','Only the target changes; source accounts are kept. Legacy data is now a manageable, deletable account. Accounts are never merged automatically.'),'sim-wallet-note'));
                dialog.append(element('p',tr('结果记录用账户在此只读，可作为来源；仅可编辑账户能作为融合目标。','Record accounts are read-only here and may be sources; only editable accounts may be merge targets.'),'sim-wallet-note'));
                const controls=element('div',undefined,'player-merge-controls');
                const select=(title,rows)=>{const label=element('label',title),input=document.createElement('select');input.className='input-box';for(const row of rows){const option=element('option',row.label);option.value=row.id;option.disabled=!!row.disabled;input.append(option);}label.append(input);controls.append(label);return input;};
                const source=select(tr('来源数据','Source'),[]);
                const target=select(tr('目标账号（将被修改）','Target account (will change)'),[]);
                UserDataAccountsUI.fillSelect(target,data.items.filter(row=>!UserDataProfiles.locked(row)));
                const candidate=data.items.find(row=>row.legacyAccount&&row.id!==target.value)?.id||data.items.find(row=>row.id!==target.value)?.id;
                UserDataAccountsUI.fillSelect(source,data.items,{selectedId:candidate});
                const mode=select(tr('融合方式','Merge mode'),[{id:'target',label:tr('保留目标数据，只用来源补空白','Keep target; fill blanks from source')},
                    {id:'source',label:tr('以来源数据为主，用目标补空白','Prefer source; fill blanks from target')},{id:'replace',label:tr('用来源覆盖目标所选内容','Replace selected target content with source')}]);
                dialog.append(controls);
                const scopes=element('fieldset',undefined,'player-merge-scopes');scopes.append(element('legend',tr('处理内容','Include')));const checks={};
                for(const [id,title] of [['balances',tr('货币与票券','Currencies and tickets')],['owned',tr('角色／物品持有','Item copies')],['progress',tr('卡池、兑换进度与记录','Pool and exchange progress, records')]]){
                    const label=element('label'),input=document.createElement('input');input.type='checkbox';input.checked=true;checks[id]=input;label.append(input,document.createTextNode(title));scopes.append(label);
                }
                dialog.append(scopes,element('p',tr('“空白”包括 0、未填写或没有记录。持有数量不相加；卡池进度与历史作为整组选择，避免混用保底、井和记录。旧记录不包含货币余额，因此不会改动余额。','Blanks include zero, missing values or no records. Copy counts are never added. Each pool’s progress and history stay together. Legacy records contain no currency balances, so balances stay unchanged.'),'sim-wallet-note'));
                const preview=element('div',undefined,'player-merge-preview'),error=element('p',undefined,'eco-error');error.setAttribute('role','alert');dialog.append(preview,error);
                const actions=element('div',undefined,'sim-wallet-footer');
                const button=(title,action,primary=false)=>{const node=element('button',title,'btn '+(primary?'btn-blue':'btn-action-gray'));node.type='button';node.onclick=action;actions.append(node);return node;};
                button(tr('关闭','Close'),()=>{if(!busy)dialog.close();});
                if(data.lastPlayerMerge)button(tr('撤销上次融合','Undo last merge'),async()=>{
                    if(busy)return;busy=true;
                    try{if(await confirm(tr('撤销上次融合，将目标账号恢复为融合前的数据？来源保持不变。','Undo the last merge and restore the target’s previous data? The source stays unchanged.'))){UserDataTools.undo(gameId);dialog.close();afterSave();showToast(tr('已撤销上次融合。','Last merge undone.'),'success');}}
                    catch(e){error.textContent=errorMessage(e);}finally{busy=false;}
                });
                const previewButton=button(tr('预览更改','Preview changes'),()=>{
                    if(busy)return;error.textContent='';preview.replaceChildren();
                    try{
                        plan=UserDataTools.preview(gameId,{sourceId:source.value,targetId:target.value,mode:mode.value,scopes:Object.keys(checks).filter(key=>checks[key].checked&&!checks[key].disabled)});
                        preview.append(element('p',tr(`将修改“${plan.targetName}”，来源为“${plan.sourceName}”。共 ${plan.changes.length} 项变化。`,`Target: ${plan.targetName}. Source: ${plan.sourceName}. ${plan.changes.length} changes.`)));
                        const catalog=GameData.flattenCatalog(GameData.loadCatalog(gameId)),resources=GameData.loadGameInfo(gameId).economy?.resources||[];
                        const name=row=>localStorage.getItem('GM_Lang')==='en'?row?.en||row?.name:row?.name||row?.en;
                        const label=change=>change.field==='economyProgress'?tr('兑换次数与解锁状态','Exchange counts and unlocks'):change.field==='balances'?name(resources.find(r=>r.id===change.id))||change.id:change.field==='owned'?name(catalog.find(item=>JSON.stringify([item.category,item.ownershipId||item.id||item.name])===change.id))||change.id:name(GameData.loadPoolMeta(gameId,change.id))||change.id;
                        const value=(v,field)=>{
                            if(field==='economyProgress')return tr(`${Object.keys(v.exchanges||{}).length} 项兑换计数 · ${Object.values(v.prerequisites||{}).filter(Boolean).length} 项已解锁／确认`,`${Object.keys(v.exchanges||{}).length} exchange counters · ${Object.values(v.prerequisites||{}).filter(Boolean).length} unlocks / confirmations`);
                            if(field!=='progress')return String(v);
                            const draws=v.records.filter(row=>!row.isRuleNode),recent=draws.slice(-4).map(row=>row.short||row.name||tr(`${row.star||''}星未指定物品`,'Unnamed item')).join(' / ');
                            const progress=v.state?tr(`累计 ${v.state.total||0} · 垫抽 ${v.state.pity||0} · 歪 ${v.state.guaranteeCount||0}`,`Total ${v.state.total||0} · Pity ${v.state.pity||0} · Losses ${v.state.guaranteeCount||0}`):tr('无进度数据','No progress data');
                            return progress+tr(` · 历史 ${draws.length} 抽`,` · ${draws.length} records`)+(recent?' · '+recent:'');
                        };
                        const table=document.createElement('table'),head=document.createElement('tr');for(const title of [tr('内容','Content'),tr('融合前','Before'),tr('融合后','After')])head.append(element('th',title));table.append(head);
                        for(const change of plan.changes){const row=document.createElement('tr');row.append(element('td',label(change)),element('td',value(change.before,change.field)),element('td',value(change.after,change.field)));table.append(row);}preview.append(table);
                        apply.disabled=!plan.changes.length;
                        if(!plan.changes.length)preview.append(element('p',tr('没有需要改变的内容，不会重复添加记录。','No changes are needed. Records will not be duplicated.')));
                    }catch(e){plan=null;apply.disabled=true;error.textContent=errorMessage(e);}
                });
                const apply=button(tr('确认融合','Confirm merge'),async()=>{
                    if(busy||!plan)return;busy=true;apply.disabled=true;previewButton.disabled=true;
                    try{
                        if(await confirm(tr(`确认修改“${plan.targetName}”？将按上方预览执行；来源保留，可在目标未再次修改前撤销本次融合。`,`Modify “${plan.targetName}” as previewed? The source is kept. You can undo before editing the target again.`))){
                            UserDataTools.commit(plan);dialog.close();afterSave();showToast(tr('已融合数据，来源已保留。','Data merged. Source kept.'),'success');
                        }
                    }catch(e){error.textContent=errorMessage(e);}finally{busy=false;apply.disabled=!plan?.changes.length;previewButton.disabled=false;}
                },true);apply.disabled=true;
                function invalidate(){plan=null;apply.disabled=true;preview.replaceChildren(element('p',tr('选择来源、目标及方式后，点击“预览更改”。','Choose source, target and mode, then preview the changes.')));error.textContent='';}
                refreshAccounts=rows=>{
                    const selectedSource=source.value,selectedTarget=target.value;data.items=rows;
                    UserDataAccountsUI.fillSelect(source,rows,{selectedId:selectedSource});
                    UserDataAccountsUI.fillSelect(target,rows.filter(row=>!UserDataProfiles.locked(row)),{selectedId:selectedTarget});
                    invalidate();window.refreshCustomDropdowns?.(dialog,true);
                };
                source.onchange=()=>{const row=data.items.find(row=>row.id===source.value);checks.balances.disabled=!!row?.legacyAccount&&!Object.keys(row.balances||{}).length;checks.balances.checked=!checks.balances.disabled;invalidate();};
                target.onchange=mode.onchange=invalidate;Object.values(checks).forEach(input=>input.onchange=invalidate);source.onchange();
                dialog.append(actions);dialog.oncancel=event=>{if(busy)event.preventDefault();};dialog.showModal();window.refreshCustomDropdowns?.(dialog,true);
            }catch(e){showToast(errorMessage(e),'danger');}
        }
        return Object.freeze({open});
    }
    window.UserDataMergeUI=Object.freeze({mount});
})();
