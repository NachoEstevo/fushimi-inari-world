import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {createZenCat} from './zen-cat.mjs';
import {buildKeihanStation} from './keihan-station.mjs';

const path=new URL('../assets/models/cat/Mugi.glb',import.meta.url);
const loadAsset=()=>{const bytes=readFileSync(path);return new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');};
function fixture(options={}){
 const assembly={root:new THREE.Group(),legacy:{interactables:[]},keihanStation:{spec:{platformFloor:30}}},camera=new THREE.PerspectiveCamera(),events=[];
 const cat=createZenCat({assembly,camera,onAction:e=>events.push(e),loadAsset,...options});
 return {cat,assembly,camera,events};
}
function soles(body){
 const p=body.geometry.attributes.position,groups={lf:[],rf:[],lh:[],rh:[]};
 for(let i=0;i<p.count;i++)if(p.getY(i)<1e-6)groups[(p.getX(i)>0?'r':'l')+(p.getZ(i)>0?'h':'f')].push(i);
 return groups;
}
function paw(body,indices){
 const result=new THREE.Vector3(),v=new THREE.Vector3();for(const index of indices)result.add(body.getVertexPosition(index,v));return result.divideScalar(indices.length);
}

test('the real cat loads before interaction with one skinned draw, bounded joints and no image textures',async()=>{
 let resolve;const source=await loadAsset(),f=fixture({loadAsset:()=>new Promise(r=>resolve=r)});
 assert.equal(f.cat.stats.cats,0);assert.equal(f.assembly.legacy.interactables.length,0);resolve(source);await f.cat.ready;
 assert.equal(f.cat.stats.cats,1);assert.equal(f.cat.stats.loadedModels,1);assert.equal(f.cat.stats.batches,1);assert.equal(f.cat.stats.triangles,3772);assert.equal(f.cat.stats.materials,1);assert.equal(f.cat.stats.textures,0);assert.equal(f.cat.stats.lights,0);assert.equal(f.cat.stats.bones,26);assert.equal(f.cat.stats.clips,4);
 const body=f.cat.group.getObjectByName('Mugi_body');assert.ok(body.isSkinnedMesh);assert.equal(f.assembly.legacy.interactables[0],f.cat.group);
 const bounds=new THREE.Box3().setFromObject(f.cat.group),size=bounds.getSize(new THREE.Vector3());assert.ok(size.x<.25&&size.z<.53&&size.y>.30&&size.y<.45);assert.ok(Math.abs(bounds.min.y-30.54)<1e-5);assert.equal(f.cat.group.position.x,-300.4);assert.equal(f.cat.group.position.y,30.54);assert.equal(f.cat.group.rotation.y,0);
 assert.deepEqual(gunzipSync(readFileSync(new URL('../assets/models/cat/Mugi.glb.gz',import.meta.url))),readFileSync(path));f.cat.dispose();
});

test('baked idle and greeting visibly flex the legs while all four paws retain their exact seat contacts',async()=>{
 const asset=await loadAsset(),body=asset.scene.getObjectByName('Mugi_body'),feet=soles(body),mixer=new THREE.AnimationMixer(asset.scene),v=new THREE.Vector3();
 for(const key of Object.keys(feet))assert.ok(feet[key].length>10);
 const origin=Object.fromEntries(Object.entries(feet).map(([key,ids])=>[key,paw(body,ids)]));
 for(const name of ['Mugi_idle','Mugi_greet']){
  const action=mixer.clipAction(asset.animations.find(c=>c.name===name));action.play();let flexion=0;
  for(let i=0;i<31;i++){
   mixer.setTime((action.getClip().duration-.01)*i/30);asset.scene.updateMatrixWorld(true);
   flexion=Math.max(flexion,Math.abs(body.skeleton.getBoneByName('Mugi_fore_l_lower').rotation.x));
   for(const [key,ids]of Object.entries(feet)){const point=paw(body,ids);assert.ok(Math.abs(point.y)<.0001,`${name} ${key} support ${point.y}`);assert.ok(point.distanceTo(origin[key])<.0001,`${name} ${key} slides`);}
   for(const ids of Object.values(feet))for(const index of ids){body.getVertexPosition(index,v);assert.ok(v.y>-.0001,'sole must not enter the seat');}
  }
  assert.ok(flexion>.25,'elbows flex instead of keeping a rigid standing pose');action.stop();
 }
 mixer.uncacheRoot(asset.scene);
});

test('a short paw stretch has three planted supports, a bent wrist and a gentle return to the seat',async()=>{
 const asset=await loadAsset(),body=asset.scene.getObjectByName('Mugi_body'),feet=soles(body),mixer=new THREE.AnimationMixer(asset.scene);
 const action=mixer.clipAction(asset.animations.find(c=>c.name==='Mugi_groom'));action.play();let peak=0;
 for(let i=0;i<43;i++){
  mixer.setTime(i*.1);asset.scene.updateMatrixWorld(true);
  for(const key of ['lf','lh','rh'])assert.ok(Math.abs(paw(body,feet[key]).y)<.0001,`${key} must support the lifted paw`);
  const raised=paw(body,feet.rf);assert.ok(raised.y>=-.0001);peak=Math.max(peak,raised.y);
 }
 assert.ok(peak>.035&&peak<.055,'a small 4 cm lift, without reaching through the face');
 mixer.setTime(4.19);asset.scene.updateMatrixWorld(true);assert.ok(Math.abs(paw(body,feet.rf).y)<.0001);mixer.stopAllAction();mixer.uncacheRoot(asset.scene);
});

test('tail moves from the pelvis, gaze cannot drag it from the head, and the eyes have real blink animation',async()=>{
 const asset=await loadAsset(),head=asset.scene.getObjectByName('Mugi_head_gaze'),tail=asset.scene.getObjectByName('Mugi_tail_tip'),body=asset.scene.getObjectByName('Mugi_body'),mixer=new THREE.AnimationMixer(asset.scene);
 for(let parent=tail.parent;parent;parent=parent.parent)assert.notEqual(parent,head,'tail must not be grouped under the neck');
 mixer.clipAction(asset.animations.find(c=>c.name==='Mugi_idle')).play();mixer.setTime(0);asset.scene.updateMatrixWorld(true);const start=tail.getWorldPosition(new THREE.Vector3());
 mixer.setTime(3.3);asset.scene.updateMatrixWorld(true);assert.ok(tail.getWorldPosition(new THREE.Vector3()).distanceTo(start)>.003);assert.ok(body.morphTargetInfluences[0]>.7);
 const before=tail.getWorldPosition(new THREE.Vector3());head.rotation.y=.18;asset.scene.updateMatrixWorld(true);assert.ok(tail.getWorldPosition(new THREE.Vector3()).distanceTo(before)<1e-9);
 mixer.stopAllAction();mixer.uncacheRoot(asset.scene);
});

test('joint weights remain finite and normalized across the original coat, ears, eyes and tail',async()=>{
 const asset=await loadAsset(),body=asset.scene.getObjectByName('Mugi_body'),weights=body.geometry.attributes.skinWeight,indices=body.geometry.attributes.skinIndex;
 for(let i=0;i<weights.count;i++){
  let sum=0;for(let k=0;k<4;k++){const weight=weights.array[i*4+k],joint=indices.array[i*4+k];assert.ok(Number.isFinite(weight)&&weight>=0&&weight<=1);assert.ok(Number.isInteger(joint)&&joint>=0&&joint<body.skeleton.bones.length);sum+=weight;}
  assert.ok(Math.abs(sum-1)<1e-6,'all skin vertices preserve their bind position');
 }
});

test('clip transitions keep the supporting hind paws planted and the lifted forepaw out of the seat',async()=>{
 const f=fixture();await f.cat.ready;const owner=f.cat.group,body=owner.getObjectByName('Mugi_body'),feet=soles(body);f.camera.position.copy(owner.position).add(new THREE.Vector3(0,1,-1));
 let min=Infinity;
 for(let frame=0;frame<700;frame++){
  const time=frame*.05;f.cat.update(.05,time);if(frame===20||frame===40)owner.userData.interactable.directAction();owner.updateMatrixWorld(true);
  for(const [key,ids]of Object.entries(feet)){const point=paw(body,ids);min=Math.min(min,point.y);if(key.endsWith('h'))assert.ok(Math.abs(point.y)<.0005,`${key} support changed during a blend`);}
 }
 assert.ok(min>-.0005,`a blended sole entered the seat by ${min}m`);f.cat.dispose();
});

function emittedStationSeat(){
 const features=JSON.parse(readFileSync(new URL('../geography/features.json',import.meta.url),'utf8'));
 const root=new THREE.Group(),station=buildKeihanStation(root,{},features,{height:()=>30}),origin=new THREE.Vector3(-300.4,station.spec.platformFloor+.54,-184.9);
 root.updateMatrixWorld(true);
 const vertices=[],back=new THREE.Box3(),leftArm=new THREE.Box3(),rightArm=new THREE.Box3(),points=[new THREE.Vector3(),new THREE.Vector3(),new THREE.Vector3()];
 root.traverse(mesh=>{
  if(!mesh.isMesh)return;const geometry=mesh.geometry,p=geometry.attributes.position,index=geometry.index,count=index?.count??p.count;
  for(let i=0;i<count;i+=3){
   for(let j=0;j<3;j++)points[j].fromBufferAttribute(p,index?index.getX(i+j):i+j).applyMatrix4(mesh.matrixWorld).sub(origin);
   if(!points.every(p=>Math.abs(p.x)<.35&&Math.abs(p.z)<.35&&p.y>-.20&&p.y<.60))continue;
   for(const point of points)vertices.push(point.x,point.y,point.z);
   const upper=points.some(p=>p.y>.02);
   if(upper&&points.every(p=>p.z>.17))for(const point of points)back.expandByPoint(point);
   if(upper&&points.every(p=>p.x<-.24))for(const point of points)leftArm.expandByPoint(point);
   if(upper&&points.every(p=>p.x>.24))for(const point of points)rightArm.expandByPoint(point);
  }
 });
 assert.ok(vertices.length>0&&!back.isEmpty()&&!leftArm.isEmpty()&&!rightArm.isEmpty());
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geometry.computeVertexNormals();
 const mesh=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({side:THREE.DoubleSide}));mesh.updateMatrixWorld(true);
 return {root,station,origin,mesh,back,leftArm,rightArm};
}

