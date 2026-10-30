import test from 'node:test';
import assert from 'node:assert/strict';
import * as guard from './pending-pipeline-guard.mjs';

test('only an unready WebGPU pipeline skips its draw and a ready draw preserves this and arguments',()=>{
 const pipeline={},data={pipeline:null},calls=[],backend={isWebGPUBackend:true,get(value){assert.equal(value,pipeline);return data;},draw(...args){calls.push([this,args]);return 42;}};
 assert.equal(typeof guard.installPendingPipelineGuard,'function');const handle=guard.installPendingPipelineGuard(backend,{revision:180}),object={pipeline,object:{name:'shaft'}},info={};
 assert.equal(backend.draw(object,info),undefined);assert.equal(calls.length,0);assert.deepEqual(handle.stats,{skipped:1,lastObjectName:'shaft'});
 data.pipeline={ready:true};assert.equal(backend.draw(object,info),42);assert.deepEqual(calls,[[backend,[object,info]]]);handle.dispose();assert.equal(backend.draw(object,info),42);
});

test('disposal restores inherited methods and does not overwrite a later owner',()=>{
 const original=function(){},prototype={draw:original},backend=Object.assign(Object.create(prototype),{isWebGPUBackend:true,get:()=>({pipeline:{}})});
 assert.equal(typeof guard.installPendingPipelineGuard,'function');const first=guard.installPendingPipelineGuard(backend,{revision:180});assert.ok(Object.hasOwn(backend,'draw'));first.dispose();assert.equal(Object.hasOwn(backend,'draw'),false);assert.equal(backend.draw,original);
 const second=guard.installPendingPipelineGuard(backend,{revision:180}),later=()=>{};backend.draw=later;second.dispose();assert.equal(backend.draw,later);
});

test('WebGL and unsupported backends are never modified',()=>{
 assert.equal(typeof guard.installPendingPipelineGuard,'function');for(const backend of [{isWebGPUBackend:false,draw(){}},{isWebGPUBackend:true,draw(){}}]){const original=backend.draw,handle=guard.installPendingPipelineGuard(backend,{revision:180});assert.deepEqual(handle.stats,{skipped:0,lastObjectName:''});assert.equal(backend.draw,original);handle.dispose();assert.equal(backend.draw,original);}
});


for(const revision of [186,187])test(`r${revision} retains its native draw boundary without a redundant backend patch`,()=>{
 const original=()=>{},backend={isWebGPUBackend:true,get(){},draw:original};
 const handle=guard.installPendingPipelineGuard(backend,{revision});assert.equal(backend.draw,original);handle.dispose();
});
