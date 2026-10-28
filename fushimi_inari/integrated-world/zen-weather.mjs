import * as THREE from 'three/webgpu';
import {attribute,positionLocal,positionWorld,vec3,uniform,float,smoothstep,select} from 'three/tsl';
import {createZenAmbientAudio} from './zen-ambient-audio.mjs';
import {suehiroZenShelter} from './zen-shelter-metadata.mjs';

const MAX_RAIN=1400,MASK_SLOTS=4;
const rectangle=(x,z,w,d)=>[[x-w/2,0,z-d/2],[x+w/2,0,z-d/2],[x+w/2,0,z+d/2],[x-w/2,0,z+d/2]];

// Only successful, known geometry owners grant cover. No building-centre or
// tree-collider guesses: a footprint without its emitted roof height is skipped.
export function zenShelters(assembly={},shop){
 const candidates=[],station=assembly.keihanStation;
 if(station?.built&&Number.isFinite(station.spec?.platformFloor)){
  const floor=station.spec.platformFloor;
  for(const [id,x,z,w,d]of [['south',-302.4,-176.7,6.8,50],['middle',-305.1,-249,3.2,96],['west',-319,-228,3.8,148]])
   candidates.push({id:'keihan-platform-'+id,points:rectangle(x,z,w-.16,d-.16),floor,roofY:floor+3.175});
  const y=station.spec.publicExit?.position?.[1];
  if(Number.isFinite(y))candidates.push({id:'keihan-entry',points:rectangle(-302.55,-142.22,5.34,19.94),floor:y-.1,roofY:y+3.27});
  const {train,track}=station.spec,center=train?.carCenters?.[train.selectedCar];
  if(station.trainGroup&&Number.isFinite(center)&&Number.isFinite(train.floor)&&Number.isFinite(train.carWidth)&&Number.isFinite(train.carLength)&&track?.origin?.length===2&&track.east?.length===2&&track.direction?.length===2){
   const points=[[-1,-1],[1,-1],[1,1],[-1,1]].map(([side,end])=>{
    const u=side*(train.carWidth/2-.06),v=center+end*(train.carLength/2-.08);
    return [track.origin[0]+track.east[0]*u+track.direction[0]*v,0,track.origin[1]+track.east[1]*u+track.direction[1]*v];
   });
   candidates.push({id:'keihan-selected-car',points,floor:train.floor,roofY:train.floor+2.905,moving:station.trainGroup,origin:[track.origin[0],train.floor,track.origin[1]]});
  }
 }
 for(const s of assembly.keihanFrontages?.storefronts??[]){
  if(!s.points?.[s.edge]||!s.t||!s.n||!Number.isFinite(s.floor)||!Number.isFinite(s.width))continue;
  const a=s.points[s.edge],row=s.kind?.endsWith('-row'),front=row?.39:.60,back=row?.02:-.10;
  // The row owner emits three cloth covers of bayWidth-.18, not one roof.
  // Keep their .18m gaps open; green-row higher trim is conservatively omitted.
  const count=row?3:1,bay=s.width/count;
  for(let i=0;i<count;i++){
   const lo=row?i*bay+.09:.12,hi=row?(i+1)*bay-.09:s.width-.12;
   const points=[[lo,back],[hi,back],[hi,front],[lo,front]].map(([u,v])=>[a[0]+s.t[0]*u+s.n[0]*v,0,a[2]+s.t[1]*u+s.n[1]*v]);
   candidates.push({id:'shop-awning-'+s.id+(row?'-bay-'+i:''),points,floor:s.floor,roofY:s.floor+(row?2.62:2.80)});
  }
 }
 const summitShelter=suehiroZenShelter(shop);if(summitShelter)candidates.push(summitShelter);
 candidates.push(...(assembly.zenShelters??[]),...(shop?.shelters??[]));
 if(shop?.shelter)candidates.push(shop.shelter);
 const result=[],ids=new Set();
 for(const c of candidates){
  const points=c.points??c.roofPoints,floor=c.floor??c.base,roofY=c.roofY??c.eave;
  if(!c.id||ids.has(c.id)||!Array.isArray(points)||points.length<4||!Number.isFinite(floor)||!Number.isFinite(roofY)||roofY-floor<1.9)continue;
  const ring=points.slice(0,4);if(ring.some(p=>!Array.isArray(p)||p.length!==3||!p.every(Number.isFinite)))continue;
  let area=0,sign=0,convex=true;
  for(let i=0;i<4;i++){
   const a=ring[i],b=ring[(i+1)%4],c=ring[(i+2)%4];area+=a[0]*b[2]-b[0]*a[2];
   const cross=(b[0]-a[0])*(c[2]-b[2])-(b[2]-a[2])*(c[0]-b[0]);
   if(Math.abs(cross)<1e-6){convex=false;break;}if(sign&&Math.sign(cross)!==sign){convex=false;break;}sign=Math.sign(cross);
  }
  if(!convex||Math.abs(area)<.02)continue;
  const xs=ring.map(p=>p[0]),zs=ring.map(p=>p[2]);
  result.push({id:c.id,points:ring,floor,roofY,minX:Math.min(...xs),maxX:Math.max(...xs),minZ:Math.min(...zs),maxZ:Math.max(...zs),
   ...(c.moving?{moving:c.moving,origin:c.origin,basePoints:ring.map(p=>p.slice()),baseFloor:floor,baseRoofY:roofY,lastX:NaN,lastY:NaN,lastZ:NaN}:{})});ids.add(c.id);
  if(result.length===48)break;
 }
 return result;
}
function inside(x,z,s){
 if(x<s.minX||x>s.maxX||z<s.minZ||z>s.maxZ)return false;
 let positive=false,negative=false;
 for(let i=0;i<4;i++){
  const a=s.points[i],b=s.points[(i+1)%4],cross=(b[0]-a[0])*(z-a[2])-(b[2]-a[2])*(x-a[0]);
  positive||=cross>1e-6;negative||=cross< -1e-6;if(positive&&negative)return false;
 }
 return true;
}
export function shelterAt(position,shelters){
 for(const s of shelters)if(position.y>=s.floor-.15&&position.y<s.roofY-.04&&inside(position.x,position.z,s))return s;
 return null;
}

