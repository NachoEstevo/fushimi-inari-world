import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {freezeStaticInstanceTransforms} from './spatial-mesh.mjs';

test('static subtrees retain transforms and LOD transitions while unrelated objects animate',()=>{
 const scene=new THREE.Scene(),parent=new THREE.Group(),root=new THREE.Group(),animated=new THREE.Group();
 scene.add(parent,animated);parent.position.set(10,2,-4);parent.rotation.y=.2;parent.add(root);
 const lod=new THREE.LOD(),near=new THREE.InstancedMesh(new THREE.BoxGeometry(),new THREE.MeshBasicMaterial(),1),far=new THREE.InstancedMesh(new THREE.BoxGeometry(),new THREE.MeshBasicMaterial(),1);
 near.setMatrixAt(0,new THREE.Matrix4().makeTranslation(3,0,0));far.setMatrixAt(0,new THREE.Matrix4().makeTranslation(3,0,0));
 lod.position.set(5,1,0);lod.addLevel(near,0);lod.addLevel(far,30,.1);root.add(lod);
 scene.updateMatrixWorld(true);const expected=near.matrixWorld.clone(),camera=new THREE.PerspectiveCamera();
 const frozen=freezeStaticInstanceTransforms([root]);assert.equal(frozen.count,4);
 root.traverse(object=>{assert.equal(object.matrixAutoUpdate,false);assert.equal(object.matrixWorldAutoUpdate,Number(THREE.REVISION)<180);});
 for(const [x,y,z,level] of [[10,2,-4,0],[100,50,10,1],[10,2,-4,0]]){
  camera.position.set(x,y,z);camera.updateMatrixWorld(true);lod.update(camera);
  assert.equal(lod.levels[level].object.visible,true);assert.equal(lod.levels[1-level].object.visible,false);
  animated.position.x+=2;scene.updateMatrixWorld();assert.equal(animated.matrixWorld.elements[12],animated.position.x);
  assert.deepEqual(near.matrixWorld.elements,expected.elements);
 }
 const color=new THREE.Color(.1,.4,.7);near.setColorAt(0,color);near.instanceColor.needsUpdate=true;
 const actual=new THREE.Color();near.getColorAt(0,actual);assert.ok(actual.distanceTo?actual.distanceTo(color)<1e-6:Math.abs(actual.g-color.g)<1e-6);
 near.material.color.set('red');assert.equal(near.material.color.getHex(),0xff0000);
 parent.position.x+=30;frozen.refreshTransforms();
 assert.ok(Math.abs(near.matrixWorld.elements[12]-(expected.elements[12]+30))<1e-6);
 root.traverse(object=>{assert.equal(object.matrixAutoUpdate,false);assert.equal(object.matrixWorldAutoUpdate,Number(THREE.REVISION)<180);});
});

test('overlapping static roots count each owned node once and refresh nested roots',()=>{
 const parent=new THREE.Group(),root=new THREE.Group(),child=new THREE.Group();parent.add(root);root.add(child);child.position.x=2;
 const frozen=freezeStaticInstanceTransforms([root,child]);assert.equal(frozen.count,2);
 parent.position.x=8;frozen.refreshTransforms();assert.equal(child.matrixWorld.elements[12],10);
});
