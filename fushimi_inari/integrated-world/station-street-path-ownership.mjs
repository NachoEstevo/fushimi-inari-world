import {clipConvex,subtractConvex,polygonArea} from './entrance-area-surfaces-layout.mjs';

const owners=['street','omotesando','precinct','stone'];
const flat=triangle=>triangle.map(p=>[p[0],p[2]]);
const bounds=p=>[Math.min(...p.map(v=>v[0])),Math.max(...p.map(v=>v[0])),Math.min(...p.map(v=>v[1])),Math.max(...p.map(v=>v[1]))];
const overlaps=(a,b)=>a[0]<b[1]&&a[1]>b[0]&&a[2]<b[3]&&a[3]>b[2];
const stationBounds=[-365,-140,-330,40];
// Mapped way/105449722 runs from (-157.407,10.342) to (-18.3,1.959).
// Include its crossing footways, whose independently fitted grades also slope.
const omotesandoBounds=[-165,-12,-5,20];
function interpolate(triangle,x,z){
 const [a,b,c]=triangle,den=(b[2]-c[2])*(a[0]-c[0])+(c[0]-b[0])*(a[2]-c[2]);
 const u=((b[2]-c[2])*(x-c[0])+(c[0]-b[0])*(z-c[2]))/den,v=((c[2]-a[2])*(x-c[0])+(a[0]-c[0])*(z-c[2]))/den;
 return a.map((value,k)=>k===0?x:k===2?z:u*value+v*b[k]+(1-u-v)*c[k]);
}

// Station street tops take precedence over generic trail paving. Unlike the
// precinct partition, these junctions are sloped and have independently fitted
// grades. Clip their actual triangles; preserve every retained height and UV.
export function partitionStationStreetTops(buckets,uvBuckets){
 const cells=new Map(),cellSize=16,stats={overlaps:0,removedArea:0,candidateChecks:0};let order=0;
 const cellKeys=box=>{const keys=[];for(let x=Math.floor(box[0]/cellSize);x<=Math.floor(box[1]/cellSize);x++)for(let z=Math.floor(box[2]/cellSize);z<=Math.floor(box[3]/cellSize);z++)keys.push(x+','+z);return keys;};
 for(const owner of owners){
  const source=buckets[owner]??[],sourceUV=uvBuckets[owner],out=[],uv=[];
  for(let i=0;i<source.length;i+=9){
   const box=[Math.min(source[i],source[i+3],source[i+6]),Math.max(source[i],source[i+3],source[i+6]),Math.min(source[i+2],source[i+5],source[i+8]),Math.max(source[i+2],source[i+5],source[i+8])];
   // Most world triangles are outside these two small walking corridors. Avoid
   // allocating polygon/UV arrays for that untouched majority.
   if(!overlaps(box,stationBounds)&&!overlaps(box,omotesandoBounds)){for(let j=0;j<9;j++)out.push(source[i+j]);if(sourceUV)for(let j=0;j<6;j++)uv.push(sourceUV[i/3*2+j]);continue;}
   const triangle=[0,3,6].map((j,k)=>[...source.slice(i+j,i+j+3),...(sourceUV?.slice(i/3*2+k*2,i/3*2+k*2+2)??[])]);
   const polygon=flat(triangle);
   if(Math.abs(polygonArea(polygon))<1e-9){out.push(...source.slice(i,i+9));if(sourceUV)uv.push(...triangle.flatMap(p=>p.slice(3)));continue;}
   let pieces=[polygon];
   const candidates=new Set();for(const key of cellKeys(box))for(const old of cells.get(key)??[])candidates.add(old);
   for(const old of [...candidates].sort((a,b)=>a.order-b.order)){
    stats.candidateChecks++;
    if(!overlaps(box,old.box))continue;
    const intersection=clipConvex(polygon,old.polygon);if(Math.abs(polygonArea(intersection))<1e-8)continue;
    // Separate decks/bridges keep their own level. Only the nearby grade
    // disagreement already tolerated by the station walking reconciliation yields.
    if(intersection.some(([x,z])=>Math.abs(interpolate(triangle,x,z)[1]-interpolate(old.triangle,x,z)[1])>.24))continue;
    const areaBefore=pieces.reduce((n,p)=>n+Math.abs(polygonArea(p)),0);
    pieces=pieces.flatMap(p=>subtractConvex(p,old.polygon));
    stats.removedArea+=areaBefore-pieces.reduce((n,p)=>n+Math.abs(polygonArea(p)),0);stats.overlaps++;
    if(!pieces.length)break;
   }
   if(pieces.length===1&&pieces[0]===polygon){out.push(...source.slice(i,i+9));uv.push(...triangle.flatMap(p=>p.slice(3)));}
   else for(const piece of pieces)for(let j=1;j<piece.length-1;j++){
    const points=polygonArea(piece)*polygonArea(polygon)<0?[piece[0],piece[j+1],piece[j]]:[piece[0],piece[j],piece[j+1]];
    if(Math.abs(polygonArea(points))<1e-9)continue;
    for(const [x,z]of points){const p=interpolate(triangle,x,z);out.push(...p.slice(0,3));uv.push(...p.slice(3));}
   }
   // Record emitted pieces, never a removed source footprint that could erase
   // a later owner's valid continuation.
   for(const polygon of pieces){const record={polygon,box:bounds(polygon),triangle,order:order++};for(const key of cellKeys(record.box)){if(!cells.has(key))cells.set(key,[]);cells.get(key).push(record);}}
  }
  buckets[owner]=out;if(sourceUV)uvBuckets[owner]=uv;
 }
 return stats;
}
