import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createZenWorldMoments} from './zen-world-moments.mjs';
import {createPaperMomentState} from './zen-paper-moments.mjs';
import {createAkiConversation} from './zen-story-people.mjs';
import {createProximityInteractions} from './proximity-interaction.mjs';

function documentFixture(){
 const nodes=[],doc={activeElement:null};
 function node(tag='div'){
  const listeners=new Map(),queries=new Map(),classes=new Set(),properties=new Map();
  const value={tag,children:[],hidden:false,open:false,disabled:false,textContent:'',
   classList:{add:name=>classes.add(name),remove:name=>classes.delete(name),contains:name=>classes.has(name),toggle(name,on){if(on)classes.add(name);else classes.delete(name);}},
   style:{setProperty:(key,v)=>properties.set(key,v),removeProperty:key=>properties.delete(key)},
   setAttribute(){},append(...items){this.children.push(...items);for(const item of items)item.parent=this;},replaceChildren(...items){this.children=[];this.append(...items);},
   querySelector(selector){if(!queries.has(selector))queries.set(selector,node());return queries.get(selector);},
   addEventListener(type,fn){const list=listeners.get(type)??[];list.push(fn);listeners.set(type,list);},removeEventListener(){},
   dispatch(type,event={}){event.type=type;event.preventDefault??=()=>{};for(const fn of listeners.get(type)??[])fn(event);},
   click(event={detail:0}){if(!this.disabled)this.onclick?.(event);},focus(){doc.activeElement=this;},blur(){doc.activeElement=null;},contains(other){return other===this||this.children.includes(other);},
   showModal(){this.open=true;},close(){this.open=false;this.dispatch('close');},remove(){this.parent?.children.splice(this.parent.children.indexOf(this),1);},setPointerCapture(){},getContext:()=>null
  };nodes.push(value);return value;
 }
 Object.assign(doc,{head:node('head'),body:node('body'),createElement:node,addEventListener(){},removeEventListener(){},getElementById:id=>nodes.find(n=>n.id===id)});return doc;
}

function fixture(){
 const scene=new THREE.Scene(),root=new THREE.Group();scene.add(root);
 const camera=new THREE.PerspectiveCamera();camera.position.set(-302,31.7,-184.9);camera.lookAt(-300.4,31,-184.9);
 const bench=new THREE.Mesh(new THREE.BoxGeometry(1.25,.48,3.8),new THREE.MeshStandardMaterial());bench.position.set(10,.24,0);
 const benchOwner=new THREE.Group();benchOwner.userData.zone='chaya_s';benchOwner.add(bench);root.add(benchOwner);
 bench.userData.interactable={title:'Original bench'};
 const model=new THREE.Group(),mesh=new THREE.Mesh(new THREE.BoxGeometry(.5,1.7,.3),new THREE.MeshStandardMaterial());model.add(mesh);
 const visitorRoot=new THREE.Group();visitorRoot.add(model);root.add(visitorRoot);
 const assembly={root,colliders:[],legacy:{interactables:[bench]},walkHeight:()=>30,isWalkable:()=>true,
  spatial:{byId:{yotsu:{target:[20,30,20],checkpoint:[20,30,20]}}},surfaces:{segments:[]},
  keihanStation:{built:true,spec:{platformFloor:30,publicExit:{position:[-302,30,-135]},route:{platformDoor:[-302,30,-182]},arrival:{platformPose:{position:[-302,31.7,-182],target:[-299,31.7,-182]}}}}};
 const shop={stats:{built:true,floor:30,front:{a:[40,30,20],b:[50,30,20],outward:[0,-1],inset:.42}}};
 const actions=[],seats=[],visitors={people:[{root:visitorRoot}],ready:Promise.resolve()};
 return {scene,camera,assembly,shop,visitors,actions,seats,bench,mesh,create:(options={})=>createZenWorldMoments({scene,camera,assembly,shop,visitors,onAction:e=>actions.push(e),onSeat:e=>seats.push(e),...options})};
}
function advance(runtime,start,duration,state={mode:'walk'}){for(let t=.1;t<=duration+.001;t+=.1)runtime.update(.1,start+t,state);}

