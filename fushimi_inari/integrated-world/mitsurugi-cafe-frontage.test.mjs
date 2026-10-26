import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from 'three';
import {buildMitsurugiCafeFrontage,MITSURUGI_CAFE_ID} from './mitsurugi-cafe-frontage.mjs';
import {pathClearance} from './spatial.mjs';
const features=JSON.parse(readFileSync(new URL('../geography/features.json',import.meta.url)));
test('cafe keeps mapped footprint, opens roadside bays and seats roof to adjacent path instead of DEM extremes',()=>{
 const root=new THREE.Group(),colliders=[],before=JSON.stringify(features),r=buildMitsurugiCafeFrontage(root,features,{height:(x,z)=>x<1195?177:184},colliders);
 assert.deepEqual(r.builtIds,[MITSURUGI_CAFE_ID]);assert.equal(r.floor,184);assert.equal(colliders.length,6);
 const clearance=pathClearance(features.paths.filter(p=>p.id==='way/1270597604'));
 for(const {args}of colliders)assert.ok(clearance(args[0],args[1]).distance>1+args[2],'post stays outside the mapped 2m walking corridor');
 const [a,b]=r.front,length=Math.hypot(b[0]-a[0],b[2]-a[2]),ux=(b[0]-a[0])/length,uz=(b[2]-a[2])/length,nx=-uz,nz=ux;
 const x=a[0]+ux*length*.5,z=a[2]+uz*length*.5;root.updateMatrixWorld(true);
 const ray=new THREE.Raycaster(new THREE.Vector3(x-nx*.5,185,z-nz*.5),new THREE.Vector3(nx,0,nz),0,.8);
 assert.equal(ray.intersectObject(root,true).length,0,'bay is actually open at human eye height');
 const f=features.buildings.find(b=>b.id===MITSURUGI_CAFE_ID),loX=Math.min(...f.points.map(p=>p[0])),hiX=Math.max(...f.points.map(p=>p[0])),loZ=Math.min(...f.points.map(p=>p[2])),hiZ=Math.max(...f.points.map(p=>p[2]));
 let triangles=0,maxY=-Infinity;root.traverse(o=>{if(!o.isMesh)return;const p=o.geometry.attributes.position;triangles+=(o.geometry.index?.count??p.count)/3;for(let i=0;i<p.count;i++){const v=new THREE.Vector3().fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld);assert.ok(v.x>=loX-.001&&v.x<=hiX+.001&&v.z>=loZ-.001&&v.z<=hiZ+.001);maxY=Math.max(maxY,v.y);}});
 assert.ok(triangles<200);assert.ok(maxY<187.36,'roof bounded by entry datum, not maxDEM+6');
 assert.equal(JSON.stringify(features),before);assert.equal(buildMitsurugiCafeFrontage(root,features,{height:()=>0},colliders),r);assert.equal(colliders.length,6);
});
test('missing cafe/path or invalid support leaves generic ownership available',()=>{
 for(const mode of ['cafe','path','support']){const root=new THREE.Group(),f=structuredClone(features),colliders=[];if(mode==='cafe')f.buildings=[];if(mode==='path')f.paths=[];const r=buildMitsurugiCafeFrontage(root,f,{height:()=>mode==='support'?NaN:184},colliders);assert.deepEqual(r.builtIds,[]);assert.equal(root.children.length,0);assert.equal(colliders.length,0);}
});
test('shared timber/stone maps keep metre-scaled UVs without changing the source palette',()=>{
 const root=new THREE.Group(),woodMap=new THREE.Texture(),stoneMap=new THREE.Texture(),roofMap=new THREE.Texture();
 const materials={woodMat:new THREE.MeshStandardMaterial({map:woodMap,color:'#abcdef'}),stoneMat:new THREE.MeshStandardMaterial({map:stoneMap,color:'#cdefab'}),roofMat:new THREE.MeshStandardMaterial({map:roofMap})};
 const colors=[materials.woodMat.color.getHex(),materials.stoneMat.color.getHex()];
 buildMitsurugiCafeFrontage(root,features,{height:()=>184},[],materials);
 const walls=root.getObjectByName('Simple dark cafe side envelope'),base=root.getObjectByName('Terrain-seated cafe foundation');
 assert.equal(walls.material.map,woodMap);assert.equal(base.material.map,stoneMap);assert.notEqual(walls.material,materials.woodMat);
 for(const mesh of [walls,base]){const uv=mesh.geometry.attributes.uv,p=mesh.geometry.attributes.position;assert.equal(uv.count,p.count);for(let i=0;i<uv.count;i++)assert.ok(Number.isFinite(uv.getX(i))&&Number.isFinite(uv.getY(i)));assert.ok(Math.abs(uv.getY(2)-uv.getY(0))>.1,'height uses repeatable UV rather than a flat sample');}
 assert.ok(root.getObjectByName('Inferred timber eave trim'));assert.deepEqual([materials.woodMat.color.getHex(),materials.stoneMat.color.getHex()],colors);
});
