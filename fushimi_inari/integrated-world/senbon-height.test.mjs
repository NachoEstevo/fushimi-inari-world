import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {buildSenbon} from './senbon.mjs';
import {routeSpec} from './route-spec.mjs';

test('the two tunnels retain human headroom at the five-go comparison scale',()=>{
 const previous=globalThis.document;
 globalThis.document={createElement:()=>({getContext:()=>new Proxy({},{get:()=>()=>{}})})};
 const mat=()=>new THREE.MeshPhysicalMaterial();
 const legacy={torii:{fresh:mat(),weathered:mat()},materials:{vermilionMat:mat(),blackNemakiMat:mat(),lanternGlowMat:mat()}};
 const twins=[0,1].map(index=>({total:30,at:t=>({point:[index*4,0,t*30],yaw:0})}));
 const root=new THREE.Group(),colliders=[];
 try{
  const report=buildSenbon(root,legacy,{twins},()=>4,colliders);
  assert.equal(report.height,2.55);
  assert.equal(report.clearWidth,routeSpec.senbon.pillarCenters-routeSpec.senbon.pillarDiameter);
  const joinery=root.children.find(o=>o.isInstancedMesh&&o.material!==legacy.materials.blackNemakiMat&&o.count===report.gates);
  assert.ok(joinery,'all gates share the red crossbar instance batch');
  const matrix=new THREE.Matrix4(),position=new THREE.Vector3(),rotation=new THREE.Quaternion(),scale=new THREE.Vector3();
  for(let i=0;i<joinery.count;i++){
   joinery.getMatrixAt(i,matrix);matrix.decompose(position,rotation,scale);
   assert.ok(routeSpec.senbon.crossbarUnderside*scale.y>=1.9,'the smallest varied crossbar clears 1.9 m');
  }
  assert.equal(colliders.length,report.gates*2);
  assert.ok(report.clearWidth*.98>1.6,'width variation retains a walkable opening');
 }finally{if(previous===undefined)delete globalThis.document;else globalThis.document=previous;}
});
