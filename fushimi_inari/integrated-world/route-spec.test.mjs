import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {routeSpec} from './route-spec.mjs';
import {makePathSurfaces} from './path-surfaces.mjs';
test('Senbon retains dated OSM counts as reference metadata, independent of rendered spacing',()=>{
  const f=JSON.parse(fs.readFileSync(new URL('../geography/features.json',import.meta.url)));
  for(const p of routeSpec.senbon.paths){
    const source=f.paths.find(x=>x.id===p.id);
    assert.ok(source.tags.note.includes(String(p.smallCount)));
    assert.equal(source.tags.source,'survey 2014-08-16');
  }
  assert.equal(routeSpec.senbon.paths.reduce((n,p)=>n+p.smallCount+p.largeCount,0),781);
  assert.ok(routeSpec.senbon.pillarCenters-routeSpec.senbon.pillarDiameter>1.6);
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
test('descending steps place their riser at the downstream edge with the actual rise',()=>{
  const network=makePathSurfaces({paths:[{id:'down',points:[[0,1.5,0],[0,0,4]],tags:{highway:'steps',step_count:'10'}}]},(x,z)=>1.5-z*1.5/4);
  for(const s of network.segments){
    assert.equal(s.riserAt,'b');
    assert.ok(Math.abs(s.rise-.15)<1e-9);
    assert.equal(s.ya,s.yb);
  }
});
