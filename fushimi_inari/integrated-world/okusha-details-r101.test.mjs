import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {fixture} from './okusha-architecture.test.mjs';
import {buildOkushaCourt} from './okusha-details.mjs';
import {buildSenbonRestR95} from './senbon-rest-r95.mjs';
import {buildSenbonRestR96} from './senbon-rest-r96.mjs';
import {buildOkushaDetailsR101} from './okusha-details-r101.mjs';
const features=JSON.parse(fs.readFileSync(new URL('../geography/features.json',import.meta.url)));
const setup=()=>{const f=fixture();buildOkushaCourt(f.root,features,f.anchor,f.materials,f.colliders);buildSenbonRestR95(f.root,features,f.anchor,f.materials);buildSenbonRestR96(f.root,features,f.anchor,f.materials);return f;};

test('R101 attaches source-backed fittings to actual mapped owners without mutating earlier owners',()=>{
  const f=setup(),before=[];f.root.traverse(o=>before.push([o,o.parent,o.geometry,o.material,o.position.clone(),o.rotation.clone(),o.userData.interactable]));
  const collision=JSON.stringify(f.colliders),geography=JSON.stringify(features);
  const result=buildOkushaDetailsR101(f.root,features,f.anchor,f.materials);
  assert.equal(result.lanterns,2);assert.equal(result.latticeBays,2);
  assert.ok(result.stats.batches<=5);assert.ok(result.stats.triangles<5000);
  assert.equal(JSON.stringify(f.colliders),collision);assert.equal(JSON.stringify(features),geography);
  for(const [o,parent,g,m,pos,rot,interaction]of before){assert.equal(o.parent,parent);assert.equal(o.geometry,g);assert.equal(o.material,m);assert.ok(o.position.equals(pos));assert.ok(o.rotation.equals(rot));assert.equal(o.userData.interactable,interaction);}
  const hall=f.root.children.find(o=>o.userData.okushaArchitecture===88),reception=f.root.children.find(o=>o.name==='Okusha gift and reception counter');
  assert.ok(result.group.children[0].position.equals(hall.position));assert.ok(result.group.children[0].rotation.equals(hall.rotation));
  assert.ok(result.group.children[1].position.equals(reception.position));assert.ok(result.group.children[1].rotation.equals(reception.rotation));
  for(const [i,owner]of result.group.children.entries())owner.traverse(o=>{if(!o.isMesh)return;const a=o.geometry.attributes.position;for(const v of a.array)assert.ok(Number.isFinite(v));o.geometry.computeBoundingBox();const b=o.geometry.boundingBox;
    assert.ok(b.min.y>2.1,'no new objects at walking level');
    if(i===0){assert.ok(b.min.x>=result.plan.rear.minX-.1);assert.ok(b.max.x<=result.plan.rear.maxX+.1);assert.ok(b.min.z>=result.plan.rear.back);assert.ok(b.max.z<=.36);assert.ok(b.max.y<5.3);}
    else{if(o.material.color.getHexString()==='27332e')assert.ok(b.max.y>=result.roofAttachmentY,'hanger intersects actual roof sheet');assert.ok(b.max.y<=result.roofAttachmentY+.02);}
  });
  assert.equal(buildOkushaDetailsR101(f.root,features,f.anchor,f.materials),null);
});

test('missing source owner contracts cause no partial additions',()=>{
  const f=fixture(),children=[...f.root.children];
  assert.equal(buildOkushaDetailsR101(f.root,features,f.anchor,f.materials),null);assert.deepEqual(f.root.children,children);
  const ready=setup(),count=ready.root.children.length;
  assert.equal(buildOkushaDetailsR101(ready.root,{buildings:[]},ready.anchor,ready.materials),null);assert.equal(ready.root.children.length,count);
});
