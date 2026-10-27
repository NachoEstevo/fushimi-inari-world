import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {omitUnverifiedPrecinctProxy} from './precinct-proxy-policy.mjs';
test('only unresolved stair-front proxies are omitted from generic extrusion',()=>{
 const {buildings}=JSON.parse(readFileSync(new URL('../geography/features.json',import.meta.url)));
 assert.deepEqual(buildings.filter(omitUnverifiedPrecinctProxy).map(b=>b.id).sort(),['way/305214366','way/305214610']);
 const b=buildings.find(b=>b.id==='way/305214366');
 assert.equal(omitUnverifiedPrecinctProxy({...b,tags:{...b.tags,height:'2.4'}}),false);
 assert.equal(omitUnverifiedPrecinctProxy({...b,tags:{...b.tags,name:'Identified building'}}),false);
});

test('unmodeled shrine boxes are distinguished from ordinary context and measured envelopes',async()=>{
 const {omitUnmodeledShrineProxy}=await import('./precinct-proxy-policy.mjs');
 assert.equal(typeof omitUnmodeledShrineProxy,'function');
 assert.equal(omitUnmodeledShrineProxy({tags:{building:'shrine',name:'Mapped shrine'}}),true);
 assert.equal(omitUnmodeledShrineProxy({tags:{building:'yes',religion:'shinto'}}),true);
 assert.equal(omitUnmodeledShrineProxy({tags:{amenity:'place_of_worship'}}),true);
 assert.equal(omitUnmodeledShrineProxy({tags:{building:'yes'}}),false);
 assert.equal(omitUnmodeledShrineProxy({tags:{building:'shrine',height:'4.2 m'}}),false);
 assert.equal(omitUnmodeledShrineProxy({tags:{building:'shrine','building:levels':'1'}}),false);
 assert.equal(omitUnmodeledShrineProxy({tags:{building:'shrine',height:'unknown'}}),true);
});

test('mountain shrine context keeps source geometry and POIs available for modeling',async()=>{
 const {omitUnmodeledShrineProxy}=await import('./precinct-proxy-policy.mjs');
 assert.equal(typeof omitUnmodeledShrineProxy,'function');
 const features=JSON.parse(readFileSync(new URL('../geography/features.json',import.meta.url)));
 for(const id of ['way/626342326','way/626342329','way/626342331','way/626342335','way/626342333']){
  const building=features.buildings.find(b=>b.id===id),before=JSON.stringify(building);
  assert.equal(omitUnmodeledShrineProxy(building),true);assert.equal(JSON.stringify(building),before);
 }
 assert.ok(features.pois.some(p=>p.id==='way/626342326'),'named shrine remains a navigable landmark');
});
