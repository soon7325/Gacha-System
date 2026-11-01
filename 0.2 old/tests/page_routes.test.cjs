const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');const vm=require('node:vm');
const root=path.join(__dirname,'..');
const quick=fs.readFileSync(path.join(root,'ui/quick_settings.js'),'utf8');
const layout=fs.readFileSync(path.join(root,'ui/layout.js'),'utf8');
const quickExpression=quick.match(/const file = (.*);/)[1];
const sidebarExpression=layout.match(/const currentFile = (.*);/)[1];
const changelogExpression=layout.match(/const IS_CHANGELOG_PAGE = (.*);/)[1];
for (const name of ['index','settings','dashboard','simulator','changelog','gallery_setup','pool_setup']) {
 for(const route of ['/'+name,'/'+name+'.html','/'+name+'/']) {
  const context={location:{pathname:route},window:{location:{pathname:route}}};
  assert.equal(vm.runInNewContext(quickExpression,context),name+'.html');
  assert.equal(vm.runInNewContext(sidebarExpression,context),name+'.html');
  assert.equal(vm.runInNewContext(changelogExpression,context),name==='changelog');
 }
}
assert.equal(vm.runInNewContext(quickExpression,{location:{pathname:'/'}}),'index.html');
console.log('PASS：所有新版页面兼容本地 .html 与线上无扩展名地址的功能识别');
