import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {partitionInstances,subdivideShadowInstanceLeaves} from './spatial-mesh.mjs';
import {preservedForestLOD} from './forest-lod.mjs';
import {bambooLOD} from './bamboo-details.mjs';

function source(){
 const mesh=new THREE.InstancedMesh(new THREE.BoxGeometry(2,4,3),new THREE.MeshBasicMaterial(),4);
 for(const [i,x] of [-33,-1,1,34].entries()){
  const m=new THREE.Matrix4().compose(new THREE.Vector3(x,i,-i),new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),i*.3),new THREE.Vector3(1+i*.2,.8,1.2));
  mesh.setMatrixAt(i,m);mesh.setColorAt(i,new THREE.Color().setRGB((i+1)/5,.4,.7));
 }
 mesh.position.set(7,3,-2);mesh.rotation.y=.3;mesh.castShadow=true;mesh.receiveShadow=true;
 mesh.userData={nearForest:true,seasonSourceGroup:9,seasonSourceIndices:[15,24,35,46]};mesh.computeBoundingSphere();return mesh;
}
function records(mesh){
 mesh.updateWorldMatrix(true,false);const matrix=new THREE.Matrix4(),color=new THREE.Color(),out=[];
 for(let i=0;i<mesh.count;i++){
  mesh.getMatrixAt(i,matrix);matrix.premultiply(mesh.matrixWorld);
  if(mesh.instanceColor)mesh.getColorAt(i,color);
  out.push(JSON.stringify([matrix.elements.map(n=>+n.toFixed(5)),mesh.instanceColor?color.toArray().map(n=>+n.toFixed(5)):null]));
 }
 return out.sort();
}

test('shadow-only subcells preserve the original visible batch and full caster bounds',()=>{
 const root=new THREE.Group(),mesh=source();root.position.set(-5,2,6);root.add(mesh);
 const original=records(mesh),geometry=mesh.geometry,material=mesh.material,matrix=new THREE.Matrix4();
 const stats=subdivideShadowInstanceLeaves(root,16),group=mesh.children[0];root.updateMatrixWorld(true);
 assert.deepEqual(stats,{originalMeshCount:1,chunks:4,instances:4});
 assert.equal(root.children[0],mesh);assert.equal(mesh.geometry,geometry);assert.equal(mesh.material,material);
 assert.equal(mesh.castShadow,false);assert.equal(mesh.receiveShadow,true);assert.equal(mesh.layers.mask,1);
 assert.deepEqual(records(mesh),original);assert.deepEqual(group.children.flatMap(records).sort(),original);
 assert.equal(group.userData.shadowOnly,true);assert.equal(group.layers.mask,2);
 for(const part of group.children){
  assert.equal(part.geometry,geometry);assert.equal(part.material,material);
  assert.equal(part.castShadow,true);assert.equal(part.receiveShadow,false);assert.equal(part.layers.mask,2);
  assert.equal(part.userData.nearForest,undefined);assert.equal(part.userData.shadowOnly,true);assert.equal(part.userData.seasonSourceGroup,9);
  for(let i=0;i<part.count;i++){
   part.getMatrixAt(i,matrix);const sourceIndex=[-33,-1,1,34].indexOf(matrix.elements[12]);
   assert.equal(part.userData.seasonSourceIndices[i],[15,24,35,46][sourceIndex]);
   if(!geometry.boundingSphere)geometry.computeBoundingSphere();
   const sphere=geometry.boundingSphere.clone().applyMatrix4(matrix);
   assert.ok(part.boundingSphere.center.distanceTo(sphere.center)+sphere.radius<=part.boundingSphere.radius+1e-5);
  }
 }
 assert.deepEqual(subdivideShadowInstanceLeaves(root,16),{originalMeshCount:0,chunks:0,instances:0});
});

test('forest and bamboo keep the same LOD transitions and caster visibility',()=>{
 function build(kind,split){
  const root=partitionInstances(source(),128);
  if(kind==='forest')preservedForestLOD(root,true);else bambooLOD(root,'leaves');
  if(split)subdivideShadowInstanceLeaves(root,16);
  root.updateMatrixWorld(true);return root;
 }
 for(const kind of ['forest','bamboo']){
  const baseline=build(kind,false),split=build(kind,true),camera=new THREE.PerspectiveCamera();
  function visibleRecords(root,shadow){
   const result=[];
   root.traverse(mesh=>{
    if(!mesh.isInstancedMesh||!(mesh.layers.mask&(shadow?3:1))||(shadow&&!mesh.castShadow))return;
    for(let o=mesh;o;o=o.parent)if(!o.visible)return;
    result.push(...records(mesh));
   });
   return result.sort();
  }
  for(const position of [[0,0,0],[45,0,0],[110,0,0],[70,0,0],[0,0,0],[100,90,-50]]){
   camera.position.fromArray(position);camera.updateMatrixWorld(true);
   const state=root=>root.children.map(lod=>{lod.update(camera);return lod.levels.map(level=>level.object.visible);});
   assert.deepEqual(state(split),state(baseline));
   assert.deepEqual(visibleRecords(split,false),visibleRecords(baseline,false));
   assert.deepEqual(visibleRecords(split,true),visibleRecords(baseline,true));
   for(const lod of split.children)for(const level of lod.levels){
    const source=level.object;
    for(const group of source.children.filter(o=>o.userData.shadowOnly))assert.equal(group.visible,true);
   }
  }
 }
});

test('validates size and layer without mutating casters, including a root mesh',()=>{
 const mesh=source();
 for(const size of [0,-1,Infinity,NaN])assert.throws(()=>subdivideShadowInstanceLeaves(mesh,size),RangeError);
 for(const layer of [0,-1,32,1.5])assert.throws(()=>subdivideShadowInstanceLeaves(mesh,16,{layer}),RangeError);
 for(const minTriangles of [-1,Infinity,NaN])assert.throws(()=>subdivideShadowInstanceLeaves(mesh,16,{minTriangles}),RangeError);
 assert.equal(mesh.children.length,0);assert.equal(mesh.castShadow,true);
 assert.equal(subdivideShadowInstanceLeaves(mesh,16,{layer:2}).instances,4);
 assert.equal(mesh.children[0].layers.mask,4);
});

test('triangle budget skips small casters and unsplittable large batches',()=>{
 for(const nonIndexed of [false,true]){
  const small=source();if(nonIndexed)small.geometry=small.geometry.toNonIndexed();
  const before=records(small),material=small.material,geometry=small.geometry;
  // A box has 12 triangles: four instances have exactly 48 triangles.
  assert.deepEqual(subdivideShadowInstanceLeaves(small,16,{minTriangles:49}),{originalMeshCount:0,chunks:0,instances:0});
  assert.equal(small.castShadow,true);assert.equal(small.children.length,0);
  assert.deepEqual(records(small),before);assert.equal(small.material,material);assert.equal(small.geometry,geometry);
  assert.deepEqual(subdivideShadowInstanceLeaves(small,16,{minTriangles:48}),{originalMeshCount:1,chunks:4,instances:4});
  assert.deepEqual(small.children[0].children.flatMap(records).sort(),before);
 }
 const singleCell=source();
 for(let i=0;i<singleCell.count;i++)singleCell.setMatrixAt(i,new THREE.Matrix4().makeTranslation(i+1,0,i+1));
 const before=records(singleCell);
 assert.deepEqual(subdivideShadowInstanceLeaves(singleCell,16,{minTriangles:48}),{originalMeshCount:0,chunks:0,instances:0});
 assert.equal(singleCell.castShadow,true);assert.equal(singleCell.children.length,0);assert.deepEqual(records(singleCell),before);
});
