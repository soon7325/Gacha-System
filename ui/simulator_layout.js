/** 窄窗口吸顶操作区：按实际顶栏和按钮高度为结果区留出可滚动空间。 */
(function(){
    'use strict';
    function mount(){
        const main=document.querySelector('.simulator-main-content');
        const header=main?.querySelector('.sim-page-header'),actions=main?.querySelector('.sim-pull-controls');
        if(!main||!header||!actions)return;
        const measure=()=>{
            main.style.setProperty('--sim-header-height',Math.ceil(header.getBoundingClientRect().height)+8+'px');
            main.style.setProperty('--sim-actions-height',Math.ceil(actions.getBoundingClientRect().height)+'px');
        };
        const observer=new ResizeObserver(measure);
        observer.observe(header);observer.observe(actions);measure();
    }
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();
