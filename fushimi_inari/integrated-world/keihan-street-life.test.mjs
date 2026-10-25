import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {planKeihanStreetLife,streetPersonClearance,streetPersonVisible,installKeihanStreetLife,poseStreetVendor,bindStreetPersonRig} from './keihan-street-life.mjs';
import {resetVisitorRig,captureVisitorPose} from './visitor-rig.mjs';
import {heightAt} from '../geography/geo-core.mjs';
import {makePathSurfaces} from './path-surfaces.mjs';

const patrol=[['test-street','mapped-street',-280,-100]];
const makeAssembly=()=>({root:new THREE.Group(),colliders:[],walkHeight:()=>2,isWalkable:()=>true,
 surfaces:{segments:[{id:'mapped-street',a:[-290,2,-100],b:[-270,2,-100],distance:0,width:4,kind:'street'}]}});

test('three extra walkers use separate clear portions of existing mapped streets',()=>{
 const features=JSON.parse(fs.readFileSync(new URL('../geography/features.json',import.meta.url))),terrain=JSON.parse(fs.readFileSync(new URL('../geography/terrain.json',import.meta.url)));
 const surfaces=makePathSurfaces(features,(x,z)=>heightAt(terrain,x,z));
 const assembly={root:new THREE.Group(),colliders:[],surfaces,walkHeight:(x,z)=>surfaces.height(x,z)};
 const plan=planKeihanStreetLife(assembly),extras=plan.routes.filter(r=>['west-food-street-arrival','hommachi-between','hommachi-south-rest'].includes(r.zone));
 assert.equal(extras.length,3);
 for(const route of extras)for(const other of plan.routes){
  if(route===other)continue;
  const minimum=Math.min(...route.points.flatMap(a=>other.points.map(b=>Math.hypot(a[0]-b[0],a[2]-b[2]))));
  assert.ok(minimum>1.4,`${route.zone} overlaps ${other.zone}`);
 }
 const blocked=extras[0].center;assembly.colliders.push({type:'box',args:[blocked[0],blocked[2],12,12,0,blocked[1]-1,blocked[1]+3]});
 assert.ok(!planKeihanStreetLife(assembly).routes.some(r=>r.zone===extras[0].zone),'Obstructed extra route must fail closed');
});

test('street routes preserve public support, offsets and sampled capsule clearance',()=>{
 const assembly=makeAssembly();assembly.walkHeight=x=>2+(x+290)*.03;
 const plan=planKeihanStreetLife(assembly,patrol);assert.equal(plan.routes.length,1);
 const route=plan.routes[0];assert.ok(Math.abs(route.offset)>.5);
 for(const [i,p]of route.points.entries()){
  assert.ok(Math.abs(p[1]-assembly.walkHeight(p[0],p[2]))<1e-9);
  assert.ok(Math.abs(p[2]+100)+.36<2);
  if(i)assert.ok(Math.hypot(p[0]-route.points[i-1][0],p[2]-route.points[i-1][2])<=.201);
 }
 assembly.colliders=[{type:'box',args:[-280,-100,10,2,0,0,6]}];
 assert.equal(planKeihanStreetLife(assembly,patrol).routes.length,0);
});

test('patrols fail closed on unsupported, steep, private or disconnected surfaces and railway corridor',()=>{
 for(const mutate of [
  a=>a.isWalkable=()=>false,
  a=>a.walkHeight=x=>x+290,
  a=>a.surfaces.segments[0].kind='restricted',
  a=>a.surfaces.segments[0].stair=true,
  a=>a.surfaces.segments=[{id:'mapped-street',a:[-284,2,-100],b:[-281,2,-100],distance:0,width:4},{id:'mapped-street',a:[-279,2,-100],b:[-276,2,-100],distance:5,width:4}],
 ]){const a=makeAssembly();mutate(a);assert.equal(planKeihanStreetLife(a,patrol).routes.length,0);}
 const rail=makeAssembly();rail.surfaces.segments[0].a[0]=-215;rail.surfaces.segments[0].b[0]=-195;
 assert.equal(planKeihanStreetLife(rail,[['rail','mapped-street',-205,-100]]).routes.length,0);
});

test('staff stands on shop floor behind counter; moving a wall into its recess omits the attendant',()=>{
 const a=makeAssembly();a.keihanFrontages={storefronts:[{id:'store',kind:'grill',width:4,edge:0,points:[[-282,2,-100]],t:[1,0],n:[0,1],floor:3.2}]};
 a.colliders=[{type:'box',args:[-280,-101.43,2,.07,0,3.2,6]},{type:'box',args:[-280,-100.47,1.8,.4,0,3.2,4.3]}];
 const p=planKeihanStreetLife(a,[]);assert.equal(p.vendors.length,1);assert.equal(p.vendors[0].y,3.2);assert.ok(Math.abs(p.vendors[0].z+101.12)<1e-9);
 a.colliders.push({type:'cylinder',args:[-280,-101.12,.3,3.2,5.2]});
 assert.equal(planKeihanStreetLife(a,[]).vendors.length,0);
 assert.equal(streetPersonClearance(a)(-280,-101.12,.2,3.2),false);
});

