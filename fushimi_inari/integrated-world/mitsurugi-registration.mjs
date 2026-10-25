import * as THREE from 'three';
import {rotateXZ} from './spatial.mjs';

// The legacy model used the generic 12.5m peak apron at a 3.2m-wide shrine.
// Register its existing detail against the mapped physical owner rather than
// opening a collider hole through the shrine or inventing a bypass path.
export function registerMitsurugi(root,features,surfaces,colliders){
  const feature=features.buildings?.find(b=>b.id==='way/626313725');
  const owners=root.children.filter(o=>o.userData.zone==='mitsurugi'&&o.getObjectByName('Mitsurugi authored sanctuary compound'));
  if(!feature||owners.length!==1)return {built:false,reason:'unique-mapped-shrine-owner-required'};
  const owner=owners[0];
  if(owner.userData.mappedMitsurugi)return owner.userData.mappedMitsurugi;
  const compound=owner.getObjectByName('Mitsurugi authored sanctuary compound');
  const [a,b]=feature.points,yaw=Math.atan2(b[0]-a[0],b[2]-a[2]);
  const local=feature.points.map(p=>rotateXZ(p[0],p[2],-yaw));
  const minX=Math.min(...local.map(p=>p[0])),maxX=Math.max(...local.map(p=>p[0]));
  const minZ=Math.min(...local.map(p=>p[1])),maxZ=Math.max(...local.map(p=>p[1]));
  const width=maxX-minX,depth=maxZ-minZ;
  const [x,z]=rotateXZ((minX+maxX)/2,(minZ+maxZ)/2,yaw),y=surfaces.height(x,z);
  // Measure in the authored compound's own coordinates, including eaves and
  // rock. Horizontal compression is inferred; heights and interactions remain.
  const probe=compound.clone(true);probe.position.set(0,0,0);probe.rotation.set(0,0,0);probe.scale.set(1,1,1);
  const bounds=new THREE.Box3().setFromObject(probe),size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3());
  const sx=width/size.x,sz=depth/size.z;
  for(const child of [...owner.children])if(child!==compound)owner.remove(child);
  owner.position.set(x,y,z);owner.rotation.set(0,yaw,0);owner.scale.set(1,1,1);
  compound.rotation.set(0,0,0);compound.scale.set(sx,1,sz);compound.position.set(-center.x*sx,0,-center.z*sz);
  // Only remove the transformed generic peak collider belonging to this owner.
  const previous=colliders.filter(c=>c.type==='box'&&c.args.at(-1)==='peak_sanctuary'&&Math.hypot(c.args[0]-x,c.args[1]-z)<20);
  for(const collider of previous)colliders.splice(colliders.indexOf(collider),1);
  colliders.push({type:'box',args:[x,z,width/2,depth/2,yaw,y,y+bounds.max.y,'mitsurugi_mapped_shrine']});
  const report={built:true,sourceId:feature.id,width,depth,center:[x,y,z],yaw,replacedColliders:previous.length,
    provenance:'Mapped OSM building footprint; existing artistic compound compressed horizontally into its footprint. Architectural proportions and roof details remain inferred.'};
  owner.userData.mappedMitsurugi=report;
  return report;
}
