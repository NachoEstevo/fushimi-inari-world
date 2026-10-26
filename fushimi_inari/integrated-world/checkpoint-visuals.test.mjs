import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {collectCheckpointVisuals} from './checkpoint-visuals.mjs';

test('checkpoint collection includes dormant residency and LOD visuals without activation or reparenting',async()=>{
 const scene=new THREE.Scene(),geometry=new THREE.BoxGeometry(),material=new THREE.MeshBasicMaterial();
 const dormant=new THREE.Group(),near=new THREE.Mesh(geometry,material);dormant.position.x=10;dormant.visible=false;dormant.add(near);scene.add(dormant);
 const hidden=new THREE.Group();hidden.visible=false;const omitted=new THREE.Mesh(geometry,material);hidden.add(omitted);scene.add(hidden);
 const far=new THREE.Group();far.visible=false;far.add(new THREE.Mesh(geometry,material));scene.add(far);
 const lod=new THREE.LOD(),fine=new THREE.Mesh(geometry,material),coarse=new THREE.Mesh(geometry,material);lod.position.x=15;lod.addLevel(fine,0);lod.addLevel(coarse,50);coarse.visible=false;scene.add(lod);
 const instanced=new THREE.InstancedMesh(geometry,material,1);instanced.visible=false;instanced.computeBoundingSphere=()=>{throw Error('should use existing residency bounds');};scene.add(instanced);
 scene.updateMatrixWorld(true);
 const residencyRoots=new Set([dormant,far,instanced]),residencyBounds=new Map([
  [dormant,new THREE.Sphere(new THREE.Vector3(10,0,0),3)],
  [far,new THREE.Sphere(new THREE.Vector3(1000,0,0),3)],
  [instanced,new THREE.Box3(new THREE.Vector3(-2,-2,-2),new THREE.Vector3(2,2,2))]
 ]);
 const result=await collectCheckpointVisuals({scene,position:new THREE.Vector3(),radius:30,residencyRoots,residencyBounds,yieldWork:async()=>{}});
 assert.deepEqual(new Set(result.objects),new Set([near,fine,coarse,instanced]));
 assert.equal(dormant.visible,false);assert.equal(hidden.visible,false);assert.equal(coarse.visible,false);assert.equal(instanced.visible,false);
 assert.equal(near.parent,dormant);assert.equal(dormant.parent,scene);assert.equal(coarse.parent,lod);
 geometry.dispose();material.dispose();
});

test('checkpoint collection yields while skipping hidden nodes and bounds large unseen geometry work',async()=>{
 const scene=new THREE.Scene(),geometry=new THREE.BoxGeometry(),material=new THREE.MeshBasicMaterial();
 for(let i=0;i<300;i++){const group=new THREE.Group();group.visible=false;group.add(new THREE.Mesh(geometry,material));scene.add(group);}
 const large=new THREE.BufferGeometry();large.setAttribute('position',new THREE.BufferAttribute(new Float32Array(30001*3),3));large.computeBoundingSphere=()=>{throw Error('unbounded bound calculation');};
 scene.add(new THREE.Mesh(large,material));scene.updateMatrixWorld(true);
 let yields=0;const result=await collectCheckpointVisuals({scene,position:new THREE.Vector3(),yieldWork:async()=>{yields++;}});
 assert.ok(yields>=2,'skipped nodes still count toward the collection slice');assert.equal(result.objects.length,0);assert.equal(result.skippedLarge,1);
 geometry.dispose();large.dispose();material.dispose();
});

test('nested selected visuals are borrowed through one owning visual root',async()=>{
 const scene=new THREE.Scene(),geometry=new THREE.BoxGeometry(),material=new THREE.MeshBasicMaterial(),parent=new THREE.Mesh(geometry,material),child=new THREE.Mesh(geometry,material);
 parent.add(child);scene.add(parent);scene.updateMatrixWorld(true);
 const result=await collectCheckpointVisuals({scene,position:new THREE.Vector3(),yieldWork:async()=>{}});
 assert.deepEqual(result.objects,[parent]);assert.equal(child.parent,parent);
 geometry.dispose();material.dispose();
});
