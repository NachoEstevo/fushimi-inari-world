import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import {heightAt} from '../geography/geo-core.mjs';
import {yotsuGrade} from './site-grading.mjs';
import {makePathSurfaces} from './path-surfaces.mjs';
import {buildYotsutsujiContextR96,routeClearR96} from './yotsutsuji-context-r96.mjs';
const features=JSON.parse(fs.readFileSync(new URL('../geography/features.json',import.meta.url))),terrain=JSON.parse(fs.readFileSync(new URL('../geography/terrain.json',import.meta.url)));
const ground=(x,z)=>yotsuGrade(x,z,heightAt(terrain,x,z)),surfaces=makePathSurfaces(features,ground);
function owner(){const root=new THREE.Group(),old=new THREE.Group();old.name='Yotsutsuji mapped tea houses';root.add(old);return root;}
test('court furnishings and planted bank retain route envelopes and source owners',()=>{
 const root=owner(),before=JSON.stringify(features),s=buildYotsutsujiContextR96(root,features,ground,surfaces);
 assert.equal(s.built,true);assert.equal(s.collidersAdded,0);assert.equal(s.terrainChanged,false);
 assert.equal(s.records.filter(r=>r.kind==='existing-bench-pad').length,2);
 assert.ok(s.records.some(r=>r.kind==='bank-hedge-rock-fern'));
 for(const r of s.records.filter(r=>r.radius))assert.ok(routeClearR96(r.x,r.z,r.radius,surfaces.segments));
 assert.ok(s.stats.batches<=8&&s.stats.triangles<5000);
 for(const mesh of root.children[1].children){
  assert.equal(mesh.material.transparent,false);assert.ok(mesh.castShadow&&mesh.receiveShadow);
  const p=mesh.geometry.attributes.position;
  for(let i=0;i<p.count;i++)assert.ok([p.getX(i),p.getY(i),p.getZ(i)].every(Number.isFinite));
 }
 assert.equal(JSON.stringify(features),before);assert.equal(buildYotsutsujiContextR96(root,features,ground,surfaces),s);assert.equal(root.children.length,2);
 console.log('R96 actual mapped route packet:',JSON.stringify(s));
});
test('route guard handles segment ends and rejects all new furniture on occupied ground',()=>{
 assert.equal(routeClearR96(0,0,.5,[{a:[0,0,0],b:[1,0,0],width:2}]),false);
 assert.equal(routeClearR96(1.8,0,.5,[{a:[0,0,0],b:[1,0,0],width:2}]),false);
 const blocked={segments:[{a:[780,0,-212],b:[810,0,-212],width:40}]};
 const s=buildYotsutsujiContextR96(owner(),features,ground,blocked);
 assert.equal(s.records.length,2);assert.equal(s.skipped.length,11);
});
test('missing source floor/owner/network and invalid bench ground leave no partial group',()=>{
 for(const [root,f,g,n] of [[new THREE.Group(),features,ground,surfaces],[owner(),{buildings:[]},ground,surfaces],[owner(),features,ground,{}],[owner(),features,()=>NaN,surfaces]]){
  const count=root.children.length;assert.equal(buildYotsutsujiContextR96(root,f,g,n).built,false);assert.equal(root.children.length,count);
 }
});
