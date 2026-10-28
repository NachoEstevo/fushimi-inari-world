import nodeTest from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {readFileSync} from 'node:fs';
import {registeredZenShelters} from './zen-shelter-metadata.mjs';
import {buildMappedRoofCanopies} from './mapped-roof-canopies.mjs';
import {buildOkushaMappedSheltersR102} from './okusha-mapped-shelters-r102.mjs';
import {buildYotsutsujiContextR95} from './yotsutsuji-context-r95.mjs';
import {createSuehiroyaSummit} from './suehiroya-summit.mjs';
import {buildKeihanFrontages} from './keihan-frontages.mjs';
import {makePathSurfaces} from './path-surfaces.mjs';
import {heightAt} from '../geography/geo-core.mjs';
import {buildYotsutsuji} from './yotsutsuji.mjs';
import {yotsuGrade} from './site-grading.mjs';
const modern=Number(THREE.REVISION)>=180;
const {createZenWeather,zenShelters,shelterAt}=modern?await import('./zen-weather.mjs'):{};
const test=(name,run)=>nodeTest(name,{skip:!modern},run);

const station={built:true,spec:{platformFloor:31,publicExit:{position:[-301,30.1,-124.745]}}};
function fixture(options={}){
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera();camera.position.set(50,10,50);
 const assembly={keihanStation:station,zenShelters:[{id:'authored-canopy',points:[[40,0,40],[44,0,40],[44,0,44],[40,0,44]],floor:8,roofY:12}]};
 let quality='balanced';const weather=createZenWeather({scene,camera,assembly,getQuality:()=>quality,...options});
 return {scene,camera,assembly,weather,setQuality:value=>quality=value};
}

test('shelters derive from built owners and require a position below their actual roof',()=>{
 assert.equal(zenShelters({}).length,0);
 const shelters=zenShelters({keihanStation:station});
 assert.equal(shelterAt({x:-302.4,y:32.7,z:-176.7},shelters)?.id,'keihan-platform-south');
 assert.equal(shelterAt({x:-302.4,y:35,z:-176.7},shelters),null);
 assert.equal(shelterAt({x:-295,y:32.7,z:-176.7},shelters),null);
 assert.equal(shelterAt({x:-302.4,y:20,z:-176.7},shelters),null);
 assert.equal(zenShelters({keihanStation:{built:false,spec:station.spec}}).length,0);
 const f=fixture();assert.equal(shelterAt({x:42,y:10,z:42},zenShelters(f.assembly)).id,'authored-canopy');f.weather.dispose();
 assert.equal(zenShelters({zenShelters:[{id:'bad-roof',points:[[1,0,1],[1,0,1],[1,0,1],[1,0,1]],floor:0,roofY:3}]}).length,0);
});

test('rain has fixed geometry, quality-bounded counts and does no scene traversal while moving',()=>{
 const f=fixture(),rain=f.weather.group.getObjectByName('Quiet drizzle');assert.equal(f.weather.stats.particles,700);
 const geometry=rain.geometry,material=rain.material,version=geometry.attributes.position.version;
 f.scene.traverse=()=>{throw Error('frame scene traversal');};f.weather.setMode('drizzle');
 for(let i=0;i<100;i++){f.camera.position.x+=.3;f.weather.update(.016,i*.016);}
 assert.equal(rain.geometry,geometry);assert.equal(rain.material,material);assert.equal(geometry.attributes.position.version,version);assert.equal(rain.castShadow,false);
 f.setQuality('high');f.weather.update(.1,2);assert.equal(f.weather.stats.particles,1400);assert.equal(geometry.drawRange.count,2800);
 f.setQuality('balanced');f.weather.update(.1,2.1);assert.equal(geometry.drawRange.count,1400);assert.equal(f.weather.stats.draws,1);
 f.weather.dispose();assert.equal(f.weather.group.parent,null);
});

test('shelter and umbrella state follow the camera and clear weather stops the visual layer',()=>{
 const f=fixture();f.weather.setMode('drizzle');f.camera.position.set(42,10,42);f.weather.update(.1,1);
 assert.equal(f.weather.sheltered,true);assert.equal(f.weather.stats.shelter,'authored-canopy');
 f.weather.setUmbrella(true);f.weather.update(.1,1.1);assert.equal(f.weather.stats.umbrella,true);assert.equal(f.weather.stats.draws,3);
 const umbrella=f.weather.group.getObjectByName('Held rain umbrella');assert.equal(umbrella.visible,true);assert.deepEqual(umbrella.position.toArray(),f.camera.position.toArray());
 f.camera.position.set(50,10,50);f.weather.update(.1,1.2);assert.equal(f.weather.sheltered,false);
 f.weather.setMode('clear');for(let i=0;i<30;i++)f.weather.update(.1,2+i*.1);
 assert.equal(f.weather.stats.draws,0);assert.equal(umbrella.visible,false);assert.equal(f.weather.stats.mode,'clear');f.weather.dispose();
});

