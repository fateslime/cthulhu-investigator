/* Original scenario, offline deterministic state machine. No DOM dependencies. */
(function (root) {
  'use strict';
  const VERSION = 1;
  const ATTR = ['STR','CON','SIZ','DEX','APP','INT','POW','EDU'];
  const PRESETS = [
    {name:'知識調查型',tag:'從文字的裂縫中，找到真相。',values:[40,50,50,60,50,70,60,80]},
    {name:'機動偵探型',tag:'在事情變糟以前，找到出口。',values:[50,60,50,70,40,80,50,60]},
    {name:'強健行動型',tag:'有些門，必須親手推開。',values:[80,70,60,60,40,50,50,50]}
  ];
  const SKILLS = {photo:['攝影',5],disguise:['喬裝',5],law:['法律',5],library:['圖書館使用',20],psychology:['心理學',10],spot:['偵查',25],persuade:['說服',10],locksmith:['鎖匠',1],credit:['信用評級',0],listen:['聆聽',20],stealth:['潛行',20],firstaid:['急救',30],brawl:['格鬥：鬥毆',25],dodge:['閃避',0],mechanical:['機械維修',10],handgun:['射擊：手槍',20],history:['歷史',5],own:['母語',0],latin:['拉丁文',1],medicine:['醫學',1],biology:['生物學',1],pharmacy:['藥學',1],occult:['神祕學',5],mythos:['克蘇魯神話',0]};
  const JOBS = {
    detective:{name:'私家偵探',skills:['photo','disguise','law','library','psychology','spot','persuade','locksmith'],credit:[9,30],points:a=>2*a.EDU+2*Math.max(a.STR,a.DEX)},
    reporter:{name:'調查記者',skills:['photo','history','library','own','psychology','persuade','spot','stealth'],credit:[9,30],points:a=>4*a.EDU},
    doctor:{name:'醫師',skills:['firstaid','latin','medicine','psychology','biology','pharmacy','library','spot'],credit:[30,80],points:a=>4*a.EDU}
  };
  const PLACES = {
    hotel:{name:'海燕旅館',sub:'SEA SWALLOW INN',mark:'01',desc:'雨水沿著窗玻璃往下爬。接待桌後，林秋蓉把一把黃銅鑰匙推到你面前。二樓走廊的盡頭，是妹妹住過的房間。',art:'inn'},
    clinic:{name:'港務診所',sub:'HARBOR CLINIC',mark:'02',desc:'消毒水裡混著海藻的氣味。候診長椅空無一人，護士蘇瑾把一本厚重的名冊藏進抽屜。牆上的合照中，許醫師身旁站著一位穿白衣的女子。',art:'clinic'},
    archive:{name:'報社資料室',sub:'THE EVENING ARCHIVE',mark:'03',desc:'打字機停在半行句子上。窗外的霧吞沒了街道，架上的舊報紙仍保留著十年前那場海難的鹽味。',art:'archive'},
    pump:{name:'廢棄泵房',sub:'OLD PUMP STATION',mark:'04',desc:'地下傳來三短一長的敲擊。生鏽的管線穿過牆面，通往海岬。牆上有一張泛黃的設備圖，角落標著：緊急遮光。',art:'pump'},
    tower:{name:'霧角燈塔',sub:'FOGHORN LIGHTHOUSE',mark:'05',desc:'海面沒有浪。燈塔的光柱掃過水面時，你聽見一個熟悉的聲音叫你的名字。門後有濕漉漉的拖行聲，右側的防火門仍然能關上。',art:'tower'}
  };
  const CLUES = {
    receipt:['診所收據','若棠房內的收據：三名失蹤工人都曾到港務診所就診。'],
    sketch:['燈塔草圖','若棠畫了一束射向海面的光，旁邊寫著：「切斷光路，不是切斷電源。」'],
    photo:['反常的照片','光源來自透鏡內部；停電未必能阻止它。'],
    register:['轉院名冊','病人被送往沒有醫療設施的霧角燈塔。'],
    forgery:['偽造病歷','所有轉院同意書的簽名，都出自同一隻手。'],
    obituary:['海難剪報','許承岳的妻子十年前已死。她生前怕水，從不曾登上燈塔。'],
    recording:['重複的錄音','「我在這裡等你。」每次連呼吸和停頓都一模一樣。那不是交談，是重播。'],
    plans:['緊急遮光圖紙','轉動紅色手輪，放下鉛製遮光板。厚門能擋住行者；光路一斷，牠會失去方向。'],
    testimony:['碼頭證詞','陳柏舟看見若棠被帶進塔內。他願意阻止守衛，但需要能交差的犯罪證據。'],
    notes:['若棠的調查筆記','透鏡只是模仿聲音。底座有三枚固定螺栓；拆開底座就能毀掉透鏡。']
  };
  const NPCS = {
    lin:{name:'林秋蓉',role:'旅館老闆',attrs:[40,50,50,50,60,70,60,60],hp:10,san:60,mp:12,db:0,build:0,mov:8,skills:'聆聽60、心理學60、說服55、偵查50',ability:'提供住客紀錄與車牌。信任需要由對話和證據建立。'},
    su:{name:'蘇瑾',role:'港務護士',attrs:[40,55,45,65,60,75,65,75],hp:10,san:65,mp:13,db:0,build:0,mov:8,skills:'急救75、醫學55、心理學60、潛行40',ability:'能提供一次現場急救；正常處理擲骰與傷势，並非無限治療。'},
    chen:{name:'陳柏舟',role:'碼頭巡警',attrs:[65,65,60,60,45,60,50,55],hp:12,san:50,mp:10,db:4,build:1,mov:8,skills:'鬥毆55、手槍45、閃避40、偵查55、恐嚇45',ability:'取得偽造病歷或轉院名冊後，能在終局攔住人類守衛。'},
    xu:{name:'許承岳',role:'港務醫師',attrs:[45,50,55,50,65,80,75,85],hp:10,san:25,mp:15,db:0,build:0,mov:7,skills:'醫學80、說服65、心理學55、神話18、鬥毆30、閃避25',ability:'透鏡低語：花費2 MP、POW75對抗；成功使下一次專注檢定承受一顆懲罰骰。原創能力。'},
    ruo:{name:'沈若棠',role:'失蹤記者',attrs:[40,45,45,65,55,75,60,70],hp:9,san:42,mp:12,db:0,build:0,mov:8,skills:'攝影65、圖書館60、偵查60、潛行55、閃避40',ability:'被找到時 HP6／9。調查筆記能指出裝置的操作方式。'},
    walker:{name:'潮痕行者',role:'透鏡的回聲',attrs:[90,70,80,45,0,35,65,0],hp:15,san:null,mp:13,db:6,build:2,mov:6,skills:'鬥毆40、閃避20、聆聽70、潛行30',ability:'護甲1。重擊1D3＋1D6，每回合一次；追逐塔內聲音，受厚門阻擋。斷光後停止追擊。原創生物。'}
  };
  PRESETS.push(
    {name:'交涉表演型',tag:'讀懂表情，也懂得何時不說話。',values:[40,50,50,60,80,60,60,60]},
    {name:'技術探索型',tag:'拆開機關之前，先找到退路。',values:[60,60,50,70,40,70,50,60]},
    {name:'意志堅定型',tag:'看見恐怖，仍記得自己為何而來。',values:[45,60,50,50,45,60,85,65]}
  );
  const EXTRA_SKILLS={charm:['魅惑',15],fasttalk:['話術',5],intimidate:['恐嚇',15],climb:['攀爬',20],jump:['跳躍',20],swim:['游泳',20],track:['追蹤',10],navigate:['導航',10],electrical:['電氣維修',10],art:['藝術／工藝：表演',5]};
  Object.assign(SKILLS,EXTRA_SKILLS);
  Object.assign(JOBS,{
    performer:{name:'舞台演員',skills:['art','charm','disguise','psychology','fasttalk','listen','jump','history'],credit:[9,40],points:a=>2*a.EDU+2*a.APP},
    technician:{name:'舞台技師',skills:['mechanical','electrical','climb','spot','listen','locksmith','firstaid','navigate'],credit:[9,30],points:a=>4*a.EDU},
    explorer:{name:'探險嚮導',skills:['climb','jump','swim','navigate','track','spot','firstaid','listen'],credit:[9,30],points:a=>2*a.EDU+2*Math.max(a.STR,a.DEX)},
    guard:{name:'退役護衛',skills:['brawl','handgun','dodge','intimidate','spot','listen','firstaid','track'],credit:[9,30],points:a=>2*a.EDU+2*Math.max(a.STR,a.DEX)},
    antiquarian:{name:'古物研究者',skills:['history','occult','library','latin','photo','law','spot','persuade'],credit:[20,50],points:a=>4*a.EDU},
    socialworker:{name:'社區工作者',skills:['persuade','charm','psychology','law','firstaid','listen','library','fasttalk'],credit:[9,30],points:a=>4*a.EDU}
  });
  function validPreset(preset){return Number.isInteger(preset)&&!!PRESETS[preset]||Array.isArray(preset)&&preset.length===8&&preset.every(n=>Number.isInteger(n)&&n>=30&&n<=85)&&preset.reduce((a,b)=>a+b,0)===460;}
  function attributes(preset) { const values=Array.isArray(preset)?preset:PRESETS[preset]?.values;if(!values)throw Error('能力方案不存在。');return Object.fromEntries(ATTR.map((k,i)=>[k,values[i]])); }
  function migrateSkills(s){if(!s?.player?.skills)return s;for(const [k,v]of Object.entries(EXTRA_SKILLS)){if(!Object.hasOwn(s.player.skills,k))s.player.skills[k]=v[1];if(s.build?.occ&&!Object.hasOwn(s.build.occ,k))s.build.occ[k]=0;if(s.build?.interest&&!Object.hasOwn(s.build.interest,k))s.build.interest[k]=0;}return s;}
  function baseSkills(a) { return Object.fromEntries(Object.entries(SKILLS).map(([k,v])=>[k,k==='dodge'?Math.floor(a.DEX/2):k==='own'?a.EDU:v[1]])); }
  function derived(a) { const n=a.STR+a.SIZ; return {maxHp:Math.floor((a.CON+a.SIZ)/10),maxMp:Math.floor(a.POW/5),db:n<65?-2:n<85?-1:n<125?0:n<165?4:6,build:n<65?-2:n<85?-1:n<125?0:n<165?1:2,mov:a.STR<a.SIZ&&a.DEX<a.SIZ?7:a.STR>a.SIZ&&a.DEX>a.SIZ?9:8}; }
  function allocate(preset,job) {
    const a=attributes(preset),base=baseSkills(a),j=JOBS[job],occ={},interest={};
    Object.keys(SKILLS).forEach(k=>{occ[k]=0;interest[k]=0;});
    if(preset===1&&job==='detective') {
      Object.assign(occ,{photo:25,disguise:15,law:25,library:40,psychology:35,spot:40,persuade:30,locksmith:25,credit:25});
      Object.assign(interest,{listen:35,stealth:30,firstaid:30,brawl:20,dodge:15,mechanical:30});
      return {occ,interest};
    }
    occ.credit=j.credit[0]; let left=j.points(a)-occ.credit;
    while(left>0) { let changed=false; for(const k of j.skills) if(left&&base[k]+occ[k]<70){occ[k]++;left--;changed=true;} if(!changed) { const extra=Math.min(left,j.credit[1]-occ.credit,75-occ.credit);occ.credit+=extra;left-=extra;if(!extra)break; } }
    left=a.INT*2; const priorities=['spot','library','listen','stealth','firstaid','dodge','mechanical','brawl','persuade','handgun'];
    while(left>0) for(const k of priorities) if(left&&base[k]+occ[k]+interest[k]<75){interest[k]++;left--;}
    return {occ,interest};
  }
  function validateBuild(b) {
    if(!b||!validPreset(b.preset)||!JOBS[b.job]) throw Error('請選擇有效的能力配置與職業。');
    const a=attributes(b.preset),base=baseSkills(a),j=JOBS[b.job];let op=0,ip=0;
    for(const k of Object.keys(SKILLS)){const o=b.occ[k],i=b.interest[k];if(!Number.isInteger(o)||!Number.isInteger(i)||o<0||i<0)throw Error('技能點數必須是非負整數。');if(o&&!j.skills.includes(k)&&k!=='credit')throw Error('職業點數投入了非職業技能。');if((k==='mythos'&&(o||i))||(k==='credit'&&i))throw Error('神話不能初始投點；信用僅使用職業點。');if(base[k]+o+i>Math.max(base[k],75))throw Error('初始技能上限為75。');op+=o;ip+=i;}
    if(op!==j.points(a)||ip!==2*a.INT) throw Error('請將職業與興趣點數分別完整分配。');
    if(b.occ.credit<j.credit[0]||b.occ.credit>j.credit[1])throw Error('信用評級不在職業允許範圍內。');
    return true;
  }
  function randomInt(n) { if(root.crypto&&root.crypto.getRandomValues){const limit=Math.floor(4294967296/n)*n;let x;do{x=root.crypto.getRandomValues(new Uint32Array(1))[0];}while(x>=limit);return x%n+1;}return Math.floor(Math.random()*n)+1; }
  function dice(n,sides,rng=randomInt) {let total=0;for(let i=0;i<n;i++)total+=rng(sides);return total;}
  function percentile(mod=0,rng=randomInt) {mod=Math.max(-2,Math.min(2,mod));const unit=rng(10)-1,tens=Array.from({length:1+Math.abs(mod)},()=>rng(10)-1),candidates=tens.map(t=>(10*t+unit)||100);return {unit,tens,candidates,value:mod>=0?Math.min(...candidates):Math.max(...candidates),mod};}
  function grade(value,skill,target=skill){if(value===100||(target<50&&value>=96))return -1;if(value===1)return 4;if(value<=Math.floor(skill/5))return 3;if(value<=Math.floor(skill/2))return 2;if(value<=skill)return 1;return 0;}
  const gradeName=g=>['大失敗','失敗','普通成功','困難成功','極限成功','大成功'][g+1];
  function melee(a,d,response){if(a<=0&&d<=0)return 'none';if(response==='dodge')return a>0&&a>d?'attacker':'none';return d>0&&d>a?'defender':a>0?'attacker':'none';}
  function damageState(hp,maxHp,major,damage){damage=Math.max(0,damage);return {hp:Math.max(0,hp-damage),major:major||damage>=maxHp/2,dead:damage>=maxHp};}
  function newGame(b,rng=randomInt) {
    validateBuild(b);const a=attributes(b.preset),d=derived(a),base=baseSkills(a),skills={};Object.keys(base).forEach(k=>skills[k]=base[k]+b.occ[k]+b.interest[k]);
    return {version:VERSION,player:{name:String(b.name||'沈以衡').slice(0,24),background:String(b.background||'我一定要帶若棠回家。').slice(0,400),job:b.job,attrs:a,skills,...d,hp:d.maxHp,san:a.POW,daySan:a.POW,sanLost:0,mp:d.maxMp,luck:dice(3,6,rng)*5,ammo:6,major:false,insaneUntil:0,indefinite:false},place:'hotel',time:720,flags:{},clues:[],met:['lin'],inventory:['妹妹的來信','停擺懷錶','筆記本','手電筒','相機','急救包','開鎖工具','短棍','左輪手槍（6發）'],log:[{type:'story',text:'你抵達霧港。林秋蓉說，妹妹昨晚才交代你今天會來。可是那封信，是九天前寄出的。'}],rolls:[],pending:null,combat:null,ending:null};
  }
  function note(s,text,type='story'){s.log.push({type,text});if(s.log.length>160)s.log.shift();}
  function clue(s,id){if(!s.clues.includes(id)){s.clues.push(id);note(s,'取得線索：'+CLUES[id][0],'clue');}}
  function meet(s,id){if(!s.met.includes(id))s.met.push(id);}
  function check(s,skill,label,difficulty=1,mod=0,rng=randomInt){const target=difficulty===3?Math.floor(skill/5):difficulty===2?Math.floor(skill/2):skill;const r=percentile(mod,rng);r.skill=skill;r.label=label;r.target=target;r.grade=grade(r.value,skill,target);r.success=r.grade>=difficulty;r.difficulty=difficulty;s.rolls.push(r);if(s.rolls.length>100)s.rolls.shift();note(s,`${label} ${skill} → ${r.value}／門檻 ${target} · ${gradeName(r.grade)}${r.success?'':'，未達要求'}`,'roll');return r;}
  function finish(s,type,rng=randomInt){if(s.ending)return;let title,text,reward=0;
    if(type==='death'){title='海霧中的名字';text='霧港的報紙上，多了一名失蹤者。你留下的筆記，也許會被下一位調查員找到。';}
    else if(type==='madness'){title='回聲的另一端';text='你已無法分辨自己的記憶與透鏡的聲音。這位調查員的故事在此結束。';}
    else if(type==='escape'){title=s.flags.rescued?'最後一班渡輪':'獨自離港';text=s.flags.rescued?'若棠靠在你肩上。遠處的燈塔仍然亮著。你們活了下來，但霧港的故事尚未結束。':'你帶著證據離開。若棠仍在燈塔裡；當你回頭，海面傳來了她的聲音。';}
    else if(type==='unconscious'){title='遺落的調查';text='黑暗蓋過你的意識。你在這場調查中失去了行動能力，儀式將在你醒來以前完成。';}
    else{const full=s.flags.rescued&&s.clues.length>=6&&!s.flags.destroyed;title=full?'霧散之前':'帶著傷痕的黎明';text=full?'燈塔終於暗了。若棠把底片交給你：這次，你們有足夠的證據。晨霧裡，第一班車正駛進車站。':s.flags.rescued?'你們逃出了失去光芒的燈塔。有人得救，有些真相永遠沉入海中。':'入口關閉了，卻沒有人從設備間走出來。你保住了霧港，仍有一個名字無法劃去。';reward=dice(1,full?6:3,rng);s.player.san=Math.min(99-s.player.skills.mythos,s.player.san+reward);}
    s.ending={type,title,text,reward};s.combat=null;s.pending=null;note(s,text,'ending');
  }
  function hurt(s,amount,rng=randomInt){const p=s.player,r=damageState(p.hp,p.maxHp,p.major,amount);Object.assign(p,{hp:r.hp,major:r.major});note(s,`受到 ${amount} 點傷害；HP ${p.hp}／${p.maxHp}。`,'danger');if(r.dead){finish(s,'death',rng);return;}if(!p.hp){if(p.major){note(s,'重傷並瀕死。');if(s.flags.rescued&&!s.flags.savedByRuo){s.flags.savedByRuo=true;if(check(s,30,'若棠的緊急急救',1,0,rng).success){p.hp=1;note(s,'若棠穩定了你的傷勢。她催促你立刻離開。');s.combat=null;return;}}finish(s,'death',rng);}else finish(s,'unconscious',rng);return;}if(amount>=p.maxHp/2&&!check(s,p.attrs.CON,'重傷：保持清醒',1,0,rng).success)finish(s,'unconscious',rng);}
  function sanity(s,id,low,high,rng=randomInt){if(s.flags['san_'+id])return;s.flags['san_'+id]=true;const p=s.player,r=check(s,p.san,'理智檢定',1,0,rng);const loss=r.success?low:r.grade===-1?high:dice(1,high,rng);p.san=Math.max(0,p.san-loss);p.sanLost+=loss;note(s,`SAN 損失 ${loss}，目前 ${p.san}。`,loss?'danger':'story');if(!p.san){finish(s,'madness',rng);return;}if(p.sanLost>=Math.floor(p.daySan/5)) {p.indefinite=true;note(s,'當日理智損失達五分之一：不定性瘋狂。需要長期照護；本劇本仍保留可行動的清醒間歇。','danger');}if(loss>=5&&check(s,p.attrs.INT,'理解眼前恐怖',1,0,rng).success){p.insaneUntil=s.time+dice(1,10,rng)*60;const lapse=dice(1,10,rng);passTime(s,lapse);note(s,`你躲進門後，失去 ${lapse} 分鐘。直到暫時瘋狂結束，專注檢定受一顆懲罰骰（本作簡化發作效果）。`,'danger');}}
  function passTime(s,minutes){s.time+=minutes;if(s.time>=1080&&!s.flags.dusk){s.flags.dusk=true;note(s,'傍晚六點。燈塔開始試照，海面回應了第一聲呼喚。','event');}if(s.time>=1260&&!s.flags.sealed){s.flags.sealed=true;note(s,'晚間九點。正門封鎖；泵房的地下通道仍能通行。','event');}if(s.time>=1380&&!s.flags.night){s.flags.night=true;note(s,'晚間十一點。塔內傳來潮濕的腳步聲。','event');}if(s.time>=1440&&!s.flags.lightOff&&!s.flags.disaster){s.flags.disaster=true;note(s,'午夜。海面直立起來。入口已經穩定——現在只能帶著能救的人逃出去。','danger');}}
  const ACTIONS = [
    {id:'room',place:'hotel',title:'搜查妹妹的房間',hint:'拿取明顯留下的資料',time:30,once:true,effect:s=>{clue(s,'receipt');clue(s,'sketch');note(s,'床鋪沒睡過。桌上放著診所收據與燈塔草圖，像是刻意留給你的。');}},
    {id:'photo',place:'hotel',title:'檢查照片的光線',skill:'spot',time:20,once:true,fail:'你看不出異常，仍保留原照片。',push:'過度拆開暗盒會割傷手指（1D3傷害）。',effect:s=>{clue(s,'photo');note(s,'塔內沒有燈泡。光是從玻璃裡面長出來的。');}},
    {id:'lin',place:'hotel',title:'與林秋蓉談談若棠',time:20,once:true,effect:s=>{clue(s,'testimony');note(s,'「去找巡警陳柏舟。他昨晚在码頭值勤。」她垂下眼睛。');}},
    {id:'register',place:'clinic',title:'向蘇瑾詢問失蹤工人',time:30,once:true,effect:s=>{meet(s,'su');clue(s,'register');note(s,'你提起若棠，護士終於把名冊交給你。「別讓許醫師知道。」');}},
    {id:'forgery',place:'clinic',title:'核對轉院病歷',skill:'medicine',alternate:'spot',time:30,once:true,fail:'細節難以辨認，但轉院名冊仍指向燈塔。',push:'醫師會察覺你調查，下一次與他的交涉承受一顆懲罰骰。',effect:s=>{clue(s,'forgery');note(s,'所有簽名都有同一個多餘的筆畫。');}},
    {id:'heal',place:'clinic',title:'請蘇瑾處理傷口',hint:'護士急救75 · 限一次 · HP未滿時',time:15,once:true,available:s=>s.player.hp<s.player.maxHp,effect:(s,rng)=>{meet(s,'su');if(check(s,75,'蘇瑾的急救',1,0,rng).success){s.player.hp=Math.min(s.player.maxHp,s.player.hp+1);note(s,'傷口已包紮，回復1 HP。');}}},
    {id:'obituary',place:'archive',title:'查閱海難報導',time:60,once:true,effect:s=>{clue(s,'obituary');note(s,'她怕海。照片下方的悼文，寫著許承岳親筆的名字。');}},
    {id:'recording',place:'archive',title:'比對若棠留下的錄音',skill:'library',time:60,once:true,fail:'錄音索引混亂。你記下架號，仍能從其他地方尋找證據。',push:'需要再花60分鐘整理；孤注一擲失敗會損壞錄音帶。',effect:(s,rng)=>{clue(s,'recording');sanity(s,'voice',0,3,rng);note(s,'兩段相隔十年的聲音，連背景的咳嗽都完全相同。');}},
    {id:'police',place:'archive',title:'把證據交給陳柏舟',time:30,once:true,available:s=>s.clues.includes('register')||s.clues.includes('forgery'),effect:s=>{meet(s,'chen');s.flags.police=true;note(s,'巡警收起名冊。「我會處理守衛。你把人帶出來。」');}},
    {id:'plans',place:'pump',title:'閱讀管線與遮光圖紙',time:30,once:true,effect:s=>{clue(s,'plans');s.flags.tunnel=true;note(s,'紅色手輪控制鉛板。圖紙上的地下通道，一路通往燈塔設備間。');}},
    {id:'tools',place:'pump',title:'修好維修扳手',skill:'mechanical',time:20,once:true,fail:'扳手的活動接頭卡死了；塔內仍有固定工具可用。',push:'扳手會折斷，金屬碎片造成1點傷害。',effect:s=>{s.flags.tools=true;s.inventory.push('維修扳手');note(s,'一把好工具，能讓拆卸底座省下一回合。');}},
    {id:'rescue',place:'tower',title:'打開設備間，救出若棠',skill:'locksmith',alternate:'stealth',time:15,once:true,fail:'門鎖沒有鬆動。你可以直接破門，但會驚動塔內的東西。',push:'發出巨響並引來潮痕行者。',available:s=>!s.flags.rescued,effect:s=>rescue(s)},
    {id:'force',place:'tower',title:'用鐵桿撬開設備間',hint:'保證救出若棠；未斷光時引來行者',time:20,once:true,available:s=>!s.flags.rescued,effect:(s,rng)=>{rescue(s);if(!s.flags.lightOff)startCombat(s,rng);}},
    {id:'talk',place:'tower',title:'向許承岳揭露聲音的真相',skill:'persuade',opposed:55,time:15,once:true,push:'他啟動透鏡低語，並召來行者。',fail:'「你不認識她。」他抱緊透鏡。仍可改為操作裝置。',available:s=>!s.flags.lightOff&&!s.flags.disaster&&s.clues.includes('obituary')&&(s.clues.includes('recording')||s.clues.includes('notes')||s.clues.includes('photo')),effect:s=>{meet(s,'xu');s.flags.lightOff=true;note(s,'他問起妻子最害怕的東西。透鏡依然只說：「我在這裡等你。」他慢慢放下遮光板。');}},
    {id:'shutter',place:'tower',title:'轉動紅色手輪，關閉光路',hint:'有圖紙或筆記即可操作 · 不需擲骰',time:10,once:true,available:s=>!s.flags.lightOff&&!s.flags.disaster&&(s.clues.includes('plans')||s.clues.includes('notes')),effect:s=>{s.flags.lightOff=true;note(s,'鉛板落下。海面的聲音突然斷了。樓梯上的濕腳印停在半路。');}},
    {id:'destroy',place:'tower',title:'拆開底座，摧毀透鏡',hint:'需要若棠筆記 · 行者尚在時引發三回合危機',time:5,once:true,available:s=>!s.flags.lightOff&&!s.flags.disaster&&s.clues.includes('notes'),effect:(s,rng)=>{s.flags.breaking=true;if(s.flags.walkerDefeated){s.flags.destroyed=true;s.flags.lightOff=true;note(s,'你拆開底座。最後一片透鏡碎裂時，海面終於恢復波浪。');}else startCombat(s,rng);}},
    {id:'leave',place:'tower',title:'沿防火梯撤離燈塔',hint:'立即結算目前結局',time:10,effect:(s,rng)=>finish(s,s.flags.lightOff?'success':'escape',rng)},
    {id:'ferry',place:'hotel',title:'帶著現有線索搭船離開',hint:'結束調查 · 尚未救援的人將留在霧港',time:30,effect:(s,rng)=>finish(s,s.flags.lightOff?'success':'escape',rng)},
    {id:'rest',place:'hotel',title:'安靜坐下，整理思緒',hint:'經過60分鐘 · 不回復HP或SAN',time:60,effect:s=>note(s,'你把已知線索重新排列。窗外的潮聲越来越近。')}
  ];
  function rescue(s){s.flags.rescued=true;meet(s,'ruo');clue(s,'notes');note(s,'若棠跌進你懷裡，手中仍攥著筆記。「別聽那個聲音。它不是人。」');}
  function startCombat(s,rng){if(s.flags.lightOff||s.flags.walkerDefeated||s.ending)return;meet(s,'walker');sanity(s,'walker',0,6,rng);if(s.ending)return;s.combat={hp:s.flags.walkerHp||15,round:1,progress:s.flags.breakProgress||0,phase:'player'};note(s,'潮痕行者擋住樓梯。你可以戰鬥、逃回泵房，或冒險操作裝置。每次行動後牠會攻擊；你的DEX高於牠，先行動。','danger');}
  function availableActions(s){if(s.ending||s.combat||s.pending)return [];return ACTIONS.filter(a=>a.place===s.place&&(!a.once||!s.flags['done_'+a.id])&&(!a.available||a.available(s)));}
  function focusMod(s){let mod=s.player.insaneUntil>s.time||s.player.indefinite?-1:0;if(s.flags.whisper){mod--;s.flags.whisper=false;}return Math.max(-2,mod);}
  function whisper(s,rng){meet(s,'xu');if(s.flags.whisperUsed)return;s.flags.whisperUsed=true;s.flags.xuMp=13;const a=check(s,75,'透鏡低語：許承岳POW',1,0,rng),d=check(s,s.player.attrs.POW,'抵抗低語：你的POW',1,0,rng);if(a.grade>0&&(a.grade>d.grade||a.grade===d.grade&&75>s.player.attrs.POW)){s.flags.whisper=true;note(s,'透鏡裡傳來若棠的聲音。下一次專注技能檢定承受一顆懲罰骰。','danger');}else note(s,'你認出了聲音裡的破綻，沒有受到影響。');}
  function actionCheck(s,a,rng){let key=a.skill;if(a.alternate&&s.player.skills[a.alternate]>s.player.skills[key])key=a.alternate;const mod=focusMod(s)+(root.Pressure?root.Pressure.penalty(s):0)-(a.id==='talk'&&s.flags.alert?1:0);const r=check(s,s.player.skills[key],SKILLS[key][0],1,mod,rng);if(a.opposed){const d=check(s,a.opposed,'許承岳的心理學',1,0,rng);r.success=r.grade>0&&(r.grade>d.grade||(r.grade===d.grade&&r.skill>d.skill));if(r.grade===d.grade&&r.skill===d.skill){r.success=dice(1,100,rng)<dice(1,100,rng);}note(s,r.success?'你的論述動搖了他。':'他拒絕接受你的解釋。');}return r;}
  function act(s,id,rng=randomInt){if(id==='push'||id==='abandon'){if(!s.pending||s.ending)return s;const a=ACTIONS.find(a=>a.id===s.pending);s.pending=null;if(id==='abandon'){note(s,'你收起工具，決定換個方法。');return s;}passTime(s,a.time);if(s.flags.disaster&&a.id==='talk'){note(s,'入口已穩定，交涉已經太遲。');return s;}const r=actionCheck(s,a,rng);if(r.success)a.effect(s,rng);else{note(s,'孤注一擲失敗：'+a.push,'danger');if(a.id==='photo')hurt(s,dice(1,3,rng),rng);if(a.id==='tools')hurt(s,1,rng);if(a.id==='forgery')s.flags.alert=true;if(a.id==='rescue'||a.id==='talk')startCombat(s,rng);}return s;}
    const a=availableActions(s).find(a=>a.id===id);if(!a)return s;
    if(a.once)s.flags['done_'+id]=true;passTime(s,a.time);
    if(s.flags.disaster&&['shutter','talk','destroy'].includes(id)){note(s,'你趕到裝置前時，入口已經穩定。現在需要撤離。');return s;}
    note(s,a.title,'action');if(a.skill){const r=actionCheck(s,a,rng);if(r.success)a.effect(s,rng);else{note(s,a.fail);if(a.id==='talk')whisper(s,rng);if(a.push&&r.grade!==-1)s.pending=id;else if(r.grade===-1)note(s,'大失敗：本次機會失去，請改用其他方法。','danger');}}else a.effect(s,rng);return s;
  }
  function travel(s,place,rng=randomInt){if(!PLACES[place]||s.ending||s.combat||s.pending||place===s.place)return s;if(place==='tower'&&!s.clues.length)return s;if(place==='tower'&&s.time>=1260&&!s.flags.tunnel&&!s.flags.police){note(s,'正門已封鎖。先到泵房尋找地下通道，或請巡警協助。');return s;}passTime(s,30);s.place=place;note(s,PLACES[place].desc);if(place==='clinic')meet(s,'su');if(place==='tower'){meet(s,'xu');sanity(s,'sea',0,3,rng);if(s.flags.night&&!s.flags.lightOff&&!s.flags.walkerDefeated&&!s.flags.doorClosed&&!s.ending)startCombat(s,rng);}return s;}
  function dbRoll(p,rng,max=false){return p.db<=0?p.db:max?p.db:dice(1,p.db,rng);}
  function enemyAttack(s,rng){if(!s.combat||s.ending)return;const r=check(s,40,'行者重擊',1,0,rng);s.combat.incoming=r.grade;s.combat.phase='defense';note(s,'選擇閃避或反擊。平手閃避成功，平手反擊由攻擊者獲勝。','danger');}
  function nextRound(s){if(!s.combat)return;s.combat.round++;s.combat.phase='player';delete s.combat.incoming;passTime(s,1);}
  function combatAct(s,id,rng=randomInt){const c=s.combat,p=s.player;if(!c||s.ending)return s;
    if(c.phase==='defense'){if(!['dodge','fightback'].includes(id))return s;const dodge=id==='dodge';const r=check(s,p.skills[dodge?'dodge':'brawl'],dodge?'閃避':'反擊',1,0,rng);const outcome=melee(c.incoming,r.grade,dodge?'dodge':'fight');if(outcome==='attacker')hurt(s,c.incoming>=3?9:dice(1,3,rng)+dice(1,6,rng),rng);else if(outcome==='defender'){const d=Math.max(0,dice(1,6,rng)+dbRoll(p,rng)-1);c.hp-=d;note(s,`短棍反擊造成 ${d} 傷害（已扣護甲1）。`);}else note(s,'這次攻擊沒有造成傷害。');if(s.combat&&c.hp<=0){winCombat(s);return s;}nextRound(s);return s;}
    if(!['attack','shoot','escape','cover','operate','break'].includes(id))return s;
    if(id==='shoot'&&p.ammo<=0)return s;
    if(id==='operate'&&(!s.clues.includes('plans')&&!s.clues.includes('notes')||s.flags.disaster))return s;
    if(id==='break'&&(!s.clues.includes('notes')||s.flags.disaster))return s;
    if(id==='escape'){if(check(s,p.skills.dodge,'穿過防火門',1,0,rng).success){s.flags.walkerHp=c.hp;s.flags.doorClosed=true;s.combat=null;s.place='pump';passTime(s,10);note(s,'你衝進通道，扣上防火門。行者被留在另一側。');return s;}}
    if(id==='cover'){s.flags.walkerHp=c.hp;s.flags.doorClosed=true;s.combat=null;s.place='pump';hurt(s,dice(1,3,rng),rng);passTime(s,10);note(s,'你以擦傷為代價擠過狹窄通道，關上厚門。若棠若已獲救，也跟著你撤退。');return s;}
    if(id==='attack'||id==='shoot'){const shot=id==='shoot';if(shot)p.ammo--;const r=check(s,p.skills[shot?'handgun':'brawl'],shot?'左輪手槍':'短棍攻擊',1,0,rng);let hit=r.success;if(!shot){const d=check(s,20,'行者閃避',1,0,rng);hit=melee(r.grade,d.grade,'dodge')==='attacker';}if(hit){const raw=shot?(r.grade>=3?10+dice(1,10,rng):dice(1,10,rng)):(r.grade>=3?6+dbRoll(p,rng,true):dice(1,6,rng)+dbRoll(p,rng));const damage=Math.max(0,raw-1);c.hp-=damage;note(s,`命中，造成 ${damage} 傷害（護甲1）。`);if(c.hp<=0){winCombat(s);return s;}}else note(s,'你的攻擊沒有命中。');}
    if(id==='operate'){if(check(s,Math.max(p.attrs.STR,p.skills.mechanical),'危機中轉動手輪',1,focusMod(s),rng).success){s.flags.lightOff=true;s.combat=null;note(s,'鉛板墜下。行者停住了。現在可以救人或撤離。');return s;}}
    if(id==='break'){c.progress++;s.flags.breakProgress=c.progress;note(s,`拆卸底座：${c.progress}／${s.flags.tools?2:3} 回合。`);if(c.progress>=(s.flags.tools?2:3)){s.flags.destroyed=true;s.flags.lightOff=true;s.combat=null;note(s,'透鏡碎裂，行者化成一灘海水。階梯仍能撤離。');return s;}}
    enemyAttack(s,rng);return s;
  }
  function winCombat(s){s.flags.walkerDefeated=true;s.combat=null;note(s,'行者倒下，鹽殼沿階梯碎裂。光束仍在，儀式尚未停止。');}
  function validateSave(s){
    migrateSkills(s);
    const fail=()=>{throw Error('存檔格式不正確或版本不相容，原進度未被更動。');};
    if(!s||s.version!==VERSION||!Object.hasOwn(PLACES,s.place)||!s.player||!Object.hasOwn(JOBS,s.player.job))fail();
    const p=s.player,integer=(v,min,max)=>Number.isInteger(v)&&v>=min&&v<=max;
    if(typeof p.name!=='string'||p.name.length>24||typeof p.background!=='string'||p.background.length>400)fail();
    if(!p.attrs||!p.skills||!ATTR.every(k=>integer(p.attrs[k],15,99))||!Object.keys(SKILLS).every(k=>integer(p.skills[k],0,99)))fail();
    const d=derived(p.attrs);if(p.maxHp!==d.maxHp||p.maxMp!==d.maxMp||p.db!==d.db||p.build!==d.build||p.mov!==d.mov)fail();
    if(!integer(p.hp,0,p.maxHp)||!integer(p.san,0,99)||!integer(p.mp,0,p.maxMp)||!integer(p.luck,0,99)||!integer(p.ammo,0,6)||!integer(p.daySan,1,99)||!integer(p.sanLost,0,999)||!integer(p.insaneUntil,0,100000)||!integer(s.time,720,100000))fail();
    if(!s.flags||typeof s.flags!=='object'||Array.isArray(s.flags)||Object.keys(s.flags).length>150||Object.keys(s.flags).some(k=>['__proto__','constructor','prototype'].includes(k)||!['boolean','number'].includes(typeof s.flags[k])))fail();
    if(!Array.isArray(s.clues)||s.clues.length>10||!s.clues.every(k=>Object.hasOwn(CLUES,k))||new Set(s.clues).size!==s.clues.length)fail();
    if(!Array.isArray(s.met)||s.met.length>6||!s.met.every(k=>Object.hasOwn(NPCS,k))||!Array.isArray(s.inventory)||s.inventory.length>30||!s.inventory.every(x=>typeof x==='string'&&x.length<100))fail();
    if(!Array.isArray(s.log)||s.log.length>160||!s.log.every(x=>x&&typeof x.text==='string'&&x.text.length<2000&&['story','clue','roll','ending','danger','event','action'].includes(x.type)))fail();
    if(!Array.isArray(s.rolls)||s.rolls.length>100||!s.rolls.every(r=>r&&typeof r.label==='string'&&r.label.length<100&&integer(r.value,1,100)&&integer(r.skill,0,100)&&integer(r.target,0,100)&&integer(r.grade,-1,4)&&integer(r.mod,-2,2)&&integer(r.unit,0,9)&&integer(r.difficulty,1,3)&&typeof r.success==='boolean'&&Array.isArray(r.tens)&&r.tens.length===1+Math.abs(r.mod)&&r.tens.every(v=>integer(v,0,9))&&Array.isArray(r.candidates)&&r.candidates.length===r.tens.length&&r.candidates.every(v=>integer(v,1,100))))fail();
    if(s.pending!==null&&!ACTIONS.some(a=>a.id===s.pending&&a.skill))fail();
    if(s.combat&&(!integer(s.combat.hp,1,15)||!integer(s.combat.round,1,10000)||!integer(s.combat.progress,0,3)||!['player','defense'].includes(s.combat.phase)||(s.combat.phase==='defense'&&!integer(s.combat.incoming,-1,4))))fail();
    if(s.ending&&(!['death','madness','escape','unconscious','success'].includes(s.ending.type)||typeof s.ending.title!=='string'||s.ending.title.length>80||typeof s.ending.text!=='string'||s.ending.text.length>2000||!integer(s.ending.reward,0,6)))fail();
    return s;
  }
  root.Fog={finish,startCombat,VERSION,EXTRA_SKILLS,migrateSkills,validPreset,ATTR,PRESETS,SKILLS,JOBS,PLACES,CLUES,NPCS,ACTIONS,attributes,baseSkills,derived,allocate,validateBuild,randomInt,dice,percentile,grade,gradeName,melee,damageState,newGame,availableActions,act,travel,combatAct,validateSave,check,sanity,passTime};
  if(typeof module!=='undefined'&&module.exports)module.exports=root.Fog;
})(typeof globalThis!=='undefined'?globalThis:this);
