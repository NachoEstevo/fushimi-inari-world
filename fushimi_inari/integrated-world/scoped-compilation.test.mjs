import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {compileAddedGroup} from './scoped-compilation.mjs';
test('deferred compile borrows only new visuals and preserves world environment and ownership',async()=>{
 const scene=new THREE.Scene(),group=new THREE.Group(),other=new THREE.Group(),camera=new THREE.PerspectiveCamera();
 scene.add(group,other);scene.environment=new THREE.Texture();scene.fog=new THREE.Fog(0xcccccc,1,500);scene.environmentNode={tag:'environment'};
 const mesh=new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshBasicMaterial());group.add(mesh);
 const renderer={async compileAsync(scope,view,target){
  assert.equal(scope.isScene,true);assert.deepEqual(scope.children,[mesh]);assert.equal(scope.environment,scene.environment);
  assert.equal(scope.environmentNode,scene.environmentNode);assert.equal(scope.fog.far,500);
  assert.equal(view,camera);assert.equal(target,scene);assert.equal(group.parent,scene);
 }};
 await compileAddedGroup(renderer,scene,group,camera);assert.deepEqual(scene.children,[group,other]);
 renderer.compileAsync=async()=>{throw Error('failed');};
 await assert.rejects(compileAddedGroup(renderer,scene,group,camera),/failed/);assert.equal(group.parent,scene);
});
test('warmup yields between bounded batches without reparenting or activating detached visuals',async()=>{
 const scene=new THREE.Scene(),group=new THREE.Group(),camera=new THREE.PerspectiveCamera();
 const geometry=new THREE.BoxGeometry(),material=new THREE.MeshBasicMaterial();
 for(let i=0;i<31;i++)group.add(new THREE.Mesh(geometry,material));
 let yields=0;const visits=[],reports=[];
 await compileAddedGroup({async compileAsync(scope){
  assert.equal(group.parent,null);assert.ok(scope.children.length<=12);
  assert.equal(yields,visits.length+1);visits.push([...scope.children]);
  for(const mesh of scope.children)assert.equal(mesh.parent,group);
 }},scene,group,camera,{yieldWork:async()=>{yields++;},report:stats=>reports.push(stats)});
 assert.deepEqual(visits.map(batch=>batch.length),[12,12,7]);
 assert.equal(new Set(visits.flat()).size,31);assert.equal(reports.at(-1).objects,31);
 assert.deepEqual(scene.children,[]);
});
