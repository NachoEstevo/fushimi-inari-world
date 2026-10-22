import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import {southShinmeshaLayout,buildTamayamaSouthShinmesha,SOUTH_SHINMESHA_ID} from './tamayama-south-shinmesha.mjs';
import {SpatialCollisionWorld} from './collision.mjs';
const features=JSON.parse(fs.readFileSync(new URL('../geography/features.json',import.meta.url)));
test('southern horse is registered separately from smaller Tamayama horse',()=>{
 const p=southShinmeshaLayout(features);assert.equal(p.id,SOUTH_SHINMESHA_ID);assert.deepEqual(p.center,[94.577,-6.451]);assert.ok(p.width>5&&p.depth>4.7);assert.match(p.heightStatus,/not surveyed/);
 assert.equal(southShinmeshaLayout({buildings:[]}),null);
});
test('batched architecture is finite, idempotent and preserves mapped east continuation',()=>{
 const root=new THREE.Group(),colliders=[],before=JSON.stringify(features),stats=buildTamayamaSouthShinmesha(root,{},features,{height:()=>50.1},colliders);
 assert.ok(stats.built);assert.deepEqual(stats.builtIds,[SOUTH_SHINMESHA_ID]);assert.ok(stats.batches<=9);assert.ok(stats.triangles<7000);
 root.traverse(o=>{if(!o.isMesh)return;for(const key of ['position','normal','uv'])for(const n of o.geometry.attributes[key].array)assert.ok(Number.isFinite(n));});
 const roof=root.children[0].children.find(o=>o.material.color.getHexString()==='737a70');assert.ok(roof);const normals=roof.geometry.attributes.normal;for(let i=0;i<normals.count;i++)assert.ok(normals.getY(i)>0,'roof triangle faces inward');
 const world=new SpatialCollisionWorld();for(const c of colliders)world.addBox(...c.args);
 const path=features.paths.find(p=>p.id==='way/1385037576');let samples=0;
 for(let i=1;i<path.points.length;i++){const a=path.points[i-1],b=path.points[i],dx=b[0]-a[0],dz=b[2]-a[2],len=Math.hypot(dx,dz),n=Math.ceil(len/.15);for(let j=0;j<=n;j++)for(const offset of [-.45,0,.45]){const x=a[0]+dx*j/n-dz/len*offset,z=a[2]+dz*j/n+dx/len*offset,p=world.resolvePlayer(x,51.8,z);assert.ok(Math.hypot(p.x-x,p.z-z)<.001);samples++;}}
 assert.ok(samples>500);assert.equal(colliders.length,1);assert.equal(buildTamayamaSouthShinmesha(root,{},features,{height:()=>0},colliders),stats);assert.equal(colliders.length,1);assert.equal(JSON.stringify(features),before);
});
test('foundation reaches actual rendered terrain beneath rotated footprint',()=>{
 const root=new THREE.Group(),p=southShinmeshaLayout(features),[x,z]=p.center;
 const vertices=[x-8,48,z-8,x+8,49,z-8,x,48.5,z+8];
 const stats=buildTamayamaSouthShinmesha(root,{},features,{height:()=>50.1},[],{terrainPositions:vertices});assert.equal(stats.foundationBottom,47.96);
 root.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(root);assert.ok(Math.abs(bounds.min.y-47.96)<.00001);
});
test('missing or invalid geometry inputs leave owner and collider list untouched',()=>{
 for(const [f,s]of [[{buildings:[]},{height:()=>50}],[features,{height:()=>NaN}]]){const root=new THREE.Group(),c=[];assert.equal(buildTamayamaSouthShinmesha(root,{},f,s,c).built,false);assert.equal(root.children.length,0);assert.equal(c.length,0);}
});
