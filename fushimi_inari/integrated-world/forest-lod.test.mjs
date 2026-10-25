import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {preservedForestLOD} from './forest-lod.mjs';

function fixture(){
  const chunks=new THREE.Group(),near=new THREE.InstancedMesh(new THREE.BoxGeometry(12,16,12),new THREE.MeshBasicMaterial(),2);
  near.setMatrixAt(0,new THREE.Matrix4().makeTranslation(-60,0,0));
  near.setMatrixAt(1,new THREE.Matrix4().makeTranslation(60,0,0));
  near.computeBoundingSphere();chunks.add(near);preservedForestLOD(chunks);chunks.updateMatrixWorld(true);
  const lod=chunks.children[0],camera=new THREE.PerspectiveCamera();
  const update=x=>{camera.position.set(x,0,0);camera.updateMatrixWorld(true);lod.update(camera);};
  return {near,lod,far:lod.levels[1].object,update};
}

test('a cell with a distant center retains detailed crowns within 300 m of its bounds',()=>{
  const {near,far,update}=fixture();
  update(330);assert.equal(near.visible,true);assert.equal(far.visible,false);
});

test('distant crowns preserve all instances and return to detail before entering foreground',()=>{
  const {near,far,update}=fixture();
  update(1000);assert.equal(far.visible,true);assert.equal(near.visible,false);
  assert.equal(far.count,near.count);
  update(330);assert.equal(near.visible,true);assert.equal(far.visible,false);
  update(1000);assert.equal(far.visible,true);
});
