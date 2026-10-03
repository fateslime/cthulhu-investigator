/* Optional investigation systems; no remote model is required. */
(function(root){'use strict';
const C=Chronicles,D=ChroniclesData,F=Fog;
const puzzles=[
{id:'seats',act:0,scene:'seats',title:'四朵紙花的鑰匙盒',prompt:'依寄存票的花名順序，輸入四位數字。站在舞臺看向觀眾。',answer:'3142',hints:['先讀寄存票，順序是山茶、鳶尾、鈴蘭、薔薇。','依序對照椅背數字：山茶3，鳶尾1，鈴蘭4，薔薇2。','完整答案是3142。'],explain:'票根決定讀取順序，座位圖提供每朵花的數字。盒內的維修鑰匙與定位紙條指出吊景樓凹室。',labels:['鈴蘭 4','山茶 3','薔薇 2','鳶尾 1'],caption:'舞臺視角，由左到右：鈴蘭4、山茶3、薔薇2、鳶尾1。票根順序：山茶、鳶尾、鈴蘭、薔薇。'},
{id:'pipes',act:1,scene:'projection',title:'把原始聲卷接到耳機',prompt:'從圓形入口接到出口，輸入三段聲管代號，例如ABC。',answer:'CAB',hints:['每段的右端要接到下一段相同的左端。入口是圓。','C從圓到方；A從方到三角。','最後接B到出口，完整答案CAB。'],explain:'C把圓形入口接到方形，A再接三角，B接到出口。你在隔離的副本上聽見鎖門命令和求救，沒有把聲卷接回舞臺。',labels:['A 方 → 三角','B 三角 → 出口','C 圓 → 方'],caption:'三段可接聲管：A方形到三角形；B三角形到出口；C圓形到方形。起點為圓形。'},
{id:'switches',act:2,scene:'console',title:'安全停機模擬板',prompt:'依安全順序輸入三個標記：出口、面具、鼓（可用空格或逗號分隔）。',answer:'出口面具鼓',hints:['先替殘留聲音提供出口，不能先熄燈。','接著隔離戴在活人身上的接頭，最後才停止來源。','完整順序：出口、面具、鼓。'],explain:'散音出口避免回灌，面具隔離避免傷到活人，停止主鼓結束循環。模擬成功只是準備，終局仍需真的執行三步。',labels:['鼓：停止來源','出口：釋放壓力','面具：隔離身體'],caption:'操作依賴：出口必須早於面具；面具必須早於鼓。紅色總電源只管照明，不在答案中。'}
];
const encounters=[
{id:'praise',scene:'rehearsal',title:'給陸衡一句鼓勵：「你演得真好」',hint:'他握緊道具棍，頸後接頭發亮；這句讚詞可能有另一種用途。',enemy:'actor',text:'你原本想鼓勵陸衡。他卻像被扯動肩膀，舉棍擋住門口。「叫我的名字！」他喊。讚詞被面具當成護衛口令，不是他忽然變得邪惡。'},
{id:'fork',scene:'props',title:'伸手替技師取回木偶掌中的音叉',hint:'木偶跟著聲音轉頭。直接取物比繞到架後更快，也更冒險。',enemy:'puppet',text:'音叉碰到你的扣子，短音接連響起。木偶跨出木箱，將你識別成要攔下的移動聲源。'},
{id:'envelope',scene:'office',title:'拿起薪資信封，核對小安的簽名',hint:'守衛一直盯著桌面。經理可能把查證說成偷竊。',enemy:'guard',text:'何敬堂喊「有人偷錢」。守衛伸手攔你，明知你只是在查證也不敢立即反駁。你可以把工傷與外鎖證據拿給他看。'},
{id:'cloth',scene:'drain',title:'直接拉掉包住散音筒的布，幫忙通風',hint:'布面隨聲音鼓起。固定支架後再處理會比較安全。',enemy:'puppet',text:'散音筒突然鳴響，懸在支架上的木偶落到高臺，順著聲音逼近。善意不能替代操作順序。'},
{id:'applause',scene:'stage',title:'拍手回應空座位，試著安撫觀眾',hint:'空椅子的節奏完全重複，與先前的護衛指令相似。',enemy:'puppet',text:'你的掌聲接上固定循環。布幕後的木骨架伸出手，要求每一個發聲者留在自己的位置。你面對的是指令，不是需要鼓勵的觀眾。'}
];
function extra(s){return s.extras||(s.extras={puzzles:{},events:[],dialogues:[]});}
function puzzleState(s,id){return extra(s).puzzles[id]||(extra(s).puzzles[id]={attempts:0,hints:0,solved:false});}
function accessible(s,p){return s.story==='theatre'&&!C.blocked(s)&&p.act<=s.chapter&&s.clues.includes(p.scene);}
function solve(s,id,answer,assist=false){const p=puzzles.find(p=>p.id===id);if(!p||!accessible(s,p))return {ok:false,message:'先取得對應地點的證物，並處理眼前危機。'};const q=puzzleState(s,id);if(q.solved)return {ok:false,message:'這個機關已經解開。'};const clean=String(answer).normalize('NFKC').toUpperCase().replace(/[\s,，、。→>－-]/g,'');q.attempts++;C.tick(s,assist?45:10);if(assist||clean===p.answer){q.solved=true;C.effect(s,{insight:assist?0:1});C.add(s,p.title+'：'+p.explain,'deduction');return {ok:true,message:assist?'與同伴逐項完成，沒有額外洞見。':'機關解開，獲得1洞見。'};}C.add(s,p.title+'：排列不吻合。機關保持原狀，可以查看提示再試。','warning');return {ok:false,message:'順序不對，證物和機關都還在；可開提示或請同伴協助。'};}
function hint(s,id){const p=puzzles.find(p=>p.id===id);if(!p||!accessible(s,p))return '';const q=puzzleState(s,id);q.hints=Math.min(3,q.hints+1);return p.hints[q.hints-1];}
function encounter(s,id,rng=F.randomInt){const e=encounters.find(e=>e.id===id&&e.scene===s.scene);if(s.story!=='theatre'||C.blocked(s)||!e||extra(s).events.includes(id))return false;extra(s).events.push(id);C.tick(s,5);C.add(s,e.text,'danger');return C.startCombat(s,rng,e.enemy);}
const oldOptions=C.options;C.options=s=>{const out=oldOptions(s);if(s.story==='theatre'&&!C.blocked(s))for(const e of encounters.filter(e=>e.scene===s.scene&&!extra(s).events.includes(e.id)))out.push({id:'event_'+e.id,title:e.title,hint:e.hint});return out;};
const oldAct=C.act;C.act=(s,id,rng=F.randomInt)=>id.startsWith('event_')?encounter(s,id.slice(6),rng):oldAct(s,id,rng);
const oldProgress=C.chapterProgress;C.chapterProgress=s=>{const p=oldProgress(s);p.puzzleReady=s.story!=='theatre'||!!extra(s).puzzles[puzzles[s.chapter].id]?.solved;p.ready=p.resolved>=3&&p.deduced&&p.puzzleReady;return p;};
const oldAdvance=C.advance;C.advance=s=>C.chapterProgress(s).ready&&oldAdvance(s);
const oldNew=C.newGame;C.newGame=(id,b,prior=[],rng=F.randomInt)=>oldNew(id,b,id==='theatre'?[]:prior,rng);
const oldCombat=C.combat;C.combat=(s,id,rng=F.randomInt)=>{
 if(!['calm','name','evidence','cut'].includes(id))return oldCombat(s,id,rng);
 if(s.story!=='theatre'||!s.combat||s.combat.phase!=='player'||s.ending)return false;
 const e=C.enemy(s),key=s.combat.enemy;
 if(id==='name'&&(key!=='actor'||!s.clues.some(k=>['posters','rehearsal'].includes(k))))return false;
 if(id==='evidence'&&(key!=='guard'||!s.clues.includes('rigging')))return false;
 if(id==='calm'&&!e.human||id==='cut'&&e.human)return false;
 const success=id==='name'||id==='evidence'||C.check(s,id==='cut'?'mechanical':s.player.skills.persuade>=s.player.skills.intimidate?'persuade':'intimidate',id==='cut'?'卸下控制拉線':'讓對方停止攻擊',1,rng).success;
 C.tick(s,1);if(success){s.combat=null;C.add(s,id==='name'?'你叫出陸衡的本名。他鬆開手，請你帶他遠離接頭。':id==='evidence'?'守衛看到外鎖證詞，決定不再替經理掩護。':'你阻止了眼前的衝突，可以繼續調查。','combat');}else{s.combat.incoming=F.check(s,e.attack,e.name+'繼續攻擊',1,0,rng).grade;s.combat.phase='defense';C.add(s,'對方沒有停手，現在需要防守。','combat');}return true;
};
function classify(text){const t=text.trim();if(/^(你|您)?演得真好[！!。]*$/.test(t))return 'praise';if(/^(對不起|抱歉|請原諒)[！!。]*$/.test(t))return 'apology';if(/^(來打架|我要打你)[！!。]*$/.test(t))return 'challenge';return 'ask';}
function talk(s,text,intent='auto',rng=F.randomInt){if(s.story!=='theatre'||C.blocked(s))return {ok:false,message:'先處理眼前危機，再交談。'};text=String(text).trim();if(!text||text.length>500)return {ok:false,message:'請輸入1至500字。'};const sc=C.location(s),npc=C.story(s).npcs.find(n=>n.id===sc.npc);if(intent==='auto')intent=classify(text);if(!['ask','praise','apology','challenge'].includes(intent))return {ok:false,message:'未知的交談方式。'};
 let answer,trigger=null;
 if(intent==='praise'&&sc.npc==='lu'){if(sc.id==='rehearsal'&&!extra(s).events.includes('praise'))trigger='praise';answer='「別用那句臺詞。叫我陸衡！」他的手開始繃緊。那不是討厭你的好意，而是接頭把固定讚詞當成命令。';}
 else if(intent==='challenge'){answer='你把試探變成挑釁，對方退開一步。這會引來守衛，不會憑空替你解開謎題。';const flag='challenge_'+sc.id;if(!s.flags[flag]){s.flags[flag]=true;trigger='guard';}}
 else if(intent==='apology'){answer=npc.name+'放緩語氣：「先聽清楚，再決定要怎麼幫忙。」這次道歉不會抹去已發生的事，也不會重複獎勵資源。';}
 else if(intent==='praise'){answer=npc.name+'點頭，卻請你把注意力放回眼前的工作：「有用的幫忙，是先核對我們說的話。」';}
 else {const match=/小安|失蹤|工作|離職|鎖/.test(text)?0:/面具|聲音|掌聲|口令|為什麼|為何/.test(text)?1:null;answer=match===null?'你問起「'+text+'」。'+npc.name+'沒有足夠資料回答這個具體問題。可改問「'+sc.questions[0][0]+'」或「'+sc.questions[1][0]+'」；已取得證物在右側筆記中。':sc.questions[match][1];}
 const record={npc:sc.npc,scene:sc.id,intent,text,answer,mode:'offline'};extra(s).dialogues.push(record);if(extra(s).dialogues.length>40)extra(s).dialogues.shift();C.add(s,'你：'+text+'\n'+npc.name+'：'+answer,'dialogue');C.tick(s,5);
 if(trigger==='guard')C.startCombat(s,rng,'guard');else if(trigger)encounter(s,trigger,rng);
 return {ok:true,answer,npc:npc.name,record};
}
function context(s){const sc=C.location(s),n=C.story(s).npcs.find(n=>n.id===sc.npc);return {npc:{name:n.name,role:n.role},scene:sc.name,facts:[sc.opening,...C.memory(s,sc.id).questions.map(i=>sc.questions[i][1]),...s.clues.map(k=>{const x=C.story(s).scenes.find(x=>x.id===k);return x.evidence+'：'+x.document;})],history:(s.extras?.dialogues||[]).filter(x=>x.npc===sc.npc).slice(-6).map(x=>({text:x.text,answer:x.answer}))};}
const oldValidate=C.validate;C.validate=s=>{oldValidate(s);if(s.extras!==undefined){const x=s.extras,bad=()=>{throw Error('額外調查紀錄格式錯誤。');};if(s.story!=='theatre'||!x||typeof x!=='object'||!x.puzzles||Array.isArray(x.puzzles)||Object.entries(x.puzzles).some(([id,p])=>!puzzles.some(x=>x.id===id)||!p||!Number.isInteger(p.attempts)||p.attempts<0||p.attempts>10000||!Number.isInteger(p.hints)||p.hints<0||p.hints>3||typeof p.solved!=='boolean'))bad();if(!Array.isArray(x.events)||new Set(x.events).size!==x.events.length||x.events.some(id=>!encounters.some(e=>e.id===id)))bad();if(!Array.isArray(x.dialogues)||x.dialogues.length>40||x.dialogues.some(r=>!r||!C.story(s).npcs.some(n=>n.id===r.npc)||!C.story(s).scenes.some(sc=>sc.id===r.scene)||!['ask','praise','apology','challenge'].includes(r.intent)||typeof r.text!=='string'||r.text.length>500||typeof r.answer!=='string'||r.answer.length>3000||r.mode!=='offline'))bad();}return s;};
root.Theatre={puzzles,encounters,extra,puzzleState,solve,hint,talk,context,classify};
})(globalThis);
