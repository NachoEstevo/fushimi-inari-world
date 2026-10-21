import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

// June 2012 central-west Street View shows the COURT-facing Kairo screens,
// pale double rails and dark hanging lanterns. romon-wings.mjs already owns
// approach-facing screens and the red framing on both sides; do not duplicate it.
export function buildRomonCourtSideDetails(root,romon,materials){
  const group=new THREE.Group();group.name='Romon existing wings court-facing detail';
  const source=romon.source??[0,1.6,0],yaw=romon.yaw??0,c=Math.cos(yaw),s=Math.sin(yaw);
  group.rotation.y=yaw;group.position.set(romon.target[0]-c*source[0]-s*source[2],romon.target[1]-source[1],romon.target[2]+s*source[0]-c*source[2]);
  group.userData={provenance:'Supplied June 2012 central-west Street View; existing authored Kairo coordinates; detailing dimensions visually inferred',courtFaceLocalZ:-2.16};
  const green=new THREE.MeshStandardMaterial({color:'#426f50',roughness:.87});
  const shade=new THREE.MeshStandardMaterial({color:'#29382c',roughness:1});
  const pale=new THREE.MeshStandardMaterial({color:'#d5cdb5',roughness:.82,metalness:.08});
  const bronze=new THREE.MeshStandardMaterial({color:'#363e31',roughness:.78,metalness:.35});
  const lanternShade=new THREE.MeshStandardMaterial({color:'#737462',roughness:.95});
  const red=materials.vermilionMat,batches=new Map();
  const part=(geometry,material)=>{if(!batches.has(material))batches.set(material,[]);batches.get(material).push(geometry);};
  const box=(w,h,d,x,y,z,material)=>part(new THREE.BoxGeometry(w,h,d).translate(x,y,z),material);
  const cylinder=(r0,r1,h,x,y,z,material,segments=8)=>part(new THREE.CylinderGeometry(r0,r1,h,segments).translate(x,y,z),material);
  for(const side of [-1,1]){
    const mid=side*12.5;
    for(let bay=0;bay<5;bay++){
      const x=mid-4.8+bay*2.4;
      box(1.92,2.05,.045,x,3.52,-2.09,shade);
      for(const dx of [-1,1])box(.10,2.23,.12,x+dx,3.52,-2.15,red);
      for(const y of [2.42,4.62])box(2.1,.10,.12,x,y,-2.15,red);
      for(let bar=0;bar<18;bar++)box(.055,2.04,.055,x-.90+bar*1.8/17,3.52,-2.16,green);
      for(const y of [3.10,4.02])box(1.92,.045,.06,x,y,-2.17,green);
    }
    // The reference rails sit inside the existing column line. They do not
    // cross the central passage or extend the wing's existing collision volume.
    for(const y of [2.42,2.73])box(12.55,.055,.055,mid,y,-2.31,pale);
    for(let post=0;post<6;post++)box(.055,.80,.055,mid-6+post*2.4,2.41,-2.31,pale);
    // Two modest bronze lanterns per wing, suspended beneath existing eaves.
    for(const offset of [-2.4,2.4]){
      const x=mid+offset,z=-2.32;
      cylinder(.014,.014,.50,x,4.98,z,bronze,6);
      cylinder(.18,.23,.10,x,4.68,z,bronze,6);
      cylinder(.145,.145,.31,x,4.46,z,lanternShade,6);
      cylinder(.19,.15,.08,x,4.27,z,bronze,6);
      cylinder(.055,.12,.07,x,4.20,z,bronze,6);
      for(let i=0;i<6;i++){
        const angle=i*Math.PI/3;
        box(.023,.35,.023,x+Math.cos(angle)*.145,4.46,z+Math.sin(angle)*.145,bronze);
      }
      cylinder(.035,.035,.10,x,4.115,z,bronze,6);
    }
  }
  for(const [material,parts]of batches){
    const geometry=mergeGeometries(parts);parts.forEach(p=>p.dispose());
    const mesh=new THREE.Mesh(geometry,material);mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);
  }
  root.add(group);return group;
}
