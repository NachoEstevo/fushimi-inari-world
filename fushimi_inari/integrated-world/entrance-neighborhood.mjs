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
 const roofDetails=[],facadeDetails=[];
 const gishikidenRecess=new THREE.MeshStandardMaterial({color:'#41494a',roughness:.78,metalness:.08});
 const gishikidenConcrete=new THREE.MeshStandardMaterial({color:'#bfc2b6',roughness:.93});
 const minamiRoof=new THREE.MeshStandardMaterial({color:'#69716f',roughness:.83,side:THREE.DoubleSide});
 const minamiTile=new THREE.MeshStandardMaterial({color:'#79817e',roughness:.82});
 const minamiTimber=new THREE.MeshStandardMaterial({color:'#554b3e',roughness:.95}),minamiScreen=new THREE.MeshStandardMaterial({color:'#b8b6a3',roughness:.73}),minamiAwning=new THREE.MeshStandardMaterial({color:'#b8aa88',roughness:.95});
 const stone=materials.entryStoneMat,batches=new Map(),builtIds=[];
 const part=(geo,mat)=>{if(geo.index){const old=geo;geo=geo.toNonIndexed();old.dispose();}if(!batches.has(mat))batches.set(mat,[]);batches.get(mat).push(geo);};
 const box=(w,h,d,x,y,z,mat,yaw)=>{if(h<=0)return;part(new THREE.BoxGeometry(w,h,d).rotateY(yaw).translate(x,y,z),mat);};
 for(const spec of layout.records){
  const gishikiden=spec.id==='way/223276575',upperRailZone=gishikiden?spec.height*.103125:0;
  const heights=spec.points.map(p=>ground(p[0],p[2])),sorted=[...heights].sort((a,b)=>a-b),floor=spec.publicFacadeEdge!==null?(ground(spec.points[spec.publicFacadeEdge][0],spec.points[spec.publicFacadeEdge][2])+ground(spec.points[(spec.publicFacadeEdge+1)%spec.points.length][0],spec.points[(spec.publicFacadeEdge+1)%spec.points.length][2]))/2:sorted[Math.floor((sorted.length-1)/2)],overallTop=floor+spec.height,top=overallTop-upperRailZone;
  // Wall bottoms follow local terrain; a shared roof plane never introduces
  // an artificial multi-metre stone podium on the sloping neighborhood.
  for(let i=0;i<spec.points.length;i++){
   const a=spec.points[i],b=spec.points[(i+1)%spec.points.length],dx=b[0]-a[0],dz=b[2]-a[2],length=Math.hypot(dx,dz);if(length<.01)continue;
   const sections=Math.max(1,Math.ceil(length/2));
   for(let j=0;j<sections;j++){
    const t0=j/sections,t1=(j+1)/sections,x0=a[0]+dx*t0,z0=a[2]+dz*t0,x1=a[0]+dx*t1,z1=a[2]+dz*t1,cx=(x0+x1)/2,cz=(z0+z1)/2,base=Math.min(ground(x0,z0),ground(x1,z1),ground(cx,cz))-.04,yaw=Math.atan2(-dz,dx),w=length/sections;
    box(w,Math.max(.1,top-base),.12,cx,(top+base)/2,cz,gishikiden?gishikidenRecess:plaster,yaw);box(w,.16,.16,cx,base+.06,cz,stone,yaw);
    colliders.push({type:'box',args:[cx,cz,w/2,.12,yaw,base,overallTop,'mapped_entrance_'+spec.id.split('/')[1]]});
   }
   const yaw=Math.atan2(-dz,dx);box(length,.14,.22,(a[0]+b[0])/2,top-.03,(a[2]+b[2])/2,gishikiden?gishikidenConcrete:eave,yaw);
   if(gishikiden){
    // Twenty closely spaced facade-screen fins are NOT twenty storeys.
    // All dimensions scale with the explicit overall-height estimate.
    const first=spec.height*.1875,last=spec.height-upperRailZone-.08;
    for(let band=0;band<20;band++){
     const level=floor+first+(last-first)*band/19;
     box(length,.15,.34,(a[0]+b[0])/2,level,(a[2]+b[2])/2,gishikidenConcrete,yaw);
    }
    // The photographs show daylight between the upper rails; do not fill
    // that zone with an additional solid floor or white parapet box.
    for(const fraction of [.20,.56,.92])box(length,.13,.30,(a[0]+b[0])/2,top+upperRailZone*fraction,(a[2]+b[2])/2,gishikidenConcrete,yaw);
   }
  }
  if(gishikiden){
   const seen=new Set();
   for(let i=0;i<spec.points.length;i++){
    const previous=spec.points[(i+spec.points.length-1)%spec.points.length],p=spec.points[i],next=spec.points[(i+1)%spec.points.length],v0=[p[0]-previous[0],p[2]-previous[2]],v1=[next[0]-p[0],next[2]-p[2]],l0=Math.hypot(...v0),l1=Math.hypot(...v1),turn=Math.abs(v0[0]*v1[1]-v0[1]*v1[0])/Math.max(1e-8,l0*l1),key=p[0]+','+p[2];
    // Only substantial changes of direction receive projecting uprights;
    // tiny offsets in the OSM ring do not become invented structural piers.
    if(l0<3||l1<3||turn<.25||seen.has(key))continue;seen.add(key);
    const base=ground(p[0],p[2]),height=overallTop-base;
    box(.31,height,.31,p[0],base+height/2,p[2],gishikidenConcrete,0);
   }
   facadeDetails.push({id:spec.id,reference:'IMG_6470_20210313 and IMG_7524_20210405',overallHeight:spec.height,heightStatus:'photo-based estimate for two-view review',closedMassHeight:spec.height-upperRailZone,screenFinRows:20,openUpperRails:3,internalStoreys:'unverified; fins are not floor counts',footprintPreserved:true});
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
  if(spec.id==='way/260121332'){
   // The photographed dark tiled gable runs parallel to the verified NE
   // frontage. Split the exact concave polygon at the ridge before triangulating:
   // no triangle bridges both pitches and no rectangular roof fills its notches.
   const a=spec.points[1],b=spec.points[2],dx=b[0]-a[0],dz=b[2]-a[2],length=Math.hypot(dx,dz),ux=dx/length,uz=dz/length;
   const local=p=>[(p[0]-a[0])*ux+(p[2]-a[2])*uz,-(p[0]-a[0])*uz+(p[2]-a[2])*ux];
   const plan=spec.points.map(p=>local(p)),depth=Math.max(...plan.map(p=>p[1])),ridge=depth/2,rise=1.65,eaveY=top+.045;
   const world=(u,v)=>[a[0]+ux*u-uz*v,a[2]+uz*u+ux*v];
   const roofY=v=>eaveY+rise*(1-Math.abs(v-ridge)/ridge);
   const clip=(ring,bound,less)=>{
    const out=[];for(let i=0;i<ring.length;i++){
     const p=ring[i],q=ring[(i+1)%ring.length],pin=less?p[1]<=bound+1e-8:p[1]>=bound-1e-8,qin=less?q[1]<=bound+1e-8:q[1]>=bound-1e-8;
     if(pin)out.push(p);if(pin!==qin){const t=(bound-p[1])/(q[1]-p[1]);out.push([p[0]+t*(q[0]-p[0]),bound]);}
    }return out;
   };
   const surface=[];
   for(const less of [true,false]){
    const half=clip(plan,ridge,less),contour=half.map(p=>new THREE.Vector2(...p));
    for(const tri of THREE.ShapeUtils.triangulateShape(contour,[])){
     const points=tri.map(i=>{const p=half[i],w=world(...p);return [w[0],roofY(p[1]),w[1]];});
     const [p,q,r]=points,ny=(q[2]-p[2])*(r[0]-p[0])-(q[0]-p[0])*(r[2]-p[2]);
     for(const index of ny>=0?[0,1,2]:[0,2,1])surface.push(...points[index]);
    }
   }
   const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(surface,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(surface.flatMap((_,i)=>i%3===0?[surface[i]/2,surface[i+2]/2]:[]),2));geo.computeVertexNormals();part(geo,minamiRoof);
   const beam=(p,q,radius,mat)=>{
    const av=new THREE.Vector3(...p),bv=new THREE.Vector3(...q),v=bv.clone().sub(av),g=new THREE.CylinderGeometry(radius,radius,v.length(),6);g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),v.normalize()));g.translate(...av.add(bv).multiplyScalar(.5).toArray());part(g,mat);
   };
   const gables=[];
   for(let i=0;i<plan.length;i++){
    const p=plan[i],q=plan[(i+1)%plan.length],segments=[p];
    if((p[1]-ridge)*(q[1]-ridge)<0){const t=(ridge-p[1])/(q[1]-p[1]);segments.push([p[0]+t*(q[0]-p[0]),ridge]);}segments.push(q);
    for(let j=1;j<segments.length;j++){
     const p0=segments[j-1],p1=segments[j],w0=world(...p0),w1=world(...p1),v0=[w0[0],eaveY,w0[1]],v1=[w1[0],eaveY,w1[1]],t0=[w0[0],roofY(p0[1]),w0[1]],t1=[w1[0],roofY(p1[1]),w1[1]];
     for(const v of [v0,t0,v1,v1,t0,t1])gables.push(...v);
    }
   }
   const gg=new THREE.BufferGeometry();gg.setAttribute('position',new THREE.Float32BufferAttribute(gables,3));gg.setAttribute('uv',new THREE.Float32BufferAttribute(gables.flatMap((_,i)=>i%3===0?[gables[i]/2,gables[i+1]/2]:[]),2));gg.computeVertexNormals();part(gg,minamiTimber);
   // Modest longitudinal ceramic ribs are clipped to the actual roof polygon.
   // Each ridge-parallel clipping strip yields only in-footprint tile courses.
   const umin=Math.min(...plan.map(p=>p[0])),umax=Math.max(...plan.map(p=>p[0]));
   for(let u=umin+.12;u<umax;u+=.26){
    const cuts=[];for(let i=0;i<plan.length;i++){const p=plan[i],q=plan[(i+1)%plan.length];if((p[0]<=u&&q[0]>u)||(q[0]<=u&&p[0]>u)){const t=(u-p[0])/(q[0]-p[0]);cuts.push(p[1]+t*(q[1]-p[1]));}}
    cuts.sort((a,b)=>a-b);
    for(let i=0;i+1<cuts.length;i+=2){const breaks=[cuts[i],...(cuts[i]<ridge&&cuts[i+1]>ridge?[ridge]:[]),cuts[i+1]];for(let j=1;j<breaks.length;j++){const v0=breaks[j-1],v1=breaks[j],p=world(u,v0),q=world(u,v1);beam([p[0],roofY(v0)+.018,p[1]],[q[0],roofY(v1)+.018,q[1]],.027,minamiTile);}}
   }
   const ridgeCuts=[];for(let i=0;i<plan.length;i++){const p=plan[i],q=plan[(i+1)%plan.length];if((p[1]<=ridge&&q[1]>ridge)||(q[1]<=ridge&&p[1]>ridge)){const t=(ridge-p[1])/(q[1]-p[1]);ridgeCuts.push(p[0]+t*(q[0]-p[0]));}}
   ridgeCuts.sort((a,b)=>a-b);for(let i=0;i+1<ridgeCuts.length;i+=2){const p=world(ridgeCuts[i],ridge),q=world(ridgeCuts[i+1],ridge);beam([p[0],eaveY+rise+.055,p[1]],[q[0],eaveY+rise+.055,q[1]],.075,minamiTile);}
   roofDetails.push({id:spec.id,form:'photographed grey tiled gable parallel to NE public facade',estimatedRise:rise,footprintClipped:true,splitAtRidge:true});
  }else{
   const shape=new THREE.Shape();spec.points.forEach((p,i)=>i?shape.lineTo(p[0],-p[2]):shape.moveTo(p[0],-p[2]));shape.closePath();const cap=new THREE.ShapeGeometry(shape);cap.rotateX(-Math.PI/2);cap.translate(0,top+.045,0);part(cap,roof);
  }
  builtIds.push(spec.id);
 }
 for(const [material,parts]of batches){const geometry=mergeGeometries(parts);parts.forEach(g=>g.dispose());const mesh=new THREE.Mesh(geometry,material);mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);}
 group.userData={sourceIds:builtIds,roofDetails,facadeDetails,heights:layout.records.map(r=>({id:r.id,height:r.height,source:r.heightSource})),skippedLegacyShopOverlap:layout.skippedLegacyShopOverlap,provenance:'Exact OSM wall/roof footprints; tag heights/storeys where available, otherwise estimated4.5m; neutral caps are not verified roof forms/facades'};
 root.add(group);return {group,builtIds,skippedLegacyShopOverlap:layout.skippedLegacyShopOverlap};
}
