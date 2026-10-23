import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {fixture} from './okusha-architecture.test.mjs';
import {buildOkushaCourt} from './okusha-details.mjs';
import {buildSenbonRestR95} from './senbon-rest-r95.mjs';
const features=JSON.parse(fs.readFileSync(new URL('../geography/features.json',import.meta.url)));
test('R95 replaces repetitive reception contract while preserving collision, mapped toilet and interaction identity',()=>{
  const f=fixture();buildOkushaCourt(f.root,features,f.anchor,f.materials,f.colliders);
  const colliders=JSON.stringify(f.colliders),toilet=f.root.children.find(g=>g.name==='Okusha service building'),toiletChildren=[...toilet.children],callback=f.body.userData.interactable;
  const result=buildSenbonRestR95(f.root,features,f.anchor,f.materials);
  assert.ok(result.receptionReplaced>=60);assert.equal(result.features,4);
  assert.equal(JSON.stringify(f.colliders),colliders);assert.deepEqual(toilet.children,toiletChildren);assert.equal(f.body.userData.interactable,callback);
  assert.ok(result.frontage.batches<=6&&result.frontage.triangles<6000);assert.ok(result.worshipFittings.triangles<5000);
  for(const group of result.group.children)for(const mesh of group.children)for(const n of mesh.geometry.attributes.position.array)assert.ok(Number.isFinite(n));
  const reception=f.root.children.find(g=>g.name==='Okusha gift and reception counter');
  assert.equal(reception.children.filter(c=>c.geometry?.parameters?.height===1.7).length,0);
  assert.equal(buildSenbonRestR95(f.root,features,f.anchor,f.materials),null);
});
test('R95 does not partially replace unknown source or reception panel contracts',()=>{
  const f=fixture();buildOkushaCourt(f.root,features,f.anchor,f.materials,f.colliders);
  const count=f.root.children.length,reception=f.root.children.find(g=>g.name==='Okusha gift and reception counter'),children=[...reception.children];
  assert.equal(buildSenbonRestR95(f.root,{buildings:[]},f.anchor,f.materials),null);
  assert.deepEqual(reception.children,children);assert.equal(f.root.children.length,count);
  reception.children.find(c=>c.geometry?.parameters?.height===1.7).removeFromParent();
  const after=[...reception.children];assert.equal(buildSenbonRestR95(f.root,features,f.anchor,f.materials),null);assert.deepEqual(reception.children,after);
});
