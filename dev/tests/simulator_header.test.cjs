const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../../pages/simulator.js'),'utf8');
const start=source.indexOf('        function renderSimulatorHeader(){'),end=source.indexOf('        const { activeTiers',start),code=source.slice(start,end);
test('模拟器标题显示当前游戏和卡池，支持预设翻译与自定义双语名称',()=>{
 let lang='zh',meta={name:'自定义池',en:'Custom pool'},translations={game_hsr:'崩坏：星穹铁道',pool_hsr_char_up:'角色活动跃迁',sim_title:'抽卡模拟器'};
 const nodes={'sim-game-name':{parentElement:{setAttribute(){}}},'sim-pool-name':{}};
 const c=vm.createContext({window:{getTrans:key=>translations[key]||key},localStorage:{getItem:()=>lang},document:{getElementById:id=>nodes[id]},currentGameId:'hsr',currentPool:'char_up',gameInfo:{gameName:'旧名称',enGameName:'Old name'},rules:{info:{}},GameData:{loadPoolMeta:()=>meta}});
 vm.runInContext(code,c);c.renderSimulatorHeader();assert.equal(nodes['sim-game-name'].textContent,'崩坏：星穹铁道');assert.equal(nodes['sim-pool-name'].textContent,'角色活动跃迁');
 lang='en';translations={game_hsr:'Honkai: Star Rail',pool_hsr_char_up:'Character Event Warp'};c.renderSimulatorHeader();assert.equal(nodes['sim-game-name'].textContent,'Honkai: Star Rail');assert.equal(nodes['sim-pool-name'].textContent,'Character Event Warp');
 c.currentGameId='custom';c.gameInfo={gameName:'自定义游戏',enGameName:'Custom game'};c.renderSimulatorHeader();assert.equal(nodes['sim-game-name'].textContent,'Custom game');assert.equal(nodes['sim-pool-name'].textContent,'Custom pool');
 c.gameInfo.enGameName='';meta.en='';c.renderSimulatorHeader();assert.equal(nodes['sim-game-name'].textContent,'自定义游戏');assert.equal(nodes['sim-pool-name'].textContent,'自定义池');
});
