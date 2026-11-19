import * as THREE from 'three';
import {clipConvex,polygonArea} from './entrance-area-surfaces-layout.mjs';
import {curvedLintel,simpleOfferingTorii,staticParts} from './mountain-landmarks-geometry.mjs';

const near=(a,b)=>Math.abs(a-b)<.002;
function rectangle(mesh,width,depth){
  mesh.updateWorldMatrix(true,false);
  return [[-1,-1],[1,-1],[1,1],[-1,1]].map(([u,v])=>{
    const p=new THREE.Vector3(u*width/2,0,v*depth/2).applyMatrix4(mesh.matrixWorld);return [p.x,p.z];
  });
}
const overlaps=(a,b)=>Math.abs(polygonArea(clipConvex(a,b)))>.0001;

export function clearIseyaTerrace(root,features,legacy,colliders){
  const shop=features.buildings.find(b=>b.id==='way/626313745');
  if(!shop)return null;
  const stone=legacy.interactables.find(o=>o.userData.interactable?.title?.startsWith('Ai-no-mine Otsuka'));
  const group=stone?.parent,slab=group?.children.find(o=>{
    const p=o.geometry?.parameters;return p&&near(p.width,4.6)&&near(p.depth,3.2)&&near(p.height,.55);
  });
  const broad=group&&colliders.find(c=>c.type==='box'&&c.args.at(-1)==='wayside_otsuka'&&
    Math.hypot(c.args[0]-group.position.x,c.args[1]-group.position.z)<.08);
  if(group?.parent!==root||!slab||!broad)return null;
  const footprint=rectangle(slab,4.6,3.2),ring=shop.points.slice(0,-1).map(p=>[p[0],p[2]]);
  // Clip each triangle separately because the rear of Iseya is concave.
  const triangles=THREE.ShapeUtils.triangulateShape(ring.map(p=>new THREE.Vector2(...p)),[]);
  const area=triangles.reduce((sum,t)=>sum+Math.abs(polygonArea(clipConvex(footprint,t.map(i=>ring[i])))),0);
  if(area<.01)return null;
  const removed=new Set();group.traverse(o=>removed.add(o));
  const flames=legacy.flickeringCandleMeshes.filter(o=>removed.has(o)).length;
  legacy.flickeringCandleMeshes=legacy.flickeringCandleMeshes.filter(o=>!removed.has(o));
  legacy.interactables=legacy.interactables.filter(o=>!removed.has(o));
  colliders.splice(colliders.indexOf(broad),1);group.removeFromParent();
  return {owner:'legacy wayside Ai-no-mine terrace',building:shop.id,overlapM2:area,
    center:group.position.toArray(),removedInteractables:1,removedColliders:1,removedFlames:flames};
}

function markerParts(owner,i){
  const x=-9.2-i%4*1.35,z=-8.5+Math.floor(i/4)*2.5,h=1.10+i%3*.32;
  const stone=owner.children.find(o=>o.userData.otsukaShape&&near(o.position.x,x)&&near(o.position.z,z)&&near(o.position.y,h/2+i%4*.18));
  if(!stone)return null;
  const companions=owner.children.filter(o=>{
    if(o.userData.interactable||!near(o.position.x,x+.42)||!near(o.position.z,z))return false;
    const p=o.geometry?.parameters;
    return (p?.radius===.16&&p.height===.48&&near(o.position.y,.38))||
      (p?.radiusTop===.13&&p.radiusBottom===.16&&near(p.height,.14)&&near(o.position.y,.32));
  });
  return {stone,companions};
}

