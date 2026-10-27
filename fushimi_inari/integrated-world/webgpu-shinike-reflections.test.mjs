import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three/webgpu';
import {captureShinikeEnvironment} from './webgpu-shinike-reflections.mjs';

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
