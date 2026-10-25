import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

const OWNER='Observed Inari-shinmichi street details';
const STREET_IDS=['way/946510942','way/79699849'];
const SOURCES={west:'streetview-01-station-street.png / streetview-02-bridge-approach.png · October 2024',east:'streetview-06-east-street.png · November 2020 / streetview-07-hommachi.png · October 2024'};
const MARK_LIFT=.008;

function locate(segments,id,x,side=0){
 const segment=segments.find(s=>s.id===id&&x>=Math.min(s.a[0],s.b[0])&&x<=Math.max(s.a[0],s.b[0]));if(!segment)return null;
 const dx=segment.b[0]-segment.a[0],dz=segment.b[2]-segment.a[2],length=Math.hypot(dx,dz);if(length<.01||Math.abs(dx)<.01)return null;
 const t=(x-segment.a[0])/dx,along=[dx/length,dz/length],normal=[-along[1],along[0]];
 return {position:[x+normal[0]*side,segment.a[2]+dz*t+normal[1]*side],along,normal,width:segment.width,sourceId:id};
}

function counterAtlas(){
 if(typeof document==='undefined'){const t=new THREE.DataTexture(new Uint8Array([98,42,24,255]),1,1);t.needsUpdate=true;return t;}
 const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=256;const c=canvas.getContext('2d');if(!c)return null;
 c.fillStyle='#3d271d';c.fillRect(0,0,1024,256);c.fillStyle='#b85a31';c.fillRect(0,242,1024,14);c.textAlign='center';c.textBaseline='middle';
 c.fillStyle='#f5e7c3';c.font='bold 63px serif';c.fillText('串焼き',190,99);c.font='25px sans-serif';c.fillText('FRESHLY GRILLED',190,183);
 for(let row=0;row<3;row++){c.strokeStyle='#c6a46d';c.lineWidth=6;c.beginPath();c.moveTo(440,59+row*68);c.lineTo(962,59+row*68);c.stroke();for(let col=0;col<5;col++){const x=492+col*88,y=51+row*68;c.fillStyle=row===1?'#b97839':'#d6a25a';c.beginPath();c.ellipse(x,y,29,24,.1,0,Math.PI*2);c.fill();c.strokeStyle='#7e4c29';c.lineWidth=3;c.beginPath();c.moveTo(x-12,y-16);c.lineTo(x-4,y+17);c.moveTo(x+5,y-16);c.lineTo(x+13,y+17);c.stroke();}}
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;return texture;
}

