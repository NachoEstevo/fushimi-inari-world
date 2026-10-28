import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three/webgpu';
import {captureShinikeEnvironment,installShinikeReflections} from './webgpu-shinike-reflections.mjs';

function fixture(fail=false,matrixAutoUpdate=true){
 const scene=new THREE.Scene(),environment=new THREE.Texture();scene.environment=environment;
 scene.matrixWorldAutoUpdate=matrixAutoUpdate;
 const updateScene=scene.updateMatrixWorld;let matrixUpdates=0;
 scene.updateMatrixWorld=function(...args){matrixUpdates++;return updateScene.apply(this,args);};
 const water=new THREE.Mesh(new THREE.PlaneGeometry(),new THREE.MeshStandardMaterial());water.material.userData.waterAppearance={kind:'shinike'};scene.add(water);
 const mote=new THREE.Sprite(new THREE.SpriteMaterial()),dormantMote=new THREE.Sprite(new THREE.SpriteMaterial()),ordinarySprite=new THREE.Sprite(new THREE.SpriteMaterial());
 mote.userData.environmentTransient=true;dormantMote.userData.environmentTransient=true;dormantMote.visible=false;scene.add(mote,dormantMote,ordinarySprite);
 const sun=new THREE.DirectionalLight(),spot=new THREE.SpotLight(),hidden=new THREE.Group(),point=new THREE.PointLight();
 sun.shadow.autoUpdate=false;sun.shadow.needsUpdate=true;spot.shadow.autoUpdate=true;spot.shadow.needsUpdate=false;
 point.shadow.autoUpdate=false;point.shadow.needsUpdate=false;hidden.visible=false;hidden.add(point);scene.add(sun,spot,hidden);
 sun.target.position.set(5,2,-3);sun.position.set(-60,10,32);
 const lights=[sun,spot,point],states=lights.map(light=>({autoUpdate:light.shadow.autoUpdate,needsUpdate:light.shadow.needsUpdate}));
 const lod=new THREE.LOD(),nearLevel=new THREE.Group(),farLevel=new THREE.Group(),walkingCamera=new THREE.PerspectiveCamera(),probeCamera=new THREE.PerspectiveCamera();
 lod.addLevel(nearLevel,0);lod.addLevel(farLevel,10,.12);scene.add(lod);
 walkingCamera.position.set(20,0,0);walkingCamera.updateMatrixWorld();probeCamera.updateMatrixWorld();lod.update(walkingCamera);assert.equal(lod.getCurrentLevel(),1);
 const originalTarget={name:'walking frame'},viewport=new THREE.Vector4(1,2,800,600),scissor=new THREE.Vector4(3,4,400,300),clearColor=new THREE.Color('#123456');
 let target=originalTarget,face=2,mip=1,scissorTest=true,clearAlpha=.7,captures=0;
 const renderer={xr:{enabled:true},shadowMap:{autoUpdate:true,needsUpdate:true},autoClear:false,
  getRenderTarget:()=>target,getActiveCubeFace:()=>face,getActiveMipmapLevel:()=>mip,getClearColor:v=>v.copy(clearColor),getClearAlpha:()=>clearAlpha,
  getViewport:v=>v.copy(viewport),getScissor:v=>v.copy(scissor),getScissorTest:()=>scissorTest,
  setClearColor(color,alpha){clearColor.copy(color);clearAlpha=alpha;},setRenderTarget(value,nextFace,nextMip){target=value;face=nextFace;mip=nextMip;},
  setViewport(value){viewport.copy(value);},setScissor(value){scissor.copy(value);},setScissorTest(value){scissorTest=value;}};
 const output=new THREE.RenderTarget(384,512);let outputDisposed=0;output.addEventListener('dispose',()=>outputDisposed++);
 const resources={targets:[output],current:null,environment,generator:{fromScene(value,sigma,near,far,options){
  captures++;assert.equal(mote.visible,false,'volatile creative particles must not compile or bake into the pond environment');assert.equal(dormantMote.visible,false);assert.equal(ordinarySprite.visible,true,'ordinary scene sprites remain eligible');assert.equal(value,scene);assert.equal(options.renderTarget,output);assert.equal(water.visible,false);assert.equal(renderer.shadowMap.autoUpdate,false);assert.equal(renderer.shadowMap.needsUpdate,false);
  for(const light of lights){assert.equal(light.shadow.autoUpdate,false,'r180 reads the individual light shadow autoUpdate flag');assert.equal(light.shadow.needsUpdate,false,'pending main-view atlas updates must not be consumed during the pond probe');}
  // Match r180 Renderer: each of the six scene renders updates world matrices
  // only when the scene owns automatic updates. Probe cameras update separately.
  for(let face=0;face<6;face++)if(scene.matrixWorldAutoUpdate)scene.updateMatrixWorld();
  lod.update(probeCamera);assert.equal(lod.getCurrentLevel(),0,'the actual LOD update switches to the probe view');
  if(fail)throw Error('PMREM capture failed');
 }}};
 const restored=()=>{
  lights.forEach((light,i)=>{assert.equal(light.shadow.autoUpdate,states[i].autoUpdate);assert.equal(light.shadow.needsUpdate,states[i].needsUpdate);});
  assert.equal(mote.visible,true);assert.equal(dormantMote.visible,false);assert.equal(ordinarySprite.visible,true);assert.equal(water.visible,true);assert.equal(hidden.visible,false);assert.equal(scene.environment,environment);
  assert.equal(scene.matrixWorldAutoUpdate,matrixAutoUpdate);
  assert.equal(renderer.shadowMap.autoUpdate,true);assert.equal(renderer.shadowMap.needsUpdate,true);assert.equal(renderer.xr.enabled,true);assert.equal(renderer.autoClear,false);
  assert.equal(target,originalTarget);assert.equal(face,2);assert.equal(mip,1);assert.equal(scissorTest,true);assert.equal(clearAlpha,.7);assert.equal(clearColor.getHex(),0x123456);
  assert.deepEqual(sun.position.toArray(),[-60,10,32]);assert.deepEqual(sun.target.position.toArray(),[5,2,-3]);
  assert.equal(lod.getCurrentLevel(),1,'probe rendering must restore the walking LOD hysteresis state');assert.equal(nearLevel.visible,false);assert.equal(farLevel.visible,true);
 };
 return {scene,renderer,resources,output,restored,get captures(){return captures;},get outputDisposed(){return outputDisposed;},get matrixUpdates(){return matrixUpdates;}};
}

