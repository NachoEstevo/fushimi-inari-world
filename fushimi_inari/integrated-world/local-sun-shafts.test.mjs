import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {chooseShaftSites,createLocalSunShafts} from './local-sun-shafts.mjs';
const crown=(x=0)=>new THREE.Box3(new THREE.Vector3(x-6,5,-6),new THREE.Vector3(x+6,18,6));

test('shaft sites are deterministic, bounded and restricted to wooded routes',()=>{
 const options={routes:[Array.from({length:100},(_,i)=>[i*2,0,0])],canopies:[crown(),crown(20),crown(40)],ground:()=>0,maxSites:2};
 const sites=chooseShaftSites(options);
 assert.equal(sites.length,2);assert.deepEqual(sites,chooseShaftSites(options));
 assert.equal(chooseShaftSites({...options,canopies:[]}).length,0);
 assert.equal(chooseShaftSites({...options,ground:()=>NaN}).length,0);
 assert.ok(sites.every(s=>Number.isFinite(s.topY)&&s.width<=3));
});

test('High uses a fixed instanced budget; Balanced and night have no draws',()=>{
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera();camera.position.set(0,2,5);
 const sites=Array.from({length:30},(_,i)=>({point:[i*.5,0,0],topY:18,width:1.8}));
 const effect=createLocalSunShafts({scene,sites,maxActive:6});
 effect.update(camera);assert.equal(effect.stats.active,0);assert.equal(effect.mesh.visible,false);
 effect.setQuality('high');effect.update(camera);
 assert.equal(effect.stats.active,6);assert.equal(effect.mesh.count,6);assert.equal(effect.stats.draws,1);
 assert.equal(effect.stats.extraLights,0);assert.equal(effect.stats.textures,0);assert.equal(effect.mesh.castShadow,false);assert.equal(effect.mesh.material.forceSinglePass,true);
 assert.ok(effect.mesh.material.opacityNode?.isNode);assert.equal(effect.mesh.material.depthWrite,false);
 const geometry=effect.mesh.geometry,material=effect.mesh.material;let geometries=0,materials=0;
 geometry.addEventListener('dispose',()=>geometries++);material.addEventListener('dispose',()=>materials++);
 effect.setMode('night');effect.update(camera);assert.equal(effect.stats.active,0);assert.equal(effect.mesh.visible,false);
 effect.setMode('gold');effect.update(camera);assert.equal(effect.stats.active,6);
 effect.setQuality('balanced');effect.update(camera);assert.equal(effect.stats.active,0);
 effect.setQuality('high');effect.update(camera);assert.equal(effect.mesh.geometry,geometry);assert.equal(effect.mesh.material,material);
 camera.position.set(1000,2,1000);effect.update(camera);assert.equal(effect.stats.active,0);
 effect.dispose();effect.dispose();assert.equal(geometries,1);assert.equal(materials,1);assert.equal(scene.children.length,0);
});

test('known roofs suppress intersecting shafts, and invalid camera transforms never upload NaN',()=>{
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera();camera.position.set(0,2,5);
 const roof=new THREE.Box3(new THREE.Vector3(-10,3,-10),new THREE.Vector3(10,4,10));
 const effect=createLocalSunShafts({scene,sites:[{point:[0,0,0],topY:18,width:2}],roofs:[roof]});
 effect.setQuality('high');effect.update(camera);assert.equal(effect.stats.active,0);
 const open=createLocalSunShafts({scene,sites:[{point:[20,0,0],topY:18,width:2}]});
 open.setQuality('high');camera.position.set(NaN,0,0);open.update(camera);assert.equal(open.stats.active,0);
 assert.ok(Array.from(open.mesh.instanceMatrix.array).every(Number.isFinite));
 effect.dispose();open.dispose();
});

test('shafts start at canopy height even when a low sun needs more than the local length budget',()=>{
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera();camera.position.set(0,2,5);
 const effect=createLocalSunShafts({scene,sites:[{point:[0,0,0],topY:18,width:2}]});effect.setQuality('high');
 const matrix=new THREE.Matrix4(),tip=new THREE.Vector3(0,.5,0),bottom=new THREE.Vector3(0,-.5,0);
 for(const mode of ['day','gold']){
  effect.setMode(mode);effect.update(camera);assert.equal(effect.stats.active,1);effect.mesh.getMatrixAt(0,matrix);
  const top=tip.clone().applyMatrix4(matrix),end=bottom.clone().applyMatrix4(matrix);
  assert.ok(Math.abs(top.y-18)<1e-5,`${mode}: shaft must originate at canopy rather than near the ground`);
  assert.ok(top.y>end.y);assert.ok(top.distanceTo(end)<=24.001);
  if(mode==='gold')assert.ok(end.y>15,'low sun keeps short shafts near the canopy, not at eye height');
 }
 effect.dispose();
});

test('distance admission retains a near shaft endpoint until its soft fade is fully outside range',()=>{
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera();camera.position.set(0,2,5);
 const effect=createLocalSunShafts({scene,sites:[{point:[0,0,0],topY:18,width:2}]});effect.setQuality('high');effect.update(camera);
 const matrix=new THREE.Matrix4();effect.mesh.getMatrixAt(0,matrix);
 const top=new THREE.Vector3(0,.5,0).applyMatrix4(matrix),end=new THREE.Vector3(0,-.5,0).applyMatrix4(matrix);
 camera.position.copy(end).addScaledVector(end.clone().sub(top).normalize(),38);effect.update(camera);
 assert.equal(effect.stats.active,1,'near endpoint still contributes despite a centre beyond 48 metres');effect.dispose();
});
