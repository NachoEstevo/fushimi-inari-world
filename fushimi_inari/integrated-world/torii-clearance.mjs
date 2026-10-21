// Omit an inferred gate if either post obstructs a mapped walking centreline
// (a tight bend or a side junction). Rendering and collision share the decision.
export function toriiPosts(x,z,yaw,sx,sz,thickness){
  return [-1,1].map(side=>({x:x+Math.cos(yaw)*1.24*sx*side,
    z:z-Math.sin(yaw)*1.24*sx*side,radius:.144*thickness*Math.max(sx,sz)}));
}
export function toriiClearsPaths(posts,nearestPath){
  return posts.every(p=>{
    const near=nearestPath(p.x,p.z);
    return !near||near.distance>=p.radius+.28+.10;
  });
}
