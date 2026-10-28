import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three/webgpu';
import {captureShinikeEnvironment,installShinikeReflections} from './webgpu-shinike-reflections.mjs';

function fixture(fail=false){
 const scene=new THREE.Scene(),environment=new THREE.Texture();scene.environment=environment;
 const water=new THREE.Mesh(new THREE.PlaneGeometry(),new THREE.MeshStandardMaterial());water.material.userData.waterAppearance={kind:'shinike'};scene.add(water);
 const sun=new THREE.DirectionalLight(),spot=new THREE.SpotLight(),hidden=new THREE.Group(),point=new THREE.PointLight();
 sun.shadow.autoUpdate=false;sun.shadow.needsUpdate=true;spot.shadow.autoUpdate=true;spot.shadow.needsUpdate=false;
 point.shadow.autoUpdate=false;point.shadow.needsUpdate=false;hidden.visible=false;hidden.add(point);scene.add(sun,spot,hidden);
 sun.target.position.set(5,2,-3);sun.position.set(-60,10,32);
 const lights=[sun,spot,point],states=lights.map(light=>({autoUpdate:light.shadow.autoUpdate,needsUpdate:light.shadow.needsUpdate}));
 const originalTarget={name:'walking frame'},viewport=new THREE.Vector4(1,2,800,600),scissor=new THREE.Vector4(3,4,400,300),clearColor=new THREE.Color('#123456');
 let target=originalTarget,face=2,mip=1,scissorTest=true,clearAlpha=.7,captures=0;
 const renderer={xr:{enabled:true},shadowMap:{autoUpdate:true,needsUpdate:true},autoClear:false,
  getRenderTarget:()=>target,getActiveCubeFace:()=>face,getActiveMipmapLevel:()=>mip,getClearColor:v=>v.copy(clearColor),getClearAlpha:()=>clearAlpha,
  getViewport:v=>v.copy(viewport),getScissor:v=>v.copy(scissor),getScissorTest:()=>scissorTest,
  setClearColor(color,alpha){clearColor.copy(color);clearAlpha=alpha;},setRenderTarget(value,nextFace,nextMip){target=value;face=nextFace;mip=nextMip;},
  setViewport(value){viewport.copy(value);},setScissor(value){scissor.copy(value);},setScissorTest(value){scissorTest=value;}};
 const output=new THREE.RenderTarget(384,512);let outputDisposed=0;output.addEventListener('dispose',()=>outputDisposed++);
 const resources={targets:[output],current:null,environment,generator:{fromScene(value,sigma,near,far,options){
  captures++;assert.equal(value,scene);assert.equal(options.renderTarget,output);assert.equal(water.visible,false);assert.equal(renderer.shadowMap.autoUpdate,false);assert.equal(renderer.shadowMap.needsUpdate,false);
  for(const light of lights){assert.equal(light.shadow.autoUpdate,false,'r180 reads the individual light shadow autoUpdate flag');assert.equal(light.shadow.needsUpdate,false,'pending main-view atlas updates must not be consumed during the pond probe');}
  if(fail)throw Error('PMREM capture failed');
 }}};
 const restored=()=>{
  lights.forEach((light,i)=>{assert.equal(light.shadow.autoUpdate,states[i].autoUpdate);assert.equal(light.shadow.needsUpdate,states[i].needsUpdate);});
  assert.equal(water.visible,true);assert.equal(hidden.visible,false);assert.equal(scene.environment,environment);
  assert.equal(renderer.shadowMap.autoUpdate,true);assert.equal(renderer.shadowMap.needsUpdate,true);assert.equal(renderer.xr.enabled,true);assert.equal(renderer.autoClear,false);
  assert.equal(target,originalTarget);assert.equal(face,2);assert.equal(mip,1);assert.equal(scissorTest,true);assert.equal(clearAlpha,.7);assert.equal(clearColor.getHex(),0x123456);
  assert.deepEqual(sun.position.toArray(),[-60,10,32]);assert.deepEqual(sun.target.position.toArray(),[5,2,-3]);
 };
 return {scene,renderer,resources,output,restored,get captures(){return captures;},get outputDisposed(){return outputDisposed;}};
}

test('r180 pond capture suspends each light shadow and restores pending atlas updates after success',()=>{
 const f=fixture();
 const result=captureShinikeEnvironment({...f,center:new THREE.Vector3(0,1,0),forestChunks:[],overlays:()=>[]});
 assert.equal(result.texture,f.output.texture);assert.equal(f.resources.current,f.output);assert.equal(f.captures,1);assert.equal(f.outputDisposed,0);f.restored();
 f.output.dispose();
});

test('r180 pond capture restores every light shadow flag when PMREM throws',()=>{
 const f=fixture(true);
 assert.throws(()=>captureShinikeEnvironment({...f,center:new THREE.Vector3(0,1,0),forestChunks:[],overlays:()=>[]}),/PMREM capture failed/);
 assert.equal(f.captures,1);assert.equal(f.outputDisposed,1);assert.equal(f.resources.targets.length,0);assert.equal(f.resources.current,null);f.restored();
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
