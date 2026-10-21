const cross=(a,b,p)=>(b[0]-a[0])*(p[1]-a[1])-(b[1]-a[1])*(p[0]-a[0]);
export const courtPolygonArea=p=>Math.abs(p.reduce((sum,a,i)=>{const b=p[(i+1)%p.length];return sum+a[0]*b[1]-b[0]*a[1];},0))/2;
const bounds=p=>[Math.min(...p.map(v=>v[0])),Math.max(...p.map(v=>v[0])),Math.min(...p.map(v=>v[1])),Math.max(...p.map(v=>v[1]))];
const overlaps=(a,b)=>a[0]<=b[1]&&a[1]>=b[0]&&a[2]<=b[3]&&a[3]>=b[2];

// Subtract a convex obstacle as disjoint convex pieces. Unlike cell rejection,
// this emits the actual shared boundary, including a diagonal paving edge.
export function subtractCourtObstacle(subject,obstacle){
  const signed=obstacle.reduce((s,a,i)=>{const b=obstacle[(i+1)%obstacle.length];return s+a[0]*b[1]-b[0]*a[1];},0);
  const clip=signed<0?[...obstacle].reverse():obstacle,outside=[];
  let remaining=subject;
  for(let i=0;i<clip.length&&remaining.length>=3;i++){
    const a=clip[i],b=clip[(i+1)%clip.length],inside=[],out=[];
    for(let j=0;j<remaining.length;j++){
      const p=remaining[j],q=remaining[(j+1)%remaining.length],dp=cross(a,b,p),dq=cross(a,b,q);
      if(dp>=0)inside.push(p);
      if(dp<=0)out.push(p);
      if((dp>0&&dq<0)||(dp<0&&dq>0)){
        const t=dp/(dp-dq),hit=[p[0]+(q[0]-p[0])*t,p[1]+(q[1]-p[1])*t];
        inside.push(hit);out.push(hit);
      }
    }
    if(out.length>=3&&courtPolygonArea(out)>1e-10)outside.push(out);
    remaining=inside;
  }
  return outside;
}

export function clippedCourtCells(courtBounds,obstacles,grid=.4){
  const prepared=obstacles.filter(p=>p.length>=3&&courtPolygonArea(p)>1e-10).map(p=>({p,b:bounds(p)})).filter(o=>overlaps(courtBounds,o.b));
  const [left,right,back,front]=courtBounds,result=[];
  for(let x=left;x<right-1e-6;x+=grid)for(let z=back;z<front-1e-6;z+=grid){
    const bx=Math.min(x+grid,right),bz=Math.min(z+grid,front),box=[x,bx,z,bz];
    let pieces=[[[x,z],[bx,z],[bx,bz],[x,bz]]];
    for(const obstacle of prepared){
      if(!overlaps(box,obstacle.b))continue;
      pieces=pieces.flatMap(p=>subtractCourtObstacle(p,obstacle.p));
      if(!pieces.length)break;
    }
    result.push(...pieces);
  }
  return result;
}
