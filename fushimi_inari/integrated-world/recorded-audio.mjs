import {createRecordedSoundEvents} from './recorded-sound-events.mjs?v=suica-2';

export const RECORDED_CLIPS=Object.freeze({
 rolling:{url:'../assets/audio/recorded-rail/odakyu-rail-joints-cassiopeia-sweet.ogg',gain:.12},
 crossing:{url:'../assets/audio/recorded-rail/fushimi-inari-crossing-mrauralization.ogg',gain:.18},
 doors:{url:'../assets/audio/recorded-rail/nambu-205-door-alarm-hitachi-train.ogg',gain:.12},
 announcementJa:{url:'../assets/audio/recorded-station/fushimi-arrival-ja.mp3',gain:.9},
 announcementEn:{url:'../assets/audio/recorded-station/fushimi-arrival-en.mp3',gain:.9},
 gate:{url:'../assets/audio/recorded-station/suica-ticket-gate-hinoki-owo.ogg',gain:.30}
});

// Inspect only a bounded prefix once at decode time. Keep 8 ms before the
// first audible sample so the gate attack stays intact; silent clips stay whole.
export function gateSoundOffset(buffer){
 if(!buffer?.getChannelData||!Number.isFinite(buffer.sampleRate)||buffer.sampleRate<=0)return 0;
 const frames=Math.min(buffer.length,Math.floor(buffer.sampleRate*.5)),channels=[];
 for(let channel=0;channel<buffer.numberOfChannels;channel++)channels.push(buffer.getChannelData(channel));
 let peak=0;for(const samples of channels)for(let i=0;i<frames;i++)peak=Math.max(peak,Math.abs(samples[i]));
 if(peak<.002)return 0;
 const threshold=Math.max(.002,peak*.08);
 for(let i=0;i<frames;i++)if(channels.some(samples=>Math.abs(samples[i])>=threshold))return Math.max(0,i/buffer.sampleRate-.008);
 return 0;
}

