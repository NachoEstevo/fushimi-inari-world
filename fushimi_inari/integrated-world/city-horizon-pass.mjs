import * as THREE from 'three';
import {texture,uniform,vec4,mix} from 'three/tsl';

export const CITY_HORIZON_FAR=6000;
export const CITY_HORIZON_MAX_PIXELS=262144;
export function cityHorizonSize(width,height){
 const aspect=Math.max(1,width)/Math.max(1,height);
 const scale=Math.min(1,768/Math.max(1,width),Math.sqrt(CITY_HORIZON_MAX_PIXELS/(Math.max(1,width)*Math.max(1,height))));
 const w=Math.max(1,Math.floor(Math.max(1,width)*scale));
 return [w,Math.max(1,Math.min(Math.floor(CITY_HORIZON_MAX_PIXELS/w),Math.floor(w/aspect)))];
}

// Fogged terrain still writes depth. Its fully-extinguished pixels represent
// atmosphere just as clear sky does; they must not occlude a distant horizon.
export function cityHorizonDepthGate(camera,fog){
 const distance=fog?.isFog?Math.max(camera.near,Math.min(camera.far,fog.far)):camera.far;
 const point=new THREE.Vector3(0,0,-distance).applyMatrix4(camera.projectionMatrix);
 const threshold=camera.coordinateSystem===THREE.WebGPUCoordinateSystem?point.z:point.z*.5+.5;
 return {threshold:THREE.MathUtils.clamp(threshold,0,1),direction:camera.reversedDepth?-1:1};
}

