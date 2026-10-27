import * as THREE from 'three/webgpu';
import {uv,float,uniform,exp,sin,smoothstep,positionWorld,cameraPosition} from 'three/tsl';
import {SUN_DIRECTIONS} from './atmosphere-profile.mjs';

// Art-directed local haze, not raymarched volumetric light. Known roof boxes
// reject whole ribbons; normal depth testing lets solid torii occlude the rest.
export function chooseShaftSites({routes=[],canopies=[],ground,maxSites=24}={}){
 const sites=[],limit=Math.min(32,Math.max(0,maxSites));
 for(const route of routes){
  let spacing=20;
  for(let i=1;i<route.length&&sites.length<limit;i++){
   const a=route[i-1],p=route[i],dx=p[0]-a[0],dz=p[2]-a[2],step=Math.hypot(dx,dz);
   spacing+=step;if(spacing<12||step<1e-6)continue;
   const x=p[0]-dz/step*1.2,z=p[2]+dx/step*1.2,y=ground(x,z);
   if(!Number.isFinite(y)||sites.some(s=>Math.hypot(s.point[0]-x,s.point[2]-z)<12))continue;
   const crown=canopies.find(b=>x>b.min.x-2&&x<b.max.x+2&&z>b.min.z-2&&z<b.max.z+2&&b.max.y>y+5);
   if(!crown)continue;
   sites.push({point:[x,y+.15,z],topY:Math.min(y+18,crown.max.y),width:1.8+(sites.length%3)*.35});spacing=0;
  }
 }
 return sites;
}

