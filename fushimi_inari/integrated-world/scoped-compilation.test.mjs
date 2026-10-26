import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {compileAddedGroup,compileSelectedVisuals} from './scoped-compilation.mjs';

test('one selected scope batches visible and hidden roots together and deduplicates nested visuals',async()=>{
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(),geometry=new THREE.BoxGeometry(),material=new THREE.MeshBasicMaterial();
 const roots=Array.from({length:713},(_,i)=>{const mesh=new THREE.Mesh(geometry,material);mesh.visible=i%3===0;scene.add(mesh);return mesh;});
 const nested=new THREE.Mesh(geometry,material);roots[0].add(nested);
 const omitted=new THREE.Mesh(geometry,material);omitted.visible=false;roots[0].add(omitted);
 const snapshots=new Map([...roots,nested,omitted].map(object=>[object,{children:object.children,visible:object.visible,culled:object.frustumCulled,parent:object.parent}]));
 const scopes=new Set(),submitted=[],sizes=[];let clones=0;
 const clone=scene.clone;scene.clone=function(...args){clones++;return clone.apply(this,args);};
 const restored=()=>{for(const [object,state]of snapshots){assert.equal(object.children,state.children);assert.equal(object.visible,state.visible);assert.equal(object.frustumCulled,state.culled);assert.equal(object.parent,state.parent);}};
 await compileSelectedVisuals({compileAsync(scope){
  scopes.add(scope);const batch=[];scope.traverseVisible(object=>{if(object.isMesh)batch.push(object);});sizes.push(batch.length);submitted.push(...batch);
  assert.ok(batch.every(object=>!object.frustumCulled));
  return Promise.resolve().then(restored);
 }},scene,[...roots,nested,roots[1]],camera,{batchSize:4,now:()=>0,yieldWork:async()=>{restored();}});
 assert.equal(clones,1);assert.equal(scopes.size,1);assert.equal(sizes.length,Math.ceil(714/4));assert.ok(sizes.every(size=>size<=4));
 assert.equal(submitted.length,714);assert.equal(new Set(submitted).size,714);assert.ok(!submitted.includes(omitted));restored();
 for(const asynchronous of [false,true])await assert.rejects(compileSelectedVisuals({compileAsync(){if(asynchronous)return Promise.reject(Error('failed'));throw Error('failed');}},scene,roots,camera,{yieldWork:async()=>{}}),/failed/);
 restored();geometry.dispose();material.dispose();
});

test('nested renderables compile once each in bounded submissions with hierarchy restored before waiting',async()=>{
 const scene=new THREE.Scene(),group=new THREE.Group(),camera=new THREE.PerspectiveCamera();
 const geometry=new THREE.BoxGeometry(),material=new THREE.MeshBasicMaterial(),meshes=[];
 let parent=group;
 for(let i=0;i<31;i++){const mesh=new THREE.Mesh(geometry,material);parent.add(mesh);meshes.push(mesh);parent=mesh;}
 const children=new Map([group,...meshes].map(object=>[object,object.children])),submitted=[],sizes=[];
 await compileAddedGroup({compileAsync(scope){
  const batch=[];
  // Match the renderer's recursive projection, rather than counting only the
  // top-level borrowed references. Nested meshes must not escape the budget.
  scope.traverseVisible(object=>{if(object.isMesh)batch.push(object);});
  sizes.push(batch.length);submitted.push(...batch);
  return Promise.resolve().then(()=>{for(const object of [group,...meshes])assert.equal(object.children,children.get(object));});
 }},scene,group,camera,{batchSize:4,yieldWork:async()=>{}});
 assert.deepEqual(sizes,[4,4,4,4,4,4,4,3]);assert.deepEqual(submitted,meshes);
 for(const [i,mesh]of meshes.entries())assert.equal(mesh.parent,i===0?group:meshes[i-1]);
 const renderer={compileAsync(){throw Error('submission failed');}};
 await assert.rejects(compileAddedGroup(renderer,scene,group,camera,{yieldWork:async()=>{}}),/submission failed/);
 for(const object of [group,...meshes])assert.equal(object.children,children.get(object));
 geometry.dispose();material.dispose();
});

