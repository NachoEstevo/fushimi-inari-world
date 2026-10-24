import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from 'three';
import {heightAt} from '../geography/geo-core.mjs';
import {makePathSurfaces} from './path-surfaces.mjs';
import {yotsuGrade,yotsuForecourt} from './site-grading.mjs';
import {buildYotsutsuji} from './yotsutsuji.mjs';
import {yotsutsujiWestStairCutout,yotsutsujiCourtPieces,yotsutsujiCourtEdgeIntervals} from './yotsutsuji-court-clearance.mjs';
import {polygonArea,clipConvex} from './entrance-area-surfaces-layout.mjs';
const features=JSON.parse(readFileSync(new URL('../geography/features.json',import.meta.url))),terrain=JSON.parse(readFileSync(new URL('../geography/terrain.json',import.meta.url)));
const ground=(x,z)=>x>790&&x<808&&z>-226&&z<-207?yotsuGrade(x,z,heightAt(terrain,x,z)):heightAt(terrain,x,z);
const network=makePathSurfaces(features,ground);
function fixture(surfaces=network){
 const root=new THREE.Group(),colliders=[],m=new THREE.MeshStandardMaterial(),legacy={materials:Object.fromEntries(['vermilionMat','roofMat','plasterMat','stoneMat','entryStoneMat','flagstoneMat','blackNemakiMat'].map(k=>[k,m])),torii:{fresh:m,weathered:m,geometry:new THREE.BoxGeometry(.01,.01,.01),blackGeometry:new THREE.BoxGeometry(.01,.01,.01)}};
 buildYotsutsuji(root,legacy,features,ground,colliders,surfaces);root.updateMatrixWorld(true);return {root,colliders,plaza:root.getObjectByName('Yotsutsuji forecourt outside west stair'),support:root.getObjectByName('Yotsutsuji existing court and tread underside R95')};
}
test('actual west-stair witnesses no longer have the forecourt overhead or a masonry curtain across the mouth',()=>{
 const before=JSON.stringify(network.segments),fixed=fixture(),old=fixture({...network,segments:network.segments.filter(s=>s.id!=='way/1052553397')});
 for(const p of [[792.225304,162.099014,-212.091496],[795.7006,163.539358,-212.5234]]){
  const ray=new THREE.Raycaster(new THREE.Vector3(p[0],p[1]+.02,p[2]),new THREE.Vector3(0,1,0),0,2);
  assert.ok(ray.intersectObject(old.plaza).length,'witness must reproduce original slab');assert.equal(ray.intersectObject(fixed.plaza).length,0);
 }
 const lateral=new THREE.Raycaster(new THREE.Vector3(791.5,163.4,-212.1),new THREE.Vector3(1,0,0),0,.8);
 assert.ok(lateral.intersectObject(old.support).length);assert.equal(lateral.intersectObject(fixed.support).length,0);
 for(const s of network.segments.filter(s=>s.id==='way/1052553397'))for(const t of [.1,.5,.9])for(const side of [-.95,0,.95]){
  const dx=s.b[0]-s.a[0],dz=s.b[2]-s.a[2],len=Math.hypot(dx,dz),x=s.a[0]+dx*t-dz/len*side,z=s.a[2]+dz*t+dx/len*side;
  assert.equal(new THREE.Raycaster(new THREE.Vector3(x,s.ya+.02,z),new THREE.Vector3(0,1,0),0,2).intersectObject(fixed.plaza).length,0);
 }
 assert.deepEqual(fixed.colliders,old.colliders);assert.equal(JSON.stringify(network.segments),before);
 const keep=new THREE.Raycaster(new THREE.Vector3(799,170,-217),new THREE.Vector3(0,-1,0));assert.ok(Math.abs(keep.intersectObject(fixed.plaza)[0].point.y-keep.intersectObject(old.plaza)[0].point.y)<1e-5);
});
test('only the registered west stair and its existing curb skin subtract from the court',()=>{
 const mask=yotsutsujiWestStairCutout(network),pieces=yotsutsujiCourtPieces(yotsuForecourt,mask),area=p=>Math.abs(polygonArea(p));
 assert.ok(mask);assert.ok(Math.abs(pieces.reduce((s,p)=>s+area(p),0)-(area(yotsuForecourt)-area(clipConvex(yotsuForecourt,mask))))<1e-7);
 for(const p of pieces)assert.ok(area(clipConvex(p,mask))<1e-7);
 assert.equal(yotsutsujiWestStairCutout({segments:[]}),null);
 assert.equal(yotsutsujiWestStairCutout({segments:network.segments.map(s=>s.id==='way/1052553397'?{...s,a:[s.a[0]+10,s.a[1],s.a[2]]}:s)}),null);
 assert.deepEqual(yotsutsujiCourtPieces(yotsuForecourt,null),[yotsuForecourt]);
 assert.deepEqual(yotsutsujiCourtEdgeIntervals([792,-220.7],[806,-220.7],mask),[[0,1]]);
});