export function buildKumatakaStoneTerrace(root,features,surfaces,materials,colliders,registration){
  const owner=root.children.find(o=>o.userData.zone==='kumataka');
  const poi=features.pois.find(o=>o.id==='node/3494101781');
  const roof=features.buildings.find(o=>o.id==='way/301527741');
  const shop=features.buildings.find(o=>o.id==='way/301527736');
  if(!owner||!registration?.front||!poi||!roof||!shop||owner.userData.shinikeStoneTerrace)return null;
  const marker=markerParts(owner,8);
  if(!marker)return null;
  const center=marker.stone.getWorldPosition(new THREE.Vector3());
  if(Math.hypot(center.x-poi.point[0],center.z-poi.point[2])>3)return null;
  // The survey node falls under the neighbouring pavilion. The 2019 front
  // and 2021 side photograph instead place this stone immediately to its left.
  // Use the first exterior legacy station there, not a second altar inside it.
  const group=new THREE.Group();group.name='Shin-ike left-hand stone altar';
  const yaw=Math.atan2(...registration.front),floor=surfaces.terrainHeight(center.x,center.z);
  if(!Number.isFinite(floor))return null;
  group.position.set(center.x,floor,center.z);group.rotation.y=yaw;
  const platform=rectangle(group,1.82,1.46);
  const polygons=[roof,shop].flatMap(b=>{
    const ring=b.points.slice(0,-1).map(p=>[p[0],p[2]]);
    return THREE.ShapeUtils.triangulateShape(ring.map(p=>new THREE.Vector2(...p)),[]).map(t=>t.map(i=>ring[i]));
  });
  if(polygons.some(p=>overlaps(platform,p)))return null;
  const lane=features.paths.find(p=>p.id==='way/301527750');
  if(!lane)return null;
  const strips=[];
  for(let i=1;i<lane.points.length;i++){
    const a=lane.points[i-1],b=lane.points[i],dx=b[0]-a[0],dz=b[2]-a[2],len=Math.hypot(dx,dz);
    const nx=-dz/len*1.28,nz=dx/len*1.28;
    const strip=[[a[0]+nx,a[2]+nz],[b[0]+nx,b[2]+nz],[b[0]-nx,b[2]-nz],[a[0]-nx,a[2]-nz]];
    if(overlaps(platform,strip))return null;strips.push(strip);
  }
  const stone=materials.entryStoneMat??materials.stoneMat,rock=materials.stoneMat,red=materials.vermilionMat,dark=materials.blackNemakiMat??rock;
  const parts=staticParts(group),toe=Math.min(-.08,...platform.map(([x,z])=>surfaces.terrainHeight(x,z)-floor-.06));
  parts.box(1.82,.20-toe,1.46,0,(.20+toe)/2,0,stone);
  parts.box(1.42,.28,.86,0,.34,-.16,stone);
  parts.put(new THREE.DodecahedronGeometry(.44,0).scale(1.42,.68,1).translate(0,.60,-.22),rock);
  // The inscribed stone has an asymmetrical, roughly tapered shoulder and a
  // broad foot. Preserve its silhouette without inventing an inscription.
  const outline=new THREE.Shape();outline.moveTo(-.39,0);outline.lineTo(-.42,.42);outline.lineTo(-.33,.74);
  outline.lineTo(-.20,1.02);outline.lineTo(.06,1.08);outline.lineTo(.22,.95);outline.lineTo(.38,.46);
  outline.lineTo(.40,.10);outline.lineTo(.32,0);outline.closePath();
  parts.put(new THREE.ExtrudeGeometry(outline,{depth:.23,bevelSize:.045,bevelThickness:.045,bevelSegments:1}).translate(0,.72,-.38),rock);
  for(const side of [-1,1])parts.beam([side*.63,.20,.09],[side*.59,1.99,.09],.085,stone,.07);
  curvedLintel(parts,1.70,.13,.18,0,2.03,.09,stone,.09);
  parts.box(1.57,.105,.14,0,1.72,.09,stone);
  parts.box(.17,.27,.15,0,1.84,.09,stone);
  for(const [x,z,s] of [[-.63,.52,.90],[-.25,.42,.98],[.18,.50,.92],[.61,.38,.96]])simpleOfferingTorii(parts,x,.20,z,s,red,dark);
  const cleared=[],seats=[];
  for(let i=0;i<28;i++){
    const cluster=markerParts(owner,i);if(!cluster)continue;
    const stoneFoot=rectangle(cluster.stone,.56,.30),pos=cluster.stone.getWorldPosition(new THREE.Vector3());
    const intersects=polygons.some(poly=>overlaps(stoneFoot,poly));
    const nearPath=strips.some(strip=>overlaps(rectangle(cluster.stone,.63,.39),strip));
    if(intersects||nearPath||overlaps(stoneFoot,platform)){
      for(const o of [cluster.stone,...cluster.companions])o.removeFromParent();
      cleared.push({index:i,center:[pos.x,pos.z],reason:intersects?'mapped roof or shop':nearPath?'public lane':'altar platform'});
    }else{
      // Remaining stones follow the real local grade instead of hanging on
      // the displaced legacy terrace or disappearing into the hillside.
      const foot=rectangle(cluster.stone,.63,.39),grades=foot.map(([x,z])=>surfaces.terrainHeight(x,z));
      if(!grades.every(Number.isFinite))continue;
      const top=Math.max(...grades)+.095,low=Math.min(...grades)-.045,h=cluster.stone.geometry.parameters.height;
      const offset=top-(pos.y-h/2);
      for(const o of [cluster.stone,...cluster.companions])o.position.y+=offset;
      const local=group.worldToLocal(new THREE.Vector3(pos.x,(low+top)/2,pos.z));
      const matrix=cluster.stone.matrixWorld.elements,azimuth=Math.atan2(matrix[8],matrix[10]);
      parts.put(new THREE.BoxGeometry(.63,top-low,.39).rotateY(azimuth-yaw).translate(...local.toArray()),stone);
      colliders.push({type:'box',args:[pos.x,pos.z,.315,.195,azimuth,low,top+h,'shinike_stele_seat']});
      seats.push(i);
    }
  }
  const stats=parts.flush();
  colliders.push({type:'box',args:[center.x,center.z,.91,.73,yaw,floor+toe,floor+2.13,'shinike_stone_altar']});
  root.add(group);
  const report={...stats,center:group.position.toArray(),cleared,seats,poi:poi.id,footprint:platform,sourceOffset:Math.hypot(center.x-poi.point[0],center.z-poi.point[2]),
    sources:['https://soulpeace.hatenablog.com/entry/2019/06/14/214805','https://hayabusa8823.hatenablog.com/entry/2021/01/27/073000'],
    provenance:'Two photographs identify the left-hand stone gate, boulder and offering ledge. Setting relative to the pavilion is sourced; dimensions and dedication arrangements are inferred.'};
  owner.userData.shinikeStoneTerrace=report;return report;
}
