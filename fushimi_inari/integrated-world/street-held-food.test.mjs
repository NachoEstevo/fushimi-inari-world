import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createStreetHeldFood} from './street-held-food.mjs';

test('replacing a snack during a bite restores Eat; blocked views pause consumption and disposal borrows GPU resources',()=>{
 const nodes=[],listeners=new Map(),doc={body:{append(){}},defaultView:{addEventListener:(t,f)=>listeners.set(t,f),removeEventListener:t=>listeners.delete(t)},createElement(tag){const n={tag,hidden:false,disabled:false,append(){},remove(){},blur(){}};nodes.push(n);return n;}};
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(),geometry=new THREE.BoxGeometry(.1,.1,.1),material=new THREE.MeshStandardMaterial();let disposed=0;
 geometry.addEventListener('dispose',()=>disposed++);material.addEventListener('dispose',()=>disposed++);
 const commerce={createServing(){const group=new THREE.Group();group.add(new THREE.Mesh(geometry,material));return group;}};
 const food=createStreetHeldFood({scene,camera,commerce,document:doc}),eat=nodes.find(n=>n.textContent==='Eat');
 assert.equal(food.collect({kind:'soft-serve',itemId:'tofu'}),true);assert.equal(food.eat(),true);assert.equal(eat.disabled,true);
 food.update(.1);assert.equal(food.collect({kind:'senbei',itemId:'fox-senbei'}),true);assert.equal(eat.disabled,false);assert.equal(food.stats.eating,false);
 assert.equal(food.eat(),true);for(let i=0;i<20;i++)food.update(.1,{blocked:true});assert.equal(food.stats.bites,2);assert.equal(food.group.visible,false);
 for(let i=0;i<12;i++)food.update(.1);assert.equal(food.stats.bites,1);assert.equal(eat.disabled,false);
 food.eat();for(let i=0;i<12;i++)food.update(.1);assert.equal(food.stats.carrying,false);assert.equal(food.group.visible,false);
 food.dispose();food.dispose();assert.equal(scene.children.length,0);assert.equal(listeners.size,0);assert.equal(disposed,0);geometry.dispose();material.dispose();
});
