const test = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs'), vm = require('node:vm'), path = require('node:path');
function load(file, values = {}) {
    const context = {window:{},localStorage:{getItem:key=>values[key] ?? null, setItem(){assert.fail('公共读取逻辑不能写入存储');}}};
    vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../..', file),'utf8'),context);
    return context.window;
}

test('保存顺序支持部分清单、重复和失效ID，未列出项稳定排在末尾', () => {
    const api = load('logic/list_order.js').ListOrder;
    const a={id:'a'},b={id:'b'},c={id:'c'},d={id:'d'},rows=[a,b,c,d];
    assert.equal(api.sort(rows,['c','missing','a','c']),rows);
    assert.deepEqual(rows,[c,a,b,d]);
    api.sort(rows,[]); assert.deepEqual(rows,[c,a,b,d]);
    api.sort(rows,null); assert.deepEqual(rows,[c,a,b,d]);
    const nodes=[{dataset:{pool:'x'}},{dataset:{pool:'y'}}];
    api.sort(nodes,['y'],node=>node.dataset.pool);
    assert.equal(nodes[0].dataset.pool,'y');
    assert.equal(rows[0],c);
});

test('保存顺序没有999项限制，大清单仍把新增条目放最后', () => {
    const api=load('logic/list_order.js').ListOrder, ids=Array.from({length:1200},(_,i)=>String(i));
    const rows=[{id:'new'},{id:'1199'},{id:'0'}];
    api.sort(rows,ids);assert.deepEqual(rows.map(row=>row.id),['0','1199','new']);
});

test('偏好默认值一致，依赖选项隐藏时保留记住起点和历史同步选择', () => {
    const values={},api=load('logic/app_preferences.js',values).AppPreferences;
    assert.deepEqual({...api.simulator()},{currency:false,start:false,records:false,remember:true,showRemember:false});
    assert.deepEqual({...api.playerData()},{mode:'single',lowOverflow:true,sync:true,history:false,showHistory:true});
    for(const start of [false,true])for(const records of [false,true])for(const remember of [false,true]){
        Object.assign(values,{GM_Sim_Start_Setup:String(start),GM_Sim_Keep_Records:String(records),GM_Sim_Remember_Start:String(remember)});
        assert.equal(api.simulator().showRemember,start&&!records);
        assert.equal(api.simulator().remember,remember);
    }
    Object.assign(values,{GM_Dashboard_Sync_Player:'false',GM_Dashboard_Sync_Existing:'true',GM_Player_Data_Mode:'multi',GM_Sim_Start_Auto_Low_Overflow:'false'});
    assert.deepEqual({...api.playerData()},{mode:'multi',lowOverflow:false,sync:false,history:true,showHistory:false});
    values.GM_Dashboard_Sync_Player='true';assert.equal(api.playerData().showHistory,true);
    assert.equal(api.playerData().history,true);
});
