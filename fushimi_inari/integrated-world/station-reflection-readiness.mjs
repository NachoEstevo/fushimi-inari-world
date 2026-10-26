import {createStationReflectionStudy} from './webgpu-station-reflections.mjs';

// One optional station probe, prepared before a quality change completes. Never
// capture on proximity transitions, during arrival, or from the world scene.
export function createStationReflectionReadiness({renderer,scene,station,quality,sun,createProbe=createStationReflectionStudy}){
 let probe=null,preparing=null,disposed=false,active=false;
 const stats={prepared:false,preparing:false,enabled:false,error:null,probe:null};
 const wanted=()=>quality.mode!=='balanced'&&sun.intensity>.5;
 function sync(){
  const next=!disposed&&stats.prepared&&wanted();
  if(probe&&next!==active){probe.setEnabled(next);active=next;}
  stats.enabled=active;stats.probe=probe?.stats??null;
 }
 function prepare(){
  if(disposed||!station?.group||!wanted()) {sync();return Promise.resolve(stats);}
  if(stats.prepared){sync();return Promise.resolve(stats);}
  if(preparing)return preparing;
  stats.preparing=true;stats.error=null;
  preparing=(async()=>{
   const candidate=await createProbe({renderer,scene,station});
   if(disposed){candidate.dispose();return stats;}
   probe=candidate;
   try{
    await candidate.prepareBounded();
    if(!disposed){stats.prepared=true;sync();}
   }catch(error){
    stats.error=String(error);candidate.dispose();if(probe===candidate)probe=null;active=false;
   }
   return stats;
  })().catch(error=>{stats.error=String(error);return stats;}).finally(()=>{stats.preparing=false;preparing=null;});
  return preparing;
 }
 return {stats,prepare,sync,dispose(){if(disposed)return;disposed=true;probe?.dispose();probe=null;active=false;stats.enabled=false;}};
}
