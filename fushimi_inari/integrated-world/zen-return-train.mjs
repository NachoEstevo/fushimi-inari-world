import * as THREE from 'three';
import {SpatialCollisionWorld} from './collision.mjs';
import {createZenReturnBoardingPlan} from './zen-return-boarding.mjs';

const smooth=t=>t*t*(3-2*t);
// This owner boards through the real selected doorway, walks its clear aisle,
// then sits on a shared-layout cushion. Completed returns retain a seated hold
// until Continue walking, cancellation or an explicit replay releases it.
export function createZenReturnTrain({station,camera,walker,controls,onBegin=()=>{},onComplete=()=>{},onCancel=()=>{},reducedMotion=false}={}){
 const plan=createZenReturnBoardingPlan(station?.spec);
 const available=!!(station?.built&&plan&&camera&&walker&&controls&&station.setDoorOpen&&station.setTrainOffset);
 const stats={available,phase:'idle',active:false,cameraOwned:false,seated:false,paused:false,elapsed:0,progress:0,door:0,distance:0,completed:0,cancelled:0,reducedMotion:false,error:null,seat:plan?.seat??null};
 const interactionRoot=new THREE.Group();interactionRoot.name='Return train boarding doorway';interactionRoot.visible=available;
 if(available){interactionRoot.position.set(...station.spec.route.platformDoor);station.group?.parent?.add(interactionRoot);}
 const phases=['opening','boarding','aisle','turning','seating','closing','departing'],normal=[.95,2.3,1.8,.85,1.1,1,4.6],short=[.25,.25,.25,.20,.25,.30,.35],timings=[...normal];
 const offset=[0,0,0],axis=new THREE.Vector3(),direction=new THREE.Vector3(),matrix=new THREE.Matrix4(),target=new THREE.Vector3();
 const startPose={position:new THREE.Vector3(),rotation:new THREE.Quaternion()},poses={};
 const world=new SpatialCollisionWorld(4);
 if(available){
  axis.fromArray(plan.axis);
  for(const id of ['platform','entry','aisle','approach','seated']){
   const source=plan[id],position=new THREE.Vector3(...source.position);target.fromArray(source.target);matrix.lookAt(position,target,camera.up);
   poses[id]={position,rotation:new THREE.Quaternion().setFromRotationMatrix(matrix)};
  }
  for(const c of station.colliders??[])world[c.type==='box'?'addBox':'addCylinder'](...c.args);
 }
 let disposed=false,previousControls=false,total=0;
 function setStation(door,distance){
  stats.door=door;stats.distance=distance;station.setDoorOpen(door);
  offset[0]=axis.x*distance;offset[1]=axis.y*distance;offset[2]=axis.z*distance;station.setTrainOffset(offset);
 }
 function applyPose(from,to,t,distance=0){
  camera.position.lerpVectors(from.position,to.position,t).addScaledVector(axis,distance);
  camera.quaternion.slerpQuaternions(from.rotation,to.rotation,t);
  if(controls.target){camera.getWorldDirection(direction);controls.target.copy(camera.position).addScaledVector(direction,6);}
 }
 function release(){
  stats.active=false;stats.cameraOwned=false;stats.seated=false;stats.paused=false;setStation(0,0);walker.pause?.(false);
  let teleported=false;
  try{teleported=!!walker.teleport?.(station.spec.route.platformDoor,plan.platform.target);}catch{stats.error='Walking handoff unavailable';}
  if(!teleported){applyPose(poses.platform,poses.platform,1);walker.start?.();}
  controls.enabled=previousControls&&!walker.active;
 }
 function notify(callback){try{callback(stats);return true;}catch{stats.error='Return train callback unavailable';return false;}}
 function complete(){
  if(!stats.active)return false;
  stats.phase='complete';stats.active=false;stats.cameraOwned=true;stats.seated=true;stats.paused=false;stats.elapsed=total;stats.progress=1;stats.completed++;
  const distance=stats.reducedMotion?0:plan.departureDistance;setStation(0,distance);applyPose(poses.seated,poses.seated,1,distance);
  if(!notify(onComplete))release();return true;
 }
 function cancel(){
  if(!stats.cameraOwned)return false;
  stats.phase='cancelled';stats.cancelled++;release();notify(onCancel);return true;
 }
 function approachClear(){
  const a=camera.position,b=poses.platform.position,steps=Math.max(1,Math.ceil(a.distanceTo(b)/.15));
  for(let i=0;i<=steps;i++){
   const t=i/steps,x=a.x+(b.x-a.x)*t,y=a.y+(b.y-a.y)*t,z=a.z+(b.z-a.z)*t,p=world.resolvePlayer(x,y,z,.28);
   if(Math.hypot(p.x-x,p.z-z)>.01)return false;
  }
  return true;
 }
 function start(){
  if(disposed||!available)return {ok:false,reason:'Return train unavailable'};
  if(stats.active)return {ok:false,reason:'Already boarding the return train'};
  if(stats.cameraOwned)release();
  const p=station.spec.route.platformDoor;
  if(Math.hypot(camera.position.x-p[0],camera.position.z-p[2])>5||Math.abs(camera.position.y-1.7-p[1])>.75)
   return {ok:false,reason:'Walk to the platform doorway to board'};
  if(!approachClear())return {ok:false,reason:'Stand in the clear doorway approach to board'};
  const reduce=typeof reducedMotion==='function'?!!reducedMotion():!!reducedMotion;
  total=0;for(let i=0;i<phases.length;i++){timings[i]=(reduce?short:normal)[i];total+=timings[i];}
  stats.phase='opening';stats.active=true;stats.cameraOwned=true;stats.seated=false;stats.paused=false;stats.elapsed=0;stats.progress=0;stats.reducedMotion=reduce;stats.error=null;
  previousControls=controls.enabled;startPose.position.copy(camera.position);startPose.rotation.copy(camera.quaternion);
  walker.stop?.();walker.pause?.(true);controls.enabled=false;setStation(0,0);
  try{onBegin(stats);}catch{stats.error='Return train could not begin';stats.phase='cancelled';release();return {ok:false,reason:stats.error};}
  walker.pause?.(true);controls.enabled=false;return {ok:true};
 }
 interactionRoot.userData.interactable={title:'Return train',language:'en',proximity:true,reach:5,cooldownMs:2000,
  prompt:'Board the return train',directAction(){const result=start();return result.ok?'Boarding the return train.':result.reason;}};
 return {interactionRoot,stats,plan,start,cancel,get active(){return stats.active;},get cameraOwned(){return stats.cameraOwned;},
  continueWalking(){if(!stats.cameraOwned||stats.active)return false;release();return true;},
  skip({paused=false}={}){return !disposed&&stats.active&&!paused?complete():false;},
  update(dt,{paused=false}={}){
   if(disposed||!stats.cameraOwned)return stats;
   stats.paused=!!paused;controls.enabled=false;if(!stats.active||paused||!Number.isFinite(dt)||dt<=0)return stats;
   stats.elapsed=Math.min(total,stats.elapsed+Math.min(.1,dt));stats.progress=stats.elapsed/total;
   let startTime=0,phase='complete',t=1;
   for(let i=0;i<phases.length;i++){if(stats.elapsed<startTime+timings[i]-1e-9){phase=phases[i];t=(stats.elapsed-startTime)/timings[i];break;}startTime+=timings[i];}
   if(phase==='complete'){complete();return stats;}
   stats.phase=phase;const blend=stats.reducedMotion?1:smooth(t);
   if(phase==='opening'){setStation(smooth(t),0);applyPose(startPose,poses.platform,blend);}
   else if(phase==='boarding'){setStation(1,0);applyPose(poses.platform,poses.entry,blend);}
   else if(phase==='aisle'){setStation(1,0);applyPose(poses.entry,poses.aisle,blend);}
   else if(phase==='turning'){setStation(1,0);applyPose(poses.aisle,poses.approach,blend);}
   else if(phase==='seating'){setStation(1,0);applyPose(poses.approach,poses.seated,blend);}
   else if(phase==='closing'){stats.seated=true;setStation(1-smooth(t),0);applyPose(poses.seated,poses.seated,1);}
   else if(phase==='departing'){stats.seated=true;const distance=stats.reducedMotion?0:plan.departureDistance*t*t;setStation(0,distance);applyPose(poses.seated,poses.seated,1,distance);}
   return stats;
  },dispose(){if(disposed)return;cancel();disposed=true;interactionRoot.userData.interactable=null;interactionRoot.removeFromParent();}
 };
}
