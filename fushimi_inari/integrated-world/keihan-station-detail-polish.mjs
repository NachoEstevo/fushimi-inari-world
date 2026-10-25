import * as THREE from 'three';
import {staticParts} from './mountain-landmarks-geometry.mjs';

const OWNER='Keihan station directional detail';
export const KEIHAN_DETAIL_SOURCE='https://www.keihan.co.jp/travel/en/pdf/trains/information-for-travelers/Fushimi-inari.pdf';
// Official directions, original typography/layout. No live timetable or claim
// that the exact board dimensions were measured from the source plan.
export const KEIHAN_DETAIL_BOARDS=Object.freeze([
 {id:'osaka',number:'2',title:'淀屋橋・中之島方面',subtitle:'For Osaka · Yodoyabashi / Nakanoshima',footer:'Tambabashi  ·  Kyobashi  ·  Temmabashi'},
 {id:'kyoto',number:'1',title:'三条・出町柳方面',subtitle:'For Kyoto · Sanjo / Demachiyanagi',footer:'Gion-shijo  ·  Sanjo  ·  Demachiyanagi'},
 {id:'identity',number:'KH34',title:'伏見稲荷',subtitle:'Fushimi-inari',footer:'京阪電車  KEIHAN'}
]);

function atlas(){
 if(!globalThis.document?.createElement)return null;
 const canvas=document.createElement('canvas');canvas.width=1536;canvas.height=768;const c=canvas.getContext('2d');if(!c)return null;
 for(const [i,b]of KEIHAN_DETAIL_BOARDS.entries()){
  const y=i*256;c.fillStyle='#f1f0e8';c.fillRect(0,y,1536,256);c.fillStyle='#234a40';c.fillRect(0,y,240,256);c.fillRect(240,y+235,1296,21);
  c.textAlign='center';c.textBaseline='middle';c.fillStyle='#ffffff';c.font=`bold ${i===2?57:144}px sans-serif`;c.fillText(b.number,120,y+126,224);
  c.textAlign='left';c.fillStyle='#293a35';c.font='bold 65px sans-serif';c.fillText(b.title,280,y+62,1216);c.font='43px sans-serif';c.fillText(b.subtitle,280,y+139,1216);c.fillStyle='#59645e';c.font='30px sans-serif';c.fillText(b.footer,280,y+202,1216);
 }
 const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=4;return map;
}

export function buildKeihanStationDetailPolish(assembly){
 const station=assembly?.keihanStation;
 if(!station?.built||!station.group||!Number.isFinite(station.spec?.platformFloor))return {built:false,reason:'Keihan station owner unavailable',detailGroups:[]};
 const previous=station.group.getObjectByName(OWNER);if(previous)return previous.userData.report;
 const group=new THREE.Group();group.name=OWNER;group.userData.detailRadius=70;
 const parts=staticParts(group),frame=new THREE.MeshStandardMaterial({color:'#3b4448',metalness:.35,roughness:.65}),map=atlas();
 const print=new THREE.MeshBasicMaterial({color:map?'#ffffff':'#e3e9db',map,toneMapped:false,side:THREE.DoubleSide});
 const floor=station.spec.platformFloor,records=[];
 function board(index,position,yaw,width,height,suspended=false){
  const g=new THREE.Group();g.name=`Keihan ${KEIHAN_DETAIL_BOARDS[index].id} sign`;g.position.set(...position);g.rotation.y=yaw;group.add(g);
  const backing=new THREE.Mesh(new THREE.BoxGeometry(width+.07,height+.07,.075),frame);g.add(backing);
  const geometry=new THREE.PlaneGeometry(width,height),uv=geometry.attributes.uv;
  for(let i=0;i<uv.count;i++)uv.setY(i,(uv.getY(i)+2-index)/3);
  const face=new THREE.Mesh(geometry,print);face.position.z=.041;g.add(face);
  if(suspended)for(const side of [-1,1])parts.box(.025,.35,.025,position[0]+side*width*.37,position[1]+height/2+.175,position[2],frame);
  records.push({id:KEIHAN_DETAIL_BOARDS[index].id,position:[...position],yaw,width,height,source:KEIHAN_DETAIL_SOURCE,placement:'inferred inside existing canopy / wall envelope'});
 }
 // Suspended below existing canopy. Lowest edge > 2.4m; walking volumes
 // remain owned entirely by keihan-station.mjs.
 board(0,[-302.5,floor+2.70,-176],Math.PI,3.45,3.45/6,true);
 board(1,[-319.0,floor+2.70,-176],0,3.25,3.25/6,true);
 const z=-188,x=-299.854+(z+152.04)/(-49.215)*1.514;
 board(2,[x-.205,floor+1.94,z],-Math.PI/2,2.55,2.55/6);
 const stats=parts.flush();station.group.add(group);
 const report={built:true,group,detailGroups:[group],records,stats:{...stats,signFaces:3,atlasTextures:map?1:0,colliders:0},provenance:'Official Keihan KH34 plan, current 2026-04-01, establishes platform directions. Original sign graphics and inferred dimensions; no timetable or new facility claims.'};
 Object.defineProperty(group.userData,'report',{value:report});return report;
}
