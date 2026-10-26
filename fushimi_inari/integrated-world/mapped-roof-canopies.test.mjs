import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from 'three';
import {buildMappedRoofCanopies,MITSURUGI_CANOPY_ID} from './mapped-roof-canopies.mjs';
const features=JSON.parse(readFileSync(new URL('../geography/features.json',import.meta.url)));

test('mapped Mitsurugi roof retains cover and posts while its center stays open',()=>{
  const root=new THREE.Group(),colliders=[],before=JSON.stringify(features);
  const report=buildMappedRoofCanopies(root,features,{height:(x,z)=>183+x*.001+z*.001},{},colliders);
  assert.deepEqual(report.builtIds,[MITSURUGI_CANOPY_ID]);assert.equal(colliders.length,4);
  const feature=features.buildings.find(b=>b.id===MITSURUGI_CANOPY_ID),ring=feature.points.slice(0,-1),x=ring.reduce((s,p)=>s+p[0],0)/4,z=ring.reduce((s,p)=>s+p[2],0)/4;
  root.updateMatrixWorld(true);
  assert.equal(new THREE.Raycaster(new THREE.Vector3(x,184,z-2),new THREE.Vector3(0,0,1)).intersectObject(root,true).length,0,'no generic wall across center');
  const roofHit=new THREE.Raycaster(new THREE.Vector3(x,report.roofY+2,z),new THREE.Vector3(0,-1,0)).intersectObject(root,true);
  assert.ok(roofHit.length>0,'roof is visible from above');
  for(const collider of colliders){assert.equal(collider.type,'cylinder');assert.ok(Math.hypot(collider.args[0]-x,collider.args[1]-z)>.2);}
  const p=root.children[0].children[0].geometry.attributes.position;
  for(let i=0;i<p.count;i++){assert.ok(p.getX(i)>=Math.min(...ring.map(p=>p[0]))-.001&&p.getX(i)<=Math.max(...ring.map(p=>p[0]))+.001);assert.ok(p.getY(i)>=report.roofY-.001);}
  assert.equal(buildMappedRoofCanopies(root,features,{height:()=>0},{},colliders),report);assert.equal(colliders.length,4);assert.equal(JSON.stringify(features),before);
});

test('missing footprint, changed building type and nonfinite supports create no replacement',()=>{
  for(const mode of ['missing','type','support']){
    const root=new THREE.Group(),colliders=[],source=structuredClone(features);
    if(mode==='missing')source.buildings=[];
    if(mode==='type')source.buildings.find(b=>b.id===MITSURUGI_CANOPY_ID).tags.building='yes';
    assert.deepEqual(buildMappedRoofCanopies(root,source,{height:()=>mode==='support'?NaN:183},{},colliders).builtIds,[]);
    assert.equal(root.children.length,0);assert.equal(colliders.length,0);
  }
});
