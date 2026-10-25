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
 assert.ok(r.stats.triangles<22000,JSON.stringify(r.stats));assert.ok(r.stats.drawBatches<=43,JSON.stringify(r.stats));
 let lights=0;r.group.traverse(o=>{if(o.isLight)lights++;if(o.isMesh)assert.ok([...o.geometry.attributes.position.array].every(Number.isFinite));});assert.equal(lights,0);
 assert.equal(installKeihanStreetCommerce(a),r);assert.equal(a.legacy.interactables.length,4);assert.equal(a.colliders.length,before+2);
});

test('direct machine interaction dispenses and collects with a live proximity prompt',()=>{
 const machine=installKeihanStreetCommerce(fixture()).machines[0],data=machine.group.userData.interactable;
 assert.equal(data.prompt,'Get a drink');assert.equal(data.proximity,true);
 data.directAction();assert.equal(machine.can.visible,true);assert.equal(data.prompt,'Collect drink');
 assert.match(data.directAction(),/Green tea collected/);assert.equal(machine.can.visible,false);
 assert.equal(machine.controller.state.selected,1);assert.equal(data.prompt,'Get a drink');
 data.directAction();assert.equal(machine.can.material.color.getHexString(),new THREE.Color(STREET_DRINKS[1].color).getHexString());
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
 actions[1].run();assert.equal(m.can.visible,true);assert.equal(m.can.material.color.getHexString(),new THREE.Color(STREET_DRINKS[1].color).getHexString());actions[2].run();assert.equal(m.can.visible,false);
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
