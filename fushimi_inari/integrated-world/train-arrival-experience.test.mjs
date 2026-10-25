import test from 'node:test';
import assert from 'node:assert/strict';
import {createTrainArrivalExperience} from './train-arrival-experience.mjs';

const sequenceOptions={interiorPose:{position:[4,3,10],target:[8,3,10]},
  platformPose:{position:[9,3,10],target:[15,3,10]},travelDirection:[0,0,1],travelDistance:24};
function setup({teleport=true,fallback=false,options=sequenceOptions,allowDebugCamera=false}={}){
  const calls={poses:0,looks:0,teleports:[],pauses:[],begins:0,states:[],fallbacks:0};
  const camera={position:{value:null,set(...value){this.value=value;calls.poses++;}},lookAt(...value){this.target=value;calls.looks++;}};
  const controls={enabled:true,target:{set(...value){this.value=value;}}};
  const station={offset:null,door:null,setTrainOffset(value){this.offset=[...value];},setDoorOpen(value){this.door=value;}};
  const walker={active:false,stop(){this.active=false;},pause(value){calls.pauses.push(value);},
    teleport(point,target){calls.teleports.push({point,target});this.active=teleport;return teleport;}};
  const experience=createTrainArrivalExperience({sequenceOptions:options,station,camera,controls,walker,allowDebugCamera,
    onBegin(){calls.begins++;},onFallback(){calls.fallbacks++;return fallback;},onState(state){calls.states.push(state);}});
  return {experience,calls,camera,controls,station,walker};
}
function finish(experience){for(let i=0;i<170;i++)experience.update(.1);return experience.snapshot;}

test('constructor stays idle; start owns the camera and starts moving with closed doors',()=>{
  const {experience,calls,camera,controls,station}=setup();
  assert.equal(experience.active,false);assert.equal(calls.poses,0);assert.equal(calls.begins,0);
  const state=experience.start();
  assert.equal(experience.active,true);assert.equal(state.phase,'moving');assert.equal(controls.enabled,false);
  assert.deepEqual(camera.position.value,[4,3,-14]);assert.deepEqual(station.offset,[0,0,-24]);assert.equal(station.door,0);
  assert.deepEqual(calls.pauses,[true]);assert.equal(calls.begins,1);assert.equal(calls.states.length,1);
});

test('menu or photo pause freezes timeline and leaves the photo camera untouched',()=>{
  const {experience,calls,camera,controls}=setup();experience.start();experience.update(.1);
  camera.position.set(100,100,100);camera.lookAt(200,100,100);const poses=calls.poses;
  const before=experience.snapshot.elapsed;controls.enabled=true;
  const paused=experience.update(500,{paused:true});
  assert.equal(paused.paused,true);assert.equal(paused.elapsed,before);assert.equal(controls.enabled,false);
  assert.equal(calls.poses,poses);assert.deepEqual(camera.position.value,[100,100,100]);
  experience.update(500,{paused:true});assert.equal(calls.states.length,2);
  const resumed=experience.update(.01);assert.equal(resumed.paused,false);
  assert.ok(Math.abs(resumed.elapsed-before-.01)<1e-9);assert.equal(calls.states.length,3);
  assert.notDeepEqual(camera.position.value,[100,100,100]);
});

test('completion hands off exactly once and subsequent frames never reset the walking camera',()=>{
  const {experience,calls,camera,controls,station}=setup();experience.start();const state=finish(experience);
  assert.equal(state.phase,'complete');assert.equal(state.handoff,'walking');assert.equal(experience.active,false);
  assert.equal(controls.enabled,false);assert.equal(station.door,0);assert.deepEqual(station.offset,[0,0,0]);
  assert.deepEqual(calls.teleports,[{point:[9,1.3,10],target:[15,3,10]}]);
  camera.position.set(25,3,25);const poses=calls.poses;
  experience.update(10);experience.skip();
  assert.equal(calls.teleports.length,1);assert.equal(calls.poses,poses);assert.deepEqual(camera.position.value,[25,3,25]);
  assert.deepEqual(calls.states.map(s=>s.phase),['moving','decelerating','stopped','opening','disembarking','closing','complete']);
});

test('an immediate skip closes the doors before the safe walking handoff',()=>{
  const {experience,calls,station}=setup();experience.start();
  const state=experience.skip();assert.equal(state.phase,'complete');assert.equal(state.handoff,'walking');
  assert.equal(state.paused,false);assert.equal(station.door,0);assert.equal(calls.teleports.length,1);
  assert.equal(calls.pauses.at(-1),false);
});

