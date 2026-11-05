// Local commerce sounds share the world's AudioContext; no request starts until
// the listener approaches a site or an accepted interaction requests a clip.
const CLIPS={
 select:{gain:.20,cooldown:.09},dispense:{gain:.30,cooldown:.7},
 'bottle-open':{gain:.25,cooldown:.35},'can-open':{gain:.25,cooldown:.35},
 sip:{gain:.20,cooldown:.5},crunch:{gain:.24,cooldown:.5},paper:{gain:.18,cooldown:.15},
 'vending-hum':{gain:.25,range:9},'shop-grill':{gain:.22,range:12}
};
const VENDING=['select','dispense','bottle-open','can-open','sip','paper','vending-hum'];
const SHOP=['paper','crunch','bottle-open','can-open','sip','shop-grill'];
const FOOD=['paper','crunch','sip'];
const EVENT_CLIPS={'vending.select':'select','vending.dispense':'dispense','drink.collect':'paper',
 'drink.sip':'sip','food.collect':'paper'};
const EMPTY=[];

export function createCommerceSoundscape(ctx,{fetcher=globalThis.fetch,
 idle=work=>globalThis.requestIdleCallback?requestIdleCallback(work,{timeout:2000}):setTimeout(work,0),
 cancelIdle=id=>globalThis.cancelIdleCallback?cancelIdleCallback(id):clearTimeout(id),onStats=()=>{}}={}){
 const bus=ctx.createGain();bus.gain.value=.55;bus.connect(ctx.destination);
 const buffers=new Map(),failed=new Set(),inFlight=new Map(),queued=new Set(),queue=[],shots=new Set(),fading=new Set(),lastPlayed=new Map();
 const plays={},clipPlays={};let enabled=false,paused=false,disposed=false,generation=0,job=null,loop=null;
 let listenerX=0,listenerY=0,listenerZ=0,lastScan=-Infinity,lastReport=-Infinity,requestCount=0;
 function report(){onStats({enabled,paused,loaded:buffers.size,loading:inFlight.size,queued:queue.length,failed:failed.size,
  activeShots:shots.size,activeLoop:loop?.id??null,requests:requestCount,plays:{...plays},clipPlays:{...clipPlays}});}
 function schedule(){
  if(disposed||!enabled||paused||job!==null||!queue.length||inFlight.size>=2)return;
  job=idle(()=>{job=null;if(disposed||!enabled||paused)return;
   while(queue.length&&inFlight.size<2){const id=queue.shift();queued.delete(id);load(id);}
  });
 }
 function load(id){
  const controller=typeof AbortController==='undefined'?null:new AbortController(),token=generation,request={controller};
  inFlight.set(id,request);requestCount++;
  (async()=>{
   try{
    const response=await fetcher(`../assets/audio/commerce/${id}.mp3`,controller?{signal:controller.signal}:undefined);
    if(token!==generation||disposed)return;if(!response.ok)throw Error(`Audio HTTP ${response.status}`);
    const data=await response.arrayBuffer();if(token!==generation||disposed)return;
    const buffer=await ctx.decodeAudioData(data);if(token===generation&&!disposed)buffers.set(id,buffer);
   }catch(error){if(token===generation&&!disposed&&error?.name!=='AbortError')failed.add(id);}
   finally{if(inFlight.get(id)===request)inFlight.delete(id);schedule();}
  })();
 }
 function prepare(id,priority=false){
  if(!CLIPS[id]||buffers.has(id)||failed.has(id)||inFlight.has(id)||queued.has(id))return;
  queued.add(id);if(priority)queue.unshift(id);else queue.push(id);schedule();
 }
 function cancelLoads(){
  generation++;if(job!==null){cancelIdle(job);job=null;}queue.length=0;queued.clear();
  for(const request of inFlight.values())request.controller?.abort();
 }
 function stop(item){if(!item)return;try{item.source.stop();}catch{}item.source.disconnect();item.gain.disconnect();shots.delete(item);fading.delete(item);if(loop===item)loop=null;}
 function fadeLoop(item){
  loop=null;fading.add(item);item.gain.gain.cancelScheduledValues(ctx.currentTime);item.gain.gain.setTargetAtTime(0,ctx.currentTime,.03);
  try{item.source.stop(ctx.currentTime+.15);}catch{stop(item);}
 }
 function stopAll(){if(loop)stop(loop);for(const item of shots)stop(item);for(const item of fading)stop(item);}
 function start(id,level,isLoop=false){
  const buffer=buffers.get(id);if(!buffer||!enabled||paused||disposed||ctx.state!=='running')return null;
  const source=ctx.createBufferSource(),gain=ctx.createGain(),item={source,gain,id,level};
  source.buffer=buffer;source.loop=isLoop;gain.gain.value=isLoop?0:level;source.connect(gain).connect(bus);
  if(isLoop)gain.gain.setTargetAtTime(level,ctx.currentTime,.08);
  source.onended=()=>{shots.delete(item);fading.delete(item);if(loop===item)loop=null;source.disconnect();gain.disconnect();};
  if(isLoop)loop=item;else shots.add(item);
  try{source.start(0,isLoop&&buffer.duration?Math.min(buffer.duration*.27,buffer.duration-.001):0);}
  catch{stop(item);return null;}
  clipPlays[id]=(clipPlays[id]??0)+1;return item;
 }
 function changePause(value){
  value=!!value;if(disposed||paused===value)return;paused=value;lastScan=-Infinity;
  if(paused){cancelLoads();stopAll();}report();
 }
 return {
  setEnabled(value){
   if(disposed)return;value=!!value;if(enabled===value)return;enabled=value;lastScan=-Infinity;
   if(!enabled){cancelLoads();stopAll();}report();
  },
  pause:changePause,
  setVolume(value){if(Number.isFinite(value))bus.gain.setTargetAtTime(Math.max(0,Math.min(1,value)),ctx.currentTime,.08);},
  play(event){
   if(!enabled||paused||disposed||!event||!Array.isArray(event.position)||event.position.length<3)return false;
   let levelScale=1,id=EVENT_CLIPS[event.type];
   if(event.type==='drink.open')id=event.kind==='can'?'can-open':'bottle-open';
   if(event.type==='food.bite'){
    if(event.kind==='senbei')id='crunch';else if(event.kind==='soft-serve'){id='sip';levelScale=.4;}
   }
   if(!id)return false;const [x,y,z]=event.position;if(!Number.isFinite(x)||!Number.isFinite(y)||!Number.isFinite(z))return false;
   const distance=Math.hypot(x-listenerX,y-listenerY,z-listenerZ);if(distance>=20)return false;
   if(!buffers.has(id)){prepare(id,true);return false;}
   if(shots.size>=3||ctx.currentTime-(lastPlayed.get(id)??-Infinity)<CLIPS[id].cooldown)return false;
   const attenuation=Math.min(1,Math.max(0,(20-distance)/18))**2;
   if(!start(id,CLIPS[id].gain*attenuation*levelScale))return false;
   lastPlayed.set(id,ctx.currentTime);plays[event.type]=(plays[event.type]??0)+1;return true;
  },
  update(position,sites=EMPTY,{paused:nextPaused=paused}={}){
   if(disposed)return;listenerX=position?.x??0;listenerY=position?.y??0;listenerZ=position?.z??0;changePause(nextPaused);
   if(ctx.currentTime-lastReport>=1){lastReport=ctx.currentTime;report();}
   if(!enabled||paused||ctx.currentTime-lastScan<.25)return;lastScan=ctx.currentTime;
   const locations=Array.isArray(sites)?sites:(sites?.sites??EMPTY);let nearestId=null,nearestLevel=0;
   for(const site of locations){
    const origin=site?.position,kind=site?.kind;if(!Array.isArray(origin)||(kind!=='vending'&&kind!=='shop'&&kind!=='food'))continue;
    const distance=Math.hypot(listenerX-origin[0],listenerY-origin[1],listenerZ-origin[2]);if(!Number.isFinite(distance)||distance>=20)continue;
    const clips=kind==='vending'?VENDING:kind==='shop'?SHOP:FOOD;for(const id of clips)prepare(id);
    if(kind==='food')continue;
    const id=kind==='vending'?'vending-hum':'shop-grill',clip=CLIPS[id],level=clip.gain*Math.max(0,1-distance/clip.range)**2;
    if(level>nearestLevel){nearestId=id;nearestLevel=level;}
   }
   if(loop&&loop.id!==nearestId)fadeLoop(loop);
   if(nearestId&&buffers.has(nearestId)&&!loop)start(nearestId,nearestLevel,true);
   if(loop&&Math.abs(loop.level-nearestLevel)>.0001){loop.level=nearestLevel;loop.gain.gain.setTargetAtTime(nearestLevel,ctx.currentTime,.2);}
  },
  dispose(){if(disposed)return;disposed=true;enabled=false;cancelLoads();stopAll();buffers.clear();bus.disconnect();}
 };
}
