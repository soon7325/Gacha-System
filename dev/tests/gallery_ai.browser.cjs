const path=require('path'),assert=require('node:assert/strict'),fs=require('fs');
const {chromium}=require(path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
(async()=>{const b=await chromium.launch({channel:'chrome',headless:true});try{
const p=await b.newPage({viewport:{width:1280,height:900}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
await p.goto(require('url').pathToFileURL(path.join(process.cwd(),'html/gallery_setup.html')).href);await p.waitForTimeout(600);
await p.locator('.gallery-tools summary').click();
await p.locator('#btn-ai-catalog').click();await p.locator('#ai-catalog-game').fill('测试游戏');await p.locator('#ai-catalog-scope').fill('仅角色');
assert.equal(await p.locator('#ai-catalog-language').inputValue(),'zh');
assert.equal(await p.locator('#ai-catalog-sources').inputValue(),'');
await p.locator('#ai-catalog-sources').fill('https://example.com/wiki https://example.org/game');
assert.ok((await p.locator('#ai-catalog-preview').inputValue()).includes('"sourceLinks": "https://example.com/wiki https://example.org/game"'));
assert.match(await p.locator('#ai-catalog-identity').inputValue(),/不标注性别/);
assert.equal(await p.locator('#ai-catalog-identity').evaluate(e=>e.tagName),'INPUT');
assert.equal(await p.locator('#ai-catalog-version').inputValue(),'当前最新版本（含此前版本）');
assert.equal(await p.locator('#ai-catalog-server').inputValue(),'');
assert.equal(await p.locator('#ai-catalog-server').getAttribute('placeholder'),'国服／国际服');
await p.locator('#ai-catalog-version').fill('7.2');
await p.locator('#ai-catalog-server').fill('国服');
assert.ok((await p.locator('#ai-catalog-preview').inputValue()).includes('"version": "7.2"'));
assert.equal(await p.locator('#ai-catalog-order').inputValue(),'按首次实装时间正序');
assert.ok((await p.locator('#ai-catalog-preview').inputValue()).includes('按首次实装时间正序'));
await p.locator('#ai-catalog-order').fill('倒序');
assert.ok((await p.locator('#ai-catalog-preview').inputValue()).includes('"sortPreference": "倒序"'));
await p.locator('#ai-catalog-order').fill('');
assert.match(await p.locator('#ai-catalog-preview').inputValue(),/identityPreference/);
await p.locator('#ai-catalog-identity').fill('旅行者使用空；狼／龙／熊形态分别收录');
assert.ok((await p.locator('#ai-catalog-preview').inputValue()).includes('旅行者使用空；狼／龙／熊形态分别收录'));
for(const language of ['zh','en','both']){
 await p.locator('#ai-catalog-language').selectOption(language);
 const text=await p.locator('#ai-catalog-preview').inputValue();assert.ok(text.includes('"outputLanguage": "'+language+'"'));assert.ok(text.includes('旅风'));assert.ok(text.includes('TravP'));
 const pending=p.waitForEvent('download');await p.getByRole('button',{name:'下载示例模板',exact:true}).click();const file=await pending;
 const sample=JSON.parse(fs.readFileSync(await file.path(),'utf8'));assert.ok(text.includes(JSON.stringify(sample,null,2)));
 assert.deepEqual(Object.keys(sample.info.tagDefinitions),['std','up','gift']);assert.deepEqual(sample.catalog.char[1].tags,['up','std']);
 assert.equal(Boolean(sample.info.gameName),language!=='en');assert.equal(Boolean(sample.info.enGameName),language!=='zh');
 const rows=[...sample.info.categories,...sample.info.globalTiers,...Object.values(sample.info.tagDefinitions),...sample.catalog.char];
 for(const row of rows){assert.equal(Boolean(row.name),language!=='en');assert.equal(Boolean(row.en),language!=='zh');}
 for(const item of sample.catalog.char){assert.equal(item.short.length,language==='en'?0:2);assert.equal(item.eshort.length,language==='zh'?0:5);}
 assert.deepEqual(sample.catalog.char.slice(2).map(item=>item.tags),[['gift'],['gift']]);
}
await p.locator('#ai-catalog-language').selectOption('zh');
const prompt=await p.locator('#ai-catalog-preview').inputValue();assert.ok(prompt.includes('测试游戏'));assert.ok(prompt.includes('仅角色'));
await p.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw Error('denied')}}}));
await p.getByRole('button',{name:'复制提示词与模板',exact:true}).click();assert.match(await p.locator('#ai-catalog-panel [role=status]').textContent(),/自动复制失败/);
await p.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>{window.copiedPrompt=text}}}));
await p.getByRole('button',{name:'复制提示词与模板',exact:true}).click();assert.equal(await p.evaluate(()=>window.copiedPrompt),prompt);
const download=p.waitForEvent('download');await p.getByRole('button',{name:'下载示例模板',exact:true}).click();const d=await download;const data=JSON.parse(fs.readFileSync(await d.path(),'utf8'));assert.equal(data.catalog.char[0].tierId,data.info.globalTiers[0].id);
fs.mkdirSync('dev/output',{recursive:true});await p.screenshot({path:'dev/output/gallery_ai_desktop.png'});
await p.locator('.gallery-tools summary').click();
await p.locator('.gallery-tools summary').click();
assert.equal(await p.locator('#ai-catalog-game').inputValue(),'测试游戏');
await p.locator('#btn-quick-init').click();
assert.ok(await p.locator('#preset-import-bar').isVisible());
assert.equal(await p.locator('#ai-catalog-panel').isVisible(),false);
await p.locator('#btn-import-config').click();
assert.equal(await p.locator('#preset-import-bar').isVisible(),false);
const mergeModes=p.locator('#config-import-options input[name=mode]:not([value=latest])');
assert.equal(await mergeModes.evaluateAll(inputs=>inputs.length===2 && inputs.every(input=>input.disabled)),true);
assert.ok(await p.locator('input[name=mode][value=latest]').isChecked());
await p.locator('#file-import-config').setInputFiles({name:'catalog.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(data))});await p.waitForTimeout(150);
// Existing confirmation flow remains in charge of applying imports.
await p.locator('#btn-confirm-ok').click();await p.waitForTimeout(200);assert.equal(await p.locator('#input-game-name').inputValue(),'示例游戏');assert.equal(await p.evaluate(()=>catalog.char[0].id),'example_char_001');
assert.equal(await mergeModes.evaluateAll(inputs=>inputs.every(input=>input.disabled)),true);
await p.locator('#btn-save-all').click();
assert.equal(await mergeModes.evaluateAll(inputs=>inputs.every(input=>!input.disabled)),true);
await p.evaluate(()=>{localStorage.setItem('GM_Lang','en');applyTranslations()});
assert.equal(await p.locator('#btn-quick-init').isVisible(),false);
await p.locator('#btn-ai-catalog').click();
assert.equal(await p.locator('#ai-catalog-game').inputValue(),'测试游戏');
assert.equal(await p.locator('#ai-catalog-language').inputValue(),'zh');
assert.equal(await p.locator('#ai-catalog-scope').inputValue(),'仅角色');
assert.match(await p.locator('label[for=ai-catalog-identity]').textContent(),/Gender/);
await p.setViewportSize({width:390,height:844});
const layout=await p.locator('#ai-catalog-panel').evaluate(panel=>{
 const body=panel.querySelector('#ai-catalog-body'),output=panel.querySelector('textarea');
 return panel.scrollWidth<=panel.clientWidth && body.scrollHeight<=body.clientHeight+1 &&
    output.scrollHeight>output.clientHeight && panel.firstElementChild.querySelectorAll('button').length===2;
});
assert.ok(layout);
await p.locator('#btn-ai-catalog').scrollIntoViewIfNeeded();
await p.screenshot({path:'dev/output/gallery_ai_mobile.png'});
await p.goto(require('url').pathToFileURL(path.join(process.cwd(),'html/gallery_setup.html')).href+'?gameId=hsr');
assert.ok(await p.locator('#btn-export-config').isVisible());
assert.equal(await p.locator('.gallery-tools').isVisible(),false);
assert.equal(await p.locator('#btn-ai-catalog').isVisible(),false);
assert.deepEqual(errors,[]);
console.log('PASS: inline tools, retained fields, preset export, mobile layout and AI output');
}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
