const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '../..');
const source = fs.readFileSync(path.join(root, 'ui/legacy_paths.js'), 'utf8');
for (const version of ['0.0', '0.1', '0.2']) {
    const href = `https://example.com/old_version/${version}/index.html`;
    const images = ['../img/ZZZ/char4/比利.webp', '../../img/ZZZ/char/4/比利.webp', 'https://other.example/image.png'].map(raw => ({
        getAttribute: () => raw, src: new URL(raw, href).href
    }));
    vm.runInNewContext(source, {
        URL, location: { href },
        document: { documentElement: { nodeType: 1, matches: () => false, querySelectorAll: () => images } },
        MutationObserver: class { observe() {} }
    });
    assert.equal(decodeURI(images[0].src), 'https://example.com/img/ZZZ/char/4/比利.webp');
    assert.equal(images[1].src, images[0].src);
    assert.equal(images[2].src, 'https://other.example/image.png');
    const dir = path.join(root, 'old_version', version);
    for (const name of fs.readdirSync(dir).filter(name => name.endsWith('.html'))) {
        const html = fs.readFileSync(path.join(dir, name), 'utf8');
        for (const match of html.matchAll(/<(?:script|link)\b[^>]*\b(?:src|href)=["']([^"']+)["']/g)) {
            if (/^(?:https?:|\/\/|data:)/.test(match[1])) continue;
            assert.ok(fs.existsSync(path.resolve(dir, match[1].split(/[?#]/)[0])), `${version}/${name}: ${match[1]}`);
        }
    }
}
console.log('PASS: archive scripts/styles and cached image paths');
