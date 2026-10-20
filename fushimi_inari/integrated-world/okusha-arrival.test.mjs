import test from 'node:test';
import assert from 'node:assert/strict';
import {outsideArrival} from './okusha-arrival.mjs';
const area=p=>Math.abs(p.reduce((sum,a,i)=>{const b=p[(i+1)%p.length];return sum+a[0]*b[2]-b[0]*a[2];},0))/2;
test('arrival removes overlapping pavement while retaining the surrounding area',()=>{
  const pieces=outsideArrival([[244,0,64],[256,0,64],[256,0,74],[244,0,74]]);
  assert.ok(Math.abs(pieces.reduce((n,p)=>n+area(p),0)-(120-8*6.4))<1e-8);
  assert.deepEqual(outsideArrival([[247,0,67],[248,0,67],[248,0,68],[247,0,68]]),[]);
});
test('clipping preserves interpolated height and paving UVs at the seam',()=>{
  const pieces=outsideArrival([[245,1,67,0,0],[247,3,67,1,0],[247,3,68,1,1],[245,1,68,0,1]]);
  const seam=pieces.flat().filter(p=>p[0]===246);
  assert.ok(seam.length>=2);
  for(const p of seam){assert.equal(p[1],2);assert.equal(p[3],.5);}
});
