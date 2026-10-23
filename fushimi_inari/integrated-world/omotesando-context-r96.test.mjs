import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from 'three';
import {buildOmotesandoContextR96,omotesandoContextLayoutR96} from './omotesando-context-r96.mjs';
import {SpatialCollisionWorld} from './collision.mjs';
const features=JSON.parse(readFileSync(new URL('../geography/features.json',import.meta.url)));
const height=(x,z)=>30+x*.035+z*.02+.012*Math.sin(x*2);
test('junction anchored street packet has all four observed layers and bounded batches',()=>{
 const root=new THREE.Group(),colliders=[],meta=buildOmotesandoContextR96(root,features,{height},{},colliders);
 assert.equal(meta.built,true);assert.equal(meta.sourceNode,749327076);assert.equal(meta.utilityBuilt,true);assert.equal(meta.drawBatches,4);assert.equal(colliders.length,1);
 assert.equal(buildOmotesandoContextR96(root,features,{height},{},colliders),meta);assert.equal(colliders.length,1);
 root.traverse(o=>{if(o.isMesh)for(const n of o.geometry.attributes.position.array)assert.ok(Number.isFinite(n));});
});
test('flush street overlays sample actual surface at every emitted vertex and face upward',()=>{
 const root=new THREE.Group();buildOmotesandoContextR96(root,features,{height});
 for(const name of ['road edge paint','grates and utility metal','drain slots']){const mesh=root.getObjectByName('R96 '+name),p=mesh.geometry.attributes.position,n=mesh.geometry.attributes.normal;let groundVertices=0;for(let i=0;i<p.count;i++){const offset=p.getY(i)-height(p.getX(i),p.getZ(i));if(offset<.05){assert.ok(offset>=.0239&&offset<=.0281);assert.ok(n.getY(i)>.97);groundVertices++;}}assert.ok(groundVertices>100);}
});
test('pole collider preserves approach, road crossing and adjacent walking lanes',()=>{
 const root=new THREE.Group(),colliders=[],world=new SpatialCollisionWorld();buildOmotesandoContextR96(root,features,{height},{},colliders);for(const c of colliders)world.addCylinder(...c.args);
 const layout=omotesandoContextLayoutR96(features);for(let u=-3;u<=10;u+=.2)for(const v of [-2,0,2]){const [x,z]=layout.at(u,v),r=world.resolvePlayer(x,height(x,z)+1.7,z);assert.ok(Math.hypot(r.x-x,r.z-z)<1e-7);}
});
test('utility omission respects mapped building ownership instead of forcing its position',()=>{
 const l=omotesandoContextLayoutR96(features),[x,z]=l.poleRoot,blocked={...features,buildings:[...features.buildings,{points:[[x-1,0,z-1],[x+1,0,z-1],[x+1,0,z+1],[x-1,0,z+1]]}]},colliders=[];
 const meta=buildOmotesandoContextR96(new THREE.Group(),blocked,{height},{},colliders);assert.equal(meta.utilityBuilt,false);assert.equal(colliders.length,0);assert.equal(meta.drawBatches,3);
});
test('unregistered remote supports leave no floating wire geometry',()=>{
 const root=new THREE.Group(),meta=buildOmotesandoContextR96(root,features,{height});
 assert.equal(meta.conductorsBuilt,false);
 const slots=root.getObjectByName('R96 drain slots').geometry.attributes.position;
 for(let i=0;i<slots.count;i++)assert.ok(Math.abs(slots.getY(i)-height(slots.getX(i),slots.getZ(i))-.024)<.0001);
 // All concrete hardware is supported by the one pole or its two crossarms.
 const p=root.getObjectByName('R96 street utility pole').geometry.attributes.position,l=omotesandoContextLayoutR96(features);
 for(let i=0;i<p.count;i++)assert.ok(Math.hypot(p.getX(i)-l.poleRoot[0],p.getZ(i)-l.poleRoot[1])<.9);
});
