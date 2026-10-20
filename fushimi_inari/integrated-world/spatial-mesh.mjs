import * as THREE from 'three';

// Partition complete triangles, retaining UVs/normals and the exact surface.
// Bounds include whole triangles across cell boundaries: no clipping or holes.
export function spatialMeshes(geometry,material,size=160,materialAt=null){
  const source=geometry.index?geometry.toNonIndexed():geometry;
  const position=source.attributes.position,buckets=new Map();
  for(let i=0;i<position.count;i+=3){
    const x=(position.getX(i)+position.getX(i+1)+position.getX(i+2))/3;
    const z=(position.getZ(i)+position.getZ(i+1)+position.getZ(i+2))/3;
    const surface=materialAt?.(x,z)??material;
    const key=`${Math.floor(x/size)},${Math.floor(z/size)},${surface.uuid}`;
    if(!buckets.has(key))buckets.set(key,{indices:[],surface});
    buckets.get(key).indices.push(i,i+1,i+2);
  }
  const group=new THREE.Group();
  for(const {indices,surface} of buckets.values()){
    const geo=new THREE.BufferGeometry();
    for(const [name,attr] of Object.entries(source.attributes)){
      const values=new attr.array.constructor(indices.length*attr.itemSize);
      indices.forEach((index,j)=>values.set(attr.array.subarray(index*attr.itemSize,(index+1)*attr.itemSize),j*attr.itemSize));
      geo.setAttribute(name,new THREE.BufferAttribute(values,attr.itemSize,attr.normalized));
    }
    geo.computeBoundingSphere();
    const mesh=new THREE.Mesh(geo,surface);mesh.receiveShadow=true;group.add(mesh);
  }
  if(source!==geometry)source.dispose();
  return group;
}

export function partitionInstances(mesh,size=128){
  const buckets=new Map(),matrix=new THREE.Matrix4(),center=new THREE.Vector3();
  for(let i=0;i<mesh.count;i++){
    mesh.getMatrixAt(i,matrix);
    if(Math.abs(matrix.determinant())<1e-12)continue;
    center.setFromMatrixPosition(matrix);
    const key=`${Math.floor(center.x/size)},${Math.floor(center.z/size)}`;
    if(!buckets.has(key))buckets.set(key,[]);
    buckets.get(key).push(i);
  }
  const group=new THREE.Group();group.name=mesh.name;
  group.applyMatrix4(mesh.matrix);
  for(const indices of buckets.values()){
    const part=new THREE.InstancedMesh(mesh.geometry,mesh.material,indices.length);
    indices.forEach((index,i)=>{
      mesh.getMatrixAt(index,matrix);part.setMatrixAt(i,matrix);
      if(mesh.instanceColor){const color=new THREE.Color();mesh.getColorAt(index,color);part.setColorAt(i,color);}
    });
    part.castShadow=mesh.castShadow;part.receiveShadow=mesh.receiveShadow;
    part.computeBoundingSphere();group.add(part);
  }
  return group;
}
