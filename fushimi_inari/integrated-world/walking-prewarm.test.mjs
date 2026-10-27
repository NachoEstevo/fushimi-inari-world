import test from 'node:test';
import assert from 'node:assert/strict';
import {Box3,Sphere,Vector3} from 'three';
import {createWalkingPrewarm} from './walking-prewarm.mjs';

function fixture(options={}){
 const tasks=[],calls=[],entries=Array.from({length:20},(_,i)=>({object:{id:i},bounds:new Sphere(new Vector3(40+i,0,0),1)}));
 const service=createWalkingPrewarm({entries,schedule:task=>{tasks.push(task);},compile:async(object,context)=>{calls.push(object.id);assert.equal(context.isCurrent(),true);},...options});
 return {service,tasks,calls,entries,async drain(){while(tasks.length){await tasks.shift()();}}};
}

test('walking queries predicted bounds after movement and cadence; queue is nearest, capped and deduplicated',async()=>{
 const f=fixture();f.service.update(new Vector3(),0,{direction:new Vector3(1,0,0)});
 assert.equal(f.service.stats.queued,8);assert.equal(f.tasks.length,1);assert.equal(f.service.stats.queries,1);
 await f.drain();assert.deepEqual(f.calls,[0,1,2,3,4,5,6,7]);
 f.service.update(new Vector3(5,0,0),2000);await f.drain();assert.equal(f.service.stats.queries,2);assert.equal(new Set(f.calls).size,16);
 f.service.update(new Vector3(12,0,0),1000);assert.equal(f.service.stats.queries,2);
 f.service.update(new Vector3(12,0,0),4000);await f.drain();assert.equal(f.service.stats.queries,3);assert.equal(new Set(f.calls).size,20);
 f.service.dispose();
});

test('refills exhausted batches at bounded cadence while stationary, then stops querying',async()=>{
 const f=fixture();const position=new Vector3();f.service.update(position,0,{direction:new Vector3(1,0,0)});await f.drain();
 f.service.update(position,1499,{direction:new Vector3(1,0,0)});assert.equal(f.service.stats.queries,1);
 f.service.update(position,1500,{direction:new Vector3(1,0,0)});await f.drain();assert.equal(f.calls.length,16);
 f.service.update(position,3000,{direction:new Vector3(1,0,0)});await f.drain();assert.equal(f.calls.length,20);
 f.service.update(position,10000,{direction:new Vector3(1,0,0)});assert.equal(f.service.stats.queries,3);f.service.dispose();
});

test('configured backlog cadence refills quickly without accelerating movement queries',async()=>{
 const f=fixture({refillIntervalMs:100});const p=new Vector3(),direction=new Vector3(1,0,0);
 f.service.update(p,0,{direction});await f.drain();
 f.service.update(p,99,{direction});assert.equal(f.service.stats.queries,1);
 f.service.update(p,100,{direction});await f.drain();assert.equal(f.calls.length,16);
 f.service.update(p,200,{direction});await f.drain();assert.equal(f.calls.length,20);
 f.service.update(p,300,{direction});assert.equal(f.service.stats.queries,3);
 f.service.update(new Vector3(7,0,0),500,{direction});assert.equal(f.service.stats.queries,3);
 f.service.update(new Vector3(7,0,0),1500,{direction});assert.equal(f.service.stats.queries,4);f.service.dispose();
});

test('a meaningful turn queries new ahead candidates without walking',async()=>{
 const entries=[{object:{id:1},bounds:new Sphere(new Vector3(40,0,0),1)},{object:{id:2},bounds:new Sphere(new Vector3(-40,0,0),1)}];
 const f=fixture({entries,radius:10});const p=new Vector3();f.service.update(p,0,{direction:new Vector3(1,0,0)});await f.drain();assert.deepEqual(f.calls,[1]);
 f.service.update(p,1499,{direction:new Vector3(-1,0,0)});assert.equal(f.service.stats.queries,1);
 f.service.update(p,1500,{direction:new Vector3(-1,0,0)});await f.drain();assert.deepEqual(f.calls,[1,2]);f.service.dispose();
});

