import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {auditShinsenjoGrade} from './gonden-service-r95.mjs';
import {heightAt} from '../geography/geo-core.mjs';
import {Group,MeshStandardMaterial,Box3} from 'three';
import {buildGondenServiceR95} from './gonden-service-r95.mjs';
const features=JSON.parse(fs.readFileSync(new URL('../geography/features.json',import.meta.url)));
function grid(height){const a=[];for(let z=20;z<44;z++)for(let x=60;x<93;x++)for(const t of [[[x,z],[x,z+1],[x+1,z]],[[x+1,z],[x,z+1],[x+1,z+1]]])for(const [xx,zz]of t)a.push(xx,height(xx,zz),zz);return a;}
test('exact mapped overlap ignores high bounding-box exterior and preserves all input',()=>{
 const positions=grid(()=>44),before=positions.slice();positions.push(60,1000,20,61,1000,20,60,1000,21);
 const r=auditShinsenjoGrade(features,positions,44);assert.equal(r.complete,true);assert.equal(r.terrainRange[1],44);assert.equal(r.ready,false);assert.equal(r.reason,'floor-registration-still-required');assert.deepEqual(positions.slice(0,before.length),before);
});
test('sloping source plane identifies roof burial with actual intersection witness',()=>{
 const r=auditShinsenjoGrade(features,grid((x,z)=>44+(z-20)*.4),44);
 assert.equal(r.complete,true);assert.equal(r.reason,'terrain-above-candidate-roof');assert.ok(r.maxTerrainAboveRoof>4);assert.ok(Math.abs(r.worst.terrain-(44+(r.worst.z-20)*.4))<1e-8);assert.ok(r.worst.terrain>r.worst.roof);
});
test('missing or duplicated terrain cannot produce a registration clearance',()=>{
 assert.equal(auditShinsenjoGrade(features,[60,44,20,61,44,20,60,44,21],44).complete,false);
 assert.equal(auditShinsenjoGrade(features,grid(()=>44).concat(grid(()=>44)),44).complete,false);
 for(const a of [[],[NaN],undefined])assert.equal(auditShinsenjoGrade(features,a,44).ready,false);
});
test('actual raw DEM is a separate diagnostic and does not authorize a new floor',()=>{
 const terrain=JSON.parse(fs.readFileSync(new URL('../geography/terrain.json',import.meta.url))),r=auditShinsenjoGrade(features,grid((x,z)=>heightAt(terrain,x,z)-.06),44.122);
 assert.equal(r.complete,true);assert.ok(r.maxTerrainAboveFloor>4);assert.equal(r.ready,false);assert.match(r.action,/do not raise/);
});
test('source pickets reuse seated boundary without extending ownership or duplicating',()=>{
 const root=new Group(),owner=new Group(),material=new MeshStandardMaterial();owner.name='Gonden bounded rear service landscape R93';owner.userData={built:true,fence:[[10,44,20],[10,44.1,20.91]]};root.add(owner);
 const before=JSON.stringify(owner.userData),r=buildGondenServiceR95(root,{woodMat:material});assert.equal(r.built,true);assert.equal(r.pickets,5);assert.equal(JSON.stringify(owner.userData),before);assert.equal(buildGondenServiceR95(root,{woodMat:material}),r);
 root.updateMatrixWorld(true);const box=new Box3().setFromObject(root);assert.ok(box.min.z>20&&box.max.z<20.91);assert.ok(box.max.y<44.76);root.traverse(o=>{if(o.isMesh)assert.equal(o.material,material);});
});
test('absent or route-suppressed prior boundary adds no floating fence',()=>{
 const root=new Group(),owner=new Group();owner.name='Gonden bounded rear service landscape R93';owner.userData={built:true,fence:[]};root.add(owner);assert.equal(buildGondenServiceR95(root,{woodMat:new MeshStandardMaterial()}).built,false);assert.equal(root.children.length,1);
});
