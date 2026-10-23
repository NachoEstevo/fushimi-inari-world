import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {partitionOkushaPathTrianglesR95} from './okusha-path-junction-r95.mjs';
import {clipConvex,polygonArea} from './entrance-area-surfaces-layout.mjs';
import {makePathSurfaces} from './path-surfaces.mjs';
import {pathOffset} from './path-frame.mjs';
import {outsideArrival} from './okusha-arrival.mjs';
const triangles=v=>Array.from({length:v.length/9},(_,i)=>[0,1,2].map(j=>[v[i*9+j*3],v[i*9+j*3+2]]));
const area=v=>triangles(v).reduce((s,t)=>s+Math.abs(polygonArea(t)),0);
test('coplanar path union has deterministic single ownership while distinct heights and remote surfaces remain',()=>{
  const a=[250,62.5,60,250,62.5,64,254,62.5,60],b=[251,62.5,61,251,62.5,65,255,62.5,61],upper=a.map((n,i)=>i%3===1?n+.3:n),remote=a.map((n,i)=>i%3===0?n-100:n);
  const output=partitionOkushaPathTrianglesR95([...a,...b,...upper,...remote]);
  const overlap=Math.abs(polygonArea(clipConvex(triangles(a)[0],triangles(b)[0])));
  assert.ok(Math.abs(area(output)-(area(a)+area(b)-overlap+area(upper)+area(remote)))<1e-7);
  assert.deepEqual(partitionOkushaPathTrianglesR95(output),output);
  const source=[...a,...b],uv=[];for(let i=0;i<source.length;i+=3)uv.push(source[i]/2,source[i+2]/3);
  const mapped=partitionOkushaPathTrianglesR95(source,uv);assert.equal(mapped.uv.length,mapped.vertices.length/3*2);
  for(let i=0;i<mapped.vertices.length/3;i++){assert.ok(Math.abs(mapped.uv[i*2]-mapped.vertices[i*3]/2)<1e-7);assert.ok(Math.abs(mapped.uv[i*2+1]-mapped.vertices[i*3+2]/3)<1e-7);}
});
test('actual Okusha mapped way junction and arrival clipping no longer emit overlapping top triangles',()=>{
  const features=JSON.parse(fs.readFileSync(new URL('../geography/features.json',import.meta.url))),network=makePathSurfaces(features,()=>62.394978),vertices=[];
  const all=network.segments;
  for(let i=0;i<all.length;i++){
    const s=all[i];if(!['way/301527759','way/301527762'].includes(s.id))continue;
    const adjacent=(candidate,end)=>candidate?.id===s.id&&Math.hypot(candidate[end][0]-(end==='b'?s.a:s.b)[0],candidate[end][2]-(end==='b'?s.a:s.b)[2])<.001?candidate:null;
    const n0=pathOffset(s.a,s.b,adjacent(all[i-1],'b')),n1=pathOffset(s.a,s.b,adjacent(all[i+1],'a'),true),point=(p,n,side)=>[p[0]+n[0]*side*s.width/2,62.534978,p[2]+n[1]*side*s.width/2];
    const quad=[point(s.a,n0,-1),point(s.b,n1,-1),point(s.b,n1,1),point(s.a,n0,1)];
    for(const polygon of outsideArrival(quad))for(let j=1;j<polygon.length-1;j++)for(const p of [polygon[0],polygon[j+1],polygon[j]])vertices.push(...p);
  }
  const output=partitionOkushaPathTrianglesR95(vertices),tops=triangles(output);
  assert.ok(area(output)<area(vertices)-1);assert.ok(output.every(Number.isFinite));
  for(let i=0;i<tops.length;i++)for(let j=0;j<i;j++)assert.ok(Math.abs(polygonArea(clipConvex(tops[i],tops[j])))<1e-6,`overlap ${i}/${j}`);
  // The exact pixels identified by the integrated camera each retain one face.
  const inside=(t,x,z)=>Math.abs(polygonArea(t))-Math.abs(polygonArea([t[0],t[1],[x,z]]))-Math.abs(polygonArea([t[1],t[2],[x,z]]))-Math.abs(polygonArea([t[2],t[0],[x,z]]));
  for(const [x,z]of [[256.995932,64.225534],[257.80701,70.72704]])assert.equal(tops.filter(t=>Math.abs(inside(t,x,z))<1e-7).length,1);
});
test('actual junction curb cap pair keeps its raised lip union once',()=>{
  const first=[256.1720886230469,62.55997848510742,70.00220489501953,256.1966552734375,62.55997848510742,70.14186096191406,256.4523620605469,62.55997848510742,70.20353698730469];
  const second=[256.222900390625,62.55997848510742,70.43205261230469,256.3564758300781,62.55997848510742,70.44755554199219,256.27569580078125,62.55997848510742,69.8871841430664];
  const overlap=Math.abs(polygonArea(clipConvex(triangles(first)[0],triangles(second)[0])));assert.ok(overlap>.004);
  const output=partitionOkushaPathTrianglesR95([...first,...second]);assert.ok(Math.abs(area(output)-(area(first)+area(second)-overlap))<1e-8);
  const t=triangles(output);for(let i=0;i<t.length;i++)for(let j=0;j<i;j++)assert.ok(Math.abs(polygonArea(clipConvex(t[i],t[j])))<1e-8);
});
