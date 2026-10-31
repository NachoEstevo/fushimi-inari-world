import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {pathWidth} from '../geography/geo-core.mjs';

const NAME='Mapped lateral route landmarks';
export const lateralConnections=Object.freeze([
 {id:'kiyotaki',destination:'清瀧',pathIds:['way/60272187','way/1269260660','way/626313700'],source:'https://inari.jp/en/map/spot_16/'},
 {id:'kandakara',destination:'伏見神宝神社',pathIds:['way/105449704','way/127324643','way/1268326291'],source:'https://kandakara.jp/top/introduction/'},
 {id:'kojingamine',destination:'荒神峰',pathIds:['way/1268937963','way/1268937962','way/60272186'],source:'https://inari.jp/en/map/spot_17/'}
]);
const landmarks=[
 {id:'node/11789242337',path:'way/1269260660',radius:.29,kind:'stele'},
 {id:'node/11780081678',path:'way/1268326291',radius:.29,kind:'stele'},
 {id:'node/9673171295',path:'way/1052553392',radius:.85,kind:'map'}
];
// Location, material and inscription: OSM node/11789242337. The official
// shrine describes the Gozendani–Kiyotaki connection at /en/map/spot_16/.
// Section, height and face orientation are inferred; no path is relocated.
export function buildLateralWaymarkers(root,features,surfaces,materials,colliders){
 const old=root.getObjectByName(NAME);if(old)return old.userData;
 const group=new THREE.Group();group.name=NAME;
 const result={markers:[],connections:lateralConnections.map(c=>({...c,pathIds:[...c.pathIds]})),provenance:'OSM position/material/inscription; inferred dimensions and face orientation'};
 group.userData=result;root.add(group);
 for(const spec of landmarks){
 const marker=features.pois.find(p=>p.id===spec.id);
 const route=features.paths.find(p=>p.id===spec.path);
 const stone=materials.entryStoneMat??materials.stoneMat;
 if(!marker||!route||!stone)continue;
 const [x,,z]=marker.point;
 let closest=null,clearance=Infinity;
 for(const path of features.paths){
  for(let i=1;i<path.points.length;i++){
   const a=path.points[i-1],b=path.points[i],dx=b[0]-a[0],dz=b[2]-a[2];
   const t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[2])*dz)/(dx*dx+dz*dz||1)));
   const q=[a[0]+t*dx,a[2]+t*dz],distance=Math.hypot(x-q[0],z-q[1]);
   clearance=Math.min(clearance,distance-pathWidth(path.tags)/2-spec.radius);
   if(path===route&&(!closest||distance<closest.distance))closest={point:q,distance};
  }
 }
 if(!closest||clearance<.6)continue;
 const y=surfaces.height(x,z),height=1.42;
 const yaw=Math.atan2(closest.point[0]-x,closest.point[1]-z);
 if(spec.kind==='map'){
  addJunctionMap(group,marker,features,surfaces,stone,yaw,colliders);
  result.markers.push({id:marker.id,pathId:route.id,point:[x,y,z],clearance,kind:'map',content:'Original schematic of existing OSM paths; not a reproduction of the installed map',dimensionsInferred:true});
  continue;
 }
 const parts=[new THREE.BoxGeometry(.58,.16,.52).translate(0,.08,0),new THREE.BoxGeometry(.29,height,.24).translate(0,height/2+.16,0)];
 const geometry=mergeGeometries(parts);parts.forEach(g=>g.dispose());
 const mesh=new THREE.Mesh(geometry,stone);mesh.position.set(x,y,z);mesh.rotation.y=yaw;
 mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);
 if(typeof document!=='undefined'){
  const canvas=document.createElement('canvas');canvas.width=256;canvas.height=1024;
  const ctx=canvas.getContext('2d');
  if(ctx){
   // Transparent ink preserves the existing shared stone material beneath it.
   ctx.fillStyle='#343733';ctx.textAlign='center';ctx.font='54px serif';
   const letters=[...marker.tags.name.replaceAll(' ','')];
   const lineHeight=Math.min(180,850/letters.length);
   ctx.font=`${Math.min(54,lineHeight*.8)}px serif`;
   letters.forEach((c,i)=>ctx.fillText(c,128,100+i*lineHeight));
   const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;
   const ink=new THREE.Mesh(new THREE.PlaneGeometry(.27,1.32),new THREE.MeshStandardMaterial({map,transparent:true,roughness:1,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1}));
   ink.position.set(0,.9,.121);mesh.add(ink);
  }
 }
 colliders.push({type:'box',args:[x,z,.29,.26,yaw,y,y+height+.16,spec.id+'_stone_waymarker']});
 result.markers.push({id:marker.id,pathId:route.id,point:[x,y,z],inscription:marker.tags.name,clearance,dimensionsInferred:true});
 }
 return result;
}

