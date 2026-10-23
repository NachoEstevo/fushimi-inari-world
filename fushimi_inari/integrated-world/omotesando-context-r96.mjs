import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {omotesandoArrivalLayoutR94} from './omotesando-arrival-r94.mjs';
import {pathWidth} from '../geography/geo-core.mjs';

const segmentDistance=(x,z,a,b)=>{const dx=b[0]-a[0],dz=b[2]-a[2],t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[2])*dz)/(dx*dx+dz*dz||1)));return Math.hypot(x-a[0]-dx*t,z-a[2]-dz*t);};
export function omotesandoContextLayoutR96(features){
 const arrival=omotesandoArrivalLayoutR94(features);if(!arrival)return null;
 const approach=features.paths.find(p=>p.id===arrival.approachId),next=approach.points.find(p=>Math.hypot(p[0]-arrival.center[0],p[2]-arrival.center[1])>3),sign=Math.sign((next[0]-arrival.center[0])*arrival.across[0]+(next[2]-arrival.center[1])*arrival.across[1]);
 const at=(u,v)=>[arrival.center[0]+arrival.across[0]*u+arrival.along[0]*v,arrival.center[1]+arrival.across[1]*u+arrival.along[1]*v];
 const poleRoot=at(sign*(arrival.roadWidth/2+.95),8);
 const poleClear=!(features.paths??[]).some(p=>p.points.slice(1).some((b,i)=>segmentDistance(...poleRoot,p.points[i],b)<pathWidth(p.tags)/2+.4))&&!(features.buildings??[]).some(b=>{const xs=b.points.map(p=>p[0]),zs=b.points.map(p=>p[2]);return poleRoot[0]>=Math.min(...xs)-.3&&poleRoot[0]<=Math.max(...xs)+.3&&poleRoot[1]>=Math.min(...zs)-.3&&poleRoot[1]<=Math.max(...zs)+.3;});
 return {arrival,sign,at,poleRoot,poleClear,thresholdU:sign*(arrival.roadWidth/2+.29),edgeU:arrival.roadWidth/2-.30};
}