test('hidden-only scopes still yield during collection without submitting invisible geometry',async()=>{
 const scene=new THREE.Scene(),group=new THREE.Group(),camera=new THREE.PerspectiveCamera();
 for(let i=0;i<300;i++){const hidden=new THREE.Group();hidden.visible=false;group.add(hidden);}
 let yields=0;
 await compileAddedGroup({compileAsync(){assert.fail('hidden geometry must not compile');}},scene,group,camera,{collectBatchSize:32,now:()=>0,yieldWork:async()=>{yields++;}});
 assert.ok(yields>=9,'hidden nodes consume collection work and must respect the slice budget');
});
test('deferred compile borrows only new visuals and preserves world environment and ownership',async()=>{
 const scene=new THREE.Scene(),group=new THREE.Group(),other=new THREE.Group(),camera=new THREE.PerspectiveCamera();
 scene.add(group,other);scene.environment=new THREE.Texture();scene.fog=new THREE.Fog(0xcccccc,1,500);scene.environmentNode={tag:'environment'};
 const mesh=new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshBasicMaterial());group.add(mesh);
 const renderer={async compileAsync(scope,view,target){
  assert.equal(scope.isScene,true);assert.deepEqual(scope.children,[mesh]);assert.equal(scope.environment,scene.environment);
  assert.equal(scope.environmentNode,scene.environmentNode);assert.equal(scope.fog,scene.fog);assert.equal(scope.fog.far,500);
  assert.equal(mesh.frustumCulled,false);assert.equal(view,camera);assert.equal(target,scene);assert.equal(group.parent,scene);
 }};
 await compileAddedGroup(renderer,scene,group,camera);assert.equal(mesh.frustumCulled,true);assert.deepEqual(scene.children,[group,other]);
 renderer.compileAsync=async()=>{throw Error('failed');};
 await assert.rejects(compileAddedGroup(renderer,scene,group,camera),/failed/);assert.equal(group.parent,scene);
});
test('warmup yields between bounded batches without reparenting or activating detached visuals',async()=>{
 const scene=new THREE.Scene(),group=new THREE.Group(),camera=new THREE.PerspectiveCamera();
 const geometry=new THREE.BoxGeometry(),material=new THREE.MeshBasicMaterial();
 for(let i=0;i<31;i++)group.add(new THREE.Mesh(geometry,material));
 let yields=0;const visits=[],reports=[];
 await compileAddedGroup({async compileAsync(scope){
  assert.equal(group.parent,null);assert.ok(scope.children.length<=12);
  assert.equal(yields,visits.length+1);visits.push([...scope.children]);
  for(const mesh of scope.children)assert.equal(mesh.parent,group);
 }},scene,group,camera,{yieldWork:async()=>{yields++;},report:stats=>reports.push(stats)});
 assert.deepEqual(visits.map(batch=>batch.length),[12,12,7]);
 assert.equal(new Set(visits.flat()).size,31);assert.equal(reports.at(-1).objects,31);
 assert.deepEqual(scene.children,[]);
});


test('hidden prepared root compiles without activation and collection yields on large scopes',async()=>{
 const scene=new THREE.Scene(),group=new THREE.Group(),camera=new THREE.PerspectiveCamera();group.visible=false;
 const geometry=new THREE.BoxGeometry(),material=new THREE.MeshBasicMaterial();
 for(let i=0;i<130;i++)group.add(new THREE.Mesh(geometry,material));
 const hidden=new THREE.Group();hidden.visible=false;hidden.add(new THREE.Mesh(geometry,material));group.add(hidden);
 let yields=0,objects=0;const reports=[];
 const renderer={async compileAsync(scope){objects+=scope.children.length;assert.equal(group.visible,false);assert.equal(group.parent,null);}};
 await compileAddedGroup(renderer,scene,group,camera,{includeHiddenRoot:true,collectBatchSize:32,yieldWork:async()=>{yields++;},report:value=>reports.push(value)});
 assert.equal(objects,130);assert.ok(yields>=4+Math.ceil(130/12));assert.ok(reports.some(value=>value.phase==='collect'));
 assert.equal(group.visible,false);assert.equal(hidden.visible,false);assert.deepEqual(scene.children,[]);
 geometry.dispose();material.dispose();
});


test('hidden mesh roots are visible only during synchronous compile submission and restore on every outcome',async()=>{
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(),mesh=new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshBasicMaterial());
 mesh.visible=false;scene.add(mesh);
 const options={includeHiddenRoot:true,yieldWork:async()=>{}};
 let release,submitted;
 const entered=new Promise(resolve=>{submitted=resolve;});
 const renderer={compileAsync(scope){
  assert.deepEqual(scope.children,[mesh]);assert.equal(mesh.visible,true);assert.equal(mesh.frustumCulled,false);assert.equal(mesh.parent,scene);
  submitted();return new Promise(resolve=>{release=resolve;});
 }};
 const work=compileAddedGroup(renderer,scene,mesh,camera,options);
 await entered;assert.equal(mesh.visible,false,'visibility restores before waiting for backend pipelines');assert.equal(mesh.frustumCulled,true);
 release();await work;assert.equal(mesh.visible,false);
 for(const asynchronous of [false,true]){
  renderer.compileAsync=scope=>{
   assert.equal(scope.children[0].visible,true);assert.equal(mesh.frustumCulled,false);
   if(asynchronous)return Promise.reject(Error('pipeline failed'));
   throw Error('pipeline failed');
  };
  await assert.rejects(compileAddedGroup(renderer,scene,mesh,camera,options),/pipeline failed/);
  assert.equal(mesh.visible,false);assert.equal(mesh.frustumCulled,true);assert.equal(mesh.parent,scene);
 }
 mesh.geometry.dispose();mesh.material.dispose();
});

