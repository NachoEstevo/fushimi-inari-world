import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from 'three';
import {heightAt} from '../geography/geo-core.mjs';
import {makePathSurfaces} from './path-surfaces.mjs';
import {SpatialCollisionWorld} from './collision.mjs';
import {buildKeihanFrontages,keihanFrontageIds} from './keihan-frontages.mjs';

const features=JSON.parse(readFileSync(new URL('../geography/features.json',import.meta.url)));
const terrain=JSON.parse(readFileSync(new URL('../geography/terrain.json',import.meta.url)));
const surfaces=makePathSurfaces(features,(x,z)=>heightAt(terrain,x,z));
const at=(s,u,v)=>{const a=s.points[s.edge];return [a[0]+s.t[0]*u+s.n[0]*v,a[2]+s.t[1]*u+s.n[1]*v];};

test('named shops and observed anonymous facades retain source footprints and bounded static detail',()=>{
 const before=JSON.stringify(features),root=new THREE.Group(),colliders=[],built=buildKeihanFrontages(root,features,surfaces,{},colliders);
 assert.equal(built.built,true);assert.deepEqual(built.builtIds,keihanFrontageIds);
 assert.equal(built.materialBatches,10);assert.equal(built.drawBatches,10);assert.ok(built.triangles<19000);assert.ok(built.collidersAdded<55);
 for(const store of built.storefronts){assert.deepEqual(store.points,features.buildings.find(b=>b.id===store.id).points.slice(0,-1));assert.ok(store.width>store.widthRange[0]&&store.width<store.widthRange[1]);assert.equal(store.height,6);}
 let lights=0;root.traverse(o=>{if(o.isLight)lights++;if(o.isMesh)for(const value of o.geometry.attributes.position.array)assert.ok(Number.isFinite(value));});assert.equal(lights,0);
 assert.equal(buildKeihanFrontages(root,features,surfaces,{},colliders).group,built.group);assert.equal(root.children.length,1);assert.equal(colliders.length,built.collidersAdded);assert.equal(JSON.stringify(features),before);
});

test('shop floors derive from the paved street, independently of off-road DEM fallback',()=>{
 const a=buildKeihanFrontages(new THREE.Group(),features,surfaces),b=buildKeihanFrontages(new THREE.Group(),features,{...surfaces,height:()=>9999});
 assert.deepEqual(a.storefronts.map(s=>s.floor),b.storefronts.map(s=>s.floor));
 assert.ok(a.storefronts.every(s=>s.floor>29&&s.floor<35));
});

test('the clear central entries have one physical floor and the sampler is bounded',()=>{
 const root=new THREE.Group(),built=buildKeihanFrontages(root,features,surfaces);root.updateMatrixWorld(true);
 for(const s of built.storefronts.filter(s=>s.publicRecess)){
  for(const v of [-.18,-.54,-1.16]){const [x,z]=at(s,s.width/2,v),ray=new THREE.Raycaster(new THREE.Vector3(x,s.floor+.04,z),new THREE.Vector3(0,-1,0),0,.10),hits=ray.intersectObject(root,true).filter(h=>Math.abs(h.point.y-s.floor)<1e-5);assert.equal(hits.length,1,`${s.name} floor ${v}`);assert.equal(built.surfaceHeight(x,z),s.floor);}
  for(const v of [.01,-1.8]){const [x,z]=at(s,s.width/2,v);assert.equal(built.surfaceHeight(x,z),null);}
 }
 assert.equal(built.surfaceHeight(0,0),null);
});

