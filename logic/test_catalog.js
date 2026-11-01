/** 预设游戏与测试图鉴的显示策略；隐藏不删除账户、规则或记录。 */
(function(){
    'use strict';
    const key='GM_Show_Test_Catalog';
    const presetKeys=Object.freeze({hsr:'GM_Show_Preset_hsr',zzz:'GM_Show_Preset_zzz',ark:'GM_Show_Preset_ark',end:'GM_Show_Preset_end'});
    const isVisibilityKey=value=>value===key||Object.values(presetKeys).includes(value);
    const enabled=()=>{try{return localStorage.getItem(key)==='true';}catch{return false;}};
    const visible=id=>{if(id==='test')return enabled();try{return !presetKeys[id]||localStorage.getItem(presetKeys[id])!=='false';}catch{return true;}};
    function hiddenUrl(url){try{return !visible(new URL(url,window.location.href).searchParams.get('gameId'));}catch{return false;}}
    function guard(){
        if(hiddenUrl(window.location.href)){
            document.documentElement.hidden=true;
            window.location.replace('html/index.html');return false;
        }
        return true;
    }
    function normalizeStart(){
        const start=localStorage.getItem('GM_Start_Page');
        if(start&&hiddenUrl(start))localStorage.setItem('GM_Start_Page','html/index.html');
    }
    function refresh(){normalizeStart();if(guard())window.renderSidebar?.();}
    window.TestCatalog=Object.freeze({key,presetKeys,isVisibilityKey,enabled,visible,hiddenUrl,guard,normalizeStart,refresh});
    normalizeStart();guard();
    window.addEventListener('storage',event=>{const changed=window.VersionStorage?window.VersionStorage.eventKey(event.key):event.key;if(changed===null||isVisibilityKey(changed))refresh();});
    window.addEventListener('pageshow',guard);
})();
