import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from 'three';
import {buildOmotesandoNoticeR96,omotesandoNoticeIdR96} from './omotesando-notice-r96.mjs';
import {SpatialCollisionWorld} from './collision.mjs';
const features=JSON.parse(readFileSync(new URL('../geography/features.json',import.meta.url))),height=(x,z)=>34+x*.01+z*.04;
test('source open roof is replaced by bounded roofed panel with successful ownership ids',()=>{
 const root=new THREE.Group(),colliders=[],r=buildOmotesandoNoticeR96(root,features,{height},{},colliders);assert.deepEqual(r.builtIds,[omotesandoNoticeIdR96]);assert.equal(r.drawBatches,3);assert.equal(r.collidersAdded,3);assert.ok(Math.abs(r.width-.949)<1e-6);assert.ok(Math.abs(r.depth-1.402)<1e-6);assert.equal(r.supports.length,2);assert.ok(r.triangles<500);
 const bounds=new THREE.Box3().setFromObject(r.group);assert.ok(bounds.min.x>=-149.407-.0001&&bounds.max.x<=-148.458+.0001);assert.ok(bounds.min.z>=4.698-.0001&&bounds.max.z<=6.1+.0001);assert.ok(bounds.max.y<r.base+3);
 assert.equal(buildOmotesandoNoticeR96(root,features,{height},{},colliders).group,r.group);assert.equal(colliders.length,3);
});
test('both timber uprights bury into actual terrain and roof contacts tie and gable frame',()=>{
 const root=new THREE.Group(),r=buildOmotesandoNoticeR96(root,features,{height});for(const p of r.supports){assert.ok(p.bottom<height(p.x,p.z));assert.equal(p.top,r.eave);}assert.ok(r.ridge>r.eave);
 const mesh=root.getObjectByName('R96 notice uninscribed pale panel'),b=new THREE.Box3().setFromObject(mesh);assert.ok(b.min.y>r.base+.6);assert.ok(b.max.y<r.eave);
 root.traverse(o=>{if(o.isMesh)for(const v of o.geometry.attributes.position.array)assert.ok(Number.isFinite(v));});
});
test('fixed prop collision stays inside roof footprint and preserves mapped approach',()=>{
 const colliders=[],r=buildOmotesandoNoticeR96(new THREE.Group(),features,{height},{},colliders),world=new SpatialCollisionWorld();for(const c of colliders){world.addBox(...c.args);const [x,z,hx,hz]=c.args;assert.ok(x-hx>=-149.407&&x+hx<=-148.458);assert.ok(z-hz>=4.698&&z+hz<=6.1);}
 const path=features.paths.find(p=>p.id==='way/105449722');for(let j=1;j<path.points.length;j++){const a=path.points[j-1],b=path.points[j];for(let i=0;i<=60;i++){const x=a[0]+(b[0]-a[0])*i/60,z=a[2]+(b[2]-a[2])*i/60,v=world.resolvePlayer(x,height(x,z)+1.7,z);assert.ok(Math.hypot(v.x-x,v.z-z)<1e-7);}}
 assert.equal(r.sourceId,omotesandoNoticeIdR96);
});
test('missing/invalid source does not claim replacement ownership',()=>{
 assert.deepEqual(buildOmotesandoNoticeR96(new THREE.Group(),{buildings:[]},{height}).builtIds,[]);
 assert.throws(()=>buildOmotesandoNoticeR96(new THREE.Group(),features,{height:()=>NaN}),/Nonfinite/);
});
