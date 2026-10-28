import {compileSelectedVisuals} from './scoped-compilation.mjs';

// Welcome owns the renderer here. Prime the real pond views and both retained
// targets before a walker can encounter the expensive first PMREM submission.
export async function prepareShinikeForWalking({probe,water,camera,scene,quality,detailChunks,textureStreaming,
 restoreView,settle,getLights,getAppearanceKey,compile=compileSelectedVisuals,now=()=>performance.now()}={}){
 const position=probe.position;
 if(!position)return {prepared:false,captures:0,error:null};
 const probeCamera=camera.clone();probeCamera.position.copy(position);
 try{
  await textureStreaming.prepareAt(position);
  // Use the same spatial owners as walking. Warming from the station's
  // dormant pond groups would omit local buildings, rails and their shaders.
  detailChunks.update(probeCamera,now()/1000,quality.detailScale,true);
  const result=await probe.prepare({settle,appearanceKey:getAppearanceKey?.()});
  if(!result.prepared&&result.captures===0)return result;
  // Assigning the custom environment can change the receiver's node bindings.
  await compile(quality,scene,[water],camera,{batchSize:1,reuseRenderScene:true,includeHiddenRoots:true,getLights});
  await settle();
  return result;
 }finally{restoreView();}
}
