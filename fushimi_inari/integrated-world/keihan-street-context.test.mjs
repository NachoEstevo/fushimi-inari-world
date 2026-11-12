import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from 'three';
import {heightAt} from '../geography/geo-core.mjs';
import {makePathSurfaces} from './path-surfaces.mjs';
import {SpatialCollisionWorld} from './collision.mjs';
import {buildKeihanStreetContext,HOMMACHI_FINISH_IDS,PARKING_REAR_FINISH_IDS} from './keihan-street-context.mjs';
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
 for(const r of built.records.filter(r=>r.frontage?.road.id&&r.frontage.distance<15)){const other=shifted.records.find(s=>s.id===r.id);assert.equal(other.floor,r.floor);}
 assert.match(built.inferred,/interpretive/);assert.match(built.provenance,/October 2024/);assert.equal(built.surfaceHeight,undefined);
});

test('missing street datum does not remove aerial buildings or mutate the scene',()=>{
 const root=new THREE.Group(),colliders=[],built=buildKeihanStreetContext(root,features,{segments:[]},{},colliders);
 assert.equal(built.built,false);assert.deepEqual(built.builtIds,[]);assert.equal(root.children.length,0);assert.equal(colliders.length,0);
});

test('mapped canal-bank parcels remain present where the road-only radius stops',()=>{
 const {built,colliders}=fixture(),roadOnly=buildKeihanStreetContext(new THREE.Group(),features,{...surfaces,segments:surfaces.segments.filter(s=>!['way/777222941','way/118027062','way/790920573'].includes(s.id))});
 for(const id of ['way/952687122','way/952687123','way/952687124']){
  assert.ok(!roadOnly.builtIds.includes(id),'regression parcel must lie beyond old road context');
  const record=built.records.find(r=>r.id===id);assert.ok(record,id);
  assert.deepEqual(record.points,features.buildings.find(b=>b.id===id).points.slice(0,-1));
  assert.ok(record.frontages.some(f=>f.road.id==='way/790920573'),'mapped canal-bank wall receives anonymous window finish');
  assert.equal(record.floor,record.frontages[0].road.y,'canal-facing finish meets the existing mapped route datum');
 }
 const world=new SpatialCollisionWorld();for(const c of colliders.filter(c=>!roadOnly.builtIds.some(id=>c.args.at(-1)==='keihan_context_'+id.split('/')[1])))world.addBox(...c.args);
 const bounds={'way/777222941':[-122,-86],'way/118027062':[-161,-121],'way/790920573':[-160,-68]};
 let samples=0;
 for(const segment of surfaces.segments){const range=bounds[segment.id],z=(segment.a[2]+segment.b[2])/2;if(!range||z<range[0]||z>range[1])continue;
  const dx=segment.b[0]-segment.a[0],dz=segment.b[2]-segment.a[2],length=Math.hypot(dx,dz);
  for(const side of [-.35,0,.35]){const x=(segment.a[0]+segment.b[0])/2-dz/length*side,zz=z+dx/length*side,y=(segment.ya+segment.yb)/2,result=world.resolvePlayer(x,y+1.7,zz);assert.ok(Math.hypot(result.x-x,result.z-zz)<1e-7,`${segment.id} lane blocked at ${x},${zz}`);samples++;}
 }
 assert.ok(samples>300);
});

