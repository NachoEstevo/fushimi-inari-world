import {subtractConvex,polygonArea,clipConvex} from './entrance-area-surfaces-layout.mjs';

// Explicit walking-top owners only. Authored central ribbons retain their
// palette at crossings; no curb, earth, retaining face or collider enters here.
export const walkingTopOwnersR96=['omotesando','senbon','precinct','stone','mountainPaving','mountainTread'];
export function partitionWalkingTopsR96(buckets,uvBuckets,{cellSize=8}={}){
 const cells=new Map(),epsilon=1e-5,stats={inputTriangles:0,outputTriangles:0,candidateChecks:0,overlaps:0};
 const key=(x,z,y)=>`${x},${z},${y}`,bounds=p=>[Math.min(...p.map(v=>v[0])),Math.max(...p.map(v=>v[0])),Math.min(...p.map(v=>v[1])),Math.max(...p.map(v=>v[1]))];
 for(const owner of walkingTopOwnersR96){
  const vertices=buckets[owner]??[],sourceUV=uvBuckets[owner],out=[],uv=[];
  for(let i=0;i<vertices.length;i+=9){
   stats.inputTriangles++;const source=vertices.slice(i,i+9),p=[[source[0],source[2]],[source[3],source[5]],[source[6],source[8]]],y=source[1];
   const dx=source[3]-source[0],dy=source[4]-source[1],dz=source[5]-source[2],ex=source[6]-source[0],ey=source[7]-source[1],ez=source[8]-source[2],nx=dy*ez-dz*ey,ny=dz*ex-dx*ez,nz=dx*ey-dy*ex,length=Math.hypot(nx,ny,nz);
   const originalUV=sourceUV?.slice(i/3*2,i/3*2+6)??[0,3,6].flatMap(j=>Math.abs(ny)/length>.5?[source[j]/2,source[j+2]/2]:[(Math.abs(nx)/length>.5?source[j+2]:source[j])/2,source[j+1]/2]);
   const a=polygonArea(p);
   if(Math.abs(source[4]-y)>epsilon||Math.abs(source[7]-y)>epsilon||Math.abs(a)<1e-10){out.push(...source);uv.push(...originalUV);continue;}
   const b=bounds(p),x0=Math.floor(b[0]/cellSize),x1=Math.floor(b[1]/cellSize),z0=Math.floor(b[2]/cellSize),z1=Math.floor(b[3]/cellSize),level=Math.floor(y/epsilon),candidates=new Set();
   for(let x=x0;x<=x1;x++)for(let z=z0;z<=z1;z++)for(let l=level-1;l<=level+1;l++)for(const old of cells.get(key(x,z,l))??[])candidates.add(old);
   let pieces=[p];
   for(const old of candidates){stats.candidateChecks++;if(Math.abs(old.y-y)>=epsilon||old.b[0]>=b[1]-1e-8||old.b[1]<=b[0]+1e-8||old.b[2]>=b[3]-1e-8||old.b[3]<=b[2]+1e-8)continue;
    if(Math.abs(polygonArea(clipConvex(p,old.p)))<1e-8)continue;
    stats.overlaps++;pieces=pieces.flatMap(piece=>subtractConvex(piece,old.p));if(!pieces.length)break;
   }
   if(pieces.length===1&&pieces[0]===p){out.push(...source);uv.push(...originalUV);}else{
    const [a,b,c]=p,den=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1]);
    for(let piece of pieces){if(polygonArea(piece)>0)piece=[...piece].reverse();for(let j=1;j<piece.length-1;j++){const triangle=[piece[0],piece[j],piece[j+1]];if(Math.abs(polygonArea(triangle.map(v=>v.map(Math.fround))))<1e-9)continue;
     for(const [x,z]of triangle){out.push(x,y,z);const u=((b[1]-c[1])*(x-c[0])+(c[0]-b[0])*(z-c[1]))/den,v=((c[1]-a[1])*(x-c[0])+(a[0]-c[0])*(z-c[1]))/den;for(let k=0;k<2;k++)uv.push(u*originalUV[k]+v*originalUV[2+k]+(1-u-v)*originalUV[4+k]);}
    }}
   }
   const record={p,b,y};for(let x=x0;x<=x1;x++)for(let z=z0;z<=z1;z++){const k=key(x,z,level);if(!cells.has(k))cells.set(k,[]);cells.get(k).push(record);}
  }
  buckets[owner]=out;uvBuckets[owner]=uv;stats.outputTriangles+=out.length/9;
 }
 return stats;
}
