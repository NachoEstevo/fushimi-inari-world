import test from 'node:test';
import assert from 'node:assert/strict';
import {precinctLevel,lowerCourtBlend,sanctuaryCourtBlend} from './precinct-grade.mjs';
test('side courts retain architectural levels without procedural ridge noise',()=>{
  for(const z of [-18,-12,-5,0,2.5])assert.equal(precinctLevel(z),1.6);
  assert.equal(precinctLevel(9),0);
  assert.equal(precinctLevel(-25),3.2);
});
test('lower court connects gate, shop and hall without separate building mounds',()=>{
  for(const x of [-27,0,27])for(const z of [-6,-15,-30])assert.equal(lowerCourtBlend(x,z,49,42.38),42.38);
  assert.equal(lowerCourtBlend(34,-15,49,42.38),49);
  assert.equal(lowerCourtBlend(0,-41,49,42.38),49);
  assert.equal(lowerCourtBlend(0,0,49,42.38),49);
});
test('approach and sanctuary connections have continuous endpoint heights',()=>{
  for(const z of [6.5,2.5,-19.6,-22.2])assert.ok(Math.abs(precinctLevel(z-.0001)-precinctLevel(z+.0001))<.001);
});

test('sanctuary grading meets both ends of the preserved stairs and upper landing',()=>{
  assert.equal(sanctuaryCourtBlend(0,-19.6,99,40),41.6);
  assert.ok(Math.abs(sanctuaryCourtBlend(0,-22.2,99,40)-43.2)<1e-9);
  assert.ok(Math.abs(sanctuaryCourtBlend(15,-35,99,40)-43.2)<1e-9);
  assert.equal(sanctuaryCourtBlend(35,-25,99,40),99);
  for(const z of [-19.6,-22.2])assert.ok(Math.abs(sanctuaryCourtBlend(0,z-.0001,50,40)-sanctuaryCourtBlend(0,z+.0001,50,40))<.001);
});
