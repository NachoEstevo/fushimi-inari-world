import {Vector3,Quaternion,Matrix4,Euler,MathUtils} from 'three';
const valid=p=>Array.isArray(p)&&p.length===3&&p.every(Number.isFinite);
const MAX_YAW=Math.PI/4,MAX_PITCH=Math.PI/15;
export function createZenSeatedCamera({camera,walker,controls,reducedMotion=()=>false}){
 let saved=null,disposed=false,elapsed=0,yaw=0,pitch=0,currentYaw=0,currentPitch=0;
 const destination=new Vector3(),targetVector=new Vector3(),rotation=new Quaternion(),lookRotation=new Quaternion(),matrix=new Matrix4(),base=new Euler(0,0,0,'YXZ'),lookEuler=new Euler(0,0,0,'YXZ');
 function stand(){if(!saved)return;const previous=saved;saved=null;camera.position.copy(previous.position);camera.quaternion.copy(previous.rotation);controls.enabled=previous.controls;walker.pause(previous.paused);previous.onLeave?.();}
 return {get active(){return !!saved;},sit({position,target,onLeave}={}){
  if(disposed||saved||!valid(position)||!valid(target))return false;
  saved={position:camera.position.clone(),rotation:camera.quaternion.clone(),controls:controls.enabled,paused:walker.paused??false,onLeave};elapsed=0;yaw=pitch=currentYaw=currentPitch=0;destination.fromArray(position);
  matrix.lookAt(destination,targetVector.fromArray(target),camera.up);rotation.setFromRotationMatrix(matrix);base.setFromQuaternion(rotation,'YXZ');walker.pause(true);controls.enabled=false;return true;
 },look(yawDelta,pitchDelta){if(!saved||!Number.isFinite(yawDelta)||!Number.isFinite(pitchDelta))return;yaw=MathUtils.clamp(yaw+yawDelta,-MAX_YAW,MAX_YAW);pitch=MathUtils.clamp(pitch+pitchDelta,-MAX_PITCH,MAX_PITCH);},stand,
 update(dt,{paused=false}={}){if(!saved||paused||!Number.isFinite(dt)||dt<0)return;elapsed=reducedMotion()?1:Math.min(1,elapsed+dt/0.7);const t=elapsed*elapsed*(3-2*elapsed),damp=reducedMotion()?1:1-Math.exp(-dt/.12);currentYaw+=(yaw-currentYaw)*damp;currentPitch+=(pitch-currentPitch)*damp;
  lookEuler.set(base.x+currentPitch,base.y+currentYaw,0,'YXZ');lookRotation.setFromEuler(lookEuler);camera.position.lerpVectors(saved.position,destination,t);camera.quaternion.slerpQuaternions(saved.rotation,lookRotation,t);
 },dispose(){if(disposed)return;stand();disposed=true;}};
}