test('nearby objects behind the camera warm without scanning distant cells',async()=>{
 const entries=[{object:{id:1},bounds:new Sphere(new Vector3(-60,0,0),1)},{object:{id:2},bounds:new Sphere(new Vector3(40,0,0),1)},{object:{id:3},bounds:new Sphere(new Vector3(-300,0,0),1)}];
 const f=fixture({entries,maxPending:1});const p=new Vector3();f.service.update(p,0,{direction:new Vector3(1,0,0)});await f.drain();
 f.service.update(p,1500,{direction:new Vector3(1,0,0)});await f.drain();
 assert.deepEqual(new Set(f.calls),new Set([1,2]));assert.equal(f.service.stats.checked,3);f.service.dispose();
});

test('radius updates discover newly covered entries without warming existing ones again',async()=>{
 const entries=[{object:{id:1},bounds:new Sphere(new Vector3(),1)},{object:{id:2},bounds:new Sphere(new Vector3(-140,0,0),1)}];
 const f=fixture({entries,lookAhead:0});const p=new Vector3();f.service.update(p,0);await f.drain();assert.deepEqual(f.calls,[1]);
 f.service.setRadius(174);f.service.update(p,1);await f.drain();assert.deepEqual(f.calls,[1,2]);const queries=f.service.stats.queries;
 f.service.setRadius(174);f.service.update(p,10000);assert.equal(f.service.stats.queries,queries);
 for(const value of [0,-1,Infinity,NaN])assert.throws(()=>f.service.setRadius(value),RangeError);f.service.dispose();
});

test('equal surface distance favors closer bounds centers',async()=>{
 const entries=[{object:{id:1},bounds:new Sphere(new Vector3(70,0,0),100)},{object:{id:2},bounds:new Sphere(new Vector3(3,0,0),5)}];
 const f=fixture({entries,lookAhead:0,maxPending:1});f.service.update(new Vector3(),0);await f.drain();assert.deepEqual(f.calls,[2]);
 f.service.update(new Vector3(),1500);await f.drain();assert.deepEqual(f.calls,[2,1]);f.service.dispose();
});

test('failed and declined entries do not loop on automatic refills',async()=>{
 const entries=Array.from({length:10},(_,i)=>({object:{id:i},bounds:new Sphere(new Vector3(i,0,0),1)}));
 const f=fixture({entries,maxPending:2,refillIntervalMs:100,compile:async o=>{if(o.id===0)throw Error('failed');if(o.id===1)return false;f.calls.push(o.id);}});
 f.service.update(new Vector3(),0);await f.drain();for(let t=100;t<=1200;t+=100){f.service.update(new Vector3(),t);await f.drain();}
 assert.equal(f.service.stats.failed,1);assert.equal(f.calls.length,8);assert.equal(f.service.stats.queries,5);f.service.dispose();
});

test('a registered root already rendered is skipped in the queue and becomes eligible after invalidation',async()=>{
 const entries=Array.from({length:3},(_,i)=>({object:{id:i},bounds:new Sphere(new Vector3(i,0,0),1)}));
 const f=fixture({entries});f.service.update(new Vector3(),0);f.service.markRendered(entries[0].object);f.service.markRendered(entries[0].object);f.service.markRendered({id:99});
 await f.drain();assert.deepEqual(f.calls,[1,2]);assert.equal(f.service.stats.rendered,1);assert.equal(f.service.stats.compiled,2);
 f.service.invalidate();f.service.update(new Vector3(),2000);await f.drain();assert.deepEqual(f.calls,[1,2,0,1,2]);assert.equal(f.service.stats.rendered,1);f.service.dispose();
});

test('blocked tasks stay dormant, in-flight batches cancel before checkpoint and resume without overlap',async()=>{
 let release,context,active=0,maxActive=0;
 const f=fixture({compile:async(object,value)=>{active++;maxActive=Math.max(maxActive,active);context=value;await new Promise(resolve=>release=resolve);active--;}});
 f.service.update(new Vector3(),0,{blocked:true});assert.equal(f.tasks.length,0);
 f.service.update(new Vector3(),0);const running=f.tasks.shift()();assert.equal(active,1);
 f.service.setBlocked(true);assert.equal(context.isCurrent(),false);
 let idle=false;const waiting=f.service.awaitIdle().then(()=>{idle=true;});await Promise.resolve();assert.equal(idle,false);
 release();await running;await waiting;assert.equal(f.tasks.length,0);assert.equal(f.service.stats.cancelled,1);assert.equal(f.service.stats.compiled,0);
 f.service.update(new Vector3(),2000,{blocked:true});assert.equal(f.tasks.length,0);
 f.service.update(new Vector3(),2000);const resumed=f.tasks.shift()();assert.equal(active,1);release();await resumed;
 f.service.setBlocked(true);assert.equal(maxActive,1);f.service.dispose();await f.drain();
});

