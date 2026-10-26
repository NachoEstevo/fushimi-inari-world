import test from 'node:test';
import assert from 'node:assert/strict';
import {partitionStationStreetTops} from './station-street-path-ownership.mjs';
import {polygonArea,clipConvex} from './entrance-area-surfaces-layout.mjs';
const triangles=v=>Array.from({length:v.length/9},(_,i)=>[0,3,6].map(j=>v.slice(i*9+j,i*9+j+3)));
const flat=t=>t.map(p=>[p[0],p[2]]),area=v=>triangles(v).reduce((n,t)=>n+Math.abs(polygonArea(flat(t))),0);
const quad=(x0,x1,z0,z1,y)=>{const p=[[x0,y(x0,z0),z0],[x0,y(x0,z1),z1],[x1,y(x1,z1),z1],[x1,y(x1,z0),z0]];return [...p[0],...p[1],...p[2],...p[0],...p[2],...p[3]];};
test('sloped station road owns crossing stone patches without changing retained grade or UV',()=>{
 const road=quad(-160,-154,-8,8,(x,z)=>33+z*.02),trail=quad(-164,-150,-2,2,(x,z)=>33.03+z*.015),buckets={street:road,stone:trail},uvs={stone:trail.flatMap((v,i)=>i%3===0?[v/3,trail[i+2]/4]:[])};
 const result=partitionStationStreetTops(buckets,uvs);
 assert.ok(result.overlaps>0);assert.deepEqual(buckets.street,road);assert.ok(Math.abs(area(buckets.stone)-32)<1e-7);
 for(const r of triangles(buckets.street))for(const s of triangles(buckets.stone))assert.ok(Math.abs(polygonArea(clipConvex(flat(r),flat(s))))<1e-8);
 for(let i=0;i<buckets.stone.length;i+=3){const [x,y,z]=buckets.stone.slice(i,i+3);assert.ok(Math.abs(y-(33.03+z*.015))<1e-8);assert.ok(Math.abs(uvs.stone[i/3*2]-x/3)<1e-8);assert.ok(Math.abs(uvs.stone[i/3*2+1]-z/4)<1e-8);}
 for(const t of triangles(buckets.stone))assert.ok(polygonArea(flat(t))<0,'upward winding retained');
});
test('station sloped path joins have one owner while separated levels and outside region remain intact',()=>{
 const first=quad(-305,-301,-140,-130,(x,z)=>31+(z+140)*.025),second=quad(-303,-299,-138,-128,(x,z)=>31.01+(z+140)*.025),upper=second.map((v,i)=>i%3===1?v+3:v),outside=quad(10,14,10,14,()=>31),buckets={stone:[...first,...second,...upper,...outside]},uvs={};
 partitionStationStreetTops(buckets,uvs);
 assert.ok(Math.abs(area(buckets.stone)-(40+40-16+40+16))<1e-7);
 assert.deepEqual(buckets.stone.slice(-upper.length-outside.length),[...upper,...outside]);
 const before=structuredClone(buckets);partitionStationStreetTops(buckets,uvs);assert.deepEqual(buckets,before);
});
test('mapped Omotesando corridor central slabs own sloped crossing footways, including near x=-63',()=>{
 const central=quad(-75,-55,3,8,(x,z)=>37+(x+75)*.035),crossing=quad(-64,-62,-1,12,(x,z)=>37.42+z*.01),buckets={omotesando:central,stone:crossing},uvs={};
 const report=partitionStationStreetTops(buckets,uvs);
 assert.ok(report.overlaps>0);assert.deepEqual(buckets.omotesando,central);
 for(const a of triangles(buckets.omotesando))for(const b of triangles(buckets.stone))assert.ok(Math.abs(polygonArea(clipConvex(flat(a),flat(b))))<1e-8);
 assert.ok(Math.abs(area(buckets.stone)-16)<1e-7,'crossing continues beyond both central slab edges');
});
test('spatial cells avoid comparing every station triangle with distant accepted geometry',()=>{
 const stone=[];for(let x=-355;x<-170;x+=20)for(let z=-300;z<-110;z+=20)stone.push(...quad(x,x+3,z,z+3,()=>31));
 const buckets={stone},report=partitionStationStreetTops(buckets,{});
 assert.deepEqual(buckets.stone,stone);assert.equal(report.overlaps,0);assert.ok(report.candidateChecks<600);
});
