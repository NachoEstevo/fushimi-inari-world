import test from 'node:test';
import assert from 'node:assert/strict';
import {walkingSpeed,movementSteps} from './walking-motion.mjs';
test('fast and boosted walking retain bounded collision substeps',()=>{
  for(const speed of [1.6,3,6,10])for(const boost of [false,true]){
    const actual=walkingSpeed(speed,boost),step=movementSteps(.1,actual);
    assert.ok(step.distance<=.12);
    assert.ok(Math.abs(step.count*step.distance-.1*actual)<1e-9);
  }
});
test('invalid settings cannot create negative or unbounded movement',()=>{
  assert.equal(walkingSpeed('invalid'),3);
  assert.equal(walkingSpeed(100),10);
  assert.equal(movementSteps(-1,3).distance,0);
  assert.ok(Math.abs(movementSteps(4,3).count*movementSteps(4,3).distance-.3)<1e-9);
});