test('r180 pond capture suspends each light shadow and restores pending atlas updates after success',()=>{
 const f=fixture();
 const result=captureShinikeEnvironment({...f,center:new THREE.Vector3(0,1,0),forestChunks:[],overlays:()=>[]});
 assert.equal(result.texture,f.output.texture);assert.equal(f.resources.current,f.output);assert.equal(f.captures,1);assert.equal(f.outputDisposed,0);f.restored();
 assert.equal(f.matrixUpdates,1,'six probe faces share one updated world-matrix tree');
 f.output.dispose();
});

test('r180 pond capture restores every light shadow flag when PMREM throws',()=>{
 const f=fixture(true);
 assert.throws(()=>captureShinikeEnvironment({...f,center:new THREE.Vector3(0,1,0),forestChunks:[],overlays:()=>[]}),/PMREM capture failed/);
 assert.equal(f.captures,1);assert.equal(f.outputDisposed,1);assert.equal(f.resources.targets.length,0);assert.equal(f.resources.current,null);f.restored();
 assert.equal(f.matrixUpdates,1,'a failed capture still updates the scene only once');
});

test('pond capture honors caller-owned scene matrices after success and failure',()=>{
 for(const fail of [false,true]){
  const f=fixture(fail,false),capture=()=>captureShinikeEnvironment({...f,center:new THREE.Vector3(0,1,0),forestChunks:[],overlays:()=>[]});
  if(fail)assert.throws(capture,/PMREM capture failed/);else capture();
  assert.equal(f.matrixUpdates,0,'capture must not force a caller-owned scene update');f.restored();
  if(!fail)f.output.dispose();
 }
});

test('pond walking validation and settling reuse vectors without exporting or cloning camera positions',()=>{
 const water=new THREE.Mesh(new THREE.PlaneGeometry(5,5),new THREE.MeshStandardMaterial());water.material.userData.waterAppearance={kind:'shinike'};
 let time=0,captures=0;const reflection=installShinikeReflections({water,now:()=>time},()=>{captures++;return {texture:{},dispose(){}};});
 const position=new THREE.Vector3();
 position.toArray=()=>{throw Error('camera position must not allocate an array');};
 position.clone=()=>{throw Error('camera position must not be cloned during update');};
 try{
  reflection.update(position,'day');
  for(let frame=1;frame<=120;frame++){time=frame*16;position.x=frame*.05;reflection.update(position,'day');}
  assert.equal(captures,0,'continuous walking must not unlock a reflection capture');
  time+=299;reflection.update(position,'day');assert.equal(captures,0);
  time+=1;reflection.update(position,'day');assert.equal(captures,1,'capture remains available after exactly300ms at rest');
  for(const axis of ['x','y','z'])for(const invalid of [NaN,Infinity,-Infinity]){const value=position[axis];position[axis]=invalid;time+=1000;reflection.update(position,'gold');position[axis]=value;}
  assert.equal(captures,1,'invalid camera positions do not enter the capture schedule');
 }finally{reflection.dispose();water.geometry.dispose();water.material.dispose();}
});

