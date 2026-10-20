import * as THREE from 'three';

// Close the exposed edges of the original thin patio slabs against the DEM.
// Footprints and elevations stay authored; wall profiles are inferred supports,
// not surveyed retaining walls. No geometry is added across a walking surface.
export function supportTerraces(root,legacy,ground){
  root.updateMatrixWorld(true);
  const vertices=[],uv=[],v=new THREE.Vector3();
  let supported=0;
  root.traverse(object=>{
    if(!object.isMesh||object.isInstancedMesh||object.geometry.type!=='BoxGeometry')return;
    if(![legacy.materials.flagstoneMat,legacy.materials.stoneMat].includes(object.material))return;
    const {width:w,height:h,depth:d}=object.geometry.parameters;
    if(w<3||d<3||h>.65)return;
    const corners=[[-w/2,-d/2],[w/2,-d/2],[w/2,d/2],[-w/2,d/2]];
    let added=false;
    for(let side=0;side<4;side++){
      const a=corners[side],b=corners[(side+1)%4],n=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1]));
      for(let i=0;i<n;i++){
        const top=t=>v.set(a[0]+(b[0]-a[0])*t,-h/2,a[1]+(b[1]-a[1])*t).applyMatrix4(object.matrixWorld).toArray();
        const p=top(i/n),q=top((i+1)/n);
        const py=Math.min(p[1],ground(p[0],p[2])-.12),qy=Math.min(q[1],ground(q[0],q[2])-.12);
        if(Math.max(p[1]-py,q[1]-qy)<.15)continue;
        for(const point of [p,[p[0],py,p[2]],q,q,[p[0],py,p[2]],[q[0],qy,q[2]]]){
          vertices.push(...point);uv.push((side%2?point[2]:point[0])/1.4,point[1]/1.4);
        }
        added=true;
      }
    }
    if(added)supported++;
  });
  if(vertices.length){
    const geometry=new THREE.BufferGeometry();
    geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
    geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geometry.computeVertexNormals();
    const material=legacy.materials.stoneMat.clone();material.side=THREE.DoubleSide;
    const mesh=new THREE.Mesh(geometry,material);mesh.name='Inferred terrace foundations';mesh.receiveShadow=true;mesh.castShadow=true;root.add(mesh);
  }
  return {supported,provenance:'Original patio edges extended down to terrain; inferred masonry profiles'};
}