// Adds decorative skins only: no replacement roads, floor sampler, movement
// changes, colliders, lights or updates. Source photographs establish the
// object families; exact offsets, patterns and service connections are inferred.
export function buildKeihanStreetObservedDetails(assembly){
 const root=assembly?.root,segments=assembly?.surfaces?.segments;
 if(!root||typeof assembly.walkHeight!=='function'||!Array.isArray(segments)||!STREET_IDS.every(id=>segments.some(s=>s.id===id)))return {built:false,reason:'Mapped street owners unavailable',detailGroups:[]};
 const previous=root.getObjectByName(OWNER);if(previous)return previous.userData.report;
 const projected=STREET_IDS.flatMap(id=>segments.filter(s=>s.id===id));
 if(projected.some(s=>!Number.isFinite(s.width)||s.width<1||![...s.a,...s.b].every(Number.isFinite)))return {built:false,reason:'Street trace changed',detailGroups:[]};
 const group=new THREE.Group();group.name=OWNER;
 const palette={metal:new THREE.MeshStandardMaterial({color:'#697371',roughness:.75,metalness:.35,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2}),dark:new THREE.MeshStandardMaterial({color:'#343b39',roughness:.86,polygonOffset:true,polygonOffsetFactor:-3,polygonOffsetUnits:-3}),print:new THREE.MeshStandardMaterial({color:'#ffffff',map:counterAtlas(),roughness:.84})};
 const detailGroups=[],records=[],batches=new Map();
 function owner(name,center){const o=new THREE.Group();o.name=name;o.position.set(...center);o.userData.detailRadius=38;group.add(o);detailGroups.push(o);batches.set(o,new Map());return o;}
 function put(o,g,key){const geometry=g.index?g.toNonIndexed():g;if(g!==geometry)g.dispose();geometry.translate(-o.position.x,-o.position.y,-o.position.z);const bucket=batches.get(o);if(!bucket.has(key))bucket.set(key,[]);bucket.get(key).push(geometry);}
 function polygon(o,points,key,lift=MARK_LIFT){
  const heights=points.map(([x,z])=>assembly.walkHeight(x,z));if(!heights.every(Number.isFinite))return false;
  const area=points.reduce((sum,p,i)=>sum+p[0]*points[(i+1)%points.length][1]-points[(i+1)%points.length][0]*p[1],0);
  const vertices=[];for(let i=1;i<points.length-1;i++)for(const j of area>0?[0,i+1,i]:[0,i,i+1])vertices.push(points[j][0],heights[j]+lift,points[j][1]);
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geometry.computeVertexNormals();
  // A drain must not bridge an existing curb/floor-owner discontinuity. Skip
  // that placement rather than bending an iron cover into a vertical flap.
  for(let i=0;i<geometry.attributes.normal.count;i++)if(geometry.attributes.normal.getY(i)<.9){geometry.dispose();return false;}
  put(o,geometry,key);return true;
 }
 const zones=[{id:STREET_IDS[0],name:'Station street service covers',xs:[-288,-270],center:[-279,-109]},{id:STREET_IDS[0],name:'Bridge approach service covers',xs:[-252,-240],center:[-246,-96]},{id:STREET_IDS[1],name:'Hommachi approach service covers',xs:[-188,-169],center:[-178,-85]}];
 for(const zone of zones){
  const centerY=assembly.walkHeight(...zone.center);if(!Number.isFinite(centerY))continue;const o=owner(zone.name,[zone.center[0],centerY,zone.center[1]]);
  for(const [i,x]of zone.xs.entries()){
   const p=locate(segments,zone.id,x,i?.65:-.35);if(!p)continue;const [cx,cz]=p.position,r=i?.27:.31;
   const ring=Array.from({length:24},(_,j)=>{const angle=j/24*Math.PI*2;return [cx+Math.cos(angle)*r,cz+Math.sin(angle)*r];});if(!polygon(o,ring,'metal'))continue;
   // Cast concentric ring and radial ribs, not copied municipal artwork.
   for(let j=0;j<24;j++){const a=j/24*Math.PI*2,b=(j+1)/24*Math.PI*2;polygon(o,[[cx+Math.cos(a)*(r-.027),cz+Math.sin(a)*(r-.027)],[cx+Math.cos(b)*(r-.027),cz+Math.sin(b)*(r-.027)],[cx+Math.cos(b)*(r-.017),cz+Math.sin(b)*(r-.017)],[cx+Math.cos(a)*(r-.017),cz+Math.sin(a)*(r-.017)]],'dark',MARK_LIFT+.001);}
   for(let j=0;j<8;j++){const a=j*Math.PI/4,t=[Math.cos(a),Math.sin(a)],n=[-t[1]*.006,t[0]*.006];polygon(o,[[cx+t[0]*.07+n[0],cz+t[1]*.07+n[1]],[cx+t[0]*(r-.05)+n[0],cz+t[1]*(r-.05)+n[1]],[cx+t[0]*(r-.05)-n[0],cz+t[1]*(r-.05)-n[1]],[cx+t[0]*.07-n[0],cz+t[1]*.07-n[1]]],'dark',MARK_LIFT+.001);}
   records.push({kind:'round-service-cover',sourceId:zone.id,position:[cx,assembly.walkHeight(cx,cz),cz],radius:r,reference:zone.id===STREET_IDS[0]?SOURCES.west:SOURCES.east});
   for(const side of [-1,1]){
    const edge=locate(segments,zone.id,x+1.8,side*(p.width/2-.09));if(!edge)continue;const [gx,gz]=edge.position,at=(u,v)=>[gx+edge.along[0]*u+edge.normal[0]*v,gz+edge.along[1]*u+edge.normal[1]*v];
    if(!polygon(o,[at(-.27,-.07),at(.27,-.07),at(.27,.07),at(-.27,.07)],'metal'))continue;
    for(let slot=0;slot<8;slot++){const u=-.22+slot*.062;polygon(o,[at(u-.016,-.045),at(u+.016,-.045),at(u+.016,.045),at(u-.016,.045)],'dark',MARK_LIFT+.001);}
    records.push({kind:'gutter-grate',sourceId:zone.id,position:[gx,assembly.walkHeight(gx,gz),gz],width:.14,length:.54,reference:zone.id===STREET_IDS[0]?SOURCES.west:SOURCES.east});
   }
  }
 }
 const stores=assembly.keihanFrontages?.storefronts??[],south=stores.find(s=>s.id==='way/305213538'),north=stores.find(s=>s.id==='way/305213554');
 const facadePoint=(s,u,y,v=.04)=>{const a=s.points[s.edge];return new THREE.Vector3(a[0]+s.t[0]*u+s.n[0]*v,s.floor+y,a[2]+s.t[1]*u+s.n[1]*v);};
 // Streetview-01: narrow wall-edge rainwater pipes, sockets and fixing bands.
 // Existing wall frames register interpreted fittings, not surveyed drainage.
 for(const s of stores.filter(s=>['senbei','soft-serve','grill'].includes(s.kind))){
  if(!Number.isFinite(s.floor)||s.width<3||s.height<5)continue;
  const u=s.width-.10,center=facadePoint(s,u,2.35,.055),o=owner('Observed wall-edge rainwater pipe '+s.id,center.toArray());
  const vertical=new THREE.CylinderGeometry(.035,.035,4.35,8);vertical.translate(center.x,s.floor+2.35,center.z);put(o,vertical,'dark');
  for(const y of [.24,2.05,4.35]){
   const p=facadePoint(s,u,y,.055),socket=new THREE.CylinderGeometry(.044,.044,.075,8);socket.translate(...p.toArray());put(o,socket,'metal');
   const band=new THREE.BoxGeometry(.12,.025,.035);band.rotateY(s.yaw);const q=facadePoint(s,u,y,.018);band.translate(...q.toArray());put(o,band,'metal');
  }
  records.push({kind:'wall-edge-rainwater-pipe',sourceId:s.id,position:center.toArray(),height:4.35,radius:.035,reference:SOURCES.west,inferred:'Visible facade-edge pipe family; parcel attribution, sockets and dimensions are interpreted.'});
 }
 if(south&&north&&[south,north].every(s=>Number.isFinite(s.floor)&&s.height>=5&&s.width>2)){
  const a=facadePoint(south,.22,4.75),b=facadePoint(north,.22,4.75),distance=a.distanceTo(b);
  if(distance>4&&distance<20){
   const o=owner('Observed shop service cables',a.clone().add(b).multiplyScalar(.5).toArray());
   for(let i=0;i<4;i++){
    const start=a.clone().add(new THREE.Vector3(0,i*.09,0)),end=b.clone().add(new THREE.Vector3(0,i*.09,0)),middle=start.clone().add(end).multiplyScalar(.5);middle.y-=.28;
    put(o,new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(start,middle,end),16,.008,4,false),'dark');
   }
   for(const [s,p]of [[south,a],[north,b]]){const g=new THREE.BoxGeometry(.12,.46,.13);g.rotateY(s.yaw);g.translate(p.x,p.y+.13,p.z);put(o,g,'metal');}
   records.push({kind:'overhead-service-cables',sourceIds:[south.id,north.id],start:a.toArray(),end:b.toArray(),clearanceAboveFloors:4.47,reference:SOURCES.west,inferred:'Attachments and span are interpreted from visible overhead service wiring; not a surveyed utility connection.'});
  }
 }
 if(north?.kind==='grill'&&Number.isFinite(north.floor)&&north.width>3&&north.width<4){
  const center=facadePoint(north,north.width/2,.48,-.065),o=owner('Observed illustrated food-counter fascia',center.toArray()),g=new THREE.PlaneGeometry(north.width-.58,.66);g.rotateY(Math.atan2(north.n[0],north.n[1]));g.translate(...center.toArray());put(o,g,'print');records.push({kind:'illustrated-counter-panel',sourceId:north.id,position:center.toArray(),reference:SOURCES.west,inferred:'Original generic skewer illustration reconstructs the photographed panel category; no copied advertisement, brand or price.'});
 }
 for(const [o,bucket]of batches)for(const [key,parts]of bucket){const geometry=mergeGeometries(parts,false);parts.forEach(g=>g.dispose());const mesh=new THREE.Mesh(geometry,palette[key]);mesh.name=o.name+' · '+key;mesh.castShadow=o.name.includes('cables');mesh.receiveShadow=true;o.add(mesh);}
 let triangles=0,drawBatches=0;group.traverse(o=>{if(o.isMesh){triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;drawBatches++;}});
 if(!drawBatches)return {built:false,reason:'No supported observed detail positions',detailGroups:[]};
 const stats={triangles,drawBatches,groups:detailGroups.length,covers:records.filter(r=>r.kind==='round-service-cover').length,grates:records.filter(r=>r.kind==='gutter-grate').length,cableSpans:records.filter(r=>r.kind==='overhead-service-cables').length,panels:records.filter(r=>r.kind==='illustrated-counter-panel').length,collidersAdded:0,pointLights:0,textureAtlases:1};
 const report={built:true,group,detailGroups,stats,records,surfaceMarkLift:MARK_LIFT};Object.defineProperty(group.userData,'report',{value:report,enumerable:false});root.add(group);return report;
}
