import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import * as THREE from 'three';
import {upperEnclosureR96Runs,buildUpperEnclosureR96,buildUpperEnclosureR96Async} from './upper-enclosure-r96.mjs';
import {pathWidth} from '../geography/geo-core.mjs';
import {subtractConvex,polygonArea} from './entrance-area-surfaces-layout.mjs';
const features=JSON.parse(fs.readFileSync(new URL('../geography/features.json',import.meta.url)));
function fixture(){const y=(x,z)=>50+x*.02-z*.03,p=(x,z)=>[x,y(x,z),z];return{root:new THREE.Group(),features,network:{},materials:{stoneMat:new THREE.MeshStandardMaterial(),vermilionMat:new THREE.MeshStandardMaterial(),roofMat:new THREE.MeshStandardMaterial()},colliders:[],options:{terrainPositions:[...p(115,-33),...p(115,-20),...p(132,-33),...p(132,-33),...p(115,-20),...p(132,-20)]},y};}
const build=f=>buildUpperEnclosureR96(f.root,f.features,f.network,f.materials,f.colliders,f.options);
test('three mapped Byakkosha returns preserve open south forecourt and main rear',()=>{const f=fixture(),before=JSON.stringify(features),r=build(f);assert.equal(r.built,true);assert.equal(r.runs.length,3);assert.ok(r.sections.length>=30);assert.ok(r.triangles<5000);assert.equal(r.drawBatches,3);assert.equal(r.newColliders,r.sections.length);assert.equal(JSON.stringify(features),before);assert.equal(build(f),r);for(const s of r.sections){assert.ok(s.z< -21.85);for(let i=0;i<4;i++)assert.ok(Math.abs(s.support[i]-f.y(...s.footprint[i]))<1e-6);assert.ok(s.bottom<Math.min(...s.support));}f.root.traverse(o=>{if(o.isMesh)assert.ok([...o.geometry.attributes.position.array].every(Number.isFinite));});});
test('every complete boundary section excludes actual mapped public route and roof envelopes',()=>{const f=fixture(),r=build(f);for(const s of r.sections){const area=Math.abs(polygonArea(s.footprint));for(const p of features.paths)for(let i=1;i<p.points.length;i++){const a=p.points[i-1],b=p.points[i],dx=b[0]-a[0],dz=b[2]-a[2],l=Math.hypot(dx,dz);if(!l)continue;const nx=-dz/l,nz=dx/l,w=pathWidth(p.tags??{})/2+.3,c=[[a[0]+nx*w,a[2]+nz*w],[b[0]+nx*w,b[2]+nz*w],[b[0]-nx*w,b[2]-nz*w],[a[0]-nx*w,a[2]-nz*w]];assert.ok(area-subtractConvex(s.footprint,c).reduce((s,p)=>s+Math.abs(polygonArea(p)),0)<1e-6);}for(const [x,z]of s.footprint)for(const b of features.buildings){const xs=b.points.map(p=>p[0]),zs=b.points.map(p=>p[2]);assert.ok(x<=Math.min(...xs)-1.25||x>=Math.max(...xs)+1.25||z<=Math.min(...zs)-1.25||z>=Math.max(...zs)+1.25);}}});
test('rendered support and existing solid ownership withhold unsupported or duplicate sections',()=>{const f=fixture();f.options={};assert.equal(build(f).built,false);assert.equal(f.colliders.length,0);const g=fixture();g.colliders.push({type:'box',args:[123,-26,20,20,0,0,100,'prior_owner']});assert.equal(build(g).built,false);assert.equal(g.colliders.length,1);const h=fixture();h.options.terrainPositions=[115,50,-33,115,50,-32,116,50,-33];assert.equal(build(h).built,false);});
test('resolved junction triangles override source route widths without barrier slivers',()=>{const f=fixture();f.network.segments=[{a:[90,0,0],b:[91,0,0],width:1,accessJunctionTriangles:[110,50,-40,110,50,-10,140,50,-40,140,50,-40,110,50,-10,140,50,-10]}];assert.equal(build(f).built,false);assert.equal(f.colliders.length,0);});
test('run endpoints derive from mapped Byakkosha bounds and unavailable owner creates nothing',()=>{assert.deepEqual(upperEnclosureR96Runs({buildings:[]}),[]);const runs=upperEnclosureR96Runs(features);assert.equal(runs[0].a[0],117.42099999999999);assert.ok(runs.every(r=>r.a[0]<130&&r.b[0]<130));});

function enclosureDigest(f,record){
 const hash=createHash('sha256');f.root.traverse(o=>{if(!o.isMesh)return;hash.update(o.name);for(const key of Object.keys(o.geometry.attributes).sort()){hash.update(key);hash.update(Buffer.from(o.geometry.attributes[key].array.buffer));}if(o.geometry.index)hash.update(Buffer.from(o.geometry.index.array.buffer));});hash.update(JSON.stringify(record));hash.update(JSON.stringify(f.colliders));return hash.digest('hex');
}
test('boundary broad phase and paced construction retain complete original native buffers, records and colliders',async()=>{
 for(const typed of [false,true])for(const paced of [false,true]){
  const f=fixture();if(typed)f.options.terrainPositions=new Float32Array(f.options.terrainPositions);let time=0,yields=0;
  const options={...f.options,clock:()=>time+=33,yieldWork:async()=>{yields++;assert.equal(f.root.children.length,0);assert.equal(f.colliders.length,0);await new Promise(setImmediate);}};
  const record=await (paced?buildUpperEnclosureR96Async:buildUpperEnclosureR96)(f.root,f.features,f.network,f.materials,f.colliders,options);
  // Whole output captured before bounds rejection and cooperative construction.
  assert.equal(enclosureDigest(f,record),typed?'1d94e2fe709ac86f93e3eb28150e542b6b65546bda479ad278ab1396802ee508':'f0430ae5870e2314a99b1a195f5828511b590c27ce73f6e4543faf38ccb6ddbd');if(paced)assert.ok(yields>2);
 }
});
test('remote resolved paths are ignored while their independently overlapping junction cut is retained',()=>{
 const f=fixture();f.network.segments=Array.from({length:1000},(_,i)=>({a:[1000+i*2,0,1000],b:[1001+i*2,0,1001],width:1}));
 const clear=build(f);assert.ok(clear.sections.length>30);
 const blocked=fixture();blocked.network.segments=[...f.network.segments,{a:[900,0,900],b:[901,0,900],width:1,accessJunctionTriangles:[110,50,-40,110,50,-10,140,50,-40,140,50,-40,110,50,-10,140,50,-10]}];
 assert.equal(build(blocked).built,false);assert.equal(blocked.colliders.length,0);
});
test('interrupted boundary preparation does not publish partial scenery or solids',async()=>{
 const f=fixture(),error=Error('cancelled preparation');let time=0;
 await assert.rejects(buildUpperEnclosureR96Async(f.root,f.features,f.network,f.materials,f.colliders,{...f.options,clock:()=>time+=33,yieldWork:()=>Promise.reject(error)}),value=>value===error);
 assert.equal(f.root.children.length,0);assert.equal(f.colliders.length,0);
});
