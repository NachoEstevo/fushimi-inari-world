import * as THREE from 'three';
import {createStationSurfaceTextures,STATION_CONTACT_BOUNDS} from './station-surface-textures.mjs';

// High-only finish owner. Tags are assigned before the builder batches geometry;
// color alone cannot distinguish walls from train interiors, seats or ballast.
export function createStationSurfaceFinishes(station,bindings){
 const selected=bindings.filter(({upgraded})=>!Array.isArray(upgraded)&&['platform-deck','platform-wall'].includes(upgraded?.userData.stationSurfaceRole));
 const stats={materials:0,textures:0,textureBytes:0,geometryUVs:0,extraDraws:0,enabled:false};
 if(!selected.length)return {stats,setEnabled(){},dispose(){}};
 let resources=null,disposed=false;
 function initialize(){
 const textures=createStationSurfaceTextures(station?.spec?.platformFloor),materials=new Map(),geometries=new Map();
 const records=selected.map(({mesh,upgraded:base})=>{
  const role=base.userData.stationSurfaceRole,deck=role==='platform-deck';
  if(!materials.has(base)){
   const material=base.clone(),maps=deck?textures.deck:textures.wall;
   material.name=`High station ${role}`;material.userData={...base.userData,stationSurfaceFinish:true};
   material.map=maps.map;material.normalMap=maps.normalMap;material.normalScale.set(1,1);
   material.bumpMap=null;material.bumpScale=0;material.roughnessMap=maps.roughnessMap;
   material.roughness=deck?1:.98;material.metalness=0;
   material.aoMap=deck?textures.contact:maps.roughnessMap;material.aoMapIntensity=1;
   material.emissiveIntensity=0;material.envMapIntensity=deck?.35:.3;
   // Albedo maps are neutral modulation, not a second grey paint layer.
   material.color.multiplyScalar(deck?1.10:1.04);
   materials.set(base,material);
  }
  const sourceGeometry=mesh.geometry;
  if(deck&&!geometries.has(sourceGeometry)){
   const geometry=sourceGeometry.clone(),p=geometry.attributes.position,uv=new Float32Array(p.count*2),b=STATION_CONTACT_BOUNDS;
   for(let i=0;i<p.count;i++){uv[i*2]=(p.getX(i)-b.minX)/(b.maxX-b.minX);uv[i*2+1]=(p.getZ(i)-b.minZ)/(b.maxZ-b.minZ);}
   geometry.setAttribute('uv1',new THREE.Float32BufferAttribute(uv,2));geometries.set(sourceGeometry,geometry);
  }
  return {mesh,base,high:materials.get(base),sourceGeometry,highGeometry:deck?geometries.get(sourceGeometry):sourceGeometry};
 });
 const maps=new Set([textures.contact,...Object.values(textures.deck),...Object.values(textures.wall)]);
 stats.materials=materials.size;stats.textures=maps.size;stats.textureBytes=[...maps].reduce((n,t)=>n+t.image.data.byteLength,0);stats.geometryUVs=geometries.size;
 return {records,materials,geometries,maps};
 }
 function setEnabled(value){
  if(disposed)return;stats.enabled=Boolean(value);
  if(stats.enabled&&!resources)resources=initialize();
  for(const r of resources?.records??[]){r.mesh.material=stats.enabled?r.high:r.base;r.mesh.geometry=stats.enabled?r.highGeometry:r.sourceGeometry;}
 }
 return {stats,setEnabled,dispose(){if(disposed)return;setEnabled(false);disposed=true;if(resources){for(const m of resources.materials.values())m.dispose();for(const g of resources.geometries.values())g.dispose();for(const t of resources.maps)t.dispose();}}};
}
