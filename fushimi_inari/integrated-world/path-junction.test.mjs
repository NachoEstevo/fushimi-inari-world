import test from 'node:test';
import assert from 'node:assert/strict';
import {makePathSurfaces} from './path-surfaces.mjs';
const paths=(connected=true)=>[
  {id:'main',tags:{highway:'footway',width:'2'},nodeIds:[1,2,3],points:[[-10,0,0],[0,0,0],[10,0,0]]},
  {id:'branch',tags:{highway:'footway',width:'2'},nodeIds:[connected?2:4,5],points:[[0,0,0],[0,0,10]]},
];
test('a shared OSM node opens the curb at a branch mouth',()=>{
  const s=makePathSurfaces({paths:paths()},()=>0);
  assert.equal(s.edgeCovered(0,1,.14,'main'),true);
  assert.equal(s.edgeCovered(5,1,.14,'main'),false);
});
test('geometric crossings without a shared node do not open curbs',()=>{
  assert.equal(makePathSurfaces({paths:paths(false)},()=>0).edgeCovered(0,1,.14,'main'),false);
});
test('different elevations never open a curb across an overlapping path',()=>{
  assert.equal(makePathSurfaces({paths:paths()},()=>0).edgeCovered(0,1,2,'main'),false);
});
