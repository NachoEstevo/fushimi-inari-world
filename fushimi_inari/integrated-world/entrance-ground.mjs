import {pathWidth} from '../geography/geo-core.mjs';
import {rotateXZ} from './spatial.mjs';
import {entryWallRuns,entryGardenTiers} from './entrance-layout.mjs';

const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
function segmentDistance(x,z,a,b){
  const dx=b[0]-a[0],dz=b[2]-a[2],t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[2])*dz)/(dx*dx+dz*dz||1)));
  return Math.hypot(x-a[0]-dx*t,z-a[2]-dz*t);
}
function inRing(x,z,points){
  let inside=false;
  for(let i=0,j=points.length-1;i<points.length;j=i++){
    const a=points[i],b=points[j];
    if((a[2]>z)!==(b[2]>z)&&x<(b[0]-a[0])*(z-a[2])/(b[2]-a[2])+a[0])inside=!inside;
  }
  return inside;
}

// June 2012 north-close reference shows a near-flat public mineral apron.
// Its level is inferred; mapped shop walls and crossing own its footprint.
export function makeNorthCourtGrade(romon,features){
  const ids=['way/305214355','way/305214375','way/305214356'];
  const shops=(features.buildings??[]).filter(p=>ids.includes(p.id));
  const crossing=features.paths?.find(p=>p.id==='way/105449672');
  if(shops.length!==ids.length||!crossing)return (x,z,existing)=>existing;
  const points=shops.flatMap(p=>p.points),xmin=Math.min(...points.map(p=>p[0])),xmax=Math.max(...points.map(p=>p[0]));
  const crossingPoints=crossing.points.filter(p=>p[0]>=xmin&&p[0]<=xmax);
  if(!crossingPoints.length)return (x,z,existing)=>existing;
  const south=Math.max(...crossingPoints.map(p=>p[2]));
  const steps=(features.paths??[]).filter(p=>p.tags?.highway==='steps');
  return (x,z,existing)=>{
    let weight=smooth(xmin-1.5,xmin,x)*(1-smooth(xmax,xmax+1.5,x))*(1-smooth(south,south+2,z));
    if(!weight)return existing;
    const sx=Math.max(xmin,Math.min(xmax,x));
    let front=-Infinity;
    for(const shop of shops)for(let i=1;i<shop.points.length;i++){
      const a=shop.points[i-1],b=shop.points[i];
      if(sx<Math.min(a[0],b[0])||sx>Math.max(a[0],b[0]))continue;
      const t=(sx-a[0])/(b[0]-a[0]||1);
      front=Math.max(front,a[2]+(b[2]-a[2])*t);
    }
    if(!Number.isFinite(front))return existing;
    // Release within the front footing; never flatten the shops' rear land.
    weight*=smooth(front-.8,front,z);
    if(!weight)return existing;
    for(const path of steps)for(let i=1;i<path.points.length;i++)
      weight*=smooth(pathWidth(path.tags)/2+1,pathWidth(path.tags)/2+2,segmentDistance(x,z,path.points[i-1],path.points[i]));
    return existing+(romon.target[1]-existing)*weight;
  };
}

// The small court east of the mapped Azumamaro approach connects to the
// Gehaiden court. A coarse DEM slope here made gravel berms between the
// approach and its side access. Dimensions are inferred courtyard shoulders;
// the mapped approach owns position/direction, and the main court owns level.
export function makeAzumamaroCourtGrade(romon,features,rawGround=null){
  const approach=features.paths?.find(p=>p.id==='way/105449706');
  if(!approach||approach.points.length<2)return (x,z,existing)=>existing;
  const a=approach.points[1],b=approach.points[0];
  const dx=b[0]-a[0],dz=b[2]-a[2],length=Math.hypot(dx,dz);
  if(length<1)return (x,z,existing)=>existing;
  const tx=dx/length,tz=dz/length;
  const project=p=>[(p[0]-a[0])*tx+(p[2]-a[2])*tz,(p[0]-a[0])*tz-(p[2]-a[2])*tx];
  // Release beyond the open yard: the western wall of the long mapped
  // eastern building and rear worship hall bound it. The previous 15 m
  // shoulder ended in open gravel, exposing a 2 m DEM berm beside the garden.
  const east=features.buildings?.find(p=>p.id==='way/952815193');
  const rear=features.buildings?.find(p=>p.id==='way/305214824');
  const sideEnd=east?Math.min(...east.points.map(p=>project(p)[1])):15;
  const rearEnd=rear?Math.max(...rear.points.map(p=>project(p)[0])):20;
  const steps=(features.paths??[]).filter(p=>p.tags?.highway==='steps');
  const lane=rawGround&&features.paths?.find(p=>p.id==='way/223276650');
  const la=lane?.points[0],lb=lane?.points.at(-1);
  const laneLength=lane?Math.hypot(lb[0]-la[0],lb[2]-la[2]):0;
  const ltx=laneLength?(lb[0]-la[0])/laneLength:0,ltz=laneLength?(lb[2]-la[2])/laneLength:0;
  const laneStart=laneLength?Math.max(0,(rearEnd-project(la)[0])/(ltx*tx+ltz*tz)):0;
  const laneEnd=laneLength?rawGround(lb[0],lb[2]):0;
  const laneHalf=lane?pathWidth(lane.tags??{})/2:0;
  const laneExclusions=laneLength?[...(features.buildings??[]),...(features.water??[])].filter(p=>p.points.some(v=>
    v[0]>=Math.min(la[0],lb[0])-10&&v[0]<=Math.max(la[0],lb[0])+10&&v[2]>=Math.min(la[2],lb[2])-10&&v[2]<=Math.max(la[2],lb[2])+10)):[];
  return (x,z,existing)=>{
    const ox=x-a[0],oz=z-a[2],along=ox*tx+oz*tz,lateral=ox*tz-oz*tx;
    const weight=smooth(-5,0,along)*(1-smooth(rearEnd,rearEnd+12,along))
      *smooth(-4,-1,lateral)*(1-smooth(sideEnd,sideEnd+8,lateral));
    const laneAlong=laneLength?(x-la[0])*ltx+(z-la[2])*ltz:0;
    const laneSide=laneLength?Math.abs((x-la[0])*ltz-(z-la[2])*ltx):Infinity;
    const laneWeight=laneAlong>=laneStart&&laneAlong<=laneLength?1-smooth(laneHalf,laneHalf+2,laneSide):0;
    if(!weight&&!laneWeight)return existing;
    // Never replace an authored/mapped stair profile with a courtyard plane.
    for(const path of steps)for(let i=1;i<path.points.length;i++)
      if(segmentDistance(x,z,path.points[i-1],path.points[i])<pathWidth(path.tags)/2+1)return existing;
    const court=existing+(romon.target[1]-existing)*weight;
    if(!laneWeight)return court;
    // Inferred service-corridor grade, not a surveyed road profile. Continue
    // the shared court monotonically to the unchanged DEM endpoint instead
    // of following the artificial court-release crest. Two-metre shoulders
    // release locally; mapped buildings and water retain their prior grade.
    if(laneExclusions.some(p=>inRing(x,z,p.points)))return court;
    const level=romon.target[1]+(laneEnd-romon.target[1])*smooth(laneStart,laneLength,laneAlong);
    return court+(level-court)*laneWeight;
  };
}

