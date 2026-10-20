import {rotateXZ} from './spatial.mjs';

// Video 00:30/00:54 establishes separation, not surveyed metre dimensions.
// Retain the mapped lateral offset; clear the inherited corridor roof (z=4.9).
export function separatedTemizuya(romon,temizuya){
  const [x]=rotateXZ(temizuya.target[0]-romon.target[0],temizuya.target[2]-romon.target[2],-romon.yaw);
  const [dx,dz]=rotateXZ(x,9.1,romon.yaw);
  return [romon.target[0]+dx,romon.target[1]-romon.source[1]+temizuya.source[1],romon.target[2]+dz];
}

export const entryWallRuns=[[-19.1,-5.4],[5.4,18.6]];
// Setbacks and levels inferred from the two planted terraces visible at 00:35.
export const entryGardenTiers=[
  {front:5.18,back:3.85,base:0,top:.96},
  {front:3.72,back:2.75,base:.96,top:1.62},
];

export function westStairHeight(x,z){
  if(x< -24.8||x> -19.7||z< -3.4||z>14.5)return null;
  return 1.6*Math.max(0,Math.min(1,(13.8-z)/(13.8-1.89)));
}

// Release the flat landing into the existing courtyard grade over four metres.
export function westLandingTransition(x,z,courtyardHeight){
  if(x< -24.8||x> -19.7||z> -3.4||z< -7.4)return courtyardHeight;
  const t=(-z-3.4)/4,s=t*t*(3-2*t);
  return 1.6+(courtyardHeight-1.6)*s;
}
