import test from 'node:test';
import assert from 'node:assert/strict';
import {toriiVariation,spacedGateStations} from './torii-variation.mjs';
test('spacing leaves beam clearance instead of packing a historical count',()=>{
  const stations=spacedGateStations(65);
  assert.ok(stations.length>90&&stations.length<140);
  const gaps=stations.slice(1).map((d,i)=>d-stations[i]);
  assert.ok(Math.min(...gaps)>=.43);
  assert.ok(Math.max(...gaps)-Math.min(...gaps)>.1);
  assert.deepEqual(stations,spacedGateStations(65));
  assert.deepEqual(spacedGateStations(.5),[]);
});
test('each corridor keeps both original finishes and bounded independent dimensions',()=>{
  const gates=Array.from({length:200},(_,i)=>toriiVariation(133742,i));
  const worn=gates.filter(g=>g.weathered).length;
  assert.ok(worn>30&&worn<140);
  assert.ok(new Set(gates.map(g=>g.height)).size>180);
  for(const g of gates){
    assert.ok(g.width>=.98&&g.width<=1.02);
    assert.ok(g.height>=.965&&g.height<=1.035);
    assert.ok(Math.abs(g.yaw)<=.006);
  }
  assert.deepEqual(gates[50],toriiVariation(133742,50));
  assert.notDeepEqual(gates[50],toriiVariation(134251,50));
});