test('every clip and live crossfade clears the actual seat back and armrests while paws remain supported',async()=>{
 const seat=emittedStationSeat(),assembly={root:seat.root,legacy:{interactables:[]},keihanStation:seat.station},camera=new THREE.PerspectiveCamera();
 const cat=createZenCat({assembly,camera,loadAsset});await cat.ready;camera.position.copy(cat.group.position).add(new THREE.Vector3(.5,1,-1));
 const source=await loadAsset(),probe=new THREE.Group();probe.position.copy(cat.group.position);probe.add(source.scene);
 const mixer=new THREE.AnimationMixer(source.scene),body=source.scene.getObjectByName('Mugi_body'),feet=soles(body),local=new THREE.Vector3(),world=new THREE.Vector3();
 const bound=cat.group.getObjectByName('Mugi_body').boundingSphere,ray=new THREE.Raycaster(new THREE.Vector3(),new THREE.Vector3(0,-1,0),0,.3);
 let backClearance=Infinity,sideClearance=Infinity,samples=0;
 function inspect(mesh,contacts){
  mesh.updateWorldMatrix(true,false);samples++;
  for(let i=0;i<mesh.geometry.attributes.position.count;i++){
   mesh.getVertexPosition(i,local);assert.ok(local.distanceTo(bound.center)<=bound.radius+1e-6,'prepared culling sphere contains the full animated coat');
   world.copy(local).applyMatrix4(mesh.matrixWorld).sub(seat.origin);
   backClearance=Math.min(backClearance,seat.back.min.z-world.z);
   sideClearance=Math.min(sideClearance,world.x-seat.leftArm.max.x,seat.rightArm.min.x-world.x);
  }
  for(const indices of Object.values(contacts)){
   const point=paw(mesh,indices).applyMatrix4(mesh.matrixWorld).sub(seat.origin);
   ray.ray.origin.set(point.x,.15,point.z);const support=ray.intersectObject(seat.mesh)[0];
   assert.ok(support,'each animated paw stays over the real cushion');assert.ok(Math.abs(support.point.y)<.0001,'the cushion top, not the platform below, supplies support');
   assert.ok(point.y>=-.0005&&point.y<.06,'planted/raised paw must stay on or just above the cushion');
  }
 }
 try{
  for(const clip of source.animations){
   const action=mixer.clipAction(clip);action.play();
   for(let time=0;time<clip.duration;time+=.05){mixer.setTime(time);probe.updateMatrixWorld(true);inspect(body,feet);}action.stop();
  }
  const live=cat.group.getObjectByName('Mugi_body'),contacts=soles(live),poses=new Set();
  for(let frame=0;frame<700;frame++){
   cat.update(.05,frame*.05);if(frame===20||frame===40)cat.group.userData.interactable.directAction();cat.group.updateMatrixWorld(true);
   poses.add(cat.stats.pose);inspect(live,contacts);
  }
  assert.equal(poses.size,4,'the real idle/greeting/petting/grooming transitions were sampled');assert.ok(samples>1100);
  assert.ok(backClearance>.008,`animated tail must stay in front of the backrest ribs: ${backClearance}m`);
  assert.ok(sideClearance>.10,`coat must clear both armrest volumes: ${sideClearance}m`);
 }finally{mixer.stopAllAction();mixer.uncacheRoot(source.scene);cat.dispose();seat.mesh.geometry.dispose();seat.mesh.material.dispose();}
});

