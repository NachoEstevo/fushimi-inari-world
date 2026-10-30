import test from 'node:test';
import assert from 'node:assert/strict';
import {createStartupCheckpoint,yieldStartupTask} from './startup-work.mjs';
test('startup checkpoints yield only after the CPU budget and restart after the actual task resumes',async()=>{
 let time=0,yields=0,resolve;
 const checkpoint=createStartupCheckpoint({clock:()=>time,budgetMs:8,yieldWork:()=>{yields++;return new Promise(done=>resolve=done);}});
 assert.equal(checkpoint(),undefined);time=7.99;assert.equal(checkpoint(),undefined);time=8;const work=checkpoint();assert.equal(yields,1);
 time=108;resolve();await work;assert.equal(checkpoint(),undefined);time=116;const next=checkpoint();assert.equal(yields,2);resolve();await next;
});
test('startup yielding failures remain observable to the loading owner',()=>{
 const error=Error('yield failed'),checkpoint=createStartupCheckpoint({clock:()=>10,budgetMs:0,yieldWork(){throw error;}});
 assert.throws(checkpoint,value=>value===error);
});

test('startup batches microtasks but rejoins the normal task queue every 100 ms',async t=>{
 let now=1000,normal=0;
 t.mock.method(performance,'now',()=>now);
 const descriptor=Object.getOwnPropertyDescriptor(globalThis,'scheduler');
 Object.defineProperty(globalThis,'scheduler',{configurable:true,value:{
  postTask:async(callback,options)=>{assert.equal(options.priority,'user-visible');normal++;callback();}
 }});
 try{
  await yieldStartupTask();assert.equal(normal,1);
  now=1008;await yieldStartupTask();now=1099;await yieldStartupTask();assert.equal(normal,1);
  now=1100;await yieldStartupTask();assert.equal(normal,2);
  now=1132;await yieldStartupTask();assert.equal(normal,2);
 }finally{if(descriptor)Object.defineProperty(globalThis,'scheduler',descriptor);else delete globalThis.scheduler;}
});
