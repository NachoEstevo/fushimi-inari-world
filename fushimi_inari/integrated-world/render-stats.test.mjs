import test from 'node:test';
import assert from 'node:assert/strict';
import {renderStats} from './render-stats.mjs';
test('FPS uses frame intervals, reports stalls, and resets after tab visibility changes',()=>{
 const previous={document:globalThis.document,innerWidth:globalThis.innerWidth,innerHeight:globalThis.innerHeight};
 const label={dataset:{}},body={dataset:{}};
 Object.assign(globalThis,{document:{hidden:false,visibilityState:'visible',body,getElementById:()=>label},innerWidth:800,innerHeight:600});
 try{
  const record=renderStats({info:{render:{drawCalls:20,triangles:1000},memory:{geometries:10,textures:5}},getPixelRatio:()=>1});
  record(0,1);for(let t=20;t<=1000;t+=20)record(t,1);
  assert.equal(JSON.parse(body.dataset.renderStats).fps,50);
  record(3000,2);assert.equal(JSON.parse(body.dataset.renderStats).worstMs,2000);assert.equal(label.dataset.health,'stall');
  record.reset();record(10000,1);for(let t=10020;t<=11000;t+=20)record(t,1);
  assert.equal(JSON.parse(body.dataset.renderStats).fps,50);assert.match(label.textContent,/50 FPS/);
 }finally{Object.assign(globalThis,previous);}
});
