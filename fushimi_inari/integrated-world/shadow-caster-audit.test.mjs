import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {captureShadowCasters} from './shadow-caster-audit.mjs';
function fixture(){
 const scene=new THREE.Scene(),shadowCamera=new THREE.OrthographicCamera(),mainCamera=new THREE.PerspectiveCamera();
 const geometry=new THREE.BoxGeometry(),material=new THREE.MeshBasicMaterial();material.name='bark';
 const mesh=new THREE.InstancedMesh(geometry,material,4);mesh.name='trees';scene.add(mesh);
 const plain=new THREE.Mesh(new THREE.BoxGeometry(),material);scene.add(plain);
 const call=(object,camera,group=null)=>object.onBeforeRender.call(object,{},scene,camera,object.geometry,material,group);
 return {scene,shadowCamera,mainCamera,mesh,plain,call};
}
test('captures only shadow draws, counts instancing and draw ranges, preserves callbacks',()=>{
 const f=fixture();let calls=0,receiver;const original=function(){calls++;receiver=this;};f.mesh.onBeforeRender=original;
 f.mesh.geometry.setDrawRange(3,12);
 const result=captureShadowCasters({...f,label:o=>o===f.mesh?'forest':'other',render(){
  f.call(f.mesh,f.mainCamera);f.call(f.mesh,f.shadowCamera);f.call(f.plain,f.shadowCamera,{start:0,count:6});
 }});
 assert.equal(calls,2);assert.equal(receiver,f.mesh);assert.equal(f.mesh.onBeforeRender,original);
 assert.equal(result.totalDraws,2);assert.equal(result.totalTriangles,18);assert.equal(result.top[0].label,'forest');assert.equal(result.top[0].triangles,16);assert.equal(result.top[0].instances,4);assert.equal(result.top[0].material,'bark');
});
test('restores callbacks when rendering fails',()=>{
 const f=fixture(),original=f.mesh.onBeforeRender,other=f.plain.onBeforeRender;
 assert.throws(()=>captureShadowCasters({...f,render(){f.call(f.mesh,f.shadowCamera);throw Error('render failed');}}),/render failed/);
 assert.equal(f.mesh.onBeforeRender,original);assert.equal(f.plain.onBeforeRender,other);
});
test('ranks and bounds output without truncating totals',()=>{
 const f=fixture();const result=captureShadowCasters({...f,render(){for(let i=0;i<30;i++)f.call(f.mesh,f.shadowCamera);}});
 assert.equal(result.totalDraws,30);assert.equal(result.draws,30);assert.equal(result.top.length,25);assert.equal(result.totalTriangles,30*12*4);
});
