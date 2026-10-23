import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import {buildUpperAccessR96,upperAccessR96Pockets} from './upper-access-r96.mjs';
import {pathWidth} from '../geography/geo-core.mjs';
const features=JSON.parse(fs.readFileSync(new URL('../geography/features.json',import.meta.url)));
const pathSegments=features.paths.flatMap(path=>path.points.slice(1).map((b,i)=>({a:path.points[i],b,width:pathWidth(path.tags??{})}))).filter(s=>Math.max(s.a[0],s.b[0])+s.width>93&&Math.min(s.a[0],s.b[0])-s.width<123&&Math.max(s.a[2],s.b[2])+s.width> -37&&Math.min(s.a[2],s.b[2])-s.width< -20);
const roofs=features.buildings.map(b=>({x0:Math.min(...b.points.map(q=>q[0])),x1:Math.max(...b.points.map(q=>q[0])),z0:Math.min(...b.points.map(q=>q[2])),z1:Math.max(...b.points.map(q=>q[2]))}));
function fixture(){const y=(x,z)=>49+x*.03-z*.1,point=(x,z)=>[x,y(x,z),z];return {root:new THREE.Group(),features,surfaces:{},materials:{woodMat:new THREE.MeshStandardMaterial()},colliders:[],options:{terrainPositions:[...point(93,-37),...point(93,-20),...point(123,-37),...point(123,-37),...point(93,-20),...point(123,-20)]},y};}
const build=f=>buildUpperAccessR96(f.root,f.features,f.surfaces,f.materials,f.colliders,f.options);
test('bounded upper woodland has triangle-seated roots and static low-budget material batches',()=>{
 const f=fixture(),before=JSON.stringify(features),r=build(f);assert.equal(r.built,true);assert.equal(r.trees.length,3);assert.equal(r.growth.length,3);assert.ok(r.growth.every(g=>g.cards>80));assert.ok(r.triangles<8500);assert.equal(r.drawBatches,2);assert.equal(r.newColliders,3);
 for(const t of r.trees)assert.ok(Math.abs(t.root[1]-f.y(t.root[0],t.root[2]))<1e-6);
 assert.equal(JSON.stringify(features),before);assert.equal(build(f),r);assert.equal(f.colliders.length,3);
 f.root.traverse(o=>{if(o.isMesh){assert.ok(Array.from(o.geometry.attributes.position.array).every(Number.isFinite));assert.ok(!o.isLight);}});
});
test('actual foliage corners preserve every mapped public route and conservative roof envelope',()=>{
 const f=fixture();build(f);const leaf=f.root.children[0].children.find(o=>o.geometry.attributes.color),p=leaf.geometry.attributes.position;assert.equal(p.count,leaf.geometry.attributes.uv.count);assert.equal(p.count,leaf.geometry.attributes.color.count);
 for(let i=0;i<p.count;i++){
  const x=p.getX(i),z=p.getZ(i);
  for(const {a,b,width}of pathSegments){const dx=b[0]-a[0],dz=b[2]-a[2],t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[2])*dz)/(dx*dx+dz*dz||1)));assert.ok(Math.hypot(x-a[0]-t*dx,z-a[2]-t*dz)>width/2+.159);}
  for(const b of roofs)assert.ok(x<=b.x0-1.40||x>=b.x1+1.40||z<=b.z0-1.40||z>=b.z1+1.40);
 }
});
test('existing forest/solid owner cannot acquire a duplicate trunk',()=>{
 const f=fixture(),[x,z]=upperAccessR96Pockets[1];f.colliders.push({type:'cylinder',args:[x,z,.3,40,80,'forest_tree']});const before=JSON.stringify(f.colliders[0]),r=build(f);assert.equal(r.trees.length,2);assert.equal(r.newColliders,2);assert.equal(JSON.stringify(f.colliders[0]),before);assert.ok(r.skipped.some(s=>s.reason==='Existing solid/tree owner'));
});
test('rendered support is required and partial terrain safely withholds unsupported roots',()=>{
 const f=fixture();f.options={};assert.equal(build(f).built,false);assert.equal(f.root.children.length,0);assert.equal(f.colliders.length,0);
 f.options={terrainPositions:[93,50,-37,93,50,-36,94,50,-37]};const r=build(f);assert.equal(r.built,false);assert.equal(r.skipped.length,4);assert.equal(f.colliders.length,0);
});
test('wide authoritative rendered walking segments override narrow source widths',()=>{
 const f=fixture();f.surfaces.segments=[{a:[93,0,-27],b:[123,0,-27],width:30}];const r=build(f);assert.equal(r.built,false);assert.equal(r.trees.length,0);assert.equal(f.colliders.length,0);
});

 test('basal buttress toes and midpoints follow rendered slope and are withheld for preowned trees',()=>{const f=fixture(),r=build(f);assert.ok(r.roots.length>=8);for(const root of r.roots)for(const p of [root.a,root.mid,root.b])assert.ok(Math.abs(p[1]-f.y(p[0],p[2]))<1e-6);const blocked=fixture();for(const [x,z]of upperAccessR96Pockets)blocked.colliders.push({type:'cylinder',args:[x,z,.5,0,100,'existing']});const b=build(blocked);assert.equal(b.trees.length,0);assert.equal(b.roots.length,0);assert.equal(b.newColliders,0);});

test('all crown and low foliage vertices avoid prior torii/solid footprints',()=>{const f=fixture();const x=105.4,z=-25.4;f.colliders.push({type:'box',args:[x,z,.22,.30,0,40,65,'existing_torii_post']});build(f);const leaf=f.root.children[0].children.find(o=>o.geometry.attributes.color),p=leaf.geometry.attributes.position;for(let i=0;i<p.count;i++)assert.ok(Math.abs(p.getX(i)-x)>=.22+.06+.18-1e-5||Math.abs(p.getZ(i)-z)>=.30+.06+.18-1e-5);});
