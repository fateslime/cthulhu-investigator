/* Original campaign data helpers. Each scene is authored in its story file. */
(function(root){
 'use strict';
 const stories={};
 function scene(id,act,name,npc,opening,evidence,document,questions,skill,success,failure,choices,extra={}){
  return {id,act,name,npc,opening,evidence,document,questions,skill,success,failure,choices,...extra};
 }
 function npc(id,name,role,description,skills,ability,attrs=[45,55,50,50,55,70,60,70]){
  const a=Object.fromEntries(Fog.ATTR.map((k,i)=>[k,attrs[i]]));return {id,name,role,description,skills,ability,attrs:a,...Fog.derived(a),mp:Math.floor(a.POW/5),san:a.POW};
 }
 root.ChroniclesData={stories,scene,npc};
})(globalThis);
