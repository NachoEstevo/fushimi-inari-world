import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import {heightAt} from '../geography/geo-core.mjs';
import {buildMitsutsujiFrontages} from './mitsutsuji-frontages.mjs';
const features=JSON.parse(fs.readFileSync(new URL('../geography/features.json',import.meta.url))),terrain=JSON.parse(fs.readFileSync(new URL('../geography/terrain.json',import.meta.url)));
const surfaces={terrainHeight:(x,z)=>heightAt(terrain,x,z),height:(x,z)=>heightAt(terrain,x,z)+.10};
const make=(f=features,s=surfaces)=>{const root=new THREE.Group(),colliders=[],materials={stoneMat:new THREE.MeshStandardMaterial()};return {root,colliders,run:()=>buildMitsutsujiFrontages(root,f,s,materials,colliders)};};
test('registered gift and cafe replace exactly their two footprints, retaining Kyoya ownership',()=>{
  const {root,run}=make(),record=run();assert.deepEqual(record.builtIds,['way/301527744','way/301527777']);
  assert.equal(record.buildings[0].kind,'gift');assert.equal(record.buildings[0].frontLength.toFixed(2),'6.98');assert.equal(record.buildings[1].frontLength.toFixed(2),'12.71');
  assert.equal(record.buildings[0].height,5.55);assert.equal(record.buildings[1].height,3.05);
  root.traverse(o=>{if(o.isMesh)assert.ok(Array.from(o.geometry.attributes.position.array).every(Number.isFinite));});
  assert.ok(record.triangles<5000);assert.equal(record.drawBatches,9);
});
test('public lane and stair mouths retain at least 1.7m clear centre corridor',()=>{
  const {run,colliders}=make();run();
  const hit=(x,z,feet,head,c)=>{const [cx,cz,hw,hd,yaw,low,high]=c.args;if(high<feet+.08||low>head)return false;const dx=x-cx,dz=z-cz;return Math.abs(Math.cos(yaw)*dx-Math.sin(yaw)*dz)<hw&&Math.abs(Math.sin(yaw)*dx+Math.cos(yaw)*dz)<hd;};
  for(const path of features.paths.filter(p=>['way/1372838160','way/1372838161','way/1372838158','way/1372838159'].includes(p.id)))for(let k=1;k<path.points.length;k++){
    const a=path.points[k-1],b=path.points[k],dx=b[0]-a[0],dz=b[2]-a[2],len=Math.hypot(dx,dz);
    for(let t=0;t<=1;t+=.025)for(const side of [-.85,0,.85]){const x=a[0]+dx*t-dz/len*side,z=a[2]+dz*t+dx/len*side,y=surfaces.height(x,z);assert.ok(!colliders.some(c=>hit(x,z,y,y+1.85,c)),`blocked ${path.id} at ${x},${z}`);}
  }
});
test('photographed canopy stays in overlap and clears real terrain walking envelope',()=>{
  const {run}=make(),record=run();assert.ok(record.canopy.span>2&&record.canopy.span<3);assert.ok(record.canopy.minHeadroom>=3);
  assert.equal(record.excludeGate({x:566.6,z:-330.4}),'source-registered Mitsutsuji covered shop lane');
  assert.equal(record.excludeGate({x:556.3,z:-335.5}),null);assert.equal(record.excludeGate({x:583,z:-319.8}),null);
  const e=record.gateExclusion,[ux,uz]=e.axis,[nx,nz]=e.inwardNormal;
  const point=s=>({x:e.origin[0]+ux*s+nx*1.6,z:e.origin[1]+uz*s+nz*1.6});
  const candidate=point(e.end+.2),posts=[-1,1].map(side=>({x:candidate.x+nx*side*1.25,z:candidate.z+nz*side*1.25,radius:.14}));
  assert.ok(record.excludeGate({...candidate,posts}),'gate centred outside street still rejected when beam reaches canopy');
  const clear=point(e.end+2),farPosts=posts.map(p=>({x:p.x+ux*1.8,z:p.z+uz*1.8,radius:p.radius}));assert.equal(record.excludeGate({...clear,posts:farPosts}),null);
  // Full black kasagi tip can reach the street while the pole-only candidate
  // lies outside. Real visual corners take precedence over pillar estimates.
  const corner=point(e.end-.1),outside=point(e.end+1);
  assert.ok(record.excludeGate({...outside,visualCorners:[[corner.x,108,corner.z],[outside.x,104,outside.z]]}));
  assert.equal(record.excludeGate({...candidate,posts,visualCorners:[[clear.x,104,clear.z],[clear.x+ux*.1,108,clear.z+uz*.1]]}),null);
});
test('rebuild is idempotent, and absent/malformed source cannot suppress generic buildings',()=>{
  const {root,colliders,run}=make(),record=run(),count=colliders.length;assert.equal(run(),record);assert.equal(colliders.length,count);assert.equal(root.children.length,1);
  const absent=make({...features,buildings:[]}).run();assert.deepEqual(absent.builtIds,[]);
  const malformed=make({...features,buildings:features.buildings.map(b=>b.id==='way/301527744'?{...b,points:[[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0]]}:b)}).run();assert.deepEqual(malformed.builtIds,['way/301527777']);
});
test('nonfinite ground cannot yield partially registered ownership',()=>{
  const {root,colliders,run}=make(features,{terrainHeight:()=>NaN,height:()=>NaN});assert.throws(run,/Nonfinite Mitsutsuji/);assert.equal(root.children.length,0);assert.equal(colliders.length,0);
});
