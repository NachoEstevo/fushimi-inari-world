import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {buildSenbon} from './senbon.mjs';

test('Senbon has continuous matching upper beams within the existing instance and walking budget',()=>{
 const previous=globalThis.document;
 globalThis.document={createElement:()=>({getContext:()=>new Proxy({},{get:()=>()=>{}})})};
 const mat=()=>new THREE.MeshPhysicalMaterial(),legacy={torii:{fresh:mat(),weathered:mat()},materials:{vermilionMat:mat(),blackNemakiMat:mat(),lanternGlowMat:mat()}};
 const twins=[0,1].map(i=>({total:30,at:t=>({point:[i*4,0,t*30],yaw:.2})}));
 const root=new THREE.Group(),colliders=[];
 try{
  const report=buildSenbon(root,legacy,{twins},()=>4,colliders),instances=root.children.filter(o=>o.isInstancedMesh);
  assert.equal(instances.length,4,'fresh/worn pillars, red joinery and black finish retain their existing batches');
  assert.equal(colliders.length,report.gates*2);
  assert.ok(colliders.every(c=>c.args[4]>c.args[3]+2.4));
  assert.equal(instances[2].count,report.gates);
  assert.equal(instances[3].count,report.gates);
  const triangles=instances.reduce((n,m)=>n+(m.geometry.index.count/3)*m.count,0)/report.gates;
  assert.ok(triangles<=340,`continuous surfaces replace overlapping cap boxes: ${triangles} triangles per gate`);
  const joinery=new THREE.Mesh(instances[2].geometry,new THREE.MeshBasicMaterial());joinery.updateMatrixWorld(true);
  const topAt=x=>new THREE.Raycaster(new THREE.Vector3(x,4,0),new THREE.Vector3(0,-1,0)).intersectObject(joinery)[0].point.y;
  assert.ok(topAt(1.3)-topAt(0)>.04,'red shimaki follows the upturned black kasagi rather than remaining a disconnected flat bar');
 }finally{if(previous===undefined)delete globalThis.document;else globalThis.document=previous;}
});

test('both posts remain seated on cross-sloped terrain and colliders follow the gate',()=>{
 const previous=globalThis.document;
 globalThis.document={createElement:()=>({getContext:()=>new Proxy({},{get:()=>()=>{}})})};
 const mat=()=>new THREE.MeshPhysicalMaterial(),legacy={torii:{fresh:mat(),weathered:mat()},materials:{vermilionMat:mat(),blackNemakiMat:mat(),lanternGlowMat:mat()}};
 const twins=[0,1].map(i=>({total:30,at:t=>({point:[i*4,0,t*30],yaw:.2})}));
 const root=new THREE.Group(),colliders=[],height=(x,z)=>4+.12*x+.03*z;
 try{
  const report=buildSenbon(root,legacy,{twins},height,colliders);
  assert.equal(colliders.length,report.gates*2);
  for(let i=0;i<colliders.length;i+=2){
   const a=colliders[i].args,b=colliders[i+1].args;
   assert.equal(a[3],b[3]);
   assert.ok(a[3]<=height(a[0],a[1])-.014);
   assert.ok(b[3]<=height(b[0],b[1])-.014);
   assert.ok(Math.min(height(a[0],a[1]),height(b[0],b[1]))-a[3]<.03);
   const crossbar=a[3]+(a[4]-a[3])*(1.98/2.55);
   assert.ok(crossbar-Math.max(height(a[0],a[1]),height(b[0],b[1]))>=1.9-1e-10);
  }
 }finally{if(previous===undefined)delete globalThis.document;else globalThis.document=previous;}
});
