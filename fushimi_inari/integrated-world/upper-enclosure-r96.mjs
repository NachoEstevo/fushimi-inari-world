import * as THREE from 'three';
import {createStartupCheckpoint,yieldStartupTask} from './startup-work.mjs';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {makeShoulderTriangleHeight} from './omotesando-shoulders-layout.mjs';
import {subtractConvex,polygonArea} from './entrance-area-surfaces-layout.mjs';
import {pathWidth} from '../geography/geo-core.mjs';
const NAME='Byakkosha wooded boundary open returns R96';
export function upperEnclosureR96Runs(features){
 const b=features.buildings.find(b=>b.id==='way/301527731');if(!b)return [];
 const x0=Math.min(...b.points.map(p=>p[0])),x1=Math.max(...b.points.map(p=>p[0])),z0=Math.min(...b.points.map(p=>p[2])),z1=Math.max(...b.points.map(p=>p[2]));
 const west=x0-4.4,east=x1+1.8,north=z0-1.65;
 // U fragment around Byakkosha's woodland edges. Entire southern forecourt
 // and western stair-to-shrine mouth remain open; no perimeter around Okumiya.
 return [{id:'north-woodland',a:[west,north],b:[east,north]},{id:'rear-east',a:[east,north],b:[east,z1+3.9]},{id:'west-shoulder',a:[west,north],b:[west,z0+2.7]}];
}
export function buildUpperEnclosureR96(root,features,network,materials,colliders,options={}){
 const work=upperEnclosureWork(root,features,network,materials,colliders,options);let step=work.next();while(!step.done)step=work.next();return step.value;
}
export async function buildUpperEnclosureR96Async(root,features,network,materials,colliders,options={}){
 const checkpoint=createStartupCheckpoint({yieldWork:options.yieldWork??yieldStartupTask,clock:options.clock}),work=upperEnclosureWork(root,features,network,materials,colliders,options);let step=work.next();
 while(!step.done){const pause=checkpoint();if(pause)await pause;step=work.next();}return step.value;
}
function* upperEnclosureWork(root,features,network,materials,colliders,options){
 const old=root.getObjectByName(NAME);if(old)return old.userData;
 const stone=materials.stoneMat??materials.entryStoneMat,red=materials.vermilionMat,cap=materials.copperRoofMat??materials.roofMat??stone;
 if(!stone||!red||!options.terrainPositions?.length)return {built:false,reason:'Existing stone/red materials and rendered terrain required'};
 const terrain=[];const p=options.terrainPositions;
 for(let i=0;i<p.length;i+=9){if(i%2304===0)yield;if(Math.max(p[i],p[i+3],p[i+6])>115&&Math.min(p[i],p[i+3],p[i+6])<131&&Math.max(p[i+2],p[i+5],p[i+8])> -33&&Math.min(p[i+2],p[i+5],p[i+8])< -20)for(let j=0;j<9;j++)terrain.push(p[i+j]);}
 const sample=makeShoulderTriangleHeight(terrain),runs=upperEnclosureR96Runs(features),cuts=[];
 for(const s of network.segments??features.paths.flatMap(p=>p.points.slice(1).map((b,i)=>({a:p.points[i],b,width:pathWidth(p.tags??{})})))){
  const dx=s.b[0]-s.a[0],dz=s.b[2]-s.a[2],len=Math.hypot(dx,dz);if(!len)continue;const nx=-dz/len,nz=dx/len,w=s.width/2+.3;
  cuts.push([[s.a[0]+nx*w,s.a[2]+nz*w],[s.b[0]+nx*w,s.b[2]+nz*w],[s.b[0]-nx*w,s.b[2]-nz*w],[s.a[0]-nx*w,s.a[2]-nz*w]]);
  const tri=s.accessJunctionTriangles??[];for(let j=0;j<tri.length;j+=9)cuts.push([[tri[j],tri[j+2]],[tri[j+3],tri[j+5]],[tri[j+6],tri[j+8]]]);
 }
 const bounds=p=>{let minX=Infinity,maxX=-Infinity,minZ=Infinity,maxZ=-Infinity;for(const q of p){minX=Math.min(minX,q[0]);maxX=Math.max(maxX,q[0]);minZ=Math.min(minZ,q[1]);maxZ=Math.max(maxZ,q[1]);}return [minX,maxX,minZ,maxZ];};
 const indexedCuts=cuts.map(polygon=>({polygon,bounds:bounds(polygon)}));
 const roofs=features.buildings.map(b=>[Math.min(...b.points.map(q=>q[0]))-1.25,Math.max(...b.points.map(q=>q[0]))+1.25,Math.min(...b.points.map(q=>q[2]))-1.25,Math.max(...b.points.map(q=>q[2]))+1.25]);
 const batches=new Map(),sections=[],skipped=[],pending=[];
 const add=(g,m)=>{if(!batches.has(m))batches.set(m,[]);batches.get(m).push(g);};
 const box=(s,m,w,h,d,y,u=0)=>add(new THREE.BoxGeometry(w,h,d).rotateY(s.yaw).translate(s.x+Math.cos(s.yaw)*u,y,s.z-Math.sin(s.yaw)*u),m);
 for(const run of runs){const dx=run.b[0]-run.a[0],dz=run.b[1]-run.a[1],len=Math.hypot(dx,dz),n=Math.ceil(len/.75),span=len/n,ux=dx/len,uz=dz/len;
  for(let i=0;i<n;i++){
   yield;
   const x=run.a[0]+dx*(i+.5)/n,z=run.a[1]+dz*(i+.5)/n,yaw=-Math.atan2(dz,dx),footprint=[[-1,-1],[1,-1],[1,1],[-1,1]].map(([a,b])=>[x+ux*(span+.012)/2*a-uz*.22*b,z+uz*(span+.012)/2*a+ux*.22*b]);
   const area=Math.abs(polygonArea(footprint)),region=bounds(footprint);
   if(indexedCuts.some(c=>region[0]<=c.bounds[1]&&region[1]>=c.bounds[0]&&region[2]<=c.bounds[3]&&region[3]>=c.bounds[2]&&area-subtractConvex(footprint,c.polygon).reduce((s,p)=>s+Math.abs(polygonArea(p)),0)>1e-7)||footprint.some(([x,z])=>roofs.some(b=>x>b[0]&&x<b[1]&&z>b[2]&&z<b[3]))){skipped.push({run:run.id,index:i,reason:'Public route/junction or roof'});continue;}
   if(colliders.some(c=>{const a=c.args,r=Math.hypot((span+.012)/2,.22);if(c.type==='cylinder')return Math.hypot(x-a[0],z-a[1])<a[2]+r+.05;if(c.type!=='box')return false;const dx=x-a[0],dz=z-a[1],q=a[4]??0;return Math.abs(dx*Math.cos(q)-dz*Math.sin(q))<a[2]+r+.05&&Math.abs(dx*Math.sin(q)+dz*Math.cos(q))<a[3]+r+.05;})){skipped.push({run:run.id,index:i,reason:'Prior solid owner'});continue;}
   const support=footprint.map(p=>sample(...p));if(!support.every(Number.isFinite)){skipped.push({run:run.id,index:i,reason:'Missing rendered support'});continue;}
   const base=Math.max(...support),bottom=Math.min(...support)-.08,s={id:run.id,index:i,x,z,yaw,span,footprint,support,base,bottom};
   box(s,stone,span,base+.22-bottom,.36,(base+.22+bottom)/2);
   for(const y of [.37,1.20])box(s,red,span,.09,.16,base+y);
   const slats=Math.ceil(span/.145);for(let j=0;j<slats;j++)box(s,red,.062,1.05,.105,base+.785,(j+.5)*span/slats-span/2);
   box(s,cap,span+.012,.10,.36,base+1.375);
   sections.push(s);pending.push({type:'box',args:[x,z,(span+.012)/2,.22,yaw,bottom,base+1.425,'upper_enclosure_r96_'+run.id]});
  }
 }
 const group=new THREE.Group();group.name=NAME;let triangles=0;
 for(const [m,parts]of batches){const g=mergeGeometries(parts);parts.forEach(g=>g.dispose());g.computeBoundingSphere();const mesh=new THREE.Mesh(g,m);mesh.castShadow=mesh.receiveShadow=true;triangles+=(g.index?.count??g.attributes.position.count)/3;group.add(mesh);}
 group.userData={built:sections.length>0,runs,sections,skipped,triangles,drawBatches:group.children.length,newColliders:pending.length,source:'June 2012 front/side landing Street View: red slat wooded boundary behind and north of Byakkosha; 2021 IMG_6630_20210309 rear Okumiya photo rules out enclosing main shrine rear',limits:'Topology source-backed; mapped Byakkosha bounds anchor inferred offsets, endpoints, 1.425m height and slat spacing. Native source-camera registration pending. No south forecourt crossbar or main Okumiya perimeter.'};
 if(group.userData.built){root.add(group);colliders.push(...pending);}return group.userData;
}
