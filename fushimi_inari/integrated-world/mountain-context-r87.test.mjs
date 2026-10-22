import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import {buildAinomine} from './mountain-landmarks.mjs';
import {refineMountainContextR87} from './mountain-context-r87.mjs';
const features=JSON.parse(fs.readFileSync(new URL('../geography/features.json',import.meta.url)));
function fixture(){const root=new THREE.Group(),colliders=[];const a=buildAinomine(root,features,{height:()=>196.93},{},colliders);return {root,colliders,a};}
test('roof context stays in original envelope and above approach headroom',()=>{
  const {root,colliders,a}=fixture(),before=JSON.stringify(colliders),old=[...a.group.children];
  const result=refineMountainContextR87(a);assert.deepEqual(result.stats,{batches:2,primitives:4,triangles:28});
  for(const mesh of result.group.children){
    mesh.geometry.computeBoundingBox();const b=mesh.geometry.boundingBox;
    assert.ok(b.min.y>2.30);assert.ok(b.min.x>=-a.plan.roof.halfWidth-.00001&&b.max.x<=a.plan.roof.halfWidth+.00001);
    assert.ok(b.min.z>=a.plan.roof.back-.00001&&b.max.z<=a.plan.roof.front+.066);
    for(const n of mesh.geometry.attributes.position.array)assert.ok(Number.isFinite(n));
    assert.ok(mesh.castShadow&&mesh.receiveShadow);
  }
  assert.equal(JSON.stringify(colliders),before);assert.ok(old.every((child,i)=>a.group.children[i]===child));
  assert.equal(refineMountainContextR87(a),null);assert.equal(root.children.length,1);
});
test('missing or unrelated shrine does not receive invented detail',()=>{
  assert.equal(refineMountainContextR87(null),null);
  const unrelated=new THREE.Group();assert.equal(refineMountainContextR87({group:unrelated,plan:{roof:{}}}),null);assert.equal(unrelated.children.length,0);
  const {a}=fixture(),count=a.group.children.length;a.plan.roof.eave=NaN;
  assert.equal(refineMountainContextR87(a),null);assert.equal(a.group.children.length,count);
});
