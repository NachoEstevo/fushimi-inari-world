import * as THREE from 'three';
import {staticParts} from './mountain-landmarks-geometry.mjs';
import {makeShoulderTriangleHeight} from './omotesando-shoulders-layout.mjs';

export const okushaNorthFenceR103=Object.freeze({id:'way/1267860090',height:1,
  nodes:Object.freeze([11775032017,11775032016,11775032015,11775032014,11775032013]),
  points:Object.freeze([[261.703963542,60.580066890],[265.325563986,60.713650279],[274.621309206,60.257240367],[276.226854995,64.487381016],[276.965770955,64.353797627]].map(Object.freeze)),
  source:'https://api.openstreetmap.org/api/0.6/way/1267860090/full.json',
  photo:'https://image.space.rakuten.co.jp/d/strg/ctrl/9/642ccdca653a77e5b98dccdfb6dea9dae5b2cfff.77.2.9.2.jpeg'});
const distance=(x,z,a,b)=>{const dx=b[0]-a[0],dz=b[2]-a[2],t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[2])*dz)/(dx*dx+dz*dz||1)));return Math.hypot(x-a[0]-t*dx,z-a[2]-t*dz);};

/** North open chain only; after existing court/R96, before static batching.
 * Terrain is the actual rendered triangle array, not interpolated DEM heights.
 * walkHeight may raise the visible fence datum to the existing paved court;
 * lower wood always penetrates actual terrain, avoiding unsupported tips.
 */
