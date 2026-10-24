import {mappedStationPlacement,mappedStationId} from './station-placement-layout.mjs';

// Source coordinates projected using the SAME 34.96714,135.77267 origin as
// geography/features.json. Snapshot: OSM API map, 2026-10-24; not a survey.
export const INARI_RAIL_SOURCE={platform2:'way/626177633',platform1:'way/626177634',track2:'way/837464094',track1:'way/1284432119',url:'https://api.openstreetmap.org/api/0.6/map?bbox=135.7698,34.9658,135.7711,34.9683'};
export const INARI_PLATFORM2=[[-176.373,47.266],[-157.699,104.896],[-155.437,104.462],[-172.441,46.810],[-175.880,34.888],[-177.604,28.487],[-182.011,12.846],[-191.799,-27.908],[-194.125,-27.507],[-185.012,13.292]];
export const INARI_PLATFORM1=[[-183.607,49.704],[-192.939,12.312],[-199.179,-13.503],[-203.813,-12.590],[-197.345,13.559],[-193.076,31.014],[-196.479,32.127],[-193.797,44.038],[-188.697,43.949],[-186.617,50.316],[-165.408,113.780],[-162.653,112.611]];
function platform2RailEdge(origin,east,direction,longitudinal){
 const points=INARI_PLATFORM2.map(p=>{const dx=p[0]-origin[0],dz=p[1]-origin[1];return [dx*east[0]+dz*east[1],dx*direction[0]+dz*direction[1]];}),crossings=[];
 for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length];if((a[1]>longitudinal)!==(b[1]>longitudinal))crossings.push(a[0]+(b[0]-a[0])*(longitudinal-a[1])/(b[1]-a[1]));}
 return crossings.length?Math.min(...crossings):null;
}
export function inariTrainPlatformGap(spec,longitudinal){
 const edge=platform2RailEdge(spec.track.origin,spec.track.east,spec.track.direction,longitudinal);
 return edge===null?null:edge-spec.train.bodyHalfWidth;
}
export function pointInStationPolygon(x,z,ring){
 let inside=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){
  const a=ring[i],b=ring[j];if((a[1]>z)!==(b[1]>z)&&x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])inside=!inside;
 }return inside;
}
export function createInariStationArrivalSpec(features,surfaces){
 const placement=mappedStationPlacement(features);if(!placement)return null;
 const [x,z]=placement.center,c=Math.cos(placement.yaw),s=Math.sin(placement.yaw);
 // Existing placement local X runs south, front local -Z runs east.
 const east=[-s,-c],south=[c,-s],local=(u,v)=>[x+east[0]*u+south[0]*v,z+east[1]*u+south[1]*v];
 const frontage=local(3.7,0),road=features.paths?.find(p=>p.id==='way/79699850');
 if(!road||!surfaces||typeof surfaces.height!=='function')return null;
 const streetPoint=[-157.198,z],streetFloor=surfaces.height(...streetPoint);if(!Number.isFinite(streetFloor))return null;
 const publicFloor=streetFloor+.45,platformFloor=publicFloor+.90,railTop=platformFloor-1.10;
 const railA=[-182.458,33.518],railB=[-178.398,46.821],length=Math.hypot(railB[0]-railA[0],railB[1]-railA[1]);
 const travel=[(railB[0]-railA[0])/length,(railB[1]-railA[1])/length],railEast=[travel[1],-travel[0]];
 const doorOffsets=[-6.6,-2.2,2.2,6.6],selectedCar=1,selectedDoor=3,selectedOffset=doorOffsets[selectedDoor];
 // Independent traces are not parallel. Recalibrate only the inferred rail
 // lateral shift to the chosen door, including its .055m outer shell/frame.
 // The earlier .85m third-door correction is intentionally superseded.
 const bodyHalfWidth=1.4+.055,doorGap=.16,sourcePlatformEdge=platform2RailEdge(railA,railEast,travel,selectedOffset);
 if(!Number.isFinite(sourcePlatformEdge))return null;
 const lateralResolution=sourcePlatformEdge-bodyHalfWidth-doorGap,trainOrigin=[railA[0]+railEast[0]*lateralResolution,railA[1]+railEast[1]*lateralResolution];
 const trainLocal=(u,v)=>[trainOrigin[0]+railEast[0]*u+travel[0]*v,trainOrigin[1]+railEast[1]*u+travel[1]*v];
 const doorAt=trainLocal(1.43,selectedOffset),platformAt=trainLocal(3.35,selectedOffset),interiorAt=trainLocal(.10,selectedOffset);
 const gate=local(-.5,0),stairWest=local(-9.05,0),stairEast=local(-4.2,0);
 const publicExit={position:[frontage[0],publicFloor,frontage[1]],target:[frontage[0]+east[0]*5,publicFloor+1.7,frontage[1]+east[1]*5]};
 return {revision:'JR-Inari-arrival-1',units:'m',sourceFeature:mappedStationId,
  coordinates:{originLat:34.96714,originLon:135.77267,x:'east',y:'up',z:'south'},
  frame:{origin:[x,z],east,south,yaw:Math.atan2(-east[1],east[0]),buildingYaw:placement.yaw},local,
  building:{center:[x,z],width:6.724,length:27.658,halfWidth:3.362,halfLength:13.829,roofEave:4.0,roofRidge:5.25},
  streetFloor,publicFloor,platformFloor,railTop,publicExit,stationGate:{position:[gate[0],publicFloor,gate[1]]},
  stair:{west:stairWest,east:stairEast,width:2.7,count:6,rise:.15},
  platform2:{id:INARI_RAIL_SOURCE.platform2,points:INARI_PLATFORM2},platform1:{id:INARI_RAIL_SOURCE.platform1,points:INARI_PLATFORM1},
  track:{origin:trainOrigin,sourceOrigin:railA,lateralResolution,sourcePlatformEdge,direction:travel,east:railEast,gauge:1.067,trackSpacing:3.67,length:240,local:trainLocal},
  train:{carLength:19.5,carWidth:2.8,bodyHalfWidth,doorGap,carHeight:3.5,carCenters:[-20,0,20,40],doorOffsets,doorWidth:1.3,floor:platformFloor+.025,selectedCar,selectedDoor,selectedOffset,doorPosition:[doorAt[0],platformFloor+.025,doorAt[1]],appearance:'Interpretive JR 205-series stainless/green local; dimensions and current assignment unverified'},
  arrival:{interiorPose:{position:[interiorAt[0],platformFloor+1.725,interiorAt[1]],target:[platformAt[0],platformFloor+1.7,platformAt[1]]},platformPose:{position:[platformAt[0],platformFloor+1.7,platformAt[1]],target:[stairEast[0],platformFloor+1.6,stairEast[1]]},travelDirection:[travel[0],0,travel[1]],travelDistance:24},
  route:{platformDoor:[platformAt[0],platformFloor,platformAt[1]],stairTop:[stairWest[0],platformFloor,stairWest[1]],stairBottom:[stairEast[0],publicFloor,stairEast[1]],gate:[gate[0],publicFloor,gate[1]],exit:publicExit.position},
  provenance:{mapped:'OSM station footprint; OSM P1/P2 polygons and rail tangent; local equirectangular projection',observed:'JR-West official plan: P2 Uji/Nara, P1 Kyoto, east exit, two footbridges. Official photos: vermilion supports and metal gates. Townphoto2016: three front steps and south ramp.',inferred:'Every vertical level, door/stop placement, stair count, roof section, train dimensions and canopy/bridge attachment locations are inferred; no dimensional survey.',period:'Historical east-entrance baseline (photos 2016/2019; operator plan 2020). West-exit works 2025/2026 not represented.'}};
}

export function inariStationSurfaceHeight(spec,x,z){
 if(!spec)return null;
 const dx=x-spec.frame.origin[0],dz=z-spec.frame.origin[1],u=dx*spec.frame.east[0]+dz*spec.frame.east[1],v=dx*spec.frame.south[0]+dz*spec.frame.south[1];
 // A narrow, visible upper landing joins the mapped P2 edge to the stair.
 if(Math.abs(v)<=1.35&&u>=-9.3&&u<=-4.2){
  if(u<=-8.8+1e-8)return spec.platformFloor;
  const index=Math.max(0,Math.min(5,Math.floor((u+8.8)/4.6*6)));
  return spec.platformFloor-(index+1)*spec.stair.rise;
 }
 if(Math.abs(v)<=spec.building.halfLength&&u>=-spec.building.halfWidth&&u<=spec.building.halfWidth)return spec.publicFloor;
 if(Math.abs(v)<=1.35&&u>=-4.2&&u<=3.7)return spec.publicFloor;
 if(pointInStationPolygon(x,z,spec.platform2.points)||pointInStationPolygon(x,z,spec.platform1.points))return spec.platformFloor;
 return null;
}
