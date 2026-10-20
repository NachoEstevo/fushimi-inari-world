import test from 'node:test';
import assert from 'node:assert/strict';
import {flightDisplacement as move} from './flight-motion.mjs';
test('flight ascends and descends independently of terrain',()=>{
 assert.deepEqual(move([0,0,-1],0,0,1,.1,15),[0,1.5,0]);
 assert.deepEqual(move([0,0,-1],0,0,-1,.1,15),[0,-1.5,0]);
});
test('flight follows camera pitch and normalizes diagonal boost',()=>{
 const d=move([0,.6,-.8],1,1,1,.1,15,true);
 assert.ok(d[0]>0&&d[1]>0&&d[2]<0);assert.ok(Math.abs(Math.hypot(...d)-4.5)<1e-9);
});
test('flight bounds stale frames and invalid speed',()=>{
 assert.equal(Math.hypot(...move([0,0,-1],1,0,0,100,40)),4);
 assert.ok(move([0,0,-1],1,0,0,NaN,15).every(v=>v===0));
 assert.ok(move([0,0,-1],1,0,0,.1,NaN).every(Number.isFinite));
});
