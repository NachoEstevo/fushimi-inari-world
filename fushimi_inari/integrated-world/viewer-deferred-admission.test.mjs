import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from 'three';
import {createWalkingPrewarm} from './walking-prewarm.mjs';
import {prepareWalkingNeighborhood} from './walking-neighborhood-preparation.mjs';

// Run the production callback's admission tail without bootstrapping the DOM.
const source=readFileSync(new URL('./viewer.mjs',import.meta.url),'utf8');
const start=source.indexOf('    group.updateWorldMatrix(true,true);',source.indexOf('buildingAdded:async group=>'));
const end=source.indexOf('    detailChunks.update(',start);
assert.ok(start>0&&end>start);
const admit=new Function('THREE','group','detailChunks','preparationResidency','preparationBounds','walkingPreparationBounds','walkingPrewarm',source.slice(start,end));

test('a streamed building joins both preparation maps and remains prepared after a quality generation change',async()=>{
 const scene=new THREE.Scene(),parent=new THREE.Group(),group=new THREE.Group();scene.add(parent);parent.add(group);
 parent.position.set(100,0,0);group.position.set(20,2,-4);group.rotation.y=.4;
 const mesh=new THREE.Mesh(new THREE.BoxGeometry(2,4,6),new THREE.MeshBasicMaterial());mesh.position.set(1,2,3);group.add(mesh);
 const preparationResidency=new Set(),existing=new THREE.Group(),existingBounds=new THREE.Sphere(new THREE.Vector3(9000,0,0),1);
 const preparationBounds=new Map([[existing,existingBounds]]),walkingPreparationBounds=new Map([[existing,existingBounds]]);
 const queued=[],appendCalls=[],compiled=[];
 const service=createWalkingPrewarm({entries:[],schedule:work=>queued.push(work),compile:async()=>{throw Error('The building must already be ready on handoff');}});
 let boxCalculations=0,detailBounds;
 class CountedBox extends THREE.Box3{setFromObject(...args){boxCalculations++;return super.setFromObject(...args);}}
 const detailChunks={add(object,options){assert.equal(object,group);assert.ok(options.bounds.isSphere);detailBounds=options.bounds;}};
 const position=group.position.clone(),rotation=group.quaternion.clone(),scale=group.scale.clone();
 admit({...THREE,Box3:CountedBox},group,detailChunks,preparationResidency,preparationBounds,walkingPreparationBounds,
  {...service,append(entries){appendCalls.push(...entries);service.append(entries);}});
 assert.equal(boxCalculations,1);assert.equal(appendCalls.length,1);assert.equal(preparationResidency.has(group),true);
 const bounds=preparationBounds.get(group);assert.ok(bounds.isBox3&&!bounds.isEmpty());
 assert.equal(walkingPreparationBounds.get(group),bounds);assert.equal(appendCalls[0].bounds,bounds);assert.equal(appendCalls[0].object,group);
 assert.equal(preparationBounds.get(existing),existingBounds);assert.equal(walkingPreparationBounds.get(existing),existingBounds);
 const centre=bounds.getCenter(new THREE.Vector3());assert.ok(centre.x>100);assert.deepEqual(detailBounds.center,centre);
 assert.equal(group.parent,parent);assert.equal(group.visible,true);assert.deepEqual(group.position,position);assert.ok(group.quaternion.equals(rotation));assert.deepEqual(group.scale,scale);
 // Later quality switches invalidate readiness, then consume the live map.
 // A service-only append used to leave this exact owner out of that gate.
 service.invalidate();const camera=new THREE.PerspectiveCamera();camera.position.copy(centre);
 const ready=await prepareWalkingNeighborhood({entries:walkingPreparationBounds,position:centre,camera,scene,service,radius:30,
  textureStreaming:{prepareAt:async()=>({textures:0,failed:0})},quality:{hasInitialized:()=>true,compileAsync:async scope=>{compiled.push(...scope.children.filter(o=>o.isMesh));}},
  yieldWork:async()=>{},getLights:async()=>[]});
 assert.equal(ready.prepared,1);assert.deepEqual(compiled,[mesh]);assert.equal(service.stats.prepared,1);
 service.update(centre,100);assert.equal(queued.length,0);assert.equal(service.stats.queued,0);
 service.dispose();mesh.geometry.dispose();mesh.material.dispose();
});
