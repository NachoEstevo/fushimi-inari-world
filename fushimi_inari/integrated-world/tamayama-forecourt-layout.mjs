import {TAMAYAMA_LAYOUT as L,tamayamaLocalSolids} from './tamayama-compound-layout.mjs';
import {subtractConvex,polygonArea} from './entrance-area-surfaces-layout.mjs';

// IMG6591 and Commons1728 show gravel between the lantern bases and paving.
// Margins are photo-inferred, not new surveyed platform dimensions.
// June 2012 Street View (outputs/r76/tamayama-streetview.png) also shows
// mineral ground continuing in front of the apron around the crossing paving.
// Reserve only a 2 m front strip, an inferred conservative extent rather than
// the occluded whole court. Keep the visible fence as the rear boundary and
// the existing lantern-derived lateral extent; mapped paving is cut below.
export function tamayamaForecourtPlan(matrix,obstacles=[]){
  const world=([x,z])=>[matrix[0]*x+matrix[8]*z+matrix[12],matrix[2]*x+matrix[10]*z+matrix[14]];
  const bases=tamayamaLocalSolids().filter(s=>s.id.includes('base-'));
  const extent=Math.max(...bases.map(s=>Math.abs(s.center[0])+s.half[0]))+.35;
  const back=L.fence.z+.09,frontMargin=2,front=L.apron.center[2]+L.apron.depth/2+frontMargin;
  const rectangle=(x0,x1,z0,z1)=>[[x0,z0],[x1,z0],[x1,z1],[x0,z1]].map(world);
  const envelope=rectangle(-extent,extent,back,front);
  const apron=rectangle(-L.apron.width/2,L.apron.width/2,-L.apron.depth/2,L.apron.depth/2);
  const cuts=[apron,...bases.map(s=>rectangle(s.center[0]-s.half[0],s.center[0]+s.half[0],s.center[1]-s.half[1],s.center[1]+s.half[1])),...obstacles];
  let polygons=[envelope];
  for(const cut of cuts)polygons=polygons.flatMap(p=>subtractConvex(p,cut));
  polygons=polygons.filter(p=>Math.abs(polygonArea(p))>1e-8);
  return {polygons,envelope,estimatedMargin:.35,estimatedFrontMargin:frontMargin,
    area:polygons.reduce((s,p)=>s+Math.abs(polygonArea(p)),0)};
}

// June2012 south180/west270 show continuous mineral court around the right-
// turn access and its large torii. This is a bounded photographic width, not
// a mapped lawn conversion or a new level floor. Stop at the source junctions.
export function tamayamaContinuationCourtPlan(features,obstacles=[]){
  const ids=['way/1133055117','way/297888105','way/1133055118'];
  const paths=ids.map(id=>features.paths.find(p=>p.id===id));
  if(paths.some(p=>!p||p.points.length<2))return {polygons:[],envelope:[],area:0,sourceIds:[]};
  const points=[];
  for(const [index,path]of paths.entries()){
    const ring=path.points.map(p=>[p[0],p[2]]);
    if(index&&Math.hypot(ring[0][0]-points.at(-1)[0],ring[0][1]-points.at(-1)[1])>.02)return {polygons:[],envelope:[],area:0,sourceIds:[]};
    points.push(...(index?ring.slice(1):ring));
  }
  const half=3.2,left=[],right=[];
  for(let i=0;i<points.length;i++){
    const a=points[Math.max(0,i-1)],b=points[Math.min(points.length-1,i+1)],dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz);if(len<.001)return {polygons:[],envelope:[],area:0,sourceIds:[]};
    left.push([points[i][0]-dz/len*half,points[i][1]+dx/len*half]);right.push([points[i][0]+dz/len*half,points[i][1]-dx/len*half]);
  }
  const envelope=[...left,...[...right].reverse()];
  let polygons=points.slice(1).map((_,i)=>[left[i],left[i+1],right[i+1],right[i]]);
  for(const cut of obstacles)polygons=polygons.flatMap(p=>subtractConvex(p,cut));
  polygons=polygons.filter(p=>Math.abs(polygonArea(p))>1e-8);
  return {polygons,envelope,sourceIds:ids,estimatedWidth:half*2,area:polygons.reduce((s,p)=>s+Math.abs(polygonArea(p)),0)};
}
