import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import {createSuehiroyaSummit} from './suehiroya-summit.mjs';
const buildings=JSON.parse(fs.readFileSync(new URL('../geography/features.json',import.meta.url))).buildings;
const source=buildings.find(b=>b.id==='way/626313732'),ring=source.points.slice(0,-1);
function fixture(){const texture=new THREE.Texture(),materials={vermilionMat:new THREE.MeshStandardMaterial({normalMap:texture}),plasterMat:new THREE.MeshStandardMaterial({normalMap:texture}),flagstoneMat:new THREE.MeshStandardMaterial({map:texture,normalMap:texture}),roofMat:new THREE.MeshStandardMaterial({roughnessMap:texture})};return {texture,materials};}
const inside=(x,z)=>{let yes=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const a=ring[i],b=ring[j];if((a[2]>z)!==(b[2]>z)&&x<(b[0]-a[0])*(z-a[2])/(b[2]-a[2])+a[0])yes=!yes;}return yes;};
test('Suehiro-ya owns only its exact sourced footprint and faces Ichinomine with a single-storey frontage',()=>{
 const f=fixture(),before=JSON.stringify(source),result=createSuehiroyaSummit({buildings,ground:()=>229,walkHeight:()=>231,materials:f.materials});
 assert.deepEqual([...result.builtIds],['way/626313732']);assert.equal(result.stats.floor,231);assert.equal(result.stats.storeys,1);assert.equal(result.stats.front.edge,0);
 assert.ok(Math.abs(result.stats.roofMax-231-4.45)<1e-6&&result.stats.roofMin-231>=2.8);assert.ok(result.stats.batches<=8);
 assert.equal(result.stats.extraLights,0);assert.equal(result.stats.skylights,3);assert.ok(result.stats.roofFrontRun<=8.1);assert.equal(result.stats.references.length,2);assert.equal(JSON.stringify(source),before);
 const roof=result.group.getObjectByName('Suehiro-ya pitched metal roof');assert.ok(roof);
 const p=roof.geometry.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i);assert.ok(inside(x,z)||ring.some((q,j)=>{const b=ring[(j+1)%ring.length],dx=b[0]-q[0],dz=b[2]-q[2],t=Math.max(0,Math.min(1,((x-q[0])*dx+(z-q[2])*dz)/(dx*dx+dz*dz)));return Math.hypot(x-q[0]-dx*t,z-q[2]-dz*t)<.0003;}),'roof never extends beyond mapped roof boundary');}
 assert.ok(result.stats.front.outward[1]<-.99,'front faces the shrine on the lower-Z side');
 result.dispose();f.texture.dispose();Object.values(f.materials).forEach(m=>m.dispose());
});
test('borrowed maps survive idempotent cleanup and all finishes remain in bounded shared batches',()=>{
 const f=fixture(),result=createSuehiroyaSummit({buildings,ground:()=>229,walkHeight:()=>231,materials:f.materials});
 const meshes=[];result.group.traverse(o=>{if(o.isMesh)meshes.push(o);});assert.equal(meshes.length,result.stats.batches);
 let disposedMaterials=0,disposedGeometries=0,disposedSource=0;
 const materials=new Set(meshes.map(m=>m.material));for(const material of materials)material.addEventListener('dispose',()=>disposedMaterials++);
 for(const mesh of meshes)mesh.geometry.addEventListener('dispose',()=>disposedGeometries++);
 for(const source of [f.texture,...Object.values(f.materials)])source.addEventListener('dispose',()=>disposedSource++);
 result.dispose();result.dispose();assert.equal(disposedMaterials,materials.size);assert.equal(disposedGeometries,meshes.length);assert.equal(disposedSource,0);
});
test('missing identity or canonical walking support fails closed without claiming another building',()=>{
 for(const options of [{buildings:[],walkHeight:()=>231},{buildings,walkHeight:()=>NaN}]){
  const result=createSuehiroyaSummit({...options,ground:()=>229,materials:{}});assert.equal(result.builtIds.size,0);assert.equal(result.group.children.length,0);result.dispose();
 }
});
