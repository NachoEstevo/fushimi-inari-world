import * as THREE from 'three';

const finitePoint=p=>Array.isArray(p)&&p.length===3&&p.every(Number.isFinite);
const smooth=t=>t*t*(3-2*t);

// Departure has its own owner. It never replays or mutates the arrival timeline.
// Camera interpolation uses the already validated doorway corridor in reverse.
export function createZenReturnTrain({station,camera,walker,controls,onBegin=()=>{},onComplete=()=>{},onCancel=()=>{},reducedMotion=false}={}){
 const spec=station?.spec,arrival=spec?.arrival;
 const available=!!(station?.built&&camera&&walker&&controls&&finitePoint(spec?.route?.platformDoor)&&
  finitePoint(arrival?.interiorPose?.position)&&finitePoint(arrival?.interiorPose?.target)&&
  finitePoint(arrival?.platformPose?.position)&&finitePoint(arrival?.platformPose?.target)&&
  finitePoint(arrival?.travelDirection)&&Math.hypot(...arrival.travelDirection)>0&&station.setDoorOpen&&station.setTrainOffset);
 const stats={available,phase:'idle',active:false,paused:false,elapsed:0,progress:0,door:0,distance:0,completed:0,cancelled:0,reducedMotion:false,error:null};
 const interactionRoot=new THREE.Group();interactionRoot.name='Return train boarding doorway';
 if(available){interactionRoot.position.set(...spec.route.platformDoor);station.group?.parent?.add(interactionRoot);}
 let disposed=false,previousControls=false,total=0;
 const timings={opening:.85,boarding:2.2,closing:1.1,departing:4.8};
 const departureDistance=Number.isFinite(arrival?.travelDistance)?Math.max(0,Math.min(24,arrival.travelDistance)):24;
 const phases=Object.keys(timings),offset=[0,0,0];
 const startPosition=new THREE.Vector3(),startTarget=new THREE.Vector3(),platformEye=new THREE.Vector3(),platformTarget=new THREE.Vector3();
 const interiorEye=new THREE.Vector3(),interiorTarget=new THREE.Vector3(),axis=new THREE.Vector3(),lookTarget=new THREE.Vector3();
 if(available){
  platformEye.fromArray(arrival.platformPose.position);platformTarget.fromArray(arrival.platformPose.target);
  interiorEye.fromArray(arrival.interiorPose.position);interiorTarget.fromArray(arrival.interiorPose.target);axis.fromArray(arrival.travelDirection).normalize();
 }
 function setStation(door,distance){
  stats.door=door;stats.distance=distance;station.setDoorOpen(door);
  offset[0]=axis.x*distance;offset[1]=axis.y*distance;offset[2]=axis.z*distance;station.setTrainOffset(offset);
 }
 function applyPose(fromPosition,toPosition,fromTarget,toTarget,t,distance=0){
  camera.position.lerpVectors(fromPosition,toPosition,t).addScaledVector(axis,distance);
  lookTarget.lerpVectors(fromTarget,toTarget,t).addScaledVector(axis,distance);
  camera.lookAt(lookTarget);controls.target?.copy(lookTarget);
 }
 function release(){
  // Release before teleport: walker.start can notify the surrounding viewer.
  stats.active=false;stats.paused=false;setStation(0,0);walker.pause?.(false);
  let teleported=false;
  try{teleported=!!walker.teleport?.(spec.route.platformDoor,arrival.platformPose.target);}catch{stats.error='Walking handoff unavailable';}
  if(!teleported){
   camera.position.copy(platformEye);camera.lookAt(platformTarget);controls.target?.copy(platformTarget);walker.start?.();
  }
  controls.enabled=previousControls&&!walker.active;
 }
 function notify(callback){try{callback(stats);}catch{stats.error='Return train callback unavailable';}}
 function cancel(){
  if(!stats.active)return false;
  stats.phase='cancelled';stats.cancelled++;release();notify(onCancel);return true;
 }
 function start(){
  if(disposed||!available)return {ok:false,reason:'Return train unavailable'};
  if(stats.active)return {ok:false,reason:'Already boarding the return train'};
  const p=spec.route.platformDoor;
  if(Math.hypot(camera.position.x-p[0],camera.position.z-p[2])>5||Math.abs(camera.position.y-1.7-p[1])>.75)
   return {ok:false,reason:'Walk to the platform doorway to board'};
  const reduce=typeof reducedMotion==='function'?!!reducedMotion():!!reducedMotion;
  timings.opening=reduce?.35:.85;timings.boarding=reduce?.4:2.2;timings.closing=reduce?.45:1.1;timings.departing=reduce?.4:4.8;
  total=timings.opening+timings.boarding+timings.closing+timings.departing;
  stats.phase='opening';stats.active=true;stats.paused=false;stats.elapsed=0;stats.progress=0;stats.reducedMotion=reduce;stats.error=null;
  previousControls=controls.enabled;startPosition.copy(camera.position);camera.getWorldDirection(startTarget).multiplyScalar(6).add(camera.position);
  walker.stop?.();walker.pause?.(true);controls.enabled=false;setStation(0,0);
  try{onBegin(stats);}catch{stats.error='Return train could not begin';stats.phase='cancelled';release();return {ok:false,reason:stats.error};}
  // The viewer may cancel an arrival inside onBegin, which also releases its
  // walking pause. Reassert this owner's pause after that callback finishes.
  walker.pause?.(true);controls.enabled=false;
  return {ok:true};
 }
 interactionRoot.userData.interactable={title:'Return train',language:'en',proximity:true,reach:5,cooldownMs:2000,
  prompt:'Board the return train',directAction(){const result=start();return result.ok?'Boarding the return train.':result.reason;}};
 return {interactionRoot,stats,start,cancel,get active(){return stats.active;},update(dt,{paused=false}={}){
  if(disposed||!stats.active)return stats;
  stats.paused=!!paused;controls.enabled=false;
  if(paused||!Number.isFinite(dt)||dt<=0)return stats;
  stats.elapsed=Math.min(total,stats.elapsed+Math.min(.1,dt));stats.progress=stats.elapsed/total;
  let startTime=0,phase='complete',t=1;
  for(const next of phases){if(stats.elapsed<startTime+timings[next]-1e-9){phase=next;t=(stats.elapsed-startTime)/timings[next];break;}startTime+=timings[next];}
  stats.phase=phase;
  if(phase==='opening'){
   setStation(smooth(t),0);
   if(!stats.reducedMotion)applyPose(startPosition,platformEye,startTarget,platformTarget,smooth(t));
  }else if(phase==='boarding'){
   setStation(1,0);applyPose(platformEye,interiorEye,platformTarget,interiorTarget,stats.reducedMotion?1:smooth(t));
  }else if(phase==='closing'){
   setStation(1-smooth(t),0);applyPose(interiorEye,interiorEye,interiorTarget,interiorTarget,1);
  }else if(phase==='departing'){
   const distance=stats.reducedMotion?0:departureDistance*t*t;setStation(0,distance);applyPose(interiorEye,interiorEye,interiorTarget,interiorTarget,1,distance);
  }else{
   stats.elapsed=total;stats.progress=1;stats.completed++;release();notify(onComplete);
  }
  return stats;
 },dispose(){if(disposed)return;cancel();disposed=true;interactionRoot.userData.interactable=null;interactionRoot.removeFromParent();}};
}
