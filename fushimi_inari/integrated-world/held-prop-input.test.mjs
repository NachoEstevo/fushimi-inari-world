import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {installHeldPropInput} from './held-prop-input.mjs';
import {installPointerLook} from './pointer-look.mjs';

function fixture(){
 const listeners=new Map(),element={addEventListener:(name,fn)=>listeners.set(name,fn),removeEventListener:name=>listeners.delete(name),getBoundingClientRect:()=>({left:0,top:0,width:200,height:200})};
 const camera=new THREE.PerspectiveCamera(60,1,.01,100),group=new THREE.Group();group.position.z=-1;group.add(new THREE.Mesh(new THREE.BoxGeometry(.2,.2,.2),new THREE.MeshBasicMaterial()));
 let bites=0,enabled=true,drag=0;const doc={pointerLockElement:null},item={group,consume:()=>{bites++;return true;}};
 const input=installHeldPropInput({element,camera,document:doc,getItem:()=>item,enabled:()=>enabled,onDrag:dx=>drag+=dx});
 const fire=(name,values={})=>{const event={button:0,isPrimary:true,pointerId:1,clientX:100,clientY:100,pointerType:'mouse',preventDefault(){this.prevented=true;},stopImmediatePropagation(){this.stopped=true;},...values};listeners.get(name)?.(event);return event;};
 return {input,fire,listeners,group,doc,element,blocked:v=>enabled=!v,get drag(){return drag;},get bites(){return bites;}};
}
test('clicking the held mesh consumes once while outside clicks, drags and secondary buttons keep camera input',()=>{
 const f=fixture();assert.equal(f.fire('pointerdown').stopped,true);f.fire('pointerup');assert.equal(f.bites,1);
 assert.equal(f.fire('pointerdown',{clientX:1}).stopped,undefined);f.fire('pointerup',{clientX:1});assert.equal(f.bites,1);
 f.fire('pointerdown');f.fire('pointermove',{clientX:125});f.fire('pointerup',{clientX:125});assert.equal(f.bites,1);assert.equal(f.drag,25);
 f.fire('pointerdown');f.fire('pointerup',{clientX:125});assert.equal(f.bites,1);
 f.fire('pointerdown',{button:2});f.fire('pointerup',{button:2});assert.equal(f.bites,1);f.input.dispose();assert.equal(f.listeners.size,0);
});
test('pointer lock consumes without aiming at the off-centre prop; modal, hidden prop and cancelled pointers cannot consume',()=>{
 const f=fixture();f.doc.pointerLockElement=f.element;f.fire('pointerdown',{clientX:1});f.fire('pointerup',{clientX:1});assert.equal(f.bites,1);
 f.fire('pointerdown');f.blocked(true);f.fire('pointerup');assert.equal(f.bites,1);f.blocked(false);
 f.group.visible=false;f.fire('pointerdown');f.fire('pointerup');assert.equal(f.bites,1);f.group.visible=true;
 f.fire('pointerdown');f.fire('pointercancel');f.fire('pointerup');assert.equal(f.bites,1);
 f.fire('pointerdown');f.fire('lostpointercapture');f.fire('pointerup');assert.equal(f.bites,1);f.input.dispose();
});

test('a held drag releases an armed pointer-look fallback without replaying its motion',()=>{
 const listeners=new Map(),element={
  addEventListener(name,fn,capture){if(!listeners.has(name))listeners.set(name,[]);listeners.get(name).push({fn,capture});},
  removeEventListener(name,fn){listeners.set(name,(listeners.get(name)??[]).filter(entry=>entry.fn!==fn));},
  getBoundingClientRect:()=>({left:0,top:0,width:200,height:200}),setPointerCapture(){}
 };
 const doc={pointerLockElement:null,addEventListener(){}};
 const camera=new THREE.PerspectiveCamera(60,1,.01,100),group=new THREE.Group();group.position.z=-1;
 group.add(new THREE.Mesh(new THREE.BoxGeometry(.2,.2,.2),new THREE.MeshBasicMaterial()));
 let cameraDx=0,consumed=0;
 const pointerLook=installPointerLook({element,document:doc,enabled:()=>true,look:dx=>cameraDx+=dx});
 const item={group,consume:()=>consumed++};
 const input=installHeldPropInput({element,camera,document:doc,getItem:()=>item,onDrag:dx=>cameraDx+=dx,onClaimUnlocked:()=>pointerLook.release()});
 function fire(name,x){
  const event={button:0,isPrimary:true,pointerId:1,clientX:x,clientY:100,pointerType:'mouse',preventDefault(){},stopImmediatePropagation(){this.stopped=true;}};
  for(const {fn}of [...listeners.get(name)].sort((a,b)=>Number(!!b.capture)-Number(!!a.capture))){fn(event);if(event.stopped)break;}
 }
 fire('pointerdown',1);fire('pointerup',1);fire('pointermove',100);cameraDx=0;
 assert.equal(pointerLook.engaged,true);
 fire('pointerdown',100);assert.equal(pointerLook.engaged,false);
 fire('pointermove',125);fire('pointerup',125);assert.equal(cameraDx,25);assert.equal(consumed,0);
 fire('pointermove',126);assert.equal(cameraDx,25,'the fallback must not replay the captured drag');
 fire('pointerdown',1);fire('pointermove',2);assert.equal(cameraDx,26,'a normal world click can arm look again');
 input.dispose();
});
