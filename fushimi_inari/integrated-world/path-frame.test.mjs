import test from 'node:test';
import assert from 'node:assert/strict';
import {pathOffset} from './path-frame.mjs';
import {makePathSurfaces} from './path-surfaces.mjs';
test('both sides of a turning flight share their full-width corner',()=>{
  const a=[0,0,0],b=[10,0,0],c=[10,0,10];
  assert.deepEqual(pathOffset(a,b,{a:b,b:c},true),pathOffset(b,c,{a,b}));
  assert.deepEqual(pathOffset(a,b,{a:b,b:c},true),[-1,1]);
});
test('unmapped staircase preserves intermediate landing elevation even with equal endpoints',()=>{
  const surfaces=makePathSurfaces({paths:[{id:'turn',tags:{highway:'steps'},points:[[0,0,0],[10,0,0],[20,0,0]]}]},x=>x<=10?x*.1:2-x*.1);
  assert.ok(surfaces.height(10,0)>.95);
  assert.ok(surfaces.segments.some(s=>s.riserAt==='a'));
  assert.ok(surfaces.segments.some(s=>s.riserAt==='b'));
});
test('acute turns retain shared bounded corners instead of a triangular gap',()=>{
  for(const angle of [125,145,165]){
    const a=[0,0,0],b=[10,0,0],r=angle*Math.PI/180,c=[10+Math.cos(r)*10,0,Math.sin(r)*10];
    const left=pathOffset(a,b,{a:b,b:c},true),right=pathOffset(b,c,{a,b});
    assert.ok(Math.hypot(left[0]-right[0],left[1]-right[1])<1e-10);
    assert.ok(Math.hypot(...left)<=2.000001);
  }
});
test('unresolved profiles retain source counts and actionable measurements for review',()=>{
  const surfaces=makePathSurfaces({paths:[{id:'way/1',tags:{highway:'steps',step_count:'6'},points:[[0,0,0],[3,0,0]]}]},()=>50);
  const review=surfaces.stats.profileReview[0];
  assert.equal(review.id,'way/1');assert.equal(review.mappedCount,6);
  assert.equal(review.renderedCount,6);assert.equal(review.minimumRun,.5);
  assert.equal(review.maxRise,0);assert.ok(review.reasons.length>0);
  assert.deepEqual(surfaces.stats.unresolvedStairProfiles,['way/1']);
});
