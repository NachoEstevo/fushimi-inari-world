import test from 'node:test';
import assert from 'node:assert/strict';
import {canopyPalette,validSeason} from './season-palette.mjs';
test('season choice validates persisted values and keeps evergreens green',()=>{
  assert.equal(validSeason('winter'),'spring');assert.equal(validSeason('autumn'),'autumn');
  for(const season of ['spring','autumn'])assert.ok(canopyPalette(season,.3,.4,.5)[0]>.2);
  assert.ok(canopyPalette('autumn',.9,.4,.5)[0]<.15);
  assert.notDeepEqual(canopyPalette('spring',.9,.4,.5),canopyPalette('autumn',.9,.4,.5));
});
test('flowering is an explicit sparse category, not all spring maples',()=>{
  assert.ok(canopyPalette('spring',.9,.4,.5,true)[0]>.9);
  assert.ok(canopyPalette('spring',.9,.4,.5,false)[0]<.4);
});
