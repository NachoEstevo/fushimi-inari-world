import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {auditR94Routes,r94RouteSpecs} from './r94-route-audit.mjs';
const features=JSON.parse(fs.readFileSync(new URL('../geography/features.json',import.meta.url)));
const clear={resolvePlayer:(x,y,z)=>({x,z})};
test('both exact Senbon ways and the complete Tamayama upper flight are sampled in both directions',()=>{
 const results=auditR94Routes(features,()=>50,clear,{laneOffsets:[-.3,0,.3]});
 assert.equal(results.length,3);
 for(const r of results){assert.equal(r.topology,'connected-source');assert.equal(r.walking,'sampled-lanes-clear');assert.ok(r.lanes.length>=6);assert.ok(r.lanes.every(l=>l.samples>100));}
 assert.deepEqual(results.slice(0,2).map(r=>r.ways[0]),['way/260121328','way/377968455']);
});
test('photographed Okumiya divider remains diagnostic while both genuine walking lanes are required',()=>{
 const path=features.paths.find(p=>p.id==='way/626313768'),a=path.points[0],b=path.points.at(-1),dx=b[0]-a[0],dz=b[2]-a[2],len=Math.hypot(dx,dz);
 const onRail=(x,z)=>Math.abs((x-a[0])*dz-(z-a[2])*dx)/len<.12&&x>a[0]&&x<b[0];
 const rail={resolvePlayer:(x,y,z)=>({x:x+(onRail(x,z)?1:0),z})};
 const record=auditR94Routes(features,()=>50,rail)[2];
 assert.equal(record.walking,'sampled-lanes-clear');
 assert.ok(record.lanes.filter(l=>l.offset===0).every(l=>l.role==='diagnostic'&&l.blocked>0));
 assert.deepEqual([...new Set(record.lanes.filter(l=>l.role==='walking').map(l=>l.offset))],[-.6,.6]);
 const blockedLane={resolvePlayer:(x,y,z)=>({x:x+(onRail(x,z)||x>104&&x<110?1:0),z})};
 assert.equal(auditR94Routes(features,()=>50,blockedLane)[2].walking,'inspect');
});
test('one blocked Senbon branch is not hidden by its clear alternative',()=>{
 const path=features.paths.find(p=>p.id==='way/377968455'),p=path.points[Math.floor(path.points.length/2)];
 const results=auditR94Routes(features,()=>50,{resolvePlayer:(x,y,z)=>({x:x+(Math.hypot(x-p[0],z-p[2])<.3?1:0),z})});
 assert.equal(results[1].walking,'inspect');assert.ok(results[1].lanes.every(l=>l.blocked>0));
});
test('missing ways and broken joints fail closed; invalid height and collision output remain visible',()=>{
 const wanted=r94RouteSpecs[2].ways[1];
 const missing=auditR94Routes({paths:features.paths.filter(p=>p.id!==wanted)},()=>0,clear);
 assert.equal(missing[2].topology,'missing-source');
 const paths=features.paths.map(p=>p.id===wanted?{...p,nodeIds:p.nodeIds.map(n=>'broken'+n)}:p);
 assert.equal(auditR94Routes({paths},()=>0,clear)[2].topology,'disconnected-source');
 assert.ok(auditR94Routes(features,()=>NaN,clear).every(r=>r.lanes.every(l=>l.invalid>0)));
 assert.ok(auditR94Routes(features,()=>0,{resolvePlayer:()=>({x:NaN,z:0})}).every(r=>r.walking==='inspect'));
});
