// One flush paving apron replaces overlapping trail ends at the twin exit.
export const okushaArrival={minX:246,maxX:254,minZ:65.8,maxZ:72.2};
export function outsideArrival(polygon){
  const r=okushaArrival;
  if(polygon.every(p=>p[0]<r.minX)||polygon.every(p=>p[0]>r.maxX)||polygon.every(p=>p[2]<r.minZ)||polygon.every(p=>p[2]>r.maxZ))return [polygon];
  const clip=(poly,axis,bound,sign)=>{
    const out=[];
    for(let i=0;i<poly.length;i++){
      const a=poly[i],b=poly[(i+1)%poly.length],da=(a[axis]-bound)*sign,db=(b[axis]-bound)*sign;
      if(da>=0)out.push(a);
      if((da>=0)!==(db>=0)){const t=da/(da-db);out.push(a.map((v,j)=>v+(b[j]-v)*t));}
    }
    return out;
  };
  let remaining=polygon;const pieces=[];
  for(const [axis,bound,inside] of [[0,r.minX,1],[0,r.maxX,-1],[2,r.minZ,1],[2,r.maxZ,-1]]){
    const outer=clip(remaining,axis,bound,-inside);if(outer.length>=3)pieces.push(outer);
    remaining=clip(remaining,axis,bound,inside);if(!remaining.length)break;
  }
  return pieces;
}
