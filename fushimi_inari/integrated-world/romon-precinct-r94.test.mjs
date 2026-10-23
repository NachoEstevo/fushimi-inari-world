import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {buildRomonPrecinctR94,romonDripApronR94 as spec} from './romon-precinct-r94.mjs';
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
