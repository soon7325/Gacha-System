/** 默认图鉴显示多选器；只更新设置界面，继续沿用原有独立显示偏好。 */
(function(){
    'use strict';
    function refresh(){
        const picker=document.getElementById('preset-visibility-picker');if(!picker)return;
        const inputs=Array.from(picker.querySelectorAll('[data-preset-visibility]'));
        inputs.forEach(input=>input.checked=window.TestCatalog.visible(input.dataset.presetVisibility));
        const selected=inputs.filter(input=>input.checked),text=selected.length?selected.map(input=>{const key='game_'+input.dataset.presetVisibility;return window.getTrans(key);}).join(' / '):window.getTrans('set_preset_none');
        const current=document.getElementById('preset-visibility-current');current.textContent=text;current.title=text;
        document.getElementById('preset-visibility-count').textContent=selected.length+'/'+inputs.length;
    }
    window.PresetVisibilityPicker=Object.freeze({refresh});
    document.addEventListener('DOMContentLoaded',()=>{
        const picker=document.getElementById('preset-visibility-picker');if(!picker)return;
        const summary=picker.querySelector('summary');
        picker.addEventListener('toggle',()=>summary.setAttribute('aria-expanded',String(picker.open)));
        picker.addEventListener('keydown',event=>{if(event.key==='Escape'&&picker.open){picker.open=false;event.stopPropagation();summary.focus();}});
        document.addEventListener('click',event=>{if(picker.open&&!picker.contains(event.target))picker.open=false;});
        refresh();
    });
})();
