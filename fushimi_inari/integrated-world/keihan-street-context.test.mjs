import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from 'three';
import {heightAt} from '../geography/geo-core.mjs';
import {makePathSurfaces} from './path-surfaces.mjs';
import {SpatialCollisionWorld} from './collision.mjs';
import {buildKeihanStreetContext,HOMMACHI_FINISH_IDS} from './keihan-street-context.mjs';
import {buildEntranceNeighborhood} from './entrance-neighborhood.mjs';
import {KEIHAN_BUILDING_IDS,createKeihanStationSpec} from './keihan-station-spec.mjs';
import {keihanFrontageIds} from './keihan-frontages.mjs';
import {entranceNeighborhoodLayout} from './entrance-neighborhood-layout.mjs';

const features=JSON.parse(readFileSync(new URL('../geography/features.json',import.meta.url)));
const terrain=JSON.parse(readFileSync(new URL('../geography/terrain.json',import.meta.url)));
const surfaces=makePathSurfaces(features,(x,z)=>heightAt(terrain,x,z));
const fixture=()=>{const root=new THREE.Group(),colliders=[],built=buildKeihanStreetContext(root,features,surfaces,{},colliders);root.updateMatrixWorld(true);return {root,colliders,built};};

test('walking neighborhood retains complete mapped footprints without taking other owners',()=>{
 const before=JSON.stringify(features),{root,colliders,built}=fixture();
 assert.equal(built.built,true);assert.ok(built.builtIds.length>=110);assert.ok(built.triangles<32000);assert.ok(built.drawBatches<=8);
 const otherOwners=[...KEIHAN_BUILDING_IDS,...keihanFrontageIds,'way/795552041','way/952687107',...entranceNeighborhoodLayout(features).records.map(r=>r.id)];
 assert.ok(otherOwners.every(id=>!built.builtIds.includes(id)));
 for(const r of built.records){assert.deepEqual(r.points,features.buildings.find(b=>b.id===r.id).points.slice(0,-1));assert.ok(r.center[0]>=-360&&r.center[0]<-160);assert.ok(r.center[1]>=-320&&r.center[1]<=35);}
 assert.equal(JSON.stringify(features),before);assert.equal(buildKeihanStreetContext(root,features,surfaces,{},colliders).group,built.group);assert.equal(root.children.length,1);assert.equal(colliders.length,built.collidersAdded);
 let lights=0;root.traverse(o=>{if(o.isLight)lights++;if(o.isMesh)assert.ok([...o.geometry.attributes.position.array].every(Number.isFinite));});assert.equal(lights,0);
});

test('new walls leave mapped street and station exit walking lanes clear',()=>{
 const {colliders}=fixture(),world=new SpatialCollisionWorld();for(const c of colliders)world.addBox(...c.args);
 const paths=features.paths.filter(p=>['way/946510942','way/79699849','way/79699850','way/105449722','way/952687115'].includes(p.id));
 const spec=createKeihanStationSpec(features,surfaces);paths.push({id:'platform-gate',points:Object.values(spec.route).filter(p=>Array.isArray(p))});
 let samples=0;
 for(const path of paths)for(let i=1;i<path.points.length;i++){
  const a=path.points[i-1],b=path.points[i],dx=b[0]-a[0],dz=b[2]-a[2],length=Math.hypot(dx,dz);if(length<.01)continue;
  const steps=Math.ceil(length/.2);
  for(let j=0;j<=steps;j++)for(const side of [-.5,0,.5]){
   const x=a[0]+dx*j/steps-dz/length*side,z=a[2]+dz*j/steps+dx/length*side,y=surfaces.height(x,z),result=world.resolvePlayer(x,y+1.7,z);
   assert.ok(Math.hypot(result.x-x,result.z-z)<1e-7,`${path.id} lane ${side} blocked at ${x},${z}`);samples++;
  }
 }
 assert.ok(samples>3000);
});

