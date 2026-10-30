import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import * as THREE from 'three';
import * as paths from './path-meshes.mjs';

function canvasDocument(){
  const noop=()=>{},context=new Proxy({createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),getImageData:(x,y,w,h)=>({data:new Uint8ClampedArray(w*h*4)}),createLinearGradient:()=>({addColorStop:noop})},{get:(o,k)=>o[k]??noop});
  return {createElement:()=>({width:512,height:256,getContext:()=>context}),body:{dataset:{}}};
}
function fixture(){
  const segment=(id,a,b,extra={})=>({id,a,b,ya:a[1],yb:b[1],width:2,kind:'stone',distance:0,stair:false,...extra});
  const segments=[
    segment('way/260121328',[240,60,50],[241,60.1,50]),
    segment('mountain',[300,100,10],[301.8,100,10]),
    segment('mountain',[301.8,100.16,10],[303.6,100.16,10],{stair:true,rise:.16,riserAt:'a',distance:1.8,handrail:true}),
    segment('precinct',[20,30,0],[22,30,0],{curbLip:.01}),
    segment('way/105449722',[-150,30,10],[-148,30.1,10],{width:8}),
    segment('way/79699850',[-149,30,8],[-149,30.1,12],{kind:'street',width:1}),
    segment('restricted',[400,110,10],[401,110,10],{kind:'restricted'})
  ];
  let elapsed=0;const calls=[];
  const network={segments,edgeCovered:(...args)=>{elapsed+=1;calls.push(['edge',...args]);return false;},sample:(...args)=>{elapsed+=.1;calls.push(['sample',...args]);return null;}};
  const ground=(x,z)=>{elapsed+=.1;calls.push(['ground',x,z]);return x>255?99.5:29.5;};
  const m=new THREE.MeshStandardMaterial(),legacy={materials:{stoneMat:m,gravelMat:m,flagstoneMat:m,precinctPaving:m}};
  return {network,legacy,ground,calls,now:()=>elapsed};
}
function snapshot(group){
  const objects=[];
  group.traverse(o=>objects.push({type:o.type,name:o.name,userData:o.userData,castShadow:o.castShadow,receiveShadow:o.receiveShadow,
    attributes:o.geometry?Object.fromEntries(Object.entries(o.geometry.attributes).map(([name,a])=>[name,Array.from(a.array)])):null,
    material:o.material?{color:o.material.color.toArray(),side:o.material.side,roughness:o.material.roughness,vertexColors:o.material.vertexColors}:null}));
  return objects;
}
test('paced path construction retains geometry, UVs, normals, colors and sampling order',async()=>{
  assert.equal(typeof paths.buildPathMeshesAsync,'function');
  const previous=globalThis.document;globalThis.document=canvasDocument();
  try{
    const a=fixture(),original=paths.buildPathMeshes(a.network,a.legacy,a.ground),b=fixture(),stages=[];let yields=0;
    const paced=await paths.buildPathMeshesAsync(b.network,b.legacy,b.ground,{yieldWork:async()=>{yields++;},now:b.now,onStage:stage=>stages.push(stage)});
    assert.deepEqual(snapshot(paced),snapshot(original));assert.deepEqual(b.calls,a.calls);assert.ok(yields>1);
    assert.deepEqual(paced.userData.mountainPaths,original.userData.mountainPaths);
    assert.deepEqual(stages.slice(0,6),['path ribbons and curbs','path materials','Okusha curb ownership','Okusha shoulder ownership','station street ownership','walking top ownership']);
  }finally{if(previous===undefined)delete globalThis.document;else globalThis.document=previous;}
});

test('path fixture preserves its pre-pacing geometry golden',()=>{
  const previous=globalThis.document;globalThis.document=canvasDocument();
  try{
    const f=fixture(),group=paths.buildPathMeshes(f.network,f.legacy,f.ground);
    const hash=createHash('sha256').update(JSON.stringify(snapshot(group))).digest('hex');
    assert.equal(hash,'a682e70897c58cd0b14ff05c20c76f2cbb9f4cfc7786be05c98cd5e5912c1039');
  }finally{if(previous===undefined)delete globalThis.document;else globalThis.document=previous;}
});

test('path construction prepares the fixed Hommachi road cuts once for all Omotesando strips',()=>{
  const previous=globalThis.document;globalThis.document=canvasDocument();
  try{
    const f=fixture(),first=f.network.segments.find(s=>s.id==='way/105449722');
    f.network.segments.push({...first,a:[-148,30.1,10],b:[-146,30.2,10],distance:2});
    let scans=0;const filter=f.network.segments.filter;
    f.network.segments.filter=function(...args){scans++;return filter.apply(this,args);};
    paths.buildPathMeshes(f.network,f.legacy,f.ground);assert.equal(scans,1);
  }finally{if(previous===undefined)delete globalThis.document;else globalThis.document=previous;}
});
