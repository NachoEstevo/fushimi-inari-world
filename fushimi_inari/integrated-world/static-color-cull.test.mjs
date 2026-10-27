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
test('sheared world transforms use conservative bounds while vertex-displaced objects stay excluded',()=>{
 const camera=new THREE.PerspectiveCamera(45,1,.2,150),material=new THREE.MeshBasicMaterial(),mesh=new THREE.Mesh(new THREE.BoxGeometry(),material);mesh.matrixAutoUpdate=false;mesh.matrix.set(1,.5,0,1000,0,1,0,0,0,0,1,0,0,0,0,1);mesh.updateMatrixWorld(true);
 let fn=null;const renderer={getRenderObjectFunction:()=>fn,setRenderObjectFunction:value=>{fn=value;},renderObject(){}};
 const displaced=new THREE.Mesh(mesh.geometry,material.clone());displaced.material.positionNode={isNode:true};displaced.updateMatrixWorld(true);
 const cull=installStaticColorCull(renderer,camera,[{object:mesh},{object:displaced}]);assert.equal(cull.stats.objects,1);cull.update();fn(mesh,{},camera);assert.equal(cull.stats.skipped,1);fn(mesh,{},new THREE.OrthographicCamera());assert.equal(cull.stats.submitted,1);cull.dispose();mesh.geometry.dispose();material.dispose();displaced.material.dispose();
});

test('view radius refreshes after photo zoom and aspect changes without clipping newly covered bounds',()=>{
 const camera=new THREE.PerspectiveCamera(45,1,.2,150),geometry=new THREE.BoxGeometry(),material=new THREE.MeshBasicMaterial(),mesh=new THREE.Mesh(geometry,material);
 mesh.position.set(160,0,-120);mesh.updateMatrixWorld(true);let fn=null,calls=0;
 const renderer={getRenderObjectFunction:()=>fn,setRenderObjectFunction:value=>{fn=value;},renderObject(){calls++;}};
 const cull=installStaticColorCull(renderer,camera,[{object:mesh}]);cull.update();fn(mesh,{},camera);assert.equal(calls,0);
 camera.fov=75;camera.aspect=2;camera.updateProjectionMatrix();cull.update();fn(mesh,{},camera);assert.equal(calls,1);
 cull.dispose();geometry.dispose();material.dispose();
});

test('sheared instances preserve visible vertices and reject distant owners while shadow passes through',()=>{
 const camera=new THREE.PerspectiveCamera(45,1,.2,150),geometry=new THREE.BoxGeometry(),material=new THREE.MeshBasicMaterial();
 const sheared=new THREE.InstancedMesh(geometry,material,1),matrix=new THREE.Matrix4();matrix.set(1,.5,0,0,0,1,0,0,0,0,1,0,0,0,0,1);sheared.setMatrixAt(0,matrix);sheared.position.set(1000,0,0);sheared.updateMatrixWorld(true);
 const parent=new THREE.Group(),safe=new THREE.InstancedMesh(geometry,material,1);parent.scale.set(3,1,2);parent.rotation.y=.7;parent.position.set(0,0,-50);parent.add(safe);safe.setMatrixAt(0,matrix);parent.updateMatrixWorld(true);
 const p=geometry.attributes.position,vertex=new THREE.Vector3(),frustum=new THREE.Frustum().setFromProjectionMatrix(camera.projectionMatrix);let inside=0;
 for(let i=0;i<p.count;i++){vertex.fromBufferAttribute(p,i).applyMatrix4(matrix).applyMatrix4(safe.matrixWorld);if(frustum.containsPoint(vertex))inside++;}assert.ok(inside>0);
 let fn=null;const calls=[],renderer={getRenderObjectFunction:()=>fn,setRenderObjectFunction:value=>{fn=value;},renderObject(object){calls.push(object);}};
 const cull=installStaticColorCull(renderer,camera,[{object:sheared},{object:safe}]);assert.equal(cull.stats.objects,2);cull.update();fn(sheared,{},camera);fn(safe,{},camera);fn(sheared,{},new THREE.OrthographicCamera());assert.deepEqual(calls,[safe,sheared]);
 cull.dispose();geometry.dispose();material.dispose();
});

test('original renderer callback is preserved and disposal does not overwrite a later hook',()=>{
 const camera=new THREE.PerspectiveCamera(),mesh=new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshBasicMaterial());mesh.updateMatrixWorld(true);let called=0;
 const original=function(object,scene,view){assert.equal(this,renderer);assert.equal(object,mesh);assert.equal(view,camera);called++;};let fn=original;
 const renderer={getRenderObjectFunction:()=>fn,setRenderObjectFunction:value=>{fn=value;},renderObject(){assert.fail('original hook must run');}};
 const cull=installStaticColorCull(renderer,camera,[{object:mesh}]);cull.update();fn(mesh,{},camera);assert.equal(called,1);
 const later=()=>{};fn=later;cull.dispose();assert.equal(fn,later);mesh.geometry.dispose();mesh.material.dispose();
});

test('tight static boxes reject far-plane sphere false positives without clipping visible surfaces',()=>{
 const camera=new THREE.PerspectiveCamera(45,16/9,.2,200);camera.updateMatrixWorld(true);
 const geometry=new THREE.BoxGeometry(40,40,4),material=new THREE.MeshBasicMaterial();
 const outside=new THREE.Mesh(geometry,material);outside.position.set(60,0,-211);outside.updateMatrixWorld(true);
 const visible=new THREE.Mesh(geometry,material);visible.position.set(60,0,-199);visible.updateMatrixWorld(true);
 geometry.computeBoundingSphere();
 const frustum=new THREE.Frustum().setFromProjectionMatrix(camera.projectionMatrix);
 assert.equal(frustum.intersectsSphere(geometry.boundingSphere.clone().applyMatrix4(outside.matrixWorld)),true);
 let fn=null;const calls=[],renderer={getRenderObjectFunction:()=>fn,setRenderObjectFunction:value=>{fn=value;},renderObject(object){calls.push(object);}};
 const cull=installStaticColorCull(renderer,camera,[{object:outside},{object:visible}]);cull.update();
 fn(outside,{},camera);assert.equal(calls.length,0,'all vertices are past the far plane despite sphere admission');
 fn(visible,{},camera);assert.deepEqual(calls,[visible]);
 fn(outside,{},new THREE.OrthographicCamera());assert.equal(calls.length,2,'shadow views retain ownership');
 camera.far=250;camera.updateProjectionMatrix();cull.update();fn(outside,{},camera);assert.equal(calls.length,3,'changed photo projection admits the newly visible box');
 cull.dispose();geometry.dispose();material.dispose();
});
