import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from 'three';
import {heightAt} from '../geography/geo-core.mjs';
import {makePathSurfaces} from './path-surfaces.mjs';
import {buildKeihanFrontages} from './keihan-frontages.mjs';
import {createDrinkMachineState,installKeihanStreetCommerce,planKeihanCommerce,STREET_DRINKS} from './keihan-street-commerce.mjs';
import {SpatialCollisionWorld} from './collision.mjs';
const features=JSON.parse(readFileSync(new URL('../geography/features.json',import.meta.url))),terrain=JSON.parse(readFileSync(new URL('../geography/terrain.json',import.meta.url)));
function fixture(){const root=new THREE.Group(),colliders=[],surfaces=makePathSurfaces(features,(x,z)=>heightAt(terrain,x,z)),frontages=buildKeihanFrontages(root,features,surfaces,{},colliders);return {root,colliders,legacy:{interactables:[]},keihanFrontages:frontages,keihanStation:{spec:{platformFloor:31.039095}},walkHeight:(x,z)=>frontages.surfaceHeight(x,z)??surfaces.height(x,z)};}

test('drink selection requires collection before another dispense and has bounded product selection',()=>{
 const changed=[],c=createDrinkMachineState(s=>changed.push({...s}));
 assert.match(c.collect(),/first/);assert.equal(c.state.collected,0);
 for(let i=0;i<9;i++)c.select();assert.equal(c.state.selected,1);
 assert.match(c.dispense(),/Water/);assert.equal(c.state.phase,'dispensed');
 assert.match(c.select(),/Collect/);assert.equal(c.state.selected,1);assert.match(c.dispense(),/already/);
 assert.match(c.collect(),/Water collected/);assert.equal(c.state.phase,'ready');assert.equal(c.state.collected,1);
 assert.match(c.dispense(),/Water/);assert.equal(changed.length,12);assert.equal(STREET_DRINKS.length,4);
});

test('four supported machines and three counter groups are batched without lights; installing twice is inert',()=>{
 const a=fixture(),before=a.colliders.length,r=installKeihanStreetCommerce(a);
 assert.equal(r.built,true);assert.equal(r.machines.length,4);assert.equal(r.detailGroups.length,7);
 assert.equal(r.stats.collidersAdded,2);assert.equal(a.colliders.length,before+2);assert.equal(a.legacy.interactables.length,4);
 assert.ok(r.stats.triangles<30000,JSON.stringify(r.stats));assert.ok(r.stats.drawBatches<=47,JSON.stringify(r.stats));
 let lights=0;r.group.traverse(o=>{if(o.isLight)lights++;if(o.isMesh)assert.ok([...o.geometry.attributes.position.array].every(Number.isFinite));});assert.equal(lights,0);
 assert.equal(installKeihanStreetCommerce(a),r);assert.equal(a.legacy.interactables.length,4);assert.equal(a.colliders.length,before+2);
});

test('machine paint, single-pane glass and beveled shells share finishes without changing counter materials',()=>{
 const a=fixture(),r=installKeihanStreetCommerce(a),paint=new Set(),glass=new Set();
 for(const machine of r.machines){
  const color=machine.group.children.find(o=>o.name===machine.spec.id+' · color');
  const pane=machine.group.children.find(o=>o.name===machine.spec.id+' · glass');
  assert.ok(color.material.isMeshPhysicalMaterial);assert.ok(pane);paint.add(color.material);glass.add(pane.material);
  assert.equal(pane.geometry.attributes.position.count,6,'one glazing quad per cabinet');assert.equal(pane.castShadow,false);
  assert.equal(pane.material.transparent,true);assert.equal(pane.material.depthWrite,false);assert.equal(pane.material.transmission,0);assert.ok(pane.material.opacity<=.10);
  const n=color.geometry.attributes.normal;
  assert.ok(Array.from({length:n.count},(_,i)=>i).some(i=>Math.abs(n.getX(i))>.05&&Math.abs(n.getY(i))>.05&&Math.abs(n.getZ(i))>.05),'three-axis corner normals prove a rounded cabinet, rather than another flat box');
  const p=machine.group.children.find(o=>o.name===machine.spec.id+' · dark').geometry.attributes.position;let slotFront=-Infinity;
  for(let i=0;i<p.count;i++)if(p.getX(i)>.405&&p.getX(i)<.462&&Math.abs(p.getY(i)-1.122)<.005)slotFront=Math.max(slotFront,p.getZ(i));
  assert.ok(slotFront>.419,'the coin aperture must remain in front of its moved metal escutcheon');
 }
 assert.equal(paint.size,1);assert.equal(glass.size,1);
 for(const owner of r.detailGroups.filter(g=>g.name.startsWith('Counter details'))){
  const color=owner.children.find(o=>o.name===owner.name+' · color');assert.equal(Boolean(color.material.isMeshPhysicalMaterial),false);assert.equal(color.material.roughness,.64);
 }
 const platform=r.machines.filter(m=>m.spec.existingCollider);assert.equal(platform.length,2);
 for(const m of platform){const color=new THREE.Color(m.spec.color);assert.ok(color.b>color.r,'photographed platform navy replaces the former red/white placeholder palette');}
});

