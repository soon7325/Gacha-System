/** Bulk display preferences. Per-page controls remain independent afterwards. */
(function () {
    'use strict';
    const panelSizes = {
        pool_setup: {sections:'large',rules:'small'},
        gallery_setup: {engine:'large',configuration:'small',categories:'large',tiers:'small'},
        currency_setup: {sections:'large',groups:'medium',rules:'small'},
        user_data: {accounts:'large',sections:'medium',pools:'small',tiers:'small',exchanges:'small'},
        simulator: {configuration:'large',probability:'large',sections:'large',pools:'small',tiers:'small',wallet:'large',exchanges:'medium'}
    };
    const parts = ['content','header','columns','arrangement','alignment','browsing','singleFill','pageSize','scrolling','goldOrdinal','large','medium','small'];
    const options = part => part === 'content' ? ['center','left','right','full'] : part === 'header' ? ['full','follow'] : part === 'columns' ? ['1','2','3','4','5','6','auto'] : part==='arrangement' ? ['continuous','row','column','category'] : part==='alignment' ? ['natural','rows','packed'] : part==='browsing' ? ['scroll','pages','single'] : part==='singleFill' ? ['one','fit'] : part==='pageSize' ? ['3','6','9','12','18','24'] : part==='scrolling' ? ['linked','independent'] : part === 'goldOrdinal' ? ['show','hide','hover','click'] : ['recommended',...PanelDefaults.modes];
    function recommended(part) {
        return Object.entries(panelSizes).every(([page,levels]) => Object.entries(levels).every(([level,size]) => size !== part || PanelDefaults.read(page,level) === PanelDefaults.definitions[page][level][1]));
    }
    function values(part) {
        if (part === 'content' || part === 'header') return Object.keys(PageLayout.definitions).map(page => PageLayout.read(page,part));
        if (['columns','arrangement','alignment','browsing','singleFill','pageSize','scrolling'].includes(part)) return Object.keys(window.ContentColumns?.definitions || {}).map(page => window.ContentColumns.read(page)[part]);
        if (part === 'goldOrdinal') return [window.GoldOrdinal?.read() || 'hover'];
        return Object.entries(panelSizes).flatMap(([page,levels]) => Object.entries(levels).filter(([,size]) => size === part).map(([level]) => PanelDefaults.read(page,level)));
    }
    function read(part) {
        if (!parts.includes(part)) return null;
        if (['large','medium','small'].includes(part) && recommended(part)) return 'recommended';
        if(part==='arrangement'&&window.ContentColumns&&Object.keys(window.ContentColumns.definitions).every(page=>window.ContentColumns.read(page).arrangement===(window.ContentColumns.categoryPages.includes(page)?'category':'column')))return 'category';
        const current=values(part); return current.length && current.every(value => value === current[0]) ? current[0] : '';
    }
    function set(part,value) {
        if (!parts.includes(part) || !options(part).includes(value)) return false;
        if (part === 'content' || part === 'header') {
            for (const page of Object.keys(PageLayout.definitions)) PageLayout.set(page,part,value);
        } else if (['columns','arrangement','alignment','browsing','singleFill','pageSize','scrolling'].includes(part)) {
            if(part==='scrolling'&&Object.keys(window.ContentColumns?.definitions||{}).some(page=>window.ContentColumns.locked(window.ContentColumns.read(page))))return false;
            if(part==='arrangement'&&value==='continuous'&&Object.keys(window.ContentColumns?.definitions||{}).some(page=>window.ContentColumns.read(page).browsing==='pages'))return false;
            for (const page of Object.keys(window.ContentColumns?.definitions || {})) {
                const target=part==='arrangement'&&value==='category'&&!window.ContentColumns.categoryPages.includes(page)?'column':value;
                window.ContentColumns.set(page,part,target);
            }
        } else if (part === 'goldOrdinal') {
            if (!window.GoldOrdinal?.set(value)) return false;
        } else {
            for (const [page,levels] of Object.entries(panelSizes)) for (const [level,size] of Object.entries(levels)) if (size === part) PanelDefaults.set(page,level,value === 'recommended' ? PanelDefaults.definitions[page][level][1] : value);
        }
        refresh(); window.refreshCustomDropdowns?.(document,false); return true;
    }
    function refresh() {
        document.querySelectorAll('select[data-global-display]').forEach(select => {
            const value=read(select.dataset.globalDisplay);
            const single=read('browsing')==='single';
            if(['columns','arrangement','alignment','scrolling','large'].includes(select.dataset.globalDisplay))select.closest('.setting-item').hidden=single||select.dataset.globalDisplay==='alignment'&&read('arrangement')!=='row';
            if(!single&&select.dataset.globalDisplay==='alignment')select.closest('.setting-item').hidden=read('arrangement')!=='row';
            if(select.dataset.globalDisplay==='singleFill')select.closest('.setting-item').hidden=!single;
            if(select.dataset.globalDisplay==='pageSize')select.closest('.setting-item').hidden=read('browsing')!=='pages';
            if(select.dataset.globalDisplay==='arrangement'){const continuous=select.querySelector('option[value="continuous"]');if(continuous)continuous.disabled=Object.keys(window.ContentColumns?.definitions||{}).some(page=>window.ContentColumns.read(page).browsing==='pages');}
            if (select.value !== value) { select.value=value; window.refreshCustomDropdowns?.(select.parentElement,false); }
            if(select.dataset.globalDisplay==='scrolling'){
                const locked=Object.keys(window.ContentColumns?.definitions||{}).some(page=>window.ContentColumns.locked(window.ContentColumns.read(page)));
                if(select.disabled!==(pending||locked)){select.disabled=pending||locked;window.refreshCustomDropdowns?.(select.parentElement,false);}
                const note=document.getElementById?.('global-scrolling-lock');if(note)note.hidden=!locked;
            }
        });
    }
    let pending=false;
    async function requestChange(part,value) {
        if (pending || !parts.includes(part) || !options(part).includes(value) || read(part) === value) { refresh(); return false; }
        pending=true;
        const controls=Array.from(document.querySelectorAll('select[data-global-display]'));
        const text=key=>window.getTrans?.(key)||key;
        const caption=text({content:'set_setup_alignment',header:'set_page_header_layout',columns:'content_columns_count',arrangement:'content_columns_arrangement',alignment:'content_columns_alignment',browsing:'content_columns_browsing',singleFill:'content_columns_single_fill',pageSize:'content_columns_page_size',scrolling:'content_columns_scrolling',goldOrdinal:'gold_ordinal_label',large:'global_panel_large',medium:'global_panel_medium',small:'global_panel_small'}[part]);
        const valueLabel=part==='singleFill'?text(value==='fit'?'content_columns_single_fit':'content_columns_single_one'):part==='browsing'&&value==='single'?text('content_columns_single_panel'):part==='pageSize'?value:part==='columns' ? (value==='auto'?text('content_columns_auto'):value==='1'?text('content_columns_single'):value) : text(['arrangement','alignment','browsing','scrolling'].includes(part)?'content_columns_'+value : part==='goldOrdinal' ? 'gold_ordinal_'+value : part==='content' ? (value==='full'?'layout_full_width':'layout_'+value) : part==='header' ? (value==='full'?'header_layout_full':'header_layout_follow_content') : value==='recommended' ? 'global_author_recommended' : 'panel_default_'+value);
        const message=part==='arrangement'&&value==='category'?text('global_category_confirm'):text('global_display_confirm').replace('{setting}',caption).replace('{value}',valueLabel);
        controls.forEach(select=>{select.disabled=true;});
        refresh(); window.refreshCustomDropdowns?.(document,false);
        try {
            const confirmed=active ? await confirmInDialog(message) : window.customConfirm ? await window.customConfirm(message) : window.confirm(message);
            const changed=confirmed===true&&set(part,value);
            return changed;
        } finally {
            pending=false; controls.forEach(select=>{select.disabled=false;});
            refresh(); window.refreshCustomDropdowns?.(document,false);
            const source=controls.find(select=>select.dataset.globalDisplay===part);
            if(active?.dialog.contains(source))source.nextElementSibling?.querySelector('button')?.focus({preventScroll:true});
        }
    }
    let active=null;
    function confirmInDialog(message) {
        return new Promise(resolve=>{
            const box=document.createElement('div');box.className='global-display-confirm';box.setAttribute('role','alert');
            const caption=document.createElement('p');caption.textContent=message;box.append(caption);
            const actions=document.createElement('div');actions.className='panel-defaults-footer';
            const finish=value=>{active && (active.cancelPending=null);box.remove();resolve(value);};
            for(const [value,key] of [[false,'cancel'],[true,'confirm']]){
                const button=document.createElement('button');button.type='button';button.className='btn '+(value?'btn-primary':'btn-action-gray');
                button.textContent=window.getTrans?.(key)||key;button.dataset.globalConfirm=value?'accept':'cancel';button.onclick=()=>finish(value);actions.append(button);
            }
            box.append(actions);active.dialog.append(box);active.cancelPending=()=>finish(false);actions.firstChild.focus();
        });
    }
    function open(group,trigger) {
        if(!['display','panels'].includes(group))return null;
        active?.finish();
        const host=document.getElementById(group==='display'?'global-display-options':'global-panel-options');if(!host)return null;
        const placeholder=document.createComment('global display fields');host.before(placeholder);
        const dialog=document.createElement('dialog');dialog.id='global-display-dialog';dialog.className='panel-defaults-dialog global-display-dialog';
        dialog.setAttribute('aria-labelledby','global-display-dialog-title');
        const title=document.createElement('h2');title.id='global-display-dialog-title';title.textContent=window.getTrans?.(group==='display'?'global_display_button':'panel_defaults_title')||group;
        const caption=document.createElement('p');caption.className='panel-defaults-page';caption.textContent=window.getTrans?.('set_global_display')||'';
        const footer=document.createElement('div');footer.className='panel-defaults-footer';const close=document.createElement('button');close.type='button';close.className='btn btn-primary';close.textContent=window.getTrans?.('panel_defaults_close')||'Close';footer.append(close);
        host.hidden=false;dialog.append(title,caption,host,footer);
        let finished=false;
        const state={dialog,cancelPending:null,finish(){
            if(finished)return;finished=true;state.cancelPending?.();dialog.dispatchEvent(new Event('close'));
            if(dialog.open)dialog.close();host.hidden=true;placeholder.replaceWith(host);dialog.remove();active=null;
            if(trigger?.isConnected)trigger.focus({preventScroll:true});
        }};
        active=state;if(group==='display')window.ContentColumns?.orderFields(host,'globalDisplay');close.onclick=state.finish;dialog.oncancel=event=>{event.preventDefault();state.finish();};dialog.onclose=state.finish;
        document.body.append(dialog);dialog.showModal();refresh();window.refreshCustomDropdowns?.(dialog,false);close.focus({preventScroll:true});return dialog;
    }
    window.GlobalDisplay=Object.freeze({panelSizes,read,set,refresh,requestChange,open});
    document.addEventListener('DOMContentLoaded', () => {
        document.querySelectorAll('select[data-global-display]').forEach(select => { select.onchange=()=>requestChange(select.dataset.globalDisplay,select.value); });
        refresh();
    });
    window.addEventListener('pageshow',refresh);
    window.addEventListener('storage',refresh);
})();
