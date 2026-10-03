(function(root){'use strict';
 const VERSION=2,ids=['fog',...Object.keys(ChroniclesData.stories)];
 function empty(){return {version:VERSION,active:null,profiles:[]};}
 function validateProfile(p){if(!p||typeof p.id!=='string'||!/^[a-zA-Z0-9_-]{1,80}$/.test(p.id)||typeof p.name!=='string'||p.name.length<1||p.name.length>32||!p.saves||typeof p.saves!=='object'||Array.isArray(p.saves)||Object.keys(p.saves).some(k=>!ids.includes(k)))throw Error('調查員檔案格式錯誤。');for(const [k,s]of Object.entries(p.saves)){if(k==='fog')Fog.validateSave(s);else{Chronicles.validate(s);if(k!==s.story)throw Error('存檔與劇本不相符。');}}return p;}
 function validate(h){if(!h||h.version!==VERSION||!Array.isArray(h.profiles)||h.profiles.length>20)throw Error('檔案室版本或格式錯誤。');h.profiles.forEach(validateProfile);if(new Set(h.profiles.map(p=>p.id)).size!==h.profiles.length)throw Error('調查員代碼重複。');if(h.active!==null&&!h.profiles.some(p=>p.id===h.active))throw Error('目前調查員不存在。');return h;}
 function create(h,name,id){name=String(name).trim();if(!name||name.length>32)throw Error('請輸入1至32字的調查員檔案名稱。');if(h.profiles.length>=20)throw Error('最多保存20個本機檔案，請先匯出備份。');if(h.profiles.some(p=>p.id===id))throw Error('檔案代碼重複。');const p={id,name,saves:{}};validateProfile(p);h.profiles.push(p);h.active=id;return p;}
 function active(h){return h.profiles.find(p=>p.id===h.active)||null;}
 function previous(h,id){const order=ChroniclesData.stories[id]?.order||0;return Object.values(active(h)?.saves||{}).filter(s=>s.version===2&&s.ending&&ChroniclesData.stories[s.story].order<order);}
 root.HubStore={VERSION,empty,validate,validateProfile,create,active,previous};
})(globalThis);
