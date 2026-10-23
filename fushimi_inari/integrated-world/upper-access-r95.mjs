import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {makeShoulderTriangleHeight} from './omotesando-shoulders-layout.mjs';
import {leafClusterMaterial} from './leaf-cluster.mjs';
import {pathWidth} from '../geography/geo-core.mjs';

const NAME='Okumiya complete stair edge and wooded south flank R95';
export const upperAccessR95Roots=Object.freeze([[102,-10],[106,-8],[110,-6]].map(Object.freeze));
export function buildUpperAccessR95(root,features,network,materials,colliders,options={}){
 const old=root.getObjectByName(NAME);if(old)return old.userData;
 const flight=(network.segments??[]).filter(s=>s.id==='way/626313768'&&s.stair);
 if(!flight.length||!options.terrainPositions?.length)return {built:false,reason:'Resolved Okumiya stair and rendered terrain required'};
 const stone=materials.stoneMat??materials.entryStoneMat,wood=materials.woodMat??materials.timberMat??materials.roofMat;
 if(!stone||!wood)return {built:false,reason:'Existing stone/timber materials required'};
 const terrain=[];for(let i=0;i<options.terrainPositions.length;i+=9){const p=options.terrainPositions;
  if(Math.max(p[i],p[i+3],p[i+6])<96||Math.min(p[i],p[i+3],p[i+6])>120||Math.max(p[i+2],p[i+5],p[i+8])< -25||Math.min(p[i+2],p[i+5],p[i+8])>0)continue;
  for(let j=0;j<9;j++)terrain.push(p[i+j]);
 }const sample=makeShoulderTriangleHeight(terrain);
 const routes=(network.segments?.length?network.segments:features.paths.flatMap(p=>p.points.slice(1).map((b,i)=>({a:p.points[i],b,width:pathWidth(p.tags??{})})))).filter(s=>Math.max(s.a[0],s.b[0])+s.width>96&&Math.min(s.a[0],s.b[0])-s.width<120&&Math.max(s.a[2],s.b[2])+s.width> -25&&Math.min(s.a[2],s.b[2])-s.width<0);
 const roofs=features.buildings.map(b=>({x0:Math.min(...b.points.map(p=>p[0]))-1.1,x1:Math.max(...b.points.map(p=>p[0]))+1.1,z0:Math.min(...b.points.map(p=>p[2]))-1.1,z1:Math.max(...b.points.map(p=>p[2]))+1.1}));
 const routeClear=(x,z,r)=>!routes.some(s=>{const dx=s.b[0]-s.a[0],dz=s.b[2]-s.a[2],t=Math.max(0,Math.min(1,((x-s.a[0])*dx+(z-s.a[2])*dz)/(dx*dx+dz*dz||1)));return Math.hypot(x-s.a[0]-t*dx,z-s.a[2]-t*dz)<s.width/2+r;});
 const roofClear=(x,z,r)=>!roofs.some(b=>x>b.x0-r&&x<b.x1+r&&z>b.z0-r&&z<b.z1+r);
 const occupied=(x,z,r)=>colliders.some(c=>{const a=c.args;if(c.type==='cylinder')return Math.hypot(x-a[0],z-a[1])<a[2]+r+.08;if(c.type!=='box')return false;const dx=x-a[0],dz=z-a[1],yaw=a[4]??0;return Math.abs(dx*Math.cos(yaw)-dz*Math.sin(yaw))<a[2]+r+.08&&Math.abs(dx*Math.sin(yaw)+dz*Math.cos(yaw))<a[3]+r+.08;});
 const leaf=typeof document!=='undefined'?leafClusterMaterial().clone():new THREE.MeshStandardMaterial({color:'#ffffff',vertexColors:true,side:THREE.DoubleSide,roughness:1});leaf.vertexColors=true;
 const batches=new Map(),pending=[],edges=[],posts=[],rails=[],trees=[],growth=[],skipped=[];
 const add=(g,m)=>{if(g.index){const old=g;g=g.toNonIndexed();old.dispose();}if(!batches.has(m))batches.set(m,[]);batches.get(m).push(g);};
 const box=(w,h,d,x,y,z,m,yaw=0)=>add(new THREE.BoxGeometry(w,h,d).rotateY(yaw).translate(x,y,z),m);
 const beam=(a,b,r,m)=>{const p=new THREE.Vector3(...a),q=new THREE.Vector3(...b),d=q.clone().sub(p);add(new THREE.CylinderGeometry(r*.78,r,d.length(),7).applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize())).translate(...p.add(q).multiplyScalar(.5).toArray()),m);};
 // The flight runs eastward. Its +Z/south flank is the stone-post side
 // visible at 06:15; 06:05 shows a low continuous coping on the north flank.
 const start=flight[0].a,end=flight.at(-1).b,dx=end[0]-start[0],dz=end[2]-start[2],length=Math.hypot(dx,dz),nx=-dz/length,nz=dx/length,yaw=-Math.atan2(dz,dx);
 const at=(t,side)=>[start[0]+dx*t+nx*side*(flight[0].width/2+.36),start[2]+dz*t+nz*side*(flight[0].width/2+.36)];
 const level=t=>{const target=t*length;let along=0;for(const s of flight){const len=Math.hypot(s.b[0]-s.a[0],s.b[2]-s.a[2]);if(along+len>=target-1e-6)return s.yb;along+=len;}return flight.at(-1).yb;};
 for(const side of [-1,1])for(let i=0;i<flight.length;i++){
  const t=(i+.5)/flight.length,[x,z]=at(t,side),span=length/flight.length,half=span/2;
  const corners=[[-half,-.18],[-half,.18],[half,-.18],[half,.18]].map(([u,v])=>[x+u*Math.cos(yaw)+v*Math.sin(yaw),z-u*Math.sin(yaw)+v*Math.cos(yaw)]);
  if(corners.some(p=>!routeClear(...p,.10)||!roofClear(...p,0))||occupied(x,z,Math.max(span/2,.20))){skipped.push({kind:'edge',side,index:i,reason:'Existing route/roof/solid'});continue;}
  const support=corners.map(p=>sample(...p));if(support.some(y=>!Number.isFinite(y))){skipped.push({kind:'edge',side,index:i,reason:'Missing rendered ground'});continue;}
  const top=level(t)+.13,bottom=Math.min(...support)-.09;if(top<=bottom)continue;
  box(span+.012,top-bottom,.36,x,(top+bottom)/2,z,stone,yaw);box(span+.025,.075,.44,x,top+.0375,z,stone,yaw);
  pending.push({type:'box',args:[x,z,(span+.025)/2,.22,yaw,bottom,top+.075,'upper_access_r95_coping']});edges.push({side,index:i,point:[x,z],support,bottom,top,span});
 }
 // Open stone rails follow the stair grade, rather than a solid screen.
 const count=Math.ceil(length/1.35),accepted=[];
 for(let i=0;i<=count;i++){
  const t=i/count,[x,z]=at(t,1),ground=sample(x,z),base=level(t)+.18;
  const support=[[-.14,-.14],[-.14,.14],[.14,-.14],[.14,.14]].map(([u,v])=>sample(x+u*Math.cos(yaw)+v*Math.sin(yaw),z-u*Math.sin(yaw)+v*Math.cos(yaw)));
  if(!Number.isFinite(ground)||support.some(y=>!Number.isFinite(y))||!routeClear(x,z,.26)||!roofClear(x,z,.26)||occupied(x,z,.27))continue;
  const bottom=Math.min(...support)-.09;
  box(.28,base+.91-bottom,.28,x,(base+.91+bottom)/2,z,stone,yaw);box(.37,.10,.37,x,base+.96,z,stone,yaw);
  accepted.push({index:i,point:[x,base,z],ground});posts.push({point:[x,ground,z],railBase:base,bottom,support});
  pending.push({type:'box',args:[x,z,.185,.185,yaw,bottom,base+1.01,'upper_access_r95_stone_post']});
 }
 for(let i=1;i<accepted.length;i++){
  const a=accepted[i-1],b=accepted[i];if(b.index!==a.index+1)continue;
  // Preserve the actual boundary as a barrier between posts, while retaining
  // open visual rails. Recheck each span rather than relying on post centres.
  const mx=(a.point[0]+b.point[0])/2,mz=(a.point[2]+b.point[2])/2;
  if(!routeClear(mx,mz,.20)||!roofClear(mx,mz,.20)||occupied(mx,mz,.15))continue;
  for(const h of [.34,.74]){
   const p=new THREE.Vector3(a.point[0],a.point[1]+h,a.point[2]),q=new THREE.Vector3(b.point[0],b.point[1]+h,b.point[2]),d=q.clone().sub(p);
   add(new THREE.BoxGeometry(.13,d.length(),.13).applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize())).translate(...p.add(q).multiplyScalar(.5).toArray()),stone);
  }rails.push({a:a.point,b:b.point});
  const span=Math.hypot(b.point[0]-a.point[0],b.point[2]-a.point[2]);
  pending.push({type:'box',args:[mx,mz,span/2,.075,yaw,Math.min(a.point[1],b.point[1])+.27,Math.max(a.point[1],b.point[1])+.81,'upper_access_r95_stone_rail']});
 }
 let seed=95177;const rand=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
 const cloud=(x,y,z,rx,ry,rz,count,low)=>{
  const positions=[],colors=[],uv=[];
  for(let i=0;i<count;i++){
   const a=rand()*Math.PI*2,v=rand()*2-1,rr=Math.cbrt(rand()),rad=Math.sqrt(1-v*v)*rr,c=new THREE.Vector3(x+Math.cos(a)*rad*rx,y+v*rr*ry,z+Math.sin(a)*rad*rz),w=.28+rand()*.23,angle=rand()*6.283;
   const u=new THREE.Vector3(Math.cos(angle)*w,.12,Math.sin(angle)*w),b=new THREE.Vector3(-Math.sin(angle)*w*.65,.19,Math.cos(angle)*w*.65),cs=[c.clone().sub(u).sub(b),c.clone().sub(u).add(b),c.clone().add(u).add(b),c.clone().add(u).sub(b)];
   if(cs.some(p=>!routeClear(p.x,p.z,.18)||!roofClear(p.x,p.z,.18)||(low&&occupied(p.x,p.z,.08))))continue;
   const color=new THREE.Color().setHSL(.235+rand()*.04,.24+rand()*.12,.15+rand()*.12);
   for(const p of [cs[0],cs[1],cs[2],cs[0],cs[2],cs[3]]){positions.push(...p.toArray());colors.push(color.r,color.g,color.b);}uv.push(0,0,0,1,1,1,0,0,1,1,1,0);
  }if(!positions.length)return 0;const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.computeVertexNormals();add(g,leaf);return positions.length/18;
 };
 for(const [i,[x,z]]of upperAccessR95Roots.entries()){
  const y=sample(x,z);if(!Number.isFinite(y)||!routeClear(x,z,.6)||!roofClear(x,z,.6))continue;
  if(!occupied(x,z,.6)){
   const h=8.1+i*.5;beam([x,y-.09,z],[x+.14,y+h*.73,z],.22,wood);
   for(let j=0;j<4;j++){const a=j*2.4+i,cx=x+Math.cos(a)*.9,cz=z+Math.sin(a)*.9;beam([x,y+h*.49,z],[cx,y+h*.73,cz],.055,wood);cloud(cx,y+h*.8,cz,2.3,1.9,2.0,220,false);}
   trees.push({root:[x,y,z],height:h});pending.push({type:'cylinder',args:[x,z,.24,y-.09,y+h*.73,'upper_access_r95_bank_tree']});
  }else skipped.push({kind:'tree',point:[x,z],reason:'Existing tree/solid owner'});
  growth.push({root:[x,y,z],cards:cloud(x,y+1.3,z,2.4,1.3,1.8,480,true)});
 }
 const group=new THREE.Group();group.name=NAME;let triangles=0;
 for(const [mat,parts]of batches){const g=mergeGeometries(parts);parts.forEach(p=>p.dispose());g.computeBoundingSphere();triangles+=g.attributes.position.count/3;const mesh=new THREE.Mesh(g,mat);mesh.castShadow=mat!==leaf;mesh.receiveShadow=true;group.add(mesh);}
 group.userData={built:group.children.length>0,edges,posts,rails,trees,growth,skipped,triangles,drawBatches:group.children.length,newColliders:pending.length,source:'iqK2tg-TxbY 06:05 low north coping/wooded flank,06:15 south open stone balustrade/trees; historical paused pixels re-inspected',limits:'Photo-inferred stone dimensions/post spacing and vegetation roots. Mapped stair alignment/width/levels unchanged. No new gate, shrine, lantern or temporary construction. Native integration review pending.'};
 if(group.userData.built){root.add(group);colliders.push(...pending);}return group.userData;
}
