import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {preservedForestLOD} from './forest-lod.mjs';

test('shared crown bounds are scanned once while all chunks retain their LODs',()=>{
 const chunks=new THREE.Group(),geometry=new THREE.BoxGeometry(12,16,12),material=new THREE.MeshBasicMaterial();
 let scans=0;const compute=geometry.computeBoundingBox.bind(geometry);
 geometry.computeBoundingBox=()=>{scans++;compute();};
 for(let i=0;i<100;i++){const mesh=new THREE.InstancedMesh(geometry,material,1);mesh.setMatrixAt(0,new THREE.Matrix4().makeTranslation(i*128,0,0));mesh.computeBoundingSphere();chunks.add(mesh);}
 preservedForestLOD(chunks);
 assert.equal(scans,1);assert.equal(chunks.children.length,100);assert.ok(chunks.children.every(lod=>lod.isLOD&&lod.levels.length===2));
});

function fixture(){
  const chunks=new THREE.Group(),near=new THREE.InstancedMesh(new THREE.BoxGeometry(12,16,12),new THREE.MeshBasicMaterial(),2);
  near.setMatrixAt(0,new THREE.Matrix4().makeTranslation(-60,0,0));
  near.setMatrixAt(1,new THREE.Matrix4().makeTranslation(60,0,0));
  near.computeBoundingSphere();chunks.add(near);preservedForestLOD(chunks);chunks.updateMatrixWorld(true);
  const lod=chunks.children[0],camera=new THREE.PerspectiveCamera();
  const update=x=>{camera.position.set(x,0,0);camera.updateMatrixWorld(true);lod.update(camera);};
  return {near,lod,far:lod.levels[1].object,update};
}

test('a cell with a distant center retains detailed crowns within 45 m of its bounds',()=>{
  const {near,far,update}=fixture();
  update(100);assert.equal(near.visible,true);assert.equal(far.visible,false);
});

test('distant crowns preserve all instances and return to detail before entering foreground',()=>{
  const {near,far,update}=fixture();
  update(1000);assert.equal(far.visible,true);assert.equal(near.visible,false);
  assert.equal(far.count,near.count);
  update(100);assert.equal(near.visible,true);assert.equal(far.visible,false);
  update(1000);assert.equal(far.visible,true);
});

test('distant crowns simplify inside the walker view budget without replacing near geometry',()=>{
  const {near,far,lod,update}=fixture();
  const nearGeometry=near.geometry;
  update(145);assert.equal(far.visible,true);assert.equal(near.visible,false);
  assert.equal(far.geometry.attributes.position.count/3,20);
  assert.equal(lod.levels[0].object.geometry,nearGeometry);
  // Coming back from the cheap level restores detail at the protected edge.
  update(near.boundingSphere.radius+44);
  assert.equal(near.visible,true);assert.equal(far.visible,false);
});