test('nearby animation pauses in menus and at distance, and tracking cannot accumulate over its mixer',async()=>{
 const f=fixture({journey:{snapshot:()=>({moments:{cat:10}})}});await f.cat.ready;const owner=f.cat.group,head=owner.getObjectByName('Mugi_head_gaze'),leg=owner.getObjectByName('Mugi_fore_l_lower');
 f.camera.position.copy(owner.position).add(new THREE.Vector3(1,1,-1));
 for(let i=0;i<100;i++)f.cat.update(.016,i*.016);
 assert.ok(Math.abs(head.rotation.y)<=.18001);assert.ok(Math.abs(head.rotation.y)>.05);
 const paused=leg.quaternion.clone();for(let i=0;i<100;i++)f.cat.update(.1,20+i*.1,{blocked:true});assert.ok(leg.quaternion.equals(paused));
 f.camera.position.set(0,0,0);f.cat.update(.1,40);assert.equal(owner.visible,false);assert.ok(leg.quaternion.equals(paused));
 f.camera.position.copy(owner.position).add(new THREE.Vector3(1,1,-1));for(let i=0;i<600;i++)f.cat.update(.016,41+i*.016);
 assert.equal(owner.visible,true);assert.ok(Math.abs(head.rotation.y)<=.18001,'an unkeyed gaze bone stays bounded through clip crossfades');f.cat.update(NaN,NaN);assert.ok(Number.isFinite(head.quaternion.w));f.cat.dispose();
});

