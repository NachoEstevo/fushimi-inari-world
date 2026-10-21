import {firstToriiSource} from './first-torii-source.mjs';
// The raw way establishes position and heading, not verified pillar spacing.
// R58: reduce the previous over-wide asset by20%; visual correction requested
// by the user, not a surveyed dimension. Keep raw span separately auditable.
// Processed POIs keep the first vertex of this two-node WAY. Its true midpoint
// and transverse heading must come from both raw source nodes, not that POI.
export function mappedFirstToriiPlacement(){
 const [a,b]=firstToriiSource.endpoints,dx=b[0]-a[0],dz=b[1]-a[1],sourceSpan=Math.hypot(dx,dz),span=sourceSpan*.8;
 return {center:[(a[0]+b[0])/2,(a[1]+b[1])/2],yaw:-Math.atan2(dz,dx),span,sourceSpan,widthFactor:.8,scaleX:span/8.8,sourceWay:firstToriiSource.wayId,nodeIds:firstToriiSource.nodeIds};
}