// Real field recordings. Different railway sources are credited explicitly;
// Arrival voices are the original Japanese/English files supplied by the user.
export function createRecordedAudio(ctx,{fetcher=fetch,onStats=()=>{}}={}){
 const bus=ctx.createGain();bus.gain.value=.8;bus.connect(ctx.destination);
 const buffers=new Map(),offsets=new Map(),pending=new Map(),failed=new Set(),loops=new Map(),shots=new Set(),wanted=new Map();
 const events=createRecordedSoundEvents(),plays={};let enabled=false,paused=false,generation=0,lastReport=-Infinity,currentPhase='idle',voiceGeneration=0,lastArrivalTime=-1;let voiceSchedule=[],voiceLoading=false,voiceRunStarted=false;
 const report=()=>onStats({enabled,paused,loaded:[...buffers.keys()],loading:[...pending.keys()],failed:[...failed],activeLoops:[...loops.keys()],activeShots:shots.size,plays:{...plays},voiceSchedule,mode:'credited field recordings'});
 async function load(id){
  if(buffers.has(id))return buffers.get(id);if(failed.has(id))return null;
  if(!pending.has(id))pending.set(id,(async()=>{
   try{const response=await fetcher(RECORDED_CLIPS[id].url);if(!response.ok)throw Error(`Audio HTTP ${response.status}`);
    const buffer=await ctx.decodeAudioData(await response.arrayBuffer());buffers.set(id,buffer);if(id==='gate')offsets.set(id,gateSoundOffset(buffer));return buffer;
   }catch{failed.add(id);return null;}finally{pending.delete(id);report();}
  })());
  return pending.get(id);
 }
 function start(id,loop=false,volume=1,when=ctx.currentTime){
  const buffer=buffers.get(id);if(!buffer||!enabled||paused)return null;
  const source=ctx.createBufferSource(),gain=ctx.createGain();source.buffer=buffer;source.loop=loop;
  gain.gain.value=loop?0:RECORDED_CLIPS[id].gain*volume;
  source.connect(gain).connect(bus);const item={source,gain,id};
  source.onended=()=>{shots.delete(item);source.disconnect();gain.disconnect();};
  source.start(when,offsets.get(id)??0);plays[id]=(plays[id]??0)+1;return item;
 }
 function stop(item){item.gain.gain.cancelScheduledValues(ctx.currentTime);item.gain.gain.setTargetAtTime(0,ctx.currentTime,.025);try{item.source.stop(ctx.currentTime+.12);}catch{}}
 function stopAll(){generation++;voiceGeneration++;voiceLoading=false;for(const item of loops.values())stop(item);loops.clear();for(const item of shots)stop(item);shots.clear();wanted.clear();}
 function cancelAnnouncements(){voiceGeneration++;voiceLoading=false;for(const item of shots)if(item.id.startsWith('announcement')){stop(item);shots.delete(item);}}
 async function announce(){
  const token=voiceGeneration,session=generation;voiceLoading=true;
  const [ja,en]=await Promise.all([load('announcementJa'),load('announcementEn')]);
  if(token===voiceGeneration)voiceLoading=false;
  if(!ja||!en||session!==generation||token!==voiceGeneration||!enabled||paused||!['moving','decelerating','stopped'].includes(currentPhase))return;
  const first=ctx.currentTime+.03,second=first+ja.duration+.25;
  voiceSchedule=[{id:'announcementJa',at:first,duration:ja.duration},{id:'announcementEn',at:second,duration:en.duration}];
  for(const {id,at}of voiceSchedule){const item=start(id,false,1,at);if(item)shots.add(item);}report();
 }
 async function oneShot(id){
  const token=generation,requestedAt=ctx.currentTime;await load(id);
  if(token!==generation||ctx.currentTime-requestedAt>1.5||shots.size>=4||(id==='doors'&&currentPhase!=='closing'))return;
  const item=start(id);if(item)shots.add(item);report();
 }
 function loop(id,volume){
  if(volume<=.002)return;wanted.set(id,volume);
  if(!buffers.has(id)){load(id);return;}
  if(!loops.has(id)){const item=start(id,true);if(item)loops.set(id,item);}
  loops.get(id)?.gain.gain.setTargetAtTime(RECORDED_CLIPS[id].gain*volume,ctx.currentTime,.18);
 }
 const attenuation=(position,origin,range)=>Math.max(0,1-Math.hypot(position[0]-origin[0],position[1]-origin[1],position[2]-origin[2])/range)**2;
 return {
  get announcementActive(){return voiceLoading||(enabled&&!voiceRunStarted&&['moving','decelerating','stopped'].includes(currentPhase))||[...shots].some(s=>s.id.startsWith('announcement'));},
  pause(value){paused=!!value;if(paused)stopAll();report();},
  setEnabled(value){enabled=!!value;voiceRunStarted=false;events.reset();if(!enabled)stopAll();else for(const id of ['rolling','doors','announcementJa','announcementEn','gate'])load(id);report();},
  setVolume(value){bus.gain.setTargetAtTime(Math.max(0,Math.min(1,Number(value)||0)),ctx.currentTime,.08);},
  update({position,gate,gateState,arrival,rail,time=0,paused:pause=false}){
   if(paused!==pause){paused=pause;if(paused)stopAll();report();}
   const phase=arrival?.phase??'idle';currentPhase=phase;
   const arrivalTime=arrival?.elapsed??0,restarted=arrivalTime<lastArrivalTime;
   if(['complete','cancelled','idle'].includes(phase)||restarted){cancelAnnouncements();voiceRunStarted=false;}
   lastArrivalTime=arrivalTime;
   if(!voiceRunStarted&&Number.isFinite(arrival?.elapsed)&&['moving','decelerating','stopped'].includes(phase)&&enabled&&!paused){voiceRunStarted=true;announce();}
   if(phase!=='closing')for(const item of shots)if(item.id==='doors'){stop(item);shots.delete(item);}
   for(const event of events.update({position,gate,gateState,arrivalPhase:phase,time,enabled,paused}))oneShot(event);
   for(const item of shots)if(item.id==='gate'&&gate)item.gain.gain.setTargetAtTime(RECORDED_CLIPS.gate.gain*attenuation(position,gate.center,7),ctx.currentTime,.08);
   if(enabled&&!paused&&gate&&attenuation(position,gate.center,16)>.01)load('gate');
   wanted.clear();
   if(enabled&&!paused){
    if(['moving','decelerating'].includes(phase))loop('rolling',phase==='moving'?.8:.45);
    const state=rail?.group.userData.crossingState;
    // The complete field recording is local ambience, not a synchronized bell stem.
    if(state)loop('crossing',attenuation(position,rail.spec.crossing,45)*.65);
    if(state&&['approach','passing','departure'].includes(state.phase)){
     const p=rail.spec.tracks[0].at(state.front-rail.spec.train.length/2).position;
     loop('rolling',Math.max(wanted.get('rolling')??0,attenuation(position,p,70)));
    }
   }
   for(const [id,item]of loops)if(!wanted.has(id)){stop(item);loops.delete(id);}
   if(time-lastReport>1){lastReport=time;report();}
  },
  dispose(){enabled=false;stopAll();bus.disconnect();}
 };
}
