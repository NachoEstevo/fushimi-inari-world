export const ZEN_JOURNEY_KEY='inari-quiet-visit-v2';
export const ZEN_INTENTIONS=Object.freeze([
 {id:'wander',title:'Wander freely',note:'Follow whatever catches your attention.'},
 {id:'views',title:'Collect a few views',note:'Notice the canal, the gates and Kyoto below.'},
 {id:'summit',title:'Walk the mountain circuit',note:'Take the long way, with room to pause.'}
]);
export const ZEN_PHOTO_PROMPTS=Object.freeze([
 {id:'canal-light',place:'canal',title:'A pause by the canal',hint:'Near the canal, frame a quiet view with a field of view of 35–75°.'},
 {id:'gate-rhythm',place:'senbon',title:'A rhythm of gates',hint:'Near Senbon Torii, look along the passage with a field of view of 30–70°.'},
 {id:'kyoto-view',place:'yotsu',title:'Kyoto below',hint:'At Yotsutsuji, look west toward Kyoto with a field of view of 35–80°.'},
 {id:'mountain-pause',place:'summit',title:'A mountain pause',hint:'Near Ichinomine, frame a level view with a field of view of 35–80°.'}
]);
export const ZEN_SKETCHES=Object.freeze([
 {id:'sketch-canal',place:'canal',title:'Two banks, one ribbon',hint:'Find the canal and look across its quiet edges.',note:'A line of water, held between two banks.'},
 {id:'sketch-gates',place:'senbon',title:'The space between',hint:'Look along the torii passage. Notice the gaps as well as the gates.',note:'The spaces made their own repeating pattern.'},
 {id:'sketch-city',place:'yotsu',title:'A city in layers',hint:'At Yotsutsuji, look west and notice the layers of the view.',note:'Near rooftops, distant hills, a little air between them.'}
]);
const moments={aki:['station'],cat:['station'],tea:['tea'],drink:['station','canal','drink'],map:['station','tea'],postcard:['station','postcard'],return:['station']};
const finitePoint=p=>Array.isArray(p)&&p.length===3&&p.every(n=>Number.isFinite(n)&&Math.abs(n)<1e6);
const positive=n=>Number.isSafeInteger(n)&&n>0;
const choices={intention:ZEN_INTENTIONS.map(x=>x.id),weather:['clear','drizzle']};
const blank=()=>({version:2,intention:'wander',weather:'clear',settingsAt:{intention:0,weather:0},moments:{},sketches:{},photoPrompts:{},photos:[],visit:{number:1,startedAt:0,finishedAt:0,updatedAt:0,departed:false}});
const entries=value=>finitePoint(value)?[{point:value}]:Array.isArray(value)?value.map(x=>finitePoint(x)?{point:x}:x):value?.point?[value]:[];
function nearby(position,locations,place,radius=place==='station'?85:place==='drink'?3.6:30){
 return finitePoint(position)&&entries(locations[place]).some(({point}={})=>finitePoint(point)&&Math.abs(position[1]-point[1]-1.7)<=8&&Math.hypot(position[0]-point[0],position[2]-point[2])<=radius);
}
function framing(details,locations,place){
 if(details.mode!=='walk'||!finitePoint(details.direction)||!Number.isFinite(details.fov)||!nearby(details.position,locations,place))return false;
 const [dx,dy,dz]=details.direction,length=Math.hypot(dx,dy,dz),horizontal=Math.hypot(dx,dz);
 if(length<.001||horizontal/length<.65)return false;
 const range=place==='senbon'?[30,70]:place==='canal'?[35,75]:[35,80];
 if(details.fov<range[0]||details.fov>range[1])return false;
 const targets=entries(locations[place]).filter(x=>finitePoint(x?.target));
 if(targets.length)return targets.some(({target})=>{
  const x=target[0]-details.position[0],z=target[2]-details.position[2],n=Math.hypot(x,z);
  return n>.01&&(dx*x+dz*z)/(horizontal*n)>Math.cos(details.fov*Math.PI/360);
 });
 return place!=='yotsu'||dx/horizontal<-.5;
}
function photoRecord(value){
 if(!value||!positive(value.createdAt)||!finitePoint(value.position)||!finitePoint(value.direction)||!['walk','train'].includes(value.mode)||!choices.weather.includes(value.weather)||!Number.isFinite(value.fov)||value.fov<20||value.fov>85||!['width','height'].every(k=>positive(value[k])&&value[k]<=8192))return null;
 const ids=ZEN_PHOTO_PROMPTS.map(x=>x.id);
 return {id:String(value.id??'').slice(0,100),createdAt:value.createdAt,position:[...value.position],direction:[...value.direction],fov:value.fov,width:value.width,height:value.height,mode:value.mode,weather:value.weather,thumbnailId:typeof value.thumbnailId==='string'?value.thumbnailId.slice(0,100):null,promptIds:value.mode==='walk'&&Array.isArray(value.promptIds)?[...new Set(value.promptIds.filter(id=>ids.includes(id)))]:[]};
}
function decode(raw){
 try{
  const data=JSON.parse(raw);if(data?.version!==2)return null;const value=blank();
  for(const [field,ids]of Object.entries(choices))if(ids.includes(data[field])){value[field]=data[field];value.settingsAt[field]=positive(data.settingsAt?.[field])?data.settingsAt[field]:0;}
  for(const [field,ids]of [['moments',Object.keys(moments)],['sketches',ZEN_SKETCHES.map(s=>s.id)],['photoPrompts',ZEN_PHOTO_PROMPTS.map(p=>p.id)]])for(const id of ids)if(positive(data[field]?.[id]))value[field][id]=data[field][id];
  value.photos=(Array.isArray(data.photos)?data.photos:[]).map(photoRecord).filter(p=>p?.id).slice(-12);
  if(positive(data.visit?.number))value.visit.number=Math.min(data.visit.number,9999);
  for(const key of ['startedAt','finishedAt','updatedAt'])if(positive(data.visit?.[key]))value.visit[key]=data.visit[key];
  value.visit.departed=data.visit?.departed===true;
  return value;
 }catch{return null;}
}
function merge(a,b){
 if(!b)return;
 for(const field of Object.keys(choices))if(b.settingsAt[field]>a.settingsAt[field]){a[field]=b[field];a.settingsAt[field]=b.settingsAt[field];}
 for(const field of ['moments','sketches','photoPrompts'])for(const [id,time]of Object.entries(b[field]))a[field][id]=id==='return'?Math.max(a[field][id]??0,time):Math.min(a[field][id]??time,time);
 a.photos=[...new Map([...a.photos,...b.photos].map(p=>[p.id,p])).values()].sort((x,y)=>x.createdAt-y.createdAt||x.id.localeCompare(y.id)).slice(-12);
 if(b.visit.updatedAt>a.visit.updatedAt)a.visit={...b.visit};else if(b.visit.updatedAt===a.visit.updatedAt)a.visit.departed||=b.visit.departed;
}

