import * as THREE from 'three';
import {staticParts} from './mountain-landmarks-geometry.mjs';
import {teaHouses} from './yotsutsuji.mjs';

const NAME='Yotsutsuji registered tea-house frontage context R95';
// Ring vertices identify existing facades, not newly surveyed canopies.
const sources=[
 {id:'way/301527779',edge:0,a:[804.023,-212.186],b:[804.014,-202.290],facing:'west'},
 {id:'way/626313775',edge:7,a:[795.156,-209.470],b:[800.958,-209.459],facing:'north'},
];

export function yotsutsujiContextPlanR95(features){
 const frames=[];
 for(const s of sources){
  const building=features.buildings?.find(b=>b.id===s.id),spec=teaHouses.find(b=>b.id===s.id);
  const a=building?.points[s.edge],b=building?.points[s.edge+1];
  if(!a||!b||!spec||Math.hypot(a[0]-s.a[0],a[2]-s.a[1])>.02||Math.hypot(b[0]-s.b[0],b[2]-s.b[1])>.02)return null;
  const dx=b[0]-a[0],dz=b[2]-a[2],length=Math.hypot(dx,dz);
  // Main west + annex north form the observed L-shaped sitting court. Their
  // perpendicular normals follow each actual ring, not world-axis rectangles.
  let normal=[dz/length,-dx/length];
  if(s.facing==='west'?normal[0]>0:normal[1]>0)normal=normal.map(v=>-v);
  frames.push({id:s.id,edge:s.edge,length,floor:spec.floor,
   world:(u,v,h)=>[a[0]+dx*u/length+normal[0]*v,spec.floor+h,a[2]+dz*u/length+normal[1]*v]});
 }
 return frames;
}

/** Call after buildYotsutsuji. Adds only attached above-head frontage parts.
 * Paths, retaining bank, floors, public furniture and all colliders stay owned
 * by their existing builders. No new shop, stair or viewpoint is introduced.
 */
export function buildYotsutsujiContextR95(root,features,materials={}){
 const previous=root.getObjectByName(NAME);if(previous)return previous.userData;
 if(!root.getObjectByName('Yotsutsuji mapped tea houses'))return {built:false,reason:'Existing tea-house owner required'};
 const frames=yotsutsujiContextPlanR95(features);if(!frames)return {built:false,reason:'Unrecognized mapped facade rings'};
 const group=new THREE.Group();group.name=NAME;
 const parts=staticParts(group);
 const dark=new THREE.MeshStandardMaterial({color:'#243e30',roughness:.96,side:THREE.DoubleSide});
 const pale=new THREE.MeshStandardMaterial({color:'#79977b',roughness:.96,side:THREE.DoubleSide});
 const metal=new THREE.MeshStandardMaterial({color:'#7b7e71',metalness:.30,roughness:.66});
 // Opaque pale polycarbonate avoids stacked transparency sorting in the main
 // scene. The photograph establishes translucent cover; exact transmission
 // is unmeasured, and this inexpensive approximation remains explicit.
 const cover=new THREE.MeshStandardMaterial({color:'#c3c9bc',roughness:.72,side:THREE.DoubleSide});
 const cloth=new THREE.MeshStandardMaterial({color:'#432d31',roughness:1,side:THREE.DoubleSide});
 const quad=(a,b,c,d,m)=>parts.sheet([...a,...b,...c,...a,...c,...d],m);
 const line=(a,b,r,m)=>parts.beam(a,b,r,m,r,6);
 const [main,annex]=frames;
 const awnings=[];
 const awning=(start,end,back,front,projection,drop,label)=>{
  const count=Math.ceil((end-start)/.28);
  for(let i=0;i<count;i++){
   const a=start+(end-start)*i/count,b=start+(end-start)*(i+1)/count,m=i%2?dark:pale;
   quad(main.world(a,.19,back),main.world(b,.19,back),main.world(b,projection,front),main.world(a,projection,front),m);
   quad(main.world(a,projection,front),main.world(b,projection,front),main.world(b,projection,front-drop),main.world(a,projection,front-drop),m);
  }
  line(main.world(start,.15,back),main.world(end,.15,back),.033,metal);
  for(const u of [start,end])line(main.world(u,.18,back-.18),main.world(u,projection,front-.035),.024,metal);
  awnings.push({label,start,end,projection,minHeight:front-drop});
 };
 // New skins sit above the owner's 2.8m plain eave; they do not intersect its
 // horizontal slab or overwrite its facade/windows. All sizes inferred.
 awning(.30,main.length-.30,3.18,3.03,1.12,.20,'ground-floor striped awning');
 for(const [lo,hi]of [[.07,.43],[.57,.93]])awning(main.length*lo,main.length*hi,5.20,5.09,.42,.18,'upper-window striped shade');

 // The single-storey sitting frontage in the paired photograph has a light
 // panel roof, thin metal perimeter/rafters and dark split noren curtains.
 // Keep its frame on the mapped annex frontage; cantilever braces attach to
 // the shell and introduce no poles across the neighbouring public stair.
 const start=.16,end=annex.length-.16,projection=1.25;
 const bays=Math.ceil((end-start)/.72);
 for(let i=0;i<bays;i++){
  const a=start+(end-start)*i/bays,b=start+(end-start)*(i+1)/bays;
  quad(annex.world(a,.14,3.20),annex.world(b,.14,3.20),annex.world(b,projection,3.07),annex.world(a,projection,3.07),cover);
 }
 for(let i=0;i<=bays;i++){
  const u=start+(end-start)*i/bays;
  line(annex.world(u,.12,3.21),annex.world(u,projection,3.08),.028,metal);
 }
 for(const [v,h]of [[.12,3.21],[projection,3.08]])line(annex.world(start,v,h),annex.world(end,v,h),.035,metal);
 for(const u of [start,end])line(annex.world(u,.14,2.63),annex.world(u,projection,3.05),.026,metal);
 const curtains=8;
 for(let i=0;i<curtains;i++){
  const a=start+(end-start)*i/curtains+.025,b=start+(end-start)*(i+1)/curtains-.025;
  quad(annex.world(a,.25,2.69),annex.world(b,.25,2.69),annex.world(b,.29,2.18),annex.world(a,.29,2.18),cloth);
 }
 const stats=parts.flush();
 group.userData={built:true,stats,facades:frames.map(({id,edge,length,floor})=>({id,edge,length,floor})),awnings,canopy:{projection,bays,minHeight:3.07},curtains,
  collidersAdded:0,terrainChanged:false,
  sources:['https://zekkeikana.com/kyoto/fusimiku/fushimiinari/yotsutsuji13.jpg','https://zekkeikana.com/kyoto/fusimiku/fushimiinari/yotsutsuji14.jpg'],
  limits:'Photographs dated 17 February 2013; ring registration, dimensions, striped intervals and cloth count inferred. Opaque pale panel approximation of translucent cover. No source photograph textures, lettering, new steps, retaining extension or skyline.'};
 root.add(group);return group.userData;
}
