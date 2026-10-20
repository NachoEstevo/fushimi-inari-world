import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {routeSpec,gateStations} from './route-spec.mjs';
import {makePathSurfaces} from './path-surfaces.mjs';
test('Senbon count preserves each dated OSM survey rather than the old 200-gate approximation',()=>{
  const f=JSON.parse(fs.readFileSync(new URL('../geography/features.json',import.meta.url)));
  for(const p of routeSpec.senbon.paths){
    const source=f.paths.find(x=>x.id===p.id);
    assert.ok(source.tags.note.includes(String(p.smallCount)));
    assert.equal(source.tags.source,'survey 2014-08-16');
  }
  assert.equal(routeSpec.senbon.paths.reduce((n,p)=>n+p.smallCount+p.largeCount,0),781);
  assert.ok(routeSpec.senbon.pillarCenters-routeSpec.senbon.pillarDiameter>1.6);
});
test('gate stations exclude joining aprons, preserve count and have monotonic meter spacing',()=>{
  const stations=gateStations(65,382,.3);
  assert.equal(stations.length,382);
  assert.ok(stations[0]>.3&&stations.at(-1)<64.7);
  for(let i=1;i<stations.length;i++)assert.ok(stations[i]-stations[i-1]>.15);
});
test('OSM step_count produces level treads while walk sampling follows those same levels',()=>{
  const network=makePathSurfaces({paths:[{id:'steps',points:[[0,0,0],[0,1.5,4]],tags:{highway:'steps',step_count:'10',width:'2'}}]},(x,z)=>z*1.5/4);
  assert.equal(network.stats.treads,10);
  assert.equal(network.stats.sourceStepCounts,1);
  for(const s of network.segments){
    assert.equal(s.ya,s.yb);
    assert.equal(network.height(0,(s.a[2]+s.b[2])/2),s.ya);
  }
  assert.equal(network.height(5,2),.75); // Outside the stair uses terrain.
});
test('surface network does not invent ground-level crossings for bridges and tunnels',()=>{
  const paths=['tunnel','bridge'].map(type=>({id:type,points:[[0,0,0],[0,0,20]],tags:{highway:'footway',[type]:'yes'}}));
  assert.equal(makePathSurfaces({paths},()=>0).segments.length,0);
});
