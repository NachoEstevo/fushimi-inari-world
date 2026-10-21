export const mappedStationId='way/952687107';
export function mappedStationPlacement(features){
 const building=features.buildings.find(b=>b.id===mappedStationId);if(!building)return null;
 const points=building.points;let longest=null;
 for(let i=1;i<points.length;i++){
  let dx=points[i][0]-points[i-1][0],dz=points[i][2]-points[i-1][2];const length=Math.hypot(dx,dz);
  if(!longest||length>longest.length){if(dz<0){dx=-dx;dz=-dz;}longest={dx,dz,length};}
 }
 if(!longest)return null;
 const xs=points.map(p=>p[0]),zs=points.map(p=>p[2]);
 return {id:building.id,center:[(Math.min(...xs)+Math.max(...xs))/2,(Math.min(...zs)+Math.max(...zs))/2],yaw:-Math.atan2(longest.dz,longest.dx),longEdge:longest.length,dimensionsRetained:true};
}
