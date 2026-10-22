import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import {buildKumatakaTakeyaFrontage,takeyaFeatureId} from './kumataka-takeya-frontage.mjs';
import {SpatialCollisionWorld} from './collision.mjs';

const data=JSON.parse(fs.readFileSync(new URL('../geography/features.json',import.meta.url)));
const feature=data.buildings.find(b=>b.id===takeyaFeatureId),pavilion=data.buildings.find(b=>b.id==='way/301527741');
const fixture=()=>({root:new THREE.Group(),features:{buildings:[feature,pavilion],paths:data.paths},surfaces:{terrainHeight:()=>66.312874,height:()=>66.312874},materials:{stoneMat:new THREE.MeshStandardMaterial()},colliders:[]});
const build=f=>buildKumatakaTakeyaFrontage(f.root,f.features,f.surfaces,f.materials,f.colliders);
test('claims only verified Takeya owner and retains full concave source ring, correct east frontage and idempotence',()=>{
 const f=fixture(),before=JSON.stringify(f.features),r=build(f),count=f.colliders.length;
 assert.deepEqual(r.builtIds,[takeyaFeatureId]);assert.deepEqual(r.sourceRing,feature.points.slice(0,-1));assert.deepEqual(r.frontage.a,feature.points[4]);assert.deepEqual(r.frontage.b,feature.points[5]);
 assert.equal(JSON.stringify(f.features),before);assert.equal(build(f),r);assert.equal(f.colliders.length,count);assert.equal(f.root.children.length,1);assert.ok(r.frontage.openingCenter>6&&r.frontage.openingCenter<8);
});
test('main roof preserves exact projected mapped area; all geometry is finite/nondegenerate and bounded in cost',()=>{
 const f=fixture(),r=build(f),roof=f.root.getObjectByName('Takeya exact concave main roof skin'),p=roof.geometry.attributes.position;let area=0;
 for(let i=0;i<p.count;i+=3){const a=new THREE.Vector3().fromBufferAttribute(p,i),b=new THREE.Vector3().fromBufferAttribute(p,i+1),c=new THREE.Vector3().fromBufferAttribute(p,i+2),n=b.clone().sub(a).cross(c.clone().sub(a));assert.ok(n.y>1e-10);area+=n.y/2;}
 const ring=feature.points.slice(0,-1);let sourceArea=0;for(let i=0;i<ring.length;i++)sourceArea+=ring[i][0]*ring[(i+1)%ring.length][2]-ring[(i+1)%ring.length][0]*ring[i][2];assert.ok(Math.abs(area-Math.abs(sourceArea)/2)<.001);
 f.root.traverse(o=>{if(!o.isMesh)return;const p=o.geometry.attributes.position;for(const n of p.array)assert.ok(Number.isFinite(n));for(let i=0;i<p.count;i+=3){const a=new THREE.Vector3().fromBufferAttribute(p,i),b=new THREE.Vector3().fromBufferAttribute(p,i+1),c=new THREE.Vector3().fromBufferAttribute(p,i+2);assert.ok(b.sub(a).cross(c.sub(a)).lengthSq()>1e-14);}});
 assert.ok(r.triangles<9000);assert.ok(r.materialBatches<=7);
 const normals=roof.geometry.attributes.normal,seen=new Map();for(let i=0;i<p.count;i++){const key=[p.getX(i),p.getY(i),p.getZ(i)].join(','),normal=[normals.getX(i),normals.getY(i),normals.getZ(i)];if(seen.has(key))assert.deepEqual(normal,seen.get(key),'coincident roof vertices share production normals');else seen.set(key,normal);}
});
test('mapped public arrival/onward remain clear in both directions; source route grades and callbacks unchanged',()=>{
 const f=fixture(),height=f.surfaces.height,terrain=f.surfaces.terrainHeight,r=build(f),world=new SpatialCollisionWorld();for(const c of f.colliders)world.addBox(...c.args);
 for(const path of data.paths.filter(p=>['way/626313754','way/301527750','way/439990443'].includes(p.id)))for(let i=1;i<path.points.length;i++)for(let k=0;k<=80;k++){
  const a=path.points[i-1],b=path.points[i],t=k/80,dx=b[0]-a[0],dz=b[2]-a[2],len=Math.hypot(dx,dz);
  for(const lane of [-.65,0,.65]){const x=a[0]+dx*t-dz/len*lane,z=a[2]+dz*t+dx/len*lane,out=world.resolvePlayer(x,r.floor+1.55,z);assert.ok(Math.hypot(out.x-x,out.z-z)<1e-6,`${path.id} sample ${k} lane ${lane}`);}
 }
 assert.equal(f.surfaces.height,height);assert.equal(f.surfaces.terrainHeight,terrain);assert.ok(r.threshold.maximumRise<.06);assert.equal(r.threshold.publicInterior,false);
});
test('source-supported broad opening is real geometry with a bounded inner stop, not an opaque facade wall',()=>{
 const f=fixture(),r=build(f),{a,b,length,inward:[nx,nz],openingCenter:s}=r.frontage,ux=(b[0]-a[0])/length,uz=(b[2]-a[2])/length;
 f.root.updateMatrixWorld(true);const origin=new THREE.Vector3(a[0]+ux*s-nx*.5,r.floor+1.4,a[2]+uz*s-nz*.5),ray=new THREE.Raycaster(origin,new THREE.Vector3(nx,0,nz),0,3),hits=ray.intersectObject(f.root,true);
 assert.ok(hits.length>0);assert.ok(hits[0].distance>1.4,'front remains open before the inner shadow/restriction plane');assert.ok(hits[0].distance<1.9);
});
test('missing identity, unresolved source datum or conflicting owner produces no partial geometry/blockers/exclusion',()=>{
 for(const mode of ['missing','missing-pavilion','grade','owned']){const f=fixture();if(mode==='missing')f.features.buildings=[];if(mode==='missing-pavilion')f.features.buildings=[feature];if(mode==='grade')f.surfaces.terrainHeight=(x,z)=>z;if(mode==='owned'){const old=new THREE.Group();old.userData.sourceFeature=takeyaFeatureId;f.root.add(old);}const count=f.root.children.length;assert.deepEqual(build(f).builtIds,[]);assert.equal(f.root.children.length,count);assert.equal(f.colliders.length,0);}
});
test('observed two-character name uses one shared cloth texture and stays on one panel without a new batch',()=>{
 const previous=globalThis.document,calls=[];globalThis.document={createElement:()=>({getContext:()=>({fillRect(){},fillText(...args){calls.push(args);}})})};
 try{const f=fixture(),r=build(f);assert.equal(r.observedName,'竹屋');assert.deepEqual(calls.map(c=>c[0]),['竹','屋']);assert.ok(calls.every(c=>c[1]===640));assert.equal(r.materialBatches,7);let cloth;f.root.traverse(o=>{if(o.isMesh&&o.material.map?.name==='Takeya observed vertical name noren')cloth=o;});assert.ok(cloth);assert.equal(cloth.geometry.attributes.position.count,24);assert.equal(cloth.material.map.image.width,1024);}
 finally{if(previous===undefined)delete globalThis.document;else globalThis.document=previous;}
});
test('actual transformed legacy repeated stones overlapping mapped Takeya are cleared, preserving other owners and colliders',()=>{
 const f=fixture(),legacy=new THREE.Group();legacy.userData.zone='kumataka';legacy.position.set(545.254396455114,65.89652051629592,-129.16842947649747);legacy.rotation.y=-1.162212928391673;f.root.add(legacy);
 const originals=[];for(let i=0;i<28;i++){const x=-9.2-i%4*1.35,z=-8.5+Math.floor(i/4)*2.5,h=1.10+i%3*.32,m=new THREE.Mesh(new THREE.BoxGeometry(.56,h,.30));m.position.set(x,h*.5+i%4*.18,z);legacy.add(m);originals.push(m);}
 const protectedObject=new THREE.Mesh(new THREE.BoxGeometry(.56,1.10,.30));protectedObject.position.copy(originals[0].position);protectedObject.userData.interactable=true;legacy.add(protectedObject);
 const unrelated=new THREE.Mesh(new THREE.BoxGeometry(.56,2,.30));unrelated.position.copy(originals[0].position);legacy.add(unrelated);
 const pavilionCollider={type:'box',args:[542.95,-134.491,2.5,3,-1.162212928391673,65.89,69.69,'kumatakasha']};f.colliders.push(pavilionCollider);
 const r=build(f),removed=r.clearedLegacyStones.filter(c=>c.kind==='stele');assert.ok(removed.length>0&&removed.length<28);assert.ok(removed.every(c=>c.footprintOverlapArea>1e-6));
 const indices=new Set(removed.map(c=>c.sourceIndex));originals.forEach((o,i)=>assert.equal(o.parent,indices.has(i)?null:legacy));assert.equal(protectedObject.parent,legacy);assert.equal(unrelated.parent,legacy);assert.equal(f.colliders[0],pavilionCollider);assert.equal(r.clearedLegacyColliders,0);
 assert.equal(build(f),r,'rerun does not sweep other source owners');
});
