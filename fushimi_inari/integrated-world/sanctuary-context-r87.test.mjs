import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {buildTamayamaStairBorders} from './tamayama-stair-borders.mjs';
import {buildSanctuaryContextR87} from './sanctuary-context-r87.mjs';

function fixture(){
 const root=new THREE.Group(),network={segments:[{id:'way/105449693',a:[0,0,0],b:[6,0,0],ya:2,yb:4,width:4.8,stair:true}],terrainHeight:(x,z)=>2+x/3-Math.abs(z)*.02,height:()=>17};
 const materials={stoneMat:new THREE.MeshStandardMaterial({color:'#929184'})},colliders=[{type:'box',args:[7,8,1,1,0,0,2,'unchanged']}];
 buildTamayamaStairBorders(root,{},network,materials);
 return {root,network,materials,colliders};
}
test('replaces only existing sourced retaining owner, preserving structural mesh and walking/collision ownership',()=>{
 const {root,network,materials,colliders}=fixture(),source=root.children[0],geometry=source.geometry,before=JSON.stringify(network.segments),collision=JSON.stringify(colliders),height=network.height,terrain=network.terrainHeight;
 const record=buildSanctuaryContextR87(root,{},network,materials,colliders);
 assert.ok(record.stones>100);assert.equal(record.facingTriangles,record.stones*4);assert.equal(record.materialBatches,2);assert.equal(root.children.length,1);assert.equal(source.parent,null);
 assert.equal(root.children[0].children[0].geometry,geometry);assert.equal(network.height,height);assert.equal(network.terrainHeight,terrain);
 assert.equal(JSON.stringify(network.segments),before);assert.equal(JSON.stringify(colliders),collision);
 assert.equal(buildSanctuaryContextR87(root,{},network,materials,colliders),record);assert.equal(root.children.length,1);
});
test('facing remains finite, nondegenerate, bounded within original 14cm stair reserve, and has metric UVs',()=>{
 const {root,network,materials,colliders}=fixture();buildSanctuaryContextR87(root,{},network,materials,colliders);
 const geometry=root.children[0].children[1].geometry,p=geometry.attributes.position;
 assert.ok(p.count<60000);assert.equal(geometry.attributes.uv.count,p.count);assert.equal(geometry.attributes.color.count,p.count);
 for(const value of p.array)assert.ok(Number.isFinite(value));
 for(let i=0;i<p.count;i++)assert.ok(Math.abs(p.getZ(i))>2.4+.106,'stone relief leaves at least 106mm beyond tread');
 for(let i=0;i<p.count;i+=3){const a=new THREE.Vector3().fromBufferAttribute(p,i),b=new THREE.Vector3().fromBufferAttribute(p,i+1),c=new THREE.Vector3().fromBufferAttribute(p,i+2);assert.ok(b.sub(a).cross(c.sub(a)).lengthSq()>1e-13);}
});
test('does not invent a wall if original owner or correct source identity is absent',()=>{
 const root=new THREE.Group(),materials={stoneMat:new THREE.MeshStandardMaterial()};
 assert.equal(buildSanctuaryContextR87(root,{}, {},materials,[]),null);assert.equal(root.children.length,0);
 const fake=new THREE.Mesh(new THREE.BoxGeometry(),materials.stoneMat);fake.name='Tamayama west stair rough stone retaining edges';root.add(fake);
 assert.equal(buildSanctuaryContextR87(root,{}, {},materials,[]),null);assert.equal(root.children.length,1);
});
test('stone fronts face outward from the retained R77 wall instead of being backface culled',()=>{
 const {root,network,materials,colliders}=fixture(),original=root.children[0].geometry.attributes.position,planes=[];
 for(let i=0;i<original.count;i+=3){const a=new THREE.Vector3().fromBufferAttribute(original,i),b=new THREE.Vector3().fromBufferAttribute(original,i+1),c=new THREE.Vector3().fromBufferAttribute(original,i+2),n=b.clone().sub(a).cross(c.clone().sub(a)).normalize();if(Math.abs(n.z)>.99)planes.push({a,n});}
 buildSanctuaryContextR87(root,{},network,materials,colliders);
 const p=root.children[0].children[1].geometry.attributes.position;let checked=0;
 for(let i=0;i<p.count;i+=3){
  const a=new THREE.Vector3().fromBufferAttribute(p,i),b=new THREE.Vector3().fromBufferAttribute(p,i+1),c=new THREE.Vector3().fromBufferAttribute(p,i+2),normal=b.clone().sub(a).cross(c.clone().sub(a)).normalize();
  const nearest=planes.reduce((best,f)=>Math.abs(a.clone().sub(f.a).dot(f.n))<Math.abs(a.clone().sub(best.a).dot(best.n))?f:best);
  assert.ok(normal.dot(nearest.n)>.75,'every broad front must agree with original outward wall normal');checked++;
 }
 assert.ok(checked>100);
});
