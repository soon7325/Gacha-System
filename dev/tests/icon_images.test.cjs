const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {createContext} = require('./icon_test_context.cjs');
const read = file => fs.readFileSync(path.join(__dirname, '../..', file), 'utf8');

function setup() {
    const nodes=[];
    function element(tag) {
        const node={tag,children:[],isConnected:true,value:'',textContent:'',innerHTML:'',
            append(...items){this.children.push(...items);},appendChild(item){this.append(item);},
            setAttribute(){},focus(){},select(){},showModal(){},close(){},remove(){this.isConnected=false;}};
        nodes.push(node);return node;
    }
    const c=createContext({window:{getTrans:key=>key},document:{body:element('body'),activeElement:null,createElement:element}});
    c.ImageUpload={processFile:async()=>({dataURL:'data:image/png;base64,AAAA'})};
    vm.runInContext(read('ui/icon_picker.js'),c);
    return {c,nodes,choose:()=>c.window.IconPicker.choose('✨'),find:(tag,type)=>nodes.find(n=>n.tag===tag&&(!type||n.type===type))};
}

test('image sources render safely, Emoji stays text, official logo assets exist',()=>{
    const r=createContext({window:{}}).IconRender;
    for(const id of ['hsr','zzz','end','ark']){
        const source=r.game(id);
        assert.ok(fs.existsSync(path.join(__dirname,'../..',source)));
        assert.match(r.html(source),/<img class="inline-icon-image"/);
    }
    assert.equal(r.html('🪙'),'🪙');
    assert.equal(r.game('custom','🌟'),'🌟');
    assert.match(r.html('https://example.test/logo.png?a=1&b=2'),/a=1&amp;b=2/);
    for(const value of ['javascript:alert(1)','data:image/svg+xml;base64,AAAA','https://a.test/" onerror="bad()'])assert.equal(r.isImage(value),false);
    assert.doesNotMatch(r.html('<img src=x onerror=bad()>'),/<img/);
});

test('all 31 official currency and ticket icons use existing local images with Chinese filenames',()=>{
    const c=createContext({window:{}});let count=0;
    for(const game of ['hsr','zzz','ark','end']) {
        vm.runInContext(read('Preset_Data/db_'+game+'.js'),c);
        const resources=vm.runInContext(game.toUpperCase()+'_CURRENCY_RULES.economy.resources',c);
        for(const resource of resources) {
            assert.ok(fs.existsSync(path.join(__dirname,'../..',resource.icon)),resource.id);
            assert.equal(c.IconRender.isImage(resource.icon),true,resource.icon);
            assert.match(c.IconRender.html(resource.icon),/<img class="inline-icon-image"/);
            assert.equal(c.IconRender.text(resource.icon),'','text-only labels never expose image paths');count++;
        }
    }
    assert.equal(count,31);
    assert.equal(c.IconRender.isImage('img/ARK/icon/合成玉.png" onerror="bad()'),false);
});

test('all eight official item-category logos use local images and typed pools reference their category logos',()=>{
    const c=createContext({window:{}});
    for(const game of ['hsr','zzz','end','ark'])vm.runInContext(read('Preset_Data/db_'+game+'.js'),c);
    vm.runInContext(read('logic/game_data.js'),c);const data=c.window.GameData;let count=0;
    for(const game of ['hsr','zzz','end','ark'])for(const category of data.getPresetSetup(game).categories){
        assert.ok(c.IconRender.isImage(category.icon),game+':'+category.id);assert.ok(fs.existsSync(path.join(__dirname,'../..',category.icon)));count++;
    }
    assert.equal(count,8);
    for(const [game,pool,category]of [['hsr','char_up','char'],['hsr','wep_up','wep'],['zzz','char_up_2','char'],['zzz','wep_up_2','wep'],['zzz','bangboo_up','pet'],['end','char_up','char'],['end','wep_up','wep'],['ark','up_1','char']]){
        assert.equal(data.getPresetRules(game)[pool].info.icon,data.getPresetSetup(game).categories.find(row=>row.id===category).icon);
    }
    for(const [game,pool,icon]of [['hsr','mixed_std','img/HSR/icon/星轨通票.webp'],['zzz','mixed_std','img/ZZZ/icon/原装母带.webp'],['end','char_std','img/END/icon/基础寻访凭证.png'],['hsr','char_collab','img/HSR/icon/FSN联动.png'],['hsr','wep_collab','img/HSR/icon/FSN联动.png'],['ark','std_2','img/ARK/icon/中坚寻访凭证.png']]){
        assert.equal(data.getPresetRules(game)[pool].info.icon,icon);assert.ok(fs.existsSync(path.join(__dirname,'../..',icon)));
    }
});