// Photo 1/2: grey mineral surfaces around the entry, planting contained by
// walls. This envelope is inferred, not an OSM landuse or surveyed paving map.
// Recolor the existing terrain instead of adding floating, collidable slabs.
export function makeEntranceGroundMask(romon,features){
  const nearby=points=>{
    const xs=points.map(p=>p[0]),zs=points.map(p=>p[2]);
    return Math.min(...xs)<romon.target[0]+150&&Math.max(...xs)>romon.target[0]-150&&
      Math.min(...zs)<romon.target[2]+150&&Math.max(...zs)>romon.target[2]-150;
  };
  const paths=(features.paths??[]).filter(p=>nearby(p.points)),rings=[...(features.buildings??[]),...(features.water??[])].filter(p=>nearby(p.points));
  return (x,z)=>{
    const [lx,lz]=rotateXZ(x-romon.target[0],z-romon.target[2],-romon.yaw);
    const lateral=smooth(25,30,Math.abs(lx))*(1-smooth(61,68,Math.abs(lx)));
    const approach=smooth(-64,-55,lz)*(1-smooth(28,37,lz));
    // Front forecourt ties the existing central gravel to the side aprons.
    const front=(1-smooth(58,66,Math.abs(lx)))*smooth(19,23,lz)*(1-smooth(31,38,lz));
    let weight=Math.max(lateral*approach,front);
    if(!weight)return 0;
    const authoredX=lx+romon.source[0],authoredZ=lz+romon.source[2];
    if(entryWallRuns.some(([a,b])=>authoredX>a-.4&&authoredX<b+.4)&&
      entryGardenTiers.some(t=>authoredZ>t.back-.35&&authoredZ<t.front+.35))return 0;
    for(const ring of rings){
      if(inRing(x,z,ring.points))return 0;
      for(let i=1;i<ring.points.length;i++)weight*=smooth(.25,.8,segmentDistance(x,z,ring.points[i-1],ring.points[i]));
      if(!weight)return 0;
    }
    for(const path of paths){
      const half=pathWidth(path.tags??{})/2;
      for(let i=1;i<path.points.length;i++)weight*=smooth(half+.2,half+1,segmentDistance(x,z,path.points[i-1],path.points[i]));
      if(!weight)return 0;
    }
    return weight;
  };
}

// Call after blendCourtyardGround and before spatialMeshes splits the geometry.
export function blendEntranceGround(geometry,material,gravel,romon,features){
  const mask=makeEntranceGroundMask(romon,features),p=geometry.attributes.position,weights=new Float32Array(p.count),cache=new Map();
  for(let i=0;i<p.count;i++){
    const x=p.getX(i),z=p.getZ(i);
    if(Math.abs(x-romon.target[0])>100||Math.abs(z-romon.target[2])>100)continue;
    const key=`${x},${z}`;
    if(!cache.has(key))cache.set(key,mask(x,z));
    weights[i]=cache.get(key);
  }
  geometry.setAttribute('entranceGround',new p.constructor(weights,1));
  const previous=material.onBeforeCompile,previousKey=material.customProgramCacheKey();
  material.onBeforeCompile=shader=>{
    previous.call(material,shader);
    shader.uniforms.entranceGravel={value:gravel.map};
    shader.vertexShader='attribute float entranceGround;\nvarying float entranceWeight;\nvarying vec2 entranceXZ;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nentranceWeight=entranceGround;entranceXZ=position.xz;');
    shader.fragmentShader='varying float entranceWeight;\nvarying vec2 entranceXZ;\nuniform sampler2D entranceGravel;\n'+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
      vec3 entranceMineral=texture2D(entranceGravel,entranceXZ/1.5).rgb;
      diffuseColor.rgb=mix(diffuseColor.rgb,entranceMineral,entranceWeight);`);
    // Keep the gravel's flatter finish rather than the forest leaf normal.
    shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_maps>','vec3 entranceBaseNormal=normal;\n#include <normal_fragment_maps>\nnormal=normalize(mix(normal,entranceBaseNormal,entranceWeight));');
  };
  material.customProgramCacheKey=()=>`${previousKey}-entrance-mineral-v2`;
  material.needsUpdate=true;
}
