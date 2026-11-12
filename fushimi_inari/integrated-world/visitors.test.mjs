import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {installVisitors} from './visitors.mjs';

test('precinct visitors track a nearby person, freeze with menus, and stop animating at distance',async()=>{
 const previousDocument=globalThis.document,previousLoad=GLTFLoader.prototype.loadAsync;
 globalThis.document={body:{dataset:{}}};
 GLTFLoader.prototype.loadAsync=async path=>{
  const b=fs.readFileSync(new URL(path,import.meta.url));
  return new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');
 };
 const assembly={root:new THREE.Group(),legacy:{interactables:[]},colliders:[],walkHeight:()=>0,
  surfaces:{segments:[{id:'path',a:[0,0,0],b:[7,0,0],distance:0,width:4,kind:'path'}]},spatial:{byId:{reception:{target:[0,0,0]}}}};
 let visitors;
 try{
  visitors=installVisitors(assembly);await visitors.ready;assert.equal(visitors.count,1);
  const p=visitors.people[0],camera={position:new THREE.Vector3(p.state.x+2,1.55,p.state.z+3)};p.state.pause=100;
  visitors.update(camera,0);const firstMixerTime=p.mixer.time;visitors.update(camera,1/60);
  assert.ok(p.mixer.time>firstMixerTime,'nearby visitors keep the original full frame-rate motion');
  for(let i=1;i<=20;i++)visitors.update(camera,i*.05);
  assert.ok(p.gaze>.25&&p.gaze<=.32);assert.equal(p.root.visible,true);
  p.interaction.data.directAction();visitors.update(camera,1.05);
  const progress=p.interaction.progress(),mixer=p.mixer.time,position=p.root.position.clone(),head=p.bones.Head.bone.quaternion.clone();
  visitors.update(camera,90,{blocked:true});visitors.update(camera,91,{blocked:true});
  assert.equal(p.interaction.progress(),progress);assert.equal(p.mixer.time,mixer);assert.ok(p.root.position.equals(position));assert.ok(p.bones.Head.bone.quaternion.angleTo(head)<1e-7);
  visitors.update(camera,92);assert.ok(p.interaction.progress()!==null);
  camera.position.set(p.state.x,100,p.state.z);visitors.update(camera,92.05);assert.equal(p.root.visible,false,'high aerial cameras do not animate people below');
  camera.position.set(300,1.55,300);visitors.update(camera,92.1);const before=p.mixer.time;visitors.update(camera,120);
  assert.equal(p.root.visible,false);assert.equal(p.mixer.time,before);
 }finally{visitors?.dispose();GLTFLoader.prototype.loadAsync=previousLoad;globalThis.document=previousDocument;}
});

test('an incomplete visitor rig fails closed instead of crashing the frame loop',async()=>{
 const previousDocument=globalThis.document,previousLoad=GLTFLoader.prototype.loadAsync,previousWarn=console.warn,warnings=[];
 globalThis.document={body:{dataset:{}}};console.warn=(...args)=>warnings.push(args);
 GLTFLoader.prototype.loadAsync=async path=>{
  const b=fs.readFileSync(new URL(path,import.meta.url));const asset=await new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');
  asset.scene.getObjectByName('Torso').name='MissingTorso';return asset;
 };
 const assembly={root:new THREE.Group(),legacy:{interactables:[]},colliders:[],walkHeight:()=>0,
  surfaces:{segments:[{id:'path',a:[0,0,0],b:[7,0,0],distance:0,width:4,kind:'path'}]},spatial:{byId:{reception:{target:[0,0,0]}}}};
 let visitors;
 try{
  visitors=installVisitors(assembly);await visitors.ready;assert.ok(warnings.length);
  const camera={position:new THREE.Vector3(1,1.7,2)};visitors.update(camera,0);
  assert.doesNotThrow(()=>visitors.update(camera,.05));assert.equal(visitors.people[0].root.visible,false);
 }finally{visitors?.dispose();console.warn=previousWarn;GLTFLoader.prototype.loadAsync=previousLoad;globalThis.document=previousDocument;}
});
