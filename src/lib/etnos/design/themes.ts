// Maps the ETNOS palette families into Photon's existing theme engine.
// Each family contains light (slate) and dark (zinc) modes.
const keys=['25','50','100','200','300','400','500','600','700','800','900','950'];
const rgb=(hex:string)=>hex.match(/\w\w/g)!.map(v=>parseInt(v,16)).join(' ');
const scale=(values:string[])=>Object.fromEntries(keys.map((k,i)=>[k,rgb(values[i])]));
export const etnosThemes=[
 {id:-101,name:'Watch',colors:{
  slate:scale(['fdfcff','f8f7fb','f0eef7','e1ddea','ccc5dc','a59bb7','80748f','62566f','493e55','302837','231d2b','15111c']),
  zinc:{...scale(['fcfaff','f5f3fb','e7e3ee','d6d1e0','bcb5c9','9e96ae','786f89','554c68','363045','232030','14121d','0b0a11']),925:'15 13 23'},
  primary:{100:rgb('c9c2ed'),900:rgb('615087')},other:{black:'0 0 0',white:'255 255 255'}}},
 {id:-102,name:'Honai Evolved',colors:{
  slate:scale(['fdfcf8','f6f3eb','efeadf','e0d8c9','cbc0ab','ac9b80','8b795f','6f5e47','534533','3b3024','292218','17130e']),
  zinc:{...scale(['faf4e8','f0e5cf','e4d6bc','d6c7ac','c0b093','ad9e88','887a68','64566b','393047','221d35','111126','080716']),925:'12 10 29'},
  primary:{100:rgb('e7d5aa'),900:rgb('885035')},other:{black:'0 0 0',white:'255 255 255'}}}
];
