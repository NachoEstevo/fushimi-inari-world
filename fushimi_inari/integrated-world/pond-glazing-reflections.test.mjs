import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three/webgpu';
import {createPondGlazingReflections} from './pond-glazing-reflections.mjs';
import {installShinikeReflections} from './webgpu-shinike-reflections.mjs';

test('Takeya glazing borrows the existing probe and restores ownership before a capture is disposed',async()=>{
 const scene=new THREE.Scene(),shop=new THREE.Group();shop.name='Takeya mapped timber and open frontage R89';scene.add(shop);
 const material=new THREE.MeshStandardMaterial({envMapIntensity:.3});material.userData.architecturalGlazing=true;
 const glass=new THREE.Mesh(new THREE.PlaneGeometry(),material);shop.add(glass);
 const unrelated=new THREE.Mesh(new THREE.PlaneGeometry(),new THREE.MeshStandardMaterial());scene.add(unrelated);
 const glazing=createPondGlazingReflections(scene),water=new THREE.Mesh(new THREE.PlaneGeometry(),new THREE.MeshStandardMaterial());
 water.material.userData.waterAppearance={kind:'shinike'};scene.add(water);
 let captures=0,disposed=0;
 const maps=[];const probe=installShinikeReflections({scene,renderer:{},water,onEnvironment:glazing.setEnvironment},()=>{
  const texture=new THREE.CubeTexture();texture.isPMREMTexture=true;maps.push(texture);captures++;
  return {texture,dispose(){disposed++;assert.notEqual(material.envMap,texture,'consumer must stop referencing a retired capture');}};
 });
 const version=material.version;
 const result=await probe.prepare({settle:async()=>{}});
 assert.equal(result.prepared,true);assert.equal(captures,2);assert.equal(disposed,1);
 assert.equal(material.envMap,maps[1]);assert.equal(material.version,version+1,'equivalent r187 PMREM swaps keep one graph');
 assert.equal(unrelated.material.envMap,null);assert.deepEqual(glazing.meshes,[glass]);
 assert.equal(glazing.stats.materials,1);assert.equal(glazing.stats.extraCaptures,0);
 probe.dispose();assert.equal(material.envMap,null);assert.equal(material.envMapIntensity,.3);assert.equal(disposed,2);
 glazing.dispose();glazing.dispose();
 for(const mesh of [glass,water,unrelated]){mesh.geometry.dispose();mesh.material.dispose();}
});

test('no registered local glazing has no effect, and binding errors do not discard successful pond captures',async()=>{
 const scene=new THREE.Scene(),glazing=createPondGlazingReflections(scene);assert.equal(glazing.meshes.length,0);
 const water=new THREE.Mesh(new THREE.PlaneGeometry(),new THREE.MeshStandardMaterial());water.material.userData.waterAppearance={kind:'shinike'};
 const probe=installShinikeReflections({scene,renderer:{},water,onEnvironment(){throw Error('receiver failed');}},()=>({texture:new THREE.CubeTexture(),dispose(){}}));
 assert.equal((await probe.prepare({settle:async()=>{}})).prepared,true);
 assert.equal(probe.stats.captures,2);assert.match(probe.stats.receiverError,/receiver failed/);
 probe.dispose();glazing.dispose();water.geometry.dispose();water.material.dispose();
});
