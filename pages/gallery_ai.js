/** 本地生成提示词与示例模板，不连接任何 AI 服务。 */
(function () {
    'use strict';
    const keys = {"title":"cs_ai_title","cost":"cs_ai_cost","disclaimer":"cs_ai_disclaimer","steps":"cs_ai_steps","game":"cs_ai_game","scope":"cs_ai_scope","preview":"cs_ai_preview","copy":"cs_ai_copy","download":"cs_ai_download","close":"cs_ai_close","required":"cs_ai_required","copied":"cs_ai_copied","copy_failed":"cs_ai_copy_failed","prompt":"cs_ai_prompt"};
    const t = key => window.getTrans(keys[key]);
    Object.assign(keys, { language: 'cs_ai_language', zh: 'cs_ai_language_zh', en: 'cs_ai_language_en', both: 'cs_ai_language_both' });
    Object.assign(keys, { identity: 'cs_ai_identity', identity_default: 'cs_ai_identity_default' });
    Object.assign(keys, { order: 'cs_ai_order', order_default: 'cs_ai_order_default' });
    Object.assign(keys, { version: 'cs_ai_version', server: 'cs_ai_server', version_hint: 'cs_ai_version_hint', server_hint: 'cs_ai_server_hint', scope_default: 'cs_ai_scope_default', feature_note: 'cs_ai_feature_note' });
    Object.assign(keys, { sources: 'cs_ai_sources', sources_hint: 'cs_ai_sources_hint', sources_default: 'cs_ai_sources_default' });
    function template(language) {
        const data = {
            info: {
                gameName: '示例游戏', enGameName: 'Example Game',
                globalTiers: [{ id: 'tier_5', name: '五星', en: '5-Star', color: '#f1c40f' }],
                categories: [{ id: 'char', name: '角色', en: 'Character', icon: '👤' }],
                tagDefinitions: {
                    std: { name: '常驻', en: 'Standard', enShort: 'Std', color: '#3498db', textColor: '#ffffff' },
                    up: { name: '限定', en: 'Limited', enShort: 'Ltd', color: '#f1c40f', textColor: '#000000' },
                    gift: { name: '赠送', en: 'Gift', enShort: 'Gift', color: '#2ecc71', textColor: '#000000' }
                }
            },
            catalog: { char: [
                { id: 'example_char_001', name: '示例角色', en: 'Example Character', short: '示角', eshort: 'Examp', tierId: 'tier_5', tags: ['std'], img: '' },
                { id: 'example_char_002', name: '示例历史双池角色', en: 'Historical Dual-Pool Example', short: '双池', eshort: 'DualP', tierId: 'tier_5', tags: ['up', 'std'], img: '' },
                { id: 'example_char_wind', name: '示例主角（风）', en: 'Example Hero (Wind)', short: '主风', eshort: 'HeroW', tierId: 'tier_5', tags: ['gift'], img: '' },
                { id: 'example_char_fire', name: '示例主角（火）', en: 'Example Hero (Fire)', short: '主火', eshort: 'HeroF', tierId: 'tier_5', tags: ['gift'], img: '' }
            ] }
        };
        // 保留导入字段结构，但只填用户要求的语言，避免示例诱导 AI 补全双语。
        if (language !== 'both') {
            data.info[language === 'en' ? 'gameName' : 'enGameName'] = '';
            const rows = [...data.info.globalTiers, ...data.info.categories, ...Object.values(data.info.tagDefinitions), ...data.catalog.char];
            for (const row of rows) {
                for (const key of language === 'en' ? ['name', 'short'] : ['en', 'eshort', 'enShort']) {
                    if (Object.hasOwn(row, key)) row[key] = '';
                }
            }
        }
        return data;
    }
    document.getElementById('btn-ai-catalog').addEventListener('click', () => {
        const dialog = document.createElement('dialog');
        dialog.id = 'ai-catalog-dialog';
        dialog.setAttribute('aria-labelledby', 'ai-catalog-title');
        dialog.style.cssText = 'width:min(780px,calc(100vw - 24px));height:90dvh;max-height:920px;box-sizing:border-box;overflow:hidden;display:flex;flex-direction:column;border:1px solid var(--primary);border-radius:14px;padding:0;background:var(--card-bg,#20232b);color:var(--text,#eee);line-height:1.65;';
        const header = document.createElement('header');
        header.style.cssText = 'display:flex;align-items:center;gap:12px;justify-content:space-between;padding:16px 20px;border-bottom:1px solid var(--border,#555);flex-shrink:0;';
        const body = document.createElement('div');
        body.id = 'ai-catalog-body';
        body.style.cssText = 'padding:16px 20px;overflow:auto;min-height:0;flex:1;';
        dialog.append(header, body);
        const add = (tag, key) => {
            const node = document.createElement(tag);
            node.textContent = t(key);
            body.append(node);
            return node;
        };
        const title = add('h2', 'title');
        title.id = 'ai-catalog-title';
        title.style.cssText = 'font-size:clamp(16px,3vw,22px);margin:0;line-height:1.35;';
        header.append(title);
        const topClose = document.createElement('button');
        topClose.type = 'button';
        topClose.className = 'btn btn-action-gray';
        topClose.textContent = '×';
        topClose.setAttribute('aria-label', t('close'));
        topClose.style.cssText = 'font-size:24px;padding:0;width:36px;height:36px;flex-shrink:0;';
        topClose.onclick = () => dialog.close();
        header.append(topClose);
        const cost = add('p', 'cost');
        cost.style.cssText = 'padding:12px;border-left:3px solid var(--primary);background:rgba(128,128,128,.12);';
        add('p', 'disclaimer');
        add('p', 'steps');
        add('p', 'feature_note');
        function field(key, tag = 'input') {
            const label = add('label', key);
            const input = document.createElement(tag);
            input.id = 'ai-catalog-' + key;
            label.htmlFor = input.id;
            input.style.cssText = 'display:block;width:100%;box-sizing:border-box;margin:6px 0 14px;padding:10px;border:1px solid #888;border-radius:6px;background:transparent;color:inherit;font:inherit;font-size:13px;min-width:0;';
            body.append(input);
            return input;
        }
        const game = field('game');
        game.value = document.getElementById('input-game-name')?.value || '';
        const version = field('version');
        version.value = t('version_hint');
        const server = field('server');
        server.placeholder = t('server_hint');
        const sources = field('sources');
        sources.placeholder = t('sources_hint');
        const sourceHelp = add('p', 'sources_default');
        sourceHelp.id = 'ai-catalog-sources-help';
        sourceHelp.style.cssText = 'font-size:12px;color:var(--text-muted,#aaa);margin:-6px 0 14px;';
        sources.setAttribute('aria-describedby', sourceHelp.id);
        const scope = field('scope');
        scope.value = t('scope_default');
        const identity = field('identity');
        identity.value = t('identity_default');
        const order = field('order');
        order.value = t('order_default');
        const language = field('language', 'select');
        for (const value of ['zh', 'en', 'both']) {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = t(value);
            option.style.cssText = 'background:var(--card-bg,#20232b);color:var(--text,#eee);';
            language.append(option);
        }
        language.value = localStorage.getItem('GM_Lang') === 'en' ? 'en' : 'zh';
        const preview = field('preview', 'textarea');
        preview.readOnly = true;
        preview.rows = 8;
        // 与弹窗的 90dvh / 920px 高度上限对应，预览约占其三分之二。
        preview.style.height = 'min(60dvh, 613px)';
        preview.style.resize = 'vertical';
        const status = document.createElement('p');

        status.textContent = '';
        status.setAttribute('role', 'status');
        function refresh() {
            preview.value = t('prompt').replace('{request}', () => JSON.stringify({ game: game.value.trim(), version: version.value.trim(), server: server.value.trim(), sourceLinks: sources.value.trim(), scope: scope.value.trim(), identityPreference: identity.value.trim(), sortPreference: order.value.trim(), outputLanguage: language.value }, null, 2))
                .replace('{template}', () => JSON.stringify(template(language.value), null, 2));
            status.textContent = '';
        }
        game.addEventListener('input', refresh);
        scope.addEventListener('input', refresh);
        version.addEventListener('input', refresh);
        server.addEventListener('input', refresh);
        sources.addEventListener('input', refresh);
        identity.addEventListener('input', refresh);
        order.addEventListener('input', refresh);
        language.addEventListener('change', refresh);
        refresh();
        const actions = document.createElement('div');
        actions.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;flex-shrink:0;padding:12px 20px;border-top:1px solid var(--border,#555);';
        status.style.cssText = 'width:100%;margin:0;font-size:13px;';
        actions.append(status);
        dialog.append(actions);
        function button(key, run) {
            const node = document.createElement('button');
            node.type = 'button';
            node.className = 'btn btn-action-gray';
            node.textContent = t(key);
            node.addEventListener('click', run);
            actions.append(node);
        }
        button('copy', async () => {
            if (!game.value.trim()) { status.textContent = t('required'); game.focus(); return; }
            try {
                await navigator.clipboard.writeText(preview.value);
                status.textContent = t('copied');
            } catch {
                preview.focus(); preview.select();
                status.textContent = t('copy_failed');
            }
        });
        button('download', () => ImportExport.exportJSON(template(language.value), 'catalog_example.json'));
        dialog.addEventListener('close', () => dialog.remove());
        document.body.append(dialog);
        dialog.showModal();
        game.focus();
    });
})();
