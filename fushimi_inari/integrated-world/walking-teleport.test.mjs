import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {installWalking} from './walking.mjs';
function fixture({sample=true,colliders=[],isWalkable,resolveMove,allowDebugCamera=false,interactables=[]}={}){
 const saved={document:globalThis.document,location:globalThis.location,addEventListener:globalThis.addEventListener},els=new Map(),events={};
 globalThis.document={createElement(){return {append(){},setAttribute(){},hidden:false};},querySelector(){return null;},body:{append(){},dataset:{},classList:{add(){},remove(){},contains(){return false;}}},getElementById(id){if(!els.has(id))els.set(id,{hidden:false,textContent:''});return els.get(id);}};
 globalThis.location={search:''};globalThis.addEventListener=(name,fn)=>events[name]=fn;
 const camera=new THREE.PerspectiveCamera();camera.position.set(20,30,40);const controls={enabled:true,target:new THREE.Vector3()};
 const assembly={legacy:{interactables},colliders,isWalkable,spatial:{main:[],returning:[]},surfaces:{segments:[],sample:()=>sample?{segment:{id:'way/105449722',kind:'stone'}}:null,height:()=>33.664626},walkHeight:()=>33.664626};
 const walker=installWalking({camera,controls,renderer:{domElement:{addEventListener(){}}},ground:()=>33.664626,assembly,audio:{step(){}},onStart(){},resolveMove,allowDebugCamera});
 return {camera,controls,walker,events,els,restore(){for(const [k,v]of Object.entries(saved)){if(v===undefined)delete globalThis[k];else globalThis[k]=v;}}};
}
test('E triggers a nearby action directly once and leaves the interaction menu hidden',()=>{
 const person=new THREE.Group();person.position.set(20,33.664626,38);let calls=0;
 person.userData.interactable={proximity:true,prompt:'Say hello',directAction:()=>{calls++;return 'Hello';}};person.updateMatrixWorld(true);
 const f=fixture({interactables:[person]});try{
  f.walker.start();f.camera.lookAt(20,f.camera.position.y,38);
  const event={code:'KeyE',target:{},preventDefault(){}};
  f.events.keydown(event);assert.equal(calls,1);assert.equal(f.els.get('interaction').hidden,true);
  f.events.keydown(event);assert.equal(calls,1);
  f.walker.pause(true);f.events.keydown(event);assert.equal(calls,1);
 }finally{f.restore();}
});
test('arrival teleport accepts mapped clear crossing and retains its exact requested center',()=>{
 const f=fixture();try{assert.equal(f.walker.teleport([-157.407,33.664626,10.342],[-138.295876,35.364626,10.764595]),true);assert.ok(Math.abs(f.camera.position.x+157.407)<1e-9);assert.ok(Math.abs(f.camera.position.z-10.342)<1e-9);assert.ok(Math.abs(f.camera.position.y-35.364626)<1e-9);assert.equal(f.walker.mode,'walk');assert.equal(f.controls.enabled,false);}finally{f.restore();}
});
test('teleport still rejects missing mapped surface without moving camera',()=>{
 const f=fixture({sample:false});try{assert.equal(f.walker.teleport([-157.407,0,10.342],[0,0,0]),false);assert.deepEqual(f.camera.position.toArray(),[20,30,40]);}finally{f.restore();}
});
test('teleport still rejects a crossing covered by a solid collision without bypassing it',()=>{
 const f=fixture({colliders:[{type:'box',args:[-157.407,10.342,5,5,0,30,40,'test_solid']}]});try{assert.equal(f.walker.teleport([-157.407,0,10.342],[0,0,0]),false);assert.deepEqual(f.camera.position.toArray(),[20,30,40]);}finally{f.restore();}
});
test('registered station paving can accept teleport without inventing a mapped path',()=>{
 const f=fixture({sample:false,isWalkable:(x,z)=>x>=-159&&x<=-155&&z>=8&&z<=12});
 try{assert.equal(f.walker.teleport([-157.407,0,10.342],[-150,35.364626,10.342]),true);assert.equal(f.camera.position.x,-157.407);assert.equal(f.walker.mode,'walk');}finally{f.restore();}
});
test('registered paving does not bypass the collider check',()=>{
 const f=fixture({sample:false,isWalkable:()=>true,colliders:[{type:'box',args:[-157.407,10.342,5,5,0,30,40,'station_wall']}]});
 try{assert.equal(f.walker.teleport([-157.407,0,10.342],[0,0,0]),false);assert.deepEqual(f.camera.position.toArray(),[20,30,40]);}finally{f.restore();}
});

test('manual substeps commit domain correction before updating position',()=>{
 let calls=0;const f=fixture({resolveMove:(from,to)=>{calls++;return [Math.min(to[0],20.05),to[1],to[2]];}});
 try{f.walker.start();f.events.keydown({code:'KeyD',target:{},preventDefault(){}});f.walker.update(.1);
 assert.ok(calls>1);assert.ok(f.camera.position.x<=20.05);assert.equal(f.camera.position.z,40);
 }finally{f.restore();}
});
test('domain rejects unsupported teleports and manual moves without moving position',()=>{
 const f=fixture({resolveMove:()=>null});try{
 assert.equal(f.walker.teleport([20,0,40],[0,0,0]),false);f.walker.start();
 f.events.keydown({code:'KeyW',target:{},preventDefault(){}});f.walker.update(.1);
 assert.equal(f.camera.position.x,20);assert.equal(f.camera.position.z,40);
 }finally{f.restore();}
});
test('public walking cannot enter flight or enable orbit controls',()=>{
 const f=fixture();try{f.walker.fly();assert.equal(f.walker.mode,'walk');f.walker.stop();assert.equal(f.controls.enabled,false);}finally{f.restore();}
});
