import test from 'node:test';
import assert from 'node:assert/strict';
import {okushaCourtGrade} from './okusha-court.mjs';
test('both Senbon exits and Okusha arrival share a level rather than the hillside DEM',()=>{
  const h=62.394978;
  for(const [x,z] of [[250.274,69.742],[250.337,67.504],[257.517,71.489],[265.799,67.12],[273.782,61.393]])assert.equal(okushaCourtGrade(x,z,70,h),h);
  assert.equal(okushaCourtGrade(200,20,58,h),58);
});
test('terrace releases continuously into the surrounding hillside',()=>{
  let previous=okushaCourtGrade(278,69,70,62.4);
  for(let x=278.05;x<287;x+=.05){const y=okushaCourtGrade(x,69,70,62.4);assert.ok(Math.abs(y-previous)<.12);previous=y;}
});
