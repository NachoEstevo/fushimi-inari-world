import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import {buildTamayamaStairRail,buildOkumiyaStairRail} from './tamayama-stair-rail.mjs';
import {okumiyaStairRailLayout} from './tamayama-stair-layout.mjs';

test('mapped 6m upper flight explicitly owns a center rail and joins Okumiya landing',()=>{
  const {paths}=JSON.parse(fs.readFileSync(new URL('../geography/features.json',import.meta.url)));
  const flight=paths.find(p=>p.id==='way/626313768'),landing=paths.find(p=>p.id==='way/1392716577');
  assert.equal(flight.tags['handrail:center'],'yes');assert.equal(flight.tags.highway,'steps');
  assert.equal(flight.tags.width,'6');
  assert.ok(flight.nodeIds.some(id=>landing.nodeIds.includes(id)));
});

test('upper twin rail suppresses only its own side rails and preserves grades/counts and lower rail',()=>{
  const segment=(id,z,width=6)=>({id,a:[0,0,z],b:[2,0,z],ya:3,yb:3.4,width,stair:true,handrail:true});
  const upper=segment('way/626313768',10),lower=segment('way/105449693',0,4.8),other=segment('unrelated',20);
  const n={segments:[lower,upper,other]},before=n.segments.map(s=>({...s})),root=new THREE.Group(),colliders=[];
  const layout=okumiyaStairRailLayout(n);assert.deepEqual(layout.flight,[upper]);
  const record=buildOkumiyaStairRail(root,n,colliders);
  assert.equal(record.path,upper.id);assert.equal(record.tubes,2);assert.equal(record.renderedWidth,6);
  assert.equal(upper.handrail,false);assert.equal(lower.handrail,true);assert.equal(other.handrail,true);
  assert.ok(colliders.every(c=>c.args.at(-1)==='okumiya_dividing_rail'));
  const count=colliders.length;assert.equal(buildOkumiyaStairRail(root,n,colliders),null);assert.equal(colliders.length,count);
  const lowerRecord=buildTamayamaStairRail(root,n,colliders);
  assert.equal(lowerRecord.tubes,1);assert.equal(lowerRecord.renderedWidth,4.8);assert.equal(root.children.length,2);
  for(let i=0;i<n.segments.length;i++)assert.deepEqual({...n.segments[i],handrail:true},before[i]);
  for(const group of root.children)for(const v of group.children[0].geometry.attributes.position.array)assert.ok(Number.isFinite(v));
});
