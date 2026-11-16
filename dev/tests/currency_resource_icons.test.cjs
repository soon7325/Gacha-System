const assert = require('node:assert/strict');
const {test} = require('node:test');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

test('资源图标独立保存、选择器取消与只读保护、兑换图标跟随源和阶段目标', async () => {
    let locked = false, dirty = 0, nextIcon = '🌟', chooseCalls = 0;
    const root = {innerHTML:'', querySelectorAll:()=>[]};
    const context = require('./icon_test_context.cjs').createContext({
        window:{}, document:{getElementById:()=>root}, gameId:'test', getLang:()=> 'zh',
        gameInfo:{categories:[],economy:{resources:[{id:'a',name:'代币',kind:'currency'},{id:'b',name:'票',kind:'ticket'},{id:'c',name:'十连券',kind:'ten'}],
            exchanges:[{id:'x',name:'兑换',from:'a',to:'b',mode:'staged',stages:[{cost:1,gain:1},{cost:1,gain:1,to:'c'}]}],payments:[],incomes:[]}},
        readEngineEdit:()=> '[]', GameData:{getPresetRules:()=>null}, sessionStorage:{getItem:()=>null},
        galleryPreviewLock:{isLocked:()=>locked}, markPageDirty:()=>dirty++,
        IconPicker:{choose:async current=>{chooseCalls++; assert.ok(current);return typeof nextIcon==='function'?nextIcon():nextIcon;}}
    });
    vm.runInContext(fs.readFileSync(path.join(__dirname,'../../pages/gallery_economy.js'),'utf8'),context);
    const ui = context.window.GalleryEconomy;
    const clickIcon = id => root.onclick({preventDefault(){},target:{closest:selector=> selector==='[data-eco-action]'?{dataset:{ecoAction:'icon'}}:selector==='[data-eco-list]'?{dataset:{ecoList:'resources',ecoId:id}}:null}});
    ui.render();
    const resources = context.gameInfo.economy.resources;
    assert.deepEqual(Array.from(resources,r=>r.icon),['🪙','🎟️','🎫']);
    assert.ok(resources.every(r=>!('kind' in r)));
    assert.doesNotMatch(root.innerHTML,/data-eco-field="kind"/);
    assert.match(root.innerHTML,/<span class="eco-exchange-source">🪙<\/span>.*?eco-name-wrap.*?eco-exchange-arrow.*?<span>🎟️<\/span>.*?<span>🎫<\/span>/);
    await clickIcon('a');
    assert.equal(resources[0].icon,'🌟');
    assert.match(root.innerHTML,/<span class="eco-exchange-source">🌟<\/span>/);
    assert.equal(dirty,1);
    nextIcon='💎';
    await clickIcon('c');
    assert.match(root.innerHTML,/<span>💎<\/span>/);
    nextIcon=null;
    await clickIcon('a');
    assert.equal(dirty,2,'取消不改变数据或修改标记');
    locked=true;
    await clickIcon('a');
    assert.equal(chooseCalls,3,'只读时不打开弹窗');
    locked=false;
    nextIcon=()=>{locked=true;return '🔥';};
    await clickIcon('a');
    assert.equal(resources[0].icon,'🌟','弹窗打开后进入只读也不能提交');
    assert.equal(dirty,2);
    assert.equal(JSON.parse(JSON.stringify(context.gameInfo.economy)).resources[2].icon,'💎');
});

test('支付、前置及获取规则独立更换图标，取消及只读不会提交，图标可保存重载', async () => {
    let locked=false,dirty=0,nextIcon='🌟',calls=0;
    const root={innerHTML:'',querySelectorAll:()=>[]};
    const context=require('./icon_test_context.cjs').createContext({window:{},document:{getElementById:()=>root},gameId:'custom',getLang:()=> 'zh',
        gameInfo:{categories:[],economy:{resources:[],exchanges:[],payments:[{id:'pay',name:'支付',poolIds:[]}],unlockGroups:[{id:'unlock',name:'条件',period:'monthly',requirements:[],costs:[]}],incomes:[{id:'income',name:'赠送',source:'other',schedule:'once'}]}},
        readEngineEdit:()=> '[]',GameData:{getPresetRules:()=>null},sessionStorage:{getItem:()=>null},
        galleryPreviewLock:{isLocked:()=>locked},markPageDirty:()=>dirty++,
        IconPicker:{choose:async current=>{calls++;assert.ok(current);return typeof nextIcon==='function'?nextIcon():nextIcon;}}});
    vm.runInContext(fs.readFileSync(path.join(__dirname,'../../pages/gallery_economy.js'),'utf8'),context);
    const api=context.window.GalleryEconomy,m=context.gameInfo.economy;
    let prevented=0,stopped=0;
    const click=(list,id)=>root.onclick({preventDefault(){prevented++;},stopPropagation(){stopped++;},target:{closest:selector=>selector==='[data-eco-action]'?{dataset:{ecoAction:'icon'}}:selector==='[data-eco-list]'?{dataset:{ecoList:list,ecoId:id}}:null}});
    api.render();
    for(const [list,id,fallback,icon] of [['payments','pay','🎯','💎'],['unlockGroups','unlock','🔓','🔑'],['incomes','income','🎁','🌱']]){
        assert.match(root.innerHTML,new RegExp('class="eco-resource-icon eco-kind-icon"[^>]+>'+fallback));
        nextIcon=icon;await click(list,id);assert.equal(m[list][0].icon,icon);
        assert.match(root.innerHTML,new RegExp('class="eco-resource-icon eco-kind-icon"[^>]+>'+icon));
    }
    assert.equal(dirty,3);assert.equal(calls,3);assert.equal(prevented,3);assert.equal(stopped,3);
    const saved=JSON.parse(JSON.stringify(m));context.gameInfo.economy=saved;api.render();
    assert.equal(saved.payments[0].icon,'💎');assert.equal(saved.unlockGroups[0].icon,'🔑');assert.equal(saved.incomes[0].icon,'🌱');
    nextIcon=null;await click('payments','pay');assert.equal(dirty,3);
    nextIcon='💎';await click('payments','pay');assert.equal(dirty,3,'选中相同图标不标记修改');
    locked=true;await click('incomes','income');assert.equal(calls,5,'只读时不打开选择器');
    locked=false;nextIcon=()=>{locked=true;return '🔥';};await click('unlockGroups','unlock');assert.equal(saved.unlockGroups[0].icon,'🔑');assert.equal(dirty,3);
    locked=false;nextIcon=()=>{saved.incomes=[];return '🔥';};await click('incomes','income');assert.equal(dirty,3,'选择期间规则被删除，不写入旧对象');
    nextIcon=()=>{context.gameInfo.economy={...saved};return '🔥';};await click('payments','pay');assert.equal(dirty,3,'数据源替换后不写入旧对象');
});
