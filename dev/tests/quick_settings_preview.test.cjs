// 规则预览保护不得锁住快捷设定，也不得放开规则编辑区。
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const html = fs.readFileSync(path.join(__dirname, '../../pool_setup.html'), 'utf8');
for (const control of ['.input-box', 'select', 'input[type="checkbox"]', 'input[type="radio"]', '.switch-container', '.gold-tier-toggle-label', '.tag-cb-label', 'label']) {
    assert.ok(html.includes('body.preview-mode ' + control + ':not(#quick-settings-popover *)'), control + ' 只应排除快捷设定');
}
const quick = fs.readFileSync(path.join(__dirname, '../../ui/quick_settings.js'), 'utf8');
assert.ok(quick.includes("panel.id = 'quick-settings-popover'"));
assert.ok(quick.includes('PageLayout.mountControls(panel, layoutPage)'));
assert.ok(fs.readFileSync(path.join(__dirname, '../../ui/page_layout.js'), 'utf8').includes("prefix: 'GM_Pool'"));
console.log('PASS：规则页预览锁定排除快捷设定，规则表单继续受保护');