test('tea requires pouring then lifting, and seated E actions cannot be farmed',async()=>{
 const f=fixture(),runtime=f.create();await runtime.ready;
 const tea=runtime.interactionRoots.find(o=>o.userData.zenMoment==='tea');
 assert.ok(tea);f.camera.position.copy(tea.position).add(new THREE.Vector3(0,1.4,1));
 assert.match(tea.userData.interactable.directAction(),/sit|seat/i);assert.equal(f.seats.length,1);
 assert.equal(f.actions.length,0);runtime.setSeated(true);
 assert.match(runtime.performTeaAction(),/pour/i);assert.equal(f.actions.length,0);
 runtime.update(.1,1,{mode:'walk'});assert.match(runtime.performTeaAction(),/settle|pour/i);
 advance(runtime,1,1.6);assert.match(runtime.performTeaAction(),/lift|sip/i);
 advance(runtime,3,2.2);assert.equal(f.actions.filter(e=>e.type==='tea').length,1);
 runtime.performTeaAction();runtime.update(.1,9,{mode:'walk'});assert.equal(f.actions.filter(e=>e.type==='tea').length,1);
 runtime.dispose();
});

test('a menu or hidden-tab pause does not finish an unattended sip',async()=>{
 const f=fixture(),runtime=f.create();await runtime.ready;const tea=runtime.interactionRoots.find(o=>o.userData.zenMoment==='tea');f.camera.position.copy(tea.position).add(new THREE.Vector3(0,1.4,1));tea.userData.interactable.directAction();runtime.setSeated(true);runtime.performTeaAction();advance(runtime,0,1.6);runtime.performTeaAction();
 runtime.update(.1,100,{blocked:true,mode:'walk'});runtime.update(.1,101,{blocked:false,mode:'walk'});assert.equal(f.actions.filter(e=>e.type==='tea').length,0);
 advance(runtime,101,2.1);assert.equal(f.actions.filter(e=>e.type==='tea').length,1);runtime.dispose();
});

test('standing during a sip returns the cup and preserves an unearned tea moment',async()=>{
 const f=fixture(),runtime=f.create();await runtime.ready;const tea=runtime.interactionRoots.find(o=>o.userData.zenMoment==='tea');f.camera.position.copy(tea.position).add(new THREE.Vector3(0,1.4,1));tea.userData.interactable.directAction();runtime.setSeated(true);runtime.performTeaAction();advance(runtime,0,1.6);runtime.performTeaAction();advance(runtime,2,.6);const cup=tea.getObjectByName('Tea cup · lift and return');assert.ok(cup.position.y>.735);
 runtime.setSeated(false);assert.equal(cup.position.y,.735);assert.equal(cup.rotation.z,0);advance(runtime,5,4);assert.equal(f.actions.filter(e=>e.type==='tea').length,0);runtime.dispose();
});

test('tea ware has a solid inward-facing cup interior and a smoothly sampled glazed pot within six draws',async()=>{
 const f=fixture(),runtime=f.create();await runtime.ready;const table=runtime.interactionRoots.find(o=>o.userData.zenMoment==='tea'),cup=table.getObjectByName('Tea cup · lift and return'),pot=table.getObjectByName('Small ceramic tea pot');table.updateWorldMatrix(true,true);
 const cupWare=cup.children.find(o=>o.isMesh&&o.material.name==='Quiet tea · glazed ceramic'),potWare=pot.children.find(o=>o.isMesh&&o.material.name==='Quiet tea · glazed ceramic');assert.ok(cupWare);assert.ok(potWare);assert.ok(cupWare.material.roughness>=.3&&cupWare.material.roughness<=.4);
 const origin=cup.localToWorld(new THREE.Vector3(0,.04,0)),side=new THREE.Vector3(1,0,0).applyQuaternion(cup.getWorldQuaternion(new THREE.Quaternion())),wall=new THREE.Raycaster(origin,side,0,.09).intersectObject(cupWare,false);assert.ok(wall.length,'an eye inside the empty cup sees the ceramic inner wall');
 const bottom=new THREE.Raycaster(origin,new THREE.Vector3(0,-1,0),0,.10).intersectObject(cupWare,false);assert.ok(bottom.length,'the cup has a closed ceramic floor');assert.ok(cup.worldToLocal(bottom[0].point.clone()).y>=.012);
 const positions=potWare.geometry.attributes.position,angles=new Set();for(let i=0;i<positions.count;i++)if(Math.abs(positions.getY(i)-.075)<1e-5&&Math.abs(Math.hypot(positions.getX(i),positions.getZ(i))-.095)<1e-5)angles.add(Math.round(Math.atan2(positions.getZ(i),positions.getX(i))*1e4));assert.ok(angles.size>=24,'the close-up pot silhouette has at least 24 angular samples');
 assert.ok(runtime.stats.tea.batches<=6);assert.equal(runtime.stats.tea.textures,0);assert.equal(runtime.stats.tea.lights,0);runtime.dispose();
});

