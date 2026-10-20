import * as THREE from 'three';
// A cheap crown occupies the same bounds as every preserved tree: distant
// culling must not erase the low-elevation woods absent from the hill envelope.
export function preservedForestLOD(chunks,maple=false){
  const geo=new THREE.IcosahedronGeometry(1,0),mat=new THREE.MeshLambertMaterial({color:maple?'#ffffff':'#35492a'});
  for(const near of [...chunks.children]){
    near.geometry.computeBoundingBox();const box=near.geometry.boundingBox,center=box.getCenter(new THREE.Vector3()),scale=box.getSize(new THREE.Vector3()).multiplyScalar(.5);
    const offset=new THREE.Matrix4().makeTranslation(...center.toArray()).multiply(new THREE.Matrix4().makeScale(...scale.toArray()));
    const far=new THREE.InstancedMesh(geo,mat,near.count),matrix=new THREE.Matrix4();
    for(let i=0;i<near.count;i++){near.getMatrixAt(i,matrix);far.setMatrixAt(i,matrix.multiply(offset));}
    far.userData.seasonalMaple=maple;far.computeBoundingSphere();
    const position=near.boundingSphere.center.clone(),lod=new THREE.LOD();lod.position.copy(position);
    near.position.copy(position).negate();far.position.copy(near.position);
    lod.addLevel(near,0);lod.addLevel(far,300,.12);chunks.add(lod);
  }
  return chunks;
}
