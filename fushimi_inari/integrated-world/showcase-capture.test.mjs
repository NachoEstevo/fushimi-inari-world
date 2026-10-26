import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {pathSampler} from './spatial.mjs';
import {createShowcaseItinerary,createShowcaseCapture,createShowcaseWalkRail,showcaseTravelFraction,validateShowcaseWalk,SHOWCASE_DURATION,SHOWCASE_SHOTS} from './showcase-capture.mjs';

const tick=()=>new Promise(resolve=>setImmediate(resolve));
const RECORD_START=1000,RECORD_END=RECORD_START+SHOWCASE_DURATION*1000;
const shotById=id=>SHOWCASE_SHOTS.find(shot=>shot.id===id);
function fixture(){
 const station={built:true,spec:{arrival:{interiorPose:{position:[-4,3,0],target:[0,3,0]},platformPose:{position:[2,3,1],target:[2,3,-2]},travelDirection:[1,0,0],travelDistance:10}},offsets:[],doors:[],setTrainOffset(value){this.offsets.push(value);},setDoorOpen(value){this.doors.push(value);}};
 const assembly={colliders:[],walkHeight:(x,z)=>1+x*.01+z*.02,isWalkable:()=>true,spatial:{connected:ids=>ids[0]==='okusha'?[[50,1,0],[50,1,-200]]:[[0,1,0],[0,1,-100]],byId:{naihaiden:{target:[0,1,-65]},honden:{target:[0,1,-70]}},twins:[pathSampler([[20,1,0],[20,1,-100]])]}};
 const camera=new THREE.PerspectiveCamera();camera.position.set(3,5,7);camera.lookAt(1,2,3);
 const controls={enabled:true,target:new THREE.Vector3(1,2,3)},overlays=[{visible:true},{visible:false}];
 let streams=0,stops=0,ended=0;
 const canvas={captureStream(fps){assert.equal(fps,30);streams++;return {getTracks:()=>[{stop(){stops++;}}]};}};
 class Recorder{
  static instances=[];static isTypeSupported(type){return type.includes('vp8');}
  constructor(stream,options){this.stream=stream;this.mimeType=options.mimeType;this.state='inactive';Recorder.instances.push(this);}
  start(){this.state='recording';}
  stop(){this.state='inactive';queueMicrotask(()=>{this.ondataavailable?.({data:new Blob(['video'])});this.onstop?.();});}
 }
 return {station,assembly,camera,controls,overlays,canvas,Recorder,get streams(){return streams;},get stops(){return stops;},get ended(){return ended;},onEnd(){ended++;}};
}
function capture(f,extra={}){return createShowcaseCapture({...f,prepare:async()=>{},isHidden:()=>false,...extra});}

test('itinerary preserves arrival ordering and five mapped eye-height camera shots',()=>{
 const f=fixture(),itinerary=createShowcaseItinerary(f);
 assert.equal(itinerary.duration,SHOWCASE_DURATION);assert.deepEqual(itinerary.shots,SHOWCASE_SHOTS);
 assert.deepEqual(itinerary.shots.map(shot=>shot.id),['arrival','romon','main-halls','senbon','mountain-torii']);
 const arrival=shotById('arrival'),arrivalDuration=arrival.end-arrival.start;
 const first=itinerary.sample(arrival.start),opening=itinerary.sample(arrival.start+arrivalDuration*8.5/15),disembarking=itinerary.sample(arrival.start+arrivalDuration*11/15);
 assert.equal(first.doorProgress,0);assert.deepEqual(first.pose.position,[-14,3,0]);
 assert.ok(opening.doorProgress>0&&opening.doorProgress<1);assert.equal(disembarking.doorProgress,1);
 assert.ok(disembarking.pose.position[0]>-4&&disembarking.pose.position[0]<2,'camera leaves carriage only in disembark phase');
 for(const shot of SHOWCASE_SHOTS.slice(1)){
  const frame=itinerary.sample(shot.start),[x,y,z]=frame.pose.position;assert.equal(frame.shot,shot.id);assert.ok(Math.abs(y-f.assembly.walkHeight(x,z)-1.7)<1e-9);assert.ok(frame.pose.target.every(Number.isFinite));
  const finish=itinerary.sample(shot.end-.001).pose.position;
  assert.ok(new THREE.Vector3(...frame.pose.position).distanceTo(new THREE.Vector3(...finish))>4,'each walking shot visibly advances');
 }
 for(const [id,direction] of [['senbon',-1],['mountain-torii',1]]){
  const shot=shotById(id),start=itinerary.sample(shot.start).pose,end=itinerary.sample(shot.end-.001).pose;
  const movement=new THREE.Vector3(...end.position).sub(new THREE.Vector3(...start.position));
  const view=new THREE.Vector3(...start.target).sub(new THREE.Vector3(...start.position));
  assert.ok(movement.dot(view)*direction>0,`${id} faces the intended direction during travel`);
 }
 assert.ok(validateShowcaseWalk(itinerary,f.assembly).samples>=200);
});

