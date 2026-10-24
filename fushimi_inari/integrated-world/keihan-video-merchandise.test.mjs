import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from 'three';
import {heightAt} from '../geography/geo-core.mjs';
import {makePathSurfaces} from './path-surfaces.mjs';
import {buildKeihanUrasando,videoOpenBays} from './keihan-urasando.mjs';
import {buildKeihanVideoMerchandise,planKeihanVideoMerchandise} from './keihan-video-merchandise.mjs';

const features=JSON.parse(readFileSync(new URL('../geography/features.json',import.meta.url))),terrain=JSON.parse(readFileSync(new URL('../geography/terrain.json',import.meta.url)));
const setup=()=>{const root=new THREE.Group(),colliders=[],surfaces=makePathSurfaces(features,(x,z)=>heightAt(terrain,x,z)),keihanUrasando=buildKeihanUrasando(root,features,surfaces,{},colliders);return {root,colliders,keihanUrasando,walkHeight:(x,z)=>keihanUrasando.surfaceHeight(x,z)??surfaces.height(x,z)};};

test('merchandise uses only registered visually open bays and preserves parcel identity',()=>{
 const assembly=setup(),plan=planKeihanVideoMerchandise(assembly);assert.equal(plan.length,4);
 for(const p of plan){assert.ok(videoOpenBays[p.id].includes(p.bay));assert.equal(p.floor,p.source.floor);assert.deepEqual(p.source.points,features.buildings.find(b=>b.id===p.id).points.slice(0,-1));assert.ok(p.u-p.width/2>.13&&p.u+p.width/2<p.source.width-.13);assert.equal(p.name,undefined);}
 const r=buildKeihanVideoMerchandise(assembly);assert.equal(r.built,true);assert.equal(r.stats.inferred,true);
});

test('all geometry stays inside shallow recess, under noren and off the walking corridor',()=>{
 const assembly=setup(),r=buildKeihanVideoMerchandise(assembly),plan=planKeihanVideoMerchandise(assembly);
 r.group.updateMatrixWorld(true);
 const inside=(x,z,points)=>{let yes=false;for(let i=0,j=points.length-1;i<points.length;j=i++){const a=points[i],b=points[j];if((a[2]>z)!==(b[2]>z)&&x<(b[0]-a[0])*(z-a[2])/(b[2]-a[2])+a[0])yes=!yes;}return yes;};
 for(let i=0;i<r.detailGroups.length;i++){
  const g=r.detailGroups[i],p=plan[i],bounds=new THREE.Box3();for(const mesh of g.children){mesh.geometry.computeBoundingBox();bounds.union(mesh.geometry.boundingBox);}
  assert.ok(bounds.min.z>=.13-1e-6&&bounds.max.z<=.79,'inside property/backing '+g.name);
  assert.ok(bounds.min.y>=-1e-7&&bounds.max.y<2,'supported and below noren '+g.name);
  assert.ok(bounds.min.x>=-p.bayWidth/2+.13&&bounds.max.x<=p.bayWidth/2-.13,'post clearance '+g.name);
  assert.equal(g.position.y,p.source.floor);
  for(const mesh of g.children){const vertices=mesh.geometry.attributes.position;for(let v=0;v<vertices.count;v++){const point=new THREE.Vector3().fromBufferAttribute(vertices,v).applyMatrix4(mesh.matrixWorld);assert.ok(inside(point.x,point.z,p.source.points),'vertex left mapped parcel '+g.name);}}
 }
});

test('static shared batches stay bounded, and re-entry never duplicates or changes colliders',()=>{
 const assembly=setup(),before=JSON.stringify(assembly.colliders),r=buildKeihanVideoMerchandise(assembly);assert.ok(r.stats.triangles<=5000,JSON.stringify(r.stats));assert.ok(r.stats.drawBatches<=14);assert.equal(r.stats.textures,1);
 let lights=0;const maps=new Set();r.group.traverse(o=>{if(o.isLight)lights++;if(o.isMesh){if(o.material.map)maps.add(o.material.map);for(const v of o.geometry.attributes.position.array)assert.ok(Number.isFinite(v));}});
 assert.equal(lights,0);assert.equal(maps.size,1);assert.equal(buildKeihanVideoMerchandise(assembly),r);assert.equal(JSON.stringify(assembly.colliders),before);assert.ok(r.detailGroups.every(g=>g.userData.detailRadius===28));
});

test('fox eye pigment is in front of the convex mask and readable from the street',()=>{
 const r=buildKeihanVideoMerchandise(setup()),rack=r.detailGroups.find(g=>g.userData.kind==='souvenirs'),mesh=rack.children.find(m=>m.material.vertexColors);
 // Local ray at the centre mask's right eye: first visible colored triangle
 // must be dark pigment, not the cream sphere that used to wash out the face.
 mesh.updateMatrixWorld(true);
 const origin=new THREE.Vector3(.044,1.251,0).applyMatrix4(mesh.matrixWorld),direction=new THREE.Vector3(0,0,1).transformDirection(mesh.matrixWorld);
 const hit=new THREE.Raycaster(origin,direction,0,1).intersectObject(mesh)[0];assert.ok(hit);
 const color=mesh.geometry.attributes.color;assert.ok(color.getX(hit.face.a)<.05&&color.getY(hit.face.a)<.05,'eye pigment must be the first visible surface');
});

test('missing owners or unsupported bays fail closed without manufacturing a location',()=>{
 const root=new THREE.Group();assert.equal(buildKeihanVideoMerchandise({root,walkHeight:()=>0}).built,false);assert.equal(root.children.length,0);
 const assembly=setup();assembly.keihanUrasando.frontages=assembly.keihanUrasando.frontages.filter(s=>s.kind==='sando-chaya');assert.deepEqual(planKeihanVideoMerchandise(assembly),[]);assert.equal(buildKeihanVideoMerchandise(assembly).built,false);
});
