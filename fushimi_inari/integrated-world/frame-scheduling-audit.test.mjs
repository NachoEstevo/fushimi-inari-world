import test from 'node:test';
import assert from 'node:assert/strict';
import {installFrameSchedulingAudit} from './frame-scheduling-audit.mjs';

function fixture(options={}){
 let time=0,next=0;const timers=new Map();
 const audit=installFrameSchedulingAudit({now:()=>time,setTimer:(callback,delay)=>{const id=next++;timers.set(id,{callback,delay});return id;},clearTimer:id=>timers.delete(id),...options});
 assert.equal(timers.size,1,'installation schedules one heartbeat');
 return {audit,timers,at:value=>{time=value;},tick(value){time=value;const [id,{callback}]=timers.entries().next().value;timers.delete(id);callback();}};
}

test('50 ms heartbeats continue through a RAF gap and are attached to its diagnostic event',()=>{
 const f=fixture();assert.equal(f.timers.values().next().value.delay,50);f.audit.noteFrame(0);
 for(const time of [50,100,150])f.tick(time);
 f.at(200);f.audit.noteFrame(200);const stats=f.audit.stats,event=stats.recent.at(-1);
 assert.equal(stats.heartbeats.count,3);assert.equal(stats.heartbeats.maxDriftMs,0);assert.equal(stats.frames.maxGapMs,200);
 assert.equal(event.kind,'frame');assert.equal(event.gapMs,200);assert.equal(event.entryLagMs,0);
 assert.deepEqual(event.heartbeats.map(beat=>beat.timeMs),[50,100,150]);f.audit.dispose();
});

test('timer drift and RAF entry lag reveal delayed task execution without GPU synchronization',()=>{
 const f=fixture();f.audit.noteFrame(0);f.tick(300);
 f.at(350);f.audit.noteFrame(250);const stats=f.audit.stats;
 assert.equal(stats.heartbeats.maxDriftMs,250);assert.equal(stats.frames.maxEntryLagMs,100);
 assert.equal(stats.recent[0].kind,'heartbeat');assert.equal(stats.recent[0].expectedTimeMs,50);assert.equal(stats.recent[0].driftMs,250);
 assert.equal(stats.recent[1].timestamp,250);assert.equal(stats.recent[1].timeMs,350);f.audit.dispose();
});

test('rings are bounded, snapshot mutation is isolated and slow events survive ordinary heartbeats',()=>{
 const f=fixture({limit:2});f.audit.noteFrame(0);
 for(const time of [100,200,300])f.tick(time);
 assert.equal(f.audit.stats.recent.length,2);assert.deepEqual(f.audit.stats.recent.map(event=>event.timeMs),[200,300]);
 for(let time=350;time<=1000;time+=50)f.tick(time);
 const stats=f.audit.stats;assert.equal(stats.recent.length,2);assert.equal(stats.heartbeatHistory.length,8);
 stats.recent[0].driftMs=999;stats.heartbeatHistory[0].timeMs=999;
 assert.equal(f.audit.stats.recent[0].driftMs,50);assert.notEqual(f.audit.stats.heartbeatHistory[0].timeMs,999);f.audit.dispose();
});

test('reset restarts one timer and clears prior frame history; disposal cancels pending ownership',()=>{
 const f=fixture(),stale=f.timers.values().next().value.callback;f.at(100);f.audit.noteFrame(0);
 f.audit.reset();assert.equal(f.timers.size,1);assert.equal(f.audit.stats.frames.count,0);assert.equal(f.audit.stats.recent.length,0);
 stale();assert.equal(f.timers.size,1);assert.equal(f.audit.stats.heartbeats.count,0);
 f.tick(150);assert.equal(f.audit.stats.heartbeats.maxDriftMs,0);f.audit.noteFrame(150);assert.equal(f.audit.stats.frames.maxGapMs,0);
 const pending=f.timers.values().next().value.callback;f.audit.dispose();f.audit.dispose();assert.equal(f.timers.size,0);
 pending();f.audit.noteFrame(300);f.audit.reset();assert.equal(f.timers.size,0);assert.equal(f.audit.stats.frames.count,1);
});

test('ordinary and invalid frame timestamps do not create false slow events',()=>{
 const f=fixture();f.audit.noteFrame(NaN);f.audit.noteFrame(Infinity);f.at(10);f.audit.noteFrame(8);f.at(26);f.audit.noteFrame(24);
 assert.equal(f.audit.stats.frames.count,2);assert.equal(f.audit.stats.frames.maxEntryLagMs,2);assert.equal(f.audit.stats.frames.maxGapMs,16);assert.deepEqual(f.audit.stats.recent,[]);f.audit.dispose();
});
