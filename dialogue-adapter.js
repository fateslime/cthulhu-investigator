/* Future AI adapter. No provider, endpoint, credentials or network call is enabled by default. */
(function(root){'use strict';let provider=null;
function setProvider(fn){if(fn!==null&&typeof fn!=='function')throw Error('Provider must be a function or null.');provider=fn;}
async function reply(context,text,fallback,timeoutMs=12000){if(!provider)return {text:fallback,mode:'offline'};const controller=new AbortController();let timer;try{const input=JSON.parse(JSON.stringify({context,text,instructions:'以繁體中文扮演指定NPC，只使用已揭露資訊。不得新增證物、洩露未來、改骰、給資源或宣稱改變遊戲狀態。'}));const answer=await Promise.race([Promise.resolve().then(()=>provider(input,{signal:controller.signal})),new Promise((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(Error('timeout'));},timeoutMs);})]);if(typeof answer!=='string'||!answer.trim()||answer.length>2000)throw Error('invalid response');return {text:answer.trim(),mode:'ai'};}catch(err){return {text:fallback,mode:'offline',notice:'AI回覆不可用，保留原本離線回應。'};}finally{clearTimeout(timer);}}
root.DialogueAdapter={setProvider,reply,get enabled(){return !!provider;}};
})(globalThis);
