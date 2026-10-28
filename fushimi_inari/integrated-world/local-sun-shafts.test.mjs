import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {chooseShaftSites,createLocalSunShafts} from './local-sun-shafts.mjs';
const crown=(x=0)=>new THREE.Box3(new THREE.Vector3(x-6,5,-6),new THREE.Vector3(x+6,18,6));

test('shaft sites are deterministic, bounded and restricted to wooded routes',()=>{
 const options={routes:[Array.from({length:100},(_,i)=>[i*2,0,0])],canopies:[crown(),crown(20),crown(40)].map(b=>b.translate(new THREE.Vector3(0,0,10))),ground:()=>0,maxSites:2};
 const sites=chooseShaftSites(options);
 assert.equal(sites.length,2);assert.deepEqual(sites,chooseShaftSites(options));
 assert.equal(chooseShaftSites({...options,canopies:[]}).length,0);
 assert.equal(chooseShaftSites({...options,ground:()=>NaN}).length,0);
 assert.ok(sites.every(s=>Number.isFinite(s.topY)&&s.width<=3.5));
 assert.ok(sites.every(s=>options.canopies.some(c=>c.containsPoint(new THREE.Vector3(...s.source)))));
 const highCrown=new THREE.Box3(new THREE.Vector3(-20,25,15),new THREE.Vector3(0,40,35));
 assert.equal(chooseShaftSites({routes:[[[0,0,0],[0,0,15]]],canopies:[highCrown],ground:()=>0}).length,0,'capped rays cannot start in empty air below a hillside crown');
});

test('a long lower route cannot consume mountain coverage; day rays land beside each path',()=>{
 const routes=[Array.from({length:150},(_,i)=>[i*2,0,0]),Array.from({length:150},(_,i)=>[1000+i*2,80,0])];
 const canopies=[new THREE.Box3(new THREE.Vector3(-30,5,-20),new THREE.Vector3(330,18,20)),
  new THREE.Box3(new THREE.Vector3(970,85,-20),new THREE.Vector3(1330,98,20))];
 const sites=chooseShaftSites({routes,canopies,ground:x=>x>500?80:0,maxSites:8});
 assert.equal(sites.length,8);assert.equal(sites.filter(s=>s.point[0]>500).length,4);
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera();
 for(const site of sites){
  const effect=createLocalSunShafts({scene,sites:[site],audit:true});effect.setQuality('high');camera.position.fromArray(site.point);camera.position.z+=5;effect.update(camera);
  const end=effect.stats.placement[0].end;
  assert.ok(Math.hypot(...end.map((v,i)=>v-site.point[i]))<1e-4,'day ribbon lands at its intended trail-side point');effect.dispose();
 }
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

test('signed ray offsets use multiplication rather than pow with a negative shader-domain base',()=>{
 const effect=createLocalSunShafts({scene:new THREE.Scene(),sites:[]});
 let multiplications=0;
 effect.mesh.material.opacityNode.traverse(node=>{
  assert.notEqual(node.method,'pow','WGSL pow is undefined for the negative half of a signed ray profile');
  if(node.op==='*')multiplications++;
 });
 assert.ok(multiplications>0);effect.dispose();
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

test('stationary shafts upload once across 120 updates and preserve exact moving-camera matrices',()=>{
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera();camera.position.set(0,2,5);
 const sites=Array.from({length:24},(_,i)=>({point:[i,0,0],topY:18,width:2}));
 const effect=createLocalSunShafts({scene,sites});effect.setQuality('high');
 const initialVersion=effect.mesh.instanceMatrix.version;
 for(let i=0;i<120;i++){camera.rotation.y+=.01;effect.update(camera);}
 assert.equal(effect.mesh.instanceMatrix.version-initialVersion,1);
 assert.equal(effect.stats.active,8);
 for(const position of [[.000001,2,5],[9,2,-3],[1000,2,1000],[0,2,5]]){
  camera.position.fromArray(position);effect.update(camera);
  const reference=createLocalSunShafts({scene,sites});reference.setQuality('high');reference.update(camera);
  assert.equal(effect.mesh.count,reference.mesh.count);
  assert.equal(effect.mesh.visible,reference.mesh.visible);
  assert.deepEqual(effect.mesh.instanceMatrix.array.slice(0,effect.mesh.count*16),reference.mesh.instanceMatrix.array.slice(0,reference.mesh.count*16));
  reference.dispose();
 }
 effect.dispose();
});

test('mode, quality and invalid-camera transitions invalidate the stationary shaft cache',()=>{
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera();camera.position.set(0,2,5);
 const effect=createLocalSunShafts({scene,sites:[{point:[0,0,0],topY:18,width:2}]});effect.setQuality('high');effect.update(camera);
 const day=Array.from(effect.mesh.instanceMatrix.array),version=effect.mesh.instanceMatrix.version;
 effect.setMode('gold');effect.update(camera);
 assert.equal(effect.mesh.instanceMatrix.version,version+1);assert.notDeepEqual(Array.from(effect.mesh.instanceMatrix.array),day);
 effect.setQuality('balanced');effect.update(camera);assert.equal(effect.mesh.visible,false);assert.equal(effect.mesh.count,0);
 effect.setQuality('ultra');effect.update(camera);assert.equal(effect.mesh.visible,true);assert.equal(effect.mesh.instanceMatrix.version,version+2);
 effect.setMode('night');effect.update(camera);assert.equal(effect.mesh.visible,false);
 effect.setMode('day');effect.update(camera);assert.deepEqual(Array.from(effect.mesh.instanceMatrix.array),day);
 camera.position.x=NaN;effect.update(camera);assert.equal(effect.mesh.visible,false);
 camera.position.x=0;effect.update(camera);assert.equal(effect.mesh.visible,true);
 const restoredVersion=effect.mesh.instanceMatrix.version;effect.update(camera);assert.equal(effect.mesh.instanceMatrix.version,restoredVersion);
 effect.dispose();
});
