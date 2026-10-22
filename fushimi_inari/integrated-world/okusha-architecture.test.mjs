import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import {buildOkushaArchitecture,okushaArchitecturePlan} from './okusha-architecture.mjs';
import {buildOkushaCourt} from './okusha-details.mjs';
import {SpatialCollisionWorld} from './collision.mjs';
const features=JSON.parse(fs.readFileSync(new URL('../geography/features.json',import.meta.url)));
export function fixture(){
  const root=new THREE.Group(),original=new THREE.Group();original.userData.zone='okusha';original.rotation.y=-Math.PI+.14;root.add(original);
  const materials={};for(const [key,color] of Object.entries({vermilionMat:'#c94724',roofMat:'#58615c',plasterMat:'#e8e2d6',entryStoneMat:'#aaa99d',gravelMat:'#777767',precinctPaving:'#aaa99d',stoneMat:'#888877',goldMat:'#bba245'}))materials[key]=new THREE.MeshStandardMaterial({color});
  const add=(w,h,d,x,y,z)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),materials.vermilionMat);o.position.set(x,y,z);original.add(o);return o;};
  const body=add(5.2,3.2,4.4,-5.8,2.15,-1.2),interaction={title:'Okusha Hōhaisho',onTrigger:()=>42};body.userData.interactable=interaction;
  add(7,.68,6.2,-5.8,3.98,-1.2);add(.42,.26,6.4,-5.8,4.42,-1.2);add(6,.68,5.2,-5.8,.34,-1.2);add(.18,1.05,4.8,-2.85,.85,-1.2);
  const ema=add(3.2,2.1,.22,5.4,1.05,-3.4);ema.userData.interactable={title:'ema'};
  for(const z of [-.7,2]){const rack=add(3.2,2.1,.22,5.4,1.05,z);rack.userData.interactable={title:'ema'};}
  const omokaru=add(.5,.5,.5,6.6,1.76,5.6);omokaru.userData.interactable={title:'Omokaru',onTrigger:()=>99};
  const anchor={target:[265.799,65,67.12],yaw:-Math.PI+.14};
  original.position.set(anchor.target[0]+Math.cos(anchor.yaw)*5.8+Math.sin(anchor.yaw)*1.2,65,anchor.target[2]-Math.sin(anchor.yaw)*5.8+Math.cos(anchor.yaw)*1.2);
  const colliders=[{type:'box',args:[264,68,3.1,2.6,anchor.yaw,65,69.5,'okusha_hall']},{type:'cylinder',args:[280,72,.32,65,67,'omokaru']}];
  return {root,original,materials,body,interaction,ema,omokaru,anchor,colliders};
}
const inside=(c,x,z)=>{if(c.type!=='box')return false;const [cx,cz,hx,hz,yaw]=c.args,dx=x-cx,dz=z-cz;return Math.abs(dx*Math.cos(yaw)-dz*Math.sin(yaw))<hx&&Math.abs(dx*Math.sin(yaw)+dz*Math.cos(yaw))<hz;};
test('real mapped outline decomposes into broad west pavilion and separate narrow rear sanctuary',()=>{
  const before=JSON.stringify(features),p=okushaArchitecturePlan(features,65);assert.ok(p.width>7.5&&p.depth>7.1);assert.ok(p.rear.maxX-p.rear.minX<4.1);assert.ok(p.rear.back<-14);
  assert.ok(p.rear.ridge>p.fore.ridge);assert.deepEqual(p.world(0,0),[258.283,64.443]);assert.equal(JSON.stringify(features),before);
  assert.equal(okushaArchitecturePlan({buildings:[]},65),null);assert.equal(okushaArchitecturePlan(features,NaN),null);
});
test('open hall replaces broad blocker while new walls match structure and leave Senbon arrival clear',()=>{
  const f=fixture(),oldOther=f.colliders[1],a=buildOkushaArchitecture(f.root,features,f.anchor,f.materials,f.colliders,f.original);
  assert.ok(a.stats.triangles<15000&&a.stats.batches<=6);assert.equal(a.stats.volumes,2);assert.ok(f.colliders.includes(oldOther));assert.ok(!f.colliders.some(c=>c.args.at(-1)==='okusha_hall'));
  // Central approach continues through the open fore-pavilion to the protected rear enclosure.
  for(let z=1;z>-a.plan.depth+.3;z-=.1)for(const dx of [-.55,0,.55]){const p=a.plan.world(a.plan.width/2+dx,z);assert.ok(!f.colliders.some(c=>inside(c,...p)),`blocked centre at ${z}`);}
  for(let x=246;x<=254;x+=.5)for(let z=65.8;z<=72.2;z+=.4)assert.ok(!f.colliders.some(c=>inside(c,x,z)));
  const collision=new SpatialCollisionWorld();for(const c of f.colliders)collision[c.type==='box'?'addBox':'addCylinder'](...c.args);
  for(let z=1;z>-a.plan.depth+.5;z-=.15)for(const dx of [-.55,0,.55]){const p=a.plan.world(a.plan.width/2+dx,z),resolved=collision.resolvePlayer(p[0],66.86,p[1]);assert.ok(Math.hypot(resolved.x-p[0],resolved.z-p[1])<.00001);}
  const rear=a.plan.world((a.plan.rear.minX+a.plan.rear.maxX)/2,a.plan.rear.front-.1);assert.ok(f.colliders.some(c=>inside(c,...rear)));
  for(const mesh of a.group.children){for(const n of mesh.geometry.attributes.position.array)assert.ok(Number.isFinite(n));assert.ok(mesh.castShadow&&mesh.receiveShadow);}
});
test('exact registered interaction mesh survives with visible geometry and correct transformed picking',()=>{
  const f=fixture(),a=buildOkushaArchitecture(f.root,features,f.anchor,f.materials,f.colliders,f.original);
  assert.equal(a.interaction,f.body);assert.equal(f.body.userData.interactable,f.interaction);assert.equal(f.interaction.onTrigger(),42);assert.equal(f.body.parent,a.group);
  f.root.updateMatrixWorld(true);const origin=new THREE.Vector3(.20,1.7,3).applyMatrix4(a.group.matrixWorld),direction=new THREE.Vector3(0,0,-1).transformDirection(a.group.matrixWorld);
  assert.ok(new THREE.Raycaster(origin,direction).intersectObject(f.body).length>0);
  const count=f.root.children.length,n=f.colliders.length;assert.equal(buildOkushaArchitecture(f.root,features,f.anchor,f.materials,f.colliders,f.original),null);assert.equal(f.root.children.length,count);assert.equal(f.colliders.length,n);
});
test('court owner removes obsolete hall fittings while preserving ema/Omokaru objects and callbacks',()=>{
  const f=fixture(),omoPosition=f.omokaru.position.clone(),omoCallback=f.omokaru.userData.interactable.onTrigger;
  const result=buildOkushaCourt(f.root,features,f.anchor,f.materials,f.colliders);
  assert.equal(result.architecture.volumes,2);assert.equal(f.ema.parent,f.original);assert.equal(f.omokaru.parent,f.original);assert.ok(f.omokaru.position.equals(omoPosition));assert.equal(f.omokaru.userData.interactable.onTrigger,omoCallback);
  assert.ok(!f.original.children.some(c=>c.geometry?.parameters?.width===7&&c.geometry.parameters.height===.68));
  assert.ok(!f.original.children.some(c=>c.geometry?.parameters?.width===6&&c.geometry.parameters.height===.68));
});
test('unrecognized legacy hall remains untouched',()=>{
  const f=fixture();delete f.body.userData.interactable;const before=JSON.stringify(f.colliders),count=f.original.children.length;
  assert.equal(buildOkushaArchitecture(f.root,features,f.anchor,f.materials,f.colliders,f.original),null);assert.equal(f.original.children.length,count);assert.equal(JSON.stringify(f.colliders),before);
});
test('retained ema row opens a physical exit gap instead of moving its old pinch along the route',()=>{
  const f=fixture();buildOkushaCourt(f.root,features,f.anchor,f.materials,f.colliders);
  const collision=new SpatialCollisionWorld();for(const c of f.colliders)collision[c.type==='box'?'addBox':'addCylinder'](...c.args);
  const old=new SpatialCollisionWorld();old.addBox(257.2447636385275,58.73161277288288,1.6,.25,f.anchor.yaw,65,67.45,'old_ema');
  const hit=old.resolvePlayer(255.782,65.14,58.764869565);assert.ok(Math.hypot(hit.x-255.782,hit.z-58.764869565)>.35);
  for(let z=57;z<=60.5;z+=.1)for(const side of [-.7,0,.7]){
    const x=255.782+(z-58.764869565)*.11164+side,p=collision.resolvePlayer(x,65.14,z);
    assert.ok(Math.hypot(p.x-x,p.z-z)<.00001,`exit pinch at ${x}, ${z}`);
  }
  assert.equal(f.colliders.filter(c=>c.args.at(-1)==='ema_rack').length,3);
});
