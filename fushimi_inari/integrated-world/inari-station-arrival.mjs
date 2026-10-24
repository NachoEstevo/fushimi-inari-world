import * as THREE from 'three';
import {staticParts} from './mountain-landmarks-geometry.mjs';
import {createInariStationArrivalSpec,inariStationSurfaceHeight} from './inari-station-arrival-spec.mjs';
import {subtractConvex} from './entrance-area-surfaces-layout.mjs';

const NAME='JR Inari east arrival';
const clamp=n=>Math.max(0,Math.min(1,Number.isFinite(n)?n:0));
function signMaterial(text,background='#14252b',color='#f6f4e6'){
 const m=new THREE.MeshStandardMaterial({color:background,roughness:.65,emissive:background,emissiveIntensity:.2});
 m.userData.label=text;
 if(globalThis.document?.createElement){const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=192;const ctx=canvas.getContext('2d');if(ctx){ctx.fillStyle=background;ctx.fillRect(0,0,1024,192);ctx.fillStyle=color;ctx.font='bold 75px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,512,100,990);const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;m.map=tex;m.color.set('#ffffff');}}
 return m;
}
function polygonSlab(parts,ring,top,bottom,material){
 const triangles=THREE.ShapeUtils.triangulateShape(ring.map(q=>new THREE.Vector2(...q)),[]);
 for(const face of triangles){const [a,b,c]=face.map(i=>ring[i]);parts.sheet([a[0],top,a[1],c[0],top,c[1],b[0],top,b[1]],material);}
 for(let i=0;i<ring.length;i++){const a=ring[i],b=ring[(i+1)%ring.length];parts.sheet([a[0],bottom,a[1],a[0],top,a[1],b[0],top,b[1],a[0],bottom,a[1],b[0],top,b[1],b[0],bottom,b[1]],material);}
}

// Isolated builder: caller swaps the old authored station ONLY after built=true,
// then appends these colliders. It never rewrites feature data or other groups.
export function buildInariStationArrival(root,materials,features,surfaces,options={}){
 const previous=root.getObjectByName(NAME);if(previous)return previous.userData.api;
 const spec=options.spec??createInariStationArrivalSpec(features,surfaces);if(!spec)return {built:false,reason:'station footprint or public street unavailable'};
 const group=new THREE.Group();group.name=NAME;
 const palette={
  stone:new THREE.MeshStandardMaterial({color:'#aaa99f',roughness:.98,side:THREE.DoubleSide}),
  floor:new THREE.MeshStandardMaterial({color:'#bcbab0',roughness:.92,side:THREE.DoubleSide}),
  asphalt:new THREE.MeshStandardMaterial({color:'#535853',roughness:.98}),
  cream:new THREE.MeshStandardMaterial({color:'#e3dfce',roughness:.90}),
  red:new THREE.MeshStandardMaterial({color:'#b62e1b',roughness:.55}),
  roof:new THREE.MeshStandardMaterial({color:'#656b65',roughness:.85,side:THREE.DoubleSide}),
  dark:new THREE.MeshStandardMaterial({color:'#202822',roughness:.78}),
  metal:new THREE.MeshStandardMaterial({color:'#a6aeaa',metalness:.65,roughness:.38}),
  tactile:new THREE.MeshStandardMaterial({color:'#d7b544',roughness:.8}),
  green:new THREE.MeshStandardMaterial({color:'#497546',metalness:.12,roughness:.62}),
  seat:new THREE.MeshStandardMaterial({color:'#3e657b',roughness:.92}),
  interior:new THREE.MeshStandardMaterial({color:'#dfded0',roughness:.88,emissive:'#b8b6a2',emissiveIntensity:.13}),
  glass:new THREE.MeshStandardMaterial({color:'#95b2b6',metalness:.05,roughness:.12,transparent:true,opacity:.15,side:THREE.DoubleSide,depthWrite:false}),
  light:new THREE.MeshStandardMaterial({color:'#f8f4dd',emissive:'#fff2c7',emissiveIntensity:.75}),
  fascia:new THREE.MeshStandardMaterial({color:'#e9e7dd',roughness:.87}),
 };
 const staticGeometry=staticParts(group),colliders=[],landmarks=[];
 const addCollider=(x,z,w,d,yaw,yMin,yMax,id)=>colliders.push({type:'box',args:[x,z,w/2,d/2,yaw,yMin,yMax,id]});
 const building=new THREE.Group();building.name='Mapped JR Inari east ticket hall';building.position.set(spec.frame.origin[0],spec.publicFloor,spec.frame.origin[1]);building.rotation.y=spec.frame.yaw;group.add(building);
 const p=staticParts(building),b=spec.building,w=b.width,d=b.length;
 // Hollow hall: the old solid back-wall proxy would block the exit journey.
 // Keep the hall top fixed, but close its plinth to the lowest local terrain
 // support. A thin slab above the street left a visible .23m air gap.
 let foundationBottom=spec.streetFloor-.12;
 if(typeof surfaces.terrainHeight==='function')for(const u of [-w/2,0,w/2])for(const v of [-d/2,0,d/2]){const q=spec.local(u,v),support=surfaces.terrainHeight(...q);if(Number.isFinite(support))foundationBottom=Math.min(foundationBottom,support-.12);}
 const foundationDepth=spec.publicFloor-foundationBottom;
 p.box(w,foundationDepth,d,0,-foundationDepth/2,0,palette.floor);
 // Two external tongues own only gaps OUTSIDE the hall footprint. A single
 // bridging box across the hall would duplicate its top and cause z-fighting.
 for(const [lo,hi]of [[-4.2,-w/2],[w/2,3.7]])p.box(hi-lo,foundationDepth,2.7,(lo+hi)/2,-foundationDepth/2,0,palette.floor);
 for(const side of [-1,1]){
  p.box(w,3.9,.18,0,1.95,side*d/2,palette.cream);
  p.box(.16,3.9,d/2-2,side*w/2,1.95,-d/4-1,palette.cream);
  p.box(.16,3.9,d/2-2,side*w/2,1.95,d/4+1,palette.cream);
  const at=spec.local(0,side*d/2);addCollider(...at,w,.20,spec.frame.yaw,spec.publicFloor,spec.publicFloor+3.9,'inari-hall-end');
  for(const v of [-d/4-1,d/4+1]){const q=spec.local(side*w/2,v);addCollider(...q,.18,d/2-2,spec.frame.yaw,spec.publicFloor,spec.publicFloor+3.9,'inari-hall-wall');}
 }
 // Cream plaster, restrained vermilion frame and tiled gable, observed facade.
 for(const side of [-1,1]){p.box(.24,.18,d+.5,side*(w/2+.04),3.75,0,palette.red);for(const v of [-d/2,-7,7,d/2]){p.box(.23,3.8,.23,side*(w/2+.04),1.9,v,palette.red);p.box(.26,.38,.26,side*(w/2+.04),.19,v,palette.dark);}}
 const roofHalf=w/2+.65,end=d/2+.65;
 for(const side of [-1,1]){
  p.sheet([0,b.roofRidge,-end,side*roofHalf,b.roofEave,-end,0,b.roofRidge,end,0,b.roofRidge,end,side*roofHalf,b.roofEave,-end,side*roofHalf,b.roofEave,end],palette.roof);
  p.box(.17,.18,2*end,side*roofHalf,b.roofEave-.06,0,palette.fascia);
  for(let j=0;j<=Math.floor(2*end/.38);j++){const v=-end+j*.38;p.beam([0,b.roofRidge+.025,v],[side*roofHalf,b.roofEave+.025,v],.035,palette.roof,.035,6);}
  // Shallow cross-course joints break the continuous ribs into tiled courses.
  for(let u=.34;u<roofHalf;u+=.34){const y=b.roofRidge+(b.roofEave-b.roofRidge)*u/roofHalf+.022;p.beam([side*u,y,-end],[side*u,y,end],.014,palette.roof,.014,5);}
 }
 p.box(.32,.18,2*end,0,b.roofRidge+.07,0,palette.roof);
 for(const side of [-1,1])p.sheet([-w/2,3.9,side*d/2,w/2,3.9,side*d/2,0,5.12,side*d/2],palette.cream);
 // Townphoto2016: aluminum-framed side windows and upper transoms, with a
 // vermilion lower rail. These shallow facade inserts leave the center open.
 for(const side of [-1,1]){
  const v=side*4.0,face=w/2+.11;
  p.box(.05,1.85,2.25,face,1.61,v,palette.dark);
  p.box(.025,1.68,2.07,face+.03,1.61,v,palette.glass);
  p.box(.06,.26,2.25,face,2.77,v,palette.dark);
  p.box(.025,.18,2.07,face+.035,2.77,v,palette.glass);
  for(const edge of [-1,1])p.box(.07,2.42,.065,face+.04,1.77,v+edge*1.125,palette.metal);
  for(const y of [.68,2.54,2.61,2.93])p.box(.07,.065,2.32,face+.04,y,v,palette.metal);
  p.box(.065,1.85,.05,face+.04,1.61,v,palette.metal);
  p.box(.18,.16,2.55,face+.035,.56,v,palette.red);
 }
 // Small pitched tiled entrance canopy, matching observed attachment and
 // white fascia; all dimensions remain inferred, with the same clear opening.
 const canopyBack=w/2-.10,canopyFront=w/2+1.16,canopyTop=3.15,canopyEave=2.90;
 p.sheet([canopyBack,canopyTop,-3.3,canopyFront,canopyEave,-3.3,canopyBack,canopyTop,3.3,canopyBack,canopyTop,3.3,canopyFront,canopyEave,-3.3,canopyFront,canopyEave,3.3],palette.roof);
 p.box(.14,.13,6.7,canopyFront,canopyEave-.045,0,palette.fascia);
 for(let v=-3.3;v<=3.31;v+=.30)p.beam([canopyBack,canopyTop+.025,v],[canopyFront,canopyEave+.025,v],.035,palette.roof,.035,6);
 for(let u=.30;u<canopyFront-canopyBack;u+=.30){const x=canopyBack+u,y=canopyTop+(canopyEave-canopyTop)*u/(canopyFront-canopyBack)+.02;p.beam([x,y,-3.3],[x,y,3.3],.014,palette.roof,.014,5);}
 // Four gate housings leave usable 0.9m lanes. Route uses v=0 central lane.
 for(const v of [-2.25,-.75,.75,2.25]){p.box(1.55,.92,.42,.15,.46,v,palette.metal);p.box(.55,.045,.40,.40,.94,v,palette.dark);p.box(.20,.05,.36,.55,.98,v,palette.green);const q=spec.local(.15,v);addCollider(...q,1.55,.42,spec.frame.yaw,spec.publicFloor,spec.publicFloor+.96,'inari-ticket-gate');}
 // Gate2019: cylindrical vermilion supports, red headers and exposed gray
 // service pipes. No new object enters the center exit lane or stair envelope.
 for(const v of [-3.4,-1.5,1.5,3.4]){
  p.beam([-.8,.25,v],[-.8,3.30,v],.095,palette.red,.095,10);p.beam([-.8,0,v],[-.8,.25,v],.108,palette.dark,.108,10);
  const q=spec.local(-.8,v);addCollider(...q,.22,.22,spec.frame.yaw,spec.publicFloor,spec.publicFloor+3.3,'inari-gate-red-support');
 }
 p.box(.20,.20,7.25,-.8,3.22,0,palette.red);
 for(const v of [-2.8,2.8]){p.beam([-2.8,3.02,v],[2.7,3.02,v],.065,palette.metal,.065,8);p.beam([2.7,3.02,v],[2.7,2.72,v],.065,palette.metal,.065,8);}
 // Fare adjustment cabinet sits north/right when exiting, as photographed.
 const fareU=-2.25,fareV=-4.3;
 p.box(.64,1.55,.75,fareU,.775,fareV,palette.metal);p.box(.025,1.13,.72,fareU-.335,.995,fareV,palette.tactile);
 p.box(.035,.40,.48,fareU-.36,1.10,fareV,palette.dark);p.box(.04,.055,.27,fareU-.365,.74,fareV+.10,palette.dark);p.box(.035,.10,.31,fareU-.365,.30,fareV,palette.dark);
 const fareLabel=signMaterial('Fare Adjustment','#ead346','#1f2826'),fareMesh=new THREE.Mesh(new THREE.BoxGeometry(.04,.18,.70),fareLabel);fareMesh.position.set(fareU-.36,1.43,fareV);fareMesh.name='Observed north fare adjustment cabinet label';building.add(fareMesh);
 const fareWorld=spec.local(fareU,fareV);addCollider(...fareWorld,.66,.77,spec.frame.yaw,spec.publicFloor,spec.publicFloor+1.55,'inari-fare-adjustment');
 // North facade telephone enclosure and red postbox from the 2016 facade.
 // They sit tightly against the wall, west of the public street-margin route.
 const boothU=3.94,boothV=-4.70,streetBase=spec.streetFloor-spec.publicFloor;
 p.box(.83,.11,1.02,boothU,streetBase+.055,boothV,palette.dark);p.box(.87,.12,1.06,boothU,streetBase+2.16,boothV,palette.dark);
 p.box(.07,2.05,1.02,boothU-.38,streetBase+1.08,boothV,palette.dark);
 for(const side of [-1,1]){p.box(.07,2.05,.07,boothU+.38,streetBase+1.08,boothV+side*.47,palette.dark);p.box(.71,1.65,.022,boothU,streetBase+1.15,boothV+side*.47,palette.glass);}
 p.box(.18,.56,.35,boothU-.22,streetBase+1.18,boothV,palette.green);p.box(.08,.23,.20,boothU-.10,streetBase+1.25,boothV,palette.dark);p.box(.42,.07,.50,boothU-.05,streetBase+.86,boothV,palette.metal);
 const boothWorld=spec.local(boothU,boothV);addCollider(...boothWorld,.87,1.06,spec.frame.yaw,spec.streetFloor,spec.streetFloor+2.22,'inari-source-phone');
 const postU=4.02,postV=-3.38;
 p.box(.12,.64,.12,postU,streetBase+.32,postV,palette.dark);p.box(.45,.63,.48,postU,streetBase+.96,postV,palette.red);p.box(.025,.045,.29,postU+.24,streetBase+1.12,postV,palette.dark);p.box(.027,.11,.29,postU+.245,streetBase+.92,postV,palette.fascia);
 const postWorld=spec.local(postU,postV);addCollider(...postWorld,.48,.50,spec.frame.yaw,spec.streetFloor,spec.streetFloor+1.28,'inari-source-postbox');
 // Platform lower landing and six inferred risers; count/height are documented.
 const stairLength=4.6,stairStart=-8.8;
 // The upper landing already belongs to the mapped P2 slab. Only the
 // descending risers need solids; another top here would be coplanar.
 for(let i=0;i<6;i++){const top=.90-(i+1)*.15,run=stairLength/6;p.box(run,Math.max(.10,top+.20),2.7,stairStart+(i+.5)*run,(top-.20)/2,0,palette.floor);}
 for(const side of [-1,1]){for(const u of [-9.1,-7,-4.3])p.box(.07,1,.07,u,.95+(u<-8.8?.90:Math.max(0,.90-(u+8.8)/4.6*.90)),side*1.48,palette.metal);p.beam([-9.1,1.9,side*1.48],[-4.2,1,side*1.48],.035,palette.metal,.035,8);}
 const stationSign=signMaterial('JR  稲荷駅  Inari'),exitSign=signMaterial('出口  Exit  →','#d9b533','#202720');
 const sign=new THREE.Mesh(new THREE.BoxGeometry(.10,.65,4.8),stationSign);sign.position.set(w/2+.18,3.35,0);sign.name='JR Inari station sign';building.add(sign);
 const exit=new THREE.Mesh(new THREE.BoxGeometry(.08,.48,3.3),exitSign);exit.position.set(-1.3,2.65,0);exit.name='Exit sign above actual gate opening';building.add(exit);
 p.box(2.8,.07,.18,0,2.8,0,palette.light);
 const buildingStats=p.flush();

 // Platform footprints are mapped polygons, independently of the hall heading.
 const stairOpening=[[-8.8,-1.35],[-4.2,-1.35],[-4.2,1.35],[-8.8,1.35]].map(p=>spec.local(...p));
 for(const platform of [spec.platform2,spec.platform1]){
  if(platform===spec.platform1){polygonSlab(staticGeometry,platform.points,spec.platformFloor,spec.railTop-.3,palette.stone);continue;}
  // The sourced platform slab must physically open where the inferred lower
  // stair starts. A lower sampler alone would place feet inside an intact slab.
  const faces=THREE.ShapeUtils.triangulateShape(platform.points.map(q=>new THREE.Vector2(...q)),[]);
  for(const face of faces)for(const piece of subtractConvex(face.map(i=>platform.points[i]),stairOpening))polygonSlab(staticGeometry,piece,spec.platformFloor,spec.railTop-.3,palette.stone);
 }
 const railYaw=Math.atan2(-spec.track.east[1],spec.track.east[0]),railLocal=spec.track.local;
 const railParts=new THREE.Group();railParts.name='JR rail bed and platform canopy';railParts.position.set(...[spec.track.origin[0],spec.railTop,spec.track.origin[1]]);railParts.rotation.y=railYaw;group.add(railParts);const r=staticParts(railParts);
 const railStart=Number.isFinite(options.northRailStart)?options.northRailStart:15-spec.track.length/2;
 const railEnd=15+spec.track.length/2,railLength=railEnd-railStart,railCenter=(railStart+railEnd)/2;
 for(const trackU of [0,-spec.track.trackSpacing]){
  r.box(3.0,.26,railLength,trackU,-.35,railCenter,palette.asphalt);
  for(const side of [-1,1])r.box(.065,.14,railLength,trackU+side*spec.track.gauge/2,-.035,railCenter,palette.metal);
  for(let v=Number.isFinite(options.northRailStart)?railStart:-100;v<135;v+=.65)r.box(2.1,.13,.18,trackU,-.18,v,palette.dark);
 }
 // P2 photographed tactile edge, open canopy, red columns. Dimensions inferred.
 r.box(.36,.022,92,2.03,1.11,13,palette.tactile);
 for(let v=-25;v<=65;v+=10){r.box(.13,3.25,.13,4.0,2.72,v,palette.red);r.box(3.8,.14,.16,3.65,4.28,v,palette.metal);r.box(2.5,.055,.12,3.65,4.10,v,palette.light);}
 r.box(3.8,.13,98,3.65,4.42,18,palette.roof);
 // Closed west edge + selected doorway gap: no free walk onto active rails.
 // These are safety colliders rather than invented physical platform fences.
 for(const platform of [spec.platform2,spec.platform1])for(let i=0;i<platform.points.length;i++){
  const a=platform.points[i],q=platform.points[(i+1)%platform.points.length],length=Math.hypot(q[0]-a[0],q[1]-a[1]),steps=Math.ceil(length/2);
  for(let j=0;j<steps;j++){const t=(j+.5)/steps,x=a[0]+(q[0]-a[0])*t,z=a[1]+(q[1]-a[1])*t;
   // Preserve P2->hall opening and selected train door connector.
   const stationU=(x-spec.frame.origin[0])*spec.frame.east[0]+(z-spec.frame.origin[1])*spec.frame.east[1],stationV=(x-spec.frame.origin[0])*spec.frame.south[0]+(z-spec.frame.origin[1])*spec.frame.south[1];
   const doorGap=Math.hypot(x-spec.train.doorPosition[0],z-spec.train.doorPosition[2]);
   if(platform===spec.platform2&&((Math.abs(stationV)<2.4&&stationU>-10.5)||doorGap<1.5))continue;
   addCollider(x,z,length/steps+.04,.12,-Math.atan2(q[1]-a[1],q[0]-a[0]),spec.platformFloor-.2,spec.platformFloor+2,'inari-platform-safe-edge');
  }
 }
 // Two official-plan footbridges, positions/heights inferred, off egress path.
 for(const v of [-24,-8]){r.box(11.5,.24,2.1,-1.5,6.0,v,palette.metal);r.box(11.5,1.1,.09,-1.5,6.65,v-1.05,palette.cream);r.box(11.5,1.1,.09,-1.5,6.65,v+1.05,palette.cream);r.box(12.0,.16,2.5,-1.5,8.0,v,palette.roof);for(const u of [-6.8,3.8]){r.box(.16,6,.16,u,3.0,v,palette.red);for(let i=0;i<18;i++)r.box(1.8,.18,.31,u,1.1+(i+1)*.27,v-6+(i+.5)*.31,palette.stone);}}
 const platformStats=staticGeometry.flush(),railStats=r.flush();

 const trainGroup=new THREE.Group();trainGroup.name='JR Nara local 205 appearance train';trainGroup.position.set(spec.track.origin[0],spec.train.floor,spec.track.origin[1]);trainGroup.rotation.y=railYaw;trainGroup.userData.dynamic=true;group.add(trainGroup);
 const trainParts=staticParts(trainGroup),doors=[];
 for(const [carIndex,carCenter] of spec.train.carCenters.entries()){
  const L=spec.train.carLength,W=spec.train.carWidth;
  trainParts.box(W,.16,L,0,-.08,carCenter,palette.asphalt);
  trainParts.box(W+.02,.16,L,0,3.0,carCenter,palette.cream);
  trainParts.box(2.15,.34,L-.9,0,3.23,carCenter,palette.metal);
  for(const end of [-1,1]){trainParts.box(W,2.95,.13,0,1.45,carCenter+end*L/2,palette.metal);trainParts.box(.78,1.85,.03,0,1.1,carCenter+end*(L/2+.08),palette.dark);trainParts.box(.60,.55,.05,0,1.56,carCenter+end*(L/2+.11),palette.glass);}
  for(const side of [-1,1]){
   // Continuous lower band, clear actual window/door holes above it.
   trainParts.box(.10,.32,L,side*W/2,2.79,carCenter,palette.metal);
   const boundaries=[-L/2,...spec.train.doorOffsets.flatMap(v=>[v-.65,v+.65]),L/2];
   for(let i=0;i<boundaries.length-1;i+=2){const lo=boundaries[i],hi=boundaries[i+1],span=hi-lo,mid=(hi+lo)/2;
    trainParts.box(.10,.73,span,side*W/2,.36,carCenter+mid,palette.metal);
    trainParts.box(.11,.20,span,side*(W/2+.007),.76,carCenter+mid,palette.green);
    trainParts.box(.10,.39,span,side*W/2,1.01,carCenter+mid,palette.metal);
    trainParts.box(.10,.28,span,side*W/2,2.50,carCenter+mid,palette.metal);
    for(const edge of [lo+.06,hi-.06])trainParts.box(.12,1.25,.12,side*W/2,1.79,carCenter+edge,palette.metal);
    trainParts.box(.025,1.12,Math.max(.05,span-.24),side*(W/2+.015),1.80,carCenter+mid,palette.glass);
    // Bench and backrest between doors. All doors retain a clear vestibule.
    if(span>1){trainParts.box(.48,.20,Math.max(.4,span-.24),side*.99,.48,carCenter+mid,palette.seat);trainParts.box(.15,.62,Math.max(.4,span-.24),side*1.18,.84,carCenter+mid,palette.seat);}
   }
   for(const [doorIndex,v]of spec.train.doorOffsets.entries()){
    const selected=carIndex===spec.train.selectedCar&&doorIndex===spec.train.selectedDoor&&side===1;
    for(const half of [-1,1]){
     const leaf=new THREE.Group();leaf.name=`Car ${carIndex+1} door ${doorIndex+1} ${side} ${half}`;leaf.position.set(side*(W/2+.018),0,carCenter+v+half*.325);
     // Only the selected pair is independently animated. The other 62 leaves
     // merge with the carriage materials instead of costing four draws each.
     const leafParts=selected?staticParts(leaf):trainParts;
     const leafBox=(bw,bh,bd,bx,by,bz,mat)=>leafParts.box(bw,bh,bd,bx+(selected?0:leaf.position.x),by,bz+(selected?0:leaf.position.z),mat);
     leafBox(.07,1.22,.64,0,.61,0,palette.metal);leafBox(.07,.30,.64,0,2.25,0,palette.metal);
     for(const edge of [-1,1])leafBox(.07,.88,.085,0,1.66,edge*.2775,palette.metal);
     leafBox(.025,.88,.47,0,1.66,0,palette.glass);leafBox(.085,.20,.64,0,.76,0,palette.green);
     if(selected){leafParts.flush();trainGroup.add(leaf);doors.push({leaf,base:leaf.position.z,half});}
    }
   }
  }
  for(const u of [-.75,.75]){trainParts.box(.045,.045,L-1,u,2.5,carCenter,palette.metal);for(let v=-8;v<=8;v+=1.15){trainParts.beam([u,2.5,carCenter+v],[u,2.25,carCenter+v],.016,palette.metal,.016,6);const ring=new THREE.TorusGeometry(.065,.012,5,10);ring.rotateY(Math.PI/2);ring.translate(u,2.18,carCenter+v);trainParts.put(ring,palette.cream);}}
  for(const u of [-.65,.65])trainParts.box(.10,.04,L-1,u,2.89,carCenter,palette.light);
  for(const bogie of [-6.7,6.7]){trainParts.box(2.10,.40,2.2,0,-.48,carCenter+bogie,palette.dark);for(const side of [-1,1])for(const off of [-.67,.67]){const wheel=new THREE.CylinderGeometry(.36,.36,.15,12);wheel.rotateZ(Math.PI/2);wheel.translate(side*.85,-.76,carCenter+bogie+off);trainParts.put(wheel,palette.dark);}}
 }
 // South cab destination and windows keep the chosen Kyoto->Nara direction legible.
 const cabV=spec.train.carCenters.at(-1)+spec.train.carLength/2+.10;
 trainParts.box(2.35,.9,.05,0,1.92,cabV,palette.dark);
 for(const side of [-1,1]){trainParts.box(.75,.63,.055,side*.64,1.94,cabV+.04,palette.glass);trainParts.box(.25,.16,.10,side*.95,.95,cabV+.08,palette.light);}
 const trainStats=trainParts.flush();
 const destination=signMaterial('普通  Local   奈良 Nara');const dest=new THREE.Mesh(new THREE.BoxGeometry(1.7,.28,.065),destination);dest.position.set(0,2.66,cabV+.06);trainGroup.add(dest);
 // Selected vestibule walls have a genuine 1.3m opening toward platform2.
 const selectedV=spec.train.carCenters[spec.train.selectedCar]+spec.train.doorOffsets[spec.train.selectedDoor];
 for(const side of [-1,1]){const a=railLocal(side*1.4,selectedV);if(side===-1)addCollider(...a,.15,19.5,railYaw,spec.train.floor,spec.train.floor+2.7,'inari-train-wall');else for(const v of [selectedV-5.2,selectedV+5.2]){const q=railLocal(1.4,v);addCollider(...q,.15,9.1,railYaw,spec.train.floor,spec.train.floor+2.7,'inari-train-door-jamb');}}
 for(const v of [-spec.train.carLength/2,spec.train.carLength/2]){const q=railLocal(0,v);addCollider(...q,2.8,.15,railYaw,spec.train.floor,spec.train.floor+2.7,'inari-selected-car-end');}
 const trainStop=trainGroup.position.clone();
 const setDoorOpen=f=>{const amount=clamp(f);for(const {leaf,base,half}of doors)leaf.position.z=base+half*.68*amount;return amount;};
 const setTrainOffset=offset=>{if(!Array.isArray(offset)||offset.length!==3||!offset.every(Number.isFinite))throw Error('Train offset must be three finite world meters');trainGroup.position.copy(trainStop).add(new THREE.Vector3(...offset));threshold.visible=Math.hypot(...offset)<.05;};
 const setMode=mode=>{const night=mode==='night';palette.interior.emissiveIntensity=night?.32:.13;palette.light.emissiveIntensity=night?1.65:.75;stationSign.emissiveIntensity=exitSign.emissiveIntensity=destination.emissiveIntensity=night?.8:.2;};
 // Own only physically built surfaces; never return arbitrary terrain as support.
 const surfaceHeight=(x,z)=>{
  const base=inariStationSurfaceHeight(spec,x,z);if(base!==null)return base;
  const dx=x-spec.track.origin[0],dz=z-spec.track.origin[1],u=dx*spec.track.east[0]+dz*spec.track.east[1],v=dx*spec.track.direction[0]+dz*spec.track.direction[1];
  if(Math.abs(u)<=1.38&&spec.train.carCenters.some(c=>Math.abs(v-c)<=spec.train.carLength/2))return spec.train.floor;
  // The visible 18cm train/platform gap is bridged only at the selected opening.
  if(u>=1.35&&u<=2.25&&Math.abs(v-selectedV)<=.65)return spec.train.floor;
  return null;
 };
 // Small threshold sheet is functional, explicit and only spans the exit doorway.
 const threshold=new THREE.Group();threshold.position.set(spec.track.origin[0],spec.train.floor,spec.track.origin[1]);threshold.rotation.y=railYaw;threshold.userData.dynamic=true;const tp=staticParts(threshold);tp.box(.9,.035,1.3,1.8,-.0175,selectedV,palette.metal);tp.flush();threshold.name='Selected doorway gap plate';group.add(threshold);
 landmarks.push({id:'jr_inari_station',label:'JR Inari — east exit',position:spec.publicExit.position},{id:'inari_platform2',label:'2 · Uji / Nara',position:spec.route.platformDoor});
 const routePoints=[spec.train.doorPosition,spec.route.platformDoor,spec.route.stairTop,spec.route.stairBottom,spec.route.gate,spec.route.exit];
 const doorCenter=railLocal(spec.train.carWidth/2,selectedV),closedDoorCollider={type:'box',args:[...doorCenter,.07,.65,railYaw,spec.train.floor,spec.train.floor+2.4,'inari-closed-train-door']};
 const api={built:true,group,trainGroup,thresholdGroup:threshold,sign,spec,colliders,closedDoorCollider,landmarks,routePoints,foundationBottom,builtIds:[spec.sourceFeature,spec.platform1.id,spec.platform2.id],setDoorOpen,setTrainOffset,setMode,surfaceHeight,sampleHeight:surfaceHeight,stats:{building:buildingStats,platform:platformStats,rail:railStats,train:trainStats},update(snapshot){setDoorOpen(snapshot.doorOpen??0);if(snapshot.trainOffset)setTrainOffset(snapshot.trainOffset);}};
 group.userData={built:true,revision:spec.revision,sourceFeature:spec.sourceFeature,provenance:spec.provenance,stats:api.stats};Object.defineProperty(group.userData,'api',{value:api,enumerable:false});
 setDoorOpen(0);root.add(group);return api;
}
