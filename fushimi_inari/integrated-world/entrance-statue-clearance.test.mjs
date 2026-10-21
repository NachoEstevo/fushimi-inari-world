import test from 'node:test';
import assert from 'node:assert/strict';
import {statueWallShift} from './entrance-statue-clearance-layout.mjs';
test('moves whole pedestal to public side even when its center is behind the wall',()=>{
 const shift=statueWallShift([5,-.3],[[4,-1.3],[6,-1.3],[4,.7],[6,.7]],[{points:[[0,0],[10,0]]}],[5,4]);
 assert.ok(Math.abs(shift[1]-1.69)<1e-8);assert.equal(shift[0],0);
});
test('preserves a clear statue and does not close a wall gap',()=>{
 assert.deepEqual(statueWallShift([5,2],[[4,1],[6,3]],[{points:[[0,0],[10,0]]}],[5,4]),[0,0]);
 assert.deepEqual(statueWallShift([12,0],[[11,-1],[13,1]],[{points:[[0,0],[10,0]]}],[12,4]),[0,0]);
});
test('clears both a wall and a hedge without moving either boundary',()=>{
 const walls=[{points:[[0,0],[10,0]]},{tags:{barrier:'hedge'},points:[[0,2],[10,2]]}],corners=[[4,-1],[6,1]],shift=[0,0];
 for(let i=0;i<3;i++){const step=statueWallShift([5+shift[0],shift[1]],corners.map(p=>[p[0]+shift[0],p[1]+shift[1]]),walls,[5,6]);shift[0]+=step[0];shift[1]+=step[1];}
 assert.ok(corners[0][1]+shift[1]>=2.6-1e-8);
});
