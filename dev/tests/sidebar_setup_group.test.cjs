const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname,'../../ui/layout.js'),'utf8');
const start = source.indexOf('        const isGameSetupActive =');
const code = source.slice(start,source.indexOf('        groupWrapper.appendChild(poolList);',start));
function node() { return {children:[],style:{},attributes:{},appendChild(child){this.children.push(child);},append(...children){this.children.push(...children);},setAttribute(key,value){this.attributes[key]=value;}}; }
function render(state = {}, file = 'gallery_setup.html') {
    const stored = new Map([['GM_Setup_Collapse_State',JSON.stringify(state)]]);
    const poolList = node();
    const context = vm.createContext({document:{createElement:node},localStorage:{getItem:key=>stored.get(key)??null,setItem:(key,value)=>stored.set(key,value)},safeParse:JSON.parse,
        currentFile:file,currentGameId:'game',gameId:'game',gameIdx:0,isPreset:false,t:{nav_currency_setup:'货币系统配置页'},poolList,
        sidebar:{classList:{contains:()=>false}},setSidebarState(){},encodeURIComponent});
    vm.runInContext(code,context);
    return {stored,row:poolList.children[1],children:poolList.children[2]};
}
const view = render();
assert.equal(view.children.hidden,true);
assert.equal(view.row.children[0].href,'gallery_setup.html?gameId=game');
assert.equal(view.children.children[0].href,'user_data.html?gameId=game');
const toggle = view.row.children[1];
toggle.onclick({preventDefault(){},stopPropagation(){}});
assert.equal(view.children.hidden,false);
assert.equal(toggle.attributes['aria-expanded'],'true');
assert.equal(JSON.parse(view.stored.get('GM_Setup_Collapse_State')).game,false);
toggle.onclick({preventDefault(){},stopPropagation(){}});
assert.equal(view.children.hidden,true);
assert.equal(render({game:false}).children.hidden,false);
assert.equal(render({},'currency_setup.html').children.hidden,false);
assert.equal(render({},'user_data.html').children.hidden,false);
assert.equal(render({game:true},'currency_setup.html').children.hidden,true,'货币页也尊重手动收起');
console.log('PASS：游戏配置子菜单、独立展开收起、状态持久化、当前货币页和链接');
