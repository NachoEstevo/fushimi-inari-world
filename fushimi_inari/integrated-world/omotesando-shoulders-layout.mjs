import {pathWidth} from '../geography/geo-core.mjs';
const segmentDistance=(x,z,a,b)=>{const dx=b[0]-a[0],dz=b[2]-a[2],t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[2])*dz)/(dx*dx+dz*dz||1)));return Math.hypot(x-a[0]-t*dx,z-a[2]-t*dz);};
const inside=(x,z,points)=>{let yes=false;for(let i=0,j=points.length-1;i<points.length;j=i++){const a=points[i],b=points[j];if((a[2]>z)!==(b[2]>z)&&x<(b[0]-a[0])*(z-a[2])/(b[2]-a[2])+a[0])yes=!yes;}return yes;};
// A positive padding certifies the whole mesh cell, not just its center.
export function makeOmotesandoShoulderExclusion(features,bounds=null){
  const nearby=(points,pad=0)=>!bounds||!(Math.max(...points.map(p=>p[0]))+pad<bounds[0]||Math.min(...points.map(p=>p[0]))-pad>bounds[1]||Math.max(...points.map(p=>p[2]))+pad<bounds[2]||Math.min(...points.map(p=>p[2]))-pad>bounds[3]);
  const rings=[...(features.buildings??[]),...(features.water??[])].map(p=>p.points).filter(points=>nearby(points,.15));
  const paths=(features.paths??[]).filter(p=>p.id!=='way/105449722'&&nearby(p.points,pathWidth(p.tags??{})/2+.15));
  return (x,z,padding=0)=>{
    for(const points of rings){
      if(inside(x,z,points))return true;
      for(let i=0;i<points.length;i++)if(segmentDistance(x,z,points[i],points[(i+1)%points.length])<.15+padding)return true;
    }
    for(const path of paths)for(let i=1;i<path.points.length;i++)if(segmentDistance(x,z,path.points[i-1],path.points[i])<pathWidth(path.tags??{})/2+.15+padding)return true;
    return false;
  };
}
export function shoulderHeight(offset,edgeHeight,terrainHeight){const t=Math.max(0,Math.min(1,offset/1.5)),w=1-t*t*(3-2*t);return terrainHeight+(edgeHeight-terrainHeight)*w+.012;}

// Mirrored shoulder strips need opposite winding. Test the actual XZ signed
// area instead of relying on the side label, including gently bending strips.
export function upwardShoulderTriangles(corners){
  const [a,b,c]=corners.map(v=>v.p??v);
  const normalY=(b[2]-a[2])*(c[0]-a[0])-(b[0]-a[0])*(c[2]-a[2]);
  return normalY>=0?[0,1,2,0,2,3]:[0,2,1,0,3,2];
}
// Walking follows the same emitted triangle planes, including excluded holes.
// Small spatial bins keep queries local to a few cells instead of the precinct.
export function makeShoulderTriangleHeight(positions){
  const bins=new Map(),size=2;
  for(let i=0;i<positions.length;i+=9){
    const v=positions.slice(i,i+9),xs=[v[0],v[3],v[6]],zs=[v[2],v[5],v[8]];
    for(let x=Math.floor(Math.min(...xs)/size);x<=Math.floor(Math.max(...xs)/size);x++)for(let z=Math.floor(Math.min(...zs)/size);z<=Math.floor(Math.max(...zs)/size);z++){
      const key=x+','+z;if(!bins.has(key))bins.set(key,[]);bins.get(key).push(v);
    }
  }
  return (x,z)=>{
    for(const v of bins.get(Math.floor(x/size)+','+Math.floor(z/size))??[]){
      const [ax,ay,az,bx,by,bz,cx,cy,cz]=v,den=(bz-cz)*(ax-cx)+(cx-bx)*(az-cz);if(Math.abs(den)<1e-10)continue;
      const a=((bz-cz)*(x-cx)+(cx-bx)*(z-cz))/den,b=((cz-az)*(x-cx)+(ax-cx)*(z-cz))/den,c=1-a-b;
      if(a>=-1e-7&&b>=-1e-7&&c>=-1e-7)return a*ay+b*by+c*cy;
    }
    return null;
  };
}
