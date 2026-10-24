import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from 'three';
import {heightAt} from '../geography/geo-core.mjs';
import {makePathSurfaces} from './path-surfaces.mjs';
import {buildKeihanFrontages} from './keihan-frontages.mjs';
import {buildKeihanStreetObservedDetails} from './keihan-street-observed-details.mjs';
const features=JSON.parse(readFileSync(new URL('../geography/features.json',import.meta.url))),terrain=JSON.parse(readFileSync(new URL('../geography/terrain.json',import.meta.url)));
function fixture(){const root=new THREE.Group(),colliders=[],surfaces=makePathSurfaces(features,(x,z)=>heightAt(terrain,x,z)),front=buildKeihanFrontages(root,features,surfaces,{},colliders),walkHeight=(x,z)=>front.surfaceHeight(x,z)??surfaces.height(x,z);return {root,colliders,surfaces,keihanFrontages:front,walkHeight};}

test('four photographed detail families are source registered, bounded and idempotent',()=>{
 const a=fixture(),before=[...a.colliders],height=a.walkHeight,r=buildKeihanStreetObservedDetails(a);
 assert.equal(r.built,true);assert.equal(r.stats.covers,6);assert.equal(r.stats.grates,12);assert.equal(r.stats.cableSpans,1);assert.equal(r.stats.panels,1);
 assert.equal(r.stats.groups,5);assert.ok(r.stats.drawBatches<=9);assert.ok(r.stats.triangles<2500,JSON.stringify(r.stats));
 assert.deepEqual(a.colliders,before);assert.equal(a.walkHeight,height);assert.equal(r.surfaceHeight,undefined);
 assert.equal(buildKeihanStreetObservedDetails(a),r);assert.equal(a.root.children.filter(g=>g.name===r.group.name).length,1);
 let lights=0;r.group.traverse(o=>{if(o.isLight)lights++;if(o.isMesh)assert.ok([...o.geometry.attributes.position.array].every(Number.isFinite));});assert.equal(lights,0);
 assert.ok(r.records.every(rec=>rec.reference.includes('2024')||rec.reference.includes('2020')));
});

test('surface decorations follow the assembled floor per vertex, face upward and add no step',()=>{
 const a=fixture(),r=buildKeihanStreetObservedDetails(a);a.root.updateMatrixWorld(true);
 for(const group of r.detailGroups.filter(g=>g.name.includes('service covers')))group.traverse(mesh=>{
  if(!mesh.isMesh)return;const p=mesh.geometry.attributes.position,n=mesh.geometry.attributes.normal;
  for(let i=0;i<p.count;i++){const v=new THREE.Vector3().fromBufferAttribute(p,i).applyMatrix4(mesh.matrixWorld),gap=v.y-a.walkHeight(v.x,v.z);assert.ok(gap>.0079&&gap<.0091,`${group.name}: gap ${gap}`);assert.ok(n.getY(i)>.9,`${group.name}: upward normal`);}
 });
});

test('grates occupy the outer gutter band and covers stay on mapped street surfaces',()=>{
 const a=fixture(),r=buildKeihanStreetObservedDetails(a);
 for(const record of r.records.filter(r=>r.kind==='gutter-grate'||r.kind==='round-service-cover')){
  const [x,y,z]=record.position,segments=a.surfaces.segments.filter(s=>s.id===record.sourceId);let best=Infinity,width=0;
  for(const s of segments){const dx=s.b[0]-s.a[0],dz=s.b[2]-s.a[2],t=Math.max(0,Math.min(1,((x-s.a[0])*dx+(z-s.a[2])*dz)/(dx*dx+dz*dz))),d=Math.hypot(x-s.a[0]-dx*t,z-s.a[2]-dz*t);if(d<best){best=d;width=s.width;}}
  assert.equal(y,a.walkHeight(x,z));assert.ok(best<width/2);
  if(record.kind==='gutter-grate'){assert.ok(best>width/2-.20);assert.ok(record.width/2+best<width/2);}
 }
});

test('service cables attach to existing food-store elevations and remain above head clearance',()=>{
 const a=fixture(),r=buildKeihanStreetObservedDetails(a),cable=r.records.find(r=>r.kind==='overhead-service-cables');
 assert.deepEqual(cable.sourceIds,['way/305213538','way/305213554']);assert.ok(cable.clearanceAboveFloors>4);
 const meshGroup=r.detailGroups.find(g=>g.name==='Observed shop service cables');a.root.updateMatrixWorld(true);
 for(const mesh of meshGroup.children){const p=mesh.geometry.attributes.position;for(let i=0;i<p.count;i++){const point=new THREE.Vector3().fromBufferAttribute(p,i).applyMatrix4(mesh.matrixWorld);assert.ok(point.y-a.walkHeight(point.x,point.z)>4);}}
 const missing=fixture();missing.keihanFrontages.storefronts=missing.keihanFrontages.storefronts.filter(s=>s.id!=='way/305213538');assert.equal(buildKeihanStreetObservedDetails(missing).stats.cableSpans,0);
});

test('missing or malformed street ownership fails before scene mutation',()=>{
 for(const change of [a=>delete a.walkHeight,a=>a.surfaces.segments=[],a=>a.surfaces.segments=a.surfaces.segments.map(s=>({...s,width:NaN}))]){
  const a=fixture();change(a);const before=a.root.children.length,colliders=a.colliders.length,r=buildKeihanStreetObservedDetails(a);assert.equal(r.built,false);assert.equal(a.root.children.length,before);assert.equal(a.colliders.length,colliders);
 }
});
