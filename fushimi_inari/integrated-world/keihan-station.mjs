import * as THREE from 'three';
import {detailKeihanCar,detailKeihanDoor,keihanServiceMaterial,keihanDisplayPlane} from './keihan-train-detail.mjs';
import {staticParts} from './mountain-landmarks-geometry.mjs';
import {createKeihanStationSpec} from './keihan-station-spec.mjs?v=recorded-immersion-8';
import {keihanRampMaterial} from './keihan-ramp-material.mjs';

const NAME='Keihan Fushimi-Inari P2 arrival';
const clamp=n=>Math.max(0,Math.min(1,Number.isFinite(n)?n:0));
function labelMaterial(text,background='#27343e',color='#f1eee0'){
 const material=new THREE.MeshStandardMaterial({color:background,roughness:.82,emissive:background,emissiveIntensity:.08});material.userData.label=text;
 if(globalThis.document?.createElement){const c=document.createElement('canvas');c.width=1024;c.height=160;const ctx=c.getContext('2d');if(ctx){ctx.fillStyle=background;ctx.fillRect(0,0,c.width,c.height);ctx.fillStyle=color;ctx.font='bold 66px sans-serif';ctx.textBaseline='middle';ctx.textAlign='center';ctx.fillText(text,512,84,1000);const map=new THREE.CanvasTexture(c);map.colorSpace=THREE.SRGBColorSpace;material.map=map;material.emissiveMap=map;material.color.set('#ffffff');}}
 return material;
}
// Interpretive information based on Keihan station information and shrine access.
// https://www.keihan.co.jp/traffic/station/151/info.html
// https://inari.jp/en/access/ — not replicas of photographed advertisements.
export const KEIHAN_POSTER_CONTENT=Object.freeze(['Keihan line guide','Platform 2 information','Shrine access']);
function visitorPosterMaterial(){
 const material=new THREE.MeshStandardMaterial({color:'#f3f2eb',roughness:.84,emissive:'#dddcd3',emissiveIntensity:.035});material.name='Keihan passenger information atlas';material.userData.label='Interpretive passenger information';material.userData.panels=KEIHAN_POSTER_CONTENT;
 if(globalThis.document?.createElement){const c=document.createElement('canvas');c.width=1536;c.height=640;const ctx=c.getContext('2d');if(ctx){
 const text=(value,x,y,size=24,color='#243c3b',weight='normal')=>{ctx.fillStyle=color;ctx.font=`${weight} ${size}px "Noto Sans JP", "Yu Gothic", sans-serif`;ctx.fillText(value,x,y,448);};
 const line=(points,color,width)=>{ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.stroke();};
 for(let i=0;i<3;i++){ctx.save();ctx.translate(i*512,0);ctx.fillStyle='#f5f4ed';ctx.fillRect(0,0,512,640);ctx.textAlign='left';ctx.fillStyle=['#17634f','#204f68','#943e2b'][i];ctx.fillRect(0,0,512,12);
 text(['京阪電車 路線案内','伏見稲荷','伏見稲荷大社'][i],32,67,i===1?46:34,'#203d37','bold');text(['Keihan Main Line','Fushimi-inari','Fushimi Inari Taisha'][i],32,106,25);line([[32,128],[480,128]],'#a6b3ac',2);
 if(i===0){text('京都・大阪 / KYOTO – OSAKA',32,164,21);line([[86,205],[86,533]],'#246d54',12);
 const stops=[['三条','Sanjo'],['祇園四条','Gion-shijo'],['東福寺','Tofukuji'],['伏見稲荷','Fushimi-inari'],['中書島','Chushojima'],['淀屋橋','Yodoyabashi']];
 stops.forEach(([jp,en],j)=>{const y=211+j*65;if(j===3){ctx.fillStyle='#dce9dd';ctx.fillRect(32,y-32,448,60);}ctx.fillStyle=j===3?'#a63729':'#f5f4ed';ctx.strokeStyle='#246d54';ctx.lineWidth=4;ctx.beginPath();ctx.arc(86,y-7,10,0,Math.PI*2);ctx.fill();ctx.stroke();text(jp,120,y-2,25,'#243c3b','bold');text(en,120,y+20,18);});text('主要駅のみ表示 / Selected stations',32,595,17);text('模式図 / Not to scale',32,620,16);
 }else if(i===1){ctx.fillStyle='#205a48';ctx.fillRect(32,151,112,112);text('KH',53,193,28,'#fff','bold');text('34',50,245,50,'#fff','bold');text('ふしみいなり',168,185,23);text('京阪本線',168,224,32,'#243c3b','bold');text('Keihan Main Line',168,253,20);
 ctx.fillStyle='#e0e8e5';ctx.fillRect(32,294,448,178);text('2',52,383,80,'#205a48','bold');text('のりば / PLATFORM',139,331,22);text('淀屋橋・中之島線方面',139,377,25,'#243c3b','bold');text('for Yodoyabashi',139,414,22);text('& Nakanoshima Line',139,445,21);ctx.fillStyle='#ead45b';ctx.fillRect(32,503,448,77);text('出口  Exit',52,553,36,'#202c29','bold');text('→',405,555,48,'#202c29','bold');text('駅のご案内 / Station information',32,618,18);
 }else{ctx.fillStyle='#e9dfc9';ctx.fillRect(32,149,448,251);ctx.fillStyle='#a53b28';for(const [x,y,w,h]of [[78,187,356,20],[102,225,308,14],[124,202,20,171],[368,202,20,171]])ctx.fillRect(x,y,w,h);ctx.fillStyle='#513a31';ctx.fillRect(70,179,372,8);line([[36,389],[476,389]],'#b5a68a',3);text('東へ 徒歩約5分',32,447,34,'#7f3224','bold');text('5 minutes on foot · east',32,487,27);text('参拝のご案内 / Shrine access',32,541,23);line([[32,565],[480,565]],'#c7b9a6',2);text('京阪 伏見稲荷駅から',32,597,20);text('From Keihan Fushimi-inari Station',32,623,18);}
 ctx.restore();}
 const map=new THREE.CanvasTexture(c);map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=4;material.map=map;material.emissiveMap=map;material.color.set('#ffffff');
 }}return material;
}
// This station owns only its real mapped railway/gate envelopes. The old JR
// station remains a separate destination; integration chooses the arrival.
export function buildKeihanStation(root,materials,features,surfaces,options={}){
 const previous=root.getObjectByName(NAME);if(previous)return previous.userData.api;
 const spec=options.spec??createKeihanStationSpec(features,surfaces);if(!spec)return {built:false,builtIds:[],reason:'Keihan mapped gate/platform contract unavailable'};
 const group=new THREE.Group();group.name=NAME;
 const p={floor:new THREE.MeshStandardMaterial({color:'#777b79',roughness:.98}),stone:new THREE.MeshStandardMaterial({color:'#b7b6ac',roughness:.94}),dark:new THREE.MeshStandardMaterial({color:'#27323a',roughness:.78}),red:new THREE.MeshStandardMaterial({color:'#c03220',roughness:.55}),cream:new THREE.MeshStandardMaterial({color:'#e6e3d6',roughness:.91}),metal:new THREE.MeshStandardMaterial({color:'#9aa3a5',metalness:.5,roughness:.4}),yellow:new THREE.MeshStandardMaterial({color:'#d7ae35',roughness:.85}),green:new THREE.MeshStandardMaterial({color:'#245b4b',roughness:.63}),seat:new THREE.MeshStandardMaterial({color:'#42677a',roughness:.93}),wood:new THREE.MeshStandardMaterial({color:'#706049',roughness:.9}),glass:new THREE.MeshStandardMaterial({color:'#aec1be',transparent:true,opacity:.12,depthWrite:false,roughness:.12,side:THREE.DoubleSide}),light:new THREE.MeshStandardMaterial({color:'#eee9da',emissive:'#f6e3b8',emissiveIntensity:.35})};
 p.wallBand=new THREE.MeshStandardMaterial({color:'#66707c',roughness:.9,emissive:'#66707c',emissiveIntensity:.035});
 const parts=staticParts(group),colliders=[],topTriangles=[],labels=[];
 const collider=(x,z,w,d,yaw,lo,hi,tag)=>colliders.push({type:'box',args:[x,z,w/2,d/2,yaw,lo,hi,tag]});
 const box=(w,h,d,x,y,z,material)=>parts.box(w,h,d,x,y,z,material);
 const wall=(a,b,bottom,height,thickness,material,tag)=>{const dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz),yaw=-Math.atan2(dz,dx),g=new THREE.BoxGeometry(length,height,thickness);g.rotateY(yaw);g.translate((a[0]+b[0])/2,bottom+height/2,(a[1]+b[1])/2);parts.put(g,material);if(tag)collider((a[0]+b[0])/2,(a[1]+b[1])/2,length,thickness,yaw,bottom,bottom+height,tag);};
 function slab(ring,height,bottom,material=p.floor,topUV){
  const y=typeof height==='function'?height:()=>height;
  for(const face of THREE.ShapeUtils.triangulateShape(ring.map(q=>new THREE.Vector2(...q)),[])){
   const vertices=face.map(i=>[ring[i][0],y(...ring[i]),ring[i][1]]),[a,b,c]=vertices;
   const geometry=parts.sheet([...a,...c,...b],material);
   if(topUV)geometry.setAttribute('uv',new THREE.Float32BufferAttribute([a,c,b].flatMap(topUV),2));
   topTriangles.push([a,c,b].map(v=>v.map(Math.fround)));
  }
  for(let i=0;i<ring.length;i++){const a=ring[i],b=ring[(i+1)%ring.length];parts.sheet([a[0],bottom,a[1],a[0],y(...a),a[1],b[0],y(...b),b[1],a[0],bottom,a[1],b[0],y(...b),b[1],b[0],bottom,b[1]],p.stone);}
 }
 const label=(text,width,height,position,rotation=0,bg)=>{const mat=labelMaterial(text,bg),mesh=new THREE.Mesh(new THREE.PlaneGeometry(width,height),mat);mesh.position.set(...position);mesh.rotation.y=rotation;mesh.name=text;group.add(mesh);labels.push(mat);return mesh;};
 for(const platform of [spec.platform2,spec.platform1])slab(platform.points,spec.platformFloor,spec.railTop-.35);
 // The east outer wall is the real obstacle seen directly after disembarking.
 // It never opens toward the shrine: the public exit is SOUTH, on the right.
 const eastEdge=[[-299.854,-152.040],[-298.340,-201.255],[-303.129,-201.611],[-305.136,-203.503],[-301.979,-303.891]];
 for(let i=1;i<eastEdge.length;i++){wall(eastEdge[i-1],eastEdge[i],spec.platformFloor,1.08,.16,p.stone,'keihan-p2-outer-wall');wall(eastEdge[i-1],eastEdge[i],spec.platformFloor+1.08,1.36,.16,p.wallBand);wall(eastEdge[i-1],eastEdge[i],spec.platformFloor+2.44,.66,.14,p.cream);}
 for(let z=-200;z<=-154;z+=3.2){const x=-299.854+(z+152.04)/(-49.215)*1.514;box(.055,3.1,.075,x-.095,spec.platformFloor+1.55,z,p.dark);box(6.6,.11,.10,-302.4,spec.platformFloor+3.11,z,p.wallBand);box(.34,.07,1.34,-302.4,spec.platformFloor+3.035,z,p.metal);for(const offset of [-.10,.10])box(.065,.025,1.22,-302.4+offset,spec.platformFloor+2.99,z,p.light);}
 // Rail safety boundaries are navigation constraints, not invented fences.
 for(const platform of [spec.platform2,spec.platform1]){const p2=platform===spec.platform2,a=platform.points[p2?0:1],b=platform.points[p2?1:2],side=p2?1:-1;
  const tactile=[a,b].map(q=>q.map((v,i)=>v+spec.track.east[i]*.46*side));wall(tactile[0],tactile[1],spec.platformFloor+.002,.016,.34,p.yellow);
  if(p2){const dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz),door=spec.train.doorPosition,t=((door[0]-a[0])*dx+(door[2]-a[1])*dz)/(len*len),gap=.92/len;
   for(const [lo,hi]of [[0,t-gap],[t+gap,1]])collider(a[0]+dx*(lo+hi)/2,a[1]+dz*(lo+hi)/2,len*(hi-lo),.10,-Math.atan2(dz,dx),spec.platformFloor-.2,spec.platformFloor+1.7,'keihan-platform-rail-edge');
  }else{const dx=b[0]-a[0],dz=b[1]-a[1];collider((a[0]+b[0])/2,(a[1]+b[1])/2,Math.hypot(dx,dz),.10,-Math.atan2(dz,dx),spec.platformFloor-.2,spec.platformFloor+1.7,'keihan-p1-rail-edge');}}
 // Source-colored columns and canopy, with the local porch intentionally
 // modeled from the 2017 redesign, rather than JR's white tiled station.
 for(let z=-294;z<=-157;z+=10){const x=-299.854+(z+152.04)/(-49.215)*1.514;const columnX=z>=-201?x-.12:-304.0+(z+204)*-.031;
  parts.beam([columnX,spec.platformFloor,z],[columnX,spec.platformFloor+3.1,z],.10,p.red,.10,8);
  box(4.1,.14,.14,columnX-1.7,spec.platformFloor+3.13,z,p.metal);
 }
 for(const [x,z,w,d]of [[-302.4,-176.7,6.8,50],[-305.1,-249,3.2,96],[-319.0,-228,3.8,148]])box(w,.13,d,x,spec.platformFloor+3.24,z,p.dark);
 // Wide platform end to the narrower south gate, with disjoint top ownership.
 const head=spec.gate.rampHead,foot=spec.gate.rampFoot,rampWidth=2.5,dx=foot[0]-head[0],dz=foot[2]-head[2],length=Math.hypot(dx,dz),nx=dz/length,nz=-dx/length;
 const rampRing=[[head[0]-nx*rampWidth/2,head[2]-nz*rampWidth/2],[head[0]+nx*rampWidth/2,head[2]+nz*rampWidth/2],[foot[0]+nx*rampWidth/2,foot[2]+nz*rampWidth/2],[foot[0]-nx*rampWidth/2,foot[2]-nz*rampWidth/2]];
 slab([[-304.543,-152.207],[-299.854,-152.040],rampRing[1],rampRing[0]],spec.platformFloor,spec.railTop-.35);
 const rampY=(x,z)=>head[1]+(foot[1]-head[1])*Math.max(0,Math.min(1,((x-head[0])*dx+(z-head[2])*dz)/(length*length)));
 const rampMaterial=keihanRampMaterial(),rampUV=([x,y,z])=>[((x-head[0])*nx+(z-head[2])*nz)/rampWidth+.5,((x-head[0])*dx+(z-head[2])*dz)/length/rampMaterial.userData.panelLength];
 slab(rampRing,rampY,Math.min(head[1],foot[1])-.35,rampMaterial,rampUV);
 for(const side of [-1,1]){const a=[head[0]+side*nx*1.33,head[1]+.92,head[2]+side*nz*1.33],b=[foot[0]+side*nx*1.33,foot[1]+.92,foot[2]+side*nz*1.33];parts.beam(a,b,.025,p.metal,.025,6);for(let t=.08;t<=.95;t+=.22){const x=a[0]+(b[0]-a[0])*t,z=a[2]+(b[2]-a[2])*t,y=rampY(x,z);box(.055,.94,.055,x,y+.47,z,p.metal);}collider((a[0]+b[0])/2,(a[2]+b[2])/2,length,.055,-Math.atan2(dz,dx),Math.min(head[1],foot[1]),Math.max(head[1],foot[1])+.96,'keihan-ramp-side-rail');}
 // Two source entrance roofs and vermilion cylindrical colonnade. The main
 // walking ramp is west of these posts; no flat slab hides its slope.
 box(5.5,.26,20.1,-302.55,spec.publicExit.position[1]+3.4,-142.22,p.dark);
 for(let z=-150.7;z<=-132.4;z+=1.35){parts.beam([-300.48,rampY(-300.48,z),z],[-300.48,spec.publicExit.position[1]+3.27,z],.095,p.red,.095,8);box(5.3,.075,.075,-302.55,spec.publicExit.position[1]+3.24,z,p.red);collider(-300.48,z,.20,.20,0,rampY(-300.48,z),spec.publicExit.position[1]+3.3,'keihan-entry-column');}
 for(let x=-305.18;x<=-300.4;x+=.25)box(.045,.035,19.7,x,spec.publicExit.position[1]+3.24,-142.22,p.wood);
 // Retain mapped shop/office envelope west of the public exit. Its south
 // shutter and fascia are visible from the user's October2024 Street View.
 const shopFloor=spec.gate.rampFoot[1];box(3.77,2.65,9.84,-307.568,shopFloor+1.325,-137.235,p.dark);
 collider(-307.568,-137.235,3.77,9.84,0,shopFloor,shopFloor+2.65,'keihan-senboninari-envelope');
 box(3.4,1.65,.035,-307.568,shopFloor+1.25,-132.285,p.stone);
 for(let y=shopFloor+.5;y<=shopFloor+2.05;y+=.12)box(3.38,.015,.035,-307.568,y,-132.258,p.metal);
 label('SENBONINARI  千本いなり',3.35,.40,[-307.568,shopFloor+2.32,-132.24]);
 label('KEIHAN  京阪電車  伏見稲荷駅',5.0,.48,[-302.55,spec.publicExit.position[1]+3.38,-132.1]);
 for(const x of [-305.0,-303.4,-301.8]){box(.40,.87,1.45,x,spec.platformFloor+.435,-151.45,p.metal);box(.39,.07,1.45,x,spec.platformFloor+.90,-151.45,p.dark);box(.26,.035,.26,x,spec.platformFloor+.955,-151.10,p.green);collider(x,-151.45,.4,1.45,0,spec.platformFloor,spec.platformFloor+.96,'keihan-fare-gate');}
 const exitSignZ=-181.9,exitSignX=-299.854+(exitSignZ+152.04)/(-49.215)*1.514-.11;
 label('出口  Exit  →',2.4,.38,[exitSignX-.025,spec.platformFloor+2.70,exitSignZ],-Math.PI/2,'#d7b640');
 label('2  淀屋橋・中之島方面  Osaka',4.1,.35,[-302.2,spec.platformFloor+2.60,-161.3],Math.PI);
 label('伏見稲荷  Fushimi-inari',4.3,.52,[-302.5,spec.publicExit.position[1]+2.95,-148.8],Math.PI);
 // Observed wall equipment: paired molded seats, lockers, framed information,
 // two drinks cabinets. Small products share batches; no per-bottle objects.
 for(const z of [-184.9,-193.0]){for(const x of [-300.4,-301.1]){box(.60,.12,.58,x,spec.platformFloor+.48,z,p.wallBand);box(.60,.56,.09,x,spec.platformFloor+.80,z+.25,p.wallBand);box(.12,.40,.25,x,spec.platformFloor+.20,z,p.dark);box(.48,.055,.43,x,spec.platformFloor+.045,z,p.metal);for(const side of [-1,1]){parts.beam([x+side*.29,spec.platformFloor+.53,z-.19],[x+side*.29,spec.platformFloor+.73,z-.19],.017,p.dark,.017,6);parts.beam([x+side*.29,spec.platformFloor+.73,z-.19],[x+side*.29,spec.platformFloor+.76,z+.22],.017,p.dark,.017,6);}for(const rib of [-.17,0,.17])box(.015,.43,.015,x+rib,spec.platformFloor+.82,z+.194,p.dark);}collider(-300.75,z,1.35,.66,0,spec.platformFloor,spec.platformFloor+1.15,'keihan-platform-seats');}
 // Detailed interactive cabinets are installed after static batching.
 for(const z of [-169.0,-170.25])collider(-299.65,z,.78,1.14,0,spec.platformFloor,spec.platformFloor+1.85,'keihan-platform-vending');
 for(let i=0;i<5;i++){box(.65,1.9,.58,-299.8,spec.platformFloor+.95,-196+i*.65,p.dark);for(let j=0;j<3;j++){box(.025,.59,.57,-300.14,spec.platformFloor+.33+j*.62,-196+i*.65,p.metal);box(.03,.05,.05,-300.16,spec.platformFloor+.40+j*.62,-196+i*.65+.20,p.dark);}}
 collider(-299.8,-194.7,.72,3.25,0,spec.platformFloor,spec.platformFloor+1.95,'keihan-platform-lockers');
 const posterMaterial=visitorPosterMaterial();labels.push(posterMaterial);
 for(const [i,z]of [-179.4,-181.9,-184.4].entries()){const x=-299.854+(z+152.04)/(-49.215)*1.514;box(.055,1.47,1.30,x-.11,spec.platformFloor+1.77,z,p.dark);const g=new THREE.PlaneGeometry(1.18,1.35),uv=g.attributes.uv;for(let j=0;j<uv.count;j++)uv.setX(j,(uv.getX(j)+i)/3);g.rotateY(-Math.PI/2);g.translate(x-.142,spec.platformFloor+1.77,z);parts.put(g,posterMaterial,false);}
 const railGroup=new THREE.Group();railGroup.position.set(spec.track.origin[0],spec.railTop,spec.track.origin[1]);railGroup.rotation.y=spec.track.yaw;group.add(railGroup);const rails=staticParts(railGroup);
 for(const u of [0,-spec.track.trackSpacing]){rails.box(2.8,.22,180,u,-.27,-65,p.floor);for(const side of [-1,1])rails.box(.065,.12,180,u+side*spec.track.gauge/2,-.03,-65,p.metal);for(let v=-155;v<=20;v+=.78)rails.box(2.0,.10,.16,u,-.15,v,p.dark);}
 // Model the catenary in coarse shared batches; these are visual context,
 // never extra shadow lights or individual animated equipment objects.
 for(const z of [-280,-220,-161]){box(.14,7,.14,-296,spec.railTop+3.5,z,p.metal);box(.14,7,.14,-327,spec.railTop+3.5,z,p.metal);box(31,.14,.14,-311.5,spec.railTop+7,z,p.metal);}
 rails.box(.025,.025,180,0,5.55,-65,p.dark);rails.box(.025,.025,180,-spec.track.trackSpacing,5.55,-65,p.dark);
 const railStats=rails.flush(),stationStats=parts.flush();

 // Seven-car 13000-family interpretation: sourced 18.7m intermediate-car
 // length and 2.792m width, three doors, green/white livery. No JR labels.
 const trainGroup=new THREE.Group();trainGroup.name='Keihan 13000 appearance local';trainGroup.position.set(spec.track.origin[0],spec.train.floor,spec.track.origin[1]);trainGroup.rotation.y=spec.track.yaw;trainGroup.userData.dynamic=true;group.add(trainGroup);
 const trainParts=staticParts(trainGroup),doors=[];
 const destination=keihanServiceMaterial(),trainPalette={...p,service:destination};labels.push(destination);
 for(const [carIndex,center]of spec.train.carCenters.entries()){
  const {carWidth:W,carLength:L}=spec.train,selectedCar=carIndex===spec.train.selectedCar;
  trainParts.box(W,.16,L,0,-.08,center,p.floor);trainParts.box(W,.15,L,0,2.98,center,p.cream);trainParts.box(2.0,.27,L-1,0,3.18,center,p.metal);
  for(const end of [-1,1]){trainParts.box(W,2.95,.12,0,1.45,center+end*L/2,p.cream);trainParts.box(.80,1.9,.025,0,1.13,center+end*(L/2+.065),p.dark);}
  for(const side of [-1,1]){
   trainParts.box(.075,.35,L,side*W/2,2.775,center,p.cream);
   const boundaries=[-L/2,...spec.train.doorOffsets.flatMap(v=>[v-.65,v+.65]),L/2];
   for(let i=0;i<boundaries.length-1;i+=2){const lo=boundaries[i],hi=boundaries[i+1],span=hi-lo,mid=(lo+hi)/2;
    trainParts.box(.075,1.08,span,side*W/2,.54,center+mid,p.green);trainParts.box(.075,.22,span,side*W/2,1.19,center+mid,p.cream);trainParts.box(.075,.21,span,side*W/2,2.50,center+mid,p.cream);
    for(const edge of [lo+.04,hi-.04])trainParts.box(.08,1.10,.08,side*W/2,1.85,center+edge,p.dark);
    trainParts.box(.02,1.08,Math.max(.04,span-.16),side*W/2,1.85,center+mid,p.glass);
    // Bucket seats and end partitions are built by detailKeihanCar.
   }
   for(const [doorIndex,v]of spec.train.doorOffsets.entries())for(const half of [-1,1]){
    const selected=selectedCar&&doorIndex===spec.train.selectedDoor&&side===1,leaf=new THREE.Group();leaf.name=`Keihan car ${carIndex+1} door ${doorIndex+1} ${side} ${half}`;leaf.position.set(side*(W/2+.01),0,center+v+half*.325);
    const lp=selected?staticParts(leaf):trainParts,lb=(w,h,d,x,y,z,mat)=>lp.box(w,h,d,x+(selected?0:leaf.position.x),y,z+(selected?0:leaf.position.z),mat);
    lb(.06,1.22,.64,0,.61,0,p.green);lb(.06,.30,.64,0,2.25,0,p.cream);for(const edge of [-1,1])lb(.06,.88,.085,0,1.66,edge*.2775,p.cream);lb(.02,.88,.47,0,1.66,0,p.glass);lb(.075,.045,.64,0,.025,0,p.yellow);
    if(selectedCar)detailKeihanDoor(lb,p,side);
    if(selected){lp.flush();trainGroup.add(leaf);doors.push({leaf,base:leaf.position.z,half});}
   }
  }
  detailKeihanCar(trainParts,spec,trainPalette,carIndex,center);
  for(const bogie of [-6.0,6.0])trainParts.box(2.1,.45,2.1,0,-.42,center+bogie,p.dark);
  if(selectedCar)for(const u of [-.72,.72]){trainParts.box(.035,.035,L-1,u,2.51,center,p.metal);for(let v=-8;v<=8;v+=1.4){trainParts.beam([u,2.51,center+v],[u,2.26,center+v],.012,p.metal,.012,5);trainParts.box(.12,.10,.018,u,2.22,center+v,p.cream);}trainParts.box(.13,.04,L-1,u,2.87,center,p.light);}
 }
 const cab=spec.train.carLength/2+.08;trainParts.box(2.48,.92,.04,0,1.94,cab,p.dark);for(const u of [-.79,.79])trainParts.box(.22,.14,.06,u,.99,cab+.03,p.light);
 keihanDisplayPlane(trainParts,destination,{x:0,y:2.68,z:cab+.04,width:2,height:.28});
 const trainStats=trainParts.flush();

 const selectedV=spec.train.selectedV;
 const thresholdGroup=new THREE.Group();thresholdGroup.name='Keihan selected doorway threshold';thresholdGroup.position.copy(trainGroup.position);thresholdGroup.rotation.y=spec.track.yaw;thresholdGroup.userData.dynamic=true;group.add(thresholdGroup);const threshold=staticParts(thresholdGroup);threshold.box(.38,.035,1.30,spec.train.bodyHalfWidth+.10,-.0175,selectedV,p.metal);threshold.flush();
 const doorCenter=spec.track.local(spec.train.carWidth/2,selectedV),closedDoorCollider={type:'box',args:[doorCenter[0],doorCenter[1],.05,.65,spec.track.yaw,spec.train.floor,spec.train.floor+2.4,'keihan-closed-train-door']};
 // All static surfaces are indexed once. Walking never traverses train meshes
 // or a station-wide triangle list to find its height.
 const cells=new Map(),cellSize=4;
 for(const triangle of topTriangles){const xs=triangle.map(p=>p[0]),zs=triangle.map(p=>p[2]);for(let x=Math.floor(Math.min(...xs)/cellSize);x<=Math.floor(Math.max(...xs)/cellSize);x++)for(let z=Math.floor(Math.min(...zs)/cellSize);z<=Math.floor(Math.max(...zs)/cellSize);z++){const key=x+','+z;if(!cells.has(key))cells.set(key,[]);cells.get(key).push(triangle);}}
 const surfaceHeight=(x,z)=>{
  if(x<-330||x>-293||z<-310||z>-131)return null;
  for(const [a,b,c]of cells.get(Math.floor(x/cellSize)+','+Math.floor(z/cellSize))??[]){const den=(b[2]-c[2])*(a[0]-c[0])+(c[0]-b[0])*(a[2]-c[2]);if(Math.abs(den)<1e-10)continue;const u=((b[2]-c[2])*(x-c[0])+(c[0]-b[0])*(z-c[2]))/den,v=((c[2]-a[2])*(x-c[0])+(a[0]-c[0])*(z-c[2]))/den;if(Math.min(u,v,1-u-v)>=-1e-5)return u*a[1]+v*b[1]+(1-u-v)*c[1];}
  const dx=x-spec.track.origin[0],dz=z-spec.track.origin[1],u=dx*spec.track.east[0]+dz*spec.track.east[1],v=dx*spec.track.direction[0]+dz*spec.track.direction[1];
  if(Math.abs(v-selectedV)<=.65&&u>=-.01&&u<=spec.train.bodyHalfWidth+.29)return spec.train.floor;
  return null;
 };
 let lastDoor=-1,lastX=NaN,lastY=NaN,lastZ=NaN;
 const setDoorOpen=value=>{const f=clamp(value);if(f!==lastDoor){for(const d of doors)d.leaf.position.z=d.base+d.half*.68*f;lastDoor=f;}return f;};
 const setTrainOffset=offset=>{if(!Array.isArray(offset)||offset.length!==3||!offset.every(Number.isFinite))throw Error('Keihan offset requires three finite metres');const [x,y,z]=offset;if(x===lastX&&y===lastY&&z===lastZ)return;trainGroup.position.set(spec.track.origin[0]+x,spec.train.floor+y,spec.track.origin[1]+z);thresholdGroup.visible=Math.hypot(x,y,z)<.05;lastX=x;lastY=y;lastZ=z;};
 const setMode=mode=>{p.light.emissiveIntensity=mode==='night'?1.2:.35;for(const m of labels)m.emissiveIntensity=mode==='night'?.55:.08;};
 const api={built:true,group,spec,publicExit:spec.publicExit,trainGroup,thresholdGroup,colliders,closedDoorCollider,builtIds:spec.builtIds,surfaceHeight,setDoorOpen,setTrainOffset,setMode,routePoints:[spec.train.doorPosition,spec.route.platformDoor,spec.route.turn,spec.route.gateApproach,spec.route.gate,spec.route.rampHead,spec.route.rampFoot],stats:{station:stationStats,rail:railStats,train:trainStats,staticTopTriangles:topTriangles.length,colliders:colliders.length},provenance:spec.provenance};
 group.userData={built:true,revision:spec.revision,stats:api.stats};Object.defineProperty(group.userData,'api',{value:api,enumerable:false});setDoorOpen(0);setTrainOffset([0,0,0]);root.add(group);return api;
}
