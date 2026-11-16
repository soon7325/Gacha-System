const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../../ui/user_data_accounts.js'),'utf8');
function setup(){
    let language='zh',result={created:false,legacyCreated:false,errors:[]};const messages=[];
    const c={window:{},ItemFormat:{getLanguage:()=>language},showToast:(...args)=>messages.push(args),
        UserDataTools:{ensureDefault:()=>result},UserDataProfiles:{defaultRow:rows=>rows.find(row=>row.isDefault)||rows[0]||null,label:row=>language==='en'?row.en||row.name:row.name||row.en},
        document:{createElement:()=>({})}};
    vm.runInNewContext(source,c);
    const select={children:[],replaceChildren(){this.children=[];},append(option){this.children.push(option);},dispatchEvent(){assert.fail('填充选项不能触发业务事件');}};
    return {api:c.window.UserDataAccountsUI,select,messages,lang:value=>language=value,result:value=>result=value};
}
test('已删除的上次账户回退默认，指定有效账户优先；空账户禁用，名称只写文本',()=>{
    const h=setup(),rows=[{id:'a',name:'<b>账号 A</b>',en:'Account A'},{id:'b',name:'账号 B',en:'Account B',isDefault:true}];
    assert.equal(h.api.fillSelect(h.select,rows,{selectedId:'deleted'}).id,'b');assert.equal(h.select.value,'b');assert.equal(h.select.disabled,false);
    assert.equal(h.select.children[0].textContent,'<b>账号 A</b>');assert.equal(h.select.children[1].textContent,'账号 B');
    h.lang('en');h.api.fillSelect(h.select,rows,{selectedId:'a'});assert.equal(h.select.value,'a');assert.equal(h.select.children[1].textContent,'Account B');
    h.api.fillSelect(h.select,[]);assert.equal(h.select.disabled,true);assert.equal(h.select.value,'');assert.equal(h.select.children[0].textContent,'No saved data');
});
test('账户初始化只在实际创建或转换时提示，损坏旧记录独立报告',()=>{
    const h=setup();h.api.initialize('hsr');assert.equal(h.messages.length,0);
    h.result({created:true,legacyCreated:true,errors:['bad_pool']});h.api.initialize('hsr');
    assert.equal(h.messages.length,2);assert.match(h.messages[0][0],/旧数据账户/);assert.equal(h.messages[1][1],'warn');
    h.lang('en');h.result({created:true,legacyCreated:false,errors:[]});h.api.initialize('hsr');assert.match(h.messages[2][0],/empty default account/);
});
