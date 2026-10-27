import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {installStaticColorCull} from './static-color-cull.mjs';
import {prewarmViewRadius} from './prewarm-view-radius.mjs';
test('only impossible main-camera corner batches are rejected; shadow camera and visible corners retain draws',()=>{
 const camera=new THREE.PerspectiveCamera(45,1.5,.2,150);camera.updateMatrixWorld(true);
 const geometry=new THREE.SphereGeometry(100,8,6),material=new THREE.MeshBasicMaterial(),mesh=new THREE.Mesh(geometry,material);mesh.position.set(180,140,-190);mesh.updateMatrixWorld(true);geometry.computeBoundingSphere();
 const bounds=geometry.boundingSphere.clone().applyMatrix4(mesh.matrixWorld),frustum=new THREE.Frustum().setFromProjectionMatrix(camera.projectionMatrix);assert.equal(frustum.intersectsSphere(bounds),true);assert.ok(bounds.distanceToPoint(camera.position)>prewarmViewRadius(camera));
 let fn=null;const calls=[],renderer={getRenderObjectFunction:()=>fn,setRenderObjectFunction:value=>{fn=value;},renderObject(...args){assert.equal(this,renderer);calls.push(args[0]);}};
 const cull=installStaticColorCull(renderer,camera,[{object:mesh}]);cull.update();fn(mesh,{},camera);assert.equal(calls.length,0);fn(mesh,{},new THREE.OrthographicCamera());assert.equal(calls.length,1);
 const near=new THREE.Mesh(new THREE.BoxGeometry(),material);near.position.set(0,0,-10);near.updateMatrixWorld(true);fn(near,{},camera);assert.equal(calls.length,2);cull.dispose();assert.equal(fn,null);geometry.dispose();near.geometry.dispose();material.dispose();
});
test('wide-angle views increase the admission bound without changing clipping distance',()=>{
 const camera=new THREE.PerspectiveCamera(45,1,.2,150),first=prewarmViewRadius(camera);camera.aspect=2;camera.updateProjectionMatrix();assert.ok(prewarmViewRadius(camera)>first);assert.equal(camera.far,150);
});
test('sheared and vertex-displaced objects are excluded from static culling',()=>{
 const camera=new THREE.PerspectiveCamera(45,1,.2,150),material=new THREE.MeshBasicMaterial(),mesh=new THREE.Mesh(new THREE.BoxGeometry(),material);mesh.matrixAutoUpdate=false;mesh.matrix.set(1,.5,0,1000,0,1,0,0,0,0,1,0,0,0,0,1);mesh.updateMatrixWorld(true);
 let fn=null;const renderer={getRenderObjectFunction:()=>fn,setRenderObjectFunction:value=>{fn=value;},renderObject(){}};
 const displaced=new THREE.Mesh(mesh.geometry,material.clone());displaced.material.positionNode={isNode:true};displaced.updateMatrixWorld(true);
 const cull=installStaticColorCull(renderer,camera,[{object:mesh},{object:displaced}]);assert.equal(cull.stats.objects,0);cull.dispose();mesh.geometry.dispose();material.dispose();displaced.material.dispose();
});
