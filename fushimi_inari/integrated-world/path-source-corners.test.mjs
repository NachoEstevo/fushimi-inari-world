import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {makePathSurfaces} from './path-surfaces.mjs';
import {pathOffset} from './path-frame.mjs';
import {pathSampler} from './spatial.mjs';

const features=JSON.parse(readFileSync(new URL('../geography/features.json',import.meta.url)));
const same=(a,b)=>a.every((v,i)=>Math.abs(v-b[i])<1e-9);

test('a mapped right angle stays at its source node without a diagonal shortcut',()=>{
 const path={id:'way/260121328',tags:{highway:'footway',width:'2'},points:[[0,0,0],[2,0,0],[2,0,2]]};
 const network=makePathSurfaces({paths:[path]},()=>0),segments=network.segments;
 assert.equal(segments.length,4);
 assert.ok(same(segments[1].b,path.points[1]));assert.ok(same(segments[2].a,path.points[1]));
 assert.deepEqual(pathOffset(segments[1].a,segments[1].b,segments[2],true),pathOffset(segments[2].a,segments[2].b,segments[1]));
 assert.ok(network.sample(2,0));
});

test('Senbon and Okusha paths preserve every source bend and continuous miter joints',()=>{
 for(const id of ['way/105449724','way/260121354','way/260121328','way/377968455','way/301527759','way/301527762']){
  const path=features.paths.find(p=>p.id===id),network=makePathSurfaces({paths:[path]},()=>10),segments=network.segments;
  for(const node of path.points)assert.ok(segments.some(s=>same(s.a,node)||same(s.b,node)),`${id}: source node lost`);
  for(const [i,s]of segments.entries()){
   assert.ok(Math.hypot(s.b[0]-s.a[0],s.b[2]-s.a[2])<=1.500001);
   if(i){
    const prev=segments[i-1];assert.ok(same(prev.b,s.a));
    const before=pathOffset(prev.a,prev.b,s,true),after=pathOffset(s.a,s.b,prev);
    assert.ok(before.every((v,j)=>Math.abs(v-after[j])<1e-8),`${id}: open miter joint`);
    assert.ok(Math.abs(s.distance-prev.distance-Math.hypot(prev.b[0]-prev.a[0],prev.b[2]-prev.a[2]))<1e-8);
   }
  }
 }
});


test('unreviewed street owners retain their historical whole-way sample stations',()=>{
 for(const id of ['street-unreviewed','way/831207339']){
  const source=features.paths.find(p=>p.id===id)??{id,tags:{highway:'footway'},points:[[0,0,0],[2,0,0],[2,0,2]]};
  const sampler=pathSampler(source.points),count=Math.ceil(sampler.total/1.5),network=makePathSurfaces({paths:[source]},()=>0);
  assert.equal(network.segments.length,count);
  network.segments.forEach((s,i)=>{assert.deepEqual(s.a,sampler.at(i/count).point);assert.deepEqual(s.b,sampler.at((i+1)/count).point);assert.equal(s.distance,i*sampler.total/count);});
 }
});
