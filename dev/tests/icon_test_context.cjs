const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../../ui/icon_render.js'), 'utf8');
exports.createContext = (globals, options) => {
    const context = vm.createContext(globals, options);
    context.window ||= {};
    vm.runInContext(source, context);
    context.IconRender = context.window.IconRender;
    return context;
};
