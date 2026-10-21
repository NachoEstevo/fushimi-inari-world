import {mountainToriiProfile,inscriptionVariant,inscriptionDate} from './mountain-torii-profile.mjs?v=29c';
import {buildToriiInscriptions} from './torii-inscriptions.mjs?v=29c';
import * as THREE from 'three';
import {pathSampler} from './spatial.mjs';
import {toriiVariation} from './torii-variation.mjs';
import {toriiMaterials} from './torii-materials.mjs?v=29';

// Original large torii assets on connected mountain paths. The corridor
// coverage follows the official pilgrimage route; individual gate stations
// remain inferred until each segment is visually surveyed.
export function buildMountainTorii(root,legacy,spatial,surfaces,colliders){
  const finishes=toriiMaterials(legacy,{separateInk:true});
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
  // The first two merged cylinder components are the original pillars. Change
  // only their radial section, preserving beam shapes and pillar centre lines.
  const cylinder=new THREE.CylinderGeometry(.122,.135,2.62,16);
  const pillarVertices=cylinder.attributes.position.count*2;cylinder.dispose();
  const variants=new Map();
  function geometryFor(source,thickness){
    const key=source.uuid+':'+thickness;if(variants.has(key))return variants.get(key);
    const g=source.clone(),p=g.attributes.position;
    for(let i=0;i<pillarVertices;i++){
      const center=p.getX(i)<0?-1.24:1.24;
      p.setXYZ(i,center+(p.getX(i)-center)*thickness,p.getY(i),p.getZ(i)*thickness);
    }
    g.computeVertexNormals();g.computeBoundingSphere();variants.set(key,g);return g;
  }
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
      const profile=mountainToriiProfile(sectionIndex,index);
      const sx=scale*variation.width*profile.width,sy=scale*.96*variation.height*profile.height,sz=scale*variation.depth;
      const m=new THREE.Matrix4().compose(new THREE.Vector3(x,y,z),new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),yaw),new THREE.Vector3(sx,sy,sz));
      matrices.push({m,variation,thickness:profile.thickness,inscription:inscriptionVariant(sectionIndex,index),dateInscription:inscriptionDate(sectionIndex,index)});
      for(const side of [-1,1]){
        const offset=1.24*sx*side;
        colliders.push({type:'cylinder',args:[x+Math.cos(yaw)*offset,z-Math.sin(yaw)*offset,.144*profile.thickness*Math.max(sx,sz),y,y+3.4*sy,'mountain_torii']});
      }
    }
  }
  // Chunk spatially so the whole mountain is not drawn from inside one tunnel.
  const chunks=new Map();
  matrices.forEach(entry=>{const m=entry.m,key=`${Math.floor(m.elements[12]/80)},${Math.floor(m.elements[14]/80)}`;if(!chunks.has(key))chunks.set(key,[]);chunks.get(key).push(entry);});
  for(const chunk of chunks.values())for(const thickness of [1,1.22,1.45]){
    const entries=chunk.filter(e=>e.thickness===thickness);
    for(const [source,material,list] of [
    [legacy.torii.geometry,finishes.fresh,entries.filter(e=>!e.variation.weathered)],
    [legacy.torii.geometry,finishes.weathered,entries.filter(e=>e.variation.weathered)],
    [legacy.torii.blackGeometry,legacy.materials.blackNemakiMat,entries]]){
    if(!list.length)continue;
    const geometry=geometryFor(source,thickness);
    const mesh=new THREE.InstancedMesh(geometry,material,list.length);
    list.forEach(({m,variation},i)=>{mesh.setMatrixAt(i,m);if(source===legacy.torii.geometry)mesh.setColorAt(i,new THREE.Color().setRGB(variation.tint,variation.tint*.96,variation.tint*.92));});mesh.castShadow=true;mesh.receiveShadow=true;mesh.computeBoundingSphere();root.add(mesh);
  }
  }
  buildToriiInscriptions(root,matrices,{halfSpan:1.24,bottomRadius:.135,topRadius:.122,bottomY:.65,topY:3.27});
  return {sizeCohorts:3,inscriptionVariants:16,count:matrices.length,weathered:matrices.filter(e=>e.variation.weathered).length,sections:sections.length,provenance:'Original geometry, unlettered timber maps, three inferred size cohorts and interpretive dedications; individual gates not surveyed.'};
}
