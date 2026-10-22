import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {buildRomonSurroundingsR72,romonCourtDrainRuns} from './romon-surroundings-r72.mjs';
import {rigidPoint} from './spatial.mjs';

test('north drainage meets existing threshold, stays clear of the central arch and is idempotent',()=>{
  const root=new THREE.Group(),existing=new THREE.Group();existing.name='existing architecture';root.add(existing);
  const romon={source:[0,1.6,0],target:[12,42,-5],yaw:-1.51};
  const stone=new THREE.MeshStandardMaterial(),surfaces={height:()=>40.4};
  const report=buildRomonSurroundingsR72(root,romon,surfaces,{entryStoneMat:stone});
  assert.deepEqual(romonCourtDrainRuns[0].a,[-19.85,-3.22]);
  for(const run of romonCourtDrainRuns)for(const [x]of [run.a,run.b])assert.ok(x<=-5.6,'keep clear of gate opening');
  assert.equal(report.runs,2);assert.equal(report.collidersAdded,0);assert.equal(report.drawCalls,3);assert.ok(report.length>18);assert.ok(report.grateBars>290);
  const group=root.children[1],counts=group.children.map(m=>m.count);
  assert.equal(buildRomonSurroundingsR72(root,romon,surfaces,{entryStoneMat:stone}),report);
  assert.equal(root.children.length,2);assert.equal(root.children[0],existing);assert.deepEqual(group.children.map(m=>m.count),counts);
  group.updateWorldMatrix(true,true);
  const matrix=new THREE.Matrix4(),position=new THREE.Vector3();
  for(const mesh of group.children)for(let i=0;i<mesh.count;i++){
    mesh.getMatrixAt(i,matrix);position.setFromMatrixPosition(matrix);position.applyMatrix4(group.matrixWorld);
    assert.ok(position.y>40.39&&position.y<40.46,'flush sampled court rather than inherited arbitrary datum');
    assert.ok(Number.isFinite(position.x)&&Number.isFinite(position.z));
  }
  const expected=rigidPoint([-19.85,0,-3.22],romon.source,romon.target,romon.yaw);assert.ok(Number.isFinite(expected[0]));
});

test('nonfinite drain surface fails visibly instead of inserting corrupt geometry',()=>{
  const root=new THREE.Group(),romon={source:[0,0,0],target:[0,0,0],yaw:0};
  assert.throws(()=>buildRomonSurroundingsR72(root,romon,{height:()=>NaN},{stoneMat:new THREE.MeshStandardMaterial()}),/Nonfinite/);
  assert.equal(root.children.length,0);
});
