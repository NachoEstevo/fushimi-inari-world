import * as THREE from 'three';

// Rendering residency only: collision/floor owners are never removed. The
// terrain, path ribbons and distant city/canopy keep their existing ownership.
export function createWorldDetailChunks({cellSize=128,near=220,far=260,onStats=()=>{}}={}){
 const cells=new Map(),entries=[],objects=new Set(),active=new Set();
 let last=-Infinity,lastScale=1,checks=0,dirty=true,updates=0,skippedUpdates=0,totalChecks=0,visibilityWrites=0,lastPosition=new THREE.Vector3(Infinity,Infinity,Infinity);
 function add(object,{radius=near,margin=far-near,bounds=null}={}){
  if(!object||!object.visible||objects.has(object))return;
  object.updateWorldMatrix(true,true);
  const sphere=bounds??new THREE.Box3().setFromObject(object).getBoundingSphere(new THREE.Sphere());
  if(!Number.isFinite(sphere.radius)||sphere.radius<0)return;
  const entry={object,center:sphere.center.clone(),radius:sphere.radius,range:radius,margin,enabled:object.visible};
  entries.push(entry);objects.add(object);dirty=true;if(entry.enabled)active.add(entry);
  const reach=entry.radius+radius+margin;
  for(let x=Math.floor((entry.center.x-reach)/cellSize);x<=Math.floor((entry.center.x+reach)/cellSize);x++){
   for(let z=Math.floor((entry.center.z-reach)/cellSize);z<=Math.floor((entry.center.z+reach)/cellSize);z++){
    const key=`${x},${z}`;if(!cells.has(key))cells.set(key,[]);cells.get(key).push(entry);
   }
  }
 }
 function update(camera,time=0,rangeScale=1,force=false){
  // Static residency depends only on position and range. Looking around or
  // waiting cannot change it; force, registration and restore invalidate it.
  const movementSquared=camera.position.distanceToSquared(lastPosition);
  if(!force&&!dirty&&rangeScale===lastScale&&(movementSquared===0||(time-last<.1&&movementSquared<400))){skippedUpdates++;return;}
  last=time;lastScale=rangeScale;lastPosition.copy(camera.position);checks=0;dirty=false;updates++;
  // Elevated exploration needs distant architectural silhouettes. On foot the
  // grid examines nearby cells and previously active entries only.
  const candidates=rangeScale>1?entries:new Set([...(cells.get(`${Math.floor(camera.position.x/cellSize)},${Math.floor(camera.position.z/cellSize)}`)??[]),...active]);
  for(const entry of candidates){
   const limit=entry.radius+(entry.range+(entry.enabled?entry.margin:0))*rangeScale;
   const enabled=limit>=0&&camera.position.distanceToSquared(entry.center)<=limit*limit;checks++;totalChecks++;
   if(enabled!==entry.enabled){entry.enabled=enabled;entry.object.visible=enabled;visibilityWrites++;if(enabled)active.add(entry);else active.delete(entry);}
  }
  onStats(stats());
 }
 const stats=()=>({registered:entries.length,active:active.size,dormant:entries.length-active.size,cells:cells.size,checked:checks,updates,skippedUpdates,totalChecks,visibilityWrites,nearMetres:near,farMetres:far,rangeScale:lastScale,mode:'spatial render activation; collision data retained'});
 return {add,update,stats,restore(){for(const e of entries){if(!e.object.visible){e.object.visible=true;visibilityWrites++;}e.enabled=true;active.add(e);}dirty=true;}};
}
