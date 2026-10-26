import {buildToriiInscriptions} from './torii-inscriptions.mjs?v=mountain-walk-1';
import {toriiInscriptionProfile} from './mountain-torii-profile.mjs?v=29c';
import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {routeSpec} from './route-spec.mjs';
import {toriiVariation} from './torii-variation.mjs';
import {senbonLayout} from './senbon-layout.mjs';
import {toriiMaterials} from './torii-materials.mjs?v=29';

// Refines the original Inari-torii construction at its actual small-gate scale.
// Materials are inherited; architecture elsewhere is left intact.
export function buildSenbon(root,legacy,spatial,surfaceHeight,colliders){
  const s=routeSpec.senbon,red=[],black=[],beams=[],finishes=toriiMaterials(legacy,{separateInk:true});
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
  const layouts=senbonLayout(spatial.twins,s.spacing);
  spatial.twins.forEach((path,index)=>{
    const source=s.paths[index];
    const {stations,exitYaw}=layouts[index];
    stations.forEach((distance,i)=>{
      const {point,yaw:heading}=path.at(distance/path.total),[x,,z]=point;
      const variation=toriiVariation(133742+index*509,i,index===0?.34:.46);
      const yaw=i===stations.length-1?exitYaw:heading+variation.yaw;
      const large=index===1&&i<source.largeCount;
      const scale=large?1.12:1;
      const sx=scale*variation.width,sy=scale*variation.height;
      const y=surfaceHeight(x,z)-.015;
      const m=new THREE.Matrix4().compose(new THREE.Vector3(x,y,z),new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),yaw),new THREE.Vector3(sx,sy,variation.depth));
      mats.push(m);
      // Side-mounted fittings follow the actual gate's position, rotation and
      // scale. Mounting is inferred; keep the lantern outside the walk opening.
      if([.16,.38,.60,.82].some(t=>i===Math.round((stations.length-1)*t))){
        const fixture=new THREE.Group();
        const side=index===0?-1:1,x=side*(s.pillarCenters/2+.30);
        const add=(w,h,d,px,py,material)=>{
          const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);
          mesh.position.set(px,py,0);mesh.castShadow=true;fixture.add(mesh);
        };
        add(.36,.045,.06,side*(s.pillarCenters/2+.15),s.crossbarUnderside+.38,legacy.materials.blackNemakiMat);
        add(.025,.14,.025,x,s.crossbarUnderside+.30,legacy.materials.blackNemakiMat);
        add(.36,.10,.36,x,s.crossbarUnderside+.20,legacy.materials.blackNemakiMat);
        add(.24,.24,.24,x,s.crossbarUnderside+.03,legacy.materials.lanternGlowMat);
        fixture.applyMatrix4(m);root.add(fixture);
      }
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
  buildToriiInscriptions(root,mats.map((m,i)=>({m,...toriiInscriptionProfile(13,i)})),{halfSpan:s.pillarCenters/2,bottomRadius:s.pillarDiameter*.5,topRadius:s.pillarDiameter*.48,bottomY:0,topY:s.height-.16,small:true});
  return {gates:mats.length,fresh:fresh.length,weathered:weathered.length,spacing:s.spacing,pillarDiameter:s.pillarDiameter,clearWidth:s.pillarCenters-s.pillarDiameter,height:s.height,countSource:s.countSource,dimensionsStatus:s.otherDimensions};
}
