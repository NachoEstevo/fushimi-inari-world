import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {makeSpatial,rigidPoint,pathSampler,pathClearance} from './spatial.mjs';
import {routeMetrics,heightAt,nearestNode,shortestRoute} from '../geography/geo-core.mjs';
const read=p=>JSON.parse(fs.readFileSync(new URL(p,import.meta.url),'utf8'));
const terrain=read('../geography/terrain.json'),features=read('../geography/features.json'),spec=read('./anchors.json');
const spatial=makeSpatial(terrain,features,spec);
test('architectural placement is rigid, retaining distances and absolute floor offsets',()=>{
  const a=[2,3,4],b=[8,10,-5],source=[1,2,3],target=[500,180,-100];
  const aa=rigidPoint(a,source,target,-1.51),bb=rigidPoint(b,source,target,-1.51);
  assert.ok(Math.abs(Math.hypot(...a.map((v,i)=>v-b[i]))-Math.hypot(...aa.map((v,i)=>v-bb[i])))<1e-10);
  assert.deepEqual(rigidPoint(source,source,target,-1.51),target);
});
test('all 22 anchors exist; elevations come from the same GSI ground',()=>{
  assert.equal(spatial.anchors.length,22);
  for(const a of spatial.anchors)assert.equal(a.target[1],heightAt(terrain,a.target[0],a.target[2]));
  assert.ok(spatial.byId.honden.target[0]-spatial.byId.romon.target[0]>60);
});
test('ascent and alternative return remain connected on OSM, not compressed source curves',()=>{
  const ascent=routeMetrics(spatial.main),returning=routeMetrics(spatial.returning);
  assert.ok(ascent.length>1500);assert.ok(returning.length>800);
  assert.ok(ascent.ascent>180);
  assert.deepEqual(spatial.main.at(-1),spatial.returning[0]);
  for(const p of [...spatial.main,...spatial.returning])assert.ok(p.every(Number.isFinite));
});
test('the two Senbon tunnels use separate surveyed paths with independent geometry',()=>{
  assert.ok(spatial.twins.every(t=>t.total>50));
  assert.notDeepEqual(spatial.twins[0].at(.5).point,spatial.twins[1].at(.5).point);
  const sampler=pathSampler([[0,0,0],[0,5,10],[10,10,10]]);
  assert.deepEqual(sampler.at(0).point,[0,0,0]);assert.deepEqual(sampler.at(1).point,[10,10,10]);
});
test('the source viewer remains the exact version used by the extraction adapter',()=>{
  const source=fs.readFileSync(new URL('../interactive_viewer/index.html',import.meta.url));
  assert.equal(crypto.createHash('sha256').update(source).digest('hex'),'7df3663bd36b00554ac654a7f663a91f0d1ba9c753ed743dd11aea0796b05821');
});
test('either Senbon branch can be selected without disconnecting the ascent',()=>{
  for(const id of ['way/260121328','way/377968455']){
    const path=features.paths.find(p=>p.id===id),mid=path.nodeIds[Math.floor(path.nodeIds.length/2)];
    const excluded=new Set(['way/260121328','way/377968455'].filter(other=>other!==id));
    const start=nearestNode(spatial.graph,spatial.byId.romon.target).node.id;
    const end=nearestNode(spatial.graph,spatial.byId.okusha.target).node.id;
    assert.ok(shortestRoute(spatial.graph,start,mid,excluded));
    assert.ok(shortestRoute(spatial.graph,mid,end,excluded));
  }
});
test('clearance uses actual segment interiors, including sparse OSM vertices',()=>{
  const distance=pathClearance([{points:[[0,0,0],[100,10,0]]}]);
  assert.equal(distance(50,2).distance,2);
  assert.equal(distance(50,0).distance,0);
});
