import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import {buildTamayamaStairLandscape,tamayamaBankRoots,tamayamaBankLantern} from './tamayama-stair-landscape.mjs';
import {pathWidth} from '../geography/geo-core.mjs';
const features=JSON.parse(fs.readFileSync(new URL('../geography/features.json',import.meta.url)));
const make=(f=features,colliders=[])=>{
  const root=new THREE.Group(),surfaces={terrainHeight:(x,z)=>48+(x-80)*.04},materials={stoneMat:new THREE.MeshStandardMaterial()};
  return {root,colliders,run:()=>buildTamayamaStairLandscape(root,f,surfaces,materials,colliders)};
};
test('bank remains south of west stair, clear of mapped routes, with one independent landmark lantern',()=>{
  const {run,colliders}=make(),record=run();assert.equal(record.trees.length,3);assert.ok(record.fence.length>30);assert.deepEqual(record.lantern.point.filter((_,i)=>i!==1),tamayamaBankLantern);
  for(const r of record.fence){assert.ok(r.a[0]>=78&&r.a[0]<=93.5);assert.ok(r.a[2]>-31&&r.a[2]<-30);}
  const ids=new Set(['way/105449693','way/1133055112','way/1133055111','way/649175020']);
  for(const c of colliders){const [x,z]=c.args;for(const path of features.paths)for(let i=1;i<path.points.length;i++){
    const a=path.points[i-1],b=path.points[i],dx=b[0]-a[0],dz=b[2]-a[2],t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[2])*dz)/(dx*dx+dz*dz||1))),width=ids.has(path.id)?4.8:pathWidth(path.tags??{});
    assert.ok(Math.hypot(x-a[0]-dx*t,z-a[2]-dz*t)>width/2+.1,'new solid inside mapped public walking envelope');
  }}
  assert.ok(record.triangles<9000);assert.equal(record.drawBatches,6);
});
test('finite static meshes and colliders do not alter canonical source geometry or existing surfaces',()=>{
  const before=JSON.stringify(features),{root,colliders,run}=make();run();assert.equal(JSON.stringify(features),before);
  root.traverse(o=>{if(o.isMesh)assert.ok(Array.from(o.geometry.attributes.position.array).every(Number.isFinite));});
  assert.ok(colliders.every(c=>c.args.slice(0,-1).every(Number.isFinite)));
});
test('existing tree/lantern owners are preserved and prevent duplicates',()=>{
  const [x,z]=tamayamaBankRoots[0],prior=[{type:'cylinder',args:[x,z,.25,40,55,'mapped_tree']},{type:'box',args:[...tamayamaBankLantern,.6,.6,0,40,55,'existing_stone_lantern']}],before=JSON.stringify(prior);
  const {run}=make(features,prior),record=run();assert.equal(record.trees.length,2);assert.equal(record.lantern,null);assert.equal(JSON.stringify(prior.slice(0,2)),before);assert.equal(record.skipped[0].reason,'existing tree owner');
});
test('idempotence and missing-source handoff prevent duplicated geometry/colliders',()=>{
  const {root,colliders,run}=make(),first=run(),count=colliders.length;assert.equal(run(),first);assert.equal(root.children.length,1);assert.equal(colliders.length,count);
  const missing=make({...features,paths:features.paths.filter(p=>p.id!=='way/105449693')});assert.equal(missing.run().reason,'Main stair source unavailable');assert.equal(missing.root.children.length,0);
});
