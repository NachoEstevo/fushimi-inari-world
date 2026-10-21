const cross=(a,b,p)=>(b[0]-a[0])*(p[1]-a[1])-(b[1]-a[1])*(p[0]-a[0]);
export const polygonArea=p=>p.reduce((sum,a,i)=>{const b=p[(i+1)%p.length];return sum+a[0]*b[1]-b[0]*a[1];},0)/2;
const ccw=p=>polygonArea(p)<0?[...p].reverse():p;
function halfPlane(poly,a,b,inside){
  if(!poly.length)return [];
  const out=[];let previous=poly.at(-1),dp=cross(a,b,previous)*(inside?1:-1);
  for(const current of poly){
    const dc=cross(a,b,current)*(inside?1:-1);
    if((dc>=0)!==(dp>=0)){const t=dp/(dp-dc);out.push([previous[0]+(current[0]-previous[0])*t,previous[1]+(current[1]-previous[1])*t]);}
    if(dc>=0)out.push(current);previous=current;dp=dc;
  }
  return out;
}
export function clipConvex(subject,boundary){
  let polygon=subject;const clip=ccw(boundary);
  for(let i=0;i<clip.length&&polygon.length;i++)polygon=halfPlane(polygon,clip[i],clip[(i+1)%clip.length],true);
  return Math.abs(polygonArea(polygon))>1e-8?polygon:[];
}
// Disjoint outside pieces preserve the exact boundary of path/building cutouts.
export function subtractConvex(subject,boundary){
  let remainder=subject;const pieces=[],clip=ccw(boundary);
  for(let i=0;i<clip.length&&remainder.length;i++){
    const a=clip[i],b=clip[(i+1)%clip.length],outside=halfPlane(remainder,a,b,false);
    if(Math.abs(polygonArea(outside))>1e-8)pieces.push(outside);
    remainder=halfPlane(remainder,a,b,true);
  }
  return pieces;
}
