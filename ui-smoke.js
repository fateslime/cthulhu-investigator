/* DOM-interface smoke test. Not a substitute for real browser / visual QA. */
(function(root){
  'use strict';
  root.runFogUISmoke=function(engineSource,appSource,recapSource=''){
    const results=[];
    function ok(condition,name){results.push({name,pass:!!condition});if(!condition)throw Error(name);}
    const F=new Function(engineSource+'\n'+recapSource+'\nreturn Fog;')();
    const nodes={},dataInputs=[];let app;
    const decode=s=>s.replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&');
    function element(id){if(nodes[id])return nodes[id];let html='';const e={id,value:'',textContent:'',disabled:false,open:false,dataset:{},listeners:{},classList:{add(){},remove(){}},addEventListener(name,fn){this.listeners[name]=fn;},showModal(){this.open=true;},close(){this.open=false;},click(){if(this.onclick)this.onclick();},closest(){return this;},matches(selector){return selector==='[data-pool]'&&!!this.dataset.pool;}};
      Object.defineProperty(e,'innerHTML',{get:()=>html,set:s=>{html=s;if(id==='app')dataInputs.length=0;const re=/<(input|select|textarea|button)\b([^>]*)>([^<]*)/g;let m;while((m=re.exec(s))){const at=m[2],idMatch=at.match(/\bid="([^"]*)"/),el=idMatch?element(idMatch[1]):{dataset:{}};el.disabled=/\bdisabled\b/.test(at);el.value=decode((at.match(/\bvalue="([^"]*)"/)||[])[1]||m[3]||'');if(m[1]==='select'){const rest=s.slice(m.index);const selected=rest.match(/<option value="([^"]*)" selected>/);if(selected)el.value=selected[1];}for(const d of at.matchAll(/data-([\w-]+)="([^"]*)"/g))el.dataset[d[1]]=d[2];if(el.dataset.pool)dataInputs.push(el);}}});nodes[id]=e;return e;
    }
    const document={getElementById:element,querySelector:()=>element('close'),querySelectorAll:()=>dataInputs,createElement:()=>({click(){}})};
    const storage={},localStorage={getItem:k=>storage[k]||null,setItem:(k,v)=>storage[k]=v};
    const window={Fog:F,scrollTo(){}};app=element('app');
    new Function('window','document','localStorage','setTimeout','clearTimeout','URL','Blob',appSource)(window,document,localStorage,()=>1,()=>{}, {createObjectURL(){return 'blob:test';},revokeObjectURL(){}},function(){});
    function click(dataset){app.listeners.click({target:{disabled:false,dataset,closest(){return this;}}});}
    ok(app.innerHTML.includes('Letters from Fogharbor'),'封面渲染');
    click({ui:'new'});ok(app.innerHTML.includes('技能配點'),'建角介面渲染');
    for(let p=0;p<3;p++)for(const job of Object.keys(F.JOBS)){click({preset:String(p)});nodes.job.value=job;app.listeners.change({target:nodes.job});ok(!nodes.embark.disabled,`介面建角可出發 ${p}/${job}`);}
    click({preset:'1'});nodes.job.value='detective';app.listeners.change({target:nodes.job});
    const input=dataInputs.find(e=>e.dataset.skill==='spot'&&e.dataset.pool==='occ');input.value='-1';input.matches=()=>true;app.listeners.input({target:input});ok(nodes.embark.disabled,'不合法點數會停用出發按鈕');click({ui:'auto'});
    click({ui:'embark'});ok(app.innerHTML.includes('海燕旅館')&&app.innerHTML.includes('搜查妹妹的房間'),'建角到遊戲事件');
    click({act:'room'});ok(app.innerHTML.includes('診所收據'),'行動後線索顯示');
    click({ui:'sheet'});ok(nodes['modal-body'].innerHTML.includes('角色卡'),'角色卡視窗');nodes.modal.close();
    click({ui:'npcs'});ok(nodes['modal-body'].innerHTML.includes('林秋蓉'),'人物視窗');nodes.modal.close();
    click({travel:'pump'});click({act:'plans'});click({travel:'tower'});click({act:'shutter'});click({act:'force'});
    ok(app.innerHTML.includes('已關閉')&&app.innerHTML.includes('救出'),'地圖、遮光及保證救援介面');
    click({act:'leave'});ok(nodes.modal.open&&nodes['confirm-leave'].onclick,'撤離確認視窗');nodes['confirm-leave'].click();
    ok(app.innerHTML.includes('CASE CLOSED'),'結局渲染');
    if(recapSource)ok(app.innerHTML.includes('故事完整脈絡・結局解密')&&app.innerHTML.includes('許承岳'),'原作結局自動提供完整真相');
    click({ui:'save'});click({ui:'home'});click({ui:'continue'});ok(app.innerHTML.includes('CASE CLOSED'),'儲存後從封面讀回結局');
    click({ui:'rolls'});ok(nodes['modal-body'].innerHTML.includes('骰子紀錄'),'骰子紀錄視窗');
    nodes.help.onclick();ok(nodes['modal-body'].innerHTML.includes('本作的適用範圍'),'遊玩指南視窗');
    click({ui:'replay'});ok(app.innerHTML.includes('技能配點'),'重新建角');
    return results;
  };
  if(typeof module!=='undefined'&&module.exports)module.exports=root.runFogUISmoke;
})(typeof globalThis!=='undefined'?globalThis:this);
