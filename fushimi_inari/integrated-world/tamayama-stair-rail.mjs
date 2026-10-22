import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {tamayamaStairRailLayout,okumiyaStairRailLayout} from './tamayama-stair-layout.mjs?v=77';

// The supplied west-facing Tamayama photograph establishes a dividing rail.
// Its dimensions/central station are inferred; OSM owns the flight alignment
// and width. Do not add another pair of generic rails at the same flight.
export function buildTamayamaStairRail(root,network,colliders){
  return buildDividingRail(root,network,colliders,tamayamaStairRailLayout(network),{
    name:'Tamayama west stair continuous dividing handrail',path:'way/105449693',color:'#807762',offsets:[0],
    provenance:'June2012 Tamayama west-facing supplied photo; dividing rail inferred on mapped centreline; existing stair heights and count retained. Width follows the supplied network, including its explicitly photo-estimated access-width override.'});
}

export function buildOkumiyaStairRail(root,network,colliders){
  return buildDividingRail(root,network,colliders,okumiyaStairRailLayout(network),{
    name:'Okumiya upper stair brown twin dividing handrail',path:'way/626313768',color:'#79604c',offsets:[-.075,.075],
    provenance:'Video06:05 outputs/r77/video-0605.png and OSM626313768 handrail:center=yes; brown twin tubes on central posts, inferred .15m spacing/.84m height. Existing mapped 6m stair width, tread count and resolved grades retained.'});
}

function buildDividingRail(root,network,colliders,layout,config){
  if(root.getObjectByName(config.name)||!layout)return null;
  const {flight,joints}=layout;
  const group=new THREE.Group();group.name=config.name;
  const parts=[],metal=new THREE.MeshStandardMaterial({color:config.color,metalness:.42,roughness:.55});
  const tube=(a,b,r)=>{
    const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b),delta=bv.clone().sub(av),length=delta.length();
    if(length<.001)return;
    const geo=new THREE.CylinderGeometry(r,r,length,8);
    geo.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),delta.divideScalar(length)));
    geo.translate(...av.add(bv).multiplyScalar(.5).toArray());parts.push(geo);
  };
  for(let i=1;i<joints.length;i++){
    const a=joints[i-1],b=joints[i];
    const dx=b[0]-a[0],dz=b[2]-a[2],length=Math.hypot(dx,dz),yaw=Math.atan2(-dz,dx);
    for(const offset of config.offsets){
      const ox=-dz/length*offset,oz=dx/length*offset;
      tube([a[0]+ox,a[1],a[2]+oz],[b[0]+ox,b[1],b[2]+oz],.026);
    }
    colliders.push({type:'box',args:[(a[0]+b[0])/2,(a[2]+b[2])/2,length/2,Math.max(...config.offsets.map(Math.abs))+.028,yaw,Math.min(a[1],b[1])-.70,Math.max(a[1],b[1])+.03,config.path==='way/105449693'?'tamayama_dividing_rail':'okumiya_dividing_rail']});
  }
  let postDistance=0,posts=0;
  for(let i=0;i<joints.length;i++){
    if(i>0)postDistance+=Math.hypot(joints[i][0]-joints[i-1][0],joints[i][2]-joints[i-1][2]);
    if(i!==0&&i!==joints.length-1&&postDistance<1.8)continue;
    const p=joints[i],s=flight[Math.min(i,flight.length-1)],base=s.ya;
    tube([p[0],base-.04,p[2]],p,.025);
    if(config.offsets.length>1){
      const s=flight[Math.min(i,flight.length-1)],dx=s.b[0]-s.a[0],dz=s.b[2]-s.a[2],length=Math.hypot(dx,dz),r=Math.max(...config.offsets.map(Math.abs));
      tube([p[0]-dz/length*r,p[1],p[2]+dx/length*r],[p[0]+dz/length*r,p[1],p[2]-dx/length*r],.02);
    }
    postDistance=0;posts++;
  }
  const geometry=mergeGeometries(parts,false);parts.forEach(g=>g.dispose());
  const mesh=new THREE.Mesh(geometry,metal);mesh.castShadow=mesh.receiveShadow=true;group.add(mesh);root.add(group);
  // Call before buildPathMeshes: its general handrail renderer must not add
  // duplicate left/right rails after this photo-specific owner is installed.
  for(const s of flight)s.handrail=false;
  return {path:config.path,posts,railSegments:flight.length,tubes:config.offsets.length,renderedWidth:flight[0].width,provenance:config.provenance};
}
