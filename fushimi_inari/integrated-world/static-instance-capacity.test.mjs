import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {padStaticInstanceMatrices} from './static-instance-capacity.mjs';

function fixture(capacities){
 const root=new THREE.Group(),geometry=new THREE.BoxGeometry(),material=new THREE.MeshBasicMaterial(),matrix=new THREE.Matrix4(),rotation=new THREE.Quaternion(),meshes=[];
 for(const capacity of capacities){
  const mesh=new THREE.InstancedMesh(geometry,material,capacity);
  for(let i=0;i<capacity;i++){
   rotation.setFromAxisAngle(new THREE.Vector3(0,1,0),i*.17);
   matrix.compose(new THREE.Vector3(i*.01,2,-5),rotation,new THREE.Vector3(.8,.6+i%5*.1,1.2));mesh.setMatrixAt(i,matrix);mesh.setColorAt(i,new THREE.Color(.2,.4,.6));
  }
  mesh.computeBoundingBox();mesh.computeBoundingSphere();root.add(mesh);meshes.push(mesh);
 }
 return {root,meshes,dispose(){for(const mesh of meshes)mesh.dispose();geometry.dispose();material.dispose();}};
}

test('static matrix capacities use bounded buckets without changing draw counts, matrices, colours or bounds',()=>{
 const capacities=[1,5,16,17,26,43,64,65,500,512,513,999,1000,1001],f=fixture(capacities);
 const snapshots=f.meshes.map(mesh=>({attribute:mesh.instanceMatrix,array:mesh.instanceMatrix.array.slice(),count:mesh.count,color:mesh.instanceColor,colors:mesh.instanceColor.array.slice(),box:mesh.boundingBox,sphere:mesh.boundingSphere,geometry:mesh.geometry,material:mesh.material}));
 const stats=padStaticInstanceMatrices([f.root,f.meshes[0]],{revision:'180'}),expected=[16,16,16,32,32,64,64,128,512,512,1000,1000,1000,1001];
 assert.equal(stats.eligible,13);assert.equal(stats.padded,9);assert.equal(stats.uniqueBefore,13);assert.equal(stats.uniqueAfter,6);
 assert.deepEqual(stats.capacitiesAfter,[16,32,64,128,512,1000]);assert.equal(stats.extraBytes,expected.reduce((sum,n,i)=>sum+(n-capacities[i])*64,0));
 f.meshes.forEach((mesh,i)=>{
  const before=snapshots[i];assert.equal(mesh.instanceMatrix.count,expected[i]);assert.equal(mesh.count,before.count);
  assert.deepEqual(mesh.instanceMatrix.array.slice(0,before.array.length),before.array);assert.deepEqual(before.attribute.array,before.array);assert.equal(before.attribute.count,capacities[i]);
  assert.equal(mesh.instanceColor===before.color,true);assert.deepEqual(mesh.instanceColor.array,before.colors);
  assert.equal(mesh.boundingBox===before.box,true);assert.equal(mesh.boundingSphere===before.sphere,true);assert.equal(mesh.geometry===before.geometry,true);assert.equal(mesh.material===before.material,true);
  if(expected[i]<=1000)assert.ok(mesh.instanceMatrix.array.byteLength<=64000);
 });
 assert.equal(padStaticInstanceMatrices([f.root],{revision:180}).padded,0);f.dispose();
});

test('padding preserves reserved matrices and attribute metadata without mutating the source attribute',()=>{
 const f=fixture([35]),mesh=f.meshes[0],source=mesh.instanceMatrix,upload=()=>{};mesh.count=7;
 source.name='owned transforms';source.normalized=true;source.meshPerAttribute=2;source.gpuType=THREE.FloatType;source.setUsage(THREE.StaticDrawUsage);source.onUpload(upload);source.needsUpdate=true;source.addUpdateRange(0,32);
 const values=source.array.slice();padStaticInstanceMatrices([f.root],{revision:180});const next=mesh.instanceMatrix;
 assert.equal(next!==source,true);assert.equal(next.count,64);assert.equal(mesh.count,7);assert.deepEqual(next.array.slice(0,values.length),values);assert.deepEqual(source.array,values);
 for(const key of ['name','normalized','meshPerAttribute','gpuType','usage','version','onUploadCallback'])assert.equal(next[key],source[key]);
 assert.deepEqual(next.updateRanges,source.updateRanges);next.updateRanges[0].count=1;assert.equal(source.updateRanges[0].count,32);f.dispose();
});

test('unsupported revisions, dynamic matrices, large attribute paths and malformed counts remain untouched',()=>{
 const f=fixture([20,20,20,20,1001]),before=f.meshes.map(mesh=>mesh.instanceMatrix);
 f.meshes[0].instanceMatrix.setUsage(THREE.DynamicDrawUsage);f.meshes[1].count=21;f.meshes[2].instanceMatrix=new THREE.InstancedBufferAttribute(new Float64Array(20*16),16);f.meshes[3].count=1.5;
 const current=f.meshes.map(mesh=>mesh.instanceMatrix);assert.equal(padStaticInstanceMatrices([f.root],{revision:180}).eligible,0);
 assert.ok(f.meshes.every((mesh,i)=>mesh.instanceMatrix===current[i]));
 f.meshes[0].instanceMatrix.setUsage(THREE.StaticDrawUsage);assert.equal(padStaticInstanceMatrices([f.root],{revision:181}).eligible,0);assert.equal(f.meshes[0].instanceMatrix===before[0],true);f.dispose();
});

test('real r180 InstanceNode sees fewer uniform array lengths while retaining each mesh draw count',{skip:THREE.REVISION!=='180'},async()=>{
 const [{default:InstanceNode},{default:StackNode},{getCurrentStack,setCurrentStack}]=await Promise.all([
  import('three/src/nodes/accessors/InstanceNode.js'),import('three/src/nodes/core/StackNode.js'),import('three/src/nodes/tsl/TSLBase.js')]);
 const f=fixture([17,26,31,33,43,63]),counts=f.meshes.map(mesh=>mesh.count),read=mesh=>{
  const saved=getCurrentStack();setCurrentStack(new StackNode());
  try{const node=new InstanceNode(mesh.count,mesh.instanceMatrix);node.setup({hasGeometryAttribute:()=>false});assert.equal(node.count,mesh.count);assert.equal(node.instanceMatrixNode.node.value===mesh.instanceMatrix.array,true);return node.instanceMatrixNode.node.bufferCount;}
  finally{setCurrentStack(saved);}
 };
 assert.deepEqual(f.meshes.map(read),counts);padStaticInstanceMatrices([f.root]);assert.deepEqual(f.meshes.map(read),[32,32,32,64,64,64]);assert.deepEqual(f.meshes.map(mesh=>mesh.count),counts);f.dispose();
});

test('onEligible reports every exact static owner once after padding, including unchanged buckets',()=>{
 const f=fixture([17,32,1001]),owners=[];f.meshes[2].instanceMatrix.setUsage(THREE.DynamicDrawUsage);
 padStaticInstanceMatrices([f.root,f.meshes[0]],{revision:180,onEligible:mesh=>owners.push({mesh,capacity:mesh.instanceMatrix.count})});
 assert.equal(owners.length,2);assert.equal(owners[0].mesh===f.meshes[0],true);assert.equal(owners[1].mesh===f.meshes[1],true);assert.deepEqual(owners.map(owner=>owner.capacity),[32,32]);f.dispose();
});
