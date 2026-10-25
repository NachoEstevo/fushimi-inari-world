import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createDeferredShrineBuildings,shrineBuildingIds} from './deferred-shrine-buildings.mjs';
import {bakeShrineBuildingFloors} from '../../scripts/bake-shrine-building-floors.mjs';

test('station startup makes no GLB request; precinct proximity loads each original once',async()=>{
 const calls=[],loader=createDeferredShrineBuildings({anchor:[0,2,0],load:async id=>{calls.push(id);return id;}});
 loader.update({x:-302,z:-169});await Promise.resolve();assert.deepEqual(calls,[]);
 loader.update({x:-180,z:0});loader.update({x:-179,z:0});
 assert.deepEqual(await loader.ensure(),shrineBuildingIds);assert.deepEqual(calls,shrineBuildingIds);
 loader.update({x:0,z:0});await loader.ensure();assert.equal(calls.length,4);
 assert.ok(Object.values(loader.stats().buildings).every(s=>s.status==='ready'));
});

test('failed downloads report failure and only explicit ensure retries',async()=>{
 let attempts=0;const loader=createDeferredShrineBuildings({anchor:[0,0,0],load:async()=>{if(++attempts===1)throw Error('offline');return 'scene';}});
 await assert.rejects(loader.ensure('romon'),/offline/);assert.equal(loader.stats().buildings.romon.status,'failed');
 loader.update({x:999,z:999});assert.equal(attempts,1);
 assert.equal(await loader.ensure('romon'),'scene');assert.equal(attempts,2);
 await assert.rejects(loader.ensure('unknown'),/Unknown shrine/);
});

test('permanent floor bake matches current original GLBs and shared refinements exactly',async()=>{
 const saved=JSON.parse(await readFile(new URL('./shrine-building-floors.json',import.meta.url),'utf8'));
 assert.deepEqual(await bakeShrineBuildingFloors(),saved);
 for(const id of shrineBuildingIds){assert.ok(saved.buildings[id].length>0);assert.equal(saved.buildings[id].length%9,0);}
});

test('load and viewer preparation serialize, deduplicate and continue after a failed building',async()=>{
 let active=0,maximum=0;const calls=[];
 const loader=createDeferredShrineBuildings({anchor:[0,0,0],load:async id=>{
  active++;maximum=Math.max(maximum,active);calls.push(id);
  try{await new Promise(resolve=>setTimeout(resolve,5));if(id==='gehaiden')throw Error('bad transfer');return id;}
  finally{active--;}
 }});
 loader.update({x:0,z:0});
 const first=loader.ensure('romon');assert.equal(loader.ensure('romon'),first);
 const result=await Promise.allSettled(shrineBuildingIds.map(id=>loader.ensure(id)));
 assert.equal(maximum,1);assert.equal(active,0);assert.deepEqual(calls,shrineBuildingIds);
 assert.deepEqual(result.map(r=>r.status),['fulfilled','rejected','fulfilled','fulfilled']);
 assert.equal(loader.stats().buildings.honden.status,'ready');
 loader.update({x:0,z:0});await Promise.resolve();assert.equal(calls.length,4);
});
