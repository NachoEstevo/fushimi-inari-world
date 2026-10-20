import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {routeSpec} from './route-spec.mjs';
import {toriiVariation,spacedGateStations} from './torii-variation.mjs';
import {toriiMaterials} from './torii-materials.mjs';

// Refines the original Inari-torii construction at its actual small-gate scale.
// Materials are inherited; architecture elsewhere is left intact.
export function buildSenbon(root,legacy,spatial,surfaceHeight,colliders){
  const s=routeSpec.senbon,red=[],black=[],beams=[],finishes=toriiMaterials(legacy);
  function box(w,h,d,x,y,z,collection){
    const g=new THREE.BoxGeometry(w,h,d);g.translate(x,y,z);collection.push(g);
  }
  for(const side of [-1,1]){
    const pole=new THREE.CylinderGeometry(s.pillarDiameter*.48,s.pillarDiameter*.5,s.height-.16,12);
    pole.translate(side*s.pillarCenters/2,(s.height-.16)/2,0);red.push(pole);
    const base=new THREE.CylinderGeometry(.079,.083,s.blackBaseHeight,12);
    base.translate(side*s.pillarCenters/2,s.blackBaseHeight/2,0);black.push(base);
  }
  box(2.55,.14,.13,0,s.crossbarUnderside+.07,0,beams);
  box(2.78,.13,.18,0,s.height-.17,0,beams);
  box(.14,.23,.12,0,s.height-.35,0,beams);
  // Curved, continuous kasagi profile instead of overlapping square end blocks.
  for(let i=0;i<16;i++){
    const x=-s.beamWidth/2+(i+.5)*s.beamWidth/16;
    const lift=.075*Math.pow(Math.abs(x)/(s.beamWidth/2),3);
    box(s.beamWidth/16+.008,.10,.22,x,s.height-.05+lift,0,black);
  }
  const redGeo=mergeGeometries(red),blackGeo=mergeGeometries(black),beamGeo=mergeGeometries(beams);
  beams.forEach(g=>g.dispose());
  red.forEach(g=>g.dispose());black.forEach(g=>g.dispose());
  // Original column maps stay on columns; beam UVs use a separate wood finish.
  const mats=[],fresh=[],weathered=[];
  spatial.twins.forEach((path,index)=>{
    const source=s.paths[index];
    // The OSM centerlines meet at shared fork nodes. Keep that joining apron
    // open: placing two complete gates on a shared vertex blocks both lanes.
    const other=spatial.twins[1-index];
    const otherPoints=Array.from({length:170},(_,i)=>other.at(i/169).point);
    const separated=distance=>{
      const p=path.at(distance/path.total).point;
      return Math.min(...otherPoints.map(q=>Math.hypot(p[0]-q[0],p[2]-q[2])))>2.15;
    };
    let start=0,end=path.total;
    while(start<path.total*.3&&!separated(start))start+=.25;
    while(end>path.total*.7&&!separated(end))end-=.25;
    const stations=spacedGateStations(end-start,{...s.spacing,seed:133742+index*509}).map(d=>d+start);
    stations.forEach((distance,i)=>{
      const {point,yaw:heading}=path.at(distance/path.total),[x,,z]=point;
      const variation=toriiVariation(133742+index*509,i,index===0?.34:.46);
      const yaw=heading+variation.yaw;
      const large=index===1&&i<source.largeCount;
      const scale=large?1.12:1;
      const sx=scale*variation.width,sy=scale*variation.height;
      const y=surfaceHeight(x,z)-.015;
      const m=new THREE.Matrix4().compose(new THREE.Vector3(x,y,z),new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),yaw),new THREE.Vector3(sx,sy,variation.depth));
      mats.push(m);
      (variation.weathered?weathered:fresh).push({m,variation});
      for(const side of [-1,1]){
        const offset=side*s.pillarCenters*.5*sx;
        colliders.push({type:'cylinder',args:[x+Math.cos(yaw)*offset,z-Math.sin(yaw)*offset,.083*Math.max(sx,variation.depth),y,y+s.height*sy,'senbon_torii']});
      }
    });
  });
  for(const [geometry,material,list] of [[redGeo,finishes.fresh,fresh],[redGeo,finishes.weathered,weathered],[beamGeo,finishes.beam,[...fresh,...weathered]],[blackGeo,legacy.materials.blackNemakiMat,mats.map(m=>({m}))]]){
    const mesh=new THREE.InstancedMesh(geometry,material,list.length);
    list.forEach(({m,variation},i)=>{mesh.setMatrixAt(i,m);if(variation)mesh.setColorAt(i,new THREE.Color().setRGB(variation.tint,variation.tint*.96,variation.tint*.92));});
    mesh.castShadow=true;mesh.receiveShadow=true;mesh.computeBoundingSphere();root.add(mesh);
  }
  const canvas=document.createElement('canvas');canvas.width=128;canvas.height=512;
  const ctx=canvas.getContext('2d');ctx.fillStyle='#171612';ctx.textAlign='center';ctx.font='100px serif';
  ctx.fillText('奉',64,160);ctx.fillText('納',64,310);
  const ink=new THREE.CanvasTexture(canvas);ink.colorSpace=THREE.SRGBColorSpace;
  const label=new THREE.PlaneGeometry(.075,.48);
  const labels=new THREE.InstancedMesh(label,new THREE.MeshStandardMaterial({map:ink,transparent:true,alphaTest:.3,roughness:1}),mats.length*2);
  mats.forEach((m,i)=>[-1,1].forEach((side,j)=>{
    labels.setMatrixAt(i*2+j,m.clone().multiply(new THREE.Matrix4().makeTranslation(side*s.pillarCenters/2,1.50,-.077)).multiply(new THREE.Matrix4().makeRotationY(Math.PI)));
  }));
  labels.computeBoundingSphere();root.add(labels);
  return {gates:mats.length,fresh:fresh.length,weathered:weathered.length,spacing:s.spacing,pillarDiameter:s.pillarDiameter,clearWidth:s.pillarCenters-s.pillarDiameter,height:s.height,countSource:s.countSource,dimensionsStatus:s.otherDimensions};
}
