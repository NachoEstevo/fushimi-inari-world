import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from 'three';
import {heightAt} from '../geography/geo-core.mjs';
import {makePathSurfaces} from './path-surfaces.mjs';
import {buildInariStationFrontage,inariStationFrontageId} from './inari-station-frontage.mjs';
import {buildInariStationRoute} from './inari-station-route.mjs';
import {SpatialCollisionWorld} from './collision.mjs';
const features=JSON.parse(readFileSync(new URL('../geography/features.json',import.meta.url)));
const terrain=JSON.parse(readFileSync(new URL('../geography/terrain.json',import.meta.url)));
const surfaces=makePathSurfaces(features,(x,z)=>heightAt(terrain,x,z));

test('only the real mio footprint is replaced and businesses retain their observed order',()=>{
 const input=JSON.stringify(features),root=new THREE.Group(),colliders=[],m=buildInariStationFrontage(root,features,surfaces,{},colliders);
 assert.equal(m.built,true);assert.deepEqual(m.builtIds,[inariStationFrontageId]);assert.deepEqual(m.footprint,features.buildings.find(b=>b.id===inariStationFrontageId).points.slice(0,-1));
 assert.equal(m.height,9);assert.equal(m.publicEdge,6);assert.ok(m.publicLength>11.9&&m.publicLength<12.1);
 assert.match(m.storefronts[0].name,/Daily Yamazaki/);assert.match(m.storefronts[1].name,/MIO Park/);assert.ok(m.storefronts[0].u0>m.storefronts[1].u1);
 assert.ok(m.storefronts.every(s=>s.recess>.4));assert.equal(m.equipment.length,2);assert.ok(m.triangles<5500);assert.equal(m.drawBatches,8);
 assert.equal(JSON.stringify(features),input);assert.equal(buildInariStationFrontage(root,features,surfaces,{},colliders).group,m.group);assert.equal(root.children.length,1);assert.equal(colliders.length,m.collidersAdded);
});

test('store floor follows existing paved street segments rather than off-road terrain',()=>{
 const a=buildInariStationFrontage(new THREE.Group(),features,surfaces),changed={...surfaces,height:(x,z)=>surfaces.sample(x,z)?.height??9999},b=buildInariStationFrontage(new THREE.Group(),features,changed);
 assert.equal(a.floor,b.floor);a.group.traverse(o=>{if(o.isMesh){for(const n of o.geometry.attributes.position.array)assert.ok(Number.isFinite(n));assert.ok(o.material);}});
});

test('both shallow public recesses have a visible floor and a bounded walking sampler',()=>{
 const root=new THREE.Group(),m=buildInariStationFrontage(root,features,surfaces),a=m.footprint[6],b=m.footprint[7],len=m.publicLength,t=[(b[0]-a[0])/len,(b[2]-a[2])/len],n=[t[1],-t[0]],at=(u,v)=>[a[0]+t[0]*u+n[0]*v,a[2]+t[1]*u+n[1]*v];root.updateMatrixWorld(true);
 for(const bay of m.storefronts){const [x,z]=at((bay.u0+bay.u1)/2,-bay.recess/2);assert.equal(m.surfaceHeight(x,z),m.floor);const ray=new THREE.Raycaster(new THREE.Vector3(x,m.floor+.04,z),new THREE.Vector3(0,-1,0),0,.10),hit=ray.intersectObject(root,true)[0];assert.ok(hit);assert.ok(Math.abs(hit.point.y-m.floor)<1e-5);}
 for(const v of [.01,-2]){const [x,z]=at(7,v);assert.equal(m.surfaceHeight(x,z),null);}
});

test('Daily lower frame closes the source-visible base instead of exposing a slot above paving',()=>{
 const root=new THREE.Group(),m=buildInariStationFrontage(root,features,surfaces),a=m.footprint[6],b=m.footprint[7],t=[(b[0]-a[0])/m.publicLength,(b[2]-a[2])/m.publicLength],n=[t[1],-t[0]],bay=m.storefronts[0];root.updateMatrixWorld(true);
 for(const fraction of [.2,.5,.8]){const u=bay.u0+(bay.u1-bay.u0)*fraction,x=a[0]+t[0]*u+n[0]*.15,z=a[2]+t[1]*u+n[1]*.15,ray=new THREE.Raycaster(new THREE.Vector3(x,m.floor+.06,z),new THREE.Vector3(-n[0],0,-n[1]),0,.7),hit=ray.intersectObject(root,true)[0];assert.ok(hit);assert.ok(hit.distance<.60);assert.ok(Math.abs(hit.point.y-m.floor-.06)<1e-5);}
});

test('registered shop equipment and walls preserve the complete station-to-crossing walking lane',()=>{
 const root=new THREE.Group(),colliders=[],route=buildInariStationRoute(root,features,surfaces,{},colliders),m=buildInariStationFrontage(root,features,surfaces,{},colliders),world=new SpatialCollisionWorld();
 for(const c of colliders)c.type==='box'?world.addBox(...c.args):world.addCylinder(...c.args);
 let samples=0;for(let j=1;j<route.routePoints.length;j++){
  const a=route.routePoints[j-1],b=route.routePoints[j],dx=b[0]-a[0],dz=b[2]-a[2],length=Math.hypot(dx,dz),n=Math.ceil(length/.05);
  for(let i=0;i<=n;i++)for(const side of [-.12,0,.12]){const x=a[0]+dx*i/n-dz/length*side,z=a[2]+dz*i/n+dx/length*side,y=route.surfaceHeight(x,z)??surfaces.height(x,z),r=world.resolvePlayer(x,y+1.7,z);assert.ok(Math.hypot(r.x-x,r.z-z)<1e-7);samples++;}
 }
 assert.ok(samples>2300);assert.equal(colliders.filter(c=>c.args.at(-1)==='photo_mio_drinks_machine').length,1);assert.equal(colliders.filter(c=>c.args.at(-1)==='photo_mio_capsule_stack').length,2);assert.equal(m.built,true);
});

test('changed or missing source envelope withholds generic-building exclusion',()=>{
 const missing={...features,buildings:features.buildings.filter(b=>b.id!==inariStationFrontageId)};assert.deepEqual(buildInariStationFrontage(new THREE.Group(),missing,surfaces).builtIds,[]);
 const changed={...features,buildings:features.buildings.map(b=>b.id===inariStationFrontageId?{...b,tags:{...b.tags,'building:levels':'4'}}:b)},root=new THREE.Group(),colliders=[];
 const r=buildInariStationFrontage(root,changed,surfaces,{},colliders);assert.equal(r.built,false);assert.deepEqual(r.builtIds,[]);assert.equal(root.children.length,0);assert.equal(colliders.length,0);
 const truncated={...features,buildings:features.buildings.map(b=>b.id===inariStationFrontageId?{...b,points:b.points.slice(0,-2)}:b)};assert.equal(buildInariStationFrontage(new THREE.Group(),truncated,surfaces).built,false);
 for(const invalid of [{height:()=>33},{height:()=>NaN,segments:[]},{...surfaces,height:()=>99}]){const safeRoot=new THREE.Group(),safeColliders=[],r=buildInariStationFrontage(safeRoot,features,invalid,{},safeColliders);assert.equal(r.built,false);assert.deepEqual(r.builtIds,[]);assert.equal(safeRoot.children.length,0);assert.equal(safeColliders.length,0);}
});
