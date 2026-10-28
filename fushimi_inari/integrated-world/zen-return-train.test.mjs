import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createZenReturnTrain} from './zen-return-train.mjs';

function fixture(options={}){
 const scene=new THREE.Scene(),group=new THREE.Group();scene.add(group);
 const camera=new THREE.PerspectiveCamera();camera.position.set(4,11.7,0);camera.lookAt(0,11.7,0);
 const spec={route:{platformDoor:[4,10,0]},arrival:{interiorPose:{position:[0,11.725,0],target:[10,11.7,0]},platformPose:{position:[4,11.7,0],target:[10,11.7,0]},travelDirection:[0,0,1]}};
 const station={built:true,spec,group,offset:[0,0,0],door:0,setTrainOffset(value){this.offset=[...value];},setDoorOpen(value){this.door=value;}};
 const walker={active:true,paused:false,teleports:0,stop(){this.active=false;},start(){this.active=true;},pause(value){this.paused=value;},teleport(point,target){this.teleports++;camera.position.set(point[0],point[1]+1.7,point[2]);camera.lookAt(...target);this.active=true;return options.teleportSuccess!==false;}};
 const controls={enabled:true,target:new THREE.Vector3()};let completed=0,cancelled=0,begun=0;
 const train=createZenReturnTrain({station,camera,walker,controls,onBegin(){begun++;},onComplete(){completed++;},onCancel(){cancelled++;},...options});
 return {scene,station,camera,walker,controls,train,get completed(){return completed;},get cancelled(){return cancelled;},get begun(){return begun;}};
}
const finish=f=>{for(let i=0;i<160&&f.train.active;i++)f.train.update(.1);};

test('boarding requires the real platform doorway and correct walking height',()=>{
 const f=fixture();f.camera.position.x=9.1;assert.equal(f.train.start().ok,false);assert.equal(f.begun,0);
 f.camera.position.set(4,15,0);assert.equal(f.train.start().ok,false);
 f.camera.position.set(4,11.7,0);assert.equal(f.train.start().ok,true);assert.equal(f.train.active,true);
 assert.equal(f.walker.paused,true);assert.equal(f.controls.enabled,false);assert.equal(f.train.start().ok,false);f.train.dispose();
 const unavailable=createZenReturnTrain({});assert.equal(unavailable.start().ok,false);unavailable.dispose();
});

test('departure opens before crossing the threshold, closes before movement and restores a safe walking handoff',()=>{
 const f=fixture();f.train.start();let sawBoarding=false,sawClosing=false,sawDeparture=false,lastDistance=0,maxDistance=0;
 for(let i=0;i<150&&f.train.active;i++){
  f.train.update(.1);const s=f.train.stats;
  if(s.phase==='boarding'){sawBoarding=true;assert.equal(f.station.door,1);assert.equal(f.station.offset[2],0);}
  if(s.phase==='closing'){sawClosing=true;assert.equal(f.station.offset[2],0);}
  if(s.phase==='departing'){sawDeparture=true;assert.equal(f.station.door,0);assert.ok(f.station.offset[2]>=lastDistance);lastDistance=f.station.offset[2];maxDistance=Math.max(maxDistance,lastDistance);assert.ok(Math.abs(f.camera.position.z-f.station.offset[2])<1e-9);}
 }
 assert.ok(sawBoarding&&sawClosing&&sawDeparture);assert.ok(maxDistance>20&&maxDistance<=24,'camera remains over the authored track segment');assert.equal(f.completed,1);assert.equal(f.train.active,false);
 assert.equal(f.walker.paused,false);assert.equal(f.walker.active,true);assert.equal(f.walker.teleports,1);
 assert.deepEqual(f.station.offset,[0,0,0]);assert.equal(f.station.door,0);assert.deepEqual(f.camera.position.toArray(),[4,11.7,0]);
 f.train.update(1);assert.equal(f.completed,1);assert.equal(f.train.start().ok,true);finish(f);assert.equal(f.completed,2);f.train.dispose();
});

test('pause discards time and invalid or huge deltas cannot skip phases',()=>{
 const f=fixture();f.train.start();f.train.update(1000);assert.equal(f.train.stats.elapsed,.1);
 const position=f.camera.position.clone(),door=f.station.door;
 for(const delta of [NaN,Infinity,-1,0])f.train.update(delta);assert.equal(f.train.stats.elapsed,.1);
 f.train.update(1000,{paused:true});assert.equal(f.train.stats.elapsed,.1);assert.ok(position.equals(f.camera.position));assert.equal(f.station.door,door);
 f.train.update(.1);assert.equal(f.train.stats.paused,false);assert.equal(f.train.stats.elapsed,.2);f.train.dispose();
});

test('cancel and disposal release ownership even when walker teleport rejects the handoff',()=>{
 for(const phaseUpdates of [1,14,38,62]){
  const f=fixture({teleportSuccess:false});f.train.start();for(let i=0;i<phaseUpdates;i++)f.train.update(.1);
  assert.equal(f.train.cancel(),true);assert.equal(f.train.active,false);assert.equal(f.walker.paused,false);assert.equal(f.cancelled,1);
  assert.deepEqual(f.camera.position.toArray(),[4,11.7,0]);assert.deepEqual(f.station.offset,[0,0,0]);assert.equal(f.station.door,0);assert.equal(f.walker.active,true);
  assert.equal(f.train.start().ok,true);f.train.dispose();assert.equal(f.train.active,false);assert.equal(f.walker.paused,false);
  assert.equal(f.train.interactionRoot.parent,null);assert.equal(f.train.start().ok,false);f.train.dispose();
 }
});

test('reduced motion completes and can replay without moving the train',()=>{
 const f=fixture({reducedMotion:()=>true});f.train.start();
 while(f.train.active){f.train.update(.1);assert.deepEqual(f.station.offset,[0,0,0]);}
 assert.equal(f.completed,1);assert.equal(f.train.stats.reducedMotion,true);assert.ok(f.train.stats.elapsed<3);
 assert.equal(f.train.start().ok,true);finish(f);assert.equal(f.completed,2);f.train.dispose();
});

test('callback errors release camera and walking ownership before returning failure',()=>{
 const f=fixture({onBegin(){throw Error('begin callback');}});assert.equal(f.train.start().ok,false);
 assert.equal(f.train.active,false);assert.equal(f.walker.paused,false);assert.equal(f.walker.active,true);f.train.dispose();
});

test('a viewer begin callback cannot leave walking unpaused during departure ownership',()=>{
 const f=fixture();const original=f.train.stats;
 f.train.dispose();
 const train=createZenReturnTrain({station:f.station,camera:f.camera,walker:f.walker,controls:f.controls,onBegin(){f.walker.pause(false);f.controls.enabled=true;}});
 train.start();assert.equal(f.walker.paused,true);assert.equal(f.controls.enabled,false);assert.equal(original.active,false);train.dispose();
});
