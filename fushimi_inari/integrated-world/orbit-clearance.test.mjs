import test from 'node:test';
import assert from 'node:assert/strict';
import {orbitFloor,protectOrbit} from './orbit-clearance.mjs';

test('orbit eye clears sloping terrain and its near-plane footprint',()=>{
  const height=(x,z)=>180+x*2+z;
  assert.ok(Math.abs(orbitFloor(10,5,height)-208)<1e-9);
  const camera={position:{x:10,y:184,z:5},lookAt(target){this.aim=target;}};
  const target={x:0,y:183,z:0};
  const result=protectOrbit(camera,{target},height);
  assert.ok(Math.abs(camera.position.y-208)<1e-9);assert.ok(Math.abs(result.correction-24)<1e-9);
  assert.equal(camera.aim,target);
  assert.equal(protectOrbit(camera,{target},height).correction,0);
});
test('overview height is preserved and missing samples never poison the camera',()=>{
  const camera={position:{x:0,y:1700,z:0},lookAt(){throw Error('should not turn');}};
  assert.equal(protectOrbit(camera,{target:{}},()=>100).correction,0);
  assert.equal(protectOrbit(camera,{target:{}},()=>NaN).correction,0);
  assert.equal(camera.position.y,1700);
});