test('pond reports CPU capture duration independently of settling time, including failed attempts',()=>{
 const water=new THREE.Mesh(new THREE.PlaneGeometry(5,5),new THREE.MeshStandardMaterial());water.material.userData.waterAppearance={kind:'shinike'};
 let time=0,cpu=100,attempts=0,clockReads=0;
 const reflection=installShinikeReflections({water,now:()=>time,clock:()=>{clockReads++;return cpu;}},()=>{
  cpu+=[2400.25,16.5,8][attempts++];if(attempts===3)throw Error('capture timing failure');return {texture:{},dispose(){}};
 });
 const position=new THREE.Vector3();
 try{
  reflection.update(position,'day');assert.equal(clockReads,0);assert.equal(reflection.stats.captureStartedAt,null);
  time=1000;reflection.update(position,'day');
  assert.equal(reflection.stats.captureCpuMs,2400.25);assert.equal(reflection.stats.maxCaptureCpuMs,2400.25);assert.equal(reflection.stats.captureStartedAt,100);assert.equal(reflection.stats.captures,1);
  time=2000;reflection.update(position,'gold');time=3000;reflection.update(position,'gold');
  assert.equal(reflection.stats.captureCpuMs,16.5);assert.equal(reflection.stats.maxCaptureCpuMs,2400.25);assert.equal(reflection.stats.captureStartedAt,2500.25);assert.equal(reflection.stats.captures,2);
  time=4000;reflection.update(position,'night');time=5000;reflection.update(position,'night');
  assert.equal(reflection.stats.captureCpuMs,8);assert.equal(reflection.stats.maxCaptureCpuMs,2400.25);assert.equal(reflection.stats.captureStartedAt,2516.75);assert.equal(reflection.stats.captures,2);assert.equal(reflection.stats.error,'capture timing failure');
  time=6000;reflection.update(position,'night');assert.equal(attempts,3);assert.equal(clockReads,6,'each attempt is timed once without changing retry policy');
 }finally{reflection.dispose();water.geometry.dispose();water.material.dispose();}
});

test('pond loading preparation warms both retained targets and leaves first-visit refresh eligible',async()=>{
 const f=fixture(),water=f.scene.children.find(object=>object.isMesh),original=THREE.PMREMGenerator.prototype.fromScene;
 const targets=[],positions=[],order=[];let time=0,releases=0;
 THREE.PMREMGenerator.prototype.fromScene=function(scene,sigma,near,far,{renderTarget,position}){
  order.push('capture');targets.push(renderTarget);positions.push(position.toArray());
  if(!targets.slice(0,-1).includes(renderTarget))renderTarget.addEventListener('dispose',()=>releases++);
  return renderTarget;
 };
 const reflection=installShinikeReflections({scene:f.scene,renderer:f.renderer,water,now:()=>time});
 try{
  const position=reflection.position;position.x=1000;assert.equal(reflection.position.x,0,'callers cannot move the retained probe center');
  const result=await reflection.prepare({settle:async()=>{order.push('settle');}});
  assert.deepEqual(result,{prepared:true,captures:2,error:null});assert.deepEqual(order,['capture','settle','capture','settle']);
  assert.notEqual(targets[0],targets[1]);assert.deepEqual(positions,[[0,.12,0],[0,.12,0]]);assert.equal(releases,0);assert.equal(reflection.stats.captures,2);
  f.restored();
  reflection.update(new THREE.Vector3(),'day');time=1000;reflection.update(new THREE.Vector3(),'day');
  assert.equal(reflection.stats.captures,3,'loading does not consume the real visit appearance key');assert.equal(targets[2],targets[0]);assert.equal(releases,0);
  reflection.dispose();reflection.dispose();assert.equal(releases,2);
 }finally{reflection.dispose();f.output.dispose();THREE.PMREMGenerator.prototype.fromScene=original;}
});

