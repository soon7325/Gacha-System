/** 玩家账户的共用界面接线；迁移与保存由 logic 层处理。 */
(function () {
    'use strict';
    const text = (zh, en) => ItemFormat.getLanguage() === 'en' ? en : zh;

    function initialize(gameId) {
        const result = UserDataTools.ensureDefault(gameId);
        if (result.legacyCreated) {
            showToast(text('旧记录已转换为“旧数据账户”，可在多账号模式下管理或删除。',
                'Legacy records are now a Legacy data account, manageable or deletable in multiple-account mode.'), 'success');
        } else if (result.created) {
            showToast(text('已自动建立空白默认账号。', 'An empty default account was created.'), 'success');
        }
        if (result.errors.length) showToast(text('部分旧记录无法读取，原记录已保留。',
            'Some legacy records could not be read; the originals were kept.'), 'warn');
        return result;
    }

    // 先验证上次选择是否仍存在，再回退默认账户；不保存选择或触发 change。
    function fillSelect(select, rows, { selectedId = null } = {}) {
        const selected = rows.find(row => row.id === selectedId) || UserDataProfiles.defaultRow(rows);
        select.replaceChildren();
        select.disabled = !rows.length;
        if (!rows.length) {
            const option = document.createElement('option');
            option.value = ''; option.textContent = text('暂无数据', 'No saved data'); select.append(option);
        }
        for (const row of rows) {
            const option = document.createElement('option');
            option.value = row.id;
            option.textContent = UserDataProfiles.label(row);
            option.selected = row.id === selected?.id;
            select.append(option);
        }
        select.value = selected?.id || '';
        return selected;
    }

    // 只跟踪列表的顺序与显示信息；记录内容变化不重建正在编辑的表单。
    function watch(gameId,onChange,{active=()=>true}={}){
        let signature;
        const inspect=()=>{
            const rows=UserDataProfiles.read(gameId).items;
            return {rows,signature:JSON.stringify([UserDataProfiles.mode(),rows.map(row=>[row.id,row.name,row.en,row.purpose,row.isDefault])])};
        };
        try{signature=inspect().signature;}catch{}
        const refresh=()=>{
            if(!active())return;
            try{const next=inspect();if(next.signature===signature)return;onChange(next.rows);signature=next.signature;}catch{}
        };
        const storage=event=>{
            const key=window.VersionStorage?window.VersionStorage.eventKey(event.key):event.key;
            if(key===UserDataProfiles.key(gameId)||key==='GM_Player_Data_Mode'||key===null)refresh();
        };
        const changed=event=>{if(event.detail?.gameId===gameId)refresh();};
        window.addEventListener('focus',refresh);window.addEventListener('storage',storage);window.addEventListener('user-data-accounts-change',changed);
        return Object.freeze({refresh,destroy(){window.removeEventListener('focus',refresh);window.removeEventListener('storage',storage);window.removeEventListener('user-data-accounts-change',changed);}});
    }
    window.UserDataAccountsUI = Object.freeze({ initialize, fillSelect, watch });
})();
