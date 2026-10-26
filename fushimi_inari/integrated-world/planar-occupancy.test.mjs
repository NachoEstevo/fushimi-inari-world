import test from 'node:test';
import assert from 'node:assert/strict';
import {createPlanarOccupancy} from './planar-occupancy.mjs';
const brute=(colliders,x,z,r,clearance)=>colliders.some(c=>{
 const a=c.args;if(c.type==='cylinder')return Math.hypot(x-a[0],z-a[1])<a[2]+r+clearance;
 if(c.type!=='box')return false;
 const dx=x-a[0],dz=z-a[1],yaw=a[4]??0;
 return Math.abs(dx*Math.cos(yaw)-dz*Math.sin(yaw))<a[2]+r+clearance&&Math.abs(dx*Math.sin(yaw)+dz*Math.cos(yaw))<a[3]+r+clearance;
});
test('matches full world clearance scans across rotated boxes, cylinders and cell boundaries',()=>{
 let seed=96031;const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
 const colliders=Array.from({length:600},(_,i)=>({type:i%2?'box':'cylinder',args:[random()*800-400,random()*800-400,random()*8+.1,random()*6+.1,random()*Math.PI*2]}));
 for(const clearance of [.08,.18]){
  const occupied=createPlanarOccupancy(colliders,{clearance});
  for(let i=0;i<20000;i++){
   const x=i%3?random()*900-450:(i%61-30)*16,z=random()*900-450,r=random()*4;
   assert.equal(occupied(x,z,r),brute(colliders,x,z,r,clearance),`query ${i}`);
  }
 }
});
test('retains strict contact boundaries and construction-time snapshot',()=>{
 const colliders=[{type:'box',args:[0,0,1,1,0]},{type:'cylinder',args:[20,0,1]}];
 const occupied=createPlanarOccupancy(colliders);
 assert.equal(occupied(1.18,0,0),false);assert.equal(occupied(1.179,0,0),true);
 assert.equal(occupied(21.18,0,0),brute(colliders,21.18,0,0,.18));assert.equal(occupied(21.179,0,0),true);
 colliders.push({type:'box',args:[50,50,1,1,0]});assert.equal(occupied(50,50,0),false);
});
