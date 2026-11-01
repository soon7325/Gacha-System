/**
 * 公共文件导入/导出：JSON 解析、ZIP 配置与图片打包、浏览器下载。
 * 不直接修改 localStorage 或表单；导入成功后交给页面的 apply 回调。
 * ZIP 依赖现有 JSZip，普通 JSON 导入导出不需要该库。
 */
(function () {
    'use strict';

    // 所有下载共用临时链接；稍后释放 URL，避免浏览器尚未读取就被撤销。
    function downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        try {
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
        } finally {
            link.remove();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        }
    }
    function exportJSON(data, filename) {
        downloadBlob(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }), filename);
    }
    async function readJSON(file) { return JSON.parse(await file.text()); }
    function isObject(value) { return value !== null && typeof value === 'object' && !Array.isArray(value); }
    function zipLibrary() {
        if (!window.JSZip) throw new Error('JSZIP_UNAVAILABLE');
        return window.JSZip;
    }

    // 保持现有配置包格式：config.json + images/，并兼容旧版单文件 JSON。
    async function readEnginePackage(file) {
        if (!/\.zip$/i.test(file.name)) return { data: await readJSON(file), imagesMap: {} };
        const zip = await zipLibrary().loadAsync(file);
        const config = zip.file('config.json');
        if (!config) throw new Error('ZIP_CONFIG_MISSING');
        const data = JSON.parse(await config.async('string'));
        const imagesMap = Object.create(null);
        const images = zip.folder('images');
        const tasks = [];
        images?.forEach((relativePath, entry) => {
            if (entry.dir) return;
            tasks.push(entry.async('base64').then(base64 => {
                const ext = relativePath.split('.').pop().toLowerCase();
                const mime = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
                imagesMap[`images/${relativePath}`] = `data:${mime};base64,${base64}`;
            }));
        });
        await Promise.all(tasks);
        return { data, imagesMap };
    }

    // 拷贝配置后再改图片路径，不能污染正在编辑的图鉴或把内置图片重复打包。
    async function createEngineArchive(data) {
        const Zip = zipLibrary();
        const zip = new Zip();
        const images = zip.folder('images');
        const copy = JSON.parse(JSON.stringify(data));
        for (const items of Object.values(copy.catalog || {})) {
            items.forEach(item => {
                const match = typeof item.img === 'string' && item.img.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
                if (!match) return;
                const ext = match[1] === 'jpeg' ? 'jpg' : match[1];
                const filename = `${item.id}.${ext}`;
                images.file(filename, match[2], { base64: true });
                item.img = `images/${filename}`;
            });
        }
        zip.file('config.json', JSON.stringify(copy, null, 2));
        return zip.generateAsync({ type: 'blob' });
    }

    /**
     * 完整导入流程：读取 → 校验 → 用户确认 → 应用到页面 → 刷新/提示。
     * validate 失败应抛异常；confirm 返回 false 时绝不调用 apply。
     * apply/afterImport 可以异步；无论成功、取消或失败都清空文件选择框，
     * 这样用户可以再次选择同一个文件。错误提示由页面提供，保留各自语言。
     */
    async function importInput(input, { read = readJSON, validate = () => {},
        confirm = () => true, apply, afterImport = () => {}, onError = error => console.error(error) }) {
        const file = input.files?.[0];
        if (!file) return false;
        try {
            const result = await read(file);
            await validate(result);
            if (!await confirm(result)) return false;
            await apply(result);
            await afterImport(result);
            return true;
        } catch (error) {
            await onError(error);
            return false;
        } finally { input.value = ''; }
    }

    window.ImportExport = Object.freeze({ downloadBlob, exportJSON, readJSON,
        isObject, readEnginePackage, createEngineArchive, importInput });
})();
