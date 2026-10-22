import * as THREE from 'three';
import {staticParts,stonePalette} from './mountain-landmarks-geometry.mjs';
import {clipMitsuTerrain} from './mitsu-frontage-aprons.mjs';
import {polygonArea} from './entrance-area-surfaces-layout.mjs';

export const SHINSENJO_ID='way/305214596';
export function shinsenjoLayout(features){
  const points=features.buildings?.find(b=>b.id===SHINSENJO_ID)?.points;
  if(!points||points.length!==15||!points.every(p=>p.length>=3&&p.every(Number.isFinite)))return null;
  const ring=points.slice(0,-1).map(p=>[p[0],p[2]]);
  const xs=ring.map(p=>p[0]),zs=ring.map(p=>p[1]);
  if(Math.min(...xs)<60||Math.max(...xs)>93||Math.min(...zs)<21||Math.max(...zs)>44)return null;
  return {id:SHINSENJO_ID,ring,source:'https://plaza.rakuten.co.jp/asobikokoro2/diary/201610080000/',
    accuracy:'Mapped wall ring; roof decomposition, heights and north facade registration estimated from partial 2016 well photograph'};
}

// Horizontal clipping preserves every irregular mapped return. Bands split the
// estimated two roof ridges so no triangle interpolates across a ridge/valley.
function clip(poly,z,above){
  const out=[];
  for(let i=0;i<poly.length;i++){
    const a=poly[i],b=poly[(i+1)%poly.length],ina=above?a[1]>=z:a[1]<=z,inb=above?b[1]>=z:b[1]<=z;
    if(ina)out.push(a);
    if(ina!==inb){const t=(z-a[1])/(b[1]-a[1]);out.push([a[0]+t*(b[0]-a[0]),z]);}
  }
  return out;
}

export function buildShinsenjoPrecinct(root,materials,features,surfaces,colliders,options={}){
  const name='Shinsenjo precinct R93',existing=root.getObjectByName(name);if(existing)return existing.userData;
  const plan=shinsenjoLayout(features);if(!plan)return {built:false,builtIds:[],reason:'unrecognized-footprint'};
  const floor=surfaces.height(65.326,20.483);
  if(!Number.isFinite(floor))return {built:false,builtIds:[],reason:'invalid-floor'};
  const xs=plan.ring.map(p=>p[0]),zs=plan.ring.map(p=>p[1]),bounds=[Math.min(...xs),Math.max(...xs),Math.min(...zs),Math.max(...zs)];
  let bottom=floor-.12;
  // Conservative hidden foundation reaches the actual rendered triangles.
  const positions=options.terrainPositions;
  if(positions)for(let i=0;i<positions.length;i+=9){const t=[];for(let j=0;j<3;j++)t.push([positions[i+j*3],positions[i+j*3+1],positions[i+j*3+2]]);if(Math.max(...t.map(p=>p[0]))<bounds[0]||Math.min(...t.map(p=>p[0]))>bounds[1]||Math.max(...t.map(p=>p[2]))<bounds[2]||Math.min(...t.map(p=>p[2]))>bounds[3])continue;bottom=Math.min(bottom,...t.map(p=>p[1]-.04));}
  const g=new THREE.Group();g.name=name;g.position.y=floor;
  const p=stonePalette(materials),parts=staticParts(g),roof=new THREE.MeshStandardMaterial({color:'#66685e',roughness:.96,side:THREE.DoubleSide});
  const roofY=z=>z<32.7?5.65-.23*Math.abs(z-27.35):5.55-.23*Math.abs(z-37.6);
  const faces=THREE.ShapeUtils.triangulateShape(plan.ring.map(q=>new THREE.Vector2(...q)),[]);
  const outward=vertices=>polygonArea(plan.ring)>0?vertices.slice(0,3).concat(vertices.slice(6,9),vertices.slice(3,6),vertices.slice(9,12),vertices.slice(15,18),vertices.slice(12,15)):vertices;
  for(const f of faces)parts.sheet([...f].reverse().flatMap(i=>[plan.ring[i][0],.27,plan.ring[i][1]]),p.shaded);
  for(let i=0;i<plan.ring.length;i++){
    const a=plan.ring[i],b=plan.ring[(i+1)%plan.ring.length],len=Math.hypot(b[0]-a[0],b[1]-a[1]),yaw=-Math.atan2(b[1]-a[1],b[0]-a[0]);
    const edge=(lo,hi,mat)=>parts.sheet(outward([a[0],lo,a[1],b[0],lo,b[1],a[0],hi,a[1],a[0],hi,a[1],b[0],lo,b[1],b[0],hi,b[1]]),mat);
    edge(bottom-floor,.27,p.shaded);edge(.27,4.25,p.paper);edge(.38,.65,p.wood);edge(3.55,3.75,p.wood);
    // Plaster wall below roof is closed: this service building adds no entrance.
    const splits=[0,1];if(a[1]!==b[1])for(const z of [27.35,32.7,37.6]){const t=(z-a[1])/(b[1]-a[1]);if(t>0&&t<1)splits.push(t);}splits.sort((a,b)=>a-b);
    for(let k=1;k<splits.length;k++){
      const point=t=>[a[0]+t*(b[0]-a[0]),a[1]+t*(b[1]-a[1])],u=point(splits[k-1]),v=point(splits[k]);
      parts.sheet([u[0],4.25,u[1],v[0],4.25,v[1],u[0],roofY(u[1]),u[1],u[0],roofY(u[1]),u[1],v[0],4.25,v[1],v[0],roofY(v[1]),v[1]],p.paper);
    }
    const bays=Math.ceil(len/2.5);for(let j=0;j<bays;j++){const t=j/bays;parts.box(.13,3.98,.13,a[0]+t*(b[0]-a[0]),2.26,a[1]+t*(b[1]-a[1]),p.wood);}
    colliders.push({type:'box',args:[(a[0]+b[0])/2,(a[1]+b[1])/2,len/2,.16,yaw,bottom,floor+4.3,'shinsenjo-wall']});
  }
  const levels=[bounds[2],27.35,32.7,37.6,bounds[3]];
  for(let i=1;i<levels.length;i++){
    const poly=clip(clip(plan.ring,levels[i-1],true),levels[i],false);if(poly.length<3)continue;
    const tris=THREE.ShapeUtils.triangulateShape(poly.map(q=>new THREE.Vector2(...q)),[]);
    for(const f of tris)parts.sheet(f.flatMap(j=>[poly[j][0],roofY(poly[j][1])+.07,poly[j][1]]),roof);
  }
  const stats=parts.flush();root.add(g);g.userData={built:true,...plan,floor,foundationBottom:bottom,...stats,builtIds:[SHINSENJO_ID],
    // The building floor owns only its mapped interior. Retained terrain stays
    // on its original triangle planes; no flattening, collar or public grading.
    clipTerrain:positions=>{
      if(positions.length%9||!positions.every(Number.isFinite))throw Error('Shinsenjo terrain requires finite triangle positions');
      return clipMitsuTerrain(positions,faces.map(f=>f.map(i=>plan.ring[i])));
    }};return g.userData;
}
