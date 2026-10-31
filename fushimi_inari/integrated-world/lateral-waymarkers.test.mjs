import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {readFileSync} from 'node:fs';
import {buildLateralWaymarkers,yotsutsujiMapDestinations} from './lateral-waymarkers.mjs';
const features=JSON.parse(readFileSync(new URL('../geography/features.json',import.meta.url)));
const materials={stoneMat:new THREE.MeshStandardMaterial()};
test('Kiyotaki marker retains its surveyed OSM owner and leaves mapped route clear',()=>{
 const root=new THREE.Group(),colliders=[],before=JSON.stringify(features);
 const r=buildLateralWaymarkers(root,features,{height:()=>139.46},materials,colliders);
 assert.equal(r.markers.length,3);assert.equal(r.markers[0].id,'node/11789242337');
 assert.deepEqual(r.markers[0].point,[1013.966,139.46,-284.087]);
 assert.equal(r.markers[0].pathId,'way/1269260660');assert.ok(r.markers[0].clearance>.6);
 assert.equal(colliders.length,3);assert.equal(JSON.stringify(features),before);
 assert.equal(buildLateralWaymarkers(root,features,{height:()=>0},materials,colliders),r);
 assert.equal(colliders.length,3);
});
test('missing mapped ownership or unsafe route clearance omits the marker',()=>{
 const marker=features.pois.find(p=>p.id==='node/11789242337');
 const p=marker.point,unsafe={...features,pois:[marker],paths:[{id:'way/1269260660',tags:{width:'2'},points:[[p[0]-2,p[1],p[2]],[p[0]+2,p[1],p[2]]]}]};
 for(const f of [{...features,pois:[]},unsafe]){
 const colliders=[],r=buildLateralWaymarkers(new THREE.Group(),f,{height:()=>0},materials,colliders);
 assert.equal(r.markers.length,0);assert.equal(colliders.length,0);
 }
});
test('source-owned Kandakara and Yotsutsuji landmarks accompany three continuous existing branches',()=>{
 const r=buildLateralWaymarkers(new THREE.Group(),features,{height:()=>0},materials,[]);
 assert.deepEqual(r.markers.map(m=>m.id),['node/11789242337','node/11780081678','node/9673171295']);
 assert.equal(r.connections.length,3);
 assert.ok(r.markers.every(m=>m.clearance>=.6));
 for(const c of r.connections){
  assert.ok(c.destination&&c.source.startsWith('https://'));
  const paths=c.pathIds.map(id=>features.paths.find(p=>p.id===id));assert.ok(paths.every(Boolean));
  for(let i=1;i<paths.length;i++)assert.ok(paths[i].nodeIds.some(n=>paths[i-1].nodeIds.includes(n)),c.id);
 }
});

test('junction map destinations refer to existing named mapped locations',()=>{
 const destinations=yotsutsujiMapDestinations(features);
 assert.deepEqual(destinations.map(d=>d.name),['熊鷹社','御膳谷奉拝所','一ノ峰','三ノ峰']);
 for(const d of destinations){
  const source=features.pois.find(p=>p.id===d.id);
  assert.equal(source.tags.name,d.name);assert.deepEqual(source.point,d.point);
 }
 assert.deepEqual(yotsutsujiMapDestinations({...features,pois:[]}),[]);
});
