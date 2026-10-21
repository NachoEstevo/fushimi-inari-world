import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {refineKumatakasha} from './mountain-landmarks-kumataka.mjs';

function fixture(){
  const group=new THREE.Group();group.userData.zone='kumataka';group.position.set(22,73,-142);
  const stone=new THREE.MeshStandardMaterial({color:'#888877'}),wood=new THREE.MeshStandardMaterial({color:'#634f3d'});
  const materials={stoneMat:stone,entryStoneMat:stone,copperRoofMat:wood,goldMat:wood};
  const add=(geometry,x,y,z)=>{const mesh=new THREE.Mesh(geometry,wood);mesh.position.set(x,y,z);group.add(mesh);return mesh;};
  const body=add(new THREE.BoxGeometry(4.2,2.9,5.2),-5.8,1.85,0);
  const interaction={title:'Existing Kumataka',description:'Existing description',onTrigger:()=>42};body.userData.interactable=interaction;
  const roof=add(new THREE.BoxGeometry(6,.62,6.8),-5.8,3.45,0);
  const curtain=add(new THREE.PlaneGeometry(4.4,1.1),-3.62,2.55,0);curtain.rotation.y=Math.PI/2;
  const plaque=add(new THREE.BoxGeometry(.10,.85,.45),-3.45,3.18,0);
  const pond=add(new THREE.PlaneGeometry(18,22),10.5,-.18,0);
  const candleHouse=new THREE.Group();candleHouse.position.set(-3.3,.25,2.4);group.add(candleHouse);
  const flame=add(new THREE.SphereGeometry(.03,6,4),-3.3,1.1,2.4);flame.userData.animation='preserve';
  return {group,materials,body,interaction,roof,curtain,plaque,pond,candleHouse,flame};
}

function rayAtFacade(group){
  group.updateMatrixWorld(true);
  const origin=new THREE.Vector3(1,1.80,0).applyMatrix4(group.matrixWorld);
  const direction=new THREE.Vector3(-1,0,0).transformDirection(group.matrixWorld);
  return new THREE.Raycaster(origin,direction,0,20);
}

test('Kumataka opens the visual pavilion while keeping the exact original interaction, pick area and neighbouring objects',()=>{
  const f=fixture();f.group.rotation.y=.83;
  const ray=rayAtFacade(f.group),before=ray.intersectObject(f.body)[0];assert.ok(before);
  const plaqueMaterial=f.plaque.material;
  const neighbours=[f.pond,f.candleHouse,f.flame],transforms=neighbours.map(o=>o.matrixWorld.clone());
  const stats=refineKumatakasha(f.group,f.materials);
  assert.ok(stats);assert.equal(f.body.userData.interactable,f.interaction);assert.equal(f.interaction.onTrigger(),42);
  assert.equal(f.body.parent,f.group);assert.equal(f.roof.parent,null);assert.equal(f.curtain.parent,null);
  assert.equal(f.plaque.parent,f.group);assert.equal(f.plaque.material,plaqueMaterial,'existing plaque texture/material reused');
  f.group.updateMatrixWorld(true);
  for(let i=0;i<neighbours.length;i++){
    assert.equal(neighbours[i].parent,f.group);assert.ok(neighbours[i].matrixWorld.equals(transforms[i]));
  }
  const visibleGeometry=f.body.geometry,after=ray.intersectObject(f.body)[0];
  assert.ok(after);assert.ok(Math.abs(before.distance-after.distance)<1e-7);
  assert.equal(f.body.geometry,visibleGeometry,'selection temporarily uses the old envelope and restores visible frame');
  const visualHits=[];THREE.Mesh.prototype.raycast.call(f.body,ray,visualHits);
  assert.ok(visualHits.length);assert.ok(visualHits[0].distance>before.distance+3,'opening renders as depth, not the former opaque front box');
  assert.ok(stats.triangles<6000);assert.ok(stats.batches<=10);assert.equal(stats.addedColliders,0);
  f.group.traverse(object=>{
    if(!object.geometry)return;
    for(const value of object.geometry.attributes.position.array)assert.ok(Number.isFinite(value));
  });
});

test('Kumataka refinement is idempotent and does not partially rewrite an unrecognized source pavilion',()=>{
  const f=fixture(),stats=refineKumatakasha(f.group,f.materials),children=[...f.group.children],geometry=f.body.geometry;
  assert.equal(refineKumatakasha(f.group,f.materials),stats);
  assert.deepEqual(f.group.children,children);assert.equal(f.body.geometry,geometry);
  const other=fixture();other.roof.removeFromParent();const before=[...other.group.children],bodyGeometry=other.body.geometry;
  assert.equal(refineKumatakasha(other.group,other.materials),null);
  assert.deepEqual(other.group.children,before);assert.equal(other.body.geometry,bodyGeometry);
});