export function createZenWeather({scene,camera,assembly={},shop,enabled=true,getQuality=()=> 'balanced'}={}){
 const group=new THREE.Group();group.name='Quiet weather';scene.add(group);
 const shelters=zenShelters(assembly,shop),movingShelters=shelters.filter(s=>s.moving),audio=createZenAmbientAudio();
 const stats={mode:'clear',umbrella:false,sheltered:false,shelter:null,particles:700,draws:0,elapsed:0,disposed:false,extraLights:0,renderTargets:0,shelterMaskSlots:MASK_SLOTS};
 const positions=new Float32Array(MAX_RAIN*6),phases=new Float32Array(MAX_RAIN*2),ends=new Float32Array(MAX_RAIN*2);
 let seed=1028;const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
 for(let i=0;i<MAX_RAIN;i++){
  const x=(random()-.5)*20,z=(random()-.5)*20,phase=random(),length=.10+random()*.08;
  positions.set([x,0,z,x,0,z],i*6);phases[i*2]=phase;phases[i*2+1]=phase;ends[i*2+1]=length;
 }
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));
 geometry.setAttribute('rainPhase',new THREE.BufferAttribute(phases,1));geometry.setAttribute('rainEnd',new THREE.BufferAttribute(ends,1));geometry.setDrawRange(0,1400);
 const clock=uniform(0),strength=uniform(0),umbrellaOn=uniform(false),umbrellaCenter=uniform(new THREE.Vector3());
 const y=attribute('rainPhase','float').sub(clock.mul(.32)).fract().mul(14).sub(4).add(attribute('rainEnd','float'));
 const material=new THREE.LineBasicNodeMaterial({color:'#c8d8df',transparent:true,depthWrite:false,fog:true});
 material.positionNode=vec3(positionLocal.x,y,positionLocal.z);
 let alpha=strength.mul(float(1).sub(smoothstep(7.5,10,positionLocal.xz.length())));
 const masks=Array.from({length:MASK_SLOTS},()=>({points:Array.from({length:4},()=>uniform(new THREE.Vector2())),floor:uniform(0),roof:uniform(0),on:uniform(false)}));
 for(const m of masks){
  let positive=null,negative=null;
  for(let i=0;i<4;i++){
   const a=m.points[i],b=m.points[(i+1)%4];
   const cross=b.x.sub(a.x).mul(positionWorld.z.sub(a.y)).sub(b.y.sub(a.y).mul(positionWorld.x.sub(a.x)));
   positive=positive?positive.and(cross.greaterThanEqual(0)):cross.greaterThanEqual(0);
   negative=negative?negative.and(cross.lessThanEqual(0)):cross.lessThanEqual(0);
  }
  const covered=m.on.and(positive.or(negative)).and(positionWorld.y.lessThan(m.roof)).and(positionWorld.y.greaterThan(m.floor));
  alpha=alpha.mul(select(covered,0,1));
 }
 const underUmbrella=umbrellaOn.and(positionWorld.xz.sub(umbrellaCenter.xz).length().lessThan(.70))
  .and(positionWorld.y.lessThan(umbrellaCenter.y)).and(positionWorld.y.greaterThan(umbrellaCenter.y.sub(2.6)));
 material.opacityNode=alpha.mul(select(underUmbrella,0,1));
 const rain=new THREE.LineSegments(geometry,material);rain.name='Quiet drizzle';rain.frustumCulled=false;rain.visible=false;rain.renderOrder=3;group.add(rain);
 const umbrella=new THREE.Group();umbrella.name='Held rain umbrella';umbrella.visible=false;group.add(umbrella);
 const canopyGeo=new THREE.ConeGeometry(.70,.23,12,1,true),shaftGeo=new THREE.CylinderGeometry(.008,.008,1.30,6);
 const canopyMat=new THREE.MeshStandardMaterial({color:'#b8aa91',roughness:.83,side:THREE.DoubleSide,forceSinglePass:true});
 const shaftMat=new THREE.MeshStandardMaterial({color:'#5e5b52',roughness:.55,metalness:.25});
 const canopy=new THREE.Mesh(canopyGeo,canopyMat),shaft=new THREE.Mesh(shaftGeo,shaftMat);
 canopy.position.set(.30,.62,-.16);shaft.position.set(.30,-.05,-.16);umbrella.add(canopy,shaft);
 const view=new THREE.Vector3(),lastMaskPosition=new THREE.Vector3(Infinity,Infinity,Infinity),nearest=new Int16Array(MASK_SLOTS),distances=new Float64Array(MASK_SLOTS);
 const soundState={raining:false,sheltered:false,umbrella:false,blocked:false};
 let disposed=false,maskTime=1;
 function updateMovingShelters(){
  for(const s of movingShelters){
   const p=s.moving.position;if(p.x===s.lastX&&p.y===s.lastY&&p.z===s.lastZ)continue;
   s.lastX=p.x;s.lastY=p.y;s.lastZ=p.z;const dx=p.x-s.origin[0],dy=p.y-s.origin[1],dz=p.z-s.origin[2];
   s.minX=Infinity;s.maxX=-Infinity;s.minZ=Infinity;s.maxZ=-Infinity;
   for(let i=0;i<4;i++){const q=s.points[i],b=s.basePoints[i];q[0]=b[0]+dx;q[2]=b[2]+dz;s.minX=Math.min(s.minX,q[0]);s.maxX=Math.max(s.maxX,q[0]);s.minZ=Math.min(s.minZ,q[2]);s.maxZ=Math.max(s.maxZ,q[2]);}
   s.floor=s.baseFloor+dy;s.roofY=s.baseRoofY+dy;maskTime=1;
  }
 }
 function chooseMasks(){
  nearest.fill(-1);distances.fill(Infinity);
  for(let i=0;i<shelters.length;i++){
   const s=shelters[i],p=camera.position,dx=Math.max(s.minX-p.x,0,p.x-s.maxX),dz=Math.max(s.minZ-p.z,0,p.z-s.maxZ),d=dx*dx+dz*dz;
   if(d>225||p.y+10<s.floor||p.y-4>s.roofY)continue;
   for(let j=0;j<MASK_SLOTS;j++)if(d<distances[j]){for(let k=MASK_SLOTS-1;k>j;k--){nearest[k]=nearest[k-1];distances[k]=distances[k-1];}nearest[j]=i;distances[j]=d;break;}
  }
  for(let i=0;i<MASK_SLOTS;i++){
   const m=masks[i],s=shelters[nearest[i]];m.on.value=!!s;if(!s)continue;
   for(let j=0;j<4;j++)m.points[j].value.set(s.points[j][0],s.points[j][2]);m.floor.value=s.floor-.15;m.roof.value=s.roofY;
  }
  lastMaskPosition.copy(camera.position);maskTime=0;
 }
 return {group,stats,get sheltered(){return stats.sheltered;},setMode(value){if(disposed)return;stats.mode=enabled&&value==='drizzle'?'drizzle':'clear';},
  setUmbrella(value){if(!disposed)stats.umbrella=!!value;},setAudioEnabled(value,options){return audio.setEnabled(value,options);},setVolume(value){audio.setVolume(value);},purr:()=>audio.purr(),
  async prepare(compile){
   if(disposed)return;const rainVisible=rain.visible,umbrellaVisible=umbrella.visible;rain.visible=true;umbrella.visible=true;
   try{await compile();}finally{rain.visible=!disposed&&rainVisible;umbrella.visible=!disposed&&umbrellaVisible;}
  },
  update(dt,time,{blocked=false}={}){
   if(disposed)return;
   soundState.blocked=!!blocked;
   if(!blocked&&Number.isFinite(dt)&&dt>0){
    const seconds=Math.min(.1,dt);stats.elapsed+=seconds;clock.value=stats.elapsed;maskTime+=seconds;
    updateMovingShelters();
    const raining=stats.mode==='drizzle';strength.value=THREE.MathUtils.damp(strength.value,raining?.20:0,6,seconds);
    rain.visible=raining||strength.value>.001;rain.position.copy(camera.position);
    const quality=getQuality(),count=quality==='high'||quality==='ultra'?MAX_RAIN:700;
    if(count!==stats.particles){stats.particles=count;geometry.setDrawRange(0,count*2);}
    const shelter=shelterAt(camera.position,shelters);stats.sheltered=!!shelter;stats.shelter=shelter?.id??null;
    if(maskTime>=.25||lastMaskPosition.distanceToSquared(camera.position)>.25)chooseMasks();
    umbrella.visible=stats.umbrella&&rain.visible;umbrellaOn.value=umbrella.visible;
    if(umbrella.visible){
     umbrella.position.copy(camera.position);camera.getWorldDirection(view);const yaw=Math.atan2(-view.x,-view.z);umbrella.rotation.y=yaw;
     umbrellaCenter.value.set(camera.position.x+.30*Math.cos(yaw)-.16*Math.sin(yaw),camera.position.y+.62,camera.position.z-.30*Math.sin(yaw)-.16*Math.cos(yaw));
    }
    stats.draws=Number(rain.visible)+(umbrella.visible?2:0);
    soundState.raining=raining;soundState.sheltered=stats.sheltered;soundState.umbrella=stats.umbrella;
   }
   audio.update(soundState);
  },dispose(){
   if(disposed)return;disposed=true;stats.disposed=true;stats.draws=0;group.removeFromParent();
   geometry.dispose();material.dispose();canopyGeo.dispose();shaftGeo.dispose();canopyMat.dispose();shaftMat.dispose();audio.dispose();
  }};
}
