import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import {buildOsugiShrine} from './osugi-shrine.mjs';
import {SpatialCollisionWorld} from './collision.mjs';
const features=JSON.parse(fs.readFileSync(new URL('../geography/features.json',import.meta.url)));
test('Osugi restores the mapped dead-end destination with clear access and bounded static batches',()=>{
 const root=new THREE.Group(),colliders=[],surfaces={height:()=>155,terrainHeight:()=>154.7};
 const result=buildOsugiShrine(root,features,surfaces,{},colliders);
 assert.equal(result.id,'way/342401488');assert.deepEqual(result.entrance,features.paths.find(p=>p.id==='way/1268937960').points.at(-1));
 assert.ok(result.stats.triangles<5000);assert.ok(result.stats.batches<=8);
 const world=new SpatialCollisionWorld();for(const c of colliders)world.addBox(...c.args);
 const path=features.paths.find(p=>p.id==='way/1268937960'),[a,b]=path.points;
 for(let i=0;i<=100;i++){
   const t=i/100,x=a[0]+(b[0]-a[0])*t,z=a[2]+(b[2]-a[2])*t,q=world.resolvePlayer(x,156.7,z);
   assert.ok(Math.hypot(q.x-x,q.z-z)<1e-7,`blocked at ${t}`);
 }
 assert.equal(buildOsugiShrine(root,features,surfaces,{},colliders),null);
 assert.equal(root.children.length,1);
});
