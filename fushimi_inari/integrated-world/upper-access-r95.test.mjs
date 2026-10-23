import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import {pathWidth} from '../geography/geo-core.mjs';
import {buildUpperAccessR95,upperAccessR95Roots} from './upper-access-r95.mjs';
const features=JSON.parse(fs.readFileSync(new URL('../geography/features.json',import.meta.url)));
function fixture(){
 const path=features.paths.find(p=>p.id==='way/626313768'),a=path.points[0],b=path.points.at(-1),at=t=>a.map((v,i)=>v+(b[i]-v)*t),segments=features.paths.filter(p=>p.id!==path.id).flatMap(p=>p.points.slice(1).map((q,i)=>({id:p.id,a:p.points[i],b:q,width:pathWidth(p.tags??{}),ya:p.points[i][1],yb:q[1]})));
 for(let i=0;i<22;i++)segments.push({id:path.id,a:at(i/22),b:at((i+1)/22),width:6,ya:at(i/22)[1],yb:at((i+1)/22)[1],stair:true});
 const y=(x,z)=>45+x*.05-z*.04,p=(x,z)=>[x,y(x,z),z];
 return {root:new THREE.Group(),features,network:{segments},materials:{stoneMat:new THREE.MeshStandardMaterial(),woodMat:new THREE.MeshStandardMaterial()},colliders:[],options:{terrainPositions:[...p(90,-40),...p(90,5),...p(135,-40),...p(135,-40),...p(90,5),...p(135,5)]},y};
}
const build=f=>buildUpperAccessR95(f.root,f.features,f.network,f.materials,f.colliders,f.options);
test('coherent stair sector adds both coping flanks, open south rails and wooded bank',()=>{
 const f=fixture(),before=JSON.stringify(features),r=build(f);assert.equal(r.built,true);assert.ok(r.edges.filter(e=>e.side===-1).length>12);assert.ok(r.edges.filter(e=>e.side===1).length>12);assert.ok(r.posts.length>5);assert.ok(r.rails.length>4);assert.equal(r.trees.length,3);assert.equal(r.growth.length,3);assert.ok(r.triangles<11000);assert.equal(r.drawBatches,3);assert.equal(JSON.stringify(features),before);
 for(const t of r.trees)assert.ok(Math.abs(t.root[1]-f.y(t.root[0],t.root[2]))<1e-6);
 for(const p of r.posts){assert.ok(Math.abs(p.point[1]-f.y(p.point[0],p.point[2]))<1e-6);assert.ok(p.bottom<Math.min(...p.support));}
 for(const e of r.edges){assert.ok(e.bottom<Math.min(...e.support));assert.ok(e.top>e.bottom);}
 const count=f.colliders.length;assert.equal(build(f),r);assert.equal(f.colliders.length,count);assert.ok(f.root.children[0].children.every(o=>o.isMesh));
 assert.equal(f.colliders.filter(c=>c.args.at(-1)==='upper_access_r95_stone_rail').length,r.rails.length,'every open rail panel has a physical boundary between its posts');
});
test('new solids remain outside every authoritative walking envelope and geometry is finite',()=>{
 const f=fixture();build(f);
 for(const c of f.colliders){const [x,z]=c.args;for(const s of f.network.segments){const dx=s.b[0]-s.a[0],dz=s.b[2]-s.a[2],t=Math.max(0,Math.min(1,((x-s.a[0])*dx+(z-s.a[2])*dz)/(dx*dx+dz*dz||1)));assert.ok(Math.hypot(x-s.a[0]-t*dx,z-s.a[2]-t*dz)>s.width/2+.18);}assert.ok(c.args.slice(0,-1).every(Number.isFinite));}
 f.root.traverse(o=>{if(o.isMesh)assert.ok(Array.from(o.geometry.attributes.position.array).every(Number.isFinite));});
});
test('actual foliage corners keep all mapped paths and roof envelopes clear',()=>{
 const f=fixture();build(f);const leaf=f.root.children[0].children.find(o=>o.geometry.attributes.color),p=leaf.geometry.attributes.position;assert.equal(p.count,leaf.geometry.attributes.uv.count);
 const near=f.network.segments.filter(s=>Math.max(s.a[0],s.b[0])+s.width>96&&Math.min(s.a[0],s.b[0])-s.width<120&&Math.max(s.a[2],s.b[2])+s.width> -25&&Math.min(s.a[2],s.b[2])-s.width<0);
 const roofs=features.buildings.map(b=>({x0:Math.min(...b.points.map(q=>q[0]))-1.27,x1:Math.max(...b.points.map(q=>q[0]))+1.27,z0:Math.min(...b.points.map(q=>q[2]))-1.27,z1:Math.max(...b.points.map(q=>q[2]))+1.27}));
 for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i);for(const s of near){const dx=s.b[0]-s.a[0],dz=s.b[2]-s.a[2],t=Math.max(0,Math.min(1,((x-s.a[0])*dx+(z-s.a[2])*dz)/(dx*dx+dz*dz||1)));assert.ok(Math.hypot(x-s.a[0]-t*dx,z-s.a[2]-t*dz)>s.width/2+.179);}for(const b of roofs)assert.ok(x<=b.x0||x>=b.x1||z<=b.z0||z>=b.z1);}
});
test('prior trees and stone boundary owners suppress duplicates; missing support fails closed',()=>{
 const f=fixture(),[x,z]=upperAccessR95Roots[1];f.colliders.push({type:'cylinder',args:[x,z,.4,40,80,'forest_tree']});const r=build(f);assert.equal(r.trees.length,2);assert.ok(r.skipped.some(s=>s.kind==='tree'));
 const empty=fixture();empty.options={};assert.equal(build(empty).built,false);assert.equal(empty.root.children.length,0);assert.equal(empty.colliders.length,0);
 const blocked=fixture();blocked.colliders.push({type:'box',args:[108,-18,20,10,0,0,100,'existing_balustrade_owner']});const result=build(blocked);assert.equal(result.edges.length,0);assert.equal(result.posts.length,0);
});
