import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import {buildApproachContextR87,approachWallIdsR87} from './approach-context-r87.mjs';
const actual=JSON.parse(fs.readFileSync(new URL('../geography/sources/entrance-barriers.json',import.meta.url)));
const make=(features={paths:[]},colliders=[],height=(x,z)=>40+z*.02)=>{
  const root=new THREE.Group(),materials={entryStoneMat:new THREE.MeshStandardMaterial()};
  const run=()=>buildApproachContextR87(root,features,actual,{terrainHeight:height},materials,colliders);
  return {root,colliders,run};
};
test('two omitted source walls keep endpoints and intervening gap, with finite terrain-seated batches',()=>{
  const {root,colliders,run}=make(),metadata=run();
  assert.deepEqual(metadata.sourceIds,approachWallIdsR87);assert.equal(metadata.drawBatches,4);assert.equal(metadata.records.length,35);
  for(const r of metadata.records){
    const source=actual.ways.find(w=>w.id===r.sourceId),[a,b]=source.points;
    const [x,y,z]=r.centre,t=(z-a[1])/(b[1]-a[1]);assert.ok(t>0&&t<1);assert.ok(Math.abs(x-a[0]-(b[0]-a[0])*t)<1e-8);
    assert.ok(z<=14.739||z>=22.264);assert.ok(Math.abs(y-(40+z*.02))<1e-8);
    assert.ok(r.ground.every(Number.isFinite));
  }
  root.traverse(o=>{if(o.isInstancedMesh){assert.ok(Array.from(o.instanceMatrix.array).every(Number.isFinite));assert.equal(o.count,35);}});
  assert.equal(colliders.length,35);assert.equal(metadata.triangles,1680);
});
test('mapped paths and existing boundary owners suppress conflicting sections',()=>{
  const features={paths:[{id:'crossing',tags:{highway:'footway',width:'3'},points:[[-20,0,10],[-12,0,10]]}]};
  const colliders=[{type:'box',args:[-16.6,28,3,.5,Math.PI/2,40,44,'existing_wall']}];
  const {run}=make(features,colliders),metadata=run();
  assert.ok(metadata.skipped.some(s=>s.reason==='mapped route clearance'));
  assert.ok(metadata.skipped.some(s=>s.reason==='existing boundary ownership'));
  assert.ok(metadata.records.every(r=>Math.abs(r.centre[2]-10)>1.5+.21+r.length/2));
});
test('repeated build preserves existing mesh/collider ownership and does not duplicate',()=>{
  const {root,colliders,run}=make(),first=run();assert.equal(run(),first);assert.equal(root.children.length,1);assert.equal(colliders.length,35);
});
test('mapped building and water footprints retain their full boundary clearance',()=>{
  for(const kind of ['buildings','water']){
    const features={paths:[],[kind]:[{points:[[-18,0,7],[-13,0,7],[-13,0,9],[-18,0,9],[-18,0,7]]}]};
    const {run}=make(features),metadata=run();
    assert.ok(metadata.skipped.some(s=>s.reason==='mapped building or water clearance'));
    assert.ok(metadata.records.every(r=>r.centre[2]<6.6||r.centre[2]>9.4));
  }
});
test('malformed ground fails visibly rather than emitting invalid geometry',()=>{
  const {run}=make({paths:[]},[],()=>NaN);assert.throws(run,/Nonfinite R87 wall ground/);
});
