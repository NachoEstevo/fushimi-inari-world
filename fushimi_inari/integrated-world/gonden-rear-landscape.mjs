import * as THREE from 'three';
import {createStartupCheckpoint,yieldStartupTask} from './startup-work.mjs';
import {makeShoulderTriangleHeight} from './omotesando-shoulders-layout.mjs';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {leafClusterMaterial} from './leaf-cluster.mjs';

const NAME='Gonden bounded rear service landscape R93';
// IMG_6572 confirms a mineral service gap and wooded retaining edge. These
// offsets/heights are conservative photographic estimates, not surveyed data.
export function buildGondenRearLandscape(root,features,surfaces,materials,colliders,options={}){
 const work=buildGondenRearLandscapeWork(root,features,surfaces,materials,colliders,options);let step=work.next();while(!step.done)step=work.next();return step.value;
}
export async function buildGondenRearLandscapeAsync(root,features,surfaces,materials,colliders,options={}){
 const checkpoint=createStartupCheckpoint({yieldWork:options.yieldWork??yieldStartupTask,clock:options.clock}),work=buildGondenRearLandscapeWork(root,features,surfaces,materials,colliders,options);let step=work.next();
 while(!step.done){const pause=checkpoint();if(pause)await pause;step=work.next();}return step.value;
}
function* buildGondenRearLandscapeWork(root,features,surfaces,materials,colliders,options){
 const old=root.getObjectByName(NAME);if(old)return old.userData;
 let shrine;root.traverse(o=>{if(o.isGroup&&o.userData.zone==='gonden')shrine=o;});
 if(!shrine)return {built:false,reason:'Gonden owner unavailable'};
 if(!options.terrainPositions?.length)return {built:false,reason:'Rendered terrain triangle sampler unavailable'};
 shrine.updateWorldMatrix(true,false);
 const m=shrine.matrixWorld;
 const world=(x,z)=>new THREE.Vector3(x,0,z).applyMatrix4(m);
 const e=m.elements;if(Math.abs(e[1])+Math.abs(e[4])+Math.abs(e[6])+Math.abs(e[9])>1e-6||m.determinant()<=0)throw Error('Gonden rear requires upright positive transform');
 const limits=[world(-3,-5),world(-3,-3),world(3,-5),world(3,-3)],xs=limits.map(p=>p.x),zs=limits.map(p=>p.z),nearby=[];
 const source=options.terrainPositions,minX=Math.min(...xs),maxX=Math.max(...xs),minZ=Math.min(...zs),maxZ=Math.max(...zs);
 for(let i=0;i<source.length;i+=9){
  if(i%2304===0)yield;
  if(Math.max(source[i],source[i+3],source[i+6])<minX||Math.min(source[i],source[i+3],source[i+6])>maxX||Math.max(source[i+2],source[i+5],source[i+8])<minZ||Math.min(source[i+2],source[i+5],source[i+8])>maxZ)continue;
  for(let j=0;j<9;j++)nearby.push(source[i+j]);
 }
 const sample=makeShoulderTriangleHeight(nearby);
 const point=(x,z,lift=0)=>{const p=world(x,z),y=sample(p.x,p.z);if(!Number.isFinite(y))throw Error('Missing rendered terrain sample for Gonden rear');return [p.x,y+lift,p.z];};
 const segments=surfaces.segments??[];
 const blocked=(x,z,padding)=>segments.some(s=>{const dx=s.b[0]-s.a[0],dz=s.b[2]-s.a[2],t=Math.max(0,Math.min(1,((x-s.a[0])*dx+(z-s.a[2])*dz)/(dx*dx+dz*dz||1)));return Math.hypot(x-s.a[0]-t*dx,z-s.a[2]-t*dz)<s.width/2+padding;});
 const obstructed=(x,z,r)=>colliders.some(c=>{const a=c.args;if(a.at(-1)==='gonden')return false;if(c.type==='cylinder')return Math.hypot(x-a[0],z-a[1])<r+a[2]+.12;if(c.type!=='box')return false;const yaw=a[4]??0,dx=x-a[0],dz=z-a[1],u=dx*Math.cos(yaw)-dz*Math.sin(yaw),v=dx*Math.sin(yaw)+dz*Math.cos(yaw);return Math.abs(u)<a[2]+r+.12&&Math.abs(v)<a[3]+r+.12;});
 const group=new THREE.Group();group.name=NAME;const batches=new Map(),pending=[],trees=[],fence=[],skipped=[],positions=[];
 const stone=materials.gravelMat??materials.stoneMat,wood=materials.woodMat??materials.timberMat??materials.roofMat??materials.blackNemakiMat;
 const leaf=typeof document!=='undefined'?leafClusterMaterial():new THREE.MeshStandardMaterial({color:'#ffffff',vertexColors:true,side:THREE.DoubleSide,roughness:.9});
 if(!stone||!wood||!leaf)return {built:false,reason:'Existing gravel/stone, timber and foliage materials required'};
 const add=(g,mat)=>{if(g.index){const old=g;g=g.toNonIndexed();old.dispose();}if(!batches.has(mat))batches.set(mat,[]);batches.get(mat).push(g);};
 const beam=(a,b,r,mat)=>{const p=new THREE.Vector3(...a),q=new THREE.Vector3(...b),delta=q.clone().sub(p);add(new THREE.CylinderGeometry(r,r,delta.length(),6).applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize())).translate(...p.add(q).multiplyScalar(.5).toArray()),mat);};
 // Rear veranda and its framing already belong to gonden-facade. Stay outside
 // its -3.05m roof edge and stop short of the +X side screen return.
 // Clip original rendered triangles, preserving each terrain plane exactly.
 // Resampling a regular grid would bridge across a terrain diagonal/crease.
 const inv=m.clone().invert(),terrain=nearby;
 for(let i=0;i<terrain.length;i+=9){
  let poly=[0,1,2].map(j=>new THREE.Vector3(terrain[i+j*3],terrain[i+j*3+1],terrain[i+j*3+2]).applyMatrix4(inv).toArray());
  for(const [axis,bound,sign]of [[0,-2.6,1],[0,2.6,-1],[2,-4.28,1],[2,-3.28,-1]]){
   const next=[];for(let j=0;j<poly.length;j++){const a=poly[j],b=poly[(j+1)%poly.length],da=(a[axis]-bound)*sign,db=(b[axis]-bound)*sign;
    if(da>=0)next.push(a);if((da>=0)!==(db>=0)){const t=da/(da-db);next.push(a.map((v,k)=>v+(b[k]-v)*t));}
   }poly=next;if(poly.length<3)break;
  }
  if(poly.length<3)continue;
  const p=poly.map(v=>{const q=new THREE.Vector3(...v).applyMatrix4(m);return [q.x,q.y+.018,q.z];});
  // Conservative corridor rejection includes the centroid and edge midpoints.
  const checks=[...p,p.reduce((a,v)=>a.map((n,k)=>n+v[k]/p.length),[0,0,0]),...p.map((a,j)=>a.map((v,k)=>(v+p[(j+1)%p.length][k])/2))];
  if(checks.some(v=>blocked(v[0],v[2],.12)))continue;
  for(let j=1;j<p.length-1;j++)positions.push(...p[0],...p[j],...p[j+1]);
 }
 if(positions.length){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(positions.flatMap((v,i)=>i%3===0?[v,positions[i+2]]:[]),2));g.computeVertexNormals();add(g,stone);}
 // Short low timber boundary at the north end; no invented public enclosure
 // across the full rear gap and no duplicate roofed screen/cabinet/lantern.
 const ends=[point(-2.72,-3.34),point(-2.72,-4.25)];
 if(ends.every(p=>!blocked(p[0],p[2],.16)&&!obstructed(p[0],p[2],.10))){
  for(const p of ends)beam([p[0],p[1]-.04,p[2]],[p[0],p[1]+.66,p[2]],.042,wood);
  for(const h of [.23,.53])beam(ends[0].map((v,i)=>i===1?v+h:v),ends[1].map((v,i)=>i===1?v+h:v),.028,wood);
  const a=ends[0],b=ends[1];pending.push({type:'box',args:[(a[0]+b[0])/2,(a[2]+b[2])/2,Math.hypot(b[0]-a[0],b[2]-a[2])/2,.06,-Math.atan2(b[2]-a[2],b[0]-a[0]),Math.min(a[1],b[1])-.04,Math.max(a[1],b[1])+.66,'gonden_rear_low_boundary']});fence.push(...ends);
 }
 let seed=93017;const rand=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
 for(const [i,x]of [-2.4,-1.2,0,1.2,2.4].entries()){
  const p=point(x,-4.65),r=.13;
  if(blocked(p[0],p[2],.55)||obstructed(p[0],p[2],.30)){skipped.push({kind:'tree',point:p,reason:'existing route or solid'});continue;}
  const h=6.6+(i%3)*.55;beam([p[0],p[1]-.07,p[2]],[p[0],p[1]+h*.78,p[2]],r,wood);
  // Existing cutout evergreen spray material; deterministic ellipsoidal cloud
  // replaces faceted solid crowns without changing root/clearance ownership.
  const vertices=[],colors=[],uv=[];
  for(const [j,y]of [[0,h*.73],[1,h*.93]])for(let n=0;n<110;n++){
   const az=rand()*Math.PI*2,v=rand()*2-1,rr=Math.cbrt(rand()),rad=Math.sqrt(1-v*v)*rr;
   const c=new THREE.Vector3(p[0]+Math.cos(az)*rad*.70,p[1]+y+v*rr*1.65,p[2]+Math.sin(az)*rad*.90+(j?.12:0));
   const a=rand()*Math.PI*2,w=.35+rand()*.18,tilt=new THREE.Quaternion().setFromEuler(new THREE.Euler((rand()-.5)*2.3,0,(rand()-.5)*2.3));
   const u=new THREE.Vector3(Math.cos(a)*w,0,Math.sin(a)*w).applyQuaternion(tilt),b=new THREE.Vector3(-Math.sin(a)*w*.65,.05,Math.cos(a)*w*.65).applyQuaternion(tilt),color=new THREE.Color().setHSL(.24+rand()*.045,.23+rand()*.1,.17+rand()*.11);
   for(const q of [c.clone().sub(u).sub(b),c.clone().sub(u).add(b),c.clone().add(u).add(b),c.clone().sub(u).sub(b),c.clone().add(u).add(b),c.clone().add(u).sub(b)]){vertices.push(...q.toArray());colors.push(color.r,color.g,color.b);}
   uv.push(0,0,0,1,1,1,0,0,1,1,1,0);
  }
  const crown=new THREE.BufferGeometry();crown.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));crown.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));crown.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));crown.computeVertexNormals();add(crown,leaf);
  pending.push({type:'cylinder',args:[p[0],p[2],r,p[1]-.07,p[1]+h*.78,'gonden_rear_tree']});trees.push({root:p,height:h,radius:r});
 }
 for(const [material,parts]of batches){const geometry=mergeGeometries(parts);for(const p of parts)p.dispose();const mesh=new THREE.Mesh(geometry,material);mesh.castShadow=mesh.receiveShadow=true;mesh.name='Gonden rear static material batch';group.add(mesh);}
 group.userData={built:group.children.length>0,trees,fence,skipped,groundTriangles:positions.length/9,drawBatches:batches.size,source:'IMG_6572_20210311.jpg',dimensions:'Photo inferred: 1m rear gap, 0.66m low boundary, 6.6-7.7m trees; no surveyed endpoints',ground:'shared rendered terrain triangle sampler; .018m mineral offset; buried trunk toes',limits:'Retaining edge location/height unmeasured; no new wall or stone fence fabricated. Exact tree positions/species inferred. Existing side props and rear veranda unchanged.'};
 root.add(group);colliders.push(...pending);return group.userData;
}