test('quality invalidation cancels old work and records only new-generation successes',async()=>{
 let release,context;const attempts=[];
 const f=fixture({entries:[{object:{id:1},bounds:new Sphere(new Vector3(),1)}],compile:async(object,value)=>{attempts.push(value.generation);context=value;await new Promise(resolve=>release=resolve);}});
 f.service.update(new Vector3(),0);const first=f.tasks.shift()();f.service.invalidate();assert.equal(context.isCurrent(),false);release();await first;
 assert.equal(f.service.stats.compiled,0);const second=f.tasks.shift()();release();await second;assert.deepEqual(attempts,[0,1]);assert.equal(f.service.stats.compiled,1);
 f.service.update(new Vector3(7,0,0),2000);await f.drain();assert.equal(attempts.length,2);f.service.dispose();
});

test('paused queued tasks do no compilation and completed roots warm again after quality changes',async()=>{
 const f=fixture({entries:[{object:{id:1},bounds:new Sphere(new Vector3(),1)}]});
 f.service.update(new Vector3(),0);f.service.setBlocked(true);await f.drain();assert.equal(f.calls.length,0);assert.equal(f.tasks.length,0);
 f.service.update(new Vector3(),1);await f.drain();assert.deepEqual(f.calls,[1]);
 f.service.update(new Vector3(),10000);assert.equal(f.tasks.length,0);
 f.service.invalidate();f.service.update(new Vector3(),10001);await f.drain();assert.deepEqual(f.calls,[1,1]);
 f.service.dispose();
});

test('disposing cancels in-flight work and releases all pending metadata without scheduling a retry',async()=>{
 let release,context;const f=fixture({compile:async(object,value)=>{context=value;await new Promise(resolve=>release=resolve);}});
 f.service.update(new Vector3(),0);const work=f.tasks.shift()();f.service.dispose();assert.equal(context.isCurrent(),false);release();await work;await f.service.awaitIdle();
 assert.equal(f.service.stats.registered,0);assert.equal(f.service.stats.queued,0);assert.equal(f.service.stats.compiled,0);assert.equal(f.tasks.length,0);
});

test('compile failures are retryable on a later query without a tight task loop',async()=>{
 let fail=true,errors=0;
 const f=fixture({entries:[{object:{id:1},bounds:new Sphere(new Vector3(),1)}],compile:()=>{if(fail)throw Error('pipeline unavailable');},onError:()=>{errors++;}});
 f.service.update(new Vector3(),0);await f.drain();await f.service.awaitIdle();assert.equal(errors,1);assert.equal(f.service.stats.compiled,0);assert.equal(f.tasks.length,0);
 fail=false;f.service.update(new Vector3(7,0,0),2000);await f.drain();assert.equal(f.service.stats.compiled,1);f.service.dispose();
});

test('deferred append indexes only supplied finite bounds and leaves distant cells unqueried',async()=>{
 const f=fixture({entries:[]});
 const root={id:9,traverse(){assert.fail('scene traversal is forbidden');}};
 f.service.append([{object:root,bounds:new Box3(new Vector3(39,-1,-1),new Vector3(41,1,1))},{object:{id:10},bounds:null},{object:{id:11},bounds:new Sphere(new Vector3(Infinity,0,0),1)}]);
 const far=Array.from({length:200},(_,i)=>({object:{id:100+i},bounds:new Sphere(new Vector3(1000+i*1000,0,0),1)}));f.service.append(far);
 f.service.append([{object:root,bounds:new Sphere(new Vector3(),1)}]);
 f.service.update(new Vector3(),0,{direction:new Vector3(1,0,0)});await f.drain();assert.deepEqual(f.calls,[9]);assert.equal(f.service.stats.registered,201);assert.equal(f.service.stats.checked,1);assert.equal(f.service.stats.skippedBounds,2);
 f.service.append([{object:{id:12},bounds:new Sphere(new Vector3(40,0,0),1)}]);f.service.update(new Vector3(),1,{direction:new Vector3(1,0,0)});await f.drain();assert.deepEqual(f.calls,[9,12]);f.service.dispose();
});
