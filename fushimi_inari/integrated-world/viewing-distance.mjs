import * as THREE from 'three';

export const VIEW_DISTANCES=Object.freeze({balanced:700,high:1000,ultra:1400});
export const HORIZON_COLORS=Object.freeze({day:'#d7e6e7',gold:'#f6b978',night:'#34465c'});

// Render distance is independent of world construction and walking support.
export function createViewingDistance({scene,camera,debugCamera=false,quality='balanced',timeOfDay='day'}){
 function apply(){
  const far=debugCamera?12000:VIEW_DISTANCES[quality];
  camera.far=far;camera.updateProjectionMatrix();
  if(!scene.fog?.isFog)scene.fog=new THREE.Fog(HORIZON_COLORS[timeOfDay],far*.65,far*.95);
  else {scene.fog.color.set(HORIZON_COLORS[timeOfDay]);scene.fog.near=far*.65;scene.fog.far=far*.95;}
 }
 function setQuality(value){quality=Object.hasOwn(VIEW_DISTANCES,value)?value:'balanced';apply();}
 function setTimeOfDay(value){timeOfDay=Object.hasOwn(HORIZON_COLORS,value)?value:'day';apply();}
 quality=Object.hasOwn(VIEW_DISTANCES,quality)?quality:'balanced';
 timeOfDay=Object.hasOwn(HORIZON_COLORS,timeOfDay)?timeOfDay:'day';apply();
 return {setQuality,setTimeOfDay,get stats(){return {quality,timeOfDay,far:camera.far,fogNear:scene.fog.near,fogFar:scene.fog.far,debugCamera};}};
}
