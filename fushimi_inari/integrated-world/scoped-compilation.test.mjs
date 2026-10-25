import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {compileAddedGroup} from './scoped-compilation.mjs';
test('deferred compile borrows only new visuals and preserves world environment and ownership',async()=>{
 const scene=new THREE.Scene(),group=new THREE.Group(),other=new THREE.Group(),camera=new THREE.PerspectiveCamera();
 scene.add(group,other);scene.environment=new THREE.Texture();scene.fog=new THREE.Fog(0xcccccc,1,500);scene.environmentNode={tag:'environment'};
 const renderer={async compileAsync(scope,view,target){
  assert.equal(scope.isScene,true);assert.deepEqual(scope.children,[group]);assert.equal(scope.environment,scene.environment);
  assert.equal(scope.environmentNode,scene.environmentNode);assert.equal(scope.fog.far,500);
  assert.equal(view,camera);assert.equal(target,scene);assert.equal(group.parent,scene);
 }};
 await compileAddedGroup(renderer,scene,group,camera);assert.deepEqual(scene.children,[group,other]);
 renderer.compileAsync=async()=>{throw Error('failed');};
 await assert.rejects(compileAddedGroup(renderer,scene,group,camera),/failed/);assert.equal(group.parent,scene);
});
