import * as THREE from 'three';
import {pathSampler} from './spatial.mjs';
import {toriiVariation} from './torii-variation.mjs';
import {toriiMaterials} from './torii-materials.mjs';

// Original large torii assets on connected mountain paths. The corridor
// coverage follows the official pilgrimage route; individual gate stations
// remain inferred until each segment is visually surveyed.
export function buildMountainTorii(root,legacy,spatial,surfaces,colliders){
  const finishes=toriiMaterials(legacy);
  const sections=[
    {from:'okusha',to:'kumataka',spacing:1.35,scale:1.16},
    {from:'kumataka',to:'mitsu',spacing:1.6,scale:1.12},
    {from:'mitsu',to:'yotsu',spacing:1.35,scale:1.10},
    {from:'yotsu',to:'sannomine',spacing:1.6,scale:1.08},
    {from:'sannomine',to:'ninomine',spacing:1.5,scale:1.12},
    {from:'ninomine',to:'summit',spacing:1.7,scale:1.12},
    {from:'summit',to:'mitsurugi',spacing:2.1,scale:1.14},
    {from:'mitsurugi',to:'gozendani',spacing:2.3,scale:1.12},
    {from:'gozendani',to:'yotsu',spacing:2.2,scale:1.14},
  ];
  const matrices=[],occupied=new Set();
  for(const [sectionIndex,section] of sections.entries()){
    const route=pathSampler(spatial.connected([section.from,section.to]));
    for(let d=5,index=0;d<route.total-5;index++){
      const {point,yaw:heading}=route.at(d/route.total),[x,,z]=point;
      const variation=toriiVariation(771+sectionIndex*509,index,.32+sectionIndex*.035);
      const yaw=heading+variation.yaw;
      d+=section.spacing*(1+.12*Math.sin(index*1.7));
      const key=`${Math.round(x)},${Math.round(z)}`;if(occupied.has(key))continue;occupied.add(key);
      // Keep shrine forecourts and junction centers open for branching.
      if(spatial.anchors.some(a=>a.radius&&Math.hypot(x-a.target[0],z-a.target[2])<a.radius*.95))continue;
      const scale=section.scale*(1+.035*Math.sin(index*.83)),y=surfaces.height(x,z)-.025;
      const sx=scale*variation.width,sy=scale*.96*variation.height,sz=scale*variation.depth;
      const m=new THREE.Matrix4().compose(new THREE.Vector3(x,y,z),new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),yaw),new THREE.Vector3(sx,sy,sz));
      matrices.push({m,variation});
      for(const side of [-1,1]){
        const offset=1.24*sx*side;
        colliders.push({type:'cylinder',args:[x+Math.cos(yaw)*offset,z-Math.sin(yaw)*offset,.144*Math.max(sx,sz),y,y+3.4*sy,'mountain_torii']});
      }
    }
  }
  // Chunk spatially so the whole mountain is not drawn from inside one tunnel.
  const chunks=new Map();
  matrices.forEach(entry=>{const m=entry.m,key=`${Math.floor(m.elements[12]/80)},${Math.floor(m.elements[14]/80)}`;if(!chunks.has(key))chunks.set(key,[]);chunks.get(key).push(entry);});
  for(const entries of chunks.values())for(const [geometry,material,list] of [
    [legacy.torii.geometry,finishes.fresh,entries.filter(e=>!e.variation.weathered)],
    [legacy.torii.geometry,finishes.weathered,entries.filter(e=>e.variation.weathered)],
    [legacy.torii.blackGeometry,legacy.materials.blackNemakiMat,entries]]){
    if(!list.length)continue;
    const mesh=new THREE.InstancedMesh(geometry,material,list.length);
    list.forEach(({m,variation},i)=>{mesh.setMatrixAt(i,m);if(geometry===legacy.torii.geometry)mesh.setColorAt(i,new THREE.Color().setRGB(variation.tint,variation.tint*.96,variation.tint*.92));});mesh.castShadow=true;mesh.receiveShadow=true;mesh.computeBoundingSphere();root.add(mesh);
  }
  return {count:matrices.length,weathered:matrices.filter(e=>e.variation.weathered).length,sections:sections.length,provenance:'Original gate assets and both original finish maps; placement/spacing inferred by corridor, not a surveyed inventory.'};
}
