import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from 'three';
import {clipOmotesandoRoadRibbon,buildPathMeshes} from './path-meshes.mjs';
import {pathOffset} from './path-frame.mjs';
import {pathWidth} from '../geography/geo-core.mjs';
import {clipConvex,polygonArea} from './entrance-area-surfaces-layout.mjs';
const features=JSON.parse(readFileSync(new URL('../geography/features.json',import.meta.url)));
test('production path builder emits no Omotesando slab under the six crossing bands',()=>{
 const previous=globalThis.document,noop=()=>{},context=new Proxy({createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),getImageData:(x,y,w,h)=>({data:new Uint8ClampedArray(w*h*4)}),createLinearGradient:()=>({addColorStop:noop})},{get:(o,k)=>o[k]??noop});
 globalThis.document={createElement:()=>({width:512,height:256,getContext:()=>context}),body:{dataset:{}}};
 try{
  const segments=features.paths.filter(p=>['way/79699850','way/105449722'].includes(p.id)).flatMap(path=>path.points.slice(1).map((b,i)=>({id:path.id,a:path.points[i],b,ya:path.points[i][1],yb:b[1],distance:0,width:pathWidth(path.tags),kind:path.id==='way/79699850'?'street':'stone'})));
  const m=new THREE.MeshStandardMaterial(),root=buildPathMeshes({segments,edgeCovered:()=>true},{materials:{stoneMat:m,gravelMat:m,flagstoneMat:m}},()=>33);
  root.updateMatrixWorld(true);const ribbon=root.getObjectByName('Omotesando central slab ribbon');assert.ok(ribbon);let vertices=0;
  ribbon.traverse(o=>{if(!o.isMesh)return;const p=o.geometry.attributes.position;for(let i=0;i<p.count;i++){const v=new THREE.Vector3().fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld);assert.ok(v.x>-154.5,'ribbon must start at eastern road edge');vertices++;}});
  assert.ok(vertices>0);
 }finally{globalThis.document=previous;}
});
test('mapped Omotesando entrance pavement yields only the Hommachi footprint, preserving slopes and UVs',()=>{
 const path=features.paths.find(p=>p.id==='way/105449722'),road=features.paths.find(p=>p.id==='way/79699850');
 const segments=road.points.slice(1).map((b,i)=>({a:road.points[i],b,id:road.id,width:pathWidth(road.tags)}));
 const a=path.points.at(-2),b=path.points.at(-1),n=pathOffset(a,b);
 const point=(p,side,v)=>[p[0]+n[0]*side*2.4,p[1],p[2]+n[1]*side*2.4,side+1,v];
 const quad=[point(a,-1,0),point(b,-1,1),point(b,1,1),point(a,1,0)],snapshot=JSON.stringify(segments),result=clipOmotesandoRoadRibbon(quad,segments);
 assert.ok(result.length);assert.equal(JSON.stringify(segments),snapshot);
 for(const tri of result)for(const p of tri){assert.ok(p.every(Number.isFinite));assert.ok(Math.abs(p[1]-(a[1]+(b[1]-a[1])*p[4]))<1e-8);assert.ok(p[3]>=-1e-8&&p[3]<=2+1e-8);}
 for(const [i,s] of segments.entries()){
  const na=pathOffset(s.a,s.b,segments[i-1]),nb=pathOffset(s.a,s.b,segments[i+1],true),at=(p,n,side)=>[p[0]+n[0]*side*s.width/2,p[2]+n[1]*side*s.width/2];
  const mask=[at(s.a,na,-1),at(s.b,nb,-1),at(s.b,nb,1),at(s.a,na,1)];
  for(const tri of result)assert.ok(Math.abs(polygonArea(clipConvex(tri.map(p=>[p[0],p[2]]),mask)))<1e-7);
 }
 const area=tri=>Math.abs(polygonArea(tri.map(p=>[p[0],p[2]]))),remaining=result.reduce((sum,t)=>sum+area(t),0),original=area(quad);
 assert.ok(remaining>original*.5&&remaining<original*.8,'only the street overlap is removed');
 const elsewhere=quad.map(p=>[p[0]+100,...p.slice(1)]);assert.equal(clipOmotesandoRoadRibbon(elsewhere,segments).reduce((sum,t)=>sum+area(t),0),area(elsewhere));
 assert.equal(clipOmotesandoRoadRibbon(quad,segments.map(s=>({...s,id:'unrelated-road'}))).reduce((sum,t)=>sum+area(t),0),original);
});
