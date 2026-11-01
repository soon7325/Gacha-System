// 文件工具测试：node tests/import_export.test.cjs，不会在前端显示或执行。
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const links = [], revoked = [], timers = [];
const document = {
    body: { appendChild(link) { links.push(link); } },
    createElement() { return { click() { this.clicked = true; }, remove() { this.removed = true; } }; }
};
// ZIP 替身只验证调用协议、图片与配置内容；不替代第三方库自身的压缩测试。
class Zip {
    constructor() { this.files = new Map(); }
    file(name, value) {
        if (arguments.length === 1) return this.files.has(name) ? { async: async () => this.files.get(name) } : null;
        this.files.set(name, value); return this;
    }
    folder(prefix) {
        return {
            file: (name, value) => this.file(prefix + '/' + name, value),
            forEach: callback => this.files.forEach((value, name) => {
                if (name.startsWith(prefix + '/')) callback(name.slice(prefix.length + 1), { dir: false, async: async () => value });
            })
        };
    }
    async generateAsync() { return this; }
    static async loadAsync(file) { return file.archive; }
}
const window = { JSZip: Zip };
vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../logic/import_export.js'), 'utf8'), {
    window, document, console, Blob,
    URL: { createObjectURL: () => 'blob:test', revokeObjectURL: url => revoked.push(url) },
    setTimeout: fn => timers.push(fn)
});
const api = window.ImportExport;
const input = text => ({ files: [{ name: 'backup.json', text: async () => text }], value: 'selected' });

async function main() {
    for (const page of ['settings', 'dashboard', 'gallery_setup']) {
        const html = fs.readFileSync(path.join(__dirname, '..', page + '.html'), 'utf8')
            .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '').replace(/<!--[\s\S]*?-->/g, '');
        const scripts = [...html.matchAll(/<script\b[^>]*src="([^"]+)"[^>]*>/gi)].map(m => m[1]);
        assert(scripts.includes('logic/import_export.js'));
        assert(scripts.indexOf('logic/import_export.js') < scripts.indexOf('pages/' + page + '.js'));
    }
    api.exportJSON({ records: ['中文'] }, 'test.json');
    assert.equal(links[0].download, 'test.json');
    assert(links[0].clicked && links[0].removed);
    assert.equal(revoked.length, 0); timers.shift()(); assert.equal(revoked[0], 'blob:test');

    const events = [];
    const options = {
        validate: data => { events.push('validate'); assert.equal(data.name, '中文'); },
        confirm: async () => { events.push('confirm'); return true; },
        apply: async () => events.push('apply'),
        afterImport: async () => events.push('refresh'),
        onError: () => events.push('error')
    };
    const selected = input('{"name":"中文"}');
    assert.equal(await api.importInput(selected, options), true);
    assert.deepEqual(events, ['validate', 'confirm', 'apply', 'refresh']); assert.equal(selected.value, '');
    events.length = 0;
    assert.equal(await api.importInput(input('{"name":"中文"}'), { ...options, confirm: () => false }), false);
    assert.deepEqual(events, ['validate']);
    events.length = 0;
    const invalid = input('broken');
    assert.equal(await api.importInput(invalid, options), false);
    assert.deepEqual(events, ['error']); assert.equal(invalid.value, '');
    events.length = 0;
    assert.equal(await api.importInput(input('{}'), { ...options, validate: () => { throw Error('invalid'); } }), false);
    assert.deepEqual(events, ['error']);
    events.length = 0;
    assert.equal(await api.importInput(input('{"name":"中文"}'), { ...options, apply: () => { throw Error('apply failed'); } }), false);
    assert.deepEqual(events, ['validate', 'confirm', 'error']); // 应用失败不能执行成功刷新。
    events.length = 0;
    assert.equal(await api.importInput({ files: [], value: '' }, options), false); assert.equal(events.length, 0);
    assert.equal(api.isObject(null), false); assert.equal(api.isObject([]), false); assert.equal(api.isObject({}), true);

    // ZIP 导出不修改原图鉴，往返后保留中文、内置图片与自定义图片。
    const data = { info: { gameName: '测试' }, catalog: { char: [
        { id: 'one', img: 'data:image/png;base64,YQ==' },
        { id: 'two', img: 'img/ZZZ/builtin.webp' }
    ] } };
    const archive = await api.createEngineArchive(data);
    assert.equal(data.catalog.char[0].img, 'data:image/png;base64,YQ==');
    const packed = JSON.parse(archive.files.get('config.json'));
    assert.equal(packed.catalog.char[0].img, 'images/one.png');
    assert.equal(packed.catalog.char[1].img, 'img/ZZZ/builtin.webp');
    const imported = await api.readEnginePackage({ name: 'TEST.ZIP', archive });
    assert.equal(imported.data.info.gameName, '测试');
    assert.equal(imported.imagesMap['images/one.png'], data.catalog.char[0].img);
    const legacy = await api.readEnginePackage(input(JSON.stringify(data)).files[0]);
    assert.equal(legacy.data.info.gameName, '测试'); assert.equal(Object.keys(legacy.imagesMap).length, 0);
    await assert.rejects(api.readEnginePackage({ name: 'empty.zip', archive: new Zip() }), /ZIP_CONFIG_MISSING/);
    delete window.JSZip;
    await assert.rejects(api.createEngineArchive(data), /JSZIP_UNAVAILABLE/);

    // 执行设置页真实适配代码，确认错误备份/取消不会写存储，正确备份才恢复。
    const settings = fs.readFileSync(path.join(__dirname, '../pages/settings.js'), 'utf8');
    const writes = [], notices = [];
    let confirmed = true, reloads = 0;
    const settingsWindow = {
        customConfirm: async () => confirmed,
        customAlert: async message => notices.push(message)
    };
    vm.runInNewContext(settings.slice(settings.indexOf('window.exportLocalData ='), settings.indexOf('window.clearAllLocalData =')), {
        window: settingsWindow, ImportExport: api,
        localStorage: { setItem: (key, value) => writes.push([key, value]) },
        location: { reload: () => reloads++ }
    });
    await settingsWindow.importLocalData(input('{"other_key":"bad"}'));
    assert.equal(writes.length, 0); assert.equal(reloads, 0);
    confirmed = false;
    await settingsWindow.importLocalData(input('{"GM_Test":"[]"}'));
    assert.equal(writes.length, 0);
    confirmed = true;
    await settingsWindow.importLocalData(input('{"GM_Test":"[]"}'));
    assert.deepEqual(writes, [['GM_Test', '[]']]); assert.equal(reloads, 1);
    console.log('PASS：导入流程、取消/失败、文件框重置、下载清理、JSON/ZIP 与图片往返');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