test('loading failures expose no invisible action, and a late result releases its unique rig exactly once',async()=>{
 const failed=fixture({loadAsset:()=>Promise.reject(new Error('missing'))});await failed.cat.ready;assert.equal(failed.cat.stats.cats,0);assert.equal(failed.assembly.legacy.interactables.length,0);failed.cat.dispose();
 const asset=await loadAsset();let resolve,geometries=0,materials=0,skeletons=0;const uniqueMaterials=new Set();asset.scene.traverse(o=>{if(o.isMesh){o.geometry.addEventListener('dispose',()=>geometries++);uniqueMaterials.add(o.material);if(o.skeleton){const dispose=o.skeleton.dispose.bind(o.skeleton);o.skeleton.dispose=()=>{skeletons++;dispose();};}}});for(const m of uniqueMaterials)m.addEventListener('dispose',()=>materials++);
 const f=fixture({loadAsset:()=>new Promise(r=>resolve=r)});f.cat.dispose();f.cat.dispose();resolve(asset);await f.cat.ready;assert.equal(geometries,1);assert.equal(materials,1);assert.equal(skeletons,1);assert.equal(f.assembly.legacy.interactables.length,0);assert.equal(f.cat.group.parent,null);
});

test('saved familiarity retains guarded pet feedback and awards only a completed first encounter',async()=>{
 const listeners=new Set(),journey={snapshot:()=>({moments:{cat:10}}),subscribe(fn){listeners.add(fn);return ()=>listeners.delete(fn);}},f=fixture({journey});await f.cat.ready;
 const owner=f.cat.group;f.camera.position.copy(owner.position).add(new THREE.Vector3(0,1.1,-1));f.cat.update(.1,1,{blocked:true});assert.match(owner.userData.interactable.directAction(),/watches/);
 f.cat.update(.1,2);assert.match(owner.userData.interactable.prompt,/again|familiar/);owner.userData.interactable.directAction();assert.equal(f.cat.stats.pose,'greet');f.cat.update(.1,2.5);owner.userData.interactable.directAction();assert.equal(f.events.length,0);
 f.cat.update(.1,3);owner.userData.interactable.directAction();assert.deepEqual(f.events.map(e=>e.type),['cat.pet']);assert.equal(f.cat.stats.pose,'pet');f.cat.update(.1,4);owner.userData.interactable.directAction();assert.equal(f.events.length,2);f.cat.dispose();assert.equal(listeners.size,0);
 const fresh=fixture();await fresh.cat.ready;fresh.camera.position.copy(fresh.cat.group.position).add(new THREE.Vector3(0,1,-1));fresh.cat.update(.1,1);fresh.cat.group.userData.interactable.directAction();fresh.cat.update(.1,2);fresh.cat.group.userData.interactable.directAction();assert.deepEqual(fresh.events.map(e=>e.type),['cat','cat.pet']);fresh.cat.dispose();
});

test('loaded resources release once and never dispose unrelated scene geometry',async()=>{
 const f=fixture(),borrowed=new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshStandardMaterial());f.assembly.root.add(borrowed);let borrowedDisposals=0;borrowed.geometry.addEventListener('dispose',()=>borrowedDisposals++);await f.cat.ready;
 const body=f.cat.group.getObjectByName('Mugi_body');assert.equal(body.castShadow,true);let geometryDisposals=0,materialDisposals=0,skeletonDisposals=0;body.geometry.addEventListener('dispose',()=>geometryDisposals++);body.material.addEventListener('dispose',()=>materialDisposals++);const dispose=body.skeleton.dispose.bind(body.skeleton);body.skeleton.dispose=()=>{skeletonDisposals++;dispose();};
 f.cat.dispose();f.cat.dispose();assert.equal(geometryDisposals,1);assert.equal(materialDisposals,1);assert.equal(skeletonDisposals,1);assert.equal(borrowedDisposals,0);assert.equal(f.assembly.legacy.interactables.length,0);assert.ok(borrowed.parent);
});
