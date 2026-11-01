/** 精确裁切连续的纵向表单；只有一份可编辑表单，其余窗口为隔离的显示镜像。 */
(function () {
    'use strict';
    const definitions = {
        pool_setup: {container:'.setup-container', items:'.setup-card, #btn-save-pool'},
        gallery_setup: {container:'.setup-container', items:':not(.page-layout-header):not([id$="-lock-banner"])'},
        currency_setup: {container:'.setup-container', items:'#gallery-economy'},
        user_data: {container:'.setup-container', items:'#data-preview-fields'},
        dashboard: {container:'.dashboard-center-wrapper', items:'#list-wrap', footer:'.dashboard-fixed-footer'},
        changelog: {container:'.changelog-container', items:'.changelog-content-wrapper', footer:'#pagination-controls-bottom'}
    };
    const currentPage = () => (location.pathname.replace(/\/+$/, '').split('/').pop() || 'index').replace(/\.html$/i, '');
    const keyFor = page => 'GM_Content_Columns_' + page;
    const columnOptions = ['1','2','3','4','5','6','auto'];
    const arrangements = ['continuous','row','column','category'], scrollModes = ['linked','independent'];
    const categoryPages=['gallery_setup','currency_setup'], pageSizes=['3','6','9','12','18','24'];
    const locked = prefs => prefs.browsing==='single'||prefs.arrangement==='continuous'||prefs.arrangement==='row'&&['rows','packed'].includes(prefs.alignment);
    function packWhole(items,count,height,measure,gap=20){
        const groups=Array.from({length:count},()=>[]);
        let index=0,base=0;
        while(index<items.length){
            let bottom=base+height;
            for(let column=0;column<count&&index<items.length;column++){
                let used=0;
                do{
                    const item=items[index],size=measure(item);
                    if(used&&used+gap+size>height)break;
                    const top=base+used+(used?gap:0);
                    groups[column].push({item,top});index++;
                    used=top-base+size;bottom=Math.max(bottom,base+used);
                }while(index<items.length&&used<height);
            }
            base=bottom+gap;
        }
        return groups;
    }
    function fitPages(items,height,measure,gap=20){
        const pages=[];let group=[],used=0;
        for(const item of items){const size=Math.max(0,measure(item));
            if(group.length&&used+gap+size>height){pages.push(group);group=[];used=0;}
            used+=(group.length?gap:0)+size;group.push(item);
        }
        if(group.length)pages.push(group);return pages;
    }
    function pageRange(length,size,index){const pages=Math.max(1,Math.ceil(length/size));index=Math.max(0,Math.min(pages-1,index));return {index,pages,start:index*size,end:Math.min(length,(index+1)*size)};}
    function categoryPartition(items,count,classify,order=[]){
        const buckets=new Map(order.map(key=>[key,[]]));items.forEach(item=>{const key=classify(item);if(!buckets.has(key))buckets.set(key,[]);buckets.get(key).push(item);});
        const groups=Array.from({length:count},()=>[]),labels=groups.map(()=>[]);
        [...buckets].forEach(([label,rows],index)=>{groups[index%count].push(...rows);labels[index%count].push(label);});
        return {groups,labels};
    }
    function partition(items,count,arrangement) {
        count=Math.max(1,Math.floor(count)||1);
        const groups=Array.from({length:count},()=>[]);
        if(arrangement==='row') items.forEach((item,index)=>groups[index%count].push(item));
        else { let start=0;groups.forEach((group,index)=>{const size=Math.floor(items.length/count)+(index<items.length%count?1:0);group.push(...items.slice(start,start+size));start+=size;}); }
        return groups;
    }
    let runtime = null, closeDialog = null;
    function read(page) {
        if (!definitions[page]) return null;
        let saved;
        try { saved = JSON.parse(localStorage.getItem(keyFor(page)) || 'null'); } catch (_) {}
        const fallback = '1';
        let arrangement=arrangements.includes(saved?.arrangement)&&!(saved.arrangement==='category'&&!categoryPages.includes(page))?saved.arrangement:'continuous';
        const browsing=['pages','single'].includes(saved?.browsing)?saved.browsing:'scroll',alignment=['rows','packed'].includes(saved?.alignment)?saved.alignment:'natural';
        if(browsing==='pages'&&arrangement==='continuous')arrangement='row';
        const fixedScrolling=scrollModes.includes(saved?.fixedScrolling)?saved.fixedScrolling:scrollModes.includes(saved?.scrolling)?saved.scrolling:'linked';
        return {columns:columnOptions.includes(saved?.columns) ? saved.columns : fallback, arrangement, browsing,alignment,singleFill:saved?.singleFill==='fit'?'fit':'one',pageSize:pageSizes.includes(String(saved?.pageSize))?String(saved.pageSize):'6',scrolling:locked({arrangement,alignment,browsing})?'linked':fixedScrolling, fixedScrolling};
    }
    function set(page, part, value) {
        if (!definitions[page]) return false;
        const next=read(page);
        if(part==='columns' && columnOptions.includes(String(value))) next.columns=String(value);
        else if(part==='arrangement' && arrangements.includes(value)&&!(value==='category'&&!categoryPages.includes(page))&&!(value==='continuous'&&next.browsing==='pages')) next.arrangement=value;
        else if(part==='alignment'&&['natural','rows','packed'].includes(value))next.alignment=value;
        else if(part==='browsing'&&['scroll','pages','single'].includes(value)){next.browsing=value;if(value==='pages'&&next.arrangement==='continuous')next.arrangement='row';}
        else if(part==='singleFill'&&['one','fit'].includes(value))next.singleFill=value;
        else if(part==='pageSize'&&pageSizes.includes(String(value)))next.pageSize=String(value);
        else if(part==='scrolling' && scrollModes.includes(value) && !locked(next)) next.fixedScrolling=value;
        else return false;
        next.scrolling=locked(next)?'linked':next.fixedScrolling;
        localStorage.setItem(keyFor(page), JSON.stringify(next));
        document.dispatchEvent(new CustomEvent('content-columns-change', {detail:{page}}));
        window.GlobalDisplay?.refresh();window.PanelDefaults?.refreshSettings();
        return true;
    }
    const text = key => window.getTrans?.(key) || key;
    function orderFields(host,attribute='contentColumnsPart') {
        const parts=['browsing','singleFill','columns','arrangement','alignment','pageSize','scrolling'];
        const selects=Array.from(host.querySelectorAll('select')).filter(select=>parts.includes(select.dataset[attribute]));
        if(!selects.length)return;
        const anchor=document.createComment('display field order');
        selects[0].closest('label.panel-default-setting,.setting-item').before(anchor);
        for(const part of parts){const select=selects.find(select=>select.dataset[attribute]===part);if(select)anchor.before(select.closest('label.panel-default-setting,.setting-item'));}
        anchor.remove();
    }
    function mountControls(host, page) {
        if (!window.PageLayout?.definitions[page] || host.querySelector('[data-content-columns-page]')) return;
        const button = document.createElement('button'); button.type = 'button';
        button.className = 'btn btn-action-gray panel-defaults-button content-columns-button';
        button.dataset.contentColumnsPage = page; button.dataset.i18n = 'global_display_button';
        button.textContent = text('global_display_button'); button.setAttribute('aria-haspopup','dialog');
        button.setAttribute('aria-controls','content-columns-dialog'); button.onclick = () => open(page, button); host.append(button);
    }
    function open(page, trigger) {
        if (!window.PageLayout?.definitions[page]) return null;
        closeDialog?.();
        const focus = trigger || document.activeElement;
        document.dispatchEvent(new CustomEvent('panel-defaults-open'));
        const dialog = document.createElement('dialog'); dialog.id = 'content-columns-dialog'; dialog.className = 'panel-defaults-dialog';
        dialog.setAttribute('aria-labelledby','content-columns-title');
        const title = document.createElement('h2'); title.id = 'content-columns-title'; title.textContent = text('global_display_button');
        const caption = document.createElement('p'); caption.className = 'panel-defaults-page'; caption.textContent = text(window.PageLayout?.definitions[page]?.title || 'content_columns_title');
        const fields = document.createElement('div'); fields.className = 'panel-defaults-fields';
        window.PageLayout.mountFields(fields,page);
        const field = (part, label, options, disabled = false) => {
            const row = document.createElement('label'); row.className = 'panel-default-setting';
            const name = document.createElement('span'); name.textContent = text(label);
            const select = document.createElement('select'); select.className = 'input-box'; select.dataset.contentColumnsPart = part; select.disabled = disabled;
            for (const [value,key,pending] of options) {
                const option = document.createElement('option'); option.value = value; option.textContent = key === null ? value : text(key); option.disabled = !!pending; select.append(option);
            }
            select.value = read(page)[part]; select.onchange = () => {set(page,part,select.value);syncScrolling();}; row.append(name,select); fields.append(row);return select;
        };
        let scrolling,arrangement,alignment,pageSize;
        function syncScrolling(){if(!scrolling)return;const prefs=read(page);scrolling.disabled=locked(prefs);scrolling.value=prefs.scrolling;arrangement.value=prefs.arrangement;arrangement.options[0].disabled=prefs.browsing==='pages';alignment.closest('label').hidden=prefs.arrangement!=='row';pageSize.closest('label').hidden=prefs.browsing!=='pages';fields.querySelector('[data-content-columns-part=singleFill]').closest('label').hidden=prefs.browsing!=='single';for(const part of ['columns','arrangement','alignment','scrolling']){const input=fields.querySelector('[data-content-columns-part='+part+']');if(input)input.closest('label').hidden=prefs.browsing==='single'||part==='alignment'&&prefs.arrangement!=='row';}window.refreshCustomDropdowns?.(fields,false);}
        if(definitions[page]){
            field('columns','content_columns_count',columnOptions.map(value => [value,value === 'auto' ? 'content_columns_auto' : value === '1' ? 'content_columns_single' : null]));
            arrangement=field('arrangement','content_columns_arrangement',[['continuous','content_columns_continuous'],['row','content_columns_row'],['column','content_columns_column'],...(categoryPages.includes(page)?[['category','content_columns_category']]:[])]);
            alignment=field('alignment','content_columns_alignment',[['natural','content_columns_natural'],['rows','content_columns_rows'],['packed','content_columns_packed']]);
            field('browsing','content_columns_browsing',[['scroll','content_columns_scroll'],['pages','content_columns_pages'],['single','content_columns_single_panel']]);
            field('singleFill','content_columns_single_fill',[['one','content_columns_single_one'],['fit','content_columns_single_fit']]);
            pageSize=field('pageSize','content_columns_page_size',pageSizes.map(value=>[value,null]));
            scrolling=field('scrolling','content_columns_scrolling',[['linked','content_columns_linked'],['independent','content_columns_independent']]);
            syncScrolling();
        }
        if(['dashboard','simulator'].includes(page) && window.GoldOrdinal){
            const row=document.createElement('label');row.className='panel-default-setting';
            const label=document.createElement('span');label.textContent=text('gold_ordinal_label');
            const select=document.createElement('select');select.id='goldOrdinalSelect';select.className='input-box';select.dataset.goldOrdinalSetting='';
            const labels={show:'gold_ordinal_show',hide:'gold_ordinal_hide',hover:'gold_ordinal_hover',click:'gold_ordinal_click'};
            for(const value of window.GoldOrdinal.modes){const option=document.createElement('option');option.value=value;option.textContent=text(labels[value]);select.append(option);}
            select.value=window.GoldOrdinal.read();select.onchange=()=>window.GoldOrdinal.set(select.value);row.append(label,select);fields.append(row);
        }
        if(definitions[page])orderFields(fields);
        const footer = document.createElement('div'); footer.className = 'panel-defaults-footer';
        const close = document.createElement('button'); close.type = 'button'; close.className = 'btn btn-primary'; close.textContent = text('panel_defaults_close'); footer.append(close);
        dialog.append(title,caption,fields,footer);
        let finished = false;
        const finish = () => {
            if (finished) return; finished = true; closeDialog = null;
            dialog.dispatchEvent(new Event('close')); if (dialog.open) dialog.close(); dialog.remove();
            (focus?.isConnected ? focus : document.querySelector('.sidebar a[href="settings.html"]'))?.focus({preventScroll:true});
        };
        closeDialog = finish; close.onclick = finish; dialog.oncancel = event => { event.preventDefault(); finish(); }; dialog.onclose = finish;
        document.body.append(dialog); dialog.showModal(); window.refreshCustomDropdowns?.(dialog,false); close.focus({preventScroll:true});
        return dialog;
    }
    window.ContentColumns = Object.freeze({definitions,key:keyFor,read,set,open,mountControls,orderFields,partition,packWhole,fitPages,categoryPages,locked,pageRange,categoryPartition,beforeRender:root=>runtime?.beforeRender(root),reveal:element=>runtime?.reveal(element) || false});
    function mount() {
        if (runtime) return;
        const page = currentPage(), definition = definitions[page];
        if (!definition || page === 'changelog' && window.GACHA_IS_LATEST === false) return;
        const container = document.querySelector(definition.container);
        if (!container) return;
        if (read(page).columns === '1'&&read(page).browsing==='scroll') return;
        const cards = [...container.children].filter(node => node.matches(definition.items));
        if (!cards.length) return;
        const viewport = document.createElement('div'); viewport.className = 'content-flow-viewport'; viewport.tabIndex = 0;
        const content = document.createElement('div'); content.className = 'content-flow-content';
        content.id = 'content-flow-content';
        const progress = document.createElement('div'); progress.className = 'content-flow-progress'; progress.tabIndex = 0;
        progress.setAttribute('role', 'scrollbar'); progress.setAttribute('aria-orientation', 'vertical');
        progress.setAttribute('aria-controls', content.id); progress.setAttribute('aria-valuemin', '0');
        const progressThumb = document.createElement('div'); progressThumb.className = 'content-flow-progress-thumb'; progress.append(progressThumb);
        const stream = document.createElement('div'); stream.className = 'content-flow-stream';
        const english = () => (localStorage.getItem('GM_Lang') || 'zh') === 'en';
        cards[0].before(viewport); viewport.append(content, progress); stream.append(...cards);
        let frame, scrollFrame, mirrorFrame, offset = 0, maximum = 0, count = 1, height = 0, live = 0;
        let drag = null;
        let fixed=null,pageIndex=0;
        // Wheel events have no portable gesture-end event. Require a quiet interval,
        // then a fresh gesture in the same direction, rather than turning at an edge.
        const wheelPause=450;
        let wheelIdleTimer=0,wheelLast=0,wheelReady=0,wheelPage=-1,wheelMode='';
        const singleBoundary=direction=>!!fixed?.columns.length&&fixed.columns.every(column=>direction<0?column.scrollTop<=2:column.scrollTop+column.clientHeight>=column.scrollHeight-2);
        function resetSingleWheel(){clearTimeout(wheelIdleTimer);wheelReady=0;wheelLast=performance.now();wheelPage=pageIndex;wheelMode=read(page).browsing;}
        const singleSlides=()=>{
            if(fixed?.browsing==='pages'){const groups=[];for(let i=0;i<fixed.items.length;i+=Number(fixed.pageSize))groups.push(fixed.items.slice(i,i+Number(fixed.pageSize)));return groups;}
            return fixed?.slides||fixed?.items.map(item=>[item])||[];
        };
        function goSinglePage(index){
            const next=Math.max(0,Math.min(index,(singleSlides().length||1)-1));
            if(next===pageIndex)return;
            if(fixed)fixed.singleAnchor=singleSlides()[next]?.[0];
            pageIndex=next;offset=0;resetSingleWheel();schedule();
        }
        let singleNav=null,tocState=null;const singleExpansion=new Map();
        function restoreSingleExpansion(){
            if(read(page).browsing==='scroll'){clearTimeout(wheelIdleTimer);wheelReady=0;wheelPage=-1;}
            if(tocState&&read(page).browsing==='scroll'){tocState.sidebar.classList.toggle("collapsed",tocState.collapsed);tocState.trigger?.classList.toggle("show",tocState.show);tocState=null;}
            singleExpansion.forEach((state,node)=>{if(state.type==='details')node.open=state.value;else node.style.display=state.value;node.removeAttribute('data-single-root');});singleExpansion.clear();
        }
        function expandSingle(node){
        if(node?.matches('.gallery-category-unit'))node=node.querySelector('.category-box');
        if(node){
            if(node.matches('details')&&!singleExpansion.has(node)){singleExpansion.set(node,{type:'details',value:node.open});node.open=true;node.dataset.singleRoot='';}
            const bodies=[...node.children].filter(child=>child.matches('[id^=card-][id$=-body],.category-body,#master-settings-body,#custom-pools-body'));
            bodies.forEach(body=>{if(!singleExpansion.has(body)){singleExpansion.set(body,{type:'display',value:body.style.display});body.style.display=body.id==='master-settings-body'||body.id==='custom-pools-body'?'flex':'block';}});
        }
        }
        function updateSingleNavigation(prefs){
            if(prefs.browsing==='scroll'){singleNav?.remove();singleNav=null;return;}
            if(wheelPage!==pageIndex||wheelMode!==prefs.browsing)resetSingleWheel();
            const toc=document.getElementById('toc-sidebar');if(toc&&!tocState){const trigger=document.getElementById('toc-expand-btn');tocState={sidebar:toc,trigger,collapsed:toc.classList.contains('collapsed'),show:trigger?.classList.contains('show')};toc.classList.add('collapsed');trigger?.classList.add('show');}
            if(prefs.browsing==='single')fixed.groups.flat().forEach(expandSingle);
            const slides=singleSlides(),signature=slides.map(group=>fixed.items.indexOf(group[0])).join(',');
            if(singleNav?.dataset.index===String(pageIndex)&&singleNav.dataset.total===String(slides.length)&&singleNav.dataset.plan===signature)return;
            const restoreFocus=singleNav?.contains(document.activeElement);
            singleNav?.remove();singleNav=document.createElement('nav');singleNav.className='content-single-nav';singleNav.dataset.index=pageIndex;singleNav.dataset.total=slides.length;singleNav.dataset.plan=signature;singleNav.setAttribute('aria-label',text(prefs.browsing==='pages'?'content_columns_pages':'content_columns_single_panel'));
            const go=goSinglePage;
            for(const [delta,label,glyph] of [[-1,'content_columns_prev','‹'],[1,'content_columns_next','›']]){
                const button=document.createElement('button');button.type='button';button.className='content-single-arrow '+(delta<0?'previous':'next');button.textContent=glyph;button.title=button.ariaLabel=text(label);button.disabled=pageIndex+delta<0||pageIndex+delta>=slides.length;button.onclick=()=>go(pageIndex+delta);singleNav.append(button);
            }
            const rail=document.createElement('div');rail.className='content-single-dots';
            slides.forEach((group,index)=>{const item=group[0],dot=document.createElement('button');dot.type='button';const title=(item.querySelector('h2,h3,.category-title,.player-account-name,.log-title')?.textContent||item.querySelector('summary')?.textContent||'').trim().slice(0,90);dot.title=dot.ariaLabel=(index+1)+' / '+slides.length+(title?' · '+title:'');dot.setAttribute('aria-current',String(index===pageIndex));dot.onclick=()=>go(index);dot.append(document.createElement('span'));rail.append(dot);});
            const status=document.createElement('output');status.className='content-single-status';status.setAttribute('aria-live','polite');status.textContent=(slides.length?pageIndex+1:0)+' / '+slides.length;singleNav.append(rail,status);viewport.append(singleNav);
            const current=rail.children[pageIndex];if(current){rail.scrollLeft=Math.max(0,current.offsetLeft-rail.clientWidth/2);if(restoreFocus)current.focus({preventScroll:true});}
        }
        const fixedObserver=new ResizeObserver(()=>{if(fixedMode())schedule();});
        const lanes = [];
        const active = () => document.documentElement.dataset.contentFlow === 'columns';
        const fixedMode = () => active() && (read(page).browsing==='single'||read(page).arrangement!=='continuous');
        function restoreFixed(){
            if(!fixed)return;
            singleNav?.remove();singleNav=null;
            fixedObserver.disconnect();
            fixed.entries.forEach(({node,anchor})=>{
                node.removeAttribute('data-row-align');node.style.removeProperty('--row-extra');node.removeAttribute('data-whole-pack');node.style.removeProperty('--pack-gap');
                if(!anchor.isConnected)return;
                if(!node.isConnected||!fixed.grid.contains(node))anchor.remove();
                else anchor.replaceWith(node);
            });
            fixed.grid.remove();fixed.host.removeAttribute('data-fixed-host');fixed=null;
        }
        function fixedHost(){
            const selector={currency_setup:'#gallery-economy',user_data:'#data-list',dashboard:'#list-wrap',changelog:'#timeline-container'}[page];
            return selector?stream.querySelector(selector):stream;
        }
        function fixedItems(host){
            if(page==='gallery_setup'){
                return [...host.children].flatMap(node=>{
                    if(node===fixed?.grid||node.id==='gallery-catalog-heading'||getComputedStyle(node).display==='none')return [];
                    if(node.id==='categories-container')return [...node.children].filter(child=>child.matches('.category-box,.gallery-category-unit'));
                    const deleteButton=node.querySelector('#btn-delete-game');
                    if(deleteButton&&getComputedStyle(deleteButton).display==='none')return [];
                    return [node];
                });
            }
            const selector={currency_setup:'.eco-section',user_data:'.player-account-card',dashboard:'.char-row',changelog:'.log-card'}[page];
            return [...host.children].filter(node=>node!==fixed?.grid && (!selector||node.matches(selector))&&getComputedStyle(node).display!=='none');
        }
        function classify(node){
            if(page==='currency_setup'){
                const key=node.dataset.ecoSection;
                return text(['resources','caps'].includes(key)?'content_columns_group_resources':['exchanges','unlockGroups'].includes(key)?'content_columns_group_exchange':'content_columns_group_income');
            }
            return node.matches('.category-box,.gallery-category-unit')?'category:'+node.dataset.id:text('content_columns_group_config');
        }
        function layoutFixed(prefs){
            if(live!==0){setLive(live,false);lanes[0].node.append(stream);live=0;setLive(0,true);}
            stream.style.top='0px';
            const host=fixedHost();if(!host)return;
            const extra=fixedItems(host);
            const anchorKey=nodeKey(fixed?.singleAnchor||fixed?.groups.flat()[0]);
            const rebuild=!fixed||fixed.host!==host||!fixed.grid.isConnected||fixed.count!==count||fixed.arrangement!==prefs.arrangement||fixed.browsing!==prefs.browsing||fixed.pageSize!==prefs.pageSize||(fixed.pageIndex!==pageIndex&&!(prefs.browsing==='single'&&prefs.singleFill==='fit'))||fixed.singleFill!==prefs.singleFill||fixed.alignment!==prefs.alignment||extra.length>0||fixed.entries.some(({node})=>!node.isConnected);
            if(rebuild){
                restoreFixed();
                const items=fixedItems(host),grid=document.createElement('div');grid.className='content-fixed-grid';
                const range=pageRange(items.length,prefs.browsing==='single'?1:Number(prefs.pageSize),pageIndex);pageIndex=range.index;
                const shown=prefs.browsing!=='scroll'?items.slice(range.start,range.end):items;
                const entries=items.map(node=>{const anchor=document.createComment('column item');node.before(anchor);return {node,anchor};});
                if(items.length)items[0].before(grid);else host.append(grid);
                const plan=prefs.browsing!=='single'&&prefs.arrangement==='category'?categoryPartition(shown,count,classify,[...new Set(items.map(classify))]):{groups:partition(shown,count,prefs.browsing==='single'?'column':prefs.arrangement),labels:[]};
                const columns=plan.groups.map((group,index)=>{
                    const column=document.createElement('div');column.className='content-fixed-column';column.tabIndex=0;column.setAttribute('role','region');column.setAttribute('aria-label',english()?'Column '+(index+1):'第 '+(index+1)+' 列');
                    if(prefs.browsing!=='single'&&prefs.arrangement==='category'){const heading=document.createElement('h3');heading.className='content-fixed-heading';heading.textContent=plan.labels[index].map(key=>key.startsWith('category:')?(items.find(node=>node.matches('.category-box,.gallery-category-unit')&&node.dataset.id===key.slice(9))?.querySelector('.cat-name-input')?.value||key):key).join(' / ');column.append(heading);}
                    column.append(...group);grid.append(column);return column;
                });
                const parking=document.createElement('div');parking.className='content-fixed-parking';parking.hidden=true;
                const visible=new Set(shown);parking.append(...items.filter(node=>!visible.has(node)));grid.append(parking);
                const pager=null;
                fixed={host,grid,entries,columns,count,arrangement:prefs.arrangement,browsing:prefs.browsing,pageSize:prefs.pageSize,pageIndex,groups:plan.groups,items,range,pager,alignment:prefs.alignment,singleFill:prefs.singleFill,parking,singleAnchor:anchorKey?items.find(node=>nodeKey(node)===anchorKey):null};host.setAttribute('data-fixed-host','');
                items.forEach(node=>fixedObserver.observe(node));
                columns.forEach(column=>column.addEventListener('scroll',()=>{
                    if(fixed?.grid!==grid||read(page).scrolling!=='linked')return;
                    if(column.assignedScroll===column.scrollTop){column.assignedScroll=null;return;}
                    offset=column.scrollTop;renderScroll();
                }));
            }
            fixed.grid.style.setProperty('--fixed-count',count);
            const available=Math.max(140,height-Math.max(0,fixed.grid.getBoundingClientRect().top-viewport.getBoundingClientRect().top)-(fixed.pager?48:0));
            fixed.grid.style.setProperty('--fixed-height',available+'px');
            fixed.grid.dataset.scrolling=prefs.scrolling;
            fixed.grid.dataset.browsing=prefs.browsing;
            fixed.grid.dataset.singleFill=prefs.singleFill;
            if(prefs.browsing==='single'&&prefs.singleFill==='fit'){
                fixed.items.forEach(expandSingle);
                fixed.parking.inert=true;
                fixed.parking.style.width=fixed.columns[0].clientWidth-4+'px';
                // Allocate from natural heights, not the extra space assigned last frame.
                // Otherwise stretched panels would stop fitting together on the next pass.
                let slides;
                fixed.grid.setAttribute('data-fit-measuring','');
                try { slides=fitPages(fixed.items,Math.max(1,available-2),node=>node.getBoundingClientRect().height); }
                finally { fixed.grid.removeAttribute('data-fit-measuring'); }
                const signature=slides.map(group=>fixed.items.indexOf(group[0])).join(',');
                if((fixed.singleAnchor||fixed.slidePlan)&&fixed.slidePlan!==signature&&fixed.pageIndex===pageIndex){
                    const anchor=fixed.singleAnchor||fixed.groups[0][0],index=slides.findIndex(group=>group.includes(anchor));if(index>=0)pageIndex=index;
                }
                pageIndex=Math.max(0,Math.min(pageIndex,slides.length-1));
                const shown=slides[pageIndex]||[],visible=new Set(shown),column=fixed.columns[0];
                if(!fixed.items.includes(fixed.singleAnchor))fixed.singleAnchor=shown[0];
                fixed.items.forEach(node=>{if(!visible.has(node)&&node.parentElement!==fixed.parking)fixed.parking.append(node);});
                shown.forEach((node,index)=>{if(column.children[index]!==node)column.insertBefore(node,column.children[index]||null);});
                fixed.groups=[shown];fixed.slides=slides;fixed.slidePlan=signature;fixed.pageIndex=pageIndex;
                fixed.range={index:pageIndex,pages:slides.length,start:fixed.items.indexOf(shown[0]),end:fixed.items.indexOf(shown.at(-1))+1};
            }
            updateSingleNavigation(prefs);
            const packed=prefs.browsing!=='single'&&prefs.arrangement==='row'&&prefs.alignment==='packed';
            fixed.grid.dataset.packed=String(packed);
            if(packed){
                const shown=prefs.browsing==='pages'?fixed.items.slice(fixed.range.start,fixed.range.end):fixed.items;
                const sizes=new Map(shown.map(node=>[node,node.getBoundingClientRect().height]));
                const plan=packWhole(shown,count,Math.max(1,available-12),node=>sizes.get(node));
                plan.forEach((group,index)=>{
                    let end=0;
                    group.forEach(({item,top},position)=>{
                        item.dataset.wholePack='';item.style.setProperty('--pack-gap',(top-end)+'px');
                        if(fixed.columns[index].children[position]!==item)fixed.columns[index].insertBefore(item,fixed.columns[index].children[position]||null);
                        end=top+sizes.get(item);
                    });
                });
                fixed.groups=plan.map(group=>group.map(entry=>entry.item));
            }
            if(prefs.browsing!=='single'&&prefs.arrangement==='row'&&prefs.alignment==='rows'){
                const heights=fixed.groups.map(group=>group.map(node=>node.getBoundingClientRect().height));
                fixed.groups.forEach((group,column)=>group.forEach((node,row)=>{node.dataset.rowAlign='';node.style.setProperty('--row-extra',Math.max(...heights.map(values=>values[row]||0))-heights[column][row]+'px');}));
            }else fixed.items.forEach(node=>{node.removeAttribute('data-row-align');node.style.removeProperty('--row-extra');});
            lanes.forEach((lane,index)=>{lane.node.hidden=index!==0;});
            maximum=Math.max(0,...fixed.columns.map(column=>column.scrollHeight-column.clientHeight));
            offset=Math.min(offset,maximum);renderScroll();
        }
        function nodeKey(node) {
            if (!node||node.nodeType !== 1) return '';
            const identity = node.id || node.getAttribute('data-content-key') || node.getAttribute('data-gold-ordinal-identity') ||
                node.getAttribute('data-eco-key') || node.getAttribute('data-eco-id') || node.getAttribute('data-id') || node.getAttribute('data-version');
            return identity ? node.localName + ':' + identity : '';
        }
        const compatible = (a,b) => a && b && a.nodeType === b.nodeType && a.nodeName === b.nodeName && a.namespaceURI === b.namespaceURI;
        function patchAttributes(source, copy) {
            for (const attribute of [...copy.attributes]) {
                if (source === stream && attribute.name === 'style') continue;
                if (!source.hasAttribute(attribute.name)) copy.removeAttribute(attribute.name);
            }
            for (const attribute of source.attributes) {
                if (source === stream && attribute.name === 'style') continue;
                if (copy.getAttribute(attribute.name) !== attribute.value) copy.setAttribute(attribute.name,attribute.value);
            }
        }
        function patchState(source, copy, lane) {
            for (const property of ['value','checked','selected','open','indeterminate']) {
                if (source.tagName === 'INPUT' && source.type === 'file' && property === 'value') continue;
                if (property in source && copy[property] !== source[property]) copy[property] = source[property];
            }
            // 只有实际滚动过的内层列表才需要读写镜像滚动位置，避免逐节点强制布局。
            for (const property of ['scrollTop','scrollLeft']) {
                const value = source[property];
                if (value || lane.scrolled.has(copy)) {
                    if (copy[property] !== value) copy[property] = value;
                    if (value) lane.scrolled.add(copy);
                }
            }
            if (source.scrollTop || source.scrollLeft) lane.scrollSources.add(source);
            else lane.scrollSources.delete(source);
        }
        function restoreInnerScroll(lane) {
            for (const source of lane.scrollSources) {
                if (!stream.contains(source)) { lane.scrollSources.delete(source); continue; }
                const copy = lane.nodes.get(source);
                if (!copy || lane.owners.get(copy) !== source) continue;
                if (copy.scrollTop !== source.scrollTop) copy.scrollTop = source.scrollTop;
                if (copy.scrollLeft !== source.scrollLeft) copy.scrollLeft = source.scrollLeft;
            }
        }
        function patchTree(source, copy, lane) {
            lane.nodes.set(source,copy); lane.owners.set(copy,source);
            if (source.nodeType !== 1) {
                if (copy.nodeValue !== source.nodeValue) copy.nodeValue = source.nodeValue;
                return;
            }
            patchAttributes(source,copy);
            const available = new Map([...copy.childNodes].map(node => [nodeKey(node),node]).filter(([key])=>key));
            let cursor = copy.firstChild;
            for (const child of source.childNodes) {
                const key = nodeKey(child);
                let target = lane.nodes.get(child);
                if (!compatible(child,target) || lane.owners.get(target) !== child) target = null;
                if (!target && key) target = available.get(key);
                if (!compatible(child,target)) target = null;
                if (!target && compatible(child,cursor) && nodeKey(cursor) === key) target = cursor;
                const fresh = !target;
                if (fresh) { target = child.cloneNode(false); patchTree(child,target,lane); }
                if (target !== cursor) {
                    if (copy.moveBefore && target.isConnected) copy.moveBefore(target,cursor);
                    else copy.insertBefore(target,cursor);
                }
                if (!fresh) patchTree(child,target,lane);
                cursor = target.nextSibling;
                if (key) available.delete(key);
            }
            while (cursor) { const next = cursor.nextSibling; cursor.remove(); cursor = next; }
            patchState(source,copy,lane);
        }
        function syncMirror(lane, full) {
            // 保留显示树与图片节点，避免更新序号、切换列或折叠时重新解码全部头像。
            const fresh = !lane.copy;
            if (!lane.copy) {
                lane.root = document.createElement('html'); lane.body = document.createElement('body');
                lane.body.style.cssText = 'display:block;height:auto;margin:0;padding:0;overflow:visible;background:transparent;';
                lane.context = document.createElement('div');
                lane.context.style.cssText = 'display:block!important;width:100%!important;max-width:none!important;margin:0!important;padding:0!important;height:auto!important;';
                lane.copy = stream.cloneNode(false); lane.copy.style.top = '0px';
                lane.root.append(lane.body); lane.body.append(lane.context); lane.context.append(lane.copy);
                full = true;
            }
            patchAttributes(document.documentElement,lane.root);
            if (lane.body.className !== document.body.className) lane.body.className = document.body.className;
            if (lane.context.className !== container.className) lane.context.className = container.className;
            if (full) patchTree(stream,lane.copy,lane);
            else {
                // 父节点已经覆盖的变化不必再次遍历，输入属性仍在同一批次内同步。
                for (const source of lane.dirty) {
                    if (source !== stream && !stream.contains(source)) continue;
                    let parent = source.parentNode, covered = false;
                    while (parent && parent !== stream.parentNode) {
                        if (lane.dirty.has(parent)) { covered = true; break; }
                        parent = parent.parentNode;
                    }
                    if (covered) continue;
                    const copy = lane.nodes.get(source);
                    if (copy && lane.owners.get(copy) === source) patchTree(source,copy,lane);
                    else patchTree(stream,lane.copy,lane);
                }
            }
            if (fresh) { lane.surface.append(lane.root); restoreInnerScroll(lane); }
            lane.dirty.clear();
        }
        function syncMirrors(full = false) {
            if (!active() || fixedMode()) return;
            // 当前列的隐藏镜像也保持就绪，鼠标换列时直接交接，不临时重建。
            lanes.forEach((lane, index) => {
                if (index < count) { syncMirror(lane,full || lane.needsFull); lane.needsFull = false; }
            });
        }
        function scheduleMirrors() { cancelAnimationFrame(mirrorFrame); mirrorFrame = requestAnimationFrame(()=>syncMirrors()); }
        function queueMirror(source) {
            lanes.forEach((lane,index) => {
                if (active() && index < count) lane.dirty.add(source);
                else { lane.dirty.clear(); lane.needsFull = true; }
            });
            if (active()) scheduleMirrors();
        }
        function renderScroll() {
            if(fixedMode()){
                if(!fixed||read(page).scrolling!=='linked')return;
                fixed.columns.forEach(column=>{const target=Math.min(offset,Math.max(0,column.scrollHeight-column.clientHeight));if(column.scrollTop!==target){column.scrollTop=target;column.assignedScroll=column.scrollTop;}});
            }else{
                stream.style.top = active() ? -(offset + live * height) + 'px' : '0px';
                lanes.forEach((lane, index) => { lane.surface.style.top = -(offset + index * height) + 'px'; lane.node.scrollTop = 0; });
            }
            viewport.scrollLeft = 0;
            const thumbHeight = Math.min(height, Math.max(32, height * (count * height) / (count * height + maximum)));
            progressThumb.style.height = thumbHeight + 'px';
            progressThumb.style.top = (maximum > 0 ? offset / maximum * (height - thumbHeight) : 0) + 'px';
            progress.setAttribute('aria-disabled', String(maximum === 0));
            progress.setAttribute('aria-valuemax', String(Math.round(maximum)));
            progress.setAttribute('aria-valuenow', String(Math.round(offset)));
            progress.setAttribute('aria-valuetext', Math.round(maximum > 0 ? offset / maximum * 100 : 0) + '%');
        }
        function activate(index) {
            if (!active() || fixedMode() || live === index) return;
            syncMirrors();
            setLive(live,false);
            // 隐藏镜像没有滚动布局，交接时在同一帧补回内层列表位置。
            restoreInnerScroll(lanes[live]);
            const parent = lanes[index].node;
            // moveBefore 保留原输入焦点、选区及组件状态，原事件监听器随原节点移动。
            if (parent.moveBefore) parent.moveBefore(stream, null); else parent.append(stream);
            live = index; setLive(index,true); renderScroll();
        }
        function setLive(index, value) {
            lanes[index].node.dataset.live = String(value);
            lanes[index].mirror.toggleAttribute('data-avatar-layer',page === 'dashboard' && value);
        }
        function addLane(index) {
            const node = document.createElement('div'); node.className = 'content-flow-lane'; node.dataset.live = String(index === live);
            const mirror = document.createElement('div'); mirror.className = 'content-flow-mirror'; mirror.inert = true; mirror.setAttribute('aria-hidden', 'true');
            const shadow = mirror.attachShadow({mode:'open'});
            document.querySelectorAll('link[rel="stylesheet"],head style').forEach(style => shadow.append(style.cloneNode(true)));
            // 显示镜像跟随原控件当前状态，不单独重新播放样式过渡而产生尺寸跳动。
            const projectionStyle = document.createElement('style');
            projectionStyle.textContent = '.content-flow-stream,.content-flow-stream *{transition:none!important}';
            // 看板动图始终由每列自己的显示层绘制，不随可编辑表单换列而换帧。
            projectionStyle.textContent += ':host([data-avatar-layer]) .content-flow-stream *{visibility:hidden!important}' +
                ':host([data-avatar-layer]) .content-flow-stream .char-icon img{visibility:visible!important;opacity:1!important}';
            shadow.append(projectionStyle);
            const surface = document.createElement('div'); surface.style.cssText = 'position:relative;display:flow-root;';
            shadow.append(surface); node.append(mirror); content.append(node);
            const lane = {node, mirror, surface, nodes:new WeakMap(), owners:new WeakMap(), scrolled:new WeakSet(), scrollSources:new Set(), dirty:new Set()}; lanes.push(lane);
            setLive(index,index === live);
            node.addEventListener('pointerenter', () => activate(index));
            // 触屏首次触碰时也先切换到真正的表单，再将操作交给原控件。
            node.addEventListener('pointerdown', event => {
                if (!active() || live === index) return;
                activate(index); const target = document.elementFromPoint(event.clientX, event.clientY);
                event.preventDefault(); target?.focus?.(); target?.click?.();
            }, true);
            return lane;
        }
        addLane(0).node.append(stream);
        function move(delta) {
            offset = Math.max(0, Math.min(maximum, offset + delta));
            cancelAnimationFrame(scrollFrame); scrollFrame = requestAnimationFrame(renderScroll);
        }
        function layout() {
            const width = container.clientWidth;
            const preference = read(page).columns;
            count = preference === 'auto' ? (width >= 2100 ? 3 : width >= 1380 ? 2 : 1) : Math.min(Number(preference), Math.max(1, Math.floor((width + 18) / 338)));
            const prefs=read(page);if(prefs.browsing==='single')count=1;
            const columns = (count > 1 && innerHeight >= 550)||prefs.browsing!=='scroll';
            const useFixed=columns&&(prefs.browsing==='single'||prefs.arrangement!=='continuous');
            if(prefs.browsing!=='single')restoreSingleExpansion();
            if(!useFixed)restoreFixed();
            document.documentElement.dataset.contentFlow = columns ? 'columns' : 'single';
            document.documentElement.dataset.contentArrangement=useFixed?(prefs.browsing==='single'?'row':prefs.arrangement):'continuous';
            if (columns) container.closest('.main-content').scrollTop = 0;
            while (lanes.length < count) addLane(lanes.length);
            if (live >= count || !columns) {
                setLive(live,false);
                if (lanes[0].node.moveBefore) lanes[0].node.moveBefore(stream, null); else lanes[0].node.append(stream);
                live = 0; setLive(0,true);
            }
            lanes.forEach((lane,index) => { lane.node.hidden = index >= count; });
            content.style.setProperty('--content-flow-count', count);
            const footerNode=definition.footer?container.querySelector(definition.footer):null;
            const footerHeight=footerNode?.getBoundingClientRect().height||0;
            const footer=footerHeight+(footerHeight&&footerNode.parentElement===viewport.parentElement?(parseFloat(getComputedStyle(footerNode.parentElement).rowGap)||0):0);
            height = Math.max(180, innerHeight - viewport.getBoundingClientRect().top - 12 - footer);
            content.style.setProperty('--content-flow-height', height + 'px');
            viewport.dataset.fixedScrolling=useFixed?prefs.scrolling:'';
            viewport.dataset.browsing=prefs.browsing;
            if(useFixed){layoutFixed(prefs);viewport.setAttribute('aria-label',text('content_columns_title'));return;}
            // 总高度来自没有分栏的原内容，连续窗口之间严格相差一个可见高度。
            maximum = columns ? Math.max(0, stream.getBoundingClientRect().height - count * height) : 0;
            offset = Math.min(offset, maximum); renderScroll(); syncMirrors(true);
            progress.setAttribute('aria-label', english() ? 'Overall content progress' : '整体内容进度');
            progress.title = english() ? 'Drag to adjust overall progress' : '拖动调整整体进度';
            viewport.setAttribute('aria-label', text('content_columns_title'));
        }
        function schedule() { cancelAnimationFrame(frame); frame = requestAnimationFrame(layout); }
        function dragProgress(clientY, grab) {
            const bounds = progress.getBoundingClientRect(), thumb = progressThumb.getBoundingClientRect();
            const travel = bounds.height - thumb.height;
            offset = travel > 0 ? Math.max(0, Math.min(1, (clientY - bounds.top - grab) / travel)) * maximum : 0;
            cancelAnimationFrame(scrollFrame); renderScroll();
        }
        progress.addEventListener('pointerdown', event => {
            if (!active() || event.button !== 0 || maximum <= 0) return;
            event.preventDefault(); progress.focus();
            const thumb = progressThumb.getBoundingClientRect();
            drag = {id:event.pointerId, grab:event.target === progressThumb ? event.clientY - thumb.top : thumb.height / 2};
            progress.setPointerCapture(event.pointerId); dragProgress(event.clientY, drag.grab);
        });
        progress.addEventListener('pointermove', event => { if (drag?.id === event.pointerId) dragProgress(event.clientY, drag.grab); });
        const endDrag = event => {
            if (drag?.id !== event.pointerId) return;
            drag = null;
            if (progress.hasPointerCapture(event.pointerId)) progress.releasePointerCapture(event.pointerId);
        };
        progress.addEventListener('pointerup', endDrag); progress.addEventListener('pointercancel', endDrag);
        progress.addEventListener('lostpointercapture', () => { drag = null; });
        viewport.addEventListener('click',event=>{
            if(read(page).browsing!=='single')return;
            const roots=fixed?.groups.flat()||[];const owner=roots.find(node=>node.contains(event.target));const root=owner?.matches('.gallery-category-unit')?owner.querySelector('.category-box'):owner;if(!root)return;
            const header=event.target.closest('summary,.category-header,[onclick^="toggleCardSection"],[onclick^="toggleMasterSettingsAccordion"],[onclick^="togglePoolsAccordion"]');
            if(header&&header.parentElement===root&&!event.target.closest('input,select,button,a,.custom-select-ui')){event.preventDefault();event.stopImmediatePropagation();}
        },true);
        document.addEventListener('keydown',event=>{
            if(read(page).browsing==='scroll'||!active()||event.defaultPrevented||event.repeat||(window.Dialog?.isOpen?.()||document.querySelector('dialog[open]'))||event.target.closest('input,select,textarea,[contenteditable],.custom-select-ui,[role=listbox],[role=combobox],[role=slider]')||event.ctrlKey||event.altKey||event.metaKey)return;
            const delta=event.key==='ArrowRight'?1:event.key==='ArrowLeft'?-1:0;
            if(delta){event.preventDefault();goSinglePage(pageIndex+delta);}
        });
        viewport.addEventListener('wheel', event => {
            if(read(page).browsing!=='scroll'){
                if(!active()||window.Dialog?.isOpen?.()||event.ctrlKey||!event.deltaY||Math.abs(event.deltaX)>Math.abs(event.deltaY)||event.target.closest('input,select,textarea,[contenteditable],.custom-select-ui,.content-single-dots,[role=listbox]'))return;
                const now=performance.now(),fresh=now-wheelLast>=wheelPause,direction=Math.sign(event.deltaY);
                wheelLast=now;clearTimeout(wheelIdleTimer);
                let nestedCanScroll=false;
                for(let node=event.target;node instanceof Element&&node!==viewport;node=node.parentElement){
                    if(fixed?.columns.includes(node))break;
                    const style=getComputedStyle(node);
                    if(/(auto|scroll)/.test(style.overflowY)&&node.scrollHeight>node.clientHeight+1&&(event.deltaY<0?node.scrollTop>0:node.scrollTop+node.clientHeight<node.scrollHeight-2)){nestedCanScroll=true;break;}
                }
                if(nestedCanScroll){wheelReady=0;return;}
                const boundary=singleBoundary(direction);
                if(boundary){
                    event.preventDefault();
                    if(fresh&&wheelReady===direction){goSinglePage(pageIndex+direction);wheelReady=0;}
                }else wheelReady=0;
                const index=pageIndex;
                wheelIdleTimer=setTimeout(()=>{if(index===pageIndex&&read(page).browsing!=='scroll')wheelReady=singleBoundary(direction)?direction:0;},wheelPause);
                if(read(page).browsing==='single'||boundary)return;
            }
            if(fixedMode()&&read(page).scrolling==='independent')return;
            if (!active() || event.ctrlKey || !event.deltaY) return;
            for (let node = event.target; node instanceof Element && node !== viewport; node = node.parentElement) {
                const style = getComputedStyle(node);
                if (/(auto|scroll)/.test(style.overflowY) && node.scrollHeight > node.clientHeight + 1 &&
                    (event.deltaY < 0 ? node.scrollTop > 0 : node.scrollTop + node.clientHeight < node.scrollHeight - 1)) return;
            }
            event.preventDefault(); move(event.deltaY * (event.deltaMode === 1 ? 20 : event.deltaMode === 2 ? height : 1));
        }, {passive:false});
        viewport.addEventListener('keydown', event => {
            if(fixedMode()&&read(page).scrolling==='independent')return;
            if (!active() || event.target.closest('input,textarea,select,button,[contenteditable="true"],.custom-select-ui') || event.ctrlKey || event.altKey || event.metaKey) return;
            const steps = {ArrowDown:40, ArrowUp:-40, PageDown:height * .85, PageUp:-height * .85, Home:-maximum, End:maximum};
            if (event.key in steps) { event.preventDefault(); move(steps[event.key]); }
        });
        const mirrorControl = event => queueMirror(event.target);
        stream.addEventListener('input', mirrorControl, true); stream.addEventListener('change', mirrorControl, true); stream.addEventListener('scroll', mirrorControl, true);
        stream.addEventListener('focusin', event => {
            if(fixedMode())return;
            if (!active()) return;
            const rect = event.target.getBoundingClientRect(), source = stream.getBoundingClientRect();
            const y = rect.top - source.top;
            const index = Math.floor((y - offset) / height);
            if (index >= 0 && index < count) activate(index);
            else { offset = Math.max(0, Math.min(maximum, y - live * height - 30)); renderScroll(); }
        });
        window.addEventListener('resize', schedule);
        new ResizeObserver(schedule).observe(container);
        new ResizeObserver(schedule).observe(stream);
        new MutationObserver(records => {
            if(fixedMode()){
                if(records.some(record=>record.type==='childList'||record.type==='characterData'||record.attributeName==='open'||record.attributeName==='hidden'))schedule();
                return;
            }
            for (const record of records) {
                if (record.target === stream && record.type === 'attributes' && record.attributeName === 'style') continue;
                queueMirror(record.target);
            }
        }).observe(stream, {childList:true, subtree:true, attributes:true, characterData:true});
        new MutationObserver(schedule).observe(container, {childList:true});
        new MutationObserver(scheduleMirrors).observe(document.body, {attributes:true, attributeFilter:['class']});
        const layoutAttributes=['data-page-content','data-page-header','data-layout','data-header-layout'];
        new MutationObserver(records=>{
            if(records.some(record=>layoutAttributes.includes(record.attributeName)))schedule();
            else scheduleMirrors();
        }).observe(document.documentElement, {attributes:true, attributeFilter:['data-theme','lang','style','data-gold-ordinal-mode',...layoutAttributes]});
        window.addEventListener('storage', event => {
            const key = window.VersionStorage ? window.VersionStorage.eventKey(event.key) : event.key;
            if (key === null || key === keyFor(page)) schedule();
        });
        document.addEventListener('content-columns-change', event => { if (event.detail.page === page) schedule(); });
        runtime = {beforeRender(root){if(fixed&&root&&(fixed.host.contains(root)||root.contains(fixed.grid))){restoreFixed();schedule();}},reveal(element) {
            if (!active() || !stream.contains(element)) return false;
            if(fixedMode()){
                if(fixed&&fixed.browsing!=='scroll'){
                    const index=fixed.items.findIndex(node=>node===element||node.contains(element));
                    const target=fixed.browsing==='single'?singleSlides().findIndex(group=>group.includes(fixed.items[index])):Math.floor(index/Number(fixed.pageSize));
                    if(index>=0&&fixed.browsing==='single')fixed.singleAnchor=fixed.items[index];
                    if(index>=0&&target>=0&&target!==pageIndex){pageIndex=target;offset=0;resetSingleWheel();layout();}
                }
                const column=element.closest('.content-fixed-column');if(!column)return false;
                column.scrollTop+=element.getBoundingClientRect().top-column.getBoundingClientRect().top-30;return true;
            }
            const y = element.getBoundingClientRect().top - stream.getBoundingClientRect().top;
            activate(0); offset = Math.max(0, Math.min(maximum, y - height * .25)); renderScroll(); return true;
        }};
        layout();
    }
    document.addEventListener('DOMContentLoaded', () => {
        document.querySelectorAll('[data-content-columns-controls]').forEach(host => mountControls(host, host.dataset.contentColumnsControls));
        requestAnimationFrame(mount);
    });
    document.addEventListener('content-columns-change', () => { if (!runtime) requestAnimationFrame(mount); });
    window.addEventListener('storage', event => {
        const changed = window.VersionStorage ? window.VersionStorage.eventKey(event.key) : event.key;
        if (!runtime && (changed === null || changed === keyFor(currentPage()))) requestAnimationFrame(mount);
    });
})();
