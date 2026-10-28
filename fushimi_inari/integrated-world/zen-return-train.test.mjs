import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from 'three';
import {createZenReturnTrain} from './zen-return-train.mjs';
import {createKeihanStationSpec} from './keihan-station-spec.mjs';
const features=JSON.parse(readFileSync(new URL('../geography/features.json',import.meta.url)));
function fixture(options={}){
 const scene=new THREE.Scene(),group=new THREE.Group();scene.add(group);const spec=createKeihanStationSpec(features,{height:()=>10});
 const camera=new THREE.PerspectiveCamera();camera.position.fromArray(spec.arrival.platformPose.position);camera.lookAt(...spec.arrival.platformPose.target);
 const station={built:true,spec,group,colliders:options.colliders??[],offset:[0,0,0],door:0,setTrainOffset(v){this.offset=[...v];},setDoorOpen(v){this.door=v;}};
 const walker={active:true,paused:false,teleports:0,stop(){this.active=false;},start(){this.active=true;},pause(v){this.paused=v;},teleport(point,target){this.teleports++;if(options.teleportSuccess===false)return false;camera.position.set(point[0],point[1]+1.7,point[2]);camera.lookAt(...target);this.active=true;return true;}};
 const controls={enabled:true,target:new THREE.Vector3()};let completed=0,cancelled=0,begun=0;
 const train=createZenReturnTrain({station,camera,walker,controls,onBegin(){begun++;},onComplete(){completed++;},onCancel(){cancelled++;},...options});
 return {station,camera,walker,controls,train,get completed(){return completed;},get cancelled(){return cancelled;},get begun(){return begun;}};
}
const finish=f=>{for(let i=0;i<240&&f.train.active;i++)f.train.update(.1);};
const platform=f=>f.station.spec.arrival.platformPose.position;

