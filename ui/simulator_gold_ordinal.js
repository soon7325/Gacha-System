/** 模拟器分组末尾的累计出金数；显示选择与跳金锚点分开维护。 */
(function(){
    'use strict';
    let nextId=0;
    function select(row){
        const selected=row.dataset.simOrdinalSelected==='true';
        document.querySelectorAll('#sim-results [data-sim-ordinal-selected="true"]').forEach(other=>{delete other.dataset.simOrdinalSelected;});
        if(!selected)row.dataset.simOrdinalSelected='true';
    }
    function decorate(row,numbers){
        const items=row.querySelector('.sim-items-wrap');if(!items)return;
        let label=items.querySelector('.sim-batch-gold-ordinal');
        if(!label){
            label=document.createElement('span');label.className='sim-batch-gold-ordinal';label.id='sim-gold-ordinal-'+(++nextId);
            items.append(label);row.classList.add('sim-has-gold-ordinal');row.tabIndex=0;row.setAttribute('role','group');row.setAttribute('aria-describedby',label.id);
            row.addEventListener('click',()=>select(row));
            row.addEventListener('keydown',event=>{if(event.target===row&&(event.key==='Enter'||event.key===' ')){event.preventDefault();row.click();}});
        }
        const number=numbers.map(n=>'#'+n).join('、');if(label.textContent!==number)label.textContent=number;
        label.hidden=numbers.length===0;
        row.classList.toggle('sim-has-gold-ordinal',numbers.length>0);
        label.title=(window.getTrans?.('sim_gold_ordinal_total')||'Gold: {n}').replace('{n}',number);
        row.dataset.simGoldTotal=numbers.length?String(numbers[numbers.length-1]):'';
    }
    window.SimulatorGoldOrdinal=Object.freeze({decorate});
})();
