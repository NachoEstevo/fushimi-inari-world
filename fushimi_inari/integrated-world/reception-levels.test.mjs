import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {receptionLevels} from './reception-levels.mjs';
const f=JSON.parse(fs.readFileSync(new URL('../geography/features.json',import.meta.url))).buildings.find(b=>b.id==='way/105449708');
const a=f.points[1],b=f.points[2],yaw=-Math.atan2(b[2]-a[2],b[0]-a[0]);
test('upper reception body clears rising terrace while lower counter datum stays fixed',()=>{
 const ground=(x,z)=>42.382249+1.6*Math.max(0,Math.min(1,(x-36)/8));
 const result=receptionLevels(a,yaw,ground);
 assert.equal(result.base,ground(a[0],a[2]));assert.ok(Math.abs(result.rise-1.6)<1e-9);
 for(const x of [12,20,29.32])for(const z of [0,3.9,7.8])assert.ok(result.base+result.rise>=ground(a[0]+Math.cos(yaw)*x+Math.sin(yaw)*z,a[2]-Math.sin(yaw)*x+Math.cos(yaw)*z));
});
test('flat or descending context never lowers the building and invalid grades fail visibly',()=>{
 assert.equal(receptionLevels(a,yaw,()=>42).rise,0);
 assert.equal(receptionLevels(a,yaw,x=>50-x*.01).rise,0);
 assert.throws(()=>receptionLevels(a,yaw,()=>NaN),/Invalid reception/);
});
