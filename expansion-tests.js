/* Regression tests for character freedom, debriefing, puzzles and optional dialogue providers. */
(function(root){'use strict';const results=[],F=Fog,C=Chronicles,D=ChroniclesData,T=Theatre;
const good=()=>2,clone=x=>JSON.parse(JSON.stringify(x)),assert=(x,m='Assertion failed')=>{if(!x)throw Error(m);},test=(name,fn)=>{try{fn();results.push({name,pass:true});}catch(e){results.push({name,pass:false,error:e.message});}},throws=fn=>{let failed=false;try{fn();}catch(e){failed=true;}assert(failed,'Expected rejection');};
const build=(preset=1,job='detective')=>({preset,job,name:'測試者',background:'尋找失蹤者。',...F.allocate(preset,job)}),fresh=(p=1,j='detective')=>C.newGame('theatre',build(p,j),[],good);
function place(s,id){const sc=D.stories.theatre.scenes.find(x=>x.id===id);s.chapter=sc.act;C.travel(s,id);return sc;}
function campaign(preset,job,route,assist=false){const s=fresh(preset,job);for(let ch=0;ch<3;ch++){for(const sc of D.stories.theatre.scenes.filter(x=>x.act===ch)){C.travel(s,sc.id);assert(C.act(s,'examine',good));assert(C.act(s,'question_0',good));assert(C.act(s,'careful',good));assert(C.act(s,'resolve_0',good));C.validate(clone(s));}const p=T.puzzles[ch];assert(T.solve(s,p.id,p.answer,assist).ok);const q=D.stories.theatre.deductions[ch];assert(C.deduce(s,q.id,q.answer,q.evidence[0]).ok);assert(C.advance(s));}assert(C.chooseRoute(s,route));for(let n=0;n<3;n++){assert(C.finaleAction(s,'brief',good));assert(C.finaleAction(s,'insight',good));}assert(s.ending?.type==='success');C.validate(clone(s));return s;}
for(let p=0;p<F.PRESETS.length;p++)for(const job of Object.keys(F.JOBS))for(const route of ['public','sealed','broken'])test('劇院完整通關 '+p+'/'+job+'/'+route,()=>campaign(p,job,route));
for(const job of Object.keys(F.JOBS))test('自訂能力完整通關 '+job,()=>campaign([55,55,55,55,60,60,60,60],job,'sealed',true));
test('六種預設、九職業、34技能',()=>{assert(F.PRESETS.length===6);assert(Object.keys(F.JOBS).length===9);assert(Object.keys(F.SKILLS).length===34);});
test('每個新增技能有可選的實際調查用途',()=>{for(const k of Object.keys(F.EXTRA_SKILLS))assert(D.stories.theatre.scenes.some(s=>s.skill===k||s.altSkills.includes(k)),k);});
test('所有新場景含兩個有效替代技能',()=>{for(const sc of D.stories.theatre.scenes){assert(sc.altSkills.length>=2);sc.altSkills.forEach(k=>assert(F.SKILLS[k]));}});
test('能力總和與範圍拒絕非法配點',()=>{for(const p of [[85,85,85,85,85,85,85,85],[0,60,60,60,60,60,80,80],[55.5,54.5,55,55,60,60,60,60]])throws(()=>F.validateBuild(build(p)));});
test('自訂能力改變實際衍生值',()=>{const s=fresh([85,70,65,40,40,50,50,60]);assert(s.player.db===4&&s.player.maxHp===13&&s.player.attrs.DEX===40);C.validate(s);});
test('三部曲舊技能存檔遷移且不加點',()=>{const s=C.newGame('asylum',build(),[],good);for(const k of Object.keys(F.EXTRA_SKILLS)){delete s.player.skills[k];delete s.build.occ[k];delete s.build.interest[k];}const migrated=C.validate(clone(s));for(const [k,v]of Object.entries(F.EXTRA_SKILLS)){assert(migrated.player.skills[k]===v[1]);assert(migrated.build.occ[k]===0);}});
test('原作舊技能存檔相容',()=>{const s=F.newGame(build(),good);Object.keys(F.EXTRA_SKILLS).forEach(k=>delete s.player.skills[k]);F.validateSave(s);assert(s.player.skills.charm===15);});
test('五故事存檔可共存',()=>{const h=HubStore.empty(),p=HubStore.create(h,'test','test');p.saves.fog=F.newGame(build(),good);for(const id of Object.keys(D.stories))p.saves[id]=C.newGame(id,build(),[],good);HubStore.validate(clone(h));assert(Object.keys(p.saves).length===5);});
test('未結束前不顯示任何結局真相',()=>{assert(StoryRecaps.render('theatre',fresh())==='');assert(StoryRecaps.render('fog',F.newGame(build(),good))==='');});
for(const id of ['fog','asylum','train','tide','theatre'])test('各故事撤離後可讀完整脈絡 '+id,()=>{const s=id==='fog'?F.newGame(build(),good):C.newGame(id,build(),[],good);if(id==='fog')F.act(s,'ferry',good);else C.evacuate(s,good);const html=StoryRecaps.render(id,s);for(const t of ['先用白話說明','事件按時間怎麼發生','每個人究竟想做什麼','線索怎麼串起來','你這一次實際完成'])assert(html.includes(t),t);});
test('解密中的玩家文字使用HTML跳脫',()=>{const s=fresh();C.evacuate(s,good);s.ending.title='<img src=x onerror=alert(1)>';assert(!StoryRecaps.render('theatre',s).includes('<img'));});
test('未取得證物不可猜碼解鎖',()=>{const s=fresh();assert(!T.solve(s,'seats','3142').ok);});
test('錯誤答案保留證物且不偽造解鎖',()=>{const s=fresh();place(s,'seats');C.act(s,'examine',good);assert(!T.solve(s,'seats','1234').ok);assert(s.clues.includes('seats')&&!T.puzzleState(s,'seats').solved);C.validate(s);});
test('三階段提示含完整答案且可協助解鎖',()=>{const s=fresh();place(s,'seats');C.act(s,'examine',good);T.hint(s,'seats');T.hint(s,'seats');assert(T.hint(s,'seats').includes('3142'));assert(T.solve(s,'seats','',true).ok);const before=s.insight;assert(!T.solve(s,'seats','3142').ok);assert(before===s.insight);});
test('解謎不能略過來源與機關要求換章',()=>{const s=fresh();for(const sc of D.stories.theatre.scenes.filter(x=>!x.act)){C.travel(s,sc.id);C.act(s,'examine',good);C.act(s,'question_0',good);C.act(s,'careful',good);C.act(s,'resolve_0',good);}C.deduce(s,'commands',1,'rehearsal');assert(!C.advance(s));T.solve(s,'seats','３１４２');assert(C.advance(s));});
test('停機答案接受空格及中文標點',()=>{const s=fresh();place(s,'console');C.act(s,'examine',good);assert(T.solve(s,'switches','出口、面具、鼓').ok);});
for(const event of T.encounters)test('特殊事件可直接進入戰鬥且不可重複 '+event.id,()=>{const s=fresh();place(s,event.scene);assert(C.act(s,'event_'+event.id,good));assert(s.combat?.enemy===event.enemy);C.validate(clone(s));if(s.combat.phase==='defense')C.combat(s,'dodge',()=>10);if(s.combat?.phase==='player')C.combat(s,'supportEscape',good);assert(!C.options(s).some(o=>o.id==='event_'+event.id));});
test('低敏捷玩家先進入防守',()=>{const s=fresh([85,70,65,40,40,50,50,60]);place(s,'rehearsal');C.act(s,'event_praise',good);assert(s.combat.phase==='defense');assert(!C.combat(s,'calm',good));});
test('叫本名需要線索並可停止受控者',()=>{const s=fresh();place(s,'rehearsal');C.act(s,'examine',good);C.act(s,'event_praise',good);assert(C.combat(s,'name',good)&&!s.combat);});
test('證據能說服守衛而非強制殺人',()=>{const s=fresh();place(s,'rigging');C.act(s,'examine',good);place(s,'office');C.act(s,'event_envelope',good);assert(C.combat(s,'evidence',good)&&!s.combat);});
test('木偶可透過切線停止',()=>{const s=fresh();place(s,'props');C.act(s,'event_fork',good);const seq=[2,1];assert(C.combat(s,'cut',()=>seq.shift()||1));assert(!s.combat);});
test('交涉失敗必須處理對方攻擊',()=>{const s=fresh();place(s,'office');C.act(s,'event_envelope',good);C.combat(s,'calm',()=>1);assert(s.combat.phase==='defense');});
test('替代技能失敗後不可換技能無限重骰',()=>{const s=fresh();C.act(s,'examine',good);assert(C.options(s).some(x=>x.id==='investigate_track'));const values=[1,8];C.act(s,'investigate_track',()=>values.shift()||2);assert(s.pending?.skill==='track');C.act(s,'abandon',good);assert(!C.options(s).some(x=>x.id.startsWith('investigate')));});
test('明確讚詞會引發事件，詢問不會被誤判',()=>{assert(T.classify('你演得真好！')==='praise');for(const t of ['為什麼不能說你演得真好？','不要說你演得真好','我沒有讚美你'])assert(T.classify(t)==='ask');const s=fresh();place(s,'rehearsal');T.talk(s,'你演得真好','auto',good);assert(s.combat?.enemy==='actor');});
test('空對話與過長對話不推進時間',()=>{const s=fresh(),time=s.time;assert(!T.talk(s,'').ok&&!T.talk(s,'字'.repeat(501)).ok);assert(s.time===time);});
test('一般提問、道歉不生成核心證物或獎勵',()=>{const s=fresh(),support=s.support;assert(T.talk(s,'小安最後在哪裡？').ok);assert(T.talk(s,'抱歉').ok);assert(!s.clues.length&&s.support===support);});
test('未知自由文字坦白無法回答',()=>{const s=fresh(),r=T.talk(s,'請說明量子草莓的價格');assert(r.answer.includes('沒有足夠資料'));});
test('明確挑釁可開戰且同地不重複刷事件',()=>{const s=fresh();T.talk(s,'來打架','auto',good);assert(s.combat.enemy==='guard');C.combat(s,'supportEscape',good);T.talk(s,'來打架','auto',good);assert(!s.combat);});
test('交談紀錄上限與存檔驗證',()=>{const s=fresh();for(let i=0;i<50;i++)T.talk(s,'你好');assert(s.extras.dialogues.length===40);C.validate(clone(s));});
test('對话上下文不含隱藏結局、答案與私人筆記',()=>{const s=fresh();s.notes='不能傳出的私人筆記';const ctx=JSON.stringify(T.context(s));assert(!ctx.includes('不能傳出')&&!ctx.includes('3142')&&!ctx.includes('公開證據'));});
test('拒絕偽造機關與未知敵人',()=>{const s=fresh();T.extra(s).puzzles.fake={attempts:0,hints:0,solved:true};throws(()=>C.validate(s));const b=fresh();place(b,'props');C.act(b,'event_fork',good);b.combat.enemy='fake';throws(()=>C.validate(b));});
test('未完成時劇院對話不可作用於其他劇本',()=>{const s=C.newGame('asylum',build(),[],good);assert(!T.talk(s,'來打架').ok);});
root.ExpansionTests=results;
if(typeof document!=='undefined'&&document.getElementById('expansion-results')){document.getElementById('expansion-results').textContent=results.map(r=>(r.pass?'PASS ':'FAIL ')+r.name+(r.error?' — '+r.error:'')).join('\n');document.getElementById('expansion-summary').textContent=results.filter(r=>r.pass).length+'/'+results.length;}
})(globalThis);
