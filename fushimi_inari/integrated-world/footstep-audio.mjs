// Fantozzi recordings, CC0; sliced by qubodup. See assets/audio/footsteps/CREDITS.md.
export const FOOTSTEP_GAIN=.06;
export function createFootstepAudio(ctx,{fetcher=fetch,onStats=()=>{}}={}){
 const buffers=new Map(),active=new Set(),gains=new Set();let loading=null,index=0,last=-Infinity,failed=0,volume=.55;
 const report=()=>onStats({loaded:buffers.size,failed,plays:index,active:active.size,volume,effectiveGain:FOOTSTEP_GAIN*volume,mode:'recorded stone / sand footsteps'});
 const load=()=>loading??=(async()=>{
  await Promise.all(['Stone','Sand'].flatMap(surface=>['L','R'].flatMap(side=>[1,2,3].map(async n=>{
   const id=`${surface}${side}${n}`;
   try{const response=await fetcher(`../assets/audio/footsteps/Fantozzi-${id}.ogg`);if(!response.ok)throw Error('Footstep HTTP '+response.status);buffers.set(id,await ctx.decodeAudioData(await response.arrayBuffer()));}catch{failed++;}
  }))));report();
 })();
 return {load,setVolume(value){volume=Math.max(0,Math.min(1,Number(value)||0));for(const gain of gains)gain.gain.value=FOOTSTEP_GAIN*volume;report();},stop(){for(const node of active){node.stop();node.disconnect();}active.clear();for(const gain of gains)gain.disconnect();gains.clear();report();},play(stone){
  const now=ctx.currentTime;if(ctx.state!=='running'||now-last<.37)return false;
  const id=`${stone?'Stone':'Sand'}${index%2?'R':'L'}${Math.floor(index/2)%3+1}`,buffer=buffers.get(id);if(!buffer){load();return false;}
  last=now;index++;const source=ctx.createBufferSource(),gain=ctx.createGain();source.buffer=buffer;gain.gain.value=FOOTSTEP_GAIN*volume;source.connect(gain);gain.connect(ctx.destination);active.add(source);gains.add(gain);
  source.onended=()=>{active.delete(source);gains.delete(gain);source.disconnect();gain.disconnect();};source.start(now);report();return true;
 }};
}
