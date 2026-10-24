import * as THREE from 'three';

// Rendering residency only: collision/floor owners are never removed. The
// terrain, path ribbons and distant city/canopy keep their existing ownership.
export function createWorldDetailChunks({cellSize=128,near=220,far=260,onStats=()=>{}}={}){
 const cells=new Map(),entries=[],active=new Set();
 let last=-Infinity,lastScale=1,checks=0,lastPosition=new THREE.Vector3(Infinity,Infinity,Infinity);
 function add(object,{radius=near,margin=far-near,bounds=null}={}){
  if(!object||!object.visible||entries.some(e=>e.object===object))return;
  object.updateWorldMatrix(true,true);
  const sphere=bounds??new THREE.Box3().setFromObject(object).getBoundingSphere(new THREE.Sphere());
  if(!Number.isFinite(sphere.radius)||sphere.radius<0)return;
  const entry={object,center:sphere.center.clone(),radius:sphere.radius,range:radius,margin,enabled:object.visible};
  entries.push(entry);if(entry.enabled)active.add(entry);
  const reach=entry.radius+radius+margin;
  for(let x=Math.floor((entry.center.x-reach)/cellSize);x<=Math.floor((entry.center.x+reach)/cellSize);x++){
   for(let z=Math.floor((entry.center.z-reach)/cellSize);z<=Math.floor((entry.center.z+reach)/cellSize);z++){
    const key=`${x},${z}`;if(!cells.has(key))cells.set(key,[]);cells.get(key).push(entry);
   }
  }
 }
 function update(camera,time=0,rangeScale=1,force=false){
  if(!force&&time-last<.1&&rangeScale===lastScale&&camera.position.distanceTo(lastPosition)<20)return;
  last=time;lastScale=rangeScale;lastPosition.copy(camera.position);checks=0;
  // Elevated exploration needs distant architectural silhouettes. On foot the
  // grid examines nearby cells and previously active entries only.
  const candidates=rangeScale>1?entries:new Set([...(cells.get(`${Math.floor(camera.position.x/cellSize)},${Math.floor(camera.position.z/cellSize)}`)??[]),...active]);
  for(const entry of candidates){
   const distance=camera.position.distanceTo(entry.center),limit=entry.radius+(entry.range+(entry.enabled?entry.margin:0))*rangeScale;
   const enabled=distance<=limit;checks++;
   if(enabled!==entry.enabled){entry.enabled=enabled;entry.object.visible=enabled;if(enabled)active.add(entry);else active.delete(entry);}
  }
  onStats(stats());
 }
 const stats=()=>({registered:entries.length,active:active.size,dormant:entries.length-active.size,cells:cells.size,checked:checks,nearMetres:near,farMetres:far,rangeScale:lastScale,mode:'spatial render activation; collision data retained'});
 return {add,update,stats,restore(){for(const e of entries){e.object.visible=true;e.enabled=true;active.add(e);}}};
}
