import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {LIGHT_PRESETS,installRouteLighting} from './route-lighting-nodes.mjs';
import {SKY_SUN_DIRECTIONS} from './sky-nodes.mjs';

test('golden lighting is warm red-orange without adding energy or disconnecting the visible sun',()=>{
 const gold=LIGHT_PRESETS.gold,red=gold.color>>16&255,green=gold.color>>8&255,blue=gold.color&255;
 assert.ok(green/red<.6&&blue/red<.5,'golden direct light must lean red-orange');
 assert.equal(gold.sun,2.5);assert.equal(gold.exposure,1.04);
 assert.deepEqual(gold.offset,SKY_SUN_DIRECTIONS.gold);
 const elevation=Math.atan2(gold.offset[1],Math.hypot(gold.offset[0],gold.offset[2]))*180/Math.PI;
 assert.ok(elevation>=3&&elevation<=4);
});

test('warmth changes retain three nearby shadow-free route lights and fixed marker geometry',()=>{
 const scene=new THREE.Scene(),route=Array.from({length:101},(_,i)=>[i,0,0]),lighting=installRouteLighting(scene,route,()=>0),camera=new THREE.PerspectiveCamera();
 const lights=scene.children.filter(object=>object.isPointLight),group=scene.getObjectByName('Interpretive trail light markers'),matrices=group.children.filter(object=>object.instanceMatrix).map(object=>object.instanceMatrix.array.slice());
 for(const mode of ['gold','night','day']){
  lighting.setMode(mode);camera.position.set(28,1.7,0);lighting.update(camera,1);
  assert.equal(lights.length,3);assert.ok(lights.every(light=>!light.castShadow));assert.equal(lighting.stats.shadows,0);
  group.children.filter(object=>object.instanceMatrix).forEach((object,i)=>assert.deepEqual(object.instanceMatrix.array,matrices[i]));
 }
});
