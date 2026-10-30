import {subtractConvex,polygonArea} from './entrance-area-surfaces-layout.mjs';

// Reused only by independently bounded, ray-verified local path junctions.
export function partitionSamePlanePathTrianglesR95(vertices,sourceUV,region){
  const result=[],resultUV=[],claimed=[];
  const bounds=p=>[Math.min(...p.map(v=>v[0])),Math.max(...p.map(v=>v[0])),Math.min(...p.map(v=>v[1])),Math.max(...p.map(v=>v[1]))];
  const overlaps=(a,b)=>a[0]<b[1]-1e-8&&a[1]>b[0]+1e-8&&a[2]<b[3]-1e-8&&a[3]>b[2]+1e-8;
  for(let i=0;i<vertices.length;i+=9){
    // This court owns only fully contained horizontal tops. Almost all world
    // curb/shoulder triangles bypass it; avoid constructing their polygons.
    if(i+8<vertices.length&&(Math.min(vertices[i],vertices[i+3],vertices[i+6])<region[0]||Math.max(vertices[i],vertices[i+3],vertices[i+6])>region[1]||Math.min(vertices[i+2],vertices[i+5],vertices[i+8])<region[2]||Math.max(vertices[i+2],vertices[i+5],vertices[i+8])>region[3]||Math.abs(vertices[i+4]-vertices[i+1])>1e-5||Math.abs(vertices[i+7]-vertices[i+1])>1e-5)){
      result.push(vertices[i],vertices[i+1],vertices[i+2],vertices[i+3],vertices[i+4],vertices[i+5],vertices[i+6],vertices[i+7],vertices[i+8]);
      if(sourceUV){const offset=i/3*2;if(offset+6<=sourceUV.length)resultUV.push(sourceUV[offset],sourceUV[offset+1],sourceUV[offset+2],sourceUV[offset+3],sourceUV[offset+4],sourceUV[offset+5]);else resultUV.push(...sourceUV.slice(offset,offset+6));}
      continue;
    }
    const tri=[vertices.slice(i,i+3),vertices.slice(i+3,i+6),vertices.slice(i+6,i+9)],y=tri[0][1],polygon=tri.map(p=>[p[0],p[2]]),b=bounds(polygon);
    if(b[0]<region[0]||b[1]>region[1]||b[2]<region[2]||b[3]>region[3]||tri.some(p=>Math.abs(p[1]-y)>1e-5)||Math.abs(polygonArea(polygon))<1e-10){result.push(...vertices.slice(i,i+9));if(sourceUV)resultUV.push(...sourceUV.slice(i/3*2,i/3*2+6));continue;}
    let pieces=[polygon];
    for(const old of claimed)if(Math.abs(old.y-y)<1e-5&&overlaps(old.bounds,b)){
      pieces=pieces.flatMap(p=>subtractConvex(p,old.polygon));if(!pieces.length)break;
    }
    for(let piece of pieces){
      // All authored path top triangles face up (clockwise in X/Z).
      if(polygonArea(piece)>0)piece=[...piece].reverse();
      for(let j=1;j<piece.length-1;j++){
        const t=[piece[0],piece[j],piece[j+1]];if(Math.abs(polygonArea(t))<1e-9)continue;
        for(const [x,z]of t){
          result.push(x,y,z);
          if(sourceUV){
            const [a,b,c]=polygon,den=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1]);
            const u=((b[1]-c[1])*(x-c[0])+(c[0]-b[0])*(z-c[1]))/den,v=((c[1]-a[1])*(x-c[0])+(a[0]-c[0])*(z-c[1]))/den,offset=i/3*2;
            for(let k=0;k<2;k++)resultUV.push(u*sourceUV[offset+k]+v*sourceUV[offset+2+k]+(1-u-v)*sourceUV[offset+4+k]);
          }
        }
      }
    }
    claimed.push({polygon,bounds:b,y});
  }
  return sourceUV?{vertices:result,uv:resultUV}:result;
}
