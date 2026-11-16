const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'../..'),read=file=>fs.readFileSync(path.join(root,file),'utf8');
function scriptSource(attributes,file){
    const unquoted=attributes.replace(/"[^"]*"|'[^']*'/g,'');
    assert.doesNotMatch(unquoted,/["']/,file+': unclosed script attribute quote');
    return attributes.match(/\bsrc\s*=\s*(["'])(.*?)\1/i)?.[2]?.split(/[?#]/)[0];
}

test('脚本引用缺少结束引号时必须报错，查询参数及单双引号引用均可读取',()=>{
    assert.throws(()=>scriptSource(' src="translate/translate_zh.js?v=settings-hints-trim','settings.html'),/unclosed script/);
    assert.equal(scriptSource(' src="translate/translate_zh.js?v=fixed"','settings.html'),'translate/translate_zh.js');
    assert.equal(scriptSource(" src='translate/translate_en.js?v=fixed'",'settings.html'),'translate/translate_en.js');
});
test('当前页面和公共脚本语法有效，所有外部脚本存在且没有重复载入或顶层声明冲突',()=>{
    for(const dir of ['logic','ui','pages','translate','Preset_Data'])for(const file of fs.readdirSync(path.join(root,dir)).filter(name=>name.endsWith('.js'))){
        assert.doesNotThrow(()=>new vm.Script(read(dir+'/'+file),{filename:dir+'/'+file}));
    }
    for(const file of fs.readdirSync(root).filter(name=>name.endsWith('.html'))){
        const html=read(file),scripts=[],chunks=[];
        for(const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)){
            const source=scriptSource(match[1],file);
            if(source&&/^(?:https?:)?\/\//.test(source))continue;
            if(source){
                assert.ok(fs.existsSync(path.join(root,source)),`${file}: missing ${source}`);scripts.push(source);chunks.push(read(source));
            }else chunks.push(match[2]);
        }
        assert.equal(new Set(scripts).size,scripts.length,file+': duplicate scripts');
        assert.doesNotThrow(()=>new vm.Script(chunks.join('\n;\n'),{filename:file+':scripts'}));
        for(const [dependency,consumer] of [['logic/list_order.js','ui/layout.js'],['logic/list_order.js','pages/gallery_setup.js'],['logic/list_order.js','ui/simulator_start.js'],['logic/app_preferences.js','pages/settings.js'],['logic/app_preferences.js','ui/quick_settings.js'],['logic/simulator_economy.js','ui/resource_exchanges.js'],['ui/resource_exchanges.js','ui/simulator_wallet.js'],['Preset_Data/db_zzz.js','Preset_Data/db_test.js'],['logic/version_storage.js','logic/test_catalog.js'],['logic/test_catalog.js','ui/layout.js'],['logic/game_data.js','logic/preset_storage.js'],['logic/preset_storage.js','ui/layout.js'],['ui/user_data_accounts.js','ui/simulator_data_picker.js'],['ui/user_data_accounts.js','pages/dashboard.js'],['ui/user_data_accounts.js','pages/user_data.js']]){
            if(scripts.includes(consumer))assert.ok(scripts.includes(dependency)&&scripts.indexOf(dependency)<scripts.indexOf(consumer),`${file}: ${dependency} must precede ${consumer}`);
        }
    }
});
