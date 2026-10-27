export const JOURNAL_KEY='inari-journey-journal-v1';
export const JOURNEY_STAMPS=Object.freeze([
  {id:'departure',title:'First steps',place:'Keihan · the beginning',mark:'BEGIN',hint:'After leaving the train, open your journal near the station to collect your first mark.',note:'Between thousands of gates, every stop leaves a mark. This little book belongs to your journey.',radius:85},
  {id:'romon',title:'Through the gate',place:'Rōmon',mark:'GATE',hint:'Follow the streets to Omotesando and the great entrance gate.',note:'The streets give way to stone, timber and vermilion. The mountain is ahead.',radius:36},
  {id:'okusha',title:'Beyond the torii',place:'Okusha',mark:'TORII',hint:'Follow either Senbon Torii passage to the upper worship court.',note:'Beyond the close procession of gates, the path opens for a quiet pause.',radius:25},
  {id:'yotsu',title:'Kyoto below',place:'Yotsutsuji',mark:'VIEW',hint:'Continue uphill to the junction and the view over Kyoto.',note:'Take a breath. The city below reveals how far your steps have carried you.',radius:30},
  {id:'summit',title:'At the summit',place:'Ichinomine',mark:'SUMMIT',hint:'Keep following the mountain circuit toward Ichinomine.',note:'The highest page of the journey. There is still a mountain of small things to notice on the way down.',radius:25}
]);
export const JOURNEY_DISCOVERIES=Object.freeze([
  {id:'bell',title:'A gentle ring',hint:'Ring a shrine bell.',note:'A small sound, a moment of stillness.',page:3},
  {id:'water',title:'A moment by the water',hint:'Lift and return a water ladle.',note:'Pause, pour gently, and continue.',page:1},
  {id:'shrine',title:'A quiet encounter',hint:'Interact with a shrine along the mountain path.',note:'You stopped to notice a place along the way.',page:4},
  {id:'panorama',title:'A view to remember',hint:'Save a photo looking toward Kyoto from a mountain viewpoint.',note:'A view over Kyoto, saved from your journey.',page:3}
]);
const stampIds=JOURNEY_STAMPS.map(s=>s.id),discoveryIds=JOURNEY_DISCOVERIES.map(d=>d.id);
const empty=()=>({version:1,stamps:{},discoveries:{}});
function decode(raw){
  try{
    const value=JSON.parse(raw);if(value?.version!==1)return null;
    const state=empty();
    for(const [field,ids] of [['stamps',stampIds],['discoveries',discoveryIds]])
      for(const id of ids){const time=value[field]?.[id];if(Number.isSafeInteger(time)&&time>0)state[field][id]=time;}
    return state;
  }catch{return null;}
}
function merge(a,b){
  if(!b)return a;
  for(const field of ['stamps','discoveries'])for(const [id,time] of Object.entries(b[field]))a[field][id]=Math.min(a[field][id]??time,time);
  return a;
}

export function availableJournalStamps(state,{position,locations={},blocked=false}={}){
  if(blocked||!Array.isArray(position)||position.length!==3||!position.every(Number.isFinite))return [];
  return JOURNEY_STAMPS.filter(stamp=>{
    if(state.stamps[stamp.id]||(stamp.id!=='departure'&&!state.stamps.departure))return false;
    return (locations[stamp.id]??[]).some(point=>point?.length===3&&point.every(Number.isFinite)&&
      Math.abs(position[1]-point[1]-1.7)<=8&&Math.hypot(position[0]-point[0],position[2]-point[2])<=stamp.radius);
  }).map(s=>s.id);
}

const finitePoint=value=>Array.isArray(value)&&value.length===3&&value.every(Number.isFinite);
export function journalStampDistance(id,{position,locations={}}={}){
  if(!finitePoint(position))return null;
  let nearest=Infinity;for(const point of locations[id]??[])if(finitePoint(point))nearest=Math.min(nearest,Math.hypot(position[0]-point[0],position[2]-point[2]));
  return Number.isFinite(nearest)?nearest:null;
}

// Photo metadata comes only from a successfully created PNG. These are local
// experience coordinates, not geographic GPS or a claim about the real view.
export function isJournalPanorama({position,direction,width,height,viewpoints=[]}={}){
  if(!finitePoint(position)||!finitePoint(direction)||!Number.isSafeInteger(width)||width<=0||!Number.isSafeInteger(height)||height<=0||!Array.isArray(viewpoints))return false;
  const length=Math.hypot(direction[0],direction[2]);if(length<1e-8)return false;
  return viewpoints.some(viewpoint=>{
    const point=viewpoint?.point,target=viewpoint?.target;
    if(!finitePoint(point)||!finitePoint(target)||Math.abs(position[1]-point[1]-1.7)>8||Math.hypot(position[0]-point[0],position[2]-point[2])>30)return false;
    const dx=target[0]-point[0],dz=target[2]-point[2],distance=Math.hypot(dx,dz);
    return distance>1e-8&&(direction[0]*dx+direction[2]*dz)/(length*distance)>.5;
  });
}

// Progress and persistence belong here; the viewer only supplies actual position
// and completed interactions. Optional notes never gate the five main stamps.
export function createJourneyJournal({storage=null,now=()=>Date.now()}={}){
  let state=empty(),persistent=!!storage;
  function refresh(){
    if(!persistent)return;
    try{const raw=storage.getItem(JOURNAL_KEY);merge(state,decode(raw));}catch{persistent=false;}
  }
  function save(){try{if(persistent)storage.setItem(JOURNAL_KEY,JSON.stringify(state));}catch{persistent=false;}}
  const timestamp=()=>{const value=now();return Number.isSafeInteger(value)&&value>0?value:Date.now();};
  refresh();
  return {
    snapshot(){return {version:1,stamps:{...state.stamps},discoveries:{...state.discoveries},persistent,complete:stampIds.every(id=>!!state.stamps[id])};},
    available(context){return availableJournalStamps(state,context);},
    collect(id,context){refresh();if(!availableJournalStamps(state,context).includes(id))return false;state.stamps[id]=timestamp();save();return true;},
    discover(id){refresh();if(!state.stamps.departure||!discoveryIds.includes(id)||state.discoveries[id])return false;state.discoveries[id]=timestamp();save();return true;},
    sync(raw){merge(state,decode(raw));}
  };
}

// Match the authored interaction identities, never an ambient sound or a nearby
// object. No scene callbacks are wrapped and repeated actions cannot farm notes.
export function journalDiscoveryForInteraction(data){
  const title=data?.title??'';
  if(title==='Suzu · shrine bell')return 'bell';
  if(title==='Temizu · water ladle')return 'water';
  if(/^(?:Nai-haiden|Tamayama Inari-sha|Kumataka-sha|Okusha|Sannomine|Ninomine|Ichinomine|Cumbre Suprema Ichinomine|Mitsurugi|Gozendani)/i.test(title))return 'shrine';
  return null;
}
