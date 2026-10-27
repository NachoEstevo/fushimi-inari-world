import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from 'three';
import * as routeLighting from './route-lighting-nodes.mjs';
import {makeSpatial} from './spatial.mjs';
import {heightAt} from '../geography/geo-core.mjs';

const reference=(emitters,position)=>emitters.map((p,index)=>({index,d:(p[0]-position.x)**2+(p[1]-position.y)**2+(p[2]-position.z)**2})).sort((a,b)=>a.d-b.d).slice(0,3);
function compare(emitters,positions){
 assert.equal(typeof routeLighting.selectNearestRouteEmitters,'function');
 const nearest=new Int32Array(3),distances=new Float64Array(3),indexStorage=nearest.buffer,distanceStorage=distances.buffer;
 for(const position of positions){
  assert.equal(routeLighting.selectNearestRouteEmitters(emitters,position,nearest,distances)===nearest,true);
  const expected=reference(emitters,position);
  assert.deepEqual(Array.from(nearest),Array.from({length:3},(_,i)=>expected[i]?.index??-1));
  assert.deepEqual(Array.from(distances),Array.from({length:3},(_,i)=>expected[i]?.d??Infinity));
  assert.equal(nearest.buffer===indexStorage,true);assert.equal(distances.buffer===distanceStorage,true);
 }
}

test('nearest route lights retain stable ties, empty slots and caller-owned storage',()=>{
 const position=new THREE.Vector3();
 for(const emitters of [[],[[1,0,0]],[[1,0,0],[-1,0,0]],[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1]],[[2,0,0],[1,0,0],[-1,0,0],[1,0,0]]])compare(emitters,[position,new THREE.Vector3(100,20,-50),position]);
});

test('nearest route lights match the former full sort over mapped routes and many camera positions',()=>{
 const read=name=>JSON.parse(readFileSync(new URL(`../geography/${name}.json`,import.meta.url),'utf8'));
 const terrain=read('terrain'),features=read('features'),spec=JSON.parse(readFileSync(new URL('./anchors.json',import.meta.url),'utf8')),spatial=makeSpatial(terrain,features,spec);
 const positions=routeLighting.routeLightPositions(spatial.main,(x,z)=>heightAt(terrain,x,z));
 const emitters=positions.map(([x,y,z])=>[x,y+.9,z]);
 assert.ok(emitters.length>50,'fixture must cover the actual mapped walking route');
 let seed=34961;const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
 const cameras=Array.from({length:500},()=>new THREE.Vector3(random()*1600-400,random()*300,random()*1400-700));
 for(let i=0;i<spatial.main.length;i+=40)cameras.push(new THREE.Vector3(...spatial.main[i]));
 compare(emitters,cameras);
 const dense=Array.from({length:1000},()=>[random()*100-50,random()*20,random()*100-50]);
 compare(dense,cameras);
});

test('installed lights preserve exact assignments, intensity, cadence and fixed registrations',()=>{
 for(const count of [0,1,2,8]){
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(),emitters=Array.from({length:count},(_,i)=>[i*3-6,1,2]);
  const lighting=routeLighting.installRouteLighting(scene,[],()=>0,{extraEmitters:emitters});
  const lights=scene.children.filter(object=>object.isPointLight),identities=lights.slice();assert.equal(lights.length,3);
  for(const mode of ['gold','night','day','gold']){
   lighting.setMode(mode);camera.position.set(0,1.7,0);lighting.update(camera,0);
   const expected=reference(emitters,camera.position),power=routeLighting.LIGHT_PRESETS[mode].power;
   for(let i=0;i<3;i++){
    const entry=expected[i];assert.equal(lights[i].intensity,entry?power*Math.max(0,Math.min(1,(625-entry.d)/225)):0);
    if(entry&&power)assert.deepEqual(lights[i].position.toArray(),emitters[entry.index]);
   }
   if(!power)continue;
   const previous=lights.map(light=>[light.intensity,...light.position.toArray()]);
   camera.position.x=30;lighting.update(camera,.1);lighting.update(camera,.1);
   assert.deepEqual(lights.map(light=>[light.intensity,...light.position.toArray()]),previous);
   lighting.update(camera,.05);
   const updated=reference(emitters,camera.position);
   for(let i=0;i<3;i++){
    assert.equal(lights[i].intensity,updated[i]?power*Math.max(0,Math.min(1,(625-updated[i].d)/225)):0);
    if(updated[i])assert.deepEqual(lights[i].position.toArray(),emitters[updated[i].index]);
   }
  }
  const registered=scene.children.filter(object=>object.isPointLight);
  assert.equal(registered.length,3);assert.ok(registered.every((light,i)=>light===identities[i]));assert.ok(lights.every(light=>!light.castShadow));
 }
});
