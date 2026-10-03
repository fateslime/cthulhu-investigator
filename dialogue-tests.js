(function(root){'use strict';root.runDialogueAdapterTests=async function(){const r=[],A=DialogueAdapter,check=(v,name)=>{r.push({name,pass:!!v});if(!v)throw Error(name);};
try{A.setProvider(null);check(!A.enabled,'預設不啟用AI或網路');check((await A.reply({},'hello','離線')).mode==='offline','無供應者回傳離線文字');
const input={npc:{name:'甲'},facts:['已取得資訊']};A.setProvider(async(ctx)=>{ctx.context.facts.push('修改');return 'NPC回覆';});let out=await A.reply(input,'問題','備援');check(out.mode==='ai'&&out.text==='NPC回覆','可插入真正供應者介面');check(input.facts.length===1,'供應者只取得複製上下文');
A.setProvider(async()=>{throw Error('offline');});out=await A.reply(input,'問題','備援');check(out.mode==='offline'&&out.text==='備援','供應者失敗使用離線備援');
A.setProvider(async()=>({hp:999}));check((await A.reply(input,'問題','備援')).mode==='offline','拒絕物件形式的狀態操作');
A.setProvider(async()=>'<script>alert(1)</script>');out=await A.reply(input,'問題','備援');check(typeof out.text==='string','供應者僅輸出文字，UI須用textContent');
let aborted=false;A.setProvider((ctx,{signal})=>new Promise(()=>signal.addEventListener('abort',()=>{aborted=true;})));out=await A.reply(input,'問題','逾時備援',10);check(out.mode==='offline'&&aborted,'逾時中止並回到離線');
A.setProvider(async()=> '字'.repeat(2001));check((await A.reply(input,'問題','備援')).mode==='offline','拒絕過長回覆');
}finally{A.setProvider(null);}return r;};})(globalThis);
