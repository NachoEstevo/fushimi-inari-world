import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {buildPathMargins} from './path-margins.mjs';

test('path margins expose only their two installed static roots without changing report or geometry',()=>{
 const network={segments:Array.from({length:24},(_,i)=>({id:i,distance:i*7,kind:'stone',a:[650+i*2,89,140],b:[652+i*2,89,140],ya:89,yb:89,width:2})),sample:()=>null};
 const features={buildings:[],water:[]},baseline=new THREE.Group(),root=new THREE.Group(),owners=[];
 const original=buildPathMargins(baseline,network,()=>89,features,[]);
 const actual=buildPathMargins(root,network,()=>89,features,[],{onStaticRoot:group=>{assert.equal(group.parent===root,true);owners.push(group);}});
 assert.deepEqual(actual,original);assert.equal(owners.length,2);assert.deepEqual(owners,root.children);
 for(let i=0;i<owners.length;i++){
  const source=baseline.children[i];assert.equal(owners[i].children.length,source.children.length);
  for(let j=0;j<source.children.length;j++){
   const before=source.children[j],after=owners[i].children[j];
   assert.equal(after.count,before.count);assert.deepEqual(after.instanceMatrix.array,before.instanceMatrix.array);
   assert.deepEqual(after.geometry.attributes.position.array,before.geometry.attributes.position.array);
   assert.equal(after.material.color.getHex(),before.material.color.getHex());assert.equal(after.material.side,before.material.side);
   assert.equal(after.castShadow,before.castShadow);assert.equal(after.receiveShadow,before.receiveShadow);
  }
 }
 const geometries=new Set(),materials=new Set();for(const object of [baseline,root])object.traverse(mesh=>{if(mesh.geometry)geometries.add(mesh.geometry);if(mesh.material)materials.add(mesh.material);});
 for(const geometry of geometries)geometry.dispose();for(const material of materials)material.dispose();
});
