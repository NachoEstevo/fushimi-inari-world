import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {finishPrecinctVeranda} from './precinct-veranda-materials.mjs';
import {batchStaticScene} from './spatial-static-batches.mjs';
test('veranda groups preserve triangles, original sides, and shared baked floor ownership',()=>{
 const source=new THREE.MeshStandardMaterial({color:'red'}),geometry=new THREE.BoxGeometry(6.8,.16,4.8);
 const a=new THREE.Mesh(geometry,source),b=new THREE.Mesh(new THREE.BoxGeometry(6.3,.16,4.4),source);
 const positions=Array.from(geometry.attributes.position.array),originalIndex=Array.from(geometry.index.array);
 finishPrecinctVeranda(a);finishPrecinctVeranda(b);
 assert.notEqual(a.geometry,geometry);assert.deepEqual(Array.from(geometry.index.array),originalIndex);
 assert.deepEqual(Array.from(a.geometry.attributes.position.array),positions);
 assert.equal(a.material[0],source);assert.equal(b.material[0],source);
 assert.equal(a.material[1].map,b.material[1].map);assert.equal(a.material[1].map,a.material[1].bumpMap);
 assert.equal(a.geometry.groups[0].start,0);assert.equal(a.geometry.groups[1].start,30);
 assert.equal(a.geometry.groups.reduce((n,g)=>n+g.count,0),a.geometry.index.count);
 assert.equal(a.geometry.groups.length,2);assert.equal(a.geometry.groups[0].count,30);assert.equal(a.geometry.groups[1].count,6);
 const canonical=indices=>{const result=[];for(let i=0;i<indices.length;i+=3)result.push(indices.slice(i,i+3).join(','));return result.sort();};
 assert.deepEqual(canonical(Array.from(a.geometry.index.array)),canonical(originalIndex));
 assert.equal(source.map,null);assert.equal(a.material[1].roughness,.94);assert.equal(a.material[1].metalness,0);
 const before=a.material,geo=a.geometry;finishPrecinctVeranda(a);assert.equal(a.material,before);assert.equal(a.geometry,geo);
});

test('unknown geometries remain untouched and the shared floor bake fits one small texture',()=>{
 const mesh=new THREE.Mesh(new THREE.BoxGeometry(6.8,.17,4.8),new THREE.MeshStandardMaterial()),geometry=mesh.geometry,material=mesh.material;
 assert.equal(finishPrecinctVeranda(mesh),false);assert.equal(mesh.geometry,geometry);assert.equal(mesh.material,material);
 const known=new THREE.Mesh(new THREE.BoxGeometry(6.8,.16,4.8),material);finishPrecinctVeranda(known);
 assert.equal(known.material[1].map.image.width,256);assert.equal(known.material[1].map.image.height,256);
 assert.equal(known.material[1].map.userData.sourceBytes,262144);assert.ok(known.material[1].map.userData.bakeMs>=0);
});

test('production static batcher preserves multi-material veranda as explicit retained residency',()=>{
 const root=new THREE.Group(),owner=new THREE.Group(),source=new THREE.MeshStandardMaterial();root.add(owner);owner.position.set(130,4,-25);
 const mesh=new THREE.Mesh(new THREE.BoxGeometry(6.8,.16,4.8),source);owner.add(mesh);finishPrecinctVeranda(mesh);
 const material=mesh.material,geometry=mesh.geometry;root.updateMatrixWorld(true);const before=mesh.matrixWorld.clone();
 const retained=new Set([mesh]),result=batchStaticScene(root,retained,128,retained);
 assert.equal(mesh.parent,owner);assert.equal(mesh.material,material);assert.equal(mesh.geometry,geometry);assert.deepEqual(mesh.matrixWorld,before);
 assert.equal(result.residencyEntries.length,1);assert.equal(result.residencyEntries[0].object,mesh);
 assert.equal(result.mergedBatches,0);assert.equal(mesh.geometry.groups.length,2);
});
