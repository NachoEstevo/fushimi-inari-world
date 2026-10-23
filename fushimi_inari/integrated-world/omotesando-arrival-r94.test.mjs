import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from 'three';
import {omotesandoArrivalLayoutR94,buildOmotesandoArrivalR94} from './omotesando-arrival-r94.mjs';
const features=JSON.parse(readFileSync(new URL('../geography/features.json',import.meta.url)));
test('crossing anchor uses real shared road/approach node and starts before first gate',()=>{
 const l=omotesandoArrivalLayoutR94(features);assert.equal(l.sourceNode,749327076);assert.deepEqual(l.center,[-157.407,10.342]);assert.ok(l.spawn.lookAt[0]-l.center[0]>18);assert.equal(l.stripes.length,6);
 for(const s of l.stripes)assert.ok(Math.abs((s.center[0]-l.center[0])*l.across[0]+(s.center[1]-l.center[1])*l.across[1])+s.width/2<l.roadWidth/2);
});
test('curb ends leave a five metre flush crossing aperture',()=>{
 const l=omotesandoArrivalLayoutR94(features);for(const c of l.curbs){const dx=c.center[0]-l.center[0],dz=c.center[1]-l.center[1],v=dx*l.along[0]+dz*l.along[1];assert.ok(Math.abs(v)-c.length/2>=2.5-1e-8);}
});
test('surface batches follow slopes, have upward tops and repeated build is idempotent',()=>{
 const root=new THREE.Group(),surface={height:(x,z)=>20+x*.02+z*.01},meta=buildOmotesandoArrivalR94(root,features,surface);assert.equal(meta.drawBatches,3);assert.equal(meta.collidersAdded,0);
 assert.equal(buildOmotesandoArrivalR94(root,features,surface),meta);assert.equal(root.children.length,1);
 for(const mesh of root.children[0].children){const pos=mesh.geometry.attributes.position;for(let i=0;i<pos.count;i++)assert.ok(Number.isFinite(pos.getY(i)));}
 for(const mesh of root.children[0].children.slice(0,2)){const n=mesh.geometry.attributes.normal;for(let i=0;i<n.count;i++)assert.ok(n.getY(i)>.99);}
});
test('missing geography is explicit and invalid height fails visibly',()=>{assert.equal(omotesandoArrivalLayoutR94({paths:[]}),null);assert.throws(()=>buildOmotesandoArrivalR94(new THREE.Group(),features,{height:()=>NaN}),/Nonfinite/);});

test('user-reviewed zebra rotates 90 degrees while road, gutter and curb axes stay unchanged',()=>{
 const l=omotesandoArrivalLayoutR94(features);
 assert.ok(l.along[1]<-.99);assert.ok(l.across[0]>.99);
 for(const stripe of l.stripes){assert.equal(stripe.width,3.6);assert.equal(stripe.length,.43);const dx=stripe.center[0]-l.center[0],dz=stripe.center[1]-l.center[1];assert.ok(Math.abs(dx*l.across[0]+dz*l.across[1])<1e-8);}
 const first=l.stripes[0].center,last=l.stripes.at(-1).center;assert.ok(Math.abs((last[0]-first[0])*l.across[0]+(last[1]-first[1])*l.across[1])<1e-8);
 assert.equal(l.gutters[0].length,26);assert.equal(l.curbs[0].width,.16);
 const root=new THREE.Group();buildOmotesandoArrivalR94(root,features,{height:()=>0});const p=root.children[0].children[0].geometry.attributes.position;
 // Actual first band long edge is across the road rather than along it.
 const dx=p.getX(1)-p.getX(0),dz=p.getZ(1)-p.getZ(0);assert.ok(Math.abs(dx*l.across[0]+dz*l.across[1]-3.6)<1e-4);assert.ok(Math.abs(dx*l.along[0]+dz*l.along[1])<1e-4);
});