test('test catalog has a dedicated logo and 21 distinct local AI pool icons',()=>{
    const c=createContext({window:{}});
    for(const game of ['zzz','test'])vm.runInContext(read('Preset_Data/db_'+game+'.js'),c);
    const setup=vm.runInContext('TEST_SETUP_RULES',c),pools=vm.runInContext('TEST_POOL_RULES',c);
    assert.equal(setup.icon,c.IconRender.game('test'));
    assert.equal(Object.keys(pools).length,21);
    const icons=[setup.icon,...Object.values(pools).map(pool=>pool.info.icon)];
    assert.equal(new Set(icons).size,22);
    for(const source of icons){
        assert.equal(c.IconRender.isImage(source),true,source);
        const bytes=fs.readFileSync(path.join(__dirname,'../..',source));
        assert.equal(bytes.subarray(1,4).toString(),'PNG',source);
        assert.equal(bytes[25],6,'RGBA transparency: '+source);
    }
    assert.notEqual(pools.char_up.info.icon,vm.runInContext('ZZZ_POOL_RULES.char_up.info.icon',c));
});

test('upload previews and confirms the saved string; cancel and Emoji keep existing behavior',async()=>{
    const h=setup(),chosen=h.choose(),file=h.find('input','file');
    file.files=[{type:'image/png'}];await file.onchange();
    assert.match(h.find('span').innerHTML,/data:image\/png;base64,AAAA/);
    h.find('form').onsubmit({preventDefault(){}});
    assert.equal(await chosen,'data:image/png;base64,AAAA');
    const cancel=setup(),cancelled=cancel.choose();
    cancel.find('dialog').oncancel({preventDefault(){}});assert.equal(await cancelled,null);
    const emoji=setup(),result=emoji.choose();
    emoji.nodes.find(n=>n.textContent==='👤').onclick();
    emoji.find('form').onsubmit({preventDefault(){}});assert.equal(await result,'👤');
});

test('late uploads cannot overwrite newer input; failed upload preserves the previous icon',async()=>{
    const h=setup();let complete;
    h.c.ImageUpload.processFile=()=>new Promise(resolve=>{complete=resolve;});
    const result=h.choose(),file=h.find('input','file');file.files=[{}];
    const pending=file.onchange(),input=h.find('input','text');input.value='💎';input.oninput();
    complete({dataURL:'data:image/png;base64,AAAA'});await pending;
    assert.equal(input.value,'💎');
    h.c.ImageUpload.processFile=async()=>{throw Error('bad image');};await file.onchange();
    assert.equal(input.value,'💎');
    assert.ok(h.nodes.some(n=>n.textContent==='icon_picker_upload_error'));
    h.find('form').onsubmit({preventDefault(){}});assert.equal(await result,'💎');
});

test('all current layout pages load image rendering before the sidebar and picker uploads have their dependency',()=>{
    for(const file of fs.readdirSync(path.join(__dirname,'../..')).filter(f=>f.endsWith('.html'))){
        const source=read(file);
        if(source.includes('ui/layout.js')){
            const layout=source.indexOf('<script src="ui/layout.js');
            assert.ok(source.includes('ui/icon_render.js'),file);
            assert.ok(source.indexOf('ui/icon_render.js')<(layout>=0?layout:source.indexOf('const shellLayout')),file);
        }
        if(source.includes('<script src="ui/icon_picker.js'))assert.ok(source.indexOf('ui/image_upload.js')<source.indexOf('ui/icon_picker.js')&&source.includes('ui/image_upload.js'),file);
    }
});
