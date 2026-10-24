import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {routeLightPositions,installRouteLighting} from './route-lighting.mjs';

test('trail markers avoid steep drops and repeated locations',()=>{
 const route=Array.from({length:101},(_,i)=>[i,0,0]);
 const flat=routeLightPositions(route,()=>0);
 assert.equal(flat.length,3);assert.ok(flat.every(p=>p[2]===2.6));
 assert.equal(routeLightPositions(route,()=>-10).length,0);
 const loop=routeLightPositions([...route,...route.slice().reverse()],()=>0);
 for(let i=0;i<loop.length;i++)for(let j=i+1;j<loop.length;j++)assert.ok(Math.hypot(loop[i][0]-loop[j][0],loop[i][2]-loop[j][2])>12);
});
test('lighting keeps a fixed three-light budget and only illuminates nearby markers',()=>{
 const scene=new THREE.Scene(),route=Array.from({length:101},(_,i)=>[i,0,0]);
 const lighting=installRouteLighting(scene,route,()=>0),camera=new THREE.PerspectiveCamera();
 const lights=scene.children.filter(o=>o.isPointLight);
 assert.equal(lights.length,3);assert.ok(lights.every(l=>!l.castShadow));
 lighting.setMode('night');camera.position.set(28,1.7,0);lighting.update(camera,1);
 assert.ok(lights.some(l=>l.intensity>0));
 camera.position.set(500,100,500);lighting.update(camera,1);assert.ok(lights.every(l=>l.intensity===0));
 lighting.setMode('day');assert.ok(lights.every(l=>l.intensity===0));
});

test('existing lantern positions join the bounded pool without activating extra lights',()=>{
 const scene=new THREE.Scene(),parent=new THREE.Group(),old=new THREE.PointLight();parent.position.set(10,2,3);old.position.set(1,1,1);parent.add(old);scene.add(parent);
 const lighting=installRouteLighting(scene,[],()=>0,{existingLights:[old]}),camera=new THREE.PerspectiveCamera();
 camera.position.set(11,3,4);lighting.setMode('night');lighting.update(camera,1);
 assert.equal(old.visible,false);assert.equal(old.intensity,0);
 const active=scene.children.filter(o=>o.isPointLight&&o.intensity>0);
 assert.equal(active.length,1);assert.deepEqual(active[0].position.toArray(),[11,3,4]);
});