test('paused skip preserves the photo camera, walker and station until an unpaused update hands off once',()=>{
  const {experience,calls,camera,station}=setup();experience.start();
  for(let i=0;i<85;i++)experience.update(.1);
  camera.position.set(100,100,100);camera.lookAt(200,100,100);
  const before={poses:calls.poses,looks:calls.looks,pauses:[...calls.pauses],elapsed:experience.snapshot.elapsed,
    door:station.door,offset:[...station.offset]};
  const pending=experience.skip({paused:true});
  assert.equal(pending.skipPending,true);assert.equal(pending.paused,true);assert.equal(experience.active,true);
  experience.skip({paused:true});experience.update(100,{paused:true});
  assert.equal(calls.poses,before.poses);assert.equal(calls.looks,before.looks);assert.deepEqual(calls.pauses,before.pauses);
  assert.deepEqual(camera.position.value,[100,100,100]);assert.equal(station.door,before.door);
  assert.deepEqual(station.offset,before.offset);assert.equal(experience.snapshot.elapsed,before.elapsed);
  assert.equal(calls.teleports.length,0);
  const complete=experience.update(.01,{paused:false});
  assert.equal(complete.phase,'complete');assert.equal(complete.handoff,'walking');assert.equal(complete.skipPending,false);
  assert.equal(complete.paused,false);assert.equal(station.door,0);assert.equal(calls.teleports.length,1);
  experience.update(1);experience.skip();assert.equal(calls.teleports.length,1);
});

test('cancel and replay both discard a queued skip',()=>{
  for(const action of ['cancel','start']){
    const {experience,calls}=setup();experience.start();experience.skip({paused:true});
    experience[action]();assert.equal(experience.snapshot.skipPending,false);
    const state=experience.update(.1,{paused:false});assert.equal(calls.teleports.length,0);
    assert.equal(state.phase,action==='cancel'?'cancelled':'moving');
    assert.equal(experience.active,action==='start');
  }
});

test('cancel closes the train but relinquishes the camera without teleporting',()=>{
  const {experience,calls,camera,controls,station}=setup();experience.start();experience.update(.1,{paused:true});
  camera.position.set(99,10,99);const poses=calls.poses;
  const state=experience.cancel();
  assert.equal(state.phase,'cancelled');assert.equal(state.pose,null);assert.equal(experience.active,false);
  assert.equal(controls.enabled,false);assert.equal(calls.pauses.at(-1),false);
  assert.equal(calls.teleports.length,0);assert.equal(calls.poses,poses);assert.equal(station.door,0);
  assert.deepEqual(station.offset,[0,0,0]);experience.update(100);experience.skip();
  assert.deepEqual(camera.position.value,[99,10,99]);
});

test('replay replaces an active or complete run without stacking handoffs',()=>{
  const {experience,calls,station}=setup();experience.start();experience.update(.1);experience.start();
  assert.equal(experience.snapshot.elapsed,0);assert.deepEqual(station.offset,[0,0,-24]);
  experience.skip();assert.equal(calls.teleports.length,1);
  experience.start({reducedMotion:true});assert.equal(experience.snapshot.phase,'stopped');
  assert.deepEqual(station.offset,[0,0,0]);finish(experience);
  assert.equal(calls.teleports.length,2);assert.equal(calls.begins,3);
});

test('failed platform teleport tries fallback once; unavailable public handoff keeps orbit disabled at the safe pose',()=>{
  for(const fallback of [true,false]){
    const {experience,calls,camera,controls,station}=setup({teleport:false,fallback});experience.start();
    const state=experience.skip();assert.equal(state.handoff,fallback?'fallback':'unavailable');
    assert.equal(calls.fallbacks,1);assert.equal(calls.teleports.length,1);assert.equal(experience.active,false);
    assert.equal(controls.enabled,false);assert.equal(station.door,0);assert.deepEqual(camera.position.value,[9,3,10]);
    experience.skip();experience.update(1);assert.equal(calls.fallbacks,1);
  }
});

test('an idle adapter never unpauses another mode or changes its camera',()=>{
  const {experience,calls,camera}=setup();experience.skip();experience.cancel();
  assert.equal(calls.poses,0);assert.equal(calls.teleports.length,0);assert.deepEqual(calls.pauses,[]);
  assert.equal(camera.position.value,null);
});

test('Keihan announcement lead time keeps doors closed through both voices with reduced motion too',()=>{
 for(const reducedMotion of [false,true]){
  const {experience,station}=setup({options:{...sequenceOptions,durations:{stopped:4},announcementLeadTime:10}});
  experience.start({reducedMotion});
  for(let i=0;i<97;i++){experience.update(.1);assert.equal(station.door,0);}
  for(let i=0;i<20;i++)experience.update(.1);
  assert.ok(station.door>0);
 }
});

test('debug camera can resume orbit after an unavailable handoff or cancellation',()=>{
  const {experience,controls}=setup({teleport:false,allowDebugCamera:true});
  experience.start();experience.skip();assert.equal(controls.enabled,true);
  experience.start();experience.cancel();assert.equal(controls.enabled,true);
});
