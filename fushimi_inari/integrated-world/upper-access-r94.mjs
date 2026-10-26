import {createPlanarOccupancy} from './planar-occupancy.mjs';
import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {makeShoulderTriangleHeight} from './omotesando-shoulders-layout.mjs';
import {pathWidth} from '../geography/geo-core.mjs';
import {leafClusterMaterial} from './leaf-cluster.mjs';

const NAME='Okumiya onward wooded pocket R94';
// Photo-inferred pockets behind the upper gate, not surveyed tree nodes.
export const upperAccessPockets=Object.freeze([[124.5,-6.8],[130,-7.8],[135,-7.4]].map(Object.freeze));

export function buildUpperAccessR94(root,features,surfaces,materials,colliders,options={}){
 const old=root.getObjectByName(NAME);if(old)return old.userData;
 if(!options.terrainPositions?.length)return {built:false,reason:'Rendered terrain triangles required'};
 if(!features.paths.some(p=>p.id==='way/105449724')||!features.paths.some(p=>p.id==='way/260121354'))return {built:false,reason:'Upper access source unavailable'};
 const wood=materials.woodMat??materials.timberMat??materials.roofMat;
 if(!wood)return {built:false,reason:'Existing timber material required'};
 // Only the actual rendered planes may seat roots. Do not fall back to DEM.
 const nearby=[];const source=options.terrainPositions;
 for(let i=0;i<source.length;i+=9){
  if(Math.max(source[i],source[i+3],source[i+6])<121||Math.min(source[i],source[i+3],source[i+6])>139||Math.max(source[i+2],source[i+5],source[i+8])< -11||Math.min(source[i+2],source[i+5],source[i+8])> -3)continue;
  for(let j=0;j<9;j++)nearby.push(source[i+j]);
 }
 const sample=makeShoulderTriangleHeight(nearby);
 const segments=(surfaces.segments?.length?surfaces.segments:features.paths.flatMap(p=>p.points.slice(1).map((b,i)=>({a:p.points[i],b,width:pathWidth(p.tags??{})})))).filter(s=>Math.max(s.a[0],s.b[0])+s.width/2>120&&Math.min(s.a[0],s.b[0])-s.width/2<140&&Math.max(s.a[2],s.b[2])+s.width/2> -12&&Math.min(s.a[2],s.b[2])-s.width/2< -2);
 const roofs=features.buildings.map(b=>({x0:Math.min(...b.points.map(p=>p[0]))-1.25,x1:Math.max(...b.points.map(p=>p[0]))+1.25,z0:Math.min(...b.points.map(p=>p[2]))-1.25,z1:Math.max(...b.points.map(p=>p[2]))+1.25})).filter(b=>b.x1>120&&b.x0<140&&b.z1> -12&&b.z0< -2);
 const clear=(x,z,r)=>!segments.some(s=>{const dx=s.b[0]-s.a[0],dz=s.b[2]-s.a[2],t=Math.max(0,Math.min(1,((x-s.a[0])*dx+(z-s.a[2])*dz)/(dx*dx+dz*dz||1)));return Math.hypot(x-s.a[0]-t*dx,z-s.a[2]-t*dz)<s.width/2+r;})&&!roofs.some(b=>{
  // Deliberately conservative roof envelope, not just the mapped wall polygon.
  return x>b.x0-r&&x<b.x1+r&&z>b.z0-r&&z<b.z1+r;
 });
 const occupied=createPlanarOccupancy(colliders,{clearance:.18});
 const leaf=typeof document!=='undefined'?leafClusterMaterial().clone():new THREE.MeshStandardMaterial({color:'#ffffff',vertexColors:true,side:THREE.DoubleSide,roughness:1});leaf.vertexColors=true;
 const batches=new Map(),trees=[],growth=[],skipped=[],pending=[];
 const add=(g,m)=>{if(g.index){const old=g;g=g.toNonIndexed();old.dispose();}if(!batches.has(m))batches.set(m,[]);batches.get(m).push(g);};
 const beam=(a,b,r)=>{const p=new THREE.Vector3(...a),q=new THREE.Vector3(...b),d=q.clone().sub(p);add(new THREE.CylinderGeometry(r*.72,r,d.length(),7).applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize())).translate(...p.add(q).multiplyScalar(.5).toArray()),wood);};
 let seed=94031;const rand=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
 const cloud=(x,y,z,rx,ry,rz,count,low)=>{
  const positions=[],colors=[],uv=[];
  for(let i=0;i<count;i++){
   const a=rand()*Math.PI*2,v=rand()*2-1,rr=Math.cbrt(rand()),rad=Math.sqrt(1-v*v)*rr,c=new THREE.Vector3(x+Math.cos(a)*rad*rx,y+v*rr*ry,z+Math.sin(a)*rad*rz),angle=rand()*Math.PI*2,w=.30+rand()*.22;
   const tilt=new THREE.Quaternion().setFromEuler(new THREE.Euler((rand()-.5)*2.1,0,(rand()-.5)*2.1)),u=new THREE.Vector3(Math.cos(angle)*w,0,Math.sin(angle)*w).applyQuaternion(tilt),b=new THREE.Vector3(-Math.sin(angle)*w*.58,.04,Math.cos(angle)*w*.58).applyQuaternion(tilt);
   const corners=[c.clone().sub(u).sub(b),c.clone().sub(u).add(b),c.clone().add(u).add(b),c.clone().add(u).sub(b)];
   // Second-pass constraint: test actual leaf corners, not cloud centres.
   if(corners.some(p=>!clear(p.x,p.z,.16)||(low&&occupied(p.x,p.z,.06))))continue;
   const color=new THREE.Color().setHSL(.235+rand()*.035,.24+rand()*.1,.16+rand()*.12);
   for(const p of [corners[0],corners[1],corners[2],corners[0],corners[2],corners[3]]){positions.push(...p.toArray());colors.push(color.r,color.g,color.b);}uv.push(0,0,0,1,1,1,0,0,1,1,1,0);
  }
  if(!positions.length)return 0;
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.computeVertexNormals();add(g,leaf);return positions.length/18;
 };
 for(const [i,[x,z]]of upperAccessPockets.entries()){
  const y=sample(x,z);if(!Number.isFinite(y)){skipped.push({point:[x,z],reason:'No rendered support triangle'});continue;}
  if(!clear(x,z,.55)){skipped.push({point:[x,z],reason:'Public route or roof clearance'});continue;}
  // Existing forest remains the tree owner; add only safe low growth nearby.
  if(!occupied(x,z,.5)){
   const h=7.4+i*.45;beam([x,y-.09,z],[x+.12,y+h*.72,z],.19);
   for(let n=0;n<3;n++){const a=n*2.4+i,cx=x+Math.cos(a)*.8,cz=z+Math.sin(a)*.8;beam([x,y+h*.48,z],[cx,y+h*.75,cz],.05);cloud(cx,y+h*.82,cz,1.8,1.6,1.6,180,false);}
   trees.push({root:[x,y,z],height:h});pending.push({type:'cylinder',args:[x,z,.21,y-.09,y+h*.72,'upper_access_r94_tree']});
  }else skipped.push({point:[x,z],reason:'Existing solid/tree owner'});
  const cards=cloud(x,y+1.15,z,1.9,1.15,1.4,320,true);growth.push({root:[x,y,z],cards});
 }
 const group=new THREE.Group();group.name=NAME;let triangles=0;
 for(const [mat,parts]of batches){const g=mergeGeometries(parts);parts.forEach(p=>p.dispose());g.computeBoundingSphere();triangles+=g.attributes.position.count/3;const mesh=new THREE.Mesh(g,mat);mesh.castShadow=mat!==leaf;mesh.receiveShadow=true;group.add(mesh);}
 group.userData={built:group.children.length>0,trees,growth,skipped,triangles,drawBatches:group.children.length,newColliders:pending.length,source:'iqK2tg-TxbY 06:25 upper gate wooded background; IMG_6891_20210308 upper stair wooded sides',limits:'Pocket/root/crown dimensions inferred. Existing stairs, torii, balustrades, buildings and public heights retain their owners. No surveyed tree inventory or native visual acceptance.'};
 if(group.userData.built){root.add(group);colliders.push(...pending);}return group.userData;
}
