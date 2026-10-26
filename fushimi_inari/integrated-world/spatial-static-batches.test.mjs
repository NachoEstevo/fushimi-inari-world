import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from 'three';
import {buildOkushaMappedSheltersR102,okushaTemizuyaIdR102} from './okusha-mapped-shelters-r102.mjs';
import {batchStaticScene} from './spatial-static-batches.mjs';

const features=JSON.parse(readFileSync(new URL('../geography/features.json',import.meta.url)));
const material=()=>new THREE.MeshStandardMaterial();
function box(parent,mat,position=[0,0,0]){
 const source=new THREE.BoxGeometry(.2,.2,.2),mesh=new THREE.Mesh(source.toNonIndexed(),mat);source.dispose();
 mesh.position.fromArray(position);mesh.castShadow=mesh.receiveShadow=true;parent.add(mesh);return mesh;
}
// Deliberately derive the reference from local transforms. Updating matrixWorld
// here would erase the late-builder regression before the batcher sees it.
function localChainWorld(object){
 const chain=[];for(let o=object;o;o=o.parent)chain.unshift(o);
 const matrix=new THREE.Matrix4();for(const o of chain){o.updateMatrix();matrix.multiply(o.matrix);}return matrix;
}
function vertices(root,mat){
 const list=[],v=new THREE.Vector3();root.traverse(mesh=>{
  if(!mesh.isMesh||mesh.isInstancedMesh||mesh.material!==mat)return;
  const p=mesh.geometry.attributes.position,index=mesh.geometry.index,matrix=localChainWorld(mesh);
  for(let i=0;i<(index?.count??p.count);i++)list.push(v.fromBufferAttribute(p,index?index.getX(i):i).applyMatrix4(matrix).toArray());
 });return list;
}
const keys=points=>points.map(p=>p.map(v=>v.toFixed(3)).join(',')).sort();

test('shared source geometry calculates its bounds once across repeated placements',()=>{
 const root=new THREE.Group(),geometry=new THREE.BoxGeometry(2,2,2),mat=material();
 let scans=0;const compute=geometry.computeBoundingSphere.bind(geometry);
 geometry.computeBoundingSphere=()=>{scans++;compute();};
 for(let i=0;i<100;i++){const mesh=new THREE.Mesh(geometry,mat);mesh.position.x=i*130;root.add(mesh);}
 const result=batchStaticScene(root);
 assert.equal(scans,1);assert.equal(result.sourceMeshes,100);assert.equal(result.meshes.length,100);
 assert.deepEqual(result.meshes.map(mesh=>mesh.position.x),Array.from({length:100},(_,i)=>i*130));
});

test('static render leaves stop composing matrices while retained animation stays automatic',()=>{
 const root=new THREE.Group(),mat=material(),animated=box(root,mat,[2,0,0]);
 box(root,mat,[3,0,0]);box(root,mat,[4,0,0]);
 const batch=batchStaticScene(root,new Set([animated]));
 let compositions=0,multiplications=0;
 for(const mesh of batch.meshes){
  const compose=mesh.updateMatrix.bind(mesh),multiply=mesh.matrixWorld.multiplyMatrices.bind(mesh.matrixWorld);
  mesh.updateMatrix=()=>{compositions++;compose();};mesh.matrixWorld.multiplyMatrices=(a,b)=>{multiplications++;return multiply(a,b);};
 }
 const before=batch.meshes.map(mesh=>mesh.matrixWorld.toArray());
 for(let frame=0;frame<600;frame++){animated.position.y=frame;root.updateMatrixWorld(true);}
 assert.equal(compositions,0);
 if(Number(THREE.REVISION)>=180)assert.equal(multiplications,0);
 assert.deepEqual(batch.meshes.map(mesh=>mesh.matrixWorld.toArray()),before);
 assert.equal(animated.matrixAutoUpdate,true);assert.equal(animated.matrixWorld.elements[13],599);
 assert.equal(batch.frozenTransforms,batch.meshes.length);
 root.position.set(10,2,3);batch.refreshTransforms();
 for(let i=0;i<batch.meshes.length;i++)assert.deepEqual(batch.meshes[i].matrixWorld.toArray().slice(12,15),[before[i][12]+10,before[i][13]+2,before[i][14]+3]);
});

