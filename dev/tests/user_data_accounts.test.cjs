const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../../ui/user_data_accounts.js'),'utf8');
test('账户列表跨页同步顺序、名称和模式，保留选择；普通记录写入不重建列表，关闭弹窗延后刷新',()=>{
    const handlers=new Map();let rows=[{id:'a',name:'A',isDefault:true},{id:'b',name:'B'}],mode='multi',active=true,updates=0;
    const select={value:'b',options:[],replaceChildren(){this.options=[];},append(option){this.options.push(option);}};
    const window={addEventListener(type,fn){if(!handlers.has(type))handlers.set(type,new Set());handlers.get(type).add(fn);},removeEventListener(type,fn){handlers.get(type).delete(fn);},VersionStorage:{eventKey:key=>key?.replace('VERSION:','')}};
    const c=vm.createContext({window,ItemFormat:{getLanguage:()=> 'zh'},UserDataProfiles:{read:()=>({items:rows}),mode:()=>mode,key:game=>'profiles_'+game,defaultRow:items=>items.find(row=>row.isDefault)||items[0],label:row=>row.name},document:{createElement:()=>({})}});
    vm.runInContext(source,c);const api=c.window.UserDataAccountsUI;
    const watcher=api.watch('game',items=>{updates++;api.fillSelect(select,items,{selectedId:select.value});},{active:()=>active});
    const fire=(type,event={})=>{for(const fn of handlers.get(type)||[])fn(event);};
    rows=[rows[1],rows[0]];fire('storage',{key:'VERSION:profiles_other'});assert.equal(updates,0);
    fire('storage',{key:'VERSION:profiles_game'});assert.deepEqual(select.options.map(o=>o.value),['b','a']);assert.equal(select.value,'b');assert.equal(updates,1);
    fire('focus');assert.equal(updates,1);rows[0].dashboardRecords={pool:{records:[1,2]}};fire('storage',{key:'VERSION:profiles_game'});assert.equal(updates,1);
    active=false;rows=[rows[1],rows[0]];fire('focus');assert.equal(updates,1);
    active=true;watcher.refresh();assert.deepEqual(select.options.map(o=>o.value),['a','b']);assert.equal(select.value,'b');
    rows[1].name='Renamed';fire('user-data-accounts-change',{detail:{gameId:'game'}});assert.equal(select.options[1].textContent,'Renamed');
    mode='single';fire('storage',{key:'GM_Player_Data_Mode'});assert.equal(updates,4);
    watcher.destroy();rows.reverse();fire('focus');assert.equal(updates,4);
});
