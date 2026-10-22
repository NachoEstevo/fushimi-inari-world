// Stitch adaptive DEM cells: a coarse cell must share every edge vertex with
// its finely subdivided neighbour, especially beside flattened terraces.
// One viewer/gate-seating contract: keep detail selection and the rendered
// terrain offset together instead of sampling a different height function.
export function integratedTerrainTriangles(terrain,anchors,pathDistance,terrainHeight){
  return terrainTriangles(terrain,(c,r)=>{
    const x=terrain.xmin+c*terrain.step,z=terrain.zmin+r*terrain.step;
    const nearby=anchors.some(a=>a.radius&&Math.hypot(x+5-a.target[0],z+5-a.target[2])<a.radius*1.5+10);
    const corridor=x>110&&x<1430&&z>-580&&z<330&&(pathDistance(x+5,z+5)?.distance??100)<8;
    return nearby||corridor;
  },(x,z)=>terrainHeight(x,z)-.06);
}
export function terrainTriangles(terrain,isDetailed,height){
  const cols=terrain.cols-1,rows=terrain.rows-1,n=10,vertices=[];
  const detail=Array.from({length:rows},(_,r)=>Array.from({length:cols},(_,c)=>isDetailed(c,r)));
  const fine=(c,r)=>detail[r]?.[c]??false;
  const point=(x,z)=>[x,height(x,z),z];
  const emit=(a,b,c)=>vertices.push(...point(...a),...point(...b),...point(...c));
  for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){
    const x=terrain.xmin+c*terrain.step,z=terrain.zmin+r*terrain.step,s=terrain.step;
    if(fine(c,r)){
      for(let iz=0;iz<n;iz++)for(let ix=0;ix<n;ix++){
        const a=[x+ix*s/n,z+iz*s/n],b=[a[0],z+(iz+1)*s/n],d=[x+(ix+1)*s/n,a[1]],e=[d[0],b[1]];
        emit(a,b,d);emit(d,b,e);
      }
    }else if([fine(c-1,r),fine(c+1,r),fine(c,r-1),fine(c,r+1)].some(Boolean)){
      const ring=[],edges=[[[x,z],[x,z+s],fine(c-1,r)],[[x,z+s],[x+s,z+s],fine(c,r+1)],[[x+s,z+s],[x+s,z],fine(c+1,r)],[[x+s,z],[x,z],fine(c,r-1)]];
      for(const [a,b,detailed] of edges){const count=detailed?n:1;for(let i=0;i<count;i++)ring.push([a[0]+(b[0]-a[0])*i/count,a[1]+(b[1]-a[1])*i/count]);}
      for(let i=0;i<ring.length;i++)emit([x+s/2,z+s/2],ring[i],ring[(i+1)%ring.length]);
    }else{emit([x,z],[x,z+s],[x+s,z]);emit([x+s,z],[x,z+s],[x+s,z+s]);}
  }
  return vertices;
}
