import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {installCityPanorama,CITY_PANORAMA_MAX_TRIANGLES} from './city-panorama.mjs';

test('panorama skips missing terrain and keeps fallback heights above the real footprint',()=>{
 const previous=globalThis.document;
 globalThis.document={createElement:()=>({getContext:()=>({fillRect(){}})}),body:{dataset:{}}};
 const building=(id,x,tags)=>({id,tags,points:[[x,0,-270],[x+2,0,-270],[x+2,0,-268],[x,0,-270]]});
 const valid=building('valid',440,{height:'-2','building:levels':'0'}),missing=building('missing',420);
 const scene=new THREE.Scene();
 try{
  const panorama=installCityPanorama(scene,{buildings:[missing,valid]},x=>x<430?NaN:40,()=>false);
  panorama.update({position:new THREE.Vector3(730,140,-270)},true);
  const report=JSON.parse(document.body.dataset.panoramaDetail);
  assert.equal(report.buildings,1);assert.equal(report.triangles,7);assert.ok(report.triangles<=CITY_PANORAMA_MAX_TRIANGLES);
  let maxY=-Infinity,roofVertices=0;
  scene.traverse(object=>{if(!object.isMesh)return;
   const position=object.geometry.getAttribute('position');
   assert.ok(Array.from(position.array).every(Number.isFinite));
   for(let i=0;i<position.count;i++)maxY=Math.max(maxY,position.getY(i));
   for(let i=0;i<position.count;i+=3)if([0,1,2].every(j=>position.getY(i+j)===46))roofVertices+=3;
  });
  assert.equal(maxY,46,'nonpositive imported heights fall back to inferred six metre envelope');
  assert.equal(roofVertices,3,'the exact triangular source footprint has a closed roof cap');
 }finally{
  scene.traverse(object=>{object.geometry?.dispose();if(object.material){object.material.map?.dispose();object.material.dispose();}});
  globalThis.document=previous;
 }
});


test('city roof completion stays within the explicit triangle budget',()=>{
 const previous=globalThis.document;
 globalThis.document={createElement:()=>({getContext:()=>({fillRect(){}})}),body:{dataset:{}}};
 const ring=Array.from({length:80},(_,i)=>[400+Math.cos(i*Math.PI/40)*8,0,-270+Math.sin(i*Math.PI/40)*8]);ring.push(ring[0]);
 const scene=new THREE.Scene();
 try{
  const panorama=installCityPanorama(scene,{buildings:Array.from({length:1801},(_,i)=>({id:String(i),tags:{},points:ring}))},()=>40,()=>false);
  panorama.update({position:new THREE.Vector3(730,140,-270)},true);
  const report=JSON.parse(document.body.dataset.panoramaDetail);
  assert.ok(report.triangles<=CITY_PANORAMA_MAX_TRIANGLES);assert.ok(report.buildings<1800);
  assert.equal(report.triangles,report.buildings*(160+78),'each admitted footprint retains all walls and its complete roof');
 }finally{
  scene.traverse(object=>{object.geometry?.dispose();if(object.material){object.material.map?.dispose();object.material.dispose();}});
  globalThis.document=previous;
 }
});