export function buildOkushaNorthBoundaryR103(root,features,materials,colliders,{terrainPositions,walkHeight}={}){
  if(root.children.some(o=>o.userData.okushaNorthBoundaryR103))return null;
  if(!root.children.some(o=>o.userData.restBoundaryR96)||!terrainPositions?.length||terrainPositions.length%9||!Array.isArray(colliders)||!materials.vermilionMat)return null;
  const nearby=[];
  for(let i=0;i<terrainPositions.length;i+=9){
    const t=Array.from(terrainPositions.slice(i,i+9));
    if(!t.every(Number.isFinite)||Math.max(t[0],t[3],t[6])<261||Math.min(t[0],t[3],t[6])>278||Math.max(t[2],t[5],t[8])<59||Math.min(t[2],t[5],t[8])>65)continue;
    nearby.push(...t);
  }
  const terrain=makeShoulderTriangleHeight(nearby),routes=[];
  for(const path of features.paths??[])for(let i=1;i<path.points.length;i++){
    const a=path.points[i-1],b=path.points[i];
    if(Math.min(a[0],b[0])>279||Math.max(a[0],b[0])<260||Math.min(a[2],b[2])>67||Math.max(a[2],b[2])<58)continue;
    routes.push({a,b,width:parseFloat(path.tags?.width)||2,id:path.id});
  }
  const segments=[],posts=[],source=okushaNorthFenceR103.points;
  let total=0,minMargin=Infinity;
  const sample=(x,z)=>{
    const ground=terrain(x,z),walk=typeof walkHeight==='function'?walkHeight(x,z):ground;
    if(!Number.isFinite(ground)||!Number.isFinite(walk)||walk<ground-.10||walk>ground+.40)return null;
    for(const route of routes){const margin=distance(x,z,route.a,route.b)-route.width/2;minMargin=Math.min(minMargin,margin);if(margin<.07)return null;}
    return {x,z,ground,datum:Math.max(ground,walk),bottom:ground-.025};
  };
  const footBottom=(x,z,hw,hd,yaw)=>{
    const c=Math.cos(yaw),s=Math.sin(yaw),ys=[terrain(x,z)];
    for(const u of [-hw,hw])for(const v of [-hd,hd])ys.push(terrain(x+c*u+s*v,z-s*u+c*v));
    return ys.every(Number.isFinite)?Math.min(...ys)-.025:null;
  };
  // Sample every slat AND every rail station before allocating geometry.
  for(let i=1;i<source.length;i++){
    const a=source[i-1],b=source[i],length=Math.hypot(b[0]-a[0],b[1]-a[1]),count=Math.ceil(length/.18),stations=[];
    for(let j=0;j<=count;j++){
      const t=j/count,q=sample(a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t);if(!q)return null;
      if(stations.length&&Math.abs(q.datum-stations.at(-1).datum)>.18)return null;stations.push(q);
    }
    const yaw=Math.atan2(b[0]-a[0],b[1]-a[1]),slats=[];
    for(let j=0;j<count;j++){
      const a=stations[j],b=stations[j+1],x=(a.x+b.x)/2,z=(a.z+b.z)/2,bottom=footBottom(x,z,.03,.0415,yaw);
      if(!Number.isFinite(bottom))return null;slats.push({x,z,bottom,top:(a.datum+b.datum)/2+1});
    }
    segments.push({stations,slats,length,count,yaw});total+=length;
    const postCount=Math.ceil(length/1.8);
    for(let j=0;j<postCount;j++){const t=j/postCount,q=sample(a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t);if(!q)return null;posts.push(q);}
  }
  const last=sample(...source.at(-1));if(!last)return null;posts.push(last);
  for(const q of posts){q.bottom=footBottom(q.x,q.z,.06,.06,0);if(!Number.isFinite(q.bottom))return null;}
  const group=new THREE.Group();group.name='Okusha registered north paling boundary R103';
  group.userData={okushaNorthBoundaryR103:true,sourceId:okushaNorthFenceR103.id,source:okushaNorthFenceR103.source,photo:okushaNorthFenceR103.photo,
    provenance:'Mapped open chain, red timber paling and 1m height; pitch/sections inferred. Actual triangle-embedded lower wood; no invented retaining wall or perimeter closure.'};
  const p=staticParts(group),red=materials.vermilionMat,pending=[];
  for(const s of segments){
    for(let j=0;j<s.count;j++){
      const a=s.stations[j],b=s.stations[j+1],{x,z,bottom,top}=s.slats[j];
      p.put(new THREE.BoxGeometry(.06,top-bottom,.083).rotateY(s.yaw).translate(x,(bottom+top)/2,z),red);
      // Disjoint rail segments follow supported stations instead of bridging
      // an average height across a slope. Small overlaps meet at each station.
      for(const h of [.18,.82])p.beam([a.x,a.datum+h,a.z],[b.x,b.datum+h,b.z],.033,red,.033,4);
    }
    const a=s.stations[0],b=s.stations.at(-1);
    pending.push({type:'box',args:[(a.x+b.x)/2,(a.z+b.z)/2,.055,s.length/2,s.yaw,Math.min(...s.stations.map(q=>q.bottom)),Math.max(...s.stations.map(q=>q.datum))+1,'okusha_north_fence_r103']});
  }
  for(const q of posts){p.box(.12,q.datum+1.07-q.bottom,.12,q.x,(q.bottom+q.datum+1.07)/2,q.z,red);pending.push({type:'cylinder',args:[q.x,q.z,.085,q.bottom,q.datum+1.07,'okusha_north_fence_post_r103']});}
  const stats=p.flush();root.add(group);colliders.push(...pending);
  const report={built:true,sourceId:okushaNorthFenceR103.id,stats,length:total,segments:4,slats:segments.reduce((n,s)=>n+s.count,0),posts:posts.length,minRouteEdgeMargin:minMargin,
    supportRange:[Math.min(...segments.flatMap(s=>s.stations.map(q=>q.ground))),Math.max(...segments.flatMap(s=>s.stations.map(q=>q.datum)))],
    supportAuthority:'Actual rendered terrain triangles; optional existing walk-height datum; every lower envelope penetrates the actual terrain',endpoints:[source[0],source.at(-1)]};
  group.userData.report=report;return {group,...report};
}
