import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from 'three';
import {heightAt,pathWidth} from '../geography/geo-core.mjs';
import {makePathSurfaces} from './path-surfaces.mjs';
import {buildKeihanEastParking,KEIHAN_EAST_PARKING_RING} from './keihan-east-parking.mjs';
import {SpatialCollisionWorld} from './collision.mjs';
const features=JSON.parse(readFileSync(new URL('../geography/features.json',import.meta.url))),terrain=JSON.parse(readFileSync(new URL('../geography/terrain.json',import.meta.url)));
const surfaces=makePathSurfaces(features,(x,z)=>heightAt(terrain,x,z));
const inside=(x,z,p)=>{let hit=false;for(let i=0,j=p.length-1;i<p.length;j=i++){const a=p[i],b=p[j];if((a[1]>z)!==(b[1]>z)&&x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])hit=!hit;}return hit;};
const distance=(x,z,a,b)=>{const dx=b[0]-a[0],dz=b[2]-a[2],t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[2])*dz)/(dx*dx+dz*dz)));return Math.hypot(x-a[0]-dx*t,z-a[2]-dz*t);};
test('east-of-track photo parking is bounded, terrain-supported, low cost and idempotent',()=>{
 const root=new THREE.Group(),colliders=[],before=JSON.stringify(features),r=buildKeihanEastParking(root,features,surfaces,{},colliders);
 assert.equal(r.built,true);assert.equal(r.drawBatches,4);assert.ok(r.triangles<2000);assert.equal(r.collidersAdded,1);assert.deepEqual(r.builtIds,[]);assert.deepEqual(r.ring,KEIHAN_EAST_PARKING_RING);
 assert.equal(buildKeihanEastParking(root,features,surfaces,{},colliders).group,r.group);assert.equal(colliders.length,1);assert.equal(JSON.stringify(features),before);
 assert.equal(r.sourceDate,'July 2019');assert.match(r.inferred,/not surveyed/);assert.match(r.provenance,/no OSM parking polygon/);
 root.traverse(o=>{assert.ok(!o.isLight);if(o.isMesh)for(const v of o.geometry.attributes.position.array)assert.ok(Number.isFinite(v));});
 const asphalt=r.group.children[0].geometry.attributes.position;
 for(let i=0;i<asphalt.count;i++){const x=asphalt.getX(i),z=asphalt.getZ(i);assert.ok(asphalt.getY(i)>=surfaces.terrainHeight(x,z)+.0249);assert.ok(asphalt.getY(i)<surfaces.terrainHeight(x,z)+.35);assert.ok(x>-311&&x<-297);assert.ok(z>-129&&z<-88);}
});
test('lot and rear fence do not occupy buildings, rail or mapped public paths',()=>{
 const root=new THREE.Group(),colliders=[],r=buildKeihanEastParking(root,features,surfaces,{},colliders),world=new SpatialCollisionWorld();for(const c of colliders)world.addBox(...c.args);
 const positions=r.group.children[0].geometry.attributes.position;
 for(let triangle=0;triangle<positions.count;triangle+=3)for(const weights of [[1,0,0],[0,1,0],[0,0,1],[1/3,1/3,1/3]]){
  const x=weights.reduce((s,w,i)=>s+w*positions.getX(triangle+i),0),z=weights.reduce((s,w,i)=>s+w*positions.getZ(triangle+i),0);
  for(const building of features.buildings)assert.ok(!inside(x,z,building.points.slice(0,-1).map(p=>[p[0],p[2]])),building.id);
  for(const path of features.paths)for(let i=1;i<path.points.length;i++)assert.ok(distance(x,z,path.points[i-1],path.points[i])>pathWidth(path.tags)/2-.0001,`${path.id} at ${x},${z}`);
 }
 for(const segment of surfaces.segments){const x=(segment.a[0]+segment.b[0])/2,z=(segment.a[2]+segment.b[2])/2;if(x<-320||x>-285||z<-135||z>-80)continue;const y=(segment.ya+segment.yb)/2,result=world.resolvePlayer(x,y+1.7,z);assert.ok(Math.hypot(result.x-x,result.z-z)<1e-7,segment.id);}
});
test('asphalt access mouth continuously joins the street-side edge to the parking stalls',()=>{
 const r=buildKeihanEastParking(new THREE.Group(),features,surfaces),mesh=r.group.children[0];mesh.updateMatrixWorld(true);
 for(let z=-119;z<=-104;z+=.1){const ray=new THREE.Raycaster(new THREE.Vector3(-305,40,z),new THREE.Vector3(0,-1,0),0,20);assert.ok(ray.intersectObject(mesh).length,`access gap at -305,${z}`);}
});
test('missing or moved boundaries fail without scene mutations',()=>{
 for(const f of [{...features,buildings:[]},{...features,buildings:features.buildings.map(b=>b.id==='way/305213542'?{...b,points:b.points.map(p=>[p[0]+1,p[1],p[2]])}:b)}]){const root=new THREE.Group(),colliders=[],r=buildKeihanEastParking(root,f,surfaces,{},colliders);assert.equal(r.built,false);assert.equal(root.children.length,0);assert.equal(colliders.length,0);}
});
