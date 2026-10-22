import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import {heightAt} from '../geography/geo-core.mjs';
import {yotsuGrade,yotsuForecourt} from './site-grading.mjs';
import {yotsutsujiRetainingPlan,buildYotsutsujiRetaining,retainingBuilding} from './yotsutsuji-retaining.mjs';
import {buildYotsutsuji} from './yotsutsuji.mjs';
const features=JSON.parse(fs.readFileSync(new URL('../geography/features.json',import.meta.url))),terrain=JSON.parse(fs.readFileSync(new URL('../geography/terrain.json',import.meta.url)));
const ground=(x,z)=>yotsuGrade(x,z,heightAt(terrain,x,z));
const inside=(points,x,z)=>{let yes=false;for(let i=0,j=points.length-1;i<points.length;j=i++){const a=points[i],b=points[j];if((a[2]>z)!==(b[2]>z)&&x<(b[0]-a[0])*(z-a[2])/(b[2]-a[2])+a[0])yes=!yes;}return yes;};
function materials(){return Object.fromEntries(['vermilionMat','roofMat','plasterMat','stoneMat','entryStoneMat','flagstoneMat','blackNemakiMat'].map(k=>[k,new THREE.MeshStandardMaterial({color:'#808477'})]));}
test('registered annex edge uses existing terrain and remains on building side of mapped west stair',()=>{
  const before=JSON.stringify(features),p=yotsutsujiRetainingPlan(features,ground);assert.equal(p.building,retainingBuilding);assert.equal(p.edge,5);assert.ok(p.length>8&&p.length<8.01);
  assert.ok(p.sections.every(s=>s.bottom<=ground(...p.world(s.u,.1))-.17));
  const group=new THREE.Group(),stats=buildYotsutsujiRetaining(group,p,materials().stoneMat);assert.ok(stats.stones>20&&stats.batches<=4&&stats.triangles<2000);
  const polygon=features.buildings.find(b=>b.id===retainingBuilding).points;
  for(const mesh of group.children[0].children){for(let i=0,v=mesh.geometry.attributes.position;i<v.count;i++){const x=v.getX(i),y=v.getY(i),z=v.getZ(i);assert.ok([x,y,z].every(Number.isFinite));assert.ok(inside(polygon,x,z),`outside annex at ${x},${z}`);assert.ok(y<=p.floor+.0001);}assert.ok(mesh.castShadow&&mesh.receiveShadow);}
  assert.equal(JSON.stringify(features),before);assert.equal(buildYotsutsujiRetaining(group,p,materials().stoneMat),null);
});
test('outside face has outward normals and raycasts continuously to its terrain-seated foot',()=>{
  const p=yotsutsujiRetainingPlan(features,ground),root=new THREE.Group();buildYotsutsujiRetaining(root,p,materials().stoneMat);root.updateMatrixWorld(true);
  for(const u of [1,3,5,7]){
    const floor=ground(...p.world(u,.1)),y=(floor+p.floor)/2,q=p.world(u,-1);
    const ray=new THREE.Raycaster(new THREE.Vector3(q[0],y,q[1]),new THREE.Vector3(p.inward[0],0,p.inward[1]));
    assert.ok(ray.intersectObject(root,true).length>0,`no visible retaining face at ${u}`);
    // The existing .22 m facade extends only .11 m inside its source edge.
    // Its underside must actually land on the retaining top, not hover in front.
    const top=p.world(u,.105),down=new THREE.Raycaster(new THREE.Vector3(top[0],p.floor+.5,top[1]),new THREE.Vector3(0,-1,0));
    const hit=down.intersectObject(root,true)[0];assert.ok(hit&&Math.abs(hit.point.y-p.floor)<.0001,'retaining top misses facade underside');
  }
});
test('court owner keeps accepted forecourt, three tea houses, benches and mapped branches',()=>{
  const root=new THREE.Group(),colliders=[],m=materials(),legacy={materials:m,torii:{fresh:m.vermilionMat,weathered:m.vermilionMat,geometry:new THREE.BoxGeometry(.1,3,.1),blackGeometry:new THREE.BoxGeometry(.1,.3,.1)}};
  const result=buildYotsutsuji(root,legacy,features,ground,colliders,{height:ground});assert.equal(result.buildings,3);assert.ok(result.retainingEdge?.stones>20);
  const benches=colliders.filter(c=>c.args.at(-1)==='yotsu_rest_bench');assert.deepEqual(benches.map(c=>c.args.slice(0,2)),[[797,-219.75],[803,-219.75]]);
  assert.equal(colliders.filter(c=>c.args.at(-1)==='city_facing_bench').length,1);assert.equal(colliders.filter(c=>c.args.at(-1)==='yotsu_view_edge').length,1);
  const stair=features.paths.find(p=>p.id==='way/1052553397');
  // New work is over two metres from the 2 m-wide stair centreline, and never
  // adds a new barrier across the public stair. The existing building collider
  // retains the same XZ envelope; only its bottom reaches the actual lower toe.
  const p=yotsutsujiRetainingPlan(features,ground);
  for(const section of p.sections){const q=p.world(section.u,.04),a=stair.points[0],b=stair.points[1],dx=b[0]-a[0],dz=b[2]-a[2],t=Math.max(0,Math.min(1,((q[0]-a[0])*dx+(q[1]-a[2])*dz)/(dx*dx+dz*dz)));assert.ok(Math.hypot(q[0]-a[0]-t*dx,q[1]-a[2]-t*dz)>2);}
  assert.deepEqual(yotsuForecourt,[[792,-220.7],[806,-220.7],[806.176,-214.156],[801.414,-213.322],[797.017,-212.687],[792,-212]]);
});
test('changed outline or invalid terrain fails safely without a fabricated retaining wall',()=>{
  assert.equal(yotsutsujiRetainingPlan({buildings:[]},ground),null);assert.equal(yotsutsujiRetainingPlan(features,()=>NaN),null);
  const changed=structuredClone(features);changed.buildings.find(b=>b.id===retainingBuilding).points.reverse();assert.equal(yotsutsujiRetainingPlan(changed,ground),null);
});
