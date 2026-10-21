// The gate itself is not individually mapped. Its station is inferred from
// StreetView MvihcVb0f466FBJebqyECg (west view) at the mapped stair's lower end.
export function gondenAccessToriiLayout(features){
 const path=features.paths.find(p=>p.id==='way/105449693');if(!path||path.points.length<2)return null;
 const a=path.points[0],b=path.points[1],dx=b[0]-a[0],dz=b[2]-a[2],length=Math.hypot(dx,dz);if(!length)return null;
 return {center:[a[0],a[2]],yaw:Math.atan2(dx,dz),pillarSpan:5.6,height:5.8,sourcePath:path.id,placementStatus:'Photo-inferred gate at mapped lower stair endpoint; not an individually mapped torii',dimensionsStatus:'Estimated from StreetView; not surveyed'};
}
