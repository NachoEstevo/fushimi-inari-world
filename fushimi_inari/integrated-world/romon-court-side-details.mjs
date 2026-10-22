import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

// June 2012 central-west Street View shows the COURT-facing Kairo screens,
// dark hanging lanterns. IMG6484/6485 resolve the barrier as red posts with
// one pale bamboo rail. romon-wings.mjs owns the physical outer window wall
// and open court arcade; never duplicate its apertures at the court edge.
export function buildRomonCourtSideDetails(root,romon,materials){
  const group=new THREE.Group();group.name='Romon existing wings court-facing detail';
  const source=romon.source??[0,1.6,0],yaw=romon.yaw??0,c=Math.cos(yaw),s=Math.sin(yaw);
  group.rotation.y=yaw;group.position.set(romon.target[0]-c*source[0]-s*source[2],romon.target[1]-source[1],romon.target[2]+s*source[0]-c*source[2]);
  group.userData={provenance:'Guide IMG6484/6485 (2021) resolves single pale rail/red posts; June2012 court view supports lanterns; inherited Kairo coordinates and inferred dimensions',courtFaceLocalZ:-2.31,screenOwner:'romon-wings.mjs outer wall',barrier:'IMG6484/6485 single pale rail on red posts; gallery remains closed by original kairo colliders'};
  const pale=new THREE.MeshStandardMaterial({color:'#d5cdb5',roughness:.82,metalness:.08});
  const bronze=new THREE.MeshStandardMaterial({color:'#363e31',roughness:.78,metalness:.35});
  const lanternShade=new THREE.MeshStandardMaterial({color:'#737462',roughness:.95});
  const red=materials.vermilionMat,batches=new Map();
  const part=(geometry,material)=>{if(!batches.has(material))batches.set(material,[]);batches.get(material).push(geometry);};
  const box=(w,h,d,x,y,z,material)=>part(new THREE.BoxGeometry(w,h,d).translate(x,y,z),material);
  const cylinder=(r0,r1,h,x,y,z,material,segments=8)=>part(new THREE.CylinderGeometry(r0,r1,h,segments).translate(x,y,z),material);
  for(const side of [-1,1]){
    const mid=side*12.5;
    // The pictured rail protects the gallery; it is not an invitation to
    // walk through it. Preserve the existing full Kairo collision envelope.
    const rail=new THREE.CylinderGeometry(.034,.034,12.55,8).rotateZ(Math.PI/2).translate(mid,2.88,-2.31);part(rail,pale);
    for(let post=0;post<6;post++)box(.085,1.05,.085,mid-6+post*2.4,2.575,-2.31,red);
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
