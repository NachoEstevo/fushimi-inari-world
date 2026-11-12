import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {refineShrineOfferings} from './shrine-offerings.mjs';

test('legacy offerings in every peak compound gain open centers without moving or losing interaction',()=>{
  for(const zone of ['mitsurugi','sannomine','ninomine','summit']){
    const group=new THREE.Group();group.userData.zone=zone;
    const material=new THREE.MeshStandardMaterial({color:0xd94816});
    const offering=new THREE.Mesh(new THREE.BoxGeometry(.36,.42,.06),material);
    offering.position.set(2,3,4);offering.rotation.x=-.18;
    const interact=()=>true;offering.userData.onInteract=interact;group.add(offering);
    offering.updateMatrix();const matrix=offering.matrix.clone();
    refineShrineOfferings(group);
    assert.equal(offering.geometry.type,'BufferGeometry',zone);
    assert.equal(offering.material,material);assert.equal(offering.userData.onInteract,interact);
    offering.updateMatrix();assert.deepEqual(offering.matrix.elements,matrix.elements);
    // Test local geometry: the former solid plate blocked this center ray.
    const local=new THREE.Mesh(offering.geometry,material);local.updateMatrixWorld();
    const ray=new THREE.Raycaster(new THREE.Vector3(0,0,1),new THREE.Vector3(0,0,-1));
    assert.equal(ray.intersectObject(local).length,0,zone+' center must remain open');
    ray.set(new THREE.Vector3(.115,0,1),new THREE.Vector3(0,0,-1));
    assert.ok(ray.intersectObject(local).length>0,zone+' post remains present');
    const geometry=offering.geometry;refineShrineOfferings(group);assert.equal(offering.geometry,geometry);
  }
});

test('other zones, near-signature boxes and near-signature stones retain their geometry',()=>{
  for(const zone of ['precinct','gozendani','summit']){
    const group=new THREE.Group();group.userData.zone=zone;
    const sizes=zone==='summit'?[[.36,.42,.07],[.54,1.24,.27]]:[[.36,.42,.06]];
    for(const size of sizes){const mesh=new THREE.Mesh(new THREE.BoxGeometry(...size));group.add(mesh);}
    const geometries=group.children.map(mesh=>mesh.geometry);refineShrineOfferings(group);
    assert.deepEqual(group.children.map(mesh=>mesh.geometry),geometries,zone);
  }
});


test('inherited otsuka retain placement and identity, with rounded crowns and bounded geometry',()=>{
 for(const zone of ['kumataka','mitsurugi','sannomine','ninomine','summit']){
  const group=new THREE.Group();group.userData.zone=zone;
  const size=zone==='kumataka'?[.56,1.1,.30]:[.54,1.24,.26];
  const original=new THREE.MeshStandardMaterial({map:new THREE.Texture()});
  const stele=new THREE.Mesh(new THREE.BoxGeometry(...size),original);
  if(zone==='kumataka')stele.position.set(-9.2,.55,-8.5);
  stele.userData.interactable={title:'retained'};group.add(stele);
  stele.updateMatrix();const matrix=stele.matrix.clone();
  refineShrineOfferings(group);stele.updateMatrix();
  assert.deepEqual(stele.matrix.elements,matrix.elements);
  assert.equal(stele.userData.interactable.title,'retained');
  assert.notEqual(stele.material.map,original.map,'specific legacy deity must not repeat');
  const p=stele.geometry.attributes.position;
  assert.ok(p.count<=150);assert.ok(stele.geometry.index.count/3<=180);
  const atCentre=[],atEdge=[];
  for(let i=0;i<p.count;i++){
   const x=p.getX(i),y=p.getY(i),z=p.getZ(i);
   assert.ok(Math.abs(x)<=size[0]/2+1e-6&&Math.abs(z)<=size[2]/2+1e-6&&Math.abs(y)<=size[1]/2+1e-6);
   if(Math.abs(x)<1e-5)atCentre.push(y);
   if(Math.abs(x)>.9*size[0]/2)atEdge.push(y);
  }
  assert.ok(Math.max(...atCentre)-Math.max(...atEdge)>.1,'crown must have a visibly rounded silhouette');
  const geometry=stele.geometry,material=stele.material;refineShrineOfferings(group);
  assert.equal(stele.geometry,geometry);assert.equal(stele.material,material);
 }
});

test('Kumataka matching uses exact inherited location, and identical stones share resources',()=>{
 const group=new THREE.Group();group.userData.zone='kumataka';
 const mat=new THREE.MeshStandardMaterial(),make=(x,z)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(.56,1.1,.3),mat);m.position.set(x,.55,z);group.add(m);return m;};
 const a=make(-9.2,-8.5),b=make(-9.2,-1),unrelated=make(2,3),before=unrelated.geometry;
 refineShrineOfferings(group);
 assert.equal(a.geometry,b.geometry);assert.equal(a.material,b.material);assert.equal(unrelated.geometry,before);
});


test('all zones lazily share one stone atlas while headless use cannot poison browser materials',()=>{
 const original=new THREE.MeshStandardMaterial({map:new THREE.Texture(),normalMap:new THREE.Texture(),roughnessMap:new THREE.Texture()});
 const make=zone=>{const g=new THREE.Group();g.userData.zone=zone;const m=new THREE.Mesh(new THREE.BoxGeometry(.54,1.24,.26),original);g.add(m);refineShrineOfferings(g);return m;};
 const previous=globalThis.document;delete globalThis.document;
 try{
  const headless=make('summit');assert.equal(headless.material.map,null);
  let canvases=0;const text=[];
  globalThis.document={createElement:()=>{canvases++;return {getContext:()=>({fillRect(){},fillText(s){text.push(s);}})};}};
  const a=make('summit'),b=make('ninomine'),c=make('mitsurugi');
  assert.ok(a.material.map);assert.equal(a.material,b.material);assert.equal(a.material,c.material);
  assert.notEqual(a.material,headless.material);assert.equal(canvases,1);assert.deepEqual(text,['奉','納']);
  assert.equal(a.material.map.image.width,256);assert.equal(a.material.map.image.height,512);
  assert.equal(a.material.normalMap,null);assert.equal(a.material.roughnessMap,null);
  assert.ok(original.map&&original.normalMap&&original.roughnessMap,'borrowed source maps remain intact');
  const other=new THREE.MeshStandardMaterial(),group=new THREE.Group();group.userData.zone='sannomine';
  const d=new THREE.Mesh(new THREE.BoxGeometry(.54,1.24,.26),other);group.add(d);refineShrineOfferings(group);
  assert.notEqual(d.material,a.material);assert.equal(d.material.map,a.material.map);assert.equal(canvases,1);
 }finally{if(previous===undefined)delete globalThis.document;else globalThis.document=previous;}
});
