const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../pages/changelog.js'), 'utf8');
const html = fs.readFileSync(path.join(__dirname, '../changelog.html'), 'utf8');
const bootstrap = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]).find(s => s.includes('const VERSION_CHANNELS'));
for (const channel of ['0.0', '0.1', '0.2', '']) {
    const handlers = {};
    let reloads = 0;
    const home = {};
    const links = ['index.html', 'custom_dashboard.html?gameId=test&pool=1', 'custom_setup.html?gameId=test'].map(href => ({ href, getAttribute() { return this.href; }, setAttribute(key, value) { this.href = value; } }));
    const window = {
        location: { search: channel ? '?channel=' + channel : '', href: 'https://example.test/changelog.html', reload() { reloads++; } },
        addEventListener(name, handler) { handlers[name] = handler; },
        history: { state: null, replaceState(state, title, href) { window.location.href = href; window.location.search = new URL(href).search; } }
    };
    const document = {
        write() {}, addEventListener(name, handler, capture) { handlers['document:' + name + (capture ? ':capture' : '')] = handler; },
        getElementById() { return home; }, querySelector() { return null; }, querySelectorAll() { return links; }
    };
    const context = { window, document, URL, URLSearchParams, localStorage: { getItem() { return 'zh'; } }, ResizeObserver: class {}, Toast: { create() { return { show() {} }; } } };
    vm.runInNewContext(bootstrap, context);
    vm.runInNewContext(source, context);
    assert.equal(window.GACHA_ACTIVE_VERSION, ['0.0', '0.1'].includes(channel) ? channel : '0.2');
    assert.equal(context.isCurrentVersion('0.0'), channel === '0.0');
    assert.equal(context.isCurrentVersion('0.1'), channel === '0.1');
    assert.equal(context.isCurrentVersion('0.2'), !['0.0', '0.1'].includes(channel));
    assert.equal(context.getVersionHomeUrl('0.0'), '0.0 old/index.html');
    context.applyChannelEnvironment();
    home.onclick();
    assert.equal(window.location.href, 'index.html');
    const directory = ['0.0', '0.1'].includes(channel) ? channel + ' old/' : '';
    assert.deepEqual(links.map(link => link.href), ['index.html', 'custom_dashboard.html?gameId=test&pool=1', 'custom_setup.html?gameId=test'].map(href => directory + href));
    // 重绘侧栏后出现的新链接也保留旧版自定义游戏和卡池。
    const newLink = { href: 'custom_dashboard.html?gameId=old_only&pool=p_char_up', getAttribute() { return this.href; }, setAttribute(key, value) { this.href = value; } };
    handlers['document:click:capture']({ target: { closest() { return newLink; } } });
    assert.equal(newLink.href, directory + 'custom_dashboard.html?gameId=old_only&pool=p_char_up');
    handlers['document:click:capture']({ target: { closest() { return newLink; } } });
    assert.equal(newLink.href, directory + 'custom_dashboard.html?gameId=old_only&pool=p_char_up');
    for (const href of ['#section', 'https://example.test', '../index.html']) assert.equal(context.getSidebarChannelUrl(href), href);
    for (const saved of [null, 'full', 'invalid', 'left', 'right', 'center']) {
        let layout;
        context.localStorage.getItem = () => saved;
        document.documentElement = { setAttribute(key, value) { layout = value; } };
        context.applyChangelogLayout();
        assert.equal(layout, ['left', 'right', 'center', 'full'].includes(saved) ? saved : 'center');
    }
    context.localStorage.getItem = () => null;
    window.location.href = 'https://example.test/changelog.html';
    handlers['document:click']({ button: 0, target: { closest() { return { dataset: { channel: '0.1' } }; } } });
    assert.equal(window.location.search, '?channel=0.1');
    handlers.pageshow();
    assert.equal(reloads, channel === '0.1' ? 0 : 1);
    const channelButtons = [];
    const nodes = { 'toc-version-list': {}, 'toc-ver-count': {}, 'toc-channel-list': { appendChild(button) { channelButtons.push(button); } } };
    document.getElementById = id => nodes[id];
    document.createElement = () => ({ dataset: {} });
    context.getRawVersionList = () => [];
    context.renderTocSidebar();
    assert.equal(channelButtons.length, 3);
    assert.equal(channelButtons[2].className.includes('current'), channel === '0.0');
    assert.equal(channelButtons[2].href, channel === '0.0' ? 'javascript:void(0)' : '0.0 old/index.html');
}
assert.ok(source.includes('data-channel="${escapeHtml(targetVer)}"'));
assert.ok(source.includes('a.dataset.channel = ch.version'));
assert.ok(fs.readFileSync(path.join(__dirname, '../0.1 old/index.html'), 'utf8').includes('../changelog.html?channel=0.1'));
const originalHome = fs.readFileSync(path.join(__dirname, '../0.0 old/index.html'), 'utf8');
assert.ok(originalHome.includes('../changelog.html?channel=0.0'));
assert.ok(!originalHome.includes('downloadChangelog'));
for (const lang of ['zh', 'en']) {
    const context = { window: {} };
    vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../translate/changelog_' + lang + '.js'), 'utf8'), context);
    const card = context.window['CHANGELOG_' + lang.toUpperCase()].find(item => item.channel?.targetVer === '0.0');
    assert.equal(card.channel.targetVer, '0.0');
    assert.equal(card.channel.enabled, true);
}
console.log('PASS: three channels, v0.0 card action, same-version sidebar after rerender, latest home and default centered layout');
