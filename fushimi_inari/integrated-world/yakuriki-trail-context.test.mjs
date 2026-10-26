import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from 'three';
import {buildYakurikiTrailContext} from './yakuriki-trail-context.mjs';
const features=JSON.parse(readFileSync(new URL('../geography/features.json',import.meta.url)));
test('targeted unresolved proxies and open cafe retain source data and bounded geometry',()=>{
 const before=JSON.stringify(features),root=new THREE.Group(),wood=new THREE.MeshStandardMaterial({map:new THREE.Texture()}),roof=new THREE.MeshStandardMaterial({map:new THREE.Texture()});
 const r=buildYakurikiTrailContext(root,features,{height:()=>164},{woodMat:wood,roofMat:roof});
 assert.deepEqual(r.builtIds,['way/626313719','way/626342324','way/626342322','way/626342320','way/1270597605','way/626313722']);
 assert.equal(JSON.stringify(features),before);assert.ok(r.triangles>0&&r.triangles<1500);assert.equal(r.roofY,166.9);assert.equal(r.cafeFrontage,'open');
 assert.ok(root.getObjectByName('Inferred Yakuriki cafe roof').geometry.attributes.uv);
 root.traverse(o=>{if(o.isMesh)assert.ok(o.geometry.attributes.uv);});
 assert.equal(buildYakurikiTrailContext(root,features,{height:()=>0}),r);
});
test('changed source classification or surveyed heights are not suppressed; unavailable cafe leaves fallback available',()=>{
 const f=structuredClone(features);f.buildings.find(b=>b.id==='way/626342324').tags.height='3';f.buildings.find(b=>b.id==='way/1270597605').tags.building='yes';
 const r=buildYakurikiTrailContext(new THREE.Group(),f,{height:()=>NaN});
 assert.ok(!r.builtIds.includes('way/626342324'));assert.ok(!r.builtIds.includes('way/1270597605'));assert.ok(!r.builtIds.includes('way/626313722'));assert.equal(r.triangles,0);
});
test('path direction does not change the cafe datum, and surveyed cafe height retains fallback ownership',()=>{
 const surface={height:(x,z)=>x*.03+z*.02}, reversed=structuredClone(features);
 reversed.paths.find(p=>p.id==='way/60272187').points.reverse();
 const a=buildYakurikiTrailContext(new THREE.Group(),features,surface),b=buildYakurikiTrailContext(new THREE.Group(),reversed,surface);
 assert.ok(Math.abs(a.floor-b.floor)<1e-10);assert.ok(Math.abs(a.roofY-b.roofY)<1e-10);
 for(const tag of ['height','building:levels']){
  const changed=structuredClone(features);changed.buildings.find(p=>p.id==='way/626313722').tags[tag]='2';
  const result=buildYakurikiTrailContext(new THREE.Group(),changed,surface);
  assert.ok(!result.builtIds.includes('way/626313722'));
 }
});
