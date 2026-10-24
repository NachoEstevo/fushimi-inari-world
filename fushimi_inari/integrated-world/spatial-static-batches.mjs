import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

// Late builders can attach translated groups after an earlier world update.
// Bake only current world matrices; otherwise local geometry lands at origin.
export function batchStaticScene(root,retained=new Set(),cellSize=128){
 root.updateMatrixWorld(true);
 const buckets=new Map(),meshes=[];
 root.traverse(object=>{
  if(!object.isMesh||object.isInstancedMesh||retained.has(object)||Array.isArray(object.material))return;
  object.geometry.computeBoundingSphere();
  const center=object.geometry.boundingSphere.center.clone().applyMatrix4(object.matrixWorld);
  const cell=[Math.floor(center.x/cellSize),Math.floor(center.z/cellSize)];
  const key=cell.join(',')+':'+object.material.uuid+Object.keys(object.geometry.attributes).sort().join(',')+Boolean(object.geometry.index)+`:${object.castShadow}:${object.receiveShadow}`;
  if(!buckets.has(key))buckets.set(key,{cell,objects:[]});buckets.get(key).objects.push(object);
 });
 let mergedBatches=0,sourceMeshes=0;
 const inverseRoot=root.matrixWorld.clone().invert();
 for(const {cell,objects}of buckets.values()){
  sourceMeshes+=objects.length;
  if(objects.length<2){meshes.push(objects[0]);continue;}
  const geometries=objects.map(o=>o.geometry.clone().applyMatrix4(inverseRoot.clone().multiply(o.matrixWorld)));
  const merged=mergeGeometries(geometries,false);geometries.forEach(g=>g.dispose());
  if(!merged){meshes.push(...objects);continue;}
  const mesh=new THREE.Mesh(merged,objects[0].material);
  mesh.name=`Static sector ${cell.join(',')}`;mesh.userData.staticSector=cell;
  mesh.castShadow=objects[0].castShadow;mesh.receiveShadow=objects[0].receiveShadow;
  root.add(mesh);objects.forEach(o=>o.removeFromParent());meshes.push(mesh);mergedBatches++;
 }
 root.updateMatrixWorld(true);
 return {meshes,mergedBatches,sourceMeshes};
}
