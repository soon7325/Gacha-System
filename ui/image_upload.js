/**
 * 公共图片上传处理：读取文件、解码、等比例缩小或居中正方形裁剪。
 * 返回 DataURL 和输出尺寸；预览、业务赋值、保存/同步仍由页面处理。
 * 默认沿用 150px、JPEG 质量 0.8；可调参数减少压缩损失，不是 AI 高清修复。
 */
(function () {
    'use strict';
    const bindings = new WeakMap();

    // 将 FileReader 事件包装成 Promise，读取失败/中止不会永远等待。
    function readDataURL(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(reader.error || new Error('IMAGE_READ_FAILED'));
            reader.onabort = () => reject(new Error('IMAGE_READ_ABORTED'));
            reader.readAsDataURL(file);
        });
    }
    function decode(source) {
        return new Promise((resolve, reject) => {
            const image = new Image();
            image.onload = () => resolve(image);
            image.onerror = () => reject(new Error('IMAGE_DECODE_FAILED'));
            image.src = source;
        });
    }

    // 单独计算绘制区域，便于验证裁剪与尺寸；fit 不放大小图，square 保持旧头像尺寸。
    function getGeometry(width, height, { mode = 'fit', maxSize = 150 } = {}) {
        if (![width, height, maxSize].every(value => Number.isFinite(value) && value > 0) ||
            !Number.isInteger(maxSize) || !['fit', 'square'].includes(mode)) throw new Error('IMAGE_INVALID_OPTIONS');
        if (mode === 'square') {
            const side = Math.min(width, height);
            return { sx: (width - side) / 2, sy: (height - side) / 2,
                sw: side, sh: side, width: maxSize, height: maxSize };
        }
        const scale = Math.min(1, maxSize / Math.max(width, height));
        return { sx: 0, sy: 0, sw: width, sh: height,
            width: Math.max(1, Math.floor(width * scale)), height: Math.max(1, Math.floor(height * scale)) };
    }

    async function processFile(file, { mode = 'fit', maxSize = 150,
        quality = 0.8, mimeType = 'image/jpeg' } = {}) {
        if (!file || (file.type && !file.type.startsWith('image/'))) throw new Error('IMAGE_INVALID_FILE');
        if (!Number.isFinite(quality) || quality < 0 || quality > 1) throw new Error('IMAGE_INVALID_OPTIONS');
        const image = await decode(await readDataURL(file));
        const geometry = getGeometry(image.naturalWidth || image.width, image.naturalHeight || image.height, { mode, maxSize });
        const canvas = document.createElement('canvas');
        canvas.width = geometry.width;
        canvas.height = geometry.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('IMAGE_CANVAS_UNAVAILABLE');
        // 支持时使用较高质量的重采样，降低缩小图片的锯齿，不制造原图细节。
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(image, geometry.sx, geometry.sy, geometry.sw, geometry.sh, 0, 0, canvas.width, canvas.height);
        return { dataURL: canvas.toDataURL(mimeType, quality), width: canvas.width, height: canvas.height };
    }

    /**
     * 供内联 onchange 或 bind 使用的处理器。只接受最后一次选择的结果，
     * 防止旧图片读取较慢，反而覆盖刚选的新图。取消选择不会清除原预览。
     */
    function createInputHandler({ options = {}, onReady,
        onError = error => console.error('图片处理失败：', error) } = {}) {
        let revision = 0;
        async function handle(event) {
            const input = event.target;
            const current = ++revision;
            const file = input.files?.[0];
            if (!file) return false;
            try {
                const result = await processFile(file, options);
                if (current !== revision) return false;
                await onReady(result);
                return true;
            } catch (error) {
                if (current === revision) await onError(error);
                return false;
            } finally {
                // 允许再次选择同一个文件，不清除期间刚选的另一个文件。
                if (input.files?.[0] === file) input.value = '';
            }
        }
        function cancelPending() { revision++; }
        return Object.freeze({ handle, cancelPending });
    }

    // 同一个文件框重绑时移除旧监听，旧异步任务也不再应用到页面。
    function bind(input, config) {
        if (typeof input === 'string') input = document.getElementById(input);
        if (!input) return Object.freeze({ destroy() {}, cancelPending() {} });
        bindings.get(input)?.destroy();
        const handler = createInputHandler(config);
        const listener = event => { void handler.handle(event); };
        input.addEventListener('change', listener);
        function destroy() {
            handler.cancelPending();
            input.removeEventListener('change', listener);
            if (bindings.get(input)?.destroy === destroy) bindings.delete(input);
        }
        const binding = Object.freeze({ destroy, cancelPending: handler.cancelPending });
        bindings.set(input, binding);
        return binding;
    }
    window.ImageUpload = Object.freeze({ processFile, getGeometry, createInputHandler, bind });
})();