test('all polished tea geometry and glaze materials release once without owning borrowed scene resources',async()=>{
 const f=fixture(),runtime=f.create();await runtime.ready;const table=runtime.interactionRoots.find(o=>o.userData.zenMoment==='tea'),geometries=new Set(),materials=new Set();table.traverse(o=>{if(o.isMesh){geometries.add(o.geometry);materials.add(o.material);}});let geometryDisposals=0,materialDisposals=0;for(const g of geometries)g.addEventListener('dispose',()=>geometryDisposals++);for(const m of materials)m.addEventListener('dispose',()=>materialDisposals++);runtime.dispose();runtime.dispose();assert.equal(geometryDisposals,geometries.size);assert.equal(materialDisposals,materials.size);
});

test('station cat responds to offering a hand before petting and rejects distant or blocked actions',async()=>{
 const f=fixture(),runtime=f.create();await runtime.ready;
 const cat=runtime.interactionRoots.find(o=>o.userData.zenMoment==='cat');assert.ok(cat);
 f.camera.position.set(0,31.7,0);cat.userData.interactable.directAction();assert.equal(f.actions.length,0);
 f.camera.position.copy(cat.position).add(new THREE.Vector3(-1,1,0));
 runtime.update(.1,1,{blocked:true,mode:'walk'});cat.userData.interactable.directAction();assert.equal(f.actions.length,0);
 runtime.update(.1,2,{blocked:false,mode:'walk'});assert.match(cat.userData.interactable.directAction(),/hand|sniff/i);assert.equal(f.actions.length,0);
 runtime.update(.1,4,{mode:'walk'});assert.match(cat.userData.interactable.directAction(),/purr|stroke/i);assert.equal(f.actions.filter(e=>e.type==='cat').length,1);
 cat.userData.interactable.directAction();assert.equal(f.actions.filter(e=>e.type==='cat').length,1);runtime.dispose();
});

test('Mugi rests on the accepted seat top and faces its open front',async()=>{
 const f=fixture(),runtime=f.create();await runtime.ready;const cat=runtime.interactionRoots.find(o=>o.userData.zenMoment==='cat');assert.deepEqual(cat.position.toArray(),[-300.4,30.54,-184.9]);assert.equal(cat.rotation.y,0);runtime.dispose();
});

test('Mugi recognizes a saved visit without bypassing proximity, pause or completion guards',async()=>{
 const f=fixture(),listeners=new Set(),journey={snapshot:()=>({moments:{cat:123}}),subscribe(fn){listeners.add(fn);return ()=>listeners.delete(fn);}},runtime=f.create({journey});await runtime.ready;
 const cat=runtime.interactionRoots.find(o=>o.userData.zenMoment==='cat');assert.equal(runtime.stats.cat.familiar,true);assert.match(cat.userData.interactable.prompt,/again|familiar/i);
 f.camera.position.set(0,31.7,0);assert.match(cat.userData.interactable.directAction(),/watches/i);assert.equal(f.actions.length,0);
 f.camera.position.copy(cat.position).add(new THREE.Vector3(-1,1.1,0));runtime.update(.1,1,{blocked:true,mode:'walk'});assert.match(cat.userData.interactable.directAction(),/watches/i);
 runtime.update(.1,2,{mode:'walk'});assert.match(cat.userData.interactable.directAction(),/remember|familiar|again/i);runtime.update(.1,4,{mode:'walk'});assert.match(cat.userData.interactable.directAction(),/purr|stroke/i);assert.equal(f.actions.filter(e=>e.type==='cat').length,0);
 runtime.dispose();assert.equal(listeners.size,0);
});

test('a saved cat encounter arriving through storage updates recognition without awarding another moment',async()=>{
 const f=fixture(),listeners=new Set(),journey={snapshot:()=>({moments:{}}),subscribe(fn){listeners.add(fn);return ()=>listeners.delete(fn);}},runtime=f.create({journey});await runtime.ready;assert.equal(runtime.stats.cat.familiar,false);
 for(const listener of listeners)listener({moments:{cat:123}});assert.equal(runtime.stats.cat.familiar,true);assert.equal(f.actions.length,0);runtime.dispose();assert.equal(listeners.size,0);
});

