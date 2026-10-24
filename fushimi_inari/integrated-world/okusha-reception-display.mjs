import * as THREE from 'three';
import {staticParts} from './mountain-landmarks-geometry.mjs';

export function buildOkushaReceptionDisplay(root,materials){
 const name='Okusha reception votive display';if(root.getObjectByName(name))return null;
 const host=root.getObjectByName('Okusha gift and reception counter');
 const body=host?.children.find(o=>o.geometry?.parameters?.height===2.8);
 if(!body)return null;
 const {width:w,depth:d}=body.geometry.parameters,group=new THREE.Group();group.name=name;
 group.position.copy(host.position);group.rotation.copy(host.rotation);
 const p=staticParts(group),wood=materials.woodMat??materials.stoneMat,red=materials.vermilionMat,paper=materials.plasterMat;
 for(let bay=0;bay<4;bay++){
  const cx=-w/2+(bay+.5)*w/4,z=-d/2-.30;
  p.box(w/4-.26,.03,.46,cx,1.015,z,wood);
  for(let i=0;i<3;i++){
   const x=cx+(i-1)*.27;
   if(bay%2===0){
    for(const dx of [-.055,.055])p.box(.022,.22,.025,x+dx,1.14,z,red);
    p.box(.20,.025,.035,x,1.255,z,red);p.box(.15,.018,.025,x,1.205,z,red);
    p.box(.19,.025,.08,x,1.0425,z,wood);
   }else{
    // Small tied votive packets, resting on the existing counter tray.
    p.box(.17,.055,.25,x,1.0575,z,paper);
    p.box(.018,.006,.26,x,1.088,z,red);
    p.box(.12,.006,.035,x,1.089,z-.04,wood);
   }
  }
 }
 const stats=p.flush();group.userData.provenance='June 2012 Okusha Street View shows reception and votive tables. Merchandise layout and small torii forms are interpretive; no current inventory claim.';root.add(group);return stats;
}
