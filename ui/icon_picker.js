/** 共用 Emoji / 图片选择弹窗：只返回字符串，不负责保存业务数据。 */
(function () {
    'use strict';
    // 常用图标按用途分组；自定义输入不限制必须属于这些预设。
    const groups = [
        ['icon_picker_people', ['👤', '👥', '🧙', '🦸', '🧝', '👑', '💃', '🤖', '👻', '😺', '🐾', '🐉']],
        ['icon_picker_equipment', ['🗡️', '⚔️', '🛡️', '🏹', '🔫', '🔨', '🪄', '💍', '💎', '🎩', '📖', '⚙️']],
        ['icon_picker_pool', ['✨', '⭐', '🌟', '🌠', '🌌', '🎯', '🎁', '🎫', '🏠', '📦', '🔀', '🔄']],
        ['icon_picker_elements', ['🔥', '💧', '❄️', '⚡', '🍃', '🌸', '☀️', '🌙', '🪐', '🦋', '💜', '🍀']]
    ];
    let active = null;
    const text = key => window.getTrans(key);

    function choose(current = '✨') {
        // 重复调用先关闭旧选择器，避免弹窗叠加。
        if (active) active();
        const previousFocus = document.activeElement;
        const dialog = document.createElement('dialog');
        dialog.className = 'icon-picker';
        const form = document.createElement('form');
        form.method = 'dialog';
        dialog.appendChild(form);
        const title = document.createElement('h2');
        title.id = 'icon-picker-title';
        title.textContent = text('icon_picker_title');
        dialog.setAttribute('aria-labelledby', title.id);
        form.appendChild(title);
        const description = document.createElement('p');
        description.textContent = text('icon_picker_description');
        form.appendChild(description);
        const editor = document.createElement('label');
        editor.className = 'icon-picker-editor';
        const preview = document.createElement('span');
        preview.className = 'icon-picker-preview';
        preview.setAttribute('aria-hidden', 'true');
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'input-box';
        input.setAttribute('aria-label', text('icon_picker_custom'));
        input.placeholder = text('icon_picker_custom');
        input.value = current;
        editor.append(preview, input);
        form.appendChild(editor);
        const upload = document.createElement('input');
        upload.type = 'file';
        upload.accept = 'image/*';
        upload.hidden = true;
        const uploadButton = document.createElement('button');
        uploadButton.type = 'button';
        uploadButton.className = 'btn icon-picker-upload';
        uploadButton.textContent = text('icon_picker_upload');
        uploadButton.onclick = () => upload.click();
        const error = document.createElement('p');
        error.setAttribute('role', 'alert');
        form.append(uploadButton, upload, error);
        let revision = 0;
        upload.onchange = async () => {
            const file = upload.files?.[0];
            if (!file) return;
            const request = ++revision;
            confirm.disabled = true;
            error.textContent = '';
            try {
                const result = await ImageUpload.processFile(file, {maxSize: 128, mimeType: 'image/png'});
                if (request !== revision || !dialog.isConnected) return;
                input.value = result.dataURL;
            } catch (_) {
                if (request === revision) error.textContent = text('icon_picker_upload_error');
            } finally {
                if (request === revision) { upload.value = ''; refresh(); }
            }
        };
        const buttons = [];
        for (const [key, icons] of groups) {
            const section = document.createElement('section');
            const heading = document.createElement('h3');
            heading.textContent = text(key);
            const grid = document.createElement('div');
            grid.className = 'icon-picker-grid';
            for (const icon of icons) {
                const button = document.createElement('button');
                button.type = 'button';
                button.textContent = icon;
                button.setAttribute('aria-label', icon);
                button.onclick = () => { revision++; input.value = icon; error.textContent = ''; refresh(); };
                buttons.push([button, icon]);
                grid.appendChild(button);
            }
            section.append(heading, grid);
            form.appendChild(section);
        }
        const footer = document.createElement('div');
        footer.className = 'icon-picker-footer';
        const cancel = document.createElement('button');
        cancel.type = 'button';
        cancel.className = 'btn';
        cancel.textContent = text('cancel');
        const confirm = document.createElement('button');
        confirm.type = 'submit';
        confirm.className = 'btn btn-primary';
        confirm.textContent = text('confirm');
        footer.append(cancel, confirm);
        form.appendChild(footer);
        function refresh() {
            const value = input.value.trim();
            preview.innerHTML = IconRender.html(value || '—');
            confirm.disabled = !value;
            for (const [button, icon] of buttons) {
                button.setAttribute('aria-pressed', String(value === icon));
            }
        }
        input.oninput = () => { revision++; error.textContent = ''; refresh(); };
        refresh();
        document.body.appendChild(dialog);
        return new Promise(resolve => {
            let finished = false;
            // 确认、取消、Escape 均统一清理节点并恢复焦点。
            function finish(value = null) {
                if (finished) return;
                finished = true;
                revision++;
                active = null;
                dialog.close();
                dialog.remove();
                if (previousFocus?.isConnected) previousFocus.focus();
                resolve(value);
            }
            active = finish;
            cancel.onclick = () => finish();
            dialog.oncancel = event => { event.preventDefault(); finish(); };
            form.onsubmit = event => {
                event.preventDefault();
                if (!confirm.disabled && input.value.trim()) finish(input.value.trim());
            };
            dialog.showModal();
            input.focus();
            input.select();
        });
    }
    window.IconPicker = { choose };
})();
