import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {installVendingPointerInput} from './vending-pointer-input.mjs';
import {installHeldPropInput} from './held-prop-input.mjs';
import {installPointerLook} from './pointer-look.mjs';

function channel(){
 const handlers=new Map();
 return {handlers,addEventListener(name,fn){if(!handlers.has(name))handlers.set(name,new Set());handlers.get(name).add(fn);},
  removeEventListener(name,fn){handlers.get(name)?.delete(fn);},
  fire(name,event={}){for(const fn of [...(handlers.get(name)??[])])fn(event);}};
}

function fixture(){
 const element=channel(),doc=channel(),view=channel(),captured=new Set();doc.defaultView=view;doc.pointerLockElement=null;
 element.getBoundingClientRect=()=>({left:10,top:20,width:400,height:200});
 element.setPointerCapture=id=>captured.add(id);element.hasPointerCapture=id=>captured.has(id);element.releasePointerCapture=id=>captured.delete(id);
 const camera=new THREE.PerspectiveCamera(60,2,.01,100),parent=new THREE.Group(),group=new THREE.Group();
 parent.add(group);group.position.z=-2;
 const machine={group,productButtons:[{productId:'tea',position:[0,0,0],width:.16,height:.09},{productId:'water',position:[.30,0,0],width:.16,height:.09}],collectionTarget:{position:[0,-.35,0],width:.35,height:.12}};
 let enabled=true,occluded=false,claims=0;const selected=[],collections=[],drags=[],occlusionCalls=[];
 const input=installVendingPointerInput({element,camera,machines:[machine],document:doc,enabled:()=>enabled,
  onSelect:(m,id)=>selected.push([m,id]),onCollect:m=>collections.push(m),onDrag:(x,y)=>drags.push([x,y]),onClaimUnlocked:()=>claims++,
  isOccluded:(origin,target,m)=>{occlusionCalls.push({origin:origin.clone(),target:target.clone(),machine:m});return occluded;}});
 function point(position){group.updateWorldMatrix(true,false);camera.updateWorldMatrix(true,false);const p=new THREE.Vector3(...position).applyMatrix4(group.matrixWorld).project(camera);return {clientX:10+(p.x+1)*200,clientY:20+(1-p.y)*100};}
 function fire(name,values={}){const event={button:0,isPrimary:true,pointerId:1,clientX:210,clientY:120,movementX:0,movementY:0,preventDefault(){this.prevented=true;},stopImmediatePropagation(){this.stopped=true;},...values};element.fire(name,event);return event;}
 const click=position=>{const p=point(position),down=fire('pointerdown',p);fire('pointerup',p);return down;};
 return {input,element,doc,view,camera,parent,group,machine,point,fire,click,selected,collections,drags,occlusionCalls,captured,
  enable:value=>enabled=value,occlude:value=>occluded=value,get claims(){return claims;}};
}

test('local rectangles pick the displayed product and tray on a rotated, scaled machine',()=>{
 const f=fixture();f.group.rotation.y=.38;f.group.scale.set(.8,1.25,.65);
 assert.equal(f.click(f.machine.productButtons[1].position).stopped,true);
 assert.deepEqual(f.selected.map(([,id])=>id),['water']);assert.equal(f.selected[0][0],f.machine);
 f.click(f.machine.collectionTarget.position);assert.deepEqual(f.collections,[f.machine]);assert.equal(f.claims,2);
 assert.ok(f.occlusionCalls.every(call=>call.machine===f.machine&&call.origin.distanceTo(call.target)<3.3));
 f.input.dispose();
});

test('distance, back face, hidden ancestors and occluders cannot claim a gesture',()=>{
 const f=fixture(),center=()=>f.point(f.machine.productButtons[0].position);
 f.group.position.z=-3.5;assert.equal(f.fire('pointerdown',center()).stopped,undefined);
 f.group.position.z=-2;f.group.rotation.y=Math.PI;assert.equal(f.fire('pointerdown',center()).stopped,undefined);
 f.group.rotation.y=0;f.parent.visible=false;assert.equal(f.fire('pointerdown',center()).stopped,undefined);
 f.parent.visible=true;f.occlude(true);assert.equal(f.fire('pointerdown',center()).stopped,undefined);
 assert.equal(f.selected.length,0);assert.equal(f.claims,0);
 f.occlude(false);f.click(f.machine.productButtons[0].position);assert.equal(f.selected.length,1);
 f.input.dispose();
});

test('center ray under pointer lock, drag threshold and release matching prevent accidental activation',()=>{
 const f=fixture();f.doc.pointerLockElement=f.element;
 f.fire('pointerdown',{clientX:2,clientY:3});f.fire('pointerup',{clientX:2,clientY:3});assert.equal(f.selected.length,1);assert.equal(f.claims,0);
 f.fire('pointerdown',{clientX:2,clientY:3});f.fire('pointermove',{movementX:5});f.fire('pointermove',{movementX:4});f.fire('pointerup',{clientX:2,clientY:3});
 assert.equal(f.selected.length,1);assert.deepEqual(f.drags,[],'locked look remains owned by the existing camera input');
 f.doc.pointerLockElement=null;const p=f.point(f.machine.productButtons[0].position);
 f.fire('pointerdown',p);f.fire('pointermove',{...p,clientX:p.clientX+3});f.fire('pointermove',{...p,clientX:p.clientX+12});f.fire('pointermove',{...p,clientX:p.clientX+15});f.fire('pointerup',{...p,clientX:p.clientX+15});
 assert.deepEqual(f.drags,[[12,0],[3,0]]);assert.equal(f.selected.length,1);
 const edge=f.point([.078,0,0]);f.fire('pointerdown',edge);f.fire('pointerup',{...edge,clientX:edge.clientX+3});assert.equal(f.selected.length,1,'release outside the original rectangle does not select');
 f.input.dispose();
});

