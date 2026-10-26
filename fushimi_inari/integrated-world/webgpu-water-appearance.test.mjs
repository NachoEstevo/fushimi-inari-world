import test from 'node:test';
import assert from 'node:assert/strict';
import {REVISION,Vector3,Mesh,PlaneGeometry} from 'three';

test('r180 water keeps stable node controls, authored levels and Shin-ike optics',{skip:REVISION!=='180'},async()=>{
 const {createWaterAppearance,createBasinWaterAppearance}=await import('./webgpu-water-appearance.mjs');
 for(const kind of ['pond','lake','shinike']){
  const material=createWaterAppearance({kind}),control=material.userData.waterAppearance,time=control.uniforms.uWaTime;
  assert.ok(material.isNodeMaterial);assert.ok(material.normalNode);assert.equal(material.positionNode,null);
  for(const mode of ['gold','night','day']){control.setMode(mode);control.update(12);assert.equal(control.uniforms.uWaTime,time);assert.equal(time.value,12);}
  assert.throws(()=>control.update(-1),/nonnegative/);assert.throws(()=>control.setMode('invalid'),/day, gold or night/);
  assert.equal(material.transparent,kind==='shinike');
  if(kind==='shinike'){assert.equal(material.ior,1.333);assert.ok(material.opacityNode);assert.ok(material.roughnessNode);assert.equal(material.depthWrite,false);}
 }
 const basin=createBasinWaterAppearance(null);assert.ok(basin.positionNode);assert.ok(basin.normalNode);
 basin.userData.waterAppearance.setMode('night');assert.equal(basin.envMapIntensity,.08);
});

test('r180 Shin-ike probe preserves bounded appearance caching and releases old output',{skip:REVISION!=='180'},async()=>{
 const {createWaterAppearance}=await import('./webgpu-water-appearance.mjs');
 const {installShinikeReflections}=await import('./webgpu-shinike-reflections.mjs');
 const material=createWaterAppearance({kind:'shinike'}),water=new Mesh(new PlaneGeometry(5,5),material);
 let captures=0,disposed=0,time=0;
 const reflection=installShinikeReflections({water,now:()=>time},()=>{captures++;return {texture:{},dispose(){disposed++;}};});
 reflection.update(new Vector3(1000,0,0),'day');assert.equal(captures,0);
 reflection.update(new Vector3(),'day');time=1000;reflection.update(new Vector3(),'day');assert.equal(captures,1);
 reflection.update(new Vector3(),'night');time=2000;reflection.update(new Vector3(),'night');assert.equal(captures,2);assert.equal(disposed,1);
 reflection.dispose();reflection.dispose();assert.equal(disposed,2);assert.equal(material.envMap,null);
});

test('native probe retains one generator and two alternating textures until disposal',{skip:REVISION!=='180'},async()=>{
 const THREE=await import('three/webgpu');
 const {createWaterAppearance}=await import('./webgpu-water-appearance.mjs');
 const {installShinikeReflections}=await import('./webgpu-shinike-reflections.mjs');
 const original=THREE.PMREMGenerator.prototype.fromScene,generators=new Set(),targets=new Set(),environments=[];let releases=0;
 THREE.PMREMGenerator.prototype.fromScene=function(scene,sigma,near,far,{renderTarget}){
  environments.push(scene.environment);generators.add(this);if(!targets.has(renderTarget)){targets.add(renderTarget);renderTarget.addEventListener('dispose',()=>releases++);}return renderTarget;
 };
 const renderer={xr:{enabled:false},shadowMap:{autoUpdate:true,needsUpdate:false},autoClear:true,
  getRenderTarget:()=>null,getActiveCubeFace:()=>0,getActiveMipmapLevel:()=>0,getClearColor:v=>v,getClearAlpha:()=>1,
  getViewport:v=>v,getScissor:v=>v,getScissorTest:()=>false,setClearColor(){},setRenderTarget(){},setViewport(){},setScissor(){},setScissorTest(){}};
 const water=new THREE.Mesh(new THREE.PlaneGeometry(5,5),createWaterAppearance({kind:'shinike'})),scene=new THREE.Scene();scene.environment=new THREE.Texture();const environment=scene.environment;scene.add(water);
 let time=0;const reflection=installShinikeReflections({renderer,scene,water,now:()=>time});
 try{
  const textures=[];for(const key of ['day','gold','night','day']){reflection.update(new Vector3(),key);time+=1000;reflection.update(new Vector3(),key);textures.push(water.material.envMap);}
  assert.ok(environments.every(value=>value===environment));assert.equal(scene.environment,environment);
  assert.equal(reflection.stats.error,null);assert.equal(reflection.stats.captures,4);assert.equal(generators.size,1);assert.equal(targets.size,2);
  assert.equal(textures[0],textures[2]);assert.equal(textures[1],textures[3]);assert.notEqual(textures[0],textures[1]);assert.equal(releases,0);
  reflection.dispose();assert.equal(releases,2);
 }finally{reflection.dispose();THREE.PMREMGenerator.prototype.fromScene=original;}
});


