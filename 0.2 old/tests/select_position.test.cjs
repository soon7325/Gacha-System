const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../ui/select_ui.js'), 'utf8');
const code = source.slice(source.indexOf('    function positionDropdown()'), source.indexOf("    window.addEventListener('resize'"));
for (const [top, bottom, expectedUp] of [[600,630,true], [30,60,false], [280,310,false]]) {
    const menu = { style:{}, scrollHeight:140 };
    let upward;
    const context = { window: { innerHeight:700, innerWidth:1000 }, activeDropdown: {
        wrapper:{ isConnected:true, classList:{ toggle: (name, value) => { upward = value; } } },
        trigger:{ getBoundingClientRect: () => ({ top,bottom,left:20,width:200 }) }, menu
    } };
    vm.runInNewContext(code, context); context.positionDropdown();
    assert.equal(upward, expectedUp);
    assert.equal(menu.style.position, 'fixed');
    assert.ok(parseFloat(menu.style.top) >= 10);
    assert.ok(parseFloat(menu.style.top) + parseFloat(menu.style.maxHeight) <= 690);
}
console.log('PASS：下方空间不足向上展开，空间充足向下，浮层保持在视口范围');
