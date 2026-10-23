import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import {senbonRestBankPlan,buildSenbonRestLandscape} from './senbon-rest-landscape-r94.mjs';
const features=JSON.parse(fs.readFileSync(new URL('../geography/features.json',import.meta.url)));
test('bank stems use actual terrain, exclude mapped buildings/routes and yield to existing forest roots',()=>{
  const ground=(x,z)=>65+(x-280)*.1+(z-70)*.05;
  const all=senbonRestBankPlan(features,ground,()=>({distance:10}),[]);
  assert.ok(all.length>=3&&all.length<=12);
  for(const t of all){assert.equal(t.y,ground(t.x,t.z));assert.ok(t.x>=264&&t.z>=43);assert.ok(t.x>280||t.z>92);}
  const existing=all.map(t=>({type:'cylinder',args:[t.x,t.z,.4,t.y,t.y+10,'forest_tree']}));
  assert.equal(senbonRestBankPlan(features,ground,()=>({distance:10}),existing).length,0);
  assert.equal(senbonRestBankPlan(features,ground,()=>({distance:4.9}),[]).length,0);
  assert.equal(senbonRestBankPlan(features,ground,()=>({distance:NaN}),[]).length,0);
  assert.equal(senbonRestBankPlan(features,()=>NaN,()=>({distance:10}),[]).length,0);
});
test('bank reuses cutout leaf texture and finite instances without touching existing colliders',()=>{
  const context=new Proxy({}, {get:(o,k)=>o[k]??(()=>{})});
  globalThis.document={createElement:()=>({getContext:()=>context})};
  const root=new THREE.Group(),existing={type:'box',args:[250,69,1,1,0,65,70,'keep']},colliders=[existing];
  const r=buildSenbonRestLandscape(root,features,()=>65,()=>({distance:10}),{},colliders);
  assert.ok(r.trees>0);assert.equal(colliders[0],existing);assert.equal(colliders.length,r.trees+1);
  const group=root.children[0],leaves=group.children[1];
  assert.ok(leaves.material.map);assert.equal(leaves.material.alphaTest,.4);assert.equal(leaves.material.transparent,false);
  assert.equal(leaves.count,r.trees*5);assert.equal(group.children.length,2);
  for(const mesh of group.children)for(const v of mesh.instanceMatrix.array)assert.ok(Number.isFinite(v));
  assert.equal(buildSenbonRestLandscape(root,features,()=>65,()=>({distance:10}),{},colliders),null);
});
