import {
 Color, CubeUVReflectionMapping, HalfFloatType, LinearFilter,
 LinearSRGBColorSpace, PMREMGenerator, RenderTarget, Vector3
} from 'three/webgpu';

const SIZE=128;

// r180's common PMREMGenerator captures six scene views directly into CubeUV.
// fromSceneAsync only waits for renderer.init(); after init, fromScene is atomic.
// https://github.com/mrdoob/three.js/blob/r180/src/renderers/common/extras/PMREMGenerator.js
// This is a cached local environment probe, not screen-space/planar reflection.
export async function createStationReflectionStudy({renderer,scene,station}){
 if(!renderer||!scene?.isScene||!station?.group)throw new Error('Station reflections require renderer, scene and station.group');
 // Caller initializes its one renderer; r180 rejects a second init().
 const generator=new PMREMGenerator(renderer);
 const originalEnvironment=scene.environment;
 const targets=[];
 let current=null,enabled=false,disposed=false,capturing=false;
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

 function capture(){
  if(disposed)throw new Error('Station reflection study is disposed');
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
   const door=station.spec?.train?.doorPosition;
   const position=door?new Vector3(door[0],door[1]+1.65,door[2]):station.group.getWorldPosition(new Vector3()).add(new Vector3(0,1.65,0));
   const target=targets.find(candidate=>candidate!==current)||makeTarget();
   // The generator's own allocator enables this; its cleanup disables it.
   // Re-enable on every reused target so clearing one face preserves the rest.
   target.scissorTest=true;
   generator.fromScene(scene,0,.1,300,{size:SIZE,position,renderTarget:target});
   current=target;
   stats.captures++;
   stats.excludedMeshes=hidden.length;
   stats.position=position.toArray();
   stats.lastCaptureMs=performance.now()-started;
   return stats;
  }catch(error){stats.failures++;throw error;}
  finally{
   for(const [object,visible]of hidden)object.visible=visible;
   scene.background=previous.background;
   scene.environment=enabled&&current?current.texture:previous.environment;
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
  if(next&&!current)capture();
  enabled=next;
  stats.enabled=enabled;
  scene.environment=enabled?current.texture:originalEnvironment;
 }

 function dispose(){
  if(disposed)return;
  if(current&&scene.environment===current.texture)scene.environment=originalEnvironment;
  disposed=true;enabled=false;stats.enabled=false;
  for(const target of targets)target.dispose();
  generator.dispose();
 }

 return {capture,setEnabled,dispose,stats};
}
