import {pathWidth} from '../geography/geo-core.mjs';
const segmentDistance=(x,z,a,b)=>{const dx=b[0]-a[0],dz=b[2]-a[2],t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[2])*dz)/(dx*dx+dz*dz||1)));return Math.hypot(x-a[0]-t*dx,z-a[2]-t*dz);};
const inside=(x,z,points)=>{let yes=false;for(let i=0,j=points.length-1;i<points.length;j=i++){const a=points[i],b=points[j];if((a[2]>z)!==(b[2]>z)&&x<(b[0]-a[0])*(z-a[2])/(b[2]-a[2])+a[0])yes=!yes;}return yes;};
// A positive padding certifies the whole mesh cell, not just its center.
export function makeOmotesandoShoulderExclusion(features){
  const rings=[...(features.buildings??[]),...(features.water??[])].map(p=>p.points);
  const paths=(features.paths??[]).filter(p=>p.id!=='way/105449722');
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
