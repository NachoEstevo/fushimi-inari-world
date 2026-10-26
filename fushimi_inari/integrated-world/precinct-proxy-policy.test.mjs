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
