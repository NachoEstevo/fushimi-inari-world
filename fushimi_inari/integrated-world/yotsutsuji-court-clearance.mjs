import {subtractConvex,polygonArea} from './entrance-area-surfaces-layout.mjs';

// Existing west stair plus its 13 cm path-renderer curb skin. The final 1 cm
// clears Float32 seams; this is a render cutout, never a new walking surface.
export function yotsutsujiWestStairCutout(network){
 const steps=(network?.segments??[]).filter(s=>s.id==='way/1052553397'&&s.stair);
 if(!steps.length||steps.some(s=>![...s.a,...s.b,s.width].every(Number.isFinite)||s.width<=0))return null;
 const a=steps[0].a,b=steps.at(-1).b,dx=b[0]-a[0],dz=b[2]-a[2],length=Math.hypot(dx,dz);
 if(Math.hypot(a[0]-783.853,a[2]+211.051)>.02||Math.hypot(b[0]-797.017,b[2]+212.687)>.02)return null;
 if(steps.some(s=>!Number.isFinite(s.width)||Math.abs((s.a[0]-a[0])*dz-(s.a[2]-a[2])*dx)/length>.01))return null;
 const half=Math.max(...steps.map(s=>s.width))/2+.14,n=[-dz/length,dx/length];
 return [[a[0]-n[0]*half,a[2]-n[1]*half],[b[0]-n[0]*half,b[2]-n[1]*half],[b[0]+n[0]*half,b[2]+n[1]*half],[a[0]+n[0]*half,a[2]+n[1]*half]];
}

export function yotsutsujiCourtPieces(polygon,cutout){return cutout?subtractConvex(polygon,cutout):[polygon];}

// Exact surviving intervals of an existing border panel. Do not close the
// stair mouth again with an interpolated masonry wall above the lower treads.
export function yotsutsujiCourtEdgeIntervals(a,b,cutout){
 if(!cutout)return [[0,1]];
 const mask=polygonArea(cutout)<0?[...cutout].reverse():cutout;let lo=0,hi=1;
 for(let i=0;i<mask.length;i++){
  const p=mask[i],q=mask[(i+1)%mask.length],cross=v=>(q[0]-p[0])*(v[1]-p[1])-(q[1]-p[1])*(v[0]-p[0]),da=cross(a),db=cross(b),d=db-da;
  if(Math.abs(d)<1e-12){if(da<0)return [[0,1]];continue;}
  const t=-da/d;if(d>0)lo=Math.max(lo,t);else hi=Math.min(hi,t);
  if(lo>=hi)return [[0,1]];
 }
 return [[0,lo],[hi,1]].filter(([a,b])=>b-a>1e-10);
}