test('frontage cases block entry into display volumes while the street route remains clear',()=>{
 const root=new THREE.Group(),colliders=[],built=buildKeihanFrontages(root,features,surfaces,{},colliders),world=new SpatialCollisionWorld();
 for(const c of colliders)world.addBox(...c.args);
 let samples=0;
 for(const road of features.paths.filter(p=>['way/946510942','way/79699849'].includes(p.id))){
 for(let i=1;i<road.points.length;i++){const a=road.points[i-1],b=road.points[i],dx=b[0]-a[0],dz=b[2]-a[2],length=Math.hypot(dx,dz),steps=Math.ceil(length/.15);
  for(let j=0;j<=steps;j++)for(const side of [-1,0,1]){const x=a[0]+dx*j/steps-dz/length*side,z=a[2]+dz*j/steps+dx/length*side,y=surfaces.height(x,z),r=world.resolvePlayer(x,y+1.7,z);assert.ok(Math.hypot(r.x-x,r.z-z)<1e-7);samples++;}
 }
 }
 assert.ok(samples>2000);
 for(const s of built.storefronts.filter(s=>!s.kind.endsWith('-row'))){const [x,z]=at(s,.9,-.43),r=world.resolvePlayer(x,s.floor+1.7,z);assert.ok(Math.hypot(r.x-x,r.z-z)>.1,`${s.name} display collider`);}
});

test('the counters have physical fronts and the remaining anonymous shutters block entry',()=>{
 const root=new THREE.Group(),built=buildKeihanFrontages(root,features,surfaces);root.updateMatrixWorld(true);
 for(const s of built.storefronts){
  const [x,z]=at(s,s.kind.endsWith('-row')?s.width/2:.9,.12),ray=new THREE.Raycaster(new THREE.Vector3(x,s.floor+.45,z),new THREE.Vector3(-s.n[0],0,-s.n[1]),0,1),hit=ray.intersectObject(root,true)[0];assert.ok(hit,`${s.name} case must have a solid front`);assert.ok(hit.distance<.5);
 }
 for(const s of built.storefronts.filter(s=>!s.publicRecess)){const [x,z]=at(s,s.width/2,-.4);assert.equal(built.surfaceHeight(x,z),null,'closed counters and shutters must not advertise walkable interiors');}
});

test('unnamed counter and row registrations carry dated provenance without invented identities',()=>{
 const built=buildKeihanFrontages(new THREE.Group(),features,surfaces),unnamed=built.storefronts.filter(s=>!s.sourceName);
 assert.equal(unnamed.length,3);assert.ok(unnamed.every(s=>s.registration.includes('Photo-inferred')));
 assert.ok(built.sources.some(s=>s.includes('October 2024')));assert.ok(built.sources.some(s=>s.includes('November 2020')));
 const closed=built.storefronts.filter(s=>s.kind.endsWith('-row')),colliders=[];buildKeihanFrontages(new THREE.Group(),features,surfaces,{},colliders);
 const world=new SpatialCollisionWorld();for(const c of colliders)world.addBox(...c.args);
 for(const s of closed){const [x,z]=at(s,s.width*(s.kind==='green-awning-row'?5/6:1/6),-.05),r=world.resolvePlayer(x,s.floor+1.7,z);assert.ok(Math.hypot(r.x-x,r.z-z)>.15);}
});

test('the observed soft-serve model has a physical plinth touching its shop floor',()=>{
 const root=new THREE.Group(),built=buildKeihanFrontages(root,features,surfaces),s=built.storefronts.find(s=>s.kind==='soft-serve');root.updateMatrixWorld(true);
 const [x,z]=at(s,.35,-.29),ray=new THREE.Raycaster(new THREE.Vector3(x,s.floor+.125,z),new THREE.Vector3(0,-1,0),0,.13),hits=ray.intersectObject(root,true);
 assert.ok(hits.some(h=>Math.abs(h.point.y-s.floor-.12)<1e-5),'a plinth top supports the cone base');
 assert.ok(hits.some(h=>Math.abs(h.point.y-s.floor)<1e-5),'the plinth reaches the single real shop floor');
});

