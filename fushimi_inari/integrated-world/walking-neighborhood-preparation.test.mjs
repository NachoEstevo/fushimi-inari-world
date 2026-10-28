import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {prepareWalkingNeighborhood} from './walking-neighborhood-preparation.mjs';
import {createWalkingPrewarm} from './walking-prewarm.mjs';

const gate=()=>{let resolve;const promise=new Promise(yes=>resolve=yes);return {promise,resolve};};
const tick=()=>new Promise(resolve=>setImmediate(resolve));
function fixture(){
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera();camera.position.set(10,2,5);
 const position=new THREE.Vector3(0,2,0),marks=[],compiled=[],reports=[],events=[];let generation=0;
 const mesh=name=>{const value=new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshBasicMaterial());value.name=name;return value;};
 const group=new THREE.Group();group.name='nearby detail group';group.visible=false;group.add(mesh('nearby detail'));
 const lod=new THREE.LOD();lod.name='nearby forest LOD';lod.visible=false;lod.addLevel(mesh('near level'),0);lod.addLevel(mesh('far level'),100);lod.levels[1].object.visible=false;
 const distant=new THREE.Group();distant.add(mesh('distant detail'));distant.position.x=1000;
 const light=new THREE.DirectionalLight();scene.add(group,lod,distant,light);scene.updateMatrixWorld(true);
 const entries=new Map([[group,new THREE.Box3(new THREE.Vector3(-1,0,-1),new THREE.Vector3(1,3,1))],
  [lod,new THREE.Sphere(new THREE.Vector3(4,2,0),1)],[distant,new THREE.Sphere(new THREE.Vector3(1000,2,0),10)]]);
 const service={get stats(){return {generation};},markPrepared(object){events.push('mark');marks.push(object);}};
 const options={scene,camera,position,entries,service,radius:30,
  textureStreaming:{async prepareAt(point){events.push('textures');assert.notEqual(point,position);return {textures:3,failed:0};}},
  quality:{async compileAsync(scope,view){events.push('compile');assert.equal(view,camera,'the real render camera is retained');compiled.push(...scope.children.filter(o=>o.isMesh));}},
  yieldWork:async()=>{},getLights:async()=>[light],report:value=>reports.push(value)};
 return {scene,camera,position,group,lod,distant,light,entries,marks,compiled,reports,events,options,setGeneration:value=>generation=value,mesh};
}

test('only nearby registered owners warm; hidden Group and every LOD level mark by complete owner identity',async()=>{
 const f=fixture(),originalChildren=[...f.scene.children],originalCamera=f.camera.position.clone(),parents=new Map(),visualState=new Map();
 f.scene.traverse(object=>{parents.set(object,object.parent);visualState.set(object,{visible:object.visible,culled:object.frustumCulled,position:object.position.clone()});});
 f.entries.set(new THREE.Group(),new THREE.Sphere(new THREE.Vector3(),-1));f.entries.set(new THREE.Group(),null);
 const empty=new THREE.LOD();f.entries.set(empty,new THREE.Sphere(new THREE.Vector3(),1));
 // Selection uses supplied world bounds and known owner hierarchies, not a
 // full-scene scan or an opportunistic change in render visibility.
 f.scene.traverse=()=>{throw Error('No scene traversal during neighborhood preparation');};
 const result=await prepareWalkingNeighborhood(f.options);
 assert.equal(result.phase,'ready');assert.equal(result.inspected,6);assert.equal(result.owners,2);assert.equal(result.roots,3);assert.equal(result.leaves,3);assert.equal(result.prepared,2);assert.equal(result.textures,3);
 assert.deepEqual(f.marks,[f.group,f.lod]);assert.deepEqual(new Set(f.compiled),new Set([f.group.children[0],...f.lod.levels.map(level=>level.object)]));
 assert.equal(f.events[0],'textures');assert.ok(f.events.indexOf('compile')<f.events.indexOf('mark'));
 assert.deepEqual(f.scene.children,originalChildren);assert.deepEqual(f.camera.position,originalCamera);
 for(const [object,parent]of parents){const original=visualState.get(object);assert.equal(object.parent,parent);assert.equal(object.visible,original.visible);assert.equal(object.frustumCulled,original.culled);assert.deepEqual(object.position,original.position);}
 assert.equal(f.light.shadow.autoUpdate,true);assert.equal(f.light.shadow.needsUpdate,false);
});

test('texture readiness is awaited and later movement cannot change the snapshotted neighborhood centre',async()=>{
 const f=fixture(),images=gate();f.options.textureStreaming.prepareAt=()=>images.promise;
 const work=prepareWalkingNeighborhood(f.options);await tick();assert.equal(f.compiled.length,0);assert.equal(f.marks.length,0);
 f.position.x=1000;images.resolve({textures:2,failed:1});const result=await work;
 assert.deepEqual(f.marks,[f.group,f.lod]);assert.equal(result.textureFailures,1);assert.equal(f.camera.position.x,10);
});