test('paused weather discards elapsed time and disposal is idempotent',()=>{
 const f=fixture();f.weather.setMode('drizzle');f.weather.update(10,1000);assert.equal(f.weather.stats.elapsed,.1);
 f.weather.update(1000,2000,{blocked:true});assert.equal(f.weather.stats.elapsed,.1);
 f.weather.update(NaN,NaN);assert.equal(f.weather.stats.elapsed,.1);
 f.weather.dispose();f.weather.dispose();assert.equal(f.scene.children.length,0);f.weather.update(.1,4);assert.equal(f.weather.stats.disposed,true);
});

test('preparation compiles hidden weather once through the caller guard and restores visibility',async()=>{
 const f=fixture();let calls=0;
 await f.weather.prepare(()=>{calls++;assert.ok(f.weather.group.getObjectByName('Quiet drizzle').visible);assert.ok(f.weather.group.getObjectByName('Held rain umbrella').visible);return Promise.resolve();});
 assert.equal(calls,1);assert.equal(f.weather.group.getObjectByName('Quiet drizzle').visible,false);assert.equal(f.weather.group.getObjectByName('Held rain umbrella').visible,false);
 f.weather.dispose();
});

test('weather changes retain the same GPU material graph and failed preparation releases visibility',async()=>{
 const f=fixture(),rain=f.weather.group.getObjectByName('Quiet drizzle'),material=rain.material;
 const version=material.version,position=material.positionNode,opacity=material.opacityNode;
 for(const mode of ['drizzle','clear','drizzle','clear']){f.weather.setMode(mode);f.weather.setUmbrella(mode==='drizzle');f.weather.update(.1,1);assert.equal(material.version,version);assert.equal(material.positionNode,position);assert.equal(material.opacityNode,opacity);}
 for(let i=0;i<30;i++)f.weather.update(.1,i);
 await assert.rejects(f.weather.prepare(()=>Promise.reject(Error('compile'))),/compile/);
 assert.equal(rain.visible,false);assert.equal(f.weather.group.getObjectByName('Held rain umbrella').visible,false);f.weather.dispose();
});

test('the real selected carriage roof remains dry as the existing train model departs',()=>{
 const trainGroup=new THREE.Group();trainGroup.position.set(0,10,0);
 const station={built:true,trainGroup,spec:{platformFloor:10,track:{origin:[0,0],east:[1,0],direction:[0,1]},train:{floor:10,carWidth:2.8,carLength:18,carCenters:[0],selectedCar:0}}};
 const f=fixture({assembly:{keihanStation:station}});f.weather.setMode('drizzle');f.camera.position.set(0,11.7,0);f.weather.update(.1,1);
 assert.equal(f.weather.stats.shelter,'keihan-selected-car');
 trainGroup.position.z=12;f.camera.position.z=12;f.weather.update(.1,1.1);assert.equal(f.weather.stats.shelter,'keihan-selected-car');
 f.camera.position.z=0;f.weather.update(.1,1.2);assert.equal(f.weather.sheltered,false);f.weather.dispose();
});

test('canonical mountain covers classify from emitted metadata with the fixed four-mask shader budget',()=>{
 const features=JSON.parse(readFileSync(new URL('../geography/features.json',import.meta.url))),root=new THREE.Group(),colliders=[];
 const materials={entryStoneMat:new THREE.MeshStandardMaterial(),plasterMat:new THREE.MeshStandardMaterial()};
 const mitsurugi=buildMappedRoofCanopies(root,features,{height:()=>183},{},colliders),okusha=buildOkushaMappedSheltersR102(root,features,materials,()=>62.56,colliders);
 const owner=new THREE.Group();owner.name='Yotsutsuji mapped tea houses';root.add(owner);const yotsutsuji=buildYotsutsujiContextR95(root,features,{});
 const metadata=registeredZenShelters({features,colliders,mitsurugi,okusha,yotsutsuji}),shop=createSuehiroyaSummit({buildings:features.buildings,ground:()=>229,walkHeight:()=>231,materials});
 const f=fixture({assembly:{zenShelters:metadata},shop});f.weather.setMode('drizzle');
 const masks=zenShelters({zenShelters:metadata},shop);assert.ok(masks.some(s=>s.id==='suehiro-front-roof'));
 for(const id of ['mitsurugi-canopy','okusha-temizuya','yotsutsuji-annex-canopy','suehiro-front-roof']){
  const m=masks.find(s=>s.id===id),x=m.points.reduce((n,p)=>n+p[0]/4,0),z=m.points.reduce((n,p)=>n+p[2]/4,0);
  f.camera.position.set(x,m.floor+1.7,z);f.weather.update(.1,1);assert.equal(f.weather.stats.shelter,id);
  f.camera.position.y=m.roofY+.2;f.weather.update(.1,2);assert.notEqual(f.weather.stats.shelter,id);
 }
 assert.equal(f.weather.stats.shelterMaskSlots,4);assert.equal(f.weather.stats.draws,1);f.weather.dispose();shop.dispose();
});

