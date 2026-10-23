import * as THREE from 'three';
import {evergreenCanopy} from './evergreen-canopy.mjs';

// A bounded rear bank only. The actual court/portals occupy the west side.
// Photo authority: supplied Okusha court stills show dense broadleaf cover
// behind the pavilion and service roof; individual stems are inferred.
export const senbonRestBankCandidates=Object.freeze([
  [283,43],[288,48],[285,55],[289,62],[285,70],[289,78],[284,85],
  [278,93],[271,98],[264,102],[280,103],[290,103],
].map(Object.freeze));

export function senbonRestBankPlan(features,ground,pathDistance,colliders){
  const occupied=colliders.filter(c=>c.type==='cylinder'&&/tree|trunk/.test(c.args.at(-1))).map(c=>[c.args[0],c.args[1]]);
  const excluded=features.buildings.map(b=>({minX:Math.min(...b.points.map(p=>p[0]))-3,maxX:Math.max(...b.points.map(p=>p[0]))+3,minZ:Math.min(...b.points.map(p=>p[2]))-3,maxZ:Math.max(...b.points.map(p=>p[2]))+3}));
  const trees=[];
  for(const [x,z] of senbonRestBankCandidates){
    const y=ground(x,z),distance=pathDistance(x,z)?.distance??0;
    if(!Number.isFinite(y)||!Number.isFinite(distance)||distance<5||excluded.some(b=>x>b.minX&&x<b.maxX&&z>b.minZ&&z<b.maxZ))continue;
    if([...occupied,...trees.map(t=>[t.x,t.z])].some(p=>Math.hypot(x-p[0],z-p[1])<4.8))continue;
    trees.push({x,y,z,scale:.96+trees.length%3*.09,yaw:trees.length*2.399963});
  }
  return trees;
}

/** Call after extendForest so existing physical stems win ownership. */
export function buildSenbonRestLandscape(root,features,ground,pathDistance,materials,colliders){
  if(root.children.some(c=>c.userData.senbonRestBankR94))return null;
  const trees=senbonRestBankPlan(features,ground,pathDistance,colliders);
  const group=new THREE.Group();group.name='Okusha bounded rear broadleaf bank';
  group.userData={senbonRestBankR94:true,provenance:'User-supplied Okusha court stills: broadleaf backdrop; inferred individual stems, terrain-seated, existing stems preferred'};
  if(!trees.length){root.add(group);return {trees:0,canopyInstances:0};}
  const canopy=evergreenCanopy(192),stem=new THREE.CylinderGeometry(.12,.30,1,7);stem.translate(0,.5,0);
  const trunkMaterial=materials.woodMat??new THREE.MeshStandardMaterial({color:'#4d493b',roughness:1});
  const trunks=new THREE.InstancedMesh(stem,trunkMaterial,trees.length);
  const leaves=new THREE.InstancedMesh(canopy.geometry,canopy.material,trees.length*5),dummy=new THREE.Object3D();
  const put=(mesh,i,x,y,z,sx,sy,sz,yaw)=>{dummy.position.set(x,y,z);dummy.rotation.set(0,yaw,0);dummy.scale.set(sx,sy,sz);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);};
  trees.forEach((t,i)=>{
    put(trunks,i,t.x,t.y-.12,t.z,t.scale,8*t.scale,t.scale,t.yaw);
    for(let j=0;j<5;j++){
      const angle=t.yaw+j*2.4,spread=j===4?0:1.7;
      put(leaves,i*5+j,t.x+Math.sin(angle)*spread,t.y+(7.4+j*.57)*t.scale,t.z+Math.cos(angle)*spread,3.2*t.scale,2.0*t.scale,3.0*t.scale,angle);
    }
    colliders.push({type:'cylinder',args:[t.x,t.z,.30*t.scale,t.y,t.y+8*t.scale,'okusha_bank_tree']});
  });
  for(const mesh of [trunks,leaves]){mesh.castShadow=mesh.receiveShadow=true;mesh.computeBoundingSphere();mesh.userData.nearForest=true;group.add(mesh);}
  root.add(group);return {trees:trees.length,canopyInstances:trees.length*5,drawBatches:2,leafTriangles:trees.length*5*(192*2+16)};
}
