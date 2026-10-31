import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import {buildNorthCourtBuildings} from './north-court-buildings.mjs';
import {northCourtLowFrontEdges} from './north-court-low-front.mjs';
const features=JSON.parse(fs.readFileSync(new URL('../geography/features.json',import.meta.url)));
const id='way/305214355',feature=features.buildings.find(b=>b.id===id);
test('low north-court frontage follows two mapped edges without bridging setback',()=>{
 const a=[-1.697,-29.722],b=[13.009,-30.891],dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz),ux=dx/length,uz=dz/length;
 const local=p=>[(p[0]-a[0])*ux+(p[2]-a[1])*uz,(p[0]-a[0])*uz-(p[2]-a[1])*ux];
 const edges=northCourtLowFrontEdges(feature.points.slice(0,-1),local);
 assert.equal(edges.length,2);assert.ok(Math.abs(edges[0].v-edges[1].v)>1.5);assert.ok(edges.every(e=>e.u1-e.u0>4));
});
test('existing mapped owner gets batched awnings above circulation with unchanged edge colliders',()=>{
 const root=new THREE.Group(),colliders=[],stone=new THREE.MeshStandardMaterial();
 const groups=buildNorthCourtBuildings(root,{buildings:[feature]},{height:()=>42}, {entryStoneMat:stone},colliders);
 assert.equal(groups.length,1);const group=groups[0];assert.equal(group.userData.sourceFeature,id);assert.equal(group.userData.lowFrontEdges.length,2);
 assert.equal(colliders.length,feature.points.length-1);assert.ok(colliders.every(c=>c.args.at(-1)==='north_court_305214355'));
 const awning=group.children.find(m=>m.material.color?.getHexString()==='28634c');assert.ok(awning);awning.geometry.computeBoundingBox();
 assert.ok(awning.geometry.boundingBox.min.y>2.15);assert.ok(group.children.length<=5);
});

test('all mapped timber owners share one generated grain texture with finite UVs',()=>{
 const root=new THREE.Group(),stone=new THREE.MeshStandardMaterial(),groups=buildNorthCourtBuildings(root,features,{height:()=>42},{entryStoneMat:stone},[]);
 assert.equal(groups.length,3);const owners=[];
 for(const group of groups){
  const mesh=group.children.find(m=>m.material.map?.name==='North court fine weathered timber');assert.ok(mesh);owners.push(mesh.material.map);
  const uv=mesh.geometry.attributes.uv;assert.ok(uv);for(const n of uv.array)assert.ok(Number.isFinite(n));
 }
 assert.equal(new Set(owners).size,1);assert.equal(owners[0].image.width,128);assert.equal(owners[0].image.height,128);assert.ok(owners[0].isDataTexture);
 const lower=groups.find(g=>g.userData.sourceFeature===id),awning=lower.children.find(m=>m.material.color?.getHexString()==='28634c');awning.geometry.computeBoundingBox();assert.ok(awning.geometry.boundingBox.min.y>2.15);
});