test('camera rail smooths a floor discontinuity without per-frame floor resampling',()=>{
 let floorReads=0;
 const rail=createShowcaseWalkRail(distance=>[0,0,distance],(x,z)=>{floorReads++;return z<0?0:.3;},-2,2);
 const readsAfterPreparation=floorReads;
 assert.ok(Math.abs(rail.at(-2)[1]-1.7)<1e-9);assert.ok(Math.abs(rail.at(2)[1]-2)<1e-9);
 let previous=rail.at(-1)[1],largestFrameJump=0;
 for(let i=1;i<=40;i++){
  const height=rail.at(-1+i*.05)[1];largestFrameJump=Math.max(largestFrameJump,Math.abs(height-previous));
  assert.ok(height>=previous-1e-9,'upward floor transition cannot bounce backwards');previous=height;
 }
 assert.ok(largestFrameJump<.04,'a 30cm floor edge cannot become a visible single-frame camera jump');
 assert.equal(floorReads,readsAfterPreparation,'rendered frames use the prepared rail');
});

test('walking shots ease into motion with bounded walking speed and acceleration',()=>{
 const itinerary=createShowcaseItinerary(fixture()),dt=1/120;
 assert.equal(showcaseTravelFraction(-1),0);assert.equal(showcaseTravelFraction(2),1);
 for(const shot of SHOWCASE_SHOTS.slice(1)){
  const positions=[];
  for(let time=shot.start;time<shot.end-dt/2;time+=dt)positions.push(new THREE.Vector3(...itinerary.sample(time).pose.position));
  const speeds=positions.slice(1).map((point,index)=>point.distanceTo(positions[index])/dt);
  const accelerations=speeds.slice(1).map((speed,index)=>Math.abs(speed-speeds[index])/dt);
  assert.ok(speeds[0]<.05&&speeds.at(-1)<.05,`${shot.id} starts and ends without an abrupt velocity jump`);
  assert.ok(Math.max(...speeds)<2.5,`${shot.id} stays at a walking pace`);
  assert.ok(Math.max(...accelerations)<4.5,`${shot.id} has bounded camera acceleration`);
 }
});

test('prewarm finishes and first arrival render precedes recording; last render precedes stop and restoration',async()=>{
 const f=fixture(),originalPosition=f.camera.position.clone(),originalRotation=f.camera.quaternion.clone();let prepared=false;
 const controller=capture(f,{prepare:async views=>{assert.ok(views.length>=9);prepared=true;assert.ok(f.overlays.every(object=>!object.visible));}});
 const completion=controller.record();assert.equal(controller.active,true);assert.equal(f.controls.enabled,false);
 await tick();assert.equal(prepared,true);assert.equal(f.streams,0);assert.deepEqual(f.camera.position.toArray(),[-14,3,0]);
 controller.afterRender();assert.equal(f.streams,1);assert.equal(controller.snapshot.phase,'recording');
 controller.update(RECORD_START);controller.update(RECORD_END-1);assert.equal(f.Recorder.instances[0].state,'recording');
 controller.update(RECORD_END);assert.equal(f.Recorder.instances[0].state,'recording','terminal camera update does not stop before render');
 controller.afterRender();const blob=await completion;
 assert.equal(blob.size,5);assert.equal(controller.snapshot.phase,'complete');assert.equal(controller.snapshot.elapsed,SHOWCASE_DURATION);assert.equal(controller.active,false);
 assert.equal(controller.snapshot.frameCount,3);assert.equal(controller.snapshot.averageFPS,3/SHOWCASE_DURATION);assert.ok(controller.snapshot.maxFrameGap>SHOWCASE_DURATION-.1,'capture reports actual sparse frame cadence');
 assert.ok(f.camera.position.equals(originalPosition));assert.ok(f.camera.quaternion.equals(originalRotation));assert.equal(f.controls.enabled,true);assert.deepEqual(f.overlays.map(object=>object.visible),[true,false]);assert.equal(f.stops,1);assert.equal(f.ended,1);
});

test('preparing owns the renderer only until async prewarm arms the first regular frame',async()=>{
 const f=fixture();let finishPreparation;
 const controller=capture(f,{prepare:()=>new Promise(resolve=>{finishPreparation=resolve;})});
 assert.equal(controller.preparing,false);
 const completion=controller.record();assert.equal(controller.preparing,true);controller.afterRender();assert.equal(f.streams,0);
 finishPreparation();await tick();
 assert.equal(controller.active,true);assert.equal(controller.snapshot.phase,'preparing');assert.equal(controller.preparing,false,'armed capture releases regular rendering for the first arrival frame');
 controller.update(RECORD_START);controller.afterRender();assert.equal(controller.snapshot.phase,'recording');assert.equal(controller.preparing,false);
 controller.update(RECORD_END);controller.afterRender();await completion;assert.equal(controller.preparing,false);
});

