// Keihan KH34, independent of JR Inari. Metres, X east / Y up / Z south.
// OSM source 2026-10-24, projected with geography's R=6378137 and origin
// 34.96714,135.77267. Polygons are source traces, not measured surveys.
export const KEIHAN_PLATFORM2=[[-304.962,-304.103],[-309.651,-152.430],[-304.543,-152.207],[-299.854,-152.040],[-298.340,-201.255],[-303.129,-201.611],[-305.136,-203.503],[-301.979,-303.891]];
export const KEIHAN_PLATFORM1=[[-314.632,-304.437],[-311.503,-304.359],[-316.338,-153.866],[-319.148,-153.766],[-323.381,-153.743],[-323.381,-158.742],[-325.214,-158.675],[-323.946,-202.535],[-319.230,-202.357],[-317.752,-204.071]];
export const KEIHAN_BUILDING_IDS=['way/626177630','way/626177631','way/952687116','way/626177632'];
export const KEIHAN_SOURCE={platform2:'way/223276787',platform1:'way/223276789',track2:'way/30430522',track2North:'way/335685438',track1:'way/335685468',gate2:'node/8818048775',publicExit:'node/8818048777',map:'https://api.openstreetmap.org/api/0.6/map?bbox=135.7688,34.9681,135.7697,34.9700',station:'https://www.keihan.co.jp/traffic/station/151/info.html'};
export function insideKeihanPolygon(x,z,ring){
 let inside=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const a=ring[i],b=ring[j];if((a[1]>z)!==(b[1]>z)&&x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])inside=!inside;}return inside;
}
function platformEdgeAt(origin,east,direction,longitudinal){
 const p=KEIHAN_PLATFORM2.map(q=>{const dx=q[0]-origin[0],dz=q[1]-origin[1];return [dx*east[0]+dz*east[1],dx*direction[0]+dz*direction[1]];}),hits=[];
 for(let i=0;i<p.length;i++){const a=p[i],b=p[(i+1)%p.length];if((a[1]>longitudinal)!==(b[1]>longitudinal))hits.push(a[0]+(b[0]-a[0])*(longitudinal-a[1])/(b[1]-a[1]));}
 return hits.length?Math.min(...hits):null;
}
export function createKeihanStationSpec(features,surfaces){
 if(!features?.buildings||!KEIHAN_BUILDING_IDS.every(id=>features.buildings.some(b=>b.id===id))||typeof surfaces?.height!=='function')return null;
 const gatePath=features.paths?.find(p=>p.id==='way/952687115');if(!Array.isArray(gatePath?.points)||gatePath.points.length!==3)return null;
 const exit=[-301.277,surfaces.height(-301.277,-124.745),-124.745],gateFoot=[-304.269,surfaces.height(-304.269,-132.259),-132.259];
 if(!Number.isFinite(exit[1])||!Number.isFinite(gateFoot[1]))return null;
 const platformFloor=exit[1]+.90,railTop=platformFloor-1.10;
 const a=[-309.615,-195.032],b=[-310.664,-165.265],length=Math.hypot(b[0]-a[0],b[1]-a[1]),rawDirection=[(b[0]-a[0])/length,(b[1]-a[1])/length],rawEast=[rawDirection[1],-rawDirection[0]];
 const longitudinal=(-163-a[1])/rawDirection[1],rawOrigin=[a[0]+rawDirection[0]*longitudinal,-163];
 const carLength=18.7,carWidth=2.792,carCenters=Array.from({length:7},(_,i)=>(i-6)*19.1),selectedCar=5,doorOffsets=[-6.1,0,6.1],selectedDoor=1,selectedV=carCenters[selectedCar]+doorOffsets[selectedDoor];
 const bodyHalfWidth=carWidth/2+.04,doorGap=.16,sourceEdge=platformEdgeAt(rawOrigin,rawEast,rawDirection,selectedV),lateralResolution=sourceEdge-bodyHalfWidth-doorGap;
 const resolvedOrigin=rawOrigin.map((v,i)=>v+rawEast[i]*lateralResolution),originalLocal=(u,v)=>resolvedOrigin.map((q,i)=>q+rawEast[i]*u+rawDirection[i]*v);
 // Independent map traces disagree in heading by 0.2475 degrees. Align the
 // whole straight formation and its rails with the unchanged platform edge,
 // pivoting at the selected vestibule rather than clipping the rear cars.
 const pa=KEIHAN_PLATFORM2[0],pb=KEIHAN_PLATFORM2[1],platformLength=Math.hypot(pb[0]-pa[0],pb[1]-pa[1]),direction=[(pb[0]-pa[0])/platformLength,(pb[1]-pa[1])/platformLength],east=[direction[1],-direction[0]],anchor=originalLocal(0,selectedV);
 const origin=anchor.map((v,i)=>v-direction[i]*selectedV),crossCorrection=platformEdgeAt(origin,east,direction,selectedV)-bodyHalfWidth-doorGap;for(let i=0;i<2;i++)origin[i]+=east[i]*crossCorrection;
 const local=(u,v)=>origin.map((q,i)=>q+east[i]*u+direction[i]*v),headingResolution=Math.atan2(direction[0],direction[1])-Math.atan2(rawDirection[0],rawDirection[1]);
 // Keep accepted camera framing fixed; the corrected selected door moves by
 // only 6 mm and remains inside the tested automatic egress corridor.
 const trainFloor=platformFloor+.025,inside=originalLocal(.25,selectedV),outside=originalLocal(4.2,selectedV),wallLook=originalLocal(12,selectedV),door=local(carWidth/2,selectedV);
 const gate=[-302.6,platformFloor,-151.4],rampHead=[-302.6,platformFloor,-149.7];
 return {revision:'Keihan-KH34-arrival-1',source:KEIHAN_SOURCE,builtIds:[...KEIHAN_BUILDING_IDS],
  coordinates:{originLat:34.96714,originLon:135.77267,radius:6378137,x:'east',y:'up',z:'south'},
  platform1:{id:KEIHAN_SOURCE.platform1,points:KEIHAN_PLATFORM1},platform2:{id:KEIHAN_SOURCE.platform2,points:KEIHAN_PLATFORM2},platformFloor,railTop,
  track:{origin,direction,east,local,yaw:Math.atan2(-east[1],east[0]),trackSpacing:3.04,gauge:1.435,length:180,sourceEdge,lateralResolution,rawDirection,headingResolution,crossCorrection},
  train:{carLength,carWidth,bodyHalfWidth,carCenters,doorOffsets,selectedCar,selectedDoor,selectedV,floor:trainFloor,doorPosition:[door[0],trainFloor,door[1]],doorGap},
  gate:{center:gate,rampHead,rampFoot:gateFoot,width:4.5},
  publicExit:{position:exit,target:[-291.042,exit[1]+1.7,-114.169]},
  route:{platformDoor:[outside[0],platformFloor,outside[1]],turn:[outside[0],platformFloor,-160],gateApproach:[gate[0],platformFloor,-155.5],gate,rampHead,rampFoot:gateFoot,exit},
  arrival:{interiorPose:{position:[inside[0],trainFloor+1.7,inside[1]],target:[wallLook[0],platformFloor+1.7,wallLook[1]]},platformPose:{position:[outside[0],platformFloor+1.7,outside[1]],target:[wallLook[0],platformFloor+1.7,wallLook[1]]},travelDirection:[direction[0],0,direction[1]],travelDistance:24},
  provenance:'Keihan official KH34 plan: P2 Osaka-bound east side, southern separate gate. User Oct2024 Street View. OSM platforms223276787/789 and existing east-gate buildings/footway. Inferred floor rise .90m, train alignment reconciled to unchanged platform edge, stopping position, ramp grade, detail dimensions; no surveyed/current assignment claim.'};
}
export function keihanTrainPlatformGap(spec,v){return platformEdgeAt(spec.track.origin,spec.track.east,spec.track.direction,v)-spec.train.bodyHalfWidth;}
