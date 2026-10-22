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

const wingRoofScale=2.15/3.8;
export function romonWingRoofTop(x,z,corrected=false){
 const mid=x<0?-12.5:12.5,u=Math.abs((x-mid)/6.9),v=Math.abs(z/2.9),onset=corrected?6.4/6.9:.38;
 const hip=Math.max(0,(u-onset)/(1-onset));
 // The photographed upper end is a gable, not a descending bark curtain.
 // Keep hip fall only in the lower outer shoulders; the upper roof clears
 // the pale gable face while retaining the same plan, ridge and eave bounds.
 const t=Math.max(0,Math.min(1,(v-.65)/.35)),shoulder=corrected?t*t*(3-2*t):1;
 const r=Math.min(1,Math.sqrt(v*v+hip*hip*.85*shoulder));
 return 5.35+2.15*Math.pow(1-r,1.38)+.42*wingRoofScale*v*v*u*u;
}
export function isInheritedRomonWingRoofPoint(p){
 if(Math.abs(p[0])<5.5999||Math.abs(p[0])>19.4001||Math.abs(p[2])>2.9001)return false;
 const delta=romonWingRoofTop(p[0],p[2])-p[1];return Math.abs(delta)<.001||Math.abs(delta-.38*wingRoofScale)<.001;
}

// Exact original builder343 roof fittings; the central gate's fittings are
// outside these per-component bounds. No broad gold/material deletion.
export function inheritedRomonWingRoofFittings(kind){
 const out=[],scale=wingRoofScale,ridge=13.8*.52,y=5.35+2.15+.14*scale;
 const add=(x,cy,z,w,h,d)=>out.push({min:[x-w/2,cy-h/2,z-d/2],max:[x+w/2,cy+h/2,z+d/2]});
 for(const side of [-1,1]){const mid=side*12.5;
  if(kind==='blackRoof')add(mid,y,0,ridge,.42*scale,.52*scale);
  if(kind==='goldRoof')add(mid,y+.42*scale*.52,0,ridge+.15*scale,.06*scale,.52*scale*1.06);
  for(const end of [-1,1]){const x=mid+end*(ridge/2+.12*scale);
   if(kind==='blackRoof'){add(x,y+.10*scale,0,.32*scale,.68*scale,.65*scale);add(x-end*.15,5.35+2.15*.62,0,.18,2.15*.38,5.8*.36);}
   if(kind==='goldRoof'){add(x,y+.14*scale,(.34-.03)*scale,.24*scale,.24*scale,.06*scale);add(x-end*.22,5.35+2.15*.78,0,.22,.16*scale,5.8*.38);}
  }
  if(kind==='goldRoof')for(const offset of [-ridge*.38,0,ridge*.38])for(const face of [-1,1])add(mid+offset,y+.02*scale,-face*.52*scale*.51-.02*scale,.26*scale,.26*scale,.04*scale);
 }
 return out;
}
export function isInheritedRomonWingRoofFitting(points,kind){
 return inheritedRomonWingRoofFittings(kind).some(b=>points.every(p=>p.every((v,i)=>v>=b.min[i]-.001&&v<=b.max[i]+.001)));
}
