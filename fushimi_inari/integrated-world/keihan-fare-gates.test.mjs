import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {installKeihanFareGates} from './keihan-fare-gates.mjs';
import {createRecordedSoundEvents} from './recorded-sound-events.mjs';
const make=()=>installKeihanFareGates({built:true,group:new THREE.Group(),spec:{platformFloor:31,gate:{center:[-302.6,31,-151.4]}}});
test('closed lanes block both walking and ground-level guided travel, then open before crossing',()=>{
 const g=make();assert.deepEqual(g.state.open,[0,0]);
 for(const y of [31,32.7])assert.equal(g.canMove([-302.6,y,-152],[-302.6,y,-151]),false);
 g.update([-302.6,32.7,-153],0);for(let i=1;i<=4;i++)g.update([-302.6,32.7,-153],i*.1);
 assert.equal(g.state.sequence,1);assert.equal(g.state.open[1],1);assert.equal(g.state.open[0],0);
 assert.equal(g.canMove([-302.6,32.7,-152],[-302.6,32.7,-151]),true);
 g.update([-302.6,32.7,-150],.5);assert.equal(g.state.sequence,1);
 for(let i=6;i<11;i++)g.update([-302.6,32.7,-146],i*.1);
 assert.deepEqual(g.state.open,[0,0]);g.update([-302.6,32.7,-150],1.2);assert.equal(g.state.sequence,2);
});
test('pause and unrelated elevation do not open or repeat the tap',()=>{
 const g=make();g.update([-302.6,50,-151],0);g.update([-302.6,32.7,-152],.1,true);assert.equal(g.state.sequence,0);
 g.update([-302.6,32.7,-153.6],.2);g.update([-302.6,32.7,-153.8],.3);g.update([-302.6,32.7,-153.6],.4);assert.equal(g.state.sequence,1);
});
test('Suica emits once on opening, not again when crossing; disabled sound is not replayed',()=>{
 const s=createRecordedSoundEvents(),base={position:[-302.6,32.7,-152],gate:{center:[-302.6,31,-151.4],width:4.5},arrivalPhase:'complete',time:0};
 assert.deepEqual(s.update({...base,gateState:{sequence:0}}),[]);
 assert.deepEqual(s.update({...base,gateState:{sequence:1}}),['gate']);
 assert.deepEqual(s.update({...base,position:[-302.6,32.7,-151],gateState:{sequence:1}}),[]);
 s.update({...base,gateState:{sequence:2},enabled:false});assert.deepEqual(s.update({...base,gateState:{sequence:2}}),[]);s.reset();assert.deepEqual(s.update({...base,gateState:{sequence:2}}),[]);
});

