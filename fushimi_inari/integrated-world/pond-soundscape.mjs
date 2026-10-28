// A real Japanese bamboo/stream recording is local to Shin-ike. It is an
// acoustic interpretation from Tottori, not an on-site Fushimi Inari recording.
export function createPondSoundscape(ctx,{document:doc=globalThis.document,fetcher=globalThis.fetch,
 idle=work=>globalThis.requestIdleCallback?requestIdleCallback(work,{timeout:3000}):setTimeout(work,0),
 cancelIdle=id=>globalThis.cancelIdleCallback?cancelIdleCallback(id):clearTimeout(id),onStats=()=>{}}={}){
 const bus=ctx.createGain();bus.gain.value=0;bus.connect(ctx.destination);
 const birds=doc?.getElementById?.('ambient-birds'),wind=doc?.getElementById?.('ambient-wind');
 let enabled=false,disposed=false,buffer=null,source=null,job=null,request=null,loading=false,failed=false,volume=.55,last=-Infinity,lastLevel=-1;
 const stats={enabled:false,loaded:false,loading:false,active:0,error:null,recording:'Tottori bamboo and stream',loopSeconds:38};
 const report=()=>onStats({...stats});
 function start(){
  if(!enabled||!buffer||source||disposed)return;
  const voice=ctx.createBufferSource();voice.buffer=buffer;voice.loop=true;voice.connect(bus);voice.start();source=voice;stats.active=1;
  voice.onended=()=>{voice.disconnect();if(source===voice){source=null;stats.active=0;}};
 }
 function stop(){if(!source)return;const voice=source;source=null;stats.active=0;voice.stop();voice.disconnect();}
 function prepare(){
  if(!enabled||disposed||buffer||loading||job!==null||failed)return;
  job=idle(async()=>{
   job=null;if(!enabled||disposed)return;loading=true;stats.loading=true;report();
   request=typeof AbortController==='undefined'?null:new AbortController();
   try{
    const response=await fetcher('../assets/audio/walking-score/tottori-bamboo.ogg',request?{signal:request.signal}:undefined);
    if(!response.ok)throw Error(`Forest recording HTTP ${response.status}`);
    const decoded=await ctx.decodeAudioData(await response.arrayBuffer());
    if(disposed)return;buffer=decoded;stats.loaded=true;stats.error=null;start();
   }catch(error){if(!disposed){failed=true;stats.error=String(error.message??error);}}
   finally{loading=false;request=null;if(!disposed){stats.loading=false;report();}}
  });
 }
 return {prepare,setEnabled(value){
  if(disposed)return;enabled=!!value;stats.enabled=enabled;last=-Infinity;
  if(enabled){start();prepare();}else{if(job!==null){cancelIdle(job);job=null;}stop();bus.gain.setValueAtTime(0,ctx.currentTime);lastLevel=0;}report();
 },setVolume(value){if(Number.isFinite(value)){volume=Math.max(0,Math.min(1,value));last=-Infinity;}},
 update(position,night=false,{paused=false}={}){
  if(disposed||!enabled||ctx.currentTime-last<.25)return;last=ctx.currentTime;
  const distance=Math.hypot(position.x-552.64,position.z+110.23),near=Math.max(0,1-distance/110);
  const level=paused||night||birds?.checked===false||wind?.checked===false?0:volume*.24*near*near;
  if(Math.abs(level-lastLevel)>.0001){bus.gain.setTargetAtTime(level,ctx.currentTime,1.2);lastLevel=level;}
 },dispose(){
  if(disposed)return;disposed=true;enabled=false;if(job!==null)cancelIdle(job);request?.abort();stop();buffer=null;bus.disconnect();
 }};
}