test('successful repeat pets signal feedback while the cat achievement remains one-time',async()=>{
 const f=fixture(),runtime=f.create();await runtime.ready;const cat=runtime.interactionRoots.find(o=>o.userData.zenMoment==='cat');f.camera.position.copy(cat.position).add(new THREE.Vector3(-1,1.1,0));runtime.update(.1,1,{mode:'walk'});cat.userData.interactable.directAction();runtime.update(.1,2,{mode:'walk'});cat.userData.interactable.directAction();
 assert.equal(f.actions.filter(e=>e.type==='cat').length,1);assert.equal(f.actions.filter(e=>e.type==='cat.pet').length,1);
 runtime.update(.1,2.2,{mode:'walk'});cat.userData.interactable.directAction();assert.equal(f.actions.filter(e=>e.type==='cat.pet').length,1);runtime.update(.1,3,{mode:'walk'});cat.userData.interactable.directAction();assert.equal(f.actions.filter(e=>e.type==='cat.pet').length,2);assert.equal(f.actions.filter(e=>e.type==='cat').length,1);runtime.dispose();
});

test('paper moments need a completed unfold and a held stamp gesture',()=>{
 const events=[],state=createPaperMomentState(e=>events.push(e));
 state.open('map',0);state.update(2);assert.equal(events.length,0);
 state.unfold(2);state.update(2.2);assert.equal(events.length,0);state.update(3);assert.equal(events[0].type,'map');
 state.open('postcard',4);state.beginStamp(4);assert.equal(state.finishStamp(4.2),false);assert.equal(events.length,1);
 state.beginStamp(5);assert.equal(state.finishStamp(5.8),true);assert.equal(events[1].type,'postcard');
 state.beginStamp(6);state.finishStamp(7);assert.equal(events.length,2);state.close();assert.equal(state.active,false);
});

test('saved map and postcard remain unfolded and stamped on a later visit',()=>{
 const events=[],state=createPaperMomentState(e=>events.push(e));state.seedJourney({moments:{map:10,postcard:11}});state.open('map');assert.equal(state.unfolded,true);assert.equal(state.unfold(3),false);state.open('postcard');assert.equal(state.stamped,true);assert.equal(state.beginStamp(4),false);assert.equal(events.length,0);
});

test('Aki needs a reply and farewell before an encounter is recorded; repeated conversations remain available',()=>{
 const events=[],conversation=createAkiConversation(e=>events.push(e));
 conversation.open('station');assert.equal(conversation.finish(),false);assert.equal(events.length,0);
 assert.equal(conversation.respond(99),false);assert.equal(conversation.finish(),false);
 assert.equal(conversation.respond(0),true);assert.equal(conversation.finish(),true);assert.equal(events[0].type,'meetstation');
 conversation.open('station');conversation.respond(1);assert.equal(conversation.finish(),false);assert.equal(events.length,1);
 conversation.open('view');conversation.respond(1);conversation.finish();assert.equal(events[1].type,'meetview');
});

test('Aki remembers the separate encounter and Kyoto-photo progress while allowing conversations to be revisited',()=>{
 const events=[],conversation=createAkiConversation(e=>events.push(e));conversation.seedJourney({moments:{aki:10},photoPrompts:{'kyoto-view':20},story:{stage:2}});
 assert.equal(conversation.hasMet('station'),true);assert.equal(conversation.hasMet('view'),true);conversation.open('station');assert.equal(conversation.respond(1),true);assert.equal(conversation.finish(),false);assert.equal(events.length,0);
 conversation.open('return');conversation.respond(0);conversation.finish();assert.equal(events[0].type,'meetreturn');
});

test('a stamped postcard alone does not claim a previous conversation with Aki',()=>{
 const conversation=createAkiConversation();conversation.seedJourney({moments:{postcard:10},story:{stage:2}});assert.equal(conversation.hasMet('station'),false);assert.equal(conversation.hasMet('view'),false);
});

test('all prompted world actions accept the same elevated reach point and strict boundary as walking',async()=>{
 for(const kind of ['tea','seat','cat','map','postcard','aki']){
  const f=fixture(),doc=documentFixture(),runtime=f.create({document:doc});await runtime.ready;const owner=runtime.interactionRoots.find(o=>o.userData.zenMoment===kind);assert.ok(owner,kind);
  const point=owner.getWorldPosition(new THREE.Vector3());point.y+=1.1;f.camera.position.copy(point).add(new THREE.Vector3(2.4,0,0));f.camera.lookAt(point);runtime.update(0,1,{mode:'walk'});
  const interactions=createProximityInteractions({targets:[owner],camera:f.camera});assert.equal(interactions.find(),owner,`${kind} shows the prompt`);const result=interactions.run();assert.ok(result,kind);
  if(kind==='tea'||kind==='seat')assert.equal(f.seats.length,1,`${kind} accepts its prompt`);else if(kind==='cat')assert.match(result.message,/hand|sniff/);else assert.equal(runtime.active,true,`${kind} opens its activity`);
  runtime.dispose();
 }
});

