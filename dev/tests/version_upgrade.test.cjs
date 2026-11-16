const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../../logic/version_storage.js'),'utf8');
function store(entries=[]){const values=new Map(entries);return {values,get length(){return values.size;},key:i=>[...values.keys()][i]??null,getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,String(value)),removeItem:key=>values.delete(key)};}
function load(local,route='/index.html',version,logger=console){const window={localStorage:local,sessionStorage:store(),location:{pathname:route,search:''},...(version?{GACHA_STORAGE_VERSION:version}:{})};vm.runInNewContext(source,{window,URLSearchParams,console:logger});return window;}
test('现有0.2数据原样复制到最新0.3，旧版与新版之后各自编辑，刷新不重新覆盖',()=>{
 const local=store([['GACHA_VERSION:0.2:__initialized','1'],['GACHA_VERSION:0.2:GM_Data_record','record-v2'],['GACHA_VERSION:0.2:GM_Sim_Profiles_game','accounts-v2'],['GM_Data_record','raw-legacy']]);
 const latest=load(local),old=load(local,'/old_version/0.2/index.html');
 assert.equal(latest.localStorage.getItem('GM_Data_record'),'record-v2');assert.equal(latest.localStorage.getItem('GM_Sim_Profiles_game'),'accounts-v2');
 old.localStorage.setItem('GM_Data_record','edited-v2');latest.localStorage.setItem('GM_Sim_Profiles_game','edited-v3');
 assert.equal(load(local).localStorage.getItem('GM_Data_record'),'record-v2');assert.equal(old.localStorage.getItem('GM_Sim_Profiles_game'),'accounts-v2');
 assert.equal(local.getItem('GM_Data_record'),'raw-legacy');
 assert.equal(latest.VersionStorage.eventKey('GACHA_VERSION:0.2:GM_Data_record'),undefined);assert.equal(latest.VersionStorage.eventKey(null),null);
});
test('0.4首次继承0.3而非0.2，之后双向修改、清空和会话数据均互不影响',()=>{
 const local=store([['GACHA_VERSION:0.2:__initialized','1'],['GACHA_VERSION:0.2:GM_Value','v2']]);
 const v3=load(local);v3.localStorage.setItem('GM_Value','v3');
 const v4=load(local,'/index.html','0.4');assert.equal(v4.localStorage.getItem('GM_Value'),'v3');
 v4.localStorage.setItem('GM_Value','v4');v3.localStorage.setItem('GM_Value','v3 edited');
 assert.equal(load(local,'/index.html','0.4').localStorage.getItem('GM_Value'),'v4');assert.equal(v3.localStorage.getItem('GM_Value'),'v3 edited');
 v4.localStorage.clear();assert.equal(v3.localStorage.getItem('GM_Value'),'v3 edited');assert.equal(load(local,'/old_version/0.2/index.html').localStorage.getItem('GM_Value'),'v2');
 assert.equal(load(local,'/index.html','0.4').localStorage.length,0);
});
test('首次全新升级按链建立0.2与0.3；0.0、0.1保留各自数据且不回灌最新',()=>{
 const local=store([['GM_Value','unscoped'],['GACHA_VERSION:0.1:__initialized','1'],['GACHA_VERSION:0.1:GM_Value','old-v1']]);
 assert.equal(load(local).localStorage.getItem('GM_Value'),'unscoped');
 assert.equal(load(local,'/old_version/0.2/index.html').localStorage.getItem('GM_Value'),'unscoped');
 assert.equal(load(local,'/old_version/0.1/index.html').localStorage.getItem('GM_Value'),'old-v1');
 const v0=load(local,'/old_version/0.0/index.html');v0.localStorage.setItem('GM_Value','edited-v0');
 assert.equal(load(local).localStorage.getItem('GM_Value'),'unscoped');assert.equal(local.getItem('GM_Value'),'unscoped');
});
test('0.0及0.2归档页面在读取存储前加载统一隔离脚本，0.2版本页转入共享通道',()=>{
 for(const folder of ['old_version/0.0','old_version/0.2'])for(const file of fs.readdirSync(path.join(__dirname,'../..',folder)).filter(file=>file.endsWith('.html')&&file!=='changelog.html')){
  const html=fs.readFileSync(path.join(__dirname,'../..',folder,file),'utf8'),loader=html.indexOf('src="../logic/version_storage.js"');assert.ok(loader>=0,folder+'/'+file);
  const firstRead=html.indexOf('localStorage');if(firstRead>=0)assert.ok(loader<firstRead);
 }
 const archive=fs.readFileSync(path.join(__dirname,'../../old_version/0.2/changelog.html'),'utf8');assert.match(archive,/searchParams.set\('channel','0.2'\)/);
});
test('最新0.3.6.22承接版本通道，旧更新内容保留，中英文简要与历史一致',()=>{
 const c=vm.createContext({window:{},localStorage:{getItem:()=>null},document:{addEventListener(){}}});
 for(const lang of ['zh','en']){
  vm.runInContext(fs.readFileSync(path.join(__dirname,'../../translate/changelog_'+lang+'.js'),'utf8'),c);
  vm.runInContext(fs.readFileSync(path.join(__dirname,'../../translate/translate_'+lang+'.js'),'utf8'),c);
  const list=c.window['CHANGELOG_'+lang.toUpperCase()],current=list.find(row=>row.version==='v0.3.6.22'),previous=list.find(row=>row.version==='v0.3.6.21'),old=list.find(row=>row.version==='v0.2.5.12');
  assert.equal(typeof current.content,'string');assert.equal(current.channel.targetVer,'0.3');assert.equal(old.channel.path,'old_version/0.2/index.html');
  assert.equal(current.date,'09/11/2026');assert.equal(list.filter(row=>/^v\d/.test(row.version))[0].version,'v0.3.6.22');
  assert.equal(list.filter(row=>row.channel?.enabled&&row.channel.targetVer==='0.3').length,1);
  assert.notEqual(previous.channel?.enabled,true);assert.equal(typeof previous.content,'string');
  assert.equal(typeof c.window.UI_LIB[lang].idx_version_content,'string');assert.match(c.window.UI_LIB[lang].idx_version_title,/0\.3\.6\.22/);
  if(lang==='zh'){
   assert.ok(current.tag.some(tag=>tag.scope==='首页'&&tag.type.includes('新增')));
   assert.ok(current.tag.every(tag=>typeof tag.scope==='string'&&Array.isArray(tag.type)&&tag.type.length>0));
   assert.match(current.content,/首次进入首页/);
   assert.match(current.content,/重新体验/);assert.match(current.content,/取消则留在设置页/);assert.equal(list.find(row=>row.version==='v0.3.6.21').date,'06/11/2026');
   assert.match(c.window.UI_LIB[lang].idx_version_content,/所有详情均可查看历史版本更新日志/);
   assert.match(c.window.UI_LIB[lang].idx_version_content,/小版本更新：<br>1：首次进入首页/);
   assert.match(c.window.UI_LIB[lang].idx_version_content,/图鉴更新：<br>1：四个正式游戏图鉴补充固定 ID 与旧数据兼容。/);
  }
 }
 vm.runInContext(fs.readFileSync(path.join(__dirname,'../../translate/translate.js'),'utf8'),c);
 assert.equal(c.window.getTrans('idx_version_content'),c.window.UI_LIB.zh.idx_version_content);
 c.window.UI_LIB.zh.test_empty_value='';
 assert.equal(c.window.getTrans('test_empty_value'),'');assert.equal(c.window.getTrans('missing'),'missing');
});
test('复制失败不覆盖0.2来源、不退回共享存储，恢复空间后可以重试',()=>{
 const local=store([['GACHA_VERSION:0.2:__initialized','1'],['GACHA_VERSION:0.2:GM_One','one'],['GACHA_VERSION:0.2:GM_Two','two'],['GM_OnlyLegacy','legacy']]),set=local.setItem,errors=[];
 local.setItem=(key,value)=>{if(key==='GACHA_VERSION:0.3:GM_Two')throw Error('quota');return set(key,value);};
 const failed=load(local,'/index.html',null,{error:(...args)=>errors.push(args)});
 assert.equal(errors.length,1);assert.equal(local.getItem('GACHA_VERSION:0.3:__initialized'),null);assert.equal(failed.localStorage.getItem('GM_OnlyLegacy'),null);
 assert.equal(local.getItem('GACHA_VERSION:0.2:GM_Two'),'two');
 local.setItem=set;const retried=load(local);assert.equal(retried.localStorage.getItem('GM_One'),'one');assert.equal(retried.localStorage.getItem('GM_Two'),'two');
});
test('复制跨目录图片仍能在新版和0.2显示，数据层不改写原图鉴',()=>{
 for(const [file,src,expected] of [['logic/game_data.js','../img/HSR/example.webp','img/HSR/example.webp'],['old_version/0.2/logic/game_data.js','img/HSR/example.webp','../img/HSR/example.webp']]){
  const original=JSON.stringify({char:[{name:'角色',img:src},{name:'外部图',img:'https://example.test/img/a.png'}]}),c=vm.createContext({window:{},localStorage:{getItem:key=>key==='GM_Catalog_custom'?original:null}});
  vm.runInContext(fs.readFileSync(path.join(__dirname,'../..',file),'utf8'),c);
  const items=c.window.GameData.loadCatalog('custom').char;assert.equal(items[0].img,expected);assert.equal(items[1].img,'https://example.test/img/a.png');
 }
});
test('0.2继承了新版专属启动页时停留归档首页，支持的旧页仍可正常跳转',()=>{
 const html=fs.readFileSync(path.join(__dirname,'../../old_version/0.2/index.html'),'utf8'),script=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]).find(code=>code.includes('function checkStartPage'));
 for(const [page,expected] of [['user_data.html?gameId=hsr',false],['currency_setup.html',false],['dashboard.html?gameId=hsr&pool=char_up',true]]){
  const redirects=[];vm.runInNewContext(script,{sessionStorage:store(),localStorage:{getItem:()=>page},window:{location:{replace:value=>redirects.push(value)}}});
  assert.equal(redirects.length,expected?1:0);
 }
});