test('prewarm failure restores camera, controls and exact prior overlay visibility without opening a stream',async()=>{
 const f=fixture(),controller=capture(f,{prepare:async()=>{f.camera.position.set(90,90,90);throw new Error('GPU warmup failed');}});
 await assert.rejects(controller.record(),/GPU warmup failed/);assert.equal(controller.snapshot.phase,'failed');assert.deepEqual(f.camera.position.toArray(),[3,5,7]);assert.equal(f.controls.enabled,true);assert.deepEqual(f.overlays.map(object=>object.visible),[true,false]);assert.equal(f.streams,0);assert.equal(f.ended,1);
});

test('cancelling pending prewarm cannot start a late recorder',async()=>{
 const f=fixture();let release;const controller=capture(f,{prepare:()=>new Promise(resolve=>{release=resolve;})});
 const completion=controller.record();controller.cancel();release();assert.equal(await completion,null);controller.afterRender();assert.equal(f.streams,0);assert.equal(f.ended,1);assert.equal(controller.snapshot.phase,'cancelled');
});

test('a hidden tab interrupts capture and releases tracks rather than producing a misleading timed take',async()=>{
 const f=fixture(),visibilityTarget=new EventTarget();let hidden=false;const controller=capture(f,{isHidden:()=>hidden,visibilityTarget});
 const completion=controller.record();await tick();controller.afterRender();controller.update(RECORD_START);hidden=true;
 visibilityTarget.dispatchEvent(new Event('visibilitychange'));await assert.rejects(completion,/tab became hidden/);assert.equal(controller.snapshot.phase,'failed');assert.equal(f.stops,1);assert.deepEqual(f.overlays.map(object=>object.visible),[true,false]);controller.dispose();
});

test('solid geometry on a planned walking shot rejects capture before recording',async()=>{
 const f=fixture(),shot=shotById('romon'),[x,y,z]=createShowcaseItinerary(f).sample((shot.start+shot.end)/2).pose.position;
 f.assembly.colliders.push({type:'box',args:[x,z,2,2,0,y-2,y+2]});
 const controller=capture(f);await assert.rejects(controller.record(),/intersects a solid/);assert.equal(f.streams,0);assert.equal(controller.snapshot.phase,'failed');assert.equal(f.controls.enabled,true);
});

test('late events from a cancelled recorder cannot corrupt a subsequent take',async()=>{
 const f=fixture(),controller=capture(f);
 const first=controller.record();await tick();controller.afterRender();const stale=f.Recorder.instances[0];controller.cancel();assert.equal(await first,null);
 const second=controller.record();await tick();controller.afterRender();
 stale.ondataavailable({data:new Blob(['stale'])});stale.onstop();assert.equal(controller.snapshot.phase,'recording');
 controller.update(RECORD_START);controller.update(RECORD_END);controller.afterRender();assert.equal((await second).size,5,'only current recorder data is retained');
});

test('synchronous codec start failure releases the stream and restores visibility',async()=>{
 const f=fixture();f.Recorder.prototype.start=()=>{throw new Error('Encoder start failed');};
 const controller=capture(f),completion=controller.record();await tick();controller.afterRender();
 await assert.rejects(completion,/Encoder start failed/);assert.equal(f.stops,1);assert.equal(f.controls.enabled,true);assert.deepEqual(f.overlays.map(object=>object.visible),[true,false]);
});

test('zero-byte native recording fails visibly and never publishes a completed video',async()=>{
 const f=fixture(),phases=[];let completed=false;
 f.Recorder.prototype.stop=function(){this.state='inactive';queueMicrotask(()=>{this.ondataavailable?.({data:new Blob([])});this.onstop?.();});};
 const controller=capture(f,{onState:state=>phases.push(state.phase),onComplete:()=>{completed=true;}});
 const completion=controller.record();await tick();controller.afterRender();controller.update(RECORD_START);controller.update(RECORD_END);controller.afterRender();
 await assert.rejects(completion,/produced no video data/);
 assert.equal(controller.snapshot.phase,'failed');assert.equal(controller.snapshot.result,null);assert.equal(completed,false);assert.ok(!phases.includes('complete'));
 assert.equal(f.stops,1);assert.equal(f.controls.enabled,true);assert.deepEqual(f.overlays.map(object=>object.visible),[true,false]);
});
