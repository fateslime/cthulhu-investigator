const fs=require('node:fs');
const path=require('node:path');
const files=["engine.js","chronicles-data.js","story-asylum.js","story-train.js","story-tide.js","story-theatre.js","story-recaps.js","chronicles-branches.js","chronicles-engine.js","theatre-engine.js","dialogue-adapter.js","hub-store.js"];
const read=n=>fs.readFileSync(path.join(__dirname,n),'utf8');
const source=files.map(read).join('\n');
(async()=>{
 const rules=new Function(source+'\n'+read('chronicles-tests.js')+'\nreturn ChroniclesTests;')();
 const ui=await require('./portal-smoke.js')(source,read('portal.js'),read('legacy-source.js'));
 const expansion=new Function(source+'\n'+read('expansion-tests.js')+'\nreturn ExpansionTests;')();
 const dialogue=await new Function(read('dialogue-adapter.js')+'\n'+read('dialogue-tests.js')+'\nreturn runDialogueAdapterTests();')();
 const all=[...rules,...ui,...expansion,...dialogue];
 for(const r of all)console.log(`${r.pass?'PASS':'FAIL'} ${r.name}${r.error?' — '+r.error:''}`);
 console.log(`${all.filter(r=>r.pass).length}/${all.length} passed`);
 if(all.some(r=>!r.pass))process.exitCode=1;
})().catch(err=>{console.error(err);process.exitCode=1;});
