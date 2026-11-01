// 图片组件测试：仅 Node 执行，不加载到网页。node tests/image_upload.test.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const decoded = new Map(), canvases = [];
let sequence = 0, noContext = false;
class Reader {
    readAsDataURL(file) {
        const finish = () => {
            if (file.abort) return this.onabort();
            if (file.failRead) { this.error = Error('read failed'); return this.onerror(); }
            this.result = 'data:test/' + ++sequence;
            decoded.set(this.result, file);
            this.onload();
        };
        if (file.manual) file.finishRead = finish;
        else queueMicrotask(finish);
    }
}
class Image {
    set src(value) {
        const file = decoded.get(value);
        queueMicrotask(() => {
            if (file.failDecode) return this.onerror();
            this.naturalWidth = file.width; this.naturalHeight = file.height; this.onload();
        });
    }
}
function input(file) {
    const handlers = new Set();
    return {
        files: file ? [file] : [], value: 'chosen',
        addEventListener: (type, fn) => handlers.add(fn),
        removeEventListener: (type, fn) => handlers.delete(fn),
        count: () => handlers.size,
        emit() { handlers.forEach(fn => fn({ target: this })); }
    };
}
const document = {
    getElementById: () => null,
    createElement() {
        const ctx = { drawImage(...args) { this.args = args; } };
        const canvas = { ctx, getContext: () => noContext ? null : ctx,
            toDataURL(mime, quality) { this.mime = mime; this.quality = quality; return `data:${mime};base64,${this.width}x${this.height}`; } };
        canvases.push(canvas); return canvas;
    }
};
const window = {};
vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../ui/image_upload.js'), 'utf8'), {
    window, document, FileReader: Reader, Image, console
});
const api = window.ImageUpload;
const copy = value => JSON.parse(JSON.stringify(value));
const file = options => ({ type: 'image/png', width: 400, height: 200, ...options });
const tick = () => new Promise(resolve => setImmediate(resolve));

async function main() {
    assert.deepEqual(copy(api.getGeometry(400, 200)), { sx: 0, sy: 0, sw: 400, sh: 200, width: 150, height: 75 });
    assert.equal(api.getGeometry(200, 400).width, 75);
    assert.equal(api.getGeometry(80, 40).width, 80); // 物品小图不放大。
    assert.equal(api.getGeometry(1, 10000).width, 1); // 极细图片至少保留一个像素。
    assert.deepEqual(copy(api.getGeometry(400, 200, { mode: 'square' })), { sx: 100, sy: 0, sw: 200, sh: 200, width: 150, height: 150 });
    assert.equal(api.getGeometry(200, 400, { mode: 'square' }).sy, 100);
    assert.equal(api.getGeometry(400, 200, { maxSize: 300 }).width, 300);
    assert.throws(() => api.getGeometry(0, 100), /IMAGE_INVALID_OPTIONS/);
    assert.throws(() => api.getGeometry(100, 100, { mode: 'unknown' }), /IMAGE_INVALID_OPTIONS/);
    const fit = await api.processFile(file());
    assert.equal(fit.width, 150); assert.equal(fit.height, 75);
    let canvas = canvases.at(-1);
    assert.equal(canvas.mime, 'image/jpeg'); assert.equal(canvas.quality, 0.8);
    assert.equal(canvas.ctx.imageSmoothingQuality, 'high');
    assert.deepEqual(canvas.ctx.args.slice(1), [0, 0, 400, 200, 0, 0, 150, 75]);
    await api.processFile(file(), { mode: 'square', maxSize: 300, quality: 0.9 });
    canvas = canvases.at(-1);
    assert.equal(canvas.quality, 0.9);
    assert.deepEqual(canvas.ctx.args.slice(1), [100, 0, 200, 200, 0, 0, 300, 300]);
    await assert.rejects(api.processFile(file({ type: 'text/plain' })), /IMAGE_INVALID_FILE/);
    await assert.rejects(api.processFile(file({ failRead: true })), /read failed/);
    await assert.rejects(api.processFile(file({ abort: true })), /IMAGE_READ_ABORTED/);
    await assert.rejects(api.processFile(file({ failDecode: true })), /IMAGE_DECODE_FAILED/);
    await assert.rejects(api.processFile(file(), { quality: 2 }), /IMAGE_INVALID_OPTIONS/);
    noContext = true;
    await assert.rejects(api.processFile(file()), /IMAGE_CANVAS_UNAVAILABLE/); noContext = false;

    const applied = [], errors = [];
    const handler = api.createInputHandler({ onReady: result => applied.push(result), onError: err => errors.push(err) });
    const selected = input(file());
    assert.equal(await handler.handle({ target: selected }), true); assert.equal(selected.value, '');
    assert.equal(await handler.handle({ target: input(null) }), false); assert.equal(applied.length, 1);
    assert.equal(await handler.handle({ target: input(file({ failDecode: true })) }), false);
    assert.equal(errors.length, 1); assert.equal(applied.length, 1);

    // 后选图片先读完时，旧任务不得覆盖新图，也不得清掉新文件的选择值。
    const slow = file({ manual: true }), oldInput = input(slow);
    const old = handler.handle({ target: oldInput });
    const newest = handler.handle({ target: input(file({ width: 80, height: 40 })) });
    assert.equal(await newest, true);
    slow.finishRead(); assert.equal(await old, false); assert.equal(applied.at(-1).width, 80);
    const cancelledFile = file({ manual: true });
    const cancelled = handler.handle({ target: input(cancelledFile) }); handler.cancelPending();
    cancelledFile.finishRead(); assert.equal(await cancelled, false);
    const before = applied.length;
    const boundInput = input(file());
    const previous = api.bind(boundInput, { onReady: () => assert.fail('旧监听仍然生效') });
    const bound = api.bind(boundInput, { onReady: result => applied.push(result) });
    assert.equal(boundInput.count(), 1); boundInput.emit(); await tick(); assert.equal(applied.length, before + 1);
    bound.destroy(); assert.equal(boundInput.count(), 0); previous.destroy();
    api.bind(null, {}).destroy();

    // 图片组件必须早于普通页面脚本或认证模块；原来的保存入口不变。
    const root = path.resolve(__dirname, '..');
    for (const [page, consumer] of [['gallery_setup', 'gallery_setup']]) {
        const html = fs.readFileSync(path.join(root, page + '.html'), 'utf8').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '');
        const scripts = [...html.matchAll(/<script\b[^>]*src="([^"]+)"[^>]*>/gi)].map(m => m[1]);
        assert(scripts.indexOf('ui/image_upload.js') >= 0);
        assert(scripts.indexOf('ui/image_upload.js') < scripts.indexOf('pages/' + consumer + '.js'));
    }
    console.log('PASS：等比缩放、居中裁剪、尺寸/质量配置、失败处理、选择竞态、取消/解绑及加载顺序');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
