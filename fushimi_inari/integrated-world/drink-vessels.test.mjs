import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {DRINK_PRODUCTS,createDrinkVesselResources} from './drink-vessels.mjs';

test('bottles and coffee can have distinct supported silhouettes and share product templates',()=>{
 const resources=createDrinkVesselResources({document:null}),heights=[];
 assert.deepEqual(DRINK_PRODUCTS.map(p=>p.id),['green-tea','water','coffee','citrus']);
 for(const product of DRINK_PRODUCTS){
  const a=resources.create(product.id),b=resources.create(product.id);assert.notStrictEqual(a,b);
  assert.equal(a.userData.productId,product.id);assert.equal(a.children.length,b.children.length);
  for(let i=0;i<a.children.length;i++){
   assert.strictEqual(a.children[i].geometry,b.children[i].geometry);assert.strictEqual(a.children[i].material,b.children[i].material);
   const g=a.children[i].geometry;for(const attribute of ['position','normal','uv'])assert.ok(g.attributes[attribute]);
   assert.ok([...g.attributes.position.array].every(Number.isFinite));
  }
  const bounds=new THREE.Box3().setFromObject(a),size=bounds.getSize(new THREE.Vector3());
  assert.ok(Math.abs(bounds.min.y)<.0001&&size.x<.075&&size.z<.075);heights.push(size.y);
 }
 assert.ok(heights[2]<heights[0]*.65,'the compact coffee can is not a PET bottle');
 assert.ok(heights[0]>.18&&heights[1]>.18&&heights[3]>.18);
 assert.equal(resources.create('unknown'),null);resources.dispose();
});

test('original product artwork occupies one shared bounded atlas and survives borrowed clone removal',()=>{
 const printed=[],context=new Proxy({},{get:(_,key)=>key==='fillText'?value=>printed.push(value):()=>{},set:()=>true});
 const canvas={getContext:()=>context},resources=createDrinkVesselResources({document:{createElement:()=>canvas}});
 assert.equal(resources.atlas.image.width,1024);assert.equal(resources.atlas.image.height,512);
 for(const text of ['Oi Ocha','おいしい水','BOSS','Sparkling'])assert.ok(printed.includes(text),text);
 const products=DRINK_PRODUCTS.map(p=>resources.create(p.id));
 const labels=products.map(p=>p.children.find(child=>child.name==='drinkLabel'));
 assert.equal(new Set(labels.map(label=>label.material)).size,1);assert.strictEqual(labels[0].material.map,resources.atlas);
 for(const [index,label] of labels.entries()){
  const uv=label.geometry.attributes.uv;for(let i=0;i<uv.count;i++)assert.ok(uv.getX(i)>index/4&&uv.getX(i)<(index+1)/4);
 }
 const geometry=labels[0].geometry,material=labels[0].material,texture=resources.atlas;let gs=0,ms=0,ts=0;
 geometry.addEventListener('dispose',()=>gs++);material.addEventListener('dispose',()=>ms++);texture.addEventListener('dispose',()=>ts++);
 products[0].removeFromParent();assert.equal(gs,0);resources.dispose();resources.dispose();
 assert.deepEqual([gs,ms,ts],[1,1,1]);assert.equal(resources.create('water'),null);
});

test('display copies can be batched without mutating or disposing reusable templates',()=>{
 const resources=createDrinkVesselResources({document:null}),held=resources.create('green-tea'),collected=[];
 assert.equal(resources.append({put:(geometry,key)=>collected.push({geometry,key})},'green-tea',{position:[2,3,4]}),true);
 assert.deepEqual(collected.map(p=>p.key),['color','drinkLabel']);
 assert.notStrictEqual(collected[0].geometry,held.children[0].geometry);
 collected.forEach(p=>p.geometry.dispose());
 assert.equal(resources.append({put(){}},'unknown'),false);assert.ok(held.children[0].geometry.attributes.position.count>0);
 resources.dispose();
});
