import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {buildSenbonRestFrontage} from './senbon-rest-r94.mjs';

const materials={entryStoneMat:new THREE.MeshStandardMaterial()};
test('mapped rest envelope closes real gable ends with finite, bounded static batches',()=>{
  const parent=new THREE.Group(),r=buildSenbonRestFrontage(parent,{id:'way/301527739',width:12,depth:6},materials);
  assert.equal(parent.children.length,1);assert.equal(r.stats.batches,3);assert.ok(r.stats.triangles<5000);
  const bounds=new THREE.Box3().setFromObject(r.group);
  assert.ok(bounds.min.y>.1&&bounds.max.y<4.25);
  assert.ok(bounds.min.x>-6.6&&bounds.max.x<6.6);
  assert.ok(bounds.min.z>-3.8&&bounds.max.z<3.8);
  const boardMesh=r.group.children.find(m=>m.material.color?.getHexString()==='63513e');
  // Both formerly open gables contain their centre/peak vertices.
  const p=boardMesh.geometry.attributes.position;
  for(const side of [-1,1])assert.ok(Array.from({length:p.count},(_,i)=>i).some(i=>Math.abs(p.getX(i)-side*6.025)<1e-5&&Math.abs(p.getY(i)-4.15)<1e-5));
  for(const mesh of r.group.children){assert.ok(mesh.castShadow&&mesh.receiveShadow);for(const v of mesh.geometry.attributes.position.array)assert.ok(Number.isFinite(v));}
});
test('augmentation is idempotent and refuses unmapped or malformed footprints',()=>{
  const g=new THREE.Group(),spec={id:'way/301527730',width:8,depth:5};
  assert.ok(buildSenbonRestFrontage(g,spec,materials));
  assert.equal(buildSenbonRestFrontage(g,spec,materials),null);assert.equal(g.children.length,1);
  for(const spec of [{id:'invented',width:8,depth:5},{id:'way/301527730',width:NaN,depth:5},{id:'way/301527730',width:8,depth:0}]){
    const empty=new THREE.Group();assert.equal(buildSenbonRestFrontage(empty,spec,materials),null);assert.equal(empty.children.length,0);
  }
});
