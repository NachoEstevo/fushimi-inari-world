import * as THREE from 'three/webgpu';

// Bounded cached probe. r180 captures the six scene views directly into CubeUV.
export function captureShinikeEnvironment({scene,renderer,center,forestChunks,overlays,resources=null}){
 const size=128,generator=resources?.generator??new THREE.PMREMGenerator(renderer);
 let target=resources?.targets.find(candidate=>candidate!==resources.current);
 if(!target){
  target=new THREE.RenderTarget(3*size,4*size,{type:THREE.HalfFloatType,minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter,generateMipmaps:false,colorSpace:THREE.LinearSRGBColorSpace,depthBuffer:true});
  target.texture.mapping=THREE.CubeUVReflectionMapping;target.texture.isPMREMTexture=true;
  resources?.targets.push(target);
 }
 target.scissorTest=true;
 const visibility=new Map(),shadows=new Map(),remember=(object,visible)=>{if(!object)return;if(!visibility.has(object))visibility.set(object,object.visible);object.visible=visible;};
 const previous={environment:scene.environment,background:scene.background,target:renderer.getRenderTarget(),face:renderer.getActiveCubeFace(),mip:renderer.getActiveMipmapLevel(),autoClear:renderer.autoClear,xr:renderer.xr.enabled,clearColor:renderer.getClearColor(new THREE.Color()),clearAlpha:renderer.getClearAlpha(),viewport:renderer.getViewport(new THREE.Vector4()),scissor:renderer.getScissor(new THREE.Vector4()),scissorTest:renderer.getScissorTest(),shadowAuto:renderer.shadowMap.autoUpdate,shadowNeeds:renderer.shadowMap.needsUpdate};
 let completed=false;
 try{
  scene.traverse(object=>{
   // r180's ShadowNode reads the light's flags, not renderer.shadowMap's.
   // Preserve pending walking-view updates while probe-only visibility is active.
   if(object.isLight&&object.shadow&&!shadows.has(object.shadow)){
    const shadow=object.shadow;shadows.set(shadow,{autoUpdate:shadow.autoUpdate,needsUpdate:shadow.needsUpdate});
    shadow.autoUpdate=false;shadow.needsUpdate=false;
   }
   const materials=Array.isArray(object.material)?object.material:[object.material];
   if(materials.some(m=>m?.userData.waterAppearance)||object.userData.shinikeSubmergedBacking||object.name==='Visitor flashlight'||/^Visitor \d+ · /.test(object.name))remember(object,false);
   if(object.isLOD)for(const level of object.levels)remember(level.object,level.object.visible);
  });
  for(const object of overlays())remember(object,false);
  for(const {object,bounds} of forestChunks)remember(object,center.distanceTo(bounds.center)<bounds.radius+220);
  // Water receivers are hidden; retain the stable global environment for scenery.
  // Temporarily removing it invalidates cached r180 standard-material bindings.
  scene.environment=resources?.environment??previous.environment;renderer.xr.enabled=false;renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=false;
  generator.fromScene(scene,0,.1,12000,{size,position:center,renderTarget:target});
  completed=true;
  if(resources){resources.current=target;return {texture:target.texture,dispose(){}};}
  return target;
 }finally{
  for(const [object,visible] of visibility)object.visible=visible;
  for(const [shadow,state]of shadows){shadow.autoUpdate=state.autoUpdate;shadow.needsUpdate=state.needsUpdate;}
  scene.environment=previous.environment;scene.background=previous.background;
  renderer.xr.enabled=previous.xr;renderer.autoClear=previous.autoClear;
  renderer.shadowMap.autoUpdate=previous.shadowAuto;renderer.shadowMap.needsUpdate=previous.shadowNeeds;
  renderer.setClearColor(previous.clearColor,previous.clearAlpha);renderer.setRenderTarget(previous.target,previous.face,previous.mip);
  renderer.setViewport(previous.viewport);renderer.setScissor(previous.scissor);renderer.setScissorTest(previous.scissorTest);
  if(!completed){target.dispose();if(resources)resources.targets.splice(resources.targets.indexOf(target),1);}
  if(!resources)generator.dispose();
 }
}

export function installShinikeReflections({scene,renderer,water,forestChunks=[],overlays=()=>[],now=()=>performance.now()},capture=null){
  const stats={captures:0,resolution:128,facesPerCapture:6,error:null};
  if(!water?.isMesh||water.material?.userData.waterAppearance?.kind!=='shinike')return {stats,update(){},dispose(){}};
  // Keep both the capture graph and its two textures alive while renderer node
  // bindings can still reference them. Only installation disposal releases them.
  const resources=capture?null:{generator:new THREE.PMREMGenerator(renderer),targets:[],current:null,environment:scene.environment};
  const captureEnvironment=capture??(options=>captureShinikeEnvironment({...options,resources}));
  water.updateWorldMatrix(true,false);
  const bounds=new THREE.Box3().setFromObject(water),center=bounds.getCenter(new THREE.Vector3());center.y+=.12;
  const material=water.material,originalMap=material.envMap,originalIntensity=material.envMapIntensity;
  let current=null,attemptedKey=null,pendingKey=null,keySince=0,settledSince=null,settledAnchor=null,lastPosition=null,lastTime=null,disposed=false;
  return {stats,update(position,appearanceKey){
    if(disposed||!position.toArray().every(Number.isFinite))return;
    const time=now();
    if(pendingKey!==appearanceKey){pendingKey=appearanceKey;keySince=time;}
    const near=position.distanceTo(center)<=90;
    // Frame-sized walking steps are small: measure speed as well as displacement
    // from the settling anchor so continuous movement cannot unlock a probe.
    const elapsed=lastTime===null?0:time-lastTime;
    const movement=lastPosition?position.distanceTo(lastPosition):0;
    const moving=movement>0&&(elapsed<=0||movement/(elapsed/1000)>=.1);
    if(!near){settledSince=null;settledAnchor=null;}
    else if(settledSince===null||moving||position.distanceTo(settledAnchor)>=.5){
      settledSince=time;settledAnchor=position.clone();
    }
    if(lastPosition)lastPosition.copy(position);else lastPosition=position.clone();
    lastTime=time;
    if(!near||attemptedKey===appearanceKey||time-keySince<1000||settledSince===null||time-settledSince<300)return;
    // Coalesce changing looks while walking. Keep the previous environment until
    // one stable key can be captured after arrival; a failed key is not retried.
    attemptedKey=appearanceKey;
    try{
      const next=captureEnvironment({scene,renderer,center,forestChunks,overlays});
      if(!next?.texture)throw Error('Shin-ike environment capture returned no texture');
      const previous=current;current=next;material.envMap=next.texture;material.envMapIntensity=1.15;material.needsUpdate=true;
      previous?.dispose();stats.captures++;stats.error=null;
    }catch(error){stats.error=String(error.message??error);}
  },dispose(){
    if(disposed)return;disposed=true;
    material.envMap=originalMap;material.envMapIntensity=originalIntensity;material.needsUpdate=true;current?.dispose();current=null;
    if(resources){for(const target of resources.targets)target.dispose();resources.generator.dispose();resources.targets.length=0;}
  }};
}
