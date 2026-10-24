import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from 'three';
import {heightAt} from '../geography/geo-core.mjs';
import {makePathSurfaces} from './path-surfaces.mjs';
import {createInariStationArrivalSpec} from './inari-station-arrival-spec.mjs';
import {createKeihanJrCrossingSpec,createJrCrossingController,buildKeihanJrCrossingDetail} from './keihan-jr-crossing-detail.mjs';

const features=JSON.parse(readFileSync(new URL('../geography/features.json',import.meta.url))),terrain=JSON.parse(readFileSync(new URL('../geography/terrain.json',import.meta.url))),surfaces=makePathSurfaces(features,(x,z)=>heightAt(terrain,x,z)),station=createInariStationArrivalSpec(features,surfaces),spec=createKeihanJrCrossingSpec(features,surfaces,station);
const observer=[-230,spec.crossing[1]+1.7,-86],onTrack=[-207.7,spec.crossing[1]+1.7,-85.7];
const advance=(controller,seconds,camera=observer)=>{for(let i=0;i<seconds*20;i++)controller.step(.05,camera);};

test('crossing traces retain both mapped nodes and meet the accepted station rails exactly',()=>{
 assert.ok(spec);assert.equal(spec.tracks.length,2);assert.equal(spec.gauge,1.067);
 for(const [index,track]of spec.tracks.entries()){
  const expected=index?[-203.648887,-85.382049]:[-207.744854,-85.760536],p=track.at(0).position;
  assert.ok(Math.hypot(p[0]-expected[0],p[2]-expected[1])<1e-8);
  const seam=track.at(track.length-track.crossingDistance).position;
  assert.ok(Math.hypot(seam[0]-track.join[0],seam[2]-track.join[1])<1e-8);assert.equal(seam[1],station.railTop);
  for(let distance=-track.crossingDistance;distance<225;distance+=.5){const pose=track.at(distance);assert.ok(pose.position.every(Number.isFinite));assert.ok(Math.abs(Math.hypot(...pose.direction)-1)<1e-7);}
 }
});

test('changed crossing registration fails before objects or colliders are attached',()=>{
 const changed={...features,paths:features.paths.filter(p=>p.id!=='way/79699849')},root=new THREE.Group(),colliders=[];
 assert.equal(createKeihanJrCrossingSpec(changed,surfaces,station),null);
 const result=buildKeihanJrCrossingDetail(root,changed,surfaces,colliders,{inariSpec:station});assert.equal(result.built,false);assert.equal(root.children.length,0);assert.equal(colliders.length,0);
});

test('new train and track details are bounded batches, preserve identities and add no lights',()=>{
 const root=new THREE.Group(),colliders=[],r=buildKeihanJrCrossingDetail(root,features,surfaces,colliders,{spec});
 assert.equal(r.built,true);assert.equal(r.trainGroup.children.length,2);assert.equal(r.group.userData.dynamic,true);assert.equal(r.stats.lightsAdded,0);assert.equal(colliders.length,2);
 assert.ok(r.stats.tracks.triangles<60000);assert.ok(r.stats.train.triangles<6000);assert.ok(r.detailGroups.length<=10);
 let lights=0;root.traverse(o=>{if(o.isLight)lights++;if(o.isMesh)assert.ok(Array.from(o.geometry.attributes.position.array).every(Number.isFinite));});assert.equal(lights,0);
 const again=buildKeihanJrCrossingDetail(root,features,surfaces,colliders,{spec});assert.equal(again,r);assert.equal(colliders.length,2);
 const bounds=new THREE.Box3().setFromObject(r.trainGroup.children[0]);assert.ok(bounds.min.y>=spec.tracks[0].at(spec.train.initialFront-spec.train.carLength/2).position[1]-.12);
});

test('ballast and sleepers do not put raised obstacles across the public road and sidewalk',()=>{
 const root=new THREE.Group(),r=buildKeihanJrCrossingDetail(root,features,surfaces,[],{spec});
 for(const group of r.detailGroups.filter(g=>g.name.startsWith('JR track detail')))for(const mesh of group.children){
  const p=mesh.geometry.attributes.position;
  for(let i=0;i<p.count;i++){
   const z=p.getZ(i),y=p.getY(i);if(z>spec.roadBounds[2]+.2&&z<spec.roadBounds[3]-.2&&y<spec.crossing[1]+2){
    // Only narrow rail extensions outside the old embedded ten-metre heads.
    assert.ok(Math.abs(z-spec.crossing[2])>4.7,'new low geometry duplicates the embedded road rails');
   }
  }
 }
});

test('observed control cabinets remain grounded beyond the crossing and train envelopes',()=>{
 const root=new THREE.Group(),r=buildKeihanJrCrossingDetail(root,features,surfaces,[],{spec}),cabinets=r.group.getObjectByName('JR crossing control cabinets');
 assert.ok(cabinets);assert.ok(r.detailGroups.includes(cabinets));assert.ok(cabinets.children.length<=4);
 const bounds=new THREE.Box3().setFromObject(cabinets);
 assert.ok(bounds.min.z>spec.roadBounds[3]+1,'cabinet must stay south of road and sidewalk');
 for(const track of spec.tracks){const p=track.at(11).position;assert.ok(bounds.min.x-p[0]>spec.train.carWidth/2+1,'cabinet must clear train swept envelope');}
 for(const x of [-198.3,-196.95])assert.ok(bounds.min.y<surfaces.height(x,-74.8),'foundation reaches ground');
 assert.ok(bounds.max.y-surfaces.height(-198.3,-74.8)<2.2);
});

