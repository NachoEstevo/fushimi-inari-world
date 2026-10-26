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
    part.userData.partitionSourceIndices=indices;
    part.castShadow=mesh.castShadow;part.receiveShadow=mesh.receiveShadow;
    part.computeBoundingSphere();group.add(part);
  }
  return group;
}

// The visible coarse mesh remains the LOD owner. Smaller children cast only
// on a dedicated layer, so main-view batching and placement stay unchanged.
export function subdivideShadowInstanceLeaves(root,size,{layer=1,minTriangles=0}={}){
  if(!Number.isFinite(size)||size<=0)throw new RangeError('Instance cell size must be finite and positive');
  if(!Number.isInteger(layer)||layer<1||layer>31)throw new RangeError('Shadow layer must be an integer from 1 to 31');
  if(!Number.isFinite(minTriangles)||minTriangles<0)throw new RangeError('Minimum triangles must be finite and non-negative');
  const leaves=[];
  root.traverse(object=>{
    if(!object.isInstancedMesh||!object.castShadow||object.userData.shadowOnly)return;
    const vertices=object.geometry.index?.count??object.geometry.attributes.position?.count??0;
    if(vertices/3*object.count>=minTriangles)leaves.push(object);
  });
  let chunks=0,instances=0,originalMeshCount=0;
  for(const mesh of leaves){
    const group=partitionInstances(mesh,size);
    if(group.children.length<=1)continue;
    group.position.set(0,0,0);group.quaternion.identity();group.scale.set(1,1,1);group.updateMatrix();
    group.layers.set(layer);group.userData={shadowOnly:true};
    for(const part of group.children){
      const indices=part.userData.partitionSourceIndices;
      part.layers.set(layer);part.castShadow=true;part.receiveShadow=false;
      part.frustumCulled=mesh.frustumCulled;part.renderOrder=mesh.renderOrder;
      part.customDepthMaterial=mesh.customDepthMaterial;part.customDistanceMaterial=mesh.customDistanceMaterial;
      part.userData={...mesh.userData,shadowOnly:true,partitionSourceIndices:indices,
        seasonSourceIndices:indices.map(index=>mesh.userData.seasonSourceIndices?.[index]??index)};
      delete part.userData.nearForest;
      chunks++;instances+=part.count;
    }
    mesh.add(group);mesh.castShadow=false;originalMeshCount++;
  }
  return {originalMeshCount,chunks,instances};
}

// Only pass owned, static subtrees. Their ancestors must remain stationary;
// after an intentional relocation call refreshTransforms before rendering.
export function freezeStaticInstanceTransforms(roots){
  const frozen=new Set();
  for(const root of roots){root.updateWorldMatrix(true,true);root.traverse(object=>frozen.add(object));}
  const freezeWorld=Number(THREE.REVISION)>=180;
  for(const object of frozen){object.matrixAutoUpdate=false;if(freezeWorld)object.matrixWorldAutoUpdate=false;}
  return {count:frozen.size,refreshTransforms(){
    const worldFlags=new Map();
    for(const object of frozen){worldFlags.set(object,object.matrixWorldAutoUpdate);object.matrixWorldAutoUpdate=true;object.updateMatrix();}
    for(const root of roots)root.updateWorldMatrix(true,true);
    for(const object of frozen)object.matrixWorldAutoUpdate=worldFlags.get(object);
  }};
}
