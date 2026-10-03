/* Simulated DOM integration tests; does not validate real browser layout. */
(function(root){
root.runPortalSmoke=async function(coreSource,portalSource,legacySource){
 const {C,D,F,H}=new Function(coreSource+'\nreturn {C:Chronicles,D:ChroniclesData,F:Fog,H:HubStore};')();
 const results=[],nodes={},inputs=[],storage={},listeners={};let storageFailure=false;
 const assert=(condition,name)=>{results.push({name,pass:!!condition});if(!condition)throw Error(name);};
 const decode=s=>s.replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&');
 function element(id){if(nodes[id])return nodes[id];let html='';const el={id,value:'',textContent:'',disabled:false,open:false,dataset:{},listeners:{},contentWindow:{},classList:{add(){},remove(){}},showModal(){this.open=true;},close(){this.open=false;},scrollIntoView(){},addEventListener(k,fn){this.listeners[k]=fn;},click(){this.onclick?.();},matches(sel){return sel==='[data-pool]'&&!!this.dataset.pool;},closest(){return this;}};
  Object.defineProperty(el,'innerHTML',{get:()=>html,set:s=>{html=s;if(id==='hub-app')inputs.length=0;let m;const re=/<(input|select|textarea|button|iframe|div)\b([^>]*)>([^<]*)/g;while((m=re.exec(s))){const attrs=m[2],match=attrs.match(/\bid="([^"]*)"/),child=match?element(match[1]):{dataset:{}};child.disabled=/\bdisabled\b/.test(attrs);child.value=decode((attrs.match(/\bvalue="([^"]*)"/)||[])[1]||m[3]||'');if(m[1]==='select'){const select=s.slice(m.index,s.indexOf('</select>',m.index)),selected=select.match(/<option value="([^"]*)" selected>/);if(selected)child.value=selected[1];}for(const a of attrs.matchAll(/data-([\w-]+)="([^"]*)"/g))child.dataset[a[1]]=a[2];if(child.dataset.pool)inputs.push(child);}}});return nodes[id]=el;
 }
 const document={visibilityState:'visible',getElementById:element,querySelectorAll:()=>inputs,addEventListener:(k,fn)=>listeners[k]=fn,createElement:()=>({click(){}})};
 const localStorage={getItem:k=>storage[k]||null,setItem:(k,v)=>{if(storageFailure)throw Error('storage unavailable');storage[k]=v;}};
 const window={scrollTo(){},listeners:{},addEventListener(k,fn){this.listeners[k]=fn;}};
 new Function('window',legacySource)(window);
 new Function('window','document','localStorage','setTimeout','clearTimeout','setInterval','URL','Blob',portalSource)(window,document,localStorage,()=>1,()=>{},()=>1,{createObjectURL(){return 'blob:test';},revokeObjectURL(){}},function(){});
 const click=dataset=>listeners.click({target:{dataset,disabled:false,closest(){return this;}}});
 const app=element('hub-app'),key='cthulhu-archives-v2',saved=()=>JSON.parse(storage[key]);
 assert(app.innerHTML.includes('本機登入'),'外層本機登入渲染');
 element('profile-name').value='';click({ui:'create-profile'});assert(app.innerHTML.includes('本機登入'),'空名稱不會建立檔案');
 element('profile-name').value='調查員甲';click({ui:'create-profile'});assert(app.innerHTML.includes('選擇下一份調查檔案'),'建立檔案後進入劇本庫');
 for(const name of ['霧港來信','白榆療養院','無名列車','第九次退潮'])assert(app.innerHTML.includes(name),'劇本庫顯示 '+name);
 const firstId=saved().active;
 click({story:'asylum'});assert(app.innerHTML.includes('配點'),'長篇建角渲染');
 for(let p=0;p<3;p++)for(const job of Object.keys(F.JOBS)){click({preset:String(p)});element('c-job').value=job;listeners.change({target:element('c-job')});assert(!element('c-start').disabled,`入口建角有效 ${p}/${job}`);}
 click({preset:'1'});element('c-job').value='detective';listeners.change({target:element('c-job')});
 const input=inputs.find(x=>x.dataset.pool==='occ'&&x.dataset.skill==='spot');input.value='-1';input.matches=()=>true;listeners.input({target:input});assert(element('c-start').disabled,'非法配點停用出發');click({ui:'auto-build'});
 click({ui:'embark'});assert(element('hub-modal').open&&element('hub-modal-body').innerHTML.includes('序幕'),'長篇開場敘事視窗');element('hub-modal').close();
 assert(app.innerHTML.includes('接待樓'),'長篇場景渲染');
 for(const ui of ['sheet','npcs','journal','notes','rolls','help']){click({ui});assert(element('hub-modal').open,ui+' 功能視窗');element('hub-modal').close();}
 click({ui:'notes'});element('private-notes').oninput({target:{value:'不要相信只出現一次的聲音。'}});element('hub-modal').close();
 const profileBefore=saved().profiles.find(p=>p.id===firstId);assert(profileBefore.saves.asylum.notes.includes('聲音'),'私人筆記自動保存');
 for(const id of ['asylum','train','tide']){
  if(id!=='asylum'){click({ui:'library'});click({story:id});click({ui:'embark'});element('hub-modal').close();}
  for(let chapter=0;chapter<3;chapter++){
   for(const sc of D.stories[id].scenes.filter(x=>x.act===chapter)){
    click({travel:sc.id});click({action:'examine'});click({action:'question_0'});click({action:'question_1'});click({action:'careful'});click({action:'resolve_0'});
    const current=saved().profiles.find(p=>p.id===firstId).saves[id];const option=C.options(current).find(o=>o.id.startsWith('follow_'));if(option)click({action:option.id});
   }
   click({ui:'board'});const q=D.stories[id].deductions[chapter];element('answer-'+q.id).value=String(q.answer);element('evidence-'+q.id).value=q.evidence[0];click({deduce:q.id});element('hub-modal').close();
   click({ui:'advance'});element('modal-confirm').click();
  }
  assert(app.innerHTML.includes('FINALE'),id+' 完整介面流程進入終局');click({route:'public'});element('modal-confirm').click();for(let i=0;i<3;i++){click({finale:'brief'});click({finale:'insight'});}
  assert(app.innerHTML.includes('CASE CLOSED'),id+' 結局渲染');const s=saved().profiles.find(p=>p.id===firstId).saves[id];assert(s.ending?.type==='success',id+' 介面通關成功');C.validate(s);
 }
 click({ui:'library'});assert(app.innerHTML.includes('已完成'),'劇本庫顯示各別完成狀態');
 click({story:'fog'});assert(app.innerHTML.includes('legacy-game'),'原作嵌入畫面');const frame=element('legacy-game');assert(frame.srcdoc.includes('Storage.prototype.setItem')&&frame.srcdoc.includes('cthulhu-legacy-'+firstId),'原作存檔橋接獨立命名');
 const original=F.newGame({preset:1,job:'detective',name:'舊調查員',background:'test',...F.allocate(1,'detective')},()=>2);
 window.listeners.message({source:{},data:{type:'fog-save',profile:firstId,value:JSON.stringify(original)}});assert(!saved().profiles[0].saves.fog,'拒絕非遊戲iframe的存檔訊息');
 window.listeners.message({source:frame.contentWindow,data:{type:'fog-save',profile:firstId,value:JSON.stringify(original)}});assert(saved().profiles[0].saves.fog.player.name==='舊調查員','原作存檔同步到外層');
 click({ui:'library'});click({ui:'logout'});element('profile-name').value='調查員乙';click({ui:'create-profile'});const secondId=saved().active;assert(!Object.keys(saved().profiles.find(p=>p.id===secondId).saves).length,'新調查員沒有繼承另一人的存檔');
 click({ui:'logout'});click({profile:firstId});assert(app.innerHTML.includes('已完成'),'切回原調查員保留所有結局');
 click({story:'asylum'});assert(app.innerHTML.includes('CASE CLOSED'),'讀取已完成長篇');
 const backup={format:'cthulhu-profile',version:2,profile:{id:'imported',name:'匯入測試',saves:{train:C.newGame('train',{preset:1,job:'detective',name:'匯入角色',background:'test',...F.allocate(1,'detective')},[],()=>2)}}};
 await element('hub-import').listeners.change({target:{files:[{size:10000,text:async()=>JSON.stringify(backup)}],value:'file'}});element('modal-confirm').click();
 const imported=saved().profiles.find(p=>p.id===saved().active);assert(imported.name==='匯入測試'&&Object.keys(imported.saves).join()==='train','遊玩中匯入不會把舊角色複寫進新檔');
 assert(saved().profiles.find(p=>p.id===firstId).saves.asylum.ending,'匯入不破壞原進度');
 const before=JSON.stringify(saved());await element('hub-import').listeners.change({target:{files:[{size:5,text:async()=>'{bad'}],value:'file'}});assert(JSON.stringify(saved())===before,'無效JSON不改動現有進度');

 // New chapter UI, without modifying earlier profile progress.
 click({ui:'library'});click({story:'theatre'});
 for(const k of F.ATTR)element('custom-'+k).value=String({STR:55,CON:55,SIZ:55,DEX:55,APP:60,INT:60,POW:60,EDU:60}[k]);
 click({ui:'apply-attrs'});assert(!element('c-start').disabled,'自訂八能力套用後可建角');
 element('c-job').value='technician';listeners.change({target:element('c-job')});
 click({ui:'embark'});element('hub-modal').close();assert(app.innerHTML.includes('售票廳'),'第五劇本從入口正常開始');
 assert(!app.innerHTML.includes('故事完整脈絡・結局解密'),'進行中不洩露結局解密');
 click({ui:'dialogue'});element('dialogue-text').value='小安最後在哪裡？';element('dialogue-intent').value='ask';await element('dialogue-send').onclick();
 assert(element('hub-modal-body').innerHTML.includes('最後要修')||element('hub-modal-body').innerHTML.includes('聲音管'),'離線自由輸入提供人物回應');element('hub-modal').close();
 for(let chapter=0;chapter<3;chapter++){
  for(const sc of D.stories.theatre.scenes.filter(x=>x.act===chapter)){
   click({travel:sc.id});click({action:'examine'});click({action:'question_0'});click({action:'careful'});click({action:'resolve_0'});
   if(sc.id==='rehearsal'){click({action:'event_praise'});assert(app.innerHTML.includes('受口令控制的陸衡'),'讚美事件在畫面中開戰');click({combat:'name'});assert(!saved().profiles.find(p=>p.id===saved().active).saves.theatre.combat,'本名解圍可繼續調查');}
  }
  click({ui:'puzzles'});const puzzle=Theatre.puzzles[chapter];assert(element('hub-modal-body').innerHTML.includes('<svg'),'實物謎題含圖片與文字');
  element('puzzle-'+puzzle.id).value='wrong';click({puzzle:puzzle.id});assert(element('hub-modal-body').innerHTML.includes('1 次嘗試'),'錯誤答案留在謎題介面');
  click({hint:puzzle.id});assert(element('hub-modal-body').innerHTML.includes(puzzle.hints[0]),'提示實際顯示');
  element('puzzle-'+puzzle.id).value=puzzle.answer;click({puzzle:puzzle.id});assert(element('hub-modal-body').innerHTML.includes('✓ 已解開'),'正確答案解鎖');element('hub-modal').close();
  click({ui:'board'});const q=D.stories.theatre.deductions[chapter];element('answer-'+q.id).value=String(q.answer);element('evidence-'+q.id).value=q.evidence[0];click({deduce:q.id});element('hub-modal').close();
  click({ui:'advance'});element('modal-confirm').click();
 }
 click({route:'public'});element('modal-confirm').click();for(let i=0;i<3;i++){click({finale:'brief'});click({finale:'insight'});}
 assert(app.innerHTML.includes('故事完整脈絡・結局解密')&&app.innerHTML.includes('七年前'),'新劇本結局自動顯示完整真相');
 C.validate(saved().profiles.find(p=>p.id===saved().active).saves.theatre);

 storageFailure=true;click({ui:'library'});assert(app.innerHTML.includes('劇本')||app.innerHTML.includes('調查檔案'),'儲存空間不可用時仍能使用介面');
 H.validate(saved());return results;
};
if(typeof module!=='undefined'&&module.exports)module.exports=root.runPortalSmoke;
})(globalThis);