test('cabinet foundations reach a lower sloping DEM even when surface height selects the road',()=>{
 const lower={...surfaces,height:()=>40,terrainHeight:(x,z)=>31+(x+198)*.2+(z+75)*.3},root=new THREE.Group(),r=buildKeihanJrCrossingDetail(root,features,lower,[],{spec}),cabinets=r.group.getObjectByName('JR crossing control cabinets');
 for(const [x,z,w,d]of [[-198.3,-74.8,1.25,.62],[-196.95,-74.8,.54,.42]]){
  const corners=[-1,1].flatMap(a=>[-1,1].map(b=>[x+a*(w/2+.08),z+b*(d/2+.08)]));
  for(const [px,pz]of corners){
   const vertices=[];cabinets.traverse(mesh=>{if(!mesh.isMesh)return;const p=mesh.geometry.attributes.position;for(let i=0;i<p.count;i++)if(Math.abs(p.getX(i)-px)<1e-4&&Math.abs(p.getZ(i)-pz)<1e-4)vertices.push(p.getY(i));});
   assert.ok(vertices.length>0);assert.ok(Math.min(...vertices)<=lower.terrainHeight(px,pz),'each foundation corner must reach its terrain sample');
   assert.ok(Math.max(...vertices)>=40,'foundation top retains upper support');
  }
 }
});

test('train approaches but waits north of the road for an existing occupant',()=>{
 const c=createJrCrossingController(spec);advance(c,60,onTrack);
 assert.equal(c.state.phase,'waiting');assert.equal(c.state.front,spec.train.stopFront);assert.equal(c.state.barrier,0);
 assert.equal(c.canMove(onTrack,[-215,onTrack[1],-85.7]),true);
});

test('warning blocks swept entry, permits retreat and prevents a newly occupied crossing from committing',()=>{
 const c=createJrCrossingController(spec);advance(c,14.5);assert.equal(c.state.phase,'warning');
 assert.equal(c.canMove([-216,35,-85],[-195,35,-85]),false,'must catch a full-step crossing with both endpoints outside');
 assert.equal(c.canMove([-216,35,-100],[-195,35,-100]),true);
 assert.equal(c.canMove([-216,45,-85],[-195,45,-85]),true,'high flight remains available');
 assert.equal(c.canMove(onTrack,[-215,onTrack[1],-85.7]),true);
 const before=c.state.front;c.step(.05,onTrack);assert.equal(c.state.phase,'waiting');assert.equal(c.state.front,before);
});

test('train passes completely before entry reopens, with no teleport across the protected street',()=>{
 const c=createJrCrossingController(spec);let wasPassing=false,previous=c.state.front;
 for(let i=0;i<1200;i++){
  c.step(.05,observer);assert.ok(c.state.front-previous<=spec.train.speed*.05+1e-8);previous=c.state.front;
  if(c.state.phase==='passing'){wasPassing=true;assert.equal(c.canMove([-216,35,-85],[-195,35,-85]),false);}
  if(c.state.phase==='departure'){assert.ok(c.state.front-spec.train.length>10);assert.equal(c.canMove([-216,35,-85],[-195,35,-85]),true);break;}
 }
 assert.equal(wasPassing,true);assert.equal(c.state.passes,1);
});

test('background time is bounded, distant animation freezes, and reset cannot occur beside the departing train',()=>{
 const c=createJrCrossingController(spec),before=c.state.front;c.step(120,observer);assert.ok(c.state.front-before<=spec.train.speed*.1+1e-8);
 const after=c.state.front;advance(c,30,[500,50,500]);assert.equal(c.state.front,after);
 for(let i=0;i<2000&&c.state.phase!=='gone';i++)c.step(.05,observer);
 assert.equal(c.state.phase,'gone');const front=c.state.front,end=spec.tracks[0].at(front).position;
 advance(c,35,[end[0]+2,end[1]+1.7,end[2]]);assert.equal(c.state.phase,'gone');assert.equal(c.state.front,front);
 c.step(.05,[500,50,500]);assert.equal(c.state.phase,'approach');assert.equal(c.state.front,spec.train.initialFront);
});

test('a bridge visitor gets a second train after a bounded dwell without leaving the street',()=>{
 const c=createJrCrossingController(spec),nearBridge=[spec.crossing[0]-16,spec.crossing[1]+1.7,spec.crossing[2]];
 for(let i=0;i<2000&&c.state.phase!=='gone';i++)c.step(.05,nearBridge);
 assert.equal(c.state.phase,'gone');assert.equal(c.state.passes,1);const departed=c.state.front;
 advance(c,29,nearBridge);assert.equal(c.state.phase,'gone');assert.equal(c.state.front,departed);
 c.step(120,nearBridge);assert.equal(c.state.phase,'gone','background elapsed time cannot consume the dwell');
 advance(c,1,nearBridge);assert.equal(c.state.phase,'approach');assert.ok(c.state.front<spec.train.initialFront+1);
 for(let i=0;i<1200&&c.state.passes<2;i++)c.step(.05,nearBridge);
 assert.equal(c.state.passes,2);
});

test('the repeating lifecycle cannot reset near the tail or the future spawn formation',()=>{
 for(const location of ['tail','spawn']){
  const c=createJrCrossingController(spec);for(let i=0;i<2000&&c.state.phase!=='gone';i++)c.step(.05,observer);
  const front=c.state.front,p=spec.tracks[0].at(location==='tail'?front-spec.train.length:spec.train.initialFront).position;
  advance(c,40,[p[0]+2,p[1]+1.7,p[2]]);assert.equal(c.state.phase,'gone',location);assert.equal(c.state.front,front);
 }
});
