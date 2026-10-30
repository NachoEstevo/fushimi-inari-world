import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import * as THREE from 'three';
import * as spatial from './spatial-mesh.mjs';

function fixture(indexed=false){
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute([-2,1,-1,1,2,-1,-2,3,1,162,4,0,164,5,0,162,6,2,2,1,0,4,2,0,2,3,2],3));
  geometry.setAttribute('uv',new THREE.Float32BufferAttribute(Array.from({length:18},(_,i)=>i*.13),2));
  geometry.setAttribute('color',new THREE.BufferAttribute(Uint8Array.from({length:27},(_,i)=>i*7),3,true));
  if(indexed)geometry.setIndex([0,1,2,3,4,5,6,7,8,0,2,1]);
  geometry.computeVertexNormals();
  const a=new THREE.MeshStandardMaterial(),b=new THREE.MeshStandardMaterial();a.name='a';b.name='b';
  return {geometry,a,b};
}
function snapshot(group){
  return group.children.map(mesh=>({material:mesh.material.name,receiveShadow:mesh.receiveShadow,
    bounds:{center:mesh.geometry.boundingSphere.center.toArray(),radius:mesh.geometry.boundingSphere.radius},index:mesh.geometry.index,
    attributes:Object.fromEntries(Object.entries(mesh.geometry.attributes).map(([key,a])=>[key,{type:a.array.constructor.name,size:a.itemSize,normalized:a.normalized,hash:createHash('sha256').update(new Uint8Array(a.array.buffer,a.array.byteOffset,a.array.byteLength)).digest('hex')}]))}));
}

test('spatial triangle partition retains pre-change attribute bytes, bucket order and bounds',()=>{
  const hashes=[];
  for(const indexed of [false,true]){const f=fixture(indexed),group=spatial.spatialMeshes(f.geometry,f.a,160,x=>x>160?f.b:f.a);hashes.push(createHash('sha256').update(JSON.stringify(snapshot(group))).digest('hex'));}
  assert.deepEqual(hashes,['552c77382f730fde3f0527841fc029c78acb4cc8537d223051a9d27cb354ba5a','166104b952af372212c716add1b9294c4cdfd948a7a9b541840e122bf7507181']);
});

test('contiguous triangle runs copy each attribute without creating per-vertex views',()=>{
  const f=fixture();let views=0;
  for(const a of Object.values(f.geometry.attributes)){const original=a.array.subarray.bind(a.array);a.array.subarray=(...args)=>{views++;return original(...args);};}
  spatial.spatialMeshes(f.geometry,f.a,1000);
  assert.ok(views<=Object.keys(f.geometry.attributes).length*3,`expected at most one typed view per contiguous bucket run, got ${views}`);
});

test('paced spatial partition preserves sync output and yields during triangle work',async()=>{
  assert.equal(typeof spatial.spatialMeshesAsync,'function');
  const f=fixture(true),expected=spatial.spatialMeshes(f.geometry,f.a,160,x=>x>160?f.b:f.a);
  let elapsed=0,yields=0;const position=f.geometry.attributes.position,getX=position.getX.bind(position);position.getX=i=>{elapsed+=4;return getX(i);};
  // Nonindexed input makes the injected sampler clock observe partition work.
  const plain=f.geometry.toNonIndexed(),p=plain.attributes.position,plainX=p.getX.bind(p);p.getX=i=>{elapsed+=4;return plainX(i);};
  const actual=await spatial.spatialMeshesAsync(plain,f.a,160,x=>x>160?f.b:f.a,{yieldWork:async()=>{yields++;},now:()=>elapsed});
  assert.deepEqual(snapshot(actual),snapshot(expected));assert.ok(yields>0);
});
