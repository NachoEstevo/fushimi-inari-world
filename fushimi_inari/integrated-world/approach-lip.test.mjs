import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {makePathSurfaces} from './path-surfaces.mjs';

const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,`${a} != ${b}`);

test('actual Azumamaro paths share low rendered, terrain and walking levels and open junctions',()=>{
  const features=JSON.parse(fs.readFileSync(new URL('../geography/features.json',import.meta.url)));
  const ids=['way/105449706','way/952687108'];
  const network=makePathSurfaces({paths:features.paths.filter(p=>ids.includes(p.id))},()=>42);
  for(const segment of network.segments){
    const x=(segment.a[0]+segment.b[0])/2,z=(segment.a[2]+segment.b[2])/2;
    near(segment.ya,42.02);near(segment.yb,42.02);
    near(network.height(x,z),42.02);
    near(network.sample(x,z).height,42.02);
    const renderedTerrain=network.terrainHeight(x,z)-.06;
    near(network.height(x,z)-renderedTerrain,.08);
    near(segment.ya+segment.curbLip-renderedTerrain,.09);
  }
  const junction=features.paths.find(p=>p.id===ids[1]).points[0];
  assert.equal(network.edgeCovered(junction[0],junction[2],42.02,ids[0]),true);
});

test('ordinary paths and stairs keep their established surface and roadbed profiles',()=>{
  const path=(id,z,tags)=>({id,tags,points:[[0,0,z],[10,0,z]]});
  const ground=x=>x*.1;
  const ordinary=makePathSurfaces({paths:[path('ordinary',0,{highway:'footway'})]},ground);
  near(ordinary.height(5,0),.64);near(ordinary.terrainHeight(5,0),.42);
  assert.equal(ordinary.segments[0].curbLip,.025);
  for(const id of ['way/105449706','way/952687108']){
    const tags={highway:'steps',step_count:'10'};
    const reference=makePathSurfaces({paths:[path('ordinary-stair',0,tags)]},ground);
    const targeted=makePathSurfaces({paths:[path(id,0,tags)]},ground);
    assert.deepEqual(targeted.segments.map(s=>[s.ya,s.yb,s.rise,s.curbLip]),reference.segments.map(s=>[s.ya,s.yb,s.rise,s.curbLip]));
    near(targeted.terrainHeight(5,0),reference.terrainHeight(5,0));
  }
});
