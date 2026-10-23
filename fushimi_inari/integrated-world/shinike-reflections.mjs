import * as THREE from 'three';

// Capture the real surroundings once per appearance change, never every frame.
// A local cube is an approximation, not a planar or screen-space reflection.
export function captureShinikeEnvironment({scene,renderer,center,forestChunks,overlays}){
  const cube=new THREE.WebGLCubeRenderTarget(128,{type:THREE.HalfFloatType});
  const probe=new THREE.CubeCamera(.1,12000,cube);probe.position.copy(center);
  let pmrem=null;const visibility=new Map();
  const remember=(object,visible)=>{if(!object)return;if(!visibility.has(object))visibility.set(object,object.visible);object.visible=visible;};
  const target=renderer.getRenderTarget(),face=renderer.getActiveCubeFace(),mip=renderer.getActiveMipmapLevel();
  const viewport=renderer.getViewport(new THREE.Vector4()),scissor=renderer.getScissor(new THREE.Vector4()),scissorTest=renderer.getScissorTest();
  const xr=renderer.xr.enabled,shadowAuto=renderer.shadowMap.autoUpdate,shadowNeeds=renderer.shadowMap.needsUpdate,autoClear=renderer.autoClear;
  const setRenderTarget=renderer.setRenderTarget;let pendingOutput=null;
  try{
    pmrem=new THREE.PMREMGenerator(renderer);
    scene.traverse(object=>{
      const materials=Array.isArray(object.material)?object.material:[object.material];
      if(materials.some(m=>m?.userData.waterAppearance)||object.name==='Visitor flashlight'||/^Visitor \d+ · /.test(object.name))remember(object,false);
      if(object.isLOD)for(const level of object.levels)remember(level.object,level.object.visible);
    });
    for(const object of overlays())remember(object,false);
    // These are precisely the forest chunks controlled by the viewer's distance
    // culling, not user-hidden architecture or arbitrary invisible scene nodes.
    for(const {object,bounds} of forestChunks)remember(object,center.distanceTo(bounds.center)<bounds.radius+220);
    renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=false;
    probe.update(renderer,scene);
    // PMREM owns its scratch target but not its output. If a filter draw throws,
    // fromCubemap never returns that output. Track its first bound target during
    // this synchronous conversion so the failed allocation is still released.
    renderer.setRenderTarget=function(renderTarget,...args){
      if(!pendingOutput&&renderTarget&&renderTarget!==target&&renderTarget!==cube)pendingOutput=renderTarget;
      return setRenderTarget.call(this,renderTarget,...args);
    };
    const result=pmrem.fromCubemap(cube.texture);pendingOutput=null;return result;
  }finally{
    renderer.setRenderTarget=setRenderTarget;
    for(const [object,visible] of visibility)object.visible=visible;
    renderer.xr.enabled=xr;renderer.autoClear=autoClear;renderer.shadowMap.autoUpdate=shadowAuto;renderer.shadowMap.needsUpdate=shadowNeeds;
    renderer.setRenderTarget(target,face,mip);renderer.setViewport(viewport);renderer.setScissor(scissor);renderer.setScissorTest(scissorTest);
    pendingOutput?.dispose();cube.dispose();pmrem?.dispose();
  }
}

export function installShinikeReflections({scene,renderer,water,forestChunks=[],overlays=()=>[]},capture=captureShinikeEnvironment){
  const stats={captures:0,resolution:128,facesPerCapture:6,error:null};
  if(!water?.isMesh||water.material?.userData.waterAppearance?.kind!=='shinike')return {stats,update(){},dispose(){}};
  water.updateWorldMatrix(true,false);
  const bounds=new THREE.Box3().setFromObject(water),center=bounds.getCenter(new THREE.Vector3());center.y+=.12;
  const material=water.material,originalMap=material.envMap,originalIntensity=material.envMapIntensity;
  let current=null,attemptedKey=null,disposed=false;
  return {stats,update(position,appearanceKey){
    if(disposed||!position.toArray().every(Number.isFinite)||position.distanceTo(center)>220||attemptedKey===appearanceKey)return;
    attemptedKey=appearanceKey;
    try{
      const next=capture({scene,renderer,center,forestChunks,overlays});
      if(!next?.texture)throw Error('Shin-ike environment capture returned no texture');
      const previous=current;current=next;material.envMap=next.texture;material.envMapIntensity=1.15;material.needsUpdate=true;
      previous?.dispose();stats.captures++;stats.error=null;
    }catch(error){stats.error=String(error.message??error);}
  },dispose(){
    if(disposed)return;disposed=true;
    material.envMap=originalMap;material.envMapIntensity=originalIntensity;material.needsUpdate=true;current?.dispose();current=null;
  }};
}