test('missing or changed registration withholds replacements without mutating scene or colliders',()=>{
 const variants=[
  {...features,buildings:features.buildings.filter(b=>b.id!==keihanFrontageIds[0])},
  {...features,buildings:features.buildings.map(b=>b.id===keihanFrontageIds[1]?{...b,tags:{...b.tags,name:'different owner'}}:b)},
  {...features,buildings:features.buildings.map(b=>b.id===keihanFrontageIds[0]?{...b,points:b.points.map(p=>[p[0]+20,p[1],p[2]])}:b)}
 ];
 for(const f of variants){const root=new THREE.Group(),colliders=[],result=buildKeihanFrontages(root,f,surfaces,{},colliders);assert.equal(result.built,false);assert.deepEqual(result.builtIds,[]);assert.equal(root.children.length,0);assert.equal(colliders.length,0);}
 for(const bad of [{}, {...surfaces,segments:[]}, {...surfaces,segments:surfaces.segments.map(s=>({...s,ya:NaN,yb:NaN}))}]){const root=new THREE.Group(),colliders=[],result=buildKeihanFrontages(root,features,bad,{},colliders);assert.equal(result.built,false);assert.equal(root.children.length,0);assert.equal(colliders.length,0);}
});


test('fabric canopies slope toward the street and preserve head clearance in one static batch',()=>{
 const root=new THREE.Group(),built=buildKeihanFrontages(root,features,surfaces);root.updateMatrixWorld(true);
 const fabric=built.group.children.filter(m=>m.material.vertexColors&&m.material.color.getHex()===0xffffff);
 assert.equal(fabric.length,1);
 for(const s of built.storefronts){
  const u=s.kind.endsWith('-row')?s.width/6:s.width/2;
  const height=v=>{const [x,z]=at(s,u,v);const hits=new THREE.Raycaster(new THREE.Vector3(x,s.floor+3.4,z),new THREE.Vector3(0,-1,0),0,1.1).intersectObject(fabric[0]);assert.ok(hits.length,`${s.kind}: cloth at ${v}`);return hits[0].point.y-s.floor;};
  const back=height(.02),front=height(s.kind.endsWith('-row')?.40:.60);
  assert.ok(back-front>.10,`${s.kind}: visibly sloped canopy`);assert.ok(front>2.60,`${s.kind}: head clearance`);
 }
 assert.equal(built.collidersAdded,54);
});

test('two extra anonymous counters add four registered light emitters without adding scene lights',()=>{
 const built=buildKeihanFrontages(new THREE.Group(),features,surfaces);
 assert.equal(built.openServiceBays,4);assert.equal(built.lightPositions.length,4);
 for(const p of built.lightPositions){assert.ok(p.every(Number.isFinite));assert.ok(built.storefronts.some(s=>Math.hypot(p[0]-s.center[0],p[2]-s.center[1])<12&&Math.abs(p[1]-s.floor-2.35)<1e-6));}
});

test('Kyozuan product boards are visible beside the shop name and use distinct shared atlas cells',()=>{
 const root=new THREE.Group(),built=buildKeihanFrontages(root,features,surfaces),s=built.storefronts.find(s=>s.kind==='soft-serve');root.updateMatrixWorld(true);
 assert.deepEqual(built.productDetails.categories,['tofu-soft-serve','matcha-tofu-soft-serve']);
 assert.equal(built.productDetails.source,'https://inari-kyoto.com/kyozuan');
 const labelMesh=built.group.children.find(m=>m.material.map&&m.material.color.getHex()===0xffffff&&!m.material.vertexColors);
 assert.ok(labelMesh);
 for(const [u,min,max]of [[s.width-.83,.50,.75],[.94,.75,1]]){
  const [x,z]=at(s,u,.10),hits=new THREE.Raycaster(new THREE.Vector3(x,s.floor+3.54,z),new THREE.Vector3(-s.n[0],0,-s.n[1]),0,1.6).intersectObject(root,true);
  assert.ok(hits[0]?.object===labelMesh,'category board must face the street without shelf occlusion: '+hits[0]?.distance);
  assert.ok(hits[0].uv.x>min&&hits[0].uv.x<max,'board selects its own product cell');
 }
 const uv=labelMesh.geometry.attributes.uv;
 assert.ok([...uv.array].every(Number.isFinite));
 assert.equal(built.drawBatches,10,'category boards reuse the name atlas material');
});
