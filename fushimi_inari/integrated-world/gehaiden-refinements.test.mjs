import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import * as THREE from 'three';
import * as refinement from './gehaiden-refinements.mjs';

function fixture(){
 const data=readFileSync(new URL('./gehaiden.glb',import.meta.url)),length=data.readUInt32LE(12),json=JSON.parse(data.subarray(20,20+length)),bin=data.subarray(28+length);
 const widths={SCALAR:1,VEC2:2,VEC3:3,VEC4:4},types={5126:Float32Array,5123:Uint16Array,5125:Uint32Array,5121:Uint8Array};
 const attr=i=>{const a=json.accessors[i],v=json.bufferViews[a.bufferView],T=types[a.componentType];assert.ok(!v.byteStride);return new THREE.BufferAttribute(new T(bin.buffer,bin.byteOffset+(v.byteOffset??0)+(a.byteOffset??0),a.count*widths[a.type]).slice(),widths[a.type],!!a.normalized);};
 const scene=new THREE.Group(),materials=json.materials.map(m=>{const material=new THREE.MeshStandardMaterial();material.name=m.name;return material;});
 for(const node of json.nodes){if(node.mesh===undefined)continue;const primitive=json.meshes[node.mesh].primitives[0],geometry=new THREE.BufferGeometry();
  for(const [name,index]of Object.entries(primitive.attributes))geometry.setAttribute(({POSITION:'position',NORMAL:'normal',TEXCOORD_0:'uv'})[name]??name,attr(index));
  if(primitive.indices!==undefined)geometry.setIndex(attr(primitive.indices));const mesh=new THREE.Mesh(geometry,materials[primitive.material]);mesh.name=node.name;scene.add(mesh);
 }
 return scene;
}
function digest(scene){
 const materials=new Map(),geometries=new Map(),objects=[];
 scene.traverse(object=>{
  const material=object.material,g=object.geometry;if(material&&!materials.has(material))materials.set(material,materials.size);if(g&&!geometries.has(g))geometries.set(g,geometries.size);
  const attr=a=>({itemSize:a.itemSize,normalized:a.normalized,array:createHash('sha256').update(Buffer.from(a.array.buffer,a.array.byteOffset,a.array.byteLength)).digest('hex')});
  objects.push({name:object.name,children:object.children.length,position:object.position.toArray(),rotation:object.quaternion.toArray(),scale:object.scale.toArray(),castShadow:object.castShadow,receiveShadow:object.receiveShadow,userData:object.userData,
   material:material?{binding:materials.get(material),name:material.name,color:material.color.getHex(),roughness:material.roughness,metalness:material.metalness}:null,
   geometry:g?{binding:geometries.get(g),attributes:Object.fromEntries(Object.entries(g.attributes).map(([name,a])=>[name,attr(a)])),index:g.index?attr(g.index):null,bounds:g.boundingBox?{min:g.boundingBox.min.toArray(),max:g.boundingBox.max.toArray()}:null,sphere:g.boundingSphere?{center:g.boundingSphere.center.toArray(),radius:g.boundingSphere.radius}:null}:null});
 });
 return createHash('sha256').update(JSON.stringify(objects)).digest('hex');
}
// Captured from the original synchronous implementation before introducing stages.
// r186 independently reproduced from unchanged HEAD f448b9f builders: newer
// SphereGeometry ring-radius math changes fastener position/normal bytes.
const originalDigests={
 '164':'9deb3b80c45be7e36bc69e938f862a3d46f8ade37bb1afbffaf9842d2dc7b1b5',
 '180':'9deb3b80c45be7e36bc69e938f862a3d46f8ade37bb1afbffaf9842d2dc7b1b5',
 '186':'0e96addaccd58f22c4a8736bdc59af3637851828a2ea98fd6a797e6877a67c74'
};

test('staged Gehaiden preserves every original production buffer, transform, binding and diagnostic',()=>{
 assert.equal(typeof refinement.refineGehaidenStages,'function');
 const originalDigest=originalDigests[THREE.REVISION];assert.ok(originalDigest,`Original production digest required for Three r${THREE.REVISION}`);
 for(const staged of [false,true]){
  const scene=fixture();let returned;
  if(staged){const stages=refinement.refineGehaidenStages(scene),labels=[];let step;do{step=stages.next();if(!step.done)labels.push(step.value);}while(!step.done);returned=step.value;assert.ok(labels.length>20);assert.ok(labels.includes('gehaiden:rails'));assert.ok(labels.includes('gehaiden:fittings'));}
  else returned=refinement.refineGehaiden(scene);
  assert.equal(returned,undefined);assert.equal(digest(scene),originalDigest);assert.equal(scene.userData.gehaidenBalustradeRemovalCount,3);
  const before=digest(scene),next=refinement.refineGehaidenStages(scene).next();assert.equal(next.done,true);assert.equal(next.value,undefined);assert.equal(digest(scene),before);
 }
});

test('staged missing source components leave source meshes and children intact',()=>{
 assert.equal(typeof refinement.refineGehaidenStages,'function');
 for(const tagged of [false,true]){
  const scene=new THREE.Group(),material=new THREE.MeshStandardMaterial();if(tagged)material.name='MAT_Vermilion_ShuIro';
  const geometry=new THREE.BoxGeometry(),mesh=new THREE.Mesh(geometry,material);let disposedClones=0;const clone=geometry.clone.bind(geometry);geometry.clone=()=>{const copy=clone();copy.addEventListener('dispose',()=>disposedClones++);return copy;};scene.add(mesh);const stages=refinement.refineGehaidenStages(scene);let step;do{step=stages.next();}while(!step.done);
  assert.equal(step.value,undefined);assert.equal(scene.children.length,1);assert.equal(mesh.geometry,geometry);assert.equal(mesh.parent,scene);assert.equal(scene.userData.gehaidenBalustradeRemovalCount,0);assert.equal(scene.userData.gehaidenBalustradeRefined,undefined);assert.equal(disposedClones,tagged?1:0);
 }
});

test('partial production signature declines before applying any replacement geometry',()=>{
 assert.equal(typeof refinement.refineGehaidenStages,'function');
 const scene=fixture(),gold=scene.children.find(mesh=>mesh.material.name.includes('Gold_Kanagu_Leaf'));gold.geometry=new THREE.BoxGeometry();
 const snapshots=scene.children.map(mesh=>[mesh,mesh.geometry]),stages=refinement.refineGehaidenStages(scene);let step;do{step=stages.next();}while(!step.done);
 assert.equal(scene.userData.gehaidenBalustradeRemovalCount,2);assert.equal(scene.userData.gehaidenBalustradeRefined,undefined);assert.equal(scene.children.length,snapshots.length);
 for(const [mesh,geometry]of snapshots){assert.equal(mesh.geometry,geometry);assert.equal(mesh.parent,scene);}
});