test('street row shelter masks retain the actual gaps between the three emitted bay awnings',()=>{
 const features=JSON.parse(readFileSync(new URL('../geography/features.json',import.meta.url))),terrain=JSON.parse(readFileSync(new URL('../geography/terrain.json',import.meta.url)));
 const root=new THREE.Group(),surfaces=makePathSurfaces(features,(x,z)=>heightAt(terrain,x,z)),frontages=buildKeihanFrontages(root,features,surfaces),masks=zenShelters({keihanFrontages:frontages});root.updateMatrixWorld(true);
 for(const s of frontages.storefronts.filter(s=>s.kind.endsWith('-row'))){
  const a=s.points[s.edge],at=(u,v)=>[a[0]+s.t[0]*u+s.n[0]*v,a[2]+s.t[1]*u+s.n[1]*v],bay=s.width/3;
  if(s.kind==='red-awning-row')for(const boundary of [bay,bay*2])for(const offset of [-.07,0,.07]){
   const [x,z]=at(boundary+offset,.25),hits=new THREE.Raycaster(new THREE.Vector3(x,s.floor+4,z),new THREE.Vector3(0,-1,0),0,2).intersectObject(root,true);
   assert.equal(hits.length,0,'the real cloth roof leaves an open gap between bays');
   assert.equal(shelterAt({x,y:s.floor+1.7,z},masks),null,'a gap cannot grant rain cover');
  }
  for(let i=0;i<3;i++)for(const v of [.06,.25,.38]){
   const [x,z]=at(bay*(i+.5),v),hits=new THREE.Raycaster(new THREE.Vector3(x,s.floor+4,z),new THREE.Vector3(0,-1,0),0,2).intersectObject(root,true);
   assert.ok(hits.length,'bay interior has a real emitted roof');assert.ok(shelterAt({x,y:s.floor+1.7,z},masks));
  }
  assert.equal(masks.filter(m=>m.id.startsWith('shop-awning-'+s.id+'-bay-')).length,3);
 }
});

test('canonical Yotsutsuji public refuge has an actual overhead cover and current shelter metadata',()=>{
 const features=JSON.parse(readFileSync(new URL('../geography/features.json',import.meta.url))),terrain=JSON.parse(readFileSync(new URL('../geography/terrain.json',import.meta.url)));
 const root=new THREE.Group(),colliders=[],material=new THREE.MeshStandardMaterial(),legacy={materials:Object.fromEntries(['vermilionMat','roofMat','plasterMat','stoneMat','entryStoneMat','flagstoneMat','blackNemakiMat'].map(key=>[key,material])),torii:{fresh:material,weathered:material,geometry:new THREE.BoxGeometry(.01,.01,.01),blackGeometry:new THREE.BoxGeometry(.01,.01,.01)}};
 const ground=(x,z)=>x>790&&x<808&&z>-226&&z<-207?yotsuGrade(x,z,heightAt(terrain,x,z)):heightAt(terrain,x,z),surfaces=makePathSurfaces(features,ground);
 buildYotsutsuji(root,legacy,features,ground,colliders,surfaces);root.updateMatrixWorld(true);
 const position=new THREE.Vector3(800.5131902050628,165.94914999999995,-209.91984868909097);
 const hits=new THREE.Raycaster(position,new THREE.Vector3(0,1,0),0,1).intersectObject(root,true);
 assert.ok(hits.some(hit=>hit.point.y>position.y),'the manually reached pose is already under the original emitted tea-house cover');
 const report=buildYotsutsujiContextR95(root,features,legacy.materials),metadata=registeredZenShelters({yotsutsuji:report});
 const f=fixture({assembly:{zenShelters:metadata}});f.weather.setMode('drizzle');f.camera.position.copy(position);f.weather.update(.1,1);
 assert.equal(f.weather.stats.shelter,'yotsutsuji-annex-canopy');assert.equal(f.weather.sheltered,true);assert.equal(f.weather.stats.shelterMaskSlots,4);f.weather.dispose();
});
