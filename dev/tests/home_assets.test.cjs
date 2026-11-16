const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const { execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '../..');
function manifest(file) {
    const context = { window: {} };
    vm.runInNewContext(fs.readFileSync(file, 'utf8'), context);
    return context.window.HOME_GAME_ASSETS;
}

test('首页清单完整覆盖实际背景，图标和背景均存在，NEW 标记正确', () => {
    const games = manifest(path.join(root, 'pages/home-assets.js'));
    const images = games.flatMap(game => game.images);
    const actual = fs.readdirSync(path.join(root, 'img/OTHER/index')).filter(file => /\.(png|jpe?g|webp|avif)$/i.test(file));
    assert.equal(images.length, actual.length);
    assert.equal(new Set(games.map(game => game.id)).size, games.length);
    for (const game of games) {
        if (game.icon) assert.ok(fs.existsSync(path.join(root, game.icon)));
        for (const image of game.images) {
            assert.ok(fs.existsSync(path.join(root, image.src)));
            assert.equal(image.latest, /[ _-]NEW/i.test(path.basename(image.src)));
            assert.equal(image.language, path.basename(image.src).match(/[ _-](en|zh|both)\./i)?.[1].toLowerCase() || 'both');
            assert.match(image.key, /^(new|base):\d+$/);
        }
    }
});

test('新增游戏自动分组，支持多张 NEW、数字常驻、不同扩展及无图标回退', () => {
    const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'gacha-home-assets-'));
    try {
        for (const folder of ['dev/tools', 'pages', 'img/OTHER/index', 'img/FIFTH/icon']) fs.mkdirSync(path.join(fixture, folder), { recursive: true });
        fs.copyFileSync(path.join(root, 'dev/tools/build-home-assets.cjs'), path.join(fixture, 'dev/tools/build-home-assets.cjs'));
        for (const file of ['FIFTH 01.jpg', 'FIFTH 02.webp', 'FIFTH NEW01.avif', 'FIFTH_NEW_02.png', 'FIFTH NEW 03 zh.jpg', 'FIFTH NEW 03 en.webp', 'FIFTH 03 both.png', 'sixth-NEW.jpg', 'sixth-01.jpeg', 'notes.txt', 'ignore.jpg']) fs.writeFileSync(path.join(fixture, 'img/OTHER/index', file), '');
        fs.writeFileSync(path.join(fixture, 'img/FIFTH/icon/game_icon.webp'), '');
        execFileSync(process.execPath, [path.join(fixture, 'dev/tools/build-home-assets.cjs')]);
        const games = manifest(path.join(fixture, 'pages/home-assets.js'));
        assert.equal(games.length, 2);
        const fifth = games.find(game => game.id === 'fifth');
        assert.equal(fifth.images.filter(image => image.latest).length, 4);
        assert.equal(fifth.images.filter(image => !image.latest).length, 3);
        const variants = fifth.images.filter(image => image.key === 'new:3');
        assert.deepEqual(Array.from(variants, image => image.language).sort(), ['en', 'zh']);
        assert.equal(fifth.images.find(image => image.key === 'base:3').language, 'both');
        assert.equal(fifth.images.find(image => image.src.endsWith('NEW01.avif')).language, 'both');
        assert.equal(fifth.icon, 'img/FIFTH/icon/game_icon.webp');
        assert.equal(games.find(game => game.id === 'sixth').icon, null);
    } finally {
        const resolved = path.resolve(fixture);
        assert.ok(resolved.startsWith(path.resolve(os.tmpdir()) + path.sep) && path.basename(resolved).startsWith('gacha-home-assets-'));
        fs.rmSync(resolved, { recursive: true, force: true });
    }
});