test('late mapped Okusha shelter stays in its mapped footprint through the production batcher',()=>{
 const root=new THREE.Group(),stone=material(),plaster=material(),colliders=[];
 box(root,stone,[1,0,1]);root.updateMatrixWorld(true);
 const shelter=buildOkushaMappedSheltersR102(root,features,{entryStoneMat:stone,plasterMat:plaster},()=>62.559976959228514,colliders);
 assert.deepEqual(shelter.builtIds,[okushaTemizuyaIdR102]);
 const source=shelter.group.children.find(o=>o.material===stone),geometry=source.geometry,positions=geometry.attributes.position.array.slice();
 assert.equal(source.matrixWorld.elements[12],0,'new shelter still has stale world matrices before batching');
 const expected=vertices(root,stone),beforeColliders=JSON.stringify(colliders);
 const result=batchStaticScene(root,new Set());
 const actual=vertices(root,stone),high=actual.filter(p=>p[1]>60);
 assert.deepEqual(keys(actual),keys(expected),'all stone triangles retain their complete hierarchy transform');
 assert.equal(high.length,660,'all 220 catchment, post-shoe and fitting triangles survive');
 assert.ok(high.every(([x,,z])=>x>252.8&&x<255.23&&z>65.77&&z<67.30),'no shelter stone is stranded over Rōmon');
 assert.deepEqual(geometry.attributes.position.array,positions,'source vertex storage is not rewritten');
 assert.equal(JSON.stringify(colliders),beforeColliders,'render batching does not alter physical shelter ownership');
 assert.ok(result.meshes.length>0);
});

test('nested late translations, rotations and nonuniform scale survive a real merged batch',()=>{
 const root=new THREE.Group(),mat=material();box(root,mat,[23,2,26]);root.updateMatrixWorld(true);
 const parent=new THREE.Group();parent.position.set(20,3,22);parent.rotation.set(.12,.51,-.19);parent.scale.set(1.3,.7,1.8);root.add(parent);
 const child=new THREE.Group();child.position.set(.4,1.2,-.8);child.rotation.y=-.27;parent.add(child);box(child,mat,[.2,.1,.3]);
 const expected=vertices(root,mat),triangles=expected.length/3;
 const result=batchStaticScene(root,new Set());
 assert.ok(result.mergedBatches>=1,'fixture exercises merged geometry, not only untouched singleton meshes');
 assert.equal(vertices(root,mat).length/3,triangles);
 assert.deepEqual(keys(vertices(root,mat)),keys(expected));
});

test('transformed batch root does not apply its placement twice to merged vertices',()=>{
 const root=new THREE.Group(),mat=material();root.position.set(-40,7,11);root.rotation.y=.43;root.scale.set(1.2,.8,1.5);
 box(root,mat,[1,2,3]);const branch=new THREE.Group();branch.position.set(.7,.4,.2);root.add(branch);box(branch,mat,[2,2,3]);
 const expected=vertices(root,mat),result=batchStaticScene(root,new Set());
 assert.equal(result.mergedBatches,1);
 assert.deepEqual(keys(vertices(root,mat)),keys(expected));
});

test('interactive and animated retained meshes keep identity and are not absorbed into static sectors',()=>{
 const root=new THREE.Group(),mat=material(),owner=new THREE.Group();root.add(owner);
 const interactive=box(owner,mat,[2,1,2]),animated=box(owner,mat,[3,1,2]);
 interactive.userData.interactable={title:'Retained interaction',actions:[{run:()=>42}]};
 const before=[interactive.geometry,animated.geometry],references=[interactive,animated];
 box(root,mat,[4,1,2]);box(root,mat,[5,1,2]);
 const result=batchStaticScene(root,new Set(references));
 assert.equal(interactive.parent,owner);assert.equal(animated.parent,owner);
 assert.equal(interactive.geometry,before[0]);assert.equal(animated.geometry,before[1]);
 assert.equal(interactive.userData.interactable.actions[0].run(),42);
 assert.ok(references.every(mesh=>!result.meshes.includes(mesh)));
 assert.equal(result.mergedBatches,1);
});
