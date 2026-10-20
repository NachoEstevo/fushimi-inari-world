import * as THREE from 'three';
import {rigidPoint} from './spatial.mjs';

// Connect the existing nine-step flight to the podium without floating aprons.
// Dimensions derive from the preserved building; surface vocabulary is video-led.
export function buildSanctuaryLanding(root,anchor,materials,colliders){
  const group=new THREE.Group();group.name='Naihaiden connected landing';
  const box=(w,h,d,x,y,z,material)=>{
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);
    mesh.position.set(x,y,z);mesh.receiveShadow=true;group.add(mesh);
  };
  box(10.4,.12,1.4,0,3.15,-22.85,materials.precinctPaving);
  // Side landings leave the central stair and the side circulation corridors open.
  for(const side of [-1,1]){
    box(4,.12,9,side*8,3.15,-26.7,materials.precinctPaving);
    box(4,1.6,.22,side*8,2.4,-22.16,materials.entryStoneMat);
    const p=rigidPoint([side*8,2.4,-22.16],anchor.source,anchor.target,anchor.yaw);
    colliders.push({type:'box',args:[p[0],p[2],2,.11,anchor.yaw,p[1]-.8,p[1]+.8,'sanctuary_retaining']});
  }
  group.position.fromArray(anchor.target);group.rotation.y=anchor.yaw;
  group.translateX(-anchor.source[0]);group.translateY(-anchor.source[1]);group.translateZ(-anchor.source[2]);root.add(group);
}
