import test from 'node:test';
import assert from 'node:assert/strict';
import {REVISION} from 'three';

test('station probe stays local, alternates bounded targets and restores state', {skip:!['180','186'].includes(REVISION)}, async()=>{
 const THREE=await import('three/webgpu');
 const {createStationReflectionStudy}=await import('./webgpu-station-reflections.mjs');
 const scene=new THREE.Scene(), environment=new THREE.Texture(), originalMap=new THREE.Texture();
 scene.environment=environment;
 const group=new THREE.Group(), geometry=new THREE.BoxGeometry();
 const metal=new THREE.MeshStandardMaterial({envMap:originalMap}); metal.userData.stationReflectionReceiver=true;
 const floor=new THREE.MeshStandardMaterial();
 const receiver=new THREE.Mesh(geometry,metal), matte=new THREE.Mesh(geometry,floor);
 group.add(receiver,matte);scene.add(group);
 const renderer={xr:{enabled:true},autoClear:true,getRenderTarget:()=>null,getActiveCubeFace:()=>0,
  getActiveMipmapLevel:()=>0,getClearColor:v=>v,getClearAlpha:()=>1,setClearColor(){},setRenderTarget(){}};
 const original=THREE.PMREMGenerator.prototype.fromScene,targets=new Set();let fail=false;
 THREE.PMREMGenerator.prototype.fromScene=function(s,sigma,near,far,{renderTarget,position}){
  assert.equal(s.environment,null);assert.equal(receiver.visible,false);assert.equal(matte.visible,true);
  assert.deepEqual(position.toArray(),[1,3.65,3]);
  targets.add(renderTarget);if(fail)throw new Error('capture failed');return renderTarget;
 };
 const study=await createStationReflectionStudy({renderer,scene,station:{group,spec:{train:{doorPosition:[1,2,3]}}}});
 try{
  study.setEnabled(true);const first=metal.envMap;
  assert.equal(scene.environment,environment);assert.equal(receiver.visible,true);assert.equal(renderer.xr.enabled,true);
  assert.equal(floor.envMap,null);assert.notEqual(first,originalMap);
  study.capture();assert.notEqual(metal.envMap,first);
  study.capture();assert.equal(metal.envMap,first);assert.equal(targets.size,2);
  fail=true;assert.throws(()=>study.capture(),/capture failed/);
  assert.equal(metal.envMap,first);assert.equal(scene.environment,environment);assert.equal(receiver.visible,true);
  study.setEnabled(false);assert.equal(metal.envMap,originalMap);
  study.setEnabled(true);study.dispose();assert.equal(metal.envMap,originalMap);
 }finally{study.dispose();THREE.PMREMGenerator.prototype.fromScene=original;geometry.dispose();metal.dispose();floor.dispose();environment.dispose();originalMap.dispose();}
});

test('bounded preparation captures only a capped station surrogate once', {skip:!['180','186'].includes(REVISION)}, async()=>{
 const THREE=await import('three/webgpu');
 const {createStationReflectionStudy}=await import('./webgpu-station-reflections.mjs');
 const {STATION_PROXY_LIMITS}=await import('./station-reflection-proxy.mjs');
 const scene=new THREE.Scene(), environment=new THREE.Texture(), group=new THREE.Group();
 scene.environment=environment;group.position.set(5,2,3);scene.add(group);
 const geometry=new THREE.BoxGeometry(),opaque=new THREE.MeshStandardMaterial({color:'#245b4b'});
 opaque.userData.stationReflectionReceiver=true;
 for(let i=0;i<45;i++){const m=new THREE.Mesh(geometry,opaque);m.position.x=i;group.add(m);}
 const glass=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({transparent:true,opacity:.2}));group.add(glass);
 const foreign=new THREE.Mesh(geometry,opaque);scene.add(foreign);
 const worldTarget={name:'world target'};
 let stages=0,compiled=0,captures=0,releases=0,currentTarget=worldTarget,compiledTarget=null;
 const submitted=new Set();
 geometry.addEventListener('dispose',()=>releases++);
 const renderer={xr:{enabled:true},autoClear:true,getRenderTarget:()=>currentTarget,getActiveCubeFace:()=>0,
  getActiveMipmapLevel:()=>0,getClearColor:v=>v,getClearAlpha:()=>1,setClearColor(){},setRenderTarget(target){currentTarget=target;},
  compileAsync(proxy){
   compiled++;assert.notEqual(proxy,scene);assert.ok(proxy.children.length<=4);
   assert.equal(currentTarget.texture.type,THREE.HalfFloatType);compiledTarget=currentTarget;
   for(const mesh of proxy.children){assert.equal(mesh.frustumCulled,false);assert.equal(mesh.matrixWorld.elements[12],mesh.matrix.elements[12]);assert.ok(!submitted.has(mesh));submitted.add(mesh);}
   return Promise.resolve().then(()=>assert.equal(currentTarget,worldTarget,'target restored before pipeline wait'));
  }};
 const original=THREE.PMREMGenerator.prototype.fromScene;
 THREE.PMREMGenerator.prototype.fromScene=function(proxy,sigma,near,far,{renderTarget,position}){
  captures++;assert.notEqual(proxy,scene);assert.equal(renderTarget,compiledTarget);assert.equal(proxy.children.length,STATION_PROXY_LIMITS.meshes);
  assert.deepEqual(position.toArray(),[8,4,9]);
  assert.equal(proxy.children[0].geometry,geometry);assert.equal(proxy.children[0].matrix.elements[12],5);
  assert.ok(proxy.children.every(m=>m.material.isMeshBasicMaterial&&!m.material.envMap));return renderTarget;
 };
 const study=await createStationReflectionStudy({renderer,scene,station:{group,spec:{arrival:{platformPose:{position:[8,4,9]}},train:{doorPosition:[1,2,3]}}}});
 try{
  const compile=renderer.compileAsync;
  renderer.compileAsync=async()=>{throw new Error('compile failed');};
  await assert.rejects(study.prepareBounded({yieldStage:async()=>{}}),/compile failed/);
  assert.equal(scene.environment,environment);assert.equal(currentTarget,worldTarget);assert.equal(captures,0);assert.equal(study.stats.failures,1);
  renderer.compileAsync=compile;
  await Promise.all([study.prepareBounded({yieldStage:async()=>{stages++;}}),study.prepareBounded()]);
  assert.equal(study.stats.proxy.meshes,40);assert.equal(study.stats.proxy.triangles,480);
  assert.equal(study.stats.proxy.skipped,6);assert.ok(stages>0);assert.equal(compiled,10);assert.equal(submitted.size,40);assert.equal(captures,1);
  assert.equal(scene.environment,environment);assert.equal(currentTarget,worldTarget);assert.equal(renderer.xr.enabled,true);assert.equal(releases,0);
  study.setEnabled(true);assert.equal(captures,1);assert.ok(opaque.envMap);assert.equal(glass.material.envMap,opaque.envMap);
  await study.prepareBounded();assert.equal(captures,1);study.dispose();assert.equal(opaque.envMap,null);
 }finally{study.dispose();THREE.PMREMGenerator.prototype.fromScene=original;geometry.dispose();opaque.dispose();glass.material.dispose();environment.dispose();}
});
