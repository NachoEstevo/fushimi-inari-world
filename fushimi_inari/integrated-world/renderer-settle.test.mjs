import test from 'node:test';
import assert from 'node:assert/strict';
import {settleRenderer} from './renderer-settle.mjs';

test('settling awaits the submitted WebGPU queue work with its receiver',async()=>{
 let finish,settled=false,calls=0;
 const queue={onSubmittedWorkDone(){assert.equal(this,queue);calls++;return new Promise(resolve=>{finish=resolve;});}};
 const renderer={hasInitialized:()=>true,backend:{isWebGPUBackend:true,device:{queue}},waitForGPU(){throw Error('removed renderer method');}};
 const pending=settleRenderer(renderer).then(result=>{settled=true;return result;});
 assert.equal(calls,1);await Promise.resolve();assert.equal(settled,false);
 finish();assert.equal(await pending,true);assert.equal(settled,true);
});

test('the legacy WebGL fence remains awaited without using a renderer stub',async()=>{
 let finish,settled=false;
 const backend={isWebGLBackend:true,waitForGPU(){assert.equal(this,backend);return new Promise(resolve=>{finish=resolve;});}};
 const pending=settleRenderer({backend,waitForGPU(){throw Error('renderer stub');}}).then(result=>{settled=true;return result;});
 await Promise.resolve();assert.equal(settled,false);finish();assert.equal(await pending,true);
});

test('unavailable backends report false and never invoke a removed renderer method',async()=>{
 const removed=()=>{throw Error('removed renderer method');};
 for(const backend of [undefined,{isWebGPUBackend:true},{isWebGLBackend:true},
  {isWebGPUBackend:true,waitForGPU:removed},{waitForGPU:removed}]){
  assert.equal(await settleRenderer({backend,waitForGPU:removed}),false);
 }
});

test('settling does not initialize a renderer or submit any new work',async()=>{
 let touched=false;
 const renderer={hasInitialized:()=>false,init(){touched=true;},backend:{device:{queue:{onSubmittedWorkDone(){touched=true;}}}}};
 await assert.rejects(settleRenderer(renderer),/Initialize the renderer/);assert.equal(touched,false);
});

test('queue and legacy fence failures propagate to preparation callers',async()=>{
 const failure=new Error('device lost');
 for(const backend of [{isWebGPUBackend:true,device:{queue:{onSubmittedWorkDone:()=>Promise.reject(failure)}}},
  {isWebGLBackend:true,waitForGPU:()=>Promise.reject(failure)}]){
  await assert.rejects(settleRenderer({backend}),error=>error===failure);
 }
});
