import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from 'three';
import {omotesandoContextLayoutR95,buildOmotesandoContextR95,omotesandoContextSpecR95 as spec} from './omotesando-context-r95.mjs';
import {buildOmotesandoShoulders} from './omotesando-shoulders.mjs';
import {SpatialCollisionWorld} from './collision.mjs';
const features=JSON.parse(readFileSync(new URL('../geography/features.json',import.meta.url))),barriers=JSON.parse(readFileSync(new URL('../geography/sources/entrance-barriers.json',import.meta.url)));
const fakeCanvas=()=>({getContext:()=>new Proxy({},{get:()=>()=>{}})});
test('public corridor is partitioned into disjoint4.8m slabs and1.6m sidebands rather than13.6m',()=>{
 const half=spec.centralSlabWidth/2,margin=(spec.totalMappedWidth-spec.centralSlabWidth)/2;assert.equal(half,2.4);assert.equal(margin,1.6);assert.equal(2*half+2*margin,8);
 const features={paths:[{id:spec.path,tags:{width:'8'},points:[[-100,0,0],[-30,0,0]]}],buildings:[],water:[]},surface={height:(x,z)=>40+x*.03+z*.02},root=new THREE.Group(),mesh=buildOmotesandoShoulders(root,features,surface.height,surface,{precinctCobbles:new THREE.MeshStandardMaterial()});
 const p=mesh.geometry.attributes.position;for(let i=0;i<p.count;i++){const side=Math.abs(p.getZ(i));assert.ok(side>=2.4-1e-5&&side<=4+1e-5);assert.ok(Math.abs(p.getY(i)-(40+p.getX(i)*.03+p.getZ(i)*.02))<1e-5);}
 assert.equal(mesh.userData.totalPublicWidth,8);assert.equal(mesh.userData.centralWidth,4.8);

});
test('photo-inferred avenue roots fit sidebands and leave central4.8m path clear',()=>{
 const l=omotesandoContextLayoutR95(features,barriers,[]);assert.equal(l.trees.length,8);for(const t of l.trees){assert.equal(t.normal.length,2);assert.ok(spec.treeOffset-spec.wellRadius>spec.centralSlabWidth/2);assert.ok(spec.treeOffset+spec.wellRadius<spec.totalMappedWidth/2);}
});
test('existing trees and actual mapped boundaries retain ownership',()=>{
 const l=omotesandoContextLayoutR95(features,barriers,[]),t=l.trees[0];const collision=[{type:'cylinder',args:[...t.root,.3,0,100,'mapped_entrance_tree']}];assert.equal(omotesandoContextLayoutR95(features,barriers,collision).trees.length,7);
 const blocked=omotesandoContextLayoutR95(features,{ways:[{points:[[t.root[0]-1,t.root[1]],[t.root[0]+1,t.root[1]]]}]},[]);assert.ok(blocked.skipped.some(s=>s.reason==='mapped boundary clearance'));
});
test('batched trees/wells/supports are finite, idempotent and do not block center walking',()=>{
 const old=globalThis.document;globalThis.document={createElement:fakeCanvas};try{
  const root=new THREE.Group(),colliders=[],surfaces={height:(x,z)=>40+x*.03+z*.02},meta=buildOmotesandoContextR95(root,features,barriers,surfaces,{},colliders);assert.equal(meta.trees.length,8);assert.equal(meta.collidersAdded,8);assert.equal(meta.materialBatches,6);assert.equal(buildOmotesandoContextR95(root,features,barriers,surfaces,{},colliders),meta);assert.equal(colliders.length,8);
  root.traverse(o=>{if(o.isInstancedMesh)for(const value of o.instanceMatrix.array)assert.ok(Number.isFinite(value));});
  const world=new SpatialCollisionWorld();for(const c of colliders)world.addCylinder(...c.args);const l=omotesandoContextLayoutR95(features,barriers,[]);
  for(let distance=0;distance<l.sampler.total;distance+=.25){const p=l.sampler.at(distance/l.sampler.total).point;for(const side of [-2.1,0,2.1]){const x=p[0],z=p[2]+side,y=surfaces.height(x,z),resolved=world.resolvePlayer(x,y+1.7,z);assert.ok(Math.hypot(resolved.x-x,resolved.z-z)<1e-7);}}
 }finally{globalThis.document=old;}
});

test('earth well and rim vertices drape to actual sloped walk surface within millimetre offsets',()=>{
 const old=globalThis.document;globalThis.document={createElement:fakeCanvas};try{
  const root=new THREE.Group(),height=(x,z)=>40+x*.12+z*.07+.015*Math.sin(x*3),meta=buildOmotesandoContextR95(root,features,barriers,{height},{},[]);assert.ok(meta.trees.length);
  for(const [name,offset]of [['soil',.001],['well',.003]]){const mesh=root.getObjectByName('R95 avenue '+name);assert.equal(mesh.isInstancedMesh,undefined);const p=mesh.geometry.attributes.position;assert.ok(p.count>100);for(let i=0;i<p.count;i++)assert.ok(Math.abs(p.getY(i)-height(p.getX(i),p.getZ(i))-offset)<1e-5);}
 }finally{globalThis.document=old;}
});
