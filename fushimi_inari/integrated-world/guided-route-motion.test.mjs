import test from 'node:test';
import assert from 'node:assert/strict';
import {advanceGuidedRoute} from './guided-route-motion.mjs';
const points=[[0,0,0],[2,0,0],[2,0,2],[4,0,2]];
test('tour preserves corners rather than testing a diagonal shortcut',()=>{
 const swept=[];const r=advanceGuidedRoute(points,0,0,5,(a,b)=>{swept.push([a,b]);return true;});
 assert.deepEqual(swept,[[[0,0,0],[2,0,0]],[[2,0,0],[2,0,2]],[[2,0,2],[3,0,2]]]);
 assert.deepEqual(r.position,[3,0,2]);assert.equal(r.index,2);assert.equal(r.travelled,1);
});
test('a closed crossing stops tour progress and reopening resumes from that point',()=>{
 const r=advanceGuidedRoute(points,0,1,4,(a,b)=>b[2]===0);
 assert.equal(r.blocked,true);assert.deepEqual(r.position,[2,0,0]);assert.equal(r.index,1);assert.equal(r.travelled,0);assert.equal(r.arrived,false);
 const resumed=advanceGuidedRoute(points,r.index,r.travelled,3);
 assert.deepEqual(resumed.position,[3,0,2]);assert.equal(resumed.blocked,false);
});
test('closed final segment cannot signal arrival or jump to endpoint',()=>{
 const r=advanceGuidedRoute(points,2,.5,50,()=>false);
 assert.deepEqual(r.position,[2.5,0,2]);assert.equal(r.arrived,false);assert.equal(r.travelled,.5);
});
test('zero length corners terminate and arrival clamps to the last point',()=>{
 const r=advanceGuidedRoute([[0,0,0],[0,0,0],[0,3,4]],0,0,100);
 assert.deepEqual(r.position,[0,3,4]);assert.equal(r.arrived,true);assert.equal(r.travelled,0);
});
