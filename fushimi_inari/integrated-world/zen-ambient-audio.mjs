// Procedural rain only. The shared scene ambience continues to own bird calls.
// Context creation happens exclusively in the gesture-facing setEnabled call.
export function createZenAmbientAudio({createContext=()=>{const Context=globalThis.AudioContext??globalThis.webkitAudioContext;return Context?new Context():null;},document:doc=globalThis.document}={}){
 let ctx=null,source=null,filter=null,gain=null,roofFilter=null,roofGain=null,enabled=false,disposed=false,volume=.55,dirty=true;
 let lastRaining,lastSheltered,lastUmbrella,lastBlocked,purrNodes=null,lastPurr=-Infinity,resumeSerial=0,pendingResume=0;
 function stopPurr(){if(!purrNodes)return;const nodes=purrNodes;purrNodes=null;nodes[0].stop();for(const node of nodes)node.disconnect();}
 function resumeContext(){
  if(!ctx||!enabled||disposed||doc?.hidden||ctx.state==='running'||pendingResume)return;
  const attempt=++resumeSerial;pendingResume=attempt;
  const settle=()=>{if(pendingResume===attempt)pendingResume=0;};
  try{const work=ctx.resume?.();if(work?.then)work.then(settle,settle);else settle();}catch{settle();}
 }
 function suspendContext(){
  if(!ctx)return;const pending=!!pendingResume;pendingResume=0;
  if(ctx.state!=='suspended'||pending)ctx.suspend?.()?.catch?.(()=>{});
 }
 function visibility(){
  if(!ctx||!enabled)return;dirty=true;
  if(doc?.hidden){stopPurr();suspendContext();}else resumeContext();
 }
 doc?.addEventListener?.('visibilitychange',visibility);
 function initialize(){
  if(ctx||disposed)return;
  try{
   ctx=createContext();if(!ctx)return;
   const buffer=ctx.createBuffer(1,ctx.sampleRate*4,ctx.sampleRate),samples=buffer.getChannelData(0);
   let seed=1028;for(let i=0;i<samples.length;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;samples[i]=(seed/4294967296-.5)*.6;}
   source=ctx.createBufferSource();source.buffer=buffer;source.loop=true;
   filter=ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=3200;
   gain=ctx.createGain();gain.gain.value=0;
   roofFilter=ctx.createBiquadFilter();roofFilter.type='bandpass';roofFilter.frequency.value=950;roofFilter.Q.value=1.8;
   roofGain=ctx.createGain();roofGain.gain.value=0;
   source.connect(filter).connect(gain).connect(ctx.destination);source.connect(roofFilter).connect(roofGain).connect(ctx.destination);source.start();
  }catch{ctx?.close?.()?.catch?.(()=>{});ctx=null;source=null;}
 }
 return {get enabled(){return enabled;},setEnabled(value,options){
  if(disposed)return false;
  const next=!!value;
  if(next===enabled){
   // Polling and held keys do no work. A real gesture can retry an autoplay-
   // blocked context, while a running or pending context remains untouched.
   if(next&&options?.gesture&&!doc?.hidden){initialize();resumeContext();}
   return enabled&&!!ctx;
  }
  enabled=next;if(enabled){initialize();resumeContext();}else{
   stopPurr();
   if(gain&&ctx)gain.gain.setTargetAtTime(0,ctx.currentTime,.12);if(roofGain&&ctx)roofGain.gain.setTargetAtTime(0,ctx.currentTime,.12);suspendContext();
  }
  dirty=true;return enabled&&!!ctx;
 },setVolume(value){if(Number.isFinite(value)){const next=Math.max(0,Math.min(1,value));if(next===volume)return;volume=next;if(volume===0)stopPurr();dirty=true;}},update(state){
  if(disposed||!ctx||!gain)return;
  if(!dirty&&state.raining===lastRaining&&state.sheltered===lastSheltered&&state.umbrella===lastUmbrella&&state.blocked===lastBlocked)return;
  dirty=false;lastRaining=state.raining;lastSheltered=state.sheltered;lastUmbrella=state.umbrella;lastBlocked=state.blocked;
  if(state.blocked)stopPurr();
  const on=enabled&&state.raining&&!state.blocked&&!doc?.hidden,covered=state.sheltered||state.umbrella;
  filter.frequency.setTargetAtTime(covered?1050:3200,ctx.currentTime,.45);
  gain.gain.setTargetAtTime(on?volume*(covered?.055:.13):0,ctx.currentTime,.5);
  roofGain.gain.setTargetAtTime(on&&covered?volume*(state.sheltered?.027:.020):0,ctx.currentTime,.5);
 },purr(){
  if(disposed||!enabled||!ctx||!source?.buffer||volume<=0||doc?.hidden||lastBlocked||ctx.currentTime-lastPurr<1.8)return false;
  stopPurr();lastPurr=ctx.currentTime;
  const voice=ctx.createBufferSource(),tone=ctx.createBiquadFilter(),envelope=ctx.createGain(),curve=new Float32Array(96),now=ctx.currentTime;
  voice.buffer=source.buffer;if(voice.playbackRate)voice.playbackRate.value=.7;
  tone.type='lowpass';tone.frequency.value=160;tone.Q.value=.8;
  for(let i=0;i<curve.length;i++){const t=i/(curve.length-1);curve[i]=Math.sin(t*Math.PI)*(.62+.38*Math.sin(t*1.45*Math.PI*44))*.30*volume;}
  envelope.gain.setValueCurveAtTime(curve,now,1.45);voice.connect(tone).connect(envelope).connect(ctx.destination);
  const nodes=[voice,tone,envelope];purrNodes=nodes;
  voice.onended=()=>{if(purrNodes===nodes)purrNodes=null;for(const node of nodes)node.disconnect();};voice.start(now);voice.stop(now+1.5);return true;
 },dispose(){
  if(disposed)return;disposed=true;enabled=false;stopPurr();doc?.removeEventListener?.('visibilitychange',visibility);
  source?.stop();source?.disconnect();filter?.disconnect();gain?.disconnect();roofFilter?.disconnect();roofGain?.disconnect();ctx?.close?.()?.catch?.(()=>{});
 }};
}
