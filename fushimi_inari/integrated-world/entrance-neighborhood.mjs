import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {entranceNeighborhoodLayout} from './entrance-neighborhood-layout.mjs';

// Permanent map-backed context for the otherwise empty entrance surroundings.
// This is restrained footprint massing, not a verified facade reconstruction.
export function buildEntranceNeighborhood(root,features,ground,materials,colliders){
 const layout=entranceNeighborhoodLayout(features),group=new THREE.Group();group.name='Mapped entrance neighborhood context';
 const plaster=new THREE.MeshStandardMaterial({color:'#b9b5a8',roughness:.97});
 const roof=new THREE.MeshStandardMaterial({color:'#656963',roughness:.94,side:THREE.DoubleSide});
 const eave=new THREE.MeshStandardMaterial({color:'#777366',roughness:.96});
 const minamiTimber=new THREE.MeshStandardMaterial({color:'#554b3e',roughness:.95}),minamiScreen=new THREE.MeshStandardMaterial({color:'#b8b6a3',roughness:.73}),minamiAwning=new THREE.MeshStandardMaterial({color:'#b8aa88',roughness:.95});
 const stone=materials.entryStoneMat,batches=new Map(),builtIds=[];
 const part=(geo,mat)=>{if(geo.index){const old=geo;geo=geo.toNonIndexed();old.dispose();}if(!batches.has(mat))batches.set(mat,[]);batches.get(mat).push(geo);};
 const box=(w,h,d,x,y,z,mat,yaw)=>{if(h<=0)return;part(new THREE.BoxGeometry(w,h,d).rotateY(yaw).translate(x,y,z),mat);};
 for(const spec of layout.records){
  const heights=spec.points.map(p=>ground(p[0],p[2])),sorted=[...heights].sort((a,b)=>a-b),floor=spec.publicFacadeEdge!==null?(ground(spec.points[spec.publicFacadeEdge][0],spec.points[spec.publicFacadeEdge][2])+ground(spec.points[(spec.publicFacadeEdge+1)%spec.points.length][0],spec.points[(spec.publicFacadeEdge+1)%spec.points.length][2]))/2:sorted[Math.floor((sorted.length-1)/2)],top=floor+spec.height;
  // Wall bottoms follow local terrain; a shared roof plane never introduces
  // an artificial multi-metre stone podium on the sloping neighborhood.
  for(let i=0;i<spec.points.length;i++){
   const a=spec.points[i],b=spec.points[(i+1)%spec.points.length],dx=b[0]-a[0],dz=b[2]-a[2],length=Math.hypot(dx,dz);if(length<.01)continue;
   const sections=Math.max(1,Math.ceil(length/2));
   for(let j=0;j<sections;j++){
    const t0=j/sections,t1=(j+1)/sections,x0=a[0]+dx*t0,z0=a[2]+dz*t0,x1=a[0]+dx*t1,z1=a[2]+dz*t1,cx=(x0+x1)/2,cz=(z0+z1)/2,base=Math.min(ground(x0,z0),ground(x1,z1),ground(cx,cz))-.04,yaw=Math.atan2(-dz,dx),w=length/sections;
    box(w,Math.max(.1,top-base),.12,cx,(top+base)/2,cz,plaster,yaw);box(w,.16,.16,cx,base+.06,cz,stone,yaw);
    colliders.push({type:'box',args:[cx,cz,w/2,.12,yaw,base,top,'mapped_entrance_'+spec.id.split('/')[1]]});
   }
   const yaw=Math.atan2(-dz,dx);box(length,.14,.22,(a[0]+b[0])/2,top-.03,(a[2]+b[2])/2,eave,yaw);
  }
  if(spec.id==='way/260121332'){
   // townphoto.net/kyoto/k01/k01202.jpg (2016) identifies Minami Shingu.
   // Only the mapped NE edge adjacent to Urassando is detailed. Bay spacing,
   // storey height and fabric depth remain visual estimates; no text invented.
   const a=spec.points[1],b=spec.points[2],dx=b[0]-a[0],dz=b[2]-a[2],length=Math.hypot(dx,dz),ux=dx/length,uz=dz/length,nx=uz,nz=-ux,yaw=Math.atan2(-dz,dx);
   const frontBox=(w,h,d,u,y,out,mat)=>box(w,h,d,a[0]+ux*u+nx*out,floor+y,a[2]+uz*u+nz*out,mat,yaw);
   frontBox(length,5.08,.035,length/2,2.57,.075,minamiTimber);
   for(let u=.12;u<length;u+=.30)frontBox(.035,5.02,.025,u,2.57,.10,eave);
   const bays=5,bw=length/bays;
   for(let i=0;i<bays;i++){
    const u=(i+.5)*bw;
    frontBox(bw-.20,1.27,.025,u,3.95,.125,minamiScreen);
    for(const du of [-.46,0,.46])frontBox(.055,1.36,.055,u+du*bw,3.95,.16,minamiTimber);
    frontBox(bw-.16,.05,.05,u,3.96,.16,minamiTimber);
    if(i%2===0)for(let k=0;k<7;k++)frontBox(.035,1.24,.04,u-bw*.40+k*bw*.133,3.95,.18,minamiTimber);
    for(let k=0;k<6;k++)frontBox(.045,2.20,.045,u-bw*.42+k*bw*.168,1.19,.14,minamiTimber);
   }
   for(const y of [2.55,3.24,4.64,5.08])frontBox(length,.11,.12,length/2,y,.15,minamiTimber);
   frontBox(length,.055,.70,length/2,2.50,.38,minamiAwning);
   frontBox(length,.13,.055,length/2,2.43,.73,minamiAwning);
  }
  const shape=new THREE.Shape();spec.points.forEach((p,i)=>i?shape.lineTo(p[0],-p[2]):shape.moveTo(p[0],-p[2]));shape.closePath();const cap=new THREE.ShapeGeometry(shape);cap.rotateX(-Math.PI/2);cap.translate(0,top+.045,0);part(cap,roof);builtIds.push(spec.id);
 }
 for(const [material,parts]of batches){const geometry=mergeGeometries(parts);parts.forEach(g=>g.dispose());const mesh=new THREE.Mesh(geometry,material);mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);}
 group.userData={sourceIds:builtIds,heights:layout.records.map(r=>({id:r.id,height:r.height,source:r.heightSource})),skippedLegacyShopOverlap:layout.skippedLegacyShopOverlap,provenance:'Exact OSM wall/roof footprints; tag heights/storeys where available, otherwise estimated4.5m; neutral caps are not verified roof forms/facades'};
 root.add(group);return {group,builtIds,skippedLegacyShopOverlap:layout.skippedLegacyShopOverlap};
}
