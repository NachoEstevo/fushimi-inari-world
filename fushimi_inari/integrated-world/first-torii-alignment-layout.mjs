import {firstToriiSource} from './first-torii-source.mjs';
// Processed POIs keep the first vertex of this two-node WAY. Its true midpoint
// and transverse heading must come from both raw source nodes, not that POI.
export function mappedFirstToriiPlacement(){
 const [a,b]=firstToriiSource.endpoints,dx=b[0]-a[0],dz=b[1]-a[1],span=Math.hypot(dx,dz);
 return {center:[(a[0]+b[0])/2,(a[1]+b[1])/2],yaw:-Math.atan2(dz,dx),span,scaleX:span/8.8,sourceWay:firstToriiSource.wayId,nodeIds:firstToriiSource.nodeIds};
}
