import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import * as THREE from 'three';
import {buildRomonPrecinctR94,romonDripApronR94 as spec} from './romon-precinct-r94.mjs';
import * as romonBuilders from './romon-precinct-r94.mjs';
import {rigidPoint} from './spatial.mjs';
const anchor={source:[0,1.6,0],target:[12,43,-5],yaw:-1.51};
const world=(x,z)=>{const p=rigidPoint([x,0,z],anchor.source,anchor.target,anchor.yaw);return [p[0],p[2]];};
const y=(x,z)=>37+.11*x+.07*z;
function fixture(){
 const corners=[[-30,-10],[-30,10],[0,-10],[0,10]].map(p=>world(...p));
 const terrain=[0,1,2,2,1,3].flatMap(i=>[corners[i][0],y(...corners[i]),corners[i][1]]);
 return {root:new THREE.Group(),features:{buildings:[],water:[]},network:{segments:[]},materials:{stoneMat:new THREE.MeshStandardMaterial()},options:{terrainPositions:terrain}};
}
const build=f=>buildRomonPrecinctR94(f.root,anchor,f.features,f.network,f.materials,f.options);
test('north drip apron uses exact transformed rendered triangle planes and a single static batch',()=>{
 const f=fixture(),existing=new THREE.Group();f.root.add(existing);const record=build(f);assert.ok(record.built);assert.ok(record.area>6&&record.area<6.4);assert.equal(record.materialBatches,1);assert.equal(record.collidersAdded,0);
 const mesh=f.root.children[1],p=mesh.geometry.attributes.position;
 for(let i=0;i<p.count;i++)assert.ok(Math.abs(p.getY(i)-y(p.getX(i),p.getZ(i))-.006)<.00001);
 assert.equal(build(f),record);assert.equal(f.root.children.length,2);assert.equal(f.root.children[0],existing);
 assert.ok(spec.x1<=-5.6);assert.ok(spec.z0> -2.955);assert.ok(spec.z1< -2.31);
});
test('mapped crossing clears the entire ribbon and neighboring footprint cuts the stone',()=>{
 const f=fixture(),a=world(-13,-5),b=world(-13,0);
 f.network.segments=[{a:[a[0],0,a[1]],b:[b[0],0,b[1]],width:2,id:'crossing'}];
 const full=build(fixture()).area,record=build(f);assert.ok(record.area<full-1);
 // Every rendered triangle centroid remains outside a path's padded corridor.
 const p=f.root.children[0].geometry.attributes.position,dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz);
 for(let i=0;i<p.count;i+=3){let x=0,z=0;for(let j=0;j<3;j++){x+=p.getX(i+j)/3;z+=p.getZ(i+j)/3;}assert.ok(Math.abs((x-a[0])*dz-(z-a[1])*dx)/length>=1.15-1e-5);}
 const g=fixture(),ring=[world(-18,-3),world(-15,-3),world(-15,-2),world(-18,-2)];g.features.buildings=[{id:'neighbor',points:ring.map(p=>[p[0],0,p[1]])}];assert.ok(build(g).area<full-1);
});
test('missing or corrupt terrain never inserts unsupported geometry',()=>{
 const f=fixture();delete f.options.terrainPositions;assert.equal(build(f).built,false);assert.equal(f.root.children.length,0);
 f.options.terrainPositions=[NaN,0,0];assert.throws(()=>build(f),/Invalid/);assert.equal(f.root.children.length,0);
});

test('remote Romon terrain bypasses triangle allocations and whole-input iterator copies',()=>{
 const f=fixture(),vertices=new Float64Array([1000,40,1000,1001,40,1000,1000,40,1001]);
 vertices[Symbol.iterator]=()=>{throw Error('whole terrain iterator copied');};
 vertices.slice=()=>{throw Error('remote triangle allocated');};
 f.options.terrainPositions=vertices;assert.equal(build(f).built,false);assert.equal(f.root.children.length,0);
});

test('Romon terrain validation retains rejection of sparse and nonfinite triangles',()=>{
 for(const terrainPositions of [Array(9),[0,0,0,1,Infinity,0,0,0,1],new Float64Array([0,0,0,1,0,0,0,NaN,1])]){
  const f=fixture();f.options.terrainPositions=terrainPositions;assert.throws(()=>build(f),/Invalid/);assert.equal(f.root.children.length,0);
 }
});

function apronHash(f){
 const mesh=f.root.children[0],hash=createHash('sha256');
 for(const [name,attribute]of Object.entries(mesh.geometry.attributes).sort(([a],[b])=>a.localeCompare(b))){hash.update(name);hash.update(Buffer.from(attribute.array.buffer));}
 hash.update(JSON.stringify(mesh.userData));return hash.digest('hex');
}
const originalApronHash='946077baadd8c3a4da6e53811d3eeb8da6ac16ea1f37a423d8872db32c6c6a78';
test('Romon apron preserves complete original positions, normals, UVs and metadata',()=>{
 const f=fixture();build(f);assert.equal(apronHash(f),originalApronHash);
});
test('paced Romon apron releases the terrain scan before publishing exact original geometry',async()=>{
 const f=fixture(),far=Array.from({length:1100},()=>[1000,40,1000,1001,40,1000,1000,40,1001]).flat();
 let elapsed=0,yields=0;
 const record=await romonBuilders.buildRomonPrecinctR94Async(f.root,anchor,f.features,f.network,f.materials,{terrainPositions:[...far,...f.options.terrainPositions],clock:()=>elapsed+=33,yieldWork:async()=>{yields++;assert.equal(f.root.children.length,0);}});
 assert.ok(yields>=4);assert.equal(record.built,true);assert.equal(apronHash(f),originalApronHash);
 assert.equal(await romonBuilders.buildRomonPrecinctR94Async(f.root,anchor,f.features,f.network,f.materials),record);assert.equal(f.root.children.length,1);
});
test('failed Romon preparation yields do not attach incomplete geometry',async()=>{
 const f=fixture();let elapsed=0;
 await assert.rejects(romonBuilders.buildRomonPrecinctR94Async(f.root,anchor,f.features,f.network,f.materials,{...f.options,clock:()=>elapsed+=33,yieldWork:async()=>{throw Error('preparation interrupted');}}),/preparation interrupted/);
 assert.equal(f.root.children.length,0);
});
