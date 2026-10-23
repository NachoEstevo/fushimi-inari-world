import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import {buildShinkosuiWellR96,shinkosuiLayoutR96,SHINKOSUI_ROOF_ID} from './shinkosui-well-r96.mjs';
const features=JSON.parse(fs.readFileSync(new URL('../geography/features.json',import.meta.url)));
const terrain=y=>[58,y,14,67,y,14,58,y,22,58,y,22,67,y,14,67,y,22];
const surfaces={height:()=>44.122249,segments:[]};
test('actual mapped roof registers named well position and builds closed photo-backed pavilion',()=>{
 const plan=shinkosuiLayoutR96(features);assert.ok(plan);assert.equal(plan.id,SHINKOSUI_ROOF_ID);assert.ok(plan.width>3.59&&plan.width<3.61);assert.ok(plan.depth>2.35&&plan.depth<2.37);
 const root=new THREE.Group(),colliders=[],r=buildShinkosuiWellR96(root,features,surfaces,{},colliders,{terrainPositions:terrain(43.982249)});assert.equal(r.built,true,JSON.stringify(r));assert.deepEqual(r.builtIds,[SHINKOSUI_ROOF_ID]);assert.equal(r.posts,4);assert.equal(r.pickets,52);assert.equal(r.batches,4);assert.equal(colliders.length,1);assert.equal(r.terrainChanged,false);assert.equal(buildShinkosuiWellR96(root,features,surfaces,{},colliders,{terrainPositions:terrain(43.982249)}),r);assert.equal(colliders.length,1);
 for(const mesh of root.children[0].children){const p=mesh.geometry.attributes.position;assert.equal(mesh.geometry.attributes.uv.count,p.count);for(let i=0;i<p.count;i++){assert.ok(Number.isFinite(p.getX(i)+p.getY(i)+p.getZ(i)));assert.ok(Math.abs(p.getX(i))<=plan.width/2+.001);assert.ok(Math.abs(p.getZ(i))<=plan.depth/2+.06);assert.ok(p.getY(i)<3.1&&p.getY(i)>-.22);}}
 assert.equal(r.triangles,1888);assert.equal(r.primitives,120);
});
test('bad source, steep/incomplete terrain or unsupported floor reject without geometry or collider mutation',()=>{
 const cases=[{f:{buildings:[]},s:surfaces,t:terrain(43.98)},{f:features,s:surfaces,t:[]},{f:features,s:surfaces,t:terrain(40)},{f:features,s:surfaces,t:[58,43,14,67,46,14,58,43,22,58,43,22,67,46,14,67,46,22]}];
 for(const {f,s,t}of cases){const root=new THREE.Group(),colliders=[],r=buildShinkosuiWellR96(root,f,s,{},colliders,{terrainPositions:t});assert.equal(r.built,false);assert.equal(root.children.length,0);assert.equal(colliders.length,0);}
});
test('public corridor overlap fails but actual service-stub remains clear of inset fence',()=>{
 const root=new THREE.Group(),colliders=[],path={id:'probe',a:[58,44,18.3],b:[67,44,18.3],width:1.8};assert.equal(buildShinkosuiWellR96(root,features,{...surfaces,segments:[path]}, {},colliders,{terrainPositions:terrain(43.98)}).reason,'mapped-walking-corridor-conflict');
 const p=features.paths.find(p=>p.id==='way/751194636');const r=buildShinkosuiWellR96(root,features,{...surfaces,segments:[{id:p.id,a:p.points[0],b:p.points[1],width:1.8}]},{},colliders,{terrainPositions:terrain(43.98)});assert.equal(r.built,true,JSON.stringify(r));
 const c=colliders[0].args;assert.ok(p.points[0][0]-(c[0]+c[2])>.9);
});

test('existing physical owner is never overwritten by the replacement well',()=>{const root=new THREE.Group(),colliders=[{type:'box',args:[62.133,18.34,.4,.4,0,43,48,'existing-probe']}];const r=buildShinkosuiWellR96(root,features,surfaces,{},colliders,{terrainPositions:terrain(43.98)});assert.equal(r.reason,'existing-solid-conflict');assert.equal(root.children.length,0);assert.equal(colliders.length,1);});
