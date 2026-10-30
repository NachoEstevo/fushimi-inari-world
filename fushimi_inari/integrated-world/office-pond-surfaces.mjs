import {createWaterAppearance} from './water-appearance.mjs';
import * as THREE from 'three';
import {createStartupCheckpoint,yieldStartupTask} from './startup-work.mjs';
import {clipConvex,subtractConvex,polygonArea} from './entrance-area-surfaces-layout.mjs';

export const officePondSurfaceIds=Object.freeze(['way/626313848','way/626313851']);
const NAME='Mapped horizontal office ponds R85';
const bounds=p=>[Math.min(...p.map(v=>v[0])),Math.max(...p.map(v=>v[0])),Math.min(...p.map(v=>v[1])),Math.max(...p.map(v=>v[1]))];
const overlaps=(a,b)=>a[0]<=b[1]&&a[1]>=b[0]&&a[2]<=b[3]&&a[3]>=b[2];
function edgeDistance(p,a,b){const dx=b[0]-a[0],dz=b[1]-a[1],t=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dz)/(dx*dx+dz*dz)));return Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dz);}
function geometry(positions,uv=[]){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.computeVertexNormals();return g;}

// No terrain/walking sampler changes. clipTerrain replaces only rendered
// triangles inside these two mapped polygons and seats liners on their exact
// retained terrain edges, so a coarse DEM cannot poke through the water.
export function buildOfficePondSurfaces(root,features,network,materials={}){
 const existing=root.getObjectByName(NAME);if(existing)return existing.userData;
 const plans=[];
 for(const id of officePondSurfaceIds){
  const source=features.water?.find(w=>w.id===id);if(!source)continue;
  const ring=source.points.filter((p,i,a)=>i===0||p[0]!==a[0][0]||p[2]!==a[0][2]).map(p=>[p[0],p[2]]);
  if(ring.length<3||ring.some(p=>!p.every(Number.isFinite)))continue;
  const samples=[];for(let i=0;i<ring.length;i++){const a=ring[i],b=ring[(i+1)%ring.length],steps=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/.5);for(let j=0;j<=steps;j++){const t=j/steps;samples.push(network.terrainHeight(a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t)-.06);}}
  if(!samples.every(Number.isFinite))continue;
  const contour=ring.map(p=>new THREE.Vector2(...p)),triangles=THREE.ShapeUtils.triangulateShape(contour,[]).map(t=>t.map(i=>ring[i]));
  plans.push({id,ring,triangles,cuts:triangles.map(p=>({ring:p,bounds:bounds(p)})),bounds:bounds(ring),waterLevel:Math.min(...samples)-.04});
 }
 const group=new THREE.Group();group.name=NAME;
 const waterMaterial=createWaterAppearance({kind:'pond'});
 const basinMaterial=materials.stoneMat?.clone()??new THREE.MeshStandardMaterial({color:'#737267',roughness:.98});basinMaterial.side=THREE.DoubleSide;
 const water=new THREE.Mesh(geometry([]),waterMaterial),basin=new THREE.Mesh(geometry([]),basinMaterial);water.name='Office pond level water';basin.name='Office pond basin and shoreline liner';water.receiveShadow=basin.receiveShadow=true;basin.castShadow=true;group.add(water,basin);
 const record={builtIds:plans.map(p=>p.id),ponds:plans.map(p=>({id:p.id,ring:p.ring,waterLevel:p.waterLevel,bedLevel:p.waterLevel-.35})),materialBatches:2,linerFinish:materials.stoneMat?'Existing stone material clone with metre-scale wall UVs':'Neutral stone fallback',terrainOffset:-.06,walkingUnchanged:true,shorelineSegments:0,
  provenance:'Exact mapped office pond polygons; horizontal water and bounded basin are inferred from Obayashi and Kyoto-GA garden photographs, not measured depths or surveyed water levels.',
  limits:'Levels conservatively below lowest rendered shoreline. Outside terrain, bank meshes, paths and building grades unchanged. No islands or public pond walking surface introduced.'};
 let shoreline=[];
 function rebuild(){
  const waterPositions=[],basinPositions=[],waterUV=[],basinUV=[];
  for(const p of plans){const data=record.ponds.find(r=>r.id===p.id);for(const source of p.triangles){const triangle=polygonArea(source)>0?[source[0],source[2],source[1]]:source;for(const [x,z]of triangle){waterPositions.push(x,data.waterLevel,z);basinPositions.push(x,data.bedLevel,z);waterUV.push(x,z);basinUV.push(x,z);}}}
  for(const edge of shoreline){const bed=record.ponds.find(p=>p.id===edge.id).bedLevel,a=edge.a,b=edge.b,length=Math.hypot(b[0]-a[0],b[2]-a[2]),ux=(b[0]-a[0])/length,uz=(b[2]-a[2])/length,u=a[0]*ux+a[2]*uz;for(const p of [a,[a[0],bed,a[2]],b,b,[a[0],bed,a[2]],[b[0],bed,b[2]]])basinPositions.push(...p);basinUV.push(u,a[1]-bed,u,0,u+length,b[1]-bed,u+length,b[1]-bed,u,0,u+length,0);}
  water.geometry.dispose();water.geometry=geometry(waterPositions,waterUV);basin.geometry.dispose();basin.geometry=geometry(basinPositions,basinUV);
 }
 function* clipTerrainWork(vertices){
  if(vertices.length%9||!vertices.every(Number.isFinite))throw Error('Office pond terrain requires finite triangle positions');
  if(!plans.length)return Array.from(vertices);
  const output=[],edges=new Map();
  const whole=[Math.min(...plans.map(p=>p.bounds[0])),Math.max(...plans.map(p=>p.bounds[1])),Math.min(...plans.map(p=>p.bounds[2])),Math.max(...plans.map(p=>p.bounds[3]))];
  for(let i=0;i<vertices.length;i+=9){
   if(i%2304===0)yield;
   const region=[Math.min(vertices[i],vertices[i+3],vertices[i+6]),Math.max(vertices[i],vertices[i+3],vertices[i+6]),Math.min(vertices[i+2],vertices[i+5],vertices[i+8]),Math.max(vertices[i+2],vertices[i+5],vertices[i+8])];
   if(!overlaps(region,whole)){for(let j=0;j<9;j++)output.push(vertices[i+j]);continue;}
   const near=plans.filter(p=>overlaps(region,p.bounds));if(!near.length){for(let j=0;j<9;j++)output.push(vertices[i+j]);continue;}
   const xyz=[0,1,2].map(k=>Array.from(vertices.slice(i+k*3,i+k*3+3))),tri=xyz.map(p=>[p[0],p[2]]);
   const [a,b,c]=xyz,det=(b[0]-a[0])*(c[2]-a[2])-(b[2]-a[2])*(c[0]-a[0]);if(Math.abs(det)<1e-12){output.push(...vertices.slice(i,i+9));continue;}
   const height=(x,z)=>{const u=((x-a[0])*(c[2]-a[2])-(z-a[2])*(c[0]-a[0]))/det,v=((b[0]-a[0])*(z-a[2])-(b[2]-a[2])*(x-a[0]))/det;return a[1]+u*(b[1]-a[1])+v*(c[1]-a[1]);};
   let pieces=[tri];for(const p of near)for(const cut of p.cuts){if(!overlaps(region,cut.bounds))continue;pieces=pieces.flatMap(poly=>Math.abs(polygonArea(clipConvex(poly,cut.ring)))>1e-9?subtractConvex(poly,cut.ring):[poly]);}
   for(let polygon of pieces){
    if(polygonArea(polygon)>0)polygon=polygon.toReversed();
    for(let k=1;k<polygon.length-1;k++){const face=[polygon[0],polygon[k],polygon[k+1]];if(Math.abs(polygonArea(face))<1e-9)continue;for(const [x,z]of face)output.push(x,height(x,z),z);}
    for(let k=0;k<polygon.length;k++){
     const x=polygon[k],z=polygon[(k+1)%polygon.length];if(Math.hypot(x[0]-z[0],x[1]-z[1])<1e-6)continue;
     for(const p of near){if(!p.ring.some((a,j)=>edgeDistance(x,a,p.ring[(j+1)%p.ring.length])<1e-5&&edgeDistance(z,a,p.ring[(j+1)%p.ring.length])<1e-5))continue;
      const key=p.id+':'+[x.map(n=>n.toFixed(5)).join(','),z.map(n=>n.toFixed(5)).join(',')].sort().join('|');edges.set(key,{id:p.id,a:[x[0],height(...x),x[1]],b:[z[0],height(...z),z[1]]});
     }
    }
   }
  }
  shoreline=[...edges.values()];record.shorelineSegments=shoreline.length;
  for(const p of record.ponds){const levels=shoreline.filter(e=>e.id===p.id).flatMap(e=>[e.a[1],e.b[1]]);if(levels.length){p.waterLevel=Math.min(p.waterLevel,Math.min(...levels)-.04);p.minRenderedRim=Math.min(...levels);p.maxRenderedRim=Math.max(...levels);p.maxExposedLinerHeight=p.maxRenderedRim-p.waterLevel;}p.bedLevel=p.waterLevel-.35;}
  rebuild();return output;
 }
 record.clipTerrain=vertices=>{
  const work=clipTerrainWork(vertices);let step=work.next();while(!step.done)step=work.next();return step.value;
 };
 record.clipTerrainAsync=async(vertices,{yieldWork=yieldStartupTask,clock}={})=>{
  const checkpoint=createStartupCheckpoint({yieldWork,clock}),work=clipTerrainWork(vertices);let step=work.next();
  while(!step.done){const pause=checkpoint();if(pause)await pause;step=work.next();}return step.value;
 };
 rebuild();group.userData=record;if(plans.length)root.add(group);else{water.geometry.dispose();basin.geometry.dispose();waterMaterial.dispose();basinMaterial.dispose();}return record;
}