test('a registered Group prepares nested dormant LOD levels without exposing unrelated hidden descendants',async()=>{
 const f=fixture(),hidden=f.mesh('intentionally hidden prop');hidden.visible=false;
 f.group.add(f.lod,hidden);f.options.entries=new Map([[f.group,f.entries.get(f.group)]]);f.lod.visible=true;
 const result=await prepareWalkingNeighborhood(f.options);
 assert.equal(result.prepared,1);assert.deepEqual(f.marks,[f.group]);assert.ok(f.compiled.includes(f.lod.levels[1].object));assert.ok(!f.compiled.includes(hidden));
 assert.equal(f.group.visible,false);assert.equal(f.lod.levels[1].object.visible,false);assert.equal(hidden.visible,false);assert.equal(f.lod.parent,f.group);
});

test('all batches finish before owners are marked, and a failed batch cannot produce a ready owner',async()=>{
 for(const fail of [false,true]){
  const f=fixture(),last=gate();f.entries=new Map();f.group.clear();
  for(let i=0;i<6;i++)f.group.add(f.mesh(`detail ${i}`));f.entries.set(f.group,new THREE.Sphere(new THREE.Vector3(),2));f.options.entries=f.entries;
  let batches=0;f.options.quality.compileAsync=async()=>{if(++batches===2){await last.promise;if(fail)throw Error('GPU preparation failed');}};
  const work=prepareWalkingNeighborhood(f.options);await tick();assert.equal(batches,2);assert.equal(f.marks.length,0);last.resolve();
  if(fail){await assert.rejects(work,/GPU preparation failed/);assert.equal(f.marks.length,0);assert.equal(f.reports.at(-1).phase,'failed');}
  else{const result=await work;assert.equal(result.phase,'ready');assert.equal(result.leaves,6);assert.deepEqual(f.marks,[f.group]);}
 }
});

test('generation changes during images, yielding or compilation prevent false readiness marks',async()=>{
 for(const stage of ['textures','yield','compile']){
  const f=fixture();
  if(stage==='textures')f.options.textureStreaming.prepareAt=async()=>{f.setGeneration(1);return {textures:1,failed:0};};
  if(stage==='yield')f.options.yieldWork=async()=>f.setGeneration(1);
  if(stage==='compile')f.options.quality.compileAsync=async()=>f.setGeneration(1);
  const result=await prepareWalkingNeighborhood(f.options);assert.equal(result.phase,'superseded');assert.equal(result.prepared,0);assert.equal(f.marks.length,0);
  assert.equal(f.scene.children.includes(f.group),true);assert.equal(f.group.visible,false);assert.equal(f.lod.levels[1].object.visible,false);
 }
});

test('external cancellation and image failure never mark or compile owners',async()=>{
 const cancelled=fixture();cancelled.options.isCurrent=()=>false;
 assert.equal((await prepareWalkingNeighborhood(cancelled.options)).phase,'superseded');assert.equal(cancelled.events.length,0);assert.equal(cancelled.marks.length,0);
 const failed=fixture();failed.options.textureStreaming.prepareAt=async()=>{throw Error('Image timeout');};
 await assert.rejects(prepareWalkingNeighborhood(failed.options),/Image timeout/);assert.equal(failed.compiled.length,0);assert.equal(failed.marks.length,0);assert.equal(failed.reports.at(-1).phase,'failed');
});

test('the real walking service admits complete Group and LOD owners without compiling them again on handoff',async()=>{
 const f=fixture(),scheduled=[],service=createWalkingPrewarm({entries:[...f.entries].map(([object,bounds])=>({object,bounds})),radius:30,
  compile:async()=>{throw Error('Prepared owners must not compile again');},schedule:work=>scheduled.push(work)});
 const result=await prepareWalkingNeighborhood({...f.options,service});assert.equal(result.prepared,2);assert.equal(service.stats.prepared,2);
 service.update(f.position,0);assert.equal(scheduled.length,0);assert.equal(service.stats.queued,0);service.dispose();
});

test('the finite neighborhood budget rejects a world-wide radius and invalid transforms before doing work',async()=>{
 for(const radius of [0,-1,301,Infinity,NaN]){const f=fixture();await assert.rejects(prepareWalkingNeighborhood({...f.options,radius}),RangeError);assert.equal(f.events.length,0);}
 const f=fixture();await assert.rejects(prepareWalkingNeighborhood({...f.options,position:new THREE.Vector3(NaN,0,0)}),TypeError);assert.equal(f.events.length,0);
});
