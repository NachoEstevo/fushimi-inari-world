import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {makeSpatial} from './spatial.mjs';
import {senbonLayout} from './senbon-layout.mjs';
import {routeSpec} from './route-spec.mjs';
const read=p=>JSON.parse(fs.readFileSync(new URL(p,import.meta.url),'utf8'));
const {twins}=makeSpatial(read('../geography/terrain.json'),read('../geography/features.json'),read('./anchors.json'));
const layout=senbonLayout(twins,routeSpec.senbon.spacing);

test('both Senbon terminal gates face the same courtyard frontage',()=>{
  const ends=layout.map((l,i)=>twins[i].at(l.end/twins[i].total).point);
  const yaw=layout[0].exitYaw;
  const advance=p=>p[0]*Math.sin(yaw)+p[2]*Math.cos(yaw);
  assert.ok(Math.abs(advance(ends[0])-advance(ends[1]))<.001);
  assert.ok(Math.hypot(ends[0][0]-ends[1][0],ends[0][2]-ends[1][2])>2);
  assert.ok(ends.every(p=>p[0]>247&&p[0]<249),'retain the full tunnel to the court');
});

test('terminal gates preserve spacing and leave the common path junction open',()=>{
  for(const [i,l] of layout.entries()){
    assert.equal(l.stations.at(-1),l.end);
    assert.ok(twins[i].total-l.end>2);
    for(let j=1;j<l.stations.length;j++)assert.ok(l.stations[j]-l.stations[j-1]>=routeSpec.senbon.spacing.minimum);
  }
});
