import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

export function refineEntryPaving(mesh,slabs,cobbles){
  const geo=mesh.geometry.clone(),p=geo.attributes.position,n=geo.attributes.normal,index=geo.index;
  const indices=[[],[]],count=index?.count??p.count;
  for(let i=0;i<count;i+=3){
    const tri=[0,1,2].map(j=>index?index.getX(i+j):i+j);
    const side=tri.every(k=>Math.abs(p.getX(k))>4.7&&p.getZ(k)>5.5&&p.getY(k)<3&&n.getY(k)>.8);
    indices[side?1:0].push(...tri);
  }
  // Two contiguous material groups, never one draw call per paving triangle.
  geo.setIndex(indices[0].concat(indices[1]));geo.clearGroups();
  geo.addGroup(0,indices[0].length,0);geo.addGroup(indices[0].length,indices[1].length,1);
  mesh.geometry=geo;mesh.material=[slabs,cobbles];
}

// Source-model coordinates, before geographic placement. Photo 2 supplies
// the fitting vocabulary; dimensions are inferred, not a measured survey.
export function refineRomonGold(scene,gold){
  const parts=[];
  const box=(x,y,z,w,h,d)=>parts.push(new THREE.BoxGeometry(w,h,d).translate(x,y,z));
  const flower=(x,y,z,r)=>{
    parts.push(new THREE.SphereGeometry(r*.28,8,4).scale(1,1,.3).translate(x,y,z+.018));
    for(let i=0;i<12;i++){
      const a=i*Math.PI/6;
      const petal=new THREE.SphereGeometry(1,6,4).scale(r*.20,r*.50,.018);
      petal.rotateZ(a);petal.translate(x-Math.sin(a)*r*.52,y+Math.cos(a)*r*.52,z);parts.push(petal);
    }
  };
  for(const x of [-5.2,-3.5,-1.9,0,1.9,3.5,5.2]){
    box(x,9.9,3.625,.32,.16,.028);
    flower(x,9.9,3.65,.075);
    box(x,6.2,3.35,.24,.14,.025);
  }
  // Delicate corner clasps and flowers around the existing central plaque.
  for(const side of [-1,1]){
    box(side*.65,8.45,2.99,.055,2.04,.035);
    for(const y of [7.47,9.43])flower(side*.65,y,3.02,.09);
    // Retain the two original standing lanterns, adding their visible mounts.
    const x=side*5.45;
    for(const y of [2.32,2.94]){
      box(x,y,7.09,.69,.085,.025);flower(x,y,7.12,.11);
    }
    for(const dx of [-.30,.30])box(x+dx,2.63,7.09,.055,.59,.025);
  }
  const geometry=mergeGeometries(parts);parts.forEach(g=>g.dispose());
  const mesh=new THREE.Mesh(geometry,gold);mesh.name='Romon photo-referenced kanagu and lantern mounts';
  mesh.castShadow=false;mesh.receiveShadow=true;scene.add(mesh);
}