const MAP_DESTINATIONS=[
 {id:'way/301527741',name:'熊鷹社'},
 {id:'way/301554315',name:'御膳谷奉拝所'},
 {id:'way/626313728',name:'一ノ峰'},
 {id:'way/626313751',name:'三ノ峰'}
];
// Names and locations come from mapped POIs; the official shrine map confirms
// the destination names. Projection is geographic, not a claimed route guide.
export function yotsutsujiMapDestinations(features){
 return MAP_DESTINATIONS.flatMap(spec=>{
  const poi=features.pois.find(p=>p.id===spec.id);
  return poi?.point?[{...spec,point:poi.point.slice()}]:[];
 });
}

function addJunctionMap(group,marker,features,surfaces,stone,yaw,colliders){
 const [x,,z]=marker.point,y=surfaces.height(x,z),frame=new THREE.Group();
 frame.position.set(x,y,z);frame.rotation.y=yaw;group.add(frame);
 const parts=[new THREE.BoxGeometry(1.65,1.12,.10).translate(0,1.45,0)];
 for(const side of [-1,1])parts.push(new THREE.BoxGeometry(.09,1.06,.12).translate(side*.69,.53,0));
 const geometry=mergeGeometries(parts);parts.forEach(p=>p.dispose());
 const mesh=new THREE.Mesh(geometry,stone);mesh.castShadow=mesh.receiveShadow=true;frame.add(mesh);
 if(typeof document!=='undefined'){
  const canvas=document.createElement('canvas');canvas.width=768;canvas.height=512;
  const ctx=canvas.getContext('2d');
  if(ctx){
   ctx.fillStyle='#e0ddcd';ctx.fillRect(0,0,768,512);
   ctx.fillStyle='#292e2a';ctx.font='32px serif';ctx.textAlign='center';ctx.fillText('四ツ辻周辺案内図',384,46);
   // An original schematic derived from the existing metric network. Lines
   // outside the local diagram are clipped, never attached to invented nodes.
   ctx.save();ctx.beginPath();ctx.rect(24,65,720,420);ctx.clip();
   const project=p=>[384+(p[0]-x)*.68,275+(p[2]-z)*.68];
   ctx.strokeStyle='#786550';ctx.lineWidth=5;
   for(const path of features.paths){
    if(!path.points.some(p=>Math.abs(p[0]-x)<530&&Math.abs(p[2]-z)<300))continue;
    ctx.beginPath();path.points.forEach((p,i)=>{const q=project(p);if(i)ctx.lineTo(...q);else ctx.moveTo(...q);});ctx.stroke();
   }
   ctx.fillStyle='#a32f26';ctx.beginPath();ctx.arc(384,275,8,0,Math.PI*2);ctx.fill();
   ctx.font='20px serif';ctx.fillText('現在地',384,304);
   ctx.textAlign='left';ctx.font='bold 19px serif';
   for(const destination of yotsutsujiMapDestinations(features)){
    const [px,py]=project(destination.point);
    if(px<35||px>725||py<80||py>460)continue;
    ctx.fillStyle='#8e332a';ctx.beginPath();ctx.arc(px,py,5,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#26332b';ctx.textAlign=px>570?'right':'left';ctx.fillText(destination.name,px+(px>570?-9:9),py-6);
   }
   ctx.fillStyle='#26332b';ctx.font='20px serif';ctx.textAlign='left';ctx.fillText('北 ↑',40,95);ctx.restore();
   const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;
   const panel=new THREE.Mesh(new THREE.PlaneGeometry(1.53,1.02),new THREE.MeshStandardMaterial({map,roughness:1}));
   panel.position.set(0,1.45,.051);frame.add(panel);
  }
 }
 colliders.push({type:'box',args:[x,z,.85,.12,yaw,y,y+2.02,'yotsutsuji_osm_map_landmark']});
}
