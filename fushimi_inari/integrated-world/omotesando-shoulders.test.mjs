import test from 'node:test';
import assert from 'node:assert/strict';
import {makeOmotesandoShoulderExclusion,shoulderHeight,upwardShoulderTriangles,makeShoulderTriangleHeight} from './omotesando-shoulders-layout.mjs';
const ring={points:[[0,0,0],[2,0,0],[2,0,2],[0,0,2],[0,0,0]]};
test('shoulders exclude footprint interiors and full cells touching their boundary',()=>{
 const excluded=makeOmotesandoShoulderExclusion({buildings:[ring],water:[],paths:[]});
 assert.equal(excluded(1,1),true);assert.equal(excluded(2.6,1,.55),true);assert.equal(excluded(3,1,.55),false);
});
test('intersecting paths retain half width plus clearance and source central path is not self excluded',()=>{
 const excluded=makeOmotesandoShoulderExclusion({buildings:[],water:[],paths:[{id:'crossing',tags:{width:'3'},points:[[-10,0,0],[10,0,0]]},{id:'way/105449722',tags:{width:'8'},points:[[0,0,-10],[0,0,10]]}]});
 assert.equal(excluded(0,1.6),true);assert.equal(excluded(0,2.1,.55),true);assert.equal(excluded(0,2.4,.55),false);
});
test('mapped water is excluded and height releases smoothly to existing terrain',()=>{
 const excluded=makeOmotesandoShoulderExclusion({buildings:[],water:[ring],paths:[]});assert.equal(excluded(1,1),true);
 assert.equal(shoulderHeight(0,10,9),10.012);assert.equal(shoulderHeight(1.5,10,9),9.012);assert.equal(shoulderHeight(2.8,10,9),9.012);
 assert.ok(shoulderHeight(.75,10,9)>9.012&&shoulderHeight(.75,10,9)<10.012);
});

test('both mirrored shoulder strips face upward on sloped terrain',()=>{
 for(const side of [-1,1]){
  const corners=[[0,2,side*4],[1,2.2,side*4],[1,2.1,side*4.7],[0,1.9,side*4.7]],indices=upwardShoulderTriangles(corners);
  for(let i=0;i<indices.length;i+=3){const [a,b,c]=indices.slice(i,i+3).map(j=>corners[j]);const ny=(b[2]-a[2])*(c[0]-a[0])-(b[0]-a[0])*(c[2]-a[2]);assert.ok(ny>0);}
 }
});
test('walking sampler follows actual rendered triangle plane and leaves excluded gaps unchanged',()=>{
 const sample=makeShoulderTriangleHeight(new Float32Array([0,10,0,2,12,0,0,10,2, 8,20,8,10,20,8,8,20,10]));
 assert.equal(sample(.5,.5),10.5);assert.equal(sample(8.5,8.5),20);assert.equal(sample(4,4),null);assert.equal(sample(-.1,.1),null);
});
test('local exclusion prefilter keeps crossing segments whose endpoints are distant',()=>{
 const features={buildings:[],water:[],paths:[{id:'long',tags:{width:'2'},points:[[-100,0,0],[100,0,0]]},{id:'far',tags:{width:'2'},points:[[200,0,200],[300,0,300]]}]};
 const local=makeOmotesandoShoulderExclusion(features,[-10,10,-10,10]);assert.equal(local(0,0),true);assert.equal(local(0,4),false);
});
