import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
export const entranceGuardhouseId='way/260121327';

// IMG7599 identifies the two-level white tiled-roof toilet building in the
// Gishikiden forecourt. Registration to the mapped guardhouse is inferred.
export function buildEntranceGuardhouseDetails(root,features,surfaces,materials,colliders){
 const feature=features.buildings.find(b=>b.id===entranceGuardhouseId);if(!feature)return null;
 const points=feature.points.slice(0,-1),group=new THREE.Group();group.name='Photo-registered guardhouse and public toilet facade';
 const plaster=new THREE.MeshStandardMaterial({color:'#deddd3',roughness:.96});
 const frame=new THREE.MeshStandardMaterial({color:'#3b433e',roughness:.87});
 const glazing=new THREE.MeshStandardMaterial({color:'#455550',roughness:.32,metalness:.15});
 const stone=(materials.entryStoneMat??materials.stoneMat).clone();stone.color.set('#96998f');stone.roughness=1;
 const roof=(materials.roofMat??frame).clone();roof.color.set('#747d7c');roof.side=THREE.DoubleSide;roof.roughness=.88;
 const batches=new Map();
 const put=(geo,mat)=>{if(geo.index){const old=geo;geo=old.toNonIndexed();old.dispose();}if(!batches.has(mat))batches.set(mat,[]);batches.get(mat).push(geo);};
 const box=(w,h,d,x,y,z,mat,yaw=0)=>put(new THREE.BoxGeometry(w,h,d).rotateY(yaw).translate(x,y,z),mat);
 const beam=(a,b,r,mat)=>{const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b),delta=bv.clone().sub(av),geo=new THREE.CylinderGeometry(r,r,delta.length(),7);geo.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize()));geo.translate(...av.add(bv).multiplyScalar(.5).toArray());put(geo,mat);};
 const a=points[11],b=points[8],length=Math.hypot(b[0]-a[0],b[2]-a[2]),ux=(b[0]-a[0])/length,uz=(b[2]-a[2])/length,yaw=-Math.atan2(uz,ux);
 const local=p=>[(p[0]-a[0])*ux+(p[2]-a[2])*uz,(p[0]-a[0])*uz-(p[2]-a[2])*ux];
 const world=(u,v)=>[a[0]+ux*u+uz*v,a[2]+uz*u-ux*v];
 const height=(x,z)=>{const y=surfaces.height(x,z);if(!Number.isFinite(y))throw Error('Nonfinite guardhouse surface');return y;};
 const frontFloor=height(...world(length*.55,-.10)),eave=frontFloor+5.08;
 for(let i=0;i<points.length;i++){
  const p=points[i],q=points[(i+1)%points.length],dx=q[0]-p[0],dz=q[2]-p[2],len=Math.hypot(dx,dz),mid=[(p[0]+q[0])/2,(p[2]+q[2])/2],floor=Math.min(height(p[0],p[2]),height(q[0],q[2]),height(...mid))-.05,angle=-Math.atan2(dz,dx);
  box(len,eave-floor,.12,mid[0],(floor+eave)/2,mid[1],plaster,angle);
  box(len,.9,.145,mid[0],floor+.45,mid[1],stone,angle);
  for(const y of [.12,.55,.88])box(len,.018,.15,mid[0],floor+y,mid[1],stone,angle);
  box(len,.15,.30,mid[0],eave-.03,mid[1],frame,angle);
  colliders.push({type:'box',args:[mid[0],mid[1],len/2,.12,angle,floor,eave,'guardhouse_mapped_wall']});
 }
 const faceBox=(w,h,d,u,y,out,mat)=>{const [x,z]=world(u,-out);box(w,h,d,x,frontFloor+y,z,mat,yaw);};
 // Only the photographed south frontage receives openings. Unseen sides stay
 // restrained; the panels are visual glazing, not a new traversable interior.
 faceBox(length-.18,1.02,.035,length/2,4.37,.085,glazing);
 for(let u=.10;u<length;u+=1.15)faceBox(.065,1.14,.07,u,4.37,.12,frame);
 for(const y of [3.81,4.92])faceBox(length,.09,.11,length/2,y,.12,frame);
 // Lower narrow lights occur in groups on the right side of the pictured door.
 for(const u of [5.7,6.8,9.1,11.3,12.15,13.0]){
  faceBox(.42,1.57,.04,u,1.89,.09,glazing);
  for(const side of [-1,1])faceBox(.045,1.65,.075,u+side*.225,1.89,.13,frame);
  for(const y of [1.08,2.71])faceBox(.50,.045,.075,u,y,.13,frame);
 }
 const doorU=3.7;
 faceBox(1.25,2.30,.045,doorU,1.18,.10,frame);
 faceBox(.86,2.03,.025,doorU,1.15,.13,glazing);
 for(const side of [-1,1])faceBox(.10,2.38,.18,doorU+side*.68,1.20,.18,stone);
 faceBox(1.5,.12,.30,doorU,2.38,.17,stone);
 // Small tiled canopy above the visible entrance, within existing wall bounds.
 const canopy=[];
 for(const [u,v,h]of [[doorU-1.0,-.12,2.92],[doorU+1.0,-.12,2.92],[doorU-1.0,-.85,2.57],[doorU+1.0,-.12,2.92],[doorU+1.0,-.85,2.57],[doorU-1.0,-.85,2.57]]){const p=world(u,v);canopy.push(p[0],frontFloor+h,p[1]);}
 const surface=(verts,mat)=>{const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(verts.flatMap((_,i)=>i%3===0?[verts[i]/2,verts[i+2]/2]:[]),2));geo.computeVertexNormals();put(geo,mat);};
 surface(canopy,roof);
 for(let u=doorU-.95;u<doorU+1;u+=.18){const p=world(u,-.12),q=world(u,-.85);beam([p[0],frontFloor+2.95,p[1]],[q[0],frontFloor+2.60,q[1]],.025,roof);}
 // Split the exact concave polygon at the ridge: no filled courtyard notches.
 const plan=points.map(local),minV=Math.min(...plan.map(p=>p[1])),maxV=Math.max(...plan.map(p=>p[1])),ridge=(minV+maxV)/2,rise=1.03;
 const roofY=v=>eave+rise*(1-Math.abs(v-ridge)/((maxV-minV)/2));
 const clip=(ring,less)=>{const out=[];for(let i=0;i<ring.length;i++){const p=ring[i],q=ring[(i+1)%ring.length],pin=less?p[1]<=ridge:p[1]>=ridge,qin=less?q[1]<=ridge:q[1]>=ridge;if(pin)out.push(p);if(pin!==qin){const t=(ridge-p[1])/(q[1]-p[1]);out.push([p[0]+t*(q[0]-p[0]),ridge]);}}return out;};
 for(const less of [true,false]){const ring=clip(plan,less),verts=[];for(const tri of THREE.ShapeUtils.triangulateShape(ring.map(p=>new THREE.Vector2(...p)),[]))for(const index of tri){const p=ring[index],w=world(...p);verts.push(w[0],roofY(p[1]),w[1]);}surface(verts,roof);}
 const gableFill=[];
 for(let i=0;i<plan.length;i++){
  const p=plan[i],q=plan[(i+1)%plan.length],segments=[p];
  if((p[1]-ridge)*(q[1]-ridge)<0){const t=(ridge-p[1])/(q[1]-p[1]);segments.push([p[0]+t*(q[0]-p[0]),ridge]);}segments.push(q);
  for(let j=1;j<segments.length;j++){
   const a=segments[j-1],b=segments[j],wa=world(...a),wb=world(...b);
   for(const v of [[wa[0],eave,wa[1]],[wa[0],roofY(a[1]),wa[1]],[wb[0],eave,wb[1]],[wb[0],eave,wb[1]],[wa[0],roofY(a[1]),wa[1]],[wb[0],roofY(b[1]),wb[1]]])gableFill.push(...v);
  }
 }
 surface(gableFill,plaster);
 const umin=Math.min(...plan.map(p=>p[0])),umax=Math.max(...plan.map(p=>p[0]));
 for(let u=umin+.12;u<umax;u+=.25){const cuts=[];for(let i=0;i<plan.length;i++){const p=plan[i],q=plan[(i+1)%plan.length];if((p[0]<=u&&q[0]>u)||(q[0]<=u&&p[0]>u)){const t=(u-p[0])/(q[0]-p[0]);cuts.push(p[1]+t*(q[1]-p[1]));}}cuts.sort((a,b)=>a-b);for(let i=0;i+1<cuts.length;i+=2){const breaks=[cuts[i],...(cuts[i]<ridge&&cuts[i+1]>ridge?[ridge]:[]),cuts[i+1]];for(let j=1;j<breaks.length;j++){const p=world(u,breaks[j-1]),q=world(u,breaks[j]);beam([p[0],roofY(breaks[j-1])+.02,p[1]],[q[0],roofY(breaks[j])+.02,q[1]],.028,roof);}}}
 for(const [mat,parts]of batches){const geo=mergeGeometries(parts);parts.forEach(p=>p.dispose());if(!geo)throw Error('Guardhouse merge failed');const mesh=new THREE.Mesh(geo,mat);mesh.castShadow=mesh.receiveShadow=true;group.add(mesh);}
 group.userData={sourceId:entranceGuardhouseId,sourcePhotos:['https://fushimiinari-guide.com/wp-content/uploads/IMG_7599_20210405.jpg','https://fushimiinari-guide.com/wp-content/uploads/IMG_7702_20210405.jpg'],provenance:'Exact mapped wall and roof footprint. Photo-registration of guide toilet building to OSM guardhouse is inferred from Gishikiden and forecourt context. Roof height, window spacing and door placement are estimates; south facade vocabulary observed, hidden side openings not invented. No historic signage reproduced.',estimatedEaveHeight:5.08,estimatedRoofRise:rise};
 root.add(group);return {group,id:entranceGuardhouseId};
}
export const builder=buildEntranceGuardhouseDetails;
