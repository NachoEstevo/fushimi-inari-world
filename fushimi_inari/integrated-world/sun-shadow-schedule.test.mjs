import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createSunShadowSchedule} from './sun-shadow-schedule.mjs';

function fixture(){
  const sun=new THREE.DirectionalLight(),position=new THREE.Vector3(10,20,30),offset=new THREE.Vector3(40,80,20);
  const schedule=createSunShadowSchedule({sun});
  const renderShadow=()=>{sun.shadow.needsUpdate=false;};
  return {sun,position,offset,schedule,renderShadow};
}

test('limits shadow passes while keeping light transform paired with its atlas',()=>{
  const {sun,position,offset,schedule,renderShadow}=fixture();
  assert.equal(sun.shadow.autoUpdate,false);
  assert.equal(schedule.update(0,position,offset),true);renderShadow();
  const first=sun.position.clone(),target=sun.target.position.clone();
  position.x+=2;
  assert.equal(schedule.update(10,position,offset),false);
  assert.equal(sun.shadow.needsUpdate,false);
  assert.ok(sun.position.equals(first));assert.ok(sun.target.position.equals(target));
  assert.equal(schedule.update(34,position,offset),true);
  assert.equal(sun.target.position.x,12);assert.equal(sun.target.position.y,18.3);
  assert.ok(sun.position.equals(sun.target.position.clone().add(offset)));
  renderShadow();
  // Stationary scenery still includes moving trains, wildlife and visitors.
  assert.equal(schedule.update(68,position,offset),true);
  assert.deepEqual(schedule.stats,{updates:3,skipped:1,intervalMs:1000/30});
});

test('streaming invalidation and clock restarts refresh without waiting for cadence',()=>{
  const {sun,position,offset,schedule,renderShadow}=fixture();
  schedule.update(100,position,offset);renderShadow();
  sun.shadow.needsUpdate=true;
  assert.equal(schedule.update(101,position,offset),true);renderShadow();
  schedule.invalidate();assert.equal(schedule.update(102,position,offset),true);renderShadow();
  assert.equal(schedule.update(0,position,offset),true);
});

test('dispose restores previous shadow ownership and stops transform updates',()=>{
  const {sun,position,offset,schedule}=fixture();
  schedule.dispose();schedule.dispose();
  assert.equal(sun.shadow.autoUpdate,true);assert.equal(sun.shadow.needsUpdate,true);
  assert.equal(schedule.update(0,position,offset),false);
});
