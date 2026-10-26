import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

// Late builders can attach translated groups after an earlier world update.
// Bake only current world matrices; otherwise local geometry lands at origin.
export function batchStaticScene(root,retained=new Set(),cellSize=128,residencyRetained=new Set()){
 root.updateMatrixWorld(true);
 const buckets=new Map(),meshes=[],sectors=new Map(),residencyEntries=[];
 const effectivelyVisible=object=>{for(let o=object;o;o=o.parent){if(!o.visible)return false;if(o===root)break;}return true;};
 function sectorFor(object){
  if(!object.geometry.boundingSphere)object.geometry.computeBoundingSphere();
  const center=object.geometry.boundingSphere.center.clone().applyMatrix4(object.matrixWorld);
  const cell=[Math.floor(center.x/cellSize),Math.floor(center.z/cellSize)],key=cell.join(',');
  if(!sectors.has(key))sectors.set(key,{bounds:new THREE.Box3(),retained:[]});
  const sector=sectors.get(key);
  if(!object.geometry.boundingBox)object.geometry.computeBoundingBox();
  sector.bounds.union(object.geometry.boundingBox.clone().applyMatrix4(object.matrixWorld));
  return {cell,sector};
 }
 root.traverse(object=>{
  if(!object.isMesh||object.isInstancedMesh||!effectivelyVisible(object))return;
  if(retained.has(object)){if(residencyRetained.has(object))sectorFor(object).sector.retained.push(object);return;}
  if(Array.isArray(object.material))return;
  // Repeated props share geometry; scanning every vertex again for every
  // placement makes preparation scale with instances instead of unique assets.
  if(!object.geometry.boundingSphere)object.geometry.computeBoundingSphere();
  const {cell}=sectorFor(object);
  const key=cell.join(',')+':'+object.material.uuid+Object.keys(object.geometry.attributes).sort().join(',')+Boolean(object.geometry.index)+`:${object.castShadow}:${object.receiveShadow}`;
  if(!buckets.has(key))buckets.set(key,{cell,objects:[]});buckets.get(key).objects.push(object);
 });
 let mergedBatches=0,sourceMeshes=0;
 const inverseRoot=root.matrixWorld.clone().invert();
 for(const {cell,objects}of buckets.values()){
  sourceMeshes+=objects.length;
  if(objects.length<2){meshes.push(objects[0]);residencyEntries.push({object:objects[0],cell});continue;}
  const geometries=objects.map(o=>o.geometry.clone().applyMatrix4(inverseRoot.clone().multiply(o.matrixWorld)));
  const merged=mergeGeometries(geometries,false);geometries.forEach(g=>g.dispose());
  if(!merged){meshes.push(...objects);residencyEntries.push(...objects.map(object=>({object,cell})));continue;}
  const mesh=new THREE.Mesh(merged,objects[0].material);
  mesh.name=`Static sector ${cell.join(',')}`;mesh.userData.staticSector=cell;
  mesh.castShadow=objects[0].castShadow;mesh.receiveShadow=objects[0].receiveShadow;
  root.add(mesh);objects.forEach(o=>o.removeFromParent());meshes.push(mesh);residencyEntries.push({object:mesh,cell});mergedBatches++;
 }
 root.updateMatrixWorld(true);
 // These render leaves have finished their placement. Retained animation and
 // hierarchy owners remain automatic. r180 honors matrixWorldAutoUpdate even
 // when the Scene forces an update; older Three versions only skip composition.
 const frozen=meshes.filter(mesh=>mesh.children.length===0),freezeWorld=Number(THREE.REVISION)>=180;
 for(const mesh of frozen){mesh.matrixAutoUpdate=false;if(freezeWorld)mesh.matrixWorldAutoUpdate=false;}
 // All material batches and retained interactive leaves in a sector share one
 // residency envelope, preventing roof/body fragments at the range boundary.
 for(const [key,sector]of sectors){
  const bounds=sector.bounds.getBoundingSphere(new THREE.Sphere());
  for(const object of sector.retained)residencyEntries.push({object,cell:key.split(',').map(Number)});
  sector.sphere=bounds;
 }
 for(const entry of residencyEntries){entry.bounds=sectors.get(entry.cell.join(',')).sphere;delete entry.cell;}
 return {meshes,residencyEntries,mergedBatches,sourceMeshes,frozenTransforms:frozen.length,
  // Explicit relocation remains possible without turning per-frame work back on.
  refreshTransforms(){for(const mesh of frozen){mesh.matrixWorldAutoUpdate=true;mesh.updateMatrix();mesh.updateWorldMatrix(true,false);if(freezeWorld)mesh.matrixWorldAutoUpdate=false;}}};
}
