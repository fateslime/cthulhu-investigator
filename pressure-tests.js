/* Run after the baseline suites, then pressure-data.js and pressure-engine.js. */
(function(root){'use strict';
 const F=Fog,C=Chronicles,P=Pressure,D=ChroniclesData,results=[];
 const assert=(x,m='Assertion failed')=>{if(!x)throw Error(m);},clone=x=>JSON.parse(JSON.stringify(x));
 const test=(name,fn)=>{try{fn();results.push({name,pass:true});}catch(e){results.push({name,pass:false,error:e.message});}};
 const build=()=>({preset:1,job:'detective',name:'危機測試員',background:'保留每一次選擇。',...F.allocate(1,'detective')}),good=()=>2;
 const fresh=(id='asylum',seed=1)=>{const s=C.newGame(id,build(),[],good);s.pressure.seed=seed;return s;};
 const valid=s=>C.validate(clone(s));
 function clear(s,policy='careful'){let guard=0;while(!s.ending&&(s.pressure.pending||s.pending||s.combat||s.flags.dying)){assert(++guard<30,'Crisis never resolved');if(s.flags.dying)C.dying(s,s.support>0&&!s.flags.dying_aid?'aid':'wait',good);else if(s.pending)C.act(s,'abandon',good);else if(s.combat)C.combat(s,s.combat.phase==='defense'?'dodge':s.support>0?'supportEscape':'escape',good);else P.resolve(s,policy==='careful'&&s.pressure.supplies===0?'leave':policy);valid(s);}}
 function perform(s,fn,policy){clear(s,policy);assert(!s.ending,'Premature ending');const r=fn();assert(r!==false,'Action blocked');valid(s);clear(s,policy);return r;}
 test('62 events have valid skills, IDs and story pools',()=>{assert(P.events.length===62);assert(new Set(P.events.map(x=>x.id)).size===62);for(const e of P.events){assert(F.SKILLS[e.skill],e.id+': invalid skill');assert(['support','insight','trust','exposure','supplies','time','combat'].includes(e.kind));}for(const key of Object.keys(P.themes))assert(P.events.filter(e=>e.story===key||e.story==='common').length===22);});
 test('Reading status does not advance clock or random seed',()=>{const s=fresh(),before=JSON.stringify(s);for(let n=0;n<20;n++)P.describe(s);assert(JSON.stringify(s)===before);});
 test('Only a successful action spends time; invalid action has no effect',()=>{const s=fresh();C.act(s,'not-an-action');assert(s.pressure.spent===0);C.act(s,'examine');assert(s.pressure.spent===20);C.act(s,'examine');assert(s.pressure.spent===20);});
 test('Half-window expires opportunity and increases exposure',()=>{const s=fresh();s.pressure.spent=250;s.pressure.nextEvent=9999;C.act(s,'examine');assert(s.pressure.stage===1&&s.pressure.opportunity==='missed'&&s.exposure===1);});
 test('Three-quarter window consumes one supply only once',()=>{const s=fresh();s.pressure.spent=385;s.pressure.nextEvent=9999;C.act(s,'examine');assert(s.pressure.stage===2&&s.pressure.supplies===4);C.act(s,'question_0');assert(s.pressure.supplies===4);});
 test('Deadline increases exposure, spends support and records breach',()=>{const s=fresh();s.pressure.spent=520;s.pressure.nextEvent=9999;C.act(s,'examine');assert(s.pressure.stage===3&&s.pressure.breaches===1&&s.support===2&&s.exposure===3);});
 test('Evacuation grace has a real end and keeps story debrief',()=>{const s=fresh();s.pressure.spent=700;s.pressure.nextEvent=9999;C.act(s,'examine');assert(s.ending?.type==='escape');assert(StoryRecaps.render(s.story,s).length>100);valid(s);});
 test('Limited contact window grants resources once and spends 20 minutes',()=>{const s=fresh();assert(P.resolve(s,'opportunity'));assert(s.support===5&&s.pressure.supplies===6&&s.pressure.spent===20);assert(!P.resolve(s,'opportunity'));});
 test('Contact cannot be completed after its cutoff',()=>{const s=fresh();s.pressure.spent=260;assert(!P.resolve(s,'opportunity'));assert(s.pressure.opportunity==='open');});
 test('Resupply costs 40 minutes and cannot be farmed above five supplies',()=>{const s=fresh();assert(!P.resolve(s,'resupply'));s.pressure.supplies=0;assert(P.resolve(s,'resupply'));assert(s.pressure.spent===40&&s.pressure.supplies===2);});
 test('Empty supplies add one penalty die to investigator skills only',()=>{const s=fresh();s.pressure.supplies=0;assert(C.check(s,'spot','search',1,good).mod===-1);assert(C.check(s,'CON','constitution',1,good).mod===0);assert(F.check(s,50,'SAN',1,0,good).mod===0);});
 test('Pending event blocks new investigation but allows reading',()=>{const s=fresh();s.pressure.spent=60;C.act(s,'examine');assert(P.blocked(s));const before=s.time;assert(C.act(s,'question_0')===false);assert(s.time===before);P.describe(s);assert(s.time===before);});
 test('Reload retains offered event and committed random stream',()=>{const s=fresh();s.pressure.spent=60;C.act(s,'examine');const copy=valid(s);P.resolve(s,'risk');P.resolve(copy,'risk');assert(JSON.stringify(s)===JSON.stringify(copy));});
 test('Events do not repeat and only belong to the active story',()=>{const s=fresh();for(let i=0;i<22;i++){s.pressure.nextEvent=0;C.act(s,'not-an-action');assert(s.pressure.pending);assert(P.events.some(e=>e.id===s.pressure.pending&&(e.story==='common'||e.story===s.story)));P.resolve(s,'leave');}assert(new Set(s.pressure.seen).size===22);s.pressure.nextEvent=0;C.act(s,'not-an-action');assert(!s.pressure.pending);});
 test('Cautious event resolution needs supplies, skips need only time',()=>{const s=fresh();s.pressure.spent=60;C.act(s,'examine');s.pressure.supplies=0;const before=s.time;assert(!P.resolve(s,'careful'));assert(s.time===before);assert(P.resolve(s,'leave'));assert(s.time===before+5);});
 test('Failed confrontation can trigger combat, which remains playable',()=>{const s=fresh();s.pressure.pending='asylum_9';s.pressure.seen=['asylum_9'];const ev=P.events.find(e=>e.id===s.pressure.pending),original=s.player.skills[ev.skill];s.player.skills[ev.skill]=0;assert(P.resolve(s,'risk'));s.player.skills[ev.skill]=original;assert(s.combat,'Expected a fight');clear(s);valid(s);});
 test('Older saves receive a fresh window without losing evidence',()=>{const s=fresh();C.act(s,'examine');delete s.pressure;s.time=2000;const result=valid(s);assert(result.pressure.spent===0&&result.pressure.budget===540&&result.clues.length===1);});
 test('Invalid pressure fields and foreign-story event IDs are rejected',()=>{for(const [key,value] of [['supplies',-1],['seed',Infinity],['phase','9'],['seen',['train_0']],['pending','asylum_9'],['history',[{}]],['stage',4],['opportunity','free']]){const s=fresh();s.pressure[key]=value;let rejected=false;try{valid(s);}catch(e){rejected=true;}assert(rejected,key);}});
 test('Fogharbor also gets deadlines, events and native valid saves',()=>{const s=F.newGame(build(),good);assert(s.pressure.budget===720);s.pressure.spent=880;s.pressure.nextEvent=9999;F.travel(s,'archive');assert(s.ending?.type==='escape');F.validateSave(clone(s));});
 test('Theatre talk spends action time and puzzle hints remain free',()=>{const s=fresh('theatre');Theatre.talk(s,'你好','ask',good);assert(s.pressure.spent===5);const before=s.pressure.spent;Theatre.hint(s,'seats');assert(s.pressure.spent===before);});
 for(const id of Object.keys(D.stories))for(let seed=1;seed<=12;seed++)test('Full campaign with crisis system '+id+' seed '+seed,()=>{
  const s=fresh(id,seed),policy=seed%3===0?'leave':seed%3===1?'careful':'risk';
  for(let ch=0;ch<3;ch++){
   perform(s,()=>P.resolve(s,'opportunity'),policy);
   const q=D.stories[id].deductions[ch],must=[q.evidence[0],...(id==='theatre'?[Theatre.puzzles[ch].scene]:[])];
   const scenes=D.stories[id].scenes.filter(x=>x.act===ch).sort((a,b)=>Number(must.includes(b.id))-Number(must.includes(a.id))).slice(0,3);
   for(const sc of scenes){if(s.scene!==sc.id)perform(s,()=>C.travel(s,sc.id),policy);for(const action of ['examine','question_0','careful','resolve_0'])perform(s,()=>C.act(s,action,good),policy);}
   if(id==='theatre'){const p=Theatre.puzzles[ch];perform(s,()=>Theatre.solve(s,p.id,p.answer),policy);}
   perform(s,()=>C.deduce(s,q.id,q.answer,q.evidence[0]),policy);
   const breaches=s.pressure.breaches;perform(s,()=>C.advance(s),policy);assert(s.pressure.spent===0,'Rest counted against active deadline');assert(s.pressure.budget===(ch===2?150:Math.max(420,540-breaches*30)));
  }
  perform(s,()=>C.chooseRoute(s,'sealed'),policy);
  for(let step=0;step<3;step++){perform(s,()=>C.finaleAction(s,'brief',good),policy);perform(s,()=>C.finaleAction(s,s.insight>=2?'insight':s.support>=2?'support':'skill',good),policy);}
  assert(s.ending?.type==='success','Expected success ending');assert(s.pressure.seen.length>=6,'Too few events');valid(s);
 });
 root.PressureTests=results;
})(globalThis);
