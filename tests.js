/* Run in tests.html, or: node -e "require('./engine');require('./tests')" */
(function(root){
  'use strict';
  const F=root.Fog||(typeof require==='function'?require('./engine.js'):null),results=[];
  function assert(value,message='assertion failed'){if(!value)throw Error(message);}
  function equal(a,b){assert(JSON.stringify(a)===JSON.stringify(b),JSON.stringify(a)+' !== '+JSON.stringify(b));}
  function throws(fn){let thrown=false;try{fn();}catch(e){thrown=true;}assert(thrown,'expected rejection');}
  function test(name,fn){try{fn();results.push({name,pass:true});}catch(e){results.push({name,pass:false,error:e.message});}}
  const good=()=>2; // percentile 11, damage 2
  const seq=(values,fallback=2)=>()=>values.length?values.shift():fallback;
  const build=(preset=1,job='detective')=>({preset,job,name:'沈以衡',background:'帶妹妹回家。',...F.allocate(preset,job)});
  const game=()=>F.newGame(build(),good);
  const go=(s,p)=>F.travel(s,p,good),act=(s,id)=>F.act(s,id,good);
  const copy=x=>JSON.parse(JSON.stringify(x));
  function safeRoute(){const s=game();act(s,'room');act(s,'photo');act(s,'lin');go(s,'clinic');act(s,'register');act(s,'forgery');go(s,'archive');act(s,'obituary');act(s,'recording');act(s,'police');go(s,'pump');act(s,'plans');act(s,'tools');go(s,'tower');act(s,'rescue');return s;}
  function fight(){const s=game();act(s,'room');go(s,'pump');act(s,'plans');go(s,'tower');act(s,'force');assert(s.combat);return s;}
  test('百分骰00＋0為100',()=>equal(F.percentile(0,seq([1,1])).value,100));
  test('獎勵骰在100與40中選40',()=>equal(F.percentile(1,seq([1,1,5])).value,40));
  test('懲罰骰在100與40中選100',()=>equal(F.percentile(-1,seq([1,1,5])).value,100));
  test('兩顆獎勵骰共享同一個位數',()=>{const r=F.percentile(2,seq([8,9,4,2]));equal(r.candidates,[87,37,17]);equal(r.value,17);});
  test('獎懲骰上限兩顆',()=>equal(F.percentile(8,good).tens.length,3));
  test('骰子公式為逐顆相加',()=>equal(F.dice(3,6,seq([1,2,6])),9));
  test('01為大成功',()=>equal(F.grade(1,45),4));
  test('100為大失敗',()=>equal(F.grade(100,99),-1));
  test('技能49的96為大失敗',()=>equal(F.grade(96,49),-1));
  test('技能50的96為普通失敗',()=>equal(F.grade(96,50),0));
  test('困難門檻低於50使用96大失敗',()=>equal(F.grade(96,65,32),-1));
  test('65的困難門檻向下取32',()=>{equal(F.grade(32,65),2);equal(F.grade(33,65),1);});
  test('65的極限門檻為13',()=>{equal(F.grade(13,65),3);equal(F.grade(14,65),2);});
  test('普通成功不足以完成困難任務',()=>{const s=game();const r=F.check(s,65,'test',2,0,seq([1,5]));equal(r.value,40);equal(r.grade,1);equal(r.success,false);});
  test('近戰閃避同級勝',()=>equal(F.melee(2,2,'dodge'),'none'));
  test('近戰反擊同級原攻擊者勝',()=>equal(F.melee(2,2,'fight'),'attacker'));
  test('反擊高級命中',()=>equal(F.melee(1,2,'fight'),'defender'));
  test('雙方失敗不造成傷害',()=>{equal(F.melee(0,0,'fight'),'none');equal(F.melee(-1,0,'dodge'),'none');});
  test('一次6點傷害對HP11造成重傷',()=>equal(F.damageState(11,11,false,6),{hp:5,major:true,dead:false}));
  test('累積傷害至零但無單次重傷',()=>equal(F.damageState(2,11,false,2),{hp:0,major:false,dead:false}));
  test('單次傷害達最大HP立即死亡',()=>assert(F.damageState(11,11,false,11).dead));
  for(let p=0;p<3;p++)for(const job of Object.keys(F.JOBS))test(`建角配點及存檔驗證：${p}/${job}`,()=>{const b=build(p,job);assert(F.validateBuild(b));F.validateSave(F.newGame(b,good));});
  test('偵探範例的職業260、興趣160',()=>{const b=build();equal(Object.values(b.occ).reduce((a,b)=>a+b),260);equal(Object.values(b.interest).reduce((a,b)=>a+b),160);});
  test('拒絕負點數',()=>{const b=build();b.occ.photo=-1;throws(()=>F.validateBuild(b));});
  test('拒絕小數點數',()=>{const b=build();b.interest.listen=1.5;throws(()=>F.validateBuild(b));});
  test('拒絕神話初始投點',()=>{const b=build();b.interest.mythos=1;throws(()=>F.validateBuild(b));});
  test('拒絕非職業投點',()=>{const b=build();b.occ.mechanical=1;throws(()=>F.validateBuild(b));});
  test('預設生命與DB',()=>{const s=game();equal(s.player.hp,11);equal(s.player.db,0);equal(F.derived(F.attributes(2)).db,4);});
  test('關鍵房間線索不需擲骰',()=>{const s=game();F.act(s,'room',()=>{throw Error('unexpected RNG');});assert(s.clues.includes('receipt')&&s.clues.includes('sketch'));});
  test('行動不可重播以重複取線索',()=>{const s=game();act(s,'room');const before=copy(s);act(s,'room');equal(s,before);});
  test('不能從其他地點執行行動',()=>{const s=game();const before=copy(s);act(s,'shutter');equal(s,before);});
  test('沒有線索時不能直達燈塔',()=>{const s=game();go(s,'tower');equal(s.place,'hotel');});
  test('完整非戰鬥救援與完美結局',()=>{const s=safeRoute();assert(s.flags.rescued);assert(!s.combat);act(s,'shutter');act(s,'leave');equal(s.ending.title,'霧散之前');assert(s.ending.reward>0);F.validateSave(copy(s));});
  test('最少線索也能完成救援',()=>{const s=game();act(s,'room');go(s,'pump');act(s,'plans');go(s,'tower');act(s,'shutter');act(s,'force');assert(!s.combat);act(s,'leave');equal(s.ending.type,'success');assert(s.flags.rescued);});
  test('未救妹妹亦可結束故事',()=>{const s=game();act(s,'ferry');equal(s.ending.type,'escape');equal(s.ending.title,'獨自離港');});
  test('結局不會重複發獎',()=>{const s=safeRoute();act(s,'shutter');act(s,'leave');const p=copy(s);act(s,'leave');go(s,'hotel');equal(s,p);});
  test('午夜不能再直接關閉已穩定入口',()=>{const s=safeRoute();s.time=1435;act(s,'shutter');assert(s.flags.disaster);assert(!s.flags.lightOff);act(s,'leave');equal(s.ending.type,'escape');});
  test('九點後正門封鎖可由泵房解決',()=>{const s=game();act(s,'room');s.time=1270;go(s,'tower');equal(s.place,'hotel');go(s,'pump');act(s,'plans');go(s,'tower');equal(s.place,'tower');});
  test('普通失敗提供孤注一擲，期間禁止移動',()=>{const s=game();F.act(s,'photo',seq([1,8]));equal(s.pending,'photo');go(s,'clinic');equal(s.place,'hotel');act(s,'abandon');equal(s.pending,null);go(s,'clinic');equal(s.place,'clinic');});
  test('孤注一擲成功取得線索',()=>{const s=game();F.act(s,'photo',seq([1,8]));act(s,'push');assert(s.clues.includes('photo'));equal(s.pending,null);});
  test('孤注一擲失敗造成事先說明的傷害',()=>{const s=game();F.act(s,'photo',seq([1,8]));F.act(s,'push',seq([1,8,2]));equal(s.player.hp,9);equal(s.pending,null);});
  test('大失敗不提供孤注一擲',()=>{const s=game();F.act(s,'photo',()=>1);equal(s.pending,null);assert(!s.clues.includes('photo'));});
  test('破門救人啟動可操作戰鬥',()=>{const s=fight();assert(s.flags.rescued);equal(s.combat.phase,'player');F.validateSave(copy(s));});
  test('戰鬥期間禁止場景行動',()=>{const s=fight();const before=copy(s);act(s,'leave');go(s,'clinic');equal(s,before);});
  test('射擊消耗一顆彈藥並要求防守',()=>{const s=fight();F.combatAct(s,'shoot',good);equal(s.player.ammo,5);equal(s.combat.phase,'defense');assert(s.combat.hp<15);});
  test('防守階段不能再攻擊',()=>{const s=fight();F.combatAct(s,'shoot',good);const before=copy(s);F.combatAct(s,'attack',good);equal(s,before);});
  test('防守結束推進回合',()=>{const s=fight();F.combatAct(s,'shoot',good);F.combatAct(s,'dodge',good);equal(s.combat.round,2);equal(s.combat.phase,'player');});
  test('空槍不可射擊',()=>{const s=fight();s.player.ammo=0;const before=copy(s);F.combatAct(s,'shoot',good);equal(s,before);});
  test('戰鬥中轉動手輪結束追擊',()=>{const s=fight();F.combatAct(s,'operate',good);assert(!s.combat&&s.flags.lightOff);});
  test('付出傷害撤退後仍能完成劇情',()=>{const s=fight();F.combatAct(s,'cover',good);equal(s.place,'pump');assert(!s.combat);go(s,'tower');assert(!s.combat);act(s,'shutter');act(s,'leave');equal(s.ending.type,'success');});
  test('危機中拆卸底座得到代價結局',()=>{const s=fight();for(let i=0;i<3;i++){F.combatAct(s,'break',good);if(s.combat)F.combatAct(s,'dodge',good);}assert(s.flags.destroyed&&s.flags.lightOff&&!s.combat);act(s,'leave');equal(s.ending.title,'帶著傷痕的黎明');});
  test('已擊敗的行者不會因破門復活',()=>{const s=game();act(s,'room');go(s,'tower');s.flags.walkerDefeated=true;act(s,'force');assert(!s.combat);act(s,'destroy');assert(s.flags.lightOff&&s.flags.destroyed);});
  test('NPC低語實際消耗MP並影響下一次檢定',()=>{const s=safeRoute();F.act(s,'talk',seq([1,8,2,2,2,2,1,8]));equal(s.flags.xuMp,13);assert(s.flags.whisper);act(s,'abandon');});
  test('SAN同事件不重複扣除',()=>{const s=game();F.sanity(s,'x',0,3,()=>1);const before=s.player.san;F.sanity(s,'x',0,3,()=>1);equal(s.player.san,before);});
  test('SAN零結束角色',()=>{const s=game();s.player.san=1;F.sanity(s,'x',0,6,()=>1);equal(s.ending.type,'madness');});
  test('單次失去5以上並理解觸發暫時瘋狂',()=>{const s=game();F.sanity(s,'x',0,6,seq([1,1,2,2,2,2]));assert(s.player.insaneUntil>s.time);});
  test('一天理智損失達五分之一觸發不定性瘋狂',()=>{const s=game();s.player.sanLost=9;F.sanity(s,'x',0,3,()=>1);assert(s.player.indefinite);});
  test('只有一次護士治療機會',()=>{const s=game();s.player.hp=8;go(s,'clinic');act(s,'heal');equal(s.player.hp,9);act(s,'heal');equal(s.player.hp,9);});
  test('存檔往返保留所有狀態',()=>{const s=safeRoute();equal(F.validateSave(copy(s)),s);});
  test('拒絕錯誤版本',()=>{const s=game();s.version=99;throws(()=>F.validateSave(s));});
  test('拒絕不合法HP',()=>{const s=game();s.player.hp=999;throws(()=>F.validateSave(s));});
  test('拒絕不完整骰子紀錄',()=>{const s=safeRoute();delete s.rolls[0].tens;throws(()=>F.validateSave(s));});
  test('拒絕不存在的地點',()=>{const s=game();s.place='constructor';throws(()=>F.validateSave(s));});
  test('拒絕注入型線索ID',()=>{const s=game();s.clues=['__proto__'];throws(()=>F.validateSave(s));});
  test('拒絕不存在的待決檢定',()=>{const s=game();s.pending='fake';throws(()=>F.validateSave(s));});
  test('存檔可停在防守階段並繼續',()=>{const s=fight();F.combatAct(s,'shoot',good);const loaded=F.validateSave(copy(s));F.combatAct(loaded,'dodge',good);equal(loaded.combat.phase,'player');});
  test('200條隨機探索路徑均可保持有效狀態並結束',()=>{
    for(let seed=1;seed<=200;seed++){
      let n=seed;const rng=sides=>{n=(n*1664525+1013904223)>>>0;return n%sides+1;};const s=F.newGame(build(seed%3,Object.keys(F.JOBS)[seed%3]),rng);
      for(let step=0;step<60&&!s.ending;step++){
        if(s.pending)F.act(s,rng(2)===1?'push':'abandon',rng);
        else if(s.combat)F.combatAct(s,s.combat.phase==='defense'?'dodge':'cover',rng);
        else if(step>45){if(s.place==='tower')F.act(s,'leave',rng);else if(s.place==='hotel')F.act(s,'ferry',rng);else F.travel(s,'hotel',rng);}
        else{const a=F.availableActions(s).filter(a=>!['leave','ferry','rest'].includes(a.id));if(a.length&&rng(3)>1)F.act(s,a[rng(a.length)-1].id,rng);else F.travel(s,Object.keys(F.PLACES)[rng(5)-1],rng);}
        F.validateSave(copy(s));
      }
      assert(s.ending,'unfinished seed '+seed);
    }
  });
  root.FogTests=results;
  if(typeof document!=='undefined'){const el=document.getElementById('test-results');if(el){el.textContent=results.map(r=>(r.pass?'PASS ':'FAIL ')+r.name+(r.error?' — '+r.error:'')).join('\n');document.getElementById('test-summary').textContent=`${results.filter(r=>r.pass).length} / ${results.length} 通過`;}}
  if(typeof module!=='undefined'&&module.exports){module.exports=results;if(typeof process!=='undefined'&&results.some(r=>!r.pass))process.exitCode=1;}
})(typeof globalThis!=='undefined'?globalThis:this);
