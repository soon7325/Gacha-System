// 从真实组件初始化和按钮点击验证，避免只测未接通的定位函数。
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const css = fs.readFileSync(path.join(__dirname, '../../ui/select_ui.css'), 'utf8');
assert.match(css, /\.custom-select-ui-menu\s*\{[^}]*display:\s*none\s*;/, '收起菜单必须彻底隐藏，避免首次打开撑出滚动区域');
assert.match(css, /\.custom-select-ui-menu\.custom-select-floating\s*\{[^}]*display:\s*block\s*;/, '展开菜单必须能测量并显示');
function element() {
    const classes = new Set();
    return { style:{}, children:[], isConnected:true, attributes:{},
        classList:{ add: v=>classes.add(v), remove:v=>classes.delete(v), contains:v=>classes.has(v), toggle(v,on) { if(on) classes.add(v); else classes.delete(v); } },
        setAttribute(k,v) { this.attributes[k]=v; }, getAttribute(k) { return this.attributes[k]; },
        appendChild(child) { child.parentNode=this; this.children.push(child); },
        addEventListener() {}, querySelectorAll() { return []; }, contains() { return false; }
    };
}
for(const bottom of [630,60]) for(const inDialog of [false,true]) {
    const trigger=element(), menu=element(), label=element(), wrapper=element(), body=element();
    trigger.getBoundingClientRect=()=>({top:bottom-30,bottom,left:20,width:200}); menu.scrollHeight=140;
    wrapper.querySelector=selector=>selector.includes('trigger')?trigger:selector.includes('menu')?menu:label;
    const select=element(); select.options=[{text:'One',value:'one'}]; select.selectedIndex=0;
    select.getBoundingClientRect=()=>({width:200}); select.parentNode={insertBefore(){}};
    const handlers={}; let created=0;
    const document={body,readyState:'loading',createElement(){return created++===0?wrapper:element();},addEventListener(name,fn){handlers[name]=fn;}};
    const window={innerHeight:700,innerWidth:1000,addEventListener(){}};
    let onMutations;
    vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../../ui/select_ui.js'),'utf8'),{window,document,MutationObserver:class {constructor(callback){onMutations=callback;} observe(){}},Event:class {}});
    window.refreshCustomDropdowns({querySelectorAll:()=>[select]},false);
    const dialog=element();dialog.contains=node=>node===select;
    select.closest=selector=>selector==='dialog[open]'?(inDialog?dialog:null):select;
    const initialCreated=created;
    select.disabled=true;
    onMutations([{type:'attributes',attributeName:'disabled',target:select}]);
    assert.equal(trigger.disabled,true,'只读状态直接同步至按钮');
    assert.equal(created,initialCreated,'切换禁用状态不重建选项');
    select.disabled=false;
    onMutations([{type:'attributes',attributeName:'disabled',target:select}]);
    assert.equal(trigger.disabled,false,'解除只读后按钮恢复');
    trigger.onclick({stopPropagation(){}});
    assert.equal(menu.parentNode,inDialog?dialog:body,'原生模态框菜单留在顶层；普通菜单移至 body');
    assert.equal(wrapper.classList.contains('opens-up'),bottom===630);
    assert.equal(trigger.attributes['aria-expanded'],'true');
    assert.equal(menu.style.position,'fixed');
    if(bottom===630) assert.ok(parseFloat(menu.style.top)<600);
    else assert.ok(parseFloat(menu.style.top)>60);
    handlers.keydown({key:'Escape'});
    assert.equal(menu.parentNode,wrapper,'关闭后归还菜单');
    assert.equal(trigger.attributes['aria-expanded'],'false');
    let prevented=0, focused=0;
    trigger.focus=options=>{assert.equal(options.preventScroll,true);focused++;};
    select.nextElementSibling=wrapper;
    const fieldLabel={control:select};
    handlers.click({target:{closest:selector=>selector==='label'?fieldLabel:null},preventDefault(){prevented++;}});
    assert.equal(prevented,1,'字段标题/留白不能激活隐藏原生下拉框');
    assert.equal(focused,1,'改为聚焦可见按钮且不触发滚动');
    handlers.click({target:{closest:selector=>selector==='label'?fieldLabel:selector==='button, input, textarea, select, a'?trigger:null},preventDefault(){assert.fail('可见控件自身点击不应被阻止');}});
    fieldLabel.control={classList:{contains:()=>false}};
    handlers.click({target:{closest:selector=>selector==='label'?fieldLabel:null},preventDefault(){assert.fail('普通表单标签保持默认行为');}});
    trigger.onclick({stopPropagation(){}});
    select.disabled = true;
    // 菜单已移到 body 时，禁用状态也必须阻止选项回调写入。
    select.dispatchEvent = () => assert.fail('禁用后不应派发 change');
    menu.children[0].onclick({stopPropagation(){}});
    assert.equal(menu.parentNode,wrapper);
    assert.equal(select.selectedIndex,0);
    select.disabled = false;
    trigger.onclick({stopPropagation(){}});
    select.disabled = true;
    onMutations([{type:'attributes',attributeName:'disabled',target:select}]);
    assert.equal(menu.parentNode,wrapper,'锁定立即收起已打开菜单');
    assert.equal(trigger.disabled,true);
    select.disabled=false;trigger.onclick({stopPropagation(){}});
    handlers.close({target:dialog});
    assert.equal(menu.parentNode,wrapper,'所属弹窗关闭时归还菜单');
}
console.log('PASS：真实按钮点击调用自动定位、底部向上、顶部向下、Escape关闭并还原菜单');
