import test from 'node:test';
import assert from 'node:assert/strict';
import {groundCover} from './ground-cover.mjs';
test('vegetation leaves urban entrance, trail tread and exposed banks bare',()=>{
  assert.equal(groundCover(30,42,-16,0,20),0);
  assert.equal(groundCover(795,164,-216,.1,2),0);
  assert.equal(groundCover(795,164,-216,1.5,20),0);
});
test('outlook and woodland margins retain green ground cover with bounded transitions',()=>{
  for(const [x,y,z] of [[795,164,-216],[793,180,-315],[730,140,-270]]){
    assert.ok(groundCover(x,y,z,.15,8)>.9);
    assert.ok(groundCover(x,y,z,.15,4)>0);
    assert.ok(groundCover(x,y,z,.15,4)<1);
  }
});
