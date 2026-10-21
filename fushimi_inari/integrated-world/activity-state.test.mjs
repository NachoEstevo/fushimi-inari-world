import test from 'node:test';
import assert from 'node:assert/strict';
import {createActivity} from './activity-state.mjs';
test('an activity cannot stack triggers and can restart after completion',()=>{
  const a=createActivity(1800);
  assert.equal(a.progress(0),1);
  assert.equal(a.start(10),true);assert.equal(a.start(100),false);
  assert.equal(a.progress(910),.5);assert.equal(a.progress(5000),1);
  assert.equal(a.start(5000),true);assert.equal(a.progress(5000),0);
});
