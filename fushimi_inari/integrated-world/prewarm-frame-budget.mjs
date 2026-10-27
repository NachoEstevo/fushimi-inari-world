import {Vector3,Quaternion} from 'three';

// Give background preparation CPU time while the view is stationary. Camera
// motion always renders immediately; this never caps walking or mouse look.
export function createPrewarmFrameBudget({idleFPS=60,idleDelayMs=300}={}){
 const position=new Vector3(),rotation=new Quaternion();
 let initialized=false,lastMotion=-Infinity,lastDraw=-Infinity;
 return {shouldRender(time,camera,preparing){
  const moved=!initialized||position.distanceToSquared(camera.position)>1e-6||1-Math.abs(rotation.dot(camera.quaternion))>1e-9;
  if(moved){initialized=true;position.copy(camera.position);rotation.copy(camera.quaternion);lastMotion=time;}
  if(preparing&&!moved&&time-lastMotion>=idleDelayMs&&time-lastDraw<1000/idleFPS)return false;
  lastDraw=time;return true;
 }};
}
