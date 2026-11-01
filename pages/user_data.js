/** 玩家数据在页面内编辑；账号模式只影响展示，不删除已保存的数据。 */
(function(){
    'use strict';
    const game=new URLSearchParams(location.search).get('gameId');
    const tr=(zh,en)=>localStorage.getItem('GM_Lang')==='en'?en:zh;
    const node=id=>document.getElementById(id);
    window.showToast=Toast.create().show;
    const confirm=Dialog.create().confirm;
    let context=null,revision=0,items=[],cards=[];
    const nameOptions=new WeakMap();let bilingual=null;
    const preview=PreviewLock.create({buttonId:'data-preview-toggle',getLabels:()=>({lock:tr('👁️ 锁定预览','👁️ Lock preview'),unlock:tr('🔓 解除预览','🔓 Unlock preview')})});
    const previewControls=new Map();
    const editableControls='input:not([data-start-search]),select,textarea,button';
    function restorePreviewControls(root){
        root.querySelectorAll(editableControls).forEach(control=>{
            if(previewControls.has(control)){control.disabled=previewControls.get(control);previewControls.delete(control);}
        });
    }
    function syncPreview(){
        // 搜索只筛选界面，不修改数据；其余控件逐项锁定以保留搜索能力。
        if(preview.isLocked())node('data-preview-fields').querySelectorAll(editableControls).forEach(control=>{
            if(!previewControls.has(control))previewControls.set(control,control.disabled);
            if(!control.disabled)control.disabled=true;
        });
        else {previewControls.forEach((disabled,control)=>control.disabled=disabled);previewControls.clear();}
        node('data-new').disabled=preview.isLocked();node('data-merge').disabled=preview.isLocked();
        preview.refresh();
    }

    function report(error){node('data-error').textContent=tr('无法读取或保存玩家数据；若其他页面已修改，请刷新后重试。','Unable to read or save player data. Refresh after changes in another page.')+' '+error.message;}
    const hasDrafts=()=>cards.some(card=>card.dirty);
    window.confirmPlayerDataModeChange=()=>!hasDrafts()||confirm(tr('切换数据管理方式会放弃尚未保存的填写，是否继续？','Switching account modes will discard unsaved edits. Continue?'));
    window.refreshPlayerDataMode=()=>{if(context)render();};
    function moveAccount(from,to,before){
        if(preview.isLocked())return;
        try{
            const data=UserDataProfiles.reorder(game,from,to,before,revision);
            revision=data.revision;items=data.items;
            const rank=new Map(items.map((row,index)=>[row.id,index]));
            cards.sort((a,b)=>(rank.get(a.row?.id)??Infinity)-(rank.get(b.row?.id)??Infinity));
            // 只移动已有节点，不重新创建表单，保留展开状态和未保存填写。
            cards.forEach(card=>node('data-list').append(card.element));
            window.dispatchEvent(new CustomEvent('user-data-accounts-change',{detail:{gameId:game}}));
        }catch(error){report(error);}
    }
    function bindAccountDrag(){
        DragSort.bind(node('data-list'),'.player-account-card',moveAccount,{
            handleSelector:'.player-account-drag',handleOnly:true,getId:card=>card.dataset.accountId,
            canDrag:card=>!preview.isLocked()&&UserDataProfiles.mode()==='multi'&&!!card.dataset.accountId
        });
    }
    function syncDefaultChecks(){
        cards.forEach(card=>{if(card.defaultInput)card.defaultInput.checked=!!card.row?.isDefault;});
    }
    function restoreDefaultCheck(card){
        if(!card.defaultInput)return;
        card.defaultInput.checked=!!card.row?.isDefault;
        if(card.defaultInput.checked)cards.forEach(other=>{if(other!==card&&other.defaultInput)other.defaultInput.checked=false;});
        else if(!cards.some(other=>other.defaultInput?.checked))syncDefaultChecks();
    }
    function refreshPoolOrder(){
        if(!context)return;
        const ids=UserDataProfiles.orderedPoolIds(game),rank=new Map(ids.map((id,index)=>[id,index]));
        const entries=Object.entries(context.poolContexts).sort(([a],[b])=>(rank.get(a)??Infinity)-(rank.get(b)??Infinity));
        if(entries.some(([id],index)=>id!==Object.keys(context.poolContexts)[index])){
            Object.keys(context.poolContexts).forEach(id=>delete context.poolContexts[id]);
            entries.forEach(([id,value])=>context.poolContexts[id]=value);
        }
        SimulatorStartUI.reorderPools(node('data-list'),ids);
    }
    function addEditor(row=null,expanded=false){
        const multi=UserDataProfiles.mode()==='multi';
        const card=document.createElement(multi?'details':'article');card.className='player-account-card';if(multi)card.open=expanded;
        const head=document.createElement(multi?'summary':'div');head.className='player-account-head';
        let dragHandle=null;
        if(multi){
            dragHandle=document.createElement('button');dragHandle.type='button';dragHandle.className='player-account-drag';dragHandle.textContent='⠿';
            dragHandle.title=tr('拖动调整账户顺序；Alt＋方向键可上下移动。','Drag to reorder accounts; Alt + arrow keys moves up or down.');
            dragHandle.setAttribute('aria-label',tr('调整账户顺序','Reorder account'));
            dragHandle.setAttribute('aria-keyshortcuts','Alt+ArrowUp Alt+ArrowDown');
            dragHandle.onclick=event=>{event.preventDefault();event.stopPropagation();};
            dragHandle.onkeydown=event=>{
                event.stopPropagation();
                if(!event.altKey||!['ArrowUp','ArrowDown'].includes(event.key))return;
                event.preventDefault();
                const saved=cards.filter(card=>card.row),index=saved.findIndex(item=>item.element===card),target=saved[index+(event.key==='ArrowUp'?-1:1)];
                if(target)moveAccount(card.dataset.accountId,target.row.id,event.key==='ArrowUp');
            };
            head.append(dragHandle);
        }
        const text=document.createElement('div'),heading=document.createElement('div'),title=document.createElement('h3'),detail=document.createElement('p');text.className='player-account-title';heading.className='player-account-heading';heading.append(title);text.append(heading,detail);head.append(text);
        const syncWarning=document.createElement('p');syncWarning.className='player-account-sync-warning';syncWarning.setAttribute('role','status');text.append(syncWarning);
        const titleInput=document.createElement('input');titleInput.type='text';titleInput.className='input-box player-account-name';titleInput.maxLength=80;
        titleInput.setAttribute('aria-label',tr('玩家数据名称','Player data name'));titleInput.placeholder=tr('玩家数据名称','Player data name');title.append(titleInput);
        titleInput.addEventListener('click',event=>event.stopPropagation());
        titleInput.addEventListener('keydown',event=>{if(event.key===' '||event.key==='Enter')event.stopPropagation();});
        titleInput.addEventListener('focus',()=>{if(multi)card.open=true;});
        const state={row,element:card,purpose:UserDataProfiles.purpose(row),dirty:false,names:{name:row?.name??(multi?'':'我的账号'),en:row?.en??(!row&&!multi?'My account':'')}};cards.push(state);
        state.updateSyncWarning=(source=state.row)=>{
            const blocked=Object.entries(source?.dashboardRecords||{}).filter(([,entry])=>entry.syncBlocked?.reason==='invalid_history');
            syncWarning.hidden=!blocked.length;card.classList.toggle('has-sync-warning',!!blocked.length);
            const pools=blocked.map(([id])=>{const meta=context.poolContexts[id]?.label;return (localStorage.getItem('GM_Lang')==='en'?meta?.en:meta?.name)||meta?.name||meta?.en||id;}).join('、');
            syncWarning.textContent=blocked.length?tr(`⚠️ ${pools}：抽卡记录含非法数据，本次未同步至玩家数据，原有进度与持有已保留。修正记录并成功同步后清除。`,`⚠️ ${pools}: Invalid pull records blocked synchronization. Saved progress and owned items are unchanged. Correct the records and sync successfully to clear this warning.`):'';
        };
        const purposeLabel=document.createElement('span');purposeLabel.className='player-account-purpose';heading.append(purposeLabel);
        const updateHeader=()=>{
            card.dataset.accountId=state.row?.id||'';if(dragHandle)dragHandle.disabled=!state.row;
            state.updateSyncWarning();
            titleInput.value=UserDataProfiles.label(state.names);
            purposeLabel.textContent=state.purpose==='simulation'?tr('抽卡模拟用','Simulation account'):tr('结果记录用','Record account')+(UserDataProfiles.locked(state.row)?tr(' · 持有及已使用卡池进度锁定',' · Copies and used pool progress locked'):'');
            detail.textContent=state.row?tr(`${Object.keys(state.row.pools).length} 个卡池进度 · ${Object.keys(state.row.owned).length} 项持有`,`${Object.keys(state.row.pools).length} pool progress records · ${Object.keys(state.row.owned).length} owned entries`):tr('填写后点击“保存数据”。','Fill in the form and choose Save data.');
        };
        updateHeader();
        let removeButton=null;
        if(multi){
            const actions=document.createElement('div');actions.className='currency-actions';
            const defaultLabel=document.createElement('label');defaultLabel.className='player-account-default';
            const defaultInput=document.createElement('input');defaultInput.type='checkbox';defaultInput.checked=!!row?.isDefault;state.defaultInput=defaultInput;
            defaultLabel.append(defaultInput,document.createTextNode(tr('默认账户','Default account')));
            defaultLabel.title=UserDataProfiles.locked(row)?tr('此项可直接修改并保存；同一游戏最多一个默认账户。','Changes save immediately. Each game can have one default account.'):tr('保存数据后生效；同一游戏最多一个默认账户。','Takes effect after saving. Each game can have one default account.');
            defaultLabel.addEventListener('click',event=>event.stopPropagation());
            defaultInput.addEventListener('change',()=>{
                if(preview.isLocked()){restoreDefaultCheck(state);return;}
                if(UserDataProfiles.locked(state.row)){
                    try{
                        state.row=UserDataProfiles.save(game,{...state.row,isDefault:defaultInput.checked},revision);revision++;
                        if(state.row.isDefault)cards.forEach(other=>{if(other!==state&&other.row)other.row.isDefault=false;});
                        syncDefaultChecks();showToast(tr('默认账户已保存。','Default account saved.'),'success');
                    }catch(error){syncDefaultChecks();report(error);}return;
                }
                state.dirty=true;
                if(defaultInput.checked)cards.forEach(other=>{if(other!==state&&other.defaultInput)other.defaultInput.checked=false;});
            });actions.append(defaultLabel);
            const toggle=document.createElement('span');toggle.className='player-account-toggle';
            const syncToggle=()=>toggle.textContent=card.open?tr('▲ 收起','▲ Collapse'):tr('▼ 展开','▼ Expand');syncToggle();card.addEventListener('toggle',syncToggle);actions.append(toggle);
            const remove=document.createElement('button');remove.type='button';remove.className='btn btn-danger';remove.textContent=tr('删除','Delete');
            remove.classList.add('player-account-delete');removeButton=remove;
            remove.onclick=async event=>{
                event.preventDefault();event.stopPropagation();
                if(preview.isLocked())return;
                const displayName=UserDataProfiles.label(state.names)||tr('新账号','New account');
                if(!await confirm(tr(`删除“${displayName}”？此账号的玩家数据、抽卡记录及未保存修改将被移除。`,`Delete “${displayName}”, its player data, pull records and unsaved changes?`)))return;
                try{
                    if(preview.isLocked()||UserDataProfiles.mode()!=='multi')return;
                    if(state.row){UserDataProfiles.remove(game,state.row.id,revision);revision++;items=items.filter(row=>row.id!==state.row.id);}
                    card.remove();cards=cards.filter(item=>item!==state);bindAccountDrag();showToast(tr('已删除玩家数据。','Player data deleted.'),'success');
                    if(!cards.some(other=>other.defaultInput?.checked))syncDefaultChecks();
                    if(!cards.length)showEmpty();
                }catch(error){report(error);}
            };head.append(actions);
        }
        card.append(head);
        const purposeBox=document.createElement('div');purposeBox.className='player-account-purpose-box';
        const purposeSelect=document.createElement('select');purposeSelect.className='input-box';purposeSelect.setAttribute('aria-label',tr('账户用途','Account purpose'));
        for(const [value,zh,en] of [['record','结果记录用','Record account'],['simulation','抽卡模拟用','Simulation account']]){const option=document.createElement('option');option.value=value;option.textContent=tr(zh,en);purposeSelect.append(option);}
        purposeSelect.value=state.purpose;purposeSelect.disabled=!!state.row;
        const purposeNote=document.createElement('p');purposeNote.className='sim-wallet-note';
        purposeNote.textContent=tr('创建后无法更改账户用途。结果记录用账户也可在模拟器中使用，模拟操作不会修改原数据。保存后锁定已有数据的卡池进度与初始角色／物品持有；全零且无录入记录的卡池仍可补填。货币、资源兑换、账户名称与默认账户仍可修改。','Account purpose cannot be changed after creation. Record accounts can also be copied into the simulator without changing the original. Saved record accounts lock populated pool progress and initial item copies; all-zero pools without recorded pulls remain editable. Currencies, exchanges, account name and the default-account checkbox remain editable.');
        purposeBox.append(purposeSelect,purposeNote);card.append(purposeBox);
        purposeSelect.onchange=()=>{state.purpose=purposeSelect.value;state.dirty=true;updateHeader();};
        const host=document.createElement('div');card.append(host);node('data-list').append(card);
        const lockEditor=()=>{
            restorePreviewControls(card);
            purposeBox.hidden=!!state.row;
            const locked=UserDataProfiles.locked(state.row);purposeSelect.disabled=!!state.row;
            host.querySelectorAll('[data-start-field]').forEach(input=>{input.disabled=UserDataProfiles.poolLocked(state.row,input.dataset.startPool);});
            host.querySelectorAll('[data-start-owned],[data-start-fill-low]').forEach(input=>{input.disabled=locked;});
            host.querySelectorAll('[data-start-history]').forEach(input=>{input.disabled=UserDataProfiles.summaryLocked(game,state.row,input.dataset.historyPool);});
            if(locked)host.querySelectorAll('[data-start-fill-low]').forEach(button=>button.hidden=true);
            syncPreview();
        };
        const options={getLanguage:()=>localStorage.getItem('GM_Lang')||'zh',isLocked:()=>preview.isLocked(),
            getValue:language=>state.names[language==='en'?'en':'name'],
            setValue:(language,value)=>{state.names[language==='en'?'en':'name']=value;state.dirty=true;}};
        nameOptions.set(titleInput,options);BilingualInput.bind(titleInput,options).refresh(true);
        const editor=SimulatorStartUI.mount({...context,host,expandAll:!multi,profile:true,exchangeEditor:true,isReadOnly:()=>preview.isLocked(),confirmExchangeReset:confirm,footerAction:removeButton,getNames:()=>state.names,getDraft:()=>state.row,
            onDraftChange:()=>{state.dirty=true;},
            onAutoFill:()=>{state.dirty=true;},
            onNameInvalid:()=>{if(multi)card.open=true;titleInput.focus();},
            onRevert:()=>{state.names={name:state.row?.name??(multi?'':'我的账号'),en:state.row?.en??(!state.row&&!multi?'My account':'')};state.dirty=false;restoreDefaultCheck(state);updateHeader();bilingual?.refresh(titleInput);lockEditor();},
            account:()=>({revision:0,owned:{}}),currencyEnabled:()=>true,isBusy:()=>false,
            apply:(engine,holdings,meta)=>{
                if(preview.isLocked())return false;
                const locked=UserDataProfiles.locked(state.row);
                const pools=locked?{...state.row.pools,...Object.fromEntries(Object.keys(context.poolContexts).map(id=>[id,UserDataProfiles.poolLocked(state.row,id)?state.row.pools[id]:meta.pools[id]]))}:meta.pools;
                const recordInitial=locked?{...(state.row.recordInitial||{}),...Object.fromEntries(Object.keys(context.poolContexts).map(id=>[id,UserDataProfiles.poolLocked(state.row,id)?UserDataProfiles.initial(state.row,id,context.poolContexts[id].minorPities.length):meta.pools[id]]))}:meta.pools;
                const recordStats={...meta.recordStats};
                if(locked)for(const id of Object.keys(context.poolContexts)){
                    const summary=UserDataProfiles.summary(state.row,id);if(UserDataProfiles.summaryLocked(game,state.row,id))recordStats[id]=summary;
                }
                const saved={...state.row,id:state.row?.id||crypto.randomUUID(),purpose:state.purpose,...(state.purpose==='record'?{recordInitial:JSON.parse(JSON.stringify(recordInitial))}:{}),name:meta.name,en:meta.en,isDefault:state.defaultInput?state.defaultInput.checked:!!state.row?.isDefault,pools,balances:holdings.balances,owned:locked?state.row.owned:holdings.owned,economyProgress:holdings.economyProgress,recordStats};
                UserDataProfiles.save(game,saved,revision);revision++;
                const index=items.findIndex(row=>row.id===saved.id);if(index<0)items.push(saved);else items[index]=saved;
                if(saved.isDefault){items.forEach(other=>{if(other.id!==saved.id)other.isDefault=false;});cards.forEach(other=>{if(other!==state&&other.row)other.row.isDefault=false;});}
                state.row=saved;state.names={name:saved.name,en:saved.en};state.dirty=false;if(saved.isDefault)syncDefaultChecks();updateHeader();lockEditor();node('data-error').textContent='';return true;
            }});
        host.addEventListener('input',event=>{if(!event.target.matches('[data-start-search]'))state.dirty=true;});
        host.addEventListener('change',event=>{if(!event.target.matches('[data-start-search]'))state.dirty=true;});
        host.addEventListener('click',event=>{if(event.target.closest('[data-start-fill-low]'))state.dirty=true;});
        editor.open({autoFill:!preview.isLocked()&&!UserDataProfiles.locked(state.row)});lockEditor();
        window.refreshCustomDropdowns?.(purposeBox,true);
        bindAccountDrag();
        if(multi&&expanded)card.scrollIntoView({block:'nearest'});
        return card;
    }
    function showEmpty(){
        if(cards.length)return;
        const empty=document.createElement('p');empty.className='user-data-empty';empty.textContent=tr('还没有玩家数据。点击“新建数据”添加账号。','No player data yet. Choose New data to add an account.');node('data-list').append(empty);
    }
    function render(){
        node('data-error').textContent='';node('data-list').replaceChildren();cards=[];
        const data=UserDataProfiles.read(game);revision=data.revision;items=data.items;
        const multi=UserDataProfiles.mode()==='multi';node('data-new').hidden=!multi;node('data-merge').hidden=!multi;
        if(!multi){
            if(items.length>1){const note=document.createElement('p');note.className='eco-intro';note.textContent=tr('其他账号已保留，切换至多账号数据后可查看。','Other accounts are kept. Switch to multiple accounts to view them.');node('data-list').append(note);}
            addEditor(UserDataProfiles.defaultRow(items),true);
        }else{items.forEach((row,index)=>addEditor(row,window.PanelDefaults?.initial('user_data','accounts',index)??false));showEmpty();}
    }
    document.addEventListener('DOMContentLoaded',()=>{
        node('data-preview-toggle').onclick=()=>{
            BilingualInput.close();
            node('data-preview-fields').dispatchEvent(new Event('close'));
            if(preview.toggle())syncPreview();
        };
        // 自定义下拉使用额外节点；只阻止编辑控件，折叠标题仍可操作。
        node('data-preview-fields').addEventListener('click',event=>{
            if(preview.isLocked()&&!event.target.matches('[data-start-search]')&&event.target.closest('input,select,textarea,button,.custom-select-ui,.bilingual-input-toggle')){event.preventDefault();event.stopImmediatePropagation();}
        },true);
        new MutationObserver(()=>{if(preview.isLocked())syncPreview();}).observe(node('data-preview-fields'),{childList:true,subtree:true});
        syncPreview();
        renderSidebar();
        bilingual=BilingualInput.install({selector:'.player-account-name',resolve:input=>nameOptions.get(input)});
        try{
            if(!game)throw Error('Missing game');context=UserDataProfiles.accountContext(game);
            UserDataAccountsUI.initialize(game);
            const info=context.info;node('data-game-name').textContent=(ItemFormat.getLanguage()==='en'?info.enGameName||info.enName:null)||info.gameName||game;
            node('data-title').textContent=tr('📁 玩家数据','📁 Player data');node('data-new').textContent=tr('＋ 新建数据','＋ New data');
            node('data-merge').textContent=tr('融合数据','Merge data');
            const merger=UserDataMergeUI.mount({gameId:game,hasDrafts,afterSave:render});node('data-merge').onclick=()=>{if(!preview.isLocked())merger.open();};
            node('data-rules').textContent=window.getTrans('nav_currency_setup');node('data-rules').href='currency_setup.html?'+new URLSearchParams({gameId:game});
            node('data-note').textContent=tr('填写整个游戏账号的货币与持有，各卡池进度按启用的规则分别填写。','Enter shared account currencies and copies, plus progress for each pool’s enabled rules.');
            node('data-new').onclick=()=>{if(preview.isLocked()||UserDataProfiles.mode()!=='multi')return;node('data-list').querySelector('.user-data-empty')?.remove();addEditor(null,true);};render();
        }catch(error){node('data-new').disabled=true;report(error);}
    });
    window.addEventListener('beforeunload',event=>{if(hasDrafts()){event.preventDefault();event.returnValue='';}});
    window.addEventListener('pool-order-change',event=>{if(event.detail?.gameId===game)refreshPoolOrder();});
    function refreshSyncWarnings(){
        if(!context)return;
        try{
            const data=UserDataProfiles.read(game);
            if(data.revision!==revision&&!hasDrafts()){
                const expanded=new Map(cards.filter(card=>card.row).map(card=>[card.row.id,{open:card.element.open,details:Array.from(card.element.querySelectorAll('details')).map(detail=>detail.open)}]));
                render();
                cards.forEach(card=>{
                    const previous=expanded.get(card.row?.id);if(!previous)return;
                    if(UserDataProfiles.mode()==='multi')card.element.open=previous.open;
                    card.element.querySelectorAll('details').forEach((detail,index)=>{if(previous.details[index]!==undefined)detail.open=previous.details[index];});
                });
            }else cards.forEach(card=>{if(card.row)card.updateSyncWarning(data.items.find(row=>row.id===card.row.id));});
        }catch(error){report(error);}
    }
    window.addEventListener('focus',()=>{refreshPoolOrder();refreshSyncWarnings();});
    window.addEventListener('storage',event=>{
        const key=window.VersionStorage?window.VersionStorage.eventKey(event.key):event.key;
        if(key===UserDataProfiles.key(game)){refreshSyncWarnings();return;}
        if(key==='GM_Pool_Order_'+game){refreshPoolOrder();return;}
        if(key==='GM_Player_Data_Mode'&&context){
            if(hasDrafts()){showToast(tr('账号模式已更改，请先保存当前修改，再刷新页面切换。','Account mode changed. Save edits, then refresh to switch.'),'info');return;}
            try{render();}catch(error){report(error);}
        }
    });
})();
