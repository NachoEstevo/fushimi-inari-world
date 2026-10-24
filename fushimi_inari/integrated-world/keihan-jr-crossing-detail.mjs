import * as THREE from 'three';
import {staticParts} from './mountain-landmarks-geometry.mjs';

const NAME='JR Nara crossing · mapped approach detail';
// OSM API way/full snapshots, 2026-10-24. Heights are modeled, not surveyed.
export const JR_CROSSING_SOURCE={west:'way/24590286',east:'way/801938138',street:'way/79699849',nodes:['node/717498925','node/3338256050'],gauge:1.067,northRailStart:-40};
const traces=[
 [[-216.912885,-267.133382],[-214.495444,-206.475392],[-210.463335,-131.512846],[-207.744854,-85.760536],[-207.279610,-81.151909],[-205.628452,-64.710020],[-202.307892,-40.219732],[-197.564234,-15.339826]],
 [[-212.780429,-266.899611],[-211.685739,-232.735659],[-209.934234,-198.571708],[-207.744854,-157.951225],[-205.774411,-118.755633],[-204.570252,-96.859089],[-203.648887,-85.382049],[-203.238379,-80.984930],[-201.942995,-67.292632],[-199.206269,-47.255124],[-195.922198,-28.308547]],
];
const crossingXZ=[[-207.744854,-85.760536],[-203.648887,-85.382049]];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const finite=p=>Array.isArray(p)&&p.every(Number.isFinite);

export function createKeihanJrCrossingSpec(features,surfaces,inariSpec){
 const road=features?.paths?.find(p=>p.id===JR_CROSSING_SOURCE.street);
 if(!road?.points||!crossingXZ.every(q=>road.points.some(p=>Math.hypot(p[0]-q[0],p[2]-q[1])<.002))||typeof surfaces?.height!=='function'||typeof inariSpec?.track?.local!=='function')return null;
 const railFloors=crossingXZ.map(p=>surfaces.height(...p)+.009);
 if(!railFloors.every(Number.isFinite)||!Number.isFinite(inariSpec.railTop))return null;
 const tracks=traces.map((trace,index)=>{
  const trackU=index===0?-inariSpec.track.trackSpacing:0,join=inariSpec.track.local(trackU,JR_CROSSING_SOURCE.northRailStart);
  if(!finite(join)||Math.hypot(join[0]-trace.at(-1)[0],join[1]-trace.at(-1)[1])>35)return null;
  const source=[...trace.map(p=>[...p]),join],crossZ=crossingXZ[index][1];
  const railHeight=z=>{
   // Keep road rails flush; use a gentle DEM-derived northern grade and the
   // already accepted station rail datum at the southern ownership seam.
   if(z>=crossZ)return railFloors[index]+(inariSpec.railTop-railFloors[index])*clamp((z-crossZ)/(join[1]-crossZ),0,1);
   const northY=surfaces.terrainHeight?.(...source[0])??surfaces.height(...source[0]);
   return railFloors[index]+(northY+.14-railFloors[index])*clamp((crossZ-z)/(crossZ-source[0][1]),0,1);
  };
  const points=source.map(p=>[p[0],railHeight(p[1]),p[1]]),lengths=[0];
  for(let i=1;i<points.length;i++)lengths.push(lengths.at(-1)+Math.hypot(points[i][0]-points[i-1][0],points[i][2]-points[i-1][2]));
  const crossingIndex=source.findIndex(p=>Math.hypot(p[0]-crossingXZ[index][0],p[1]-crossingXZ[index][1])<.001);
  const crossingDistance=lengths[crossingIndex],length=lengths.at(-1);
  const at=distance=>{
   const absolute=distance+crossingDistance;
   if(absolute>length){const q=inariSpec.track.local(trackU,JR_CROSSING_SOURCE.northRailStart+absolute-length);return {position:[q[0],inariSpec.railTop,q[1]],direction:[...inariSpec.track.direction]};}
   const s=clamp(absolute,0,length);let i=1;while(i<lengths.length-1&&lengths[i]<s)i++;
   const a=points[i-1],b=points[i],span=lengths[i]-lengths[i-1],t=(s-lengths[i-1])/span;
   return {position:a.map((v,k)=>v+(b[k]-v)*t),direction:[(b[0]-a[0])/span,(b[2]-a[2])/span]};
  };
  return {sourceId:index===0?JR_CROSSING_SOURCE.west:JR_CROSSING_SOURCE.east,points,source,railHeight,length,crossingDistance,at,trackU,join};
 });
 if(tracks.some(t=>!t||t.points.some(p=>!finite(p))))return null;
 return {revision:'keihan-jr-crossing-2',source:JR_CROSSING_SOURCE,tracks,crossing:[-205.69687,(railFloors[0]+railFloors[1])/2,-85.57129],roadBounds:[-212.4,-198.7,-93.4,-77.5],gauge:1.067,train:{carLength:19.5,carSpacing:20.2,carWidth:2.8,cars:2,length:39.7,speed:8.5,stopFront:-19,initialFront:-125,endFront:225},inferred:'Rail heights and last source-node to existing station tangent transition; train appearance, dimensions, timing and crossing equipment sizes. No timetable or surveyed claim.'};
}

