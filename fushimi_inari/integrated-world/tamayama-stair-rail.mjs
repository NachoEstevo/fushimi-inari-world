import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {tamayamaStairRailLayout} from './tamayama-stair-layout.mjs';

// The supplied west-facing Tamayama photograph establishes a dividing rail.
// Its dimensions/central station are inferred; OSM owns the flight alignment
// and width. Do not add another pair of generic rails at the same flight.
export function buildTamayamaStairRail(root,network,colliders){
  if(root.getObjectByName('Tamayama west stair continuous dividing handrail'))return null;
  const layout=tamayamaStairRailLayout(network);if(!layout)return null;
  const {flight,joints}=layout;
  const group=new THREE.Group();group.name='Tamayama west stair continuous dividing handrail';
  const parts=[],metal=new THREE.MeshStandardMaterial({color:'#807762',metalness:.42,roughness:.55});
  const tube=(a,b,r)=>{
    const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b),delta=bv.clone().sub(av),length=delta.length();
    if(length<.001)return;
    const geo=new THREE.CylinderGeometry(r,r,length,8);
    geo.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),delta.divideScalar(length)));
    geo.translate(...av.add(bv).multiplyScalar(.5).toArray());parts.push(geo);
  };
  for(let i=1;i<joints.length;i++){
    const a=joints[i-1],b=joints[i];tube(a,b,.026);
    const dx=b[0]-a[0],dz=b[2]-a[2],length=Math.hypot(dx,dz),yaw=Math.atan2(-dz,dx);
    colliders.push({type:'box',args:[(a[0]+b[0])/2,(a[2]+b[2])/2,length/2,.028,yaw,Math.min(a[1],b[1])-.70,Math.max(a[1],b[1])+.03,'tamayama_dividing_rail']});
  }
  let postDistance=0,posts=0;
  for(let i=0;i<joints.length;i++){
    if(i>0)postDistance+=Math.hypot(joints[i][0]-joints[i-1][0],joints[i][2]-joints[i-1][2]);
    if(i!==0&&i!==joints.length-1&&postDistance<1.8)continue;
    const p=joints[i],s=flight[Math.min(i,flight.length-1)],base=s.ya;
    tube([p[0],base-.04,p[2]],p,.025);postDistance=0;posts++;
  }
  const geometry=mergeGeometries(parts,false);parts.forEach(g=>g.dispose());
  const mesh=new THREE.Mesh(geometry,metal);mesh.castShadow=mesh.receiveShadow=true;group.add(mesh);root.add(group);
  // Call before buildPathMeshes: its general handrail renderer must not add
  // duplicate left/right rails after this photo-specific owner is installed.
  for(const s of flight)s.handrail=false;
  return {path:'way/105449693',posts,railSegments:flight.length,renderedWidth:flight[0].width,
    provenance:'June2012 Tamayama west-facing supplied photo; dividing rail inferred on mapped centreline; existing stair heights and count retained. Width follows the supplied network, including its explicitly photo-estimated access-width override.'};
}
