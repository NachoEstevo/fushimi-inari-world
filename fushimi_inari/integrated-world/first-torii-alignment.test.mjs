import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {mappedFirstToriiPlacement} from './first-torii-alignment-layout.mjs';
import {firstToriiSource} from './first-torii-source.mjs';
const raw=JSON.parse(readFileSync(new URL('../geography/sources/osm.json',import.meta.url),'utf8'));
const manifest=JSON.parse(readFileSync(new URL('../geography/manifest.json',import.meta.url),'utf8'));
test('first torii source retains both actual raw OSM way endpoints, not first-point POI',()=>{
 const way=raw.elements.find(p=>p.type==='way'&&p.id===359847609);assert.deepEqual(way.nodes,firstToriiSource.nodeIds);
 for(const [i,id]of way.nodes.entries()){
  const node=raw.elements.find(p=>p.type==='node'&&p.id===id),o=manifest.origin,x=(node.lon-o.lon)*Math.PI/180*6378137*Math.cos(o.lat*Math.PI/180),z=-(node.lat-o.lat)*Math.PI/180*6378137;
  assert.ok(Math.abs(x-firstToriiSource.endpoints[i][0])<1e-8);assert.ok(Math.abs(z-firstToriiSource.endpoints[i][1])<1e-8);
 }
});
test('mapped gate midpoint, heading and scaled pillar centers reproduce source endpoints',()=>{
 const p=mappedFirstToriiPlacement();assert.ok(Math.abs(p.center[0]+138.295876)<.00001);assert.ok(Math.abs(p.center[1]-10.764595)<.00001);assert.ok(Math.abs(p.span-11.5102)<.001);
 for(const [i,side]of [-1,1].entries()){
  const x=p.center[0]+side*4.4*p.scaleX*Math.cos(p.yaw),z=p.center[1]-side*4.4*p.scaleX*Math.sin(p.yaw),endpoint=firstToriiSource.endpoints[i];assert.ok(Math.hypot(x-endpoint[0],z-endpoint[1])<1e-8);
 }
});