test('world actions reject the exact reach boundary whenever walking hides their prompt',async()=>{
 for(const kind of ['tea','seat','cat','map','postcard','aki']){
  const f=fixture(),runtime=f.create({document:documentFixture()});await runtime.ready;const owner=runtime.interactionRoots.find(o=>o.userData.zenMoment===kind),point=owner.getWorldPosition(new THREE.Vector3());point.y+=1.1;f.camera.position.copy(point).add(new THREE.Vector3(2.5,0,0));f.camera.lookAt(point);runtime.update(0,1,{mode:'walk'});
  assert.equal(createProximityInteractions({targets:[owner],camera:f.camera}).find(),null,kind);owner.userData.interactable.directAction();assert.equal(f.seats.length,0,kind);assert.equal(f.actions.length,0,kind);assert.equal(runtime.active,false,kind);runtime.dispose();
 }
});

test('a standard accessible click animates exactly one postcard stamp',async()=>{
 const f=fixture(),doc=documentFixture(),runtime=f.create({document:doc});await runtime.ready;const owner=runtime.interactionRoots.find(o=>o.userData.zenMoment==='postcard');f.camera.position.copy(owner.position).add(new THREE.Vector3(0,1.1,1));owner.userData.interactable.directAction();const dialog=doc.getElementById('zen-paper'),button=dialog.querySelector('[data-paper-action]');
 button.click({detail:0});assert.equal(f.actions.length,0);runtime.update(.1,.3,{mode:'walk'});assert.equal(f.actions.length,0);runtime.update(.1,.8,{mode:'walk'});assert.equal(f.actions.filter(e=>e.type==='postcard').length,1);button.click({detail:0});runtime.update(.1,2,{mode:'walk'});assert.equal(f.actions.filter(e=>e.type==='postcard').length,1);runtime.dispose();
});

test('pointer hold has no duplicate click award and closing or cancelling clears pressing visuals',async()=>{
 const f=fixture(),doc=documentFixture(),runtime=f.create({document:doc});await runtime.ready;const owner=runtime.interactionRoots.find(o=>o.userData.zenMoment==='postcard');f.camera.position.copy(owner.position).add(new THREE.Vector3(0,1.1,1));owner.userData.interactable.directAction();const dialog=doc.getElementById('zen-paper'),button=dialog.querySelector('[data-paper-action]'),paper=dialog.querySelector('[data-paper-object]');
 button.dispatch('pointerdown',{pointerId:1});assert.equal(paper.classList.contains('is-pressing'),true);dialog.dispatch('cancel');assert.equal(paper.classList.contains('is-pressing'),false);runtime.update(.1,1,{mode:'walk'});assert.equal(f.actions.length,0);
 owner.userData.interactable.directAction();button.dispatch('pointerdown',{pointerId:2});button.dispatch('pointercancel');assert.equal(paper.classList.contains('is-pressing'),false);assert.equal(f.actions.length,0);
 button.dispatch('pointerdown',{pointerId:3});runtime.update(.1,1.8,{mode:'walk'});button.dispatch('pointerup');button.click({detail:1});assert.equal(f.actions.filter(e=>e.type==='postcard').length,1);runtime.update(.1,3,{mode:'walk'});assert.equal(f.actions.filter(e=>e.type==='postcard').length,1);runtime.dispose();
});

test('owned runtime unregisters actions and preserves borrowed bench/model resources on repeated disposal',async()=>{
 const f=fixture(),old=f.bench.userData.interactable,runtime=f.create();await runtime.ready;
 let disposedGeometry=0,disposedMaterial=0;f.mesh.geometry.addEventListener('dispose',()=>disposedGeometry++);f.mesh.material.addEventListener('dispose',()=>disposedMaterial++);
 assert.ok(runtime.stats.loadedModels>0);assert.ok(runtime.interactionRoots.every(o=>(o.userData.interactable?.reach??2.8)<=2.5));
 runtime.dispose();runtime.dispose();assert.deepEqual(f.assembly.legacy.interactables,[f.bench]);assert.equal(f.bench.userData.interactable,old);
 assert.equal(disposedGeometry,0);assert.equal(disposedMaterial,0);assert.equal(f.bench.parent?.userData.zone,'chaya_s');
});