function segmentEntersRect(from,to,rect){
 let lo=0,hi=1;for(const [axis,min,max]of [[0,rect[0],rect[1]],[2,rect[2],rect[3]]]){const d=to[axis]-from[axis];if(Math.abs(d)<1e-9){if(from[axis]<min||from[axis]>max)return false;continue;}const a=(min-from[axis])/d,b=(max-from[axis])/d;lo=Math.max(lo,Math.min(a,b));hi=Math.min(hi,Math.max(a,b));if(lo>hi)return false;}return true;
}
const inRect=(p,r)=>p[0]>=r[0]&&p[0]<=r[1]&&p[2]>=r[2]&&p[2]<=r[3];

// Deterministic bounded state machine, independently tested without WebGL.
// The movement guard is mandatory: proximity alone cannot protect a crossing
// after a train commits and a visitor subsequently approaches it.
export function createJrCrossingController(spec){
 const state={phase:'approach',front:spec.train.initialFront,clock:0,barrier:0,passes:0,active:false};
 const status=()=>state.phase==='warning'?'Crossing closing':state.phase==='passing'?'Train crossing':state.phase==='waiting'?'Train waiting':'Crossing open';
 const occupied=p=>inRect(p,spec.roadBounds)&&Math.abs(p[1]-spec.crossing[1]-1.7)<5;
 const canMove=(from,to)=>{
  if(!finite(from)||!finite(to))return false;
  if(!['warning','passing'].includes(state.phase)||Math.min(from[1],to[1])>spec.crossing[1]+6)return true;
  if(inRect(from,spec.roadBounds))return !inRect(to,spec.roadBounds)||Math.hypot(to[0]-spec.crossing[0],to[2]-spec.crossing[2])>Math.hypot(from[0]-spec.crossing[0],from[2]-spec.crossing[2]);
  return !segmentEntersRect(from,to,spec.roadBounds);
 };
 function step(dt,camera){
  dt=clamp(Number.isFinite(dt)?dt:0,0,.1);const distance=Math.hypot(camera[0]-spec.crossing[0],camera[2]-spec.crossing[2]);
  state.active=distance<190||state.phase==='passing'||state.phase==='departure';
  if(state.phase==='gone'){
   state.clock+=dt;
   // Repeat for a visitor who remains at the bridge, not only after leaving
   // the whole neighborhood. Both the departing and reset formation must be
   // distant; a viewer beside either train end must never see it disappear.
   const trainDistance=front=>{const a=spec.tracks[0].at(front).position,b=spec.tracks[0].at(front-spec.train.length).position,dx=b[0]-a[0],dz=b[2]-a[2],t=clamp(((camera[0]-a[0])*dx+(camera[2]-a[2])*dz)/(dx*dx+dz*dz),0,1);return Math.hypot(camera[0]-a[0]-dx*t,camera[2]-a[2]-dz*t);};
   if((state.clock>=30||distance>190)&&trainDistance(state.front)>100&&trainDistance(spec.train.initialFront)>100){state.phase='approach';state.front=spec.train.initialFront;state.clock=0;return state;}
  }
  if(!state.active)return state;
  if(state.phase==='approach'){state.front=Math.min(spec.train.stopFront,state.front+spec.train.speed*dt);if(state.front===spec.train.stopFront){state.phase='waiting';state.clock=0;}}
  else if(state.phase==='waiting'){if(!occupied(camera)&&distance>12){state.clock+=dt;if(state.clock>=1){state.phase='warning';state.clock=0;}}else state.clock=0;}
  else if(state.phase==='warning'){
   if(occupied(camera)){state.phase='waiting';state.clock=0;}
   else{state.clock+=dt;if(state.clock>=4){state.phase='passing';state.clock=0;}}
  }else if(state.phase==='passing'){
   if(!occupied(camera))state.front+=spec.train.speed*dt;
   if(state.front-spec.train.length>10){state.phase='departure';state.clock=0;state.passes++;}
  }else if(state.phase==='departure'){
   state.front=Math.min(spec.train.endFront,state.front+spec.train.speed*dt);
   if(state.front===spec.train.endFront){state.phase='gone';state.clock=0;}
  }
  const target=['warning','passing'].includes(state.phase)?1:0;state.barrier+=clamp(target-state.barrier,-dt*.45,dt*.45);
  return state;
 }
 return {state,step,canMove,get status(){return status();},blockedMessage:'Train crossing — please wait behind the barrier.'};
}

