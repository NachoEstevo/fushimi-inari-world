import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from 'three';
import {heightAt} from '../geography/geo-core.mjs';
import {makePathSurfaces} from './path-surfaces.mjs';
import {buildPathMeshes} from './path-meshes.mjs';
const features=JSON.parse(readFileSync(new URL('../geography/features.json',import.meta.url))),terrain=JSON.parse(readFileSync(new URL('../geography/terrain.json',import.meta.url)));
const network=makePathSurfaces(features,(x,z)=>heightAt(terrain,x,z));

test('real Urasando paving UVs follow each route tangent with one existing texture and unchanged grade',()=>{
 const previous=globalThis.document,noop=()=>{},context=new Proxy({createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),getImageData:(x,y,w,h)=>({data:new Uint8ClampedArray(w*h*4)}),createLinearGradient:()=>({addColorStop:noop})},{get:(o,k)=>o[k]??noop});
 globalThis.document={createElement:()=>({width:512,height:256,getContext:()=>context}),body:{dataset:{}}};
 try{
  for(const id of ['way/297888106','way/105449676'])for(const s of network.segments.filter(s=>s.id===id&&!s.stair)){
   const before=JSON.stringify(s),m=new THREE.MeshStandardMaterial(),root=buildPathMeshes({segments:[s],edgeCovered:()=>true},{materials:{stoneMat:m,gravelMat:m,flagstoneMat:m,precinctPaving:m}},()=>s.ya);
   root.updateMatrixWorld(true);
   const dx=s.b[0]-s.a[0],dz=s.b[2]-s.a[2],len=Math.hypot(dx,dz),sample=(t,offset)=>{
    const x=s.a[0]+dx*t-dz/len*offset,z=s.a[2]+dz*t+dx/len*offset,y=s.ya+(s.yb-s.ya)*t;
    const hits=new THREE.Raycaster(new THREE.Vector3(x,y+.1,z),new THREE.Vector3(0,-1,0),0,.2).intersectObject(root,true);
    assert.equal(hits.length,1,'one textured floor owns each interior sample');assert.ok(Math.abs(hits[0].point.y-y)<1e-4);return hits[0].uv;
   };
   const a=sample(.4,0),b=sample(.6,0),c=sample(.4,.2);
   assert.ok(Math.abs(b.x-a.x)<1e-4,'tile columns follow route tangent');
   assert.ok(Math.abs((b.y-a.y)-len*.2/2)<1e-4,'tile rows advance along route');
   assert.ok(Math.abs(c.y-a.y)<1e-4,'tile rows cross route at right angles');
   assert.ok(Math.abs((c.x-a.x)-.1)<1e-4,'texture retains metric width scale');
   assert.equal(JSON.stringify(s),before,'route width and walking data remain unchanged');
  }
 }finally{globalThis.document=previous;}
});
