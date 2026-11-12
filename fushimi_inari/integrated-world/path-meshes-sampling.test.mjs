import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {recentGround,buildPathMeshes} from './path-meshes.mjs';

test('recent ground samples reuse exact coordinates only',()=>{
  const calls=[],ground=recentGround((x,z)=>{calls.push([x,z]);return x*10+z;},2);
  assert.equal(ground(1,2),12);assert.equal(ground(1,2),12);assert.equal(ground(1,2.0000001),12.0000001);
  assert.equal(ground(3,4),34);assert.equal(ground(1,2),12,'evicted entries resample');
  assert.equal(ground(0,5),5);assert.equal(ground(0,5),5);assert.equal(ground(-0,5),5);
  assert.deepEqual(calls,[[1,2],[1,2.0000001],[3,4],[1,2],[0,5],[0,5],[-0,5]]);
});

test('mountain curbs and shoulders sample each shared ground point once',()=>{
  const previous=globalThis.document,noop=()=>{};
  const context=new Proxy({createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),getImageData:(x,y,w,h)=>({data:new Uint8ClampedArray(w*h*4)}),createLinearGradient:()=>({addColorStop:noop})},{get:(o,k)=>o[k]??noop});
  globalThis.document={createElement:()=>({width:512,height:256,getContext:()=>context}),body:{dataset:{}}};
  try{
    const segments=[{id:'mountain',a:[300,100,10],b:[309,100.4,10],ya:100,yb:100.4,width:2,kind:'stone',distance:0,stair:false}];
    const samples=new Map();
    const network={segments,edgeCovered:()=>false,sample:()=>null};
    const ground=(x,z)=>{const key=`${x},${z}`;samples.set(key,(samples.get(key)??0)+1);return 99.7+x*.001;};
    const m=new THREE.MeshStandardMaterial(),group=buildPathMeshes(network,{materials:{stoneMat:m,gravelMat:m,flagstoneMat:m,precinctPaving:m}},ground);
    assert.ok(group.userData.mountainPaths.retainingFaces>0&&group.userData.mountainPaths.groundedShoulders>0);
    assert.ok([...samples.values()].every(count=>count===1),'no point is resampled');
    assert.equal(document.body.dataset.mountainPaths,undefined,'diagnostics stay audit-only');
  }finally{if(previous===undefined)delete globalThis.document;else globalThis.document=previous;}
});
