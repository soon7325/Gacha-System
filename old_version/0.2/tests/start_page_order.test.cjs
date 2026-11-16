const assert=require('node:assert/strict');
const fs=require('node:fs');const vm=require('node:vm');const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../pages/start_page_picker.js'),'utf8');
const code=source.slice(source.indexOf('    function sidebarOrder('),source.indexOf('    function refresh('));
function group(id,pools) {return {dataset:{gameId:id},children:pools.map(pool=>({value:'dashboard.html?gameId='+id+'&pool='+pool})),appendChild(option){this.children.splice(this.children.indexOf(option),1);this.children.push(option);}};}
const base={children:[]},official=group('zzz',['one','two']),custom=group('g_custom',['a','b']),extra=group('new',['p']);
let sidebar=[custom,official];
const context={URL,window:{location:{href:'http://localhost/settings.html'}},document:{querySelectorAll:()=>sidebar.map(group=>({querySelectorAll:()=>[...group.children].reverse().map(option=>({href:option.value}))}))}};
vm.runInNewContext(code,context);
let ordered=context.sidebarOrder({children:[base,official,custom,extra]});
assert.equal(ordered[0],base);assert.equal(ordered[1],custom);assert.equal(ordered[2],official);assert.equal(ordered[3],extra);
assert.ok(custom.children[0].value.endsWith('pool=b'));
sidebar=[official,custom];ordered=context.sidebarOrder({children:[base,official,custom,extra]});assert.equal(ordered[1],official);
console.log('PASS：基础优先、预设和自建游戏跟随侧栏、卡池跟随侧栏、下次打开读取新顺序');

for (const id of ['zzz', 'g_custom']) {
    const game = group(id, ['unmatched', 'one', 'two']);
    const setup = {value:'gallery_setup.html?gameId='+id};
    game.children.splice(1,0,setup);
    context.document.querySelectorAll = () => [{querySelectorAll:()=>[
        {href:setup.value},
        {href:'dashboard.html?gameId='+id+'&pool=two'},
        {href:'dashboard.html?gameId='+id+'&pool=one'}
    ]}];
    context.sidebarOrder({children:[base,game]});
    assert.equal(game.children.at(-1),setup);
    assert.ok(game.children[0].value.endsWith('pool=two'));
    assert.ok(game.children[1].value.endsWith('pool=one'));
    assert.ok(game.children[2].value.endsWith('pool=unmatched'));
}
console.log('PASS：预设/自建游戏配置入口始终最后，未匹配卡池也在配置入口之前');

const cleanGame=group('clean',['one','two']);
const cleanSetup={value:'gallery_setup.html?gameId=clean'};cleanGame.children.push(cleanSetup);
context.document.querySelectorAll=()=>[{querySelectorAll:()=>[
 {href:'https://example.test/dashboard?gameId=clean&pool=two'},
 {href:'https://example.test/dashboard?gameId=clean&pool=one'},
 {href:'https://example.test/gallery_setup?gameId=clean'}
]}];
context.sidebarOrder({children:[base,cleanGame]});
assert.ok(cleanGame.children[0].value.endsWith('pool=two'));
assert.equal(cleanGame.children.at(-1),cleanSetup);
console.log('PASS：线上无扩展名链接与本地 .html 链接排序一致');
