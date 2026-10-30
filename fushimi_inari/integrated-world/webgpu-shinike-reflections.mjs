import * as THREE from 'three/webgpu';


// Preserve exactly the same reflection scenery while compiling or capturing.
// The caller may await compilation only under the welcome sheet.
function beginShinikeCaptureState({scene,renderer,center,forestChunks,overlays,resources}){
 const visibility=new Map(),shadows=new Map(),lodLevels=new Map(),remember=(object,visible)=>{if(!object)return;if(!visibility.has(object))visibility.set(object,object.visible);object.visible=visible;};
 const previous={environment:scene.environment,background:scene.background,matrixAuto:scene.matrixWorldAutoUpdate,target:renderer.getRenderTarget(),face:renderer.getActiveCubeFace(),mip:renderer.getActiveMipmapLevel(),autoClear:renderer.autoClear,autoClearColor:renderer.autoClearColor,autoClearDepth:renderer.autoClearDepth,autoClearStencil:renderer.autoClearStencil,xr:renderer.xr.enabled,clearColor:renderer.getClearColor(new THREE.Color()),clearAlpha:renderer.getClearAlpha(),viewport:renderer.getViewport(new THREE.Vector4()),scissor:renderer.getScissor(new THREE.Vector4()),scissorTest:renderer.getScissorTest(),shadowAuto:renderer.shadowMap.autoUpdate,shadowNeeds:renderer.shadowMap.needsUpdate};
 function restore(){
  for(const [object,visible] of visibility)object.visible=visible;
  // Pinned r180 stores hysteresis state separately from level visibility.
  for(const [object,level]of lodLevels)object._currentLevel=level;
  for(const [shadow,state]of shadows){shadow.autoUpdate=state.autoUpdate;shadow.needsUpdate=state.needsUpdate;}
  scene.environment=previous.environment;scene.background=previous.background;scene.matrixWorldAutoUpdate=previous.matrixAuto;
  renderer.xr.enabled=previous.xr;renderer.autoClear=previous.autoClear;renderer.autoClearColor=previous.autoClearColor;renderer.autoClearDepth=previous.autoClearDepth;renderer.autoClearStencil=previous.autoClearStencil;
  renderer.shadowMap.autoUpdate=previous.shadowAuto;renderer.shadowMap.needsUpdate=previous.shadowNeeds;
  renderer.setClearColor(previous.clearColor,previous.clearAlpha);renderer.setRenderTarget(previous.target,previous.face,previous.mip);
  renderer.setViewport(previous.viewport);renderer.setScissor(previous.scissor);renderer.setScissorTest(previous.scissorTest);
 }
 try{
  scene.traverse(object=>{
   // r180's ShadowNode reads the light's flags, not renderer.shadowMap's.
   // Preserve pending walking-view updates while probe-only visibility is active.
   if(object.isLight&&object.shadow&&!shadows.has(object.shadow)){
    const shadow=object.shadow;shadows.set(shadow,{autoUpdate:shadow.autoUpdate,needsUpdate:shadow.needsUpdate});
    shadow.autoUpdate=false;shadow.needsUpdate=false;
   }
   const materials=Array.isArray(object.material)?object.material:[object.material];
   if(object.userData.environmentTransient===true||materials.some(m=>m?.userData.waterAppearance)||object.userData.shinikeSubmergedBacking||object.name==='Visitor flashlight'||/^Visitor \d+ · /.test(object.name))remember(object,false);
   if(object.isLOD){lodLevels.set(object,object.getCurrentLevel());for(const level of object.levels)remember(level.object,level.object.visible);}
  });
  for(const object of overlays())remember(object,false);
  for(const {object,bounds} of forestChunks)remember(object,center.distanceTo(bounds.center)<bounds.radius+220);
  // Water receivers are hidden; retain the stable global environment for scenery.
  // Temporarily removing it invalidates cached r180 standard-material bindings.
  scene.environment=resources?.environment??previous.environment;renderer.xr.enabled=false;renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=false;
  // Only the probe camera changes between the six faces; reuse the same world
  // transforms without taking ownership from a caller that already froze them.
  if(previous.matrixAuto===true)scene.updateMatrixWorld();scene.matrixWorldAutoUpdate=false;
  return restore;
 }catch(error){restore();throw error;}
}

// Bounded cached r187 cube PMREM, retaining two native prefiltered outputs.
export function captureShinikeEnvironment({scene,renderer,center,forestChunks,overlays,resources=null}){
 const size=256,generator=resources?.generator??new THREE.PMREMGenerator(renderer);
 let target=resources?.targets.find(candidate=>candidate!==resources.current);
 if(!target){
  target=new THREE.CubeRenderTarget(size,{type:THREE.HalfFloatType,minFilter:THREE.LinearMipmapLinearFilter,generateMipmaps:false,colorSpace:THREE.LinearSRGBColorSpace,depthBuffer:false});
  for(let mip=size;mip>=8;mip/=2)target.texture.mipmaps.push({width:mip,height:mip});
  target.texture.isPMREMTexture=true;
  resources?.targets.push(target);
 }

 const restore=beginShinikeCaptureState({scene,renderer,center,forestChunks,overlays,resources});
 let completed=false;
 try{
  generator.fromScene(scene,0,.1,12000,{size,position:center,renderTarget:target});
  completed=true;
  if(resources){resources.current=target;return {texture:target.texture,dispose(){}};}
  return target;
 }finally{
  restore();
  if(!completed){target.dispose();if(resources)resources.targets.splice(resources.targets.indexOf(target),1);}
  if(!resources)generator.dispose();
 }
}

