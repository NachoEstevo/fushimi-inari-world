import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import {fixture} from './okusha-architecture.test.mjs';
import {buildOkushaCourt} from './okusha-details.mjs';
import {buildSenbonRestR95} from './senbon-rest-r95.mjs';
import {buildSenbonRestR96} from './senbon-rest-r96.mjs';
const features=JSON.parse(fs.readFileSync(new URL('../geography/features.json',import.meta.url)));

test('R96 improves whole-court fittings inside existing ownership, preserving floors, collision and interactions',()=>{
  const f=fixture();
  for(const x of [5.75,7.45]){
    const ring=new THREE.Mesh(new THREE.CylinderGeometry(.32,.28,.14,12),f.materials.stoneMat);ring.position.set(x,1.48,5.6);f.original.add(ring);
  }
  buildOkushaCourt(f.root,features,f.anchor,f.materials,f.colliders);buildSenbonRestR95(f.root,features,f.anchor,f.materials);
  const collision=JSON.stringify(f.colliders),callback=f.omokaru.userData.interactable,orbGeometry=f.omokaru.geometry;
  const court=f.root.children.find(g=>g.name==='Connected Okusha arrival court');
  const surface=[];court.traverse(o=>{if(o.isMesh)surface.push([o,o.geometry,o.geometry.attributes.position.array.slice(),o.geometry.attributes.uv?.array.slice()]);});
  const result=buildSenbonRestR96(f.root,features,f.anchor,f.materials);
  assert.equal(result.plaques,240);assert.equal(result.stoneCaps,2);
  assert.equal(JSON.stringify(f.colliders),collision);assert.equal(f.omokaru.userData.interactable,callback);assert.equal(f.omokaru.geometry,orbGeometry);
  for(const [mesh,geometry,position,uv]of surface){assert.equal(mesh.geometry,geometry);assert.deepEqual(geometry.attributes.position.array,position);assert.deepEqual(geometry.attributes.uv?.array,uv);}
  const batches=result.racks.reduce((n,s)=>n+s.batches,result.pavilion.batches),triangles=result.racks.reduce((n,s)=>n+s.triangles,result.pavilion.triangles);
  assert.ok(batches<=11);assert.ok(triangles<18000);
  result.group.traverse(o=>{if(o.isMesh)for(const n of o.geometry.attributes.position.array)assert.ok(Number.isFinite(n));});
  const pavilion=result.group.children[0];pavilion.traverse(o=>{if(o.isMesh){o.geometry.computeBoundingBox();assert.ok(o.geometry.boundingBox.min.y>=2.8);}});
  for(const owner of result.group.children.slice(1))for(const detail of owner.children)detail.traverse(o=>{if(o.isMesh){o.geometry.computeBoundingBox();const b=o.geometry.boundingBox;assert.ok(b.min.x>=-1.6&&b.max.x<=1.6);assert.ok(b.min.z>=-.25&&b.max.z<=.25);}});
  assert.equal(buildSenbonRestR96(f.root,features,f.anchor,f.materials),null);
});

test('R96 unknown hall or rack contracts fail before mutation',()=>{
  const f=fixture();buildOkushaCourt(f.root,features,f.anchor,f.materials,f.colliders);
  const children=[...f.root.children],legacy=[...f.original.children];
  assert.equal(buildSenbonRestR96(f.root,{buildings:[]},f.anchor,f.materials),null);
  assert.deepEqual(f.root.children,children);assert.deepEqual(f.original.children,legacy);
  f.ema.removeFromParent();const count=f.root.children.length;
  assert.equal(buildSenbonRestR96(f.root,features,f.anchor,f.materials),null);assert.equal(f.root.children.length,count);
});
