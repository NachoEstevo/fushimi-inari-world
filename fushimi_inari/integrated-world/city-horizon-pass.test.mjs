import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';

test('isolated horizon stays within its pixel budget at common aspect ratios',{skip:!['180','186','187'].includes(THREE.REVISION)},async()=>{
 const {cityHorizonSize,CITY_HORIZON_MAX_PIXELS}=await import('./city-horizon-pass.mjs');
 for(const [width,height]of [[1920,1080],[3840,2160],[5120,1440],[390,844],[1,1]]){
  const [w,h]=cityHorizonSize(width,height);
  assert.ok(w*h<=CITY_HORIZON_MAX_PIXELS);assert.ok(w<=768);
  assert.ok(w<=width&&h<=height);assert.ok(w>0&&h>0);
 }
});

test('horizon renders only its city root and restores renderer and ownership',{skip:!['180','186','187'].includes(THREE.REVISION)},async()=>{
 const {createCityHorizonPass}=await import('./city-horizon-pass.mjs');
 const {vec4,float}=await import('three/tsl');
 const worldScene=new THREE.Scene(),root=new THREE.Group(),nearWorld=new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshBasicMaterial());
 const source=new THREE.MeshLambertMaterial(),city=new THREE.Mesh(new THREE.BoxGeometry(),source);
 root.add(city);worldScene.add(root,nearWorld);worldScene.fog=new THREE.Fog('#aabbcc',65,95);
 const parentCamera=new THREE.Group(),camera=new THREE.PerspectiveCamera(70,16/9,.1,100);
 parentCamera.position.set(10,0,0);camera.position.set(795,164,-216);parentCamera.add(camera);
 camera.coordinateSystem=THREE.WebGPUCoordinateSystem;camera.updateProjectionMatrix();city.position.set(805,164,-600);
 const target={},clearColor=new THREE.Color('#123456');let activeTarget=target,renders=0,fail=false,width=1920,height=1080;
 const renderer={autoClear:false,
  getDrawingBufferSize:v=>v.set(width,height),getMRT:()=>null,getRenderTarget:()=>activeTarget,getActiveCubeFace:()=>0,getActiveMipmapLevel:()=>0,
  getClearColor:v=>v.copy(clearColor),getClearAlpha:()=>.75,getViewport:v=>v.set(1,2,3,4),getScissor:v=>v.set(5,6,7,8),getScissorTest:()=>true,
  setRenderTarget(value){activeTarget=value;},setClearColor(){},setViewport(){},setScissor(){},setScissorTest(){},
  clear(){},render(scene,view){
   renders++;assert.equal(scene.children.length,1);assert.equal(scene.children[0],root);
   assert.equal(view.coordinateSystem,THREE.WebGPUCoordinateSystem);assert.equal(view.far,6000);assert.equal(view.near,camera.far>=6000?Math.max(.1,camera.near):camera.far);assert.ok(view.near<view.far);
   view.updateMatrixWorld();assert.equal(view.matrixWorld.elements[12],camera.getWorldPosition(new THREE.Vector3()).x);
   assert.ok(city.material.isMeshBasicMaterial);assert.ok(scene.fog.color.equals(worldScene.fog.color));
   if(fail)throw Error('draw failed');
  }};
 const pass=createCityHorizonPass({renderer,worldScene,root,camera});
 try{
  assert.equal(root.parent.name,'Isolated mapped city horizon');assert.equal(worldScene.children.includes(nearWorld),true);
  const foreground=vec4(.2,.4,.6,1),depth=float(1),composition=pass.compose(foreground,depth);
  const mixes=[];composition.traverse(node=>{if(node.isMathNode&&node.method==='mix')mixes.push(node);});
  assert.equal(mixes.length,1,'composition has one foreground/horizon interpolation');
  const [blend]=mixes,maskNodes=[];blend.cNode.traverse(node=>maskNodes.push(node));
  assert.equal(blend.aNode,foreground,'mix first operand is the foreground, never its factor');
  assert.ok(maskNodes.includes(depth),'depth controls the interpolation factor');
  assert.ok(!maskNodes.includes(foreground),'foreground color never supplies the interpolation factor');
  assert.ok(maskNodes.some(node=>node.isSplitNode&&node.components==='w'&&node.node.value===pass.texture),'horizon alpha controls the interpolation factor');
  const horizonNodes=[];blend.bNode.traverse(node=>horizonNodes.push(node));
  assert.ok(horizonNodes.some(node=>node.isSplitNode&&node.components==='xyz'&&node.node.value===pass.texture),'second operand uses the horizon RGB');
  assert.ok(horizonNodes.some(node=>node.isSplitNode&&node.components==='w'&&node.node===foreground),'second operand preserves foreground alpha');
  root.visible=false;pass.render();assert.equal(renders,0);assert.equal(pass.stats.active,false);
  root.visible=true;pass.render();assert.equal(renders,1);assert.equal(pass.stats.active,true);
  assert.equal(activeTarget,target);assert.equal(renderer.autoClear,false);assert.equal(camera.far,100);
  assert.ok(pass.stats.width*pass.stats.height<=262144);
  assert.equal(pass.stats.visibleChunks,1,'source-aligned WebGPU projection includes real city geometry');
  assert.deepEqual(pass.stats.cameraPosition,[805,164,-216]);
  const bindings=pass.stats.bindings;
  for(let i=0;i<5;i++)pass.render();
  assert.equal(renders,1,'standing still reuses the rendered horizon');assert.equal(pass.stats.active,true);
  assert.equal(pass.stats.cachedFrames,5);assert.equal(pass.stats.bindings,bindings,'cached frames do not traverse source meshes');
  camera.position.x+=1;pass.render();assert.equal(renders,2,'camera movement redraws');
  worldScene.fog.color.set('#334455');pass.render();assert.equal(renders,3,'time-of-day colour redraws');
  camera.far=150;camera.updateProjectionMatrix();pass.render();assert.equal(renders,4,'quality clipping change redraws');
  width=1200;height=1600;camera.aspect=width/height;camera.updateProjectionMatrix();pass.render();assert.equal(renders,5,'photo or resize projection redraws');
  root.visible=false;pass.render();assert.equal(pass.stats.active,false);assert.equal(renders,5);
  root.visible=true;pass.render();assert.equal(pass.stats.active,true);assert.equal(renders,5,'return to identical view reuses the target');
  const added=new THREE.Mesh(city.geometry,source);root.add(added);pass.render();
  assert.equal(renders,6);assert.equal(pass.stats.meshes,2);assert.equal(pass.stats.bindings,bindings+1,'new city chunks bind once');
  pass.render();assert.equal(renders,6);assert.equal(pass.stats.bindings,bindings+1);
  camera.rotation.y=Math.PI;pass.render();assert.equal(pass.stats.visibleChunks,0,'turning away updates the isolated camera frustum');
  camera.rotation.y=0;
  camera.far=12000;camera.updateProjectionMatrix();pass.render();assert.equal(pass.stats.near,.1,'debug world far never inverts the isolated camera frustum');
  camera.rotation.y=.1;
  fail=true;assert.throws(()=>pass.render(),/draw failed/);assert.equal(activeTarget,target);assert.equal(renderer.autoClear,false);assert.equal(pass.stats.active,false);
  pass.dispose();pass.dispose();assert.equal(root.parent,worldScene);assert.equal(city.material,source);
 }finally{pass.dispose();source.dispose();city.geometry.dispose();nearWorld.geometry.dispose();nearWorld.material.dispose();}
});