test('pond loading capture failure stops immediately and preserves the last valid image',async()=>{
 const water=new THREE.Mesh(new THREE.PlaneGeometry(5,5),new THREE.MeshStandardMaterial());water.material.userData.waterAppearance={kind:'shinike'};
 const texture={};let attempts=0,settles=0,releases=0;
 const reflection=installShinikeReflections({water},()=>{if(++attempts===2)throw Error('preparation capture failed');return {texture,dispose(){releases++;}};});
 try{
  const result=await reflection.prepare({settle:async()=>{settles++;}});
  assert.deepEqual(result,{prepared:false,captures:1,error:'preparation capture failed'});assert.equal(attempts,2);assert.equal(settles,2);assert.equal(water.material.envMap,texture);assert.equal(releases,0);
 }finally{reflection.dispose();water.geometry.dispose();water.material.dispose();}
 assert.equal(releases,1);
});

test('pond loading settling failure propagates without discarding its captured image',async()=>{
 const water=new THREE.Mesh(new THREE.PlaneGeometry(5,5),new THREE.MeshStandardMaterial());water.material.userData.waterAppearance={kind:'shinike'};
 const texture={};let attempts=0;
 const reflection=installShinikeReflections({water},()=>{attempts++;return {texture,dispose(){}};});
 try{
  await assert.rejects(reflection.prepare({settle:async()=>{throw Error('GPU wait failed');}}),/GPU wait failed/);
  assert.equal(attempts,1);assert.equal(water.material.envMap,texture);assert.equal(reflection.stats.error,null);
 }finally{reflection.dispose();water.geometry.dispose();water.material.dispose();}
});

test('missing pond has no preparation position and does not submit captures',async()=>{
 const reflection=installShinikeReflections({});assert.equal(reflection.position,null);
 assert.deepEqual(await reflection.prepare(),{prepared:false,captures:0,error:null});
});

test('a fully prepared explicit appearance key reuses its image on arrival and refreshes a changed look',async()=>{
 const water=new THREE.Mesh(new THREE.PlaneGeometry(5,5),new THREE.MeshStandardMaterial());water.material.userData.waterAppearance={kind:'shinike'};
 let time=0,attempts=0;const reflection=installShinikeReflections({water,now:()=>time},()=>{attempts++;return {texture:{},dispose(){}};});
 const position=new THREE.Vector3();
 try{
  await reflection.prepare({appearanceKey:'day',settle:async()=>{}});assert.equal(attempts,2);
  reflection.update(position,'day');time=1000;reflection.update(position,'day');assert.equal(attempts,2,'arrival reuses the complete prepared image');
  time=2000;reflection.update(position,'gold');time=2999;reflection.update(position,'gold');assert.equal(attempts,2);
  time=3000;reflection.update(position,'gold');assert.equal(attempts,3,'a changed appearance retains the stable-key refresh delay');
 }finally{reflection.dispose();water.geometry.dispose();water.material.dispose();}
});

test('incomplete preparation never marks an explicit key as captured',async()=>{
 for(const failure of ['capture','settle']){
  const water=new THREE.Mesh(new THREE.PlaneGeometry(5,5),new THREE.MeshStandardMaterial());water.material.userData.waterAppearance={kind:'shinike'};
  let time=0,attempts=0,settles=0;
  const reflection=installShinikeReflections({water,now:()=>time},()=>{attempts++;if(failure==='capture'&&attempts===2)throw Error('capture failed');return {texture:{},dispose(){}};});
  try{
   const work=reflection.prepare({appearanceKey:'day',settle:async()=>{settles++;if(failure==='settle'&&settles===2)throw Error('settle failed');}});
   if(failure==='settle')await assert.rejects(work,/settle failed/);else assert.equal((await work).prepared,false);
   assert.equal(attempts,2);reflection.update(new THREE.Vector3(),'day');time=1000;reflection.update(new THREE.Vector3(),'day');
   assert.equal(attempts,3,`${failure} failure leaves the same appearance eligible for normal refresh`);
  }finally{reflection.dispose();water.geometry.dispose();water.material.dispose();}
 }
});


test('transient creative sprites stay out of probe captures and recover exact visibility after success or failure',()=>{
 for(const fail of [false,true]){
  const f=fixture(fail),capture=()=>captureShinikeEnvironment({...f,center:new THREE.Vector3(0,1,0),forestChunks:[],overlays:()=>[]});
  if(fail)assert.throws(capture,/PMREM capture failed/);else capture();
  f.restored();assert.equal(f.matrixUpdates,1);if(!fail)f.output.dispose();
 }
});
