import test from 'node:test';
import assert from 'node:assert/strict';
import {Group,PerspectiveCamera,Mesh,BoxGeometry,MeshBasicMaterial} from 'three';
import {createProximityInteractions,interactionInputBlocked} from './proximity-interaction.mjs';

test('nearby visible people trigger directly, cooldown cannot stack, and distance is checked again',()=>{
 const camera=new PerspectiveCamera();camera.position.set(0,1.7,0);
 const person=new Group();person.position.z=-2;let calls=0,time=0;
 person.userData.interactable={proximity:true,directAction:()=>{calls++;return 'Hello';},cooldownMs:1800};
 person.updateMatrixWorld(true);const runtime=createProximityInteractions({targets:[person],camera,now:()=>time});
 assert.equal(runtime.find(),person);assert.equal(runtime.run().message,'Hello');
 assert.equal(runtime.run(),null);assert.equal(calls,1);
 time=1800;runtime.run();assert.equal(calls,2);
 camera.position.z=5;assert.equal(runtime.run(),null);
 camera.position.z=0;person.visible=false;assert.equal(runtime.find(),null);
 person.visible=true;person.position.z=2;person.updateMatrixWorld(true);assert.equal(runtime.find(),null);
});

test('shrine primary action works near the geometry and does not open any menu',()=>{
 const camera=new PerspectiveCamera();camera.position.set(0,1.7,0);let calls=0;
 const bell=new Mesh(new BoxGeometry(.3,.3,.3),new MeshBasicMaterial());bell.position.set(0,2,-1.8);
 bell.userData.interactable={actions:[{label:'Ring bell',run:()=>++calls}]};bell.updateMatrixWorld(true);
 const runtime=createProximityInteractions({targets:[bell],camera});
 assert.equal(runtime.find(),bell);runtime.run();assert.equal(calls,1);
});

test('cached static geometry avoids origin updates while moving people and empty groups stay live',()=>{
 const camera=new PerspectiveCamera();camera.position.set(0,1.7,0);
 let directionReads=0;const direction=camera.getWorldDirection;
 camera.getWorldDirection=function(target){directionReads++;return direction.call(this,target);};
 const bell=new Mesh(new BoxGeometry(.3,.3,.3),new MeshBasicMaterial());bell.position.set(0,1.7,-1.8);
 const empty=new Group();empty.position.set(0,1.7,-2.5);
 const person=new Group();person.position.set(0,.6,-2.4);
 for(const object of [bell,empty,person]){object.userData.interactable={directAction:()=> 'Hello'};object.updateMatrixWorld(true);}
 person.userData.interactable.proximity=true;
 const reads=new Map();
 for(const object of [bell,empty,person]){
  const original=object.getWorldPosition;reads.set(object,0);
  object.getWorldPosition=function(target){reads.set(this,reads.get(this)+1);return original.call(this,target);};
 }
 const runtime=createProximityInteractions({targets:[bell,empty,person],camera});
 assert.equal(runtime.find(),bell);assert.equal(runtime.find(),bell);
 assert.equal(reads.get(bell),0,'nonempty static bounds supply the point without reading the origin');
 assert.equal(reads.get(empty),2,'empty geometry still uses its current world origin');
 assert.equal(reads.get(person),2,'moving people retain a live world-position lookup');
 assert.equal(directionReads,2,'camera direction is shared across candidates per find');
 person.position.z=-1;assert.equal(runtime.find(),person,'unannounced person movement updates immediately');
 person.position.z=-10;empty.position.z=-1;
 assert.equal(runtime.find(),empty,'empty-group fallback also follows movement immediately');
});

test('attendants can be greeted across their reserved counter recess',()=>{
 const camera=new PerspectiveCamera();camera.position.set(-249.83,33.22,-100.06);camera.lookAt(-249.61,32.6,-103.05);
 const vendor=new Group();vendor.position.set(-249.61092193327073,31.530487575883743,-103.04687721203443);
 vendor.userData.interactable={proximity:true,reach:3.6,directAction:()=> 'Welcome'};vendor.updateMatrixWorld(true);
 const runtime=createProximityInteractions({targets:[vendor],camera});assert.equal(runtime.find(),vendor);assert.equal(runtime.run().message,'Welcome');
 camera.position.z=-98;assert.equal(runtime.find(),null);
});

test('inactive walking, menu, photo mode and focused controls block interaction input',()=>{
 const state={active:true,paused:false,flying:false,body:{classList:{contains:()=>false}},document:{querySelector:()=>null},target:{closest:()=>null}};
 assert.equal(interactionInputBlocked(state),false);
 for(const override of [{active:false},{paused:true},{flying:true},{body:{classList:{contains:()=>true}}},{document:{querySelector:()=>({})}},{target:{closest:()=>({})}}])assert.equal(interactionInputBlocked({...state,...override}),true);
});
