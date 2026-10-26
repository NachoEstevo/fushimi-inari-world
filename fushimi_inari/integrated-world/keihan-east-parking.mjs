import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {clipMitsuTerrain} from './mitsu-frontage-aprons.mjs';
import {pathWidth} from '../geography/geo-core.mjs';

// July 2019 visitor panorama, camera 34.96828,135.76932 => [-305.601,-126.904].
// https://www.google.com/maps/@?api=1&map_action=pano&pano=CIHM0ogKEICAgICU_I3zQQ
// Inspected reference: .tmp/keihan-exit-parking-reference.png.
// This is the EAST-of-tracks lot. Its extent is inferred inside the source
// shop542 / apartment768 / rail boundaries; it has no mapped parking-way ID.
export const KEIHAN_EAST_PARKING_RING=[[-309.4,-128],[-297.6,-119],[-297.6,-88.2],[-309.4,-88.2]];
const anchors={'way/305213542':[-294.661,-106.383],'way/768795455':[-300.773,-77.211]};

export function buildKeihanEastParking(root,features,surfaces,materials={},colliders=[]){
 const name='Photo-supported Keihan east parking',existing=root.getObjectByName(name);
 if(existing)return {group:existing,...existing.userData};
 if(typeof surfaces?.terrainHeight!=='function')return {built:false,reason:'terrain support unavailable'};
 for(const [id,center]of Object.entries(anchors)){
  const points=features?.buildings?.find(b=>b.id===id)?.points?.slice(0,-1);
  if(!points?.length)return {built:false,reason:'source boundary unavailable'};
  const mean=[0,2].map(axis=>points.reduce((n,p)=>n+p[axis],0)/points.length);
  if(Math.hypot(mean[0]-center[0],mean[1]-center[1])>.1)return {built:false,reason:'source boundary changed'};
 }
 const ring=KEIHAN_EAST_PARKING_RING.map(p=>[...p]),nearby=(surfaces.segments??[]).filter(s=>Math.max(s.a[0],s.b[0])>-315&&Math.min(s.a[0],s.b[0])<-292&&Math.max(s.a[2],s.b[2])>-135&&Math.min(s.a[2],s.b[2])<-85);
 if(!nearby.some(s=>s.id==='way/946510942'))return {built:false,reason:'street access boundary unavailable'};
 const height=(x,z)=>{
  let y=surfaces.terrainHeight(x,z)+.025,best=null;
  for(const s of nearby){const dx=s.b[0]-s.a[0],dz=s.b[2]-s.a[2],length2=dx*dx+dz*dz;if(length2<1e-8)continue;
   const t=Math.max(0,Math.min(1,((x-s.a[0])*dx+(z-s.a[2])*dz)/length2)),distance=Math.hypot(x-s.a[0]-dx*t,z-s.a[2]-dz*t),edge=distance-s.width/2-.13;
   if(edge<3&&(!best||edge<best.edge))best={edge,y:s.ya+(s.yb-s.ya)*t+(s.curbLip??.025)+.003};
  }
  if(best){const weight=1-Math.max(0,best.edge)/3;y=y*(1-weight)+best.y*weight;}return y;
 };
 const cuts=[];
 for(const b of features.buildings??[]){
  if(!b.points.some(p=>p[0]>-315&&p[0]<-292&&p[2]>-135&&p[2]<-85))continue;
  const p=b.points.slice(0,-1).map(v=>new THREE.Vector2(v[0],v[2]));
  for(const triangle of THREE.ShapeUtils.triangulateShape(p,[]))cuts.push(triangle.map(i=>p[i].toArray()));
 }
 for(const s of nearby){const dx=s.b[0]-s.a[0],dz=s.b[2]-s.a[2],len=Math.hypot(dx,dz);if(len<1e-8)continue;const radius=s.width/2+.13,nx=-dz/len*radius,nz=dx/len*radius;cuts.push([[s.a[0]+nx,s.a[2]+nz],[s.b[0]+nx,s.b[2]+nz],[s.b[0]-nx,s.b[2]-nz],[s.a[0]-nx,s.a[2]-nz]]);}
 // Preserve both emitted ribbons and the original mapped corridor at bends.
 for(const path of features.paths??[])for(let i=1;i<path.points.length;i++){
  const a=path.points[i-1],b=path.points[i];if(Math.max(a[0],b[0])<-315||Math.min(a[0],b[0])>-292||Math.max(a[2],b[2])<-135||Math.min(a[2],b[2])>-85)continue;
  const dx=b[0]-a[0],dz=b[2]-a[2],len=Math.hypot(dx,dz);if(len<1e-8)continue;const radius=pathWidth(path.tags??{})/2+.13,nx=-dz/len*radius,nz=dx/len*radius;
  cuts.push([[a[0]+nx,a[2]+nz],[b[0]+nx,b[2]+nz],[b[0]-nx,b[2]-nz],[a[0]-nx,a[2]-nz]]);
  for(const p of [a,b])if(p[0]>-315&&p[0]<-292&&p[2]>-135&&p[2]<-85){const r=radius/Math.cos(Math.PI/12);cuts.push(Array.from({length:12},(_,j)=>[p[0]+Math.cos(j*Math.PI/6)*r,p[2]+Math.sin(j*Math.PI/6)*r]));}
 }
 if(!ring.every(p=>Number.isFinite(height(...p))))return {built:false,reason:'nonfinite terrain support'};
 const group=new THREE.Group();group.name=name;
 const asphalt=new THREE.MeshStandardMaterial({color:'#484a45',roughness:.98}),paint=new THREE.MeshStandardMaterial({color:'#c9c5b1',roughness:.95}),concrete=new THREE.MeshStandardMaterial({color:'#8b8c7f',roughness:.95}),metal=new THREE.MeshStandardMaterial({color:'#626b62',roughness:.8});
 const batches=new Map(),pending=[];
 const put=(g,m)=>{if(!batches.has(m))batches.set(m,[]);batches.get(m).push(g.index?g.toNonIndexed():g);if(g.index)g.dispose();};
 const box=(w,h,d,x,y,z,m)=>put(new THREE.BoxGeometry(w,h,d).translate(x,y,z),m);
 const surfacePositions=[];
 // A small shared grid follows existing ground rather than spanning a 27m
 // terrain slope with one flat plate. Nothing replaces or flattens terrain.
 const point=(u,v)=>{const x=ring[0][0]+(ring[1][0]-ring[0][0])*u,front=ring[0][1]+(ring[1][1]-ring[0][1])*u,z=front+(ring[2][1]-front)*v;return [x,height(x,z),z];};
 for(let x=0;x<8;x++)for(let z=0;z<18;z++){
  const a=point(x/8,z/18),b=point((x+1)/8,z/18),c=point((x+1)/8,(z+1)/18),d=point(x/8,(z+1)/18);
  surfacePositions.push(...a,...c,...b,...a,...d,...c);
 }
 const clipped=clipMitsuTerrain(surfacePositions,cuts);
 // Clipping introduces street-edge vertices. Resample their final grade so
 // the access mouth meets the emitted curb edge without a second paving layer.
 for(let i=0;i<clipped.length;i+=3)clipped[i+1]=height(clipped[i],clipped[i+2]);
 const surface=new THREE.BufferGeometry();surface.setAttribute('position',new THREE.Float32BufferAttribute(clipped,3));surface.computeVertexNormals();
 put(surface,asphalt);
 // Five inferred stalls face the railway. Markings and stops stay in the lot;
 // the south entry is left open, with no invented fee sign, gate or parked car.
 const stalls=[];
 for(let i=0;i<5;i++){
  const z=-102.8+i*2.6,x=-306.6;stalls.push({x,z,width:2.6,depth:4.8});
  for(const dz of [-1.25,1.25])for(let dash=0;dash<4;dash++){
   const px=-309.0+.25+dash*1.15,pz=z+dz;
   box(.68,.014,.075,px,height(px,pz)+.015,pz,paint);
  }
  box(.16,.09,1.45,-308.65,height(-308.65,z)+.045,z,concrete);
 }
 // Photo-confirmed rear fence category. Exact post count/height are estimates;
 // no fence is added along the public entry or mapped street/sidewalk.
 const fenceZ=-88.4;
 for(let i=0;i<7;i++){
  const x=-309.2+i*1.9,y=height(x,fenceZ);
  box(.045,1.05,.045,x,y+.525,fenceZ,metal);
 }
 for(const dy of [.22,.83])box(11.4,.035,.035,-303.5,height(-303.5,fenceZ)+dy,fenceZ,metal);
 const base=height(-303.5,fenceZ);pending.push({type:'box',args:[-303.5,fenceZ,5.72,.035,0,base,base+1.05,'keihan_east_parking_rear_fence']});
 for(const [material,parts]of batches){const geometry=mergeGeometries(parts);for(const part of parts)part.dispose();const mesh=new THREE.Mesh(geometry,material);mesh.receiveShadow=true;group.add(mesh);}
 const report={built:true,builtIds:[],ring,stalls,drawBatches:group.children.length,triangles:group.children.reduce((n,m)=>n+m.geometry.attributes.position.count/3,0),collidersAdded:pending.length,sourceDate:'July 2019',sourceCamera:{lat:34.96828,lon:135.76932,x:-305.601,z:-126.904},sourcePano:'CIHM0ogKEICAgICU_I3zQQ',provenance:'Visitor panorama shows asphalt parking east of railway, west of yellow-awning shop, with dashed stalls, stops and rear fence. Source building footprints bound the patch; no OSM parking polygon exists here.',inferred:'Inset lot extent, five stall dimensions/count, paint wear/color and fence details inferred from dated photograph, not surveyed or current-condition claims. Exact existing building footprints, railway and public routes retained. No new building, vehicle, public-access claim, gate, sign, light or walk surface provider.'};
 group.userData=report;root.add(group);colliders.push(...pending);return {group,...report};
}
