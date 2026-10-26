import test from 'node:test';
import assert from 'node:assert/strict';
import {panoramaVisible,outlooks,outlookOpening,panoramaBuildingCandidates} from './panorama-policy.mjs';
import {readFileSync} from 'node:fs';
import {buildGraph,nearestNode,shortestRoute} from '../geography/geo-core.mjs';
test('both additional outlooks connect to Yotsutsuji on existing mapped paths',()=>{
  const features=JSON.parse(readFileSync(new URL('../geography/features.json',import.meta.url)));
  const terrain=JSON.parse(readFileSync(new URL('../geography/terrain.json',import.meta.url)));
  const graph=buildGraph(features.paths,terrain);
  const start=nearestNode(graph,[795,164,-216],20).node.id;
  for(const id of ['node/749327432','node/9673171303']){
    const poi=features.pois.find(p=>p.id===id);
    const end=nearestNode(graph,poi.point,8);
    assert.ok(end);
    assert.ok(shortestRoute(graph,start,end.node.id)?.length>2);
  }
});
test('detail is available at every mapped lookout but not at the entrance',()=>{
  for(const [x,y,z] of outlooks)assert.equal(panoramaVisible({x,y,z},false),true);
  assert.equal(panoramaVisible({x:0,y:40,z:0},true),false);
  assert.equal(panoramaVisible({x:795,y:164,z:-216},true,false),false);
});
test('hysteresis prevents churn and distant aerial cameras turn detail off',()=>{
  const p={x:950,y:165,z:-216};
  assert.equal(panoramaVisible(p,false),false);
  assert.equal(panoramaVisible(p,true),true);
  assert.equal(panoramaVisible({...p,x:1100},true),false);
  assert.equal(panoramaVisible({x:795,y:500,z:-216},true),false);
});
test('secondary view openings stay bounded and face mapped southwest',()=>{
  for(const [x,,z] of outlooks.slice(1)){
    assert.equal(outlookOpening(x-10,z+10),true);
    assert.equal(outlookOpening(x+10,z-10),false);
    assert.equal(outlookOpening(x-30,z+30),false);
  }
});


test('panorama budget prefers real nearby footprints and rejects malformed source geometry',()=>{
 const building=(id,x,z)=>({id,points:[[x,0,z],[x+2,0,z],[x+2,0,z+2],[x,0,z]]});
 const far=building('far',-1000,-200),near=building('near',440,-270),beyond=building('beyond',500,-270),invalid=building('invalid',NaN,-200);
 const result=panoramaBuildingCandidates([far,beyond,invalid,near]);
 assert.deepEqual(result,[near,far]);
 assert.equal(result[0],near,'keep source objects and their mapped outlines');
});
