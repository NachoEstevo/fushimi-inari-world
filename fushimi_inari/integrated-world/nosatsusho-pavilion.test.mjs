import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import {buildNosatsushoPavilion,nosatsushoFeatureId} from './nosatsusho-pavilion.mjs';
import {SpatialCollisionWorld} from './collision.mjs';

const data=JSON.parse(fs.readFileSync(new URL('../geography/features.json',import.meta.url)));
const source=data.buildings.find(b=>b.id===nosatsushoFeatureId);
function fixture(){return {root:new THREE.Group(),features:{buildings:[source],paths:data.paths},surfaces:{terrainHeight:(x,z)=>49+(x-118)*.02+(z+63)*.03,height:()=>49.2},materials:{stoneMat:new THREE.MeshStandardMaterial()},colliders:[]};}
const build=f=>buildNosatsushoPavilion(f.root,f.features,f.surfaces,f.materials,f.colliders);
test('claims only exact mapped owner, retains ring/approach E and neighboring features, and is idempotent',()=>{
 const f=fixture(),before=JSON.stringify(f.features),height=f.surfaces.height,terrain=f.surfaces.terrainHeight,r=build(f);
 assert.deepEqual(r.builtIds,[source.id]);assert.deepEqual(r.sourceRing,source.points.slice(0,-1));assert.deepEqual(r.approachEndpoint,source.points[4]);assert.equal(JSON.stringify(f.features),before);
 assert.equal(build(f),r);assert.equal(f.root.children.length,1);assert.equal(f.colliders.length,4);assert.equal(f.surfaces.height,height);assert.equal(f.surfaces.terrainHeight,terrain);
});
test('source-ring roof retains exact plan area and is finite, nondegenerate and upward-facing',()=>{
 const f=fixture(),r=build(f),g=f.root.children[0],roof=g.children.find(m=>m.name.includes('green curved')),p=roof.geometry.attributes.position;g.updateWorldMatrix(true,true);
 let area=0;for(let i=0;i<p.count;i+=3){const a=new THREE.Vector3().fromBufferAttribute(p,i),b=new THREE.Vector3().fromBufferAttribute(p,i+1),c=new THREE.Vector3().fromBufferAttribute(p,i+2),normal=b.clone().sub(a).cross(c.clone().sub(a));assert.ok(normal.y>1e-10);area+=normal.y/2;}
 const ring=source.points.slice(0,-1);let sourceArea=0;for(let i=0;i<ring.length;i++)sourceArea+=ring[i][0]*ring[(i+1)%ring.length][2]-ring[(i+1)%ring.length][0]*ring[i][2];
 assert.ok(Math.abs(area-Math.abs(sourceArea)/2)<1e-4);assert.ok(r.triangles<12000);assert.ok(r.materialBatches<=6);
 for(const mesh of g.children){const p=mesh.geometry.attributes.position;for(const n of p.array)assert.ok(Number.isFinite(n));for(let i=0;i<p.count;i+=3){const a=new THREE.Vector3().fromBufferAttribute(p,i),b=new THREE.Vector3().fromBufferAttribute(p,i+1),c=new THREE.Vector3().fromBufferAttribute(p,i+2);assert.ok(b.sub(a).cross(c.sub(a)).lengthSq()>1e-16);}}
});
test('low barrier colliders stop the gate and sides while mapped approach and surrounding branch stay accessible',()=>{
 const f=fixture(),r=build(f),world=new SpatialCollisionWorld();for(const c of f.colliders)world.addBox(...c.args);
 const e=r.approachEndpoint,approach=world.resolvePlayer(e[0],r.datum+1.55,e[2]);assert.ok(Math.hypot(approach.x-e[0],approach.z-e[2])<1e-8,'mapped public endpoint stays clear');
 const {center:[cx,cz],yaw,halfD}=r.frame,gate=[cx+Math.sin(yaw)*halfD,cz+Math.cos(yaw)*halfD],resolved=world.resolvePlayer(gate[0],r.datum+1.55,gate[1]);assert.ok(Math.hypot(resolved.x-gate[0],resolved.z-gate[1])>.25,'gate stays restricted');
 const p=data.paths.find(p=>p.id==='way/1133052427').points[0],branch=world.resolvePlayer(p[0],r.datum+1.55,p[2]);assert.ok(Math.hypot(branch.x-p[0],branch.z-p[2])<1e-8);
});
test('supported footing follows actual terrain while roof and lintels share one horizontal datum',()=>{
 const f=fixture(),r=build(f);assert.ok(Number.isFinite(r.datum));assert.ok(r.datum>=49);
 const heightBefore=f.surfaces.height(118,-62);assert.equal(heightBefore,49.2);
 assert.equal(f.root.children[0].position.y,r.datum);assert.equal(f.root.children[0].rotation.x,0);assert.equal(f.root.children[0].rotation.z,0);
 assert.ok(f.colliders.every(c=>c.args[5]<=r.datum&&c.args[6]>r.datum));
});
test('missing, invalid or already owned feature does not produce geometry, blockers or exclusion',()=>{
 for(const mode of ['missing','invalid','owned']){const f=fixture();if(mode==='missing')f.features.buildings=[];if(mode==='invalid')f.features.buildings=[{...source,points:[[NaN,0,0]]}];if(mode==='owned'){const old=new THREE.Group();old.userData.sourceFeature=source.id;f.root.add(old);}const count=f.root.children.length;assert.deepEqual(build(f).builtIds,[]);assert.equal(f.root.children.length,count);assert.equal(f.colliders.length,0);}
});
test('side bays are genuinely open above paling, rear plaster is enclosed, and front paper faces the visitor',()=>{
 const f=fixture(),r=build(f),g=f.root.children[0];g.updateWorldMatrix(true,true);
 const ray=(origin,direction)=>{const p=new THREE.Vector3(...origin).applyMatrix4(g.matrixWorld),d=new THREE.Vector3(...direction).transformDirection(g.matrixWorld);return new THREE.Raycaster(p,d,0,12).intersectObject(g,true);};
 assert.equal(ray([-5,1.60,1],[1,0,0]).length,0,'open upper long-side bay must have no full-height wall');
 assert.ok(ray([.4,1.6,-5],[0,0,1]).length>0,'white rear wall remains visible');
 assert.ok(ray([-.91,1.82,5],[0,0,-1]).some(hit=>hit.object.name.includes('pale rear wall')&&g.worldToLocal(hit.point.clone()).z>r.frame.halfD),'paper silhouette visible from south approach with FrontSide');
});
test('roof pitch remains mostly linear with a restrained photographic end curve',()=>{
 const f=fixture(),r=build(f),g=f.root.children[0],roof=g.children.find(m=>m.name.includes('green curved'));g.updateWorldMatrix(true,true);
 const top=x=>{const origin=new THREE.Vector3(x,8,0).applyMatrix4(g.matrixWorld),direction=new THREE.Vector3(0,-1,0);const hit=new THREE.Raycaster(origin,direction).intersectObject(roof)[0];assert.ok(hit);return g.worldToLocal(hit.point.clone()).y;};
 const ridge=top(0),middle=top(r.frame.width/4),edge=top(r.frame.width/2-.025),sag=(ridge+edge)/2-middle;
 assert.ok(sag>=0&&sag<.12,'mid-slope sag must remain below 12cm, avoiding the previous deep quadratic sweep');
});
