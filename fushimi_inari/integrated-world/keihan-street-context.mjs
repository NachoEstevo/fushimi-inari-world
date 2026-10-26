import * as THREE from 'three';
import {createKeihanContextMaterials,applyMetricUVs} from './keihan-context-materials.mjs';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {entranceNeighborhoodLayout} from './entrance-neighborhood-layout.mjs';
import {KEIHAN_BUILDING_IDS,KEIHAN_PLATFORM1,KEIHAN_PLATFORM2,insideKeihanPolygon} from './keihan-station-spec.mjs';
import {keihanFrontageIds} from './keihan-frontages.mjs';

const streets=['way/946510942','way/79699849','way/79699850'];
// Mapped east-gate alley and the canal-bank approach around the bridge.
// These bounds match the walked portions of the existing ground treatment;
// they do not promote the full northbound traces into authored context.
const pedestrianBounds={'way/777222941':[-122,-86],'way/118027062':[-161,-121],'way/790920573':[-160,-68]};
export const PARKING_REAR_FINISH_IDS=['way/768795455','way/1544363240'];
function parkingRearFace(id,points,ground){
 if(!PARKING_REAR_FINISH_IDS.includes(id))return null;
 const facing=[-303,-100];let best=null;
 for(let edge=0;edge<points.length;edge++){
  const a=points[edge],b=points[(edge+1)%points.length],dx=b[0]-a[0],dz=b[2]-a[2],length=Math.hypot(dx,dz),x=(a[0]+b[0])/2,z=(a[2]+b[2])/2,t=Math.max(0,Math.min(1,((facing[0]-a[0])*dx+(facing[1]-a[2])*dz)/(length*length))),distance=Math.hypot(a[0]+dx*t-facing[0],a[2]+dz*t-facing[1]);
  if(length<3||Math.abs(dx/length)<.95||z<facing[1]||distance>18)continue;
  if(!best||distance<best.distance)best={edge,distance,kind:'parking-rear-finish',road:{id:null,x:facing[0],z:facing[1],y:ground(x,z),direction:[dx/length,dz/length]}};
 }
 return best;
}
// These shells remain owned by the entrance-neighborhood builder. Only their
// previously plain Hommachi-facing finish is added here, never new walls.
export const HOMMACHI_FINISH_IDS=['way/305214379','way/305214381','way/305214941','way/305214944','way/305214945','way/795552054','way/795552055'];
function nearest(segments,x,z){
 let best=null;
 for(const s of segments){const dx=s.b[0]-s.a[0],dz=s.b[2]-s.a[2],length2=dx*dx+dz*dz;if(length2<1e-8)continue;
  const t=Math.max(0,Math.min(1,((x-s.a[0])*dx+(z-s.a[2])*dz)/length2)),px=s.a[0]+t*dx,pz=s.a[2]+t*dz,d=Math.hypot(x-px,z-pz);
  if(!best||d<best.d)best={d,x:px,z:pz,y:s.ya+(s.yb-s.ya)*t,id:s.id,direction:[dx/Math.sqrt(length2),dz/Math.sqrt(length2)]};
 }return best;
}

function streetFaces(points,segments){
 const candidates=[];
 for(const id of [...new Set(segments.map(s=>s.id))]){
  const roadSegments=segments.filter(s=>s.id===id);let best=null;
  for(let edge=0;edge<points.length;edge++){
   const a=points[edge],b=points[(edge+1)%points.length],dx=b[0]-a[0],dz=b[2]-a[2],length=Math.hypot(dx,dz);if(length<2)continue;
   const road=nearest(roadSegments,(a[0]+b[0])/2,(a[2]+b[2])/2);
   const reach=pedestrianBounds[id]?6:15;
   if(road&&road.d<reach&&Math.abs((dx*road.direction[0]+dz*road.direction[1])/length)>.60&&(!best||road.d<best.distance))best={edge,distance:road.d,road};
  }
  if(best&&!candidates.some(c=>c.edge===best.edge))candidates.push(best);
 }
 return candidates.sort((a,b)=>a.distance-b.distance).slice(0,2);
}

