import test from 'node:test';
import assert from 'node:assert/strict';
import {stairProfile,inferredTreads,mappedTreads,sampledStairAlignment} from './stair-profile.mjs';
test('mapped ten-count on the long upper ascent cannot produce metre-high risers',()=>{
  const p=stairProfile(73.03,171.56,181.76,10);
  assert.ok(p.rise<=.16);assert.equal(p.mapped,10);
  assert.equal(p.conflict,true);assert.equal(p.unresolved,true);
});
test('valid survey counts survive in either walking direction',()=>{
  for(const ends of [[164.86,166.1],[166.1,164.86]]){
    const p=stairProfile(6.27,...ends,10);assert.equal(p.count,10);assert.equal(p.conflict,false);
  }
});
test('flat DEM and physically impossible short stairways remain visibly unresolved in data',()=>{
  assert.equal(stairProfile(3,50,50.01,5).unresolved,true);
  assert.equal(stairProfile(.5,50,52,5).unresolved,true);
});
test('inferred flights meet the terrain at interior shared nodes instead of bridging over branches',()=>{
  const steps=inferredTreads([[0,0,0],[10,0,0],[20,0,0]],x=>x<=10?x*.1:1+(x-10)*.4);
  const first=steps.filter(s=>s.b[0]<=10);
  assert.equal(first.at(-1).level,1);
  assert.ok(steps.every(s=>s.rise<=.16));
  assert.equal(steps.at(-1).level,5);
});
test('mapped count follows an interior summit in both directions without flattening it',()=>{
  const points=[[0,0,0],[4,0,0],[8,0,0]],ground=x=>x<=4?x*.25:(8-x)*.25;
  for(const route of [points,[...points].reverse()]){
    const treads=mappedTreads(route,ground,12);
    assert.equal(treads.length,12);assert.equal(Math.max(...treads.map(t=>t.level)),1);
    assert.ok(treads.every(t=>t.rise<=.24));
  }
});
test('infeasible mapped interior rise is rejected instead of creating giant steps',()=>{
  assert.equal(mappedTreads([[0,0,0],[4,0,0],[8,0,0]],x=>x===4?3:0,10),null);
});
test('long inferred stairs follow interior terrain without discarding mapped bends',()=>{
  const points=[[0,0,0],[20,0,0],[20,0,10]],sampled=sampledStairAlignment(points);
  assert.ok(sampled.includes(points[1]));assert.ok(sampled.includes(points[2]));
  const treads=inferredTreads(sampled,x=>x<10?x*.1:(20-x)*.1);
  assert.equal(Math.max(...treads.map(s=>s.level)),1);
  assert.ok(treads.every(s=>s.rise<=.16));
  assert.throws(()=>sampledStairAlignment(points,0));
});
test('mapped count cannot hide an intermediate hill on a long single edge',()=>{
  const points=[[0,0,0],[20,0,0]],ground=x=>Math.min(x,20-x)*.1;
  const treads=mappedTreads(points,ground,12);
  assert.equal(treads.length,12);
  assert.equal(Math.max(...treads.map(t=>t.level)),1);
  assert.ok(treads.every(t=>t.rise<=.24));
  assert.equal(mappedTreads(points,ground,4),null);
});
