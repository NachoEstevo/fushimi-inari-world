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
 assert.ok(heights[0]>.18&&heights[1]>.18&&heights[3]>.10);
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

test('the citrus drink uses a small bottle and PET and print stay nonmetallic',()=>{
 const resources=createDrinkVesselResources({document:null});
 const tea=resources.create('green-tea'),citrus=resources.create('citrus');
 const size=object=>new THREE.Box3().setFromObject(object).getSize(new THREE.Vector3());
 assert.ok(size(citrus).y<size(tea).y*.75,'the lemon bottle is a small individual serving');
 assert.ok(size(citrus).x<size(tea).x*.85,'the lemon bottle is narrower than a PET bottle');
 assert.equal(resources.materials.drinkBody.metalness,0);
 assert.ok(resources.materials.drinkBody.roughness>=.38);
 assert.ok(resources.materials.drinkLabel.roughness>=.6);
 resources.dispose();
});

test('major label lettering is constrained to the front visible arc of its atlas tile',()=>{
 const texts=[],stack=[];let scale=1,offset=0;
 const target={save(){stack.push([scale,offset]);},restore(){[scale,offset]=stack.pop();},
  translate(x){offset+=scale*x;},scale(x){scale*=x;},
  fillText(value,x,y,maxWidth){texts.push({value,x:offset+scale*x,maxWidth:scale*maxWidth});}};
 const context=new Proxy(target,{get:(obj,key)=>obj[key]??(()=>{}),set:(obj,key,value)=>(obj[key]=value,true)});
 const resources=createDrinkVesselResources({document:{createElement:()=>({getContext:()=>context})}});
 for(const [value,index] of [['お',0],['おいしい水',1],['BOSS',2],['キレートレモン',3]]){
  const call=texts.find(text=>text.value===value);assert.ok(call,value);
  assert.ok(Math.abs(call.x-(index*256+128))<=24,`${value} stays near the front`);
  assert.ok(call.maxWidth<=85,`${value} fits the central visible arc`);
 }
 resources.dispose();
});

test('opening a held drink moves only its shared cap or tab and can reset without rebuilding',()=>{
 const resources=createDrinkVesselResources({document:null});
 for(const [id,name] of [['green-tea','drinkCap'],['water','drinkCap'],['citrus','drinkCap'],['coffee','drinkTab']]){
  const model=resources.create(id),part=model.getObjectByName(name),geometry=part?.geometry;
  assert.ok(part,`${id} has an operable closure`);
  assert.equal(typeof model.userData.setOpenProgress,'function');
  const originalY=part.position.y;model.userData.setOpenProgress(.5);
  assert.ok(part.rotation.x!==0||part.rotation.y!==0,`${id} closure moves while opening`);
  model.userData.setOpenProgress(1);
  if(name==='drinkCap')assert.equal(part.visible,false);
  model.userData.setOpenProgress(0);
  assert.equal(part.visible,true);assert.equal(part.position.y,originalY);
  assert.ok(Math.abs(part.rotation.x)<1e-9&&Math.abs(part.rotation.y)<1e-9);assert.strictEqual(part.geometry,geometry);
 }
 resources.dispose();
});

test('opened bottles have a recessed mouth inside the existing body batch',()=>{
 const resources=createDrinkVesselResources({document:null});
 for(const id of ['green-tea','water','citrus']){
  const model=resources.create(id),body=model.getObjectByName('drinkBody'),position=body.geometry.attributes.position,color=body.geometry.attributes.color;let mouth=[];
  for(let i=0;i<position.count;i++)if(color.getX(i)<.015&&color.getY(i)<.025&&color.getZ(i)<.02)mouth.push([position.getX(i),position.getY(i),position.getZ(i)]);
  assert.ok(mouth.length>=24,'opaque dark recess stops the open mouth showing scenery through the bottle');
  const top=id==='citrus'?.113:.184;assert.ok(mouth.every(([x,y,z])=>Math.abs(y-(top-.0015))<1e-7&&Math.hypot(x,z)<.013));
  model.userData.setOpenProgress(1);assert.equal(model.getObjectByName('drinkCap').visible,false);assert.equal(model.children.length,3,'the recess does not add another draw leaf');
 }resources.dispose();
});