test('cancel, lock change, blur, visibility and disabled state invalidate pending gestures',()=>{
 const f=fixture(),p=f.point(f.machine.productButtons[0].position);
 for(const type of ['pointercancel','lostpointercapture']){f.fire('pointerdown',p);f.fire(type,{...p,pointerId:1});f.fire('pointerup',p);}
 f.fire('pointerdown',p);f.view.fire('blur');f.fire('pointerup',p);
 f.fire('pointerdown',p);f.doc.fire('pointerlockchange');f.fire('pointerup',p);
 f.fire('pointerdown',p);f.enable(false);f.fire('pointerup',p);f.enable(true);
 f.fire('pointerdown',p);f.parent.visible=false;f.fire('pointerup',p);f.parent.visible=true;
 assert.equal(f.selected.length,0);
 f.fire('pointerdown',p);f.fire('pointerup',{...p,pointerId:2});assert.equal(f.selected.length,0);
 f.fire('pointerup',p);assert.equal(f.selected.length,1,'another pointer cannot complete or cancel the primary gesture');
 f.fire('pointerdown',p);f.input.dispose();f.fire('pointerup',p);assert.equal(f.selected.length,1);assert.equal(f.captured.size,0);
 for(const target of [f.element,f.doc,f.view])for(const entries of target.handlers.values())assert.equal(entries.size,0);
});

test('vending capture takes priority over a held drink and forwards a free drag to look once',()=>{
 const listeners=new Map(),captured=new Set(),element={
  addEventListener(name,fn,capture){if(!listeners.has(name))listeners.set(name,[]);listeners.get(name).push({fn,capture:!!capture});},
  removeEventListener(name,fn){listeners.set(name,(listeners.get(name)??[]).filter(item=>item.fn!==fn));},
  getBoundingClientRect:()=>({left:10,top:20,width:400,height:200}),
  setPointerCapture:id=>captured.add(id),hasPointerCapture:id=>captured.has(id),releasePointerCapture:id=>captured.delete(id)
 };
 const doc=channel();doc.defaultView=channel();doc.pointerLockElement=null;
 const camera=new THREE.PerspectiveCamera(60,2,.01,100),group=new THREE.Group(),held=new THREE.Group();group.position.z=-2;held.position.z=-1;
 held.add(new THREE.Mesh(new THREE.BoxGeometry(.2,.2,.2),new THREE.MeshBasicMaterial()));
 const machine={group,productButtons:[{productId:'water',position:[0,0,0],width:.16,height:.09}],collectionTarget:null};
 let look=0,sips=0,orders=0;const pointerLook=installPointerLook({element,document:doc,enabled:()=>true,look:dx=>look+=dx});
 const vending=installVendingPointerInput({element,camera,machines:[machine],document:doc,onSelect:()=>orders++,onDrag:dx=>look+=dx,onClaimUnlocked:()=>pointerLook.release()});
 const item={group:held,consume:()=>sips++};const heldInput=installHeldPropInput({element,camera,document:doc,getItem:()=>item,onDrag:dx=>look+=dx,onClaimUnlocked:()=>pointerLook.release()});
 function fire(name,x,more={}){
  const event={button:0,isPrimary:true,pointerId:1,pointerType:'mouse',clientX:x,clientY:120,movementX:0,movementY:0,preventDefault(){this.prevented=true;},stopImmediatePropagation(){this.stopped=true;},...more};
  for(const {fn} of [...(listeners.get(name)??[])].sort((a,b)=>Number(b.capture)-Number(a.capture))){fn(event);if(event.stopped)break;}return event;
 }
 fire('pointerdown',12);fire('pointerup',12);assert.equal(pointerLook.engaged,true);
 fire('pointerdown',210);assert.equal(pointerLook.engaged,false);fire('pointerup',210);assert.equal(orders,1);assert.equal(sips,0);
 fire('pointerdown',12);fire('pointerup',12);assert.equal(pointerLook.engaged,true);look=0;
 fire('pointerdown',210);fire('pointermove',214);fire('pointermove',222);fire('pointermove',225);fire('pointerup',225);
 assert.equal(look,15);assert.equal(orders,1);assert.equal(sips,0);fire('pointermove',226);assert.equal(look,15,'fallback remains released after the captured drag');
 doc.pointerLockElement=element;fire('pointerdown',25);fire('pointerup',25);assert.equal(orders,2);assert.equal(sips,0,'locked center still prioritizes a machine control');
 heldInput.dispose();vending.dispose();
});
