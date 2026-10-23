import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import {buildYotsutsujiContextR95,yotsutsujiContextPlanR95} from './yotsutsuji-context-r95.mjs';
import {teaHouses} from './yotsutsuji.mjs';
const features=JSON.parse(fs.readFileSync(new URL('../geography/features.json',import.meta.url)));
const owner=()=>{const root=new THREE.Group(),old=new THREE.Group();old.name='Yotsutsuji mapped tea houses';root.add(old);return {root,old};};

test('registered facade frames preserve mapped ring directions and accepted tea-house floors',()=>{
 const before=JSON.stringify(features),frames=yotsutsujiContextPlanR95(features);
 assert.equal(frames.length,2);
 assert.equal(teaHouses.find(b=>b.id==='way/301527779').front,'west','main facade and attachments must share the observed L-shaped court');
 assert.deepEqual(frames.map(f=>[f.id,f.edge,f.floor]),[['way/301527779',0,164.35],['way/626313775',7,163.45]]);
 for(const f of frames){
  const b=features.buildings.find(b=>b.id===f.id),a=b.points[f.edge],end=b.points[f.edge+1];
  assert.deepEqual(f.world(0,0,0),[a[0],f.floor,a[2]]);
  const q=f.world(f.length,0,0);assert.ok(Math.hypot(q[0]-end[0],q[2]-end[2])<1e-10);
  if(f.id==='way/301527779')assert.ok(f.world(0,1,0)[0]<a[0],'main attachment faces west into court');
  else assert.ok(f.world(0,1,0)[2]<a[2],'annex attachment faces north into court');
 }
 assert.equal(JSON.stringify(features),before);
});

test('bounded above-head attachments leave the existing owner and geographic source intact',()=>{
 const {root,old}=owner(),before=JSON.stringify(features),sentinel=new THREE.Mesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshStandardMaterial());old.add(sentinel);
 const original=sentinel.geometry.attributes.position.array.slice();
 const result=buildYotsutsujiContextR95(root,features);
 assert.equal(result.built,true);assert.equal(result.collidersAdded,0);assert.equal(result.terrainChanged,false);
 assert.equal(result.stats.batches,5);assert.ok(result.stats.triangles<1500);
 assert.equal(result.awnings.length,3);assert.ok(result.awnings.every(a=>a.minHeight>2.8));
 assert.equal(root.children.length,2);assert.equal(sentinel.parent,old);assert.deepEqual(sentinel.geometry.attributes.position.array,original);
 const group=root.children[1];let count=0;
 for(const mesh of group.children){
  const p=mesh.geometry.attributes.position;count+=p.count;
  assert.ok(mesh.castShadow&&mesh.receiveShadow);assert.equal(mesh.material.transparent,false);
  for(let i=0;i<p.count;i++){
   const x=p.getX(i),y=p.getY(i),z=p.getZ(i);
   assert.ok([x,y,z].every(Number.isFinite));
   assert.ok(x>794&&x<805&&z> -214&&z< -201.5);
   assert.ok(y>165.5&&y<170,'no floor, footing, pole or skyline geometry');
  }
 }
 assert.ok(count>500);assert.equal(JSON.stringify(features),before);
 assert.equal(buildYotsutsujiContextR95(root,features),result);assert.equal(root.children.length,2);
});

test('source changes or missing original builder fail closed without partial attachments',()=>{
 assert.equal(buildYotsutsujiContextR95(new THREE.Group(),features).built,false);
 const changed=structuredClone(features);changed.buildings.find(b=>b.id==='way/626313775').points[7][0]+=.05;
 assert.equal(yotsutsujiContextPlanR95(changed),null);
 const {root}=owner();assert.equal(buildYotsutsujiContextR95(root,changed).built,false);assert.equal(root.children.length,1);
 assert.equal(yotsutsujiContextPlanR95({buildings:[]}),null);
});
