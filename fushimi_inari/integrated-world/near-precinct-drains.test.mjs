import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import {nearPrecinctDrainRuns,buildNearPrecinctDrains} from './near-precinct-drains.mjs';
const features=JSON.parse(fs.readFileSync(new URL('../geography/features.json',import.meta.url)));

test('only two identified mapped landing interfaces receive finite flush batched grates',()=>{
 const root=new THREE.Group(),height=(x,z)=>50+.02*x+.03*z,surfaces={height},source=JSON.stringify(features),stone=new THREE.MeshStandardMaterial();
 const runs=nearPrecinctDrainRuns(features);assert.deepEqual(runs.map(r=>r.path),['way/1133053715','way/1392716577']);
 const result=buildNearPrecinctDrains(root,features,surfaces,{stoneMat:stone});assert.equal(result.drawCalls,3);assert.equal(result.collidersAdded,0);assert.equal(result.records.filter(r=>r.built).length,2);
 const matrix=new THREE.Matrix4(),position=new THREE.Vector3(),scale=new THREE.Vector3(),quaternion=new THREE.Quaternion();
 for(const mesh of root.children[0].children){
  assert.equal(mesh.castShadow,false);
  for(let i=0;i<mesh.count;i++){
   mesh.getMatrixAt(i,matrix);assert.ok(matrix.elements.every(Number.isFinite));matrix.decompose(position,quaternion,scale);
   const top=position.y+scale.y/2;assert.ok(Math.abs(top-height(position.x,position.z))<=.0061);assert.ok(scale.y<.0061);
  }
 }
 assert.equal(surfaces.height,height);assert.equal(JSON.stringify(features),source);
 assert.equal(buildNearPrecinctDrains(root,features,surfaces,{stoneMat:stone}),result);assert.equal(root.children.length,1);
});

test('drain declines abrupt walking grade and absent mapped context',()=>{
 const f={paths:[features.paths.find(p=>p.id==='way/1133053715')]},runs=nearPrecinctDrainRuns(f),mid=(runs[0].a[1]+runs[0].b[1])/2;
 const result=buildNearPrecinctDrains(new THREE.Group(),f,{height:(x,z)=>z<mid?50:50.4},{stoneMat:new THREE.MeshStandardMaterial()});
 assert.equal(result.records[0].built,false);assert.equal(result.drawCalls,0);assert.deepEqual(nearPrecinctDrainRuns({}),[]);
});
