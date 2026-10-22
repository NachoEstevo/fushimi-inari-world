import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {refineByakkoDetails,seatByakkoDetails} from './byakko-details.mjs';

function fixture(){
  const material=new THREE.MeshStandardMaterial(),object=new THREE.Group();object.userData.zone='byakko';
  const podium=new THREE.Mesh(new THREE.BoxGeometry(4.6,.45,4.2),material),walls=new THREE.Mesh(new THREE.BoxGeometry(3.4,2.65,3),material);walls.userData.interaction='keep';object.add(podium,walls);
  for(const x of [-1.4,1.4]){
    const fox=new THREE.Mesh(new THREE.ConeGeometry(.22,.68,8),material);fox.position.set(x,.82,2.15);object.add(fox);
    const bib=new THREE.Mesh(new THREE.CylinderGeometry(.16,.20,.18,8),material);bib.position.set(x,.72,2.15);object.add(bib);
  }
  return {object,podium,walls,material};
}
test('photo case replaces only exact cone pair and preserves shrine identity and interaction',()=>{
  const {object,podium,walls,material}=fixture(),roof=new THREE.Mesh(new THREE.BoxGeometry(5.4,.62,5),material);object.add(roof);
  const report=refineByakkoDetails(object,{entryStoneMat:material,vermilionMat:material,goldMat:material});
  assert.equal(report.removedPlaceholders,4);assert.equal(walls.parent,object);assert.equal(podium.parent,object);assert.equal(roof.parent,object);assert.equal(walls.userData.interaction,'keep');
  const details=object.getObjectByName('Byakko photographed granite pedestal and fox case');assert.ok(details);assert.ok(report.wireSegments>100);
  const count=object.children.length;assert.equal(refineByakkoDetails(object,{entryStoneMat:material}),report);assert.equal(object.children.length,count);
  details.updateWorldMatrix(true,true);const bounds=new THREE.Box3().setFromObject(details);assert.ok(Number.isFinite(bounds.max.y));assert.ok(bounds.max.y>3.9&&bounds.max.y<4.1);assert.ok(bounds.max.x< -2.2,'case clears inherited shrine wall/veranda');
  for(const mesh of details.children){const p=mesh.geometry.attributes.position;for(let i=0;i<p.array.length;i++)assert.ok(Number.isFinite(p.array[i]));}
});
test('unknown asset is untouched; incomplete placeholder signature is preserved',()=>{
  const other=new THREE.Group();other.userData.zone='byakko';assert.equal(refineByakkoDetails(other,{}),null);assert.equal(other.children.length,0);
  const {object,material}=fixture(),cone=object.children.find(c=>c.geometry.type==='ConeGeometry');cone.position.y+=.1;
  const report=refineByakkoDetails(object,{stoneMat:material});assert.equal(report.removedPlaceholders,0);assert.equal(cone.parent,object);
});

test('mapped accessory clears paths and its collider follows the seated transformed base',async()=>{
  const {readFileSync}=await import('node:fs');
  const {pathWidth}=await import('../geography/geo-core.mjs');
  const features=JSON.parse(readFileSync(new URL('../geography/features.json',import.meta.url)));
  const anchor=features.pois.find(p=>p.id==='way/301527731').point;
  const {object,material}=fixture(),root=new THREE.Group();object.position.fromArray(anchor);object.rotation.y=.06;root.add(object);
  refineByakkoDetails(object,{entryStoneMat:material});
  const colliders=[],surfaces={height:(x,z)=>53+x*.002+z*.003};
  const report=seatByakkoDetails(root,surfaces,colliders),[x,y,z]=report.worldCenter;
  assert.equal(colliders.length,1);assert.ok(report.terrainSpan<.1);
  assert.equal(colliders[0].args[0],x);assert.equal(colliders[0].args[1],z);assert.ok(Math.abs(colliders[0].args[4]-.06)<1e-6);
  assert.equal(seatByakkoDetails(root,surfaces,colliders),report);assert.equal(colliders.length,1);
  // Circumscribed base radius gives a conservative clearance envelope.
  const radius=Math.hypot(.75,.71);
  for(const path of features.paths)for(let i=1;i<path.points.length;i++){
    const a=path.points[i-1],b=path.points[i],dx=b[0]-a[0],dz=b[2]-a[2];
    const t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[2])*dz)/(dx*dx+dz*dz||1)));
    const distance=Math.hypot(x-a[0]-t*dx,z-a[2]-t*dz);
    assert.ok(distance>pathWidth(path.tags??{})/2+radius+.1,path.id+' clearance');
  }
  const group=root.getObjectByName('Byakko photographed granite pedestal and fox case');
  const p=group.localToWorld(new THREE.Vector3());assert.ok(Math.abs(p.y-y)<1e-6);
});
