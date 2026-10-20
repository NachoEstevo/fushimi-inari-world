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
