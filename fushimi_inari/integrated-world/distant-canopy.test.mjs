import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {distantCanopy} from './distant-canopy.mjs';

function fixture(){
  const canopy=distantCanopy({buildings:[],water:[]},()=>100,()=>null,{xmin:110,zmin:0,cols:30,rows:10,step:11});
  assert.ok(canopy.group.children.length>0);
  return {canopy,camera:new THREE.PerspectiveCamera(),mesh:canopy.group.children[0]};
}

test('rotation-only updates reuse the distance decision and preserve group, season and child visibility ownership',()=>{
  const {canopy,camera,mesh}=fixture(),center=mesh.boundingSphere.center;
  camera.position.copy(center).add(new THREE.Vector3(mesh.boundingSphere.radius+201,0,0));
  canopy.update(camera);assert.equal(mesh.visible,true);
  let reads=0,x=center.x;
  Object.defineProperty(center,'x',{configurable:true,get(){reads++;return x;},set(value){x=value;}});
  camera.rotation.y+=.5;
  canopy.group.visible=false;mesh.visible=false;
  canopy.setSeason('autumn');canopy.update(camera);
  assert.equal(reads,0);assert.equal(mesh.visible,true);assert.equal(canopy.group.visible,false);
  canopy.group.visible=true;canopy.update(camera);
  assert.equal(reads,0);assert.equal(mesh.visible,true);
});

test('moving across a cell boundary matches the original three-dimensional distance rule for every cell',()=>{
  const {canopy,camera,mesh}=fixture(),center=mesh.boundingSphere.center,cutoff=mesh.boundingSphere.radius+200;
  for(const offset of [cutoff+1,cutoff-1,cutoff+1]){
    camera.position.copy(center).add(new THREE.Vector3(0,offset,0));
    canopy.update(camera);
    assert.equal(mesh.visible,offset>cutoff);
    for(const child of canopy.group.children){
      assert.equal(child.visible,camera.position.distanceTo(child.boundingSphere.center)>child.boundingSphere.radius+200);
    }
  }
});
