import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {makeShoulderTriangleHeight} from './omotesando-shoulders-layout.mjs';
import {pathWidth} from '../geography/geo-core.mjs';
import {leafClusterMaterial} from './leaf-cluster.mjs';

const NAME='Okumiya main stair north wooded bank R96';
// Photo-inferred north-bank pockets beside the main flight, not surveyed tree nodes.
export const upperAccessR96Pockets=Object.freeze([[98.5,-25.8],[103.5,-25.4],[109,-28.1],[117,-31.5]].map(Object.freeze));

export function buildUpperAccessR96(root,features,surfaces,materials,colliders,options={}){
 const old=root.getObjectByName(NAME);if(old)return old.userData;
 if(!options.terrainPositions?.length)return {built:false,reason:'Rendered terrain triangles required'};
 if(!features.paths.some(p=>p.id==='way/626313768'))return {built:false,reason:'Upper access source unavailable'};
 const wood=materials.woodMat??materials.timberMat??materials.roofMat;
 if(!wood)return {built:false,reason:'Existing timber material required'};
 // Only the actual rendered planes may seat roots. Do not fall back to DEM.
 const nearby=[];const source=options.terrainPositions;
 for(let i=0;i<source.length;i+=9){
  if(Math.max(source[i],source[i+3],source[i+6])<94||Math.min(source[i],source[i+3],source[i+6])>122||Math.max(source[i+2],source[i+5],source[i+8])< -36||Math.min(source[i+2],source[i+5],source[i+8])> -21)continue;
  for(let j=0;j<9;j++)nearby.push(source[i+j]);
 }
 const sample=makeShoulderTriangleHeight(nearby);
 const segments=(surfaces.segments?.length?surfaces.segments:features.paths.flatMap(p=>p.points.slice(1).map((b,i)=>({a:p.points[i],b,width:pathWidth(p.tags??{})})))).filter(s=>Math.max(s.a[0],s.b[0])+s.width/2>93&&Math.min(s.a[0],s.b[0])-s.width/2<123&&Math.max(s.a[2],s.b[2])+s.width/2> -37&&Math.min(s.a[2],s.b[2])-s.width/2< -20);
 const roofs=features.buildings.map(b=>({x0:Math.min(...b.points.map(p=>p[0]))-1.25,x1:Math.max(...b.points.map(p=>p[0]))+1.25,z0:Math.min(...b.points.map(p=>p[2]))-1.25,z1:Math.max(...b.points.map(p=>p[2]))+1.25})).filter(b=>b.x1>93&&b.x0<123&&b.z1> -37&&b.z0< -20);
 const clear=(x,z,r)=>!segments.some(s=>{const dx=s.b[0]-s.a[0],dz=s.b[2]-s.a[2],t=Math.max(0,Math.min(1,((x-s.a[0])*dx+(z-s.a[2])*dz)/(dx*dx+dz*dz||1)));return Math.hypot(x-s.a[0]-t*dx,z-s.a[2]-t*dz)<s.width/2+r;})&&!roofs.some(b=>{
  // Deliberately conservative roof envelope, not just the mapped wall polygon.
  return x>b.x0-r&&x<b.x1+r&&z>b.z0-r&&z<b.z1+r;
 });
 const occupied=(x,z,r)=>colliders.some(c=>{const a=c.args;if(c.type==='cylinder')return Math.hypot(x-a[0],z-a[1])<a[2]+r+.18;if(c.type!=='box')return false;const dx=x-a[0],dz=z-a[1],yaw=a[4]??0;return Math.abs(dx*Math.cos(yaw)-dz*Math.sin(yaw))<a[2]+r+.18&&Math.abs(dx*Math.sin(yaw)+dz*Math.cos(yaw))<a[3]+r+.18;});
 const leaf=typeof document!=='undefined'?leafClusterMaterial().clone():new THREE.MeshStandardMaterial({color:'#ffffff',vertexColors:true,side:THREE.DoubleSide,roughness:1});leaf.vertexColors=true;
 const batches=new Map(),trees=[],roots=[],growth=[],skipped=[],pending=[];
 const add=(g,m)=>{if(g.index){const old=g;g=g.toNonIndexed();old.dispose();}if(!batches.has(m))batches.set(m,[]);batches.get(m).push(g);};
 const beam=(a,b,r)=>{const p=new THREE.Vector3(...a),q=new THREE.Vector3(...b),d=q.clone().sub(p);add(new THREE.CylinderGeometry(r*.72,r,d.length(),7).applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize())).translate(...p.add(q).multiplyScalar(.5).toArray()),wood);};
 let seed=96031;const rand=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
 const cloud=(x,y,z,rx,ry,rz,count,low)=>{
  const positions=[],colors=[],uv=[];
  for(let i=0;i<count;i++){
   const a=rand()*Math.PI*2,v=rand()*2-1,rr=Math.cbrt(rand()),rad=Math.sqrt(1-v*v)*rr,c=new THREE.Vector3(x+Math.cos(a)*rad*rx,y+v*rr*ry,z+Math.sin(a)*rad*rz),angle=rand()*Math.PI*2,w=.30+rand()*.22;
   const tilt=new THREE.Quaternion().setFromEuler(new THREE.Euler((rand()-.5)*2.1,0,(rand()-.5)*2.1)),u=new THREE.Vector3(Math.cos(angle)*w,0,Math.sin(angle)*w).applyQuaternion(tilt),b=new THREE.Vector3(-Math.sin(angle)*w*.58,.04,Math.cos(angle)*w*.58).applyQuaternion(tilt);
   const corners=[c.clone().sub(u).sub(b),c.clone().sub(u).add(b),c.clone().add(u).add(b),c.clone().add(u).sub(b)];
   // Second-pass constraint: test actual leaf corners, not cloud centres.
   if(corners.some(p=>!clear(p.x,p.z,.16)||occupied(p.x,p.z,.06)))continue;
   const color=new THREE.Color().setHSL(.235+rand()*.035,.24+rand()*.1,.16+rand()*.12);
   for(const p of [corners[0],corners[1],corners[2],corners[0],corners[2],corners[3]]){positions.push(...p.toArray());colors.push(color.r,color.g,color.b);}uv.push(0,0,0,1,1,1,0,0,1,1,1,0);
  }
  if(!positions.length)return 0;
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.computeVertexNormals();add(g,leaf);return positions.length/18;
 };
 for(const [i,[x,z]]of upperAccessR96Pockets.entries()){
  const y=sample(x,z);if(!Number.isFinite(y)){skipped.push({point:[x,z],reason:'No rendered support triangle'});continue;}
  if(!clear(x,z,.55)){skipped.push({point:[x,z],reason:'Public route or roof clearance'});continue;}
  // Existing forest remains the tree owner; add only safe low growth nearby.
  if(!occupied(x,z,.5)){
   const h=9.1+i*.42;beam([x,y-.09,z],[x+.12,y+h*.72,z],.19);
   for(let n=0;n<3;n++){const a=n*2.4+i,cx=x+Math.cos(a)*.8,cz=z+Math.sin(a)*.8;if(!clear(cx,cz,.13))continue;beam([x,y+h*.48,z],[cx,y+h*.75,cz],.05);cloud(cx,y+h*.82,cz,1.8,1.6,1.6,180,false);}
   // Explicit basal buttresses follow rendered slope rather than a floating
   // radial star. Every end and midpoint must stay outside walking/roof/solid envelopes.
   for(let j=0;j<4;j++){
    const angle=j*Math.PI/2+i*.47,tx=x+Math.cos(angle)*.95,tz=z+Math.sin(angle)*.95,mx=(x+tx)/2,mz=(z+tz)/2;
    const ty=sample(tx,tz),my=sample(mx,mz);
    if(!Number.isFinite(ty)||!Number.isFinite(my)||!clear(tx,tz,.16)||!clear(mx,mz,.16)||occupied(tx,tz,.14)||occupied(mx,mz,.14))continue;
    beam([x,y+.25,z],[mx,my+.10,mz],.13);beam([mx,my+.10,mz],[tx,ty-.035,tz],.085);
    roots.push({a:[x,y,z],mid:[mx,my,mz],b:[tx,ty,tz]});
   }
   trees.push({root:[x,y,z],height:h});pending.push({type:'cylinder',args:[x,z,.21,y-.09,y+h*.72,'upper_access_r96_tree']});
  }else skipped.push({point:[x,z],reason:'Existing solid/tree owner'});
  const cards=cloud(x,y+1.15,z,1.9,1.15,1.4,320,true);growth.push({root:[x,y,z],cards});
 }
 const group=new THREE.Group();group.name=NAME;let triangles=0;
 for(const [mat,parts]of batches){const g=mergeGeometries(parts);parts.forEach(p=>p.dispose());g.computeBoundingSphere();triangles+=g.attributes.position.count/3;const mesh=new THREE.Mesh(g,mat);mesh.castShadow=mat!==leaf;mesh.receiveShadow=true;group.add(mesh);}
 group.userData={built:group.children.length>0,trees,roots,growth,skipped,triangles,drawBatches:group.children.length,newColliders:pending.length,source:'Google Street View June 2012 downhill/side/front landing frames, mature north stair bank and canopy; iqK2tg-TxbY 06:05 wooded upper flight; public Okumiya guide photographs',limits:'North bank root stations, basal roots, crown dimensions and understory distribution inferred from wooded silhouette, not individually surveyed. No unsupported wall or rock scatter. Existing forest colliders suppress duplicate trees. Native visual acceptance pending.'};
 if(group.userData.built){root.add(group);colliders.push(...pending);}return group.userData;
}
