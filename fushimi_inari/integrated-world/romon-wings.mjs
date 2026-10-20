import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

// Existing Kairo source coordinates. Video 01:20 shows tall green lattice
// panels and narrow white bays. Their exact dimensions are inferred.
export function refineRomonWings(scene,m){
  const green=new THREE.MeshStandardMaterial({color:'#537e63',roughness:.82});
  const shade=new THREE.MeshStandardMaterial({color:'#252e27',roughness:1});
  const batches=new Map();
  const box=(w,h,d,x,y,z,mat)=>{
    if(!batches.has(mat))batches.set(mat,[]);
    batches.get(mat).push(new THREE.BoxGeometry(w,h,d).translate(x,y,z));
  };
  for(const side of [-1,1]){
    const mid=side*12.5;
    for(const z of [-1.96,1.96]){
      for(const y of [3.06,4.85,5.23])box(12.9,.14,.14,mid,y,z,m.vermilionMat);
      for(let i=0;i<6;i++)box(.14,3.18,.14,mid-6+i*2.4,3.64,z,m.vermilionMat);
    }
    // Tall screens fitted in front of the inherited small window inserts.
    for(let bay=0;bay<5;bay++){
      const x=mid-4.8+bay*2.4;
      box(1.92,2.05,.045,x,3.52,2.09,shade);
      for(const dx of [-1,1])box(.10,2.23,.12,x+dx,3.52,2.15,m.vermilionMat);
      for(const y of [2.42,4.62])box(2.1,.10,.12,x,y,2.15,m.vermilionMat);
      for(let bar=0;bar<18;bar++)box(.055,2.04,.055,x-.90+bar*1.8/17,3.52,2.16,green);
      box(1.92,.045,.06,x,3.10,2.17,green);
      box(1.92,.045,.06,x,4.02,2.17,green);
    }
    // End-wall framing follows the existing closed wall, without inventing doors.
    const end=side*18.93;
    for(const z of [-1.85,0,1.85])box(.15,3.2,.15,end,3.65,z,m.vermilionMat);
    for(const y of [3.08,4.85,5.23])box(.16,.14,3.85,end,y,0,m.vermilionMat);
    for(let i=0;i<29;i++){
      const x=mid-6.5+i*13/28;
      box(.09,.12,.48,x,5.30,2.17,m.vermilionMat);
      box(.095,.125,.025,x,5.30,2.42,m.goldMat);
    }
  }
  const group=new THREE.Group();group.name='Romon Kairo facade refinement';
  for(const [material,parts]of batches){
    const geometry=mergeGeometries(parts);parts.forEach(p=>p.dispose());
    const mesh=new THREE.Mesh(geometry,material);mesh.receiveShadow=true;group.add(mesh);
  }
  scene.add(group);
}
