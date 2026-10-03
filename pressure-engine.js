(function(root){
 'use strict';
 const F=root.Fog,C=root.Chronicles,events=root.PressureData.events;
 const themes={fog:['霧正在封港','末班補給船離港','碼頭封鎖','午夜儀式成形'],asylum:['訪客查核開始','聯絡醫師離開診間','病棟封鎖','院方開始轉移證人'],train:['列車逼近換軌點','站務交接結束','車廂被逐節封閉','證物車廂準備脫離'],tide:['潮水正在回升','引水員離開低地','低窪通道淹沒','撤離船開始解纜'],theatre:['開演時間逼近','舞臺技師停止接待','後臺封場','謝幕儀式開始']};
 const story=s=>s.story||'fog',phase=s=>s.finale?'finale':String(s.chapter||0);
 function log(s,text,type='event'){if(s.story)C.add(s,text,type);else{ s.log.push({type:['warning','choice'].includes(type)?'event':type,text});if(s.log.length>160)s.log.shift();}}
 function next(p,n){p.seed=(Math.imul(p.seed,1664525)+1013904223)>>>0;return p.seed%n;}
 function init(s){const seed=(Date.now()^Math.floor(Math.random()*0xffffffff))>>>0;return s.pressure={version:1,seed,phase:phase(s),spent:0,budget:s.story?(s.finale?150:540):Math.max(60,1440-s.time),stage:0,supplies:5,breaches:0,opportunity:'open',nextEvent:70,seen:[],pending:null,history:[]};}
 function ensure(s){return s.pressure||init(s);}
 function change(s,key,n){const p=ensure(s);if(key==='supplies')p.supplies=Math.max(0,Math.min(12,p.supplies+n));else if(s.story)s[key]=Math.max(key==='trust'?-12:0,Math.min(key==='exposure'?10:40,s[key]+n));else if(n>0&&key!=='exposure')p.supplies=Math.min(12,p.supplies+1);else if(key==='exposure')s.flags.alert=true;}
 function available(s){return !s.ending&&!s.combat&&!s.pending&&!s.flags.dying;}
 function penalty(s){return s.pressure?.supplies===0?-1:0;}
 function blocked(s){return !!s.pressure?.pending&&available(s);}
 function describe(s){const p=ensure(s),t=themes[story(s)],limit=p.budget+180;return {title:s.finale?'終局操作窗口':t[0],remaining:Math.max(0,p.budget-p.spent),escape:Math.max(0,limit-p.spent),stage:['尚有餘裕','情勢緊繃','封鎖升級','最後撤離'][p.stage],next:p.stage===0?Math.ceil(p.budget/2)-p.spent:p.stage===1?Math.ceil(p.budget*.75)-p.spent:p.stage===2?p.budget-p.spent:limit-p.spent,effect:p.stage===0?t[1]+'：限時協助失效、警戒＋1':p.stage===1?t[2]+'：補給－1':p.stage===2?t[3]+'：警戒＋2、支援－1':'強制撤離，以未竟結局收束',opportunity:t[1]};}
 function thresholds(s){const p=ensure(s);const stage=p.spent>=p.budget?3:p.spent>=Math.ceil(p.budget*.75)?2:p.spent>=Math.ceil(p.budget/2)?1:0;while(p.stage<stage){p.stage++;if(p.stage===1){if(p.opportunity==='open')p.opportunity='missed';change(s,'exposure',1);log(s,themes[story(s)][1]+'。限時協助窗口已關閉；'+(s.story?'警戒增加1。':'對方提高戒心。'),'warning');}if(p.stage===2){change(s,'supplies',-1);log(s,themes[story(s)][2]+'。繞道與備用照明消耗1補給；核心證物仍可調查。','warning');}if(p.stage===3){p.breaches++;change(s,'exposure',2);change(s,'support',-1);log(s,themes[story(s)][3]+'。'+(s.story?'警戒增加2、支援減少1。':'港區警戒升級。')+'剩下180分鐘撤離緩衝；用盡將強制結束調查。','danger');}}
  if(p.spent>=p.budget+180&&!s.ending){p.pending=null;s.pending=null;s.combat=null;if(s.story)C.evacuate(s);else F.finish(s,s.flags.lightOff?'success':'escape');log(s,'撤離期限已到。封鎖使這次調查無法繼續；已取得的證據與完整故事解密保留。','danger');}
 }
 function offer(s){const p=ensure(s);if(!available(s)||s.finale||p.pending||p.spent<p.nextEvent)return;const pool=events.filter(e=>(e.story===story(s)||e.story==='common')&&!p.seen.includes(e.id));if(!pool.length)return;const e=pool[next(p,pool.length)];p.pending=e.id;p.seen.push(e.id);p.nextEvent=p.spent+65+next(p,46);log(s,'突發事件：'+e.title+'\n'+e.text+'\n請從行動面板選擇處理方式。');}
 function advance(s,minutes){const p=ensure(s);p.spent+=Math.max(0,minutes);if(!s.ending)thresholds(s);if(!s.ending)offer(s);if(s.ending)p.pending=null;}
 function spend(s,n){if(s.story)C.tick(s,n);else F.passTime(s,n);advance(s,n);}
 function record(s,text){const p=ensure(s);p.history.push(text);if(p.history.length>80)p.history.shift();log(s,text,'choice');}
 function resolve(s,id){const p=ensure(s);if(!available(s))return false;
  if(id==='opportunity'){if(p.pending||p.opportunity!=='open'||s.finale||p.spent+20>Math.ceil(p.budget/2))return false;p.opportunity='taken';change(s,'support',2);change(s,'supplies',1);record(s,'趕上限時聯絡：'+(s.story?'支援＋2、':'')+'補給＋1，花費20分鐘。');spend(s,20);return true;}
  if(id==='resupply'){if(p.pending||p.supplies>=5||s.finale)return false;change(s,'supplies',2);record(s,'沿安全路線整備物資：補給＋2，花費40分鐘。');spend(s,40);return true;}
  const ev=events.find(e=>e.id===p.pending);if(!ev||!['risk','careful','leave'].includes(id)||id==='careful'&&p.supplies<1)return false;p.pending=null;let cost=id==='risk'?10:id==='careful'?25:5,outcome;
  if(id==='leave'){if(ev.kind==='trust')change(s,'trust',-1);else change(s,'exposure',1);outcome=s.story?(ev.kind==='trust'?'信任－1':'警戒＋1'):'港區提高戒心';}
  else{let success=true;if(id==='careful')change(s,'supplies',-1);else{const r=F.check(s,s.player.skills[ev.skill],ev.title+'／'+F.SKILLS[ev.skill][0],1,penalty(s),max=>1+next(p,max));success=r.success;}
   if(success){const kind=ev.kind==='combat'?'support':ev.kind==='time'?'supplies':ev.kind;if(kind==='exposure'){if(s.story)change(s,'exposure',-1);else change(s,'supplies',1);}else change(s,kind,kind==='supplies'?2:1);outcome=ev.kind==='combat'?'成功化解衝突，獲得協助':ev.kind==='exposure'?'甩開監視，降低警戒':'取得'+({support:'支援',trust:'信任',insight:'洞見',supplies:'補給',time:'備用物資'}[ev.kind]||'協助');if(!s.story)outcome+='（霧港以補給呈現）';}
   else{change(s,'exposure',1);change(s,'supplies',-1);outcome='未能妥善處理，補給－1、'+(s.story?'警戒＋1':'戒心升高');if(ev.kind==='combat'){if(s.story)C.startCombat(s, max=>1+next(p,max),s.story==='theatre'?'guard':undefined);else F.startCombat(s,max=>1+next(p,max));outcome+='；對方動手了，進入戰鬥。';}}
  }
  record(s,ev.title+'：'+({risk:'冒險應對',careful:'消耗物資穩妥處理',leave:'立即離開'}[id])+'。'+outcome+'。耗時'+cost+'分鐘。');spend(s,cost);return true;
 }
 function wrap(obj,name){if(!obj||!obj[name])return;const original=obj[name];obj[name]=function(s,...args){ensure(s);if(blocked(s))return name==='deduce'||name==='solve'||name==='talk'?{ok:false,message:'請先處理行動面板中的突發事件。'}:false;const before=s.time,oldPhase=phase(s);const result=original.call(this,s,...args);const p=ensure(s);if(oldPhase!==phase(s)){p.phase=phase(s);p.spent=0;p.stage=0;p.budget=s.finale?150:Math.max(420,540-p.breaches*30);p.opportunity=s.finale?'missed':'open';p.nextEvent=70;p.pending=null;log(s,s.finale?'終局操作窗口：150分鐘，之後會升級危機。':'新章調查窗口：'+p.budget+'分鐘。前章超時每次使後續窗口縮短30分鐘，最多縮短120分鐘。');}else advance(s,s.time-before);return result;};}
 function validate(s){const p=s.pressure;if(p===undefined){init(s);log(s,'舊存檔已接入危機系統：從目前進度重新計算本章行動窗口，不追扣先前的行動。');return s;}const n=(v,a,b)=>Number.isInteger(v)&&v>=a&&v<=b;const bad=()=>{throw Error('危機與隨機事件存檔格式不正確。');};if(!p||p.version!==1||!n(p.seed,0,0xffffffff)||p.phase!==phase(s)||!n(p.spent,0,999999)||!n(p.budget,60,720)||!n(p.stage,0,3)||!n(p.supplies,0,12)||!n(p.breaches,0,4)||!['open','taken','missed'].includes(p.opportunity)||!n(p.nextEvent,0,1000100)||!Array.isArray(p.seen)||p.seen.length>events.length||new Set(p.seen).size!==p.seen.length||p.seen.some(id=>!events.some(e=>e.id===id&&(e.story===story(s)||e.story==='common')))||p.pending!==null&&!p.seen.includes(p.pending)||!Array.isArray(p.history)||p.history.length>80||p.history.some(x=>typeof x!=='string'||x.length>2000))bad();return s;}
 root.Pressure={ensure,describe,penalty,blocked,resolve,validate,events,themes};
 for(const obj of [F,C].filter(Boolean)){const create=obj.newGame;obj.newGame=function(...args){const s=create.apply(this,args);init(s);return s;};const key=obj===F?'validateSave':'validate',original=obj[key];obj[key]=function(s){original(s);return validate(s);};}
 ['act','travel','combatAct'].forEach(k=>wrap(F,k));['act','travel','deduce','advance','rest','combat','dying','finaleAction','chooseRoute'].forEach(k=>wrap(C,k));['solve','talk','hint'].forEach(k=>wrap(root.Theatre,k));
})(globalThis);
