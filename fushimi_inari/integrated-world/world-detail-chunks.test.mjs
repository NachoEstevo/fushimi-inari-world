import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createWorldDetailChunks} from './world-detail-chunks.mjs';
const camera=x=>({position:new THREE.Vector3(x,0,0)});
const object=x=>{const mesh=new THREE.Mesh(new THREE.BoxGeometry(2,2,2));mesh.position.x=x;return mesh;};
test('far detail sleeps and a teleport activates its destination in the same update',()=>{
 const near=object(0),far=object(900),manager=createWorldDetailChunks();manager.add(near);manager.add(far);
 manager.update(camera(0),0,1,true);assert.equal(near.visible,true);assert.equal(far.visible,false);
 manager.update(camera(900),.01);assert.equal(near.visible,false);assert.equal(far.visible,true);
 assert.equal(manager.stats().active,1);
});
test('hysteresis prevents repeated changes near a sector boundary',()=>{
 const mesh=object(0),manager=createWorldDetailChunks({near:10,far:20});manager.add(mesh);
 manager.update(camera(18),0,1,true);assert.equal(mesh.visible,true);
 manager.update(camera(24),.2);assert.equal(mesh.visible,false);
 manager.update(camera(18),.4);assert.equal(mesh.visible,false);
 manager.update(camera(8),.6);assert.equal(mesh.visible,true);
});
test('bounds include parent transforms and preserve geometry and floor raycasts while hidden',()=>{
 const parent=new THREE.Group(),mesh=object(0);parent.position.x=500;parent.add(mesh);
 const before=mesh.geometry.attributes.position.array.slice(),manager=createWorldDetailChunks();manager.add(mesh);manager.update(camera(0),0,1,true);
 assert.equal(mesh.visible,false);assert.deepEqual(mesh.geometry.attributes.position.array,before);assert.equal(mesh.parent,parent);
 const ray=new THREE.Raycaster(new THREE.Vector3(500,3,0),new THREE.Vector3(0,-1,0));assert.ok(ray.intersectObject(mesh).length);
 manager.update(camera(500),.2);assert.equal(mesh.visible,true);
});
test('elevated overview restores distant details without modifying individual transforms',()=>{
 const mesh=object(800),manager=createWorldDetailChunks();manager.add(mesh);manager.update(camera(0),0,1,true);assert.equal(mesh.visible,false);
 manager.update(camera(0),.01,6);assert.equal(mesh.visible,true);assert.equal(mesh.position.x,800);
 manager.update(camera(0),.02,1);assert.equal(mesh.visible,false);
});