// Complement the existing crossing/curb owner: only a drain overlay, paint,
// inset grates and a bounded street utility assembly. No shops or new terrain.
export function buildOmotesandoContextR96(root,features,surfaces,materials={},colliders=[]){
 const name='Omotesando street interface R96',existing=root.getObjectByName(name);if(existing)return existing.userData;
 const layout=omotesandoContextLayoutR96(features);if(!layout)return {built:false,reason:'mapped entrance junction missing'};
 const {at,arrival,sign}=layout,group=new THREE.Group();group.name=name;
 const metal=new THREE.MeshStandardMaterial({color:'#535d58',roughness:.85,metalness:.35}),dark=new THREE.MeshStandardMaterial({color:'#252c29',roughness:.94}),paint=new THREE.MeshStandardMaterial({color:'#deded2',roughness:1,polygonOffset:true,polygonOffsetFactor:-4,polygonOffsetUnits:-4}),concrete=new THREE.MeshStandardMaterial({color:'#8e9189',roughness:1});
 const batches=new Map(),surfaceParts=[],seats=[];
 const height=(x,z)=>{const y=surfaces.height(x,z);if(!Number.isFinite(y))throw Error('Nonfinite R96 street seat');return y;};
 const put=(geo,mat)=>{geo.deleteAttribute('uv');if(!batches.has(mat))batches.set(mat,[]);batches.get(mat).push(geo.index?geo.toNonIndexed():geo);if(geo.index)geo.dispose();};
 const patch=(u0,u1,v0,v1,mat,raise)=>{const vertices=[];const n=Math.ceil(Math.max(u1-u0,v1-v0)/.15);for(let i=0;i<n;i++){const a=v0+(v1-v0)*i/n,b=v0+(v1-v0)*(i+1)/n,points=[[u0,a],[u1,a],[u1,b],[u0,b]].map(([u,v])=>{const [x,z]=at(u,v);return [x,height(x,z)+raise,z];});for(const j of [0,1,2,0,2,3])vertices.push(...points[j]);}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.computeVertexNormals();put(g,mat);surfaceParts.push({u0,u1,v0,v1,raise});};
 // k01111: a long fine metal grate runs along the street/approach threshold.
 // It is flush and transverse to the walking direction, not a new step.
 const u=layout.thresholdU;patch(u-.19,u+.19,-4,4,dark,.024);
 for(let v=-3.985;v<4;v+=.045)patch(u-.19,u+.19,v,v+.018,metal,.027);
 for(const du of [-.19,.19])patch(u+du-.018,u+du+.018,-4,4,metal,.028);
 // k01102/11: thin solid white road margins, interrupted for the crossing.
 for(const side of [-1,1])for(const [lo,hi]of [[-13,-3.1],[3.1,13]])patch(side*layout.edgeU-.055,side*layout.edgeU+.055,lo,hi,paint,.026);
 // Four curbside inset grate covers inside the existing gutter footprint.
 for(const side of [-1,1])for(const v of [-9,9]){const gu=side*(arrival.roadWidth/2-.12);patch(gu-.105,gu+.105,v-.34,v+.34,dark,.024);for(let j=0;j<10;j++)patch(gu-.105,gu+.105,v-.32+j*.064,v-.30+j*.064,metal,.027);}
 const beam=(a,b,r,mat)=>{const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b),delta=bv.clone().sub(av),g=new THREE.CylinderGeometry(r,r,delta.length(),7);g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize()));g.translate(...av.add(bv).multiplyScalar(.5).toArray());put(g,mat);};
 let utilityBuilt=false;
 if(layout.poleClear){const [x,z]=layout.poleRoot,y=height(x,z);seats.push([x,y,z]);beam([x,y-.12,z],[x,y+8.5,z],.14,concrete);
  for(const h of [6.6,7.8]){const a=at(sign*(arrival.roadWidth/2+.95)-1.05,8),b=at(sign*(arrival.roadWidth/2+.95)+1.05,8);beam([a[0],y+h,a[1]],[b[0],y+h,b[1]],.045,metal);for(const offset of [-.82,0,.82]){const p=at(sign*(arrival.roadWidth/2+.95)+offset,8);beam([p[0],y+h,p[1]],[p[0],y+h+.22,p[1]],.055,concrete);}}
  // Adjacent supports are unregistered. Keep the complete pole hardware only;
  // no unsupported wire spans or invented remote poles.
  colliders.push({type:'cylinder',args:[x,z,.16,y-.12,y+8.5,'photo_street_utility_r96']});utilityBuilt=true;
 }
 for(const [mat,parts]of batches){const geometry=mergeGeometries(parts,false);parts.forEach(g=>g.dispose());const mesh=new THREE.Mesh(geometry,mat);mesh.receiveShadow=true;mesh.castShadow=mat===concrete;mesh.name='R96 '+(mat===metal?'grates and utility metal':mat===paint?'road edge paint':mat===concrete?'street utility pole':'drain slots');group.add(mesh);}
 group.userData={built:true,drawBatches:group.children.length,utilityBuilt,conductorsBuilt:false,collidersAdded:utilityBuilt?1:0,seats,surfaceParts,sourceNode:arrival.sourceNode,source:'Townphoto 2016 actual photographs k01102smal.webp, k01111.jpg, k01112.jpg; OSM road79699850/approach105449722 shared junction',inferred:'Drain width, grate spacing, road paint extents, utility pole root/height and hardware dimensions are photo estimates; no surveyed positions or current condition claimed.',limits:'Complements R94 road finish; flush layers sample actual existing surfaces. Utility omitted when mapped walking/building clearance fails. No new walk surface, shop identity, facade or Temizuya garden. Conductors omitted until adjacent supports are registered; render review remains root-owned.'};root.add(group);return group.userData;
}
