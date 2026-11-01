(function () {
    'use strict';
    const tr = (zh, en) => (localStorage.getItem('GM_Lang') || 'zh') === 'en' ? en : zh;
    const gradient = colors => ({ color: colors[0], paint: { type:'linear', angle:135, stops:colors.map((color,i)=>({color,position:i*100/(colors.length-1)})) } });
    const presets = [
        ['暖金','Gold',{color:'#dfbf88'}], ['彩虹','Rainbow',gradient(['#ff526f','#ffac48','#f4df68','#60cd9b','#52a7ff','#b285f4'])],
        ['火焰','Flame',gradient(['#ffe078','#ff963b','#eb4855'])], ['极光','Aurora',gradient(['#54dcb4','#55a8ed','#b78cec'])],
        ['暮光','Twilight',gradient(['#f7bd85','#df8cba','#807dd4'])], ['冰川','Glacier',gradient(['#c5f4f2','#78beeb','#7a91d7'])]
    ];
    function toHSV(hex) {
        const [r,g,b]=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255),max=Math.max(r,g,b),min=Math.min(r,g,b),d=max-min;
        let h=d===0?0:max===r?((g-b)/d)%6:max===g?(b-r)/d+2:(r-g)/d+4;
        return {h:(h*60+360)%360,s:max===0?0:d/max,v:max};
    }
    function fromHSV(h,s,v) {
        const c=v*s,x=c*(1-Math.abs((h/60)%2-1)),m=v-c;
        const a=h<60?[c,x,0]:h<120?[x,c,0]:h<180?[0,c,x]:h<240?[0,x,c]:h<300?[x,0,c]:[c,0,x];
        return '#'+a.map(n=>Math.round((n+m)*255).toString(16).padStart(2,'0')).join('');
    }
    let active=null;
    function open({value,title,onApply,isLocked=()=>false}={}) {
        if(active || isLocked()) return;
        let draft=ColorStyle.normalize(value),selected=0,hsv=toHSV(draft.color),invalid=false;
        const owner=document.activeElement,dialog=document.createElement('dialog');active=dialog;
        dialog.className='paint-picker';dialog.setAttribute('aria-labelledby','paint-picker-title');dialog.setAttribute('data-unsaved-draft','');
        dialog.innerHTML=`<div class="paint-picker-top"><h2 id="paint-picker-title"></h2><button type="button" class="paint-picker-close" aria-label="${tr('关闭配色','Close color editor')}">×</button></div>
        <p>${tr('纯色或多色渐变，自由调整颜色节点和位置。应用后生效，取消不改动原配色。','Choose a solid or gradient, then adjust its colors and positions. Apply to keep your changes.')}</p>
        <div class="paint-picker-grid"><section><span class="paint-picker-label">${tr('效果预览','Preview')}</span><div class="paint-preview"></div><div class="paint-samples"><div class="paint-sample paint-sample-text">★ ${tr('稀有度','Rarity')}</div><div class="paint-sample"><span class="paint-sample-tag">${tr('标签','Tag')}</span></div></div>
        <div class="paint-modes">${[['solid','纯色','Solid'],['linear','线性渐变','Linear'],['radial','径向渐变','Radial']].map(([v,zh,en])=>`<button type="button" class="btn" data-paint-mode="${v}">${tr(zh,en)}</button>`).join('')}</div>
        <span class="paint-picker-label">${tr('预设配色','Presets')}</span><div class="paint-presets">${presets.map(([zh,en,p],i)=>`<button type="button" class="paint-preset" data-paint-preset="${i}"><span style="background:${ColorStyle.background(p)}"></span>${tr(zh,en)}</button>`).join('')}</div>
        <div class="paint-gradient-options"><div class="paint-angle"><label for="paint-angle">${tr('方向角度','Angle')}</label><input id="paint-angle" class="input-box" type="number" min="0" max="360" value="135"><span>°</span></div><div class="paint-stop-list"></div><button type="button" class="btn paint-add-stop">＋ ${tr('添加颜色节点','Add color stop')}</button></div></section>
        <section><span class="paint-picker-label">${tr('编辑选中颜色','Edit selected color')}</span><div class="paint-sv" tabindex="0" role="group" aria-label="${tr('饱和度与明度，方向键调整，Shift 加速','Saturation and brightness. Arrow keys adjust; Shift moves faster.')}" aria-describedby="paint-pad-hint"><span class="paint-sv-cursor"></span></div><input type="range" class="paint-hue" min="0" max="359" step="1" aria-label="${tr('色相','Hue')}"><label class="paint-hex-label">${tr('十六进制颜色','Hex color')}<input class="input-box paint-hex" maxlength="7" spellcheck="false" aria-label="${tr('十六进制颜色','Hex color')}"></label><p class="paint-picker-error" role="status"></p><p id="paint-pad-hint">${tr('在色板上拖动，或用方向键微调饱和度与明度；也可直接输入 #RRGGBB 色值。','Drag in the color field, use arrow keys, or enter a #RRGGBB value.')}</p></section></div>
        <div class="paint-picker-footer"><button type="button" class="btn paint-cancel">${tr('取消','Cancel')}</button><button type="button" class="btn paint-apply">${tr('应用配色','Apply colors')}</button></div>`;
        dialog.querySelector('h2').textContent=title||tr('自定义配色','Custom colors');
        const q=s=>dialog.querySelector(s),pad=q('.paint-sv'),hex=q('.paint-hex'),hue=q('.paint-hue');
        q('.paint-picker-grid').appendChild(q('.paint-gradient-options'));
        const stopHeading=document.createElement('span');stopHeading.className='paint-picker-label';stopHeading.textContent=tr('颜色节点 · 位置 (%)','Color stops · Position (%)');q('.paint-stop-list').before(stopHeading);
        const current=()=>draft.paint?draft.paint.stops[selected].color:draft.color;
        function setColor(color) { if(draft.paint){draft.paint.stops[selected].color=color;draft.color=draft.paint.stops[0].color;}else draft.color=color; }
        function preview() {
            const bg=ColorStyle.background(draft);q('.paint-preview').style.background=bg;
            q('.paint-sample-text').style.cssText=ColorStyle.text(draft);
            q('.paint-sample-tag').style.cssText=`background:${bg};color:${ColorStyle.contrast(draft)};`;
            dialog.querySelectorAll('[data-paint-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.paintMode===(draft.paint?.type||'solid'))));
            q('.paint-gradient-options').hidden=!draft.paint;q('.paint-angle').hidden=draft.paint?.type!=='linear';
            q('.paint-add-stop').disabled=(draft.paint?.stops.length||0)>=8;
            q('.paint-apply').disabled=invalid;q('.paint-picker-error').textContent=invalid?tr('请输入有效的颜色，例如 #FF963B。','Enter a valid color, such as #FF963B.'):'';
            dialog.querySelectorAll('.paint-stop').forEach((row,i)=>{row.dataset.selected=String(i===selected);row.querySelector('.paint-stop-chip').style.background=draft.paint.stops[i].color;row.querySelector('.paint-stop-name').textContent=draft.paint.stops[i].color.toUpperCase();});
        }
        function sync() { hsv=toHSV(current());hex.value=current().toUpperCase();hue.value=Math.round(hsv.h);pad.style.setProperty('--picker-hue',fromHSV(hsv.h,1,1));q('.paint-sv-cursor').style.cssText=`left:${hsv.s*100}%;top:${(1-hsv.v)*100}%;`;invalid=false;preview(); }
        function stops() {
            q('.paint-stop-list').innerHTML=(draft.paint?.stops||[]).map((s,i)=>`<div class="paint-stop" data-stop="${i}"><button type="button" class="paint-stop-chip" aria-label="${tr('编辑节点','Edit stop')} ${i+1}"></button><button type="button" class="paint-stop-name" aria-label="${tr('编辑节点','Edit stop')} ${i+1}"></button><input class="input-box" type="number" min="0" max="100" step="1" value="${s.position}" aria-label="${tr('节点位置百分比','Stop position percent')} ${i+1}"><button type="button" class="paint-stop-remove" aria-label="${tr('删除节点','Remove stop')} ${i+1}" ${draft.paint.stops.length<=2?'disabled':''}>×</button></div>`).join('');
            q('#paint-angle').value=draft.paint?.angle??135;sync();
        }
        dialog.addEventListener('click',e=>{
            const mode=e.target.closest('[data-paint-mode]')?.dataset.paintMode,preset=e.target.closest('[data-paint-preset]')?.dataset.paintPreset;
            if(mode){draft=mode==='solid'?{color:current()}:{color:draft.color,paint:draft.paint?{...draft.paint,type:mode}:{type:mode,angle:135,stops:[{color:draft.color,position:0},{color:'#ffffff',position:100}]}};selected=0;stops();}
            if(preset!==undefined){draft=ColorStyle.normalize(presets[Number(preset)][2]);selected=0;stops();}
            const row=e.target.closest('[data-stop]');if(row){const index=Number(row.dataset.stop);if(e.target.closest('.paint-stop-remove')){draft.paint.stops.splice(index,1);selected=Math.min(selected,draft.paint.stops.length-1);stops();}else if(e.target.closest('button')){selected=index;sync();}}
        });
        q('.paint-stop-list').addEventListener('change',e=>{if(e.target.matches('input')){const i=Number(e.target.closest('[data-stop]').dataset.stop);draft.paint.stops[i].position=Math.max(0,Math.min(100,Number(e.target.value)||0));const item=draft.paint.stops[selected];draft.paint.stops.sort((a,b)=>a.position-b.position);selected=draft.paint.stops.indexOf(item);stops();}});
        q('.paint-add-stop').onclick=()=>{if(!draft.paint||draft.paint.stops.length>=8)return;let best=[0,100];const positions=draft.paint.stops.map(s=>s.position).sort((a,b)=>a-b);let gap=-1;for(let i=1;i<positions.length;i++)if(positions[i]-positions[i-1]>gap){best=[positions[i-1],positions[i]];gap=best[1]-best[0];}const added={color:current(),position:Math.round((best[0]+best[1])/2)};draft.paint.stops.push(added);draft.paint.stops.sort((a,b)=>a.position-b.position);selected=draft.paint.stops.indexOf(added);stops();};
        q('#paint-angle').oninput=e=>{if(draft.paint){draft.paint.angle=Math.max(0,Math.min(360,Number(e.target.value)||0));preview();}};
        function hsvChange(){setColor(fromHSV(hsv.h,hsv.s,hsv.v));hex.value=current().toUpperCase();pad.style.setProperty('--picker-hue',fromHSV(hsv.h,1,1));q('.paint-sv-cursor').style.cssText=`left:${hsv.s*100}%;top:${(1-hsv.v)*100}%;`;invalid=false;preview();}
        function pointer(e){const r=pad.getBoundingClientRect();hsv.s=Math.max(0,Math.min(1,(e.clientX-r.left)/r.width));hsv.v=1-Math.max(0,Math.min(1,(e.clientY-r.top)/r.height));hsvChange();}
        pad.onpointerdown=e=>{if(e.button!==0)return;e.preventDefault();pad.focus();pad.setPointerCapture(e.pointerId);pointer(e);};pad.onpointermove=e=>{if(pad.hasPointerCapture(e.pointerId))pointer(e);};pad.onpointerup=e=>{if(pad.hasPointerCapture(e.pointerId))pad.releasePointerCapture(e.pointerId);};
        pad.onkeydown=e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();const step=e.shiftKey ? .1 : .01;hsv.s=Math.max(0,Math.min(1,hsv.s+(e.key==='ArrowRight'?step:e.key==='ArrowLeft'?-step:0)));hsv.v=Math.max(0,Math.min(1,hsv.v+(e.key==='ArrowUp'?step:e.key==='ArrowDown'?-step:0)));hsvChange();};
        hue.oninput=e=>{hsv.h=Number(e.target.value);hsvChange();};hex.oninput=()=>{invalid=!/^#(?:[\da-f]{3}|[\da-f]{6})$/i.test(hex.value);if(!invalid){setColor(ColorStyle.hex(hex.value));const typed=hex.value;sync();hex.value=typed;}else preview();};hex.onblur=()=>{if(!invalid)hex.value=current().toUpperCase();};
        q('.paint-apply').onclick=()=>{if(invalid)return;if(!isLocked())onApply?.(ColorStyle.normalize(draft));dialog.close();};
        q('.paint-cancel').onclick=q('.paint-picker-close').onclick=()=>dialog.close();
        dialog.addEventListener('close',()=>{active=null;dialog.remove();if(owner?.isConnected)owner.focus();},{once:true});
        document.body.appendChild(dialog);stops();dialog.showModal();q('.paint-picker-close').focus();
    }
    window.ColorPicker=Object.freeze({open,presets,toHSV,fromHSV});
})();
