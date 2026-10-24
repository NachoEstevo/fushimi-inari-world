import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import {buildShinsenjoNorthCourtR99,planShinsenjoNorthCourtR99} from './shinsenjo-north-court-r99.mjs';
import {mikoshikoLayout} from './mikoshiko-precinct.mjs';
import {TAMAGAKI_RUNS} from './sanctuary-context-r95.mjs';
import {pathWidth} from '../geography/geo-core.mjs';
import {clipConvex,polygonArea} from './entrance-area-surfaces-layout.mjs';
const features=JSON.parse(fs.readFileSync(new URL('../geography/features.json',import.meta.url)));
function terrain(height=()=>43.94){const out=[];for(let x=58;x<78;x++)for(let z=0;z<26;z++)for(const [dx,dz]of [[0,0],[0,1],[1,0],[1,0],[0,1],[1,1]])out.push(x+dx,height(x+dx,z+dz),z+dz);return out;}
function fixture(){
 const root=new THREE.Group(),well=new THREE.Group();well.name='Shinkosui mapped roofed well R96';well.position.set(62.133,43.982249,18.34);well.rotation.y=.009459929262933363;well.userData={built:true,width:3.59416082,depth:2.36006864,floor:43.982249};root.add(well);
 const p=mikoshikoLayout(features),miko=new THREE.Group();miko.name='Mikoshiko precinct R93';miko.position.set(...[p.center[0],44.122249,p.center[1]]);miko.rotation.y=p.yaw;miko.userData={built:true,courtBoundsLocal:[-p.width/2-1.05,-p.width/2,-p.depth/2,p.depth/2]};root.add(miko);
 const fence=new THREE.Group();fence.name='Honden open tamagaki R95';fence.matrixAutoUpdate=false;fence.matrix.makeTranslation(62.457,43.982249,-3.674).multiply(new THREE.Matrix4().makeRotationY(-1.5107963267948965)).multiply(new THREE.Matrix4().makeTranslation(0,-3.2,34));for(const [x,z,w,d]of TAMAGAKI_RUNS){const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,1.65,d),new THREE.MeshStandardMaterial());mesh.position.set(x,4.025,z);fence.add(mesh);}root.add(fence);
 const surfaces={height:()=>44.122249,terrainHeight:()=>43.982249,segments:features.paths.flatMap(p=>p.points.slice(1).map((b,i)=>({id:p.id,a:p.points[i],b,width:pathWidth(p.tags),ya:44.122249,yb:44.122249})))},materials={gravelMat:new THREE.MeshStandardMaterial({color:'#888777'})},colliders=[];return {root,well,miko,fence,surfaces,materials,colliders};
}
test('pure planner proves full clipped coverage first and builder preserves existing owners/terrain/walking',()=>{
 const f=fixture(),input=terrain(),before=input.slice(),height=f.surfaces.height,ground=f.surfaces.terrainHeight,children=f.root.children.length,material=f.materials.gravelMat;
 const plan=planShinsenjoNorthCourtR99(f.root,features,f.surfaces,f.colliders,{terrainPositions:input});assert.equal(plan.ready,true,JSON.stringify(plan.parts.map(({vertices,polygons,envelope,...p})=>p)));assert.equal(f.root.children.length,children);assert.ok(plan.parts.every(p=>p.accepted));
 const r=buildShinsenjoNorthCourtR99(f.root,features,f.surfaces,f.materials,f.colliders,{terrainPositions:input});assert.equal(r.built,true);assert.deepEqual(r.builtIds,[]);assert.ok(r.area>10);assert.equal(r.materialBatches,1);assert.equal(r.terrainChanged,false);assert.equal(r.walkingChanged,false);assert.equal(r.collidersAdded,0);assert.equal(f.colliders.length,0);assert.equal(f.surfaces.height,height);assert.equal(f.surfaces.terrainHeight,ground);assert.deepEqual(input,before);assert.equal(f.materials.gravelMat,material);assert.equal(buildShinsenjoNorthCourtR99(f.root,features,f.surfaces,f.materials,f.colliders,{terrainPositions:input}),r);
 const mesh=f.root.children.at(-1);assert.notEqual(mesh.material,material);const p=mesh.geometry.attributes.position;assert.equal(mesh.geometry.attributes.uv.count,p.count);for(let i=0;i<p.count;i++)assert.ok(Math.abs(p.getY(i)-43.952)<1e-5);
 for(let i=0;i<p.count;i+=3){const tri=[0,1,2].map(k=>[p.getX(i+k),p.getZ(i+k)]);for(const cut of plan.cuts)assert.ok(Math.abs(polygonArea(clipConvex(tri,cut)))<.0002);}
});
test('a hidden internal terrain crease rejects the whole original north portion, not arbitrary safe fragments',()=>{
 const f=fixture(),input=terrain((x,z)=>43.94+(x===68&&z===21?.30:0)),plan=planShinsenjoNorthCourtR99(f.root,features,f.surfaces,f.colliders,{terrainPositions:input}),north=plan.parts.find(p=>p.id==='well-to-north-face'),west=plan.parts.find(p=>p.id==='west-mikoshiko');assert.equal(north.accepted,false);assert.ok(north.relief>.29);assert.equal(north.vertices.length,0);assert.equal(west.accepted,true);
 const r=buildShinsenjoNorthCourtR99(f.root,features,f.surfaces,f.materials,f.colliders,{terrainPositions:input});assert.equal(r.parts.find(p=>p.id===north.id).accepted,false);assert.ok(Math.abs(r.area-west.area)<1e-8);
});
test('small relief cannot bypass the .10 slope gate',()=>{const f=fixture(),plan=planShinsenjoNorthCourtR99(f.root,features,f.surfaces,f.colliders,{terrainPositions:terrain((x,z)=>43.94+(x===68&&z===21?.09:0))}),north=plan.parts.find(p=>p.id==='well-to-north-face');assert.ok(north.relief<.18);assert.ok(north.maxSlope>.10);assert.equal(north.accepted,false);assert.equal(north.reason,'whole-portion-slope-exceeds-.10');});
test('no viable portions, missing owner, incomplete and duplicated coverage fail without allocating a mesh',()=>{
 for(const kind of ['slope','owner','incomplete','overlap']){const f=fixture();if(kind==='owner')f.well.removeFromParent();let input=kind==='slope'?terrain(x=>43.94+.12*(x-58)):terrain();if(kind==='incomplete')input=input.slice(0,18);if(kind==='overlap')input=input.concat(input);const n=f.root.children.length,r=buildShinsenjoNorthCourtR99(f.root,features,f.surfaces,f.materials,f.colliders,{terrainPositions:input});assert.equal(r.built,false,kind);assert.equal(f.root.children.length,n);assert.equal(f.colliders.length,0);}
});
test('existing ground paving and physical solids are independently excluded with actual owner geometry',()=>{
 const f=fixture(),paver=new THREE.Mesh(new THREE.PlaneGeometry(1,1).rotateX(-Math.PI/2),new THREE.MeshStandardMaterial());paver.position.set(68,43.982249,21);paver.name='Existing paved service landing';f.root.add(paver);f.colliders.push({type:'box',args:[71.5,15,.25,.25,0,43,45,'existing-court-post']});const plan=planShinsenjoNorthCourtR99(f.root,features,f.surfaces,f.colliders,{terrainPositions:terrain()});assert.equal(plan.ready,true);for(const part of plan.parts.filter(p=>p.accepted))for(const poly of part.polygons){assert.ok(Math.abs(polygonArea(clipConvex(poly,[[67.5,20.5],[68.5,20.5],[68.5,21.5],[67.5,21.5]])))<1e-6);assert.ok(Math.abs(polygonArea(clipConvex(poly,[[71.1,14.6],[71.9,14.6],[71.9,15.4],[71.1,15.4]])))<1e-6);}
});

test('post-batching empty tamagaki owner rejects explicitly before evaluating nonfinite bounds',()=>{const f=fixture();f.fence.clear();const n=f.root.children.length,r=buildShinsenjoNorthCourtR99(f.root,features,f.surfaces,f.materials,f.colliders,{terrainPositions:terrain()});assert.equal(r.built,false);assert.equal(r.reason,'registered-tamagaki-geometry-before-batching-required');assert.equal(f.root.children.length,n);});

import {shinsenjoNorthCourtTerrainDetailR99} from './shinsenjo-north-court-r99.mjs';
test('terrain resolution request follows the registered Mikoshiko court, not fixed world coordinates',()=>{const original=JSON.stringify(features),b=shinsenjoNorthCourtTerrainDetailR99(features);assert.equal(b.length,1);assert.ok(b[0][0]>72&&b[0][0]<73);assert.ok(b[0][3]>20&&b[0][3]<20.1);const missing={...features,buildings:features.buildings.filter(p=>p.id!=='way/305214828')};assert.deepEqual(shinsenjoNorthCourtTerrainDetailR99(missing),[]);assert.equal(JSON.stringify(features),original);});
