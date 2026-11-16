const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../pages/dashboard.js'), 'utf8');
const header = source.slice(source.indexOf('function renderHeader()'), source.indexOf('        function renderDashboard()'));
for (const language of ['zh', 'en']) {
    const title = {}, pool = {};
    const storedInfo = { gameName: '测试', enGameName: 'test' };
    const context = vm.createContext({
        sysLang: language, gameInfo: storedInfo, currentGameId: 'custom', currentPool: 'p', rules: {},
        window: { getTrans: key => key }, getTrans: key => key,
        document: { getElementById: id => id === 'display-game-name' ? title : pool },
        GameData: { loadPoolMeta: () => ({ name: '卡池', en: 'Banner' }) }
    });
    vm.runInContext(header, context); context.renderHeader();
    assert.equal(title.innerText, language === 'en' ? 'test' : '测试');
    assert.equal(pool.innerText, language === 'en' ? 'Banner' : '卡池');
    assert.deepEqual(storedInfo, { gameName: '测试', enGameName: 'test' });
    context.gameInfo = { gameName: '仅中文' }; context.renderHeader(); assert.equal(title.innerText, '仅中文');
    context.gameInfo = { enGameName: 'English only' }; context.renderHeader(); assert.equal(title.innerText, 'English only');
    context.gameInfo = { name: '旧格式' }; context.renderHeader(); assert.equal(title.innerText, '旧格式');
    context.window.getTrans = key => key === 'game_custom' ? 'Preset translation' : key;
    context.renderHeader(); assert.equal(title.innerText, 'Preset translation');
}
console.log('PASS: 看板游戏标题与卡池双语显示、缺失语言/旧格式回退、预设翻译及数据不变');
