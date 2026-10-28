import {Vector3,Quaternion,Matrix4} from 'three';
const valid=p=>Array.isArray(p)&&p.length===3&&p.every(Number.isFinite);
// One finite camera owner. World actions supply a supported seat eye/target;
// collision-safe standing pose stays unchanged while menus or photos are open.
export function createZenSeatedCamera({camera,walker,controls,reducedMotion=()=>false}){
 let saved=null,disposed=false,elapsed=0;const destination=new Vector3(),rotation=new Quaternion(),matrix=new Matrix4();
 function stand(){if(!saved)return;const previous=saved;saved=null;camera.position.copy(previous.position);camera.quaternion.copy(previous.rotation);controls.enabled=previous.controls;walker.pause(false);previous.onLeave?.();}
 return {get active(){return !!saved;},sit({position,target,onLeave}={}){
  if(disposed||saved||!valid(position)||!valid(target))return false;
  saved={position:camera.position.clone(),rotation:camera.quaternion.clone(),controls:controls.enabled,onLeave};elapsed=0;destination.fromArray(position);
  matrix.lookAt(destination,new Vector3().fromArray(target),camera.up);rotation.setFromRotationMatrix(matrix);walker.pause(true);controls.enabled=false;return true;
 },stand,update(dt,{paused=false}={}){if(!saved||paused||!Number.isFinite(dt)||dt<0)return;elapsed=reducedMotion()?1:Math.min(1,elapsed+dt/0.7);const t=elapsed*elapsed*(3-2*elapsed);camera.position.lerpVectors(saved.position,destination,t);camera.quaternion.slerpQuaternions(saved.rotation,rotation,t);},dispose(){if(disposed)return;stand();disposed=true;}};
}
