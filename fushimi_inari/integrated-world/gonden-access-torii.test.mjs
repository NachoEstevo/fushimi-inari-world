import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {gondenAccessToriiLayout} from './gonden-access-torii-layout.mjs';
const features=JSON.parse(readFileSync(new URL('../geography/features.json',import.meta.url),'utf8'));
test('single access gate uses the lower mapped stair endpoint and crosses its axis',()=>{
 const layout=gondenAccessToriiLayout(features),path=features.paths.find(p=>p.id===layout.sourcePath),a=path.points[0],b=path.points[1];
 assert.deepEqual(layout.center,[75.725,-33.708]);assert.ok(a[1]<b[1]);
 const ux=Math.cos(layout.yaw),uz=-Math.sin(layout.yaw),dx=b[0]-a[0],dz=b[2]-a[2];
 assert.ok(Math.abs(ux*dx+uz*dz)<1e-8);assert.ok(layout.pillarSpan>Number(path.tags.width)+1);
 assert.match(layout.placementStatus,/not an individually mapped/);assert.match(layout.dimensionsStatus,/Estimated/);
});
test('missing or degenerate mapped stair prevents unsupported gate placement',()=>{
 assert.equal(gondenAccessToriiLayout({paths:[]}),null);
 assert.equal(gondenAccessToriiLayout({paths:[{id:'way/105449693',points:[[1,2,3],[1,2,3]]}]}),null);
});
