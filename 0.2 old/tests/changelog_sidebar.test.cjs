// 检查更新日志页的动态加载顺序；旧版通道不额外载入新版数据库。
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const html = fs.readFileSync(path.join(__dirname, '../changelog.html'), 'utf8');
const script = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]).find(s => s.includes('const shellLayout'));
for (const latest of [true, false]) {
    const written = [];
    vm.runInNewContext(script, {
        window: { GACHA_IS_LATEST: latest, GACHA_CHANNEL_BASE: '/v0.1/' },
        document: { write: value => written.push(value) }
    });
    if (latest) {
        for (const [index, gameId] of ['hsr', 'zzz', 'end', 'ark'].entries()) {
            assert.ok(written[index].includes('Preset_Data/db_' + gameId + '.js'));
        }
        assert.ok(written.at(-1).includes('ui/layout.js'));
    } else {
        assert.equal(written.length, 1);
        assert.ok(written[0].includes('/v0.1/layout.js'));
    }
}
console.log('PASS：新版侧栏先载入全部官方预设，旧版通道加载保持不变');