export function installShinikeReflections({scene,renderer,water,forestChunks=[],overlays=()=>[],now=()=>performance.now(),clock=()=>performance.now()},capture=null){
  const stats={captures:0,resolution:256,facesPerCapture:6,error:null,captureCpuMs:null,maxCaptureCpuMs:0,captureStartedAt:null};
  if(!water?.isMesh||water.material?.userData.waterAppearance?.kind!=='shinike')return {stats,position:null,async prepare(){return {prepared:false,captures:0,error:null};},update(){},dispose(){}};
  // Keep both the capture graph and its two textures alive while renderer node
  // bindings can still reference them. Only installation disposal releases them.
  const resources=capture?null:{generator:new THREE.PMREMGenerator(renderer),targets:[],current:null,environment:scene.environment};
  const captureEnvironment=capture??(options=>captureShinikeEnvironment({...options,resources}));
  water.updateWorldMatrix(true,false);
  const bounds=new THREE.Box3().setFromObject(water),center=bounds.getCenter(new THREE.Vector3());center.y+=.12;
  const material=water.material,originalMap=material.envMap,originalIntensity=material.envMapIntensity;
  const settledAnchor=new THREE.Vector3(),lastPosition=new THREE.Vector3();
  let current=null,attemptedKey=null,pendingKey=null,keySince=0,settledSince=null,lastTime=null,disposed=false;
  function refresh(){
    try{
      // CPU submission/driver time only; this does not wait for GPU completion.
      const started=clock();stats.captureStartedAt=started;let next;
      try{next=captureEnvironment({scene,renderer,center,forestChunks,overlays});}
      finally{stats.captureCpuMs=Math.max(0,clock()-started);stats.maxCaptureCpuMs=Math.max(stats.maxCaptureCpuMs,stats.captureCpuMs);}
      if(!next?.texture)throw Error('Shin-ike environment capture returned no texture');
      const previous=current,currentMap=material.envMap;
      // r187 resolves changed native cube PMREMs in EnvironmentNode per object.
      // The first custom map changes the graph; equivalent cached cube swaps do
      // not. Older runtimes retain their explicit invalidation contract.
      const sameProbeType=currentMap?.isPMREMTexture===true&&next.texture.isPMREMTexture===true&&
        currentMap.isCubeTexture===true&&next.texture.isCubeTexture===true;
      current=next;material.envMap=next.texture;material.envMapIntensity=1.15;
      if(THREE.REVISION!=='187'||!sameProbeType)material.needsUpdate=true;
      previous?.dispose();stats.captures++;stats.error=null;return true;
    }catch(error){stats.error=String(error.message??error);return false;}
  }
  return {stats,get position(){return center.clone();},async prepare({appearanceKey,settle=async()=>{}}={}){
    const before=stats.captures;
    // Exercise the actual capture graph and both retained output textures while
    // loading owns the renderer. Only a fully settled explicit appearance key
    // can replace its first-visit refresh; unkeyed preparation just warms it.
    for(let i=0;i<2;i++){
      if(disposed)return {prepared:false,captures:stats.captures-before,error:stats.error};
      const success=refresh();await settle();
      if(!success)return {prepared:false,captures:stats.captures-before,error:stats.error};
    }
    const prepared=!disposed;
    if(prepared&&typeof appearanceKey==='string')attemptedKey=appearanceKey;
    return {prepared,captures:stats.captures-before,error:stats.error};
  },update(position,appearanceKey){
    if(disposed||!Number.isFinite(position.x)||!Number.isFinite(position.y)||!Number.isFinite(position.z))return;
    const time=now();
    if(pendingKey!==appearanceKey){pendingKey=appearanceKey;keySince=time;}
    const near=position.distanceTo(center)<=90;
    // Frame-sized walking steps are small: measure speed as well as displacement
    // from the settling anchor so continuous movement cannot unlock a probe.
    const elapsed=lastTime===null?0:time-lastTime;
    const movement=lastTime===null?0:position.distanceTo(lastPosition);
    const moving=movement>0&&(elapsed<=0||movement/(elapsed/1000)>=.1);
    if(!near)settledSince=null;
    else if(settledSince===null||moving||position.distanceTo(settledAnchor)>=.5){
      settledSince=time;settledAnchor.copy(position);
    }
    lastPosition.copy(position);
    lastTime=time;
    if(!near||attemptedKey===appearanceKey||time-keySince<1000||settledSince===null||time-settledSince<300)return;
    // Coalesce changing looks while walking. Keep the previous environment until
    // one stable key can be captured after arrival; a failed key is not retried.
    attemptedKey=appearanceKey;
    refresh();
  },dispose(){
    if(disposed)return;disposed=true;
    material.envMap=originalMap;material.envMapIntensity=originalIntensity;material.needsUpdate=true;current?.dispose();current=null;
    if(resources){for(const target of resources.targets)target.dispose();resources.generator.dispose();resources.targets.length=0;}
  }};
}
