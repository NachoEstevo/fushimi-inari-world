import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {refineTemizuyaCanopy} from './temizuya-canopy.mjs';
import {roofHeight} from './roof-profile.mjs';

const expected=(x,z)=>2.85+roofHeight(z/2.3,1.05)+.10*Math.pow(Math.abs(x/3.1),6);
function fixture(){
 const context={fillRect(){},beginPath(){},moveTo(){},lineTo(){},stroke(){}};
 const previousDocument=globalThis.document;
 globalThis.document={createElement:()=>({width:0,height:0,getContext:()=>context})};
 const group=new THREE.Group(),material=new THREE.MeshStandardMaterial();
 group.add(new THREE.Mesh(new THREE.BoxGeometry(6.2,.55,4.6),material),new THREE.Mesh(new THREE.BoxGeometry(6.4,.24,.45),material));
 const basin=new THREE.Mesh(new THREE.BoxGeometry(2.2,.86,1.25),material);basin.name='retained basin';group.add(basin);
 try{refineTemizuyaCanopy(group);}finally{if(previousDocument===undefined)delete globalThis.document;else globalThis.document=previousDocument;}
 return {group,basin,details:group.getObjectByName('Temizuya photo-backed canopy')};
}
test('canopy width subdivisions match the curved rafter height at interior vertices',()=>{
 const {details}=fixture(),top=details.children.find(m=>m.material.metalness===.38),p=top.geometry.getAttribute('position'),normal=top.geometry.getAttribute('normal');
 const xs=new Set();let interior=0;
 for(let i=0;i<p.count;i++){
  const x=p.getX(i),z=p.getZ(i);xs.add(x.toFixed(4));
  assert.ok(Math.abs(p.getY(i)-expected(x,z))<1e-6);
  assert.ok(normal.getY(i)>0,'top winding must face upward');
  if(Math.abs(x)<.01){interior++;assert.ok(Math.abs(p.getY(i)-(expected(3.1,z)-.1))<1e-6,'centre does not inherit corner lift');}
 }
 assert.equal(xs.size,25);assert.ok(interior>0);assert.equal(p.count,24*32*6);
});
test('soffit tracks the same surface below the roof with downward normals',()=>{
 const {details}=fixture(),soffit=details.children.find(m=>m.material.side===THREE.DoubleSide&&m.material.metalness===0),p=soffit.geometry.getAttribute('position'),n=soffit.geometry.getAttribute('normal');
 // Soffit is first in the paper batch; later shide retain their own orientation.
 for(let i=0;i<24*32*6;i++){
  assert.ok(Math.abs(p.getY(i)-(expected(p.getX(i),p.getZ(i))-.085))<1e-6);
  assert.ok(n.getY(i)<0,'soffit winding must face downward');
 }
});
test('canopy refinement keeps basin identity and is idempotent',()=>{
 const {group,basin,details}=fixture(),count=group.children.length,geometries=details.children.map(m=>m.geometry);
 refineTemizuyaCanopy(group);
 assert.equal(group.children.length,count);assert.equal(group.getObjectByName('retained basin'),basin);assert.equal(group.getObjectByName(details.name),details);
 assert.deepEqual(details.children.map(m=>m.geometry),geometries);assert.equal(details.children.length,5);
});
