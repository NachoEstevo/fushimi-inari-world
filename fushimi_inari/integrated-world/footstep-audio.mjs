// Fantozzi recordings, CC0; sliced by qubodup. See assets/audio/footsteps/CREDITS.md.
export function createFootstepAudio(ctx,{fetcher=fetch,onStats=()=>{}}={}){
 const buffers=new Map(),active=new Set();let loading=null,index=0,last=-Infinity,failed=0;
 const report=()=>onStats({loaded:buffers.size,failed,plays:index,active:active.size,mode:'recorded stone / sand footsteps'});
 const load=()=>loading??=(async()=>{
  await Promise.all(['Stone','Sand'].flatMap(surface=>['L','R'].flatMap(side=>[1,2,3].map(async n=>{
   const id=`${surface}${side}${n}`;
   try{const response=await fetcher(`../assets/audio/footsteps/Fantozzi-${id}.ogg`);if(!response.ok)throw Error('Footstep HTTP '+response.status);buffers.set(id,await ctx.decodeAudioData(await response.arrayBuffer()));}catch{failed++;}
  }))));report();
 })();
 return {load,stop(){for(const node of active){node.stop();node.disconnect();}active.clear();report();},play(stone){
  const now=ctx.currentTime;if(ctx.state!=='running'||now-last<.37)return false;
  const id=`${stone?'Stone':'Sand'}${index%2?'R':'L'}${Math.floor(index/2)%3+1}`,buffer=buffers.get(id);if(!buffer){load();return false;}
  last=now;index++;const source=ctx.createBufferSource(),gain=ctx.createGain();source.buffer=buffer;gain.gain.value=.18;source.connect(gain);gain.connect(ctx.destination);active.add(source);
  source.onended=()=>{active.delete(source);source.disconnect();gain.disconnect();};source.start(now);report();return true;
 }};
}
