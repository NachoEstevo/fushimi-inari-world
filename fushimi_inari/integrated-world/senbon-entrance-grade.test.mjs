import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {heightAt} from '../geography/geo-core.mjs';
import {makeSpatial} from './spatial.mjs';
import {makePathSurfaces} from './path-surfaces.mjs';
const read=p=>JSON.parse(fs.readFileSync(new URL(p,import.meta.url),'utf8'));
const terrain=read('../geography/terrain.json'),features=read('../geography/features.json'),spatial=makeSpatial(terrain,features,read('./anchors.json'));
const ground=(x,z)=>heightAt(terrain,x,z),surfaces=makePathSurfaces(features,ground);
test('real twin fork has a shared mouth grade, continuous blend and unchanged later DEM',()=>{
 const height=(branch,d)=>{const p=branch.at(d/branch.total).point;return surfaces.height(p[0],p[2]);};
 for(const d of [0,5,7.5,10])assert.ok(Math.abs(height(spatial.twins[0],d)-height(spatial.twins[1],d))<.03);
 for(const branch of spatial.twins){
  for(const d of [31,40]){const p=branch.at(d/branch.total).point;assert.ok(Math.abs(height(branch,d)-(ground(p[0],p[2])+.14))<.03);}
 }
 for(const id of ['way/260121328','way/377968455']){
  const segments=surfaces.segments.filter(s=>s.id===id);
  for(let i=1;i<segments.length;i++)assert.ok(Math.abs(segments[i-1].yb-segments[i].ya)<1e-8,'adjacent paving segments meet');
  for(const s of segments){const run=Math.hypot(s.b[0]-s.a[0],s.b[2]-s.a[2]);assert.ok(Math.abs(s.yb-s.ya)/run<.25,'no severe segment slopes');}
 }
});