test('High gate fittings share four static batches and preserve the existing readers in Balanced',()=>{
 const station={built:true,group:new THREE.Group(),spec:{platformFloor:31,gate:{center:[-302.6,31,-151.4]}}};
 const originalSpec=JSON.stringify(station.spec),g=installKeihanFareGates(station);
 assert.ok(station.fareGateDetail===g);assert.equal(typeof g.setQuality,'function');
 const readers=g.group.getObjectByName('Keihan original reader plates'),detail=g.group.getObjectByName('Keihan High gate fittings');
 assert.ok(readers);assert.ok(detail);assert.equal(readers.visible,true);assert.equal(detail.visible,false);
 const high=detail.children;assert.equal(high.length,4);assert.ok(g.stats.triangles<=6000);assert.equal(g.stats.draws,0);
 const snapshots=high.map(mesh=>({geometry:mesh.geometry,material:mesh.material,version:mesh.material.version}));
 const maps=new Set(),textures=[];let lights=0;
 detail.traverse(object=>{if(object.isLight)lights++;});assert.equal(lights,0);
 for(const mesh of high){
  assert.equal(mesh.castShadow,false);assert.equal(mesh.material.transparent,false);
  assert.equal(mesh.matrixAutoUpdate,false);
  assert.ok(Array.from(mesh.geometry.attributes.position.array).every(Number.isFinite));
  assert.ok(mesh.geometry.attributes.normal);assert.ok(mesh.geometry.attributes.uv);
  const p=mesh.geometry.attributes.position;
  for(let i=0;i<p.count;i++){
   assert.ok(Math.min(...[-305,-303.4,-301.8].map(x=>Math.abs(p.getX(i)-x)))<.203,'new skins preserve the existing 1.2 m access lanes');
   assert.ok(p.getY(i)>31&&p.getY(i)<32.1);assert.ok(Math.abs(p.getZ(i)+151.45)<.729);
  }
  for(const key of ['map','roughnessMap','bumpMap'])if(mesh.material[key])maps.add(mesh.material[key]);
 }
 assert.equal(maps.size,1);const [map]=maps;assert.equal(map.image.width,128);assert.equal(map.generateMipmaps,true);assert.ok(map.anisotropy>=4);
 const mapVersion=map.version;
 for(const mode of ['high','balanced','ultra','balanced']){
  g.setQuality(mode);const highMode=mode!=='balanced';
  assert.equal(readers.visible,!highMode);assert.equal(detail.visible,highMode);assert.equal(g.stats.draws,highMode?4:0);
  high.forEach((mesh,i)=>{assert.equal(mesh.geometry,snapshots[i].geometry);assert.equal(mesh.material,snapshots[i].material);assert.equal(mesh.material.version,snapshots[i].version);});
  assert.equal(map.version,mapVersion);
 }
 assert.equal(JSON.stringify(station.spec),originalSpec);g.dispose();
});

test('quality changes preserve animated flap identities, timing and collision decisions',()=>{
 const g=make(),flaps=[];g.group.traverse(mesh=>{const p=mesh.geometry?.parameters;if(p?.width===.58&&p.height===.52&&p.depth===.055)flaps.push(mesh);});
 assert.equal(flaps.length,4);const pivots=flaps.map(mesh=>mesh.parent),geometry=flaps.map(mesh=>mesh.geometry);
 g.update([-302.6,32.7,-153],0);for(let i=1;i<=4;i++)g.update([-302.6,32.7,-153],i*.1);
 const state=JSON.stringify(g.state),rotations=pivots.map(p=>p.rotation.y);
 for(const mode of ['high','balanced','high']){
  g.setQuality(mode);assert.equal(JSON.stringify(g.state),state);assert.equal(g.canMove([-302.6,32.7,-152],[-302.6,32.7,-151]),true);
  flaps.forEach((mesh,i)=>{assert.equal(mesh.parent,pivots[i]);assert.equal(mesh.geometry,geometry[i]);assert.equal(pivots[i].rotation.y,rotations[i]);});
 }
 for(let i=5;i<10;i++)g.update([-302.6,32.7,-146],i*.1);
 assert.deepEqual(g.state.open,[0,0]);assert.equal(g.canMove([-302.6,32.7,-152],[-302.6,32.7,-151]),false);g.dispose();
});

test('High detail ownership disposes once and an installed gate is reused',()=>{
 const station={built:true,group:new THREE.Group(),spec:{platformFloor:31,gate:{center:[-302.6,31,-151.4]}}},g=installKeihanFareGates(station);
 assert.ok(installKeihanFareGates(station)===g);
 const detail=g.group.getObjectByName('Keihan High gate fittings'),materials=new Set(),maps=new Set();let geometries=0,disposedMaterials=0,disposedMaps=0;
 for(const mesh of detail.children){mesh.geometry.addEventListener('dispose',()=>geometries++);materials.add(mesh.material);if(mesh.material.roughnessMap)maps.add(mesh.material.roughnessMap);}
 for(const material of materials)material.addEventListener('dispose',()=>disposedMaterials++);for(const map of maps)map.addEventListener('dispose',()=>disposedMaps++);
 g.setQuality('high');g.dispose();g.dispose();g.setQuality('high');g.update([-302.6,32.7,-151],1);
 assert.equal(g.group.parent,null);assert.equal(station.fareGateDetail,undefined);assert.deepEqual([geometries,disposedMaterials,disposedMaps],[4,4,1]);
});