test('Shin-ike capture coalesces stale looks until nearby and settled',{skip:REVISION!=='180'},async()=>{
 const {createWaterAppearance}=await import('./webgpu-water-appearance.mjs');
 const {installShinikeReflections}=await import('./webgpu-shinike-reflections.mjs');
 const water=new Mesh(new PlaneGeometry(5,5),createWaterAppearance({kind:'shinike'}));
 let time=0,captures=0;
 const reflection=installShinikeReflections({water,now:()=>time},()=>{captures++;return {texture:{},dispose(){}};});
 const update=(t,x,key)=>{time=t;reflection.update(new Vector3(x,0,0),key);};
 update(0,91,'day');update(1500,91,'day');assert.equal(captures,0);
 update(1600,20,'day');update(1700,19,'gold');update(2000,18,'night');
 update(3000,17,'night');assert.equal(captures,0);
 update(3299,17,'night');assert.equal(captures,0);
 update(3300,17,'night');assert.equal(captures,1);
 const previous=water.material.envMap;
 update(3400,17,'gold');assert.equal(water.material.envMap,previous);
 update(4100,17,'day');update(4400,17,'day');assert.equal(captures,1);
 update(5100,17,'day');assert.equal(captures,2);
 reflection.dispose();
});

test('Shin-ike failed stable capture does not retry every frame',{skip:REVISION!=='180'},async()=>{
 const {createWaterAppearance}=await import('./webgpu-water-appearance.mjs');
 const {installShinikeReflections}=await import('./webgpu-shinike-reflections.mjs');
 const water=new Mesh(new PlaneGeometry(5,5),createWaterAppearance({kind:'shinike'}));
 let time=0,captures=0;
 const reflection=installShinikeReflections({water,now:()=>time},()=>{captures++;throw Error('capture failed');});
 reflection.update(new Vector3(),'day');time=1000;reflection.update(new Vector3(),'day');
 time=10000;reflection.update(new Vector3(),'day');assert.equal(captures,1);
 assert.equal(reflection.stats.error,'capture failed');assert.equal(water.material.envMap,null);
 reflection.dispose();
});


test('Shin-ike does not capture during normal per-frame walking',{skip:REVISION!=='180'},async()=>{
 const {createWaterAppearance}=await import('./webgpu-water-appearance.mjs');
 const {installShinikeReflections}=await import('./webgpu-shinike-reflections.mjs');
 const water=new Mesh(new PlaneGeometry(5,5),createWaterAppearance({kind:'shinike'}));
 let time=0,captures=0;
 const reflection=installShinikeReflections({water,now:()=>time},()=>{captures++;return {texture:{},dispose(){}};});
 const position=new Vector3();reflection.update(position,'day');
 for(let frame=1;frame<=120;frame++){
  time=frame*16;position.x=frame*.05;reflection.update(position,'day');
 }
 assert.equal(captures,0,'small frame displacements still represent continuous walking');
 time+=299;reflection.update(position,'day');assert.equal(captures,0);
 time+=1;reflection.update(position,'day');assert.equal(captures,1);
 reflection.dispose();
});
