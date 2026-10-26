import {
 Color, CubeUVReflectionMapping, HalfFloatType, LinearFilter,
 LinearSRGBColorSpace, PerspectiveCamera, PMREMGenerator, RenderTarget, Vector3
} from 'three/webgpu';
import {createStationReflectionProxy} from './station-reflection-proxy.mjs';
import {compileAddedGroup} from './scoped-compilation.mjs';

const SIZE=128;

// r180's common PMREMGenerator captures six scene views directly into CubeUV.
// fromSceneAsync only waits for renderer.init(); after init, fromScene is atomic.
// https://github.com/mrdoob/three.js/blob/r180/src/renderers/common/extras/PMREMGenerator.js
// This is a cached local environment probe, not screen-space/planar reflection.
export async function createStationReflectionStudy({renderer,scene,station}){
 if(!renderer||!scene?.isScene||!station?.group)throw new Error('Station reflections require renderer, scene and station.group');
 // Caller initializes its one renderer; r180 rejects a second init().
 const generator=new PMREMGenerator(renderer);
 const targets=[];
 const bindings=new Map();
 let current=null,enabled=false,disposed=false,capturing=false,preparation=null,preparedBounded=false;
 const stats={method:'local scene PMREM',faceSize:SIZE,captures:0,failures:0,enabled:false,excludedMeshes:0,lastCaptureMs:0,position:[]};

 function makeTarget(){
  const target=new RenderTarget(3*SIZE,4*SIZE,{
   type:HalfFloatType,minFilter:LinearFilter,magFilter:LinearFilter,
   generateMipmaps:false,colorSpace:LinearSRGBColorSpace,depthBuffer:true
  });
  target.texture.mapping=CubeUVReflectionMapping;
  target.texture.isPMREMTexture=true;
  target.texture.name='Station local reflection study';
  targets.push(target);
  return target;
 }

 // Explicit receiver tags also cover opaque coated paint. The glass fallback
 // works with the unmodified station palette, whose glass has no material name.
 function receiver(object){
  if(!object.isMesh)return false;
  const materials=Array.isArray(object.material)?object.material:[object.material];
  return object.userData.stationReflectionReceiver===true||materials.some(material=>
   material&&(material.userData.stationReflectionReceiver===true||
    (material.transparent&&material.opacity<.5)||material.transmission>0));
 }

 // Limit the probe to station finishes, leaving the city's shared environment
 // untouched. Save each original map once so disabling restores ownership.
 function applyProbe(){
  const selected=new Set();
  station.group.traverse(object=>{
   if(!receiver(object))return;
   for(const material of Array.isArray(object.material)?object.material:[object.material]){
    if(material && (object.userData.stationReflectionReceiver===true || material.userData?.stationReflectionReceiver===true ||
       (material.transparent&&material.opacity<.5) || material.transmission>0))selected.add(material);
   }
  });
  for(const [material,original] of bindings){
   if(!selected.has(material)){material.envMap=original;material.needsUpdate=true;bindings.delete(material);}
  }
  for(const material of selected){
   if(!bindings.has(material))bindings.set(material,material.envMap);
   const previous=material.envMap;
   material.envMap=current.texture;
   if(!previous)material.needsUpdate=true;
  }
 }
 function restoreProbe(){
  for(const [material,original] of bindings){material.envMap=original;material.needsUpdate=true;}
  bindings.clear();
 }

 function probePosition(){
  // The arrival pose is already on the platform, outside the train shell.
  // Door position is a fallback for other station specifications.
  const platform=station.spec?.arrival?.platformPose?.position;
  if(Array.isArray(platform)&&platform.length===3&&platform.every(Number.isFinite))return new Vector3(...platform);
  const door=station.spec?.train?.doorPosition;
  if(Array.isArray(door)&&door.length===3&&door.every(Number.isFinite))return new Vector3(door[0],door[1]+1.65,door[2]);
  return station.group.getWorldPosition(new Vector3()).add(new Vector3(0,1.65,0));
 }

 // Preparation builds and compiles a small surrogate in stages. Only its
 // final PMREM capture is synchronous; it never renders the world scene.
 // Calling again reuses the cached capture. Enable separately when desired.
 function prepareBounded(options={}){
  if(disposed)return Promise.reject(new Error('Station reflection study is disposed'));
  if(preparedBounded)return Promise.resolve(stats);
  if(preparation)return preparation;
  preparation=(async()=>{
   const proxy=await createStationReflectionProxy(station,options);
   try{
    if(disposed)throw new Error('Station reflection study is disposed');
    if(!proxy.stats.meshes)throw new Error('No eligible station geometry for reflection surrogate');
    const position=probePosition();
    const camera=new PerspectiveCamera(90,1,.1,300);camera.position.copy(position);camera.updateMatrixWorld();
    proxy.scene.updateMatrixWorld(true);
    const target=targets.find(candidate=>candidate!==current)||makeTarget();
    if(typeof renderer.compileAsync==='function'){
     // Pipeline selection includes the render target. Bind the eventual PMREM
     // target only while each compile is submitted, never across an await.
     const compiler={compileAsync(...args){
      if(disposed)throw new Error('Station reflection study is disposed');
      const previous=renderer.getRenderTarget(),face=renderer.getActiveCubeFace(),mip=renderer.getActiveMipmapLevel();
      try{renderer.setRenderTarget(target);return renderer.compileAsync(...args);}
      finally{renderer.setRenderTarget(previous,face,mip);}
     }};
     const compileOptions={batchSize:4};
     if(options.yieldStage)compileOptions.yieldWork=options.yieldStage;
     await compileAddedGroup(compiler,proxy.scene,proxy.scene,camera,compileOptions);
    }
    if(disposed)throw new Error('Station reflection study is disposed');
    if(capturing)throw new Error('Station reflection capture is already active');
    capturing=true;
    const started=performance.now(),previous={autoClear:renderer.autoClear,target:renderer.getRenderTarget(),
     face:renderer.getActiveCubeFace(),mip:renderer.getActiveMipmapLevel(),
     clearColor:renderer.getClearColor(new Color()),clearAlpha:renderer.getClearAlpha(),xr:renderer.xr.enabled};
    try{
     renderer.xr.enabled=false;
     target.scissorTest=true;
     generator.fromScene(proxy.scene,0,.1,300,{size:SIZE,position,renderTarget:target});
     current=target;preparedBounded=true;
     if(enabled)applyProbe();
     Object.assign(stats,{method:'bounded station geometry PMREM',proxy:{...proxy.stats},captures:stats.captures+1,
      position:position.toArray(),lastCaptureMs:performance.now()-started});
    }finally{
     renderer.autoClear=previous.autoClear;renderer.setClearColor(previous.clearColor,previous.clearAlpha);
     renderer.xr.enabled=previous.xr;renderer.setRenderTarget(previous.target,previous.face,previous.mip);capturing=false;
    }
    return stats;
   }catch(error){stats.failures++;throw error;}
   finally{proxy.dispose();}
  })().finally(()=>{preparation=null;});
  return preparation;
 }

 function capture(){
  if(disposed)throw new Error('Station reflection study is disposed');
  if(preparation)throw new Error('Station reflection preparation is active');
  if(capturing)throw new Error('Station reflection capture is already active');
  capturing=true;
  const started=performance.now(),hidden=[];
  const previous={environment:scene.environment,background:scene.background,autoClear:renderer.autoClear,
   target:renderer.getRenderTarget(),face:renderer.getActiveCubeFace(),mip:renderer.getActiveMipmapLevel(),
   clearColor:renderer.getClearColor(new Color()),clearAlpha:renderer.getClearAlpha(),xr:renderer.xr.enabled};
  try{
   station.group.traverse(object=>{if(receiver(object)){hidden.push([object,object.visible]);object.visible=false;}});
   // Never feed the previous probe back into its replacement. Direct scene
   // lighting, real station geometry, ground and current sky supply the capture.
   scene.environment=null;
   renderer.xr.enabled=false;
   const position=probePosition();
   const target=targets.find(candidate=>candidate!==current)||makeTarget();
   // The generator's own allocator enables this; its cleanup disables it.
   // Re-enable on every reused target so clearing one face preserves the rest.
   target.scissorTest=true;
   generator.fromScene(scene,0,.1,300,{size:SIZE,position,renderTarget:target});
   current=target;
   if(enabled)applyProbe();
   stats.captures++;
   stats.excludedMeshes=hidden.length;
   stats.position=position.toArray();
   stats.lastCaptureMs=performance.now()-started;
   return stats;
  }catch(error){stats.failures++;throw error;}
  finally{
   for(const [object,visible]of hidden)object.visible=visible;
   scene.background=previous.background;
   scene.environment=previous.environment;
   renderer.autoClear=previous.autoClear;
   renderer.setClearColor(previous.clearColor,previous.clearAlpha);
   renderer.xr.enabled=previous.xr;
   renderer.setRenderTarget(previous.target,previous.face,previous.mip);
   capturing=false;
  }
 }

 function setEnabled(value){
  if(disposed)return;
  const next=Boolean(value);
  if(next&&!current&&preparation)throw new Error('Wait for bounded reflection preparation before enabling');
  if(next&&!current)capture();
  enabled=next;
  stats.enabled=enabled;
  if(enabled)applyProbe();else restoreProbe();
 }

 function dispose(){
  if(disposed)return;
  restoreProbe();
  disposed=true;enabled=false;stats.enabled=false;
  for(const target of targets)target.dispose();
  generator.dispose();
 }

 return {capture,prepareBounded,setEnabled,dispose,stats};
}