// A second view of only mapped city facades, never a second render of the world.
// Linear colour joins the existing post chain before its single output transform.
export function createCityHorizonPass({renderer,worldScene,root,camera}){
 const parent=root.parent,horizonScene=new THREE.Scene(),horizonCamera=new THREE.PerspectiveCamera();
 horizonScene.name='Isolated mapped city horizon';horizonScene.add(root);
 horizonScene.fog=new THREE.Fog(worldScene.fog?.color??'#d7e6e7',600,CITY_HORIZON_FAR);
 const target=new THREE.RenderTarget(1,1,{type:THREE.HalfFloatType,minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter,generateMipmaps:false,depthBuffer:true});
 target.texture.name='Bounded city horizon';
 const frustum=new THREE.Frustum(),projectionView=new THREE.Matrix4(),drawingSize=new THREE.Vector2();
 const lastWorld=new THREE.Matrix4(),lastProjection=new THREE.Matrix4(),lastFog=new THREE.Color();
 const active=uniform(0),depthCutoff=uniform(1),depthDirection=uniform(1),sample=texture(target.texture),replacements=new Map(),bindings=[],boundMeshes=new WeakSet();
 let disposed=false,initialized=false,cached=false,structure=null,lastStructure=null,lastFar=null,lastFogPresent=false;
 const stats={active:false,width:1,height:1,maxPixels:CITY_HORIZON_MAX_PIXELS,far:CITY_HORIZON_FAR,renders:0,cachedFrames:0,bindings:0};
 function bindMaterials(){
  stats.bindings++;
  root.traverse(object=>{
   if(!object.isMesh||boundMeshes.has(object))return;
   const original=object.material;
   if(!replacements.has(original))replacements.set(original,new THREE.MeshBasicMaterial({
    color:original.color,map:original.map,vertexColors:original.vertexColors,side:original.side,
    polygonOffset:original.polygonOffset,polygonOffsetFactor:original.polygonOffsetFactor,polygonOffsetUnits:original.polygonOffsetUnits
   }));
   const material=replacements.get(original);boundMeshes.add(object);object.material=material;bindings.push({object,original,material});
  });
 }
 function render(){
  active.value=0;stats.active=false;
  if(disposed||(!root.visible&&initialized))return;
  // This builder adds one spatial-chunk group once. Observe that shallow
  // structure, not every facade mesh; explicit versions support future rebuilds.
  const nextStructure=root.children.map(child=>`${child.id}:${child.children.length}:${child.geometry?.id??''}`).join('|')+':'+(root.userData.panoramaGeometryVersion??0);
  const structureChanged=nextStructure!==structure;
  if(structureChanged){bindMaterials();structure=nextStructure;}
  const gate=cityHorizonDepthGate(camera,worldScene.fog);
  depthCutoff.value=gate.threshold;depthDirection.value=gate.direction;
  stats.depthCutoff=gate.threshold;stats.reversedDepth=gate.direction<0;
  camera.updateWorldMatrix(true,false);
  const size=renderer.getDrawingBufferSize(drawingSize),[width,height]=cityHorizonSize(size.x,size.y);
  if(width!==stats.width||height!==stats.height){target.setSize(width,height);stats.width=width;stats.height=height;cached=false;}
  const fogPresent=!!worldScene.fog?.color;
  const fogChanged=fogPresent!==lastFogPresent||(fogPresent&&!lastFog.equals(worldScene.fog.color));
  if(root.visible&&cached&&lastStructure===structure&&lastFar===camera.far&&!fogChanged&&lastWorld.equals(camera.matrixWorld)&&lastProjection.equals(camera.projectionMatrix)){
   active.value=1;stats.active=true;stats.cachedFrames++;return;
  }
  horizonCamera.copy(camera,false);
  horizonCamera.matrixAutoUpdate=false;horizonCamera.matrix.copy(camera.matrixWorld);
  // Debug cameras can see farther than this isolated city pass. Their far
  // plane must not become a near plane beyond the horizon's own far plane.
  horizonCamera.near=Math.max(.1,camera.far>=CITY_HORIZON_FAR?camera.near:camera.far);horizonCamera.far=CITY_HORIZON_FAR;
  stats.near=horizonCamera.near;
  horizonCamera.updateProjectionMatrix();
  horizonCamera.updateMatrixWorld(true);horizonScene.updateMatrixWorld(true);
  frustum.setFromProjectionMatrix(projectionView.multiplyMatrices(horizonCamera.projectionMatrix,horizonCamera.matrixWorldInverse),horizonCamera.coordinateSystem,horizonCamera.reversedDepth);
  stats.meshes=bindings.length;stats.visibleChunks=bindings.filter(({object})=>object.visible&&frustum.intersectsObject(object)).length;
  stats.cameraPosition=new THREE.Vector3().setFromMatrixPosition(horizonCamera.matrixWorld).toArray();
  stats.coordinateSystem=horizonCamera.coordinateSystem;
  if(worldScene.fog?.color){
   horizonScene.fog.color.copy(worldScene.fog.color);
   // The unlit distant facade pass still follows daylight energy and tint.
   // Night must not expose a daytime city or invent illuminated windows.
   if(fogChanged||structureChanged)for(const [original,material]of replacements)material.color.copy(original.color).multiply(worldScene.fog.color);
  }else if(fogChanged)for(const [original,material]of replacements)material.color.copy(original.color);
  const previous={target:renderer.getRenderTarget(),face:renderer.getActiveCubeFace(),mip:renderer.getActiveMipmapLevel(),
   autoClear:renderer.autoClear,color:renderer.getClearColor(new THREE.Color()),alpha:renderer.getClearAlpha(),
   viewport:renderer.getViewport(new THREE.Vector4()),scissor:renderer.getScissor(new THREE.Vector4()),scissorTest:renderer.getScissorTest()};
  try{
   renderer.autoClear=true;renderer.setRenderTarget(target);renderer.setScissorTest(false);renderer.setClearColor(0,0);
   // Initialize transparent pixels once even before the first outlook. The
   // post chain samples this texture while inactive, so it must have storage.
   if(!root.visible){renderer.clear();initialized=true;return;}
   cached=false;
   renderer.render(horizonScene,horizonCamera);initialized=true;active.value=1;stats.active=true;stats.renders++;
   lastWorld.copy(camera.matrixWorld);lastProjection.copy(camera.projectionMatrix);lastFar=camera.far;lastStructure=structure;
   lastFogPresent=fogPresent;if(fogPresent)lastFog.copy(worldScene.fog.color);cached=true;
  }finally{
   renderer.autoClear=previous.autoClear;renderer.setClearColor(previous.color,previous.alpha);
   renderer.setRenderTarget(previous.target,previous.face,previous.mip);
   renderer.setViewport(previous.viewport);renderer.setScissor(previous.scissor);renderer.setScissorTest(previous.scissorTest);
  }
 }
 return {render,stats,texture:target.texture,compose(color,depth){
  // Keep all still-visible foreground silhouettes. Fully fogged geometry has
  // finite depth, so testing only clear depth would leave an opaque white wall.
  const weight=depth.sub(depthCutoff).mul(depthDirection).greaterThanEqual(0).select(sample.a.mul(active),0);
  return mix(color,vec4(sample.rgb,color.a),weight);
 },dispose(){
  if(disposed)return;disposed=true;active.value=0;stats.active=false;
  for(const {object,original,material}of bindings)if(object.material===material)object.material=original;
  for(const material of replacements.values())material.dispose();target.dispose();
  if(root.parent===horizonScene){horizonScene.remove(root);parent?.add(root);}
 }};
}
