const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const c=vm.createContext({window:{},localStorage:{getItem:()=> 'zh'}});
for(const file of ['color_style','color_picker']){vm.runInContext(fs.readFileSync(path.join(__dirname,'../../ui/'+file+'.js'),'utf8'),c);Object.assign(c,c.window);}
const api=c.ColorStyle,copy=x=>JSON.parse(JSON.stringify(x));
test('legacy hex colors remain solid; untrusted CSS cannot become a gradient or style attribute',()=>{
    assert.equal(api.background('#abc'),'#aabbcc');assert.deepEqual(copy(api.normalize({color:'#F1C40F'})),{color:'#f1c40f'});
    for(const bad of ['red;position:fixed','url(https://example.invalid/image)','" onclick="alert(1)'])assert.equal(api.background({color:bad}),'#dfbf88');
    const value={color:'#123456',paint:{type:'linear',angle:'bad',stops:[{color:'red;}',position:20},{color:'#abc',position:-20},{color:'#def',position:130}]}};
    assert.deepEqual(copy(api.normalize(value)),{color:'#aabbcc',paint:{type:'linear',angle:135,stops:[{color:'#aabbcc',position:0},{color:'#ddeeff',position:100}]}});
    assert.equal(api.background({...value,paint:{type:'url',stops:[]}}),'#123456');
});
test('gradient stops are bounded and ordered without mutating imported data; all display contexts share the gradient',()=>{
    const value={color:'#fff',paint:{type:'linear',angle:390,stops:[{color:'#ff4400',position:100},{color:'#ffee00',position:0},{color:'#ff9900',position:40}]}};
    const before=JSON.stringify(value),normalized=api.normalize(value),bg=api.background(value);
    assert.equal(JSON.stringify(value),before);assert.equal(normalized.color,'#ffee00');assert.equal(normalized.paint.angle,360);
    assert.match(bg,/linear-gradient\(360deg, #ffee00 0%, #ff9900 40%, #ff4400 100%\)/);
    assert.ok(api.text(value).includes(bg));assert.ok(api.frame(value).includes(bg));
    assert.equal(api.background(JSON.parse(JSON.stringify(normalized))),bg);
    assert.match(api.background({color:'#000',paint:{...value.paint,type:'radial'}}),/^radial-gradient\(circle,/);
    assert.equal(api.alpha('#abc',.5),'#aabbcc80');assert.equal(api.contrast('#fff'),'#151b24');assert.equal(api.contrast('#000'),'#ffffff');
    const tooMany={paint:{type:'linear',stops:Array.from({length:100},(_,i)=>({color:'#123456',position:i}))}};assert.equal(api.normalize(tooMany).paint.stops.length,8);
});
test('custom color field converts between hex and HSV for primaries, neutrals and arbitrary colors',()=>{
    for(const hex of ['#000000','#ffffff','#ff0000','#00ff00','#0000ff','#ff9900','#824cab','#dfbf88']){const hsv=c.ColorPicker.toHSV(hex);assert.equal(c.ColorPicker.fromHSV(hsv.h,hsv.s,hsv.v),hex);}
});
test('all current pages load the paint renderer; editors load the custom picker; Arknights specifies its own special accent',()=>{
    const root=path.join(__dirname,'../..'), pages=path.join(root,'html');for(const file of fs.readdirSync(pages).filter(f=>f.endsWith('.html'))){const html=fs.readFileSync(path.join(pages,file),'utf8');assert.ok(html.includes('ui/color_style.js'),file);}
    for(const file of ['gallery_setup','pool_setup']){const html=fs.readFileSync(path.join(pages,file+'.html'),'utf8');assert.ok(html.includes('ui/color_picker.js'));}
    assert.doesNotMatch(fs.readFileSync(path.join(root,'pages/gallery_setup.js'),'utf8'),/type="color"/);
    const preset=fs.readFileSync(path.join(root,'Preset_Data/db_ark.js'),'utf8');assert.equal((preset.match(/specRate:\s*\{\s*color: "#e74c3c"/g)||[]).length,3);
});
