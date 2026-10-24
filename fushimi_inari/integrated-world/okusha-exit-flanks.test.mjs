import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import {makePathSurfaces} from './path-surfaces.mjs';
import {SpatialCollisionWorld} from './collision.mjs';
import {buildOkushaExitFlanks} from './okusha-exit-flanks.mjs';
const features=JSON.parse(fs.readFileSync(new URL('../geography/features.json',import.meta.url)));
test('exit banks stay outside mapped public walking widths and remain static and bounded',()=>{
 const root=new THREE.Group(),colliders=[],m={entryStoneMat:new THREE.MeshStandardMaterial(),stoneMat:new THREE.MeshStandardMaterial()},network=makePathSurfaces(features,()=>62.4);
 const r=buildOkushaExitFlanks(root,m,()=>62.4,network,colliders);
 assert.ok(r.sections>10);assert.equal(r.batches,2);assert.ok(r.triangles<5000);
 const world=new SpatialCollisionWorld();for(const c of colliders)world.addBox(...c.args);
 for(const s of network.segments){if(s.a[0]<235||s.a[0]>255||s.a[2]<60||s.a[2]>78)continue;
  for(const t of [0,.5,1]){const dx=s.b[0]-s.a[0],dz=s.b[2]-s.a[2],len=Math.hypot(dx,dz);for(const side of [-1,0,1]){
   const off=side*(s.width/2-.28),x=s.a[0]+dx*t-dz/len*off,z=s.a[2]+dz*t+dx/len*off,q=world.resolvePlayer(x,64.24,z);
   assert.ok(Math.hypot(q.x-x,q.z-z)<1e-7);
  }}
 }
 assert.equal(buildOkushaExitFlanks(root,m,()=>62.4,network,colliders),null);
});
