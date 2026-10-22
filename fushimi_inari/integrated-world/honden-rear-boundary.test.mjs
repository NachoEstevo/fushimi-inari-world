import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from 'three';
import {buildHondenRearBoundary,hondenRearBoundaryPlan as plan} from './honden-rear-boundary.mjs';
const features=JSON.parse(readFileSync(new URL('../geography/features.json',import.meta.url)));
const fixture=()=>({root:new THREE.Group(),surfaces:{height:()=>8,segments:[]},colliders:[]});
const build=f=>buildHondenRearBoundary(f.root,features,f.surfaces,{},f.colliders);
test('real mapped anchors permit bounded run north of Mikoshiko with static batches and no sanctuary replacement',()=>{
 const f=fixture(),r=build(f);assert.equal(r.built,true);assert.equal(r.trees,3);assert.equal(f.colliders.length,4);
 const bounds=new THREE.Box3().setFromObject(f.root);assert.ok(bounds.max.z<1);assert.ok(bounds.min.x>73);assert.ok(bounds.max.x<82);
 assert.ok(f.root.children[0].children.length<=7);assert.ok(f.root.children[0].children.every(o=>o.isInstancedMesh));
 assert.equal(build(f),r);assert.equal(f.colliders.length,4);assert.equal(plan.center[1],-.45);
});
test('mapped corridor rejects complete run rather than cutting opening or changing route',()=>{
 const f=fixture();f.surfaces.segments=[{id:'test',a:[74,8,-.45],b:[81,8,-.45],width:1}];
 assert.equal(build(f).built,false);assert.equal(f.root.children.length,0);assert.equal(f.colliders.length,0);
});
test('existing solid and unsupported relief prevent duplicate or floating boundary',()=>{
 for(const setup of [f=>f.colliders.push({type:'box',args:[77.6,-.45,1,1,0,8,12,'existing']}),f=>f.surfaces.height=()=>NaN,f=>f.surfaces.height=x=>x]){
  const f=fixture();setup(f);assert.equal(build(f).built,false);assert.equal(f.root.children.length,0);
 }
});
test('missing anchors do not assign an invented location',()=>{
 const f=fixture();assert.equal(buildHondenRearBoundary(f.root,{buildings:[]},f.surfaces,{},f.colliders).built,false);
});
test('real east approach at z1.7 remains clear and background paths exclude planting',()=>{
 const f=fixture();f.surfaces.segments=[{id:'way/1297255919',a:[71.045,8,1.759],b:[84.537,8,1.703],width:1.8},{id:'testBackground',a:[72,8,-3.3],b:[83,8,-3.3],width:1}];
 const r=build(f);assert.equal(r.built,true);assert.equal(r.trees,0);assert.equal(f.colliders.length,1);
});
test('rendered triangle relief gets a bounded low foundation, never coarse-height floating or a tall retaining wall',()=>{
 const terrain=h=>[73,8,-5,82,8+h,-5,82,8+h,1,73,8,-5,82,8+h,1,73,8,1];
 const f=fixture();f.surfaces.height=()=>100;
 const r=buildHondenRearBoundary(f.root,features,f.surfaces,{},f.colliders,{terrainPositions:terrain(.3)});
 assert.equal(r.built,true);assert.ok(r.base<9);assert.ok(r.relief<.3);assert.ok(r.foundationBottom<r.base);
 assert.equal(r.support,'clipped rendered triangle extrema');
 const steep=fixture();assert.equal(buildHondenRearBoundary(steep.root,features,steep.surfaces,{},steep.colliders,{terrainPositions:terrain(2)}).built,false);
 const missing=fixture();assert.equal(buildHondenRearBoundary(missing.root,features,missing.surfaces,{},missing.colliders,{terrainPositions:[]}).built,false);
});
