import test from 'node:test';
import assert from 'node:assert/strict';
import {entryHeight} from './entry-profile.mjs';
test('Romon approach reaches the preserved podium at both door edges',()=>{
  assert.equal(entryHeight(0,6.5,0),0);
  assert.equal(entryHeight(0,3.4,0),2.1);
  assert.equal(entryHeight(0,-3.4,0),2.1);
  assert.equal(entryHeight(0,-5,0),1.6);
  assert.equal(entryHeight(8,4,99),99);
});
