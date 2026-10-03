/* This script is injected only by the desktop --self-test development mode. */
async function runRuntimeUiTests(){
 const results=[],assert=(condition,name)=>{results.push({name,pass:!!condition});if(!condition)throw Error(name);};
 const click=selector=>{const el=document.querySelector(selector);assert(!!el,'Control exists: '+selector);el.click();};
 const until=async predicate=>{for(let n=0;n<100;n++){if(predicate())return;await new Promise(r=>setTimeout(r,50));}throw Error('Timed out waiting for rendered content');};
 try{
  document.querySelector('#profile-name').value='桌面驗收';click('[data-ui="create-profile"]');
  assert(document.querySelectorAll('.story-card').length===5,'Five stories visible');
  await until(()=>Array.from(document.querySelectorAll('.story-illustration')).every(x=>x.complete&&x.naturalWidth>0));
  assert(true,'All five illustrations decoded');
  click('[data-story="theatre"]');click('[data-ui="embark"]');click('#hub-close');
  assert(!!document.querySelector('.pressure-panel'),'Crisis panel visible');
  window.scrollTo(0,document.body.scrollHeight);const dock=document.querySelector('.action-dock').getBoundingClientRect();
  assert(dock.top>=0&&dock.bottom<=innerHeight,'Action dock remains in viewport at document bottom');
  click('[data-ui="action-menu"]');assert(document.querySelector('#hub-modal').open,'Action menu opens');
  click('#hub-modal [data-action="examine"]');assert(!document.querySelector('#hub-modal').open,'Taking a branch closes action menu');
  let saved=JSON.parse(localStorage.getItem('cthulhu-archives-v2')).profiles[0].saves.theatre;
  assert(saved.clues.length===1&&saved.pressure.spent===20,'Action from dock actually changes and saves game');
  click('[data-ui="action-menu"]');click('#hub-close');
  saved=JSON.parse(localStorage.getItem('cthulhu-archives-v2')).profiles[0].saves.theatre;
  assert(saved.pressure.spent===20,'Opening and closing action menu consumes no time');
  click('[data-ui="quick-map"]');assert(document.querySelectorAll('#hub-modal [data-travel]').length===4,'Quick map offers the four unlocked locations');click('#hub-close');
  click('[data-ui="journal"]');const body=document.querySelector('#hub-modal-body');body.scrollTop=body.scrollHeight;
  const close=document.querySelector('#hub-close').getBoundingClientRect();assert(close.top>=0&&close.bottom<innerHeight,'Close button remains visible after scrolling modal');click('#hub-close');
  click('[data-ui="library"]');click('[data-story="fog"]');
  await until(()=>document.querySelector('#legacy-game')?.contentWindow?.Fog&&document.querySelector('#legacy-game').contentDocument.querySelector('[data-ui="new"]'));
  const frame=document.querySelector('#legacy-game'),doc=frame.contentDocument;
  doc.querySelector('[data-ui="new"]').click();doc.querySelector('[data-ui="embark"]').click();
  assert(!!doc.querySelector('.action-dock'),'Original story has its own action dock');
  doc.querySelector('[data-ui="action-menu"]').click();assert(doc.querySelector('#modal').open,'Original story action menu opens');
  const action=doc.querySelector('#modal [data-act]');assert(!!action,'Original story actions available in modal');action.click();
  assert(!doc.querySelector('#modal').open,'Original story action closes modal');
  await until(()=>JSON.parse(localStorage.getItem('cthulhu-archives-v2')).profiles[0].saves.fog);
  assert(!!JSON.parse(localStorage.getItem('cthulhu-archives-v2')).profiles[0].saves.fog.pressure,'Original story pressure state syncs to outer profile');
  click('[data-ui="library"]');click('[data-story="theatre"]');
  assert(!!document.querySelector('.pressure-panel'),'Saved campaign resumes with pressure state');
  window.scrollTo(0,0);
 }catch(e){results.push({name:'Runtime UI exception',pass:false,error:e.stack});}
 window.RUNTIME_UI_RESULTS=results;
}
function checkCompactLayout(){
 const out=[],dock=document.querySelector('.action-dock')?.getBoundingClientRect();
 out.push({name:'Compact layout does not overflow horizontally',pass:document.documentElement.scrollWidth<=innerWidth+1});
 out.push({name:'Compact action dock fits viewport',pass:!!dock&&dock.left>=0&&dock.right<=innerWidth+1&&dock.bottom<=innerHeight+1});
 document.querySelector('[data-ui="action-menu"]')?.click();
 const modal=document.querySelector('#hub-modal'),close=document.querySelector('#hub-close').getBoundingClientRect();
 out.push({name:'Compact action menu and close control are usable',pass:modal.open&&close.right<=innerWidth&&close.top>=0});
 return out;
}