test('one product atlas labels the physical drinks and is shared across all machines',()=>{
 const previous=Object.getOwnPropertyDescriptor(globalThis,'document'),printed=[];
 const context=new Proxy({},{get:(_,key)=>key==='fillText'?(value)=>printed.push(value):()=>{},set:()=>true});
 const canvas={width:0,height:0,getContext:()=>context};globalThis.document={createElement:()=>canvas};
 try{
  const assembly={root:new THREE.Group(),colliders:[],legacy:{interactables:[]},keihanStation:{spec:{platformFloor:31}}};
  const r=installKeihanStreetCommerce(assembly),names=['Oi Ocha','おいしい水','BOSS','Sparkling'];
  assert.deepEqual(printed.filter(v=>names.includes(v)),names,'one original label per drink, reused on the physical containers');
  assert.equal(r.stats.textureAtlases,2);const maps=new Set();
  for(const m of r.machines){const print=m.group.children.find(o=>o.name===m.spec.id+' · print'),labels=m.group.children.find(o=>o.name===m.spec.id+' · drinkLabel');maps.add(labels.material.map);assert.ok(print.material.alphaTest>0);}
  assert.equal(maps.size,1);assert.equal([...maps][0].image.width,1024);assert.equal([...maps][0].image.height,512);
  assert.strictEqual(r.createDrink('water').children.find(o=>o.name==='drinkLabel').material.map,[...maps][0]);r.dispose();
 }finally{if(previous)Object.defineProperty(globalThis,'document',previous);else delete globalThis.document;}
});

test('direct machine interaction dispenses and collects with a live proximity prompt',()=>{
 const machine=installKeihanStreetCommerce(fixture()).machines[0],data=machine.group.userData.interactable;
 assert.equal(data.prompt,'Get a drink');assert.equal(data.proximity,true);
 data.directAction();assert.equal(machine.can.visible,true);assert.equal(data.prompt,'Collect drink');
 assert.match(data.directAction().message,/Green tea collected/);assert.equal(machine.can.visible,false);
 assert.equal(machine.controller.state.selected,1);assert.equal(data.prompt,'Get a drink');
 data.directAction();assert.equal(machine.can.children.find(child=>child.visible).userData.productId,STREET_DRINKS[1].id);
});

test('platform machines preserve original equipment clearance and all cabinets meet their support',()=>{
 const a=fixture(),r=installKeihanStreetCommerce(a);a.root.updateMatrixWorld(true);
 for(const m of r.machines){const b=new THREE.Box3().setFromObject(m.group),size=b.getSize(new THREE.Vector3());assert.ok(Math.abs(b.min.y-m.spec.position[1])<1e-6);assert.ok(size.y<=1.850001);
  if(m.spec.existingCollider){assert.ok(size.x<=.78);assert.ok(size.z<=1.14);assert.equal(m.spec.position[1],a.keihanStation.spec.platformFloor);}
  else{const s=a.keihanFrontages.storefronts.find(s=>m.spec.id.startsWith(s.id));assert.ok(s.machineRecess);const p=m.spec.position,base=s.points[s.edge],v=(p[0]-base[0])*s.n[0]+(p[2]-base[2])*s.n[1];assert.ok(v<-.4);assert.equal(a.keihanFrontages.surfaceHeight(p[0],p[2]),p[1]);}
 }
});

