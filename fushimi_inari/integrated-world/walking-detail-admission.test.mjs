import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from 'three';
import {heightAt} from '../geography/geo-core.mjs';
import {makePathSurfaces} from './path-surfaces.mjs';
import {buildKeihanFrontages} from './keihan-frontages.mjs';
import {buildKeihanUrasando} from './keihan-urasando.mjs';
import {installKeihanStreetCommerce} from './keihan-street-commerce.mjs';
import {buildKeihanStreetObservedDetails} from './keihan-street-observed-details.mjs';
import {buildKeihanStationDetailPolish} from './keihan-station-detail-polish.mjs';
import {buildKeihanVideoMerchandise} from './keihan-video-merchandise.mjs';
import {collectInstancePrewarmEntries} from './instance-prewarm-entries.mjs';
import {createWalkingPrewarm} from './walking-prewarm.mjs';
import {compileSelectedVisuals} from './scoped-compilation.mjs';

// Exercise the actual viewer integration without starting its browser entry
// point. Keep this admission loop local there; the fixtures are real builders.
const viewer=readFileSync(new URL('./viewer.mjs',import.meta.url),'utf8');
const start=viewer.indexOf('  for(const object of preparationResidency){');
const end=viewer.indexOf('  const yieldPreparation=',start);
assert.ok(start>0&&end>start,'the viewer must snapshot its known late owners');
const admit=new Function('THREE','preparationResidency','preparationBounds',viewer.slice(start,end));
const features=JSON.parse(readFileSync(new URL('../geography/features.json',import.meta.url)));
const terrain=JSON.parse(readFileSync(new URL('../geography/terrain.json',import.meta.url)));

function fixture(){
 const scene=new THREE.Scene(),root=new THREE.Group(),colliders=[];scene.add(root);
 const surfaces=makePathSurfaces(features,(x,z)=>heightAt(terrain,x,z));
 const keihanFrontages=buildKeihanFrontages(root,features,surfaces,{},colliders);
 const keihanUrasando=buildKeihanUrasando(root,features,surfaces,{},colliders);
 const station=new THREE.Group();root.add(station);
 const assembly={root,colliders,surfaces,legacy:{interactables:[]},keihanFrontages,keihanUrasando,
  keihanStation:{built:true,group:station,spec:{platformFloor:31.039095}},
  walkHeight:(x,z)=>keihanFrontages.surfaceHeight(x,z)??keihanUrasando.surfaceHeight(x,z)??surfaces.height(x,z)};
 const families=[installKeihanStreetCommerce(assembly),buildKeihanStreetObservedDetails(assembly),
  buildKeihanStationDetailPolish(assembly),buildKeihanVideoMerchandise(assembly)];
 const owners=families.flatMap(f=>f.detailGroups);root.updateWorldMatrix(true,true);
 return {scene,root,families,owners};
}

test('all twenty real late detail owners are admitted even when dormant, without changing their scene ownership',()=>{
 const f=fixture();assert.deepEqual(f.families.map(v=>v.detailGroups.length),[7,8,1,4]);
 let meshes=0;for(const owner of f.owners)owner.traverse(o=>{if(o.isMesh)meshes++;});
 assert.equal(meshes,78);assert.equal(collectInstancePrewarmEntries(f.owners).length,0,'the former instance-only pass omitted every ordinary detail mesh');
 const existing=f.root.children[0],originalBounds=new THREE.Sphere(new THREE.Vector3(9000,0,0),1);
 const bounds=new Map([[existing,originalBounds]]);f.owners[0].visible=false;
 const before=f.owners.map(o=>({object:o,parent:o.parent,visible:o.visible,position:o.position.toArray(),rotation:o.quaternion.toArray(),scale:o.scale.toArray()}));
 admit(THREE,new Set([existing,...f.owners]),bounds);
 assert.equal(bounds.get(existing),originalBounds,'authoritative existing bounds keep their identity');assert.equal(bounds.size,21);
 for(const owner of f.owners){const b=bounds.get(owner);assert.ok(b?.isBox3&&!b.isEmpty());assert.ok([...b.min,...b.max].every(Number.isFinite));assert.ok(b.min.x<-100,'bounds are in the supported world location, not local coordinates');}
 for(const old of before){const o=old.object;assert.equal(o.parent,old.parent);assert.equal(o.visible,old.visible);assert.deepEqual(o.position.toArray(),old.position);assert.deepEqual(o.quaternion.toArray(),old.rotation);assert.deepEqual(o.scale.toArray(),old.scale);}
});

test('walking preparation compiles dormant late groups before their first activation, while hidden dispensed cans stay owned separately',async()=>{
 const f=fixture(),bounds=new Map();for(const owner of f.owners)owner.visible=false;admit(THREE,new Set(f.owners),bounds);
 const camera=new THREE.PerspectiveCamera();camera.position.set(-306,32.7,-182);
 const tasks=[],compiledOwners=new Set(),compiledMeshes=new Set(),parents=new Map();
 for(const owner of f.owners)owner.traverse(o=>parents.set(o,o.parent));
 const renderer={hasInitialized:()=>true,async compileAsync(scene){for(const object of scene.children)if(object.isMesh)compiledMeshes.add(object);}};
 const service=createWalkingPrewarm({entries:[...bounds].map(([object,bounds])=>({object,bounds})),radius:264,refillIntervalMs:0,
  schedule:task=>{tasks.push(task);},compile:async(object,{isCurrent})=>{
   assert.equal(object.visible,false,'preparation must not depend on world activation');
   await compileSelectedVisuals(renderer,f.scene,[object],camera,{batchSize:1,reuseRenderScene:true,includeHiddenRoots:true,yieldWork:async()=>{},getLights:async()=>[]});
   compiledOwners.add(object);return isCurrent();
  }});
 for(let time=0;time<10&&compiledOwners.size<f.owners.length;time++){
  service.update(camera.position,time*100,{direction:new THREE.Vector3(1,0,0)});while(tasks.length)await tasks.shift()();
 }
 assert.equal(compiledOwners.size,20);assert.equal(compiledMeshes.size,74,'four initially hidden collection-tray cans remain covered by zen.prepare instead');
 for(const owner of f.owners)assert.equal(owner.visible,false);for(const [o,parent]of parents)assert.equal(o.parent,parent);
 assert.equal(service.stats.failed,0);service.dispose();
});

test('empty and nonfinite late bounds never enter the walking spatial index',()=>{
 const empty=new THREE.Group(),invalid=new THREE.Group(),mesh=new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshBasicMaterial());mesh.position.x=NaN;invalid.add(mesh);
 const bounds=new Map();admit(THREE,new Set([empty,invalid]),bounds);assert.equal(bounds.size,0);
 mesh.geometry.dispose();mesh.material.dispose();
});
