import test from 'node:test';import assert from 'node:assert/strict';import * as THREE from 'three';
import {refineKumatakasha} from './mountain-landmarks-kumataka.mjs';
import {buildKumatakaRoofR97,kumatakaRoofProfileR97} from './kumataka-roof-r97.mjs';
function fixture(){
  const root=new THREE.Group(),owner=new THREE.Group();owner.userData={zone:'kumataka',kumatakaRegistrationR97:true};root.add(owner);
  const material=new THREE.MeshStandardMaterial(),materials={stoneMat:material,entryStoneMat:material,copperRoofMat:material,goldMat:material};
  const add=(g,x,y,z)=>{const o=new THREE.Mesh(g,material);o.position.set(x,y,z);owner.add(o);return o;};
  const body=add(new THREE.BoxGeometry(4.2,2.9,5.2),-5.8,1.85,0);body.userData.interactable={onTrigger:()=>42};
  add(new THREE.BoxGeometry(6,.62,6.8),-5.8,3.45,0);add(new THREE.PlaneGeometry(4.4,1.1),-3.62,2.55,0);add(new THREE.BoxGeometry(.10,.85,.45),-3.45,3.18,0);
  refineKumatakasha(owner,materials);return {root,owner,body,details:owner.getObjectByName('Kumataka photographed timber pavilion and straw fringe')};
}
test('proven rear-gable sightline is closed by actual roof geometry while interaction identity survives',()=>{
  const f=fixture(),callback=f.body.userData.interactable;
  const inheritedRoof=f.details.children.find(o=>o.material?.metalness===.22);assert.equal(inheritedRoof.material.color.getHexString(),'848983');
  const lower=new Map();for(const mesh of f.details.children.filter(o=>['494536','242923'].includes(o.material?.color?.getHexString()))){const p=mesh.geometry.attributes.position,values=[];for(let i=0;i<p.count;i+=3)if(![0,1,2].every(j=>p.getY(i+j)>=3.25))for(let j=0;j<9;j++)values.push(p.array[i*3+j]);lower.set(mesh,values);}
  const origin=new THREE.Vector3(-5.6828727309,3.2332475133,-3.2434524),direction=new THREE.Vector3(-2.9843591761,.6280033048,3.5403781834).normalize(),ray=new THREE.Raycaster(origin,direction,0,10);
  f.root.updateMatrixWorld(true);assert.equal(ray.intersectObject(f.details,true).length,0,'baseline reproduces final court pixel600/180 rear gap');
  const r=buildKumatakaRoofR97(f.root);assert.ok(r);f.root.updateMatrixWorld(true);assert.ok(ray.intersectObject(r.group,true).length>0,'same real sightline hits completed rear roof envelope');
  assert.equal(r.group.children.find(o=>o.material.metalness===.22).material.color.getHexString(),'848983');
  assert.equal(f.body.userData.interactable,callback);assert.equal(callback.onTrigger(),42);assert.ok(r.batches<=2&&r.triangles<7000);
  for(const [mesh,values]of lower){assert.equal(mesh.parent,f.details);assert.deepEqual(Array.from(mesh.geometry.attributes.position.array),values,'every original lower altar/timber triangle is preserved byte-for-byte');}
  assert.equal(r.triangles,3076);assert.equal(r.removedTriangles,1505);assert.equal(r.triangleDelta,1571);
  assert.equal(buildKumatakaRoofR97(f.root),null);
});
test('both curved slopes have complete overhead coverage and upward-wound finite top skin',()=>{
  const f=fixture(),r=buildKumatakaRoofR97(f.root);f.root.updateMatrixWorld(true);
  for(let x=-8.6;x< -2.9;x+=.4)for(let z=-3.25;z<3.3;z+=.35){const ray=new THREE.Raycaster(new THREE.Vector3(x,7,z),new THREE.Vector3(0,-1,0));assert.ok(ray.intersectObject(r.group,true).length>0);}
  const top=r.group.children.find(o=>o.material.metalness===.22),p=top.geometry.attributes.position;
  // First80 triangles are the complete curved roof skin, before fascia/seams.
  for(let i=0;i<3*80;i+=3){const a=new THREE.Vector3().fromBufferAttribute(p,i),b=new THREE.Vector3().fromBufferAttribute(p,i+1),c=new THREE.Vector3().fromBufferAttribute(p,i+2);assert.ok(b.sub(a).cross(c.sub(a)).y>0);}
  assert.ok(kumatakaRoofProfileR97(3.4)>kumatakaRoofProfileR97(3.1),'outer edge has source-like upward sweep');assert.ok(kumatakaRoofProfileR97(0)<4.55);
  r.group.traverse(o=>{if(o.isMesh)for(const value of o.geometry.attributes.position.array)assert.ok(Number.isFinite(value));});
});
test('unregistered or unrecognized roof owner is unchanged',()=>{
  const f=fixture();delete f.owner.userData.kumatakaRegistrationR97;const children=[...f.details.children];assert.equal(buildKumatakaRoofR97(f.root),null);assert.deepEqual(f.details.children,children);
});
