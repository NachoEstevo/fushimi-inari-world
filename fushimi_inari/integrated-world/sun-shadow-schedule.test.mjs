import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createSunShadowSchedule} from './sun-shadow-schedule.mjs';
function fixture(quality='high'){
 const sun=new THREE.DirectionalLight(),position=new THREE.Vector3(10,20,30),offset=new THREE.Vector3(40,80,20);
 const schedule=createSunShadowSchedule({sun,quality});
 return {sun,position,offset,schedule,renderShadow:()=>{sun.shadow.needsUpdate=false;}};
}
for(const [quality,movingMs,idleMs] of [['high',1000/30,100],['balanced',1000/15,200]]){
 test(`${quality} moving cadence preserves atlas projection`,()=>{
  const {sun,position,offset,schedule,renderShadow}=fixture(quality);
  schedule.update(0,position,offset);renderShadow();
  const first=sun.position.clone(),target=sun.target.position.clone();
  position.x++;assert.equal(schedule.update(movingMs-1,position,offset),false);
  assert.ok(sun.position.equals(first));assert.ok(sun.target.position.equals(target));
  position.x++;assert.equal(schedule.update(movingMs,position,offset),true);
  assert.equal(sun.target.position.x,12);assert.equal(sun.target.position.y,18.3);
  assert.ok(sun.position.equals(sun.target.position.clone().add(offset)));
 });
 test(`${quality} idle dynamic casters refresh within maximum age`,()=>{
  const {position,offset,schedule,renderShadow}=fixture(quality);
  schedule.update(0,position,offset);renderShadow();
  assert.equal(schedule.update(idleMs-1,position,offset),false);
  assert.equal(schedule.update(idleMs,position,offset),true);renderShadow();
  assert.equal(schedule.update(idleMs*2,position,offset),true);
 });
}
test('external invalidations, light offsets, teleports and clock restarts refresh immediately',()=>{
 const {sun,position,offset,schedule,renderShadow}=fixture();
 schedule.update(100,position,offset);renderShadow();
 sun.shadow.needsUpdate=true;assert.equal(schedule.update(101,position,offset),true);renderShadow();
 schedule.invalidate();assert.equal(schedule.update(102,position,offset),true);renderShadow();
 offset.x+=0.01;assert.equal(schedule.update(103,position,offset),true);renderShadow();
 position.x+=9;assert.equal(schedule.update(104,position,offset),true);renderShadow();
 assert.equal(schedule.update(0,position,offset),true);
});
test('quality changes invalidate without resizing the fixed atlas',()=>{
 const {sun,position,offset,schedule,renderShadow}=fixture();sun.shadow.mapSize.set(2048,2048);
 schedule.update(0,position,offset);renderShadow();schedule.setQuality('balanced');
 assert.equal(schedule.update(1,position,offset),true);assert.equal(schedule.stats.intervalMs,200);
 assert.deepEqual(sun.shadow.mapSize.toArray(),[2048,2048]);
 assert.throws(()=>schedule.setQuality('unknown'),RangeError);
});
test('dispose restores ownership and stops updates',()=>{
 const {sun,position,offset,schedule}=fixture();assert.equal(sun.shadow.autoUpdate,false);
 schedule.dispose();schedule.dispose();assert.equal(sun.shadow.autoUpdate,true);
 assert.equal(sun.shadow.needsUpdate,true);assert.equal(schedule.update(0,position,offset),false);
});
