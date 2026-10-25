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
    // LOD measures distance to the cell center, not its closest crown. Include
    // the whole cell radius so a distant cell center cannot simplify nearby
    // trees. Account for hysteresis too: returning from the far level must
    // restore detailed foliage before any crown enters the 300 m foreground.
    const hysteresis=.12,distance=(300+near.boundingSphere.radius)/(1-hysteresis);
    lod.addLevel(near,0);lod.addLevel(far,distance,hysteresis);chunks.add(lod);
  }
  return chunks;
}
