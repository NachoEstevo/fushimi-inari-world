import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createViewingDistance,VIEW_DISTANCES,HORIZON_COLORS} from './viewing-distance.mjs';

test('quality changes clip world distance and blend the horizon before the far plane',()=>{
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(),distance=createViewingDistance({scene,camera});
 for(const [quality,far]of Object.entries(VIEW_DISTANCES)){
  const before=camera.projectionMatrix.clone();distance.setQuality(quality);
  assert.equal(camera.far,far);assert.equal(scene.fog.near,far*.65);assert.equal(scene.fog.far,far*.95);
  if(quality!=='balanced')assert.equal(camera.projectionMatrix.equals(before),false);
 }
 for(const [time,color]of Object.entries(HORIZON_COLORS)){distance.setTimeOfDay(time);assert.equal(scene.fog.color.getHexString(),color.slice(1));}
 distance.setQuality('invalid');distance.setTimeOfDay('invalid');assert.equal(camera.far,700);assert.equal(distance.stats.timeOfDay,'day');
});

test('explicit debug camera retains the full world far plane across quality changes',()=>{
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(),distance=createViewingDistance({scene,camera,debugCamera:true});
 for(const quality of Object.keys(VIEW_DISTANCES)){distance.setQuality(quality);assert.equal(camera.far,12000);assert.equal(scene.fog.far,11400);}
});