test('ray hits resolve to the machine ancestor and actions update visible selection and tray',()=>{
 const a=fixture(),r=installKeihanStreetCommerce(a),m=r.machines[0];a.root.updateMatrixWorld(true);
 const eye=new THREE.Vector3(m.spec.position[0]-2,m.spec.position[1]+1.3,m.spec.position[2]),ray=new THREE.Raycaster(eye,new THREE.Vector3(1,0,0),0,3),hit=ray.intersectObjects(a.legacy.interactables,true)[0];assert.ok(hit);
 let target=hit.object;while(target&&!target.userData.interactable)target=target.parent;assert.equal(target,m.group);
 const actions=target.userData.interactable.actions;assert.equal(actions.length,3);actions[0].run();assert.equal(m.controller.state.selected,1);assert.ok(Math.abs(m.lamp.position.x-(-.252))<1e-6);
 actions[1].run();assert.equal(m.can.visible,true);assert.equal(m.can.children.find(child=>child.visible).userData.productId,STREET_DRINKS[1].id);actions[2].run();assert.equal(m.can.visible,false);
});

test('new street colliders preserve the mapped centerline and one-metre lateral lanes',()=>{
 const a=fixture();installKeihanStreetCommerce(a);const world=new SpatialCollisionWorld();for(const c of a.colliders)world.addBox(...c.args);let count=0;
 for(const path of features.paths.filter(p=>['way/946510942','way/79699849'].includes(p.id)))for(let i=1;i<path.points.length;i++){const p=path.points[i-1],q=path.points[i],dx=q[0]-p[0],dz=q[2]-p[2],len=Math.hypot(dx,dz),steps=Math.ceil(len/.2);for(let j=0;j<=steps;j++)for(const side of [-1,0,1]){const x=p[0]+dx*j/steps-dz/len*side,z=p[2]+dz*j/steps+dx/len*side,result=world.resolvePlayer(x,a.walkHeight(x,z)+1.7,z);assert.ok(Math.hypot(result.x-x,result.z-z)<1e-7);count++;}}
 assert.ok(count>1500);
});

test('vendor reservations stay behind counters and machine placement requires a registered recess',()=>{
 const a=fixture(),p=planKeihanCommerce(a);assert.equal(p.vendorStations.length,3);for(const v of p.vendorStations){const s=a.keihanFrontages.storefronts.find(s=>s.id===v.id),base=s.points[s.edge],depth=(v.position[0]-base[0])*s.n[0]+(v.position[2]-base[2])*s.n[1];assert.ok(Math.abs(depth+1.12)<1e-6);assert.equal(v.position[1],s.floor);}
 for(const s of a.keihanFrontages.storefronts)delete s.machineRecess;assert.equal(planKeihanCommerce(a).machines.length,2);
 assert.equal(installKeihanStreetCommerce({root:new THREE.Group()}).built,false);
});

test('food service sites expose reachable public anchors separately from staff and counter positions',()=>{
 const a=fixture(),plan=planKeihanCommerce(a),runtime=installKeihanStreetCommerce(a),world=new SpatialCollisionWorld();
 for(const collider of a.colliders)world.addBox(...collider.args);
 assert.equal(plan.sites.length,3);assert.deepEqual(runtime.sites,plan.sites);
 assert.deepEqual(plan.sites.map(site=>site.kind).sort(),['grill','senbei','soft-serve']);
 for(const site of plan.sites){
  const shop=a.keihanFrontages.storefronts.find(s=>s.id===site.id),base=shop.points[shop.edge];
  const depth=p=>(p[0]-base[0])*shop.n[0]+(p[2]-base[2])*shop.n[1];
  assert.ok(depth(site.position)>0&&depth(site.vendorPosition)<-1,'customer and attendant occupy opposite sides of the frontage');
  assert.ok(depth(site.counterPosition)<0);
  a.root.updateWorldMatrix(true,true);
  const origin=new THREE.Vector3(...site.counterPosition).add(new THREE.Vector3(0,.015,0));
  const hits=new THREE.Raycaster(origin,new THREE.Vector3(0,-1,0),0,.04).intersectObject(a.keihanFrontages.group,true);
  assert.ok(hits.some(hit=>Math.abs(hit.point.y-site.counterPosition[1])<.015),`${site.id} serving rests on its actual counter`);
  const [x,y,z]=site.position,resolved=world.resolvePlayer(x,y+1.7,z);
  assert.ok(Math.hypot(resolved.x-x,resolved.z-z)<1e-7,`${site.id} customer position is unobstructed`);
 }
 runtime.dispose();
});

