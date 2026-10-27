import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {collectInstancePrewarmEntries} from './instance-prewarm-entries.mjs';
test('known static batches contribute individual world bounds without changing rendering ownership',()=>{
 const root=new THREE.Group();root.position.set(100,3,0);
 const a=new THREE.InstancedMesh(new THREE.BoxGeometry(2,2,2),new THREE.MeshStandardMaterial(),2);
 a.setMatrixAt(0,new THREE.Matrix4().makeTranslation(10,0,0));a.setMatrixAt(1,new THREE.Matrix4().makeTranslation(20,0,0));root.add(a);
 const shadow=a.clone();shadow.userData.shadowOnly=true;root.add(shadow);root.updateMatrixWorld(true);
 const parent=a.parent,entries=collectInstancePrewarmEntries([root,a]);
 assert.equal(entries.length,1);assert.equal(entries[0].object,a);assert.equal(a.parent,parent);assert.equal(a.visible,true);
 assert.equal(entries[0].bounds.center.x,115);assert.equal(entries[0].bounds.center.y,3);assert.ok(entries[0].bounds.radius>=6);
});
