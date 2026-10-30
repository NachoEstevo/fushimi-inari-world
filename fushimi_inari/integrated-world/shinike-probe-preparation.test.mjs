import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {prepareShinikeForWalking} from './shinike-probe-preparation.mjs';
import {installShinikeReflections} from './webgpu-shinike-reflections.mjs';

function fixture(failure){
 const camera=new THREE.PerspectiveCamera();camera.position.set(10,20,30);camera.lookAt(50,5,90);camera.updateMatrixWorld(true);
 const pose={position:camera.position.clone(),quaternion:camera.quaternion.clone()},water={},scene={},quality={detailScale:1.25},events=[];
 const pondPosition=new THREE.Vector3(500,60,-100),residency={near:'station',texture:'placeholder'},error=Error('preparation failed');
 const step=name=>{events.push(name);if(failure===name)throw error;};
 const args={camera,water,scene,quality,now:()=>1000,
  textureStreaming:{async prepareAt(position){assert.deepEqual(position,pondPosition);step('textures');residency.texture='ready';}},
  detailChunks:{update(view,time,scale,force){assert.notEqual(view,camera);assert.deepEqual(view.position,pondPosition);assert.equal(time,1);assert.equal(scale,1.25);assert.equal(force,true);residency.near='pond';step('admit');}},
  getAppearanceKey:()=>residency.texture,probe:{get position(){return pondPosition.clone();},async prepare({settle,appearanceKey}){assert.equal(appearanceKey,'ready');assert.equal(residency.near,'pond');step('capture');await settle();return {prepared:true,captures:2,error:null};}},
  async compile(q,s,roots,view,options){assert.equal(q,quality);assert.equal(s,scene);assert.deepEqual(roots,[water]);assert.equal(view,camera);assert.equal(options.includeHiddenRoots,true);step('receiver');},
  async settle(){step('settle');},restoreView(){residency.near='station';events.push('restore');}};
 const restored=()=>{assert.equal(residency.near,'station');assert.deepEqual(camera.position,pose.position);assert.ok(camera.quaternion.equals(pose.quaternion));assert.equal(events.at(-1),'restore');};
 return {args,events,error,restored};
}

test('welcome prepares complete pond scenery and the reflected receiver while preserving the player camera',async()=>{
 const f=fixture(),result=await prepareShinikeForWalking(f.args);
 assert.equal(result.prepared,true);assert.equal(result.captures,2);
 assert.deepEqual(f.events,['textures','admit','capture','settle','receiver','settle','restore']);f.restored();
});

test('every failed pond preparation stage restores walking residency and propagates its original error',async()=>{
 for(const stage of ['textures','admit','capture','receiver','settle']){
  const f=fixture(stage);await assert.rejects(prepareShinikeForWalking(f.args),error=>error===f.error);f.restored();
 }
});

test('missing probes skip preparation; a partial capture still prepares its retained valid receiver',async()=>{
 const missing=fixture();missing.args.probe={position:null};
 assert.equal((await prepareShinikeForWalking(missing.args)).prepared,false);assert.deepEqual(missing.events,[]);
 for(const captures of [0,1]){
  const f=fixture();f.args.probe.prepare=async()=>({prepared:false,captures,error:'capture failed'});
  const result=await prepareShinikeForWalking(f.args);assert.equal(result.error,'capture failed');assert.equal(f.events.includes('receiver'),captures>0);f.restored();
 }
});

test('station startup warms both pond targets without fetching distant images or caching a placeholder appearance',async()=>{
 const f=fixture();let keyRequested=false;
 f.args.waitForTextures=false;
 f.args.textureStreaming.prepareAt=async()=>{throw Error('Distant pond images must not block station entry');};
 f.args.getAppearanceKey=()=>{keyRequested=true;return 'placeholder';};
 f.args.probe.prepare=async({settle,appearanceKey})=>{assert.equal(appearanceKey,undefined);f.events.push('capture');await settle();return {prepared:true,captures:2,error:null};};
 const result=await prepareShinikeForWalking(f.args);
 assert.equal(result.prepared,true);assert.equal(result.captures,2);assert.equal(keyRequested,false);
 assert.deepEqual(f.events,['admit','capture','settle','receiver','settle','restore']);f.restored();
});

test('unkeyed station warmup refreshes the real retained pond after nearby image residency changes',async()=>{
 const camera=new THREE.PerspectiveCamera();camera.position.set(10,20,30);camera.lookAt(50,5,90);
 const originalPosition=camera.position.clone(),originalQuaternion=camera.quaternion.clone();
 const water=new THREE.Mesh(new THREE.PlaneGeometry(5,5),new THREE.MeshStandardMaterial());water.material.userData.waterAppearance={kind:'shinike'};
 const targets=Array.from({length:2},()=>{const target=new THREE.CubeRenderTarget(256);target.texture.isPMREMTexture=true;return target;});
 let time=0,textureRevision='placeholder',keyReads=0,residency='station',settles=0,compiled=0;
 const capturedImages=[],appearanceKey=()=>{keyReads++;return `day:${textureRevision}`;};
 const probe=installShinikeReflections({water,now:()=>time},()=>{
  capturedImages.push(textureRevision);return {texture:targets[(capturedImages.length-1)%2].texture,dispose(){}};
 });
 try{
  const result=await prepareShinikeForWalking({probe,water,camera,scene:{},quality:{detailScale:1.25},waitForTextures:false,
   textureStreaming:{async prepareAt(){throw Error('station warmup requested distant images');}},
   detailChunks:{update(view){assert.notEqual(view,camera);assert.deepEqual(view.position,probe.position);residency='pond';}},
   getAppearanceKey:appearanceKey,settle:async()=>{settles++;},restoreView(){residency='station';},
   async compile(quality,scene,roots,view){
    compiled++;assert.deepEqual(roots,[water]);assert.equal(view,camera);assert.equal(residency,'pond');assert.equal(water.material.envMap,targets[1].texture);
   }});
  assert.deepEqual(result,{prepared:true,captures:2,error:null});assert.equal(keyReads,0);
  assert.deepEqual(capturedImages,['placeholder','placeholder']);assert.equal(compiled,1);assert.equal(settles,3);
  assert.equal(residency,'station');assert.deepEqual(camera.position,originalPosition);assert.ok(camera.quaternion.equals(originalQuaternion));
  const warmedMaterialVersion=water.material.version;
  // Normal walking makes the local images resident before the stable arrival
  // update; the real probe must replace its warmed image using the same cubes.
  textureRevision='resident';const position=probe.position;
  probe.update(position,appearanceKey());time=999;probe.update(position,appearanceKey());assert.equal(capturedImages.length,2);
  time=1000;probe.update(position,appearanceKey());assert.deepEqual(capturedImages,['placeholder','placeholder','resident']);
  assert.equal(water.material.envMap,targets[0].texture);assert.equal(probe.stats.captures,3);
  if(THREE.REVISION==='187')assert.equal(water.material.version,warmedMaterialVersion,'equivalent retained cube outputs reuse the warmed receiver graph');
  time=3000;probe.update(position,appearanceKey());assert.equal(capturedImages.length,3,'the settled resident appearance is not recaptured');
 }finally{probe.dispose();for(const target of targets)target.dispose();water.geometry.dispose();water.material.dispose();}
});
