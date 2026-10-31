import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {preservedForestLOD} from './forest-lod.mjs';

test('shared crown bounds are scanned once while all chunks retain their LODs',()=>{
 const chunks=new THREE.Group(),geometry=new THREE.BoxGeometry(12,16,12),material=new THREE.MeshBasicMaterial();
 let scans=0;const compute=geometry.computeBoundingBox.bind(geometry);
 geometry.computeBoundingBox=()=>{scans++;compute();};
 for(let i=0;i<100;i++){const mesh=new THREE.InstancedMesh(geometry,material,1);mesh.setMatrixAt(0,new THREE.Matrix4().makeTranslation(i*128,0,0));mesh.computeBoundingSphere();chunks.add(mesh);}
 preservedForestLOD(chunks);
 assert.equal(scans,1);assert.equal(chunks.children.length,100);assert.ok(chunks.children.every(lod=>lod.isLOD&&lod.levels.length===2));
});

function fixture(){
  const chunks=new THREE.Group(),near=new THREE.InstancedMesh(new THREE.BoxGeometry(12,16,12),new THREE.MeshBasicMaterial(),2);
  near.setMatrixAt(0,new THREE.Matrix4().makeTranslation(-60,0,0));
  near.setMatrixAt(1,new THREE.Matrix4().makeTranslation(60,0,0));
  near.computeBoundingSphere();chunks.add(near);preservedForestLOD(chunks);chunks.updateMatrixWorld(true);
  const lod=chunks.children[0],camera=new THREE.PerspectiveCamera();
  const update=x=>{camera.position.set(x,0,0);camera.updateMatrixWorld(true);lod.update(camera);};
  return {near,lod,far:lod.levels[1].object,update};
}

test('a cell with a distant center retains detailed crowns within 45 m of its bounds',()=>{
  const {near,far,update}=fixture();
  update(100);assert.equal(near.visible,true);assert.equal(far.visible,false);
});

test('distant crowns preserve all instances and return to detail before entering foreground',()=>{
  const {near,far,update}=fixture();
  update(1000);assert.equal(far.visible,true);assert.equal(near.visible,false);
  assert.equal(far.count,near.count);
  update(100);assert.equal(near.visible,true);assert.equal(far.visible,false);
  update(1000);assert.equal(far.visible,true);
});

test('distant crowns simplify inside the walker view budget without replacing near geometry',()=>{
  const {near,far,lod,update}=fixture();
  const nearGeometry=near.geometry;
  update(145);assert.equal(far.visible,true);assert.equal(near.visible,false);
  assert.equal(far.geometry.attributes.position.count/3,20);
  assert.equal(lod.levels[0].object.geometry,nearGeometry);
  // Coming back from the cheap level restores detail at the protected edge.
  update(near.boundingSphere.radius+44);
  assert.equal(near.visible,true);assert.equal(far.visible,false);
});

test('authored leaf cards bridge solid cover and full detail without changing transforms, pigment or shadow ownership',()=>{
 const source=new THREE.PlaneGeometry(12,16,3,3),material=new THREE.MeshStandardMaterial({map:new THREE.Texture(),alphaTest:.28,side:THREE.DoubleSide});
 const chunks=new THREE.Group(),near=new THREE.InstancedMesh(source,material,2);
 near.castShadow=true;near.receiveShadow=true;near.userData.partitionSourceIndices=[7,41];near.userData.seasonSourceGroup=3;
 for(let i=0;i<2;i++){near.setMatrixAt(i,new THREE.Matrix4().makeTranslation(i*30,0,0));near.setColorAt(i,new THREE.Color(.2+i*.1,.4,.1));}
 near.computeBoundingSphere();chunks.add(near);preservedForestLOD(chunks,true);chunks.updateMatrixWorld(true);
 const lod=chunks.children[0],middle=lod.levels[1].object,far=lod.levels[2].object,camera=new THREE.PerspectiveCamera();
 const update=d=>{camera.position.copy(lod.position).add(new THREE.Vector3(d,0,0));camera.updateMatrixWorld(true);lod.update(camera);};
 assert.equal(lod.levels.length,3);assert.equal(middle.material,near.material);
 assert.equal(middle.geometry.index.count/3,8);assert.equal(near.geometry.index.count/3,18);
 assert.deepEqual(Array.from(middle.instanceMatrix.array),Array.from(near.instanceMatrix.array));
 assert.deepEqual(Array.from(middle.instanceColor.array),Array.from(near.instanceColor.array));
 assert.deepEqual(middle.userData.seasonSourceIndices,[7,41]);assert.equal(middle.userData.seasonSourceGroup,3);
 assert.equal(middle.userData.seasonalMaple,true);assert.notEqual(middle.userData.precinctCanopy,true,'the middle copy cannot duplicate lighting/shaft occluders');
 assert.equal(near.castShadow,true);assert.equal(middle.castShadow,false);assert.equal(far.castShadow,false);
 assert.equal(middle.receiveShadow,true);
 update(lod.levels[1].distance+1);assert.equal(middle.visible,true);assert.equal(near.visible,false);assert.equal(far.visible,false);
 update(lod.levels[2].distance+1);assert.equal(far.visible,true);assert.equal(middle.visible,false);
 update(near.boundingSphere.radius+90);assert.equal(middle.visible,true);
 update(near.boundingSphere.radius+44);assert.equal(near.visible,true);assert.equal(middle.visible,false);
 const second=new THREE.InstancedMesh(source,material,1);second.computeBoundingSphere();const pair=new THREE.Group();pair.add(near.clone(),second);preservedForestLOD(pair,true);
 assert.equal(pair.children[0].levels[1].object.geometry,pair.children[1].levels[1].object.geometry,'one coarse geometry is reused across cells');
});

test('hidden middle cards are admitted to prewarm and share the reversible Aozora material',async()=>{
 const {collectInstancePrewarmEntries}=await import('./instance-prewarm-entries.mjs');
 const {createAozoraFoliage}=await import('./aozora-foliage.mjs');
 const geometry=new THREE.PlaneGeometry(12,16,3,3),map=new THREE.Texture(),material=new THREE.MeshStandardMaterial({map,normalMap:new THREE.Texture(),alphaTest:.28,side:THREE.DoubleSide});
 const near=new THREE.InstancedMesh(geometry,material,1),chunks=new THREE.Group();near.computeBoundingSphere();chunks.add(near);preservedForestLOD(chunks);chunks.updateMatrixWorld(true);
 const lod=chunks.children[0],middle=lod.levels[1].object;middle.visible=false;
 assert.equal(collectInstancePrewarmEntries([chunks]).length,3,'an invisible middle level prepares with the other instance owners');
 const foliage=createAozoraFoliage({foliage:[null,{geometry}]});foliage.applyTo(chunks);
 assert.equal(middle.material,near.material);assert.equal(middle.material.map,map);assert.equal(middle.material.alphaTest,.28);
 const node=middle.material.colorNode,version=middle.material.version;
 for(const look of ['aozora','natural','aozora'])foliage.setLook(look);
 assert.equal(middle.material.colorNode,node);assert.equal(middle.material.version,version);
 foliage.dispose();assert.equal(middle.material,material);assert.equal(near.material,material);
});
