import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {makeSpatial} from './spatial.mjs';
import {auditSectorConnections,sectorConnections} from './sector-audit.mjs';
import {toriiPosts,toriiClearsPaths} from './torii-clearance.mjs';
import {pathClearance} from './spatial.mjs';
const read=p=>JSON.parse(fs.readFileSync(new URL(p,import.meta.url)));
const spatial=makeSpatial(read('../geography/terrain.json'),read('../geography/features.json'),read('./anchors.json'));

test('review itinerary covers every architectural anchor without inventing connections',()=>{
  const ids=new Set(sectorConnections.flat());
  for(const a of spatial.anchors)assert.ok(ids.has(a.id),a.id);
  const audit=auditSectorConnections(spatial);
  assert.equal(audit.length,24);
  for(const r of audit){assert.equal(r.topology,'connected',`${r.from} → ${r.to}`);assert.equal(r.fidelity,'unverified');assert.ok(r.snapGaps.every(Number.isFinite));}
});

test('physical audit reports obstructions and discontinuities separately from graph connectivity',()=>{
  const blocked={resolvePlayer:(x,y,z)=>({x:x+1,z})};
  const audit=auditSectorConnections(spatial,(x,z)=>Math.floor(x/2)*2,blocked);
  assert.ok(audit.every(r=>r.walking==='inspect'));
  assert.ok(audit.some(r=>r.directions.some(d=>d.maxJump>.4)));
  assert.ok(audit.every(r=>r.directions.length===2&&r.directions.every(d=>d.blocked>0)));
});

test('straight torii corridor stays open but a post across a side branch is rejected',()=>{
  const posts=toriiPosts(0,0,0,1.2,1.2,1.45);
  const main={points:[[0,0,-10],[0,0,10]]};
  assert.equal(toriiClearsPaths(posts,pathClearance([main])),true);
  assert.equal(toriiClearsPaths(posts,pathClearance([main,{points:[[0,0,0],[8,0,0]]} ])),false);
  assert.equal(toriiClearsPaths(toriiPosts(0,4,0,1.2,1.2,1.45),pathClearance([main,{points:[[0,0,0],[8,0,0]]}])),true);
});
