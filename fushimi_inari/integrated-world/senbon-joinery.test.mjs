import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
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
  const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
  assert.equal(instances.length,4,'fresh/worn pillars, red joinery and black finish retain their existing batches');
  assert.equal(hash(colliders),'7bd60ed6360f61c2a3e7ecb19d55b9eb7bb720be8c180c29383f46767b781641');
  assert.equal(hash(instances.map(m=>Array.from(m.instanceMatrix.array))),'dc3c9857f01d2e26756e2be01d866926ee98c56d4ce7e49b218e84cfd55fe8ca');
  const triangles=instances.reduce((n,m)=>n+(m.geometry.index.count/3)*m.count,0)/report.gates;
  assert.ok(triangles<=340,`continuous surfaces replace overlapping cap boxes: ${triangles} triangles per gate`);
  const joinery=new THREE.Mesh(instances[2].geometry,new THREE.MeshBasicMaterial());joinery.updateMatrixWorld(true);
  const topAt=x=>new THREE.Raycaster(new THREE.Vector3(x,4,0),new THREE.Vector3(0,-1,0)).intersectObject(joinery)[0].point.y;
  assert.ok(topAt(1.3)-topAt(0)>.04,'red shimaki follows the upturned black kasagi rather than remaining a disconnected flat bar');
 }finally{if(previous===undefined)delete globalThis.document;else globalThis.document=previous;}
});
