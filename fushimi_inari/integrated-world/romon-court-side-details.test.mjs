import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {buildRomonCourtSideDetails} from './romon-court-side-details.mjs';
const materials=()=>({vermilionMat:new THREE.MeshStandardMaterial({color:'#b84a30'})});
test('photo-supported barrier finish remains in its existing court frame with four material batches',()=>{
 const root=new THREE.Group(),original=new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshBasicMaterial());root.add(original);
 const frame={source:[0,1.6,0],target:[17,40,-8],yaw:.34},m=materials(),group=buildRomonCourtSideDetails(root,frame,m);
 assert.equal(group.userData.barrierFootplates,12);assert.equal(group.userData.bambooNodes,22);assert.equal(group.children.length,4);
 assert.match(group.userData.references[0],/IMG_6485_20210317/);assert.match(group.userData.limits,/no extra rail/);assert.match(group.userData.dimensions,/inferred/);
 group.updateMatrix();const mapped=new THREE.Vector3(...frame.source).applyMatrix4(group.matrix);
 assert.ok(mapped.distanceTo(new THREE.Vector3(...frame.target))<1e-8);
 let triangles=0;group.traverse(o=>{assert.ok(!o.isLight);if(o.isMesh){triangles+=o.geometry.attributes.position.count/3;for(const v of o.geometry.attributes.position.array)assert.ok(Number.isFinite(v));}});assert.ok(triangles<3500);
 assert.equal(root.children[0],original);assert.equal(buildRomonCourtSideDetails(root,frame,m),group);assert.equal(root.children.length,2);
});
test('small pale barrier footplates are separate from structural gallery columns',()=>{
 const root=new THREE.Group(),group=buildRomonCourtSideDetails(root,{source:[0,0,0],target:[0,0,0],yaw:0},materials());
 group.updateMatrixWorld(true);
 for(const side of [-1,1])for(let post=0;post<6;post++){
  const x=side*12.5-6+post*2.4;
  const ray=new THREE.Raycaster(new THREE.Vector3(x+.08,2.4,-2.31),new THREE.Vector3(0,-1,0),0,1),hit=ray.intersectObject(group,true)[0];
  assert.ok(hit,`footplate at ${x}`);assert.ok(Math.abs(hit.point.y-2.065)<1e-5);assert.ok(Math.abs(hit.point.z+2.31)<1e-7);
 }
 const center=new THREE.Raycaster(new THREE.Vector3(0,6,-2.31),new THREE.Vector3(0,-1,0),0,7);assert.equal(center.intersectObject(group,true).length,0,'central Romon entrance stays untouched');
});