export function createZenJourney({storage=null,locations={},now=()=>Date.now()}={}){
 let state=blank(),persistent=!!storage,disposed=false,serial=0,lastTime=0,lastRaw=Symbol('unread');const listeners=new Set();
 const timestamp=()=>{const n=now();return lastTime=Math.max(lastTime+1,positive(n)?n:Date.now());};
 function accept(value){merge(state,value);lastTime=Math.max(lastTime,...Object.values(state.settingsAt),...Object.values(state.moments),...Object.values(state.sketches),...Object.values(state.photoPrompts),...state.photos.map(p=>p.createdAt),state.visit.updatedAt);}
 function acceptRaw(raw){if(raw===lastRaw)return false;accept(decode(raw));lastRaw=raw;return true;}
 // Keep the GET before every write/observation for cross-tab concurrency;
 // identical stored bytes need no repeated decode, merge or photo cloning.
 function refresh(){if(persistent)try{acceptRaw(storage.getItem(ZEN_JOURNEY_KEY));}catch{persistent=false;}}
 function snapshot(){
  const photos=state.photos.map(p=>({...p,position:[...p.position],direction:[...p.direction],promptIds:[...p.promptIds]}));
  const readyToReturn=Math.max(state.moments.aki??0,state.photoPrompts['kyoto-view']??0,state.moments.tea??0);
  const stage=!state.moments.aki?0:!state.photoPrompts['kyoto-view']?1:!state.moments.tea?2:!(state.moments.return>readyToReturn)?3:4;
  return {version:2,intention:state.intention,weather:state.weather,moments:{...state.moments},sketches:{...state.sketches},photoPrompts:{...state.photoPrompts},photos,story:{stage,complete:stage===4},visit:{...state.visit},persistent};
 }
 function changed(){if(persistent)try{const raw=JSON.stringify(state);storage.setItem(ZEN_JOURNEY_KEY,raw);lastRaw=raw;}catch{persistent=false;}for(const fn of listeners)fn(snapshot());}
 function setting(field,id){if(disposed||!choices[field].includes(id))return false;refresh();if(state[field]===id)return false;state[field]=id;state.settingsAt[field]=timestamp();changed();return true;}
 refresh();
 // Existing seals remain owned by the original journal, under its original key.
 const onStorage=event=>{if(disposed||event.key!==ZEN_JOURNEY_KEY||!acceptRaw(event.newValue))return;for(const fn of listeners)fn(snapshot());};
 globalThis.window?.addEventListener?.('storage',onStorage);
 return {snapshot,setIntention:id=>setting('intention',id),setWeather:id=>setting('weather',id),
  canRecordPhoto(details={}){return !disposed&&!!photoRecord({...details,id:'eligibility',createdAt:1});},
  observe(position,{mode}={}){
   if(disposed||mode!=='walk'||!finitePoint(position))return false;refresh();if(state.visit.departed)return false;
   const stations=entries(locations.station).filter(x=>finitePoint(x?.point));
   if(!stations.length||stations.some(({point})=>Math.hypot(position[0]-point[0],position[2]-point[2])<=110))return false;
   state.visit.departed=true;state.visit.updatedAt=timestamp();changed();return true;
  },
  recordMoment(id,details={}){
   if(disposed||details.mode!=='walk'||!finitePoint(details.position))return false;refresh();
   const sketch=ZEN_SKETCHES.find(s=>s.id===id);
   if(sketch){if(details.intent!=='observe'||state.sketches[id]||!framing(details,locations,sketch.place))return false;state.sketches[id]=timestamp();changed();return true;}
   if(!moments[id]||details.intent!=='interact'||!moments[id].some(place=>nearby(details.position,locations,place)))return false;
   if(id==='return'){if(state.visit.finishedAt||state.moments.return>state.visit.startedAt)return false;}
   else if(state.moments[id])return false;
   state.moments[id]=timestamp();changed();return true;
  },
  recordPhoto(details={}){
   if(disposed)return null;refresh();
   const createdAt=timestamp(),record=photoRecord({...details,id:`visit-${createdAt}-${++serial}-${Math.random().toString(36).slice(2,8)}`,createdAt,promptIds:ZEN_PHOTO_PROMPTS.filter(p=>framing(details,locations,p.place)).map(p=>p.id)});
   if(!record)return null;for(const id of record.promptIds)state.photoPrompts[id]??=createdAt;state.photos.push(record);state.photos=state.photos.slice(-12);changed();return {...record,promptIds:[...record.promptIds]};
  },
  finishVisit(){
   if(disposed)return false;refresh();if(state.visit.finishedAt||!(state.moments.return>state.visit.startedAt))return false;
   const time=timestamp();state.visit={...state.visit,finishedAt:time,updatedAt:time};changed();return true;
  },
  beginVisit(){if(disposed)return false;refresh();if(!state.visit.finishedAt)return false;const time=timestamp();state.visit={number:Math.min(9999,state.visit.number+1),startedAt:time,finishedAt:0,updatedAt:time,departed:false};changed();return true;},
  subscribe(fn){if(disposed||typeof fn!=='function')return ()=>{};listeners.add(fn);return ()=>listeners.delete(fn);},
  dispose(){disposed=true;listeners.clear();globalThis.window?.removeEventListener?.('storage',onStorage);}
 };
}
