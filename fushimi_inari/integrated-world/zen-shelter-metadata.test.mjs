import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from 'three';
import {registeredZenShelters,suehiroZenShelter} from './zen-shelter-metadata.mjs';
import {buildMappedRoofCanopies} from './mapped-roof-canopies.mjs';
import {buildOkushaMappedSheltersR102} from './okusha-mapped-shelters-r102.mjs';
import {buildYotsutsujiContextR95} from './yotsutsuji-context-r95.mjs';
import {createSuehiroyaSummit} from './suehiroya-summit.mjs';
const features=JSON.parse(readFileSync(new URL('../geography/features.json',import.meta.url)));
const materials=()=>({entryStoneMat:new THREE.MeshStandardMaterial(),plasterMat:new THREE.MeshStandardMaterial()});

test('registered mountain masks use successful roof owners and their actual support levels',()=>{
 const root=new THREE.Group(),colliders=[],mitsurugi=buildMappedRoofCanopies(root,features,{height:(x,z)=>183+x*.001+z*.001},{},colliders);
 const okusha=buildOkushaMappedSheltersR102(root,features,materials(),()=>62.56,colliders);
 const masks=registeredZenShelters({features,colliders,mitsurugi,okusha});assert.equal(masks.length,2);
 const m=masks.find(s=>s.id==='mitsurugi-canopy'),o=masks.find(s=>s.id==='okusha-temizuya');
 assert.equal(m.roofY,mitsurugi.roofY);assert.equal(m.floor,Math.min(...colliders.filter(c=>c.args.at(-1)==='mitsurugi_canopy_post').map(c=>c.args[3])));
 assert.deepEqual(m.points,features.buildings.find(b=>b.id===mitsurugi.sourceFeature).points.slice(0,-1));
 assert.deepEqual(o.points,okusha.roofPoints);assert.equal(o.roofY,okusha.eave);assert.equal(o.floor,Math.min(...okusha.postSeats));
 assert.notEqual(o.points,okusha.roofPoints);assert.notEqual(o.points[0],okusha.roofPoints[0]);
 assert.deepEqual(registeredZenShelters({features,mitsurugi,colliders:[]}),[]);
 assert.deepEqual(registeredZenShelters({features,colliders,mitsurugi:{...mitsurugi,built:false},okusha:null}),[]);
 assert.deepEqual(registeredZenShelters({features,colliders,okusha:{...okusha,postSeats:[NaN]}}),[]);
});

test('Suehiro grants one inscribed front-roof strip, while the exterior tea seat stays outside',()=>{
 const shop=createSuehiroyaSummit({buildings:features.buildings,ground:()=>229,walkHeight:()=>231,materials:materials()}),mask=suehiroZenShelter(shop);
 assert.ok(shop.stats.built);assert.ok(mask);assert.equal(mask.roofY,shop.stats.roofMin);assert.equal(mask.floor,shop.stats.floor);assert.equal(mask.points.length,4);
 shop.group.updateMatrixWorld(true);
 // Actual rendered roof must cover the whole conservative strip, including
 // edge midpoints; the large concave footprint is never replaced by its bbox.
 for(let i=0;i<=6;i++)for(let j=0;j<=4;j++){
  const u=i/6,v=j/4,[a,b,c,d]=mask.points,x=(1-v)*(a[0]*(1-u)+b[0]*u)+v*(d[0]*(1-u)+c[0]*u),z=(1-v)*(a[2]*(1-u)+b[2]*u)+v*(d[2]*(1-u)+c[2]*u);
  const hits=new THREE.Raycaster(new THREE.Vector3(x,shop.stats.roofMax+2,z),new THREE.Vector3(0,-1,0)).intersectObject(shop.group,true);
  assert.ok(hits.some(h=>h.object.name==='Suehiro-ya pitched metal roof'&&h.point.y>=mask.roofY-.001));
 }
 const front=shop.stats.front,a=front.a,b=front.b,u=.70,x=a[0]+(b[0]-a[0])*u+front.outward[0]*.55,z=a[2]+(b[2]-a[2])*u+front.outward[1]*.55;
 const outsideRay=new THREE.Raycaster(new THREE.Vector3(x,shop.stats.roofMax+2,z),new THREE.Vector3(0,-1,0));
 assert.ok(!outsideRay.intersectObject(shop.group,true).some(h=>h.object.name==='Suehiro-ya pitched metal roof'));
 assert.equal(suehiroZenShelter({...shop,stats:{...shop.stats,built:false}}),null);shop.dispose();
});

test('Yotsutsuji cover metadata is emitted from the same registered awning and canopy coordinates',()=>{
 const root=new THREE.Group(),owner=new THREE.Group();owner.name='Yotsutsuji mapped tea houses';root.add(owner);
 const report=buildYotsutsujiContextR95(root,features,{}),masks=registeredZenShelters({yotsutsuji:report});assert.equal(masks.length,4);
 const canopy=masks.find(s=>s.id==='yotsutsuji-annex-canopy');assert.ok(canopy);assert.equal(canopy.floor,163.45);assert.equal(canopy.roofY,163.45+report.canopy.minHeight);
 root.updateMatrixWorld(true);
 for(const mask of masks){
  const x=mask.points.reduce((n,p)=>n+p[0]/4,0),z=mask.points.reduce((n,p)=>n+p[2]/4,0);
  const hits=new THREE.Raycaster(new THREE.Vector3(x,mask.roofY+3,z),new THREE.Vector3(0,-1,0)).intersectObject(root,true);
  assert.ok(hits.some(h=>h.point.y>=mask.roofY-.001),'every metadata center has a real emitted cover');
 }
 assert.deepEqual(registeredZenShelters({yotsutsuji:{...report,built:false}}),[]);
});
