const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');const vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../ui/select_ui.js'),'utf8');
const bindingCode=source.slice(source.indexOf('    const selectBindings'),source.indexOf('    function closeDropdown'));
class Select {
    constructor(){this.listeners={};this.options=[{value:'dark',text:'Dark'},{value:'light',text:'Light'}];this.index=0;}
    get value(){return this.options[this.index]?.value||'';}
    set value(value){this.index=this.options.findIndex(option=>option.value===value);}
    get selectedIndex(){return this.index;}
    set selectedIndex(value){this.index=Number(value);}
    addEventListener(name,fn){(this.listeners[name]||=([])).push(fn);}
}
const context={HTMLSelectElement:Select};vm.runInNewContext(bindingCode,context);
const select=new Select();let shown='',changes=0;
select.addEventListener('change',()=>changes++);
const sync=()=>{shown=select.options[select.selectedIndex]?.text||'';};
context.bindProgrammaticUpdates(select,sync);
select.value='light';assert.equal(shown,'Light');assert.equal(changes,0);
select.selectedIndex=0;assert.equal(shown,'Dark');
select.value='missing';assert.equal(shown,'');assert.equal(select.selectedIndex,-1);
select.options=[{value:'zh',text:'Chinese'},{value:'en',text:'English'}];
let syncs=0;context.bindProgrammaticUpdates(select,()=>{syncs++;sync();});
select.value='en';assert.equal(shown,'English');assert.equal(syncs,1);
assert.equal(select.listeners.change.length,2,'重复重建不累积同步监听器');
select.listeners.change.forEach(fn=>fn());assert.equal(syncs,2);
assert.equal(Select.prototype.hasOwnProperty('value'),true);
assert.equal(new Select().hasOwnProperty('value'),false,'不修改原型或未美化控件');
console.log('PASS：程序赋值与索引即时回显、空选择、语言重建、监听器复用、不触发业务事件');
