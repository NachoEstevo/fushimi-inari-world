import * as THREE from 'three';
import {staticParts,shide} from './mountain-landmarks-geometry.mjs';

export const okushaTemizuyaIdR102='way/1267862163';
export const okushaTemizuyaPhotoR102='https://stat.ameba.jp/user_images/20200601/23/shouta09/1a/b8/j/o0800045014767795377.jpg';
// Primary OSM node is filtered out of features.json (man_made=water_tap).
export const okushaTemizuyaTapR102=Object.freeze({id:'node/11775043282',point:Object.freeze([253.977,0,66.658]),source:'https://api.openstreetmap.org/api/0.6/node/11775043282.json'});

/** Exact mapped roof only. Caller must exclude returned builtIds from generic
 * context extrusion, and supply the final walk/terrain triangle height callback.
 * No exclusion is authorized when construction fails its support contract.
 */
export function buildOkushaMappedSheltersR102(root,features,materials,ground,colliders){
  if(root.children.some(o=>o.userData.okushaMappedSheltersR102))return null;
  const roof=features.buildings?.find(o=>o.id===okushaTemizuyaIdR102);
  const tap=features.pois?.find(o=>o.id===okushaTemizuyaTapR102.id)??okushaTemizuyaTapR102;
  if(roof?.points?.length!==5||typeof ground!=='function'||!Array.isArray(colliders))return null;
  const ring=roof.points.slice(0,-1),a=ring[0],b=ring[1],dx=b[0]-a[0],dz=b[2]-a[2],w=Math.hypot(dx,dz);
  if(!ring.every(p=>p.every(Number.isFinite))||w<2||w>3)return null;
  const ux=dx/w,uz=dz/w,vx=-uz,vz=ux;
  const local=p=>[(p[0]-a[0])*ux+(p[2]-a[2])*uz,(p[0]-a[0])*vx+(p[2]-a[2])*vz];
  const d=local(ring[2])[1],center=[w/2,d/2],tp=local(tap.point);
  if(d<1||d>2||tp[0]<0||tp[0]>w||tp[1]<0||tp[1]>d)return null;
  const world=(x,z)=>[a[0]+ux*x+vx*z,a[2]+uz*x+vz*z];
  const support=(x,z)=>ground(...world(x,z));
  const stations=[[.15,.15],[w-.15,.15],[w-.15,d-.15],[.15,d-.15]];
  const seats=stations.map(p=>support(...p));
  const basinPoints=[[-.72,-.49],[.72,-.49],[.72,.49],[-.72,.49]].map(p=>[center[0]+p[0],center[1]+p[1]]);
  const basinSeats=basinPoints.map(p=>support(...p));
  if([...seats,...basinSeats].some(y=>!Number.isFinite(y))||Math.max(...seats)-Math.min(...seats)>.6||Math.max(...basinSeats)-Math.min(...basinSeats)>.25)return null;
  const base=Math.min(...basinSeats)-.04,deck=Math.max(...basinSeats)+.06,eave=Math.max(...seats)+2.30,ridge=eave+.42;
  const group=new THREE.Group();group.name='Mapped Okusha hand-washing shelter R102';
  group.position.set(a[0],0,a[2]);group.rotation.y=-Math.atan2(uz,ux);
  group.userData={okushaMappedSheltersR102:true,osm:roof.id,source:okushaTemizuyaPhotoR102,
    provenance:'Exact mapped roof/tap; observed green gable, four timber posts and rounded basin. Heights/sections inferred; supports use final surface rays.'};
  const p=staticParts(group),wood=new THREE.MeshStandardMaterial({color:'#6c5845',roughness:.97}),
    copper=new THREE.MeshStandardMaterial({color:'#67877d',roughness:.86,metalness:.13,side:THREE.DoubleSide}),
    basin=new THREE.MeshStandardMaterial({color:'#876c57',roughness:.96}),
    dark=new THREE.MeshStandardMaterial({color:'#353b32',roughness:.94});
  const stone=materials.entryStoneMat,paper=materials.plasterMat;
  for(let i=0;i<stations.length;i++){
    const [x,z]=stations[i],y=seats[i];
    p.box(.20,.12,.20,x,y+.03,z,stone);p.box(.12,eave-y-.08,.12,x,(eave+y)/2-.04,z,wood);
    for(const sign of [-1,1]){
      const x2=x+sign*.20;if(x2<.1||x2>w-.1)continue;
      p.beam([x,eave-.38,z],[x2,eave-.05,z],.035,wood,.035,6);
    }
  }
  for(const z of [.15,d-.15])p.box(w-.12,.12,.13,w/2,eave-.04,z,wood);
  for(const x of [.15,w-.15])p.box(.12,.13,d-.1,x,eave-.02,d/2,wood);
  // Entire roof, including eaves, stays within the mapped roof polygon.
  for(const sign of [-1,1]){
    const z=sign<0?0:d;
    p.sheet([0,eave,z,w,eave,z,0,ridge,d/2,0,ridge,d/2,w,eave,z,w,ridge,d/2],copper);
    for(let k=1;k<10;k++){
      const t=k/10,zz=d/2+(z-d/2)*t,yy=ridge+(eave-ridge)*t;
      p.box(w,.018,.025,w/2,yy+.01,zz,copper);
    }
    p.box(w,.09,.06,w/2,eave-.025,z,wood);
  }
  p.box(w,.10,.11,w/2,ridge+.025,d/2,copper);
  for(const x of [.15,w-.15])for(const z of [0,d])p.beam([x,eave-.025,z],[x,ridge-.025,d/2],.038,wood,.038,6);
  // Mineral catchment is buried into all four sampled support corners.
  const [cx,cz]=center;
  p.box(1.48,deck-base,1.04,cx,(deck+base)/2,cz,stone);
  for(const z of [cz-.49,cz+.49])p.box(1.48,.16,.07,cx,deck+.08,z,stone);
  for(const x of [cx-.705,cx+.705])p.box(.07,.16,.91,x,deck+.08,cz,stone);
  const profile=[[0,0],[.48,0],[.62,.14],[.65,.36],[.59,.47],[.48,.45],[.44,.32],[0,.26]].map(q=>new THREE.Vector2(...q));
  const bowl=new THREE.LatheGeometry(profile,28);bowl.scale(1,1,.61);bowl.translate(cx,deck,cz);p.put(bowl,basin);
  p.put(new THREE.CylinderGeometry(.42,.42,.015,24).scale(1,1,.58).translate(cx,deck+.285,cz),dark);
  p.box(1.18,.045,.08,cx,deck+.50,cz,wood);
  p.box(.15,.19,.15,cx,deck+.58,cz,stone);
  p.put(new THREE.SphereGeometry(.085,10,6).translate(cx,deck+.73,cz),stone);
  // Paper folds beneath the source beam; no invented donor names or signs.
  for(const x of [w*.33,w*.67])shide(p,x,eave-.09,.17,.37,paper);
  const stats=p.flush();root.add(group);
  for(let i=0;i<stations.length;i++){
    const q=world(...stations[i]);colliders.push({type:'cylinder',args:[...q,.085,seats[i],eave,'okusha_temizuya_post_r102']});
  }
  const c=world(cx,cz);colliders.push({type:'box',args:[...c,.74,.52,group.rotation.y,base,deck+.82,'okusha_temizuya_basin_r102']});
  group.userData.stats=stats;
  return {group,builtIds:[roof.id],stats,posts:4,base,deck,eave,ridge,roofPoints:ring,postSeats:seats};
}