test('live render cache mode borrows exact scene and camera with ordered visible lights and restores state before awaiting',async()=>{
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(),group=new THREE.Group();scene.add(group);
 const mesh=new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshBasicMaterial());group.add(mesh);
 const child=new THREE.Mesh(mesh.geometry,mesh.material);mesh.add(child);
 const first=new THREE.DirectionalLight(),nested=new THREE.PointLight(),hidden=new THREE.Group(),hiddenLight=new THREE.PointLight(),wrongLayer=new THREE.PointLight();
 group.add(first);first.add(nested);hidden.visible=false;hidden.add(hiddenLight);scene.add(hidden,wrongLayer);wrongLayer.layers.set(2);
 first.shadow.autoUpdate=true;first.shadow.needsUpdate=true;nested.shadow.autoUpdate=false;nested.shadow.needsUpdate=true;
 const originals=new Map([scene,mesh,child,first,nested].map(object=>[object,object.children]));
 const restored=()=>{
  for(const [object,children]of originals)assert.equal(object.children,children);
  assert.equal(first.shadow.autoUpdate,true);assert.equal(first.shadow.needsUpdate,true);
  assert.equal(nested.shadow.autoUpdate,false);assert.equal(nested.shadow.needsUpdate,true);
  assert.equal(mesh.parent,group);assert.equal(nested.parent,first);
 };
 const batches=[];let release,entered;
 const started=new Promise(resolve=>{entered=resolve;});
 const renderer={compileAsync(scope,view,target){
  assert.equal(scope,scene);assert.equal(view,camera);assert.equal(target,undefined);
  const found=[];scope.traverseVisible(object=>{if(object.isLight)found.push(object);});
  assert.deepEqual(found,[first,nested]);assert.equal(first.shadow.autoUpdate,false);assert.equal(first.shadow.needsUpdate,false);
  assert.equal(nested.shadow.autoUpdate,false);assert.equal(nested.shadow.needsUpdate,false);
  assert.ok(scope.children.filter(object=>object.isMesh).length<=1);
  batches.push(scope.children.filter(object=>object.isMesh));
  if(batches.length===1){entered();return new Promise(resolve=>{release=resolve;});}
  return Promise.resolve();
 }};
 const work=compileSelectedVisuals(renderer,scene,[group],camera,{reuseRenderScene:true,batchSize:1,yieldWork:async()=>{restored();}});
 await started;restored();release();await work;restored();
 assert.deepEqual(batches,[[mesh],[child]]);
 mesh.geometry.dispose();mesh.material.dispose();
});

test('live render cache mode restores the scene and shadow state after submission and backend failures',async()=>{
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(),mesh=new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshBasicMaterial()),light=new THREE.DirectionalLight();
 scene.add(mesh,light);light.shadow.autoUpdate=true;light.shadow.needsUpdate=true;
 const children=scene.children,meshChildren=mesh.children,lightChildren=light.children;
 for(const asynchronous of [false,true]){
  const renderer={compileAsync(){assert.equal(light.shadow.needsUpdate,false);if(asynchronous)return Promise.reject(Error('failed'));throw Error('failed');}};
  await assert.rejects(compileSelectedVisuals(renderer,scene,[mesh],camera,{reuseRenderScene:true,yieldWork:async()=>{}}),/failed/);
  assert.equal(scene.children,children);assert.equal(mesh.children,meshChildren);assert.equal(light.children,lightChildren);
  assert.equal(light.shadow.autoUpdate,true);assert.equal(light.shadow.needsUpdate,true);assert.equal(mesh.frustumCulled,true);
 }
 mesh.geometry.dispose();mesh.material.dispose();
});

test('live render cache mode rejects deferred renderer initialization before borrowing the scene',async()=>{
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(),mesh=new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshBasicMaterial());scene.add(mesh);
 const children=scene.children;let submitted=false;
 await assert.rejects(compileSelectedVisuals({hasInitialized:()=>false,async compileAsync(){submitted=true;await Promise.resolve();}},scene,[mesh],camera,{reuseRenderScene:true}),/Initialize the renderer/);
 assert.equal(submitted,false);assert.equal(scene.children,children);assert.equal(mesh.parent,scene);
 mesh.geometry.dispose();mesh.material.dispose();
});

test('visible preparation skips shadow-only leaves without hiding matching descendants',async()=>{
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(),source=new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshBasicMaterial()),proxy=new THREE.Mesh(source.geometry,source.material);
 proxy.layers.set(1);source.add(proxy);scene.add(source);const compiled=[];
 const renderer={compileAsync(scope){compiled.push(...scope.children.filter(object=>object.isMesh));return Promise.resolve();}};
 await compileSelectedVisuals(renderer,scene,[source],camera,{reuseRenderScene:true,yieldWork:async()=>{}});
 assert.deepEqual(compiled,[source]);assert.equal(proxy.parent,source);
 compiled.length=0;camera.layers.set(1);
 await compileSelectedVisuals(renderer,scene,[source],camera,{reuseRenderScene:true,yieldWork:async()=>{}});
 assert.deepEqual(compiled,[proxy]);assert.equal(proxy.parent,source);
 source.geometry.dispose();source.material.dispose();
});
