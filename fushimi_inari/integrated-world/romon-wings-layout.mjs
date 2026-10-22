// Existing authored Kairo envelope retained; heights and bay spacings remain
// visual estimates. IMG6484/6485 show five-bay open court arcades, and
// IMG6491 identifies the north outer end window.
export const romonWingDimensions=Object.freeze({floor:2.05,top:5.35,wallZ:1.90,courtColumnZ:-1.92,windowBottom:2.85,windowTop:4.65,windowWidth:1.92});
export function romonWingLayout(){
 return [-1,1].map(side=>({side,name:side<0?'north':'south',mid:side*12.5,start:side*12.5-6.4,end:side*12.5+6.4,outerX:side*18.9,
  bays:Array.from({length:5},(_,i)=>({x:side*12.5-4.8+i*2.4,screen:!(side===1&&i===4)})),endScreen:side===-1,
  posts:Array.from({length:6},(_,i)=>side*12.5-6+i*2.4)}));
}
// Entire triangles must be inside this original wall/column region. Roof,
// stone base, central gate, barrel props and their materials are not targeted.
export function isInheritedRomonWingTriangle(points){
 return points.every(([x,y,z])=>Math.abs(x)>=6.0-1e-4&&Math.abs(x)<=19.0+1e-4&&y>=2.0-1e-4&&y<=5.46+1e-4&&Math.abs(z)<=2.11+1e-4);
}

// Source builder796/797: unsupported stacked Komodaru and separate blue
// crests formerly concealed inside the solid wing walls. Exact component
// footprints prevent removal of central plaques or other straw decoration.
export function isInheritedRomonBarrelTriangle(points,crest=false){
 const radius=crest?.17:.25,zmin=crest?2.52:1.53,zmax=crest?2.56:2.05;
 for(const side of [-1,1])for(const x of [7.70,8.32,8.94])for(const y of [2.15,2.71,3.27]){
  if(points.every(p=>Math.abs(p[0]-side*x)<=radius+.0001&&Math.abs(p[1]-y)<=radius+.0001&&p[2]>=zmin-.0001&&p[2]<=zmax+.0001))return true;
 }
 return false;
}
