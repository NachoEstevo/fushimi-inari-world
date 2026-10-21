import * as THREE from 'three';
import {toriiMaterials} from './torii-materials.mjs';

import {gondenAccessToriiLayout} from './gonden-access-torii-layout.mjs';

export function buildGondenAccessTorii(root,legacy,features,surfaces,colliders){
 const layout=gondenAccessToriiLayout(features);if(!layout)return {built:false};
 const existing=root.getObjectByName('Gonden west access torii R66');if(existing)return {built:true,...existing.userData};
 const [x,z]=layout.center,sx=layout.pillarSpan/2.48,sy=layout.height/3.38,sz=sx,c=Math.cos(layout.yaw),s=Math.sin(layout.yaw),half=layout.pillarSpan/2;
 // Keep the beam on the lower stair datum. The pillars sit outside its
 // corridor: their black feet must reach rendered terrain, not a nearby
 // network level projected across the grass. Terrain mesh offset is -.06m.
 const feet=[-1,1].map(sign=>({x:x+sign*half*c,z:z-sign*half*s}));
 const levels=feet.map(p=>{
  const radius=.144*sx,samples=[[0,0],[radius,0],[-radius,0],[0,radius],[0,-radius]];
  return Math.min(...samples.map(([dx,dz])=>{const px=p.x+dx,pz=p.z+dz,network=surfaces.height(px,pz),terrain=surfaces.terrainHeight?.(px,pz);return Number.isFinite(terrain)?Math.min(network,terrain-.06):network;}));
 }),base=surfaces.height(x,z);
 const group=new THREE.Group();group.name='Gonden west access torii R66';group.position.set(x,base,z);group.rotation.y=layout.yaw;group.scale.set(sx,sy,sz);
 const finishes=toriiMaterials(legacy,{separateInk:true}),red=new THREE.Mesh(legacy.torii.geometry,finishes.fresh),blackGeometry=legacy.torii.blackGeometry.clone();
 // Preserve the inherited black cap, with only a restrained continuous lift.
 const positions=blackGeometry.attributes.position;for(let i=0;i<positions.count;i++)if(positions.getY(i)>3.15)positions.setY(i,positions.getY(i)+.045*Math.pow(positions.getX(i)/2.1,2));blackGeometry.computeVertexNormals();
 const black=new THREE.Mesh(blackGeometry,legacy.materials.blackNemakiMat);for(const mesh of [red,black]){mesh.castShadow=mesh.receiveShadow=true;group.add(mesh);}
 // Suppress only obsolete generic legacy gate instances at this one station.
 // Dedicated mountain, twin-tunnel and mapped entry gates are separate owners.
 root.updateWorldMatrix(true,true);const hiddenCenters=[],oldPosts=[],matrix=new THREE.Matrix4(),world=new THREE.Matrix4(),point=new THREE.Vector3();let hiddenComponents=0;
 for(const mesh of legacy.toriiMeshes){
  if(!mesh.isInstancedMesh)continue;
  for(let i=0;i<mesh.count;i++){
   mesh.getMatrixAt(i,matrix);world.multiplyMatrices(mesh.matrixWorld,matrix);point.setFromMatrixPosition(world);
   if(Math.hypot(point.x-x,point.z-z)>2.8||Math.abs(point.y-base)>5)continue;
   if(!hiddenCenters.some(p=>Math.hypot(p[0]-point.x,p[1]-point.z)<.01)){
    hiddenCenters.push([point.x,point.z]);for(const side of [-1,1]){const p=new THREE.Vector3(side*1.24,0,0).applyMatrix4(world);oldPosts.push([p.x,p.z]);}
   }
   mesh.setMatrixAt(i,new THREE.Matrix4().makeScale(0,0,0));hiddenComponents++;
  }
  mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingBox();mesh.computeBoundingSphere();
 }
 let removedColliders=0;
 for(let i=colliders.length-1;i>=0;i--){const col=colliders[i];if(col.type==='cylinder'&&col.args.at(-1)==='torii'&&oldPosts.some(p=>Math.hypot(col.args[0]-p[0],col.args[1]-p[1])<.15)){colliders.splice(i,1);removedColliders++;}}
 root.add(group);
 for(let i=0;i<feet.length;i++){
  const p=feet[i],depth=base-levels[i];
  if(depth>.015){const foot=new THREE.Mesh(new THREE.CylinderGeometry(.144*sx,.144*sx,depth,16),legacy.materials.blackNemakiMat);foot.position.set(p.x,levels[i]+depth/2,p.z);foot.castShadow=foot.receiveShadow=true;root.add(foot);}
  colliders.push({type:'cylinder',args:[p.x,p.z,.144*sx,levels[i],base+layout.height,'gonden_access_torii']});
 }
 group.userData={...layout,base,footLevels:levels,hiddenLegacyStations:hiddenCenters,hiddenComponents,removedColliders,provenance:'Exact stair axis/end from OSM; single gate station and dimensions inferred from supplied StreetView. Existing donation variants elsewhere unchanged; no unreadable donor text fabricated.'};
 return {built:true,...group.userData};
}
