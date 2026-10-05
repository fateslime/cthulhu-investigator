/* Real-browser integration coverage, loaded by --self-test only. */
async function runCinematicTests(){
 const out=[],assert=(value,name)=>{out.push({name,pass:!!value});if(!value)throw Error(name);};
 const click=selector=>{const b=document.querySelector(selector);if(!b)throw Error('Missing '+selector);b.click();};
 const wait=async predicate=>{for(let i=0;i<100;i++){if(predicate())return;await new Promise(r=>setTimeout(r,25));}throw Error('UI timeout');};
 const game=()=>JSON.parse(localStorage.getItem('cthulhu-archives-v2')).profiles[0].saves.theatre;
 let fixture;
 try{
  assert(!!document.querySelector('.scene-hero .story-illustration'),'Cinematic scene art rendered');
  assert(document.querySelectorAll('.mission-hud').length===1,'Exactly one vital status HUD');
  assert(!!document.querySelector('.action-rail .choices'),'Actual game choices moved into action rail');
  assert(document.querySelector('.current-objective h2').textContent.includes('聽聽'),'Context-sensitive current objective');
  const beforeSettings=JSON.stringify(game());
  click('[data-cinema="settings"]');click('[data-text-size-choice="largest"]');
  assert(document.documentElement.dataset.textSize==='largest','Largest text setting applies');
  assert(parseFloat(getComputedStyle(document.querySelector('.scene-prose')).fontSize)>=24,'Story text grows to at least 24 CSS pixels');
  click('[data-cinema="contrast"]');assert(document.documentElement.classList.contains('high-contrast'),'High contrast can be enabled');
  const preferences=JSON.parse(localStorage.getItem('cthulhu-display-v1'));assert(preferences.text==='largest'&&preferences.contrast,'Display preferences persist locally');
  click('[data-cinema="contrast"]');click('[data-text-size-choice="standard"]');click('[data-cinema="close-settings"]');
  assert(JSON.stringify(game())===beforeSettings,'Display settings do not change game state or time');
  click('.case-actions [data-ui="tools"]');assert(document.querySelector('#hub-modal').open,'Investigator toolkit opens');
  click('#hub-modal [data-ui="sheet"]');assert(document.querySelector('#hub-modal-body').textContent.includes('角色卡'),'Toolkit commands retain original functionality');click('#hub-close');
  document.body.dispatchEvent(new KeyboardEvent('keydown',{key:'m',bubbles:true}));assert(document.querySelector('#hub-modal').open&&document.querySelector('#hub-modal-body h2').textContent.includes('何處'),'Map keyboard shortcut works');click('#hub-close');
  const rng=Fog.randomInt;try{Fog.randomInt=()=>2;click('.action-rail [data-action="investigate"]');}finally{Fog.randomInt=rng;}
  await wait(()=>document.querySelector('#dice-overlay')?.open);
  assert(document.querySelector('#dice-overlay').classList.contains('is-rolling'),'A real game check starts a dice animation');
  const saved=game(),rolled=saved.rolls.at(-1),afterCheck=JSON.stringify(saved);
  assert(rolled.value===11,'Fixture rolls are the actual committed engine result');
  click('[data-cinema="skip-dice"]');
  assert(Number(document.querySelector('.roll-verdict>strong').textContent)===rolled.value,'Animation reveals the stored D100 value');
  assert(document.querySelectorAll('#dice-overlay .die-item').length===rolled.tens.length+1,'One units die and correct number of tens dice');
  assert(document.querySelector('.roll-verdict').textContent.includes(Fog.gradeName(rolled.grade)),'Success grade agrees with the rule engine');
  click('[data-cinema="next-dice"]');assert(!document.querySelector('#dice-overlay').open,'Continue closes the dice result');
  assert(JSON.stringify(game())===afterCheck,'Skipping animation neither rerolls nor spends time');
  // Isolated presentation fixtures use actual Fog.check, never the persisted player state.
  const build={preset:1,job:'detective',name:'骰子測試',background:'',...Fog.allocate(1,'detective')},s=Fog.newGame(build,()=>2);
  fixture=document.createElement('div');fixture.innerHTML='<div class="workspace"><section class="story-column"><div class="scene-heading"><h1>骰子測試</h1></div></section></div>';fixture.style.display='none';document.body.appendChild(fixture);Cinema.mount(fixture,s);
  const cases=[['00 and 0 means 100',0,[1,1],100],['Bonus selects lowest full result',1,[1,1,5],40],['Penalty selects highest full result',-1,[1,1,5],100],['Two bonus dice share the units die',2,[10,10,5,2],19],['01 is a critical success',0,[2,1],1]];
  for(const [name,mod,values,expected]of cases){const seq=[...values],r=Fog.check(s,50,name,1,mod,()=>seq.shift());Cinema.mount(fixture,s);await wait(()=>document.querySelector('#dice-overlay')?.open);click('[data-cinema="skip-dice"]');assert(r.value===expected&&Number(document.querySelector('.roll-verdict>strong').textContent)===expected,name);assert(document.querySelectorAll('#dice-overlay .die-item.kept').length===2,name+': selected tens plus shared units');click('[data-cinema="next-dice"]');}
  Fog.check(s,50,'first',1,0,()=>2);Fog.check(s,50,'second',1,0,()=>2);Cinema.mount(fixture,s);await wait(()=>document.querySelector('#dice-overlay')?.open);click('[data-cinema="skip-dice"]');assert(document.querySelector('#dice-overlay .dialog-caption').textContent.includes('1 / 2'),'Multiple checks in one action are grouped');click('[data-cinema="next-dice"]');assert(document.querySelector('#dice-overlay .dialog-caption').textContent.includes('2 / 2'),'Next check reveals the second committed result');click('[data-cinema="skip-dice"]');click('[data-cinema="disable-dice"]');
  assert(JSON.parse(localStorage.getItem('cthulhu-display-v1')).dice===false,'Dice animation can be disabled and preference persists');
  Fog.check(s,50,'disabled',1,0,()=>2);Cinema.mount(fixture,s);await new Promise(r=>setTimeout(r,40));assert(!document.querySelector('#dice-overlay').open,'Disabled animation does not interrupt a check');
  assert(s.rolls.at(-1).value===11,'Disabling animation does not disable dice mechanics');
  Cinema.settings();click('[data-cinema="dice"]');click('[data-cinema="close-settings"]');Fog.check(s,50,'enabled again',1,0,()=>2);Cinema.mount(fixture,s);await wait(()=>document.querySelector('#dice-overlay')?.open);assert(true,'Animation can be re-enabled');click('[data-cinema="close-dice"]');
  assert(JSON.stringify(game())===afterCheck,'Presentation fixtures leave persisted investigation unchanged');fixture.remove();fixture=null;
  click('[data-ui="library"]');await wait(()=>document.querySelector('.library-spotlight'));assert(document.querySelectorAll('.story-card').length===5,'Redesigned library retains all five stories');click('[data-story="theatre"]');await new Promise(r=>setTimeout(r,40));assert(!document.querySelector('#dice-overlay').open,'Loading an existing save does not replay old rolls');
  click('[data-ui="library"]');click('[data-story="fog"]');await wait(()=>document.querySelector('#legacy-game')?.contentWindow?.Cinema);
  const original=document.querySelector('#legacy-game').contentWindow;Cinema.settings();click('[data-cinema="dice"]');click('[data-text-size-choice="large"]');await wait(()=>original.document.documentElement.dataset.textSize==='large');original.Cinema.settings();
  assert(original.document.querySelector('[data-cinema="dice"]').getAttribute('aria-pressed')==='false','Outer display settings sync into the original story iframe');
  click('[data-cinema="dice"]');click('[data-text-size-choice="standard"]');await wait(()=>original.document.querySelector('[data-cinema="dice"]').getAttribute('aria-pressed')==='true');assert(original.document.documentElement.dataset.textSize==='standard','Original story reflects re-enabled dice and restored text size');original.document.querySelector('#display-options').close();click('[data-cinema="close-settings"]');click('[data-ui="library"]');click('[data-story="theatre"]');
  window.scrollTo(0,0);
 }catch(e){out.push({name:'Cinematic integration exception',pass:false,error:e.stack});}
 finally{fixture?.remove();document.querySelector('#dice-overlay[open]')?.close();document.querySelector('#display-options[open]')?.close();}
 return out;
}
function checkCinematicLayout(label){
 document.querySelectorAll('dialog[open]').forEach(d=>d.close());window.scrollTo(0,0);
 const out=[],add=(name,pass,detail)=>out.push({name:label+': '+name,pass:!!pass,...(detail?{detail}:{})});
 const viewport=document.documentElement.clientWidth,hud=document.querySelector('.mission-hud').getBoundingClientRect(),header=document.querySelector('.topbar').getBoundingClientRect(),dock=document.querySelector('.action-dock').getBoundingClientRect();
 const expected=label.split('x').map(Number);add('Requested CSS viewport is active',innerWidth===expected[0]&&innerHeight===expected[1]);
 add('No horizontal page overflow',document.documentElement.scrollWidth<=innerWidth+1,{width:innerWidth,height:innerHeight,dpr:devicePixelRatio});
 add('Status HUD is below the header',hud.top>=header.bottom-1&&hud.bottom<innerHeight);
 add('Action dock fits viewport',dock.left>=0&&dock.right<=viewport+1&&dock.bottom<=innerHeight+1);
 add('Health sanity and deadline remain visible',Array.from(document.querySelectorAll('.hud-stat,.hud-deadline')).every(el=>{const b=el.getBoundingClientRect();return b.left>=0&&b.right<=viewport+1&&b.bottom<=hud.bottom+1;}));
 if(innerWidth>800){const rail=document.querySelector('.action-rail');add('Desktop actions available in side panel',!!rail&&getComputedStyle(rail).display!=='none'&&!!rail.querySelector('button[data-action],button[data-pressure]'));}
 return out;
}
function prepareDicePreview(){
 document.querySelectorAll('dialog[open]').forEach(d=>d.close());const build={preset:1,job:'detective',name:'預覽',background:'',...Fog.allocate(1,'detective')},s=Fog.newGame(build,()=>2),host=document.createElement('div');host.hidden=true;host.innerHTML='<div class="workspace"><section class="story-column"></section></div>';document.body.appendChild(host);Cinema.mount(host,s);let values=[1,1,5];Fog.check(s,65,'偵查 · 燈塔窗後的痕跡',1,1,()=>values.shift());Cinema.mount(host,s);
}
