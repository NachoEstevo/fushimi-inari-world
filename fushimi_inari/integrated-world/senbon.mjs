import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {routeSpec,gateStations} from './route-spec.mjs';

// Refines the original Inari-torii construction at its actual small-gate scale.
// Materials are inherited; architecture elsewhere is left intact.
export function buildSenbon(root,legacy,spatial,surfaceHeight,colliders){
  const s=routeSpec.senbon,red=[],black=[];
  function box(w,h,d,x,y,z,collection){
    const g=new THREE.BoxGeometry(w,h,d);g.translate(x,y,z);collection.push(g);
  }
  for(const side of [-1,1]){
    const pole=new THREE.CylinderGeometry(s.pillarDiameter*.48,s.pillarDiameter*.5,s.height-.16,12);
    pole.translate(side*s.pillarCenters/2,(s.height-.16)/2,0);red.push(pole);
    const base=new THREE.CylinderGeometry(.079,.083,s.blackBaseHeight,12);
    base.translate(side*s.pillarCenters/2,s.blackBaseHeight/2,0);black.push(base);
  }
  box(2.55,.14,.13,0,s.crossbarUnderside+.07,0,red);
  box(2.78,.13,.18,0,s.height-.17,0,red);
  box(.14,.23,.12,0,s.height-.35,0,red);
  // Curved, continuous kasagi profile instead of overlapping square end blocks.
  for(let i=0;i<16;i++){
    const x=-s.beamWidth/2+(i+.5)*s.beamWidth/16;
    const lift=.075*Math.pow(Math.abs(x)/(s.beamWidth/2),3);
    box(s.beamWidth/16+.008,.10,.22,x,s.height-.05+lift,0,black);
  }
  const redGeo=mergeGeometries(red),blackGeo=mergeGeometries(black);
  red.forEach(g=>g.dispose());black.forEach(g=>g.dispose());
  // Donor inscriptions remain in the original material set, but do not wrap
  // around every face of these small poles and beams as the previous UVs did.
  const redMat=legacy.materials.vermilionMat.clone();
  redMat.color.set('#ffffff');redMat.roughness=.5;redMat.clearcoat=.28;
  redMat.normalScale.set(.12,.12);
  // Opaque vermilion paint: retain only subtle source wood variation, not the
  // exposed brown grain of the generic architectural timber texture.
  redMat.onBeforeCompile=shader=>{
    shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',
      '#include <map_fragment>\ndiffuseColor.rgb = mix(vec3(0.82,0.105,0.018), diffuseColor.rgb, 0.15);');
  };
  redMat.customProgramCacheKey=()=> 'senbon-painted-wood-r03';
  const mats=[];
  spatial.twins.forEach((path,index)=>{
    const source=s.paths[index],count=source.smallCount+source.largeCount;
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
    const stations=gateStations(end-start,count,.2).map(d=>d+start);
    stations.forEach((distance,i)=>{
      const {point,yaw}=path.at(distance/path.total),[x,,z]=point;
      const large=index===1&&i<source.largeCount;
      const scale=large?1.22:1+Math.sin(i*2.17)*.012;
      const y=surfaceHeight(x,z)-.015;
      const m=new THREE.Matrix4().compose(new THREE.Vector3(x,y,z),new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),yaw),new THREE.Vector3(scale,scale,1));
      mats.push(m);
      for(const side of [-1,1]){
        const offset=side*s.pillarCenters*.5*scale;
        colliders.push({type:'cylinder',args:[x+Math.cos(yaw)*offset,z-Math.sin(yaw)*offset,.083*scale,y,y+s.height*scale,'senbon_torii']});
      }
    });
  });
  for(const [geometry,material] of [[redGeo,redMat],[blackGeo,legacy.materials.blackNemakiMat]]){
    const mesh=new THREE.InstancedMesh(geometry,material,mats.length);
    mats.forEach((m,i)=>{mesh.setMatrixAt(i,m);if(geometry===redGeo)mesh.setColorAt(i,new THREE.Color().setRGB(1,.87+(i%7)*.015,.76+(i%11)*.015));});
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
  return {gates:mats.length,pillarDiameter:s.pillarDiameter,clearWidth:s.pillarCenters-s.pillarDiameter,height:s.height,countSource:s.countSource,dimensionsStatus:s.otherDimensions};
}