export function createLocalSunShafts({scene,sites=[],roofs=[],maxActive=8,audit=false}={}){
 const cap=Math.min(8,Math.max(1,Math.floor(maxActive)||8));
 const geometry=new THREE.PlaneGeometry(1,1),positions=geometry.attributes.position;
 // A slight widening away from the canopy is less rigid than a flat rectangle.
 for(let i=0;i<positions.count;i++)if(positions.getY(i)>0)positions.setX(i,positions.getX(i)*.45);
 positions.needsUpdate=true;geometry.computeBoundingSphere();
 const tint=uniform(new THREE.Color('#fff1cf')),strength=uniform(.13),q=uv();
 const cross=q.x.sub(.5),distance=positionWorld.sub(cameraPosition).length();
 const profile=exp(cross.mul(cross).mul(-24)).mul(float(1).sub(smoothstep(.32,.5,cross.abs())));
 const ends=smoothstep(0,.12,q.y).mul(float(1).sub(smoothstep(.7,1,q.y)));
 const grain=sin(q.y.mul(47).add(q.x.mul(13))).mul(.06).add(.94);
 const fade=smoothstep(1.5,4,distance).mul(float(1).sub(smoothstep(28,48,distance)));
 const material=new THREE.MeshBasicNodeMaterial({transparent:true,depthWrite:false,depthTest:true,
  side:THREE.DoubleSide,forceSinglePass:true,blending:THREE.AdditiveBlending,fog:true});
 material.colorNode=tint;material.opacityNode=profile.mul(ends).mul(grain).mul(fade).mul(strength);
 const mesh=new THREE.InstancedMesh(geometry,material,cap);mesh.name='Local soft sun shafts · High';
 mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);mesh.frustumCulled=false;mesh.visible=false;
 mesh.castShadow=false;mesh.receiveShadow=false;mesh.renderOrder=2;mesh.count=0;scene.add(mesh);
 const axis=new THREE.Vector3(),view=new THREE.Vector3(),right=new THREE.Vector3(),normal=new THREE.Vector3(),fallback=new THREE.Vector3(0,0,1),scale=new THREE.Vector3();
 const matrix=new THREE.Matrix4(),hit=new THREE.Vector3(),ray=new THREE.Ray(),expanded=new THREE.Box3();
 const entries=sites.slice(0,32).map(s=>({...s,end:new THREE.Vector3(...s.point),source:new THREE.Vector3(s.point[0],s.topY,s.point[2]),center:new THREE.Vector3(),length:0,blocked:false}));
 const nearest=new Int16Array(cap),distances=new Float64Array(cap);
 let mode='day',quality='balanced',active=0,disposed=false,dirty=true,lastX,lastY,lastZ;
 function setMode(next){
  if(disposed)return;dirty=true;mode=Object.hasOwn(SUN_DIRECTIONS,next)?next:'day';axis.fromArray(SUN_DIRECTIONS[mode]).normalize();
  tint.value.set(mode==='gold'?'#ffc18e':'#fff1cf');strength.value=mode==='gold'?.09:.13;
  for(const entry of entries){
   // Clip the ray from its canopy origin. Starting at the floor would turn
   // capped low-sun rays into eye-level streaks with no source above them.
   entry.length=Math.max(0,Math.min(24,(entry.topY-entry.point[1])/Math.max(.04,axis.y)));
   entry.end.copy(entry.source).addScaledVector(axis,-entry.length);
   entry.center.copy(entry.end).addScaledVector(axis,entry.length/2);entry.blocked=entry.length<3;
   ray.set(entry.end,axis);
   for(const roof of roofs){
    expanded.copy(roof).expandByScalar(entry.width/2);
    if(expanded.containsPoint(entry.end)||(ray.intersectBox(expanded,hit)&&hit.distanceTo(entry.end)<=entry.length)){entry.blocked=true;break;}
   }
  }
 }
 setMode(mode);
 function update(camera){
  if(disposed)return;
  // Selection and billboard bases depend only on position; looking around at
  // a fixed point cannot change them. Mode/quality changes invalidate the pose.
  const {x,y,z}=camera.position;
  if(!dirty&&x===lastX&&y===lastY&&z===lastZ)return;
  lastX=x;lastY=y;lastZ=z;dirty=false;
  active=0;mesh.visible=false;mesh.count=0;
  if(quality!=='high'||mode==='night'||(!Number.isFinite(camera.position.x)||!Number.isFinite(camera.position.y)||!Number.isFinite(camera.position.z)))return;
  nearest.fill(-1);distances.fill(Infinity);
  for(let i=0;i<entries.length;i++){
   const entry=entries[i],d=entry.center.distanceToSquared(camera.position);if(entry.blocked||d>(48+entry.length/2+entry.width)**2)continue;
   for(let j=0;j<cap;j++)if(d<distances[j]){for(let k=cap-1;k>j;k--){distances[k]=distances[k-1];nearest[k]=nearest[k-1];}distances[j]=d;nearest[j]=i;break;}
  }
  for(const index of nearest){
   if(index<0)break;const entry=entries[index];view.subVectors(camera.position,entry.center);
   right.crossVectors(axis,view);if(right.lengthSq()<1e-8)right.crossVectors(axis,fallback);right.normalize();
   normal.crossVectors(right,axis).normalize();scale.set(entry.width,entry.length,1);
   matrix.makeBasis(right,axis,normal).scale(scale).setPosition(entry.center);mesh.setMatrixAt(active++,matrix);
  }
  mesh.count=active;mesh.visible=active>0;if(active)mesh.instanceMatrix.needsUpdate=true;
 }
 return {mesh,setMode,setQuality(value){if(disposed)return;const next=value==='high'||value==='ultra'?'high':'balanced';if(next!==quality){quality=next;dirty=true;}},update,
  get stats(){return {quality,mode,sites:entries.length,blocked:entries.reduce((n,e)=>n+Number(e.blocked),0),...(audit?{placement:entries.map(e=>({source:e.source.toArray(),end:e.end.toArray(),blocked:e.blocked}))}:{}),active,maxActive:cap,draws:mesh.visible?1:0,extraLights:0,textures:0,renderTargets:0,triangles:active*2,artistic:true};},
  dispose(){if(disposed)return;disposed=true;active=0;mesh.visible=false;scene.remove(mesh);geometry.dispose();material.dispose();mesh.dispose();}
 };
}
