import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {mountainPathMaterials} from './mountain-path-materials.mjs';

test('mountain stairs keep their single matte tile and uneven restrained joint wear',()=>{
 const previous=globalThis.document,operations=[];let canvases=0;
 const ctx={createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),putImageData(){},createLinearGradient(){return {addColorStop(){}};},fillRect(x,y,w,h){operations.push({x,y,w,h,fill:this.fillStyle});}};
 globalThis.document={createElement(){canvases++;return {getContext:()=>ctx};}};
 try{
  const source=new THREE.MeshStandardMaterial(),{mountainTread:tread,mountainRetaining:retaining}=mountainPathMaterials({materials:{stoneMat:source}});
  assert.equal(canvases,1);assert.equal(tread.map.image.width,512);assert.equal(tread.map.image.height,256);assert.equal(tread.bumpMap,tread.map);assert.equal(tread.bumpScale,.003);assert.equal(tread.roughness,.97);
  const flecks=operations.filter(o=>o.w<30&&o.h<15);assert.ok(flecks.length>=40);assert.ok(flecks.every(o=>o.y<40||o.y>216),'wear remains near joints');
  assert.ok(!operations.some(o=>o.w===2&&o.h===256),'no continuous dark stripe across the tread');
  tread.map.dispose();tread.dispose();retaining.dispose();source.dispose();
 }finally{if(previous===undefined)delete globalThis.document;else globalThis.document=previous;}
});
