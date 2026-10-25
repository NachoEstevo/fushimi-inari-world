import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {detailKeihanCar,detailKeihanDoor,keihanServiceMaterial,keihanDisplayPlane} from './keihan-train-detail.mjs';

test('shared service atlas preserves explicit inferred provenance and panel UVs',()=>{
 const m=keihanServiceMaterial(),panels=[];
 assert.match(m.userData.provenance,/Interpretive/);assert.match(m.userData.provenance,/not an observed/);
 const parts={put:(g,material,metricUV)=>panels.push({g,material,metricUV})};
 keihanDisplayPlane(parts,m,{x:1,y:2,z:3,width:1,height:.3,side:1});
 keihanDisplayPlane(parts,m,{x:-1,y:2,z:3,width:1,height:.3,side:-1,identity:true});
 for(const [i,p] of panels.entries()){
  assert.equal(p.material,m);assert.equal(p.metricUV,false);
  assert.equal(Math.min(...Array.from({length:4},(_,k)=>p.g.attributes.uv.getX(k))),i*.5);
  assert.equal(Math.max(...Array.from({length:4},(_,k)=>p.g.attributes.uv.getX(k))),(i+1)*.5);
  assert.equal(Math.min(...Array.from({length:4},(_,k)=>p.g.attributes.uv.getY(k))),i===0?.25:0);
  assert.equal(Math.max(...Array.from({length:4},(_,k)=>p.g.attributes.uv.getY(k))),i===0?.75:1);
  assert.ok(Math.sign(p.g.attributes.normal.getX(0))===(i===0?1:-1));p.g.dispose();
 }
 m.dispose();
});

test('close carriage seating retains vestibule clearance and far car detail stays bounded',()=>{
 const spec={train:{carWidth:2.792,carLength:18.7,selectedCar:0,doorOffsets:[-6.2,0,6.2]}},boxes=[];
 const p=Object.fromEntries(['dark','metal','cream','seat','yellow'].map(k=>[k,k]));
 let triangles=0;const parts={box:(w,h,d,x,y,z,material)=>{boxes.push({w,h,d,x,y,z,material});triangles+=12;},beam:()=>{triangles+=24;},put:g=>{triangles+=(g.index?.count??g.attributes.position.count)/3;g.dispose();}};
 const close=detailKeihanCar(parts,spec,p,0,0),closeTriangles=triangles;
 assert.ok(close.seats>30);assert.equal(close.dividers,16);assert.ok(close.windows>8);
 for(const b of boxes.filter(b=>b.material==='seat'))for(const door of spec.train.doorOffsets)
  assert.ok(Math.abs(b.z-door)-b.d/2>=.65,'seat stays outside clear vestibule');
 boxes.length=0;const far=detailKeihanCar(parts,spec,p,1,19);
 assert.equal(far.seats,0);assert.equal(far.dividers,0);assert.ok(triangles-closeTriangles<closeTriangles/3);
 assert.ok(boxes.every(b=>[b.w,b.h,b.d,b.x,b.y,b.z].every(Number.isFinite)));
});

test('door trim uses leaf-local coordinates and leaves the existing glass opening uncovered',()=>{
 for(const side of [-1,1]){
  const boxes=[];detailKeihanDoor((w,h,d,x,y,z,material)=>boxes.push({w,h,d,x,y,z,material}),{dark:'rubber',metal:'metal'},side);
  assert.ok(boxes.some(b=>b.material==='metal'&&Math.sign(b.x)===-side));
  for(const b of boxes)assert.ok(!(Math.abs(b.y-1.66)<b.h/2&&Math.abs(b.z)<b.d/2),'no added panel across window center');
 }
});
