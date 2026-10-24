import * as THREE from 'three';
import {yotsuForecourt} from './site-grading.mjs';
import {yotsutsujiWestStairCutout,yotsutsujiCourtEdgeIntervals} from './yotsutsuji-court-clearance.mjs';

const NAME='Yotsutsuji existing court and tread underside R95';
const stairIds=new Set(['way/1372826379','way/1052553392']);
// Structural closure of existing surfaces only. No floor, tread, walking
// height, footprint, collision or terrain is introduced or moved here.
export function buildYotsutsujiSupportsR95(root,network,ground,stone){
 const existing=root.getObjectByName(NAME);if(existing)return existing.userData;
 const vertices=[],uv=[],cutout=yotsutsujiWestStairCutout(network);let courtPanels=0,treadBodies=0;
 const quad=(a,b,c,d)=>{for(const p of [a,b,c,a,c,d]){vertices.push(...p);uv.push((Math.abs(a[0]-b[0])>Math.abs(a[2]-b[2])?p[0]:p[2])/1.4,p[1]/1.4);}};
 for(let i=0;i<yotsuForecourt.length;i++){
  const a=yotsuForecourt[i],b=yotsuForecourt[(i+1)%yotsuForecourt.length],ay=ground(...a)+.10,by=ground(...b)+.10;
  if(!Number.isFinite(ay)||!Number.isFinite(by))return {built:false,reason:'Invalid court support terrain'};
  const n=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/.40);
  for(const [lo,hi]of yotsutsujiCourtEdgeIntervals(a,b,cutout))for(let j=0;j<n;j++){
   const point=t=>[a[0]+(b[0]-a[0])*t,ay+(by-ay)*t,a[1]+(b[1]-a[1])*t];
   const p=point(lo+(hi-lo)*j/n),q=point(lo+(hi-lo)*(j+1)/n),py=ground(p[0],p[2])-.22,qy=ground(q[0],q[2])-.22;
   if(!Number.isFinite(py)||!Number.isFinite(qy))return {built:false,reason:'Invalid court support terrain'};
   quad(p,q,[q[0],Math.min(q[1]-.02,qy),q[2]],[p[0],Math.min(p[1]-.02,py),p[2]]);courtPanels++;
  }
 }
 for(const s of network.segments??[]){
  if(!s.stair||!stairIds.has(s.id)||[s.a,s.b].some(p=>p[0]<800||p[0]>814||p[2]<-216||p[2]>-202))continue;
  const dx=s.b[0]-s.a[0],dz=s.b[2]-s.a[2],length=Math.hypot(dx,dz);
  if(!length||![s.ya,s.yb,s.width].every(Number.isFinite))return {built:false,reason:'Invalid source tread'};
  // Beneath the actual tread, just inside the curb skin. End closure reaches
  // tread ends rather than leaving slots between disconnected step skins.
  const nx=-dz/length,nz=dx/length,w=s.width/2-.018;
  if(w<=0)return {built:false,reason:'Invalid source tread width'};
  const tops=[[-1,s.a,s.ya],[-1,s.b,s.yb],[1,s.b,s.yb],[1,s.a,s.ya]].map(([side,p,y])=>[p[0]+nx*w*side,y-.002,p[2]+nz*w*side]);
  const bottoms=tops.map(p=>[p[0],Math.min(p[1]-.05,ground(p[0],p[2])-.28),p[2]]);
  if(bottoms.some(p=>!Number.isFinite(p[1])))return {built:false,reason:'Invalid tread support terrain'};
  for(let i=0;i<4;i++){const j=(i+1)%4;quad(tops[i],tops[j],bottoms[j],bottoms[i]);}
  // No top face: the existing path renderer remains its only surface owner.
  treadBodies++;
 }
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.computeVertexNormals();
 const mat=stone.clone();mat.side=THREE.DoubleSide;
 const mesh=new THREE.Mesh(geo,mat);mesh.name=NAME;mesh.receiveShadow=mesh.castShadow=true;
 mesh.userData={built:true,courtPanels,treadBodies,triangles:vertices.length/9,drawBatches:1,terrainChanged:false,collidersAdded:0,
  provenance:'Closure under existing yotsuForecourt edge and registered path1372826379/1052553392 tread skins. Exact tops inherited; exposed toe profiles inferred from current ground, not surveyed masonry.'};
 root.add(mesh);return mesh.userData;
}
