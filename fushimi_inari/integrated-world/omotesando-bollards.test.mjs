import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import {omotesandoBollardLayout,buildOmotesandoBollards} from './omotesando-bollards.mjs';
import {makeOmotesandoShoulderExclusion} from './omotesando-shoulders-layout.mjs';

const features=JSON.parse(fs.readFileSync(new URL('../geography/features.json',import.meta.url)));
test('observed subset stays outside main avenue and all mapped adjacent obstacles',()=>{
  const records=omotesandoBollardLayout(features),blocked=makeOmotesandoShoulderExclusion(features);
  assert.ok(records.length>=4&&records.length<=6,JSON.stringify(records));
  for(const r of records){assert.ok(r.offset>=4.55);assert.equal(blocked(r.x,r.z,.18),false);assert.ok([44,66,88].includes(r.station));}
  assert.deepEqual(omotesandoBollardLayout({paths:[],buildings:[],water:[]}),[]);
});
test('columns seat on sloping ground, retain unrelated scene work, and do not duplicate on repeat',()=>{
  const root=new THREE.Group(),old=new THREE.Group(),colliders=[];root.add(old);
  const surfaces={height:(x,z)=>38+x*.01+z*.02},materials={entryStoneMat:new THREE.MeshStandardMaterial()};
  const report=buildOmotesandoBollards(root,features,surfaces,materials,colliders);
  assert.equal(report.pointLights,0);assert.equal(report.materialBatches,4);assert.equal(colliders.length,report.count);
  for(const r of report.records){assert.ok(r.footingBottom<r.base);assert.ok(Number.isFinite(r.base));}
  assert.equal(root.children[0],old);assert.equal(buildOmotesandoBollards(root,features,surfaces,materials,colliders),report);assert.equal(root.children.length,2);assert.equal(colliders.length,report.count);
  root.updateWorldMatrix(true,true);const box=new THREE.Box3().setFromObject(root.children[1]);assert.ok(Number.isFinite(box.min.y)&&Number.isFinite(box.max.y));
  assert.throws(()=>buildOmotesandoBollards(new THREE.Group(),features,{height:()=>NaN},materials,[]),/Nonfinite/);
});
