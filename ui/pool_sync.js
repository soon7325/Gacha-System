/** 玩家数据页与看板共用的本地同步预览。 */
(function(){
    'use strict';
    const tr=(zh,en)=>localStorage.getItem('GM_Lang')==='en'?en:zh;
    function element(tag,text,className){
        const node=document.createElement(tag);
        if(text)node.textContent=text;
        if(className)node.className=className;
        return node;
    }
    function button(label,fn){
        const node=element('button',label,'btn btn-action-gray');
        node.type='button';node.onclick=fn;return node;
    }
    function option(select,value,label){select.add(new Option(label,value));}
    function context(game,pool){
        const base=GameData.loadContext({gameId:game,poolId:pool});
        return DashboardAccounts.validationContext(pool,base.rules,base.globalTiers,base.catalog);
    }
    function reason(error){
        const messages={
            conflict:tr('数据已更改，请重新打开预览。','Data changed. Reopen the preview.'),
            invalid_history:tr('请先修正异常记录。','Correct the invalid records first.'),
            owned_conflict:tr('当前持有不足以撤回旧贡献。','Inventory is insufficient to reverse the previous contribution.')
        };
        return messages[error.message]||error.message;
    }
    function open({game,account,pool,afterSave,canWrite=()=>true}){
        const dialog=element('dialog',null,'pool-sync-dialog');
        const title=element('h3',tr('同步与修复','Sync and repair'));
        dialog.setAttribute('aria-label',title.textContent);
        const scope=element('select'),list=element('div'),feedback=element('p');
        scope.setAttribute('aria-label',tr('同步范围','Sync scope'));
        if(pool)option(scope,'pool',tr('仅此卡池','This pool'));
        else{
            option(scope,'game',tr('当前游戏','Current game'));
            option(scope,'all',tr('全部游戏','All games'));
        }
        const actions=element('div',null,'pool-sync-actions');
        const apply=button(tr('确认执行所选操作','Apply selected actions'),commit);
        const undo=button(tr('撤销本次操作','Undo this operation'),rollback);
        const close=button(tr('关闭','Close'),()=>dialog.close());
        feedback.setAttribute('role','status');
        dialog.append(title);
        const accounts=element('select');
        if(!pool){
            dialog.append(scope);
            const rows=UserDataProfiles.visibleRows(UserDataProfiles.read(game).items.filter(r=>UserDataProfiles.purpose(r)==='record'));
            for(const row of rows)option(accounts,row.id,UserDataProfiles.label(row));
            accounts.value=UserDataProfiles.defaultRow(rows)?.id||'';
            accounts.setAttribute('aria-label',tr('选择账号','Choose account'));
            if(rows.length>1)dialog.append(accounts);
        }
        dialog.append(list,feedback,actions);actions.append(close,undo,apply);
        let choices=[],changes=[],revisions=new Map();
        function refresh(){
            list.replaceChildren();choices=[];revisions=new Map();
            const games=new Set([game]);
            if(scope.value==='all')for(let i=0;i<localStorage.length;i++){
                const key=localStorage.key(i);
                if(key?.startsWith('GM_Sim_Profiles_'))games.add(key.slice('GM_Sim_Profiles_'.length));
            }
            for(const id of games){
                try{
                    const data=UserDataProfiles.read(id);
                    revisions.set(id,data.revision);
                    const visible=UserDataProfiles.visibleRows(data.items.filter(r=>UserDataProfiles.purpose(r)==='record'));
                    for(const row of visible){
                        if(scope.value!=='all'&&row.id!==(account||accounts.value))continue;
                        for(const key of Object.keys(row.dashboardRecords||{})){
                            if(pool&&key!==pool)continue;
                            addRow(id,row,key);
                        }
                    }
                }catch(error){list.append(element('p',id+' · '+reason(error)));}
            }
            if(!list.childElementCount)list.append(element('p',tr('此范围内没有待同步或需要修复的卡池。','No pending syncs or repairs in this scope.')));
            update();
        }
        function addRow(id,row,key){
            const status=DashboardAccounts.status(row,key,()=>context(id,key));
            if(!status)return;
            const entry=row.dashboardRecords[key],snap={row,entry,records:entry.records};
            const group=element('section'),head=element('label'),check=element('input');
            check.type='checkbox';
            const info=GameData.loadGameInfo(id),meta=GameData.loadPoolMeta(id,key);
            const label=tr(info.gameName,info.enGameName)||info.gameName||id;
            const path=[label,UserDataProfiles.label(row),UserDataProfiles.label(meta)].join(' › ');
            head.append(check,document.createTextNode(path));group.append(head);list.append(group);
            const pending=status.reason==='pending';
            if(!pending&&!['baseline_changed','owned_conflict'].includes(status.reason)){
                check.disabled=true;
                group.append(element('p',status.reason==='invalid_history'?tr('请在录入页修正第 '+status.recordNumber+' 条记录。','Correct record '+status.recordNumber+' on the input page.'):tr('暂时无法确认同步状态。','Sync status is unavailable.')));
                return;
            }
            check.checked=true;
            const mode=element('select'),detail=element('p');
            mode.setAttribute('aria-label',path);
            if(pending)option(mode,'sync',tr('同步已保存的记录','Sync saved records'));
            else{
                if(status.reason==='owned_conflict')group.append(element('p',reason(Error('owned_conflict'))));
                else group.append(element('p',tr('当前 '+status.recordCount+' 条，旧基准 '+status.baselineCount+' 条。第 '+status.firstDifference+' 条起不同。','Current records: '+status.recordCount+'. Previous baseline: '+status.baselineCount+'. First difference at record '+status.firstDifference+'.')));
                option(mode,'',tr('选择修复方向','Choose a repair direction'));
                option(mode,'player',tr('保留玩家数据，从当前记录继续','Keep player data and continue from current records'));
                option(mode,'dashboard',tr('按 Dashboard 记录重算玩家进度','Recalculate player progress from Dashboard records'));
            }
            group.append(mode,detail);
            const choice={id,key,account:row.id,path,check,mode,ready:false};choices.push(choice);
            function preview(){
                choice.ready=false;detail.textContent='';
                if(mode.value==='sync')choice.ready=true;
                else if(mode.value)try{
                    const plan=DashboardAccounts.repairPlan(snap,key,mode.value,context(id,key));
                    const {before,after}=plan;
                    const summary=tr('累计抽数','Pulls')+' '+before.total+' → '+after.total+' · '+tr('出金','Gold')+' '+before.goldCount+' → '+after.goldCount+' · '+tr('垫抽','Pity')+' '+before.pity+' → '+after.pity;
                    const items=Object.entries(plan.delta).map(([item,n])=>JSON.parse(item)[1]+' '+(n>0?'+':'')+n);
                    detail.textContent=summary+' · '+(items.length?tr('持有调整 ','Inventory changes ')+items.join(', '):tr('现有持有保留','Keep current inventory'));
                    choice.ready=true;
                }catch(error){detail.textContent=reason(error);}
                update();
            }
            mode.onchange=preview;check.onchange=update;preview();
        }
        function update(){
            const selected=choices.filter(c=>c.check.checked);
            apply.disabled=!canWrite()||!selected.length||selected.some(c=>!c.ready);
            undo.hidden=!changes.length;
        }
        function commit(){
            if(apply.disabled||!canWrite())return;
            const errors=[],done=[];
            for(const c of choices.filter(c=>c.check.checked)){
                try{
                    const snap=DashboardAccounts.read(c.id,c.key,c.account);
                    if(snap.revision!==revisions.get(c.id))throw Error('conflict');
                    const ctx=context(c.id,c.key);
                    if(c.mode.value==='sync'){
                        const result=DashboardAccounts.save(c.id,c.key,c.account,snap.records,snap,ctx,true,{includeExisting:localStorage.getItem('GM_Dashboard_Sync_Existing')==='true'});
                        if(!result.synced)throw Error('invalid_history');
                    }else DashboardAccounts.repair(c.id,c.key,c.account,snap,c.mode.value,ctx);
                    const latest=DashboardAccounts.read(c.id,c.key,c.account);
                    done.push({id:c.id,before:snap.row,after:latest.row});
                    revisions.set(c.id,latest.revision);
                }catch(error){errors.push(c.path+' · '+reason(error));}
            }
            if(done.length){changes=done;afterSave();}
            feedback.textContent=[tr('已完成 '+done.length+' 个卡池。','Completed '+done.length+' pools.'),...errors].join('\n');
            refresh();
        }
        function rollback(){
            if(!canWrite())return;
            try{
                while(changes.length){
                    const c=changes.at(-1),data=UserDataProfiles.read(c.id);
                    if(JSON.stringify(data.items.find(r=>r.id===c.before.id))!==JSON.stringify(c.after))throw Error('conflict');
                    UserDataProfiles.save(c.id,c.before,data.revision);changes.pop();
                }
                feedback.textContent=tr('已撤销本次操作。','Operation undone.');
            }catch(error){feedback.textContent=reason(error);}
            afterSave();refresh();
        }
        accounts.onchange=refresh;
        scope.onchange=()=>{accounts.hidden=scope.value==='all';refresh();};
        document.body.append(dialog);dialog.onclose=()=>dialog.remove();refresh();dialog.showModal();
    }
    window.PoolSyncUI=Object.freeze({open});
})();
