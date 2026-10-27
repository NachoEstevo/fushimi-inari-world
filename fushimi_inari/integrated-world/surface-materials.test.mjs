import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {fineGranite,senbonPaving} from './surface-materials.mjs';
function fixture(){
 const previous=globalThis.document;
 const canvases=[];globalThis.document={};globalThis.document.createElement=()=>{const ctx={createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),putImageData(image){this.image=image;},fillRect(x,y,w,h){
   for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++){const i=(yy*512+xx)*4;this.image.data.set([102,104,95,255],i);}
  }};
  const canvas={getContext:()=>ctx,ctx};canvases.push(canvas);return canvas;};
 return {canvases,restore(){globalThis.document=previous;}};
}
test('granite retains one shared-size color tile with clustered mineral variation',()=>{
 const f=fixture();try{
  const a=fineGranite(),b=fineGranite(),pixels=f.canvases[0].ctx.image.data;
  assert.equal(a.map.image.width,512);assert.equal(a.map.image.height,256);
  assert.equal(a.map.colorSpace,THREE.SRGBColorSpace);assert.equal(a.map.wrapS,THREE.RepeatWrapping);
  assert.equal(a.roughness,.96);assert.equal(a.normalMap,null);assert.equal(a.roughnessMap,null);
  assert.deepEqual(pixels,f.canvases[1].ctx.image.data,'repeatable bake');
  let adjacent=0,distant=0,seam=0,min=255,max=0;
  for(let y=0;y<256;y++)for(let x=0;x<480;x++){
   const n=pixels[(y*512+x)*4];min=Math.min(min,n);max=Math.max(max,n);
   adjacent+=Math.abs(n-pixels[(y*512+x+1)*4]);distant+=Math.abs(n-pixels[(y*512+x+24)*4]);
  }
  for(let y=0;y<256;y++)seam+=Math.abs(pixels[y*512*4]-pixels[(y*512+511)*4]);
  assert.ok(seam/256<adjacent/(256*480)*1.5,'wrap seam stays within normal grain variation');
  assert.ok(distant>adjacent*1.3,'aggregate varies across clusters instead of only independent pixel noise');
  assert.ok(min>=115&&max<=180,'dry mineral stays in a bounded neutral midtone');
  a.map.dispose();a.dispose();b.map.dispose();b.dispose();
 }finally{f.restore();}
});

test('Senbon shares its mineral tile for shallow bump without changing slab scale',()=>{
 const f=fixture();try{
  const material=senbonPaving(),map=material.map,pixels=f.canvases[0].ctx.image.data;
  assert.equal(material.bumpMap,map);assert.equal(material.bumpScale,.0015);assert.equal(material.roughness,.96);
  assert.equal(map.image.width,512);assert.equal(map.image.height,256);
  assert.equal(material.normalMap,null);assert.equal(material.roughnessMap,null);
  const color=(x,y)=>Array.from(pixels.slice((y*512+x)*4,(y*512+x)*4+3));
  assert.deepEqual(color(102,100),[102,104,95]);assert.deepEqual(color(409,100),[102,104,95]);
  assert.deepEqual(color(250,0),[102,104,95]);assert.deepEqual(color(250,255),[102,104,95]);
  assert.notDeepEqual(color(250,100),[102,104,95],'central slab has no dividing seam');
  assert.notDeepEqual(color(50,0),[102,104,95],'border joints are staggered');
  assert.deepEqual(color(50,128),[102,104,95]);assert.deepEqual(color(450,128),[102,104,95]);
  map.dispose();material.dispose();
 }finally{f.restore();}
});
