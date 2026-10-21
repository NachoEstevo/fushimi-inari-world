import {pathWidth} from '../geography/geo-core.mjs';
const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
// Approximate vegetation envelope shared with the distant woodland direction.
// Not a surveyed lawn map. Preserve bare path margins and steep exposed banks.
export function groundCover(x,y,z,slope,pathDistance){
  const edge=135+Math.max(0,Math.abs(z)-350)*.25+Math.sin(z*.012)*35;
  return smooth(edge-12,edge+24,x)*smooth(50,75,y)
    *(1-smooth(.55,1.45,slope))*smooth(2.5,5.5,pathDistance);
}

const inside=(x,z,ring)=>{
  let yes=false;
  for(let i=0,j=ring.length-1;i<ring.length;j=i++){
    const a=ring[i],b=ring[j];if((a[1]>z)!==(b[1]>z)&&x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])yes=!yes;
  }
  return yes;
};
const distanceToSegment=(x,z,a,b)=>{
  const dx=b[0]-a[0],dz=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz||1)));
  return Math.hypot(x-a[0]-dx*t,z-a[1]-dz*t);
};

// R64 user-requested low grass/moss appearance around existing near-precinct
// architecture. This is an aesthetic envelope, not surveyed lawn landuse.
// World bounds include Omotesando, Gishikiden, Honden/Gonden and Okumiya;
// the station, city and summit retain their prior ground treatment.
export function makePrecinctGroundCover(features,{surfaceAreas=[],hardscapeAt=()=>false}={}){
  const extent=[-155,160,-115,65],cell=16,bins=new Map();
  const add=(item,bounds)=>{
    if(bounds[1]<extent[0]-12||bounds[0]>extent[1]+12||bounds[3]<extent[2]-12||bounds[2]>extent[3]+12)return;
    // A giant surrounding religious/forest polygon is not a surface mask.
    for(let x=Math.floor(Math.max(bounds[0],extent[0]-12)/cell);x<=Math.floor(Math.min(bounds[1],extent[1]+12)/cell);x++)
      for(let z=Math.floor(Math.max(bounds[2],extent[2]-12)/cell);z<=Math.floor(Math.min(bounds[3],extent[3]+12)/cell);z++){
        const key=x+','+z;if(!bins.has(key))bins.set(key,[]);bins.get(key).push(item);
      }
  };
  const addRing=ring=>{
    if(ring.length<3)return;
    const xs=ring.map(p=>p[0]),zs=ring.map(p=>p[1]);add({ring},[Math.min(...xs)-.5,Math.max(...xs)+.5,Math.min(...zs)-.5,Math.max(...zs)+.5]);
  };
  for(const feature of [...(features.buildings??[]),...(features.water??[])])addRing(feature.points.map(p=>[p[0],p[2]]));
  const areas=Array.isArray(surfaceAreas)?surfaceAreas:surfaceAreas.ways??[];
  for(const area of areas){
    if(!['parking','bicycle_parking'].includes(area.tags?.amenity)&&area.tags?.landuse!=='brownfield')continue;
    addRing(area.points.map(p=>[p[0],p.length===2?p[1]:p[2]]));
  }
  for(const path of features.paths??[]){
    const half=pathWidth(path.tags??{})/2+.35;
    for(let i=1;i<path.points.length;i++){
      const a=[path.points[i-1][0],path.points[i-1][2]],b=[path.points[i][0],path.points[i][2]];
      add({a,b,half},[Math.min(a[0],b[0])-half-.6,Math.max(a[0],b[0])+half+.6,Math.min(a[1],b[1])-half-.6,Math.max(a[1],b[1])+half+.6]);
    }
  }
  // Retained public courts are hardscape even where OSM supplies only path
  // centrelines. These conservative masks preserve their existing renderer;
  // they do not reclassify every unmarked parcel as a new paved polygon.
  // Central courtyard gravel is applied by the precise rotated shader mask.
  // A broad axis-aligned exclusion here leaves artificial dirt by Honden.
  const courts=[[-18,28,-33,-15],[-86,-68,-22,-3]];
  const precinct=(x,y,z,slope,pathDistance)=>{
    const envelope=smooth(-155,-143,x)*(1-smooth(148,160,x))*smooth(-115,-103,z)*(1-smooth(53,65,z));
    if(!envelope)return 0;
    if(hardscapeAt(x,z)||courts.some(([x0,x1,z0,z1])=>x>=x0&&x<=x1&&z>=z0&&z<=z1))return 0;
    let edge=1;
    for(const item of bins.get(Math.floor(x/cell)+','+Math.floor(z/cell))??[]){
      if(item.ring){
        if(inside(x,z,item.ring))return 0;
        for(let i=0;i<item.ring.length;i++)edge=Math.min(edge,smooth(.10,.45,distanceToSegment(x,z,item.ring[i],item.ring[(i+1)%item.ring.length])));
      }else edge=Math.min(edge,smooth(item.half,item.half+.55,distanceToSegment(x,z,item.a,item.b)));
      if(!edge)return 0;
    }
    const gentle=1-smooth(.65,1.65,slope);
    return envelope*edge*gentle*.94;
  };
  const combined=(x,y,z,slope,pathDistance)=>Math.max(groundCover(x,y,z,slope,pathDistance),precinct(x,y,z,slope,pathDistance));
  combined.precinct=precinct;
  return combined;
}