test('boarding validates the doorway and takes sole camera ownership',()=>{
 const f=fixture();f.camera.position.x+=6;assert.equal(f.train.start().ok,false);assert.equal(f.begun,0);
 f.camera.position.fromArray(platform(f)).add(new THREE.Vector3(0,3,0));assert.equal(f.train.start().ok,false);
 f.camera.position.fromArray(platform(f));assert.equal(f.train.start().ok,true);assert.equal(f.train.cameraOwned,true);assert.equal(f.walker.paused,true);assert.equal(f.controls.enabled,false);assert.equal(f.train.start().ok,false);f.train.dispose();
 const unavailable=createZenReturnTrain({});assert.equal(unavailable.start().ok,false);unavailable.dispose();
});
test('return looks inward, follows the aisle, sits before departure and holds the final seat',()=>{
 const f=fixture();f.train.start();const phases=new Set(),direction=new THREE.Vector3();let maxDistance=0;
 for(let i=0;i<240&&f.train.active;i++){
  f.train.update(.1);const s=f.train.stats;phases.add(s.phase);
  if(s.phase==='boarding'){assert.equal(f.station.door,1);f.camera.getWorldDirection(direction);assert.ok(direction.dot(new THREE.Vector3(f.station.spec.track.east[0],0,f.station.spec.track.east[1]))<-.98);}
  if(['aisle','turning','seating'].includes(s.phase))assert.equal(f.station.door,1);
  if(s.phase==='departing'){assert.equal(f.station.door,0);assert.equal(s.seated,true);maxDistance=Math.max(maxDistance,s.distance);}
 }
 for(const phase of ['opening','boarding','aisle','turning','seating','closing','departing','complete'])assert.ok(phases.has(phase));
 assert.ok(maxDistance>20&&maxDistance<=24);assert.equal(f.completed,1);assert.equal(f.train.active,false);assert.equal(f.train.cameraOwned,true);assert.equal(f.train.stats.seated,true);
 assert.equal(f.walker.paused,true);assert.equal(f.walker.active,false);assert.equal(f.walker.teleports,0);assert.ok(Math.abs(f.camera.position.y-(f.station.spec.train.floor+.5805+.70))<1e-8);
 const end=f.camera.position.clone();f.train.update(.1);assert.ok(f.camera.position.equals(end));assert.equal(f.completed,1);
 assert.equal(f.train.continueWalking(),true);assert.equal(f.train.cameraOwned,false);assert.equal(f.walker.paused,false);assert.equal(f.walker.active,true);assert.equal(f.walker.teleports,1);
 assert.ok(f.camera.position.distanceTo(new THREE.Vector3(...platform(f)))<1e-8);assert.ok(f.station.offset.every(v=>v===0));f.train.dispose();
});
test('pause and invalid deltas preserve every phase and the completed seated hold',()=>{
 const f=fixture();f.train.start();f.train.update(1000);assert.equal(f.train.stats.elapsed,.1);
 for(let i=0;i<180&&f.train.active;i++){
  const p=f.camera.position.clone(),q=f.camera.quaternion.clone(),time=f.train.stats.elapsed,door=f.station.door,offset=[...f.station.offset];
  for(const dt of [NaN,Infinity,-1,0])f.train.update(dt);f.train.update(1000,{paused:true});assert.equal(f.train.stats.elapsed,time);assert.ok(p.equals(f.camera.position));assert.ok(q.equals(f.camera.quaternion));assert.equal(f.station.door,door);assert.deepEqual(f.station.offset,offset);f.train.update(.1);
 }
 const p=f.camera.position.clone();f.train.update(5,{paused:true});assert.ok(f.camera.position.equals(p));f.train.dispose();
});
test('cancel/disposal restore walking from every phase and completed hold, even if teleport rejects',()=>{
 for(const updates of [1,15,38,55,72,95,180]){
  const f=fixture({teleportSuccess:false});f.train.start();for(let i=0;i<updates;i++)f.train.update(.1);
  assert.equal(f.train.cancel(),true);assert.equal(f.train.cameraOwned,false);assert.equal(f.walker.paused,false);assert.equal(f.cancelled,1);assert.ok(f.camera.position.distanceTo(new THREE.Vector3(...platform(f)))<1e-8);assert.ok(f.station.offset.every(v=>v===0));assert.equal(f.station.door,0);assert.equal(f.walker.active,true);
  assert.equal(f.train.start().ok,true);f.train.dispose();assert.equal(f.train.cameraOwned,false);assert.equal(f.walker.paused,false);assert.equal(f.train.interactionRoot.parent,null);assert.equal(f.train.start().ok,false);f.train.dispose();
 }
});
test('skip respects pause and completes seated once; replay resets the old completed hold',()=>{
 const f=fixture();f.train.start();const p=f.camera.position.clone();assert.equal(f.train.skip({paused:true}),false);assert.ok(f.camera.position.equals(p));
 assert.equal(f.train.skip(),true);assert.equal(f.completed,1);assert.equal(f.train.cameraOwned,true);assert.equal(f.train.skip(),false);assert.equal(f.train.start().ok,true);finish(f);assert.equal(f.completed,2);assert.equal(f.train.stats.seated,true);f.train.dispose();
});
test('reduced motion still enters and sits while retaining a stationary train',()=>{
 const f=fixture({reducedMotion:()=>true});f.train.start();while(f.train.active){f.train.update(.1);assert.ok(f.station.offset.every(v=>v===0));}
 assert.equal(f.completed,1);assert.equal(f.train.stats.reducedMotion,true);assert.ok(f.train.stats.elapsed<4);assert.equal(f.train.stats.seated,true);assert.equal(f.train.cameraOwned,true);assert.equal(f.train.continueWalking(),true);assert.equal(f.train.start().ok,true);finish(f);assert.equal(f.completed,2);f.train.dispose();
});
test('callback failures release camera ownership and walking pause',()=>{
 for(const callback of ['onBegin','onComplete']){const f=fixture({[callback](){throw Error('callback');}}),result=f.train.start();if(callback==='onBegin')assert.equal(result.ok,false);else finish(f);assert.equal(f.train.cameraOwned,false);assert.equal(f.walker.paused,false);assert.equal(f.walker.active,true);f.train.dispose();}
});
test('a viewer begin callback cannot unpause this camera owner',()=>{
 const f=fixture();f.train.dispose();const train=createZenReturnTrain({station:f.station,camera:f.camera,walker:f.walker,controls:f.controls,onBegin(){f.walker.pause(false);f.controls.enabled=true;}});train.start();assert.equal(f.walker.paused,true);assert.equal(f.controls.enabled,false);train.dispose();
});
test('the initial approach preserves the normal walking body radius rather than squeezing between solids',()=>{
 const spec=createKeihanStationSpec(features,{height:()=>10}),p=spec.arrival.platformPose.position;
 const colliders=[-1,1].map(side=>({type:'box',args:[p[0]+1,p[2]+side*.76,.5,.5,0,spec.platformFloor,spec.platformFloor+2.5,'approach-wall']}));
 const f=fixture({colliders});f.camera.position.x+=2;assert.equal(f.train.start().ok,false);assert.equal(f.train.cameraOwned,false);assert.equal(f.begun,0);f.train.dispose();
});