test('registered food counters remain available when no vending machine location is supported',()=>{
 const a=fixture();delete a.keihanStation;
 for(const shop of a.keihanFrontages.storefronts)delete shop.machineRecess;
 const runtime=installKeihanStreetCommerce(a);
 assert.equal(runtime.built,true);assert.equal(runtime.machines.length,0);assert.equal(runtime.sites.length,3);
 assert.ok(runtime.createServing('grill','dango'));runtime.dispose();
});

test('served food has recognizable bounded forms and borrows cached geometry until commerce disposal',()=>{
 const runtime=installKeihanStreetCommerce(fixture());
 for(const [kind,item] of [['senbei','fox-senbei'],['soft-serve','tofu'],['soft-serve','matcha'],['grill','dango']]){
  const one=runtime.createServing(kind,item),two=runtime.createServing(kind,item);
  assert.notStrictEqual(one,two);assert.ok(one.isGroup&&two.isGroup);
  assert.ok(one.children.length>=1&&one.children.length<=4);
  assert.equal(one.children.length,two.children.length);
  const meshes=[],otherMeshes=[];one.traverse(o=>{if(o.isMesh)meshes.push(o);});two.traverse(o=>{if(o.isMesh)otherMeshes.push(o);});
  assert.equal(meshes.length,otherMeshes.length);
  for(let i=0;i<meshes.length;i++){
   assert.strictEqual(meshes[i].geometry,otherMeshes[i].geometry);
   assert.strictEqual(meshes[i].material,otherMeshes[i].material);
   const geometry=meshes[i].geometry;
   for(const key of ['position','normal','uv'])assert.ok(geometry.attributes[key]);
   for(const value of geometry.attributes.uv.array)assert.ok(Number.isFinite(value));
  }
  const box=new THREE.Box3().setFromObject(one),size=box.getSize(new THREE.Vector3());
  assert.ok(Math.abs(box.min.y)<1e-5,`${item} has a supporting base`);
  assert.ok(size.x<.18&&size.z<.18&&size.y<.25,`${item} fits the hand and service counter`);
  assert.ok(meshes.reduce((n,m)=>n+m.geometry.attributes.position.count,0)>150,`${item} has modeled food rather than a printed box`);
 }
 assert.equal(runtime.createServing('grill','matcha'),null);
 const serving=runtime.createServing('grill','dango');let geometry;serving.traverse(o=>{if(o.isMesh&&!geometry)geometry=o.geometry;});
 let disposed=0;geometry.addEventListener('dispose',()=>disposed++);
 runtime.dispose();runtime.dispose();assert.equal(disposed,1,'commerce owns the shared serving geometry');
});

