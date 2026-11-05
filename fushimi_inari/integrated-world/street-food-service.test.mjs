import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {installStreetFoodService} from './street-food-service.mjs';
function fixture(doc=null,onSound=()=>{}){
 const scene=new THREE.Scene(),root=new THREE.Group(),camera=new THREE.PerspectiveCamera();scene.add(root);camera.position.set(0,1.7,1);
 const geo=new THREE.ConeGeometry(.05,.15,8),mat=new THREE.MeshStandardMaterial(),vendor=new THREE.Group();vendor.name='Food attendant · shop';let greetings=0;const original={directAction:()=>greetings++};vendor.userData.interactable=original;root.add(vendor);
 const assembly={root,legacy:{interactables:[vendor]}},commerce={sites:[{id:'shop',kind:'soft-serve',name:'Kyōzuan',position:[0,0,0],counterPosition:[0,1.23,-.2]}],createServing(){const g=new THREE.Group();const m=new THREE.Mesh(geo,mat);m.position.y=.075;g.add(m);return g;}};
 const pauses=[],walker={mode:'walk',pause:value=>pauses.push(value)};let blocked=false,collected=0;
 const api=installStreetFoodService({scene,camera,assembly,commerce,walker,document:doc,getBlocked:()=>blocked,onCollected:()=>collected++,onSound});
 return {api,scene,root,camera,assembly,geo,mat,vendor,original,pauses,blocked:value=>blocked=value,get greetings(){return greetings;},get collected(){return collected;}};
}
test('service prepares a real serving, collects once, equips it and releases only its own owners',()=>{
 const f=fixture();assert.equal(f.api.stats.boundVendors,1);let disposed=0;f.geo.addEventListener('dispose',()=>disposed++);f.mat.addEventListener('dispose',()=>disposed++);
 assert.equal(f.api.order('shop','matcha'),true);assert.equal(f.greetings,1);assert.equal(f.api.order('shop','tofu'),false);assert.equal(typeof f.api.interact('shop'),'string');
 for(let i=0;i<12;i++)f.api.update(.1);assert.equal(f.api.stats.orders[0].phase,'served');
 const event=f.api.interact('shop').event;assert.equal(event.type,'food.collected');assert.equal(event.itemId,'matcha');assert.equal(f.api.stats.orders[0].collected,1);
 assert.equal(f.api.collect(event),true);assert.equal(f.collected,1);f.api.afterCamera(.01,{blocked:false});assert.equal(f.api.stats.held.carrying,true);
 f.api.afterCamera(.1,{blocked:true});assert.equal(f.api.preparationRoots.filter(g=>g.parent?.name==='A snack for the walk')[0].parent.visible,false);
 f.api.dispose();f.api.dispose();assert.equal(disposed,0);assert.equal(f.vendor.userData.interactable,f.original);assert.deepEqual(f.assembly.legacy.interactables,[f.vendor]);assert.equal(f.scene.children.length,1);f.geo.dispose();f.mat.dispose();
});
test('collecting a served item emits the food collection sound contract',()=>{
 const sounds=[],f=fixture(null,event=>sounds.push(event));
 assert.equal(f.api.collect({kind:'grill',itemId:'missing'}),false);assert.deepEqual(sounds,[]);
 assert.equal(f.api.order('shop','matcha'),true);for(let i=0;i<12;i++)f.api.update(.1);
 const event=f.api.interact('shop').event;assert.equal(event.type,'food.collected');assert.equal(f.api.collect(event),true);
 assert.equal(sounds.length,1);assert.equal(sounds[0].type,'food.collect');assert.equal(sounds[0].itemId,'matcha');assert.deepEqual(sounds[0].position,[0,1.7,1]);
 f.api.dispose();f.geo.dispose();f.mat.dispose();
});
function documentFixture(){
 const nodes=[],doc={body:{append(){}},defaultView:{addEventListener(){},removeEventListener(){}},querySelector(){return null;},createElement(tag){
  const listeners=new Map(),n={tag,children:[],open:false,hidden:false,listeners,setAttribute(){},append(...items){this.children.push(...items);},replaceChildren(){this.children=[];},querySelector(t){return this.children.find(c=>c.tag===t);},focus(){},blur(){},remove(){},addEventListener(t,f){listeners.set(t,f);},showModal(){this.open=true;},close(){this.open=false;listeners.get('close')?.();}};nodes.push(n);return n;
 }};return {doc,nodes};
}
test('closing or cancelling a food menu never places an order and preserves another input blocker',()=>{
 const d=documentFixture(),f=fixture(d.doc);assert.equal(f.api.open('shop'),true);assert.equal(f.api.active,true);assert.equal(f.pauses.at(-1),true);assert.equal(f.api.stats.orders[0].phase,'ready');
 const dialog=d.nodes.find(n=>n.tag==='dialog');f.blocked(true);let prevented=false;dialog.listeners.get('cancel')({preventDefault(){prevented=true;}});
 assert.equal(prevented,true);assert.equal(f.api.active,false);assert.equal(f.api.stats.orders[0].phase,'ready');assert.equal(f.pauses.at(-1),true);
 f.blocked(false);assert.equal(f.api.open('shop'),true);const choices=d.nodes.find(n=>n.className==='street-food-choices');choices.children[1].onclick();assert.equal(f.api.active,false);assert.equal(f.api.stats.orders[0].phase,'preparing');assert.equal(f.pauses.at(-1),false);f.api.dispose();f.geo.dispose();f.mat.dispose();
});
test('remote or blocked interactions cannot order or collect from a counter',()=>{
 const f=fixture();f.camera.position.x=20;assert.equal(f.api.order('shop','tofu'),false);assert.equal(f.api.interact('shop'),'');f.camera.position.x=0;f.blocked(true);assert.equal(f.api.order('shop','tofu'),false);f.api.dispose();f.geo.dispose();f.mat.dispose();
});

// Vendor roots are installed synchronously; their visual models can load later.
test('viewer installs vendor interaction owners before the food service is attached',async()=>{
 const {readFile}=await import('node:fs/promises');
 const source=await readFile(new URL('./viewer.mjs',import.meta.url),'utf8');
 const vendors=source.indexOf('const streetLife=installKeihanStreetLife('),service=source.indexOf('zen=installZenExperience(');
 assert.ok(vendors>=0&&vendors<service,'vendor roots must exist when the food service binds them');
 assert.equal(source.split('const streetLife=installKeihanStreetLife(').length,2,'one lifecycle owner');
});
