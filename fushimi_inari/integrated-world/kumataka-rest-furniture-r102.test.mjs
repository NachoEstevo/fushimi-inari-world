import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import * as THREE from 'three';
import {buildKumatakaRestFurnitureR102,kumatakaRestBenchRecordsR102} from './kumataka-rest-furniture-r102.mjs';
import {clipConvex,polygonArea} from './entrance-area-surfaces-layout.mjs';
const features=JSON.parse(fs.readFileSync(new URL('../geography/features.json',import.meta.url))),water={built:true,builtIds:['way/105449705'],waterLevel:65.3145032521};
const terrain = (height=()=>66.252874)=>{const p=[[535,-150],[555,-150],[555,-130],[535,-130]],v=[];for(const i of [0,1,2,0,2,3])v.push(p[i][0],height(...p[i]),p[i][1]);return v;};
function fixture(){const root=new THREE.Group(),owner=new THREE.Group();owner.userData.kumatakaRegistrationR97=true;root.add(owner);return {root,colliders:[],surfaces:{terrainHeight:()=>66.312874},terrainPositions:terrain()};}
const build=(f,options={})=>buildKumatakaRestFurnitureR102(f.root,features,f.surfaces,f.colliders,{water,terrainPositions:f.terrainPositions,...options});
test('three real mapped bench types retain exact coordinates with bounded two-batch geometry and grounded supports',()=>{
  const f=fixture(),before=JSON.stringify(features),r=build(f);assert.ok(r);assert.equal(r.accepted.length,3);assert.equal(r.skipped.length,0);assert.equal(r.batches,2);assert.equal(r.triangles,252);assert.equal(f.colliders.length,3);assert.equal(JSON.stringify(features),before);
  for(let i=0;i<r.accepted.length;i++){
    const a=r.accepted[i],source=kumatakaRestBenchRecordsR102[i];assert.deepEqual(a.point,source.point);assert.equal(a.seats,3);assert.ok(Math.abs(a.floor-66.252874)<1e-9);assert.ok(a.support.every(y=>Math.abs(y-a.floor)<1e-9));assert.equal(f.colliders[i].args[0],a.point[0]);assert.equal(f.colliders[i].args[1],a.point[1]);
    const x=6378137*(a.lon-135.77267)*Math.PI/180*Math.cos(34.96714*Math.PI/180),z=-6378137*(a.lat-34.96714)*Math.PI/180;assert.ok(Math.hypot(a.point[0]-x,a.point[1]-z)<1e-6);
  }
  assert.equal(r.accepted.filter(a=>a.backrest).length,1);assert.equal(r.accepted[0].colour,'blue');assert.equal(r.accepted.filter(a=>a.material==='wood').length,2);
  r.group.traverse(o=>{if(!o.isMesh)return;const p=o.geometry.attributes.position;for(const n of p.array)assert.ok(Number.isFinite(n));for(let i=0;i<p.count;i++)assert.ok(r.accepted.some(a=>{const dx=p.getX(i)-a.point[0],dz=p.getZ(i)-a.point[1],u=dx*Math.cos(a.yaw)-dz*Math.sin(a.yaw),v=dx*Math.sin(a.yaw)+dz*Math.cos(a.yaw);return Math.abs(u)<=.8251&&Math.abs(v)<=.2501;}),'actual stored bench vertices remain within accepted physical footprints');});assert.equal(build(f),null);
});
test('complete bench footprints exclude actual pond, mapped roofs and public route player envelopes',()=>{
  const f=fixture(),r=build(f);
  const pond=features.water.find(w=>w.id==='way/105449705').points.slice(0,-1),wet=THREE.ShapeUtils.triangulateShape(pond.map(p=>new THREE.Vector2(p[0],p[2])),[]).map(t=>t.map(i=>[pond[i][0],pond[i][2]]));
  for(const bench of r.accepted){for(const t of wet)assert.ok(Math.abs(polygonArea(clipConvex(bench.footprint,t)))<1e-7);
    for(const path of features.paths.filter(p=>['way/301527750','way/439990443'].includes(p.id)))for(let i=1;i<path.points.length;i++){
      const a=path.points[i-1],b=path.points[i],dx=b[0]-a[0],dz=b[2]-a[2],len=Math.hypot(dx,dz),n=[-dz/len*1.28,dx/len*1.28],strip=[[a[0]+n[0],a[2]+n[1]],[b[0]+n[0],b[2]+n[1]],[b[0]-n[0],b[2]-n[1]],[a[0]-n[0],a[2]-n[1]]];assert.ok(Math.abs(polygonArea(clipConvex(bench.footprint,strip)))<1e-7);
    }
  }
});
test('existing physical owners suppress matching furniture without moving POIs or mutating prior colliders',()=>{
  const f=fixture(),point=kumatakaRestBenchRecordsR102[0].point,prior={type:'cylinder',args:[...point,.4,65,80,'tree']};f.colliders.push(prior);const args=[...prior.args];
  const r=build(f);assert.equal(r.accepted.length,2);assert.equal(r.skipped[0].id,'node/9667109065');assert.deepEqual(prior.args,args);assert.equal(f.colliders[0],prior);
});
test('unknown ownership, invalid water and unsupported wet or nonfinite terrain fail closed',()=>{
  for(const invalid of ['owner','water','wet','nan','missing']){const f=fixture();if(invalid==='owner')delete f.root.children[0].userData.kumatakaRegistrationR97;if(invalid==='wet')f.terrainPositions=terrain(()=>65.35);if(invalid==='nan')f.terrainPositions=terrain(()=>NaN);if(invalid==='missing')f.terrainPositions=[];
    const result=build(f,{water:invalid==='water'?{...water,builtIds:[]}:water});if(invalid==='owner'||invalid==='water'||invalid==='missing')assert.equal(result,null);else {assert.equal(result.accepted.length,0);assert.equal(result.skipped.length,3);}assert.equal(f.colliders.length,0);assert.equal(f.root.children.length,1);
  }
});
test('all twelve actual leg bottoms follow rendered triangle interpolation rather than the higher raw sampler',()=>{
  const f=fixture(),height=(x,z)=>66.252874+(x-545)*.015+(z+140)*.005;f.terrainPositions=terrain(height);f.surfaces.terrainHeight=()=>{throw Error('Raw terrain sampler is not authoritative for rendered support');};
  const r=build(f);assert.equal(r.accepted.length,3);const vertices=[];r.group.traverse(o=>{if(o.isMesh){const p=o.geometry.attributes.position;for(let i=0;i<p.count;i++)vertices.push([p.getX(i),p.getY(i),p.getZ(i)]);}});
  let legs=0;for(const bench of r.accepted)for(const leg of bench.legSupports){
    assert.ok(Math.abs(leg.surface-height(...leg.point))<1e-9);assert.ok(Math.abs(leg.bottom-(height(...leg.point)-.02))<1e-9);
    const y=Math.min(...vertices.filter(v=>Math.hypot(v[0]-leg.point[0],v[2]-leg.point[1])<.055).map(v=>v[1]));assert.ok(Math.abs(y-leg.bottom)<1e-5,'stored Float32 geometry is buried 20mm into actual rendered support');legs++;
  }
  assert.equal(legs,12);
});
test('actual colliderless legacy stele withholds intersecting mapped bench without moving or deleting either owner',()=>{
  const f=fixture(),legacy=new THREE.Group();legacy.userData.zone='kumataka';legacy.position.set(545.254396455114,65.89652051629592,-129.16842947649747);legacy.rotation.y=-1.162212928391673;f.root.add(legacy);
  const stones=[];for(const i of [4,8]){const h=1.10+i%3*.32,o=new THREE.Mesh(new THREE.BoxGeometry(.56,h,.30),new THREE.MeshStandardMaterial());o.position.set(-9.2-i%4*1.35,h/2+i%4*.18,-8.5+Math.floor(i/4)*2.5);legacy.add(o);stones.push(o);}
  legacy.updateWorldMatrix(true,true);const matrices=stones.map(o=>o.matrixWorld.clone()),geometries=stones.map(o=>o.geometry),records=JSON.stringify(kumatakaRestBenchRecordsR102);
  const r=build(f);assert.equal(r.accepted.length,2);assert.deepEqual(r.accepted.map(a=>a.id),['node/9667109065','node/9667109066']);assert.equal(r.skipped.length,1);assert.equal(r.skipped[0].id,'node/9667109067');assert.equal(r.skipped[0].conflict.index,4);assert.ok(r.skipped[0].conflict.overlapArea>.01);assert.equal(f.colliders.length,2);
  assert.equal(JSON.stringify(kumatakaRestBenchRecordsR102),records);for(let i=0;i<stones.length;i++){assert.equal(stones[i].parent,legacy);assert.equal(stones[i].geometry,geometries[i]);assert.ok(stones[i].matrixWorld.equals(matrices[i]));}
  assert.equal(r.triangles,180);assert.equal(r.batches,2);
});
test('legacy stone exclusion requires the exact visible source contract and overlapping height',()=>{
  for(const mode of ['hidden','high','unknown']){
    const f=fixture(),legacy=new THREE.Group();legacy.userData.zone='kumataka';legacy.position.set(545.254396455114,65.89652051629592+(mode==='high'?10:0),-129.16842947649747);legacy.rotation.y=-1.162212928391673;f.root.add(legacy);
    const h=1.42,o=new THREE.Mesh(new THREE.BoxGeometry(mode==='unknown'?.57:.56,h,.30),new THREE.MeshStandardMaterial());o.position.set(-9.2,.71,-6);o.visible=mode!=='hidden';legacy.add(o);
    const r=build(f);assert.equal(r.accepted.length,3);assert.equal(r.skipped.length,0);assert.equal(o.parent,legacy);
  }
});