function labelMaterial(){
 const material=new THREE.MeshStandardMaterial({color:'#e7eadc',roughness:.72});
 if(!globalThis.document?.createElement)return material;
 const canvas=document.createElement('canvas');canvas.width=512;canvas.height=128;const c=canvas.getContext('2d');if(!c)return material;
 c.fillStyle='#183321';c.fillRect(0,0,512,128);c.fillStyle='#f2f2de';c.font='bold 36px sans-serif';c.textAlign='center';c.fillText('普通  LOCAL',256,49);c.font='25px sans-serif';c.fillText('JR NARA LINE',256,96);
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;material.map=texture;return material;
}

export function buildKeihanJrCrossingDetail(root,features,surfaces,colliders=[],options={}){
 const old=root.getObjectByName(NAME);if(old)return old.userData.api;
 const spec=options.spec??createKeihanJrCrossingSpec(features,surfaces,options.inariSpec);
 if(!spec)return {built:false,reason:'Mapped JR crossing or station seam unavailable'};
 const group=new THREE.Group();group.name=NAME;group.userData.dynamic=true;
 const colors={steel:'#adb6b3',dark:'#242c2b',ballast:'#777b70',sleeper:'#bbb9a9',rust:'#796352',green:'#438c63',cream:'#e7e7db',glass:'#344d50',yellow:'#e8b934',red:'#d13225'};
 const palette=Object.fromEntries(Object.entries(colors).map(([key,color])=>[key,new THREE.MeshStandardMaterial({color,roughness:key==='steel'?.42:key==='glass'?.26:.88,metalness:key==='steel'?.55:0})]));
 palette.light=new THREE.MeshStandardMaterial({color:'#fff1bd',emissive:'#ffecb0',emissiveIntensity:.8,roughness:.4});palette.label=labelMaterial();
 const detailGroups=[],buckets=new Map(),partsFor=z=>{
  const key=Math.floor(z/40);if(!buckets.has(key)){const g=new THREE.Group();g.name=`JR track detail chunk ${key}`;group.add(g);detailGroups.push(g);buckets.set(key,{group:g,parts:staticParts(g)});}return buckets.get(key).parts;
 };
 const trackStats={batches:0,triangles:0,sleepers:0};
 for(const track of spec.tracks){
  // Road and sidewalk embedded rails remain owned by keihan-approach. No
  // ballast, rail web or sleepers intrude into that public crossing envelope.
  for(let s=-track.crossingDistance;s<track.length-track.crossingDistance;s+=1.8){
   const end=Math.min(s+1.8,track.length-track.crossingDistance),mid=(s+end)/2,a=track.at(s),b=track.at(end);
   if(a.position[2]<=spec.roadBounds[3]&&b.position[2]>=spec.roadBounds[2])continue;
   const p=partsFor(a.position[2]),n=[a.direction[1],-a.direction[0]],wide=1.6;
   const corner=(q,side,y)=>[q.position[0]+n[0]*wide*side,q.position[1]+y,q.position[2]+n[1]*wide*side];
   const al=corner(a,-1,-.10),ar=corner(a,1,-.10),bl=corner(b,-1,-.10),br=corner(b,1,-.10);
   p.sheet([...al,...bl,...ar,...ar,...bl,...br],palette.ballast);
   // Deep side faces meet terrain rather than floating on the DEM slope.
   for(const side of [-1,1]){const aa=corner(a,side,-.10),bb=corner(b,side,-.10),low=q=>[q[0],Math.min(q[1]-.3,surfaces.terrainHeight?.(q[0],q[2])??q[1]-.3),q[2]],la=low(aa),lb=low(bb);p.sheet([...aa,...bb,...la,...la,...bb,...lb],palette.ballast);}
  }
  const roadHeight=(x,z)=>{let best=null;for(const s of surfaces.segments.filter(s=>s.id===JR_CROSSING_SOURCE.street)){const dx=s.b[0]-s.a[0],dz=s.b[2]-s.a[2],t=clamp(((x-s.a[0])*dx+(z-s.a[2])*dz)/(dx*dx+dz*dz),0,1),d=Math.hypot(x-s.a[0]-dx*t,z-s.a[2]-dz*t);if(!best||d<best.d)best={d,y:s.ya+(s.yb-s.ya)*t};}return best?.y;};
  // Connect exactly to the old embedded ten-metre heads, including their
  // earlier .079/.99687 tangent. Reconcile to the mapped curve outside them.
  const railPoint=(s,side)=>{
   if(Math.abs(Math.abs(s)-5)<1e-7){const center=crossingXZ[spec.tracks.indexOf(track)],x=center[0]+.079*s+.99687*.5335*side,z=center[1]+.99687*s-.079*.5335*side;return [x,roadHeight(x,z)+.009,z];}
   const q=track.at(s);return [q.position[0]+q.direction[1]*spec.gauge*.5*side,q.position[1],q.position[2]-q.direction[0]*spec.gauge*.5*side];
  };
  for(const [lo,hi]of [[-track.crossingDistance,-5],[5,track.length-track.crossingDistance]])for(let s=lo;s<hi;s+=1.8){const end=Math.min(s+1.8,hi),p=partsFor(track.at(s).position[2]);for(const side of [-1,1]){const a=railPoint(s,side),b=railPoint(end,side);a[1]-=.026;b[1]-=.026;p.beam(a,b,.036,palette.steel,.036,4);a[1]-=.055;b[1]-=.055;p.beam(a,b,.029,palette.rust,.029,4);}}
  for(let s=-track.crossingDistance+.3;s<track.length-track.crossingDistance;s+=.68){const q=track.at(s);if(q.position[2]>=spec.roadBounds[2]&&q.position[2]<=spec.roadBounds[3])continue;
   const p=partsFor(q.position[2]),yaw=Math.atan2(q.direction[0],q.direction[1]),g=new THREE.BoxGeometry(2.12,.11,.22);g.rotateY(yaw);g.translate(q.position[0],q.position[1]-.12,q.position[2]);p.put(g,palette.sleeper);trackStats.sleepers++;
   for(const side of [-1,1]){const x=q.position[0]+q.direction[1]*spec.gauge*.5*side,z=q.position[2]-q.direction[0]*spec.gauge*.5*side;p.box(.18,.05,.26,x,q.position[1]-.064,z,palette.dark);}
  }
 }
 // Contact wires, suspension droppers, insulators and masts use the retained
 // rail samples. No point lights, reflection captures or terrain replacement.
 for(let s=-145;s<=45;s+=32){
  const left=spec.tracks[0].at(s),right=spec.tracks[1].at(s),n=[left.direction[1],-left.direction[0]],p=partsFor(left.position[2]);
  const a=[left.position[0]-n[0]*2.0,left.position[1],left.position[2]-n[1]*2.0],b=[right.position[0]+n[0]*2.0,right.position[1],right.position[2]+n[1]*2.0];
  for(const q of [a,b]){p.box(.45,.32,.45,q[0],q[1]+.05,q[2],palette.sleeper);p.beam([q[0],q[1]-.12,q[2]],[q[0],q[1]+6.5,q[2]],.085,palette.steel,.065,8);}
  p.beam([a[0],a[1]+6.1,a[2]],[b[0],b[1]+6.1,b[2]],.065,palette.steel,.065,6);
  for(const q of [left,right])for(let i=0;i<4;i++)p.beam([q.position[0],q.position[1]+5.6+i*.10,q.position[2]],[q.position[0],q.position[1]+5.67+i*.10,q.position[2]],.09,palette.cream,.09,8);
 }
 for(const track of spec.tracks)for(let s=-track.crossingDistance;s<track.length-track.crossingDistance;s+=8){const a=track.at(s),b=track.at(Math.min(s+8,track.length-track.crossingDistance)),p=partsFor(a.position[2]);for(const h of [5.35,5.88])p.beam([a.position[0],a.position[1]+h,a.position[2]],[b.position[0],b.position[1]+h,b.position[2]],.012,palette.dark,.012,4);p.beam([a.position[0],a.position[1]+5.35,a.position[2]],[a.position[0],a.position[1]+5.88,a.position[2]],.009,palette.dark,.009,4);}
 for(const bucket of buckets.values()){const stats=bucket.parts.flush();trackStats.batches+=stats.batches;trackStats.triangles+=stats.triangles;bucket.group.traverse(o=>{if(o.isMesh)o.castShadow=false;});}

 const devices=new THREE.Group();devices.name='JR crossing mechanisms';group.add(devices);detailGroups.push(devices);
 const parts=staticParts(devices),arms=[],lights=[],pending=[];
 for(const [i,[x,z]]of [[-210.65,-89.65],[-199.2,-81.0]].entries()){
  const y=surfaces.height(x,z);for(let band=0;band<9;band++)parts.box(.16,.33,.16,x,y+.20+band*.33,z,band%2?palette.dark:palette.yellow);
  for(const angle of [-Math.PI/4,Math.PI/4]){const g=new THREE.BoxGeometry(.16,1.22,.08);g.rotateZ(angle);g.translate(x,y+3.04,z);parts.put(g,palette.yellow);}
  parts.box(.48,.98,.44,x,y+.49,z,palette.yellow);parts.box(.35,.68,.025,x,y+.52,z+.235,palette.steel);
  for(const dz of [-.12,.12])parts.box(.025,.025,.025,x+.13,y+.72,z+dz,palette.dark);
  for(const side of [-1,1]){
   parts.beam([x+side*.28,y+2.41,z-.10],[x+side*.28,y+2.41,z+.10],.17,palette.dark,.17,12);
   const material=new THREE.MeshStandardMaterial({color:'#6d251d',emissive:'#ff2413',emissiveIntensity:0}),lens=new THREE.Mesh(new THREE.CylinderGeometry(.125,.125,.025,12),material);lens.rotation.x=Math.PI/2;lens.position.set(x+side*.28,y+2.41,z+.12);devices.add(lens);lights.push({material,side});
  }
  const hinge=new THREE.Group();hinge.position.set(x+(i?-.36:.36),y+1.05,z);hinge.userData.dynamic=true;devices.add(hinge);const armParts=staticParts(hinge),length=8.2;
  for(let k=0;k<20;k++)armParts.box(.095,length/20,.095,0,(k+.5)*length/20,0,k%2?palette.dark:palette.yellow);armParts.box(.32,.42,.28,0,-.08,0,palette.steel);armParts.flush();arms.push({group:hinge,sign:i?-1:1});
  pending.push({type:'cylinder',args:[x,z,.3,y,y+3.5,'inari_crossing_device']});
 }
 const deviceStats=parts.flush();

 const trainGroup=new THREE.Group();trainGroup.name='JR Nara passing local · interpreted stainless green';trainGroup.userData.dynamic=true;group.add(trainGroup);
 const cars=[],trainStats={batches:0,triangles:0};
 for(let car=0;car<spec.train.cars;car++){
  const carGroup=new THREE.Group();carGroup.name=`Passing local car ${car+1}`;trainGroup.add(carGroup);cars.push(carGroup);const p=staticParts(carGroup),L=spec.train.carLength,W=spec.train.carWidth;
  p.box(W,.20,L,0,1.12,0,palette.dark);p.box(W,.38,L,0,1.45,0,palette.steel);p.box(W+.06,.18,L+.06,0,3.62,0,palette.cream);p.box(2.32,.32,5.8,0,3.85,0,palette.steel);
  for(const side of [-1,1]){
   p.box(.09,.22,L,side*W/2,1.77,0,palette.green);p.box(.08,.18,L,side*W/2,3.44,0,palette.steel);
   for(const z of [-7.05,-2.35,2.35,7.05]){
    p.box(.10,1.70,1.32,side*(W/2+.01),2.52,z,palette.steel);
    for(const leaf of [-1,1]){p.box(.022,.80,.49,side*(W/2+.067),2.85,z+leaf*.32,palette.glass);p.box(.026,1.64,.018,side*(W/2+.07),2.50,z+leaf*.05,palette.dark);p.box(.03,.17,.025,side*(W/2+.085),2.33,z+leaf*.16,palette.dark);}
   }
   for(const z of [-9.05,-4.7,0,4.7,9.05]){
    const width=Math.abs(z)>8?1.1:2.9;p.box(.055,1.27,width,side*(W/2+.02),2.68,z,palette.dark);p.box(.065,1.12,width-.12,side*(W/2+.06),2.68,z,palette.glass);
    p.box(.07,.045,width,side*(W/2+.085),2.35,z,palette.steel);p.box(.07,1.18,.045,side*(W/2+.085),2.68,z,palette.steel);
   }
   for(const z of [-5.1,5.1]){const mesh=new THREE.Mesh(new THREE.PlaneGeometry(1.2,.26),palette.label);mesh.rotation.y=side*Math.PI/2;mesh.position.set(side*(W/2+.09),3.31,z);carGroup.add(mesh);}
   for(let rib=0;rib<4;rib++)p.box(.025,.025,L-.2,side*(W/2+.06),1.29+rib*.085,0,palette.steel);
  }
  for(const z of [-6.5,6.5]){
   p.box(2.06,.40,2.9,0,.57,z,palette.dark);
   for(const dz of [-.88,.88]){p.beam([-1.30,.36,z+dz],[1.30,.36,z+dz],.36,palette.dark,.36,12);for(const side of [-1,1])p.beam([side*1.31,.36,z+dz],[side*1.34,.36,z+dz],.17,palette.steel,.17,10);}
   p.box(1.4,.37,1.9,0,.72,z+2.1,palette.steel);
  }
  for(const end of [-1,1]){
   p.box(W,2.28,.12,0,2.45,end*L/2,palette.steel);p.box(2.30,.98,.045,0,2.92,end*(L/2+.08),palette.glass);p.box(W,.22,.15,0,1.78,end*(L/2+.07),palette.green);p.box(.72,.12,.52,0,.90,end*(L/2+.18),palette.dark);
   if((car===0&&end===1)||(car===spec.train.cars-1&&end===-1)){
    for(const side of [-1,1]){p.box(.20,.17,.06,side*.96,1.98,end*(L/2+.12),end===1?palette.light:palette.red);p.beam([side*.75,2.57,end*(L/2+.13)],[side*.38,3.02,end*(L/2+.13)],.013,palette.dark,.013,4);}
    const sign=new THREE.Mesh(new THREE.PlaneGeometry(1.25,.31),palette.label);sign.rotation.y=end===1?0:Math.PI;sign.position.set(0,3.42,end*(L/2+.13));carGroup.add(sign);
   }
  }
  // Roof cooling fins and a compact diamond pantograph silhouette.
  for(let fin=-2.5;fin<=2.5;fin+=.25)p.box(2.16,.05,.035,0,4.025,fin,palette.dark);
  if(car===0){for(const side of [-1,1]){p.beam([side*.55,3.85,-5],[side*.55,4.59,-5.7],.024,palette.dark,.024,6);p.beam([side*.55,4.59,-5.7],[side*.55,5.32,-5],.024,palette.dark,.024,6);}p.box(1.6,.055,.13,0,5.35,-5,palette.dark);}
  const stats=p.flush(),labelCount=carGroup.children.filter(o=>o.material===palette.label).length;trainStats.batches+=stats.batches+labelCount;trainStats.triangles+=stats.triangles+labelCount*2;
 }
 const controller=createJrCrossingController(spec);let lastTime=null,initialized=false,lastFront=null;
 function update(camera,time){
  const position=camera.position?[camera.position.x,camera.position.y,camera.position.z]:camera,dt=lastTime===null?0:Math.max(0,time-lastTime);lastTime=time;
  controller.step(dt,position);const s=controller.state;
  if(initialized&&!s.active&&lastFront===s.front)return controller.status;
  initialized=true;lastFront=s.front;
  for(let i=0;i<cars.length;i++){const center=s.front-spec.train.carLength/2-i*spec.train.carSpacing,pose=spec.tracks[0].at(center),front=spec.tracks[0].at(center+5),back=spec.tracks[0].at(center-5);cars[i].position.set(...pose.position);cars[i].rotation.set(Math.atan2(back.position[1]-front.position[1],10),Math.atan2(pose.direction[0],pose.direction[1]),0);}
  for(const arm of arms)arm.group.rotation.x=arm.sign*s.barrier*Math.PI/2;
  const warning=['warning','passing'].includes(s.phase);for(const lens of lights)lens.material.emissiveIntensity=warning&&Math.floor(time*2)%2===(lens.side===1?1:0)?1.8:0;
  group.userData.crossingState={phase:s.phase,front:s.front,barrier:s.barrier,passes:s.passes};
  return controller.status;
 }
 const api={built:true,group,trainGroup,detailGroups,update,canMove:controller.canMove,controller,spec,get status(){return controller.status;},blockedMessage:controller.blockedMessage,stats:{tracks:trackStats,devices:deviceStats,train:trainStats,cars:cars.length,colliders:pending.length,lightsAdded:0},provenance:'Mapped OSM rail24590286/801938138, existing road crossing nodes and JR station seam; interpreted 205-family stainless-green local and crossing fittings.'};
 group.userData.stats=api.stats;Object.defineProperty(group.userData,'api',{value:api,enumerable:false});root.add(group);colliders.push(...pending);update([0,40,0],0);return api;
}
