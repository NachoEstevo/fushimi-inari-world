import test from 'node:test';
import assert from 'node:assert/strict';
import {clipConvex,subtractConvex,polygonArea} from './entrance-area-surfaces-layout.mjs';
const square=[[0,0],[4,0],[4,4],[0,4]];
test('clips source triangles to exact grid-cell edges',()=>{
  const result=clipConvex([[-1,-1],[5,-1],[-1,5]],[[0,0],[2,0],[2,2],[0,2]]);
  assert.ok(result.every(([x,z])=>x>=0&&x<=2&&z>=0&&z<=2));assert.equal(Math.abs(polygonArea(result)),4);
});
test('subtracts building/path footprint without overlapping remaining pieces',()=>{
  const hole=[[1,1],[3,1],[3,3],[1,3]];
  const pieces=subtractConvex(square,hole);
  assert.equal(pieces.reduce((sum,p)=>sum+Math.abs(polygonArea(p)),0),12);
  assert.ok(pieces.every(p=>clipConvex(p,hole).length===0));
});
test('retains source on disjoint cutout, removes fully covered source and supports reversed winding',()=>{
  assert.equal(subtractConvex(square,[[5,5],[6,5],[6,6],[5,6]]).reduce((s,p)=>s+Math.abs(polygonArea(p)),0),16);
  assert.equal(subtractConvex(square,[[-1,-1],[5,-1],[5,5],[-1,5]].reverse()).length,0);
});
