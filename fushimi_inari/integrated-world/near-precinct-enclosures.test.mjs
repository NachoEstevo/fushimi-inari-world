import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import {nearPrecinctEnclosureRuns,nearPrecinctEnclosurePlan,buildNearPrecinctEnclosures} from './near-precinct-enclosures.mjs';
import {makePathSurfaces} from './path-surfaces.mjs';
import {tamayamaAccessFeatures} from './tamayama-access-width.mjs';

const features=tamayamaAccessFeatures(JSON.parse(fs.readFileSync(new URL('../geography/features.json',import.meta.url))));
const network=()=>makePathSurfaces(features,(x,z)=>50+x*.02+z*.003);

test('runs are bounded to actual row/Okumiya roof bounds and never include existing Tamayama fences',()=>{
  const runs=nearPrecinctEnclosureRuns(features);
  assert.equal(runs.length,2);
  const white=runs.find(r=>r.kind==='white'),red=runs.find(r=>r.kind==='red');
  assert.ok(white.a[0]>=81&&white.b[0]<=98);assert.ok(white.a[1]<-44.3&&white.a[1]>-45);
  assert.ok(red.a[0]>=120&&red.b[0]<129);assert.ok(red.a[1]>-11&&red.a[1]<-10);
  assert.ok(runs.every(r=>!r.sourceBuildings.includes('way/305214602')));
  assert.deepEqual(nearPrecinctEnclosureRuns({buildings:[]}),[]);
});

test('sections enter terrain and exclude a crossing route with clearance',()=>{
  const n=network(),white=nearPrecinctEnclosureRuns(features)[0];
  n.segments.push({id:'crossing',a:[89,0,white.a[1]-3],b:[89,0,white.a[1]+3],width:2});
  const sections=nearPrecinctEnclosurePlan(features,n);assert.ok(sections.length>10);
  for(const s of sections){
    for(const [x,z]of s.footprint)assert.ok(s.bottom<n.terrainHeight(x,z));
    assert.ok(s.base+s.height>s.base);
    if(s.id===white.id)assert.ok(s.footprint.every(([x])=>x<=87.7||x>=90.3));
  }
});

test('builder reuses materials, makes matching solid blockers and is idempotent without changing source or walking',()=>{
  const root=new THREE.Group(),n=network(),colliders=[],source=JSON.stringify(features),segments=JSON.stringify(n.segments),height=n.height,terrain=n.terrainHeight;
  const materials=Object.fromEntries(['stoneMat','plasterMat','vermilionMat','copperRoofMat'].map(k=>[k,new THREE.MeshStandardMaterial()]));
  const record=buildNearPrecinctEnclosures(root,features,n,materials,colliders);
  assert.ok(record.sections>10);assert.ok(record.materialBatches<=4);assert.ok(record.triangles<3500);
  assert.equal(colliders.length,record.sections);assert.equal(root.children.length,1);
  for(const mesh of root.children[0].children){assert.ok(Object.values(materials).includes(mesh.material));for(const v of mesh.geometry.attributes.position.array)assert.ok(Number.isFinite(v));}
  assert.equal(buildNearPrecinctEnclosures(root,features,n,materials,colliders),null);
  assert.equal(JSON.stringify(features),source);assert.equal(JSON.stringify(n.segments),segments);assert.equal(n.height,height);assert.equal(n.terrainHeight,terrain);
});
