const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const read=f=>fs.readFileSync(path.join(__dirname,'../..',f),'utf8');
test('预览模式保留搜索、锁住数字及加减，解除后恢复原始锁定与草稿',()=>{
 const classes=new Set(),nodes={'data-preview-toggle':{style:{}},'data-preview-fields':{disabled:false},'data-new':{},'data-merge':{}};
 const original={locked:{disabled:true,value:30},editable:{disabled:false,value:45},search:{disabled:false,value:'代理人'}};
 const controls=[original.locked,original.editable];nodes['data-preview-fields'].querySelectorAll=selector=>{assert.equal(selector,'input:not([data-start-search]),select,textarea,button');return controls;};
 const classList={contains:k=>classes.has(k),toggle(k){classes.has(k)?classes.delete(k):classes.add(k);}};
 const c=vm.createContext({window:{},document:{getElementById:id=>nodes[id],body:{classList}}});
 vm.runInContext(read('ui/preview_lock.js'),c);
 c.preview=c.window.PreviewLock.create({buttonId:'data-preview-toggle'});c.node=id=>nodes[id];
 const source=read('pages/user_data.js'),start=source.indexOf('    const previewControls=new Map();'),end=source.indexOf('    function report(',start);
 vm.runInContext(source.slice(start,end),c);c.syncPreview();assert.equal(nodes['data-preview-fields'].disabled,false);
 c.preview.toggle();c.syncPreview();assert.equal(original.editable.disabled,true);assert.equal(original.locked.disabled,true);assert.equal(original.search.disabled,false);assert.equal(nodes['data-preview-fields'].disabled,false);assert.equal(nodes['data-new'].disabled,true);assert.equal(nodes['data-merge'].disabled,true);
 const dynamic={disabled:false};controls.push(dynamic);c.syncPreview();assert.equal(dynamic.disabled,true,'搜索或兑换重绘后的新控件仍锁定');
 c.preview.toggle();c.syncPreview();assert.equal(nodes['data-preview-fields'].disabled,false);assert.deepEqual(original,{locked:{disabled:true,value:30},editable:{disabled:false,value:45},search:{disabled:false,value:'代理人'}});assert.equal(dynamic.disabled,false);
 assert.match(read('user_data.html'),/<fieldset id="data-preview-fields"[^>]*><div id="data-list"/);
 assert.match(source,/isReadOnly:\(\)=>preview.isLocked\(\)/);
});
