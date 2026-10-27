import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import * as THREE from 'three';
import {buildEntranceMappedBoundaries} from './entrance-mapped-boundaries.mjs';
import {installStaticColorCull} from './static-color-cull.mjs';

function fixture(){
 const root=new THREE.Group(),colliders=[],barriers=[
  {id:'way/1133052410',points:[[0,0],[3,0]],tags:{height:'2.1'}},
  {id:'way/1133052411',points:[[0,4],[3,4]],tags:{barrier:'hedge'}},
  {id:'way/ignored',points:[[20,20],[25,25]],tags:{barrier:'wall'}}
 ];
 const result=buildEntranceMappedBoundaries(root,barriers,(x,z)=>x*.1+z*.02,{entryStoneMat:new THREE.MeshStandardMaterial({color:'#777777'})},colliders);
 root.updateMatrixWorld(true);return {root,colliders,result};
}
function digest({root,colliders,result}){
 const {group,...metadata}=result,objects=[],materials=new Map();
 const attr=a=>({itemSize:a.itemSize,normalized:a.normalized,array:createHash('sha256').update(Buffer.from(a.array.buffer,a.array.byteOffset,a.array.byteLength)).digest('hex')});
 root.traverse(object=>{
  const material=object.material,g=object.geometry;if(material&&!materials.has(material))materials.set(material,materials.size);
  objects.push({name:object.name,children:object.children.length,position:object.position.toArray(),rotation:object.quaternion.toArray(),scale:object.scale.toArray(),castShadow:object.castShadow,receiveShadow:object.receiveShadow,
   material:material?{binding:materials.get(material),color:material.color.getHex(),roughness:material.roughness,metalness:material.metalness,side:material.side}:null,
   geometry:g?{attributes:Object.fromEntries(Object.entries(g.attributes).map(([name,a])=>[name,attr(a)])),index:g.index?attr(g.index):null}:null,
   instanceMatrix:object.instanceMatrix?attr(object.instanceMatrix):null,instanceColor:object.instanceColor?attr(object.instanceColor):null});
 });
 return createHash('sha256').update(JSON.stringify({objects,colliders,metadata})).digest('hex');
}
// Captured before adding the group handle to the builder's return value.
const originalDigest='02737e7434781319e656aa31ba2a339914dac034f438c0c1067d61269b2ab3f4';

test('returns the exact owned static group and preserves original metadata, colliders and buffers',()=>{
 const f=fixture(),{group,...metadata}=f.result;
 assert.ok(group?.isGroup,'builder must return its constructed ownership root');assert.equal(group.parent,f.root);assert.equal(f.root.children[0],group);
 assert.deepEqual(group.userData.provenance,metadata);assert.equal(Object.hasOwn(group.userData.provenance,'group'),false);
 assert.equal(digest(f),originalDigest);assert.doesNotThrow(()=>JSON.stringify(group.userData.provenance));
 assert.equal(metadata.ways.length,2);assert.equal(f.colliders.length,6);
});

test('explicit mapped ownership culls distant tile caps and sloping walls while retaining near and shadow draws',()=>{
 const f=fixture(),{group}=f.result;assert.ok(group?.isGroup);
 const camera=new THREE.PerspectiveCamera(45,1,.2,150);camera.position.set(0,0,1000);camera.updateMatrixWorld(true);
 const tile=group.getObjectByName('Mapped wall individual curved tile caps'),sheared=group.children.find(o=>o.isInstancedMesh&&o.material.color.getHex()===0x594d3e);
 assert.ok(tile&&sheared);let fn=null;const calls=[],renderer={getRenderObjectFunction:()=>fn,setRenderObjectFunction:value=>{fn=value;},renderObject(object){calls.push(object);}};
 const cull=installStaticColorCull(renderer,camera,[{object:group}]);
 try{
  cull.update();fn(tile,{},camera);assert.equal(calls.length,0,'distant static tile caps must be rejected before material construction');
  fn(tile,{},new THREE.OrthographicCamera());assert.deepEqual(calls,[tile],'shadow cameras always retain their draw');
  fn(sheared,{},camera);assert.deepEqual(calls,[tile],'conservative affine boxes allow rejection of distant sloping walls');
  fn(sheared,{},new THREE.OrthographicCamera());assert.deepEqual(calls,[tile,sheared]);
  camera.position.set(1.5,1.7,10);cull.update();fn(tile,{},camera);fn(sheared,{},camera);assert.deepEqual(calls,[tile,sheared,tile,sheared],'nearby original geometry remains visible');
  assert.equal(digest(f),originalDigest,'installing and drawing the hook must not change builder output');
 }finally{cull.dispose();assert.equal(fn,null);}
});
