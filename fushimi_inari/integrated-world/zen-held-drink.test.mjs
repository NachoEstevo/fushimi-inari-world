import test from 'node:test';import assert from 'node:assert/strict';import {Scene,PerspectiveCamera} from 'three';import {createZenHeldDrink} from './zen-held-drink.mjs';
test('collected can can be sipped three times, pauses and cleans only owned geometry',()=>{
 const scene=new Scene(),camera=new PerspectiveCamera(),drink=createZenHeldDrink({scene,camera,document:null});
 assert.equal(drink.sip(),false);drink.collect({drink:'Green tea',color:'#81a85c'});assert.equal(drink.stats.sips,3);
 for(let i=0;i<3;i++){assert.equal(drink.sip(),true);assert.equal(drink.sip(),false);drink.update(2,{blocked:true});assert.equal(drink.stats.sipping,true);drink.update(2,{blocked:false});}assert.equal(drink.stats.sips,0);assert.equal(drink.sip(),false);
 drink.stow();assert.equal(drink.stats.visible,false);drink.dispose();assert.equal(scene.children.length,0);drink.dispose();
});
