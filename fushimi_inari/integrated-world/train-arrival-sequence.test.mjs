import test from 'node:test';
import assert from 'node:assert/strict';
import {createTrainArrivalSequence,TRAIN_ARRIVAL_PHASE_LABELS} from './train-arrival-sequence.mjs';

const config={interiorPose:{position:[4,3,10],target:[8,3,10]},
  platformPose:{position:[9,3,10],target:[15,3,10]},travelDirection:[0,0,2],travelDistance:24};
const create=options=>createTrainArrivalSequence({...config,...options});
const advance=(sequence,seconds)=>{for(let t=0;t<seconds-1e-8;t+=.05)sequence.update(Math.min(.05,seconds-t));return sequence.getSnapshot();};
const near=(actual,expected)=>assert.ok(Math.abs(actual-expected)<1e-8,`${actual} != ${expected}`);

test('constructor is idle and start frames the closed door inside the moving train',()=>{
  const sequence=create(),idle=sequence.getSnapshot();
  assert.equal(idle.phase,'idle');assert.equal(idle.pose,null);assert.equal(idle.controlsEnabled,true);
  const first=sequence.start();
  assert.equal(first.phase,'moving');assert.equal(first.controlsEnabled,false);assert.equal(first.doorProgress,0);
  assert.deepEqual(first.trainOffset,[0,0,-24]);
  assert.deepEqual(first.pose,{position:[4,3,-14],target:[8,3,-14]});
  assert.deepEqual(sequence.start(),first);
});

test('the complete timeline brakes, opens, automatically disembarks, closes, then releases control',()=>{
  const sequence=create();sequence.start();
  let state=advance(sequence,3);assert.equal(state.phase,'decelerating');near(state.trainOffset[2],-9.6);
  state=advance(sequence,4);assert.equal(state.phase,'stopped');assert.ok(state.trainOffset.every(v=>v===0));
  state=advance(sequence,1);assert.equal(state.phase,'opening');assert.equal(state.doorProgress,0);
  state=advance(sequence,.9);near(state.doorProgress,.5);assert.deepEqual(state.pose,config.interiorPose);
  state=advance(sequence,.9);assert.equal(state.phase,'disembarking');assert.equal(state.doorProgress,1);
  state=advance(sequence,1.7);near(state.pose.position[0],6.5);assert.equal(state.controlsEnabled,false);
  state=advance(sequence,1.7);assert.equal(state.phase,'closing');assert.deepEqual(state.pose,config.platformPose);
  state=advance(sequence,1.8);assert.equal(state.phase,'complete');assert.equal(state.doorProgress,0);
  assert.deepEqual(state.pose,config.platformPose);assert.equal(state.controlsEnabled,true);assert.equal(state.progress,1);
  assert.equal(state.phaseLabel,TRAIN_ARRIVAL_PHASE_LABELS.complete);
  assert.deepEqual(sequence.update(1),state);
});

test('skip and reset are safe and idempotent at every point, including before arrival starts',()=>{
  for(const seconds of [0,2,4,7.5,8.5,10.5,14.5]){
    const sequence=create();if(seconds){sequence.start();advance(sequence,seconds);}
    const state=sequence.skip();
    assert.equal(state.phase,'complete');assert.equal(state.controlsEnabled,true);assert.equal(state.active,false);
    assert.deepEqual(state.pose,config.platformPose);assert.equal(state.doorProgress,0);assert.ok(state.trainOffset.every(v=>v===0));
    assert.deepEqual(sequence.skip(),state);assert.deepEqual(sequence.reset(),state);
  }
});

test('replay replaces prior progress and uses immutable copies of caller data and snapshots',()=>{
  const settings=structuredClone(config),sequence=createTrainArrivalSequence(settings);
  settings.interiorPose.position[0]=999;
  const first=sequence.start();advance(sequence,10);sequence.pause();
  const replay=sequence.replay();
  assert.equal(replay.phase,'moving');assert.equal(replay.elapsed,0);assert.equal(replay.paused,false);
  assert.deepEqual(replay.pose,first.pose);assert.deepEqual(replay.trainOffset,first.trainOffset);
  replay.pose.position[0]=-999;replay.trainOffset[0]=-999;
  assert.deepEqual(sequence.getSnapshot().pose,first.pose);
  sequence.replay();sequence.replay();advance(sequence,16);
  assert.equal(sequence.getSnapshot().phase,'complete');
});

test('manual and external pause discard time, and resume cannot jump past the next frame',()=>{
  const sequence=create();sequence.start();advance(sequence,4);
  const paused=sequence.pause();assert.deepEqual(sequence.update(300),paused);
  assert.deepEqual(sequence.pause(),paused);sequence.resume();
  const resumed=sequence.getSnapshot();assert.deepEqual(sequence.update(300,{paused:true}),resumed);
  const next=sequence.update(300);near(next.elapsed,resumed.elapsed+.1);
  assert.equal(next.phase,resumed.phase);
});

test('invalid deltas do nothing; stale frames are bounded and subsequent frames finish',()=>{
  const sequence=create();sequence.start();const state=sequence.getSnapshot();
  for(const dt of [NaN,Infinity,-1,0,undefined])assert.deepEqual(sequence.update(dt),state);
  near(sequence.update(100000).elapsed,.1);
  advance(sequence,16);assert.equal(sequence.getSnapshot().phase,'complete');
});

test('regular frame partitions produce the same pose and doors at the same elapsed time',()=>{
  const a=create(),b=create();a.start();b.start();
  advance(a,10.6);for(let i=0;i<106;i++)b.update(.1);
  const x=a.getSnapshot(),y=b.getSnapshot();
  assert.equal(x.phase,y.phase);near(x.elapsed,y.elapsed);near(x.doorProgress,y.doorProgress);
  x.pose.position.forEach((v,i)=>near(v,y.pose.position[i]));
});

test('reduced motion removes approach travel and crossing dolly while retaining an automatic safe exit',()=>{
  const sequence=create({reducedMotion:true});let state=sequence.start();
  assert.equal(state.phase,'stopped');assert.ok(state.trainOffset.every(v=>v===0));assert.deepEqual(state.pose,config.interiorPose);
  state=advance(sequence,2.8);assert.equal(state.phase,'disembarking');assert.deepEqual(state.pose,config.platformPose);
  assert.equal(state.doorProgress,1);assert.equal(state.controlsEnabled,false);
  state=advance(sequence,7);assert.equal(state.phase,'complete');assert.equal(state.doorProgress,0);
  assert.deepEqual(state.pose,config.platformPose);assert.equal(state.controlsEnabled,true);
});

test('cancel relinquishes camera ownership for teleport and never reapplies the platform pose',()=>{
  const sequence=create();sequence.start();advance(sequence,9);const cancelled=sequence.cancel();
  assert.equal(cancelled.phase,'cancelled');assert.equal(cancelled.pose,null);assert.equal(cancelled.doorProgress,0);
  assert.equal(cancelled.controlsEnabled,true);assert.equal(cancelled.active,false);
  assert.deepEqual(sequence.update(10),cancelled);assert.deepEqual(sequence.cancel(),cancelled);
  assert.equal(sequence.replay().phase,'moving');
});

test('malformed geometry and timing fail immediately instead of producing NaN poses or a trapped timeline',()=>{
  for(const options of [{interiorPose:null},{platformPose:{position:[0,0,0],target:[0,0,0]}},
    {travelDirection:[0,0,0]},{travelDistance:Infinity},{durations:{opening:0}},
    {durations:{closing:NaN}},{durations:{moving:-1}}])assert.throws(()=>create(options),TypeError);
});
