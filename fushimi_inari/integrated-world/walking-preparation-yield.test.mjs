import test from 'node:test';
import assert from 'node:assert/strict';
import {Sphere,Vector3} from 'three';
import {createWalkingPreparationYield} from './walking-preparation-yield.mjs';
import {createWalkingPrewarm} from './walking-prewarm.mjs';

function fixture(){
 const frames=new Map(),tasks=new Map();let frameId=0,taskId=0;
 const service=createWalkingPreparationYield({
  requestFrame:callback=>{const id=frameId++;frames.set(id,callback);return id;},cancelFrame:id=>frames.delete(id),
  schedule:callback=>{const id=taskId++;tasks.set(id,callback);return id;},cancelTask:id=>tasks.delete(id)
 });
 const run=queue=>{const callbacks=[...queue.values()];queue.clear();for(const callback of callbacks)callback();};
 return {service,frames,tasks,frame:()=>run(frames),task:()=>run(tasks)};
}

test('a preparation yield waits for both the next frame and its following macrotask',async()=>{
 const f=fixture();let completed=false;
 const work=f.service.yield().then(()=>{completed=true;});
 assert.equal(f.frames.size,1);assert.equal(f.tasks.size,0);
 await Promise.resolve();assert.equal(completed,false);
 f.frame();assert.equal(f.frames.size,0);assert.equal(f.tasks.size,1);
 await Promise.resolve();assert.equal(completed,false);
 f.task();await work;assert.equal(completed,true);assert.equal(f.tasks.size,0);f.service.dispose();
});

test('a serial worker cannot resume two preparation leaves in the same frame',async()=>{
 const f=fixture(),compiled=[];
 const work=(async()=>{for(let i=0;i<2;i++){await f.service.yield();compiled.push(i);}})();
 f.frame();f.task();await Promise.resolve();assert.deepEqual(compiled,[0]);assert.equal(f.frames.size,1);
 f.task();await Promise.resolve();assert.deepEqual(compiled,[0]);
 f.frame();assert.deepEqual(compiled,[0]);f.task();await work;assert.deepEqual(compiled,[0,1]);f.service.dispose();
});

for(const afterFrame of [false,true])test(`cancellation ${afterFrame?'after':'before'} RAF settles waits and leaves no stale callbacks`,async()=>{
 const f=fixture();let current=true,compiled=0;
 const work=(async()=>{await f.service.yield();if(current)compiled++;})();
 if(afterFrame)f.frame();
 const stale=[...f.frames.values(),...f.tasks.values()];current=false;f.service.cancel();f.service.cancel();
 await work;assert.equal(compiled,0);assert.equal(f.frames.size,0);assert.equal(f.tasks.size,0);
 for(const callback of stale)callback();assert.equal(f.tasks.size,0);
 const next=f.service.yield();assert.equal(f.frames.size,1);f.frame();f.task();await next;f.service.dispose();
});

test('cancel settles all outstanding waits, including frame IDs and task IDs equal to zero',async()=>{
 const f=fixture(),first=f.service.yield(),second=f.service.yield();f.frame();
 assert.equal(f.tasks.size,2);f.service.cancel();await Promise.all([first,second]);
 assert.equal(f.frames.size,0);assert.equal(f.tasks.size,0);f.service.dispose();
});

test('dispose is idempotent, settles pending waits and makes future waits immediately inert',async()=>{
 const f=fixture(),first=f.service.yield();f.frame();const second=f.service.yield();
 assert.equal(f.frames.size,1);assert.equal(f.tasks.size,1);
 f.service.dispose();f.service.dispose();await Promise.all([first,second]);
 await f.service.yield();f.service.cancel();assert.equal(f.frames.size,0);assert.equal(f.tasks.size,0);
});

test('blocking real walking prewarm and cancelling its frame wait releases awaitIdle without compilation',async()=>{
 for(const afterFrame of [false,true]){
  const f=fixture(),scheduled=[];let builds=0,idle=false;
  const prewarm=createWalkingPrewarm({entries:[{object:{id:1},bounds:new Sphere(new Vector3(),1)}],schedule:callback=>{scheduled.push(callback);},
   compile:async(object,{isCurrent})=>{
    if(!isCurrent())return false;
    await f.service.yield();
    if(!isCurrent())throw new Error('Walking preparation paused');
    builds++;return true;
   }
  });
  prewarm.update(new Vector3(),0);const running=scheduled.shift()();
  assert.equal(prewarm.stats.active,true);if(afterFrame)f.frame();
  prewarm.setBlocked(true);const waiting=prewarm.awaitIdle().then(()=>{idle=true;});
  await Promise.resolve();assert.equal(idle,false);
  f.service.cancel();await running;await waiting;
  assert.equal(idle,true);assert.equal(builds,0);assert.equal(prewarm.stats.compiled,0);
  assert.equal(prewarm.stats.failed,0);assert.equal(prewarm.stats.cancelled,1);assert.equal(prewarm.stats.active,false);
  assert.equal(scheduled.length,0);assert.equal(f.frames.size,0);assert.equal(f.tasks.size,0);
  prewarm.dispose();f.service.dispose();
 }
});
