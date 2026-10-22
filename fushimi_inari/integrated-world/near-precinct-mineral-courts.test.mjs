import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import {makeSpatial} from './spatial.mjs';
import {makePathSurfaces} from './path-surfaces.mjs';
import {buildNearPrecinctMineralCourts,nearPrecinctCourtEnvelopes} from './near-precinct-mineral-courts.mjs';
import {shrineCourtPlan,surface} from './precinct-shrine-courts.mjs';
import {tamayamaForecourtPlan} from './tamayama-forecourt-layout.mjs';
import {clipConvex,polygonArea} from './entrance-area-surfaces-layout.mjs';

test('actual mapped public aprons are contiguous bounded mineral areas with exact existing surface exclusions',()=>{
 const read=p=>JSON.parse(fs.readFileSync(new URL(p,import.meta.url)));
 const features=read('../geography/features.json'),terrain=read('../geography/terrain.json'),spatial=makeSpatial(terrain,features,read('./anchors.json'));
 const root=new THREE.Group(),occupied=[];
 for(const zone of ['tamayama','okumiya']){
  const a=spatial.byId[zone],g=new THREE.Group();g.position.fromArray(a.target);g.rotation.y=zone==='tamayama'?-Math.PI/2:a.yaw+Math.PI/2;
  g.userData={zone,...(zone==='tamayama'?{tamayamaDetail:{}}:{okumiyaDetail:{}})};root.add(g);g.updateWorldMatrix(true,false);
  occupied.push(zone==='tamayama'?tamayamaForecourtPlan(g.matrixWorld.elements).envelope:shrineCourtPlan(zone,g.matrixWorld.elements).envelope);
 }
 const network=makePathSurfaces(features,(x,z)=>50+.002*x+.001*z*z),before=JSON.stringify(network.segments),walking=network.height,ground=network.terrainHeight;
 const result=buildNearPrecinctMineralCourts(root,features,network,{gravelMat:new THREE.MeshStandardMaterial()});
 assert.equal(result.records.length,3);for(const r of result.records)assert.ok(r.area>25&&r.area<250,`${r.id} ${r.area}`);
 for(const mesh of root.getObjectByName('Near precinct continuous mineral aprons R77').children){
  const p=mesh.geometry.attributes.position;
  for(let i=0;i<p.count;i++)assert.ok(Math.abs(p.getY(i)-ground(p.getX(i),p.getZ(i))-.012)<1e-5);
  for(let i=0;i<p.count;i+=3){const tri=Array.from({length:3},(_,j)=>[p.getX(i+j),p.getZ(i+j)]);assert.ok(polygonArea(tri)<0);for(const cut of occupied)assert.ok(Math.abs(polygonArea(clipConvex(tri,cut)))<1e-5);}
 }
 assert.equal(network.height,walking);assert.equal(network.terrainHeight,ground);assert.equal(JSON.stringify(network.segments),before);
 assert.equal(buildNearPrecinctMineralCourts(root,features,network,{gravelMat:new THREE.MeshStandardMaterial()}),result);
 const extents=nearPrecinctCourtEnvelopes(features);assert.ok(extents.filter(e=>!e.id.startsWith('Gonden')).every(e=>e.envelope.every(p=>p[0]>95&&p[0]<131&&p[1]>-39&&p[1]<-7)));
 const upper=extents.find(e=>e.id.startsWith('Okumiya')),landing=features.paths.find(p=>p.id==='way/1392716577');
 assert.equal(Math.min(...upper.envelope.map(p=>p[0])),landing.points.at(-1)[0],'upper court cannot extend west onto lower approach skirt');
});

test('missing mapped context declines inference',()=>{assert.deepEqual(nearPrecinctCourtEnvelopes({}),[]);});

test('mineral apron never drapes abrupt landing skirt or steep diagonal bank',()=>{
 const network={terrainHeight:(x,z)=>x<1?50+.1*z:x<1.5?50+(x-1)*8+.1*z:54+.3*x+.3*z};
 const mesh=surface([[[0,0],[3,0],[3,3],[0,3]]],network,new THREE.MeshStandardMaterial(),'regression',{maxSlope:.35});
 const p=mesh.geometry.attributes.position;assert.ok(p.count>30);
 for(let i=0;i<p.count;i+=3){
  const a=new THREE.Vector3().fromBufferAttribute(p,i),b=new THREE.Vector3().fromBufferAttribute(p,i+1),c=new THREE.Vector3().fromBufferAttribute(p,i+2);
  const n=b.clone().sub(a).cross(c.clone().sub(a));assert.ok(Math.hypot(n.x,n.z)/Math.abs(n.y)<=.3501);
  assert.ok(Math.max(a.x,b.x,c.x)<=1,'steep skirt and diagonal bank both excluded');
 }
});

test('Gonden gravel stays between mapped roof edges and below the stair landing',()=>{
 const features=JSON.parse(fs.readFileSync(new URL('../geography/features.json',import.meta.url)));
 const court=nearPrecinctCourtEnvelopes(features).find(p=>p.id.startsWith('Gonden'));
 const office=features.buildings.find(b=>b.id==='way/105449708'),gonden=features.buildings.find(b=>b.id==='way/305214371');
 assert.equal(Math.min(...court.envelope.map(p=>p[0])),Math.max(...office.points.map(p=>p[0])));
 assert.equal(Math.max(...court.envelope.map(p=>p[0])),Math.min(...gonden.points.map(p=>p[0])));
 assert.ok(court.envelope.every(p=>p[1]>-31),'do not coat the lower stair landing');
 const network={segments:[{id:'way/105449728',a:[53,50,-21],b:[69,50,-21],width:2}],terrainHeight:()=>50};
 const root=new THREE.Group();buildNearPrecinctMineralCourts(root,features,network,{gravelMat:new THREE.MeshStandardMaterial()});
 const mesh=root.getObjectByName('Gonden office-side mineral court'),p=mesh.geometry.attributes.position;
 for(let i=0;i<p.count;i+=3){const z=(p.getZ(i)+p.getZ(i+1)+p.getZ(i+2))/3;assert.ok(Math.abs(z+21)>=1.94999,'gravel must not cover the authored 3.6m stone apron');}
});
