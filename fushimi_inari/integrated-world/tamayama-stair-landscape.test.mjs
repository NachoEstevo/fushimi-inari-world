import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import {buildTamayamaStairLandscape,tamayamaBankRoots,tamayamaBankLantern} from './tamayama-stair-landscape.mjs';
import {pathWidth} from '../geography/geo-core.mjs';
const features=JSON.parse(fs.readFileSync(new URL('../geography/features.json',import.meta.url)));
const make=(f=features,colliders=[])=>{
  const root=new THREE.Group(),surfaces={terrainHeight:(x,z)=>48+(x-80)*.04},materials={stoneMat:new THREE.MeshStandardMaterial()};
  return {root,colliders,run:()=>buildTamayamaStairLandscape(root,f,surfaces,materials,colliders)};
};
test('bank remains south of west stair, clear of mapped routes, with one independent landmark lantern',()=>{
  const {run,colliders}=make(),record=run();assert.equal(record.trees.length,3);assert.ok(record.fence.length>30);assert.deepEqual(record.lantern.point.filter((_,i)=>i!==1),tamayamaBankLantern);
  for(const r of record.fence){assert.ok(r.a[0]>=78&&r.a[0]<=93.5);assert.ok(r.a[2]>-31&&r.a[2]<-30);}
  const ids=new Set(['way/105449693','way/1133055112','way/1133055111','way/649175020']);
  for(const c of colliders){const [x,z]=c.args;for(const path of features.paths)for(let i=1;i<path.points.length;i++){
    const a=path.points[i-1],b=path.points[i],dx=b[0]-a[0],dz=b[2]-a[2],t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[2])*dz)/(dx*dx+dz*dz||1))),width=ids.has(path.id)?4.8:pathWidth(path.tags??{});
    assert.ok(Math.hypot(x-a[0]-dx*t,z-a[2]-dz*t)>width/2+.1,'new solid inside mapped public walking envelope');
  }}
  assert.ok(record.triangles<18000);assert.equal(record.drawBatches,6);
});
test('finite static meshes and colliders do not alter canonical source geometry or existing surfaces',()=>{
  const before=JSON.stringify(features),{root,colliders,run}=make();run();assert.equal(JSON.stringify(features),before);
  root.traverse(o=>{if(o.isMesh)assert.ok(Array.from(o.geometry.attributes.position.array).every(Number.isFinite));});
  assert.ok(colliders.every(c=>c.args.slice(0,-1).every(Number.isFinite)));
});
test('existing tree/lantern owners are preserved and prevent duplicates',()=>{
  const [x,z]=tamayamaBankRoots[0],prior=[{type:'cylinder',args:[x,z,.25,40,55,'mapped_tree']},{type:'box',args:[...tamayamaBankLantern,.6,.6,0,40,55,'existing_stone_lantern']}],before=JSON.stringify(prior);
  const {run}=make(features,prior),record=run();assert.equal(record.trees.length,2);assert.equal(record.lantern,null);assert.equal(JSON.stringify(prior.slice(0,2)),before);assert.equal(record.skipped[0].reason,'existing tree owner');
});
test('idempotence and missing-source handoff prevent duplicated geometry/colliders',()=>{
  const {root,colliders,run}=make(),first=run(),count=colliders.length;assert.equal(run(),first);assert.equal(root.children.length,1);assert.equal(colliders.length,count);
  const missing=make({...features,paths:features.paths.filter(p=>p.id!=='way/105449693')});assert.equal(missing.run().reason,'Main stair source unavailable');assert.equal(missing.root.children.length,0);
});


test('source-backed lower branch layer fills bank without additional trunks or solid obstacles',()=>{
  const {root,colliders,run}=make(),record=run();
  assert.equal(record.understory.length,4);
  assert.ok(record.understory.reduce((n,c)=>n+c.cards,0)>2200);
  assert.deepEqual(record.trees.map(t=>[t.point[0],t.point[2]]),tamayamaBankRoots);
  assert.equal(colliders.filter(c=>c.args.at(-1)==='tamayama_bank_tree').length,3);
  assert.equal(record.newColliders,64);assert.equal(record.drawBatches,6);
  const foliage=root.children[0].children.find(o=>o.geometry.attributes.color);
  const p=foliage.geometry.attributes.position,c=foliage.geometry.attributes.color;
  assert.equal(p.count,c.count);assert.equal(p.count,foliage.geometry.attributes.uv.count);
  // Low growth must stay south of the public flight and west of the court;
  // high mature crowns are permitted to overhang above walking headroom.
  let low=0;
  for(let i=0;i<p.count;i++){
    const x=p.getX(i),y=p.getY(i),z=p.getZ(i),ground=48+(x-80)*.04-.06;
    if(y-ground>3.5)continue;
    low++;assert.ok(x>78.2&&x<94.8&&z>-30.8&&z<-22.2);
    assert.ok(z>-31.1,'low branch intrudes onto main flight');
    for(const path of features.paths)for(let j=1;j<path.points.length;j++){
      const a=path.points[j-1],b=path.points[j],dx=b[0]-a[0],dz=b[2]-a[2],t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[2])*dz)/(dx*dx+dz*dz||1)));
      const width=['way/105449693','way/1133055112','way/1133055111','way/649175020'].includes(path.id)?4.8:pathWidth(path.tags??{});
      assert.ok(Math.hypot(x-a[0]-t*dx,z-a[2]-t*dz)>width/2+.1,'actual low leaf vertex enters mapped route');
    }
  }
  assert.ok(low>5000,'low layer absent from actual geometry');
});
