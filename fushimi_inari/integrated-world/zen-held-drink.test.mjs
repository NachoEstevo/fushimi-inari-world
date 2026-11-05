import test from 'node:test';
import assert from 'node:assert/strict';
import {Scene,Group,Mesh,BoxGeometry,MeshBasicMaterial,PerspectiveCamera} from 'three';
import {createZenHeldDrink} from './zen-held-drink.mjs';

test('each selected product is held, sips pause through UI and background time cannot finish a drink',()=>{
 const scene=new Scene(),camera=new PerspectiveCamera(),events=[],drink=createZenHeldDrink({scene,camera,document:null,onConsume:event=>events.push(event)});
 assert.equal(drink.sip(),false);assert.equal(drink.preparationRoots.length,4);
 for(const productId of ['green-tea','water','coffee','citrus']){
  drink.collect({productId});assert.equal(drink.stats.productId,productId);assert.equal(drink.group.children.filter(c=>c.visible).length,1);assert.equal(drink.group.children.find(c=>c.visible).userData.productId,productId);
 }
 for(let i=0;i<3;i++){
  assert.equal(drink.sip(),true);assert.equal(drink.sip(),false);drink.update(2,{blocked:true});assert.equal(drink.stats.sips,3-i);
  drink.update(NaN);drink.update(30);assert.equal(drink.stats.sipping,true);assert.equal(drink.stats.sips,3-i);
  for(let j=0;j<14;j++)drink.update(.1);assert.equal(drink.stats.sips,2-i);
 }
 assert.equal(events.length,3);assert.equal(events[2].remaining,0);assert.equal(drink.sip(),false);drink.stow();assert.equal(drink.stats.visible,false);drink.dispose();assert.equal(scene.children.length,0);drink.dispose();
});

test('handed drinks reuse commerce resources, reset on replacement and never dispose borrowed geometry',()=>{
 const scene=new Scene(),camera=new PerspectiveCamera(),geo=new BoxGeometry(),mat=new MeshBasicMaterial();let disposed=0;
 geo.addEventListener('dispose',()=>disposed++);mat.addEventListener('dispose',()=>disposed++);
 const commerce={createDrink(id){const model=new Group();model.userData.productId=id;model.add(new Mesh(geo,mat));return model;}};
 const drink=createZenHeldDrink({scene,camera,commerce,document:null});drink.collect({productId:'coffee'});drink.sip();drink.update(.1);drink.collect({productId:'water'});
 assert.equal(drink.stats.sipping,false);assert.equal(drink.stats.sips,3);drink.dispose();drink.dispose();assert.equal(disposed,0);assert.equal(scene.children.length,0);geo.dispose();mat.dispose();
});


test('the drink silhouette stays inside the default 45 degree view and clear of the near plane',()=>{
 const scene=new Scene(),camera=new PerspectiveCamera(45,16/9,.2,12000),drink=createZenHeldDrink({scene,camera,document:null});
 for(const productId of ['green-tea','water','coffee','citrus']){
  drink.collect({productId});drink.update(0);scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);
  const model=drink.group.children.find(c=>c.visible);
  model.traverse(object=>{if(!object.isMesh)return;const position=object.geometry.attributes.position;
   for(let i=0;i<position.count;i++){const point=object.localToWorld(object.position.clone().fromBufferAttribute(position,i)).project(camera);assert.ok(Math.abs(point.x)<1&&Math.abs(point.y)<1&&point.z>-1&&point.z<1,productId+' remains clickable in frame');}
  });
 }drink.dispose();
});
