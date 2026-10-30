// Stitch adaptive DEM cells: a coarse cell must share every edge vertex with
// its finely subdivided neighbour, especially beside flattened terraces.
// One viewer/gate-seating contract: keep detail selection and the rendered
// terrain offset together instead of sampling a different height function.
export function integratedTerrainTriangles(terrain,anchors,pathDistance,terrainHeight,{detailBounds=[]}={}){
  return terrainTriangles(terrain,integratedDetail(terrain,anchors,pathDistance,detailBounds),(x,z)=>terrainHeight(x,z)-.06);
}
export async function integratedTerrainTrianglesAsync(terrain,anchors,pathDistance,terrainHeight,{detailBounds=[],...pacing}={}){
  return terrainTrianglesAsync(terrain,integratedDetail(terrain,anchors,pathDistance,detailBounds),(x,z)=>terrainHeight(x,z)-.06,pacing);
}
function integratedDetail(terrain,anchors,pathDistance,detailBounds){
  if(!detailBounds.every(b=>Array.isArray(b)&&b.length===4&&b.every(Number.isFinite)&&b[0]<b[1]&&b[2]<b[3]))throw new TypeError('Terrain detail bounds must be finite [minX,maxX,minZ,maxZ] rectangles');
  return (c,r)=>{
    const x=terrain.xmin+c*terrain.step,z=terrain.zmin+r*terrain.step;
    const nearby=anchors.some(a=>a.radius&&Math.hypot(x+5-a.target[0],z+5-a.target[2])<a.radius*1.5+10);
    const corridor=x>110&&x<1430&&z>-580&&z<330&&(pathDistance(x+5,z+5)?.distance??100)<8;
    // Architecture may register a real court crossing a coarse cell edge.
    // Own resolution only: keep the sampler/offset and neighbor stitching.
    const registered=detailBounds.some(b=>x<b[1]&&x+terrain.step>b[0]&&z<b[3]&&z+terrain.step>b[2]);
    return nearby||corridor||registered;
  };
}
export function terrainTriangles(terrain,isDetailed,height){
  const work=terrainTriangleWork(terrain,isDetailed,height);let next=work.next();
  while(!next.done)next=work.next();return next.value;
}
export async function terrainTrianglesAsync(terrain,isDetailed,height,{yieldWork,now=()=>performance.now(),budgetMs=32,cacheHeights=false}={}){
  if(typeof yieldWork!=='function')throw new TypeError('Terrain preparation requires yieldWork');
  if(!(budgetMs>0&&budgetMs<=32))throw new RangeError('Terrain preparation budget must be between 0 and 32 ms');
  const work=terrainTriangleWork(terrain,isDetailed,height,cacheHeights);let start=now(),next=work.next();
  while(!next.done){
    if(now()-start>=budgetMs){await yieldWork();start=now();}
    next=work.next();
  }
  return next.value;
}
// Both callers drain the same ordered geometry work. Default sampling retains
// every invocation; only the async caller inserts real task boundaries.
function* terrainTriangleWork(terrain,isDetailed,height,cacheHeights=false){
  const cols=terrain.cols-1,rows=terrain.rows-1,n=10,vertices=[];
  const detail=[];
  for(let r=0;r<rows;r++){
    const row=[];detail.push(row);
    for(let c=0;c<cols;c++){row.push(isDetailed(c,r));yield;}
  }
  const fine=(c,r)=>detail[r]?.[c]??false;
  // Opt in only for a pure, immutable sampler during this generation. Exact
  // numeric keys retain distinct floating-point coordinates; discard each
  // coarse row so the cache never grows with the full terrain height.
  const heights=cacheHeights?new Map():null;
  function sample(x,z){
    if(!heights)return height(x,z);
    let column=heights.get(x);
    if(!column){column=new Map();heights.set(x,column);}
    if(!column.has(z))column.set(z,height(x,z));
    return column.get(z);
  }
  const point=(x,z)=>[x,sample(x,z),z];
  const emit=(a,b,c)=>vertices.push(...point(...a),...point(...b),...point(...c));
  for(let r=0;r<rows;r++){
    heights?.clear();
    for(let c=0;c<cols;c++){
      const x=terrain.xmin+c*terrain.step,z=terrain.zmin+r*terrain.step,s=terrain.step;
      if(fine(c,r)){
        for(let iz=0;iz<n;iz++){
          for(let ix=0;ix<n;ix++){
            const a=[x+ix*s/n,z+iz*s/n],b=[a[0],z+(iz+1)*s/n],d=[x+(ix+1)*s/n,a[1]],e=[d[0],b[1]];
            emit(a,b,d);emit(d,b,e);
          }
          yield;
        }
      }else if([fine(c-1,r),fine(c+1,r),fine(c,r-1),fine(c,r+1)].some(Boolean)){
        const ring=[],edges=[[[x,z],[x,z+s],fine(c-1,r)],[[x,z+s],[x+s,z+s],fine(c,r+1)],[[x+s,z+s],[x+s,z],fine(c+1,r)],[[x+s,z],[x,z],fine(c,r-1)]];
        for(const [a,b,detailed] of edges){const count=detailed?n:1;for(let i=0;i<count;i++)ring.push([a[0]+(b[0]-a[0])*i/count,a[1]+(b[1]-a[1])*i/count]);}
        for(let i=0;i<ring.length;i++)emit([x+s/2,z+s/2],ring[i],ring[(i+1)%ring.length]);
      }else{emit([x,z],[x,z+s],[x+s,z]);emit([x+s,z],[x,z+s],[x+s,z+s]);}
      yield;
    }
  }
  return vertices;
}
