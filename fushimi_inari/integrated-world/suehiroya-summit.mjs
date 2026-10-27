import * as THREE from 'three';
import {staticParts} from './mountain-landmarks-geometry.mjs';

const CAFE='way/626313732',SHRINE='way/626313728';
// Google Maps photo Jim Kim, April 2024, CIHM0ogKEICAgIDjgsv8Eg:
// https://www.google.com/maps/place/Suehiroya/@34.9669196,135.7855429/
// Roof view: Google Maps Petr Nouza, September 2025, CIABIhAqKh32_ZCTC5JQqXjkjJou.
// Broad pitched gray roof with three skylights; rough gray upper frieze and timber/glass frontage.
// Storey height, bay spacing, inset and concealed rear/interior are estimates.
export function createSuehiroyaSummit({buildings,ground,walkHeight,materials={}}){
 const started=performance.now(),group=new THREE.Group();group.name='Suehiro-ya · mapped summit shop';
 const builtIds=new Set(),owned=new Set();let disposed=false;
 const stats={built:false,sourceFeature:CAFE,storeys:1,batches:0,extraLights:0,newColliders:0,newTextures:0,
  reference:{author:'Jim Kim',date:'April 2024',photo:'CIHM0ogKEICAgIDjgsv8Eg',url:'https://www.google.com/maps/place/Suehiroya/@34.9669196,135.7855429/'},
  limits:'Exact mapped roof/plinth footprint; single-storey photographic envelope. Height, facade bay spacing, front roof run/slope, conservative unseen rear cover, inset and one interior display bay are inferred. No copied photo pixels, signs, new path or collision.'};
 const dispose=()=>{if(disposed)return;disposed=true;group.removeFromParent();group.traverse(o=>{if(o.isMesh)o.geometry.dispose();});for(const material of owned)material.dispose();};
 const result={group,builtIds,stats,dispose};
 const feature=buildings?.find(b=>b.id===CAFE),shrine=buildings?.find(b=>b.id===SHRINE);
 if(!feature||!shrine||typeof walkHeight!=='function'||typeof ground!=='function')return result;
 const ring=feature.points.slice(0,-1),target=shrine.points.slice(0,-1).reduce((p,q,i,a)=>[p[0]+q[0]/a.length,p[1]+q[2]/a.length],[0,0]);
 if(ring.length<3||ring.some(p=>!p.every(Number.isFinite)))return result;
 let front=null;
 for(let i=0;i<ring.length;i++){
  const a=ring[i],b=ring[(i+1)%ring.length],dx=b[0]-a[0],dz=b[2]-a[2],length=Math.hypot(dx,dz);if(length<2)continue;
  const t=THREE.MathUtils.clamp(((target[0]-a[0])*dx+(target[1]-a[2])*dz)/(length*length),0,1),distance=Math.hypot(target[0]-a[0]-dx*t,target[1]-a[2]-dz*t);
  if(!front||distance<front.distance)front={edge:i,a,b,length,tangent:[dx/length,dz/length],distance};
 }
 if(!front)return result;
 const {a,b,length,tangent:t}=front,center=ring.reduce((p,q,i,a)=>[p[0]+q[0]/a.length,p[1]+q[2]/a.length],[0,0]),n=[-t[1],t[0]];
 if(n[0]*(center[0]-(a[0]+b[0])/2)+n[1]*(center[1]-(a[2]+b[2])/2)<0){n[0]*=-1;n[1]*=-1;}
 const at=(u,y,v)=>[a[0]+t[0]*u+n[0]*v,y,a[2]+t[1]*u+n[1]*v];
 const supports=[.15,.5,.85].map(f=>{const p=at(length*f,0,-.12);return walkHeight(p[0],p[2]);}).filter(Number.isFinite).sort((a,b)=>a-b);
 const terrain=ring.map(p=>ground(p[0],p[2]));if(!supports.length||!terrain.every(Number.isFinite))return result;
 const floor=supports[Math.floor(supports.length/2)],minZ=Math.min(...ring.map(p=>p[2])),maxZ=Math.max(...ring.map(p=>p[2]));
 const roofFrontRun=Math.min(8,maxZ-minZ),roofCut=minZ+roofFrontRun;
 const roofY=z=>floor+2.92+1.53*THREE.MathUtils.clamp((z-minZ)/roofFrontRun,0,1);
 // Only the visible front slope is reconstructed; the unseen rear is a
 // conservative cover envelope, not an asserted surveyed ridge/back pitch.
 const clipRoof=(polygon,above)=>{
  const output=[];for(let i=0;i<polygon.length;i++){const p=polygon[i],q=polygon[(i+1)%polygon.length],a=above?p[2]>=roofCut:p[2]<=roofCut,b=above?q[2]>=roofCut:q[2]<=roofCut;
   if(a)output.push(p);if(a!==b){const t=(roofCut-p[2])/(q[2]-p[2]);output.push(p.map((v,j)=>v+(q[j]-v)*t));}
  }return output;
 };
 const standard=(name,color,source,roughness)=>{
  const material=new THREE.MeshStandardMaterial({name,color,roughness,metalness:0,side:THREE.DoubleSide});
  if(source?.normalMap){material.normalMap=source.normalMap;material.normalScale.set(.12,.12);}
  if(source?.roughnessMap)material.roughnessMap=source.roughnessMap;
  owned.add(material);return material;
 };
 const plaster=standard('Suehiro-ya gray rough frieze','#aaa99f',materials.plasterMat,.98);
 const timber=standard('Suehiro-ya natural timber frames','#916d48',materials.vermilionMat,.91);
 const dark=standard('Suehiro-ya dark timber kick panels','#4b382c',materials.vermilionMat,.94);
 const roof=standard('Suehiro-ya weathered gray metal','#8b9390',null,.84);roof.roughnessMap=materials.copperRoofMat?.roughnessMap??materials.roofMat?.roughnessMap??null;roof.metalness=.16;roof.normalMap=materials.copperRoofMat?.normalMap??materials.roofMat?.normalMap??null;roof.normalScale.set(.12,.12);
 const glass=standard('Suehiro-ya inset opaque glass','#566962',null,.19);glass.envMapIntensity=.65;
 const skylight=standard('Suehiro-ya photographed roof skylights','#91b5ba',null,.20);skylight.envMapIntensity=.8;
 const stone=standard('Suehiro-ya retained stone support','#a8a69b',materials.flagstoneMat??materials.stoneMat,.97);stone.map=materials.flagstoneMat?.map??null;stone.normalScale.set(.22,.22);
 const display=standard('Suehiro-ya neutral display goods','#d9cbb0',null,.98);
 const parts=staticParts(group),sheet=(points,mat)=>parts.sheet(points.flat(),mat);
 const quad=(a,b,c,d,mat)=>sheet([a,b,c,a,c,d],mat);
 const yaw=-Math.atan2(t[1],t[0]);
 const box=(w,h,d,u,y,v,mat)=>{const p=at(u,floor+y,v);parts.put(new THREE.BoxGeometry(w,h,d).rotateY(yaw).translate(...p),mat);};
 for(let i=0;i<ring.length;i++){
  const p=ring[i],q=ring[(i+1)%ring.length],lowP=Math.min(terrain[i]-.12,floor-.12),lowQ=Math.min(terrain[(i+1)%ring.length]-.12,floor-.12);
  quad([p[0],lowP,p[2]],[q[0],lowQ,q[2]],[q[0],floor,q[2]],[p[0],floor,p[2]],stone);
  const edge=[p];if((p[2]-roofCut)*(q[2]-roofCut)<0){const t=(roofCut-p[2])/(q[2]-p[2]);edge.push(p.map((v,j)=>v+(q[j]-v)*t));}edge.push(q);
  for(let j=1;j<edge.length;j++){const a=edge[j-1],b=edge[j];
   if(i!==front.edge)quad([a[0],floor,a[2]],[b[0],floor,b[2]],[b[0],roofY(b[2])-.08,b[2]],[a[0],roofY(a[2])-.08,a[2]],plaster);
   quad([a[0],roofY(a[2])-.09,a[2]],[b[0],roofY(b[2])-.09,b[2]],[b[0],roofY(b[2]),b[2]],[a[0],roofY(a[2]),a[2]],roof);
  }
 }
 const faces=THREE.ShapeUtils.triangulateShape(ring.map(p=>new THREE.Vector2(p[0],p[2])),[]);
 for(const face of faces){
  const triangle=face.map(i=>ring[i]);for(const above of [false,true]){const polygon=clipRoof(triangle,above);for(let j=1;j<polygon.length-1;j++)sheet([polygon[0],polygon[j],polygon[j+1]].map(p=>[p[0],roofY(p[2]),p[2]]),roof);}
  sheet(face.map(i=>[ring[i][0],floor,ring[i][2]]),stone);
 }
 for(const [fraction,depth]of [[.22,4.6],[.50,3.7],[.78,3.7]]){
  const u=length*fraction,corners=[at(u-.70,0,depth-.45),at(u+.70,0,depth-.45),at(u+.70,0,depth+.45),at(u-.70,0,depth+.45)];
  for(const point of corners)point[1]=roofY(point[2])+.03;quad(...corners,skylight);
  for(let j=0;j<4;j++)parts.beam(corners[j],corners[(j+1)%4],.026,roof,.026,4);
 }
 const span=length-.5,bays=Math.max(3,Math.round(span/1.30)),pitch=span/bays,inset=.42;
 // Close the frieze to the pitched soffit instead of leaving a daylight slit.
 const left=at(.25,0,inset),right=at(length-.25,0,inset);
 quad([left[0],floor+2,left[2]],[right[0],floor+2,right[2]],
  [right[0],roofY(right[2])-.08,right[2]],[left[0],roofY(left[2])-.08,left[2]],plaster);
 box(span,.085,.15,length/2,2.00,inset,timber);box(span,.07,.13,length/2,.08,inset,dark);
 for(let i=0;i<=bays;i++){const u=.25+i*pitch;box(.055,2.00,.075,u,1.04,inset,timber);box(.020,.78,.06,u,2.40,inset-.03,roof);}
 // Close only the two shallow returns inside the mapped roof edge.
 for(const [corner,u]of [[a,.25],[b,length-.25]])quad([corner[0],floor,corner[2]],at(u,floor,inset),at(u,roofY(at(u,0,inset)[2])-.08,inset),[corner[0],roofY(corner[2])-.08,corner[2]],timber);
 const openBay=Math.floor(bays*.70);
 for(let i=0;i<bays;i++){
  const u=.25+(i+.5)*pitch;
  box(pitch-.05,.43,.06,u,.30,inset,dark);
  if(i!==openBay){
   box(pitch-.10,1.42,.025,u,1.25,inset+.05,glass);
   box(.025,1.42,.065,u,1.25,inset,timber);box(pitch-.08,.035,.065,u,.57,inset,timber);
   box(pitch-.08,.035,.065,u,1.96,inset,timber);box(.025,.22,.055,u+.15,1.10,inset-.018,dark);
  }
 }
 // A small shaded display recess; exact merchandise/interior is not surveyed.
 const u=.25+(openBay+.5)*pitch;
 box(pitch-.10,1.95,.05,u,1.05,1.32,dark);box(pitch-.18,.72,.42,u,.51,.93,timber);
 for(const y of [.88,1.25,1.61]){
  box(pitch-.20,.035,.30,u,y,1.00,timber);
  for(let j=0;j<4;j++)box(.11,.16,.12,u-.30+j*.20,y+.10,.99,display);
 }
 const budget=parts.flush();group.traverse(mesh=>{if(mesh.isMesh&&mesh.material===roof)mesh.name='Suehiro-ya pitched metal roof';});
 builtIds.add(CAFE);Object.assign(stats,budget,{built:true,buildMs:performance.now()-started,floor,roofFrontRun,skylights:3,references:[stats.reference,{author:'Petr Nouza',date:'September 2025',photo:'CIABIhAqKh32_ZCTC5JQqXjkjJou',url:'https://www.google.com/maps/place/Suehiroya/@34.9669704,135.7855404/'}],roofMin:roofY(minZ),roofMax:roofY(maxZ),bays,displayBoxes:12,
  front:{edge:front.edge,a:[...a],b:[...b],outward:[-n[0],-n[1]],inset},footprint:ring.map(p=>[p[0],p[2]])});
 group.userData={sourceFeature:CAFE,builtIds:[CAFE],reference:stats.reference,estimatedDimensions:true};
 return result;
}
