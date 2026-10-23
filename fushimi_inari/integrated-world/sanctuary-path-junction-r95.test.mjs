import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {buildPathMeshes} from './path-meshes.mjs';
import {partitionSanctuaryPathTrianglesR95} from './sanctuary-path-junction-r95.mjs';
import {polygonArea,clipConvex} from './entrance-area-surfaces-layout.mjs';
const first=[61.57246398925781,44.122249603271484,-21.599843978881836,63.17616271972656,44.122249603271484,-19.72170639038086,63.03947448730469,44.122249603271484,-21.717159271240234];
const second=[63.615360260009766,44.122249603271484,-21.72789192199707,61.684452056884766,44.122249603271484,-20.193971633911133,63.68226623535156,44.122249603271484,-20.287437438964844];
const triangles=v=>Array.from({length:v.length/9},(_,i)=>[0,1,2].map(j=>[v[i*9+j*3],v[i*9+j*3+2]])),area=v=>triangles(v).reduce((s,t)=>s+Math.abs(polygonArea(t)),0);

test('actual sanctuary ray triangles are partitioned through the production precinct material bucket',()=>{
 const previous=globalThis.document,noop=()=>{},context=new Proxy({createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),getImageData:(x,y,w,h)=>({data:new Uint8ClampedArray(w*h*4)}),createLinearGradient:()=>({addColorStop:noop})},{get:(o,k)=>o[k]??noop});
 globalThis.document={createElement:()=>({width:512,height:256,getContext:()=>context}),body:{dataset:{}}};
 try{
  const m=new THREE.MeshStandardMaterial(),precinct=new THREE.MeshStandardMaterial({color:'#123456'}),legacy={materials:{stoneMat:m,gravelMat:m,flagstoneMat:m,precinctPaving:precinct}};
  const segments=[first,second].map((triangle,i)=>({id:`actual-sanctuary-${i}`,a:triangle.slice(0,3),b:triangle.slice(3,6),ya:triangle[1],yb:triangle[4],width:2,kind:'stone',distance:0,accessJunctionTriangles:triangle}));
  const group=buildPathMeshes({segments,edgeCovered:()=>true},legacy,()=>44),vertices=[];
  group.traverse(o=>{if(!o.isMesh)return;assert.equal(o.material.color.getHexString(),'123456');const p=o.geometry.attributes.position,uv=o.geometry.attributes.uv;for(let i=0;i<p.count;i++){vertices.push(p.getX(i),p.getY(i),p.getZ(i));assert.ok(Math.abs(uv.getX(i)-p.getX(i)/2)<1e-5);assert.ok(Math.abs(uv.getY(i)-p.getZ(i)/2)<1e-5);}});
  const tops=triangles(vertices),point=[62.70296345378558,-20.70814836902661],inside=t=>Math.abs(Math.abs(polygonArea(t))-[0,1,2].reduce((sum,i)=>sum+Math.abs(polygonArea([t[i],t[(i+1)%3],point])),0))<1e-6;
  assert.equal(tops.filter(inside).length,1,'measured black rectangle ray must meet one precinct face');
  const overlap=Math.abs(polygonArea(clipConvex(triangles(first)[0],triangles(second)[0])));
  assert.ok(Math.abs(area(vertices)-(area([...first,...second])-overlap))<1e-5);
 }finally{globalThis.document=previous;}
});
test('actual black-rectangle ray triangles retain union area once and one top face at measured pixel hit',()=>{const input=[...first,...second],overlap=Math.abs(polygonArea(clipConvex(triangles(first)[0],triangles(second)[0])));assert.ok(overlap>.1);const out=partitionSanctuaryPathTrianglesR95(input);assert.ok(Math.abs(area(out)-(area(input)-overlap))<1e-8);const tops=triangles(out);for(let i=0;i<tops.length;i++)for(let j=0;j<i;j++)assert.ok(Math.abs(polygonArea(clipConvex(tops[i],tops[j])))<1e-8);const [x,z]=[62.70296345378558,-20.70814836902661],inside=t=>Math.abs(Math.abs(polygonArea(t))-Math.abs(polygonArea([t[0],t[1],[x,z]]))-Math.abs(polygonArea([t[1],t[2],[x,z]]))-Math.abs(polygonArea([t[2],t[0],[x,z]])))<1e-8;assert.equal(tops.filter(inside).length,1);assert.ok(Math.abs(area(partitionSanctuaryPathTrianglesR95(out))-area(out))<1e-8);});
test('bounded sanctuary partition preserves UVs, distinct lower apron and remote Okusha surfaces',()=>{const lower=first.map((v,i)=>i%3===1?v-.035:v),remote=first.map((v,i)=>i%3===0?v+200:i%3===2?v+90:v),input=[...first,...second,...lower,...remote],uv=[];for(let i=0;i<input.length;i+=3)uv.push(input[i]/2,input[i+2]/3);const out=partitionSanctuaryPathTrianglesR95(input,uv);assert.ok(out.vertices.every(Number.isFinite));for(let i=0;i<out.vertices.length/3;i++){assert.ok(Math.abs(out.uv[i*2]-out.vertices[i*3]/2)<1e-8);assert.ok(Math.abs(out.uv[i*2+1]-out.vertices[i*3+2]/3)<1e-8);}assert.ok(out.vertices.some((v,i)=>i%3===1&&Math.abs(v-(first[1]-.035))<1e-8));assert.deepEqual(out.vertices.slice(-9),remote);});