test('distance hysteresis avoids flicker and excludes high aerial cameras',()=>{
 assert.equal(streetPersonVisible(false,55),false);assert.equal(streetPersonVisible(true,55),true);
 assert.equal(streetPersonVisible(true,65),false);assert.equal(streetPersonVisible(false,10,23),false);
 assert.equal(streetPersonVisible(true,10,23),true);assert.equal(streetPersonVisible(true,10,27),false);
});

test('existing skinned assets load only near the street, pause when distant, and yield to the camera',async()=>{
 const a=makeAssembly(),calls=[],plan=planKeihanStreetLife(a,patrol);
 plan.vendors.push({id:'staff',x:-280,y:2,z:-104,yaw:0});
 const life=installKeihanStreetLife(a,{plan,loadAsset:async name=>{
  calls.push(name);const b=fs.readFileSync(new URL(`../assets/models/visitors/${name}.glb`,import.meta.url));
  return new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');
 }});
 const camera={position:new THREE.Vector3(300,3.7,300)};
 life.update(camera,0);await life.ready;assert.equal(calls.length,0);assert.equal(life.stats.active,0);
 camera.position.set(-280,3.7,-100);life.update(camera,.1);await life.ready;assert.equal(calls.length,3);assert.equal(life.stats.loadedModels,2);
 const person=life.people[0];person.state.pause=0;
 camera.position.set(person.state.x,person.state.y+1.7,person.state.z);const old=[person.state.x,person.state.z];
 life.update(camera,.15);assert.equal(person.state.state,'yield');assert.deepEqual([person.state.x,person.state.z],old);
 camera.position.set(-280,3.7,-110);for(let i=0;i<10;i++)life.update(camera,.2+i*.05);
 assert.equal(life.stats.active,2);assert.notDeepEqual([person.state.x,person.state.z],old);
 const vendor=life.people[1];assert.equal(vendor.root.position.y,2.015);assert.equal(vendor.state.z,-104);
 const time=person.mixer.time;camera.position.set(300,300,300);life.update(camera,5);life.update(camera,8);
 assert.equal(life.stats.active,0);assert.equal(life.stats.animated,0);assert.equal(person.mixer.time,time);assert.equal(calls.length,3);
 life.dispose();assert.equal(life.group.parent,null);life.update(camera,9);assert.equal(person.mixer.time,time);
});

for(const name of ['Casual_Male','Casual_Female','Kimono_Female'])test(`${name}: vendor hands reach forward above the counter in a rotated shop frame`,async()=>{
 const b=fs.readFileSync(new URL(`../assets/models/visitors/${name}.glb`,import.meta.url));
 const asset=await new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');
 const root=new THREE.Group(),model=asset.scene;root.position.set(-254,31.5,-93);root.rotation.y=2.76;
 const bounds=new THREE.Box3().setFromObject(model),scale=1.65/(bounds.max.y-bounds.min.y);
 model.scale.setScalar(scale);model.position.y=-bounds.min.y*scale;root.add(model);
 const mixer=new THREE.AnimationMixer(model);mixer.clipAction(asset.animations[0]).play();mixer.update(0);
 const rig=bindStreetPersonRig(model);let checked=0,minFoot=Infinity;
 for(let time=0;time<9;time+=.25){
  resetVisitorRig(rig);mixer.update(.25);captureVisitorPose(rig);poseStreetVendor(rig,root,time);root.updateMatrixWorld(true);
  const inverse=new THREE.Matrix4().copy(root.matrixWorld).invert();
  model.traverse(mesh=>{
   if(!mesh.isSkinnedMesh)return;mesh.skeleton.update();
   const count=mesh.geometry.attributes.position.count,indices=mesh.geometry.attributes.skinIndex,weights=mesh.geometry.attributes.skinWeight;
   for(let i=0;i<count;i++){
    const p=mesh.getVertexPosition(i,new THREE.Vector3()).applyMatrix4(mesh.matrixWorld).applyMatrix4(inverse);minFoot=Math.min(minFoot,p.y);
    let armWeight=0;for(let j=0;j<4;j++)if(/LowerArm/.test(mesh.skeleton.bones[indices.array[i*4+j]].name))armWeight+=weights.array[i*4+j];
    if(armWeight<.65||p.z<=.25||mesh.material.name!=='Skin')continue;
    checked++;assert.ok(p.y>1.02,`Hand enters 1.02m counter top at ${p.y.toFixed(3)}m`);
    assert.ok(p.y<1.28,`Hand raised toward face instead of serving low: ${p.y.toFixed(3)}m`);
    assert.ok(p.z<.62,'Hands must stay within the serving recess');
    assert.ok(Math.abs(p.x)<.5,'Hands must use the clear central space between display cases');
   }
  });
 }
 assert.ok(checked>100,'Actual skinned forearm/hand vertices must be visibly forward');
 assert.ok(minFoot>-.002&&minFoot<.02,'Serving must preserve the grounded foot pose');
});
