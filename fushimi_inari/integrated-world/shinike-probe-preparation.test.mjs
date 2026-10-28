import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {prepareShinikeForWalking} from './shinike-probe-preparation.mjs';

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