test('commerce disposal releases its own shared resources once and removes only its interaction and collider owners',()=>{
 const a=fixture(),existingColliders=[...a.colliders],other=new THREE.Group();a.legacy.interactables.push(other);
 const r=installKeihanStreetCommerce(a),geometries=new Set(),materials=new Set(),maps=new Set();
 r.group.traverse(o=>{if(o.isMesh){geometries.add(o.geometry);materials.add(o.material);if(o.material.map)maps.add(o.material.map);}});
 let releasedGeometry=0,releasedMaterials=0,releasedTextures=0;
 for(const g of geometries)g.addEventListener('dispose',()=>releasedGeometry++);
 for(const m of materials)m.addEventListener('dispose',()=>releasedMaterials++);
 for(const t of maps)t.addEventListener('dispose',()=>releasedTextures++);
 assert.equal(typeof r.dispose,'function');r.dispose();r.dispose();r.update(new THREE.PerspectiveCamera(),3);
 assert.equal(r.group.parent,null);assert.equal(a.root.getObjectByName('Keihan commerce r104'),undefined);
 assert.deepEqual(a.legacy.interactables,[other]);assert.equal(a.colliders.length,existingColliders.length);assert.ok(a.colliders.every((c,i)=>c===existingColliders[i]));
 assert.equal(releasedGeometry,geometries.size);assert.equal(releasedMaterials,materials.size);assert.equal(releasedTextures,maps.size);assert.equal(maps.size,2);
});

test('only a collected drink produces a carried-drink completion event',async()=>{
 const {createDrinkCollectionAction,createDrinkMachineState}=await import('./keihan-street-commerce.mjs');const controller=createDrinkMachineState(),act=createDrinkCollectionAction(controller,'station-machine');
 assert.equal(typeof act(),'string');const collected=act();assert.equal(collected.event.type,'drink.collected');assert.equal(collected.event.drink,'Green tea');assert.equal(collected.event.machineId,'station-machine');assert.equal(controller.state.collected,1);assert.equal(typeof act(),'string');assert.equal(controller.state.collected,1);
});

test('each collected product uses its selected physical model through the machine and shared factory',()=>{
 const runtime=installKeihanStreetCommerce(fixture()),machine=runtime.machines[0],action=machine.group.userData.interactable.directAction;
 for(const product of STREET_DRINKS){
  assert.equal(machine.controller.state.selected,STREET_DRINKS.indexOf(product));
  action();assert.equal(machine.can.visible,true);
  const shown=machine.can.children.filter(child=>child.visible);
  assert.equal(shown.length,1);assert.equal(shown[0].userData.productId,product.id);
  const carried=runtime.createDrink(product.id);assert.equal(carried.userData.productId,product.id);
  assert.equal(carried.children.length,shown[0].children.length);
  for(let i=0;i<carried.children.length;i++){assert.strictEqual(carried.children[i].geometry,shown[0].children[i].geometry);assert.strictEqual(carried.children[i].material,shown[0].children[i].material);}
  const result=action();assert.equal(result.event.productId,product.id);assert.equal(machine.can.visible,false);
 }
 assert.equal(runtime.createDrink('unknown'),null);runtime.dispose();
});

test('served food changes visible portions after bites without allocating or disposing geometry',()=>{
 const runtime=installKeihanStreetCommerce(fixture());
 for(const [kind,item,bites] of [['senbei','fox-senbei',2],['soft-serve','tofu',3],['grill','dango',3]]){
  const serving=runtime.createServing(kind,item),other=runtime.createServing(kind,item);
  assert.equal(serving.userData.bites,bites);assert.equal(typeof serving.userData.setBitesRemaining,'function');
  const nodes=[];serving.traverse(o=>{if(o.isMesh)nodes.push(o);});
  const geometries=nodes.map(o=>o.geometry),before=serving.children.filter(part=>part.visible&&part.userData.stage>0).length;
  for(let remaining=bites-1;remaining>=0;remaining--){serving.userData.setBitesRemaining(remaining);assert.equal(serving.children.filter(part=>part.visible&&part.userData.stage>0).length,kind==='senbei'?Math.min(1,remaining):remaining);}
  const after=serving.children.filter(part=>part.visible&&part.userData.stage>0).length;
  assert.equal(before,kind==='senbei'?1:bites);assert.equal(after,0,'all edible portions disappear while their support remains');
  assert.equal(serving.userData.preparationRoots.length,bites+1);assert.ok(serving.children[0].visible);
  assert.deepEqual(nodes.map(o=>o.geometry),geometries);assert.ok(other.children.some(child=>child.visible),'a separate serving is unaffected');
  serving.userData.setBitesRemaining(bites);assert.equal(serving.children.filter(part=>part.visible&&part.userData.stage>0).length,kind==='senbei'?1:bites);
 }
 runtime.dispose();
});
