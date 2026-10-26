import * as THREE from 'three';
import {panoramaVisible} from './panorama-policy.mjs';

export const VIEW_DISTANCES=Object.freeze({balanced:150,high:200,ultra:200});
export const OUTLOOK_DISTANCES=Object.freeze({balanced:150,high:200,ultra:200});
export const HORIZON_COLORS=Object.freeze({day:'#d7e6e7',gold:'#f6b978',night:'#34465c'});

// Render distance is independent of world construction and walking support.
export function createViewingDistance({scene,camera,debugCamera=false,quality='balanced',timeOfDay='day'}){
 let outlook=false,currentFar=null;
 function apply(){
  const far=currentFar??(debugCamera?12000:VIEW_DISTANCES[quality]);
  camera.far=far;camera.updateProjectionMatrix();
  if(!scene.fog?.isFog)scene.fog=new THREE.Fog(HORIZON_COLORS[timeOfDay],far*.65,far*.95);
  else {scene.fog.color.set(HORIZON_COLORS[timeOfDay]);scene.fog.near=far*.65;scene.fog.far=far*.95;}
 }
 function setQuality(value){quality=Object.hasOwn(VIEW_DISTANCES,value)?value:'balanced';currentFar=debugCamera?12000:(outlook?OUTLOOK_DISTANCES:VIEW_DISTANCES)[quality];apply();}
 function setTimeOfDay(value){timeOfDay=Object.hasOwn(HORIZON_COLORS,value)?value:'day';apply();}
 quality=Object.hasOwn(VIEW_DISTANCES,quality)?quality:'balanced';
 timeOfDay=Object.hasOwn(HORIZON_COLORS,timeOfDay)?timeOfDay:'day';apply();
 return {setQuality,setTimeOfDay,update(position,dt){
  if(debugCamera)return;
  outlook=panoramaVisible(position,outlook);
  const target=(outlook?OUTLOOK_DISTANCES:VIEW_DISTANCES)[quality],previous=currentFar??camera.far;
  if(Math.abs(target-previous)<.5){if(previous!==target){currentFar=target;apply();}return;}
  // The same hysteresis as the city panorama prevents boundary flicker. Fog
  // and clipping move together rather than cutting the distant scene abruptly.
  currentFar=previous+(target-previous)*(1-Math.exp(-Math.max(0,dt)*2));apply();
 },get stats(){return {quality,timeOfDay,outlook,far:camera.far,fogNear:scene.fog.near,fogFar:scene.fog.far,debugCamera};}};
}
