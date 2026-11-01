/** 模拟器的数据入口；所有应用操作由页面控制。 */
(function(){
    'use strict';
    function mount({gameId,poolId,isBusy,apply,create,blank,continueCurrent,currencyEnabled}){
        const tr=(zh,en)=>localStorage.getItem('GM_Lang')==='en'?en:zh;
        const dialog=document.createElement('dialog');dialog.className='sim-wallet-dialog';dialog.id='sim-profile-picker';document.body.append(dialog);
        let useCurrency=null,selectedId=null,rows=[],accountSelect=null,applyButton=null;
        UserDataAccountsUI.watch?.(gameId,items=>{
            rows=UserDataProfiles.visibleRows(items);
            selectedId=UserDataAccountsUI.fillSelect(accountSelect,rows,{selectedId:accountSelect.value})?.id||null;
            applyButton.disabled=!rows.length;
            window.refreshCustomDropdowns?.(dialog,true);
        },{active:()=>dialog.open&&!!accountSelect});
        function open(){
            if(isBusy())return;
            try{
                if(window.UserDataTools)UserDataTools.ensureDefault(gameId);
                rows=UserDataProfiles.visibleRows(UserDataProfiles.read(gameId).items);
                dialog.replaceChildren();
                const title=document.createElement('h3');title.textContent=tr('选择玩家数据','Choose player data');dialog.append(title);
                const note=document.createElement('p');note.className='sim-wallet-note';note.textContent=tr('选择本游戏的玩家账号数据，当前卡池使用自己的垫抽与井进度。应用会清空当前结果；货币模式下将同时恢复账号共享持有及各卡池进度。','Choose a player account for this game. Each pool uses its own pity and spark progress. Applying clears current results; currency mode also restores shared holdings and all pool progress.');dialog.append(note);
                if(useCurrency===null)useCurrency=!!currencyEnabled?.();
                const mode=document.createElement('label');mode.className='sim-profile-mode';
                const toggle=document.createElement('input');toggle.type='checkbox';toggle.checked=useCurrency;
                toggle.onchange=()=>{useCurrency=toggle.checked;};
                mode.append(toggle,document.createTextNode(tr('本次启用货币系统','Use currency mode for this visit')));dialog.append(mode);
                const modeNote=document.createElement('p');modeNote.className='sim-wallet-note';modeNote.textContent=tr('关闭后不扣除货币；新建数据仅填写垫抽、保底和井等规则进度，不修改设置页开关。','Turn off to pull without currency. New data includes only pity, guarantees and spark progress. Your settings stay unchanged.');dialog.append(modeNote);
                const options=document.createElement('div');options.className='sim-profile-options';
                const label=document.createElement('label');label.textContent=tr('已保存的玩家账号数据','Saved player accounts');
                const select=document.createElement('select');select.className='input-box';
                accountSelect=select;
                UserDataAccountsUI.fillSelect(select,rows,{selectedId});select.onchange=()=>{selectedId=select.value;};label.append(select);options.append(label);dialog.append(options);
                const actions=document.createElement('div');actions.className='sim-wallet-footer';
                const button=(text,action,primary=false)=>{const button=document.createElement('button');button.type='button';button.className='btn '+(primary?'btn-blue':'btn-action-gray');button.textContent=text;button.onclick=async()=>{if(isBusy()||button.disabled)return;button.disabled=true;try{if(await action()!==false&&dialog.open)dialog.close();}finally{button.disabled=false;}};actions.append(button);return button;};
                button(tr('继续当前进度','Continue current progress'),()=>continueCurrent(useCurrency));
                button(tr('空白进入','Start blank'),()=>blank(useCurrency));
                if(UserDataProfiles.mode()==='multi')button(tr('新建数据','New data'),()=>create(useCurrency));
                applyButton=button(tr('使用所选数据','Use selected data'),()=>apply(rows.find(r=>r.id===select.value),useCurrency),true);applyButton.disabled=!rows.length;
                dialog.append(actions);
                const manage=document.createElement('a');manage.href='user_data.html?'+new URLSearchParams({gameId,pool:poolId});manage.textContent=tr('管理玩家数据与货币规则','Manage player data and currency rules');dialog.append(manage);
                if(!dialog.open)dialog.showModal();
            }catch(error){showToast(tr('无法读取模拟数据，请检查本机存储。','Unable to read simulation data. Check local storage.'),'danger');return false;}
            return true;
        }
        return Object.freeze({open});
    }
    window.SimulatorDataPickerUI=Object.freeze({mount});
})();
