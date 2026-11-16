const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
function setup(){
 let lang='zh',answer=false,dirty=0,locked=false,resolve;
 const requests=[],toasts=[],cards=[];
 const root={innerHTML:'',querySelectorAll:selector=>selector==='[data-eco-list]'?cards:[]};
 const m={resources:[{id:'coin',name:'币',en:'Coin'},{id:'ticket',name:'票',en:'Ticket'},{id:'free',name:'空闲资源'}],exchanges:[{id:'buy',name:'买票',en:'Buy ticket',from:'coin',toIds:['ticket'],mode:'fixed',cost:1,gain:1}],unlockGroups:[],payments:[],incomes:[]};
 const context=require('./icon_test_context.cjs').createContext({window:{Dialog:{create:()=>({confirm(message,options){requests.push({message,options});return answer==='wait'?new Promise(done=>resolve=done):Promise.resolve(answer);}})}},document:{getElementById:()=>root},getLang:()=>lang,gameId:'custom',gameInfo:{categories:[],globalTiers:[],economy:m},GameData:{getPresetRules:()=>null},readEngineEdit:()=>null,sessionStorage:{getItem:()=>null},galleryPreviewLock:{isLocked:()=>locked},markPageDirty:()=>dirty++,showToast:(...args)=>toasts.push(args)});
 vm.runInContext(fs.readFileSync(path.join(__dirname,'../../pages/gallery_economy.js'),'utf8'),context);context.window.GalleryEconomy.render();
 const click=(list,id)=>root.onclick({target:{closest:s=>s==='[data-eco-action]'?{dataset:{ecoAction:'remove'}}:s==='[data-eco-list]'?{dataset:{ecoList:list,ecoId:id}}:null}});
 return {m,root,cards,requests,toasts,click,answer:v=>answer=v,resolve:v=>resolve(v),lang:v=>lang=v,dirty:()=>dirty,lock:()=>locked=true};
}

test('资源引用弹窗列出分区、分类、规则与用途；关闭不删除、不发toast、不改草稿',async()=>{
 const h=setup();h.m.exchanges.push({id:'stage',name:'阶梯购票',mode:'staged',from:'coin',stages:[{cost:1,gain:1,toIds:['ticket']}]});
 h.m.unlockGroups.push({id:'unlock',name:'二层解锁',period:'monthly',costs:[{resourceId:'coin',amount:1}],requirements:[{exchangeId:'buy',targetId:'coin',times:1}]});
 h.m.payments.push({id:'pay',name:'货币单抽',resourceId:'coin',cost:1,pulls:1});h.m.incomes.push({id:'gift',name:'每日补给',resourceId:'coin',source:'other',schedule:'daily',amount:1});
 const before=JSON.stringify(h.m);await h.click('resources','coin');
 const {message,options}=h.requests[0];
 for(const text of ['币','兑换规则','普通兑换','买票','阶梯购票','前置条件','二层解锁','解锁消耗','前置兑换目标','抽卡支付','货币单抽','获取与赠送','每日补给','解除关联'])assert.ok(message.includes(text),text);
 assert.equal(options.okText,'查看引用规则');assert.equal(options.cancelText,'关闭');assert.equal(options.html,undefined);
 assert.equal(JSON.stringify(h.m),before);assert.equal(h.dirty(),0);assert.equal(h.toasts.length,0);
 await h.click('resources','ticket');assert.match(h.requests[1].message,/第1档获得资源/);
});

test('兑换与前置条件删除同样列出引用，使用英文名且保留原数据',async()=>{
 const h=setup();h.m.unlockGroups.push({id:'g',name:'月条件',en:'Monthly prerequisite',period:'monthly',requirements:[{exchangeId:'buy',times:1}],costs:[]});h.m.exchanges[0].unlockGroupId='g';
 await h.click('exchanges','buy');assert.match(h.requests[0].message,/月条件/);
 h.lang('en');await h.click('unlockGroups','g');assert.match(h.requests[1].message,/Buy ticket/);assert.match(h.requests[1].message,/Assigned prerequisite/);assert.equal(h.requests[1].options.okText,'View referencing rules');
 assert.equal(h.m.exchanges.length,1);assert.equal(h.m.unlockGroups.length,1);assert.equal(h.dirty(),0);
});

test('查看引用自动展开分区、分类和规则，滚动定位并聚焦',async()=>{
 const h=setup(),section={tagName:'DETAILS',dataset:{ecoKey:'section:exchanges'},open:false,parentElement:h.root};
 const group={tagName:'DETAILS',dataset:{ecoKey:'group:exchanges:regular'},open:false,parentElement:section};
 let scrolled=0,focused=0;const classes=new Set();
 const card={tagName:'DETAILS',dataset:{ecoKey:'exchanges:buy',ecoList:'exchanges',ecoId:'buy'},open:false,parentElement:group,classList:{add:x=>classes.add(x)},scrollIntoView(){scrolled++;},querySelector:()=>({focus(){focused++;}})};
 h.cards.push(card);h.answer(true);await h.click('resources','coin');
 assert.equal(section.open,true);assert.equal(group.open,true);assert.equal(card.open,true);assert.equal(scrolled,1);assert.equal(focused,1);assert.ok(classes.has('eco-reference-target'));assert.equal(h.dirty(),0);
});

test('删除确认期间新增引用后再次检查，保留资源并显示新引用',async()=>{
 const h=setup();h.answer('wait');const pending=h.click('resources','free');
 h.m.payments.push({id:'new',name:'新增支付',resourceId:'free',cost:1,pulls:1});h.answer(false);h.resolve(true);await pending;
 assert.equal(h.requests.length,2);assert.match(h.requests[1].message,/新增支付/);assert.ok(h.m.resources.some(row=>row.id==='free'));assert.equal(h.dirty(),0);
});
