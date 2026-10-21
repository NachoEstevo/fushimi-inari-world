import test from 'node:test';
import assert from 'node:assert/strict';
import {makeOmotesandoShoulderExclusion,shoulderHeight} from './omotesando-shoulders-layout.mjs';
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
