import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {mappedStationPlacement,mappedStationId} from './station-placement-layout.mjs';
const features=JSON.parse(readFileSync(new URL('../geography/features.json',import.meta.url),'utf8'));
test('station footprint supplies actual center and long axis with facade facing east',()=>{
 const p=mappedStationPlacement(features);assert.equal(p.id,mappedStationId);assert.ok(Math.abs(p.center[0]+166.7805)<1e-8);assert.ok(Math.abs(p.center[1]-37.370)<1e-8);
 assert.ok(p.longEdge>27.65&&p.longEdge<27.67);
 const localX=[Math.cos(p.yaw),-Math.sin(p.yaw)],edge=[.547,27.652],front=[-Math.sin(p.yaw),-Math.cos(p.yaw)];
 assert.ok(Math.abs(localX[0]*edge[1]-localX[1]*edge[0])<1e-8);assert.ok(front[0]>.999);assert.ok(Math.abs(front[1])<.021);
});
test('station placement does not invent a target without its footprint',()=>assert.equal(mappedStationPlacement({buildings:[]}),null));