// Permanent, source-footprint context is necessary at walking distance. The
// aerial chunks intentionally disappear nearby and cannot own these streets.
export function buildKeihanStreetContext(root,features,surfaces,materials={},colliders=[]){
 const name='Mapped Keihan street neighborhood',old=root.getObjectByName(name);if(old)return {group:old,...old.userData};
 const segments=surfaces?.segments?.filter(s=>streets.includes(s.id))??[];
 if(!segments.length||typeof surfaces.terrainHeight!=='function')return {built:false,builtIds:[],reason:'Mapped street datum unavailable'};
 const pedestrianSegments=surfaces.segments.filter(s=>{const bounds=pedestrianBounds[s.id],z=(s.a[2]+s.b[2])/2;return bounds&&z>=bounds[0]&&z<=bounds[1];});
 const entranceLayout=entranceNeighborhoodLayout(features),excluded=new Set([...KEIHAN_BUILDING_IDS,...keihanFrontageIds,'way/795552041','way/952687107',...entranceLayout.records.map(b=>b.id)]);
 for(const owner of root.children){for(const id of [...(owner.userData.builtIds??[]),...(owner.userData.sourceIds??[])])excluded.add(id);if(owner.userData.sourceFeature)excluded.add(owner.userData.sourceFeature);}
 const records=[];
 for(const b of features.buildings){
  if(excluded.has(b.id)||b.tags?.building==='roof'||b.tags?.religion||b.tags?.building==='shrine')continue;
  const points=b.points.slice(0,-1);if(points.length<3||!points.flat().every(Number.isFinite))continue;
  const cx=points.reduce((n,p)=>n+p[0],0)/points.length,cz=points.reduce((n,p)=>n+p[2],0)/points.length;
  if(cx<-360||cx>=-160||cz<-320||cz>35)continue;
  const road=nearest(segments,cx,cz),pedestrian=nearest(pedestrianSegments,cx,cz),stationSide=cx>=-350&&cx<=-280&&cz>=-310&&cz<=-125;
  if(!road||road.d>45&&!stationSide&&(!pedestrian||pedestrian.d>20))continue;
  if(points.some(p=>insideKeihanPolygon(p[0],p[2],KEIHAN_PLATFORM1)||insideKeihanPolygon(p[0],p[2],KEIHAN_PLATFORM2)))continue;
  const explicit=Number.parseFloat(b.tags?.height),levels=Number.parseFloat(b.tags?.['building:levels']);
  const height=Number.isFinite(explicit)&&explicit>0?explicit:Number.isFinite(levels)&&levels>0?levels*3:6;
  const frontages=streetFaces(points,[...segments,...pedestrianSegments]);
  const parkingFace=parkingRearFace(b.id,points,surfaces.terrainHeight);
  if(parkingFace&&!frontages.some(f=>f.edge===parkingFace.edge))frontages.push(parkingFace);
  const pedestrianFace=frontages.find(f=>pedestrianBounds[f.road.id]);
  const support=pedestrianFace&&pedestrianFace.distance<road.d?{d:pedestrianFace.distance,y:pedestrianFace.road.y}:road.d>45&&!stationSide&&pedestrian?pedestrian:road;
  const floor=support.d<20?support.y:surfaces.terrainHeight(cx,cz);
  if(!Number.isFinite(floor)||!Number.isFinite(height))continue;
  records.push({id:b.id,points,center:[cx,cz],floor,height,heightSource:Number.isFinite(explicit)&&explicit>0?'OSM height':Number.isFinite(levels)&&levels>0?'OSM storeys at estimated 3m':'inferred two-storey 6m envelope',frontage:frontages[0]??null,frontages});
 }
 if(!records.length)return {built:false,builtIds:[],reason:'No eligible mapped street footprints'};
 const {palette}=createKeihanContextMaterials();
 const batches=new Map(),pending=[],group=new THREE.Group();group.name=name;
 const existingEntrance=root.getObjectByName('Mapped entrance neighborhood context'),finishRecords=[];
 for(const spec of entranceLayout.records){
  if(!HOMMACHI_FINISH_IDS.includes(spec.id)||!existingEntrance?.userData.sourceIds?.includes(spec.id))continue;
  const frontages=streetFaces(spec.points,segments.filter(s=>s.id==='way/79699850'));if(!frontages.length)continue;
  const heights=spec.points.map(p=>surfaces.terrainHeight(p[0],p[2])).sort((a,b)=>a-b),oldFloor=heights[Math.floor((heights.length-1)/2)],floor=frontages[0].road.y,height=oldFloor+spec.height-floor;
  if(!Number.isFinite(height)||height<2.8)continue;
  finishRecords.push({...spec,floor,height,frontage:frontages[0],frontages,finishOnly:true,ownerTop:oldFloor+spec.height});
 }
 function part(g,mat,tint='#ffffff'){
  const geo=g.index?g.toNonIndexed():g;if(geo!==g)g.dispose();
  if(mat===palette.plaster||mat===palette.shutter)applyMetricUVs(geo);
  if(mat.vertexColors){const c=new THREE.Color(tint),colors=new Float32Array(geo.attributes.position.count*3);for(let i=0;i<colors.length;i+=3){colors[i]=c.r;colors[i+1]=c.g;colors[i+2]=c.b;}geo.setAttribute('color',new THREE.BufferAttribute(colors,3));}
  if(!batches.has(mat))batches.set(mat,[]);batches.get(mat).push(geo);
 }
 const box=(w,h,d,x,y,z,mat,yaw=0,tint)=>{if(w>0&&h>0&&d>0)part(new THREE.BoxGeometry(w,h,d).rotateY(yaw).translate(x,y,z),mat,tint);};
 const tints=['#d6d0bc','#c5c4b8','#e2dfd0','#bfb6a7','#cfc9b8'];
 for(const [index,s]of [...records,...finishRecords].entries()){
  const {points,floor,height}=s,top=floor+height,tint=tints[index%tints.length];
  if(!s.finishOnly){
  for(let i=0;i<points.length;i++){
   const a=points[i],b=points[(i+1)%points.length],dx=b[0]-a[0],dz=b[2]-a[2],length=Math.hypot(dx,dz);if(length<.01)continue;
   const yaw=Math.atan2(-dz,dx),mx=(a[0]+b[0])/2,mz=(a[2]+b[2])/2,base=Math.min(floor-.16,surfaces.terrainHeight(a[0],a[2])-.08,surfaces.terrainHeight(b[0],b[2])-.08,surfaces.terrainHeight(mx,mz)-.08);
   box(length,top-base,.12,mx,(top+base)/2,mz,palette.plaster,yaw,tint);
   // Small cadastral notches keep the exact cap without adding a heavy eave.
   if(length>=4)box(length,.15,.22,mx,top-.02,mz,palette.roof,yaw);
   pending.push({type:'box',args:[mx,mz,length/2,.06,yaw,base,top,'keihan_context_'+s.id.split('/')[1]]});
  }
  const shape=new THREE.Shape();points.forEach((p,i)=>i?shape.lineTo(p[0],-p[2]):shape.moveTo(p[0],-p[2]));shape.closePath();part(new THREE.ShapeGeometry(shape).rotateX(-Math.PI/2).translate(0,top+.065,0),palette.roof);
  }
  for(const frontage of s.frontages){
  const a=points[frontage.edge],b=points[(frontage.edge+1)%points.length],dx=b[0]-a[0],dz=b[2]-a[2],length=Math.hypot(dx,dz),t=[dx/length,dz/length],yaw=Math.atan2(-dz,dx),mid=[(a[0]+b[0])/2,(a[2]+b[2])/2];
  let n=[t[1],-t[0]];if((frontage.road.x-mid[0])*n[0]+(frontage.road.z-mid[1])*n[1]<0)n=n.map(v=>-v);
  const fb=(w,h,d,u,y,v,mat,color)=>box(w,h,d,a[0]+t[0]*u+n[0]*v,floor+y,a[2]+t[1]*u+n[1]*v,mat,yaw,color);
  const panel=(w,h,u,y,v,mat)=>part(new THREE.PlaneGeometry(w,h).rotateY(Math.atan2(n[0],n[1])).translate(a[0]+t[0]*u+n[0]*v,floor+y,a[2]+t[1]*u+n[1]*v),mat);
  if(pedestrianBounds[frontage.road.id]||frontage.kind==='parking-rear-finish'){
   // The mapped edge establishes location and facing, not a shop identity.
   // Restrained wall-bound windows interpret anonymous neighborhood context;
   // no shopfront, awning or equipment projects into the narrow public route.
   const parking=frontage.kind==='parking-rear-finish',count=Math.max(1,Math.min(parking?2:3,Math.floor(length/3))),spacing=length/count;
   for(let i=0;i<count;i++){
    const u=(i+.5)*spacing,w=Math.min(parking?3:1.25,spacing-.5),windowHeight=parking?.55:.95;
    for(const y of parking?[2.1]:[1.7,...(height>4?[Math.min(4.2,height-.85)]:[])]){
     panel(w,windowHeight,u,y,.072,palette.glass);
     for(const offset of [-w/2,0,w/2])panel(.045,windowHeight+.07,u+offset,y,.10,palette.timber);
     for(const offset of [-1,1])panel(w+.08,.055,u,y+offset*(windowHeight/2+.025),.10,palette.timber);
    }
   }
   continue;
  }
  const bays=Math.max(1,Math.min(4,Math.floor(length/2.25))),bay=length/bays;
  // These are anonymous facade classes seen in 2020/2024 street references,
  // not per-parcel claims about business identity, openings or current stock.
  for(let i=0;i<bays;i++){
   const u=(i+.5)*bay,w=bay-.22;
   const glazed=frontage.road.id==='way/79699850'?i%3!==2:index%3===0;
   panel(w,2.15,u,1.19,.072,glazed?palette.glass:palette.shutter);
   if(!glazed)for(let line=0;line<9;line++)panel(w,.018,u,.28+line*.22,.094,palette.roof);
   else{
    fb(.045,2.15,.045,u,1.19,.105,palette.timber);fb(w,.055,.045,u,.78,.105,palette.timber);
    fb(.035,.28,.045,u+.12,1.08,.13,palette.shutter);
    if(i===1){panel(w*.62,.25,u,1.82,.12,palette.cloth);for(let p=0;p<4;p++)fb(w*.10,.17,.025,u-w*.25+p*w*.17,1.81,.14,palette.timber);}
   }
   for(const side of [-1,1])fb(.065,2.24,.065,u+side*w/2,1.19,.105,palette.timber);
   fb(w,.07,.065,u,2.30,.105,palette.timber);
   if(height>3.7){
    const upper=Math.min(4.15,height-.75);
    panel(w*.85,1.1,u,upper,.072,palette.glass);
    for(const offset of [-w*.425,0,w*.425])fb(.045,1.18,.045,u+offset,upper,.10,palette.timber);
    for(const y of [upper-.56,upper+.56])fb(w*.88,.055,.055,u,y,.10,palette.timber);
   }
  }
  fb(length,.12,.42,length/2,2.61,.17,palette.roof);
  if(frontage.distance>1.4&&frontage.distance<8){
   const depth=Math.min(.58,frontage.distance-.85),color=index%3===0?'#8c5141':index%2?'#526f63':'#b7a58a';
   fb(length,.06,depth,length/2,2.74,depth/2,palette.cloth,color);fb(length,.16,.035,length/2,2.66,depth,palette.cloth,color);
  }
  if(frontage.road.id==='way/79699850'){
   // Wall-bound service fittings remain behind the public walking envelope.
   fb(.065,Math.min(height-.3,4.0),.065,.15,Math.min(height-.3,4.0)/2,.10,palette.shutter);
   fb(.65,.36,.18,length-.55,2.14,.14,palette.shutter);for(let slot=0;slot<5;slot++)fb(.52,.017,.015,length-.55,2.02+slot*.055,.235,palette.roof);
  }
  }
 }
 for(const [material,parts]of batches){const geometry=mergeGeometries(parts);parts.forEach(g=>g.dispose());const mesh=new THREE.Mesh(geometry,material);mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);}
 const report={built:true,builtIds:records.map(s=>s.id),records,finishRecords,drawBatches:group.children.length,triangles:group.children.reduce((n,m)=>n+m.geometry.attributes.position.count/3,0),collidersAdded:pending.length,provenance:'Exact OSM footprints in Keihan neighborhood and Hommachi approach; source street datums from existing paved segments, including bounded east-gate alley and canal-bank segments. Anonymous facade vocabulary from user Street View October 2024 and November 2020. Existing station, named storefront and entrance neighborhood owners excluded from new shells. Selected existing Hommachi entrance shells receive finish-only panels.',inferred:'Default 6m heights, facade colors/window rhythm/shutters and shallow awnings are interpretive context, not surveyed or identified businesses. Pedestrian-facing window panels are anonymous inferred residential-scale finish, not photograph-verified openings or retail fronts. Closed footprint shells; no walkable interior advertised. Finish-only panels add no walls, roofs, floors or colliders and preserve their entrance-neighborhood owner.'};
 report.parkingRearFinish={ids:records.filter(r=>r.frontages.some(f=>f.kind==='parking-rear-finish')).map(r=>r.id),source:'July 2019 visitor panorama CIHM0ogKEICAgICU_I3zQQ, camera 34.96828,135.76932',inferred:'Anonymous low dark window-band vocabulary interpreted from the photographed parking rear. Parcel attribution, band dimensions and subdivisions approximate; existing mapped walls, heights and roof forms retained. Finish panels only, no retail front, source road ID or additional collider.'};
 group.userData=report;root.add(group);colliders.push(...pending);return {group,...report};
}
