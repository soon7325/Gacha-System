/** 通用状态开关。配合 state_toggle.css；使用原生 checkbox 的 checked、disabled 和 input/change 事件。 */
(function(){
    'use strict';
    const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    function render({label,checked=false,disabled=false,onText='On',offText='Off',name='',id='',data={}}){
        const attributes=Object.entries(data).filter(([key])=>/^[a-z][a-zA-Z0-9]*$/.test(key)).map(([key,value])=>`data-${key.replace(/[A-Z]/g,c=>'-'+c.toLowerCase())}="${esc(value)}"`).join(' ');
        return `<label class="state-toggle-label">${esc(label)}<span class="state-toggle-field"><input type="checkbox" role="switch" aria-label="${esc(label)}" ${attributes} ${name?`name="${esc(name)}"`:''} ${id?`id="${esc(id)}"`:''} ${checked?'checked':''} ${disabled?'disabled':''}><span class="state-toggle-status" aria-hidden="true"><span class="state-toggle-off">${esc(offText)}</span><span class="state-toggle-on">${esc(onText)}</span></span><span class="state-toggle-track" aria-hidden="true"></span></span></label>`;
    }
    window.StateToggle=Object.freeze({render});
})();