test('wall collider centres hit actual mapped wall faces at body height',()=>{
 const {root,colliders}=fixture();
 for(const col of colliders){const [x,z,,halfD,yaw,y0,y1]=col.args,y=Math.max(y0+1,Math.min(y1-.2,y0+1.7));
  const normal=new THREE.Vector3(Math.sin(yaw),0,Math.cos(yaw)),origin=new THREE.Vector3(x,y,z).addScaledVector(normal,.3),ray=new THREE.Raycaster(origin,normal.clone().negate(),0,.5);
  const hits=ray.intersectObject(root,true);assert.ok(hits.some(h=>Math.abs(h.distance-(.3-halfD))<.0001),col.args.at(-1));
 }
});

test('street-facing datums use paved streets and solid shells reach underlying terrain',()=>{
 const {built}=fixture(),shifted=buildKeihanStreetContext(new THREE.Group(),features,{...surfaces,terrainHeight:(x,z)=>surfaces.terrainHeight(x,z)-.5});
 for(const r of built.records.filter(r=>r.frontage?.distance<15)){const other=shifted.records.find(s=>s.id===r.id);assert.equal(other.floor,r.floor);}
 assert.match(built.inferred,/interpretive/);assert.match(built.provenance,/October 2024/);assert.equal(built.surfaceHeight,undefined);
});

test('missing street datum does not remove aerial buildings or mutate the scene',()=>{
 const root=new THREE.Group(),colliders=[],built=buildKeihanStreetContext(root,features,{segments:[]},{},colliders);
 assert.equal(built.built,false);assert.deepEqual(built.builtIds,[]);assert.equal(root.children.length,0);assert.equal(colliders.length,0);
});

test('Hommachi faces point toward its north-south road and preserve corner frontages',()=>{
 const {built}=fixture(),hommachi=built.records.flatMap(s=>s.frontages.filter(f=>f.road.id==='way/79699850').map(f=>({s,f})));
 assert.ok(hommachi.length>=12);assert.ok(built.records.some(s=>s.frontages.length===2),'corner buildings retain both street faces');
 for(const {s,f}of hommachi){const a=s.points[f.edge],b=s.points[(f.edge+1)%s.points.length],dx=b[0]-a[0],dz=b[2]-a[2],length=Math.hypot(dx,dz);assert.ok(Math.abs(dz/length)>.6);assert.ok(f.distance<15);}
 assert.ok(built.records.some(s=>s.center[1]>-20),'context reaches the first-torii junction');
});

test('existing east-side Hommachi owners receive finish only, with no duplicate envelope or collider',()=>{
 const root=new THREE.Group(),colliders=[],materials={entryStoneMat:new THREE.MeshStandardMaterial()},entrance=buildEntranceNeighborhood(root,features,surfaces.terrainHeight,materials,colliders,surfaces),beforeColliders=colliders.length,beforeChildren=entrance.group.children.length;
 const baseline=fixture().built,built=buildKeihanStreetContext(root,features,surfaces,{},colliders);
 assert.equal(built.finishRecords.length,6);assert.equal(entrance.group.children.length,beforeChildren);assert.equal(colliders.length-beforeColliders,built.collidersAdded);assert.equal(built.collidersAdded,baseline.collidersAdded);
 assert.equal(built.drawBatches,6);assert.ok(built.triangles<32000);
 for(const s of built.finishRecords){assert.ok(HOMMACHI_FINISH_IDS.includes(s.id));assert.ok(entrance.builtIds.includes(s.id));assert.ok(!built.builtIds.includes(s.id));assert.equal(s.finishOnly,true);assert.ok(Math.abs(s.floor+s.height-s.ownerTop)<1e-7);}
 assert.ok(!built.finishRecords.some(s=>['way/305214938','way/305214377','way/305214369'].includes(s.id)),'R96 and Urasando owners remain untouched');
});
