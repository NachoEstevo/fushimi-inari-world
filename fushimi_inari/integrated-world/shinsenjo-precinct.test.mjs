import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import {SHINSENJO_ID,shinsenjoLayout,buildShinsenjoPrecinct} from './shinsenjo-precinct.mjs';
import {clipConvex,polygonArea} from './entrance-area-surfaces-layout.mjs';
import {heightAt} from '../geography/geo-core.mjs';
const features=JSON.parse(fs.readFileSync(new URL('../geography/features.json',import.meta.url)));
test('Shinsenjo retains irregular mapped returns without source mutation',()=>{
 const before=JSON.stringify(features),plan=shinsenjoLayout(features);assert.equal(plan.id,SHINSENJO_ID);assert.equal(plan.ring.length,14);assert.deepEqual(plan.ring[0],[82.047,21.674]);assert.match(plan.accuracy,/estimated/);assert.equal(JSON.stringify(features),before);
});
test('closed service shell has finite geometry, terrain support and idempotence',()=>{
 const root=new THREE.Group(),c=[];const r=buildShinsenjoPrecinct(root,{},features,{height:()=>49},c,{terrainPositions:[60,45,20,92,47,20,75,46,43]});assert.equal(r.built,true);assert.equal(r.foundationBottom,44.96);assert.equal(c.length,14);assert.ok(r.triangles<5000);root.updateMatrixWorld(true);assert.ok(Math.abs(new THREE.Box3().setFromObject(root).min.y-44.96)<.001);root.traverse(o=>{if(o.isMesh)for(const n of o.geometry.attributes.position.array)assert.ok(Number.isFinite(n));});assert.equal(buildShinsenjoPrecinct(root,{},features,{height:()=>0},c),r);assert.equal(c.length,14);
});
test('missing footprint or invalid support builds nothing',()=>{
 for(const [f,h] of [[{buildings:[]},49],[features,NaN]]){const root=new THREE.Group(),c=[];assert.equal(buildShinsenjoPrecinct(root,{},f,{height:()=>h},c).built,false);assert.equal(root.children.length,0);assert.equal(c.length,0);}
});
test('actual site DEM cuts only mapped interior and preserves retained terrain planes',()=>{
 const terrain=JSON.parse(fs.readFileSync(new URL('../geography/terrain.json',import.meta.url))),input=[];
 for(let z=19;z<45;z++)for(let x=59;x<94;x++)for(const tri of [[[x,z],[x,z+1],[x+1,z]],[[x+1,z],[x,z+1],[x+1,z+1]]])for(const [xx,zz]of tri)input.push(xx,heightAt(terrain,xx,zz)-.06,zz);
 const root=new THREE.Group(),record=buildShinsenjoPrecinct(root,{},features,{height:()=>44.12},[],{terrainPositions:input}),output=record.clipTerrain(input),ring=record.ring,cuts=THREE.ShapeUtils.triangulateShape(ring.map(q=>new THREE.Vector2(...q)),[]).map(f=>f.map(i=>ring[i]));
 let retained=0;for(let i=0;i<output.length;i+=9){const tri=[0,3,6].map(j=>[output[i+j],output[i+j+2]]);retained+=Math.abs(polygonArea(tri));for(const cut of cuts)assert.ok(Math.abs(polygonArea(clipConvex(tri,cut)))<1e-7);}
 assert.ok(Math.abs(retained-(35*26-Math.abs(polygonArea(ring))))<1e-6);
 // An unchanged triangle outside the compound remains byte-for-byte present.
 assert.deepEqual(output.slice(0,9),input.slice(0,9));assert.throws(()=>record.clipTerrain([NaN]),/finite triangle/);
});
test('every foundation wall is visible from outside and floor faces upward',()=>{
 const root=new THREE.Group(),r=buildShinsenjoPrecinct(root,{},features,{height:()=>49},[],{terrainPositions:[60,45,20,92,47,20,75,46,43]});root.updateMatrixWorld(true);
 const sign=Math.sign(polygonArea(r.ring));
 for(let i=0;i<r.ring.length;i++){
  const a=r.ring[i],b=r.ring[(i+1)%r.ring.length],dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz),nx=sign*dz/len,nz=-sign*dx/len,x=(a[0]+b[0])/2,z=(a[1]+b[1])/2;
  const ray=new THREE.Raycaster(new THREE.Vector3(x+nx*.2,48.9,z+nz*.2),new THREE.Vector3(-nx,0,-nz),0,.3),hits=ray.intersectObject(root,true);assert.ok(hits.length>0,`foundation edge ${i} invisible from outside`);assert.ok(Math.abs(hits[0].distance-.2)<1e-5);
 }
 const top=new THREE.Raycaster(new THREE.Vector3(69,49.4,27),new THREE.Vector3(0,-1,0),0,.2).intersectObject(root,true);assert.ok(top.length>0);assert.ok(Math.abs(top[0].point.y-49.27)<1e-5);
});
