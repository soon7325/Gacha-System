/**
 * 必须在页面任何存储读取之前加载。按版本隔离存储，业务脚本仍使用原来的 GM_* key。
 * 补丁更新不会换库；以后通道升级只需修改 DEFAULT_VERSION，新通道首次复制上一通道。
 * 旧版页面复制本文件并在 head 引入，可由“0.1 old”等目录自动识别版本。
 */
(function () {
    'use strict';
    const DEFAULT_VERSION = '0.3';
    const rawLocal = window.localStorage;
    const rawSession = window.sessionStorage;
    const path = decodeURIComponent(window.location.pathname);
    const archived = path.match(/\/(\d+\.\d+(?:\.\d+)*)\s+old\//);
    const params = new URLSearchParams(window.location.search);
    const legacyChannel = params.get('channel') || params.get('from');
    const channelVersion = !archived && /(?:^|\/)changelog(?:\.html)?\/?$/i.test(path) && legacyChannel
        ? legacyChannel.replace(/^v/, '') : null;
    function compare(a,b){const left=a.split('.').map(Number),right=b.split('.').map(Number);for(let i=0;i<Math.max(left.length,right.length);i++){const diff=(left[i]||0)-(right[i]||0);if(diff)return diff;}return 0;}
    const supportedChannel = channelVersion && /^\d+\.\d+$/.test(channelVersion) && compare(channelVersion,DEFAULT_VERSION)<0;
    const version = window.GACHA_STORAGE_VERSION || archived?.[1] || (supportedChannel ? channelVersion : DEFAULT_VERSION);
    const prefix = 'GACHA_VERSION:' + version + ':';
    // 浏览器 storage 事件携带物理键名；新页面按当前版本还原业务键名。
    window.VersionStorage=Object.freeze({eventKey:key=>key===null?null:typeof key==='string'&&key.startsWith(prefix)?key.slice(prefix.length):undefined});
    const marker = prefix + '__initialized';
    function initialize(target) {
        const targetPrefix='GACHA_VERSION:'+target+':',targetMarker=targetPrefix+'__initialized';
        if (rawLocal.getItem(targetMarker)) return;
        let sourcePrefix='';
        // 0.0～0.2 的历史来源是未分版本的 GM_*；从 0.3 开始依次复制前一通道。
        if(compare(target,'0.3')>=0){
            const [major,minor]=target.split('.').map(Number);
            let previous=minor>0?major+'.'+(minor-1):null;
            if(!previous){
                const versions=[];
                for(let i=0;i<rawLocal.length;i++){const match=rawLocal.key(i)?.match(/^GACHA_VERSION:(\d+\.\d+):__initialized$/);if(match&&compare(match[1],target)<0)versions.push(match[1]);}
                previous=versions.sort(compare).pop();
            }
            if(previous){initialize(previous);sourcePrefix='GACHA_VERSION:'+previous+':';}
        }
        const pending = [];
        for (let i = 0; i < rawLocal.length; i++) {
            const key = rawLocal.key(i);
            if (key?.startsWith(sourcePrefix+'GM_')) pending.push([key.slice(sourcePrefix.length), rawLocal.getItem(key)]);
        }
        for (const [key, value] of pending) {
            if (rawLocal.getItem(targetPrefix + key) === null) rawLocal.setItem(targetPrefix + key, value);
        }
        rawLocal.setItem(targetMarker, '1');
    }
    function scoped(storage) {
        const keys = () => {
            const result = [];
            for (let i = 0; i < storage.length; i++) {
                const key = storage.key(i);
                if (key?.startsWith(prefix) && key !== marker) result.push(key.slice(prefix.length));
            }
            return result;
        };
        // length/key/clear 都限定在当前版本，备份和重置不会遍历其他版本。
        // 允许旧版包装 setItem 做它原有的云端提示；底层方法仍只写本版本前缀。
        // 不冻结这层接口，否则 0.2 的拦截器赋值会失效或报错。
        return {
            get length() { return keys().length; },
            key(index) { return keys()[Number(index)] ?? null; },
            getItem(key) { return storage.getItem(prefix + String(key)); },
            setItem(key, value) { storage.setItem(prefix + String(key), String(value)); },
            removeItem(key) { storage.removeItem(prefix + String(key)); },
            clear() { keys().forEach(key => storage.removeItem(prefix + key)); }
        };
    }
    // 不改 Storage.prototype，避免影响同源旧页面和其他组件持有的原生存储对象。
    Object.defineProperty(window, 'localStorage', { configurable: true, value: scoped(rawLocal) });
    Object.defineProperty(window, 'sessionStorage', { configurable: true, value: scoped(rawSession) });
    // 先启用隔离再迁移：即使空间不足，也不能意外退回共享区继续写入。
    // 成功后才写标记；保留来源与已复制的数据，下次加载可重试。
    try { initialize(version); } catch (error) {
        console.error('版本数据复制失败，原数据仍保留。请导出备份并检查浏览器存储空间。', error);
    }
})();