test('east-gate alley faces receive bounded wall finish without claiming a shop or moving footprints',()=>{
 const {built,colliders}=fixture();
 for(const id of ['way/305213544','way/831207339']){
  const record=built.records.find(r=>r.id===id);assert.ok(record,id);
  const face=record.frontages.find(f=>f.road.id==='way/118027062');assert.ok(face,id);
  assert.ok(face.distance<6);assert.deepEqual(record.points,features.buildings.find(b=>b.id===id).points.slice(0,-1));
  assert.equal(record.floor,face.road.y);
 }
 const original=buildKeihanStreetContext(new THREE.Group(),features,{...surfaces,segments:surfaces.segments.filter(s=>!['way/777222941','way/118027062','way/790920573'].includes(s.id))},{},[]);
 assert.equal(built.collidersAdded,original.collidersAdded+colliders.filter(c=>!original.builtIds.includes('way/'+c.args.at(-1).split('_').at(-1))).length);
 assert.equal(built.drawBatches,6);assert.ok(built.triangles<32000);
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

test('existing rear-lot owners receive only anonymous low window bands on their actual south edges',()=>{
 const {built,colliders}=fixture();assert.deepEqual(built.parkingRearFinish.ids,PARKING_REAR_FINISH_IDS);
 assert.match(built.parkingRearFinish.inferred,/existing mapped walls, heights and roof forms retained/);
 for(const id of PARKING_REAR_FINISH_IDS){
  const record=built.records.find(r=>r.id===id),face=record.frontages.find(f=>f.kind==='parking-rear-finish');assert.ok(face,id);
  assert.deepEqual(record.points,features.buildings.find(b=>b.id===id).points.slice(0,-1));
  assert.equal(face.road.id,null,'photo-facing reference must not invent an OSM road');assert.ok(face.distance<18);
  const a=record.points[face.edge],b=record.points[(face.edge+1)%record.points.length];assert.ok(Math.abs(a[2]-b[2])<.1);assert.ok((a[2]+b[2])/2>-88&&((a[2]+b[2])/2)<-85);
  assert.equal(colliders.filter(c=>c.args.at(-1)==='keihan_context_'+id.split('/')[1]).length,record.points.length,'finish adds no collider');
 }
 const owned=new THREE.Group(),owner=new THREE.Group();owner.userData.sourceIds=[...PARKING_REAR_FINISH_IDS];owned.add(owner);
 const other=buildKeihanStreetContext(owned,features,surfaces);assert.deepEqual(other.parkingRearFinish.ids,[],'another owner is not duplicated or modified');
 assert.equal(built.drawBatches,6);assert.ok(built.triangles<32000);
});

test('context cloth canopies slope toward the street without reducing head clearance',()=>{
 const {root,built}=fixture();
 const cloth=built.group.children.find(o=>o.material.vertexColors&&o.material.roughness===.97);
 assert.ok(cloth);
 for(const id of ['way/305213535','way/305213543','way/305214380']){
  const s=built.records.find(r=>r.id===id),face=s.frontages.find(f=>f.distance>1.4&&f.distance<8);
  const a=s.points[face.edge],b=s.points[(face.edge+1)%s.points.length],dx=b[0]-a[0],dz=b[2]-a[2],length=Math.hypot(dx,dz),t=[dx/length,dz/length],mid=[(a[0]+b[0])/2,(a[2]+b[2])/2];
  let n=[t[1],-t[0]];if((face.road.x-mid[0])*n[0]+(face.road.z-mid[1])*n[1]<0)n=n.map(v=>-v);
  const height=v=>{
   const ray=new THREE.Raycaster(new THREE.Vector3(mid[0]+n[0]*v,s.floor+3.2,mid[1]+n[1]*v),new THREE.Vector3(0,-1,0),0,1);
   const hit=ray.intersectObject(cloth)[0];assert.ok(hit,`${id} canopy at ${v}`);return hit.point.y-s.floor;
  };
  const back=height(.08),front=height(.48);
  assert.ok(back-front>.10,`${id} drops toward the street`);assert.ok(front>2.6);
 }
});

test('street-facing fronts have a grounded base beneath their display panels',()=>{
 const {root,built}=fixture();
 for(const id of ['way/305213535','way/305213543']){
  const s=built.records.find(r=>r.id===id),face=s.frontages.find(f=>f.distance>1.4&&f.distance<8);
  const a=s.points[face.edge],b=s.points[(face.edge+1)%s.points.length],dx=b[0]-a[0],dz=b[2]-a[2],length=Math.hypot(dx,dz),t=[dx/length,dz/length],mid=[(a[0]+b[0])/2,(a[2]+b[2])/2];
  let n=[t[1],-t[0]];if((face.road.x-mid[0])*n[0]+(face.road.z-mid[1])*n[1]<0)n=n.map(v=>-v);
  const ray=new THREE.Raycaster(new THREE.Vector3(mid[0]+n[0]*.35,s.floor+.06,mid[1]+n[1]*.35),new THREE.Vector3(-n[0],0,-n[1]),0,.5);
  const hit=ray.intersectObject(root,true)[0];assert.ok(hit);assert.equal(hit.object.material.color.getHexString(),'555d5b');
 }
});

test('context finishes consume non-enumerable shared surfaces without adding material batches',()=>{
 const timber={map:new THREE.Texture(),bumpMap:new THREE.Texture(),roughnessMap:new THREE.Texture()};
 const plaster={map:new THREE.Texture(),bumpMap:new THREE.Texture(),roughnessMap:new THREE.Texture()};
 const materials={};Object.defineProperty(materials,'architecturalSurfaceLibrary',{value:{getMaps:kind=>({timber,plaster})[kind]}});
 const built=buildKeihanStreetContext(new THREE.Group(),features,surfaces,materials);
 const wood=built.group.children.find(o=>o.material.map===timber.map);
 const wall=built.group.children.find(o=>o.material.bumpMap===plaster.bumpMap);
 assert.ok(wood&&wall);assert.equal(wood.material.bumpMap,timber.bumpMap);assert.equal(wall.material.roughnessMap,plaster.roughnessMap);
 assert.equal(built.drawBatches,6);assert.ok(built.triangles<32000);
 const p=wood.geometry.attributes.position,uv=wood.geometry.attributes.uv;let metric=false;
 for(let i=0;i<p.count;i+=3)for(let a=0;a<3;a++)for(let b=a+1;b<3;b++){
  const j=i+a,k=i+b,dy=p.getY(j)-p.getY(k);
  if(Math.abs(dy)>.2&&Math.abs(p.getX(j)-p.getX(k))<1e-4&&Math.abs(p.getZ(j)-p.getZ(k))<1e-4&&Math.abs(Math.abs(uv.getY(j)-uv.getY(k))-Math.abs(dy))<1e-3)metric=true;
 }
 assert.ok(metric,'vertical timber uses one UV unit per metre');
});
