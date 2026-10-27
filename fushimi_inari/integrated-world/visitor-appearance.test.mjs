import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {clone} from 'three/addons/utils/SkeletonUtils.js';
import {prepareVisitorTemplate,createVisitorClothTexture} from './visitor-appearance.mjs';
import {bindVisitorRig,resetVisitorRig,captureVisitorPose,poseVisitorGait} from './visitor-rig.mjs';
import {posePersonGreeting} from './person-interaction.mjs';
const load=async name=>{const b=fs.readFileSync(new URL(`../assets/models/visitors/${name}.glb`,import.meta.url));return new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');};
for(const name of ['Casual_Male','Casual_Female','Kimono_Female'])test(`${name} template shortens both arm segments with stable animated hands and clothing-only shared maps`,async()=>{
 const source=await load(name),texture=createVisitorClothTexture(),before=[];
 source.scene.traverse(o=>{if(o.isMesh)before.push({mesh:o,position:Array.from(o.geometry.attributes.position.array),material:o.material,
  inverses:o.skeleton.boneInverses,inverseValues:o.skeleton.boneInverses.map(m=>m.toArray())});});
 const prepared=prepareVisitorTemplate(source,{clothTexture:texture});
 for(const side of ['L','R'])for(const joint of ['Shoulder','UpperArm','LowerArm','Fist']){
  const original=source.scene.getObjectByName(joint+side),next=prepared.scene.getObjectByName(joint+side);
  const ratio=joint==='LowerArm'||joint==='Fist'?.85:1;
  assert.ok(Math.abs(next.position.length()-original.position.length()*ratio)<1e-7);
  assert.deepEqual(next.scale,original.scale,'no bone scaling, including hands');
 }
 // Pure hand-weighted vertices move rigidly with the shorter forearm.
 source.scene.updateMatrixWorld(true);prepared.scene.updateMatrixWorld(true);
 let handPairs=0;
 source.scene.traverse(mesh=>{if(!mesh.isSkinnedMesh)return;const next=prepared.scene.getObjectByName(mesh.name);mesh.skeleton.update();next.skeleton.update();
  for(const side of ['L','R']){
   const joint=mesh.skeleton.bones.findIndex(b=>b.name==='Fist'+side),vertices=[];
   for(let i=0;i<mesh.geometry.attributes.position.count;i++)for(let j=0;j<4;j++)if(mesh.geometry.attributes.skinIndex.getComponent(i,j)===joint&&mesh.geometry.attributes.skinWeight.getComponent(i,j)>.999)vertices.push(i);
   if(vertices.length<2)continue;
   const a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3(),d=new THREE.Vector3();
   mesh.getVertexPosition(vertices[0],a);next.getVertexPosition(vertices[0],c);
   for(const index of vertices.slice(1)){mesh.getVertexPosition(index,b);next.getVertexPosition(index,d);assert.ok(Math.abs(a.distanceTo(b)-c.distanceTo(d))<1e-5,'hand dimensions remain unchanged');handPairs++;}
  }
 });assert.ok(handPairs>10);
 const clones=[clone(prepared.scene),clone(prepared.scene)],cloth=[];
 prepared.scene.traverse(o=>{if(o.isMesh){
  const sourceMesh=source.scene.getObjectByName(o.name);
  if(/^(Shirt|Pants|Clothes|Band|Belt)$/.test(o.material.name)){
   cloth.push(o.material);assert.equal(o.material.map,texture);assert.equal(o.material.bumpMap,texture);assert.equal(o.material.roughnessMap,texture);
   assert.ok(o.geometry.attributes.uv);for(const value of o.geometry.attributes.uv.array)assert.ok(Number.isFinite(value));
   assert.equal(clones[0].getObjectByName(o.name).material,o.material);assert.equal(clones[1].getObjectByName(o.name).geometry,o.geometry);
  }else assert.equal(o.material,sourceMesh.material,'skin, face and hair finishes remain source-owned');
  for(const value of o.geometry.attributes.normal.array)assert.ok(Number.isFinite(value));
 }});assert.ok(cloth.length>=2);
 const model=clones[0],mixer=new THREE.AnimationMixer(model);mixer.clipAction(prepared.animations[0]).play();mixer.update(0);const rig=bindVisitorRig(model);
 const sourceModel=clone(source.scene),reference=new THREE.AnimationMixer(sourceModel);reference.clipAction(source.animations[0]).play();reference.update(0);
 const snapshots=()=>{model.updateMatrixWorld(true);const result=[];model.traverse(o=>{if(o.isSkinnedMesh){o.skeleton.update();const p=new THREE.Vector3();for(let i=0;i<o.geometry.attributes.position.count;i++){o.getVertexPosition(i,p);assert.ok(p.toArray().every(Number.isFinite));result.push(p.clone());}}});return result;};
 const rest=snapshots();
 for(let frame=0;frame<120;frame++){
  resetVisitorRig(rig);mixer.update(0);captureVisitorPose(rig);poseVisitorGait(rig,frame*.17,frame<60?1:0);posePersonGreeting(rig,frame/120);
  snapshots();
  for(const side of ['L','R']){const elbow=model.getObjectByName('LowerArm'+side),hand=model.getObjectByName('Fist'+side);
   assert.ok(Math.abs(elbow.position.length()-source.scene.getObjectByName('LowerArm'+side).position.length()*.85)<1e-6);
   assert.ok(Math.abs(hand.position.length()-source.scene.getObjectByName('Fist'+side).position.length()*.85)<1e-6);
  }
 }
 resetVisitorRig(rig);const reset=snapshots();assert.ok(reset.every((p,i)=>p.distanceTo(rest[i])<1e-5),'no accumulating gait/greeting deformation');
 for(let frame=0;frame<90;frame++){
  const dt=frame%11===0?0:1/30;resetVisitorRig(rig);mixer.update(dt);reference.update(dt);captureVisitorPose(rig);
  for(const side of ['L','R'])for(const joint of ['Shoulder','UpperArm','LowerArm','Fist']){
   const bone=model.getObjectByName(joint+side),expected=sourceModel.getObjectByName(joint+side),factor=['LowerArm','Fist'].includes(joint)?.85:1;
   assert.ok(bone.position.distanceTo(expected.position.clone().multiplyScalar(factor))<1e-6,'all animated position tracks retain adjusted length');
   assert.deepEqual(bone.scale,expected.scale);
  }
  poseVisitorGait(rig,frame*.2,frame%3===0?0:1);posePersonGreeting(rig,frame%60/60);
 }
 for(const record of before){assert.deepEqual(Array.from(record.mesh.geometry.attributes.position.array),record.position);assert.equal(record.mesh.material,record.material);
  assert.equal(record.mesh.skeleton.boneInverses,record.inverses);assert.deepEqual(record.mesh.skeleton.boneInverses.map(m=>m.toArray()),record.inverseValues);}
 let texturesDisposed=0;texture.addEventListener('dispose',()=>texturesDisposed++);let disposed=0;cloth.forEach(m=>m.addEventListener('dispose',()=>disposed++));
 prepared.dispose();prepared.dispose();assert.equal(disposed,new Set(cloth).size);assert.equal(texturesDisposed,0,'texture belongs to shared caller');texture.dispose();
});

test('cloth atlas is neutral sRGB with bounded irregular modulation and shared physical slots',()=>{
 const texture=createVisitorClothTexture(),data=texture.image.data;
 assert.equal(texture.colorSpace,THREE.SRGBColorSpace);assert.equal(data.byteLength,65536);assert.equal(texture.generateMipmaps,true);
 let min=255,max=0;for(let i=0;i<data.length;i+=4){min=Math.min(min,data[i]);max=Math.max(max,data[i]);assert.equal(data[i],data[i+1]);assert.equal(data[i+1],data[i+2]);}
 assert.ok(max-min>6&&max-min<20,'cloth variation stays visible but avoids a printed patchwork');
 assert.ok(texture.userData.meanLinear>.7&&texture.userData.meanLinear<.85);texture.dispose();
});