test('fully fogged terrain admits the horizon before clear depth while nearby silhouettes occlude',{skip:!['180','186','187'].includes(THREE.REVISION)},async()=>{
 const {cityHorizonDepthGate}=await import('./city-horizon-pass.mjs');
 for(const coordinateSystem of [THREE.WebGLCoordinateSystem,THREE.WebGPUCoordinateSystem]){
  const camera=new THREE.PerspectiveCamera(70,1.6,.1,100);camera.coordinateSystem=coordinateSystem;camera.updateProjectionMatrix();
  const fog=new THREE.Fog('#ffffff',65,95),gate=cityHorizonDepthGate(camera,fog);
  const depthAt=distance=>{
   const z=new THREE.Vector3(0,0,-distance).applyMatrix4(camera.projectionMatrix).z;
   return coordinateSystem===THREE.WebGPUCoordinateSystem?z:z*.5+.5;
  };
  assert.ok(depthAt(96)<1,'fully fogged world still has nonclear opaque depth');
  assert.ok((depthAt(96)-gate.threshold)*gate.direction>=0,'fully extinguished terrain admits horizon');
  assert.ok((1-gate.threshold)*gate.direction>=0,'clear sky admits horizon');
  for(const distance of [1,64,80,94])assert.ok((depthAt(distance)-gate.threshold)*gate.direction<0,'visible nearby silhouettes remain in front');
  const noFog=cityHorizonDepthGate(camera,null);assert.ok(Math.abs(noFog.threshold-1)<1e-12);
 }
});
test('hidden horizon prewarm compiles actual Basic materials and target without activating a viewport',{skip:!['180','186','187'].includes(THREE.REVISION)},async()=>{
 const {createCityHorizonPass}=await import('./city-horizon-pass.mjs');
 const worldScene=new THREE.Scene(),root=new THREE.Group(),camera=new THREE.PerspectiveCamera(70,1,.1,100);
 const geometry=new THREE.BoxGeometry(),source=new THREE.MeshLambertMaterial();
 root.add(new THREE.Mesh(geometry,source),new THREE.Mesh(geometry,source));root.visible=false;worldScene.add(root);
 const originalTarget={},override=camera.clone();override.position.set(700,150,-200);override.far=150;override.updateProjectionMatrix();
 let currentTarget=originalTarget,release,fail=false,compiles=0,renders=0;
 const renderer={getMRT:()=>null,getRenderTarget:()=>currentTarget,getActiveCubeFace:()=>0,getActiveMipmapLevel:()=>0,
  setRenderTarget(value){currentTarget=value;},render(){renders++;},compileAsync(scope,view,targetScene){
   compiles++;assert.equal(currentTarget.texture.type,THREE.HalfFloatType);
   assert.equal(targetScene.name,'Isolated mapped city horizon');assert.equal(scope.fog.far,6000);
   assert.equal(root.visible,false);assert.equal(root.parent,targetScene);assert.equal(view.near,150);assert.equal(view.far,6000);
   assert.notEqual(view,camera);assert.notEqual(view,override);assert.equal(camera.far,100);assert.equal(override.far,150);
   assert.equal(scope.children.length,2);for(const mesh of scope.children){assert.ok(mesh.material.isMeshBasicMaterial);assert.equal(mesh.frustumCulled,false);}
   if(fail)return Promise.reject(Error('pipeline failed'));
   return new Promise(resolve=>{release=resolve;});
  }};
 const pass=createCityHorizonPass({renderer,worldScene,root,camera});
 try{
  const pending=pass.prepare(override);assert.equal(pending,pass.prepare(override),'concurrent prewarm callers share submission');
  while(!release)await new Promise(resolve=>setTimeout(resolve,0));
  assert.equal(currentTarget,originalTarget,'renderer target restores before asynchronous pipeline completion');
  assert.equal(root.visible,false);assert.equal(renders,0);release();await pending;
  assert.equal(pass.stats.prepareStatus,'ready');assert.equal(compiles,1);
  for(const mesh of root.children)assert.equal(mesh.frustumCulled,true);
  fail=true;await assert.rejects(pass.prepare(override),/pipeline failed/);
  assert.equal(pass.stats.prepareStatus,'failed');assert.equal(currentTarget,originalTarget);assert.equal(root.visible,false);assert.equal(renders,0);
 }finally{pass.dispose();geometry.dispose();source.dispose();}
});
