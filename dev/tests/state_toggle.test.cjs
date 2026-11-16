const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const c=vm.createContext({window:{}});vm.runInContext(fs.readFileSync(path.join(__dirname,'../../ui/state_toggle.js'),'utf8'),c);
test('通用状态开关支持标签、双态文案、锁定及数据绑定，并转义外部文字',()=>{
 const html=c.window.StateToggle.render({label:'<测试>',checked:true,disabled:true,onText:'已完成',offText:'未完成',name:'flag',data:{startField:'cancel:0',startPool:'a"b', 'bad key':'unsafe'}});
 assert.match(html,/role="switch"/);assert.match(html,/checked disabled/);assert.match(html,/&lt;测试&gt;/);assert.match(html,/data-start-field="cancel:0"/);assert.match(html,/data-start-pool="a&quot;b"/);assert.doesNotMatch(html,/unsafe/);assert.match(html,/已完成/);assert.match(html,/未完成/);
 const blank=c.window.StateToggle.render({label:'Enabled'});assert.doesNotMatch(blank,/\schecked|\sdisabled/);
});
