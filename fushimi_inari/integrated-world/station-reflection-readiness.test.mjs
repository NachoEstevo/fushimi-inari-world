import test from 'node:test';
import assert from 'node:assert/strict';
import {createStationReflectionReadiness} from './station-reflection-readiness.mjs';

test('station probe is lazy, deduplicated and never recaptured for lighting or quality transitions',async()=>{
 const quality={mode:'balanced'},sun={intensity:2},calls=[];let finish;
 const service=createStationReflectionReadiness({quality,sun,station:{group:{}},createProbe:async()=>{
  calls.push('create');return {stats:{captures:1},prepareBounded:()=>new Promise(r=>finish=r),setEnabled:v=>calls.push(v),dispose:()=>calls.push('dispose')};
 }});
 await service.prepare();assert.deepEqual(calls,[]);
 quality.mode='high';const first=service.prepare(),second=service.prepare();assert.equal(first,second);
 await Promise.resolve();finish();await first;assert.deepEqual(calls,['create',true]);
 sun.intensity=.3;service.sync();assert.equal(service.stats.enabled,false);
 sun.intensity=2;service.sync();assert.equal(service.stats.enabled,true);
 quality.mode='balanced';await service.prepare();assert.equal(service.stats.enabled,false);
 quality.mode='ultra';await service.prepare();assert.deepEqual(calls,['create',true,false,true,false,true]);
 service.dispose();service.dispose();assert.equal(calls.filter(v=>v==='dispose').length,1);
});

test('failed local probe retains fallback and can retry without retaining a failed allocation',async()=>{
 let attempts=0,disposals=0;
 const service=createStationReflectionReadiness({quality:{mode:'high'},sun:{intensity:2},station:{group:{}},createProbe:async()=>({
  stats:{},prepareBounded:async()=>{if(++attempts===1)throw Error('pipeline rejected');},setEnabled(){},dispose(){disposals++;}
 })});
 await service.prepare();assert.match(service.stats.error,/pipeline rejected/);assert.equal(service.stats.enabled,false);assert.equal(disposals,1);
 await service.prepare();assert.equal(service.stats.prepared,true);assert.equal(service.stats.error,null);service.dispose();assert.equal(disposals,2);
});
