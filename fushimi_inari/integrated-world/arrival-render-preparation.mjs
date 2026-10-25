import {createTrainArrivalSequence} from './train-arrival-sequence.mjs';

// Use the production renderer under the loading sheet; never advance the real
// arrival timeline or start audio while compiling/uploading its visible poses.
export async function prepareTrainArrival({station,camera,prepareView,compile,render,settle,prepareAppearance=()=>{}}){
 if(!station?.built)return false;
 const position=camera.position.clone(),quaternion=camera.quaternion.clone();
 const first=createTrainArrivalSequence(station.spec.arrival).start();
 const poses=[{pose:first.pose,offset:first.trainOffset,doors:0},
  {pose:station.spec.arrival.interiorPose,offset:[0,0,0],doors:1},
  {pose:station.spec.arrival.platformPose,offset:[0,0,0],doors:1}];
 try{
  // Bake the static station probe with the train at its stop, not in transit.
  station.setTrainOffset([0,0,0]);station.setDoorOpen(0);
  camera.position.set(...station.spec.arrival.interiorPose.position);
  camera.lookAt(...station.spec.arrival.interiorPose.target);
  await prepareView();await prepareAppearance();
  for(let i=0;i<poses.length;i++){
   const {pose,offset,doors}=poses[i];
   station.setTrainOffset(offset);station.setDoorOpen(doors);
   camera.position.set(...pose.position);camera.lookAt(...pose.target);
   await prepareView();
   await compile();await render();await settle();
  }
  return true;
 }finally{
  station.setTrainOffset([0,0,0]);station.setDoorOpen(0);
  camera.position.copy(position);camera.quaternion.copy(quaternion);
 }
}
